export async function GET(request: Request) {
    const url = new URL(request.url);
    const address = url.searchParams.get('address');
    const network = url.searchParams.get('network');
    // console.log("network", network);
    const baseUrl = network === 'mainnet' ? 'https://mainnet.helius-rpc.com?api-key=' + process.env.HELIUS_API_KEY : 'https://devnet.helius-rpc.com?api-key=' + process.env.HELIUS_API_KEY;
    const body = JSON.stringify({
        "jsonrpc": "2.0",
        "id": "1",
        "method": "getAssetsByOwner",
        "params": {
            "ownerAddress": address,
            "page": 1,
            "limit": 1000,
            "sortBy": {
                "sortBy": "created",
                "sortDirection": "asc"
            },
            "options": {
                "showUnverifiedCollections": false,
                "showCollectionMetadata": true,
                "showGrandTotal": true,
                "showFungible": true,
                "showNativeBalance": true,
                "showInscription": false,
                "showZeroBalance": false
            }
        }
    });
    // console.log("fullUrl", fullUrl);
    if (!address) {
        return new Response('No address found', {
            status: 404,
            headers: {
                'Content-Type': 'text/plain',
            },
        });
    }
    try {
    const response = await fetch(baseUrl, {
        method: 'POST',
        body: body,
    });
        const holdings = await response.json();

        if (holdings.error) {
            return new Response('Error fetching holdings: ' + JSON.stringify(holdings.error), {
                status: 500,
            });
        }
        return Response.json({ holdings });
    } catch (error) {
        console.error("Error fetching holdings:", error);
        return new Response('Error fetching holdings', {
            status: 500,
        });
    }
}