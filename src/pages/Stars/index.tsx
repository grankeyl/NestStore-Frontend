// @ts-nocheck

import { FC, FormEvent, useEffect, useState } from "react";
import styles from "./Stars.module.scss";
import axios from "axios";
import { t } from "i18next";
import { IStar } from "@types";
import Modal from "@components/Modal";
import { showToast } from "@utils/showToast";
import { useUserProfile } from "@contexts/user-profile";
import cn from "classnames";
import { useNavigate } from "react-router";
import { giftTypeBackdrops } from "@data/gifts";

const Stars: FC = () => {
  document.body.classList.remove("no-padding");

  const authToken = localStorage.getItem("token");
  const [page, setPage] = useState<string>("telegramStars");
  const [section, setSection] = useState<string>("buyStars");
  const [inputValue, setInputValue] = useState("");
  const [paymentSelected, setPaymentSelected] = useState<string>("ton");
  const [selectedUser, setSelectedUser] = useState<string[]>([]);
  const [isVisibleModal, setIsVisibleModal] = useState(false);

  const removeUser = (channel: string) => {
    setSelectedUser(selectedUser.filter((ch) => ch !== channel));
  };

  const handleBlur = () => {
    if (inputValue.trim() && !selectedUser.includes(inputValue.trim())) {
      setSelectedUser([...selectedUser, inputValue.trim()]);
      setInputValue(""); 
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const setModal = () => {
    setIsVisibleModal(!isVisibleModal);
  };

  return (
    <section className={styles.main}>

      <Modal isVisible={isVisibleModal} setIsVisible={setIsVisibleModal} type="storeCard">
        <div className={cn(styles.headModal)}>
          <div className={cn(styles.headModalImage)}></div>
        </div>

        {section === 'buyStars' && (
          <dl className={styles.headModalList}>
            <div className={styles.headModalListContent}>
              <dd className={styles.headModalListItemBlocker}>
                <dt className={styles.headModalListBlockerLabel}>{t("stars.modal.label1")}</dt>
              </dd>
              <dd className={styles.description}>
                <dt className={cn(styles.headModalListBlockerText)}>10000</dt>
              </dd>
            </div>
            <div className={styles.headModalListContent}>
              <dd className={styles.headModalListBlocker}>
                <dt className={styles.headModalListBlockerLabel}>{t("stars.modal.label2")}</dt>
              </dd>
              <dd className={styles.description}>
                <dt className={styles.headModalListBlockerText}>TON</dt>
              </dd>
            </div>
            <div className={styles.headModalListContent}>
              <dd className={styles.headModalListBlocker}>
                <dt className={styles.headModalListBlockerLabel}>{t("stars.modal.label3")}</dt>
              </dd>
              <dd className={cn(styles.description, styles.flexed)}>
                <dt className={styles.headModalListBlockerText}>20</dt>
                <img width={24} height={24} src="/photos/ton.svg" alt="" />
              </dd>
            </div>
          </dl>
        )}

        {section === 'sellStars' && (
          <dl className={styles.headModalList}>
            <div className={styles.headModalListContent}>
              <dd className={styles.headModalListItemBlocker}>
                <dt className={styles.headModalListBlockerLabel}>{t("stars.label3")}</dt>
              </dd>
              <dd className={styles.description}>
                <dt className={cn(styles.headModalListBlockerText)}>10000</dt>
              </dd>
            </div>
            <div className={styles.headModalListContent}>
              <dd className={styles.headModalListBlocker}>
                <dt className={styles.headModalListBlockerLabel}>{t("stars.label4")}</dt>
              </dd>
              <dd className={cn(styles.description, styles.flexed)}>
                <dt className={styles.headModalListBlockerText}>20</dt>
                <img width={24} height={24} src="/photos/usdt.svg" alt="" />
              </dd>
            </div>
          </dl>
        )}

        <div className={styles.headModalDescription}>
          <p>
            {t("stars.buying_telegram_stars")}{" "}
            <span>{t("stars.our_terms")}</span>,{" "}
            {t("stars.not_us_resident")}
          </p>
        </div>

        <button className={cn(styles.modalButton)}>
          <span>Pay</span>
        </button>

      </Modal>
      
      {page === "telegramStars" && (
        <>
        <div className={styles.header}>
          <h1 className={styles.headline}>{t("stars.title")}</h1>
        </div>

        <div className={styles.banner}>
          <h4>{t("stars.banner.descr")}</h4>
        </div>

        <div className={cn(styles.sellGiftSwitch, styles.switch, styles.priceInput, { [styles.checked]: section === 'sellStars' })}>
          <button onClick={() => setSection('buyStars')} type="button" className={styles.switchButton}>
            <img width={18} height={18} src="/photos/stars/buy.svg" alt="" />
            <span className={styles.switchText}>{t("stars.switch.type1")}</span>
          </button>
          <button onClick={() => setSection('sellStars')} type="button" className={styles.switchButton}>
            <span className={styles.switchText}>{t("stars.switch.type2")}</span>
          </button>
        </div>

        {section === 'buyStars' && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.block}>
                  <label className={styles.label}>
                    <span>{t("stars.label1")}</span>
                    <div className={styles.selectedItems}>
                      {selectedUser.map((channel) => (
                        <div key={channel} className={styles.selectedItemsItem}>
                          <img width={24} height={24} src="/photos/giveaways/channel.png" alt="" />
                          <h4>{channel}</h4>
                          <span onClick={() => removeUser(channel)}>
                            <img width={8} height={8} src="/photos/giveaways/close.svg" alt="" />
                          </span>
                        </div>
                      ))}
                      {selectedUser.length === 0 && (<input
                        placeholder="@username"
                        name="selectChannels"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onBlur={handleBlur}
                      />)}
                    </div>
                    <p className={styles.selectedItemsDescr}>{t("stars.label1.descr")}</p>
                  </label>
              <label htmlFor="price" className={styles.label}>
                <span>{t("stars.label2")}</span>
                <div className={styles.paymentSelect}>
                  <div className={cn(styles.paymentSelectItem, { [styles.active]: paymentSelected === "ton" })} onClick={() => setPaymentSelected("ton")}>
                    <img src="/photos/ton.svg" alt="" width={24} height={24} />
                    <span>TON</span>
                  </div>
                  <div className={cn(styles.paymentSelectItem, { [styles.active]: paymentSelected === "usdt" })} onClick={() => setPaymentSelected("usdt")}>
                    <img src="/photos/usdt.svg" alt="" width={24} height={24} />
                    <span>USDT</span>
                  </div>
                </div>
              </label>
              <label htmlFor="price" className={styles.label}>
                <span>{t("stars.label3")}</span>
                <div className={styles.priceInput}>
                  <input type="number" min={0.01} step={0.01} placeholder="50-20000" name="price" required />
                  <img className={styles.ton} src="/photos/stars/star.png" alt="" width={26} height={26} />
                </div>
              </label>
            </div>
            <button onClick={setModal} className={cn(styles.button, styles.buttonBottomScreen)} type="submit">
              <span>{t("stars.button.buy")}</span>
              <div className={styles.price}>
                <span>5</span>
                {paymentSelected === 'ton' && (<img width={20} height={20} src="/photos/ton.svg" alt="" />)}
                {paymentSelected === 'usdt' && (<img width={20} height={20} src="/photos/usdt.svg" alt="" />)}
              </div>
            </button>
          </form>
        )}

        {section === 'sellStars' && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.block}>
              <label htmlFor="price" className={styles.label}>
                <span>{t("stars.label3")}</span>
                <div className={styles.priceInput}>
                  <input type="number" min={0.01} step={0.01} placeholder="50-20000" name="price" required />
                  <img className={styles.ton} src="/photos/stars/star.png" alt="" width={26} height={26} />
                </div>
              </label>
              <label htmlFor="price" className={styles.label}>
                <span>{t("stars.label4")}</span>
                <div className={styles.priceInput}>
                  <input placeholder="0" name="price" disabled />
                  <img className={styles.ton} src="/photos/usdt.svg" alt="" width={26} height={26} />
                </div>
              </label>
            </div>

            <button onClick={setModal} className={cn(styles.button, styles.buttonBottomScreen)} type="submit">
              <span>{t("stars.button.sell")}</span>
              <div className={styles.price}>
                <span>5</span>
                <img width={20} height={20} src="/photos/stars/star.png" alt="" />
              </div>
            </button>

            {/* <button className={cn(styles.button, styles.buttonBottomScreen, styles.connectWallet)} type="submit">
              <img width={26} height={26} src="/photos/ton.svg" alt="" />
              <span>{t("header.connectWallet")}</span>
            </button> */}
          </form>
        )}
        </>
      )}

    </section>
  );
};

export default Stars;
