// TEMP DEBUG v2 — inspect what list() sees for various prefixes.
import { list } from '@vercel/blob';

export default async function handler(req, res) {
  const expected = process.env.LEADS_READ_KEY;
  if (!expected || String(req.query.key || '') !== expected) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const out = {};
  for (const p of ['', 'leads', 'leads/', 'leads/m']) {
    try {
      const r = await list({ prefix: p, limit: 20 });
      out[p || '(none)'] = r.blobs.map((b) => b.pathname);
    } catch (e) {
      out[p || '(none)'] = 'ERR: ' + String(e).slice(0, 200);
    }
  }
  out.storeId = process.env.BLOB_STORE_ID || null;
  return res.status(200).json(out);
}
