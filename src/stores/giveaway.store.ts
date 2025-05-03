import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CreateGiveawayState {
  createGiveawayChannels: any;
  setCreateGiveawayChannels: (createGiveawayChannels: any) => void;
}

export const useCreateGiveawayStore = create<CreateGiveawayState>()(
  persist(
    (set) => ({
      createGiveawayChannels: [],
      setCreateGiveawayChannels: (value) => set({ createGiveawayChannels: value }),
    }),
    {
      name: "create-giveaway-storage",
    }
  )
);