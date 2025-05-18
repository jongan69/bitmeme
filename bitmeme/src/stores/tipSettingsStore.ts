import { create } from "zustand";
import { persist } from "zustand/middleware";

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
      // Optionally, customize storage for SecureStore if needed
    }
  )
); 