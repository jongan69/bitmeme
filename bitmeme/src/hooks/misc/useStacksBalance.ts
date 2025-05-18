import { useMemo } from "react";
import useSWR from "swr";
import { BigNumber } from "bignumber.js";

/**
 * useStacksBalance - React hook to fetch the STX balance for a Stacks address (testnet)
 *
 * @param address - Stacks address (string | null)
 * @returns { data: BigNumber, isLoading: boolean, mutate: () => void }
 *
 * Usage:
 *   const { data: balance, isLoading, mutate } = useStacksBalance(address);
 */
const fetchStacksBalance = async (address: string | null): Promise<BigNumber> => {
  if (!address) return new BigNumber(0);
  const url = `https://api.testnet.hiro.so/extended/v1/address/${address}/stx`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch STX balance");
  const data = await res.json();
  // The balance is in micro-STX (1 STX = 1_000_000 micro-STX)
  return new BigNumber(data.balance);
};

const useStacksBalance = (address: string | null) => {
  const shouldFetch = useMemo(() => !!address, [address]);
  const { data, isLoading, mutate } = useSWR<BigNumber>(
    shouldFetch ? ["stx-balance", address] : null,
    () => fetchStacksBalance(address),
    {
      keepPreviousData: true,
      refreshInterval: 30000,
      dedupingInterval: 30000,
    }
  );
  return {
    data: data ?? new BigNumber(0),
    isLoading,
    mutate,
  };
};

export default useStacksBalance; 