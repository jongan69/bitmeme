import { PublicKey } from "@solana/web3.js";
 
import * as bitcoin from "bitcoinjs-lib";

import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  deriveBitcoinWallet,
  getBitcoinConnectorWallet,
  tweakSigner,
  txConfirm
} from "@/bitcoin/wallet";

import { useSolanaWallet } from "@/contexts/SolanaWalletProvider";
import usePersistentStore from "@/stores/local/persistentStore";
import { BitcoinNetwork } from "@/types/store";
import { BitcoinWallet, EventName } from "@/types/wallet";
import events from "@/utils/event";
import { notifyError } from "@/utils/notification";
import { MusesConnector } from "./connector";

import { type BaseConnector } from "./connector/base";
import { broadcastRawTx } from "@/bitcoin/rpcClient";
import { getInternalXOnlyPubkeyFromUserWallet } from "@/bitcoin/wallet";
import ecc from '@bitcoinerlab/secp256k1';
import ECPairFactory from 'ecpair';

const connectors: BaseConnector[] = [new MusesConnector()];

export type BitcoinWalletType = "connector" | "solana" | null;

export interface BitcoinWalletContextState {
  wallet: BitcoinWallet | null;
  connecting: boolean;
  connected: boolean;
  disconnecting: boolean;
  connectConnectorWallet: (
    connector: BaseConnector,
    isReconnect?: boolean
  ) => Promise<void>;
  connectDerivedWallet: () => Promise<void>;
  disconnect: () => void;
  signPsbt(psbt: bitcoin.Psbt, tweaked?: boolean): Promise<string>;

  // Connector Wallet States
  accounts: string[];
  provider: any;
  disconnectConnector: () => void;
  getPublicKey: (connector: BaseConnector) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
  evmAccount?: string;
  switchNetwork: (network: "livenet" | "testnet") => Promise<void>;
  getNetwork: () => Promise<"livenet" | "testnet">;
  sendBitcoin: (
    toAddress: string,
    satoshis: number,
    options?: { feeRate: number }
  ) => Promise<string>;
  bitcoinWalletType: BitcoinWalletType;
  setBitcoinWalletType: Dispatch<SetStateAction<BitcoinWalletType>>;
  connectors: BaseConnector[];
  connector: BaseConnector | undefined;
  setConnectorId: (connectorId?: string) => void;
  handleConnectorId: (connectorId: string) => Promise<void>;
  connectorId: string | undefined;
}

const BitcoinWalletContext = createContext<BitcoinWalletContextState | null>(
  null
);

export async function fetchDynamicFeeRate() {
  try {
    const response = await fetch("https://warmhearted-morning-cherry.btc-testnet.quiknode.pro/", {
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

export async function fetchUtxos(address: string, network: string) {
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

// Create ECPair instance using the same method as wallet.ts
const ECPair = ECPairFactory(ecc);
const DUST_THRESHOLD = 330; // P2TR dust threshold

// Helper functions for UTXO selection and vsize estimation
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

export function BitcoinWalletProvider({ children }: { children: ReactNode }) {
  const bitcoinNetwork = usePersistentStore((state: { bitcoinNetwork: any; }) => state.bitcoinNetwork);
  const { publicKey: solanaPubkey, signMessage: solanaSignMessage } = useSolanaWallet();
  const [bitcoinWallet, setBitcoinWallet] = useState<BitcoinWallet | null>(
    null  
  );
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [bitcoinWalletType, setBitcoinWalletType] =
    useState<BitcoinWalletType>(null);
  const [prevBitcoinNetwork, setPrevBitcoinNetwork] = useState<
    BitcoinNetwork | undefined
  >(bitcoinNetwork);
  const [prevSolanaPubkey, setPrevSolanaPubkey] = useState<
    PublicKey | null | undefined
  >(undefined);
  const [connectorId, setConnectorId] = useState<string | undefined>();
  const [accounts, setAccounts] = useState<string[]>([]);
  const connector = useMemo(() => {
    return connectors?.find((item) => item.metadata.id === connectorId);
  }, [connectorId]);
  const [sending, setSending] = useState(false);

  // FIXME:
  // ! unknown reason for no connector.disconnect() function call, not sure if it's a bug
  const handleDisconnect = useCallback(() => {
    setDisconnecting(true);
    try {
      setConnected(false);
      setBitcoinWallet(null);
      setBitcoinWalletType(null);
      setAccounts([]);
      // localStorage.removeItem("current-connector-id");
    } catch (e) {
      console.error(`Error in disconnect: ${e}`);
    } finally {
      setDisconnecting(false);
    }
  }, []);

  const handleSignPsbt = useCallback(
    async (psbt: bitcoin.Psbt, tweaked?: boolean) => {
      if (!bitcoinWallet) {
        throw new Error("Bitcoin wallet not connected");
      }

      // ! self derived wallet only for local test
      if (
        bitcoinWalletType === "solana" &&
        bitcoinWallet.tweakSigner &&
        bitcoinWallet.signer
      ) {
        if (tweaked) {
          psbt.signAllInputs(bitcoinWallet.tweakSigner);
        } else {
          psbt.signAllInputs(bitcoinWallet.signer);
        }
        psbt.finalizeAllInputs();
        return psbt.extractTransaction().toHex();
      }

      if (!connector) {
        throw new Error("Connector is not defined");
      }

      let signedPsbtHex = "";
      // TODO: currently only support the input pubkey is equal to the wallet's pubkey, no need to tweak the signer, leaved for future implementation
      // const provider = await connector.getProvider();

      // if (!provider) {
      //   throw new Error("Provider is not defined");
      // }

      // const toSignInputs = psbt.data.inputs.map((input, index) => {
      //   return {
      //     index,
      //     publicKey: bitcoinWallet.pubkey,
      //     disableTweakSigner: !tweaked,
      //   };
      // });

      // signedPsbtHex = await provider.signPsbt(psbt.toHex(), {
      //   autoFinalized: false,
      //   toSignInputs,
      // });

      // TODO: might need to checked if all provider signPsbt function is the same
      signedPsbtHex = await connector.signPsbt(psbt.toHex(), {
        autoFinalized: false,
      });

      psbt = bitcoin.Psbt.fromHex(signedPsbtHex);
      psbt.finalizeAllInputs();

      return psbt.extractTransaction().toHex();
    },
    [bitcoinWallet, bitcoinWalletType, connector]
  );

  const getPublicKey = useCallback(async (connector: BaseConnector) => {
    console.log('[getPublicKey] connector:', connector);
    console.log('[getPublicKey] connectors:', connectors);
    if (!connector) {
      throw new Error("Wallet not connected!");
    }
    const pubkey = await connector.getPublicKey();
    return pubkey;
  }, []);

  const signMessage = useCallback(
    async (message: string) => {
      if (!connector) {
        throw new Error("Wallet not connected!");
      }
      return connector.signMessage(message);
    },
    [connector]
  );

  const sendBitcoin = useCallback(
    async (
      toAddress: string,
      satoshis: number,
      options?: { feeRate: number }
    ) => {
      console.log('[sendBitcoin] connector:', connector);
      console.log('[sendBitcoin] connector:', connectors);
      console.log('[sendBitcoin] wallet:', bitcoinWallet);
      if (!connector) {
        throw new Error("Wallet not connected!");
      }

      return connector.sendBitcoin(toAddress, satoshis, options);
    },
    [connector]
  );

  const getNetwork = useCallback(async () => {
    if (!connector) {
      throw new Error("Wallet not connected!");
    }
    return connector.getNetwork();
  }, [connector]);

  // WARNING: not all connectors support switchNetwork
  const switchNetwork = useCallback(
    async (network: "livenet" | "testnet") => {
      if (!connector) {
        throw new Error("Wallet not connected!");
      }
      await connector.switchNetwork(network);
    },
    [connector]
  );

  const provider = useMemo(() => {
    if (connectorId) {
      return connectors
        .find((item) => item.metadata.id === connectorId)
        ?.getProvider();
    }
  }, [connectorId]);

  const disconnectConnector = useCallback(() => {
    txConfirm.reset();
    if (connector) {
      connector.disconnect();
    }
    setConnectorId(undefined);
  }, [connector]);

  const getBitcoinWallet = useCallback(
    async (connector: BaseConnector) => {
      if (!connector) {
        throw new Error("Connector is not defined");
      }

      const pubkey = await connector.getPublicKey();
      return getBitcoinConnectorWallet(pubkey, bitcoinNetwork);
    },
    [bitcoinNetwork]
  );

  const handleDerivedWalletConnect = useCallback(async () => {
    setConnecting(true);
    let res = null;
    try {
      if (!solanaPubkey) {
        return;
      }

      if (solanaSignMessage) {
        setBitcoinWalletType("solana");
        res = await deriveBitcoinWallet(
          solanaPubkey,
          bitcoinNetwork,
          solanaSignMessage
        );
        // console.log('[handleDerivedWalletConnect] res:', res);
      }

      if (!res) {
        setConnected(false);
        setBitcoinWalletType(null);
        return;
      } else {
        setConnectorId(undefined);
        setBitcoinWallet(res);
        setAccounts([res.p2tr]);
        setConnected(true);
      }
    } catch (e) {
      console.error(`Error in connect: ${e}`);
      setBitcoinWalletType(null);
    } finally {
      setConnecting(false);
    }
  }, [bitcoinNetwork, solanaPubkey, solanaSignMessage]);

  const handleConnectorConnect = useCallback(
    async (connector: BaseConnector) => {
      setConnecting(true);
      let res = null;
      try {
        if (!connector) {
          throw new Error("Connector is not defined");
        }
        if (!solanaPubkey) {
          throw new Error("Solana public key is missing");
        }
        setBitcoinWalletType("connector");

        // since the following function getBitcoinWallet will call the connector.getPublicKey() function, we need to connect to the wallet first
        // or else will get error "Wallet not connected!"
        await connector.requestAccounts();

        res = await getBitcoinWallet(connector);

        setBitcoinWallet(res);
        setAccounts([res.p2tr]);
        setConnectorId(connector.metadata.id);
        setConnected(true);

        if (!res) {
          // console.log("Error connecting Bitcoin wallet");
          setConnected(false);
          setBitcoinWalletType(null);
          return;
        }
      } catch (e) {
        console.error("Error in connect: ", e);
        if (
          e instanceof Error &&
          e.message.includes("only support") &&
          e.message.includes("p2tr")
        ) {
          notifyError(
            "Failed to connect Bitcoin wallet. Please select a P2TR-type address to continue."
          );
        }
        // TODO: might need to add notification for user instruction
        setBitcoinWalletType(null);
      } finally {
        setConnecting(false);
      }
    },
    [solanaPubkey, getBitcoinWallet]
  );

  const handleConnectorId = useCallback(
    async (connectorId: string) => {
      const connector = connectors.find(
        (item) => item.metadata.id === connectorId
      );
      if (!connector) {
        throw new Error(`connector id ${connectorId} not found`);
      }
      setConnectorId(connector.metadata.id);
    },
    [setConnectorId]
  );

  useEffect(() => {
    const onAccountChange = async () => {
      if (!connector) {
        console.error("Connector is not defined");
        return;
      }

      handleDisconnect();
    };

    connector?.on("accountsChanged", onAccountChange);
    return () => {
      connector?.removeListener("accountsChanged", onAccountChange);
    };
  }, [connector, handleDisconnect]);

  useEffect(() => {
    if (accounts.length === 0) {
      if (events.listenerCount(EventName.sendUserOpResult) > 0) {
        events.emit(EventName.sendUserOpResult, {
          error: {
            code: -32600,
            message: "Wallet disconnected",
          },
        });
      } else if (events.listenerCount(EventName.personalSignResult) > 0) {
        events.emit(EventName.personalSignResult, {
          error: {
            code: -32600,
            message: "Wallet disconnected",
          },
        });
      } else if (events.listenerCount(EventName.signTypedDataResult) > 0) {
        events.emit(EventName.signTypedDataResult, {
          error: {
            code: -32600,
            message: "Wallet disconnected",
          },
        });
      }
    }
  }, [accounts]);

  // When user switch account in their solana wallet, we need to disconnect bitcoin wallet because the bitcoin address is derive from their solana address
  if (prevSolanaPubkey !== solanaPubkey && solanaPubkey) {
    setPrevSolanaPubkey(solanaPubkey);
    handleDisconnect();
  }

  if (prevBitcoinNetwork !== bitcoinNetwork) {
    setPrevBitcoinNetwork(bitcoinNetwork);
    handleDisconnect();
  }


  const sendBitcoinWithDerivedWallet = useCallback(
    async (toAddress: string, satoshis: number): Promise<string> => {
      if (sending) throw new Error('A transaction is already being sent.'); // Prevent double send
      setSending(true);
      try {
        if (!bitcoinWallet || bitcoinWalletType !== "solana") {
          throw new Error("Solana-derived Bitcoin wallet not connected");
        }
        // 0. Fetch recommended fee rate
        let feeRate = await fetchDynamicFeeRate();

        // 1. Fetch UTXOs
        const mempoolNetwork =
          bitcoinNetwork === "livenet" || bitcoinNetwork === "mainnet"
            ? "mainnet"
            : bitcoinNetwork === "testnet"
              ? "testnet"
              : "signet";
        const utxos = await fetchUtxos(bitcoinWallet.p2tr, mempoolNetwork);
        if (!utxos || utxos.length === 0) throw new Error("No UTXOs found for your address. Please fund your wallet.");

        // 2. UTXO selection (fee-aware)
        const satoshisInt = Math.floor(Number(satoshis));
        if (satoshisInt < DUST_THRESHOLD) throw new Error("Recipient output is below dust threshold");
        const { selected, fee } = selectUtxosForAmount(utxos, satoshisInt, feeRate);
        if (!selected.length) throw new Error("Insufficient funds for this transaction, including fees.");
        const inputSum = selected.reduce((sum, u) => sum + u.satoshis, 0);

        // 3. Build PSBT
        const userXOnlyPubKey = getInternalXOnlyPubkeyFromUserWallet(bitcoinWallet);
        if (!userXOnlyPubKey) throw new Error("Could not get x-only pubkey from wallet");
        const network = bitcoinNetwork === 'regtest' ? bitcoin.networks.regtest : bitcoin.networks.testnet;
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
          notifyError(`Change (${change} sats) below dust threshold, added to fee.`);
        }

        // 5. Sign all inputs
        if (bitcoinWallet.privkeyHex) {
          const keyPair = ECPair.fromPrivateKey(Buffer.from(bitcoinWallet.privkeyHex, 'hex'), { compressed: true });
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
          const blockstreamNetwork =
            bitcoinNetwork === "livenet" || bitcoinNetwork === "mainnet"
              ? "mainnet"
              : "testnet";
          const txId = await broadcastRawTx(txHex, blockstreamNetwork);
          if (!txId) throw new Error('Broadcast failed, no txid returned');
          return txId;
        }
        throw new Error('No valid Taproot signer found in derived Bitcoin wallet');
      } catch (error) {
        if (error instanceof Error) {
          notifyError(`Failed to send Bitcoin: ${error.message}`);
          throw new Error(`Failed to send Bitcoin: ${error.message}`);
        } else {
          notifyError('Failed to send Bitcoin: Unknown error');
          throw new Error('Failed to send Bitcoin: Unknown error');
        }
      } finally {
        setSending(false);
      }
    },
    [bitcoinWallet, bitcoinWalletType, bitcoinNetwork, sending]
  );

  return (
    <BitcoinWalletContext.Provider
      value={{
        wallet: bitcoinWallet,
        connecting,
        connected,
        disconnecting,
        connectConnectorWallet: handleConnectorConnect,
        connectDerivedWallet: handleDerivedWalletConnect,
        disconnect: handleDisconnect,
        signPsbt: handleSignPsbt,

        // Connector Wallet States
        accounts,
        provider,
        disconnectConnector,
        getPublicKey,
        signMessage,
        getNetwork,
        switchNetwork,
        sendBitcoin:
          bitcoinWalletType === "solana"
            ? sendBitcoinWithDerivedWallet
            : sendBitcoin,
        bitcoinWalletType,
        setBitcoinWalletType,
        connectors,
        connector,
        setConnectorId,
        handleConnectorId,
        connectorId,
      }}
    >
      {children}
    </BitcoinWalletContext.Provider>
  );
}

export function useBitcoinWallet(): BitcoinWalletContextState {
  const context = useContext(BitcoinWalletContext);

  if (!context) {
    throw new Error(
      "useBitcoinWallet must be used within a BitcoinWalletProvider"
    );
  }

  return context;
}
