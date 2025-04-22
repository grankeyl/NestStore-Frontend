import { IGift } from "@types";
import { useEffect, useRef, useState } from "react";

export const useStoreAuctionObserver = (
  storeGiftsAuction: IGift[],
  lastItemAuctionRef: React.RefObject<HTMLDivElement>,
  isLoading: boolean,
  getStoreGiftsAuction: (offset: number) => Promise<void>,
  hasMoreAuction: boolean
) => {
  const observer = useRef<IntersectionObserver | null>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMoreAuction) {
          setOffset((prevOffset) => prevOffset + 20);
        }
      },
      { threshold: 1.0 }
    );

    if (lastItemAuctionRef.current) observer.current.observe(lastItemAuctionRef.current);

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [isLoading, hasMoreAuction, storeGiftsAuction]);

  useEffect(() => {
    if (offset > 0 && hasMoreAuction) {
      getStoreGiftsAuction(offset);
    }
  }, [offset, hasMoreAuction]);
};
