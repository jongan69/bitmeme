

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

// Helper: Convert Uint8Array to BigInt (big-endian)
function bytesToBigIntBE(bytes: Uint8Array): bigint {
  return BigInt('0x' + Buffer.from(bytes).toString('hex'));
}
// Helper: Convert BigInt to Uint8Array (big-endian)
function bigIntToBytesBE(num: bigint, length = 32): Uint8Array {
  let hex = num.toString(16);
  if (hex.length % 2 !== 0) hex = '0' + hex;
  hex = hex.padStart(length * 2, '0');
  return Uint8Array.from(Buffer.from(hex, 'hex'));
}
// Helper: Taproot tweak (BIP-341) for private key (big-endian math)
// function taprootTweakPrivKey(privKey: Uint8Array, pubKey: Uint8Array): Uint8Array {
//   const tweak = taggedHash('TapTweak', Buffer.from(pubKey));
//   const priv = bytesToBigIntBE(privKey);
//   const twk = bytesToBigIntBE(tweak);
//   const n = CURVE.n;
//   const tweaked = (priv + twk) % n;
//   return bigIntToBytesBE(tweaked, 32);
// }

// Helper: BIP-340 lift x-only pubkey to Point (assume even y)
// function liftXOnlyPubkey(xOnly: Uint8Array): typeof Point.BASE {
//   return Point.fromHex(Buffer.concat([Buffer.from([0x02]), xOnly]));
// }

// Helper: Get tweaked x-only pubkey for Taproot key-spend (BIP-340)
// function getTweakedXOnlyPubkey(internalPubkey: Uint8Array): Uint8Array {
//   const tweak = taggedHash('TapTweak', Buffer.from(internalPubkey));
//   const P = liftXOnlyPubkey(internalPubkey);
//   const Q = P.add(Point.fromPrivateKey(tweak));
//   return Q.toRawX();
// }

// Create ECPair instance using the same method as wallet.ts
const ECPair = ECPairFactory(ecc);

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

  const DUST_THRESHOLD = 330; // P2TR dust threshold

  const sendBitcoinWithDerivedWallet = useCallback(
    async (
      toAddress: string,
      satoshis: number,
    ) => {
      if (!bitcoinWallet || bitcoinWalletType !== "solana") {
        throw new Error("Solana-derived Bitcoin wallet not connected");
      }
      try {
        console.log('[sendBitcoinWithDerivedWallet] Starting transaction...');
        // 0. Fetch recommended fee rate
        let feeRate = 2; // fallback default
        try {
          const response = await fetch("https://warmhearted-morning-cherry.btc-testnet.quiknode.pro/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: 1,
              jsonrpc: "2.0",
              method: "estimatesmartfee",
              params: [10], // 10 blocks target
            }),
          });
          const data = await response.json();
          const feerateBtcPerKb = data.result?.feerate;
          if (feerateBtcPerKb) {
            feeRate = Math.ceil((feerateBtcPerKb * 1e8) / 1000); // sats/vByte
            if (feeRate < 1) feeRate = 1; // never go below 1
          }
          console.log('[sendBitcoinWithDerivedWallet] Using dynamic feeRate:', feeRate, 'sats/vByte');
        } catch (e) {
          console.warn('[sendBitcoinWithDerivedWallet] Failed to fetch dynamic fee rate, using default:', feeRate);
        }

        // 1. Fetch UTXOs from mempool.space
        const utxosRes = await fetch(`https://mempool.space/testnet/api/address/${bitcoinWallet.p2tr}/utxo`);
        const utxosRaw = await utxosRes.json();
        // Map UTXOs to expected format
        const utxos = utxosRaw.map((u: any) => ({
          transaction_id: u.txid,
          transaction_index: u.vout,
          satoshis: Number(u.value),
        }));
        console.log('Derived P2TR address:', bitcoinWallet.p2tr);
        console.log('UTXO list:', utxos);
        if (!utxos || utxos.length === 0) throw new Error("No UTXOs found for your address. Please fund your wallet.");

        // Fetch and log the exact UTXO value and script from mempool.space for the first UTXO
        const utxoToSpend = utxos[0];
        const txDetailsRes = await fetch(`https://mempool.space/testnet/api/tx/${utxoToSpend.transaction_id}`);
        const txDetails = await txDetailsRes.json();
        const vout = txDetails.vout[utxoToSpend.transaction_index];
        console.log('[DEBUG][UTXO] On-chain value:', vout.value, 'sats');
        console.log('[DEBUG][UTXO] On-chain scriptPubKey:', vout.scriptpubkey);

        // 2. Build the PSBT for a simple P2TR send
        const userXOnlyPubKey = getInternalXOnlyPubkeyFromUserWallet(bitcoinWallet);
        if (!userXOnlyPubKey) throw new Error("Could not get x-only pubkey from wallet");
        const network = bitcoinNetwork === 'regtest' ? bitcoin.networks.regtest : bitcoin.networks.testnet;
        const satoshisInt = Math.floor(Number(satoshis));
        console.log('[sendBitcoinWithDerivedWallet] Tip amount (satoshis):', satoshis, 'Parsed int:', satoshisInt, 'DUST_THRESHOLD:', DUST_THRESHOLD);
        if (satoshisInt < DUST_THRESHOLD) throw new Error("Recipient output is below dust threshold");

        // 1. Add all inputs
        let inputSum = 0;
        const psbt = new bitcoin.Psbt({ network });
        for (const utxo of utxos) {
          const script = bitcoin.payments.p2tr({ internalPubkey: userXOnlyPubKey, network }).output!;
          console.log('[DEBUG][PSBT input] witnessUtxo.script:', script.toString('hex'));
          console.log('[DEBUG][PSBT input] tapInternalKey:', userXOnlyPubKey.toString('hex'));
          console.log('[DEBUG][PSBT input] witnessUtxo.value:', utxo.satoshis);
          psbt.addInput({
            hash: utxo.transaction_id,
            index: utxo.transaction_index,
            witnessUtxo: {
              script,
              value: utxo.satoshis,
            },
            tapInternalKey: userXOnlyPubKey,
          });
          inputSum += utxo.satoshis;
          if (inputSum >= satoshisInt) break;
        }
        if (inputSum < satoshisInt) throw new Error("Insufficient funds for this transaction, including fees.");

        // 2. Add recipient output
        psbt.addOutput({
          address: toAddress,
          value: satoshisInt,
        });

        // 3. Estimate fee using virtual size (with only recipient output)
        let vsize = 100;
        try {
          vsize = psbt.extractTransaction().virtualSize();
        } catch (e) {}
        const fee = Math.ceil(feeRate * vsize);

        // 4. Calculate real change
        const change = inputSum - satoshisInt - fee;
        if (change < 0) throw new Error("Insufficient funds for this transaction, including fees.");

        // 5. Add real change output if above dust
        const changeAddress = bitcoin.payments.p2tr({
          internalPubkey: userXOnlyPubKey,
          network,
        }).address;
        if (!changeAddress) throw new Error("Failed to derive change address");
        if (change >= DUST_THRESHOLD) {
          psbt.addOutput({
            address: changeAddress,
            value: change,
          });
        } else if (change > 0) {
          // Add to fee, do not create dust output
          console.log('[sendBitcoinWithDerivedWallet] Change below dust threshold, adding to fee:', change);
        }

        // Log PSBT inputs and outputs
        console.log('[sendBitcoinWithDerivedWallet] PSBT inputs:', psbt.data.inputs);
        console.log('[sendBitcoinWithDerivedWallet] PSBT outputs:', psbt.txOutputs);
        console.log('[sendBitcoinWithDerivedWallet] Constructed PSBT:', psbt.toHex());

        // Debug signer and key before signing
        console.log('Signer public key:', bitcoinWallet.signer?.publicKey?.toString('hex'));
        console.log('Taproot input key (x-only):', userXOnlyPubKey.toString('hex'));
        console.log('Signer has signSchnorr:', typeof bitcoinWallet.signer?.signSchnorr === 'function');

        // --- Taproot key-spend signing and broadcasting (bitcoinjs-lib best practice) ---
        if (bitcoinWallet.privkeyHex && psbt.data.inputs.length === 1) {
          const keyPair = ECPair.fromPrivateKey(Buffer.from(bitcoinWallet.privkeyHex, 'hex'), { compressed: true });
          const keyPairForSigner = {
            ...keyPair,
            publicKey: Buffer.from(keyPair.publicKey), // ensure Buffer type
            privateKey: keyPair.privateKey,            // explicitly assign privateKey
            sign: (hash: Buffer) => Buffer.from(keyPair.sign(hash)),
            signSchnorr: (hash: Buffer) => Buffer.from(keyPair.signSchnorr(hash)),
          };
          const tweakedSigner = tweakSigner(keyPairForSigner, { network });
          psbt.signInput(0, tweakedSigner);
          psbt.finalizeAllInputs();
          const txHex = psbt.extractTransaction().toHex();
          const blockstreamNetwork =
            bitcoinNetwork === "livenet" || bitcoinNetwork === "mainnet"
              ? "mainnet"
              : "testnet";
          const txId = await broadcastRawTx(txHex, blockstreamNetwork);
          console.log('[sendBitcoinWithDerivedWallet] Broadcasted txid:', txId);
          return txId;
        }

        throw new Error('No valid Taproot signer found in derived Bitcoin wallet');
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
