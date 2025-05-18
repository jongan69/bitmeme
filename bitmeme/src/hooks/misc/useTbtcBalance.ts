import { claimTBTCSchema } from "@/types/api";
import { useCallback, useEffect, useState } from "react";
import { useFetchers } from "./useFetchers";


const fetchClaimableAmount = async (bitcoinAddress: string, aegleFetcher: any) => {
    try {
      if (!bitcoinAddress) {
        return 0;
      }
      // console.log("[fetchClaimableAmount] Called");
      const response = await aegleFetcher(
        `api/v1/bitcoin-regtest-wallet/${bitcoinAddress}`,
        claimTBTCSchema
      );
      // console.log("[fetchClaimableAmount] Response received", response);
      if (!response) return 0;

      return response.balance;
    } catch (error) {
      console.error("Error fetching tbtc balance:", error);
      return 0;
    }
  };

export const useTbtcBalance = (bitcoinAddress: string) => {
    const [tbtcBalance, setTbtcBalance] = useState<number>(0);
    const { aegleFetcher } = useFetchers();

    const refetch = useCallback(
        () => fetchClaimableAmount(bitcoinAddress, aegleFetcher).then(setTbtcBalance),
        [bitcoinAddress, aegleFetcher]
    );

    useEffect(() => {
        refetch();
    }, [refetch]);

    return [tbtcBalance, refetch] as const;
};