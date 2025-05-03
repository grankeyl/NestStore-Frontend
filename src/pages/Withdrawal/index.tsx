// @ts-nocheck

import { FC, useEffect, useState } from "react";
import styles from "./Withdrawal.module.scss";
import { useUserProfile } from "@contexts/user-profile";
import axios from "axios";
import { showToast } from "@utils/showToast";
import { validateBalance } from "@utils/formatBalance";
import { useLocation, useNavigate } from "react-router";
import UseTelegram from "@hooks/useTelegram";
import { t } from "i18next"; 
import { useTonAddress } from "@tonconnect/ui-react";
import ConfirmModal from "@components/Confirm";

const authToken = localStorage.getItem("token");

const Withdrawal: FC = () => {
  document.body.classList.remove("no-padding");
  
  const { userProfile } = useUserProfile();
  const [isDisabled, setIsDisabled] = useState(false);
  const [wallet, setWallet] = useState("");
  const [amount, setAmount] = useState("");
  const { webApp } = UseTelegram();
  const userFriendlyAddress = useTonAddress();
  const location = useLocation();
  const navigate = useNavigate();

  const [isWithdrawalConfirmVisible, setIsWithdrawalConfirmVisible] = useState(false);

  useEffect(() => {
    if (location.pathname === "/profile/withdrawal") {
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

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountNumber = parseFloat(amount);

    if (!wallet) {
      return;
    }

    if (!userProfile?.balance) {
      showToast(t("withdrawal.balanceNotAvailable"), "error");
      return;
    }

    if (amountNumber > userProfile?.balance) {
      showToast(t("withdrawal.amountExceedsBalance"), "error");
      return;
    }

    if (amountNumber < 1) {
      showToast(t("withdrawal.amountOneTon"), "error");
      return;
    }

    setIsWithdrawalConfirmVisible(true)
  };

  const handleWithdrawalConfirm = async () => {
    const amountNumber = parseFloat(amount);

    try {
      const response = await axios.post(
        "https://storeapi.nestdex.dev/create-withdraw-request",
        { amount: amountNumber, wallet: wallet },
        { headers: { Authorization: authToken } });

      if (response.data.success) {
        showToast(t("withdrawal.requestCreated"), "success");
        setIsWithdrawalConfirmVisible(false);
        setAmount("");
        userProfile.balance -= amountNumber;
      }
    } catch (e: any) {
      console.error(e.response);
      showToast(t("withdrawal.somethingWentWrong"), "error");
    }
  };

  return (
    <section className={styles.main}>
      <ConfirmModal
        isVisible={isWithdrawalConfirmVisible}
        setIsVisible={setIsWithdrawalConfirmVisible}
        headline={t("modal.confirm.headline")}
        onConfirm={handleWithdrawalConfirm}
        onCancel={() => setIsWithdrawalConfirmVisible(false)}
      >
      </ConfirmModal>

      <div className={styles.header}>
        <h1 className={styles.headline}>{t("withdrawal.title")}</h1>
      </div>
      <form className={styles.form} onSubmit={handleWithdrawal}>
        <div className={styles.block}>
          <label htmlFor="wallet" className={styles.label}>
            <span>{t("withdrawal.receivingWallet")}</span>
            <input minLength={40} required name="wallet" id="wallet" className={styles.item} value={wallet} onChange={(e) => setWallet(e.target.value)} />
          </label>
          <label htmlFor="amount" className={styles.label}>
            <div className={styles.amountHolder}>
              <span>{t("withdrawal.withdrawalAmount")}</span>
              <div className={styles.amount}>
                <img width={14} height={14} src="/photos/ton.svg" alt="Toncoin" />
                <span>{validateBalance(userProfile?.balance ?? 0)}</span>
              </div>
            </div>
            <div className={styles.inputHolder}>
              <input
                min={1}
                step={0.01}
                required
                type="number"
                placeholder="0.00"
                name="amount"
                id="amount"
                className={styles.item}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                max={validateBalance(userProfile?.balance ?? 0)}
              />
            </div>
          </label>
          <button disabled={isDisabled} type="submit" className={styles.button}>
            {t("withdrawal.withdrawalButton")}
          </button>
        </div>
      </form>
    </section>
  );
};

export default Withdrawal;
