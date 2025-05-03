import { useState, useEffect, useCallback } from "react";
import { GiftTypeImages } from "@types";

const localStorageKey = "giftTypeImages";

const useGiftTypeImages = () => {
  const [giftTypeImages, setGiftTypeImages] = useState<GiftTypeImages>({
    jackinthebox: [],
    neko_helmet: [],
    top_hat: [],
    love_potion: [],
    toy_bear: [],
    diamond_ring: [],
    loot_bag: [],
    lunar_snake: [],
    tama_gadget: [],
    candy_cane: [],
    cookie_heart: [],
    party_sparkler: [],
    jingle_bells: [],
    ginger_cookie: [],
    winter_wreath: [],
    santa_hat: [],
    snow_globe: [],
    snow_mittens: [],
    sleigh_bell: [],
    jester_hat: [],
    star_notepad: [],
    bunny_muffin: [],
    swiss_watch: [],
    signet_ring: [],
    genie_lamp: [],
    astral_shard: [],
    precious_peach: [],
    plush_pepe: [],
    spiced_wine: [],
    jelly_bunny: [],
    hanging_star: [],
    durovs_cap: [],
    love_candle: [],
    perfume_bottle: [],
    mini_oscar: [],
    eternal_rose: [],
    berry_box: [],
    vintage_cigar: [],
    magic_potion: [],
    electric_skull: [],
    kissed_frog: [],
    hypno_lollipop: [],
    hex_pot: [],
    evil_eye: [],
    ion_gem: [],
    sharp_tongue: [],
    mad_pumpkin: [],
    trapped_heart: [],
    skull_flower: [],
    crystal_ball: [],
    flying_broom: [],
    voodoo_doll: [],
    scared_cat: [],
    witch_hat: [],
    eternal_candle: [],
    spy_agaric: [],
    lol_pop: [],
    homemade_cake: [],
    desk_calendar: [],
    bday_candle: [],
    easter_egg: [],
  });

  useEffect(() => {
    try {
      const storedImages = localStorage.getItem(localStorageKey);
      if (storedImages) {
        setGiftTypeImages(JSON.parse(storedImages) as GiftTypeImages);
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error);
    }
  }, []);

  const updateGiftTypeImages = useCallback((newImages: GiftTypeImages | ((prevImages: GiftTypeImages) => GiftTypeImages)) => {
    setGiftTypeImages((prevImages) => {
      const updatedImages = typeof newImages === "function" ? newImages(prevImages) : newImages;
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(updatedImages));
      } catch (error) {
        console.error("Error writing to localStorage:", error);
      }
      return updatedImages;
    });
  }, []);

  return [giftTypeImages, updateGiftTypeImages] as const;
};

export default useGiftTypeImages;
