import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSolanaWallet } from "./SolanaWalletProvider";

import { useNetworkConfig } from "@/hooks/useNetworkConfig";
import { fetchAndCacheZplProgramIdsAndAssetMint } from "@/utils/networkConfigLoader";
import { ZplClient } from "./zplClient";

const ZplClientContext = createContext<ZplClient | null>(null);

const fetchZplProgramIdsAndAssetMint = async (bootstrapperProgramId: string, guardianSettingAccountAddress: string, rpcUrl: string) => {
  const { zplProgramIds, assetMint } = await fetchAndCacheZplProgramIdsAndAssetMint(bootstrapperProgramId, guardianSettingAccountAddress, rpcUrl);
  const ids = zplProgramIds as {
    twoWayPegProgramId: string;
    liquidityManagementProgramId: string;
    delegatorProgramId?: string;
    bitcoinSpvProgramId?: string;
    layerCaProgramId?: string;
  };
  // console.log("ids", ids);
  return {
    twoWayPegProgramId: ids.twoWayPegProgramId,
    liquidityManagementProgramId: ids.liquidityManagementProgramId,
    delegatorProgramId: ids.delegatorProgramId,
    bitcoinSpvProgramId: ids.bitcoinSpvProgramId,
    layerCaProgramId: ids.layerCaProgramId,
    assetMint,
  };
}

export const ZplClientProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const networkConfig = useNetworkConfig();

  const { publicKey: walletPublicKey, signTransaction, connection } = useSolanaWallet();

  // Add state for the fetched values
  const [programIds, setProgramIds] = useState<{ twoWayPegProgramId?: string; liquidityManagementProgramId?: string; assetMint?: string }>({});

  useEffect(() => {
    let isMounted = true;
    fetchZplProgramIdsAndAssetMint(
      networkConfig.bootstrapperProgramId,
      networkConfig.guardianSetting,
      connection.rpcEndpoint
    )
      .then((result) => {
        if (isMounted) setProgramIds(result);
        if (!result.twoWayPegProgramId || !result.liquidityManagementProgramId || !result.assetMint) {
          console.error("Missing program IDs or asset mint", result);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch program IDs or asset mint", err);
      });
    return () => { isMounted = false; };
  }, [networkConfig.bootstrapperProgramId, networkConfig.guardianSetting, connection.rpcEndpoint, walletPublicKey]);

  const client = useMemo(() => {
    if (
      !walletPublicKey ||
      !programIds.twoWayPegProgramId ||
      !programIds.liquidityManagementProgramId ||
      !programIds.assetMint
    ) {
      return null;
    }
    return new ZplClient(
      connection,
      walletPublicKey,
      signTransaction,
      programIds.twoWayPegProgramId,
      programIds.liquidityManagementProgramId,
      programIds.assetMint
    );
  }, [
    connection,
    walletPublicKey,
    programIds.twoWayPegProgramId,
    programIds.liquidityManagementProgramId,
    programIds.assetMint,
    signTransaction,
  ]);

  return (
    <ZplClientContext.Provider
      value={client}
    >
      {children}
    </ZplClientContext.Provider>
  );
};

export const useZplClient = (): ZplClient | null => {
  const context = useContext(ZplClientContext);
  if (context === undefined) {
    throw new Error("useZplClient must be used within a ZplClientProvider");
  }
  return context;
};
