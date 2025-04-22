// @ts-nocheck

import { FC, useEffect, useState } from "react";
import styles from "./Profile.module.scss";
import { Link } from "react-router";
import cn from "classnames";
import useTelegram from "@hooks/useTelegram.ts";
import { useUserProfile } from "@contexts/user-profile.tsx";
import { validateBalance } from "@utils/formatBalance";
import { useTonConnectUI, useTonAddress, TonConnectButton } from '@tonconnect/ui-react';
import { t } from "i18next";
import Modal from "@components/Modal";
import Radio from "@components/ui/radio";
import i18n from "@i18n";

const Profile: FC = () => {
  document.body.classList.remove("no-padding");
  
  const { webApp } = useTelegram();
  const { userProfile } = useUserProfile();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [isActiveSwitch, setIsActiveSwitch] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [tonConnectUI] = useTonConnectUI();
  const userFriendlyAddress = useTonAddress();

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
      setIsActiveSwitch(storedTheme === "dark");
    }
  }, []);

  const handleThemeChange = () => {
    if (theme === "dark") {
      localStorage.setItem("theme", "light");
      setTheme("light");
      setIsActiveSwitch(false);
    } else {
      localStorage.setItem("theme", "dark");
      setTheme("dark");
      setIsActiveSwitch(true);
    }
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    i18n.changeLanguage(language);
    localStorage.setItem("selectedLanguage", language);
  };

  const items = [
    {
      label: t("profile.menu.my-gifts"),
      path: "/gift",
      img: "/photos/menu/gift.svg",
    },
    // {
    //   label: t("profile.menu.my-orders"),
    //   path: "/orders",
    //   img: "/photos/menu/orders.svg",
    // },
    {
      label: t("profile.menu.history"),
      path: "/history",
      img: "/photos/menu/history.svg",
    },
    {
      label: t("profile.menu.referrals"),
      path: "/profile/referrals",
      img: "/photos/profile/referrals.svg",
    },
    {
      label: t("profile.menu.activity"),
      path: "/activity",
      img: "/photos/profile/activity.svg",
    },
    {
      label: t("profile.menu.support"),
      path: "https://t.me/nesupport_robot",
      img: "/photos/profile/support.svg",
    },
  ];
  
  const languages = [
    {
      label: t("profile.modal.english"),
      value: "en",
    },
    {
      label: t("profile.modal.russian"),
      value: "ru",
    },
  ];

  const userProfileAvatar = webApp?.initDataUnsafe?.user?.photo_url ?? "/photos/profile/ava.svg";
  if (!userProfile) {
    return <h1>User Profile not found!</h1>;
  }

  const shortenString = (str: string, startLength = 5, endLength = 5): string => {
    if (str.length <= startLength + endLength) return str;
    return `${str.slice(0, startLength)}...${str.slice(-endLength)}`;
  };

  return (
    <section className={styles.main}>
      <Modal headline={t("profile.modal.headline")} isVisible={isModalVisible} setIsVisible={setIsModalVisible}>
        <div className={styles.items}>
          <div className={cn(styles.item, styles.itemModal)}>
            <div className={styles.list}>
              {languages.map(({ label, value }) => (
                <label htmlFor={value} key={value} className={styles.listContent}>
                  <div className={styles.description}>
                    <h4 className={styles.title}>{label}</h4>
                  </div>
                  <Radio name="language" value={value} id={value} checked={selectedLanguage === value} onChange={() => handleLanguageChange(value)} />
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <div className={styles.header}>
        <h1 className={styles.headline}>{t("profile.title")}</h1>
      </div>
      
      <div className={styles.user}>
        <img src={userProfileAvatar} width={82} height={82} alt="" className={styles.ava} />
        <h2 className={styles.username}>{userProfile.username}</h2>
      </div>
      <div className={styles.items}>
        <div className={cn(styles.item, styles.block)}>
          <span>{t("profile.balance")}</span>
          <div className={styles.balance}>
            <img width={18} height={18} src="/photos/ton.svg" alt="Toncoin" />
            <span>{validateBalance(userProfile.balance)}</span>
          </div>
        </div>
        <div className={styles.buttonHolder}>
          <Link to="deposit" className={cn(styles.item, styles.button)}>
            <div className={styles.balance}>
              <img width={20} height={20} src="/photos/profile/deposit.svg" alt="Toncoin" />
            </div>
            <span>{t("profile.deposit")}</span>
          </Link>
          <Link to="withdrawal" className={cn(styles.item, styles.button)}>
            <div className={styles.balance}>
              <img width={20} height={20} src="/photos/profile/withdrawal.svg" alt="Toncoin" />
            </div>
            <span>{t("profile.withdrawal")}</span>
          </Link>
        </div>
        {!userFriendlyAddress && (
          <div className={cn(styles.buttonHolder, styles.clippingDisplay)}>
            <div className={cn(styles.item, styles.button)}>
              <div className={styles.balance}>
                <img width={20} height={20} src="/photos/profile/connect-wallet.svg" alt="Toncoin" />
              </div>
              <span>{t("profile.connectWallet")}</span>
            </div>
            <TonConnectButton className={styles.connectWalletBtn} />
          </div>
        )}
        {userFriendlyAddress && (
          <div className={cn(styles.buttonHolder, styles.clippingDisplay)}>
            <div className={cn(styles.item, styles.button, styles.disconnectWallet)}>
              <div className={styles.balance}>
                <img width={20} height={20} src="/photos/profile/disconnect-wallet.svg" alt="Toncoin" />
              </div>
              <span>{t("profile.disconnectWallet")}</span>
              <p>{shortenString(userFriendlyAddress)}</p>
            </div>
            <TonConnectButton className={styles.connectWalletBtn} />
          </div>
        )}
        <div className={styles.item}>
          <div className={styles.list}>
            {items.map(({ img, label, path }) => (
              <Link to={path} key={label} className={styles.listContent}>
                <div className={styles.description}>
                  <img height={24} width={24} src={img} alt="" />
                  <h4 className={styles.title}>{label}</h4>
                </div>
                <img height={12} width={6} src="/photos/profile/arrow.svg" alt="" />
              </Link>
            ))}
            <button onClick={() => setIsModalVisible(true)} className={styles.listContent}>
              <div className={styles.description}>
                <img height={24} width={24} src={"/photos/profile/language.svg"} alt="" />
                <h4 className={styles.title}>{t("profile.menu.language")}</h4>
              </div>
              <img height={12} width={6} src="/photos/profile/arrow.svg" alt="" />
            </button>
            {/* <button className={styles.listContent}>
              <div className={styles.description}>
                <img height={24} width={24} src={"/photos/profile/theme.svg"} alt="" />
                <h4 className={styles.title}>{t("profile.menu.theme")}</h4>
              </div>
              <span
                className={`${styles.toggleswitch} ${isActiveSwitch ? styles.active : ""}`}
                onClick={() => handleThemeChange()}
              >
                <span className={styles.toggleswitchThumb}></span>
              </span>
            </button> */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Profile;
