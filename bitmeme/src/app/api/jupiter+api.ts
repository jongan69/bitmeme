// API for fetching Jupiter swap price

import { JUPITER_API_URL } from "@/utils/global";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mintAddress = searchParams.get('mintAddress');
    const response = await fetch(`${JUPITER_API_URL}/price/v2?ids=${mintAddress}`);
    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
    }
    const price = await response.json();
    return Response.json(price);
  } catch (error) {
    console.error('Error fetching Jupiter swap price:', error);
    return Response.json({ error: 'Error fetching Jupiter swap price' }, { status: 500 });
  }
}