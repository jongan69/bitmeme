import { useMemo } from "react";
import useSWR from "swr";
import { BigNumber } from "bignumber.js";
import usePersistentStore from "@/stores/local/persistentStore";
import { AppNetwork } from "@/types/store";

/**
 * useStacksBalance - React hook to fetch the STX balance for a Stacks address (testnet)
 *
 * @param address - Stacks address (string | null)
 * @returns { data: BigNumber, isLoading: boolean, mutate: () => void }
 *
 * Usage:
 *   const { data: balance, isLoading, mutate } = useStacksBalance(address);
 */
const fetchStacksBalance = async (address: string | null, appNetwork: AppNetwork): Promise<BigNumber> => {
  if (!address) return new BigNumber(0); 

  const stacksNetwork = appNetwork === AppNetwork.Mainnet ? "mainnet" : "testnet";
  const url = stacksNetwork === "testnet" ? `https://api.testnet.hiro.so/extended/v1/address/${address}/stx` : `https://api.hiro.so/extended/v2/addresses/${address}/balances/stx?include_mempool=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch STX balance");
  const data = await res.json();
  // The balance is in micro-STX (1 STX = 1_000_000 micro-STX)
  return new BigNumber(data.balance / 1_000_000);
};

const useStacksBalance = (address: string | null, appNetwork: AppNetwork) => {
  const shouldFetch = useMemo(() => !!address, [address]);
  const { data, isLoading, mutate, isValidating, error } = useSWR<BigNumber>(
    shouldFetch ? ["stx-balance", address] : null,
    () => fetchStacksBalance(address, appNetwork),
    {
      keepPreviousData: true,
      refreshInterval: 30000,
      dedupingInterval: 30000,
    }
  );
  // console.log("SWR error", error);
  return {
    data: data ?? new BigNumber(0),
    isLoading,
    mutate,
    isValidating,
  };
};

export default useStacksBalance; 