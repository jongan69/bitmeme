export async function GET() {
  try {
    const res = await fetch('https://preserve.nft.storage/api/v1/collection/list_collections', {
      headers: {
        Authorization: `Bearer ${process.env.NFT_STORAGE_API_KEY}`,
      },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || res.statusText);
    }
    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
