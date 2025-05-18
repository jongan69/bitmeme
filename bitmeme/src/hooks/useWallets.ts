import { useBitcoinWallet } from "@/contexts/BitcoinWalletProvider";
import { useSolanaWallet } from "@/contexts/SolanaWalletProvider";
import { getLocalStorage, setLocalStorage } from "@/utils/localStorage";
import { notifyError, notifySuccess } from "@/utils/notification";
import { useEffect, useState } from "react";
import { useStacks } from "@/contexts/StacksWalletProvider";

export function useWalletOnboarding(onReady?: () => void) {
    const { connectDerivedWallet, wallet: bitcoinWallet } = useBitcoinWallet();
    const { login, publicKey } = useSolanaWallet();
    const { address: stacksAddress, generateStxWallet, loadWalletFromLocalStorage } = useStacks();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Step 1: Load or create Solana wallet
    useEffect(() => {
        const doLogin = async () => {
            setLoading(true);
            setError(null);
            try {
                await loadWalletFromLocalStorage();
                await login();
                if(publicKey) console.log("Solana wallet loaded: ", publicKey.toBase58());
            } catch (err) {
                notifyError("Failed to load Solana wallet.");
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };
        doLogin();
    }, [login]);

    // Step 2: Derive/connect Bitcoin wallet after Solana is ready
    useEffect(() => {
        if (!loading && publicKey) {
            connectDerivedWallet();
            
            if (!stacksAddress) {
                generateStxWallet();
            }
        }
        // Only run when Solana wallet is ready
    }, [loading, publicKey, connectDerivedWallet]);

    // Step 3: Notify and call onReady when Bitcoin wallet is ready
    useEffect(() => {
        const notifyIfNeeded = async () => {
            if (bitcoinWallet?.p2tr) {
                console.log("Bitcoin wallet loaded: ", bitcoinWallet.p2tr);
                const notifiedKey = `wallet-notified-${bitcoinWallet.p2tr}`;
                const alreadyNotified = await getLocalStorage<boolean>(notifiedKey);
                if (!alreadyNotified) {
                    notifySuccess(`Wallet ${bitcoinWallet.p2tr} loaded!`);
                    await setLocalStorage<boolean>(notifiedKey, true);
                    if (onReady) onReady();
                }
            }
        };
        notifyIfNeeded();
    }, [bitcoinWallet?.p2tr, onReady]);

    // Log when stacksAddress is set
    useEffect(() => {
        if (stacksAddress) console.log("Stacks wallet loaded: ", stacksAddress);
    }, [stacksAddress]);

    return {
        loading,
        error,
        solanaAddress: publicKey?.toBase58(),
        bitcoinAddress: bitcoinWallet?.p2tr,
        stacksAddress,
    };
}
