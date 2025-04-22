//@ts-nocheck

import { t } from "i18next"
import { useEffect, useState } from "react";
import { giftTypeBackdrops } from "@data/gifts";
import { useUserProfile } from "@contexts/user-profile";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import axios from "axios";
import cn from "classnames";
import styles from "./Participants.module.scss";

const authToken = localStorage.getItem("token");

const ParticipantsWidget = ({ giveawayId, type, loading, participantsArray }: { giveawayId: number, type: string, loading: boolean, participantsArray: any }) => {
  const { userProfile } = useUserProfile();

  const [participants, setParticipants] = useState<any>(participantsArray);

  useEffect(() => {
    const sorted = [...participantsArray].sort((a, b) => {
      if (a.id === userProfile?.id) return -1;
      if (b.id === userProfile?.id) return 1;
      return 0;
    });
    setParticipants(sorted);
  }, [participantsArray, userProfile?.id]);

  const percentFormat = (num: number) => num.toFixed(2);

  return (
    <>
      {loading && (
        <div className={styles.loading}>
          <img width={33} height={33} src="/photos/giveaways/loading.svg" alt="" />
        </div>
      )}

      {!loading && (
        <div className={cn(styles.participantsWidget)}>

          {participants.map((participant, index) => (
            <>
              {type === 'ended' && participant.is_win && (
                <div key={index} className={styles.participantsWidgetItem}>
                  <div className={styles.participantsWidgetItemImage}>
                    <img width={32} height={32} src={participant.photo_url} alt="" />
                  </div>
                  <div className={styles.participantsWidgetItemContext}>
                    <span className={cn({ [styles.primary]: participant.id === userProfile?.id })}>{participant.name}</span>
                    <p>{t("translation:giveawayOpen.participants.chance")} {percentFormat(participant.chance_win)}%</p>
                  </div>
                  <div className={cn(styles.participantsWidgetItemRight, { [styles.primary]: type === 'ended' })}>
                    <span>
                      {type === 'ended' && participant.is_win
                        ? `1 ${t("giveawayOpen.participants.gift")}`
                        : `${participant.count_referrals} ${t("giveawayOpen.participants.referals")}`}
                    </span>
                  </div>
                </div>
              )}

              {type !== 'ended' && !participant.is_win && (
                <div key={index} className={styles.participantsWidgetItem}>
                  <div className={styles.participantsWidgetItemImage}>
                    <img width={32} height={32} src={participant.photo_url} alt="" />
                  </div>
                  <div className={styles.participantsWidgetItemContext}>
                    <span className={cn({ [styles.primary]: participant.id === userProfile?.id })}>{participant.name}</span>
                    <p>{t("translation:giveawayOpen.participants.chance")} {percentFormat(participant.chance_win)}%</p>
                  </div>
                  <div className={cn(styles.participantsWidgetItemRight, { [styles.primary]: type === 'ended' })}>
                    <span>
                      {type === 'ended' && participant.is_win
                        ? `1 ${t("giveawayOpen.participants.gift")}`
                        : `${participant.count_referrals} ${t("giveawayOpen.participants.referals")}`}
                    </span>
                  </div>
                </div>
              )}
            </>
          ))}

        </div>
      )}
    </>
  );
};

export default ParticipantsWidget;