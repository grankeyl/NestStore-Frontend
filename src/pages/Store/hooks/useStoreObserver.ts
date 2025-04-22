import { IGift } from "@types";
import { useEffect, useRef, useState } from "react";

export const useStoreObserver = (storeGifts: IGift[], lastItemRef: React.RefObject<HTMLDivElement>, isLoading: boolean, getStoreGifts: (offset: number) => Promise<void>, hasMore: boolean) => {
  const observer = useRef<IntersectionObserver | null>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          setOffset((prevOffset) => prevOffset + 20);
        }
      },
      { threshold: 1.0 }
    );

    if (lastItemRef.current) observer.current.observe(lastItemRef.current);

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [isLoading, hasMore, storeGifts]);

  useEffect(() => {
    if (offset > 0 && hasMore) {
      getStoreGifts(offset);
    }
  }, [offset, hasMore]);
};
