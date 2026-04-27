export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { endpoint, ...queryParams } = req.query;
  if (!endpoint) return res.status(400).json({ status: false, message: 'Missing endpoint' });

  const VALID = ['aio','hdv4','tiktokstalk','toanime','tochibi','tofigura','tofigurav2','tofigurav3','toblonde','tohitam','toputih','iqcv2','tts-lengkap'];
  if (!VALID.includes(endpoint)) return res.status(400).json({ status: false, message: 'Invalid endpoint' });

  const BASE = 'https://api-faa.my.id/faa';
  const qs = new URLSearchParams(queryParams).toString();
  const url = `${BASE}/${endpoint}${qs ? '?' + qs : ''}`;

  try {
    let upstreamRes;
    if (req.method === 'POST') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks);
      upstreamRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': req.headers['content-type'] || 'application/octet-stream' },
        body,
      });
    } else {
      upstreamRes = await fetch(url);
    }

    const ct = upstreamRes.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data = await upstreamRes.json();
      return res.status(upstreamRes.status).json(data);
    } else {
      const buf = await upstreamRes.arrayBuffer();
      res.setHeader('Content-Type', ct);
      return res.status(upstreamRes.status).send(Buffer.from(buf));
    }
  } catch (e) {
    return res.status(500).json({ status: false, message: e.message || 'Proxy error' });
  }
}
