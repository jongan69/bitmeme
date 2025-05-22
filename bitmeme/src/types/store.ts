export enum SolanaNetwork {
  Devnet = "devnet",
  Mainnet = "mainnet",
}

export enum BitcoinNetwork {
  Regtest = "regtest",
  Testnet = "testnet",
  Mainnet = "mainnet",
}

export enum SolanaRpcProvider {
  Zeus,
  Custom,
}

export type StoreStates = {
  currentModal: string | null;
  isGlobalLoaderOpen: boolean;
};

export type StoreActions = {
  openModalByName: (name: string) => void;
  closeModal: () => void;
  setIsGlobalLoaderOpen: (isOpen: boolean) => void;
};

export type PersistentState = {
  solanaNetwork: SolanaNetwork;
  bitcoinNetwork: BitcoinNetwork;
  solanaRpcProvider: SolanaRpcProvider;
};

export type PersistentActions = {
  setSolanaNetwork: (network: SolanaNetwork) => void;
  setBitcoinNetwork: (network: BitcoinNetwork) => void;
  setSolanaRpcProvider: (provider: SolanaRpcProvider) => void;
};
