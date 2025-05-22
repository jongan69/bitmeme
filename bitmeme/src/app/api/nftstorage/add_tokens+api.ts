import Papa from 'papaparse';

export async function POST(req: Request) {
  const { collectionID, data } = await req.json(); // data is your array of objects

  // Convert JSON array to CSV string
  const csv = Papa.unparse(data);

  // Create a Blob from the CSV string
  const csvBlob = new Blob([csv], { type: 'text/csv' });

  const form = new FormData();
  form.append('collectionID', collectionID);
  form.append('file', csvBlob, 'data.csv');

  try {
    const res = await fetch(
      'https://preserve.nft.storage/api/v1/collection/add_tokens',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NFT_STORAGE_API_KEY}`,
        },
        body: form,
      }
    );
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
