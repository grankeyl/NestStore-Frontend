// @ts-nocheck

import { FC, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { shootConfetti } from "@hooks/useConfetti";
import { t } from "i18next";

import axios from "axios";
import cn from "classnames";
import styles from "./Open.module.scss";
import UseTelegram from "@hooks/useTelegram";

import ConditionsWidget from "./components/Conditions";
import ButtonWidget from "./components/Button";
import InfoWidget from "./components/Info";
import HeadingWidget from "./components/Heading";
import GiftsWidget from "./components/Gifts";
import ParticipantsWidget from "./components/Participants";

import { giveawayGetRarity, giveawayStartCountdown } from "@utils/useGiveaways";
import { copyToClipboard } from "@utils/copyToClipboard";
import { useUserProfile } from "@contexts/user-profile";
import { showToast } from "@utils/showToast";

const authToken = localStorage.getItem("token");

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

const GiveawayOpen: FC<{ isTokenReady: boolean }> = () => {
  const navigate = useNavigate();
  const { userProfile } = useUserProfile();
  const { giveawayId } = useParams<{ giveawayId: string }>();

  const { webApp } = UseTelegram();
  const [giveawayType, setGiveawayType] = useState("checking");
  const [giveawayRarity, setGiveawayRarity] = useState("legend");
  const [selectedGiveaway, setSelectedGiveaway] = useState(null);
  const [shootedConfetti, setShootedConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [giveawayReferralLink, setGiveawayReferralLink] = useState<string>('');
  const [loadingParticipants, setLoadingParticipants] = useState(true);

  const [participants, setParticipants] = useState<any>([]);

  useEffect(() => {
    document.body.classList.add("no-padding");
    return () => document.body.classList.remove("no-padding");
  }, []);

  useEffect(() => {
    if (giveawayId) {
      openedGiveaway(Number(giveawayId));
    }
  }, [giveawayId]);

  const getParticipants = async () => {
    try {
      if (!giveawayId) return;

      const response = await axios.get(
        `https://storeapi.nestdex.dev/giveaway/${giveawayId}/participants`,
        { headers: { Authorization: authToken } }
      );

      if (response.status === 200) {
        setParticipants(response.data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    getParticipants();

    setInterval(() => {
      getParticipants();
    }, 7000);
  }, [giveawayId]);
  
  useEffect(() => {
      if (location.pathname.includes("/giveaway/open")) {
        webApp.BackButton.show();
        webApp.BackButton.onClick(
          () => {
            navigate("/");
          },
        );
        return () => {
          webApp.BackButton.hide();
          webApp.BackButton.offClick(
            () => {
              navigate("/");
            }
          );
        };
      } else {
        webApp.BackButton.hide();
      }
  }, [location.pathname, navigate]);

  const openedGiveaway = async (id: number) => {
    try {
      const response = await axios.post(
        `https://storeapi.nestdex.dev/giveaway/${id}`,
        {},
        { headers: { Authorization: authToken } }
      );

      if (response.status === 200) {
        const data = response.data;

        setSelectedGiveaway(data);
        setGiveawayRarity(giveawayGetRarity(data.gifts_ids.length));

        if (data.type === "subscription_live") {
          isGiveawayNotEnded(data.end_time);

          setTimeout(() => {
            setGiveawayType("online_giveaway");
            joinGiveaway(data.id);
            isGiveawayEnded(data.end_time);
          }, 1000);
        } else {
          setGiveawayType("success_joined");

          if (!shootedConfetti) {
            shootConfetti();
            setShootedConfetti(true);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const isReferralLiveGiveaway = async (initData: string) => {
    const authToken = localStorage.getItem("token");
    const params = new URLSearchParams(initData);
    const startParam = params.get('start_param');
  
    if (startParam && startParam.startsWith("liveGiveaway_")) {
      const [_, giveawayId, userId] = startParam.split("_");
  
      if (userId) {
        return userId;
      }
    }
  };

  const joinGiveaway = async (id: number) => {
    try {
      const isReferral = await isReferralLiveGiveaway(webApp.initDataUnsafe);
      
      const payload: any = {
        id: id,
        count_tickets: 1
      };

      if (isReferral) {
        payload.referrer_id = isReferral;
      }

      if (selectedGiveaway?.type !== "subscription_live") {
        payload.referrer_id = selectedGiveaway.user_id;
      }

      const response = await axios.post(
        `https://storeapi.nestdex.dev/giveaway/join`,
        payload,
        { headers: { Authorization: authToken } }
      );

      if (response.status === 200) {
        return true;
      }

      return false;
    } catch (e) {
      console.log(e.response)
      // if (e.response?.status === 400) {
      //   return true;
      // }
    }
  }

  const repeatCheckGiveaway = async () => {
    if (giveawayType === "success_joined") return;
    if (giveawayType === "checking") return;

    try {
      setGiveawayType("checking");

      const join = await joinGiveaway(giveawayId);

      if (join) {
        setGiveawayType("online_giveaway");
        return;
      }

      setTimeout(() => {
        setGiveawayType("error");
      }, 1200);
    } catch (e) {
      console.error(e);
    }
  };

  const getReferalGiveaway = async () => {
    const userId = userProfile.id;
    const botUsername = import.meta.env.VITE_BOT.replace('@', '');
    const link = `https://t.me/${botUsername}/store?startapp=liveGiveaway_${giveawayId}_${userId}`;
    setGiveawayReferralLink(link);
  }

  useEffect(() => {
    getReferalGiveaway();
  }, []);

  const isGiveawayNotEnded = (end_time: string) => {
    const targetTime = new Date(end_time);

    const now = new Date();
    if (now <= targetTime) {
      setLoadingParticipants(false);
      return true;
    }
    return false;
  };

  const isGiveawayEnded = (end_time: string) => {
    const targetTime = new Date(end_time);

    const now = new Date();
    if (now > targetTime) {
      setGiveawayType("ended");
      setLoadingParticipants(true);
      return true;
    }
    return false;
  };

  // useEffect(() => {
  //   if (isGiveawayEnded()) return;
  
  //   const interval = setInterval(() => {
  //     if (isGiveawayEnded()) clearInterval(interval);
  //   }, 2000);
  
  //   return () => clearInterval(interval);
  // }, [selectedGiveaway]);

  if (isLoading || !selectedGiveaway) return null;

  return (
    <>
      {giveawayType === "participant" && (
        <section className={styles.mainGray}>
          <HeadingWidget headRarity={giveawayRarity} headType={giveawayType} giveaway={{ ...selectedGiveaway, ended: false }} countMembers={participants.length} />
          <ConditionsWidget type={giveawayType} giveaway={selectedGiveaway} />
          <div className={styles.openBottomBlocker}>
            <ButtonWidget
              button={{ type: "participate" }}
              onClick={() => {
                repeatCheckGiveaway();
              }}
            />
          </div>
        </section>
      )}

      {giveawayType === "checking" && (
        <section className={cn(styles.main, styles[`giveaway-${giveawayRarity}`])}>
          <div className={styles.header}>
            <div className={styles.headerHolder}>
              <img width={122} height={20} src="/photos/logo-white.svg" alt="" />
            </div>
          </div>
          <div className={styles.openChecking}>
            <DotLottieReact
              style={{ width: "100px", height: "100px" }}
              src="/photos/giveaways/loading-spin.json"
              autoplay
              loop
            />
            <p className={styles.openCheckingText}>{t("giveawayOpen.title.checking")}</p>
          </div>
        </section>
      )}

      {giveawayType === "error" && (
        <section className={cn(styles.main, styles[`giveaway-${giveawayRarity}`])}>
          <div className={styles.header}>
            <div className={styles.headerHolder}>
              <img width={122} height={20} src="/photos/logo-white.svg" alt="" />
            </div>
          </div>
          <div className={styles.openError}>
            <img src="/photos/giveaways/danger.svg" alt="" />
            <p className={styles.openCheckingText}>{t("giveawayOpen.error.title")}</p>
          </div>
          <div className={styles.openBottomBlocker}>
            <ConditionsWidget type={giveawayType} giveaway={selectedGiveaway} />
            <ButtonWidget
              button={{ type: "repeat" }}
              onClick={() => {
                repeatCheckGiveaway();
              }}
            />
          </div>
        </section>
      )}

      {giveawayType === "success_joined" && (
        <section className={cn(styles.main, styles[`giveaway-${giveawayRarity}`])}>
          <div className={styles.header}>
            <div className={styles.headerHolder}>
              <img width={122} height={20} src="/photos/logo-white.svg" alt="" />
            </div>
          </div>
          <div className={styles.openJoined}>
            <img width={85} height={90} src={`/photos/giveaways/giveaway-${giveawayRarity}.png`} alt="" />
            <div className={styles.openJoinedBadges}>
              <span>
                <p>{selectedGiveaway?.gifts_ids.length} {t("giveawayOpen.gifts")}</p>
              </span>
              <span>
                <img width={18} height={18} src="/photos/giveaways/giveaway-clock.svg" alt="" />
                <CountdownGiveaway endTime={selectedGiveaway?.end_time} />
              </span>
            </div>
            <div className={styles.openJoinedTitle}>
              <h4>{t("giveawayOpen.joined.title")}</h4>
            </div>
          </div>
          <div className={styles.openBottomBlocker}>
            <InfoWidget
              giveaway={selectedGiveaway}
            />
          </div>
        </section>
      )}

      {giveawayType === "online_giveaway" && (
        <section className={styles.mainGray}>
          <HeadingWidget headRarity={giveawayRarity} headType={giveawayType} giveaway={{ ...selectedGiveaway, ended: false }} countMembers={participants.length} />
          <GiftsWidget gifts={selectedGiveaway?.gifts} />
          <ParticipantsWidget giveawayId={selectedGiveaway?.id} type={giveawayType} loading={loadingParticipants} participantsArray={participants} />
          <div className={styles.openBottomBlocker}>
            <ButtonWidget
              button={{ type: selectedGiveaway?.user_id === userProfile?.id ? "giveaway_link" : "referral_link" }}
              onClick={() => {
                copyToClipboard(giveawayReferralLink, t("copyToClipboard.copied"));
              }}
            />
          </div>
        </section>
      )}

      {giveawayType === "ended" && (
        <section className={styles.mainGray}>
          <HeadingWidget headRarity={giveawayRarity} headType={giveawayType} giveaway={{ ...selectedGiveaway, ended: true }} countMembers={participants.length} />
          <GiftsWidget gifts={selectedGiveaway?.gifts} />
          <ParticipantsWidget giveawayId={selectedGiveaway?.id} type={giveawayType} loading={false} participantsArray={participants} />
          <div className={styles.openBottomBlocker}>
            <ButtonWidget
              button={{ type: "go_to_store" }}
              onClick={() => {
                navigate("/store");
              }}
            />
          </div>
        </section>
      )}
    </>
  );
};

export default GiveawayOpen;