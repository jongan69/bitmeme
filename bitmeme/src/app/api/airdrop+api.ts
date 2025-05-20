export async function GET(request: Request) {
  const url = new URL(request.url);
  const address = url.searchParams.get('address');
  // Default to 1 SOL (1_000_000_000 lamports) if amount is not provided
  const amountParam = url.searchParams.get('amount');
  const amount = amountParam ? parseInt(amountParam, 10) : 1_000_000_000;
  if (!address) {
    return new Response('Missing address', {
      status: 400,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
  // Change endpoint to Helius
  const endpoint = `https://devnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: '1', // id as string to match curl
    method: 'requestAirdrop',
    params: [address, amount],
  });
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

    const data = await response.json();

    console.log('data', data);

    if (data.error) {
      return new Response('Error requesting airdrop: ' + JSON.stringify(data.error), {
        status: 500,
      });
    }
    return Response.json(data);
  } catch (error) {
    return new Response('Error requesting airdrop: ' + error, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}