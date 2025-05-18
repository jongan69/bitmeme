export const requestStxAirdrop = async (address: string) => {
    try {
        console.log("[DEBUG] requestStxAirdrop:", address);
        const response = await fetch(`/api/stx/faucet`, {
            method: 'POST',
            body: JSON.stringify({ address }),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        return null;
    }
};

