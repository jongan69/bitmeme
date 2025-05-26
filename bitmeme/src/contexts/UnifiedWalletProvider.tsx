import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import * as bip39 from "bip39";
import * as ecc from '@bitcoinerlab/secp256k1';
import { BIP32Factory } from 'bip32';
import * as bitcoin from "bitcoinjs-lib";
import { getAddressFromPrivateKey, makeSTXTokenTransfer, broadcastTransaction } from "@stacks/transactions";
import { Keypair as SolanaKeypair, Transaction as SolanaTx, VersionedTransaction, Connection } from "@solana/web3.js";
import { ethers } from "ethers";
import ECPairFactory from "ecpair";
import { STACKS_MAINNET, STACKS_TESTNET } from "@stacks/network";
import { tweakSigner } from "@/bitcoin/wallet";
import { broadcastRawTx } from "@/bitcoin/rpcClient";
import { notifyError } from "@/utils/notification";
import { useNetworkConfig } from "@/hooks/misc/useNetworkConfig";
import { AppNetwork, BitcoinNetwork, HyperevmNetwork, StacksNetwork } from "@/types/store";
import { Platform } from "react-native";
import { getLocalStorage, setLocalStorage } from "@/utils/localStorage";

// If you see module not found errors for bip39, bip32, ethers, ecpair, install them with:
// npm install bip39 bip32 bitcoinjs-lib @stacks/transactions @stacks/network @solana/web3.js ethers ecpair @bitcoinerlab/secp256k1
// If you see missing types errors, try: npm install --save-dev @types/bip39 @types/bip32 @types/node

const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);

const appNetwork = process.env.EXPO_PUBLIC_APP_NETWORK || "devnet";
const solanaNetwork = appNetwork === AppNetwork.Mainnet ? "mainnet" : "devnet";
const solanaRpcUrl = appNetwork === AppNetwork.Mainnet ? process.env.EXPO_PUBLIC_SOLANA_MAINNET_RPC! : process.env.EXPO_PUBLIC_SOLANA_DEVNET_RPC!;
const solanaConnection = new Connection(solanaRpcUrl);
const DUST_THRESHOLD = 330; // P2TR dust threshold
// --- Types ---
type UnifiedWalletContextType = {
  mnemonic: string;
  solana: {
    keypair: SolanaKeypair;
    publicKey: string;
    signTransaction: (tx: SolanaTx | VersionedTransaction) => Promise<SolanaTx | VersionedTransaction>;
    signMessage: (msg: Uint8Array) => Promise<Uint8Array>;
    sendTransaction: (tx: SolanaTx | VersionedTransaction) => Promise<string>;
    exportPrivateKey: () => Promise<string>;
    getCurrentWallet: () => SolanaKeypair;
    connection: Connection;
    network: string;
  };
  bitcoin: {
    address: string;
    privateKey: string;
    signPsbt: (psbt: bitcoin.Psbt) => Promise<string>;
    sendBitcoin: (toAddress: string, satoshis: number, options?: { feeRate?: number }) => Promise<string>;
  };
  stacks: {
    address: string;
    privateKey: string;
    tipUser: (recipient: string, amount: bigint, memo?: string) => Promise<string | undefined>;
  };
  ethereum: {
    address: string;
    privateKey: string;
    signTransaction: (tx: ethers.TransactionRequest) => Promise<string>;
    signMessage: (msg: string) => Promise<string>;
  };
  hyperevm: {
    address: string;
    privateKey: string;
    signTransaction: (tx: ethers.TransactionRequest) => Promise<string>;
    signMessage: (msg: string) => Promise<string>;
    provider: ethers.JsonRpcProvider;
  };
  exportMnemonic: () => string;
  regenerate: () => void;
};

const UnifiedWalletContext = createContext<UnifiedWalletContextType | undefined>(undefined);

// --- Bitcoin helpers (self-contained) ---
async function fetchDynamicFeeRate() {
  const rpcUrl = appNetwork === AppNetwork.Mainnet
    ? process.env.EXPO_PUBLIC_BITCOIN_MAINNET_RPC!
    : process.env.EXPO_PUBLIC_BITCOIN_TESTNET_RPC!;
  try {
    if (!rpcUrl) {
      throw new Error("Bitcoin RPC URL is not set");
    }
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 1, jsonrpc: "2.0", method: "estimatesmartfee", params: [10] }),
    });
    const data = await response.json();
    const feerateBtcPerKb = data.result?.feerate;
    if (feerateBtcPerKb) {
      return Math.ceil((feerateBtcPerKb * 1e8) / 1000); // sats/vByte
    }
  } catch (e) {
    console.warn('[fetchDynamicFeeRate] Failed to fetch dynamic fee rate, using default:', e);
  }
  return 2;
}

async function fetchUtxos(address: string, network: string) {
  try {
    const response = await fetch(`https://mempool.space/${network}/api/address/${address}/utxo`);
    const data = await response.json();
    const utxos = data.map((u: any) => ({
      transaction_id: u.txid,
      transaction_index: u.vout,
      satoshis: Number(u.value),
    }));
    return utxos;
  } catch (e) {
    console.warn('[fetchUtxos] Failed to fetch utxos, using default:', e);
  }
  return [];
}

function estimateVsize(inputCount: number, outputCount: number): number {
  // Approximate for P2TR: 58 vbytes per input, 43 per output, +10 overhead
  return inputCount * 58 + outputCount * 43 + 10;
}

interface Utxo {
  transaction_id: string;
  transaction_index: number;
  satoshis: number;
}

function selectUtxosForAmount(
  utxos: Utxo[],
  amountNeeded: number,
  feeRate: number,
  outputCount = 2
): { selected: Utxo[]; fee: number } {
  let selected: Utxo[] = [];
  let total = 0;
  for (const utxo of utxos) {
    selected.push(utxo);
    total += utxo.satoshis;
    const vsize = estimateVsize(selected.length, outputCount);
    const fee = Math.ceil(feeRate * vsize);
    if (total >= amountNeeded + fee) {
      return { selected, fee };
    }
  }
  return { selected: [], fee: 0 }; // Not enough funds
}

export const UnifiedWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const networkConfig = useNetworkConfig();
  const stacksNetworkType = networkConfig.stacksNetwork;
  // console.log("stacksNetworkType", stacksNetworkType);
  const stacksNetwork = stacksNetworkType === StacksNetwork.Mainnet ? STACKS_MAINNET : STACKS_TESTNET;
  // console.log("stacksNetwork", stacksNetwork);
  const bitcoinNetworkType = networkConfig.bitcoinNetwork;
  const bitcoinNetwork = bitcoinNetworkType === BitcoinNetwork.Mainnet ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;

  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [wallets, setWallets] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const deriveWallets = useCallback((mnemonic: string) => {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const root = bip32.fromSeed(seed);

    // Solana
    const solanaNode = root.derivePath("m/44'/501'/0'/0'");
    const solanaKeypair = SolanaKeypair.fromSeed(solanaNode.privateKey!.slice(0, 32));
    const solanaPublicKey = solanaKeypair.publicKey.toBase58();

    // Bitcoin Taproot
    const bitcoinNode = root.derivePath("m/86'/0'/0'/0/0");
    const taprootAddress = bitcoin.payments.p2tr({
      internalPubkey: Buffer.from(bitcoinNode.publicKey.slice(1, 33)),
      network: bitcoinNetwork,
    }).address!;
    const bitcoinPrivateKey = Buffer.from(bitcoinNode.privateKey!).toString("hex");

    // Stacks
    let stacksAddress = "";
    let stacksPrivateKey = "";
    if(Platform.OS !== "web") {
      const stacksNode = root.derivePath("m/44'/5757'/0'/0/0");
      stacksPrivateKey = Buffer.from(stacksNode.privateKey!).toString("hex");
      stacksAddress = getAddressFromPrivateKey(stacksPrivateKey, stacksNetwork);
    } else {
     notifyError("Stacks is not supported on web");
    }

    // Ethereum
    const ethNode = root.derivePath("m/44'/60'/0'/0/0");
    const ethWallet = new ethers.Wallet(Buffer.from(ethNode.privateKey!).toString("hex"));

    // HyperEVM (same as Ethereum, but with HyperEVM RPC)
    const hyperevmNetworkType = networkConfig.hyperevmNetwork;
    const hyperevmNetwork = hyperevmNetworkType === HyperevmNetwork.Mainnet ? "mainnet" : "testnet";
    // Mainnet
    // Chain ID: 999

    // JSON-RPC endpoint: https://rpc.hyperliquid.xyz/evm for mainnet 

    // Testnet
    // Chain ID: 998 

    // JSON-RPC endpoint: https://rpc.hyperliquid-testnet.xyz/evm
    const hyperevmWallet = new ethers.Wallet(Buffer.from(ethNode.privateKey!).toString("hex"));
    const hyperevmProvider = new ethers.JsonRpcProvider(hyperevmNetwork === HyperevmNetwork.Mainnet ? "https://rpc.hyperliquid.xyz/evm" : "https://rpc.hyperliquid-testnet.xyz/evm");
    const hyperevmWalletWithProvider = hyperevmWallet.connect(hyperevmProvider);

    return {
      solana: { keypair: solanaKeypair, publicKey: solanaPublicKey },
      bitcoin: { address: taprootAddress, privateKey: bitcoinPrivateKey },
      stacks: { address: stacksAddress, privateKey: stacksPrivateKey },
      ethereum: { address: ethWallet.address, privateKey: ethWallet.privateKey, wallet: ethWallet },
      hyperevm: {
        address: hyperevmWallet.address,
        privateKey: hyperevmWallet.privateKey,
        signTransaction: (tx: ethers.TransactionRequest) => hyperevmWalletWithProvider.signTransaction(tx),
        signMessage: (msg: string) => hyperevmWalletWithProvider.signMessage(msg),
        provider: hyperevmProvider,
      },
    };
  }, []);

  useEffect(() => {
    (async () => {
      const savedMnemonic = await getLocalStorage<string>("wallet_mnemonic", true); // use secure storage
      if (savedMnemonic) {
        console.log("Mnemonic found, loading wallets");
        setMnemonic(savedMnemonic);
        setWallets(deriveWallets(savedMnemonic));
      } else {
        console.log("No mnemonic found, generating new one");
        const newMnemonic = bip39.generateMnemonic();
        setMnemonic(newMnemonic);
        setWallets(deriveWallets(newMnemonic));
        await setLocalStorage("wallet_mnemonic", newMnemonic, true);
      }
      setLoading(false);
    })();
  }, [deriveWallets]);

  // --- Solana functions ---
  const solanaSignTransaction = async (tx: SolanaTx | VersionedTransaction) => {
    if ("signatures" in tx && Array.isArray(tx.signatures)) {
      // VersionedTransaction
      // @ts-ignore
      tx.sign([wallets.solana.keypair]);
    } else {
      // Legacy Transaction
      // @ts-ignore
      tx.sign(wallets.solana.keypair);
    }
    return tx;
  };
  const solanaSignMessage = async (msg: Uint8Array) => {
    // Use signMessage for Solana Keypair
    // @ts-ignore
    return wallets.solana.keypair.signMessage(msg);
  };
  const solanaSendTransaction = async (transaction: SolanaTx | VersionedTransaction) => {
    if ("signatures" in transaction && Array.isArray(transaction.signatures)) {
      // VersionedTransaction
      // @ts-ignore
      transaction.sign([wallets.solana.keypair]);
    } else {
      // Legacy Transaction
      // @ts-ignore
      transaction.sign(wallets.solana.keypair);
    }
    const raw = transaction.serialize();
    return solanaConnection.sendRawTransaction(raw);
  };
  const solanaExportPrivateKey = async () => Buffer.from(wallets.solana.keypair.secretKey).toString("base64");
  const solanaGetCurrentWallet = () => wallets.solana.keypair;

  // --- Bitcoin functions ---
  const bitcoinSignPsbt = async (psbt: bitcoin.Psbt) => {
    const keyPair = ECPair.fromPrivateKey(Buffer.from(wallets.bitcoin.privateKey, "hex"));
    // Patch: Ensure publicKey is a Buffer for bitcoinjs-lib
    const patchedKeyPair = {
      ...keyPair,
      publicKey: Buffer.from(keyPair.publicKey),
    };
    psbt.signAllInputs(patchedKeyPair as any);
    psbt.finalizeAllInputs();
    return psbt.extractTransaction().toHex();
  };

  // --- Bitcoin sendBitcoin implementation ---
  const bitcoinSendBitcoin = async (toAddress: string, satoshis: number, options?: { feeRate?: number }) => {
    try {
      let feeRate = options?.feeRate || await fetchDynamicFeeRate();
      // 1. Fetch UTXOs
      const mempoolNetwork = bitcoinNetworkType === BitcoinNetwork.Mainnet ? "mainnet" : "testnet"; 
      const utxos = await fetchUtxos(wallets.bitcoin.address, mempoolNetwork);
      if (!utxos || utxos.length === 0) throw new Error("No UTXOs found for your address. Please fund your wallet.");
      // 2. UTXO selection (fee-aware)
      const satoshisInt = Math.floor(Number(satoshis));
      if (satoshisInt < DUST_THRESHOLD) throw new Error("Recipient output is below dust threshold");
      const { selected, fee } = selectUtxosForAmount(utxos, satoshisInt, feeRate);
      if (!selected.length) throw new Error("Insufficient funds for this transaction, including fees.");
      const inputSum = selected.reduce((sum: number, u: any) => sum + u.satoshis, 0);
      // 3. Build PSBT
      // For unified wallet, derive x-only pubkey from private key
      const pubkey = Buffer.from(ECPair.fromPrivateKey(Buffer.from(wallets.bitcoin.privateKey, 'hex')).publicKey);
      const userXOnlyPubKey = pubkey.slice(1, 33); // x-only pubkey
      const network = bitcoinNetwork; 
      const psbt = new bitcoin.Psbt({ network });
      for (const utxo of selected) {
        const script = bitcoin.payments.p2tr({ internalPubkey: userXOnlyPubKey, network }).output!;
        psbt.addInput({
          hash: utxo.transaction_id,
          index: utxo.transaction_index,
          witnessUtxo: {
            script,
            value: utxo.satoshis,
          },
          tapInternalKey: userXOnlyPubKey,
        });
      }
      psbt.addOutput({ address: toAddress, value: satoshisInt });
      // 4. Change output
      const change = inputSum - satoshisInt - fee;
      const changeAddress = bitcoin.payments.p2tr({
        internalPubkey: userXOnlyPubKey,
        network,
      }).address;
      if (!changeAddress) throw new Error("Failed to derive change address");
      if (change >= DUST_THRESHOLD) {
        psbt.addOutput({ address: changeAddress, value: change });
      } else if (change > 0) {
        notifyError && notifyError(`Change (${change} sats) below dust threshold, added to fee.`);
      }
      // 5. Sign all inputs
      const keyPair = ECPair.fromPrivateKey(Buffer.from(wallets.bitcoin.privateKey, 'hex'), { compressed: true });
      const keyPairForSigner = {
        ...keyPair,
        publicKey: Buffer.from(keyPair.publicKey),
        privateKey: keyPair.privateKey,
        sign: (hash: Buffer) => Buffer.from(keyPair.sign(hash)),
        signSchnorr: (hash: Buffer) => Buffer.from(keyPair.signSchnorr(hash)),
      };
      const tweakedSigner = tweakSigner(keyPairForSigner, { network });
      for (let i = 0; i < psbt.data.inputs.length; i++) {
        psbt.signInput(i, tweakedSigner);
      }
      psbt.finalizeAllInputs();
      const txHex = psbt.extractTransaction().toHex();
      const txId = await broadcastRawTx(txHex, bitcoinNetworkType === BitcoinNetwork.Mainnet ? "mainnet" : "testnet");
      if (!txId) throw new Error('Broadcast failed, no txid returned');
      return txId;
    } catch (error: any) {
      notifyError && notifyError(`Failed to send Bitcoin: ${error.message}`);
      throw new Error(`Failed to send Bitcoin: ${error.message}`);
    }
  };

  // --- Ethereum functions ---
  const ethereumSignTransaction = async (tx: ethers.TransactionRequest) => {
    return wallets.ethereum.wallet.signTransaction(tx);
  };
  const ethereumSignMessage = async (msg: string) => {
    return wallets.ethereum.wallet.signMessage(msg);
  };

  // Regenerate mnemonic and wallets
  const regenerate = useCallback(async () => {
    const newMnemonic = bip39.generateMnemonic();
    setMnemonic(newMnemonic);
    setWallets(deriveWallets(newMnemonic));
    await setLocalStorage("wallet_mnemonic", newMnemonic, true);
  }, [deriveWallets]);

  // Export mnemonic
  const exportMnemonic = useCallback(() => mnemonic || "", [mnemonic]);

  // --- Stacks tipUser function ---
  // Simple log setter fallback
  const setLog = (msg: string) => {
    if (typeof window !== 'undefined' && (window as any).setLog) {
      (window as any).setLog(msg);
    } else {
      console.log(msg);
    }
  };

  const tipUser = async (recipient: string, amount: bigint, memo = "") => {
    try {
      if (!wallets.stacks?.privateKey) throw new Error("Stacks wallet not initialized");
      const txOptions = {
        recipient,
        amount,
        senderKey: wallets.stacks.privateKey,
        network: stacksNetwork,
        memo,
      };
      console.log("tipUser txOptions", txOptions);
      const transaction = await makeSTXTokenTransfer(txOptions);
      console.log("tipUser transaction", transaction);
      const response = await broadcastTransaction({ transaction, network: stacksNetwork });
      console.log("tipUser broadcast response", response);
      if ("error" in response) {
        console.log("tipUser error", response.reason);
        notifyError && notifyError(`Tipping failed: ${response.reason}`);
        return undefined;
      } else {
        setLog(`Tipped ${amount} microSTX to ${recipient}. TxID: ${response.txid}`);
        return response.txid;
      }
    } catch (err: any) {
      setLog(`Tip Stacks error: ${err.message || err}`);
      notifyError && notifyError(`Tip Stacks error: ${err.message || err}`);
    }
  };

  if (loading || !mnemonic || !wallets) {
    return null; // or a loading spinner
  }

  return (
    <UnifiedWalletContext.Provider
      value={{
        mnemonic,
        solana: {
          ...wallets.solana,
          signTransaction: solanaSignTransaction,
          signMessage: solanaSignMessage,
          sendTransaction: solanaSendTransaction,
          exportPrivateKey: solanaExportPrivateKey,
          getCurrentWallet: solanaGetCurrentWallet,
          connection: solanaConnection,
          network: solanaNetwork,
        },
        bitcoin: {
          ...wallets.bitcoin,
          signPsbt: bitcoinSignPsbt,
          sendBitcoin: bitcoinSendBitcoin,
        },
        stacks: {
          ...wallets.stacks,
          tipUser,
        },
        ethereum: {
          address: wallets.ethereum.address,
          privateKey: wallets.ethereum.privateKey,
          signTransaction: ethereumSignTransaction,
          signMessage: ethereumSignMessage,
        },
        hyperevm: {
          address: wallets.hyperevm.address,
          privateKey: wallets.hyperevm.privateKey,
          signTransaction: wallets.hyperevm.signTransaction,
          signMessage: wallets.hyperevm.signMessage,
          provider: wallets.hyperevm.provider,
        },
        exportMnemonic,
        regenerate,
      }}
    >
      {children}
    </UnifiedWalletContext.Provider>
  );
};

// --- Hook ---
export const useUnifiedWallet = () => {
  const ctx = useContext(UnifiedWalletContext);
  if (!ctx) throw new Error("useUnifiedWallet must be used within UnifiedWalletProvider");
  return ctx;
}; 