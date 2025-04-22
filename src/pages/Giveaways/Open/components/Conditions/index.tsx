import { t } from "i18next"

import cn from "classnames";
import styles from "./Conditions.module.scss";
import UseTelegram from "@hooks/useTelegram";

const ConditionsWidget = ({ type, giveaway }: { type: string, giveaway: any }) => {
  const { webApp } = UseTelegram();

  const openChannel = (invite_link: any) => {
    webApp.openTelegramLink(invite_link);
  }

  return (
    <div className={cn(styles.conditionsWidget, { [styles.paddinger]: type === 'participant' })}>
      <h4>{t("giveawayOpen.conditions.title")}</h4>
      <div className={styles.conditionsWidgetChannels}>
        {giveaway?.channels.map((channel: any, index: number) => (
          <div onClick={() => openChannel(channel.invite_link)} key={index} className={styles.conditionsWidgetChannelsChannel}>
            <img src={channel.image_url} alt={channel.title} />
            <span>{channel.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConditionsWidget;