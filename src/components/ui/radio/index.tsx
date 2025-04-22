import { ComponentPropsWithoutRef, FC } from "react";
import styles from "./Radio.module.scss";

const Radio: FC<ComponentPropsWithoutRef<"input">> = ({ ...props }) => {
  return <input className={styles.radio} {...props} type="radio" />;
};

export default Radio;
