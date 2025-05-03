// @ts-nocheck

import { FC, useEffect, useState } from "react";
import styles from "./Cart.module.scss";
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
import { useCartStore } from "@stores/cart.store";
import UseTelegram from "@hooks/useTelegram";
import { Link } from "react-router-dom";
import { getModelLottie, getNftBackground, getNftLottie } from "@utils/nftUtils";
import { Q } from "node_modules/react-router/dist/development/fog-of-war-BhhVTjSZ.d.mts";
import Modal from "@components/Modal";
import { validatePrice } from "@utils/formatBalance";

const filters = ["All orders", "Buy", "Sell", "Closed"];

const authToken = localStorage.getItem("token");

const Cart: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const { webApp } = UseTelegram();

  const [filter, setFilter] = useState("All orders");
  const setIsVisible = useOrdersStore((state) => state.setIsModalOpen);
  const [selectedItem, setSelectedItem] = useState<IOrder>();
  const [history, setHistory] = useState([]);
  const { userProfile } = useUserProfile();

  const { cartGifts, setCartGifts } = useCartStore();
  const [localCartGifts, setLocalCartGifts] = useState(cartGifts);
  const [localCartAmount, setLocalCartAmount] = useState(0);

  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  
  useEffect(() => {
    if (location.pathname === "/cart") {
      webApp.BackButton.show();
      webApp.BackButton.onClick(() => {
        navigate("/");
      });
    } else {
      webApp.BackButton.hide();
    }

    return () => {
      webApp.BackButton.hide();
    };
  }, [location.pathname, webApp, navigate]);

  useEffect(() => {
    setLocalCartGifts(cartGifts);
  }, [cartGifts]);
  
  const removeFromCart = (id: number) => {
    const updatedGifts = localCartGifts.filter(g => g.id !== id);
    setLocalCartGifts(updatedGifts);
    setCartGifts(updatedGifts);
  };

  const handleCartClick = async () => {
    try {
      if (!userProfile?.username) {
        showToast(t("gift.usernameRequired"), "error");
        return;
      }
      if (!userProfile?.balance || userProfile.balance < localCartAmount) {
        showToast(t("gift.topUpBalance"), "error");
        return;
      }

      const transformedGifts = localCartGifts.map(gift => ({
        id: gift.id,
        price: gift.price
      }));

      console.log(transformedGifts);

      const response = await axios.post(
        "https://apistore.nestdex.dev/market/cart/buy", transformedGifts, {
          headers: {
            Authorization: authToken,
            "Content-Type": "application/json",
            "Accept": "*/*",
          },
        }
      );

      if (response.status === 200) {
        if (response.data.success) {
          setIsSuccessModalVisible(true);
          setLocalCartGifts([]);
          setCartGifts([]);
        } 

        if (!response.data.success) {
          setIsErrorModalVisible(true);
        
          const updatedCartGifts = localCartGifts
            .map((gift) => {
              const updatedGift = response.data.cart.find((item) => item.id === gift.id);
              return updatedGift ? { ...gift, price: updatedGift.price } : null;
            })
            .filter((gift): gift is NonNullable<typeof gift> => gift !== null);
        
          setCartGifts(updatedCartGifts);
        }
      }

      return;
    } catch (error) {
      showToast(t("gift.somethingWentWrong"), "error");
      console.error(error);
    }
  }

  useEffect(() => {
    const totalAmount = localCartGifts.reduce((sum, gift) => sum + (gift.price || 0), 0);
    setLocalCartAmount(totalAmount);
  }, [localCartGifts]);

  const handleSuccessModalClose = () => {
    setIsSuccessModalVisible(false);
  };

  const handleErrorModalClose = () => {
    setIsErrorModalVisible(false);
  };

  return (
    <section className={styles.main}>
      <Modal isVisible={isSuccessModalVisible} setIsVisible={setIsSuccessModalVisible} paddingTop={24} headline={t("cart.success.modal.title")}>
        <p className={styles.description} dangerouslySetInnerHTML={{ __html: t("cart.success.modal.description") }} />
        <a onClick={handleSuccessModalClose} className={cn(styles.buttonNotActive, styles.modal)}>
          {t("cart.okay")}
        </a>
      </Modal>

      <Modal isVisible={isErrorModalVisible} setIsVisible={setIsErrorModalVisible} paddingTop={24} headline={t("cart.error.modal.title")}>
        <p className={styles.description} dangerouslySetInnerHTML={{ __html: t("cart.error.modal.description") }} />
        <a onClick={handleErrorModalClose} className={cn(styles.buttonNotActive, styles.modal)}>
          {t("cart.okay")}
        </a>
      </Modal>

      <div className={styles.header}>
        <h1 className={styles.headline}>{t("cart.title")}</h1>
        {localCartGifts && localCartGifts.length > 0 && (<span className={styles.headright}>{localCartGifts.length} {t("cart.title.line")}</span>)}
      </div>

      <div className={styles.activityItems}>
        {localCartGifts.length > 0 ? (
          localCartGifts.map((gift, index) => (
            <div className={styles.activityItemsItem} key={index}>
              <div className={styles.activityItemsItemLeft}>
                <div 
                  key={index}
                  className={`${styles.activityItemsItemLeftCanvas} ${styles.backdrop}`}
                  style={{
                    background: `radial-gradient(circle,
                      ${getNftBackground(gift.background_name).centerColor || '#4d5254'} 0%,
                      ${getNftBackground(gift.background_name).edgeColor || '#313638'} 100%),
                      ${getNftBackground(gift.background_name).patternColor || '#000000'}`,
                  }}
                >
                  <DotLottieReact src={getModelLottie(gift.type, gift.model_name)} style={{ width: "42px", height: "42px" }} />
                </div>
              </div>
              <div className={styles.activityItemsItemContext}>
                <div className={styles.activityItemsItemContextTitle}>
                  <h4>{gift.type}</h4>
                  <span>#{gift.number}</span>
                </div>
                <div className={styles.activityItemsItemContextBadges}>
                  <div className={styles.activityItemsItemContextBadgesItem}>
                    <h4>{gift.model_name}</h4>
                    <span>{gift.model}%</span>
                  </div>
                  <div className={styles.activityItemsItemContextBadgesItem}>
                    <h4>{gift.pattern_name}</h4>
                    <span>{gift.pattern}%</span>
                  </div>
                  <div className={styles.activityItemsItemContextBadgesItem}>
                    <h4>{gift.background_name}</h4>
                    <span>{gift.background}%</span>
                  </div>
                </div>
                <div className={styles.activityItemsItemContextSummary}>
                  <h4>{validatePrice(gift.price)}</h4>
                  <img src="/photos/ton.svg" alt="" />
                </div>
              </div>
              <div onClick={() => removeFromCart(gift.id)} className={styles.activityItemsItemRight}>
                <span><img width={8} height={8} src="/photos/giveaways/close.svg" alt="" /></span>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.empty}>
            <img width={38} height={35} src="/photos/nestEmpty.svg" alt="" />
            <p className={styles.emptyDescription}>{t("store.empty")}</p>
          </div>
        )}
      </div>

      {localCartGifts && localCartGifts.length > 0 && (
        <button onClick={handleCartClick} className={cn(styles.button, styles.buttonBottomScreen)} type="submit">
          <span>{t("cart.button")}</span>
          <div className={styles.price}>
            <span>{validatePrice(localCartAmount)}</span>
            <img width={20} height={20} src="/photos/ton.svg" alt="" />
          </div>
        </button>
      )}
    </section>
  );
};

export default Cart;