import { FC, FormEvent, useEffect, useState } from "react";
import styles from "./Gift.module.scss";
import cn from "classnames";
import Modal from "@components/Modal";
import axios from "axios";
import { GiftType, IGift } from "@types";
import { useLocation, useNavigate } from "react-router-dom";
import useGiftTypeImages from "@hooks/useGiftTypeImages.ts";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useTranslation } from "react-i18next";

const EditGift: FC = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("/photos/store/cap.png");
  const [tempSelectedImage, setTempSelectedImage] = useState<string>(selectedImage);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [_, setPrice] = useState(0.1);
  const [selectedGiftType, setSelectedGiftType] = useState<GiftType>("durovs_cap");
  const [giftData, setGiftData] = useState<IGift | null>(null);
  const location = useLocation();
  const path = location.pathname;
  const match = path.match(/gift\/([^/]+)/);
  const giftId = match ? match[1] : null;
  const [giftTypeImages] = useGiftTypeImages();

  const authToken = localStorage.getItem("token");

  useEffect(() => {
    if (!giftId) {
      navigate("/gifts");
      return;
    }

    axios
      .get(`https://apistore.nestdex.dev/market/gifts/${giftId}`, {
        headers: { Authorization: authToken },
      })
      .then(({ data, status }) => {
        if (status === 200) {
          setGiftData(data);
          setSelectedImage(data.image_url || "/photos/store/cap.png");
          setTempSelectedImage(data.image_url || "/photos/store/cap.png");
          setSelectedGiftType(data.type);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, [giftId, authToken, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    const updatedGift = {
      price: Number(formData.get("price")),
    };

    try {
      const response = await axios.post(`https://apistore.nestdex.dev/user/gifts/${giftId}`, updatedGift, {
        headers: {
          Authorization: authToken,
        },
      });

      if (response.status === 200) {
        setIsSubmitting(false);
        navigate("/profile/gifts");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(Number(e.target.value));
  };

  const handleModalImageClick = (imageUrl: string) => {
    setTempSelectedImage(imageUrl);
  };

  const handleModalSelect = () => {
    setSelectedImage(tempSelectedImage);
    setIsVisible(false);
  };

  return (
    <section className={styles.main}>
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} paddingTop={24} headline={t("editGift.selectImage")}>
        <div className={styles.modalItems}>
          {giftTypeImages[selectedGiftType].map((imageUrl, i) => (
            <button
              onClick={() => handleModalImageClick(imageUrl)}
              key={i}
              className={cn(styles.modalItem, {
                [styles.active]: imageUrl === tempSelectedImage,
              })}
            >
              <DotLottieReact src={imageUrl} style={{ width: "67px", height: "67px" }} autoplay loop />
            </button>
          ))}
        </div>
        <button className={cn(styles.modalButton, styles.button)} type="button" onClick={handleModalSelect}>
          {t("editGift.select")}
        </button>
      </Modal>

      <div className={styles.header}>
        <h1 className={styles.headline}>{t("editGift.title")}</h1>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.block}>
          <label htmlFor="price" className={styles.label}>
            <span>{t("editGift.price")}</span>
            <div className={styles.priceInput}>
              <input type="number" min={0.01} step={0.01} placeholder="0.00" defaultValue={giftData?.price} onChange={handlePriceChange} name="price" required />
              <img src="/photos/ton.svg" alt="" width={20} height={20} />
            </div>
          </label>
        </div>

        <button className={styles.button} type="submit" disabled={isSubmitting}>
          {isSubmitting ? <span>{t("editGift.editing")}</span> : <span>{t("editGift.edit")}</span>}
        </button>
      </form>
    </section>
  );
};

export default EditGift;
