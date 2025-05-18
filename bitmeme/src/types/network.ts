export enum Chain {
  Solana = "Solana",
  Bitcoin = "Bitcoin",
}

export interface NetworkConfig {
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
