export async function GET(request: Request) {
  const url = new URL(request.url);
  const address = url.searchParams.get('address');
  // Default to 1 SOL (1_000_000_000 lamports) if amount is not provided
  const amountParam = url.searchParams.get('amount');
  const amount = amountParam ? parseInt(amountParam, 10) : 1_000_000_000;
  if (!address) {
    return new Response('Missing address or amount', {
      status: 400,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
  // const endpoint = network === 'mainnet' ? 'https://api.mainnet-beta.solana.com' : 'https://api.devnet.solana.com';
  const endpoint = 'https://api.devnet.solana.com';
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'requestAirdrop',
    params: [address, amount],
  });
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });
  const data = await response.json();
  return Response.json(data);
}