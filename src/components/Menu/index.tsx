import { FC, useEffect, useState } from "react";
import styles from "./Menu.module.scss";
import { NavLink } from "react-router-dom";
import cn from "classnames";
import { t } from "i18next";
import i18n from "@i18n";
import { showToast } from "@utils/showToast";
import { useUserProfile } from "@contexts/user-profile";

const Menu: FC = () => {
  const { userProfile } = useUserProfile();

  const [_, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };

    i18n.on("languageChanged", handleLanguageChange);

    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, []);

  const tests = () => {
    if (import.meta.env.VITE_TEST_IDS.includes(userProfile?.id)) {
      return false;
    }

    return true;
  }

  tests();

  const routes = [
    {
      path: "/",
      label: t("menu.shop"),
      img: "/photos/menu/store.svg",
      disabled: false,
    },
    {
      path: "stars",
      label: t("menu.stars"),
      img: "/photos/menu/star.svg",
      disabled: true,
    },
    {
      path: "gift",
      label: t("menu.gift"),
      img: "/photos/menu/gift.svg",
      disabled: false,
    },
    {
      path: "giveaways",
      label: t("menu.giveaways"),
      img: "/photos/menu/giveaway.svg",
      disabled: false,
    },
    {
      path: "profile",
      label: t("menu.profile"), 
      img: "/photos/menu/profile.svg",
      disabled: false,
    },
  ];

  return (
    <nav className={styles.menu}>
      {routes.map(({ path, label, img, disabled }) => (
        <NavLink
          key={path}
          to={disabled ? '' : path}
          className={({ isActive }) =>
            cn(styles.link, {
              [styles.active]: isActive,
              [styles.disabled]: disabled,
            })
          }
          onClick={(e) => {
            if (disabled) {
              e.preventDefault();
              showToast(t("app.coming.soon"), "info");
            }
          }}
        >
          <img height={24} width={24} src={img} alt="" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default Menu;
