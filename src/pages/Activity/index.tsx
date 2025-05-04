// @ts-nocheck

import { FC, useEffect, useRef, useState } from "react";
import styles from "./Activity.module.scss";
import cn from "classnames";
import { useOrdersStore } from "@stores/orders.store";
import axios from "axios";
import { formatDate } from "@utils/formatDate";
import { useUserProfile } from "@contexts/user-profile";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { t } from "i18next";
import { GiftType, IOrder } from "@types";
import { showToast } from "@utils/showToast";
import { useLocation, useNavigate } from "react-router-dom";
import UseTelegram from "@hooks/useTelegram";
import { Link } from "react-router-dom";
import { getModelLottie } from "@utils/nftUtils";
import { validatePrice } from "@utils/formatBalance";
import { useUserActivityObserver } from "./hooks/useUserActivityObserver";

const filters = ["All orders", "Buy", "Sell", "Closed"];

const authToken = localStorage.getItem("token");


const ActivityBuyGift: FC<{ item: any }> = ({ item }) => {
  return (
    <div className={styles.activityItemsItem}>
      <div className={styles.activityItemsItemLeft}>
        <DotLottieReact src={getModelLottie(item.gift, item.model_name)} className={styles.activityItemsItemLeftLottie}></DotLottieReact>
      </div>
      <div className={styles.activityItemsItemContext}>
        <div className={styles.activityItemsItemContextTitle}>
          <h4>{item.gift}</h4>
          <span>#{item.gift_number}</span>
        </div>
        <div className={styles.activityItemsItemContextDescr}>
          <p>{formatDate(item.created_at)}</p>
        </div>
      </div>
      <div className={styles.activityItemsItemRight}>
        <div className={styles.activityItemsItemRightAmount}>
          <h4>{validatePrice(item.price)}</h4>
          <img width={18} height={18} src="/photos/ton.svg" alt="" />
        </div>
        <div className={styles.activityItemsItemRightStatus}>
          {(item.type === 'buy_gift' || item.type === 'sell_gift' || item.type === 'final_bid_gift') && (
            <span className={styles.activityItemsItemRightStatusSale}>
              {t("activity.item.status.sale")}
            </span>
          )}
          {(item.type === 'bid_gift') && (
            <span className={styles.activityItemsItemRightStatusBid}>
              {t("activity.item.status.bid")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const Activity: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const { webApp } = UseTelegram();

  const [filter, setFilter] = useState("All");
  const setIsVisible = useOrdersStore((state) => state.setIsModalOpen);
  const [selectedItem, setSelectedItem] = useState<IOrder>();
  const [activity, setActivity] = useState([]);
  const { userProfile } = useUserProfile();

  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  let lastItemRef = useRef<HTMLDivElement | null>(null);

  const [intervalGetActivity, setIntervalGetActivity] = useState<NodeJS.Timer | null>(null);

  useEffect(() => {
    if (location.pathname === "/activity") {
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
    sell_gift: {
      className: styles.historyItemsItemRightGreen,
      sign: "+"
    },
    bid_gift: {
      image: "/photos/history/bid.svg",
      className: styles.historyItemsItemRightGreen,
      sign: "+"
    },
    final_bid_gift: {
      image: "/photos/history/bid.svg",
      className: styles.historyItemsItemRightGreen,
      sign: "+"
    }
  };

  const getActivity = async (newOffset: number = 0) => {
    try {
      const response = await axios.get("https://storeapi.nestdex.dev/historyactivity", {
        headers: { Authorization: authToken },
        params: {
          offset: newOffset,
          limit: 20
        },
      });
      const activity = response.data;
      if (activity.length === 0) {
        setHasMore(false);
        return;
      }

      setActivity((prevActivity) => {
        const updatedActivity = newOffset === 0 ? activity : [...prevActivity, ...updatedActivity];
        return updatedActivity
          .filter((gift: any, index: number, self: any) => self.findIndex((g: any) => g.id === gift.id) === index)
          .sort((a: any, b: any) => b.id - a.id);
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    getActivity();
  }, [filter]);

  useEffect(() => {
    if (intervalGetActivity) {
      clearInterval(intervalGetActivity);
    }
  
    const activityInterval = setInterval(() => {
      getActivity();
    }, 3000);
  
    setIntervalGetActivity(activityInterval);
  
    return () => {
      clearInterval(activityInterval);
    };
  }, []);

  useUserActivityObserver(activity, lastItemRef, isLoading, getActivity, hasMore);

  return (
    <section className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.headline}>{t("activity.title")}</h1>
        {/* <Link to="filters" className={styles.filters}>
          <img width={20} height={16} src="/photos/store/filter.svg" alt="" />
          <span>{t("store.filters")}</span>
        </Link> */}
      </div>
      
      {activity.length === 0 ? (
        <div className={styles.empty}>
          <img width={38} height={35} src="/photos/nestEmpty.svg" alt="" />
          <p className={styles.emptyDescription}>{t("orders.empty.null")}</p>
        </div>
      ) : (
        <div className={styles.activityItems}>
          {activity
            .filter((item: any) => typeMapping[item.type])
            .map((item: any, index: number) => (
              <ActivityBuyGift 
              ref={activity.length === index + 1 ? lastItemRef : null} 
              key={index} item={item} />
            ))}
        </div>
      )}
    </section>
  );
};

export default Activity;
