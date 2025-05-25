import { PublicKey } from '@solana/web3.js';

const MAX_AIRDROP_AMOUNT = 2_000_000_000; // 2 SOL

function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const address = url.searchParams.get('address');
  const amountParam = url.searchParams.get('amount');
  const amount = amountParam ? parseInt(amountParam, 10) : 1_000_000_000;

  if (!process.env.HELIUS_API_KEY) {
    return Response.json({ error: 'Server misconfiguration: missing Helius API key.' }, { status: 500 });
  }

  if (!address || !isValidSolanaAddress(address)) {
    return Response.json({ error: 'Invalid or missing Solana address.' }, { status: 400 });
  }

  if (isNaN(amount) || amount <= 0 || amount > MAX_AIRDROP_AMOUNT) {
    return Response.json({ error: `Invalid amount. Must be between 1 and ${MAX_AIRDROP_AMOUNT} lamports.` }, { status: 400 });
  }

  const endpoint = `https://devnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: '1',
    method: 'requestAirdrop',
    params: [address, amount],
  });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const data = await response.json();

    if (data.error) {
      return Response.json({ error: typeof data.error === "string" ? data.error : JSON.stringify(data.error) }, { status: 500 });
    }
    return Response.json(data);
  } catch (error) {
    // Optionally log error here
    return Response.json({ error: 'Internal server error', details: error instanceof Error ? error.message : JSON.stringify(error) }, { status: 500 });
  }
}