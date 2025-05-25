import { BitcoinNetwork } from "@/types/store";
import { SolanaNetwork } from "@/types/store";

// Custom function for STX airdrop
const requestStxAirdrop = async (address: string) => {
  try {
    console.log("[DEBUG] requestStxAirdrop:", address);
    const response = await fetch(`/api/stx/faucet`, {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

// Helper for STX airdrop
export async function requestStxAirdropStatus(address: string) {
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
    return "error";
  }
}


// Helper function for Solana airdrop
export async function requestSolanaAirdrop(address: string, amount?: number) {
  try {
    const params = new URLSearchParams({ address });
    if (amount) params.append('amount', amount.toString());

    const response = await fetch(`/api/airdrop?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(typeof data.error === "string" ? data.error : JSON.stringify(data.error) || "Unknown error");
    }

    return { status: "success", data };
  } catch (err) {
    return { status: "error", error: err instanceof Error ? err.message : (typeof err === 'string' ? err : JSON.stringify(err)) };
  }
}

// Helper function for Bitcoin Regtest airdrop
export async function requestBtcAirdrop({
  bitcoinAddress,
  solanaNetwork,
  bitcoinNetwork,
  claimAmountLimit = 5000000,
}: {
  bitcoinAddress: string;
  solanaNetwork: SolanaNetwork;
  bitcoinNetwork: BitcoinNetwork;
  claimAmountLimit?: number;
}): Promise<"success" | "limit-reached" | "error"> {
  return "success";
}
