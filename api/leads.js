// GET /api/leads?key=... — read-only view of stored leads for the site owner
// and the weekly analytics report. Gated by LEADS_READ_KEY (Vercel secret env
// var), so the lead list is never publicly reachable. Merges the per-submission
// blobs under leads/ and sorts them chronologically.
import { list } from '@vercel/blob';

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
    const { blobs } = await list({ prefix: 'leads/' });
    // Private blobs are only readable with the store's read-write token.
    const headers = process.env.BLOB_READ_WRITE_TOKEN
      ? { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
      : {};
    const leads = [];
    for (const b of blobs) {
      try {
        const r = await fetch(b.url, { headers });
        if (r.ok) {
          const j = await r.json();
          if (j && j.email) leads.push(j);
        }
      } catch (e) {
        /* skip unreadable entry */
      }
    }
    leads.sort((a, b) => String(a.at).localeCompare(String(b.at)));
    return res.status(200).json({ leads, total: leads.length });
  } catch (e) {
    return res.status(500).json({ error: 'read_failed' });
  }
}
