export async function POST(req: Request) {
    try {
        // Validate input
        const body = await req.json().catch(() => null);
        if (!body || typeof body.address !== 'string' || !body.address) {
            return Response.json({
                success: false,
                error: 'Invalid or missing address in request body.'
            }, { status: 400 });
        }
        const { address } = body;

        const response = await fetch(`https://api.testnet.hiro.so/extended/v1/faucets/stx?address=${address}`, {
            method: 'POST',
        });

        // Check Content-Type before parsing
        const contentType = response.headers.get('content-type') || '';
        let data;
        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

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
    } catch (error) {
        // Catch any unexpected errors
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : String(error),
        }, { status: 500 });
    }
}