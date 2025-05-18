import NodeFormData from 'form-data';
import axios from 'axios';
import Papa from 'papaparse'; 

export async function POST(req: Request) {
  const { collectionID, data } = await req.json(); // data is your array of objects

  // Convert JSON array to CSV string
  const csv = Papa.unparse(data);

  // Create a Buffer from the CSV string
  const csvBuffer = Buffer.from(csv, 'utf-8');

  const form = new NodeFormData();
  form.append('collectionID', collectionID);
  form.append('file', csvBuffer, { filename: 'data.csv', contentType: 'text/csv' });

  try {
    const res = await axios.post(
      'https://preserve.nft.storage/api/v1/collection/add_tokens',
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.NFT_STORAGE_API_KEY}`,
        },
      }
    );
    return Response.json(res.data);
  } catch (error: any) {
    return Response.json({ error: error.response?.data || error.message }, { status: 500 });
  }
}
