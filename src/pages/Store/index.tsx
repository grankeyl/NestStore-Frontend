// @ts-nocheck

import { FC, useEffect, useState, useRef, useMemo } from "react";
import styles from "./Store.module.scss";
import cn from "classnames";
import { Link, useNavigate } from "react-router-dom";
import Modal from "@components/Modal";
import { GiftType, IGift } from "@types";
import axios from "axios";
import { useFiltersStore } from "@stores/shop.store";
import { useUserProfile } from "@contexts/user-profile";
import { showToast } from "@utils/showToast";
import { t } from "i18next";
import { useStoreObserver } from "./hooks/useStoreObserver";
import { useFetchGiftById } from "./hooks/useFetchGiftById";
import UseTelegram from "@hooks/useTelegram";
import { useCartStore } from "@stores/cart.store";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { getModelLottie, getModelPng, getNftBackground, getNftLottie, getSymbolLottie } from "@utils/nftUtils";

import { useTonAddress } from "@tonconnect/ui-react";
import { convertToMSK, formatDate } from "@utils/formatDate";
import { startCountdownAuctionDays, startCountdownAuctionHours } from "@utils/timerAuction";
import ConfirmModal from "@components/Confirm";
import { validatePrice } from "@utils/formatBalance";
import { useStoreAuctionObserver } from "./hooks/useStoreAuctionObserver";
import { giftTypeDisplayNames } from "@data";

interface Props {
  isTokenReady: boolean;
}

export const PriceComponent = ({ price }: { price: number }) => {
  const validated = useMemo(() => validatePrice(price), [price]);

  return <span>{validated}</span>;
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
        <div className={styles.bgGift}>
          <DotLottieReact src={getModelLottie(gift.type, gift.model_name)} autoplay />
        </div>
      )}
    </div>
  );
}

function CountdownDays({ endTime }: { endTime: any }) {
  const [timeLeftDays, setTimeLeftDays] = useState("");

  useEffect(() => {
      function updateTimer() {
        setTimeLeftDays(startCountdownAuctionDays(endTime));
      }

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
  }, [endTime]);

  return <p>{timeLeftDays}</p>;
}

function CountdownHours({ endTime }: { endTime: any }) {
    const [timeLeftHours, setTimeLeftHours] = useState("");

    useEffect(() => {
        function updateTimer() {
          setTimeLeftHours(startCountdownAuctionHours(endTime));
        }

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [endTime]);

    return <p>{timeLeftHours}</p>;
}

const Store: FC<Props> = ({ isTokenReady }) => {
  document.body.classList.remove("no-padding");
  
  const authToken = localStorage.getItem("token");

  const { userProfile, lastActivity } = useUserProfile();

  const { cartGifts, setCartGifts } = useCartStore();
  const [localCartGifts, setLocalCartGifts] = useState<any[]>(cartGifts);

  const [isVisible, setIsVisible] = useState(false);
  const [isVisibleAuctionModal, setIsVisibleAuctionModal] = useState(false);

  const [isVisibleSayHelloModal, setIsVisibleSayHelloModal] = useState(false);

  const [isOpenedBidHistory, setIsOpenedBidHistory] = useState(false);
  const [isRareModalVisible, setIsRareModalVisible] = useState(false);
  const [storeGifts, setStoreGifts] = useState<IGift[]>([]);
  const [storeGiftsAuction, setStoreGiftsAuction] = useState<IGift[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>("store");
  const [selectedItem, setSelectedItem] = useState<IGift>();
  const [auctionInputPrice, setAuctionInputPrice] = useState<number>(0);
  const [stepChangeAuctionPrice, setStepChangeAuctionPrice] = useState<number>('');

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAuction, setIsLoadingAuction] = useState(false);

  const [hasMore, setHasMore] = useState(true);
  const [hasMoreAuction, setHasMoreAuction] = useState(true);

  const filters = useFiltersStore();
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement | null>(null);
  
  let lastItemRef = useRef<HTMLDivElement | null>(null);
  let lastItemAuctionRef = useRef<HTMLDivElement | null>(null);

  const { webApp } = UseTelegram();
  const [backdrop, setBackdrop] = useState<string | null>(null);

  const [isBuyGiftConfirmVisible, setIsBuyGiftConfirmVisible] = useState(false);
  const [isBidGiftConfirmVisible, setIsBidGiftConfirmVisible] = useState(false);

  const [intervalGetGifts, setIntervalGetGifts] = useState<NodeJS.Timer | null>(null);
  const [intervalGetAuctionGifts, setIntervalGetAuctionGifts] = useState<NodeJS.Timer | null>(null);

  const [startParam, setStartParam] = useState<string | null>(null);
  const [hasHandledStartParam, setHasHandledStartParam] = useState(false);

  const userFriendlyAddress = useTonAddress();

  const getGiftIdFromStartParam = () => {
    if (startParam?.startsWith("gift_")) {
      return startParam.split("_")[1];
    }
    return null;
  };

  useEffect(() => {
    webApp.BackButton.offClick();
    webApp.BackButton.hide();
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (webApp.initDataUnsafe.start_param) {
      setStartParam(webApp.initDataUnsafe.start_param);
    }
  }, [webApp.initDataUnsafe.start_param]);

  useEffect(() => {
    const giftId = getGiftIdFromStartParam();
    if (giftId && !isVisible && !hasHandledStartParam) {
      handleCardClick(Number(giftId));
      setHasHandledStartParam(true);
    }
  }, [startParam, isVisible, hasHandledStartParam]);

  const handleCardClick = async (id: any) => {
    try {
      setIsLoading(true);

      const response = await axios.get(`https://apistore.nestdex.dev/market/gifts/${id}`, {
        headers: { Authorization: authToken },
      });
  
      const giftData = response.data;
      const isInBasket = storeGifts.some(g => g.id === id && g.is_basket);
  
      setSelectedItem({ 
        ...giftData, 
        price: giftData.price * 1.05, 
        is_basket: isInBasket 
      });
      setIsVisible(true);
      setIsVisibleSayHelloModal(!localStorage.getItem("sayHello"));
    } catch (e) {
      console.error(e);
      showToast(t("store.errors.notFound"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClickAuction = async (id: any) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`https://apistore.nestdex.dev/market/gifts/${id}`, {
        headers: { Authorization: authToken },
      });
      setSelectedItem(response.data);
      setIsVisibleAuctionModal(true);
      setIsVisibleSayHelloModal(!localStorage.getItem("sayHello"));
    } catch (e) {
      console.error(e);
      showToast(t("store.errors.notFound"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const checkConnectWallet = () => {
    if (userFriendlyAddress) { return true; }
    return showToast(t("app.errors.connectWallet"), "error");
  }

  const newBid = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsBidGiftConfirmVisible(true);
    } catch (e) {
      console.error(e);
      showToast(t("store.errors.notFound"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const getStoreGifts = async (newOffset: number = 0) => {
    try {
      setIsLoading(true);

      console.log(newOffset);

      const response = await axios.get("https://apistore.nestdex.dev/market/gifts", {
        headers: { Authorization: authToken },
        params: {
          sort_by: filters.sort,
          offset: newOffset,
          limit: 20,
          from_price: filters.from || undefined,
          to_price: filters.to || undefined,
          from_gift_number: filters.numberFrom || undefined,
          to_gift_number: filters.numberTo || undefined,
          rarity: filters.rarity,
          type: filters.type,
          model_name: filters.finModels,
          shop_type: "market",
        },
      });

      const gifts = response.data;

      if (gifts.length === 0) {
        setHasMore(false);
        return;
      }

      setStoreGifts((prevGifts) => {
        const updatedNewGifts = gifts.map(gift => ({
          ...gift,
          price: gift.price * 1.05,
          is_basket: localCartGifts.some(cartGift => cartGift.id === gift.id),
        }));
      
        return newOffset === 0
          ? updatedNewGifts
          : [...prevGifts, ...updatedNewGifts];
      });
      
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getStoreGiftsAuction = async (newOffset: number = 0) => {
    try {
      setIsLoadingAuction(true);

      const response = await axios.get("https://apistore.nestdex.dev/market/gifts", {
        headers: { Authorization: authToken },
        params: {
          sort_by: filters.sort,
          offset: newOffset,
          limit: 20,
          from_price: parseInt(filters.from) || undefined,
          to_price: parseInt(filters.to) || undefined,
          rarity: filters.rarity,
          type: filters.type,
          model_name: filters.finModels,
          shop_type: "auction",
        },
      });

      const gifts = response.data;
      console.log(storeGiftsAuction.length)
      
      if (gifts.length === 0) {
        setHasMoreAuction(false);
        return;
      }

      setStoreGiftsAuction((prevGifts) => {
        const updatedGifts = newOffset === 0
          ? gifts.map(gift => ({
              ...gift,
              price: gift.price
            }))
          : [
              ...prevGifts,
              ...gifts.map(gift => ({
                ...gift
              }))
            ].map(gift => ({
              ...gift,
              price: gift.price
            }));
      
        return updatedGifts;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAuction(false);
    }
  };

  useEffect(() => {
    if (isTokenReady) {
      getStoreGifts();
      getStoreGiftsAuction();
      console.log(filters);
    }
  }, [isTokenReady, filters]);

  const handlePageClick = (page: string) => {
    setSelectedPage(page);

    if (page === "store") {
      lastItemRef = useRef<HTMLDivElement | null>(null);
      useStoreObserver(storeGifts, lastItemRef, isLoading, getStoreGifts, hasMore);
    }

    if (page === "auction") {
      lastItemAuctionRef = useRef<HTMLDivElement | null>(null);
      useStoreAuctionObserver(storeGiftsAuction, lastItemAuctionRef, isLoadingAuction, getStoreGiftsAuction, hasMoreAuction);
    }
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

      setIsBuyGiftConfirmVisible(true);
    } catch (error) {
      showToast(t("store.errors.somethingWentWrong"), "error");
      console.error(error);
    }
  };

  const handlePriceChangeAuction = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/[^0-9.]/g, "");
    const parts = value.split(".");

    if (parts.length > 2) { value = parts[0] + "." + parts.slice(1).join(""); }
    if (parts.length === 2) { value = parts[0] + "." + parts[1].slice(0, 1); }
    if (value === "") { e.target.value = value; return; }
    if (value === "0.") { e.target.value = value; return; }
  
    let num = parseFloat(value);

    if (!isNaN(num)) {
      if (num < 0.1 && value !== "0.") { value = "0.1"; } else if (num > 9999.9) {
        value = "9999.9";
      }
    }
  
    e.target.value = value;
    setAuctionInputPrice(parseFloat(value));
  };

  const openActivity = () => {
    navigate("/activity");
  }

  const addToCart = (gift: any) => {
    setLocalCartGifts((prev) => {
      const isInCart = prev.some(g => g.id === gift.id);
      const updatedCart = isInCart
        ? prev.filter(g => g.id !== gift.id)
        : [...prev, { ...gift, is_basket: true }];
  
      return updatedCart.map(g => 
        g.id === gift.id ? { ...g, is_basket: !isInCart } : g
      );
    });
  
    setStoreGifts(prevGifts =>
      prevGifts.map(g =>
        g.id === gift.id ? { ...g, is_basket: !g.is_basket } : g
      )
    );
  
    setSelectedItem(prev => 
      prev && prev.id === gift.id ? { ...prev, is_basket: !prev.is_basket } : prev
    );
  };

  const removeFromCart = (id: number) => {
    const updatedGifts = localCartGifts.filter(g => g.id !== id);
    setLocalCartGifts(updatedGifts);
  };

  const sayHelloGoWrite = () => {
    localStorage.setItem("sayHello", true);
    setIsVisibleSayHelloModal(false);
    webApp.openTelegramLink('https://t.me/' + import.meta.env.VITE_GIFTER.replace('@', ''));
  };

  const sayHelloClose = () => {
    localStorage.setItem("sayHello", true);
    setIsVisibleSayHelloModal(false);
  };

  const handleBuyGiftConfirm = async () => {
    try {
      const response = await axios.post("https://apistore.nestdex.dev/market/order/buy", { id: selectedItem?.id }, { headers: { Authorization: authToken } });
      
      if (response.status === 200) {
        userProfile.balance -= selectedItem.price;
        showToast(t("app.success.purchased.gift"), "success");
        setIsVisible(false);
        setStoreGifts(storeGifts.filter(gift => gift.id !== selectedItem.id));
        setIsBuyGiftConfirmVisible(false);
        removeFromCart(selectedItem?.id);
      }
    } catch (error) {
      console.error(error.response);
      showToast(t("store.errors.notFound"), "error");
    } finally {
      setIsLoading(false);
      setIsBuyGiftConfirmVisible(false);
    }
  }

  const handleBidGiftConfirm = async () => {
    try {
      let amount = selectedItem?.price + selectedItem?.min_step;

      if (stepChangeAuctionPrice >= amount) { 
        amount = stepChangeAuctionPrice;
      } else {
        amount = selectedItem?.price + selectedItem?.min_step;
      }

      if (selectedItem.bids.length > 1) {
        if (stepChangeAuctionPrice >= amount) { 
          amount = stepChangeAuctionPrice;
        } else {
          amount = selectedItem?.price + selectedItem?.min_step;
        }
      }

      if (userProfile?.balance < amount) { 
        return showToast(t("store.errors.insufficientBalance", { amount: (amount - userProfile.balance).toFixed(1) }), "error");
      }

      const response = await axios.post(
        "https://apistore.nestdex.dev/market/order/new-bid", 
        {
          id: selectedItem?.id,
          amount: amount,
        },
        {
          headers: {
            Authorization: authToken,
            "Content-Type": "application/json",
            "Accept": "*/*",
          },
        }
      ) as any;

      if (response.status === 200) {
        if (!userProfile) { return; }

        userProfile.balance = response.data.user_balance;
        selectedItem?.bids.push({ amount: Number(amount), created_at: response.data.created_at })
        showToast(t("store.bid.success.message"), "success");
        
        if (selectedItem) { selectedItem.price = Number(amount); }

        setStoreGiftsAuction(prevGifts => 
          prevGifts.map(gift => 
            gift.id === selectedItem?.id ? { ...gift, price: Number(amount) } : gift
          )
        );
        setIsBidGiftConfirmVisible(false);
        removeFromCart(selectedItem?.id);
      }
    } catch (e) {
      console.log(e.response)
      showToast(t("store.errors.notFound"), "error");
    } finally {
      setIsLoading(false);
      setIsBidGiftConfirmVisible(false);
    }
  }

  const checkExpiredAuction = async (endTime: any) => {
    const end = new Date(endTime).getTime();
    const now = Date.now();
    const timeLeft = end - now;
  
    if (timeLeft <= 0) return true;
    return false;
  }
  
  useEffect(() => {
    setCartGifts(localCartGifts);
  }, [localCartGifts]);

  useFetchGiftById(isTokenReady, authToken, setSelectedItem, setIsVisible);
  useStoreObserver(storeGifts, lastItemRef, isLoading, getStoreGifts, hasMore);
  useStoreAuctionObserver(storeGiftsAuction, lastItemAuctionRef, isLoadingAuction, getStoreGiftsAuction, hasMoreAuction);

  useEffect(() => {
    if (intervalGetGifts) clearInterval(intervalGetGifts);
    if (intervalGetAuctionGifts) clearInterval(intervalGetAuctionGifts);
  
    const fetchGifts = () => {
      if (hasMore && !isLoading) getStoreGifts();
    };
  
    const fetchAuctionGifts = () => {
      if (hasMoreAuction && !isLoading) getStoreGiftsAuction();
    };
  
    const giftsInterval = setInterval(fetchGifts, 20000);
    const auctionInterval = setInterval(fetchAuctionGifts, 20000);
  
    setIntervalGetGifts(giftsInterval);
    setIntervalGetAuctionGifts(auctionInterval);
  
    return () => {
      clearInterval(giftsInterval);
      clearInterval(auctionInterval);
    };
  }, [hasMore, hasMoreAuction, isLoading]);

  const typeMapping: Record<string, { className: string; sign: string }> = {
    sell_gift: {
      className: styles.historyItemsItemRightGreen,
      sign: "+"
    },
    bid_gift: {
      image: "/photos/history/bid.svg",
      className: styles.historyItemsItemRightGreen,
      sign: "+"
    },
    final_bid_gift: {
      image: "/photos/history/bid.svg",
      className: styles.historyItemsItemRightGreen,
      sign: "+"
    }
  };

  // const getActivity = async (newOffset: number = 0) => {
  //   try {
  //     const response = await axios.get("https://apistore.nestdex.dev/historyactivity", {
  //       headers: { Authorization: authToken }
  //     });
  //     const activity = response.data;
      
  //     setLastActivity(() => {
  //       const latestSellGift = activity
  //         .filter((gift: any) => gift.type === 'sell_gift')
  //         .sort((a: any, b: any) => b.id - a.id)[0];
      
  //       return latestSellGift ? [latestSellGift] : [];
  //     });
  //     console.log(lastActivity)
  //   } catch (e) {
  //     console.error(e);
  //   }
  // };

  // useEffect(() => {
  //   getActivity();
  // }, []);

  const shareGift = async (id: any) => {
    console.log(selectedItem?.id)
    const link = `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/nestore_robot?startapp=gift_${selectedItem?.id}`)}`;
    webApp.openTelegramLink(link);
  }
  
  const showInTelegram = () => {
    const link = `https://t.me/nft/${giftTypeDisplayNames[selectedItem?.type]}-${selectedItem?.number}`;
    webApp.openTelegramLink(link);
  }

  return (
    <section className={styles.main} ref={containerRef}>
      {/* <a target="_blank" href="https://t.me/evgenahata" className={styles.partner}>
        <span>{t("store.partner")} batya</span>
        <img src="/photos/store/partnerIcon.svg" alt="batya" />
      </a> */}

      <ConfirmModal
        isVisible={isBuyGiftConfirmVisible}
        setIsVisible={setIsBuyGiftConfirmVisible}
        headline={t("modal.confirm.headline")}
        onConfirm={handleBuyGiftConfirm}
        onCancel={() => setIsBuyGiftConfirmVisible(false)}
      >
      </ConfirmModal>

      <ConfirmModal
        isVisible={isBidGiftConfirmVisible}
        setIsVisible={setIsBidGiftConfirmVisible}
        headline={t("modal.confirm.headline")}
        onConfirm={handleBidGiftConfirm}
        onCancel={() => setIsBidGiftConfirmVisible(false)}
      >
      </ConfirmModal>

      <Modal isVisible={isVisibleSayHelloModal} setIsVisible={setIsVisibleSayHelloModal} paddingTop={24} type="storeCard" style={{ zIndex: 10000 }}>
        <div className={styles.sayHelloHead}>
          <h4>{t("modal.sayhello.title")}</h4>
        </div>
        <div className={styles.sayHelloDescr}>
          <p>{t("modal.sayhello.descr").replace("@", import.meta.env.VITE_GIFTER)}</p>
        </div>
        <div className={styles.sayHelloImage}>
          <img src="/photos/store/say-hello.png" alt="" />
        </div>
        <button onClick={sayHelloGoWrite} className={cn(styles.button, styles.sayHelloButton)}>
          {t("modal.sayhello.button")}
        </button>
      </Modal>

      <Modal paddingTop={24} headline={t("store.rare.title")} isVisible={isRareModalVisible} setIsVisible={setIsRareModalVisible}>
        <p className={styles.rareDescription}>{t("store.rare.description")}</p>
        <dl className={styles.rareItems}>
          <div className={styles.rareItem}>
            <dt className={cn(styles.rareItemTitle, styles.badge, styles.common)}>{t("rarity.common")}</dt>
            <dd className={styles.rareItemValue}>{">2%"}</dd>
          </div>
          <div className={styles.rareItem}>
            <dt className={cn(styles.rareItemTitle, styles.badge, styles.rare)}>{t("rarity.rare")}</dt>
            <dd className={styles.rareItemValue}>1-2%</dd>
          </div>
          <div className={styles.rareItem}>
            <dt className={cn(styles.rareItemTitle, styles.badge, styles.mythical)}>{t("rarity.mythical")}</dt>
            <dd className={styles.rareItemValue}>0.6-1%</dd>
          </div>
          <div className={styles.rareItem}>
            <dt className={cn(styles.rareItemTitle, styles.badge, styles.legend)}>{t("rarity.legend")}</dt>
            <dd className={styles.rareItemValue}>0-0.6%</dd>
          </div>
          <p className={styles.rareDevelopment}>{t("store.rare.development")}</p>
        </dl>
        <button onClick={() => setIsRareModalVisible(false)} className={cn(styles.button, styles.rareClose)}>
          {t("store.rare.button")}
        </button>
      </Modal>

      <Modal isVisible={isVisible} setIsVisible={setIsVisible} type="storeCard">
        <div 
          className={cn(styles.card, styles.backdrop, selectedItem?.is_vip ? styles.vip : '')}
          style={{ 
            background: `radial-gradient(circle,  
              ${getNftBackground(selectedItem?.background_name)?.centerColor || '#4d5254'} 0%,
              ${getNftBackground(selectedItem?.background_name)?.edgeColor || '#313638'} 100%),
              ${getNftBackground(selectedItem?.background_name)?.patternColor || '#000000'}`
          }}
        >
          <div onClick={() => setIsVisible(false)} className={styles.closeModalBtn}>
            <img src="/photos/close-white.svg" alt="" />
          </div>
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
          <div className={styles.patternBlocker}>
            <DotLottieReact src={getModelLottie(selectedItem?.type, selectedItem?.model_name as any)} style={{ width: "142px", height: "142px" }} autoplay loop />
            <h2 className={styles.cardTitle}>{selectedItem?.type}</h2>
            <h3 className={styles.cardSubtitle}>#{selectedItem?.number}</h3>
            <div
              onClick={() => shareGift(selectedItem?.id)}
              className={cn(styles.button, styles.buttonModal, styles.shareButton, styles.cardShared)}
            >
              <img width={20} height={20} src="/photos/store/share.svg" alt="" />
            </div>
          </div>
        </div>
        <dl className={styles.list}>
          <div className={styles.listContent}>
            <dd className={styles.listBlocker}>
              <dt className={styles.listBlockerLabel}>{t("store.model")}</dt>
              <dt className={styles.listBlockerText}>{selectedItem?.model_name}</dt>
            </dd>
            <dd className={styles.description}>
              <span className={cn(styles.listBadge, styles.info)}>{selectedItem?.model}%</span>
            </dd>
          </div>
          <div className={styles.listContent}>
            <dd className={styles.listBlocker}>
              <dt className={styles.listBlockerLabel}>{t("store.pattern")}</dt>
              <dt className={styles.listBlockerText}>{selectedItem?.pattern_name}</dt>
            </dd>
            <dd className={styles.description}>
              <span className={cn(styles.listBadge, styles.info)}>{selectedItem?.pattern}%</span>
            </dd>
          </div>
          <div className={styles.listContent}>
            <dd className={styles.listBlocker}>
              <dt className={styles.listBlockerLabel}>{t("store.background")}</dt>
              <dt className={styles.listBlockerText}>{selectedItem?.background_name}</dt>
            </dd>
            <dd className={styles.description}>
              <span className={cn(styles.listBadge, styles.info)}>{selectedItem?.background}%</span>
            </dd>
          </div>
        </dl>
        <button onClick={() => showInTelegram()} className={cn(styles.button, styles.buttonModal, styles.buttonModalPreview)}>
          <span style={{ margin: 'auto' }}>{t("gifts.modal.gift.preview.telegram")}</span>
        </button>
        <div className={`${styles.buttonHolder} ${styles.listButtons}`}>
          <button disabled={selectedItem?.seller_id === userProfile?.id} onClick={handleClickByGift} className={cn(styles.button, styles.buttonModal)}>
            {selectedItem?.seller_id !== userProfile?.id && <span>{t("store.buy")}</span>}
            <div className={styles.price}>
              <span>{validatePrice(selectedItem?.price)}</span>
              <img src="/photos/ton.svg" alt="" />
            </div>
          </button>
          <button 
            onClick={() => addToCart(selectedItem)} 
            disabled={selectedItem?.seller_id === userProfile?.id}
            className={styles.listBucket}
          >
            {selectedItem?.is_basket ? 
              <img width={24} height={24} src="/photos/store/bucket-done.svg" alt="" />
              : <img width={24} height={24} src="/photos/store/bucket.svg" alt="" />}
          </button>
        </div>
      </Modal>

      <Modal isVisible={isVisibleAuctionModal} setIsVisible={setIsVisibleAuctionModal} type="storeCard">
        <form className={styles.form} onSubmit={newBid}>
          <div 
            className={`${styles.card} ${styles.backdrop}`}
            style={{ 
              background: `radial-gradient(circle,  
                ${getNftBackground(selectedItem?.background_name)?.centerColor || '#4d5254'} 0%,
                ${getNftBackground(selectedItem?.background_name)?.edgeColor || '#313638'} 100%),
                ${getNftBackground(selectedItem?.background_name)?.patternColor || '#000000'}`
            }}
          >
            <div onClick={() => setIsVisibleAuctionModal(false)} className={styles.closeModalBtn}>
              <img src="/photos/close-white.svg" alt="" />
            </div>
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
            <div className={styles.patternBlocker}>
              <DotLottieReact src={getModelLottie(selectedItem?.type, selectedItem?.model_name)} style={{ width: "142px", height: "142px" }} autoplay loop />
              <h2 className={styles.cardTitle}>{selectedItem?.type}</h2>
              <h3 className={styles.cardSubtitle}>#{selectedItem?.number}</h3>
              <a
                target="_blank"
                href={`https://t.me/share/url?url=${encodeURIComponent(`https://t.me/nestore_robot?startapp=gift_${selectedItem?.id}`)}`}
                className={cn(styles.button, styles.buttonModal, styles.shareButton, styles.cardShared)}
              >
                <img width={20} height={20} src="/photos/store/share.svg" alt="" />
              </a>
            </div>
          </div>
          <div className={styles.auctionModalInfo}>
            <div className={styles.auctionModalInfoItem}>
              <div className={styles.auctionModalInfoItemTitle}>
                <h4>{typeof selectedItem?.price === 'number' ? selectedItem.price.toFixed(1) : '—'}</h4>
                <img width={18} height={18} src="/photos/ton.svg" alt="" />
              </div>
              <div className={styles.auctionModalInfoItemDescr}>
                <p>{t("store.bid.modal.table.currentBid")}</p>
              </div>
            </div>
            <div className={styles.auctionModalInfoBorder}></div>
            <div className={styles.auctionModalInfoItem}>
              <div className={styles.auctionModalInfoItemTitle}>
                <h4>{selectedItem?.min_step}</h4>
                <img width={18} height={18} src="/photos/ton.svg" alt="" />
              </div>
              <div className={styles.auctionModalInfoItemDescr}>
                <p>{t("store.bid.modal.table.minimumBid")}</p>
              </div>
            </div>
            <div className={styles.auctionModalInfoBorder}></div>
            <div className={styles.auctionModalInfoItem}>
              <div className={cn(styles.auctionModalInfoItemTitle, styles.time, styles.auctionModalInfoItemDescrTimer)}>
                <h4>
                  <CountdownDays endTime={selectedItem?.auction_end_time} /> 
                  <CountdownHours endTime={selectedItem?.auction_end_time} />
                </h4>
              </div>
              <div className={cn(styles.auctionModalInfoItemDescr)}>
                <p>{t("store.bid.modal.table.auctionEnds")}</p>
              </div>
            </div>
          </div>
          <dl className={styles.list}>
            <div className={styles.listContent}>
              <dd className={styles.listBlocker}>
                <dt className={styles.listBlockerLabel}>{t("store.model")}</dt>
                <dt className={styles.listBlockerText}>{selectedItem?.model_name}</dt>
              </dd>
              <dd className={styles.description}>
                <span className={cn(styles.listBadge, styles.info)}>{selectedItem?.model}%</span>
              </dd>
            </div>
            <div className={styles.listContent}>
              <dd className={styles.listBlocker}>
                <dt className={styles.listBlockerLabel}>{t("store.pattern")}</dt>
                <dt className={styles.listBlockerText}>{selectedItem?.pattern_name}</dt>
              </dd>
              <dd className={styles.description}>
                <span className={cn(styles.listBadge, styles.info)}>{selectedItem?.pattern}%</span>
              </dd>
            </div>
            <div className={styles.listContent}>
              <dd className={styles.listBlocker}>
                <dt className={styles.listBlockerLabel}>{t("store.background")}</dt>
                <dt className={styles.listBlockerText}>{selectedItem?.background_name}</dt>
              </dd>
              <dd className={styles.description}>
                <span className={cn(styles.listBadge, styles.info)}>{selectedItem?.background}%</span>
              </dd>
            </div>
          </dl>
          <div
            onClick={() => setIsOpenedBidHistory(!isOpenedBidHistory)}
            className={styles.auctionModalBids}
          >
            <div className={styles.auctionModalBidsHead}>
              <h4>{t("store.bid.modal.table.bidHistory")}</h4>
              <img
                src="/photos/chevrone-down.svg"
                alt=""
                className={isOpenedBidHistory ? styles.rotated : ''}
              />
            </div>

            <div
              className={`${styles.auctionModalBidsContent} ${isOpenedBidHistory ? styles.open : ''}`}
            >
              {selectedItem?.bids && (
                selectedItem.bids.map((bid, index) => (
                  <div className={styles.auctionModalBidsItem} key={index}>
                    <div className={styles.auctionModalBidsItemTitle}>
                      <h4>{validatePrice(bid.amount)}</h4>
                      <img width={24} height={24} src="/photos/ton.svg" alt="" />
                    </div>
                    <div className={styles.auctionModalBidsItemDescr}>
                      <p>{convertToMSK(bid.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <button onClick={() => showInTelegram()} className={cn(styles.button, styles.buttonModal, styles.buttonModalPreviewNoBottom)}>
            <span style={{ margin: 'auto' }}>{t("gifts.modal.gift.preview.telegram")}</span>
          </button>
          <div className={cn(styles.priceInput, styles.auctionModalPriceInput)}>
            <input
              min={selectedItem?.min_step}
              type="number"
              placeholder="0.00"
              name="stepChangeAuctionPrice"
              id="stepChangeAuctionPrice"
              value={stepChangeAuctionPrice || ''}
              onChange={(e) => setStepChangeAuctionPrice(e.target.value)}
              step={0.01}
              max={99999}
            />
            <img className={styles.ton} src="/photos/ton.svg" alt="" width={20} height={20} />
          </div>
          <button 
            type="submit"
            disabled={selectedItem?.seller_id === userProfile?.id}
            className={cn(
              styles.button, 
              styles.buttonModal, 
              styles.buttonModalFixed, 
              stepChangeAuctionPrice && (selectedItem?.price + selectedItem?.min_step) > stepChangeAuctionPrice
                ? styles.buttonDisabled 
                : ''
            )}
          >
            {selectedItem?.seller_id !== userProfile?.id && <span>{t("store.bid")}</span>}
            <div className={styles.price}>
              {!selectedItem?.bids && (
                <>
                  <span>{validatePrice(selectedItem?.price)}</span>
                </>
              )}
              {selectedItem?.bids && selectedItem?.bids.length === 1 && (
                <>
                  {selectedItem && !stepChangeAuctionPrice && (<span>{validatePrice(selectedItem?.price)}</span>)}
                  {selectedItem && stepChangeAuctionPrice && (<span>{stepChangeAuctionPrice}</span>)}
                </>
              )}
              {selectedItem?.bids && selectedItem?.bids.length > 1 && (
                <>
                  {selectedItem && !stepChangeAuctionPrice && (<span>{validatePrice(selectedItem?.price + selectedItem.min_step)}</span>)}
                  {selectedItem && stepChangeAuctionPrice && (<span>{stepChangeAuctionPrice}</span>)}
                </>
              )}
              <img src="/photos/ton.svg" alt="" />
            </div>
          </button>
        </form>
      </Modal>

      {lastActivity.map((activity: any, index: number) => (
        <div onClick={openActivity} className={styles.latest}>
          {activity.gift && (<img width={24} height={24} src={getModelPng(activity.gift, activity.model_name)} alt="" />)}
          <h4 className={styles.latestTitle}>{activity.gift},</h4>
          <p className={styles.latestSubtitle}>{t("store.latest.subtitle")}</p>
          <span className={styles.latestPrice}>{activity.price}</span>
          <img width={16} height={16} src="/photos/ton.svg" alt="" />

          <div className={styles.latestRightChevrone}>
              <img src="/photos/store/chevroneRight.svg" alt="" />
          </div>
        </div>
      ))}

      <div className={styles.header}>
        <div className={styles.sections}>
          <div
            onClick={() => handlePageClick("store")}
            className={`${styles.sectionItem} ${selectedPage === 'store' ? styles.active : ''}`}
          >
            <h1 className={styles.headline}>{t("store.title")}</h1>
          </div>
          <div
            onClick={() => handlePageClick("auction")}
            className={`${styles.sectionItem} ${selectedPage === 'auction' ? styles.active : ''}`}
          >
            <span>{t("store.titleNew")}</span>
            <h1 className={styles.headline}>{t("store.titleAuction")}</h1>
          </div>
        </div>
        <Link to="filters" className={styles.filters}>
          <img width={24} height={24} src="/photos/store/filter.svg" alt="" />
          <span>{t("store.filters")}</span>
        </Link>
      </div>

      {isLoading && <div className={styles.loader}></div>}

      {selectedPage === "store" && (
        storeGifts.length === 0 && !isLoading ? (
          <div className={styles.empty}>
            <img width={38} height={35} src="/photos/nestEmpty.svg" alt="" />
            <p className={styles.emptyDescription}>{t("store.empty")}</p>
          </div>
        ) : (
          <div className={styles.nftsList}>
            {storeGifts.map((gift, index) => (
              <div>
                <div 
                  ref={storeGifts.length === index + 1 ? lastItemRef : null}
                  key={gift.id} 
                  className={cn(styles.nftsListItem, styles.backdrop, gift.is_vip ? styles.vip : '')}
                  style={{
                    background: `radial-gradient(circle,
                      ${getNftBackground(gift.background_name).centerColor || '#4d5254'} 0%,
                      ${getNftBackground(gift.background_name).edgeColor || '#313638'} 100%),
                      ${getNftBackground(gift.background_name).patternColor || '#000000'}`,
                  }}
                >
                  <div onClick={() => handleCardClick(gift.id)} className={styles.nftsListItemImage}>
                    <button className={styles.nftsListItemImageButton}>
                      <div className={styles.nftsListItemImageButtonFull}>
                        <div className={styles.nftsListItemImageButtonFullRelative}>
                          <div className={styles.nftsListItemImageButtonFullRelativePad}></div>
                          <div className={styles.nftsListItemImageButtonFullRelativeAbsolute}>
                            <DotLottieReact className={styles.bgGift} src={getModelLottie(gift.type, gift.model_name)} />
                            <div className={styles.nftsListItemBadge}>
                              <div className={styles.badge}>
                                <p>#{gift.number}</p>
                              </div>
                            </div>
                            <div className={styles.patternBg}>
                              <div className={styles.patternBgGrid}>
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
                            <div className={styles.nftsListItemTitle}>
                              <h4>{gift.type}</h4>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                  <div className={cn(styles.nftsListItemButtons, styles.itemButtons)}>
                    <button onClick={() => handleCardClick(gift.id)} className={styles.button}>
                      <div className={styles.price}>
                        <PriceComponent price={gift.price} />
                        <img src="/photos/ton.svg" alt="" />
                      </div>
                    </button> 
                    <button
                      onClick={() => addToCart(gift)} 
                      disabled={gift?.seller_id === userProfile?.id}
                      className={styles.buttonBucket}
                    >
                      {gift.is_basket ? 
                        <img width={24} height={24} src="/photos/store/bucket-done.svg" alt="" />
                        : <img width={24} height={24} src="/photos/store/bucket.svg" alt="" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {selectedPage === "auction" && (
        storeGiftsAuction.length === 0 && !isLoadingAuction ? (
          <div className={styles.empty}>
            <img width={38} height={35} src="/photos/nestEmpty.svg" alt="" />
            <p className={styles.emptyDescription}>{t("store.empty")}</p>
          </div>
        ) : (
          <div className={styles.nftsList}>
            {storeGiftsAuction.map((gift, index) => (
              <div>
                <div 
                  ref={storeGiftsAuction.length === index + 1 ? lastItemAuctionRef : null}
                  onClick={() => handleCardClickAuction(gift.id)} 
                  key={gift.id} 
                  className={cn(styles.nftsListItem, styles.backdrop)}
                  style={{
                    background: `radial-gradient(circle,
                      ${getNftBackground(gift.background_name).centerColor || '#4d5254'} 0%,
                      ${getNftBackground(gift.background_name).edgeColor || '#313638'} 100%),
                      ${getNftBackground(gift.background_name).patternColor || '#000000'}`,
                  }}
                >
                  <div className={styles.nftsListItemImage}>
                    <button className={styles.nftsListItemImageButton}>
                      <div className={styles.nftsListItemImageButtonFull}>
                        <div className={styles.nftsListItemImageButtonFullRelative}>
                          <div className={styles.nftsListItemImageButtonFullRelativePad}></div>                          
                          <div className={styles.nftsListItemImageButtonFullRelativeAbsolute}>
                            <DotLottieReact className={styles.bgGift} src={getModelLottie(gift.type, gift.model_name)} />
                            <div className={styles.nftsListItemBadge}>
                              <div className={styles.badge}>
                                <p>#{gift.number}</p>
                              </div>
                            </div>
                            <div className={styles.patternBg}>
                              <div className={styles.patternBgGrid}>
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
                            <div className={styles.nftsListItemTitle}>
                              <h4>{gift.type}</h4>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                  <div className={styles.nftsListItemPadding}>
                    <div className={styles.auctionButtons}>
                      <div className={styles.auctionButtonsHead}>
                        <h4><CountdownDays endTime={gift.auction_end_time} /></h4>
                        <p><CountdownHours endTime={gift.auction_end_time} /></p>
                      </div>
                      <button className={styles.button}>
                        <div className={styles.price}>
                          {checkExpiredAuction(gift.auction_end_time) === true ? (
                            <>
                              <span>{t("auction.expired")}</span>
                              <img style={{ opacity: 0 }} src="/photos/ton.svg" alt="" />
                            </>
                          ) : (
                            <>
                              <span>{t("store.bid")}</span>
                              {!gift.bids && <b>{(gift.price).toFixed(1)}</b>}
                              {gift.bids && gift.bids.length === 1 && <b>{(gift.price).toFixed(1)}</b>}
                              {gift.bids && gift.bids.length > 1 && <b>{(gift.price + gift.min_step).toFixed(1)}</b>}
                              <img src="/photos/ton.svg" alt="" />
                            </>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </section>
  );
};

export default Store;
