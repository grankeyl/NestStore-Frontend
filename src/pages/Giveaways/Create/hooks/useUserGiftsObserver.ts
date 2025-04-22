import { IGift } from "@types";
import { useEffect, useRef, useState } from "react";

export const useUserGiftsObserver = (storeGifts: IGift[], lastItemRef: React.RefObject<HTMLDivElement>, isLoading: boolean, getStoreGifts: (offset: number) => Promise<void>, hasMore: boolean) => {
  const observer = useRef<IntersectionObserver | null>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    console.log("Обновление observer", { isLoading, hasMore, lastItemRef: lastItemRef.current });
  
    if (observer.current) observer.current.disconnect();
  
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          console.log("Обнаружен пересекающийся элемент, обновляем offset");
          setOffset((prevOffset) => prevOffset + 20);
        }
      },
      { threshold: 1.0 }
    );
  
    if (lastItemRef.current) {
      console.log("Наблюдаю за:", lastItemRef.current);
      observer.current.observe(lastItemRef.current);
    }
  
    return () => observer.current?.disconnect();
  }, [isLoading, hasMore, storeGifts, lastItemRef]);

  useEffect(() => {
    if (hasMore) getStoreGifts(offset);
  }, [offset, hasMore]);
};
