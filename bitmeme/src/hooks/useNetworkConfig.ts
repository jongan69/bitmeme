import { useMemo } from "react";

import usePersistentStore from "@/stores/local/persistentStore";
import { getNetworkConfig } from "@/utils/network";

export const useNetworkConfig = () => {
    const appNetwork = usePersistentStore((state: { appNetwork: any; }) => state.appNetwork);

  const config = useMemo(
    () => getNetworkConfig(appNetwork),
    [appNetwork]
  );
  return config;
};
