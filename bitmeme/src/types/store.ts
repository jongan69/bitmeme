export enum AppNetwork {
  Devnet = "devnet",
  Mainnet = "mainnet",
}

export enum SolanaNetwork {
  Devnet = "devnet",
  Mainnet = "mainnet",
}

export enum BitcoinNetwork {
  Regtest = "regtest",
  Testnet = "testnet",
  Mainnet = "mainnet",
}

export enum StacksNetwork {
  Testnet = "testnet",
  Mainnet = "mainnet",
}

export enum EthereumNetwork {
  Devnet = "devnet",
  Mainnet = "mainnet",
}

export enum HyperevmNetwork {
  Devnet = "devnet",
  Mainnet = "mainnet",
} 

export enum BinanceNetwork {
  Devnet = "devnet",
  Mainnet = "mainnet",
}



export type PersistentState = {
  appNetwork: AppNetwork;
};

export type PersistentActions = {
  setAppNetwork: (network: AppNetwork) => void;
};
