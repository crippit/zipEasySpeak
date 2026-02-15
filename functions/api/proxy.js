export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  // 1. Validate: Target URL exists
  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  // 2. Validate: Request Origin (Stop external abuse)
  // We check if the request is coming from the same site (browser behavior)
  // 'Sec-Fetch-Site' header is a robust way to prevent cross-site usage.
  const fetchSite = request.headers.get('Sec-Fetch-Site');
  const origin = request.headers.get('Origin');
  
  // Allow 'same-origin' (production) and 'none' (often tools/mobile apps)
  // We explicitly block 'cross-site' which would be another website trying to use your proxy.
  if (fetchSite === 'cross-site') {
    return new Response('Forbidden: Cross-Site Request', { status: 403 });
  }

  try {
    // 3. Security: Target Whitelist Logic
    const targetObj = new URL(targetUrl);
    
    // Rule A: Allow OpenSymbols API (Search)
    const isOpenSymbolsAPI = targetObj.hostname === 'www.opensymbols.org';

    // 4. Fetch the resource
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'ZipEasySpeak/1.0',
        // Forward auth header if present, but strictly only to OpenSymbols
        ...(isOpenSymbolsAPI && request.headers.get('Authorization') 
            ? { 'Authorization': request.headers.get('Authorization') } 
            : {})
      }
    });

    // 5. Security: Content-Type Check (Anti-Abuse)
    // If it's NOT OpenSymbols API, we MUST ensure we are only proxying Images.
    // This prevents people from using your proxy to browse the web or attack servers.
    const contentType = response.headers.get('content-type');
    const isImage = contentType && contentType.startsWith('image/');
    const isJSON = contentType && contentType.includes('application/json');

    if (!isOpenSymbolsAPI && !isImage) {
      return new Response('Forbidden: Proxy only allows images or OpenSymbols API', { status: 403 });
    }

    // 6. Return Response
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers)
    });

    // Standard CORS headers for your app
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');

    return newResponse;

  } catch (err) {
    return new Response('Proxy fetch failed: ' + err.message, { status: 500 });
  }
}