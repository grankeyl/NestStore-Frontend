import { useNavigate } from "react-router";
import { t } from "i18next"

import cn from "classnames";
import styles from "./Button.module.scss";

const ButtonWidget = ({
  button,
  onClick,
}: {
  button: { type: string };
  onClick?: () => void;
}) => {
  const { type } = button;
  const navigate = useNavigate();

  function handleClick() {
    if (onClick) onClick();

    if (type === "repeat") {};
    if (type === "participate") {};
    if (type === "referral_link") {};
    if (type === "go_to_store") { navigate("/") };
  }

  return (
    <div className={styles.buttonWidget}>
      <button
        onClick={handleClick}
        className={cn(styles.buttonWidgetButton, styles[type])}
      >
        {type === "repeat" && <span>{t("giveawayOpen.buttonWidget.text1")}</span>}
        {type === "participate" && <span>{t("giveawayOpen.buttonWidget.text2")}</span>}
        {type === "referral_link" && <span>{t("giveawayOpen.buttonWidget.text3")}</span>}
        {type === "giveaway_link" && <span>{t("giveawayOpen.buttonWidget.text5")}</span>}
        {type === "go_to_store" && <span>{t("giveawayOpen.buttonWidget.text4")}</span>}
      </button>
    </div>
  );
};

export default ButtonWidget;