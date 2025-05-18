import useSWR from "swr";

import { useZplClient } from "@/contexts/ZplClientProvider";

function useTwoWayPegConfiguration() {
  const zplClient = useZplClient();
  const { data, mutate } = useSWR(
    zplClient ? [zplClient, "getTwoWayPegConfiguration"] : null,
    () => zplClient?.getTwoWayPegConfiguration(),
    {
      dedupingInterval: 600000,
    }
  );

  return {
    data,
    // if 0, then transaction will failed, which means vbytes * fee = 0
    feeRate: data?.minerFeeRate ?? 1,
    mutate,
  };
}

export default useTwoWayPegConfiguration;
