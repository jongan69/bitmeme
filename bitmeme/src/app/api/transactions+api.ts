export async function GET(request: Request) {
  const url = new URL(request.url);
  const address = url.searchParams.get('address');
  const network = url.searchParams.get('network');
  // console.log("network", network);
  const baseUrl = network === 'mainnet' ? 'https://api.helius.xyz' : 'https://api-devnet.helius.xyz';
  const fullUrl = `${baseUrl}/v0/addresses/${address}/transactions?api-key=${process.env.HELIUS_API_KEY}`;
  // console.log("fullUrl", fullUrl);
  if (!address) {
    return new Response('No address found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
  const response = await fetch(fullUrl, {
    method: 'GET',
  });
  const transactions = await response.json();
  return Response.json({ transactions });
}