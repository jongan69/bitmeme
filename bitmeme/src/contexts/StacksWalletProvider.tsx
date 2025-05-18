import React, { createContext, useContext, useState } from "react";
import {
    getAddressFromPrivateKey,
    makeSTXTokenTransfer,
    makeContractCall,
    broadcastTransaction,
    stringAsciiCV,
} from "@stacks/transactions";
import { generateMnemonic, mnemonicToSeed } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { Wallet } from "@stacks/wallet-sdk";
import { HDKey } from "@scure/bip32";
import { STACKS_TESTNET } from "@stacks/network";
import { requestStxAirdrop } from "@/utils/requestStxAirdrop";
import { setLocalStorage, getLocalStorage } from "@/utils/localStorage";

type StacksContextType = {
    mnemonic: string;
    wallet: Wallet | null;
    address: string | null;
    log: string;
    SignTx: (recipient: string, amount: bigint, memo: string) => Promise<void>;
    generateStxWallet: () => Promise<void>;
    loadWalletFromLocalStorage: () => Promise<void>;
    tipUser: (recipient: string, amount: bigint, memo?: string) => Promise<void>;
    mintNFT: (metadataUri?: string) => Promise<void>;
    requestStxAirdrop: (address: string) => Promise<void>;
};

const StacksContext = createContext<StacksContextType | undefined>(undefined);

export const StacksProvider = ({ children }: { children: React.ReactNode }) => {
    const [mnemonic, setMnemonic] = useState("");
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [log, setLog] = useState("");
    //   const network = STACKS_MAINNET; // Change to STACKS_TESTNET if needed
    const network = STACKS_TESTNET;

    const generateStxWallet = async () => {
        console.log("Generating Stacks wallet (BIP39 mnemonic)");
        try {
            const mnemonic = generateMnemonic(wordlist); // ✅
            const seed = await mnemonicToSeed(mnemonic);
            const rootNode = HDKey.fromMasterSeed(seed);
            const derivationPath = "m/44'/5757'/0'/0/0";
            const childNode = rootNode.derive(derivationPath);
            const stxPrivateKey = Buffer.from(childNode.privateKey!).toString('hex');
            const stxAddress = getAddressFromPrivateKey(stxPrivateKey, network);

            await requestStxAirdrop(stxAddress);

            const wallet = {
                accounts: [{ stxPrivateKey }],
            };

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
            setWallet(storedWallet);
            const stxAddress = getAddressFromPrivateKey(
                storedWallet.accounts[0].stxPrivateKey,
                network
            );
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
            const transaction = await makeSTXTokenTransfer(txOptions);
            const response = await broadcastTransaction({ transaction, network });
            setLog(`Tipped ${amount} microSTX to ${recipient}. TxID: ${response.txid}`);
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
            console.log("Contract address:", process.env.EXPO_PUBLIC_STACKS_TESTNET_CONTRACT);
            const txOptions = {
                contractAddress: process.env.EXPO_PUBLIC_STACKS_TESTNET_CONTRACT!, // your contract address
                contractName: "bitmeme-mint", // your contract name
                functionName: "claim",
                functionArgs: [stringAsciiCV(uri)],
                senderKey: wallet.accounts[0].stxPrivateKey,
                network: STACKS_TESTNET, // use STACKS_MAINNET for mainnet
                validateWithAbi: true,
            };
            console.log("mintNFT txOptions", txOptions);
            const transaction = await makeContractCall(txOptions);
            console.log("mintNFT transaction", transaction);
            const response = await broadcastTransaction({ transaction, network: STACKS_TESTNET });
            console.log("mintNFT broadcast response", response);
            setLog(`NFT mint transaction sent! TxID: ${response.txid}`);
        } catch (err: any) {
            console.error("NFT mint error:", err);
            setLog(`NFT mint error: ${err.message || err}`);
        }
    };

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
                requestStxAirdrop,
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
