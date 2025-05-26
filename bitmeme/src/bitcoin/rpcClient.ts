/**
 * Broadcast a raw transaction hex.
 * @param rawTx - The raw transaction hex string
 * @param network - 'mainnet' or 'testnet' (default: 'testnet')
 * @returns Promise<string> - The transaction ID (txid)
 */
export const broadcastRawTx = async (
  rawTx: string,
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<string> => {
  const url = network === 'mainnet'
    ? process.env.EXPO_PUBLIC_BITCOIN_MAINNET_RPC!
    : process.env.EXPO_PUBLIC_BITCOIN_TESTNET_RPC!;
  try {
    console.log('[broadcastRawTxViaBlockstream] Broadcasting payload:', rawTx);
    console.log('using url: ', url)
    const body = JSON.stringify({
      "id": 1, 
      "jsonrpc": "2.0", 
      "method": "sendrawtransaction", 
      "params": [rawTx]
    });
    const res = await fetch(url, {
      method: 'POST',
      body,
    });
    console.log('[broadcastRawTxViaBlockstream] Response:', res);
    if (!res.ok) {
      const errText = await res.json();
      throw new Error(`Broadcast failed: ${errText}`);
    }
    const txid = await res.json();
    console.log('[broadcastRawTxViaBlockstream] Transaction ID:', txid.result);
    return txid.result.trim();
  } catch (error) {
    console.error('[broadcastRawTxViaBlockstream] Error:', error);
    throw error;
  }
};

/**
 * Test if a raw transaction would be accepted into the mempool (dry run, no broadcast).
 * @param rawTx - The raw transaction hex string
 * @param network - 'mainnet' or 'testnet' (default: 'testnet')
 * @returns Promise<any> - The mempool accept result
 */
export const testMempoolAccept = async (
  rawTx: string,
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<any> => {
  const url = network === 'mainnet'
    ? process.env.EXPO_PUBLIC_BITCOIN_MAINNET_RPC!
    : process.env.EXPO_PUBLIC_BITCOIN_TESTNET_RPC!;
  try {
    const body = JSON.stringify({
      id: 1,
      jsonrpc: '2.0',
      method: 'testmempoolaccept',
      params: [[rawTx]]
    });
    const res = await fetch(url, {
      method: 'POST',
      body,
    });
    const result = await res.json();
    console.log('[testMempoolAccept] Response:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('[testMempoolAccept] Error:', error);
    throw error;
  }
};

/**
 * Decode a raw transaction hex into a human-readable JSON structure.
 * @param rawTx - The raw transaction hex string
 * @param network - 'mainnet' or 'testnet' (default: 'testnet')
 * @returns Promise<any> - The decoded transaction
 */
export const decodeRawTransaction = async (
  rawTx: string,
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<any> => {
  const url = network === 'mainnet'
    ? process.env.EXPO_PUBLIC_BITCOIN_MAINNET_RPC!
    : process.env.EXPO_PUBLIC_BITCOIN_TESTNET_RPC!;
  try {
    const body = JSON.stringify({
      id: 1,
      jsonrpc: '2.0',
      method: 'decoderawtransaction',
      params: [rawTx]
    });
    const res = await fetch(url, {
      method: 'POST',
      body,
    });
    const result = await res.json();
    console.log('[decodeRawTransaction] Response:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('[decodeRawTransaction] Error:', error);
    throw error;
  }
};
