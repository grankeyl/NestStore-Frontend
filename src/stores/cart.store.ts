import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartState {
  cartGifts: any[];
  setCartGifts: (value: any[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cartGifts: [],
      setCartGifts: (value) => set({ cartGifts: value }),
    }),
    {
      name: "cart-storage",
    }
  )
);