import { IGift } from "@types";
import { showToast } from "@utils/showToast";
import axios from "axios";
import { useEffect } from "react";
import { useLocation } from "react-router";

export const useFetchGiftById = (isTokenReady: boolean, authToken: string | null, setSelectedItem: (gift: IGift) => void, setIsVisible: (isVisible: boolean) => void) => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const giftIdFromQuery = queryParams.get("gift");
  useEffect(() => {
    if (isTokenReady && giftIdFromQuery) {
      const fetchGiftById = async () => {
        try {
          const response = await axios.get(`https://apistore.nestdex.dev/market/gifts/${giftIdFromQuery}`, {
            headers: { Authorization: authToken },
          });
          setSelectedItem(response.data);
          setIsVisible(true);
        } catch (error) {
          console.error(error);
          showToast("Подарок не найден!", "error");
        }
      };

      fetchGiftById();
    }
  }, [isTokenReady, giftIdFromQuery, authToken]);
};
