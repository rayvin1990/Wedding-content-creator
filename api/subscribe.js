// POST /api/subscribe — validates the email and stores it as a lead in the
// project's private Vercel Blob store (one small JSON per submission, so
// there is no read-modify-write race; the read endpoint merges them).
import { put } from '@vercel/blob';

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
  const id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);

  try {
    await put(`leads/${id}.json`, JSON.stringify(entry), {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
    });
    return res.status(200).json({ ok: true, id });
  } catch (e) {
    return res.status(500).json({ ok: false });
  }
}
