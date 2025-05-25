import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  BitcoinNetwork,
  PersistentActions,
  PersistentState,
  SolanaNetwork,
} from "@/types/store";

const bitcoinNetwork = process.env.EXPO_PUBLIC_BITCOIN_NETWORK === "testnet" ? BitcoinNetwork.Testnet : BitcoinNetwork.Mainnet;
const solanaNetwork = process.env.EXPO_PUBLIC_SOLANA_NETWORK === "devnet" ? SolanaNetwork.Devnet : SolanaNetwork.Mainnet;


const usePersistentStore = create<PersistentState & PersistentActions>()(
  persist(
    (set) => ({
      // States
      solanaNetwork: solanaNetwork,
      bitcoinNetwork: bitcoinNetwork,

      // Actions
      setSolanaNetwork: (network: SolanaNetwork) =>
        set({ solanaNetwork: network }),
      setBitcoinNetwork: (network: BitcoinNetwork) =>
        set({ bitcoinNetwork: network }),
    }),
    {
      name: "bitmeme",
    }
  )
);

export default usePersistentStore;
