import { t } from "i18next"
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import styles from "./Info.module.scss";
import { formatDate } from "@utils/formatDate";
import { getModelLottie, getNftBackground } from "@utils/nftUtils";
import UseTelegram from "@hooks/useTelegram";

const InfoWidget = ({ giveaway }: { giveaway: any }) => {
  const { webApp } = UseTelegram();

  const openChannel = (username: any) => {
    const link = `https://t.me/${username}`;
    webApp.openTelegramLink(link);
  }

  return (
    <>
      <div className={styles.giftsWidget}>
        {giveaway.gifts.map((gift: any, index: number) => (
          <div
            key={index}
            className={styles.chooseGiftsGift}
            style={{
              background: `radial-gradient(circle,
                ${getNftBackground(gift.background_name).centerColor || '#4d5254'} 0%,
                ${getNftBackground(gift.background_name).edgeColor || '#313638'} 100%),
                ${getNftBackground(gift.background_name).patternColor || '#000000'}`,
            }}
          >
            <DotLottieReact
              src={getModelLottie(gift.type, gift.model_name)}
              style={{ width: "60%", height: "60%" }}
              autoplay
            />
          </div>
        ))}
      </div>

      <div className={styles.infoWidget}>
        {/* <div className={styles.infoWidgetItem}>
          <h4>{t("giveawayOpen.info.table.label1")}</h4>
          <span>@tapovich_channel</span>
        </div> */}
        <div className={styles.infoWidgetItem}>
          <h4>{t("giveawayOpen.info.table.label2")}</h4>
          <span>{formatDate(giveaway?.end_time)}</span>
        </div>
        {giveaway?.type !== "subscription_paid_ticket" && (
        <div className={styles.infoWidgetItem}>
          <h4>{t("giveawayOpen.info.table.label3")}</h4>
          {giveaway?.quantity_members > 0 && (<span>{giveaway?.participants_ids.length}/{giveaway?.quantity_members}</span>)}
          {giveaway?.quantity_members === 0 && (<span>{giveaway?.participants_ids.length}/∞</span>)}
        </div>
        )}
        {giveaway?.type === "subscription_paid_ticket" && (
        <div className={styles.infoWidgetItem}>
          <h4>{t("giveawayOpen.info.table.label3")}</h4>
          <span>{giveaway?.participants_ids.length}/∞</span>
        </div>
        )}
        {giveaway?.type === "subscription_paid_ticket" && (
        <div className={styles.infoWidgetItem}>
          <h4>{t("giveawayOpen.info.table.label5")}</h4>
          {giveaway?.quantity_members > 0 && (<span>{giveaway?.participants_ids.length}</span>)}
          {giveaway?.quantity_members === 0 && (<span>{giveaway?.participants_ids.length}</span>)}
        </div>
        )}
        <div className={styles.conditionsWidget}>
          <h4>{t("giveawayOpen.info.table.label4")}</h4>
          <div className={styles.conditionsWidgetChannels}>
            {giveaway?.channels.map((channel: any, index: number) => (
              <div onClick={() => openChannel(channel.username)} key={index} className={styles.conditionsWidgetChannelsChannel}>
                <img src={channel.image_url} alt={channel.title} />
                <span>{channel.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default InfoWidget;