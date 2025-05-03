// @ts-nocheck

import { useMemo } from "react";
import { FC, useEffect, useState } from "react";
import stylesStore from "./../Store/Store.module.scss";
import styles from "./Giveaways.module.scss";
import cn from "classnames";
import { useOrdersStore } from "@stores/orders.store";
import axios from "axios";
import { formatDate } from "@utils/formatDate";
import { useUserProfile } from "@contexts/user-profile";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { t } from "i18next";
import { GiftType, IOrder } from "@types";
import { showToast } from "@utils/showToast";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import UseTelegram from "@hooks/useTelegram";
import { Link } from "react-router-dom";
import Modal from "@components/Modal";
import { giftTypeBackdrops } from "@data/gifts";
import { getRarity, giveawayGetRarity, giveawayStartCountdown } from "@utils/useGiveaways";
import { getModelLottie, getNftBackground } from "@utils/nftUtils";
import { copyToClipboard } from "@utils/copyToClipboard";
import { validatePrice } from "@utils/formatBalance";

const filters = ["All orders", "Buy", "Sell", "Closed"];

const authToken = localStorage.getItem("token");


function isGiveawayEnded(endTime: number | string | Date | undefined): boolean {
  if (!endTime) return false;
  return new Date(endTime).getTime() < Date.now();
}

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

const Giveaways: FC = () => {  
  document.body.classList.remove("no-padding");

  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  const { webApp } = UseTelegram();
  const { userProfile } = useUserProfile();
  
  const { giveawayId } = useParams<{ giveawayId?: string }>();
  const [isVisibleGiveawayModal, setIsVisibleGiveawayModal] = useState(false);
  const [isVisibleSayHelloModal, setIsVisibleSayHelloModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [switchGiveawayType, setSwitchGiveawayType] = useState<string>("your");
  const [giveaways, setGiveaways] = useState<any[]>([]);
  const [history, setHistory] = useState([]);

  const [meGiveaways, setMeGiveaways] = useState<any[]>([]);
  const [allGiveaways, setAllGiveaways] = useState<any[]>([]);
  const [participatedGiveaways, setParticipatedGiveaways] = useState<any[]>([]);

  const [selectedGiveaway, setSelectedGiveaway] = useState<any>();
  const [amountTickets, setAmountTickets] = useState<number>(1);
  const [amount, setAmount] = useState<number>(0);

  const [showMoreGifts, setShowMoreGifts] = useState(false);
  
  const setIsVisible = useOrdersStore((state) => state.setIsModalOpen);

  const handleSetSwitchGiveawayType = (type: string) => {
    setSwitchGiveawayType(type);
    initGiveaways();
  };

  useEffect(() => {
    if (giveawayId) {
      setTimeout(() => {
        handleModalGiveaway(Number(giveawayId));
      }, 300);
    }
  }, [giveawayId]);

  const initGiveaways = async () => {
    setLoading(true);

    try {
      setTimeout(() => {
        setLoading(false);
        setGiveaways(['test']);
      }, 455);
    } catch (e) {
      console.error(e);
    }
  }

  const handleOpenCreateGiveaway = () => {
    navigate("/giveaway/create");
  };

  const handleModalGiveaway = async (id: number) => {
    setShowMoreGifts(false);

    try {
      const response = await axios.post(
        `https://storeapi.nestdex.dev/giveaway/${id}`,
        {},
        { headers: { Authorization: authToken } }
      );

      if (response.status === 200) {
        setSelectedGiveaway(response.data);
        setIsVisibleGiveawayModal(true);
        setIsVisibleSayHelloModal(!localStorage.getItem("sayHello"));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getMeGiveaways = async () => {
    try {
      const response = await axios.post(
        "https://storeapi.nestdex.dev/giveaways",
        {},
        {
          params: { type: "user" },
          headers: { Authorization: authToken },
        }
      );

      if (response.status === 200) {
        const meGiveaways = response.data
          .filter((g: any) => g.user_id === userProfile?.id)
          .sort((a: any, b: any) => a.id - b.id);
      
        const participatedGiveaways = response.data
          .filter((g: any) => g.participants_ids.includes(userProfile?.id))
          .sort((a: any, b: any) => a.id - b.id);
      
        setParticipatedGiveaways(participatedGiveaways);
        setMeGiveaways(meGiveaways);
      }
    } catch (e) {
      console.error(e);
    }
  }

  const getAllGiveaways = async () => {
    try {
      const response = await axios.post(
        "https://storeapi.nestdex.dev/giveaways",
        {},
        {
          params: { type: "all" },
          headers: { Authorization: authToken },
        }
      );

      if (response.status === 200) {
        setAllGiveaways(response.data);
        console.log(allGiveaways);
      }
    } catch (e) {
      console.error(e);
    }
  }

  const addTicket = async () => {
    setAmountTickets((prev) => Math.min(prev + 1, 9999));
  }
  
  const removeTicket = async () => {
    setAmountTickets((prev) => Math.max(prev - 1, 0));
  }

  const getAmount = async () => {
    if (!selectedGiveaway) return 0;

    if (selectedGiveaway?.type === "subscription_paid_participant") {
     setAmount(selectedGiveaway?.price)
    }

    if (selectedGiveaway?.type === "subscription_paid_ticket") {
      setAmount(amountTickets * selectedGiveaway?.price)
    }
  }

  const itsMe = useMemo(() => {
    if (!userProfile) return false;
    return selectedGiveaway?.user_id === userProfile.id;
  }, [userProfile, selectedGiveaway]);

  const isNullGiveaways = useMemo(() => {
    if (loading) return false;
  
    if (switchGiveawayType === "your") {
      return meGiveaways.length === 0;
    }
  
    if (switchGiveawayType === "all") {
      return allGiveaways.length === 0;
    }
  
    if (switchGiveawayType === "participates") {
      return participatedGiveaways.length === 0;
    }
  
    return true;
  }, [switchGiveawayType, meGiveaways, allGiveaways, participatedGiveaways, loading]);

  useEffect(() => {
    getAmount();
  }, [amountTickets, selectedGiveaway]);

  useEffect(() => {
    initGiveaways();
    getMeGiveaways();
    getAllGiveaways();
  }, []);

  const handleShowMoreGifts = () => {
    setShowMoreGifts(true);
  }

  const isUserParticipated = useMemo(() => {
    if (!userProfile) return false;
    return selectedGiveaway?.participants_ids.includes(userProfile?.id);
  }, [userProfile, selectedGiveaway]);

  const joinGiveaway = async (id: number) => {
    try {
      if ((selectedGiveaway?.type !== 'subscription' && !userProfile?.balance) || selectedGiveaway?.type !== 'subscription' && userProfile.balance < amount) {
        showToast(t("store.errors.topUpBalanceGiveaway", { price: amount }), "error");
        return;
      }

      if (selectedGiveaway?.is_premium && !userProfile?.is_premium) {
        showToast(t("store.errors.premiumRequired"), "error");
        return;
      }

      if (isGiveawayEnded(selectedGiveaway?.end_time)) {
        showToast(t("store.errors.giveaway.ended"), "error");
        return;
      }

      if (
        selectedGiveaway?.type === 'subscription' &&
        selectedGiveaway?.quantity_members > 0 &&
        selectedGiveaway?.participants_ids.length >= selectedGiveaway?.quantity_members
      ) {
        showToast(t("store.errors.giveaway.full"), "error");
        return;
      }

      const response = await axios.post(
        `https://storeapi.nestdex.dev/giveaway/join`,
        { 
          id: id,
          referrer_id: selectedGiveaway.user_id,
          count_tickets: amountTickets
        },
        { headers: { Authorization: authToken } }
      );

      if (response.status === 200) {
        navigate(`/giveaway/open/${id}`);
      }
    } catch (e) {
      if (axios.isAxiosError(e)) {
        if (e.response) {
          const status = e.response.status;
          if (status === 402) {
            const message = (t("giveawayCreate.toast.notFoundGifter") as string).replace("@", import.meta.env.VITE_GIFTER);
            showToast(message, "error")
          }
        } else {
          console.error('Ошибка без ответа от сервера', e.message);
        }
      } else {
        console.error('Непредвиденная ошибка', e);
      }

      showToast(t("store.errors.giveawayNotFound"), "error");
    }
  }

  const redirectToLiveGiveaway = () => {
    navigate(`/giveaway/open/${selectedGiveaway?.id}`);
  }

  const copyGiveawayLink = () => {
    if (selectedGiveaway?.type === "subscription_live") {
      const link = `https://t.me/nestore_robot?startapp=liveGiveaway_${selectedGiveaway?.id}`;
      copyToClipboard(link, t("copyToClipboard.copied"));
    } else {
      const link = `https://t.me/nestore_robot?startapp=giveaway_${selectedGiveaway?.id}`;
      copyToClipboard(link, t("copyToClipboard.copied"));
    }
  }

  const getCountDuplicates = () => {
    const duplicates = selectedGiveaway?.participants_ids.filter(x => x === userProfile?.id)
    return duplicates.length;
  }

  const getCountUsersDuplicates = () => {
    const uniqueCount = new Set(selectedGiveaway?.participants_ids).size;
    return uniqueCount;
  }

  const openGiveaway = (id: number) => {
    navigate(`/giveaway/open/${id}`);
  }

  const sayHelloGoWrite = () => {
    localStorage.setItem("sayHello", true);
    setIsVisibleSayHelloModal(false);
    webApp.openTelegramLink('https://t.me/' + import.meta.env.VITE_GIFTER.replace('@', ''));
  };

  const sayHelloClose = () => {
    localStorage.setItem("sayHello", true);
    setIsVisibleSayHelloModal(false);
  };

  return (
    <section className={styles.main}>

      <Modal isVisible={isVisibleSayHelloModal} setIsVisible={setIsVisibleSayHelloModal} paddingTop={24} type="storeCard" style={{ zIndex: 10000 }}>
        <div className={stylesStore.sayHelloHead}>
          <h4>{t("modal.sayhello.title")}</h4>
        </div>
        <div className={stylesStore.sayHelloDescr}>
          <p>{t("modal.giveaway.sayhello.descr").replace("@", import.meta.env.VITE_GIFTER)}</p>
        </div>
        <div className={stylesStore.sayHelloImage}>
          <img src="/photos/store/say-hello.png" alt="" />
        </div>
        <button onClick={sayHelloGoWrite} className={cn(stylesStore.button, stylesStore.sayHelloButton)}>
          {t("modal.sayhello.button")}
        </button>
      </Modal>

      <Modal isVisible={isVisibleGiveawayModal} setIsVisible={setIsVisibleGiveawayModal} type="storeCard">

        <div className={cn(styles.giveawaysItemsItem, styles[giveawayGetRarity(selectedGiveaway?.gifts_ids.length)])}>
          <div className={cn(styles.giveawaysItemsItemImage, styles.modalGiveawayImage)}>
            <img width={85} height={90} src={`/photos/giveaways/giveaway-${giveawayGetRarity(selectedGiveaway?.gifts_ids.length)}.png`} alt="" />
            <a
              onClick={copyGiveawayLink}
              className={cn(stylesStore.button, stylesStore.buttonModal, stylesStore.shareButton, stylesStore.cardShared, styles.shareButton)}
            >
              <img width={15} height={15} src="/photos/store/share.svg" alt="" />
            </a>
          </div>
          <div className={styles.giveawaysItemsItemContent}>
            {selectedGiveaway?.type === "subscription_paid_ticket" && getCountDuplicates() > 0 && (
              <div className={styles.flexed}>
                <div className={styles.giveawaysItemsItemContentCount}>
                  <span className={styles.flexed} style={{ marginBottom: '4px' }}>
                    <img src="/photos/giveaways/ticket.svg" alt="" />
                    <p className={styles.resetText}>{getCountDuplicates()} {t("giveaway.item.tickets")}</p>
                  </span>
                </div>
              </div>
            )}
            <div className={styles.flexed}>
              <div className={styles.giveawaysItemsItemContentCount}>
                <span>{selectedGiveaway?.gifts_ids.length} {t("giveaway.item.gifts")}</span>
              </div>
              <div className={styles.giveawaysItemsItemContentCount}>
                <span className={styles.flexed}>
                  <img src="/photos/giveaways/giveaway-clock.svg" alt="" />
                  <CountdownGiveaway endTime={selectedGiveaway?.end_time} />
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {(showMoreGifts || selectedGiveaway?.gifts_ids.length) <= 8 && (
          <div
            className={cn(
              styles.giveawaysModalGifters,
              styles.giveawaysModalGiftersBlockered,
              {
                [styles.giveawaysModalGiftersBlockeredOpened]: showMoreGifts,
              }
            )}
          >
            {showMoreGifts && (
              <div className={styles.giveawaysModalGiftersNoMoreDivOpened}>
                <div onClick={() => setShowMoreGifts(false)} className={styles.giveawaysModalGiftersNoMoreDivIcon}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M4.81078 7.14863C5.00485 6.90604 5.35883 6.86671 5.60141 7.06078L9.00002 9.77967L12.3986 7.06078C12.6412 6.86671 12.9952 6.90604 13.1893 7.14863C13.3833 7.39121 13.344 7.74519 13.1014 7.93926L9.35141 10.9393C9.14598 11.1036 8.85407 11.1036 8.64863 10.9393L4.89863 7.93926C4.65604 7.74519 4.61671 7.39121 4.81078 7.14863Z" fill="#8380FF"/>
                  </svg>
                </div>
              </div>
            )}

            {selectedGiveaway?.gifts.map((gift, index) => (
              <>
                <div 
                  key={index}
                  className={`${styles.giveawaysModalGiftersCard} ${styles.backdrop}`}
                  style={{
                    background: `radial-gradient(circle,
                      ${getNftBackground(gift.background_name).centerColor || '#4d5254'} 0%,
                      ${getNftBackground(gift.background_name).edgeColor || '#313638'} 100%),
                      ${getNftBackground(gift.background_name).patternColor || '#000000'}`,
                  }}
                >
                  <DotLottieReact src={getModelLottie(gift.type, gift.model_name)} style={{ width: "52px", height: "52px" }} />
                </div>
              </>
            ))}
          </div>
        )}

        {!showMoreGifts && selectedGiveaway?.gifts_ids.length > 8 && (
          <div className={cn(styles.giveawaysModalGifters, styles.giveawaysModalGiftersNoMore)}>
            <div className={styles.giveawaysModalGiftersNoMoreDiv}>
              <div onClick={() => handleShowMoreGifts()} className={styles.giveawaysModalGiftersNoMoreDivIcon}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M4.81078 7.14863C5.00485 6.90604 5.35883 6.86671 5.60141 7.06078L9.00002 9.77967L12.3986 7.06078C12.6412 6.86671 12.9952 6.90604 13.1893 7.14863C13.3833 7.39121 13.344 7.74519 13.1014 7.93926L9.35141 10.9393C9.14598 11.1036 8.85407 11.1036 8.64863 10.9393L4.89863 7.93926C4.65604 7.74519 4.61671 7.39121 4.81078 7.14863Z" fill="#8380FF"/>
                </svg>
              </div>
            </div>

            {selectedGiveaway?.gifts.map((gift, index) => (
              <>
                <div 
                  key={index}
                  className={`${styles.giveawaysModalGiftersCard} ${styles.backdrop}`}
                  style={{
                    background: `radial-gradient(circle,
                      ${getNftBackground(gift.background_name).centerColor || '#4d5254'} 0%,
                      ${getNftBackground(gift.background_name).edgeColor || '#313638'} 100%),
                      ${getNftBackground(gift.background_name).patternColor || '#000000'}`,
                  }}
                >
                  <DotLottieReact src={getModelLottie(gift.type, gift.model_name)} style={{ width: "52px", height: "52px" }} />
                </div>
              </>
            ))}
          </div>
        )}

        <dl className={styles.list}>
          <div className={styles.listContent}>
            <dd className={styles.listBlocker}>
              <dt className={styles.listBlockerLabel}>{t("giveaway.modal.table.label2")}</dt>
            </dd>
            <dd className={styles.description}>
              {selectedGiveaway?.end_time && (
                <dt className={styles.listBlockerText}>{formatDate(selectedGiveaway?.end_time)}</dt>
              )}
            </dd>
          </div>
          {selectedGiveaway?.price > 0 && (
          <div className={styles.listContent}>
            <dd className={styles.listBlocker}>
              <dt className={styles.listBlockerLabel}>{t("giveaway.modal.table.label3")}</dt>
            </dd>
            <dd className={cn(styles.description, styles.flexed)}>
              <dt className={styles.listBlockerText}>{selectedGiveaway?.price}</dt>
              <img width={24} height={24} src="/photos/ton.svg" alt="" />
            </dd>
          </div>
          )}
          {selectedGiveaway?.type !== "subscription_paid_ticket" && selectedGiveaway?.quantity_members > 0 && (
            <div className={styles.listContent}>
              <dd className={styles.listBlocker}>
                <dt className={styles.listBlockerLabel}>{t("giveaway.modal.table.label4")}</dt>
              </dd>
              <dd className={styles.description}>
                <dt className={styles.listBlockerText}>
                  {selectedGiveaway?.participants_ids.length}/{selectedGiveaway?.quantity_members}
                </dt>
              </dd>
            </div>
          )}
          {selectedGiveaway?.type === "subscription_paid_ticket" && (
            <div className={styles.listContent}>
              <dd className={styles.listBlocker}>
                <dt className={styles.listBlockerLabel}>{t("giveaway.modal.table.label5")}</dt>
              </dd>
              <dd className={styles.description}>
                <dt className={styles.listBlockerText}>
                  {selectedGiveaway?.quantity_members}
                </dt>
              </dd>
            </div>
          )}
          {selectedGiveaway?.type === "subscription_paid_ticket" && (
            <div className={styles.listContent}>
              <dd className={styles.listBlocker}>
                <dt className={styles.listBlockerLabel}>{t("giveaway.modal.table.label6")}</dt>
              </dd>
              <dd className={styles.description}>
                <dt className={styles.listBlockerText}>
                  {selectedGiveaway?.participants_ids.length}
                </dt>
              </dd>
            </div>
          )}
          {selectedGiveaway?.quantity_members === 0 && (
            <div className={styles.listContent}>
              <dd className={styles.listBlocker}>
                <dt className={styles.listBlockerLabel}>{t("giveaway.modal.table.label4")}</dt>
              </dd>
              <dd className={styles.description}>
                <dt className={styles.listBlockerText}>
                  {selectedGiveaway?.participants_ids.length}/∞
                </dt>
              </dd>
            </div>
          )}
        </dl>

        <div className={styles.giveawayModalTerms}>
          <h4>{t("giveaway.modal.terms.title")}</h4>
          {["subscription", "subscription_live"].includes(selectedGiveaway?.type) && (
            <p>
              {t("giveaway.modal.terms.descr1")}
              <span>&nbsp;
                {selectedGiveaway?.channels_usernames.map((channel, index) => {
                  const isFullUrl = channel.startsWith("https://");
                  const username = isFullUrl ? channel : `https://t.me/${channel}`;
                  const label = isFullUrl ? channel : `@${channel}`;
                  return (
                    <a key={index} href={username} target="_blank" rel="noreferrer">
                      {label}
                      {index !== selectedGiveaway.channels_usernames.length - 1 && ", "}
                    </a>
                  );
                })}
              </span>&nbsp;
              {t("giveaway.modal.terms.descr2")}
            </p>
          )}
          {selectedGiveaway?.type === "subscription_paid_participant" && (
            <p>
              {t("giveaway.modal.terms.descr1")}
              <span>&nbsp;
                {selectedGiveaway?.channels_usernames.map((channel, index) => {
                  const isFullUrl = channel.startsWith("https://");
                  const username = isFullUrl ? channel : `https://t.me/${channel}`;
                  const label = isFullUrl ? channel : `@${channel}`;
                  return (
                    <a key={index} href={username} target="_blank" rel="noreferrer">
                      {label}
                      {index !== selectedGiveaway.channels_usernames.length - 1 && ", "}
                    </a>
                  );
                })}
              </span>&nbsp;
              {t("giveaway.modal.terms.descr3")}
            </p>
          )}
          {selectedGiveaway?.type === "subscription_paid_ticket" && (
            <p>
              {t("giveaway.modal.terms.descr1")}
              <span>&nbsp;
                {selectedGiveaway?.channels_usernames.map((channel, index) => {
                  const isFullUrl = channel.startsWith("https://");
                  const href = isFullUrl ? channel : `https://t.me/${channel}`;
                  const label = isFullUrl ? channel : `@${channel}`;
                  return (
                    <a key={index} href={href} target="_blank" rel="noreferrer">
                      {label}
                      {index !== selectedGiveaway.channels_usernames.length - 1 && ", "}
                    </a>
                  );
                })}
              </span>&nbsp;
              {t("giveaway.modal.terms.descr4")}
            </p>
          )}
        </div>

        {!selectedGiveaway?.ended && selectedGiveaway?.type !== "subscription_paid_ticket" && isUserParticipated && !itsMe && (
          <button className={cn(styles.giveawayModalButton, styles.already)}>
            <span>{t("giveaway.modal.button.already")}</span>
          </button>
        )}

        {!selectedGiveaway?.ended && selectedGiveaway?.type === "subscription" && !itsMe && !isUserParticipated && (
          <button onClick={() => joinGiveaway(selectedGiveaway?.id)} className={cn(styles.giveawayModalButton)}>
            <span>{t("giveaway.modal.button.participate")}</span>
          </button>
        )}

        {!selectedGiveaway?.ended && selectedGiveaway?.type === "subscription_paid_participant" && !itsMe && !isUserParticipated && (
          <button onClick={() => joinGiveaway(selectedGiveaway?.id)} className={cn(styles.giveawayModalButton, styles.participate)}>
            <span>{t("giveaway.modal.button.participate")}</span>
            <div className={styles.price}>
              <span>{amount}</span>
              <img src="/photos/ton.svg" alt="" />
            </div>
          </button>
        )}
        
        {!selectedGiveaway?.ended && selectedGiveaway?.type === "subscription_paid_ticket" && !itsMe && (
          <div className={`${styles.listButtons}`}>
            <div className={styles.giveawayModalCounter}>
              <div onClick={removeTicket} className={styles.giveawayModalCounterRemove}>
                <img width={10} height={10} src="/photos/giveaways/remove.svg" alt="" />
              </div>
              <div className={styles.giveawayModalCounterText}>
                <h4>{amountTickets}</h4>
              </div>
              <div onClick={addTicket} className={styles.giveawayModalCounterAdd}>
                <img width={10} height={10} src="/photos/giveaways/add.svg" alt="" />
              </div>
            </div>
            <button onClick={() => joinGiveaway(selectedGiveaway?.id)} className={cn(styles.giveawayModalButton, styles.participate)}>
              <span>{t("giveaway.modal.button.participate")}</span>
              <div className={styles.price}>
                <span>{validatePrice(amount)}</span>
                <img src="/photos/ton.svg" alt="" />
              </div>
            </button>
          </div>
        )}

        {!selectedGiveaway?.ended && selectedGiveaway?.type === "subscription_live" && !itsMe && !isUserParticipated && (
          <button onClick={() => joinGiveaway(selectedGiveaway?.id)} className={cn(styles.giveawayModalButton)}>
            <span>{t("giveaway.modal.button.participate")}</span>
          </button>
        )}

        {!selectedGiveaway?.ended && selectedGiveaway?.type === "subscription_live" && isUserParticipated && !itsMe && (
          <button onClick={() => openGiveaway(selectedGiveaway?.id)} className={cn(styles.giveawayModalButton, styles.marginNone)}>
            <span>{t("giveaway.modal.button.open.live")}</span>
          </button>
        )}

      </Modal>
      
      <div className={styles.header}>
        <h1 className={styles.headline}>{t("giveaway.title")}</h1>
      </div>

      <div className={cn(styles.switch, styles.priceInput)}>
        <button 
          onClick={() => handleSetSwitchGiveawayType("your")} 
          type="button"
          className={cn(styles.switchButton, { [styles.checked]: switchGiveawayType === "your" })}
        >
          <span className={styles.switchText}>{t("giveaway.switch.label1")}</span>
        </button>
        <button 
          onClick={() => handleSetSwitchGiveawayType("all")} 
          type="button"
          className={cn(styles.switchButton, { [styles.checked]: switchGiveawayType === "all" })}
        >
          <span className={styles.switchText}>{t("giveaway.switch.label2")}</span>
          {allGiveaways && allGiveaways.length > 0 && (
            <div className={styles.switchSpanner}>
              <p>{allGiveaways.length}</p>
            </div>
          )}
        </button>
        <button 
          onClick={() => handleSetSwitchGiveawayType("participates")} 
          type="button"
          className={cn(styles.switchButton, { [styles.checked]: switchGiveawayType === "participates" })}
        >
          <span className={styles.switchText}>{t("giveaway.switch.label3")}</span>
        </button>
      </div>

      {loading && (
        <div className={styles.loading}>
          <img width={33} height={33} src="/photos/giveaways/loading.svg" alt="" />
        </div>
      )}

      {!loading && isNullGiveaways && (
        <div className={styles.empty}>
          <img width={62} height={70} src="/photos/giveaways/empty.png" alt="" />
          {switchGiveawayType === "your" && <p className={styles.emptyDescription}>{t("giveaway.not")}</p>}
          {switchGiveawayType === "all" && <p className={styles.emptyDescription}>{t("giveaway.not")}</p>}
          {switchGiveawayType === "participates" && <p className={styles.emptyDescription}>{t("giveaway.not2")}</p>}
        </div>
      )}

      {!loading && !isNullGiveaways && (
        <div className={styles.giveawaysItems}>
          
          {switchGiveawayType === "your" &&
            meGiveaways.map((giveaway, index) => (
              <div
                key={index}
                onClick={() => handleModalGiveaway(giveaway.id)}
                className={cn(
                  styles.giveawaysItemsItem,
                  styles[giveawayGetRarity(giveaway.gifts_ids.length)]
                )}
              >
                <div className={styles.giveawaysItemsItemImage}>
                  <img 
                    width={65}
                    height={67}
                    src={`/photos/giveaways/giveaway-${giveawayGetRarity(giveaway.gifts_ids.length)}.png`}
                    alt=""
                  />
                </div>
                <div className={styles.giveawaysItemsItemContent}>
                  <div className={styles.giveawaysItemsItemContentTitle}>
                    <h4>{t("giveaway.item.title")}</h4>
                  </div>
                  <div className={styles.giveawaysItemsItemContentCount}>
                    <span>
                      <img src="/photos/giveaways/gift.svg" alt="" />
                      <p>{giveaway.gifts_ids.length}</p>
                    </span>
                  </div>
                </div>
                <div className={styles.giveawaysItemsItemClock}>
                  <img src="/photos/giveaways/giveaway-clock.svg" alt="" />
                  <CountdownGiveaway endTime={giveaway.end_time} />
                </div>
              </div>
            ))
          }

          {switchGiveawayType === "all" &&
            allGiveaways.map((giveaway, index) => {
              if (userProfile?.id !== giveaway.user_id) {
                return (
                  <div
                    key={index + 100}
                    onClick={() => handleModalGiveaway(giveaway.id)}
                    className={cn(
                      styles.giveawaysItemsItem,
                      styles[giveawayGetRarity(giveaway.gifts_ids.length)]
                    )}
                  >
                    <div className={styles.giveawaysItemsItemImage}>
                      <img 
                        width={65}
                        height={67}
                        src={`/photos/giveaways/giveaway-${giveawayGetRarity(giveaway.gifts_ids.length)}.png`}
                        alt=""
                      />
                    </div>
                    <div className={styles.giveawaysItemsItemContent}>
                      <div className={styles.giveawaysItemsItemContentTitle}>
                        <h4>{t("giveaway.item.title")}</h4>
                      </div>
                      <div className={styles.giveawaysItemsItemContentCount}>
                        <span>
                          <img src="/photos/giveaways/gift.svg" alt="" />
                          <p>{giveaway.gifts_ids.length}</p>
                        </span>
                        {giveaway?.participants_ids.includes(userProfile?.id) && (
                          <span className={styles.giveawaysItemsItemContentCountParticipants}>
                            <img src="/photos/done.svg" alt="" />
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={styles.giveawaysItemsItemClock}>
                      <img src="/photos/giveaways/giveaway-clock.svg" alt="" />
                      <CountdownGiveaway endTime={giveaway.end_time} />
                    </div>
                  </div>
                );
              }
              return null;
            })}

          {switchGiveawayType === "participates" &&
            participatedGiveaways.map((giveaway, index) => (
              <div
                key={index}
                onClick={() => handleModalGiveaway(giveaway.id)}
                className={cn(
                  styles.giveawaysItemsItem,
                  styles[giveawayGetRarity(giveaway.gifts_ids.length)]
                )}
              >
                <div className={styles.giveawaysItemsItemImage}>
                  <img 
                    width={65}
                    height={67}
                    src={`/photos/giveaways/giveaway-${giveawayGetRarity(giveaway.gifts_ids.length)}.png`}
                    alt=""
                  />
                </div>
                <div className={styles.giveawaysItemsItemContent}>
                  <div className={styles.giveawaysItemsItemContentTitle}>
                    <h4>{t("giveaway.item.title")}</h4>
                  </div>
                  <div className={styles.giveawaysItemsItemContentCount}>
                    <span>
                      <img src="/photos/giveaways/gift.svg" alt="" />
                      <p>{giveaway.gifts_ids.length}</p>
                    </span>
                  </div>
                </div>
                <div className={styles.giveawaysItemsItemClock}>
                  <img src="/photos/giveaways/giveaway-clock.svg" alt="" />
                  <CountdownGiveaway endTime={giveaway.end_time} />
                </div>
              </div>
            ))
          }
        </div>
      )}

      <div onClick={handleOpenCreateGiveaway} className={styles.createGiveaway}>
        <button>
          {t("giveaway.button")}
        </button>
      </div>
    </section>
  );
};

export default Giveaways;
