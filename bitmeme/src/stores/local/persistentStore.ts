import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  BitcoinNetwork,
  PersistentActions,
  PersistentState,
  SolanaNetwork,
  SolanaRpcProvider,
} from "@/types/store";

const usePersistentStore = create<PersistentState & PersistentActions>()(
  persist(
    (set) => ({
      // States
      solanaNetwork: SolanaNetwork.Devnet,
      bitcoinNetwork: BitcoinNetwork.Testnet,
      solanaRpcProvider: SolanaRpcProvider.Zeus,

      // Actions
      setSolanaNetwork: (network: SolanaNetwork) =>
        set({ solanaNetwork: network }),
      setBitcoinNetwork: (network: BitcoinNetwork) =>
        set({ bitcoinNetwork: network }),
      setSolanaRpcProvider: (provider: SolanaRpcProvider) =>
        set({ solanaRpcProvider: provider }),
    }),
    {
      name: "bitmeme",
    }
  )
);

export default usePersistentStore;
