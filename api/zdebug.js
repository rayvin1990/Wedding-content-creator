// TEMP DEBUG v4 — which auth method reads a private blob's content?
import { list } from '@vercel/blob';

export default async function handler(req, res) {
  const expected = process.env.LEADS_READ_KEY;
  if (!expected || String(req.query.key || '') !== expected) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const out = {};
  const { blobs } = await list({ prefix: 'leads/', limit: 1 });
  if (!blobs.length) return res.status(200).json({ error: 'no blobs' });
  const url = blobs[0].url;
  const token = process.env.BLOB_READ_WRITE_TOKEN || '';
  out.hasToken = Boolean(token);

  const tries = {
    bearer: { Authorization: `Bearer ${token}` },
    queryToken: {},
    headerToken: { 'x-vercel-blob-token': token },
  };
  for (const [name, headers] of Object.entries(tries)) {
    const u = name === 'queryToken' ? `${url}?token=${encodeURIComponent(token)}` : url;
    try {
      const r = await fetch(u, { headers });
      out[name] = { status: r.status, body: (await r.text()).slice(0, 120) };
    } catch (e) {
      out[name] = { error: String(e).slice(0, 120) };
    }
  }
  return res.status(200).json(out);
}
