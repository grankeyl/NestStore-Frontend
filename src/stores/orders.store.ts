import { create } from "zustand";

interface OrdersState {
  isModalOpen: boolean;
  selectedItemIndex: number;
  setSelectedItemIndex: (index: number) => void;
  setIsModalOpen: (isModalOpen: boolean) => void;
}

export const useOrdersStore = create<OrdersState>()((set) => ({
  isModalOpen: false,
  selectedItemIndex: 0,
  setSelectedItemIndex: (index) => set({ selectedItemIndex: index }),
  setIsModalOpen: (isModalOpen) => set({ isModalOpen }),
}));
