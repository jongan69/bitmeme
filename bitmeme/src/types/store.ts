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

export type PersistentState = {
  solanaNetwork: SolanaNetwork;
  bitcoinNetwork: BitcoinNetwork;
};

export type PersistentActions = {
  setSolanaNetwork: (network: SolanaNetwork) => void;
  setBitcoinNetwork: (network: BitcoinNetwork) => void;
};
