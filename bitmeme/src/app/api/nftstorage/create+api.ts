

export async function POST(req: Request) {
  const body = await req.json();
  const { collectionName, contractAddress, chainID, network } = body;

  try {
    const res = await fetch(
      'https://preserve.nft.storage/api/v1/collection/create_collection',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NFT_STORAGE_API_KEY}`,
        },
        body: JSON.stringify({ collectionName, contractAddress, chainID, network }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || res.statusText);
    }
    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
