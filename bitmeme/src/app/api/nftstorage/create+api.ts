import axios from 'axios';

export async function POST(req: Request) {
  const body = await req.json();
  const { collectionName, contractAddress, chainID, network } = body;

  try {
    const res = await axios.post(
      'https://preserve.nft.storage/api/v1/collection/create_collection',
      { collectionName, contractAddress, chainID, network },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NFT_STORAGE_API_KEY}`,
        },
      }
    );
    return Response.json(res.data);
  } catch (error: any) {
    return Response.json({ error: error.response?.data || error.message }, { status: 500 });
  }
}
