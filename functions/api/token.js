export async function onRequestPost(context) {
    try {
        const { secret } = await context.request.json();

        if (!secret) {
            return new Response(JSON.stringify({ error: "Missing secret" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const openSymbolsResponse = await fetch("https://www.opensymbols.org/api/v2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({ secret: secret.trim() })
        });

        const data = await openSymbolsResponse.json();

        return new Response(JSON.stringify(data), {
            status: openSymbolsResponse.status,
            headers: {
                "Content-Type": "application/json",
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