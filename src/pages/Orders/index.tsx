//@ts-nocheck

import { FC, useEffect, useState } from "react";
import styles from "./Orders.module.scss";
import cn from "classnames";
import { useOrdersStore } from "@stores/orders.store";
import BuyerModal from "./components/Modals/BuyerModal";
import axios from "axios";
import { formatDate } from "@utils/formatDate";
import { useUserProfile } from "@contexts/user-profile";
import SellerModal from "./components/Modals/SellerModal";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { t } from "i18next";
import { IOrder } from "@types";
import { showToast } from "@utils/showToast";
import { useLocation, useNavigate } from "react-router-dom";
import UseTelegram from "@hooks/useTelegram";

const filters = ["All orders", "Buy", "Sell", "Closed"];

const authToken = localStorage.getItem("token");

const Orders: FC = () => {
  document.body.classList.remove("no-padding");
  
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const { webApp } = UseTelegram();

  const getOrderIdFromUrl = () => {
    for (const [key] of queryParams.entries()) {
      if (key.startsWith("order_")) {
        return key.split("_")[1];
      }
    }
    return null;
  };

  const statusLabelsSeller: Record<string, { label: string; icon: string }> = {
    buy: { label: t("sellerModal.acceptOrder"), icon: "/photos/orders/pending.svg" },
    gift_transferred: { label: t("sellerModal.waitingBuyer"), icon: "/photos/orders/sent.svg" },
    seller_accept: { label: t("sellerModal.confirmShipment"), icon: "/photos/orders/pending.svg" },
    gift_received: { label: t("sellerModal.completed"), icon: "/photos/orders/completed.svg" },
  };

  const statusLabelsBuyer: Record<string, { label: string; icon: string }> = {
    buy: { label: t("buyerModal.waitingSeller"), icon: "/photos/orders/pending.svg" },
    gift_transferred: { label: t("buyerModal.giftSent"), icon: "/photos/orders/sent.svg" },
    seller_accept: { label: t("buyerModal.waitingSeller"), icon: "/photos/orders/pending.svg" },
    gift_received: { label: t("sellerModal.completed"), icon: "/photos/orders/completed.svg" },
  };

  const getOrderIdFromStartParam = () => {
    const startParam = webApp.initDataUnsafe.start_param;
    if (startParam && startParam.startsWith("order_")) {
      return startParam.split("_")[1];
    }
    return null;
  };

  const orderIdFromQuery = getOrderIdFromUrl();
  const orderIdFromStartParam = getOrderIdFromStartParam();

  const [filter, setFilter] = useState("All orders");
  const setIsVisible = useOrdersStore((state) => state.setIsModalOpen);
  const [selectedItem, setSelectedItem] = useState<IOrder>();
  const [orders, setOrders] = useState([]);
  const { userProfile } = useUserProfile();

  const getOrder = async (id?: number) => {
    try {
      const response = await axios.get(`https://storeapi.nestdex.dev/market/order/${id}`, {
        headers: { Authorization: authToken },
      });
      setSelectedItem(response.data);
      setIsVisible(true);
    } catch (e) {
      console.error(e);
      showToast(t("orders.errors.notFound"), "error");
    }
  };

  useEffect(() => {
    const orderId = orderIdFromQuery || orderIdFromStartParam;
    if (orderId) {
      getOrder(Number(orderId));
    }
  }, [orderIdFromQuery, orderIdFromStartParam]);

  const handleCloseModal = () => {
    setIsVisible(false);
    navigate(location.pathname, { replace: true });
  };

  const handleOrderClick = async (id: number) => {
    setIsVisible(true);
    getOrder(id);
  };

  const fetchOrders = async (orderType: string) => {
    try {
      const filterMap: Record<string, string> = {
        "All orders": "all",
        Buy: "buy",
        Sell: "sell",
        Closed: "closed",
      };
      const response = await axios.get("https://storeapi.nestdex.dev/market/order/all", {
        headers: { Authorization: authToken },
        params: { order_type: filterMap[orderType] },
      });
      setOrders(response.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOrders(filter);
  }, [filter]);

  const getOrderType = (sellerId: number, userId?: number) => {
    return sellerId === userId ? "Sell" : "Buy";
  };

  const renderStatus = (status: string, sellerId: number, userId?: number) => {
    const isSeller = sellerId === userId;
    const statusLabels = isSeller ? statusLabelsSeller : statusLabelsBuyer;

    const statusInfo = statusLabels[status];
    if (!statusInfo) return null;

    return (
      <div className={styles.badge}>
        <img height={15} width={15} src={statusInfo.icon} alt={statusInfo.label} />
        <span>{statusInfo.label}</span>
      </div>
    );
  };

  return (
    <section className={styles.main}>
      {getOrderType(selectedItem?.seller_id, userProfile?.id) === "Buy" ? (
        <BuyerModal selectedItem={selectedItem} getCardInfo={getOrder} fetchOrders={fetchOrders} onClose={handleCloseModal} />
      ) : (
        <SellerModal selectedItem={selectedItem} getCardInfo={getOrder} fetchOrders={fetchOrders} onClose={handleCloseModal} />
      )}
      <div className={styles.header}>
        <h1 className={styles.headline}>{t("orders.title")}</h1>
        <div className={styles.filter}>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(styles.filterButton, {
                [styles.active]: f === filter,
              })}
            >
              {t(`orders.filter.${f.toLowerCase().replace(" ", "")}` as const)}
            </button>
          ))}
        </div>
      </div>
      {orders.length === 0 ? (
        <div className={styles.empty}>
          <img width={38} height={35} src="/photos/nestEmpty.svg" alt="" />
          <p className={styles.emptyDescription}>{t("orders.empty")}</p>
        </div>
      ) : (
        <div className={styles.items}>
          {[...orders].reverse().map(({ number, type, price, created_at, status, id, seller_id, image_url }) => {
            return (
              <div onClick={() => handleOrderClick(id)} key={id} className={styles.item}>
                <div className={styles.info}>
                  <div className={cn(styles.badge, styles[getOrderType(seller_id, userProfile?.id)])}>
                    <img height={15} width={15} src={`/photos/orders/${getOrderType(seller_id, userProfile?.id)}.svg`} alt="" />
                    <span>{t(`orders.filter.${getOrderType(seller_id, userProfile?.id).toLowerCase()}`)}</span>
                  </div>
                  {renderStatus(status)}
                  <div className={styles.badge}>#{number}</div>
                </div>
                <dl className={styles.list}>
                  <button className={styles.listContent}>
                    <dt className={styles.title}>{t("orders.purchase")}</dt>
                    <dd className={styles.description}>
                      <DotLottieReact src={image_url} style={{ width: "24px", height: "24px" }} />
                      <span>{type}</span>
                    </dd>
                  </button>
                  <div className={styles.listContent}>
                    <dt className={styles.title}>{t("orders.price")}</dt>
                    <dd className={styles.description}>
                      <img height={24} width={24} src={"/photos/ton.svg"} alt="" />
                      <span>{price}</span>
                    </dd>
                  </div>
                  <div className={styles.listContent}>
                    <dt className={styles.title}>{t("orders.createdOrder")}</dt>
                    <dd className={styles.description}>
                      <span>{formatDate(created_at)}</span>
                    </dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default Orders;
