import { useSolanaWallet } from "@/contexts/SolanaWalletProvider";
import { TransactionList } from "@/types/transaction";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
const CACHE_PREFIX = "transactions_cache_";

async function getCachedTransactions(address: string) {
    const cached = await AsyncStorage.getItem(CACHE_PREFIX + address);
    return cached ? JSON.parse(cached) : [];
}

async function setCachedTransactions(address: string, transactions: any[]) {
    await AsyncStorage.setItem(CACHE_PREFIX + address, JSON.stringify(transactions));
}

async function getTransactions(address: PublicKey, network: string) {
    if (!address) return [];
    try {
        const response = await fetch(`/api/transactions?address=${address.toBase58()}&network=${network}`);
        const data = await response.json();
        return data.transactions;
    } catch (err: any) {
        console.error(err);
        return [];
    }
}

export function useTransactions(address: PublicKey) {
    const [transactions, setTransactions] = useState<TransactionList>([]);
    const { network } = useSolanaWallet();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        setError(null);
        if (!address) {
            setTransactions([]);
            setLoading(false);
            return;
        }
        const cached = await getCachedTransactions(address?.toBase58());
        setTransactions(cached);
        try {
            const fetched = await getTransactions(address, network);
            const isNew = !cached.length || fetched[0]?.signature !== cached[0]?.signature;
            if (isNew) {
                await setCachedTransactions(address.toBase58(), fetched);
                setTransactions(fetched);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [address, network]);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            if (!isMounted) return;
            await fetchTransactions();
        })();
        return () => {
            isMounted = false;
        };
    }, [address, network, fetchTransactions]);

    return { transactions, loading, error, refetch: fetchTransactions };
}