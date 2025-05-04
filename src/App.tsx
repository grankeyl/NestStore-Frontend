import { useEffect, useState, Suspense, lazy } from "react";
import i18n from "@i18n";
import { useUserProfile } from "@contexts/user-profile";
import UseTelegram from "@hooks/useTelegram";

import Layout from "@layouts/Layout";
import Gift from "@pages/Gift";
import MyGifts from "@pages/MyGifts";
import Profile from "@pages/Profile";
import Store from "@pages/Store";
import Activity from "@pages/Activity";
import Cart from "@pages/Cart";
import Giveaways from "@pages/Giveaways";
import GiveawayCreate from "@pages/Giveaways/Create";
import GiveawayOpen from "@pages/Giveaways/Open";
import Stars from "@pages/Stars";

import { IUserProfile } from "@types";
import axios, { AxiosError } from "axios";
import { Routes, Route, useNavigate } from "react-router";
import "./assets/styles/main.scss";
import Modal from "@components/Modal";
import { t } from "i18next";
import Loader from "@components/ui/loader";
import { THEME, useTonConnectUI } from "@tonconnect/ui-react";
import { Locales } from "@tonconnect/ui";
// import { showToast } from "@utils/showToast";

const Orders = lazy(() => import("@pages/Orders"));
const History = lazy(() => import("@pages/History"));
const Deposit = lazy(() => import("@pages/Deposit"));
const Filters = lazy(() => import("@pages/Filters"));
// const Stars = lazy(() => import("@pages/Stars"));
// const StarOrders = lazy(() => import("@pages/StarOrders"));
const EditGift = lazy(() => import("@pages/EditGift"));
const Withdrawal = lazy(() => import("@pages/Withdrawal"));
const Referrals = lazy(() => import("@pages/Referrals"));

const App = () => {
  localStorage.removeItem("filters-storage");

  const navigate = useNavigate();

  const { setLastActivity, setUserProfile } = useUserProfile();
  const { userProfile } = useUserProfile();
  const [_, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [__, setIsModalVisible] = useState(false);
  const [isTokenReady, setTokenReady] = useState(false);
  const { webApp } = UseTelegram();
  const [tonConnectUI] = useTonConnectUI();

  // const [intervalGetUserProfile, setIntervalGetUserProfile] = useState<NodeJS.Timer | null>(null);

  tonConnectUI.uiOptions = {
    language: i18n.language as Locales,
    uiPreferences: {
        theme: THEME.LIGHT
    }
  };

  const tests = () => {
    if (import.meta.env.VITE_TEST_IDS.includes(userProfile?.id)) {
      return false;
    }

    return true;
  }

  const showDebugging = () => {
    if (!tests()) {
      localStorage.setItem('showErudaT', '1');
    }
  }

  showDebugging()

  const getGiveaway = async (giveawayId: string) => {
    const authToken = localStorage.getItem("token");

    try {
      const response = await axios.post(
        `https://storeapi.nestdex.dev/giveaway/${giveawayId}`,
        {},
        { headers: { Authorization: authToken } }
      );

      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      console.error(error);
    }
  }

  const checkStartApp = async (initData: string) => {
    const params = new URLSearchParams(initData);
    const startParam = params.get('start_param');

    if (startParam && startParam === "my_gifts") {
      navigate("/gift");
    }

    if (startParam && startParam === "rGiveaways") {
      navigate("/giveaways");
    }
  
    if (startParam && startParam.startsWith("giveaway_")) {
      const [_, giveawayId] = startParam.split("_") || null;
      const giveaway = await getGiveaway(giveawayId);

      if (giveaway) {
        navigate("/giveaways/" + giveawayId);
      }
    }
  
    if (startParam && startParam.startsWith("liveGiveaway_")) {
      const [_, giveawayId] = startParam.split("_");
  
      if (giveawayId) {
        navigate("/giveaway/open/" + giveawayId);
      }
    }
  };
  
  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage") || i18n.language;
    i18n.changeLanguage(savedLanguage);
  }, []);

  const getUserProfile = async (authToken: string) => {
    try {
      const response = await axios.get("https://storeapi.nestdex.dev/user/me", {
        headers: { Authorization: `${authToken}` },
      });

      if (response.status === 200) {
        setUserProfile(response.data);

        // if (response.data.balance !== userProfile?.balance) {
        //   if (!userProfile) { return; }

        //   const newAmount = response.data.balance - userProfile.balance; 
        //   showToast(`Баланс пополнен на ${newAmount} TON`, "success");
        // }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getActivity = async (authToken: string) => {
    try {
      const response = await axios.get("https://storeapi.nestdex.dev/historyactivity", {
        headers: { Authorization: authToken }
      });
      const activity = response.data;
  
      const latestSellGift = activity
        .filter((gift: any) => gift.type === 'sell_gift')
        .sort((a: any, b: any) => b.id - a.id)[0];
  
      setLastActivity(latestSellGift ? [latestSellGift] : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    webApp.disableVerticalSwipes();

    localStorage.removeItem("token");

    const initApp = async () => {
      try {
        let initData = '';

        const isDev = import.meta.env.DEV;

        if (isDev === true) {
          initData = import.meta.env.VITE_INIT_DATA;
        } else {
          initData = webApp.initData;
        }

        if (!initData) {
          throw new Error("Init data is missing");
        }

        const loginResponse = await axios.post("https://storeapi.nestdex.dev/user/login", {
          init_data: initData,
        });

        if (loginResponse.status !== 200) {
          setIsError(true);
          return;
        }

        const authToken = loginResponse.data.token;
        localStorage.setItem("token", authToken);

        setTokenReady(true);
        checkStartApp(initData);

        const profileResponse = await axios.get("https://storeapi.nestdex.dev/user/me", {
          headers: { Authorization: `${authToken}` },
        });

        if (profileResponse.status === 200) {
          const urlParams = new URLSearchParams(initData);
          const userParam = urlParams.get("user") as any;
          const user = JSON.parse(decodeURIComponent(userParam));

          const userProfile: IUserProfile = {
            ...profileResponse.data,
            is_premium: user.is_premium ?? false,
          };
          setUserProfile(userProfile);
          await getActivity(authToken);
        }

        // const deleteStartParam = () => {
        //   const url = new URL(window.location.href);
        //   url.searchParams.delete('start_param');
        //   window.history.replaceState({}, '', url.pathname + url.search + url.hash);
        // };

        setLoading(false);

      } catch (error) {
        console.error("Initialization error:", error);
        if ((error as AxiosError).status === 403) setIsError(true);
        setLoading(false);
      }
    };

    initApp();
  }, []);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (event.target instanceof HTMLInputElement && event.target.type === "number") {
        event.preventDefault();
      }
    };
    document.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      document.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    const userProfileInterval = setInterval(() => {
      const authToken = localStorage.getItem("token") as any;
      getUserProfile(authToken);
    }, 30000);
  
    return () => clearInterval(userProfileInterval);
  }, []);
  
  if (!isTokenReady) {
    return <Loader />;
  }

  if (isError) {
    return (
      <Modal isCloseButton={false} type="storeCard" isVisible={true} setIsVisible={setIsModalVisible}>
        <p className="modalDescription">{t("app.error.description")}</p>
        <a className="modalButton" href="https://t.me/nest_dex">
          {t("app.error.button")}
        </a>
      </Modal>
    );
  }

  return (
    <Routes>
      <Route path="giveaway/open/:giveawayId" element={<GiveawayOpen isTokenReady={isTokenReady} />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Store isTokenReady={isTokenReady} />} />
        <Route
          path="filters"
          element={
            <Suspense fallback={<Loader />}>
              <Filters />
            </Suspense>
          }
        />
        <Route
          path="stars"
          element={
            <Suspense fallback={<Loader />}>
              <Stars />
            </Suspense>
          }
        />
        <Route path="orders" element={<Orders />} />
        <Route path="history" element={<History />} />
        <Route path="activity" element={<Activity />} />
        <Route path="cart" element={<Cart />} />
        <Route path="giveaways" element={<Giveaways isTokenReady={isTokenReady} />} />
        <Route path="giveaways/:giveawayId" element={<Giveaways isTokenReady={isTokenReady} />} />
        <Route path="giveaway/create" element={<GiveawayCreate isTokenReady={isTokenReady} />} />
        {/* <Route
          path="starorders"
          element={
            <Suspense fallback={<Loader />}>
              <StarOrders />
            </Suspense>
          }
        /> */}
        <Route path="gift">
          <Route index element={<Gift isTokenReady={isTokenReady} />} />
          <Route
            path=":id/edit"
            element={
              <Suspense fallback={<Loader />}>
                <EditGift />
              </Suspense>
            }
          />
        </Route>
        <Route path="profile">
          <Route index element={<Profile isTokenReady={isTokenReady} />} />
          <Route path="gifts" element={<MyGifts />} />
          <Route
            path="deposit"
            element={
              <Suspense fallback={<Loader />}>
                <Deposit />
              </Suspense>
            }
          />
          <Route
            path="referrals"
            element={
              <Suspense fallback={<Loader />}>
                <Referrals />
              </Suspense>
            }
          />
          <Route
            path="withdrawal"
            element={
              <Suspense fallback={<Loader />}>
                <Withdrawal />
              </Suspense>
            }
          />
        </Route>
      </Route>
      <Route path="*" element={<div>Page not found</div>} />
    </Routes>
  );
};

export default App;
