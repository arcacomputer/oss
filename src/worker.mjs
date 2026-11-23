function preserveHtml(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('text/html')) return response;
  const headers = new Headers(response.headers);
  const current = headers.get('cache-control') || 'public, max-age=0, must-revalidate';
  if (!/(?:^|,)\s*no-transform\s*(?:,|$)/i.test(current)) headers.set('Cache-Control', `${current}, no-transform`);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/records') {
      url.pathname = '/records/';
      return Response.redirect(url, 308);
    }
    if (url.pathname === '/' || url.pathname === '/records/') {
      const assetUrl = new URL(url);
      assetUrl.pathname += 'index.html';
      return preserveHtml(await env.ASSETS.fetch(new Request(assetUrl, request)));
    }
    return preserveHtml(await env.ASSETS.fetch(request));
  },
};
