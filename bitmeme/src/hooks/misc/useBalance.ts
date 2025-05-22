// import "../../polyfills";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import { BigNumber } from "bignumber.js";
import useSWR from "swr";

import { useSolanaWallet } from "@/contexts/SolanaWalletProvider";
import { useZplClient } from "@/contexts/ZplClientProvider";

const balanceFetcher = async (
  publickey: PublicKey,
  connection: Connection,
  mint: PublicKey
) => {
  try {
    const ata = await getAssociatedTokenAddress(mint, publickey, true);
    const accountData = await getAccount(connection, ata);

    return new BigNumber(accountData.amount.toString());
  } catch {
    return new BigNumber(0);
  }
};

const useBalance = (solanaPubkey: PublicKey | null) => {
  const { connection } = useSolanaWallet();
  const zplClient = useZplClient();
  const { data, isLoading, mutate } = useSWR<BigNumber>(
    solanaPubkey && connection && zplClient?.assetMint
      ? [solanaPubkey.toBase58(), connection, zplClient.assetMint, "balance"]
      : null,
    async ([pubkeyStr, conn, mint]: [string, Connection, string]) =>
      balanceFetcher(new PublicKey(pubkeyStr), conn, new PublicKey(mint)),
    {
      keepPreviousData: true,
      refreshInterval: 30000,
      dedupingInterval: 30000,
    }
  );
  // console.log("[useBalance] data", data, solanaPubkey, connection, zplClient?.assetMint);
  return {
    data: data ?? new BigNumber(0),
    isLoading,
    mutate,
  };
};

export default useBalance;
