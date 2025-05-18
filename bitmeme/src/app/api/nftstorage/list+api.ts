import axios from 'axios';

export async function GET() {
  try {
    const res = await axios.get('https://preserve.nft.storage/api/v1/collection/list_collections', {
      headers: {
        Authorization: `Bearer ${process.env.NFT_STORAGE_API_KEY}`,
      },
    });
    return Response.json(res.data);
  } catch (error: any) {
    return Response.json({ error: error.response?.data || error.message }, { status: 500 });
  }
}
