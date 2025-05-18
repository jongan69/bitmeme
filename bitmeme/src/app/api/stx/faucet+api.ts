export async function POST(req: Request) {
    const { address } = await req.json();
    const response = await fetch(`https://api.testnet.hiro.so/extended/v1/faucets/stx?address=${address}`, {
        method: 'POST',
    });
    const data = await response.json();
    console.log(data);

    // Check if the Hiro API returned an error
    if (!response.ok) {
        return Response.json({
            success: false,
            error: data,
        }, { status: response.status });
    }

    // Otherwise, return success
    return Response.json({
        success: true,
        data,
    });
}