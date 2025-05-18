import * as Clipboard from "expo-clipboard";
import { SolanaNetwork } from "@/types/store";
import { Platform } from "react-native";

export const getSolanaExplorerUrl = (
  solanaNetwork: SolanaNetwork,
  type: "address" | "tx",
  target: string | undefined
) => {
  if (!target) return "";

  switch (solanaNetwork) {
    case SolanaNetwork.Devnet:
      return `https://explorer.solana.com/${type}/${target}?cluster=devnet`;
    default:
      return `https://explorer.solana.com/${type}/${target}`;
  }
};

export const handleCopy = (value: string = "") => {
  if (!value) return;
  Clipboard.setStringAsync(value);
};

export const isMobile = Platform.OS === "ios" || Platform.OS === "android";
