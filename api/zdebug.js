// TEMP DEBUG v3 — can we fetch a private blob's URL server-side?
import { list } from '@vercel/blob';

export default async function handler(req, res) {
  const expected = process.env.LEADS_READ_KEY;
  if (!expected || String(req.query.key || '') !== expected) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const out = {};
  const { blobs } = await list({ prefix: 'leads/', limit: 3 });
  out.found = blobs.map((b) => b.pathname);
  if (blobs.length) {
    const b = blobs[0];
    out.url = b.url;
    try {
      const r = await fetch(b.url);
      out.fetchStatus = r.status;
      out.fetchBody = (await r.text()).slice(0, 200);
    } catch (e) {
      out.fetchError = String(e).slice(0, 200);
    }
  }
  return res.status(200).json(out);
}
