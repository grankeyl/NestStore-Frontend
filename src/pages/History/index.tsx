//@ts-nocheck

import { FC, useEffect, useState } from "react";
import styles from "./History.module.scss";
import cn from "classnames";
import { useOrdersStore } from "@stores/orders.store";
import BuyerModal from "./components/Modals/BuyerModal";
import axios from "axios";
import { convertToMSK, formatDate } from "@utils/formatDate";
import { useUserProfile } from "@contexts/user-profile";
import SellerModal from "./components/Modals/SellerModal";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { t } from "i18next";
import { GiftType, IOrder } from "@types";
import { showToast } from "@utils/showToast";
import { useLocation, useNavigate } from "react-router-dom";
import UseTelegram from "@hooks/useTelegram";
import { getModelLottie } from "@utils/nftUtils";
import i18n from "@i18n";
import { validatePrice } from "@utils/formatBalance";

const filters = ["All orders", "Buy", "Sell", "Closed"];

const authToken = localStorage.getItem("token");

const History: FC = () => {
  document.body.classList.remove("no-padding");
  
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const { webApp } = UseTelegram();

  const [filter, setFilter] = useState("All orders");
  const setIsVisible = useOrdersStore((state) => state.setIsModalOpen);
  const [selectedItem, setSelectedItem] = useState<IOrder>();
  const [history, setHistory] = useState([]);
  const { userProfile } = useUserProfile();

  useEffect(() => {
    if (location.pathname === "/history") {
      webApp.BackButton.show();
      webApp.BackButton.onClick(() => {
        navigate("/profile");
      });
    } else {
      webApp.BackButton.hide();
    }

    return () => {
      webApp.BackButton.hide();
    };
  }, [location.pathname, webApp, navigate]);

  const typeMapping: Record<string, { className: string; sign: string }> = {
    buy_gift: { 
      className: styles.historyItemsItemRightRed, 
      sign: "-"
    },
    sell_gift: {
      className: styles.historyItemsItemRightGreen,
      sign: "+"
    },
    withdraw: {
      image: "/photos/history/withdraw.svg",
      className: styles.historyItemsItemRightRed,
      sign: "-"
    },
    deposit: { 
      image: "/photos/history/deposit.svg",
      className: styles.historyItemsItemRightGreen,
      sign: "+"
    },
    buy_stars: {
      image: "/photos/history/buystars.svg",
      className: styles.historyItemsItemRightRed,
      sign: "-"
    },
    sell_stars: { 
      image: "/photos/history/buystars.svg",
      className: styles.historyItemsItemRightGreen,
      sign: "+"
    },
    final_bid_gift: { 
      className: styles.historyItemsItemRightGreen,
      sign: "+"
    },
  };

  const getHistory = async (newOffset: number = 0) => {
    try {
      const response = await axios.get("https://storeapi.nestdex.dev/history", {
        headers: { Authorization: authToken }
      });

      const history = response.data
      setHistory(history);
    } catch (e) {
      console.error(e);
    } finally {}
  };

  useEffect(() => {
    getHistory();
  }, [filter]);

  const groupByDate = (history) => {
    return history
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .reduce((acc, item) => {
        const date = new Date(item.created_at).toLocaleDateString(
          i18n.language === "ru" ? "ru-RU" : "en-US",
          { day: "2-digit", month: "long", year: "numeric" }
        );
  
        if (!acc[date]) acc[date] = [];
        acc[date].push(item);
        return acc;
      }, {});
  };
  
  const groupedHistory = groupByDate([...history].reverse());
  const sortedDates = Object.keys(groupedHistory).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <section className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.headline}>{t("history.title")}</h1>
      </div>
      {history.length === 0 ? (
        <div className={styles.empty}>
          <img width={38} height={35} src="/photos/nestEmpty.svg" alt="" />
          <p className={styles.emptyDescription}>{t("orders.empty")}</p>
        </div>
      ) : (
        <div className={styles.items}>
          {sortedDates.map((date) => (
            <div key={date}>
              <div className={styles.historyLabel}>
                <h4>{date}</h4>
              </div>
              {groupedHistory[date].map((item) => {
                if (!typeMapping[item.type]) return null;
                return (
                  <div key={item.id} className={styles.history}>
                    <div className={styles.historyItems}>
                      <div className={styles.historyItemsItem}>
                        <div className={styles.historyItemsItemImage}>
                          {item.gift ? (
                            <DotLottieReact
                              className={styles.historyItemsItemImageDot}
                              style={{ maxWidth: "92px", maxHeight: "92px" }}
                              src={getModelLottie(item.gift, item.model_name)}
                              autoplay
                            />
                          ) : (
                            <img width={40} height={40} src={typeMapping[item.type]?.image} alt="" />
                          )}
                        </div>
                        <div className={styles.historyItemsItemContext}>
                          <div className={styles.historyItemsItemContextTitle}>
                            <h4>{t(`history.type.${item.type}`)} {item.gift || ""}</h4>
                            {item.type === "buy_gift" && (<span>#{item.gift_number || 999}</span>)}
                            {item.type === "sell_gift" && (<span>#{item.gift_number || 999}</span>)}
                          </div>
                          <div className={styles.historyItemsItemContextDescr}>
                            <p>{convertToMSK(item.created_at) ?? ""}</p>
                          </div>
                        </div>
                        <div className={styles.historyItemsItemRight}>
                          <span className={typeMapping[item.type]?.className}>
                            {typeMapping[item.type]?.sign}
                            {validatePrice(item.price)}
                          </span>
                          <img width={18} height={18} src="/photos/ton.svg" alt="" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default History;
