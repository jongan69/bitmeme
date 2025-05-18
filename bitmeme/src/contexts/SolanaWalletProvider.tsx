import { getLocalStorage, removeLocalStorage, setLocalStorage } from '@/utils/localStorage';
import { Connection, Keypair, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import nacl from 'tweetnacl';

export class WalletService {
  private static readonly WALLET_KEY = 'local_wallet';
  private static currentWallet: Keypair | null = null;

  static async createWallet(): Promise<Keypair> {
    const newWallet = Keypair.generate();
    await setLocalStorage(
      this.WALLET_KEY,
      Buffer.from(newWallet.secretKey).toString('base64')
    );
    this.currentWallet = newWallet;
    return newWallet;
  }

  static async loadWallet(): Promise<Keypair | null> {
    const savedWallet = await getLocalStorage<string>(this.WALLET_KEY);
    if (!savedWallet) {
      return null;
    }
    const secretKey = Buffer.from(savedWallet, 'base64');
    this.currentWallet = Keypair.fromSecretKey(secretKey);
    return this.currentWallet;
  }

  static async deleteWallet(): Promise<void> {
    await removeLocalStorage(this.WALLET_KEY);
    this.currentWallet = null;
  }

  static async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.currentWallet) {
      throw new Error("No wallet available");
    }
    transaction.sign(this.currentWallet);
    return transaction;
  }

  static async signMessage(message: Uint8Array): Promise<Uint8Array> {
    if (!this.currentWallet) {
      throw new Error("No wallet available");
    }
    return nacl.sign.detached(message, this.currentWallet.secretKey);
  }

  static getCurrentWallet(): Keypair | null {
    return this.currentWallet;
  }

  static async exportPrivateKey(): Promise<string | null> {
    if (!this.currentWallet) {
      throw new Error("No wallet available");
    }
    return Buffer.from(this.currentWallet.secretKey).toString('base64');
  }
}

interface SolanaWalletContextType {
  isAuthenticated: boolean;
  publicKey: PublicKey | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loadExistingWallet: () => Promise<void>;
  signTransaction: <T extends Transaction | VersionedTransaction>(transaction: T) => Promise<T>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  getCurrentWallet: () => Keypair | null;
  exportPrivateKey: () => Promise<string | null>;
  connection: Connection;
  network: string;
  sendTransaction: (transaction: Transaction | VersionedTransaction) => Promise<string>;
}

const SolanaWalletContext = createContext<SolanaWalletContextType | null>(null)

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null)

  const connection = React.useMemo(
    () => new Connection(process.env.EXPO_PUBLIC_SOLANA_DEVNET_RPC!),
    []
  );

  // Define network (from env or default to 'devnet')
  const network = process.env.EXPO_PUBLIC_SOLANA_NETWORK || "devnet";

  const loadExistingWallet = useCallback(async () => {
    const wallet = await WalletService.loadWallet()
    if (wallet) {
      setIsAuthenticated(true)
      setPublicKey(wallet.publicKey)
    } else {
      setIsAuthenticated(false)
      setPublicKey(null)
    }
  }, [])

  const login = useCallback(async () => {
    let wallet = await WalletService.loadWallet()
    if (!wallet) {
      wallet = await WalletService.createWallet()
    }
    setIsAuthenticated(true)
    setPublicKey(wallet.publicKey)
  }, [])

  const logout = useCallback(async () => {
    await WalletService.deleteWallet()
    setIsAuthenticated(false)
    setPublicKey(null)
  }, [])

  // Add wallet actions for context
  const signTransaction = useCallback(
    async <T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> => {
      if (transaction instanceof Transaction) {
        return WalletService.signTransaction(transaction) as Promise<T>;
      } else if (transaction instanceof VersionedTransaction) {
        // Get the current wallet (Keypair)
        const wallet = WalletService.getCurrentWallet();
        if (!wallet) throw new Error("No wallet available");

        // Sign the message with the wallet's secret key using tweetnacl
        const signature = nacl.sign.detached(
          transaction.message.serialize(),
          wallet.secretKey
        );
        // Set the signature in the transaction (as Uint8Array)
        transaction.signatures[0] = signature;
        return transaction as T;
      } else {
        throw new Error('Unknown transaction type');
      }
    },
    []
  );

  const signMessage = useCallback(async (message: Uint8Array) => {
    return WalletService.signMessage(message)
  }, [])

  const getCurrentWallet = useCallback(() => {
    return WalletService.getCurrentWallet()
  }, [])

  const exportPrivateKey = useCallback(async () => {
    return WalletService.exportPrivateKey()
  }, [])

  // Add sendTransaction method
  const sendTransaction = useCallback(
    async (transaction: Transaction | VersionedTransaction) => {
      const wallet = WalletService.getCurrentWallet();
      if (!wallet) throw new Error("No wallet available");

      let signedTx: Transaction | VersionedTransaction;
      if (transaction instanceof Transaction) {
        signedTx = await WalletService.signTransaction(transaction);
      } else {
        // VersionedTransaction
        const signature = nacl.sign.detached(
          transaction.message.serialize(),
          wallet.secretKey
        );
        transaction.signatures[0] = signature;
        signedTx = transaction;
      }

      const raw = signedTx.serialize();
      return connection.sendRawTransaction(raw);
    },
    [connection]
  );

  useEffect(() => {
    loadExistingWallet()
  }, [loadExistingWallet])

  const contextValue = React.useMemo(() => ({
    isAuthenticated,
    publicKey,
    login,
    logout,
    loadExistingWallet,
    signTransaction,
    signMessage,
    getCurrentWallet,
    exportPrivateKey,
    connection,
    network,
    sendTransaction,
  }), [isAuthenticated, publicKey, login, logout, loadExistingWallet, signTransaction, signMessage, getCurrentWallet, exportPrivateKey, connection, network, sendTransaction])

  return (
    <SolanaWalletContext.Provider value={contextValue}>
      {children}
    </SolanaWalletContext.Provider>
  );
}

export function useSolanaWallet() {
  const context = useContext(SolanaWalletContext)
  if (!context) {
    throw new Error('useSolanaWallet must be used within a SolanaWalletProvider')
  }
  return context
} 