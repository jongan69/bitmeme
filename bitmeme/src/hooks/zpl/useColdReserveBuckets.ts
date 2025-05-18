import useSWR from "swr";

import { useZplClient } from "@/contexts/ZplClientProvider";

function useColdReserveBuckets() {
  const zplClient = useZplClient();
  const { data, mutate, isLoading } = useSWR(
    zplClient ? "getColdReserveBuckets" : null,
    async () => {
      if (!zplClient) throw new Error("zplClient is not available");
      // console.log("[useColdReserveBuckets] fetcher called");
      try {
        const result = await zplClient.getColdReserveBuckets();
        // console.log("[useColdReserveBuckets] fetcher result", result);
        return result;
      } catch (e) {
        console.error("[useColdReserveBuckets] fetcher error", e);
        throw e;
      }
    },
    {
      dedupingInterval: 3600000,
    }
  );
  return {
    data: data ?? [],
    mutate,
    isLoading,
  };
}

export default useColdReserveBuckets;
