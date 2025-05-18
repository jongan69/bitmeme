import axios from 'axios';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const collectionID = searchParams.get('collectionID');
  const lastKey = searchParams.get('lastKey');

  try {
    const res = await axios.get(
      `https://preserve.nft.storage/api/v1/collection/list_tokens`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NFT_STORAGE_API_KEY}`,
        },
        params: { collectionID, lastKey },
      }
    );
    return Response.json(res.data);
  } catch (error: any) {
    return Response.json({ error: error.response?.data || error.message }, { status: 500 });
  }
}
