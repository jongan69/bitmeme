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
