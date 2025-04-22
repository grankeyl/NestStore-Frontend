import { useNavigate, useLocation } from "react-router-dom";
import UseTelegram from "@hooks/useTelegram";
import styles from "./Header.module.scss";
import { TonConnectButton, useTonAddress } from "@tonconnect/ui-react";
import { useCartStore } from "@stores/cart.store";
import { t } from "i18next";

const Header = () => {
  const userFriendlyAddress = useTonAddress();
    
  const { webApp } = UseTelegram();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { cartGifts } = useCartStore();

  const userProfileAvatar = webApp?.initDataUnsafe?.user?.photo_url ?? "/photos/profile/ava.svg";

  const isProfile = () => location.pathname !== "/profile";

  const openCart = () => {
    navigate("/cart");
  };

  const openProfile = () => {
    navigate("/profile");
  };

  const shortenString = (str: string, startLength = 5, endLength = 5): string => {
    if (str.length <= startLength + endLength) return str;
    return `${str.slice(0, startLength)}...${str.slice(-endLength)}`;
  };

  return (
    <div className={styles.header}>
      <div className={styles.headerHolder}>
        <img width={122} height={20} src="/photos/logo.svg" alt="" />
      </div>
      {isProfile() && <div className={styles.headerUser}>
        <div onClick={openProfile} className={styles.headerUserLeft}>
          <img width={40} height={40} src={userProfileAvatar} alt="" />
        </div>
        <div className={styles.headerUserRight}>
          <div className={styles.headerUserRightAbsolute}>
            {!userFriendlyAddress && (
              <div className={styles.headerUserRightAbsoluteConnect}>
                <img src="/photos/ton.svg" alt="" />
                <span>{t("header.connectWallet")}</span>
              </div>
            )}
            {userFriendlyAddress && (
              <div className={styles.headerUserRightAbsoluteConnect}>
                <img src="/photos/ton.svg" alt="" />
                <span>{shortenString(userFriendlyAddress)}</span>
              </div>
            )}
            <TonConnectButton className={styles.headerUserRightWallet} />
          </div>
          <div onClick={openCart} className={styles.headerUserRightBasket}>
            {cartGifts && cartGifts.length > 0 && (<div className={styles.headerUserRightBasketMark}></div>)}
            <img width={24} height={24} src="/photos/basket.svg" alt="" />
          </div>
        </div>
      </div>
      }
    </div>
  );
};

export default Header;
