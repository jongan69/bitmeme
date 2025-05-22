import { notifyError } from "@/utils/notification";
import { BitcoinNetwork } from "@/types/store";
import { SolanaNetwork } from "@/types/store";

// Helper for STX airdrop
export const requestStxAirdrop = async (address: string) => {
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

// Helper function for Solana airdrop
export async function requestSolanaAirdrop(address: string) {
  try {
    const response = await fetch(`/api/airdrop?address=${address}`);
    if (!response.ok) throw new Error("Airdrop failed");
    return "success";
  } catch (err) {
    console.error("Failed to request Solana airdrop:", err);
    notifyError("Solana airdrop failed for " + address);
    return "error";
  }
}

// Helper function for Bitcoin airdrop
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
