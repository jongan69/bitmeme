import { useMemo } from "react";

import usePersistentStore from "@/stores/local/persistentStore";
import { getNetworkConfig } from "@/utils/network";

export const useNetworkConfig = () => {
  const solanaNetwork = usePersistentStore((state: { solanaNetwork: any; }) => state.solanaNetwork);
  const bitcoinNetwork = usePersistentStore((state: { bitcoinNetwork: any; }) => state.bitcoinNetwork);

  const config = useMemo(
    () => getNetworkConfig(solanaNetwork, bitcoinNetwork),
    [solanaNetwork, bitcoinNetwork]
  );
  return config;
};
