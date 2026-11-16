// GET /api/subscribe-dest — hands the lead-form destination address to the
// page at runtime (instead of baking it into the public source, where
// static-scraping bots would harvest it). Kept as an env var so the
// inbox can be swapped without touching code.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    return res.status(405).json({ dest: '' });
  }
  return res.status(200).json({ dest: process.env.LEADS_EMAIL || '' });
}
