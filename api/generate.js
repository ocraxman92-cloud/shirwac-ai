const hits = new Map(); 

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST kaliya' });
  
  const ip = (req.headers['x-forwarded-for'] || 'x').split(',')[0];
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < 3600000);
  if (arr.length >= 30) return res.status(429).json({ error: 'Xadka saacadda waa dhammaaday. Wax yar sug.' });
  arr.push(now); hits.set(ip, arr);

  const { image, mime, level = 1, mode = 'amaan', ctx = '', avoid = [] } = req.body || {};
  const tone = ['deggan oo edeb leh', 'jilicsan oo soo jiidasho leh', 'jacayl oo dareen leh'][level] || 'jilicsan';
  const goal = image
    ? 'Sawirka waa screenshot sheekada WhatsApp. Akhri fariinta ugu dambeysay ee gabadha oo qor jawaab ku habboon.'
    : (mode === 'bilow' ? 'Qor fariin lagu bilaabo sheekada.' : 'Qor amaan qurux badan oo daacad ah.');
    
  const prompt = `Waxaad tahay Shirwac AI, caawiye qora fariimo shukaansi oo af Soomaali ah. ${goal}
Qor 3 fariimood oo kala duwan, mid walba 1-2 jumlo, dabiici ah, ixtiraam leh, ku haboon WhatsApp. Nooca: ${tone}.
${ctx ? 'Macluumaad dheeraad ah: ' + String(ctx).slice(0, 300) : ''}
${avoid.length ? 'Ha ku celin: ' + avoid.slice(-6).join(' | ') : ''}
Haddii gabadhu muujiso inayna rabin ama ay aniga ka xumaatay, jawaabtu waa inay noqotaa mid ixtiraam leh oo aan riixeynin.
Soo celi JSON array oo ah 3 string kaliya.`;

  const parts = [{ text: prompt }];
  if (image) parts.push({ inline_data: { mime_type: mime || 'image/jpeg', data: image } });
  
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseMimeType: 'application/json', temperature: 1 } })
    });
    const j = await r.json();
    const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(502).json({ error: 'AI-gu jawaab ma bixin.', detail: j?.error?.message });
    return res.status(200).json({ messages: JSON.parse(text) });
  } catch (e) {
    return res.status(500).json({ error: 'Khalad ayaa dhacay.' });
  }
    }
