// GET /api/leads?key=... — read-only view of stored leads for the site owner
// and the weekly analytics report. Gated by LEADS_READ_KEY (Vercel secret env
// var), so the lead list is never publicly reachable.
import { list } from '@vercel/blob';

const PATH = 'leads.json';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method' });
  }
  const expected = process.env.LEADS_READ_KEY;
  if (!expected || String(req.query.key || '') !== expected) {
    return res.status(403).json({ error: 'forbidden' });
  }
  try {
    const { blobs } = await list({ prefix: PATH });
    if (!blobs.length) {
      return res.status(200).json({ leads: [], total: 0 });
    }
    const r = await fetch(blobs[0].url);
    const leads = await r.json().catch(() => []);
    return res.status(200).json({ leads, total: Array.isArray(leads) ? leads.length : 0 });
  } catch (e) {
    return res.status(500).json({ error: 'read_failed' });
  }
}
