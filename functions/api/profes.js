export async function onRequestGet(context) {
  const { env } = context;

  try {
    const data = await env.PROFES_KV.get('profes', 'text');
    return new Response(data || JSON.stringify({ profes: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ profes: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;

  // Auth: compare SHA-256 of provided key with stored hash
  const adminKey = request.headers.get('X-Admin-Key') || '';
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(adminKey));
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (hashHex !== env.ADMIN_PASSWORD_HASH) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.text();
    // Validate JSON
    JSON.parse(body);
    await env.PROFES_KV.put('profes', body);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
