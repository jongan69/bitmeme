export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const collectionID = searchParams.get('collectionID');
  const lastKey = searchParams.get('lastKey');

  try {
    const url = new URL('https://preserve.nft.storage/api/v1/collection/list_tokens');
    if (collectionID) url.searchParams.append('collectionID', collectionID);
    if (lastKey) url.searchParams.append('lastKey', lastKey);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.NFT_STORAGE_API_KEY}`,
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => res.statusText);
      return Response.json({ error: errorData }, { status: res.status });
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
