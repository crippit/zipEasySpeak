export async function onRequestPost(context) {
    const request = context.request;

    // 1. Security: Origin Check
    const fetchSite = request.headers.get('Sec-Fetch-Site');
    if (fetchSite === 'cross-site') {
        return new Response(JSON.stringify({ error: "Forbidden: Cross-Site Request" }), {
            status: 403,
            headers: { "Content-Type": "application/json" }
        });
    }

    // 2. Set allowed origins for CORS
    const origin = request.headers.get('Origin');
    const allowedOrigins = ['https://easyspeak.zipsolutions.org', 'https://zipeasyspeak.pages.dev'];
    const allowOrigin = allowedOrigins.includes(origin) ? origin : 'null';

    try {
        const { secret } = await request.json();

        if (!secret) {
            return new Response(JSON.stringify({ error: "Missing secret" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // 3. Exchange with OpenSymbols
        const openSymbolsResponse = await fetch("https://www.opensymbols.org/api/v2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({ secret: secret.trim() })
        });

        const data = await openSymbolsResponse.json();

        // 4. Return result
        return new Response(JSON.stringify(data), {
            status: openSymbolsResponse.status,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": allowOrigin
            }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}