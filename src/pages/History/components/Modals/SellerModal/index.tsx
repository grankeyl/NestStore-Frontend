//@ts-nocheck

import { useOrdersStore } from "@stores/orders.store";
import styles from "@pages/Orders/Orders.module.scss";
import Modal from "@components/Modal";
import { FC, useEffect, useState } from "react";
import { IGift, GiftType, IOrder } from "@types";
import cn from "classnames";
import axios from "axios";
import { copyToClipboard } from "@utils/copyToClipboard";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import WarningModal from "../WarningModal";
import { t } from "i18next";

interface Props {
  selectedItem?: IOrder | IGift;
  getCardInfo: (id?: number) => void;
  fetchOrders: (orderType: string) => void;
}

const authToken = localStorage.getItem("token");

const SellerModal: FC<Props> = ({ selectedItem, getCardInfo, fetchOrders }) => {
  const isVisible = useOrdersStore((state) => state.isModalOpen);
  const setIsVisible = useOrdersStore((state) => state.setIsModalOpen);
  const watingStatus = selectedItem?.status === "buy";
  const sellerAcceptStatus = selectedItem?.status === "seller_accept";
  const completedStatus = selectedItem?.status === "gift_received";
  const [isWarningModalVisible, setIsWarningModalVisible] = useState<boolean>(false);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  useEffect(() => {
    if (!sellerAcceptStatus || !selectedItem?.created_order_date) return;

    const createdDateUTC = new Date(selectedItem?.created_order_date);
    const createdDateLocal = new Date(createdDateUTC.getTime() - createdDateUTC.getTimezoneOffset() * 60000);
    const expireTime = createdDateLocal.getTime() + 20 * 60 * 1000;
    const now = Date.now();
    const initialRemainingTime = Math.max(Math.floor((expireTime - now) / 1000), 0);

    if (initialRemainingTime === 0) {
      handleCancel(selectedItem?.id);
      return;
    }

    setRemainingTime(initialRemainingTime);

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev === null || prev <= 1) {
          handleCancel(selectedItem?.id);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sellerAcceptStatus, selectedItem?.created_order_date]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const sellerStatusLabels: Record<string, { label: string; icon: string }> = {
    buy: { label: t("sellerModal.confirmAccept"), icon: "/photos/orders/pending.svg" },
    gift_transferred: { label: t("sellerModal.waitingBuyer"), icon: "/photos/orders/sent.svg" },
    seller_accept: { label: t("sellerModal.confirmShipment"), icon: "/photos/orders/pending.svg" },
    gift_received: { label: t("sellerModal.completed"), icon: "/photos/orders/completed.svg" },
  };

  const renderStatus = (status?: string) => {
    const statusInfo = status && sellerStatusLabels[status];
    if (!statusInfo) return null;

    return (
      <dd className={styles.description}>
        <img height={15} width={15} src={statusInfo.icon} alt={statusInfo.label} />
        <span>{statusInfo.label}</span>
      </dd>
    );
  };

  const handleCancel = async (id: number) => {
    try {
      const response = await axios.post("https://apistore.nestdex.dev/market/order/seller-cancel", { id }, { headers: { Authorization: authToken } });
      if (response.data.success) {
        setIsVisible(false);
        fetchOrders("All orders");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcceptOrder = async (id: number) => {
    try {
      const response = await axios.post("https://apistore.nestdex.dev/market/order/seller-accept", { id }, { headers: { Authorization: authToken } });
      if (response.data.success) {
        setIsWarningModalVisible(true);
        getCardInfo(selectedItem?.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirm = async (id: number) => {
    try {
      const response = await axios.post("https://apistore.nestdex.dev/market/order/confirm-transfer", { id }, { headers: { Authorization: authToken } });
      if (response.data.success) {
        getCardInfo(selectedItem?.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <WarningModal
        isVisible={isWarningModalVisible}
        setIsVisible={setIsWarningModalVisible}
        selectedItem={
          selectedItem
            ? selectedItem
            : {
                number: 0,
                status: "buy",
                type: "",
                image_url: "",
                price: 0,
                background: 0,
                id: 0,
                buyer_name: "",
                completed_order_date: "",
                created_order_date: "",
                model: 0,
                pattern: 0,
                rarity: "common",
                seller_id: 0,
                seller_name: "",
                is_vip: false,
              }
        }
      />
      <Modal paddingTop={24} headline={`${t("sellerModal.order")}${selectedItem?.number}`} isVisible={isVisible} setIsVisible={setIsVisible}>
        <dl className={styles.list}>
          <div className={styles.listContent}>
            <dt className={styles.title}>{t("sellerModal.status")}</dt>
            {renderStatus(selectedItem?.status)}
          </div>
          {selectedItem?.status === "buy" && <div className={styles.orderMessage}>{t("sellerModal.orderMessageBuy")}</div>}
          {selectedItem?.status === "seller_accept" && <div className={styles.orderMessage}>{t("sellerModal.orderMessageGift")}</div>}
          {selectedItem?.status === "gift_transferred" && <div className={styles.orderMessage}>{t("sellerModal.orderMessageWaiting")}</div>}
          <div className={styles.listContent}>
            <dt className={styles.title}>{t("sellerModal.purchase")}</dt>
            <dd className={styles.description}>
              <DotLottieReact style={{ width: "20px", height: "20px" }} height={18} width={18} src={selectedItem?.image_url} />
              <span>{selectedItem?.type}</span>
            </dd>
          </div>
          <div className={styles.listContent}>
            <dt className={styles.title}>{t("sellerModal.price")}</dt>
            <dd className={styles.description}>
              <img width={18} height={18} src="/photos/ton.svg" alt="Toncoin" />
              <span>{selectedItem?.price}</span>
            </dd>
          </div>
          {sellerAcceptStatus && (
            <div className={styles.listContent}>
              <dt className={styles.title}>{t("sellerModal.remainingTime")}</dt>
              <dd className={styles.description}>
                <span>{remainingTime !== null ? formatTime(remainingTime) : "00:00"}</span>
              </dd>
            </div>
          )}
        </dl>
        <label htmlFor="Gift Characteristics" className={styles.label}>
          <span>{t("sellerModal.giftCharacteristics")}</span>
        </label>
        <dl className={styles.list}>
          <div className={styles.listContent}>
            <dt className={styles.title}>{t("sellerModal.model")}</dt>
            <dd className={styles.description}>
              <span className={cn(styles.badge, styles.Secondary)}>{selectedItem?.model}%</span>
            </dd>
          </div>
          <div className={styles.listContent}>
            <dt className={styles.title}>{t("sellerModal.pattern")}</dt>
            <dd className={styles.description}>
              <span className={cn(styles.badge, styles.Secondary)}>{selectedItem?.pattern}%</span>
            </dd>
          </div>
          <div className={styles.listContent}>
            <dt className={styles.title}>{t("sellerModal.background")}</dt>
            <dd className={styles.description}>
              <span className={cn(styles.badge, styles.Secondary)}>{selectedItem?.background}%</span>
            </dd>
          </div>
        </dl>
        <label htmlFor="Buyer" className={styles.label}>
          <span>{t("sellerModal.buyer")}</span>
        </label>
        <dl className={styles.list}>
          <div className={styles.listContent}>
            <dt className={styles.title}>@{selectedItem?.buyer_name}</dt>
            <dd className={styles.description} onClick={() => copyToClipboard(`@${selectedItem?.buyer_name}`, t("copyToClipboard.copied"))}>
              <img className={styles.copyIcon} width={24} height={24} src="/photos/copy-name-icon.svg" alt="Buyer" />
            </dd>
          </div>
        </dl>
        {!watingStatus && !sellerAcceptStatus && (
          <div className={styles.list}>
            <a href="https://t.me/nesupport_robot" className={cn(styles.listContent, styles.needHelp)}>
              <span className={styles.title}>{t("sellerModal.needHelp")}</span>
            </a>
          </div>
        )}
        {!completedStatus && (
          <div className={styles.sellerButtons}>
            {watingStatus && (
              <div className={styles.warningButtons}>
                <button className={styles.button} onClick={() => handleCancel(selectedItem?.id)}>
                  {t("sellerModal.cancel")}
                </button>

                <button className={cn(styles.button, styles.main)} onClick={() => handleAcceptOrder(selectedItem?.id)}>
                  <span>{t("sellerModal.acceptOrder")}</span>
                </button>
              </div>
            )}
            {sellerAcceptStatus && (
              <button className={cn(styles.button, styles.main)} onClick={() => handleConfirm(selectedItem?.id)}>
                <span>{t("sellerModal.giftSent")}</span>
              </button>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default SellerModal;
