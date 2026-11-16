// POST /api/subscribe — validates the email and forwards the lead to the
// site owner's inbox via FormSubmit. The destination address never appears
// in the repo; it comes from the LEADS_EMAIL environment variable.
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
  const email = String(body.email || '').trim().slice(0, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false });
  }
  const dest = process.env.LEADS_EMAIL;
  if (!dest) {
    return res.status(500).json({ ok: false });
  }
  try {
    const r = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(dest), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // FormSubmit rejects requests without a Referer (anti-script check)
        Referer: 'https://www.weddingcontentguide.com/wedding-content-creator-contract-template',
      },
      body: JSON.stringify({
        _subject: 'New lead: WCFG contract template',
        _template: 'table',
        _replyto: email,
        email: email,
        page: String(body.page || 'contract-template').slice(0, 100),
        source: 'weddingcontentguide.com',
      }),
    });
    if (!r.ok) {
      return res.status(502).json({ ok: false });
    }
    // FormSubmit answers 200 even for "needs activation" — treat that as
    // success for the visitor; the owner only has to click once, ever.
    const data = await r.json().catch(() => ({}));
    if (data.success === false && !/activation/i.test(String(data.message || ''))) {
      return res.status(502).json({ ok: false });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false });
  }
}
