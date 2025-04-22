// @ts-nocheck

import { FC, FormEvent, useEffect, useRef, useState } from "react";
import styles from "./Gift.module.scss";
import stylesStore from "./../Store/Store.module.scss";
import cn from "classnames";
import Modal from "@components/Modal";
import axios, { AxiosError } from "axios";
import { GiftType, IGift } from "@types";
import useGiftTypeImages from "@hooks/useGiftTypeImages.ts";
import { useUserProfile } from "@contexts/user-profile";
import { showToast } from "@utils/showToast";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { t } from "i18next";
import { Link, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { giftTypeBackdrops } from "@data/gifts";
import { useFiltersStore } from "@stores/shop.store";
import { useUserGiftsObserver } from "./hooks/useUserGiftsObserver";
import { useFetchGiftById } from "./hooks/useFetchGiftById";
import { getModelLottie, getNftBackground, getNftLottie, getSymbolLottie } from "@utils/nftUtils";
import { InputMask } from '@react-input/mask';
import UseTelegram from "@hooks/useTelegram";
import i18n from "@i18n";
import ConfirmModal from "@components/Confirm";

interface Props {
  isTokenReady: boolean;
}

const locales = {
  en: [
    { label: "5 min", value: 5 },
    { label: "15 min", value: 15 },
    { label: "30 min", value: 30 },
    { label: "1 hour", value: 60 },
    { label: "6 hours", value: 360 },
    { label: "12 hours", value: 720 },
    { label: "24 hours", value: 1440 }
  ],
  ru: [
    { label: "5 мин", value: 5 },
    { label: "15 мин", value: 15 },
    { label: "30 мин", value: 30 },
    { label: "1 час", value: 60 },
    { label: "6 часов", value: 360 },
    { label: "12 часов", value: 720 },
    { label: "24 часа", value: 1440 }
  ]
};


function GiftBGItem({ gift, style }: { gift: any, style?: any }) {
  const [isLottieAvailable, setIsLottieAvailable] = useState(null);

  useEffect(() => {
    const checkLottie = async () => {
      try {
        const res = await fetch(getNftLottie(gift.type, gift.number), { method: 'HEAD' });
        setIsLottieAvailable(res.ok);
      } catch {
        setIsLottieAvailable(false);
      }
    };

    checkLottie();
  }, [gift.type, gift.number]);

  if (isLottieAvailable === null) return null;

  return (
    <div>
      {isLottieAvailable ? (
        <DotLottieReact src={getNftLottie(gift.type, gift.number)} />
      ) : (
        <DotLottieReact src={getModelLottie(gift.type, gift.model_name)} autoplay />
      )}
    </div>
  );
}


const getAuctionTimes = (lang: "en" | "ru") => locales[lang];

const Gift: FC<Props> = ({ isTokenReady }) => {
  const navigate = useNavigate();
  
  const authToken = localStorage.getItem("token");

  const [selectedLanguage, setSelectedLanguage] = useState<"ru" | "en">(
    (localStorage.getItem("selectedLanguage") === "ru" || localStorage.getItem("selectedLanguage") === "en") 
      ? localStorage.getItem("selectedLanguage") as "ru" | "en" 
      : "ru"
  );

  const { webApp } = UseTelegram();
  const [page, setPage] = useState<string>("myGifts");
  const [sellGiftSection, setSellGiftSection] = useState<string>("sell");

  const [selectedGiftType, setSelectedGiftType] = useState<GiftType>("durovs_cap");
  const [selectedImage, setSelectedImage] = useState<string>("https://store.nestdex.dev/images/durovs_cap/durov_cap_1.json");
  const [isVisible, setIsVisible] = useState(false);
  const [isVipModalVisible, setIsVipModalVisible] = useState(false);
  const [tempSelectedImage, setTempSelectedImage] = useState<string>(selectedImage);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMyGift, setSelectedMyGift] = useState<any>();
  const [selectedItem, setSelectedItem] = useState<IGift>();

  const [isVisibleCardGift, setIsVisibleCardGift] = useState(false);
  const [isVisibleInfoGift, setIsVisibleInfoGift] = useState(false);
  const [isVisibleEditGift, setIsVisibleEditGift] = useState(false);

  const [hasMore, setHasMore] = useState(true);
  const [isAuctionGift, setIsAuctionGift] = useState(false);
  const [isVipGift, setIsVipGift] = useState(false);
  const filters = useFiltersStore((state) => state);
  const [giftTypeImages] = useGiftTypeImages();

  const [amountSellGiftValue, setAmountSellGiftValue] = useState("");
  const [amountAuctionGiftValue, setAmountAuctionGiftValue] = useState("");
  const [amountAuctionStepGiftValue, setAmountAuctionStepGiftValue] = useState("");
  const [auctionEndTime, setAuctionEndTime] = useState(360);

  const [isSellGiftConfirmVisible, setIsSellGiftConfirmVisible] = useState(false);
  const [isDeleteGiftConfirmVisible, setIsDeleteGiftConfirmVisible] = useState(false);
  
  const [totalAmount, setTotalAmount] = useState(0.0);
  const [editPriceGift, setEditPriceGift] = useState(0.0);

  let lastItemRef = useRef<HTMLDivElement | null>(null);

  const { userProfile } = useUserProfile();

  let [userGifts, setUserGifts] = useState<any[]>([]);

  const updateSelectedImage = (type: GiftType) => {
    const firstImageUrl = giftTypeImages[type]?.[0] || "";
    setSelectedImage(firstImageUrl);
    setTempSelectedImage(firstImageUrl);
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

  const handleCardClick = async (id: any) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`https://apistore.nestdex.dev/user/gifts/${id.toString()}`, {
        headers: { Authorization: authToken },
      });
      setSelectedItem(response.data);
      setIsVisibleCardGift(true);
      setIsVisibleInfoGift(false);
    } catch (e) {
      console.error(e);
      showToast(t("store.errors.notFound"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetIsAuctionGift = (isAuction: boolean) => {
    setTotalAmount(0);
    setIsAuctionGift(isAuction);

    if (isAuction) {
      setIsVipGift(false);
    }

    setSellGiftSection(isAuction ? "auction" : "sell");
  };

  const handleClickByGift = async () => {
    try {
      if (!selectedItem?.price) return;
      if (!userProfile?.balance) {
        showToast(t("store.errors.topUpBalance", { price: selectedItem.price.toFixed(1) }), "error");
        return;
      }
      if (selectedItem.price > userProfile.balance) {
        showToast(t("store.errors.insufficientBalance", { amount: (selectedItem.price - userProfile.balance).toFixed(1) }), "error");
        return;
      }
      const response = await axios.post("https://apistore.nestdex.dev/market/order/buy", { id: selectedItem?.id }, { headers: { Authorization: authToken } });
      if (response.status === 200) navigate("/orders");
    } catch (error) {
      showToast(t("store.errors.somethingWentWrong"), "error");
      console.error(error);
    }
  };

  const handleSellGift = async (id: any) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`https://apistore.nestdex.dev/user/gifts/${id}`, {
        headers: { Authorization: authToken },
      });
      setSelectedItem(response.data);
      setPage("sellGift");
    } catch (e) {
      console.error(e);
      showToast(t("store.errors.notFound"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGift = async (id: any) => {
    try {
      const response = await axios.get(`https://apistore.nestdex.dev/user/gifts/${id.toString()}`, {
        headers: { Authorization: authToken },
      });
      setSelectedItem(response.data);

      const getGiftMarket = await axios.get(`https://apistore.nestdex.dev/market/gifts/${id.toString()}`, {
        headers: { Authorization: authToken },
      });

      const giftMarket = getGiftMarket.data;

      if (giftMarket.bids.length > 1) {
        showToast(t("auction.on"), "error");
      } else {
        setIsDeleteGiftConfirmVisible(true);
      }
    } catch (error) {
      showToast(t("store.errors.somethingWentWrong"), "error");
      console.error(error);
    }
  };

  const handleWithdrawGift = async (id: any) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`https://apistore.nestdex.dev/user/gifts/withdraw`,
        { id: id },
        {
          headers: { Authorization: authToken },
        }
      );
      setIsVisibleInfoGift(false)
      showToast(t("gift.modal.info.gift.withdraw"), "success");
      setUserGifts(prevGifts => prevGifts.filter(gift => gift.id !== id));
    } catch (e) {
      const message = (t("giveawayCreate.toast.notFoundGifter") as string).replace("@", import.meta.env.VITE_GIFTER);
      showToast(message, "error")
    } finally {
      setIsLoading(false);
    }
  };

  const convertToUtc = (dateTime: any) => {
    const [time, date] = dateTime.split(" ");
    const [day, month, year] = date.split(".").map(Number);
    const [hours, minutes] = time.split(":").map(Number);

    const localDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    return localDate.toISOString();
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    const giftBase = {
      gift_id: selectedItem?.id,
      is_vip: isVipGift
    };

    // if (userProfile.balance < 0.1) {
    //   showToast(t("gift.topUpBalance"), "error");
    //   return;
    // }

    if (isVipGift && userProfile.balance < 3) {
      showToast(t("gift.topUpBalanceVip"), "error");
      return;
    }

    setIsSellGiftConfirmVisible(true);
  };

  const openStore = () => {
    navigate("/");
  };

  const handleModalImageClick = (imageUrl: string) => {
    setTempSelectedImage(imageUrl);
  };

  const handleModalSelect = () => {
    setSelectedImage(tempSelectedImage);
    setIsVisible(false);
  };

  const handleSuccessModalClose = () => {
    setIsSuccessModalVisible(false);
    setPage("myGifts");
  };

  const handleModalInfoGift = (gift: object) => {
    setSelectedMyGift(gift);
    setIsVisibleInfoGift(!isVisibleInfoGift);
  };

  const openGifter = () => {
    webApp.openTelegramLink('https://t.me/' + import.meta.env.VITE_GIFTER.replace('@', ''));
  };

  const handleSellGiftConfirm = async () => {
    const giftBase = {
      gift_id: selectedItem?.id,
      is_vip: isVipGift
    };

    let endTime;

    if (sellGiftSection === "auction") {
      const currentTime = new Date();
      const endTimeCurrent = new Date(currentTime.getTime() + auctionEndTime * 60000);
      endTime = endTimeCurrent.toISOString();

      if (new Date(endTime) <= new Date()) {
        showToast(t("gift.auction.endTimeError"), "error");
        setIsSubmitting(false);
        return;
      }
    }

    const gift = sellGiftSection === "auction"
      ? { 
        ...giftBase, 
        price: Number(amountAuctionGiftValue),
        min_step: Number(amountAuctionStepGiftValue),
        auction_end_time: endTime
      }
      : { 
        ...giftBase, 
        price: Number(amountSellGiftValue)
      };
    
    try {
      const response = await axios.post(
        "https://apistore.nestdex.dev/market/order/create",  gift, {
          headers: {
            Authorization: authToken,
            "Content-Type": "application/json",
            "Accept": "*/*",
          },
        }
      );
  
      if (response.status === 200) {
        if (gift.is_vip) { userProfile.balance -= 3; }
        if (gift.min_step) { userProfile.balance -= gift.price; }
  
        setIsSuccessModalVisible(true);
        setUserGifts(prevGifts => 
          prevGifts.map(gift => 
            gift.id === selectedItem?.id ? { ...gift, is_active: true } : gift
          )
        );
      }
    } catch (error) {
      if ((error as AxiosError).status === 400) {
        showToast(t("gift.giftAlreadyExists"), "error");
        return;
      }
      showToast(t("gift.somethingWentWrong"), "error");
      console.error(error);
    } finally {
      setIsSubmitting(false);
      setIsSellGiftConfirmVisible(false);
    }
  };

  const handleDeleteGiftConfirm = async () => {
    try {
      const response = await axios.post(
        `https://apistore.nestdex.dev/user/gifts/remove`, { id: selectedItem?.id }, {
          headers: { Authorization: authToken },
        }
      );

      if (response.status === 200) {
        setIsVisibleInfoGift(false)
        showToast(t("gift.modal.info.gift.delete"), "success");
        setUserGifts(prevGifts => 
          prevGifts.map(gift => 
            gift.id === selectedItem?.id ? { ...gift, is_active: false } : gift
          )
        );
      }
    } catch (e) {
      if (axios.isAxiosError(e)) {
        console.error(e.response);
      } else {
        console.error(e);
      }
      showToast(t("store.errors.notFound"), "error");
    } finally {
      setIsLoading(false);
      setIsDeleteGiftConfirmVisible(false);
    }
  };

  const handleEditGift = async (id: any) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`https://apistore.nestdex.dev/user/gifts/${id}`, {
        headers: { Authorization: authToken },
      });
      setSelectedItem(response.data);
      setEditPriceGift(selectedMyGift.price);
      setIsVisibleEditGift(true);
    } catch (e) {
      console.error(e);
      showToast(t("store.errors.notFound"), "error");
    } finally {
      setIsLoading(false);
    }
  }

  const handleEditGiftChange = async (id: any) => {
    try {
      setIsLoading(true);

      if (0.05 > userProfile.balance) {
        showToast(t("store.errors.insufficientBalance", { amount: (0.05 - userProfile.balance).toFixed(1) }), "error");
        return;
      }

      const response = await axios.post(`https://apistore.nestdex.dev/user/gifts/${id}`,
        { price: editPriceGift },
        { headers: { Authorization: authToken } }
      );

      setIsVisibleEditGift(false);
      showToast(t("gift.modal.edit.success"), "success");
    } catch (e) {
      console.error(e);
      showToast(t("store.errors.notFound"), "error");
    } finally {
      setIsLoading(false);
    }
  }
  
  useEffect(() => {
    getUserGifts();
  }, [isTokenReady, filters]);

  useEffect(() => {
    if (!isSellGiftConfirmVisible) {
      setIsSubmitting(false);
    }
  }, [isSellGiftConfirmVisible]);

  useFetchGiftById(isTokenReady, authToken, setSelectedItem, setIsVisibleCardGift);
  useUserGiftsObserver(userGifts, lastItemRef, false, getUserGifts, hasMore);

  return (
    <section className={styles.main}>
      <ConfirmModal
        isVisible={isSellGiftConfirmVisible}
        setIsVisible={setIsSellGiftConfirmVisible}
        headline={t("modal.confirm.headline")}
        onConfirm={handleSellGiftConfirm}
        onCancel={() => setIsSellGiftConfirmVisible(false)}
      >
      </ConfirmModal>

      <ConfirmModal
        isVisible={isDeleteGiftConfirmVisible}
        setIsVisible={setIsDeleteGiftConfirmVisible}
        headline={t("modal.confirm.headline")}
        onConfirm={handleDeleteGiftConfirm}
        onCancel={() => setIsDeleteGiftConfirmVisible(false)}
      >
      </ConfirmModal>

      <Modal isVisible={isVisibleCardGift} setIsVisible={setIsVisibleCardGift} type="storeCard">
        <div 
          className={`${stylesStore.card} ${stylesStore.backdrop}`}
          style={{ 
            background: `radial-gradient(circle,  
              ${getNftBackground(selectedItem?.background_name)?.centerColor || '#4d5254'} 0%,
              ${getNftBackground(selectedItem?.background_name)?.edgeColor || '#313638'} 100%),
              ${getNftBackground(selectedItem?.background_name)?.patternColor || '#000000'}`
          }}
        >
          <div onClick={() => setIsVisibleCardGift(false)} className={stylesStore.closeModalBtn}>
            <img src="/photos/close-white.svg" alt="" />
          </div>
          <div className={stylesStore.patternBg}>
            <div className={stylesStore.patternBgGrid}>
              {Array.from({ length: 15 }).map((_, i) => (
                <img
                  key={i}
                  src={getSymbolLottie(selectedItem?.type, selectedItem?.pattern_name as any)}
                  alt=""
                  style={{
                    '--index': i,
                  } as any}
                />
              ))}
            </div>
          </div>
          <div className={stylesStore.patternBlocker}>
            <DotLottieReact src={getModelLottie(selectedItem?.type, selectedItem?.model_name as any)} style={{ width: "142px", height: "142px" }} autoplay loop />
            <h2 className={stylesStore.cardTitle}>{selectedItem?.type}</h2>
            <h3 className={stylesStore.cardSubtitle}>#{selectedItem?.number}</h3>
            <a
              target="_blank"
              href={`https://t.me/share/url?url=${encodeURIComponent(`https://t.me/nestore_robot?startapp=gift_${selectedItem?.id}`)}`}
              className={cn(stylesStore.button, stylesStore.buttonModal, stylesStore.shareButton, stylesStore.cardShared)}
            >
              <img width={24} height={24} src="/photos/store/share.svg" alt="" />
            </a>
          </div>
        </div>
        <dl className={stylesStore.list}>
          <div className={stylesStore.listContent}>
            <dd className={stylesStore.listBlocker}>
              <dt className={stylesStore.listBlockerLabel}>{t("store.model")}</dt>
              <dt className={stylesStore.listBlockerText}>{selectedItem?.model_name}</dt>
            </dd>
            <dd className={stylesStore.description}>
              <span className={cn(stylesStore.listBadge, stylesStore.info)}>{selectedItem?.model}%</span>
            </dd>
          </div>
          <div className={stylesStore.listContent}>
            <dd className={stylesStore.listBlocker}>
              <dt className={stylesStore.listBlockerLabel}>{t("store.pattern")}</dt>
              <dt className={stylesStore.listBlockerText}>{selectedItem?.pattern_name}</dt>
            </dd>
            <dd className={stylesStore.description}>
              <span className={cn(stylesStore.listBadge, stylesStore.info)}>{selectedItem?.pattern}%</span>
            </dd>
          </div>
          <div className={stylesStore.listContent}>
            <dd className={stylesStore.listBlocker}>
              <dt className={stylesStore.listBlockerLabel}>{t("store.background")}</dt>
              <dt className={stylesStore.listBlockerText}>{selectedItem?.background_name}</dt>
            </dd>
            <dd className={stylesStore.description}>
              <span className={cn(stylesStore.listBadge, stylesStore.info)}>{selectedItem?.background}%</span>
            </dd>
          </div>
        </dl>
        <button disabled={selectedItem?.seller_id === userProfile?.id} onClick={() => setIsVisibleCardGift(false)} className={cn(stylesStore.button, stylesStore.buttonModal)}>
          <span style={{ margin: 'auto' }}>{t("gifts.modal.gift.close")}</span>
        </button>
      </Modal>

      <Modal isVisible={isVipModalVisible} setIsVisible={setIsVipModalVisible} paddingTop={24} headline={t("gift.vip")}>
        <p className={styles.descriptionVip} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t("gift.descriptionVip")) }}></p>
        <div className={styles.cardsImageHolder}>
          <picture>
            <source media="(min-resolution: 2dppx)" srcSet="/photos/gift/cards2x.png" height={181} />
            <img src="/photos/gift/cards.png" alt="" height={181} />
          </picture>
        </div>
        <button onClick={() => setIsVipModalVisible(false)} className={cn(styles.button, styles.modal, styles.stars)}>
          {t("gift.okay")}
        </button>
      </Modal>

      <Modal isVisible={isSuccessModalVisible} setIsVisible={setIsSuccessModalVisible} paddingTop={24} headline={t("gift.createOrderModalTitle")}>
        <p className={styles.description} dangerouslySetInnerHTML={{ __html: t("gift.successModalDescription") }} />
        <a onClick={handleSuccessModalClose} className={cn(styles.buttonNotActive, styles.modal)}>
          {t("gift.okay")}
        </a>
      </Modal>

      <Modal isVisible={isVisible} setIsVisible={setIsVisible} paddingTop={24} headline={t("gift.selectImageGiftModalTitle")}>
        <div className={styles.modalItems}>
          {giftTypeImages[selectedGiftType]?.slice(0, 1).map((imageUrl, i) => (
            <button
              onClick={() => handleModalImageClick(imageUrl)}
              key={i}
              className={cn(styles.modalItem, {
                [styles.active]: imageUrl === tempSelectedImage,
              })}
            >
              <DotLottieReact src={imageUrl} style={{ width: "67px", height: "67px" }} autoplay />
            </button>
          )) || null}
        </div>
        <button className={cn(styles.modalButton, styles.button)} type="button" onClick={handleModalSelect}>
          {t("gift.select")}
        </button>
      </Modal>

      <Modal isVisible={isVisibleInfoGift} setIsVisible={setIsVisibleInfoGift} paddingTop={24} headline={t("gifts.modal.info.title")}>
        <div className={styles.ModalInfoGiftItems}>
            <div 
              onClick={() => handleCardClick(selectedMyGift.id)}
              className={styles.ModalInfoGiftItem}
            >
              <img width={24} height={24} src={"/photos/gift/info.svg"} alt="" />
              <h4>{t("gifts.modal.info.title.label1")}</h4>
            </div>
            {selectedMyGift?.is_active && !selectedMyGift?.min_step && (
              <div 
                onClick={() => handleEditGift(selectedMyGift.id)}
                className={styles.ModalInfoGiftItem}
              >
                <img width={24} height={24} src={"/photos/gift/calc.svg"} alt="" />
                <h4>{t("gifts.modal.info.title.change")}</h4>
              </div>
            )}
            {selectedMyGift?.is_active && (
              <div 
                onClick={() => handleDeleteGift(selectedMyGift.id)}
                className={styles.ModalInfoGiftItem}
              >
                <img width={24} height={24} src={"/photos/gift/close.svg"} alt="" />
                <h4>{t("gifts.modal.info.title.label2")}</h4>
              </div>
            )}
            {!selectedMyGift?.is_active && (
              <div 
                onClick={() => handleWithdrawGift(selectedMyGift.id)}
                className={styles.ModalInfoGiftItem}
              >
                <img width={24} height={24} src={"/photos/gift/withdraw.svg"} alt="" />
                <h4>{t("gifts.modal.info.title.label3")}</h4>
              </div>
            )}
        </div>
      </Modal>

      <Modal isVisible={isVisibleEditGift} setIsVisible={setIsVisibleEditGift} paddingTop={24} headline={t("gifts.modal.edit.title")}>
        <div className={styles.ModalInfoGiftItems}>
          <input
            min={0.1}
            step={0.1}
            required
            type="number"
            placeholder="0.00"
            name="amount"
            id="amount"
            className={styles.item}
            value={editPriceGift}
            onChange={(e) => setEditPriceGift(e.target.value)}
            max={99999}
          />
          <button className={cn(styles.editButton)} type="button" onClick={() => handleEditGiftChange(selectedMyGift?.id)}>
            <span>{t("gifts.modal.edit.button").replace("0", 0.05)}</span>
            <img src="/photos/ton.svg" alt="" width={20} height={20} />
          </button>
        </div>
      </Modal>

      {page === "myGifts" && (
        <>
          <div className={styles.header}>
            <h1 className={styles.headline}>{t("gift.title")}</h1>
          </div>

          <div className={styles.myGifts}>

            <div onClick={openGifter} className={styles.myGiftsSending}>
              <div className={styles.myGiftsSendingTitle}>
                <h4>{t("gifts.banner.title1")} <b>{import.meta.env.VITE_GIFTER}</b> {t("gifts.banner.title2")}</h4>
              </div>
              <div className={styles.myGiftsSendingChevrone}>
                <img src="/photos/chevrone-right.svg" alt="" />
              </div>
            </div>

            {!userGifts.length && (
              <div className={styles.empty}>
                <img width={62} height={70} src="/photos/giveaways/empty.png" alt="" />
                <p className={styles.emptyDescription}>
                  {t("giveaway.gifts.not")}
                </p>
              </div>
            )}

            <div className={stylesStore.nftsList}>
              {userGifts.map((gift, index) => (
                <div>
                  <div 
                    ref={userGifts.length === index + 1 ? lastItemRef : null} 
                    key={`${gift.id}-${index}`}
                    className={cn(stylesStore.nftsListItem, stylesStore.backdrop)}
                    style={{
                      background: `radial-gradient(circle,
                        ${getNftBackground(gift?.background_name)?.centerColor || '#4d5254'} 0%,
                        ${getNftBackground(gift?.background_name)?.edgeColor || '#313638'} 100%),
                        ${getNftBackground(gift?.background_name)?.patternColor || '#000000'}`,
                    }}
                  >
                    <div className={stylesStore.nftsListItemImage}>
                      <button 
                        onClick={() => handleCardClick(gift.id)}
                        className={stylesStore.nftsListItemImageButton}
                      >
                        <div className={stylesStore.nftsListItemImageButtonFull}>
                          <div className={stylesStore.nftsListItemImageButtonFullRelative}>
                            <div className={stylesStore.nftsListItemImageButtonFullRelativePad}></div>
                            <div className={stylesStore.nftsListItemImageButtonFullRelativeAbsolute}>
                              <DotLottieReact className={stylesStore.bgGift} src={getModelLottie(gift.type, gift.model_name)} autoplay loop />
                              <div className={stylesStore.patternBg}>
                                <div className={stylesStore.patternBgGrid}>
                                  {Array.from({ length: 15 }).map((_, i) => (
                                    <img
                                      key={i}
                                      src={getSymbolLottie(gift.type, gift.pattern_name as any)}
                                      alt=""
                                      style={{
                                        '--index': i,
                                      } as any}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div className={cn(stylesStore.nftsListItemBadge, styles.nftsListItemBadge)}>
                                <div className={cn(stylesStore.badge, styles.badge)}>
                                  <p>#{gift.number}</p>
                                </div>
                                {gift.is_active && gift.min_step > 0 && (
                                  <div className={cn(stylesStore.badge, styles.badge)}>
                                    <img src="/photos/gift/auction.svg" alt="" />
                                  </div>
                                )}
                                {gift.is_active && !gift.min_step && (
                                  <div className={cn(stylesStore.badge, styles.badge)}>
                                    <img src="/photos/gift/shop.svg" alt="" />
                                  </div>
                                )}
                              </div>
                              <div className={stylesStore.nftsListItemTitle}>
                                <h4>{gift.type}</h4>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                    <div className={`${styles.itemButtons}`}>
                      <button disabled={gift.is_active} onClick={() => handleSellGift(gift.id)} className={cn(stylesStore.button)}>
                        <div className={cn(styles.price, stylesStore.price)}>
                          <span>{t("gifts.sell")}</span>
                        </div>
                      </button>
                      <button onClick={() => handleModalInfoGift(gift)} className={`${styles.buttonBucket} ${stylesStore.buttonBucket}`}>
                        <img width={24} height={24} src="/photos/gift/dots.svg" alt="" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {page === "sellGift" && (
        <>
        <div className={styles.header}>
          <h1 className={styles.headline}>{t("sellGift.title")}</h1>
        </div>

        <div 
          className={cn(styles.sellGiftHead, styles.backdrop)}
          style={{ 
            background: `radial-gradient(circle,  
              ${getNftBackground(selectedItem?.background_name)?.centerColor || '#4d5254'} 0%,
              ${getNftBackground(selectedItem?.background_name)?.edgeColor || '#313638'} 100%),
              ${getNftBackground(selectedItem?.background_name)?.patternColor || '#000000'}`
          }}
        >
          <div className={styles.patternBg}>
            <div className={styles.patternBgGrid}>
              {Array.from({ length: 15 }).map((_, i) => (
                <img
                  key={i}
                  src={getSymbolLottie(selectedItem?.type, selectedItem?.pattern_name as any)}
                  alt=""
                  style={{
                    '--index': i,
                  } as any}
                />
              ))}
            </div>
          </div>
          <div className={styles.sellGiftHeadInner}>
            <DotLottieReact src={getModelLottie(selectedItem?.type, selectedItem?.model_name as any)} style={{ width: "142px", height: "142px" }} autoplay loop />
            <h2 className={stylesStore.cardTitle}>{selectedItem?.type}</h2>
            <span className={stylesStore.cardSubtitle}>#{selectedItem?.number}</span>
          </div>
        </div>

        <div className={cn(styles.sellGiftSwitch, styles.switch, styles.priceInput, { [styles.checked]: isAuctionGift })}>
          <button onClick={() => handleSetIsAuctionGift(false)} type="button" className={styles.switchButton}>
            <span className={styles.switchText}>{t("sellGift.sell")}</span>
          </button>
          <button onClick={() => handleSetIsAuctionGift(true)} type="button" className={styles.switchButton}>
            <span className={styles.switchText}>{t("sellGift.auction")}</span>
          </button>
        </div>

        {sellGiftSection === 'sell' && (
          <form className={cn(styles.form, styles.formPadding)} onSubmit={handleSubmit}>
            <div className={styles.block}>
              <label htmlFor="vip" className={styles.label}>
                <div className={styles.labelHeader}>
                  <span>{t("gift.vip")}</span>
                  <button onClick={() => setIsVipModalVisible(true)} type="button">
                    <img width={19} height={19} src="/photos/store/rareInfo.svg" alt="123" />
                  </button>
                </div>
                <div className={cn(styles.switch, styles.priceInput, { [styles.checked]: isVipGift })}>
                  <button onClick={() => setIsVipGift(false)} type="button" className={styles.switchButton}>
                    <span className={styles.switchText}>{t("gift.no")}</span>
                  </button>
                  <button onClick={() => setIsVipGift(true)} type="button" className={styles.switchButton}>
                    <span className={styles.switchText}>{t("gift.yes")}</span>
                  </button>
                </div>
              </label>
              <label htmlFor="price" className={styles.label}>
                <span>{t("gift.price")}</span>
                <div className={styles.priceInput}>
                  <input
                    min={0.1}
                    step={0.1}
                    required
                    type="number"
                    placeholder="0.00"
                    name="amount"
                    id="amount"
                    className={styles.item}
                    value={amountSellGiftValue}
                    onChange={(e) => setAmountSellGiftValue(e.target.value)}
                    max={99999}
                  />
                  <img className={styles.ton} src="/photos/ton.svg" alt="" width={20} height={20} />
                </div>
                <p className={styles.descriptionPrice}>
                  {!isVipGift && (t("sellGift.price.description"))}
                  {isVipGift && (t("sellGift.price.description").replace("0.1", 3))}
                </p>
              </label>
            </div>
            <button className={cn(styles.buttonCreate, styles.buttonBottomScreen, { [styles.vip]: isVipGift })} type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span>{t("gift.creating")}</span>
              ) : (
                <>
                  <span>{t("gift.create")}</span>
                  <div className={styles.price}>
                    <span>{isVipGift ? (3).toFixed(1) : (0.1).toFixed(1)}</span>
                    {!isVipGift && (
                      <>
                        <div className={styles.minusPrice}></div>
                        <span className={styles.salePrice}>0</span>
                      </>
                    )}
                    <img src="/photos/ton.svg" alt="" />
                  </div>
                </>
              )}
            </button>
          </form>
        )}

        {sellGiftSection === 'auction' && (
          <form className={cn(styles.form, styles.formPadding)} onSubmit={handleSubmit}>
            <div className={styles.block}>
              <label htmlFor="startPrice" className={styles.label}>
                <span>{t("sellGift.auction.label1")}</span>
                <div className={styles.priceInput}>
                  <input
                    min={0.1}
                    step={0.1}
                    required
                    type="number"
                    placeholder="0.00"
                    name="amount"
                    id="amount"
                    className={styles.item}
                    value={amountAuctionGiftValue}
                    onChange={(e) => setAmountAuctionGiftValue(e.target.value)}
                    max={99999}
                  />
                  <img className={styles.ton} src="/photos/ton.svg" alt="" width={20} height={20} />
                </div>
              </label>
              <label htmlFor="minStep" className={styles.label}>
                <span>{t("sellGift.auction.label2")}</span>
                <div className={styles.priceInput}>
                  <input
                    min={0.1}
                    step={0.1}
                    required
                    type="number"
                    placeholder="0.00"
                    name="amount"
                    id="amount"
                    className={styles.item}
                    value={amountAuctionStepGiftValue}
                    onChange={(e) => setAmountAuctionStepGiftValue(e.target.value)}
                    max={99999}
                  />
                  <img className={styles.ton} src="/photos/ton.svg" alt="" width={20} height={20} />
                </div>
              </label>
              <label htmlFor="endTime" className={styles.label}>
                <span>{t("sellGift.auction.label3")}</span>
                <div className={styles.selectTime}>
                  {getAuctionTimes(selectedLanguage).map(({ label, value }) => (
                    <div
                      key={label}
                      onClick={() => setAuctionEndTime(value)}
                      className={cn(styles.selectTimeButton, { [styles.active]: auctionEndTime === value })}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </label>
            </div>
            <button className={cn(styles.buttonCreate, styles.buttonBottomScreen, { [styles.vip]: isVipGift })} type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span>{t("gift.creating")}</span>
              ) : (
                <>
                  <span>{t("gift.create")}</span>
                  <div className={styles.price}>
                    <span>{(0.1).toFixed(1)}</span>
                    {!isVipGift && (
                      <>
                        <div className={styles.minusPrice}></div>
                        <span className={styles.salePrice}>0</span>
                      </>
                    )}
                    <img src="/photos/ton.svg" alt="" />
                  </div>
                </>
              )}
            </button>
          </form>
        )}

        </>
      )}

    </section>
  );
};

export default Gift;
