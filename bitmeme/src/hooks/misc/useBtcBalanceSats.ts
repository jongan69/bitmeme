// https://mempool.space/testnet/api/address/tb1p37dfkl0fj6x2jm6u7683f06n9ewj3hggvspyfs44vxt7wjeauh0sgrm9tc

// {
//     "address": "tb1p37dfkl0fj6x2jm6u7683f06n9ewj3hggvspyfs44vxt7wjeauh0sgrm9tc",
//     "chain_stats": {
//         "funded_txo_count": 4,
//         "funded_txo_sum": 369810,
//         "spent_txo_count": 1,
//         "spent_txo_sum": 183005,
//         "tx_count": 3
//     },
//     "mempool_stats": {
//         "funded_txo_count": 0,
//         "funded_txo_sum": 0,
//         "spent_txo_count": 0,
//         "spent_txo_sum": 0,
//         "tx_count": 0
//     }
// }

import { useEffect, useState } from 'react';

// Returns the total sats for a given Bitcoin testnet address using mempool.space API
export function useBtcBalanceSats(address: string | null | undefined, network: "testnet" | "mainnet") {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const refresh = () => setRefreshIndex((i) => i + 1);
  const url = network === "mainnet" ? "https://mempool.space/api/address/" : "https://mempool.space/testnet/api/address/";

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setError(null);
    setBalance(null);
    fetch(`${url}${address}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch BTC balance');
        return res.json();
      })
      .then((data) => {
        // Calculate total sats: funded_txo_sum - spent_txo_sum
        const chain = data.chain_stats;
        const mempool = data.mempool_stats;
        const total =
          (chain.funded_txo_sum + mempool.funded_txo_sum) -
          (chain.spent_txo_sum + mempool.spent_txo_sum);
        setBalance(total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [address, network, refreshIndex]);

  return { balance, loading, error, refresh };
}