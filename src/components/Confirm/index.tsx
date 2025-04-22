import { FC, PropsWithChildren, useEffect, useState } from "react";
import styles from "./Confirm.module.scss";
import cn from "classnames";
import { createPortal } from "react-dom";
import { t } from "i18next";

interface Props extends PropsWithChildren {
  isVisible: boolean;
  setIsVisible: (value: boolean) => void;
  headline?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

const ConfirmModal: FC<Props> = ({ headline, children, isVisible, setIsVisible, onConfirm, onCancel }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsModalVisible(true);
    } else {
      setTimeout(() => setIsModalVisible(false), 100);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    onCancel?.();
  };

  return (
    <>
      {isModalVisible &&
        createPortal(
          <div onClick={handleClose} className={cn(styles.modal, { [styles.hidden]: !isVisible })}>
            <div onClick={(e) => e.stopPropagation()} className={styles.content}>
              <button onClick={handleClose} className={styles.close}>
                <img src="/photos/modal/close.svg" alt="Close modal" />
              </button>
              <h3 className={styles.headline}>{headline}</h3>
              <p className={styles.confirmDescr}>{children}</p>
              <div className={styles.actions}>
                <button onClick={handleClose} className={styles.no}>{t("modal.confirm.no")}</button>
                <button onClick={onConfirm} className={styles.yes}>{t("modal.confirm.yes")}</button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default ConfirmModal;