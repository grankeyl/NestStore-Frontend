import { FC, useEffect } from "react";
import styles from "./Referrals.module.scss";
import { copyToClipboard } from "@utils/copyToClipboard";
import { useUserProfile } from "@contexts/user-profile.tsx";
import { useLocation, useNavigate } from "react-router";
import UseTelegram from "@hooks/useTelegram";
import { validateBalance } from "@utils/formatBalance";
import { t } from "i18next";

const Referrals: FC = () => {
  document.body.classList.remove("no-padding");
  
  const { userProfile } = useUserProfile();
  const { webApp } = UseTelegram();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/profile/referrals") {
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

  if (!userProfile) {
    return <h1>User Profile not found!</h1>;
  }

  const clickInfluencer = () => {
    webApp.openTelegramLink('https://t.me/nestinfl');
  }

  return (
    <section className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.headline}>{t("referrals.title")}</h1>
      </div>
      <p className={styles.description} dangerouslySetInnerHTML={{ __html: t("referrals.description") }} />
      <form className={styles.form}>
        <div className={styles.block}>
          <label className={styles.label}>
            <div className={styles.headRef}>
              <span>{t("referrals.referralLink")}</span>
              <b onClick={clickInfluencer}>{t("referrals.influencer")}</b>
            </div>
            <button type="button" className={styles.item}>
              <span className={styles.link}>{userProfile.referral_link.slice(0, 28) + "..."}</span>
              <div className={styles.icons}>
                <a target="_blank" href={`https://t.me/share/url?url=${encodeURIComponent(userProfile.referral_link)}`}>
                  <img width={20} height={20} src="/photos/profile/upload.svg" alt={t("referrals.shareLink")} />
                </a>
                <button onClick={() => copyToClipboard(userProfile.referral_link, t("copyToClipboard.copied"))} type="button">
                  <img width={20} height={20} src="/photos/copy.svg" alt={t("referrals.copyLink")} />
                </button>
              </div>
            </button>
          </label>
        </div>
        <div className={styles.blockHolder}>
          <div className={styles.block}>
            <dl className={styles.label}>
              <dt>{t("referrals.invitedFriends")}</dt>
              <dd className={styles.info}>{userProfile.count_referrals}</dd>
            </dl>
          </div>
          <div className={styles.block}>
            <dl className={styles.label}>
              <dt>{t("referrals.commissions")}</dt>
              <dd className={styles.info}>
                <img width={20} height={20} src="/photos/ton.svg" alt="Toncoin" />
                <span>{validateBalance(userProfile.commission)}</span>
              </dd>
            </dl>
          </div>
        </div>
      </form>
      <div className={styles.info}>{t("referrals.info")}</div>
    </section>
  );
};

export default Referrals;
