import { FC, PropsWithChildren, useEffect, useState } from "react";
import styles from "./Modal.module.scss";
import cn from "classnames";
import { createPortal } from "react-dom";

interface Props extends PropsWithChildren {
  isVisible: boolean;
  setIsVisible: (value: boolean) => void;
  headline?: string;
  type?: "storeCard" | "default";
  paddingTop?: number;
  style?: React.CSSProperties;
  isCloseButton?: boolean;
  onClose?: () => void;
}

const Modal: FC<Props> = ({ headline, children, isVisible, setIsVisible, paddingTop = 14, style, type = "default", onClose, isCloseButton = true }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsModalVisible(true);
    } else {
      setTimeout(() => {
        setIsModalVisible(false);
      }, 100);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (type === "storeCard") {
    return (
      <>
        {isModalVisible &&
          createPortal(
            <div onClick={handleClose} className={cn(styles.modal, { [styles.hidden]: !isVisible })} style={style}>
              <div onClick={(e) => e.stopPropagation()} className={styles.content} style={{ paddingTop }}>
                {isCloseButton && <button onClick={handleClose} className={styles.closeStore}>
                  <img src="/photos/modal/close.svg" alt="" />
                </button>}
                {children}
              </div>
            </div>,
            document.body
          )}
      </>
    );
  }

  return (
    <>
      {isModalVisible &&
        createPortal(
          <div onClick={handleClose} className={cn(styles.modal, { [styles.hidden]: !isVisible })} style={style}>
            <div onClick={(e) => e.stopPropagation()} className={styles.content} style={{ paddingTop }}>
              <div className={styles.header}>
                <h3 className={styles.headline}>{headline}</h3>
                <button onClick={handleClose} className={styles.close}>
                  <img src="/photos/modal/close.svg" alt="Close modal" />
                </button>
              </div>
              {children}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default Modal;
