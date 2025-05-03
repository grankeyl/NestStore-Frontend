import { FC, FormEvent, useEffect, useRef, useState } from "react";
import { t } from "i18next";

import axios from "axios";
import cn from "classnames";

import styles from "./Create.module.scss";
import stylesStore from "./../../Store/Store.module.scss";

import Modal from "@components/Modal";
import Checkbox from "@components/ui/checkbox";

import { useUserGiftsObserver } from "./hooks/useUserGiftsObserver";

import { IGift } from "@types";
// import { useFiltersStore } from "@stores/shop.store";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { getModelLottie, getNftBackground, getSymbolLottie } from "@utils/nftUtils";
import { useNavigate } from "react-router";
import { showToast } from "@utils/showToast";
// import i18n from "@i18n";
// import { Locales } from "@tonconnect/ui-react";
import UseTelegram from "@hooks/useTelegram";
import { validatePrice } from "@utils/formatBalance";
import { useUserProfile } from "@contexts/user-profile";
import { useCreateGiveawayStore } from "@stores/giveaway.store";

interface Props {
  isTokenReady: boolean;
}

const authToken = localStorage.getItem("token");

const Create: FC<Props> = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<"ru" | "en">(
    (localStorage.getItem("selectedLanguage") === "ru" || localStorage.getItem("selectedLanguage") === "en") 
      ? localStorage.getItem("selectedLanguage") as "ru" | "en" 
      : "ru"
  );
  // const [selectedLanguage, setSelectedLanguage] = useState<string>(i18n.language);

  const options = [
    {
      value: "subscription",
      label: t("giveawayCreate.select.subscription"),
    },
    {
      value: "subscription_paid_participant",
      label: t("giveawayCreate.select.subscriptionPaidParticipation"),
    },,
    {
      value: "subscription_paid_ticket",
      label: t("giveawayCreate.select.subscriptionPaidTicket"),
    },
    {
      value: "subscription_live",
      label: t("giveawayCreate.select.live"),
    }
  ];

  // const lang = selectedLanguage as Locales || localStorage.getItem("selectedLanguage");
  const lang = "ru";
  if (!lang) {
    setSelectedLanguage("ru");
  }

  const labels = {
    ru: {
      min: (n: number) => `${n} минут${n === 1 ? 'а' : ''}`,
      hour: (n: number) => `${n} час${n > 1 ? 'а' : ''}`,
      day: (n: number) => `${n} д${n === 1 ? 'ень' : 'ня'}`,
    },
    en: {
      min: (n: number) => `${n} minute${n > 1 ? 's' : ''}`,
      hour: (n: number) => `${n} hour${n > 1 ? 's' : ''}`,
      day: (n: number) => `${n} day${n > 1 ? 's' : ''}`,
    },
  };
  
  const formatLabel = (minutes: number): string => {
    if (minutes < 60) return labels[selectedLanguage].min(minutes);
    if (minutes < 1440) return labels[selectedLanguage].hour(minutes / 60);
    return labels[selectedLanguage].day(minutes / 1440);
  };
  
  const optionsTimersDefault = [
    5, 15, 30, 60, 180, 360, 720, 1440, 4320, 10080
  ].map(value => ({
    value,
    label: formatLabel(value)
  }));
  
  const optionsTimersLive = [1, 5, 10, 20, 30].map(value => ({
    value,
    label: formatLabel(value)
  }));

  type TelegramChannel = {
    id: number;
    title: string;
    username: string;
    image_url: string;
  };
  
  const { userProfile } = useUserProfile();
  const { createGiveawayChannels, setCreateGiveawayChannels } = useCreateGiveawayStore();

  const { webApp } = UseTelegram();
  const [selectedChannels, setSelectedChannels] = useState<TelegramChannel[]>(createGiveawayChannels);
  const [inputValue, setInputValue] = useState("");
  const [selected, setSelected] = useState("subscription");
  const [page, setPage] = useState("create");
  const [, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisibleTermsModal, setIsVisibleTermsModal] = useState(false);
  const [isVisibleHowToModal, setIsVisibleHowToModal] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [userGifts, setUserGifts] = useState<IGift[]>([]);
  const [selectedGifts, setSelectedGifts] = useState<any[]>([]);
  const [isActiveSwitchTeleramPremium, setIsActiveSwitchTeleramPremium] = useState(false);
  const lastItemRef = useRef<HTMLDivElement | null>(null);

  const [priceCreate, setPriceCreate] = useState(0);

  // const filters = useFiltersStore((state) => state);
  // const [_, setQuantity] = useState(1);

  const [priceParticipation, setPriceParticipation] = useState(0);
  const [priceTicket, setPriceTicket] = useState(0);
  const [participants, setParticipants] = useState(0);
  const [timeDefault, setTimeDefault] = useState(5);
  const [timeLive, setTimeLive] = useState(1);

  const navigate = useNavigate();
  
  useEffect(() => {
    if (location.pathname === "/giveaway/create") {
      webApp.BackButton.show();
      webApp.BackButton.onClick(
        () => {
          navigate("/giveaways");
        },
      );
      return () => {
        webApp.BackButton.hide();
        webApp.BackButton.offClick(
          () => {
            navigate("/giveaways");
          }
        );
      };
    } else {
      webApp.BackButton.hide();
    }
  }, [location.pathname, navigate]);

  const handleSelect = (option: string) => {
    setSelected(option);
    setIsOpen(false);
  };

  const handleTimeDefaultChange = (option: string) => {
    setTimeDefault(Number(option));
  };

  const handleTimeLiveChange = (option: string) => {
    setTimeLive(Number(option));
  };

  const handleChangePriceParticipation = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPriceParticipation(Number(e.target.value));
  };

  const handleChangePriceTicket = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPriceTicket(Number(e.target.value));
  };

  const handleChangeParticipants = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParticipants(Number(e.target.value));
  };

  const handleBlur = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
  
    const channel = await searchChannel(trimmed);
    if (!channel) return;
  
    const isDuplicate = selectedChannels.some(
      (ch) => ch.username.toLowerCase() === channel.username.toLowerCase()
    );
  
    if (isDuplicate) return;
  
    let updatedChannels = [...selectedChannels, channel];
  
    if (updatedChannels.length > 8) {
      updatedChannels = updatedChannels.slice(1);
    }
  
    setSelectedChannels(updatedChannels);
    setCreateGiveawayChannels(updatedChannels);
    setInputValue("");
  };

  const removeChannel = (username: string) => {
    setSelectedChannels(selectedChannels.filter(ch => ch.username !== username));
    setCreateGiveawayChannels(selectedChannels.filter(ch => ch.username !== username));
  };

  const handleClickTerms = () => {
    setIsVisibleTermsModal(!isVisibleTermsModal);
  };

  const handleClickHowToChannel = () => {
    webApp.openTelegramLink(`https://t.me/${import.meta.env.VITE_BOT.replace('@', '')}?startchannel&admin=post_messages+edit_messages+delete_messages`);
  };

  const handleClickSetPage = (page: string) => {
    setPage(page);
  };

  const getUserGifts = async (newOffset: number = 0) => {
    try {
      const response = await axios.get("https://apistore.nestdex.dev/user/gifts", {
        headers: { Authorization: authToken },
        params: {
          offset: newOffset,
          limit: 20
        },
      });

      const gifts = response.data;

      if (gifts.length === 0) {
        setHasMore(false);
        return;
      }

      setUserGifts((prevGifts) => {
        const updatedGifts = newOffset === 0 ? gifts : [...prevGifts, ...gifts];
        return updatedGifts
          .filter((gift: any, index: number, self: any) => self.findIndex((g: any) => g.id === gift.id) === index)
          .sort((a: any, b: any) => a.id - b.id);
      });
    } catch (e) {
      console.error(e);
    } finally {}
  };

  const selectGift = (gift: any) => {
    setSelectedGifts((prev) => {
      if (prev.some((m) => m.id === gift.id)) {
        return prev.filter((m) => m.id !== gift.id);
      }
      return [...prev, gift];
    });
  };

  const removeGift = (giftId: any) => {
    setSelectedGifts((prev) => prev.filter((m) => m.id !== giftId));
  };

  useEffect(() => {
    if (selectedGifts.length === 0) {
      setPriceCreate(0);
    } else {
      setPriceCreate(selectedGifts.length * 0.1);
    }
  }, [selectedGifts]);

  const searchChannel = async (username: string) => {
    const finalUsername = username.replace("@", "");

    try {
      const response = await axios.get(`https://apistore.nestdex.dev/telegram/channel/${finalUsername}`, {
        headers: { Authorization: authToken }
      });

      const data = response.data;
      return data;
    } catch (e) {
      console.error(e);
    } finally {}
  }

  const createGiveaway = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!selected) {
      return;
    }

    if (selectedGifts.length === 0) {
      showToast(t("giveawayCreate.toast.nullGifts"), "error");
      setIsSubmitting(false);
      return;
    }

    if (selectedChannels.length === 0) {
      showToast(t("giveawayCreate.toast.nullChannels"), "error");
      setIsSubmitting(false);
      return;
    }

    if (!userProfile) {
      return;
    }

    if (userProfile?.balance < priceCreate) {
      showToast(t("giveawayCreate.toast.notEnoughMoney"), "error");
      setIsSubmitting(false);
      return;
    }
    
    try {
      let price: number;
      let endTime: number;
    
      switch (selected) {
        case "subscription":
          price = 0;
          endTime = timeDefault;
          break;
        case "subscription_paid_participant":
          price = priceParticipation;
          endTime = timeDefault;
          break;
        case "subscription_paid_ticket":
          price = priceTicket;
          endTime = timeDefault;
          break;
        case "subscription_live":
          price = 0;
          endTime = timeLive;
          break;
        default:
          throw new Error("Invalid subscription type");
      }

      const currentTime = new Date();
      const endTimeCurrent = new Date(currentTime.getTime() + endTime * 60000);
      const finalEndTime = endTimeCurrent.toISOString();

      const dataArray = {
        type: selected,
        gifts_ids: selectedGifts.map(g => g.id),
        channels_usernames: selectedChannels.map(g => g.username),
        quantity_members: participants,
        end_time: finalEndTime,
        price: price,
        is_premium: isActiveSwitchTeleramPremium,
      };

      const response = await axios.post(
        `https://apistore.nestdex.dev/giveaway/create`,
        dataArray,
        {
          headers: { Authorization: authToken },
        }
      );

      if (response.status === 200) {
        navigate("/giveaways");
      }
    } catch (e) {
      if (axios.isAxiosError(e)) {
        if (e.response) {
          const status = e.response.status;
          if (status === 400) {
            const message = (t("giveawayCreate.toast.notFoundBotToChannels") as string).replace("@", import.meta.env.VITE_BOT);
            showToast(message, "error")
          } else if (status === 403) {
            showToast(t("giveawayCreate.toast.notFoundAdminToChannels"), "error")
          }
        } else {
          console.error('Ошибка без ответа от сервера', e.message);
        }
      } else {
        console.error('Непредвиденная ошибка', e);
      }
    } finally {
      setIsSubmitting(false);
    }
  }
       
  useEffect(() => {
    setIsSubmitting(false);
    getUserGifts();
  }, [page]);
  
  useUserGiftsObserver(userGifts, lastItemRef, false, getUserGifts, hasMore);


  return (
    <section className={styles.main}>

      <Modal isVisible={isVisibleHowToModal} setIsVisible={setIsVisibleHowToModal} type="storeCard">
        <div className={styles.giveawayModalTermsHead}>
          <h4>{t("giveawayCreate.modal.howto.title")}</h4>
        </div>
        <div className={styles.giveawayModalTerms}>
          <p>{t("giveawayCreate.modal.howto.terms1")} <b>@nestore_robot</b> {t("giveawayCreate.modal.howto.terms2")}</p>
          <span>{t("giveawayCreate.modal.howto.terms3")}</span>
          <p className={styles.textRed}>{t("giveawayCreate.modal.howto.terms4")}</p>
          <p>{t("giveawayCreate.modal.howto.terms5")}</p>
        </div>
        <div className={styles.blockered}>
          <button onClick={handleClickHowToChannel} className={cn(styles.giveawayModalButton)}>
            <span>{t("giveawayCreate.modal.howto.button")}</span>
          </button>
        </div>
      </Modal>

      <Modal isVisible={isVisibleTermsModal} setIsVisible={setIsVisibleTermsModal} type="storeCard">
        <div className={styles.giveawayModalTermsHead}>
          <h4>{t("giveawayCreate.modal.terms.title")}</h4>
        </div>
        <div className={styles.giveawayModalTerms}>
          <span>{t("giveawayCreate.modal.terms.terms1")}</span>
          <p>{t("giveawayCreate.modal.terms.terms2")}</p>
          <span>{t("giveawayCreate.modal.terms.terms3")}</span>
          <p>{t("giveawayCreate.modal.terms.terms4")}</p>
          <span>{t("giveawayCreate.modal.terms.terms5")}</span>
          <p>{t("giveawayCreate.modal.terms.terms6")}</p>
          <span>{t("giveawayCreate.modal.terms.terms7")}</span>
          <p>{t("giveawayCreate.modal.terms.terms8")}</p>
        </div>
        <button onClick={handleClickTerms} className={cn(styles.giveawayModalButton)}>
          <span>{t("giveawayCreate.modal.terms.button")}</span>
        </button>
      </Modal>

      {page === 'choose_gifts' && (
        <>
          <div className={styles.header}>
            <h1 className={styles.headline}>{t("giveawayChoose.title")}</h1>
          </div>

          {!userGifts?.length && (
            <div className={styles.empty}>
              <img width={62} height={70} src="/photos/giveaways/empty.png" alt="" />
              <p className={styles.emptyDescription}>
                {t("giveaway.gifts.not")}
              </p>
            </div>
          )}

          <div className={styles.myGifts}>
            <div className={styles.myGiftsItems}>
              {userGifts
                .filter(gift => !gift.is_active)
                .map((gift, index) =>
                  gift && gift.id ? (
                    <div 
                      onClick={() => selectGift(gift)}
                      ref={userGifts.length === index + 1 ? lastItemRef : null} 
                      key={`${gift?.id}-${index}`}
                      className={cn(stylesStore.nftsListItem, stylesStore.backdrop)}
                      style={{
                        background: `radial-gradient(circle,
                          ${getNftBackground(gift?.background_name)?.centerColor || '#4d5254'} 0%,
                          ${getNftBackground(gift?.background_name)?.edgeColor || '#313638'} 100%),
                          ${getNftBackground(gift?.background_name)?.patternColor || '#000000'}`,
                      }}
                    >
                      <div className={styles.checkbox}>
                        <Checkbox
                          value={gift?.type}
                          type="checkbox"
                          id={gift?.type}
                          name={gift?.type}
                          checked={selectedGifts.some((g) => g.id === gift.id)}
                          onChange={() => selectGift(gift)}
                        />
                      </div>
                      <div className={stylesStore.nftsListItemImage}>
                        <button className={stylesStore.nftsListItemImageButton}>
                          <div className={stylesStore.nftsListItemImageButtonFull}>
                            <div className={stylesStore.nftsListItemImageButtonFullRelative}>
                              <div className={stylesStore.nftsListItemImageButtonFullRelativePad}></div>
                              <div className={stylesStore.nftsListItemImageButtonFullRelativeAbsolute}>
                                <DotLottieReact className={stylesStore.bgGift} src={getModelLottie(gift?.type, gift?.model_name)} />
                                <div className={stylesStore.patternBg}>
                                  <div className={stylesStore.patternBgGrid}>
                                    {Array.from({ length: 15 }).map((_, i) => (
                                      <img
                                        key={i}
                                        src={getSymbolLottie(gift?.type, gift?.pattern_name as any)}
                                        alt=""
                                        style={{ '--index': i } as any}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <div className={cn(stylesStore.nftsListItemBadge, styles.nftsListItemBadge)}>
                                  <div className={cn(stylesStore.badge, styles.badge)}>
                                    <p>#{gift?.number}</p>
                                  </div>
                                </div>
                                <div className={stylesStore.nftsListItemTitle}>
                                  <h4>{gift?.type}</h4>
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  ) : null
                )}
            </div>
          </div>
          
          <button onClick={() => handleClickSetPage('create')} className={cn(styles.button, styles.buttonBottomScreen, styles.default, { [styles.hidden]: selectedGifts?.length === 0 })} disabled={isSubmitting}>
            <span>{t("giveawayChoose.button.select1")} {selectedGifts.length} {t("giveawayChoose.button.select2")}</span>
          </button>

        </>
      )}

      {page === 'create' && (
        <>
          <div className={styles.header}>
            <h1 className={styles.headline}>{t("giveawayCreate.title")}</h1>
          </div>
    
          <a onClick={() => setIsVisibleHowToModal(!isVisibleHowToModal)} target="_blank" className={styles.partner}>
            <span>{t("giveawayCreate.howto")}</span>
            <img src="/photos/store/partnerIcon.svg" alt="batya" />
          </a>
    
          <div className={styles.createGiveawayBlock}>
            <div className={styles.createGiveawayBlockLabel}>
              <h4>{t("giveawayCreate.choose")}</h4>
            </div>

            {selectedGifts.length === 0 && (
              <div onClick={() => handleClickSetPage('choose_gifts')} className={styles.createGiveawayBlockContent}>
                <span><img width={12} height={12} src="/photos/giveaways/addPrimary.svg" alt="" /></span>
              </div>
            )}

            {selectedGifts.length > 0 && (
              <div className={styles.createGiveawayBlockContent}>
                  <div className={styles.chooseGifts}>
                    {selectedGifts.map((gift) => (
                        <div
                          className={styles.chooseGiftsGift}
                          style={{
                            background: `radial-gradient(circle,
                              ${getNftBackground(gift?.background_name)?.centerColor || '#4d5254'} 0%,
                              ${getNftBackground(gift?.background_name)?.edgeColor || '#313638'} 100%),
                              ${getNftBackground(gift?.background_name)?.patternColor || '#000000'}`,
                          }}
                        >
                          <div onClick={() => removeGift(gift.id)} className={styles.chooseGiftsGiftClose}>
                            <img src="/photos/giveaways/close-white.svg" alt="" />
                          </div>
                          <DotLottieReact src={getModelLottie(gift.type, gift.model_name)} style={{ width: "57px", height: "57px" }} />
                        </div>
                    ))}
                    <div onClick={() => handleClickSetPage('choose_gifts')} className={cn(styles.chooseGiftsGift, styles.addingGifts)}>
                      <span><img width={12} height={12} src="/photos/giveaways/addPrimary.svg" alt="" /></span>
                    </div>
                  </div>
              </div>
            )}
          </div>
    
          <form className={styles.form} onSubmit={createGiveaway}>
            <div onClick={handleClickTerms} className={styles.infoBadge}>
              <img width={24} height={24} src="/photos/giveaways/info.svg" alt="" />
            </div>
    
                <div className={styles.block}>
                  <label htmlFor="startPrice" className={styles.label}>
                    <span>{t("giveawayCreate.form.label1")}</span>
                    <div className={styles.select}>
                      <img src="/photos/giveaways/chevrone-down.svg" alt="" />
                      <select className={styles.customSelect} onChange={(e) => handleSelect(e.target.value)} value={selected}>
                        <option disabled value="">
                          {t("giveawayCreate.select.option")}
                        </option>
                        {options.map((option) => (
                          <option key={option?.value} value={option?.value}>
                            {option?.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>
                  <label htmlFor="startPrice" className={cn(styles.label, styles.flexedPremium)}>
                    <span>{t("giveawayCreate.telegram.premium")}</span>
                    <span
                      className={`${styles.toggleswitch} ${isActiveSwitchTeleramPremium ? styles.active : ""}`}
                      onClick={() => setIsActiveSwitchTeleramPremium(!isActiveSwitchTeleramPremium)}
                    >
                      <span className={styles.toggleswitchThumb}></span>
                    </span>
                  </label>
                  {selected && selected === 'subscription_paid_participant' && (
                    <label htmlFor="startPrice" className={styles.label}>
                      <span>{t("giveawayCreate.form.label2")}</span>
                      <div className={styles.priceInput}>
                        <input type="number" min={0.05} step={0.001} max={9999} placeholder="0" onChange={handleChangePriceParticipation} name="price" />
                        <img className={styles.ton} src="/photos/ton.svg" alt="" width={20} height={20} />
                      </div>
                    </label>
                  )}
                  {selected && selected === 'subscription_paid_ticket' && (
                    <label htmlFor="startPrice" className={styles.label}>
                      <span>{t("giveawayCreate.form.label3")}</span>
                      <div className={styles.priceInput}>
                        <input type="number" min={0.05} step={0.001} placeholder="0" onChange={handleChangePriceTicket} name="price" />
                        <img className={styles.ton} src="/photos/ton.svg" alt="" width={20} height={20} />
                      </div>
                    </label>
                  )}
                  <label className={styles.label}>
                    <span>{t("giveawayCreate.form.label4")}</span>
                    <div className={styles.selectedItems}>
                      {selectedChannels.map((channel) => (
                        <div key={channel.id} className={styles.selectedItemsItem}>
                          <img width={24} height={24} src={channel.image_url} alt="" />
                          <h4>{channel.title}</h4>
                          <span onClick={() => removeChannel(channel.username)}>
                            <img width={8} height={8} src="/photos/giveaways/close.svg" alt="" />
                          </span>
                        </div>
                      ))}
                      <input
                        placeholder={t("giveawayCreate.form.label4.placeholder")}
                        name="selectChannels"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleBlur();
                          }
                        }}
                      />
                    </div>
                    <p className={styles.selectedItemsDescr}>{t("giveawayCreate.form.label4.descr")}</p>
                  </label>
                  {selected && selected !== 'subscription_live' && (
                  <label htmlFor="minStep" className={styles.label}>
                    {selected === "subscription_paid_ticket" && (
                      <span>{t("giveawayCreate.form.label5.ticket")}</span>
                    )}
                    {selected !== "subscription_paid_ticket" && (
                      <span>{t("giveawayCreate.form.label5")}</span>
                    )}
                    <div className={styles.priceInput}>
                      <input type="number" min={1} step={1} placeholder="0" onChange={handleChangeParticipants} name="quantity" />
                    </div>
                    <p className={styles.selectedItemsDescr}>{t("giveawayCreate.form.label5.descr")}</p>
                  </label>
                  )}
                  {selected && selected !== 'subscription_live' && (
                  <label htmlFor="endTime" className={styles.label}>
                    <span>{t("giveawayCreate.form.label6")}</span>
                    <div className={styles.priceInput}>
                      <select
                        className={styles.customSelect}
                        onChange={(e) => handleTimeDefaultChange(e.target.value)}
                        value={timeDefault}
                      >
                        <option disabled value={0}>
                          {t("giveawayCreate.select.option")}
                        </option>
                        {optionsTimersDefault.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <img className={styles.ton} src="/photos/gift/calendar.svg" alt="" width={25} height={25} />
                    </div>
                  </label>
                  )}
                  {selected && selected === 'subscription_live' && (
                  <label htmlFor="endTime" className={styles.label}>
                    <span>{t("giveawayCreate.form.label6")}</span>
                    <div className={styles.priceInput}>
                      <select
                        className={styles.customSelect}
                        onChange={(e) => handleTimeLiveChange(e.target.value)}
                        value={timeLive}
                      >
                        <option disabled value={0}>
                        {t("giveawayCreate.select.option")}
                        </option>
                        {optionsTimersLive.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <img className={styles.ton} src="/photos/gift/calendar.svg" alt="" width={25} height={25} />
                    </div>
                  </label>
                  )}
                </div>

            <button className={cn(styles.button, styles.buttonBottomScreen)} type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("app.loading") : <span>{t("giveawayCreate.button")}</span>}
              <div className={styles.price}>
                <span>{validatePrice(priceCreate)}</span>
                <img src="/photos/ton.svg" alt="" />
              </div>
            </button>
          </form>
        </>
      )}

    </section>
  );
};

export default Create;