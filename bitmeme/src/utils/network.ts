import { NetworkConfig, NetworkConfigMap } from "@/types/network";
import { BitcoinNetwork, SolanaNetwork } from "@/types/store";

// import { CUSTOM_SOLANA_DEVNET_RPC_KEY, getLocalStorage } from "./localStorage";

const NETWORK_CONFIG_MAP: NetworkConfigMap = {
  [`${BitcoinNetwork.Testnet}-${SolanaNetwork.Devnet}`]: {
    binanceUrl: "https://www.binance.com/api",
    aresUrl: process.env.EXPO_PUBLIC_REGTEST_DEVNET_ARES_URL!,
    aegleUrl: process.env.EXPO_PUBLIC_REGTEST_DEVNET_AEGLE_URL!,
    hermesUrl: process.env.EXPO_PUBLIC_REGTEST_DEVNET_HERMES_URL!,
    solanaUrl: process.env.EXPO_PUBLIC_SOLANA_DEVNET_RPC!,
    customSolanaUrl: process.env.EXPO_PUBLIC_SOLANA_DEVNET_RPC!,
    bitcoinExplorerUrl: process.env.EXPO_PUBLIC_REGTEST_BITCOIN_EXPLORER_URL ?? "https://bitcoin-regtest-devnet.zeusscan.work/",
    bootstrapperProgramId:process.env.EXPO_PUBLIC_DEVNET_BOOTSTRAPPER_PROGRAM_ID!,
    guardianSetting:process.env.EXPO_PUBLIC_REGTEST_DEVNET_TWO_WAY_PEG_GUARDIAN_SETTING ?? "",
  },
};

export const getNetworkConfig = (
  solanaNetwork: SolanaNetwork,
  bitcoinNetwork: BitcoinNetwork
): NetworkConfig => {
  const key = `${bitcoinNetwork}-${solanaNetwork}`;
  const config = NETWORK_CONFIG_MAP?.[key];

  if (!config) {
    throw new Error(`No configuration found for network: ${key}`);
  }

  return config;
};
