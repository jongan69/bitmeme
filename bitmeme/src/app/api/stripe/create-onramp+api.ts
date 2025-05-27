export async function POST(request: Request) {
    const {
        ethereumAddress,
        solanaAddress,
        bitcoinAddress,
        // Add more wallet addresses as needed
        customer_ip_address,
        destination_networks,
        destination_currencies,
        destination_network,
        destination_currency,
        destination_amount,
        source_currency,
        source_amount,
        customer_information // { email, first_name, last_name, dob, address }
    } = await request.json();

    const key = process.env.EXPO_PUBLIC_APP_NETWORK === "mainnet"
        ? process.env.STRIPE_SECRET_KEY
        : process.env.STRIPE_TEST_SECRET_KEY;

    const params = new URLSearchParams();

    // Wallet addresses (only include if network is supported)
    if (destination_networks) {
        if (ethereumAddress && destination_networks.includes("ethereum")) params.append("wallet_addresses[ethereum]", ethereumAddress);
        if (solanaAddress && destination_networks.includes("solana")) params.append("wallet_addresses[solana]", solanaAddress);
        if (bitcoinAddress && destination_networks.includes("bitcoin")) params.append("wallet_addresses[bitcoin]", bitcoinAddress);
    }

    // Customer IP
    if (customer_ip_address) params.append("customer_ip_address", customer_ip_address);

    // Destination fields
    // if (destination_address) params.append("destination_address", destination_address);
    if (destination_networks) destination_networks.forEach((n: string) => params.append("destination_networks[]", n));
    if (destination_currencies) destination_currencies.forEach((c: string) => params.append("destination_currencies[]", c));
    if (destination_network) params.append("destination_network", destination_network);
    if (destination_currency) params.append("destination_currency", destination_currency);
    if (destination_amount) params.append("destination_amount", destination_amount);

    // Source fields (optional)
    if (source_currency) params.append("source_currency", source_currency);
    if (source_amount) params.append("source_amount", source_amount);

    // Customer information (optional, for KYC prefill)
    if (customer_information) {
        if (customer_information.email) params.append("customer_information[email]", customer_information.email);
        if (customer_information.first_name) params.append("customer_information[first_name]", customer_information.first_name);
        if (customer_information.last_name) params.append("customer_information[last_name]", customer_information.last_name);
        if (customer_information.dob) {
            if (customer_information.dob.year) params.append("customer_information[dob][year]", String(customer_information.dob.year));
            if (customer_information.dob.month) params.append("customer_information[dob][month]", String(customer_information.dob.month));
            if (customer_information.dob.day) params.append("customer_information[dob][day]", String(customer_information.dob.day));
        }
        if (customer_information.address) {
            if (customer_information.address.country) params.append("customer_information[address][country]", customer_information.address.country);
            if (customer_information.address.line1) params.append("customer_information[address][line1]", customer_information.address.line1);
            if (customer_information.address.line2) params.append("customer_information[address][line2]", customer_information.address.line2);
            if (customer_information.address.city) params.append("customer_information[address][city]", customer_information.address.city);
            if (customer_information.address.state) params.append("customer_information[address][state]", customer_information.address.state);
            if (customer_information.address.postal_code) params.append("customer_information[address][postal_code]", customer_information.address.postal_code);
        }
    }

    const response = await fetch("https://api.stripe.com/v1/crypto/onramp_sessions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
    });

    const data = await response.json();
    console.log(data);
    return Response.json(data);
}