//@ts-nocheck

import { t } from "i18next"
import { useEffect, useState } from "react";
import { giftTypeBackdrops } from "@data/gifts";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import axios from "axios";
import cn from "classnames";
import styles from "./Gifts.module.scss";
import { getModelLottie, getNftBackground } from "@utils/nftUtils";

const authToken = localStorage.getItem("token");

const GiftsWidget = ({ gifts }: { gifts: any }) => {
  const [showMoreGifts, setShowMoreGifts] = useState(false);

  const handleShowMoreGifts = () => {
    setShowMoreGifts(true);
  }

  return (
    <div className={styles.giftsBlocker}>
        {(showMoreGifts || gifts.length <= 7) && (
          <div className={styles.giveawaysModalGifters}>
            {gifts.map((gift, index) => (
              <>
                <div 
                  key={index}
                  className={`${styles.giveawaysModalGiftersCard} ${styles.backdrop}`}
                  style={{
                    background: `radial-gradient(circle,
                      ${getNftBackground(gift.background_name).centerColor || '#4d5254'} 0%,
                      ${getNftBackground(gift.background_name).edgeColor || '#313638'} 100%),
                      ${getNftBackground(gift.background_name).patternColor || '#000000'}`,
                  }}
                >
                  <DotLottieReact src={getModelLottie(gift.type, gift.model_name)} style={{ width: "52px", height: "52px" }} />
                </div>
              </>
            ))}
          </div>
        )}

        {!showMoreGifts && gifts.length > 7 && (
          <div className={cn(styles.giveawaysModalGifters, styles.giveawaysModalGiftersNoMore)}>
            <div className={styles.giveawaysModalGiftersNoMoreDiv}>
              <div onClick={() => handleShowMoreGifts()} className={styles.giveawaysModalGiftersNoMoreDivIcon}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M4.81078 7.14863C5.00485 6.90604 5.35883 6.86671 5.60141 7.06078L9.00002 9.77967L12.3986 7.06078C12.6412 6.86671 12.9952 6.90604 13.1893 7.14863C13.3833 7.39121 13.344 7.74519 13.1014 7.93926L9.35141 10.9393C9.14598 11.1036 8.85407 11.1036 8.64863 10.9393L4.89863 7.93926C4.65604 7.74519 4.61671 7.39121 4.81078 7.14863Z" fill="#8380FF"/>
                </svg>
              </div>
            </div>

            {gifts.map((gift, index) => (
              <>
                <div 
                  key={index}
                  className={`${styles.giveawaysModalGiftersCard} ${styles.backdrop}`}
                  style={{
                    background: `radial-gradient(circle,
                      ${getNftBackground(gift.background_name).centerColor || '#4d5254'} 0%,
                      ${getNftBackground(gift.background_name).edgeColor || '#313638'} 100%),
                      ${getNftBackground(gift.background_name).patternColor || '#000000'}`,
                  }}
                >
                  <DotLottieReact src={getModelLottie(gift.type, gift.model_name)} style={{ width: "52px", height: "52px" }} />
                </div>
              </>
            ))}
          </div>
        )}
    </div>
  );
};

export default GiftsWidget;