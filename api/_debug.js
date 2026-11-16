// TEMP DEBUG — raw output of @vercel/blob list(); remove after diagnosis.
import { list, put } from '@vercel/blob';

export default async function handler(req, res) {
  const expected = process.env.LEADS_READ_KEY;
  if (!expected || String(req.query.key || '') !== expected) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const out = {};
  try {
    const noPrefix = await list({});
    out.noPrefix = { count: noPrefix.blobs.length, blobs: noPrefix.blobs.map((b) => b.pathname) };
  } catch (e) { out.noPrefixError = String(e).slice(0, 300); }
  try {
    const withPrefix = await list({ prefix: 'leads' });
    out.withPrefix = { count: withPrefix.blobs.length, blobs: withPrefix.blobs.map((b) => b.pathname) };
  } catch (e) { out.prefixError = String(e).slice(0, 300); }
  out.env = {
    hasStoreId: Boolean(process.env.BLOB_STORE_ID),
    hasWebhookKey: Boolean(process.env.BLOB_WEBHOOK_PUBLIC_KEY),
  };
  return res.status(200).json(out);
}
