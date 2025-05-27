import { useUnifiedWallet } from "@/contexts/UnifiedWalletProvider";
import { getLocalStorage, setLocalStorage } from "@/utils/localStorage";
import { notifyError, notifySuccess } from "@/utils/notification";
import { useEffect, useState } from "react";

export function useWalletOnboarding(onReady?: () => void) {
    const { solana, bitcoin, stacks, ethereum } = useUnifiedWallet();
    const [loading] = useState(false); // Unified provider is always ready
    const [error] = useState<Error | null>(null);

    // Notify and call onReady when Bitcoin wallet is ready
    useEffect(() => {
        const notifyIfNeeded = async () => {
            if (bitcoin?.address) {
                const notifiedKey = `wallet-notified-${bitcoin.address}`;
                const alreadyNotified = await getLocalStorage<boolean>(notifiedKey);
                if (!alreadyNotified) {
                    notifySuccess(`Wallet ${bitcoin.address} loaded!`);
                    await setLocalStorage<boolean>(notifiedKey, true);
                    if (onReady) onReady();
                }
            }
        };
        notifyIfNeeded();
    }, [bitcoin?.address, onReady]);

    // Log when stacksAddress is set
    useEffect(() => {
        if (stacks?.address) console.log("Stacks wallet loaded: ", stacks.address);
        if (bitcoin?.address) console.log("Bitcoin wallet loaded: ", bitcoin.address);
        if (solana?.publicKey) console.log("Solana wallet loaded: ", solana.publicKey);
        if (stacks?.address && bitcoin?.address && solana?.publicKey) console.log("All wallets loaded");
    }, [stacks?.address]);

    return {
        loading,
        error,
        solanaAddress: solana?.publicKey,
        bitcoinAddress: bitcoin?.address,
        stacksAddress: stacks?.address,
        ethereumAddress: ethereum?.address,
    };
}
