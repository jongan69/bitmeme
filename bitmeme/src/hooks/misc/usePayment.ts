import { useUnifiedWallet } from "@/contexts/UnifiedWalletProvider";
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
        console.log("[fetchJupiterSwap] Fetching Jupiter swap for mint:", mint);
        const response = await fetch(`/api/jupiter?mint=${mint}`);
        const data = await response.json();
        console.log("[fetchJupiterSwap] Response data:", data);
        return data;
    } catch (err: any) {
        console.error("[fetchJupiterSwap] Error:", err);
        return null;
    }
}


export const useSolanaPayment = () => {
    const { solana } = useUnifiedWallet();
    const connection = solana.connection;
    const publicKey = new PublicKey(solana.publicKey);
    const sendTransaction = solana.sendTransaction;
    const network = solana.network;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const transferUSDC = useCallback(
        async (amount: number, recipient: PublicKey) => {
            console.log("[transferUSDC] Called with amount:", amount, "recipient:", recipient?.toBase58());
            if (!publicKey) {
                setError("Wallet not connected");
                console.error("[transferUSDC] Wallet not connected");
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const usdcMint = new PublicKey(USDC_MINT);
                const senderATA = await getAssociatedTokenAddress(usdcMint, publicKey);
                const recipientATA = await getAssociatedTokenAddress(usdcMint, recipient);
                console.log("[transferUSDC] senderATA:", senderATA.toBase58(), "recipientATA:", recipientATA.toBase58());

                // Check sender's ATA and balance first, before creating any transaction
                let senderAccount;
                try {
                    senderAccount = await getAccount(connection, senderATA);
                    console.log("[transferUSDC] Sender account:", senderAccount);
                } catch {
                    console.error("[transferUSDC] No sender USDC account");
                    throw new Error("You need to create a USDC account first by depositing USDC to your wallet");
                }

                // Convert amount to USDC's smallest unit (6 decimal places) and then to BigInt
                const amountInSmallestUnit = Math.round(amount * Math.pow(10, USDC_DECIMALS));
                const transferAmountLamports = BigInt(amountInSmallestUnit);
                const currentBalance = BigInt(senderAccount.amount);
                console.log("[transferUSDC] amountInSmallestUnit:", amountInSmallestUnit, "currentBalance:", currentBalance.toString());

                if (currentBalance < transferAmountLamports) {
                    const currentBalanceUsdc = Number(currentBalance) / Math.pow(10, USDC_DECIMALS);
                    console.error("[transferUSDC] Insufficient USDC balance:", currentBalanceUsdc, "needed:", amount);
                    throw new Error(`Insufficient USDC balance. You have ${currentBalanceUsdc.toFixed(2)} USDC but need ${amount} USDC to Complete the purchase`);
                }

                const transaction = new Transaction();

                // Ensure recipient's ATA exists, or create one
                try {
                    await getAccount(connection, recipientATA);
                    console.log("[transferUSDC] Recipient ATA exists");
                } catch {
                    console.log("[transferUSDC] Creating recipient ATA...");
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
                console.log("[transferUSDC] Blockhash:", blockhash, "lastValidBlockHeight:", lastValidBlockHeight);

                // Add transfer instruction
                transaction.add(
                    createTransferInstruction(
                        senderATA,
                        recipientATA,
                        publicKey,
                        amountInSmallestUnit
                    )
                );
                console.log("[transferUSDC] Transaction built:", transaction);

                // Send transaction
                const signature = await sendTransaction(transaction);
                console.log("[transferUSDC] Transaction signature:", signature);
                await connection.confirmTransaction({
                    signature,
                    blockhash,
                    lastValidBlockHeight
                });
                console.log("[transferUSDC] Transaction confirmed");

                return signature;
            } catch (err) {
                setError((err as Error).message);
                console.error("[transferUSDC] Transfer error:", err);
            } finally {
                setLoading(false);
                console.log("[transferUSDC] Loading set to false");
            }
        },
        [connection, publicKey, sendTransaction]
    );

    const transferSOL = useCallback(
        async (amount: number, recipient: PublicKey, isLamports: boolean = false) => {
            const amountInLamports = isLamports ? amount : Math.round(amount * Math.pow(10, SOL_DECIMALS));
            console.log("[transferSOL] Called with amount:", amountInLamports, "recipient:", recipient?.toBase58(), "sender:", publicKey?.toBase58(), "amountInLamports:", amountInLamports);
            if (!publicKey) {
                setError("Wallet not connected: " + publicKey);
                console.error("[transferSOL] Wallet not connected: ", publicKey);
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
                        lamports: amountInLamports // Convert SOL to lamports
                    })
                );
                console.log("[transferSOL] Transaction built:", transaction);

                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
                transaction.recentBlockhash = blockhash;
                transaction.feePayer = publicKey;
                console.log("[transferSOL] Blockhash:", blockhash, "lastValidBlockHeight:", lastValidBlockHeight);

                const signature = await sendTransaction(transaction);
                console.log("[transferSOL] Transaction signature:", signature);
                await connection.confirmTransaction({
                    signature,
                    blockhash,
                    lastValidBlockHeight
                });
                console.log("[transferSOL] Transaction confirmed");

                return signature;
            } catch (err) {
                setError((err as Error).message);
                console.error("[transferSOL] Transfer error:", err);
            } finally {
                setLoading(false);
                console.log("[transferSOL] Loading set to false");
            }
        },
        [connection, publicKey, sendTransaction]
    );


    const transfer = useCallback(
        async (amount: number, currency: PaymentCurrency, recipient: PublicKey, isLamports: boolean = false) => {
            console.log("[transfer] Called with amount:", amount, "currency:", currency, "recipient:", recipient?.toBase58());
            if (network !== 'devnet') {
                switch (currency) {
                    case 'SOL':
                        const priceSol = await fetchJupiterSwap(SOL_MINT);
                        console.log("[transfer] priceSol:", priceSol);
                        if (!priceSol) {
                            console.error("[transfer] Failed to fetch SOL price");
                            throw new Error("Failed to fetch SOL price");
                        }
                        const solAmount = amount / priceSol.data[SOL_MINT].price;
                        console.log("[transfer] Calculated solAmount:", solAmount);
                        return transferSOL(solAmount, recipient, isLamports);
                    case 'USDC':
                        return transferUSDC(amount, recipient);
                    default:
                        console.error("[transfer] Unsupported currency:", currency);
                        throw new Error(`Unsupported currency: ${currency}`);
                }
            } else {
                switch (currency) {
                    case 'SOL':
                        return transferSOL(amount, recipient, isLamports);
                    case 'USDC':
                        return transferUSDC(amount, recipient);
                    default:
                        console.error("[transfer] Unsupported currency:", currency);
                        throw new Error(`Unsupported currency: ${currency}`);
                }
            }
        },
        [transferSOL, transferUSDC]
    );

    return { transfer, loading, error };
};