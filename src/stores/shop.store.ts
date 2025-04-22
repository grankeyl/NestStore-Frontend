import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FiltersState {
  from: string;
  to: string;
  rarity: string[];
  type: string[];
  sort: string;
  numberFrom: string;
  numberTo: string;
  finModels: string[];
  setFrom: (value: string) => void;
  setTo: (value: string) => void;
  setType: (type: string[]) => void;
  setRarity: (rarity: string[]) => void;
  setSort: (sort: string) => void;
  setNumberFrom: (value: string) => void;
  setNumberTo: (value: string) => void;
  setFinModels: (finModels: string[]) => void;
}

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      from: "",
      to: "",
      rarity: [],
      type: [],
      sort: "recently_added",
      numberFrom: "",
      numberTo: "",
      finModels: [],
      setFrom: (value) => set({ from: value }),
      setTo: (value) => set({ to: value }),
      setType: (type) => set({ type }),
      setRarity: (rarity) => set({ rarity }),
      setSort: (sort) => set({ sort }),
      setNumberFrom: (value) => set({ numberFrom: value }),
      setNumberTo: (value) => set({ numberTo: value }),
      setFinModels: (finModels) => set({ finModels }),
    }),
    {
      name: "filters-storage",
    }
  )
);