import { useSolanaWallet } from "@/contexts/SolanaWalletProvider";
import {
    SOL_DECIMALS,
    SOL_MINT,
    USDC_DECIMALS,
    USDC_MINT
} from "@/utils/global";
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    getAccount,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useCallback, useState } from "react";

export type PaymentCurrency = 'SOL' | 'USDC'; // TODO: Add zBtc


export const fetchJupiterSwap = async (mint: string) => {
    try {
        const response = await fetch(`/api/jupiter?mint=${mint}`);
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error(err);
        return null;
    }
}


export const usePayment = () => {
    const { connection, publicKey, sendTransaction } = useSolanaWallet();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const transferUSDC = useCallback(
        async (amount: number, recipient: PublicKey) => {
            if (!publicKey) {
                setError("Wallet not connected");
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const usdcMint = new PublicKey(USDC_MINT);
                const senderATA = await getAssociatedTokenAddress(usdcMint, publicKey);
                const recipientATA = await getAssociatedTokenAddress(usdcMint, recipient);

                // Check sender's ATA and balance first, before creating any transaction
                let senderAccount;
                try {
                    senderAccount = await getAccount(connection, senderATA);
                } catch {
                    throw new Error("You need to create a USDC account first by depositing USDC to your wallet");
                }

                // Convert amount to USDC's smallest unit (6 decimal places) and then to BigInt
                const amountInSmallestUnit = Math.round(amount * Math.pow(10, USDC_DECIMALS));
                const transferAmountLamports = BigInt(amountInSmallestUnit);
                const currentBalance = BigInt(senderAccount.amount);

                if (currentBalance < transferAmountLamports) {
                    const currentBalanceUsdc = Number(currentBalance) / Math.pow(10, USDC_DECIMALS);
                    throw new Error(`Insufficient USDC balance. You have ${currentBalanceUsdc.toFixed(2)} USDC but need ${amount} USDC to Complete the purchase`);
                }

                const transaction = new Transaction();

                // Ensure recipient's ATA exists, or create one
                try {
                    await getAccount(connection, recipientATA);
                } catch {
                    console.log("Creating recipient ATA...");
                    transaction.add(
                        createAssociatedTokenAccountInstruction(
                            publicKey, // payer
                            recipientATA, // associatedToken
                            recipient, // owner
                            usdcMint, // mint
                            TOKEN_PROGRAM_ID,
                            ASSOCIATED_TOKEN_PROGRAM_ID
                        )
                    );
                }

                // Get blockhash
                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
                transaction.recentBlockhash = blockhash;
                transaction.feePayer = publicKey;

                // Add transfer instruction
                transaction.add(
                    createTransferInstruction(
                        senderATA,
                        recipientATA,
                        publicKey,
                        amountInSmallestUnit
                    )
                );

                // Send transaction
                const signature = await sendTransaction(transaction);
                await connection.confirmTransaction({
                    signature,
                    blockhash,
                    lastValidBlockHeight
                });

                return signature;
            } catch (err) {
                setError((err as Error).message);
                console.error("Transfer error:", err);
            } finally {
                setLoading(false);
            }
        },
        [connection, publicKey, sendTransaction]
    );

    const transferSOL = useCallback(
        async (amount: number, recipient: PublicKey) => {
            if (!publicKey) {
                setError("Wallet not connected");
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const transaction = new Transaction();
                transaction.add(
                    SystemProgram.transfer({
                        fromPubkey: publicKey,
                        toPubkey: recipient,
                        lamports: Math.round(amount * Math.pow(10, SOL_DECIMALS)) // Convert SOL to lamports
                    })
                );

                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
                transaction.recentBlockhash = blockhash;
                transaction.feePayer = publicKey;

                const signature = await sendTransaction(transaction);
                await connection.confirmTransaction({
                    signature,
                    blockhash,
                    lastValidBlockHeight
                });

                return signature;
            } catch (err) {
                setError((err as Error).message);
                console.error("Transfer error:", err);
            } finally {
                setLoading(false);
            }
        },
        [connection, publicKey, sendTransaction]
    );


    const transfer = useCallback(
        async (amount: number, currency: PaymentCurrency, recipient: PublicKey) => {
            switch (currency) {
                case 'SOL':
                    const priceSol = await fetchJupiterSwap(SOL_MINT);
                    if (!priceSol) {
                        throw new Error("Failed to fetch SOL price");
                    }
                    const solAmount = amount / priceSol.data[SOL_MINT].price;
                    return transferSOL(solAmount, recipient);
                case 'USDC':
                    return transferUSDC(amount, recipient);
                default:
                    throw new Error(`Unsupported currency: ${currency}`);
            }
        },
        [transferSOL, transferUSDC]
    );

    return { transfer, loading, error };
};