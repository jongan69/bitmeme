import { NetworkConfig, NetworkConfigMap } from "@/types/network";
import { AppNetwork, BitcoinNetwork, EthereumNetwork, HyperevmNetwork, SolanaNetwork, StacksNetwork } from "@/types/store";

const appNetwork = process.env.EXPO_PUBLIC_APP_NETWORK === AppNetwork.Devnet ? AppNetwork.Devnet : AppNetwork.Mainnet;
const bitcoinNetwork = appNetwork === AppNetwork.Devnet ? BitcoinNetwork.Testnet : BitcoinNetwork.Mainnet;
const solanaNetwork = appNetwork === AppNetwork.Devnet ? SolanaNetwork.Devnet : SolanaNetwork.Mainnet;
const stacksNetwork = appNetwork === AppNetwork.Devnet ? StacksNetwork.Testnet : StacksNetwork.Mainnet;
const ethereumNetwork = appNetwork === AppNetwork.Devnet ? EthereumNetwork.Devnet : EthereumNetwork.Mainnet;  
const hyperevmNetwork = appNetwork === AppNetwork.Devnet ? HyperevmNetwork.Devnet : HyperevmNetwork.Mainnet;

const NETWORK_CONFIG_MAP: NetworkConfigMap = {
  [`${appNetwork}`]: {
    bitcoinNetwork,
    solanaNetwork,
    stacksNetwork,
    ethereumNetwork,
    hyperevmNetwork,
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
  appNetwork: AppNetwork,
): NetworkConfig => {
  const key = `${appNetwork}`;
  const config = NETWORK_CONFIG_MAP?.[key];

  if (!config) {
    throw new Error(`No configuration found for network: ${key}`);
  }

  return config;
};
