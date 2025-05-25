import { useState } from "react";
import { SolanaNetwork, BitcoinNetwork } from "@/types/store";
import { notifySuccess, notifyError, notifyLoading } from "@/utils/notification";
import { requestSolanaAirdrop, requestBtcAirdrop, requestStxAirdropStatus } from "@/utils/requestAirdrop";


export type MultiAirdropResult = {
  address: string;
  type: "solana" | "bitcoin" | "stx";
  status: "success" | "limit-reached" | "error";
};

// Helper to extract a readable error message
function extractErrorMessage(error: any): string {
  if (!error) return "";
  if (typeof error === "string") {
    try {
      const parsed = JSON.parse(error);
      if (parsed && parsed.message) return parsed.message;
      return error;
    } catch {
      return error;
    }
  }
  if (typeof error === "object" && error.message) return error.message;
  return String(error);
}

export function useMultiAirdrop() {
  const [results, setResults] = useState<MultiAirdropResult[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Request airdrops for multiple addresses
   * @param params Object with arrays of addresses and network info
   */
  const requestAirdrops = async (params: {
    solanaAddresses?: string[]; // base58 strings
    bitcoinAddresses?: string[];
    stxAddresses?: string[];
    solanaNetwork: SolanaNetwork;
    bitcoinNetwork: BitcoinNetwork;
    claimAmountLimit?: number;
  }) => {
    console.log("[useMultiAirdrop] requestAirdrops called with params:", params);
    notifyLoading("Processing airdrops...");
    setLoading(true);
    const {
      solanaAddresses = [],
      bitcoinAddresses = [],
      stxAddresses = [],
      solanaNetwork,
      bitcoinNetwork,
      claimAmountLimit,
    } = params;
    const newResults: MultiAirdropResult[] = [];

    // Solana airdrops
    for (const address of solanaAddresses) {
      console.log("[useMultiAirdrop] Requesting Solana airdrop for:", address);
      const { status, error } = await requestSolanaAirdrop(address) as { status: MultiAirdropResult['status'], error: any };
      const errorMessage = extractErrorMessage(error) || "Unknown error";
      console.log("[useMultiAirdrop] Solana airdrop status for", address, ":", status, "error:", errorMessage);
      newResults.push({ address, type: "solana", status });
      if (status === "success") {
        notifySuccess(`Solana airdrop successful for ${address}`);
      } else if (status === "limit-reached") {
        notifyError(`Solana airdrop limit reached for ${address}`);
      } else {
        notifyError(`Solana airdrop failed: ${errorMessage}`);
      }
    }

    // Bitcoin airdrops
    for (const address of bitcoinAddresses) {
      console.log("[useMultiAirdrop] Requesting Bitcoin airdrop for:", address);
      const status = await requestBtcAirdrop({
        bitcoinAddress: address,
        solanaNetwork,
        bitcoinNetwork,
        claimAmountLimit,
      }) as MultiAirdropResult['status'];
      console.log("[useMultiAirdrop] Bitcoin airdrop status for", address, ":", status);
      newResults.push({ address, type: "bitcoin", status });
      // if (status == "success") {
      //   notifySuccess(`Bitcoin airdrop successful for ${address}`);
      // } else if (status === "limit-reached") {
      //   notifyError(`Bitcoin airdrop limit reached for ${address}`);
      // } else {
      //   notifyError(`Bitcoin airdrop failed for ${address}`);
      // }
    }

    // STX airdrops
    for (const address of stxAddresses) {
      console.log("[useMultiAirdrop] Requesting STX airdrop for:", address);
      const status = await requestStxAirdropStatus(address);
      console.log("[useMultiAirdrop] STX airdrop status for", address, ":", status);
      newResults.push({ address, type: "stx", status });
      if (status == "success") {
        notifySuccess(`STX airdrop successful for ${address}`);
      } else if (status === "limit-reached") {
        notifyError(`STX airdrop limit reached for ${address}`);
      } else {
        notifyError(`STX airdrop failed for ${address}`);
      }
    }

    console.log("[useMultiAirdrop] All airdrop results:", newResults);
    setResults(newResults);
    setLoading(false);
    return newResults;
  };

  return {
    requestAirdrops,
    results,
    loading,
  };
} 