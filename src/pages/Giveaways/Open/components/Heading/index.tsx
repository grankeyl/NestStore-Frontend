import { t } from "i18next"

import cn from "classnames";
import styles from "./Heading.module.scss";
import { useEffect, useState } from "react";
import { giveawayStartCountdown } from "@utils/useGiveaways";
import { formatDate } from "@utils/formatDate";

function CountdownGiveaway({ endTime }: { endTime: any }) {
  const [timeLeftDays, setTimeLeftDays] = useState("");

  useEffect(() => {
      function updateTimer() {
        setTimeLeftDays(giveawayStartCountdown(endTime));
      }

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
  }, [endTime]);

  return <p className={styles.resetText}>{timeLeftDays}</p>;
}

const HeadingWidget = ({ headRarity, headType, giveaway, countMembers }: { headRarity: string, headType: string, giveaway: any, countMembers: number }) => {
  return (
    <>
      <div className={cn(styles.headingWidget, styles[headRarity])}>
        
        <div className={styles.header}>
          <div className={styles.headerHolder}>
            <img width={122} height={20} src="/photos/logo-white.svg" alt="" />
          </div>
        </div>

        <div className={styles.headingWidgetContext}>
          <img width={85} height={90} src={`/photos/giveaways/giveaway-${headRarity}.png`} alt="" />
          <div className={styles.openJoinedBadges}>
            {!giveaway.ended && (
              <>
              <div className={styles.flexer}>
                <span>
                  <p>{giveaway?.gifts_ids.length} {t("giveawayOpen.gifts")}</p>
                </span>
                <span>
                  <img width={18} height={18} src="/photos/giveaways/giveaway-clock.svg" alt="" />
                  <CountdownGiveaway endTime={giveaway?.end_time} />
                </span>
              </div>
              <span>
                <p>{countMembers} {t("giveawayOpen.heading.participants")}</p>
              </span>
              </>
            )}
            {giveaway.ended && (
              <>
              <div className={styles.flexer}>
                <span>
                  <p>{giveaway?.gifts_ids.length} {t("giveawayOpen.gifts")}</p>
                </span>
                <span>
                  <p>{giveaway?.gifts_ids.length} {t("giveawayOpen.heading.winners")}</p>
                </span>
              </div>
              </>
            )}
          </div>
          <div className={styles.openJoinedDescr}>
            {!giveaway.ended && (
              <p>
                {headType === 'participant'
                  ? t("giveawayOpen.heading.descr1")
                  : `${t("giveawayOpen.heading.descr2.one")} ${formatDate(giveaway?.end_time)} ${t("giveawayOpen.heading.descr2.two")}`}
              </p>
            )}
            {giveaway.ended && (
              <p>
                {`${import.meta.env.VITE_BOT} automatically selected ${giveaway?.gifts_ids.length} winners out of ${giveaway?.participants_ids.length} participants.`}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default HeadingWidget;