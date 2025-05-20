import "../../polyfills";

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
import { createAxiosInstances } from "@/utils/axios";
import { broadcastRawTxViaBlockstream } from "@/bitcoin/rpcClient";
import { getInternalXOnlyPubkeyFromUserWallet } from "@/bitcoin/wallet";
import { signTaprootInputWithNoble } from "@/bitcoin/wallet";
import { schnorr } from '@noble/secp256k1';

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
        console.log('[handleDerivedWalletConnect] res:', res);
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

  // Function to send Bitcoin using a Solana-derived wallet
  const sendBitcoinWithDerivedWallet = useCallback(
    async (
      toAddress: string,
      satoshis: number,
      options?: { feeRate: number }
    ) => {
      if (!bitcoinWallet || bitcoinWalletType !== "solana") {
        throw new Error("Solana-derived Bitcoin wallet not connected");
      }
      try {
        // 1. Fetch UTXOs from backend (aresApi)
        const { aresApi } = createAxiosInstances(
          usePersistentStore.getState().solanaNetwork,
          bitcoinNetwork
        );
        const utxosRes = await aresApi.get(`/api/v1/address/${bitcoinWallet.p2tr}/utxos`);
        const utxosRaw = Array.isArray(utxosRes.data) ? utxosRes.data : utxosRes.data?.data ?? [];
        // Ensure all satoshis are numbers and integers
        const utxos = utxosRaw.map((u: any) => ({ ...u, satoshis: Number(u.satoshis) }));
        console.log('Derived P2TR address:', bitcoinWallet.p2tr);
        console.log('UTXO list:', utxos);
        if (!utxos || utxos.length === 0) throw new Error("No UTXOs found for your address. Please fund your wallet.");

        // 2. Build the PSBT for a simple P2TR send
        const feeRate = options?.feeRate || 1; // default to 1 sat/vbyte if not provided
        const userXOnlyPubKey = getInternalXOnlyPubkeyFromUserWallet(bitcoinWallet);
        if (!userXOnlyPubKey) throw new Error("Could not get x-only pubkey from wallet");
        const network = bitcoinNetwork === 'regtest' ? bitcoin.networks.regtest : bitcoin.networks.testnet;
        console.log('[sendBitcoinWithDerivedWallet] Network:', network, bitcoinNetwork);
        // Ensure satoshis is an integer
        const satoshisInt = Math.floor(Number(satoshis));

        // Build PSBT for simple P2TR send
        const psbt = new bitcoin.Psbt({ network });
        let inputSum = 0;
        const fee = feeRate * 100; // crude estimate: 100 vbytes per tx, adjust as needed
        for (const utxo of utxos) {
          // Debug: print expected script for this input
          const expectedScript = bitcoin.payments.p2tr({ internalPubkey: userXOnlyPubKey, network }).output!.toString('hex');
          console.log('--- UTXO DEBUG ---');
          console.log('UTXO transaction_id:', utxo.transaction_id);
          console.log('UTXO transaction_index:', utxo.transaction_index);
          console.log('Expected script for derived address:', expectedScript);
          console.log('Derived P2TR address:', bitcoinWallet.p2tr);
          console.log('Signer public key (hex):', Buffer.isBuffer(bitcoinWallet.signer?.publicKey) ? bitcoinWallet.signer.publicKey.toString('hex') : bitcoinWallet.signer?.publicKey);
          console.log('UTXO value (satoshis):', utxo.satoshis);
          console.log('Network:', network, bitcoinNetwork);
          // Optionally, fetch the funding transaction and print the scriptPubKey at utxo.transaction_index
          // (requires backend or explorer call)
          psbt.addInput({
            hash: utxo.transaction_id,
            index: utxo.transaction_index,
            witnessUtxo: {
              script: bitcoin.payments.p2tr({ internalPubkey: userXOnlyPubKey, network }).output!,
              value: utxo.satoshis,
            },
            tapInternalKey: userXOnlyPubKey,
          });
          inputSum += utxo.satoshis;
          if (inputSum >= satoshisInt + fee) break;
        }
        if (inputSum < satoshisInt + fee) throw new Error("Insufficient funds for this transaction, including fees.");
        psbt.addOutput({
          address: toAddress,
          value: satoshisInt,
        });
        const DUST_THRESHOLD = 330; // for P2TR
        const change = inputSum - satoshisInt - fee;
        if (change >= DUST_THRESHOLD) {
          psbt.addOutput({
            address: bitcoinWallet.p2tr,
            value: change,
          });
        } else if (change > 0) {
          // Add to fee, do not create dust output
          // Optionally log: console.log('Change below dust threshold, adding to fee:', change);
        }
        // Log PSBT inputs and outputs
        console.log('[sendBitcoinWithDerivedWallet] PSBT inputs:', psbt.data.inputs);
        console.log('[sendBitcoinWithDerivedWallet] PSBT outputs:', psbt.txOutputs);
        console.log('[sendBitcoinWithDerivedWallet] Constructed PSBT:', psbt.toHex());

        // 3. Sign the PSBT
        // If single input and nobleTaprootSigner is present, use manual Taproot signing
        if (bitcoinWallet.nobleTaprootSigner && psbt.data.inputs.length === 1) {
          const inputIndex = 0;
          const xOnlyPubkey = bitcoinWallet.nobleTaprootSigner.publicKey;
          const inputValue = utxos[0].satoshis;
          const privateKey = bitcoinWallet.privkey!.privateKey as Buffer;
          if (!privateKey) throw new Error("Private key is missing from wallet");
          try {
            const rawTxHex = await signTaprootInputWithNoble({
              psbt,
              inputIndex,
              xOnlyPubkey,
              inputValue,
              privateKey,
              network,
            });
            const blockstreamNetwork =
              bitcoinNetwork === "livenet" || bitcoinNetwork === "mainnet"
                ? "mainnet"
                : "testnet";
            const txId = await broadcastRawTxViaBlockstream(rawTxHex, blockstreamNetwork);
            console.log('[sendBitcoinWithDerivedWallet] Broadcasted txid:', txId);
            return txId;
          } catch (e) {
            console.error('[sendBitcoinWithDerivedWallet] Error in manual Taproot signing:', e);
            throw e;
          }
        }
        // Fallback to previous logic for other cases
        if (bitcoinWallet.nobleTaprootSigner) {
          // Debug: print key and script info
          console.log('Signer publicKey:', bitcoinWallet.nobleTaprootSigner.publicKey.toString('hex'));
          console.log('Input tapInternalKey:', psbt.data.inputs[0].tapInternalKey?.toString('hex'));
          console.log('Input witnessUtxo.script:', psbt.data.inputs[0].witnessUtxo?.script.toString('hex'));
          console.log('Expected script:', bitcoin.payments.p2tr({ internalPubkey: bitcoinWallet.nobleTaprootSigner.publicKey, network }).output?.toString('hex'));
          // Try signing just the first input
          try {
            await psbt.signInputAsync(0, bitcoinWallet.nobleTaprootSigner);
            console.log('[sendBitcoinWithDerivedWallet] Successfully signed input 0 with nobleTaprootSigner');
          } catch (e) {
            console.error('[sendBitcoinWithDerivedWallet] Error signing input 0 with nobleTaprootSigner:', e);
          }
          // Try signing all inputs
          try {
            await psbt.signAllInputsAsync(bitcoinWallet.nobleTaprootSigner);
            console.log('[sendBitcoinWithDerivedWallet] Successfully signed all inputs with nobleTaprootSigner');
          } catch (e) {
            console.error('[sendBitcoinWithDerivedWallet] Error signing all inputs with nobleTaprootSigner:', e);
            throw e;
          }
        } else if (bitcoinWallet.signer) {
          // Fallback to legacy signer if nobleTaprootSigner is not present
          try {
            psbt.signAllInputs(bitcoinWallet.signer);
            console.log('[sendBitcoinWithDerivedWallet] Successfully signed all inputs with custom signer');
          } catch (e) {
            console.error('[sendBitcoinWithDerivedWallet] Error signing all inputs with custom signer:', e);
            throw e;
          }
        } else {
          throw new Error('No valid Taproot signer found in derived Bitcoin wallet');
        }
        // Try to finalize and broadcast as before
        try {
          psbt.finalizeAllInputs();
          const signedTxHex = psbt.extractTransaction().toHex();
          console.log('[sendBitcoinWithDerivedWallet] Signed transaction hex:', signedTxHex);

          // 4. Broadcast using backend
          const blockstreamNetwork =
            bitcoinNetwork === "livenet" || bitcoinNetwork === "mainnet"
              ? "mainnet"
              : "testnet";
          const txId = await broadcastRawTxViaBlockstream(signedTxHex, blockstreamNetwork);
          console.log('[sendBitcoinWithDerivedWallet] Broadcasted txid:', txId);
          console.log('Returning txId after manual broadcast:', txId);
          return txId;
        } catch (e) {
          console.error('[sendBitcoinWithDerivedWallet] Error finalizing/signing transaction:', e);
          throw e;
        }
      } catch (error) {
        console.error('[sendBitcoinWithDerivedWallet] Error:', error);
        if (error instanceof Error) {
          throw new Error(`Failed to send Bitcoin: ${error.message}`);
        } else {
          throw new Error('Failed to send Bitcoin: Unknown error');
        }
      }
    },
    [bitcoinWallet, bitcoinWalletType, bitcoinNetwork]
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
