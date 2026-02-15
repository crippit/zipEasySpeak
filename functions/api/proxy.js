export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  // 1. Configuration: Allowed Domains
  const allowedOrigins = ['https://easyspeak.zipsolutions.org', 'https://zipeasyspeak.pages.dev'];
  const origin = request.headers.get('Origin');

  // 2. Handle CORS Preflight (OPTIONS)
  if (request.method === "OPTIONS") {
    const allowOrigin = allowedOrigins.includes(origin) ? origin : 'null';
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // 3. Validate: Target URL exists
  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  // 4. Security: Origin & Site Check (Stop abuse BEFORE fetching)
  const fetchSite = request.headers.get('Sec-Fetch-Site');

  // Block cross-site embedding abuse
  if (fetchSite === 'cross-site') {
    return new Response('Forbidden: Cross-Site Request', { status: 403 });
  }

  // Block unauthorized origins (if Origin header exists)
  if (origin && !allowedOrigins.includes(origin)) {
    return new Response('Forbidden: Invalid Origin', { status: 403 });
  }

  try {
    const targetObj = new URL(targetUrl);

    // 5. Security: Protocol Check (Prevent SSRF/Local Network Scanning)
    if (targetObj.protocol !== 'https:') {
      return new Response('Forbidden: Only HTTPS URLs allowed', { status: 400 });
    }

    // Rule A: Allow OpenSymbols API (Search)
    const isOpenSymbolsAPI = targetObj.hostname === 'www.opensymbols.org';

    // 6. Fetch the resource
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'ZipEasySpeak/1.0',
        // Forward auth header if present, but strictly only to OpenSymbols
        ...(isOpenSymbolsAPI && request.headers.get('Authorization')
          ? { 'Authorization': request.headers.get('Authorization') }
          : {})
      }
    });

    // 7. Security: Content-Type Check (Anti-Abuse)
    // We fetched it, but before we return it, check what it is.
    const contentType = response.headers.get('content-type');
    const isImage = contentType && contentType.startsWith('image/');

    // Strictly block non-image content unless it is the specific API we trust
    if (!isOpenSymbolsAPI && !isImage) {
      return new Response('Forbidden: Proxy only allows images or OpenSymbols API', { status: 403 });
    }

    // 8. Return Response
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers)
    });

    // Set CORS headers (Safe because we validated Origin in step 4)
    newResponse.headers.set('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');

    return newResponse;

  } catch (err) {
    return new Response('Proxy fetch failed: ' + err.message, { status: 500 });
  }
}