// app/providers/StacksProvider.tsx
import React, { createContext, useContext, useState, useCallback } from "react";
import {
    getAddressFromPrivateKey,
    makeSTXTokenTransfer,
    makeContractCall,
    bufferCVFromString,
    broadcastTransaction,
} from "@stacks/transactions";
import { Wallet, generateSecretKey, generateWallet } from "@stacks/wallet-sdk";
import { STACKS_MAINNET, STACKS_TESTNET } from "@stacks/network";
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
        console.log("Generating Stacks wallet");
        try {
            const secretKey = generateSecretKey();
            console.log("Generated secretKey:", secretKey);
            setMnemonic(secretKey);
            const wallet = await generateWallet({
                secretKey,
                password: "",
            });
            console.log("Stacks wallet object:", wallet);
            const stxPrivateKey = wallet.accounts[0]?.stxPrivateKey;
            console.log("stxPrivateKey:", stxPrivateKey);
            const stxAddress = getAddressFromPrivateKey(
                stxPrivateKey,
                network
            );
            console.log("Derived stxAddress:", stxAddress);
            await requestStxAirdrop(stxAddress);
            setWallet(wallet);
            setLocalStorage("stx-wallet", wallet);
            setAddress(stxAddress);
            setLog("Wallet generated successfully!");
        } catch (err: any) {
            console.error("Error in generateStxWallet:", err);
            setLog(`Wallet generation error: ${err.message || err}`);
        }
    };

    const loadWalletFromLocalStorage = async () => {
        console.log("Loading Stacks wallet from local storage");
        try {
            const storedWallet = await getLocalStorage<Wallet>("stx-wallet");
            if (!storedWallet) throw new Error("No wallet found in local storage");
            setWallet(storedWallet);
            const stxAddress = getAddressFromPrivateKey(
                storedWallet.accounts[0].stxPrivateKey,
                network
            );
            setAddress(stxAddress);
            setLog("Wallet loaded from local storage!");
        } catch (err: any) {
            setLog(`Load wallet error: ${err.message || err}`);
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
            if (!wallet) throw new Error("Wallet not initialized");
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
            setLog(`Tip error: ${err.message || err}`);
        }
    };

    // NFT minting function (update contract details as needed)
    const mintNFT = async (metadataUri?: string) => {
        try {
            if (!wallet) throw new Error("Wallet not initialized");
            const uri = metadataUri || "https://ipfs.io/ipfs/<metadata-hash>";
            const txOptions = {
                contractAddress: process.env.EXPO_PUBLIC_STACKS_TESTNET_CONTRACT!, // your contract address
                contractName: "bitmeme-mint", // your contract name
                functionName: "claim",
                functionArgs: [bufferCVFromString(uri)],
                senderKey: wallet.accounts[0].stxPrivateKey,
                network: STACKS_TESTNET, // use STACKS_MAINNET for mainnet
                validateWithAbi: true,
            };
            const transaction = await makeContractCall(txOptions);
            const response = await broadcastTransaction({ transaction, network: STACKS_TESTNET });
            setLog(`NFT mint transaction sent! TxID: ${response.txid}`);
        } catch (err: any) {
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
