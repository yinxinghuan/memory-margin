const SESSION_ID = 'b198e25d-5781-48c3-930a-143ed23a92b4'

/** Frontend-only session handler required by the AlterU static deployer. */
export async function handleApi(request) {
  const url = new URL(request.url)
  if (request.method === 'GET' && url.pathname.endsWith('/api/health')) {
    return Response.json({
      ok: true,
      game: 'memory-margin',
      sessionId: SESSION_ID,
      mode: 'frontend-only',
      persistence: 'local-browser',
    })
  }
  return new Response('Not Found', {status: 404})
}
