// POST /api/subscribe — validates the email and stores it as a lead in the
// project's private Vercel Blob store (leads.json). No third-party form
// service, no activation emails, no PII in the page source.
import { put, list } from '@vercel/blob';

const PATH = 'leads.json';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false });
  }
  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch (e) {
    body = {};
  }
  const email = String(body.email || '').trim().slice(0, 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false });
  }
  if (String(body.company || '') !== '') {
    // honeypot filled: a bot. Pretend success so it does not retry.
    return res.status(200).json({ ok: true });
  }

  const entry = {
    email,
    at: new Date().toISOString(),
    page: String(body.page || 'contract-template').slice(0, 100),
    source: String(body.source || 'weddingcontentguide.com').slice(0, 100),
  };

  try {
    let leads = [];
    const { blobs } = await list({ prefix: PATH });
    if (blobs.length) {
      const r = await fetch(blobs[0].url);
      if (r.ok) {
        const parsed = await r.json().catch(() => null);
        if (Array.isArray(parsed)) leads = parsed;
      }
    }
    leads.push(entry);
    await put(PATH, JSON.stringify(leads, null, 2), {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return res.status(200).json({ ok: true, total: leads.length });
  } catch (e) {
    return res.status(500).json({ ok: false });
  }
}
