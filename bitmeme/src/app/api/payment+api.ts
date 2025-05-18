// API for confirming payment

// 1. Recieve solana signature from client
// 2. Verify solana signature
// 3. Confirm payment with merchant
// 4. Update payment status?


export function GET(request: Request) {
    return Response.json({ hello: 'world' });
  }