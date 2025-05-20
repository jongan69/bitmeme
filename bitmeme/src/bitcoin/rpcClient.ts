import type { AxiosError } from "axios";
import { AxiosInstance } from "axios";

export const sendTransaction = async (
  aresApi: AxiosInstance,
  rawTx: string
): Promise<string> => {
  console.log("[sendTransaction] Broadcasting payload:", rawTx);
  try {
    const res = await aresApi.post("/api/v1/transaction/broadcast", rawTx, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("[sendTransaction] Response:", res.data);
    const txId = res.data.data;
    return txId;
  } catch (error) {
    const err = error as AxiosError;
    console.error("[sendTransaction] Error response:", err?.response?.data || err);
    throw error;
  }
};

/**
 * Broadcast a raw transaction hex via Blockstream's public API.
 * @param rawTx - The raw transaction hex string
 * @param network - 'mainnet' or 'testnet' (default: 'testnet')
 * @returns Promise<string> - The transaction ID (txid)
 */
export const broadcastRawTxViaBlockstream = async (
  rawTx: string,
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<string> => {
  const url = network === 'mainnet'
    ? 'https://blockstream.info/api/tx'
    : 'https://mempool.space/testnet4/api/tx';
  try {
    console.log('[broadcastRawTxViaBlockstream] Broadcasting payload:', rawTx);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: rawTx,
    });
    console.log('[broadcastRawTxViaBlockstream] Response:', res);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Broadcast failed: ${errText}`);
    }
    const txid = await res.text();
    console.log('[broadcastRawTxViaBlockstream] Transaction ID:', txid);
    return txid.trim();
  } catch (error) {
    console.error('[broadcastRawTxViaBlockstream] Error:', error);
    throw error;
  }
};
