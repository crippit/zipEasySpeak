export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  // 1. Validate: Target URL exists
  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  // 2. Security: Origin Check (Stop external abuse)
  const fetchSite = request.headers.get('Sec-Fetch-Site');
  if (fetchSite === 'cross-site') {
    return new Response('Forbidden: Cross-Site Request', { status: 403 });
  }

  // 3. Set allowed origins for CORS
  const origin = request.headers.get('Origin');
  const allowedOrigins = ['https://easyspeak.zipsolutions.org', 'https://zipeasyspeak.pages.dev'];
  const allowOrigin = allowedOrigins.includes(origin) ? origin : 'null';

  try {
    // 4. Security: Target Whitelist Logic
    const targetObj = new URL(targetUrl);

    // Rule A: Allow OpenSymbols API (Search)
    const isOpenSymbolsAPI = targetObj.hostname === 'www.opensymbols.org';

    // 5. Fetch the resource
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'ZipEasySpeak/1.0',
        // Forward auth header if present, but strictly only to OpenSymbols
        ...(isOpenSymbolsAPI && request.headers.get('Authorization')
          ? { 'Authorization': request.headers.get('Authorization') }
          : {})
      }
    });

    // 6. Security: Content-Type Check (Anti-Abuse)
    const contentType = response.headers.get('content-type');
    const isImage = contentType && contentType.startsWith('image/');
    const isJSON = contentType && contentType.includes('application/json');

    if (!isOpenSymbolsAPI && !isImage) {
      return new Response('Forbidden: Proxy only allows images or OpenSymbols API', { status: 403 });
    }

    // 7. Return Response
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers)
    });

    // CORS headers
    newResponse.headers.set('Access-Control-Allow-Origin', allowOrigin);
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');

    return newResponse;

  } catch (err) {
    return new Response('Proxy fetch failed: ' + err.message, { status: 500 });
  }
}