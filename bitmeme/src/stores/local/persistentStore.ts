import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  AppNetwork,
  PersistentActions,
  PersistentState
} from "@/types/store";

const appNetwork = process.env.EXPO_PUBLIC_APP_NETWORK === "devnet" ? AppNetwork.Devnet : AppNetwork.Mainnet;


const usePersistentStore = create<PersistentState & PersistentActions>()(
  persist(
    (set) => ({
      // States
      appNetwork: appNetwork,

      // Actions
      setAppNetwork: (network: AppNetwork) =>
        set({ appNetwork: network }),
    }),
    {
      name: "bitmeme",
    }
  )
);

export default usePersistentStore;
