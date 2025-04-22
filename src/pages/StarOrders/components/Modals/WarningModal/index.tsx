//@ts-nocheck

import styles from "@pages/Orders/Orders.module.scss";
import Modal from "@components/Modal";
import { FC } from "react";
import { IOrder } from "@types";
import cn from "classnames";
import { useTranslation } from "react-i18next"; 

interface Props {
  selectedItem: IOrder;
  setIsVisible: (isVisible: boolean) => void;
  isVisible: boolean;
}

const WarningModal: FC<Props> = ({ isVisible, setIsVisible, selectedItem }) => {
  const { t } = useTranslation();

  return (
    <Modal paddingTop={24} headline={`${t("warningModal.order")}${selectedItem.id}`} isVisible={isVisible} setIsVisible={setIsVisible}>
      <div className={styles.warningContent}>
        <img src="/photos/modal/warning.svg" width={62} height={62} alt="" />
        <p className={styles.warningDescription}>{t("warningModal.warningDescriptionStars")}</p>
      </div>
      <div className={styles.buttons}>
        <button onClick={() => setIsVisible(false)} className={cn(styles.button, styles.main, styles.success)}>
          <span>{t("warningModal.okay")}</span>
        </button>
      </div>
    </Modal>
  );
};

export default WarningModal;
