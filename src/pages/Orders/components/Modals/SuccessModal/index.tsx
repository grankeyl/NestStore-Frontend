//@ts-nocheck

import { useOrdersStore } from "@stores/orders.store";
import styles from "@pages/Orders/Orders.module.scss";
import Modal from "@components/Modal";
import { FC } from "react";
import { IOrder } from "@types";
import cn from "classnames";

interface Props {
  selectedItem: IOrder;
}

const SuccessModal: FC<Props> = () => {
  const isVisible = useOrdersStore((state) => state.isModalOpen);
  const setIsVisible = useOrdersStore((state) => state.setIsModalOpen);

  return (
    <Modal paddingTop={24} headline="Order #12991" isVisible={isVisible} setIsVisible={setIsVisible}>
      <div className={styles.successContent}>
        <img src="/photos/modal/success.svg" width={62} height={62} alt="" />
        <p className={styles.successDescription}>The gift has been received!</p>
      </div>
      <div className={styles.buttons}>
        <button className={cn(styles.button, styles.main, styles.success)}>
          <span>Great!</span>
        </button>
      </div>
    </Modal>
  );
};

export default SuccessModal;
