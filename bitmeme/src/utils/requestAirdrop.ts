import { createAxiosInstances } from "@/utils/axios";
import { MODAL_NAMES } from "@/utils/constant";
import { notifyError } from "@/utils/notification";
import useStore from "@/stores/local/store";
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
  const { aegleApi } = createAxiosInstances(solanaNetwork, bitcoinNetwork);
  const claimUrl = `api/v1/bitcoin-regtest-wallet/${bitcoinAddress}/claim`;

  try {
    const response = await aegleApi.post(claimUrl, {
      amount: claimAmountLimit,
    });

    if (response.status === 200) {
      useStore.getState().openModalByName(MODAL_NAMES.SUCCESSFUL_CLAIM);
      return "success";
    } else if (response.status === 429) {
      notifyError("You have reached the daily claim limit.");
      return "limit-reached";
    } else {
      notifyError("Unexpected response. Please try again later.");
      return "error";
    }
  } catch (err) {
    console.error("[requestBtcAirdrop] Error:", err);
    notifyError("Claim failed. Please try again later.");
    return "error";
  }
}
