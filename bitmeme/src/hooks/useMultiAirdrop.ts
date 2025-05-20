import { useState } from "react";
import { SolanaNetwork, BitcoinNetwork } from "@/types/store";
import { notifySuccess, notifyError, notifyLoading } from "@/utils/notification";
import { requestSolanaAirdrop, requestStxAirdrop, requestBtcAirdrop } from "@/utils/requestAirdrop";

// Helper for STX airdrop
async function requestStxAirdropStatus(address: string) {
  console.log("[requestStxAirdropStatus] Requesting STX airdrop for address:", address);
  try {
    const result = await requestStxAirdrop(address);
    console.log("[requestStxAirdropStatus] Result for", address, ":", result);
    if (result && result.success) {
      return "success";
    } else if (result && result.error && result.error.includes("limit")) {
      return "limit-reached";
    } else {
      return "error";
    }
  } catch (err) {
    console.error("Failed to request STX airdrop:", err);
    notifyError("STX airdrop failed for " + address);
    return "error";
  }
}

export type MultiAirdropResult = {
  address: string;
  type: "solana" | "bitcoin" | "stx";
  status: "success" | "limit-reached" | "error";
};

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
      const status = await requestSolanaAirdrop(address) as MultiAirdropResult['status'];
      console.log("[useMultiAirdrop] Solana airdrop status for", address, ":", status);
      newResults.push({ address, type: "solana", status });
      if (status === "success") {
        notifySuccess(`Solana airdrop successful for ${address}`);
      } else if (status === "limit-reached") {
        notifyError(`Solana airdrop limit reached for ${address}`);
      } else {
        notifyError(`Solana airdrop failed for ${address}`);
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
      if (status === "success") {
        notifySuccess(`Bitcoin airdrop successful for ${address}`);
      } else if (status === "limit-reached") {
        notifyError(`Bitcoin airdrop limit reached for ${address}`);
      } else {
        notifyError(`Bitcoin airdrop failed for ${address}`);
      }
    }

    // STX airdrops
    for (const address of stxAddresses) {
      console.log("[useMultiAirdrop] Requesting STX airdrop for:", address);
      const status = await requestStxAirdropStatus(address);
      console.log("[useMultiAirdrop] STX airdrop status for", address, ":", status);
      newResults.push({ address, type: "stx", status });
      if (status === "success") {
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