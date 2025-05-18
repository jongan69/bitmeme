import { useSolanaWallet } from "@/contexts/SolanaWalletProvider";
import { HoldingList, NativeBalance } from "@/types/holdings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";

const CACHE_PREFIX = "holdings_cache_";

async function getCachedHoldings(address: string) {
    const cached = await AsyncStorage.getItem(CACHE_PREFIX + address);
    return cached ? JSON.parse(cached) : [];
}

async function setCachedHoldings(address: string, holdings: any[]) {
    await AsyncStorage.setItem(CACHE_PREFIX + address, JSON.stringify(holdings));
}

async function getHoldings(address: PublicKey, network: string) {
    if (!address) return { items: [], nativeBalance: 0 };
    try {
        const response = await fetch(`/api/holdings?address=${address.toBase58()}&network=${network}`);
        const data = await response.json();
        return {
            items: data.holdings.result?.items || [],
            nativeBalance: data.holdings.result?.nativeBalance || 0
        };
    } catch (err: any) {
        console.error(err);
        return { items: [], nativeBalance: 0 };
    }
}

export function useHoldings(address: PublicKey) {
    const [holdings, setHoldings] = useState<HoldingList>([]);
    const [nativeBalance, setNativeBalance] = useState<NativeBalance>({
        lamports: 0,
        price_per_sol: 0,
        total_price: 0
    });
    const { network } = useSolanaWallet();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHoldings = useCallback(async () => {
        setLoading(true);
        setError(null);
        if (!address) {
            setHoldings([]);
            setNativeBalance({ lamports: 0, price_per_sol: 0, total_price: 0 });
            setLoading(false);
            return;
        }
        const cached = await getCachedHoldings(address?.toBase58());
        setHoldings(cached);
        try {
            const { items: fetched, nativeBalance } = await getHoldings(address, network);
            setNativeBalance(nativeBalance);
            const isNew = !cached.length || fetched[0]?.signature !== cached[0]?.signature;
            if (isNew) {
                await setCachedHoldings(address.toBase58(), fetched);
                setHoldings(fetched);
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
            await fetchHoldings();
        })();
        return () => {
            isMounted = false;
        };
    }, [address, network, fetchHoldings]);

    return { holdings, loading, error, refetch: fetchHoldings, nativeBalance };
}