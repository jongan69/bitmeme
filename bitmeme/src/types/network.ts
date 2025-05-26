import { BitcoinNetwork, EthereumNetwork, HyperevmNetwork, SolanaNetwork, StacksNetwork } from "./store";

export enum Chain {
  Solana = "Solana",
  Bitcoin = "Bitcoin",
  Stacks = "Stacks",
  Ethereum = "Ethereum",
  Hyperevm = "Hyperevm",
}

export interface NetworkConfig {
  bitcoinNetwork: BitcoinNetwork;
  solanaNetwork: SolanaNetwork;
  stacksNetwork: StacksNetwork;
  ethereumNetwork: EthereumNetwork;
  hyperevmNetwork: HyperevmNetwork;
  binanceUrl: string;
  aresUrl: string;
  aegleUrl: string;
  hermesUrl: string;
  solanaUrl: string;
  customSolanaUrl: string;
  bitcoinExplorerUrl: string;
  bootstrapperProgramId: string;
  guardianSetting: string;
}

export type NetworkConfigMap = Record<string, NetworkConfig>;
