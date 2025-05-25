import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { zustandCustomStorage } from "@/utils/zustandCustomStorage";

export type TipSettingsState = {
  tipCurrency: string;
  tipAmount: string;
  autoTipOn: boolean;
  setTipCurrency: (v: string) => void;
  setTipAmount: (v: string) => void;
  setAutoTipOn: (v: boolean) => void;
};

export const useTipSettingsStore = create<TipSettingsState>()(
  persist(
    (set) => ({
      tipCurrency: "STX",
      tipAmount: "1",
      autoTipOn: false,
      setTipCurrency: (v: string) => set({ tipCurrency: v }),
      setTipAmount: (v: string) => set({ tipAmount: v }),
      setAutoTipOn: (v: boolean) => set({ autoTipOn: v }),
    }),
    {
      name: "tip-settings-store",
      storage: createJSONStorage(() => zustandCustomStorage),
    }
  )
); 