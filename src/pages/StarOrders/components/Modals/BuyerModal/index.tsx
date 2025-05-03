//@ts-nocheck

import { useOrdersStore } from "@stores/orders.store";
import styles from "@pages/Orders/Orders.module.scss";
import Modal from "@components/Modal";
import { FC, useEffect, useState } from "react";
import { IStar } from "@types";
import cn from "classnames";
import axios from "axios";
import { t } from "i18next";

interface Props {
  selectedItem?: IStar;
  getCardInfo: (id?: number) => void;
  fetchOrders: (orderType: string) => void;
}

const authToken = localStorage.getItem("token");

const BuyerModal: FC<Props> = ({ selectedItem, getCardInfo, fetchOrders }) => {
  const isVisible = useOrdersStore((state) => state.isModalOpen);
  const setIsVisible = useOrdersStore((state) => state.setIsModalOpen);
  const watingStatus = selectedItem?.status === "buy";
  const sellerAcceptStatus = selectedItem?.status === "seller_accept";
  const completedStatus = selectedItem?.status === "gift_received";
  const giftSentStatus = selectedItem?.status === "gift_transferred";

  const [remainingTime, setRemainingTime] = useState<number>(0);

  const statusLabels: Record<string, { label: string; icon: string }> = {
    buy: { label: t("buyerModal.waitingSeller"), icon: "/photos/orders/pending.svg" },
    gift_transferred: { label: t("buyerModal.giftSent"), icon: "/photos/orders/sent.svg" },
    seller_accept: { label: t("buyerModal.waitingSeller"), icon: "/photos/orders/pending.svg" },
    gift_received: { label: t("buyerModal.completed"), icon: "/photos/orders/completed.svg" },
  };

  useEffect(() => {
    if (!sellerAcceptStatus || !selectedItem?.created_order_date) return;

    const createdDateUTC = new Date(selectedItem?.created_order_date);
    const createdDateLocal = new Date(createdDateUTC.getTime() - createdDateUTC.getTimezoneOffset() * 60000);
    const expireTime = createdDateLocal.getTime() + 20 * 60 * 1000;
    const now = Date.now();
    const initialRemainingTime = Math.max(Math.floor((expireTime - now) / 1000), 0);

    if (initialRemainingTime === 0) {
      handleTimerEnds(selectedItem?.id);
      return;
    }

    setRemainingTime(initialRemainingTime);

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev === null || prev <= 1) {
          handleTimerEnds(selectedItem?.id);
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

  const renderStatus = (status?: string) => {
    const statusInfo = status && statusLabels[status];
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
      const response = await axios.post("https://storeapi.nestdex.dev/star/cancel", { id }, { headers: { Authorization: authToken } });
      if (response.data.success) {
        setIsVisible(false);
        fetchOrders("All orders");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTimerEnds = async (id: number) => {
    try {
      const response = await axios.post("https://storeapi.nestdex.dev/star/order/seller-cancel", { id }, { headers: { Authorization: authToken } });
      if (response.data.success) {
        setIsVisible(false);
        fetchOrders("All orders");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirm = async (id: number) => {
    try {
      const response = await axios.post("https://storeapi.nestdex.dev/star/accept-receipt", { id }, { headers: { Authorization: authToken } });
      if (response.data.success) {
        getCardInfo(selectedItem?.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal paddingTop={24} headline={`${t("buyerModal.order")}${selectedItem?.id}`} isVisible={isVisible} setIsVisible={setIsVisible}>
      <dl className={styles.list}>
        <div className={styles.listContent}>
          <dt className={styles.title}>{t("buyerModal.status")}</dt>
          {renderStatus(selectedItem?.status)}
        </div>
        {selectedItem?.status === "buy" && <div className={styles.orderMessage}>{t("buyerModal.orderMessageBuy")}</div>}
        {selectedItem?.status === "gift_transferred" && <div className={styles.orderMessage}>{t("buyerModal.orderMessageStars")}</div>}

        <div className={styles.listContent}>
          <dt className={styles.title}>{t("buyerModal.price")}</dt>
          <dd className={styles.description}>
            <img width={18} height={18} src="/photos/ton.svg" alt="Toncoin" />
            <span>{selectedItem?.price}</span>
          </dd>
        </div>
        <div className={styles.listContent}>
          <dt className={styles.title}>{t("sellerModal.amount")}</dt>
          <dd className={styles.description}>
            <span>{selectedItem?.amount}</span>
          </dd>
        </div>
        {sellerAcceptStatus && (
          <div className={styles.listContent}>
            <dt className={styles.title}>{t("buyerModal.remainingTime")}</dt>
            <dd className={styles.description}>
              <span>{remainingTime !== null ? formatTime(remainingTime) : "00:00"}</span>
            </dd>
          </div>
        )}
      </dl>
      {!watingStatus && (
        <div className={styles.list}>
          <a href="https://t.me/nesupport_robot" className={cn(styles.listContent, styles.needHelp)}>
            <span className={styles.title}>{t("buyerModal.needHelp")}</span>
          </a>
        </div>
      )}
      {!completedStatus && (
        <div className={styles.buttons}>
          {watingStatus && (
            <button className={styles.button} onClick={() => handleCancel(selectedItem?.id)}>
              {t("buyerModal.cancelOrder")}
            </button>
          )}
          {giftSentStatus && (
            <button className={cn(styles.button, styles.main)} onClick={() => handleConfirm(selectedItem?.id)}>
              <span>{t("buyerModal.confirmReceipt")}</span>
              <img width={12} height={12} src="/photos/orders/arrow.svg" alt="" />
            </button>
          )}
        </div>
      )}
    </Modal>
  );
};

export default BuyerModal;
