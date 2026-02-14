/**
 * Cloudflare Function to handle OpenSymbols Authentication
 * This runs on the server side, bypassing CORS restrictions.
 */
export async function onRequestPost(context) {
    try {
        // 1. Read the secret from the incoming JSON body
        const { secret } = await context.request.json();

        if (!secret) {
            return new Response(JSON.stringify({ error: "Missing secret" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // 2. Forward the request to OpenSymbols
        const openSymbolsResponse = await fetch("https://www.opensymbols.org/api/v2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            // OpenSymbols expects form data for the secret
            body: new URLSearchParams({ secret: secret.trim() })
        });

        const data = await openSymbolsResponse.json();

        // 3. Return the result to your app
        return new Response(JSON.stringify(data), {
            status: openSymbolsResponse.status,
            headers: {
                "Content-Type": "application/json",
                // Allow your app to read this response
                "Access-Control-Allow-Origin": "*"
            }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}