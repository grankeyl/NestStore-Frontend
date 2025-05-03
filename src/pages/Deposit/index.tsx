//@ts-nocheck

import React, { FC, useEffect, useState } from "react";
import styles from "./Deposit.module.scss";
import { useUserProfile } from "@contexts/user-profile.tsx";
import axios from "axios";
import { beginCell, toNano } from "@ton/core";
import { copyToClipboard } from "@utils/copyToClipboard";
import UseTelegram from "@hooks/useTelegram";
import { useLocation, useNavigate } from "react-router";
import { t } from "i18next";
import { useTonConnectUI } from "@tonconnect/ui-react";

const Deposit: FC = () => {
  const { userProfile } = useUserProfile();
  const [walletAddress, setWalletAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [tonConnectUI] = useTonConnectUI();
  const { webApp } = UseTelegram();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/profile/deposit") {
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

  useEffect(() => {
    fetchWalletAddress().then();
  }, []);

  const fetchWalletAddress = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("https://storeapi.nestdex.dev/deposit-wallet-address", {
        headers: { Authorization: token },
      });

      setWalletAddress(response.data.wallet_address);
    } catch (err) {
      console.log(err);
    }
  };

  const handleChangeAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const generateTonTransferLink = () => {
    const numericAmount = parseFloat(amount);
    if (!numericAmount || !walletAddress) return;

    const nanotonAmount = toNano(numericAmount).toString();
    const depositComment = userProfile?.deposit_comment ?? "";

    const tonTransferLink = `ton://transfer/${walletAddress}?amount=${nanotonAmount}&text=${encodeURIComponent(depositComment)}`;
    return tonTransferLink;
  };

  const handleDeposit = async () => {
    const wallets = await tonConnectUI.getWallets();
    if (!wallets.length) return;
  
    const numericAmount = parseFloat(amount);
    if (!numericAmount || !walletAddress) return;

    const nanotonAmount = toNano(numericAmount).toString();
    const depositComment = userProfile?.deposit_comment ?? "";

    let body = beginCell()
      .storeUint(0, 32)
      .storeStringTail(`${depositComment}`)
      .endCell();

    const response = await tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
            address: walletAddress,
            amount: nanotonAmount,
            payload: body.toBoc().toString('base64')
        },
      ],
    });
  
    if (response && response.boc) {
      navigate("/profile");
    }
  };

  return (
    <section className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.headline}>{t("deposit.title")}</h1>
      </div>
      <p className={styles.description}>{t("deposit.description")}</p>
      <form className={styles.form} onSubmit={handleDeposit}>
        <div className={styles.block}>
          <label htmlFor="amount" className={styles.label}>
            <span>{t("deposit.amountDeposit")}</span>
            <div className={styles.inputHolder}>
              <input value={amount} onChange={handleChangeAmount} placeholder="0.00" name="amount" id="amount" className={styles.item} />
            </div>
          </label>
          <a onClick={handleDeposit} className={styles.button}>
            {t("deposit.depositButton")}
          </a>
        </div>
      </form>
    </section>
  );
};

export default Deposit;
