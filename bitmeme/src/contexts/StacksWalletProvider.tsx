import React, { createContext, useContext, useState } from "react";
import {
    getAddressFromPrivateKey,
    makeSTXTokenTransfer,
    makeContractCall,
    broadcastTransaction,
    stringAsciiCV,
    // getAddressFromPublicKey,
} from "@stacks/transactions";
import { generateMnemonic, mnemonicToSeed } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { Wallet } from "@stacks/wallet-sdk";
import { HDKey } from "@scure/bip32";
import { STACKS_TESTNET } from "@stacks/network";
import { setLocalStorage, getLocalStorage } from "@/utils/localStorage";
import * as stacksTransactions from '@stacks/transactions';
import { notifyError } from "@/utils/notification";
// import { c32address } from 'c32check';
// import { getPublicKey as nobleGetPublicKey } from '@noble/secp256k1';
// import { ripemd160 } from '@noble/hashes/legacy';
// import { sha256 } from '@noble/hashes/sha2';

type StacksContextType = {
    mnemonic: string;
    wallet: Wallet | null;
    address: string | null;
    log: string;
    SignTx: (recipient: string, amount: bigint, memo: string) => Promise<void>;
    generateStxWallet: () => Promise<void>;
    loadWalletFromLocalStorage: () => Promise<void>;
    tipUser: (recipient: string, amount: bigint, memo?: string) => Promise<string | undefined>;
    mintNFT: (metadataUri?: string) => Promise<string | undefined>;
};

const StacksContext = createContext<StacksContextType | undefined>(undefined);

export const StacksProvider = ({ children }: { children: React.ReactNode }) => {
    const [mnemonic, setMnemonic] = useState("");
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [log, setLog] = useState("");
    const network = STACKS_TESTNET; // Change to STACKS_TESTNET if needed
    // 26 for TESTNET, 22 for MAINNET
    // const versionBytes = network === STACKS_TESTNET ? 26 : 22;

    const generateStxWallet = async () => {
        console.log("Generating Stacks wallet (BIP39 mnemonic)");
        try {
            const mnemonic = generateMnemonic(wordlist); // ✅
            console.log("[DEBUG] mnemonic:", mnemonic);
            const seed = await mnemonicToSeed(mnemonic);
            console.log("[DEBUG] seed:", seed);
            const rootNode = HDKey.fromMasterSeed(seed);
            const derivationPath = "m/44'/5757'/0'/0/0";
            const childNode = rootNode.derive(derivationPath);
            const stxPrivateKey = Buffer.from(childNode.privateKey!).toString('hex');
            console.log("[DEBUG] stxPrivateKey:", stxPrivateKey);
            // Works on Mobile but trying alternative method for web [DO NOT REMOVE]
            const stxAddress = getAddressFromPrivateKey(stxPrivateKey, network);

            // Works on Web, but not confident in logic, would prefer the above
            // Also does not return in the format the logic below expects
            // const pubKeyHex = nobleGetPublicKey(stxPrivateKey, true);
            // console.log("[DEBUG] pubKeyHex:", pubKeyHex);
            // const pubKeyBytes = typeof pubKeyHex === 'string'
            //     ? Uint8Array.from((pubKeyHex as string).match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
            //     : pubKeyHex;
            // console.log("[DEBUG] pubKeyBytes:", pubKeyBytes);
            // const sha = sha256.create().update(pubKeyBytes).digest();
            // console.log("[DEBUG] sha:", sha);
            // const hash160 = ripemd160.create().update(sha).digest();
            // console.log("[DEBUG] hash160:", hash160);
            // const hash160Hex = Array.from(hash160).map(b => b.toString(16).padStart(2, '0')).join('');
            // console.log("hash160Hex:", hash160Hex, "length:", hash160Hex.length);
            // console.log("typeof hash160Hex:", typeof hash160Hex);
            // console.log("versionBytes:", versionBytes);
            // const stxAddress = c32address(versionBytes, hash160Hex);
            // console.log("[DEBUG] stxAddress:", stxAddress);
            const wallet = {
                accounts: [{ stxPrivateKey }],
            };
            console.log("wallet:", wallet.accounts[0].stxPrivateKey);

            setMnemonic(mnemonic);
            setWallet(wallet as any);
            setLocalStorage("stx-wallet", wallet);
            setLocalStorage("stx-mnemonic", mnemonic);
            setAddress(stxAddress);
            setLog("Wallet generated successfully!");
        } catch (err: any) {
            console.error("Error in generateStxWallet:", err);
            setLog(`Stacks wallet generation error: ${err.message || err}`);
        }
    };

    const loadWalletFromLocalStorage = async () => {
        try {
            const storedWallet = await getLocalStorage<Wallet>("stx-wallet");
            if (!storedWallet) throw new Error("No wallet found in local storage");
            // console.log("storedWallet:", storedWallet);
            setWallet(storedWallet);
            const stxAddress = getAddressFromPrivateKey(
                storedWallet.accounts[0].stxPrivateKey,
                network
            );
            // console.log("stxAddress:", stxAddress);
            setAddress(stxAddress);
            setLog("Stacks wallet loaded from local storage!");
        } catch (err: any) {
            setLog(`Load Stacks wallet error: ${err.message || err}`);
        }
    };

    const SignTx = async (recipient: string, amount: bigint, memo: string) => {
        try {
            if (!wallet) throw new Error("Wallet not initialized");
            const txOptions = {
                recipient: recipient,
                amount: amount,
                senderKey: wallet.accounts[0].stxPrivateKey,
                network,
                memo: memo,
            };
            const transaction = await makeSTXTokenTransfer(txOptions);
            const response = await broadcastTransaction({ transaction, network });
            setLog(`Transaction signed and broadcasted! TxID: ${response.txid}`);
        } catch (err: any) {
            setLog(`Error: ${err.message || err}`);
        }
    };

    // Tipping function (no post condition)
    const tipUser = async (recipient: string, amount: bigint, memo = "") => {
        try {
            if (!wallet) throw new Error("Stacks wallet not initialized");
            const txOptions = {
                recipient,
                amount,
                senderKey: wallet.accounts[0].stxPrivateKey,
                network,
                memo,
            };
            console.log("tipUser txOptions", txOptions);
            const transaction = await makeSTXTokenTransfer(txOptions);
            console.log("tipUser transaction", transaction);
            const response = await broadcastTransaction({ transaction, network });
            console.log("tipUser broadcast response", response);
            if ("error" in response) {
                console.log("tipUser error", response.reason);
                notifyError(`Tipping failed: ${response.reason}`);

                return undefined;
            } else {
                setLog(`Tipped ${amount} microSTX to ${recipient}. TxID: ${response.txid}`);
                return response.txid;
            }
        } catch (err: any) {
            setLog(`Tip Stacks error: ${err.message || err}`);
        }
    };

    // NFT minting function (update contract details as needed)
    const mintNFT = async (metadataUri?: string) => {
        console.log("mintNFT called", { metadataUri });
        try {
            if (!wallet) throw new Error("Wallet not initialized");
            const uri = metadataUri || "https://ipfs.io/ipfs/<metadata-hash>";
            console.log("Using URI for NFT:", uri);
            console.log("wallet:", wallet.accounts[0]);
            console.log("Contract address:", process.env.EXPO_PUBLIC_STACKS_TESTNET_CONTRACT);
            const senderKey = wallet.accounts[0].stxPrivateKey ?? "f3fe90ab4d099789b6af31104cdc2c3a7c7f6b4659e70b2a418de60830c08521";
            console.log("senderKey:", senderKey);
            const txOptions = {
                contractAddress: process.env.EXPO_PUBLIC_STACKS_TESTNET_CONTRACT!, // your contract address
                contractName: "bitmeme-mint", // your contract name
                functionName: "claim",
                functionArgs: [stringAsciiCV(uri)],
                senderKey: senderKey,
                network, // use STACKS_MAINNET for mainnet
                validateWithAbi: true,
            };
            console.log("mintNFT txOptions", txOptions);
            const transaction = await makeContractCall(txOptions);
            console.log("mintNFT transaction", transaction);
            const response = await broadcastTransaction({ transaction, network });
            console.log("mintNFT broadcast response", response);
            setLog(`NFT mint transaction sent! TxID: ${response.txid}`);
            return response.txid;
        } catch (err: any) {
            console.error("NFT mint error:", err);
            setLog(`NFT mint error: ${err.message || err}`);
        }
    };

    // Patch if missing
    if (!('addressFromVersionHash' in (stacksTransactions as any))) {
        (stacksTransactions as any).addressFromVersionHash = function () {
            throw new Error('addressFromVersionHash is not available in this environment');
        };
    }

    return (
        <StacksContext.Provider
            value={{
                mnemonic,
                wallet,
                address,
                log,
                SignTx,
                generateStxWallet,
                loadWalletFromLocalStorage,
                tipUser,
                mintNFT,
            }}
        >
            {children}
        </StacksContext.Provider>
    );
};

export const useStacks = () => {
    const context = useContext(StacksContext);
    if (!context) {
        throw new Error("useStacks must be used within a StacksProvider");
    }
    return context;
};
