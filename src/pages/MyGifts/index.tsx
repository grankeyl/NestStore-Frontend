import { FC, useEffect, useState } from "react";
import styles from "./MyGifts.module.scss";
import Modal from "@components/Modal";
import cn from "classnames";
import { Link, useLocation, useNavigate } from "react-router";
import axios from "axios";
import { IUserGift } from "@types";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import UseTelegram from "@hooks/useTelegram";
import { t } from "i18next"; 

const MyGifts: FC = () => {
  document.body.classList.remove("no-padding");
  
  const [isVisible, setIsVisible] = useState(false);
  const [selectedGift, setSelectedGift] = useState<number | null>(null);
  const [_, setSelectedGiftIndex] = useState<number>(0);
  const authToken = localStorage.getItem("token");
  const [userGifts, setUserGifts] = useState<IUserGift[]>([]);
  const [isModerationModalVisible, setIsModerationModalVisible] = useState(false);
  const { webApp } = UseTelegram();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/profile/gifts") {
      webApp.BackButton.show();
      webApp.BackButton.onClick(() => {
        navigate("/profile");
      });
    } else {
      webApp.BackButton.hide();
    }

    return () => {
      webApp.BackButton.hide();
    };
  }, [location.pathname, webApp, navigate]);

  const selectGift = (selectedGiftId: number, selectedGiftIndex: number) => {
    setSelectedGift(selectedGiftId);
    setIsVisible(true);
    setSelectedGiftIndex(selectedGiftIndex);
  };

  const loadUserGifts = () => {
    axios
      .get("https://storeapi.nestdex.dev/user/gifts", { headers: { Authorization: authToken } })
      .then((response) => {
        if (response.status === 200) {
          setUserGifts(response.data);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const deleteGift = async (id: number | null) => {
    if (!id) return;

    try {
      const response = await axios.delete(`https://storeapi.nestdex.dev/user/gifts/${id}`, {
        headers: { Authorization: authToken },
      });

      if (response.status === 200) {
        loadUserGifts();
        return true;
      }
    } catch (error) {
      console.error(t("gift.somethingWentWrong"), error);
      return false;
    } finally {
      setIsVisible(false);
    }
  };

  // const recreateGift = async (id: number | null) => {
  //   if (id === null) return;

  //   const currentGift = userGifts[selectedGiftIndex!];
  //   const newGift = {
  //     type: currentGift.type,
  //     number: currentGift.number,
  //     price: currentGift.price,
  //     image_url: currentGift.image_url,
  //   };

  //   const isDeleted = await deleteGift(id);

  //   if (isDeleted) {
  //     try {
  //       const response = await axios.post("https://storeapi.nestdex.dev/market/order/create", newGift, { headers: { Authorization: authToken } });

  //       if (response.status === 200) {
  //         loadUserGifts();
  //         showToast(t("myGifts.giftRecreated"), "success");
  //         setRecreatedGiftsIndexes([...recreatedGiftsIndexes, selectedGiftIndex!]);
  //       }
  //     } catch (error) {
  //       console.error(t("gift.somethingWentWrong"), error);
  //     }
  //   }
  // };

  useEffect(() => {
    loadUserGifts();
  }, []);

  return (
    <section className={styles.main}>
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} headline={t("myGifts.actionsGift")}>
        <div className={cn(styles.list, styles.modal)}>
          <Link to={`/gift/${selectedGift}/edit`} className={styles.listContent}>
            <div className={styles.description}>
              <img height={22} width={22} src="/photos/gift/edit.svg" alt="" />
              <h4 className={styles.title}>{t("myGifts.edit")}</h4>
            </div>
          </Link>
          <div className={styles.listContent}>
            <a className={styles.description} onClick={() => deleteGift(selectedGift)}>
              <img height={24} width={24} src="/photos/gift/delete.svg" alt="" />
              <h4 className={styles.title}>{t("myGifts.delete")}</h4>
            </a>
          </div>
          {/* {!recreatedGiftsIndexes.includes(selectedGiftIndex) && (
            <div className={styles.listContent}>
              <button className={styles.description} onClick={() => recreateGift(selectedGift)}>
                <img height={22} width={22} src="/photos/gift/remake.svg" alt="" />
                <h4 className={styles.title}>{t("myGifts.recreate")}</h4>
              </button>
            </div>
          )} */}
        </div>
      </Modal>
      <Modal isVisible={isModerationModalVisible} setIsVisible={setIsModerationModalVisible} paddingTop={24} headline={t("myGifts.createOrder")}>
        <div className={styles.image}>
          <img src="/photos/gift/info.svg" alt="" />
        </div>
        <p className={styles.modalDescription} dangerouslySetInnerHTML={{ __html: t("myGifts.successModalDescription") }} />
        <a href="https://t.me/nestmarket_bot" onClick={() => setIsModerationModalVisible(false)} className={cn(styles.button, styles.modalButton)}>
          {t("myGifts.okay")}
        </a>
      </Modal>
      <div className={styles.header}>
        <h1 className={styles.headline}>{t("myGifts.title")}</h1>
      </div>
      {userGifts.length === 0 ? (
        <div className={styles.empty}>
          <img width={38} height={35} src="/photos/nestEmpty.svg" alt="" />
          <p className={styles.emptyDescription}>{t("myGifts.empty")}</p>
        </div>
      ) : (
        <div className={styles.items}>
          <div className={styles.item}>
            <div className={styles.list}>
              {userGifts.map(({ type, id, image_url, is_active }, i) => (
                <div key={id} className={styles.listContent}>
                  <div className={styles.description}>
                    <DotLottieReact src={image_url} style={{ width: "24px", height: "24px" }} />
                    <h4 className={styles.title}>{type}</h4>
                  </div>
                  <div className={styles.icons}>
                    <a href={`https://t.me/nestore_robot/store?startapp=gift_${id}`} className={styles.menuButton}>
                      <img height={14} width={14} src="/photos/profile/share.svg" alt="Share" />
                    </a>
                    {!is_active && (
                      <button onClick={() => setIsModerationModalVisible(true)} className={styles.menuButton}>
                        <img height={14} width={14} src="/photos/profile/clock.svg" alt="Open menu" />
                      </button>
                    )}
                    <button onClick={() => selectGift(id, i)} className={styles.menuButton}>
                      <img height={12} width={6} src="/photos/profile/dots.svg" alt="Open menu" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default MyGifts;
