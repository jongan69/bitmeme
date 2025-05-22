import { Chain } from "@/types/network";

export const getExplorerUrl = (chain: Chain, txId: string, network: string) => {
  switch (chain) {
    case Chain.Bitcoin:
      return `https://mempool.space/${network}/tx/${txId}`;
    case Chain.Solana:
      return `https://solscan.io/tx/${txId}?cluster=${network}`;
    case Chain.Stacks:
      return `https://explorer.hiro.so/txid/${txId}?chain=${network}`;
  }
};
