export default function health(_req, res) {
  res.status(200).json({ ok: true, runtime: 'vercel' });
}
