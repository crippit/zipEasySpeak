export async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    // Fetch the requested resource (image or API result)
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'ZipEasySpeak/1.0'
      }
    });

    // Create a new response based on the fetched one
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers)
    });

    // Add CORS headers to allow your app to read the data
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return newResponse;
  } catch (err) {
    return new Response('Proxy fetch failed', { status: 500 });
  }
}