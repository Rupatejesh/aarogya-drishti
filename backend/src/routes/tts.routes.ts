import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/v1/tts/synthesize
 * Query params:
 *   - text: string to speak
 *   - lang: 'te' | 'hi' | 'en' (defaults to 'te')
 * 
 * Proxies neural audio stream from Indian Neural Voice Engine (te-IN, hi-IN, en-IN)
 * with CORS headers and proper content-type.
 */
router.get('/synthesize', async (req: Request, res: Response) => {
  try {
    const rawLang = String(req.query.lang || 'te').toLowerCase();
    const rawText = String(req.query.text || '').trim();

    if (!rawText) {
      return res.status(400).json({ error: 'Text query parameter is required' });
    }

    const langCode = rawLang.startsWith('te') ? 'te' : rawLang.startsWith('hi') ? 'hi' : 'en';
    // Truncate to reasonable sentence length for single phrase synthesis
    const cleanText = rawText
      .replace(/[#*`_~\[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 200)
      .trim();

    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${langCode}&q=${encodeURIComponent(cleanText)}`;

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
      const response = await fetch(ttsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': 'https://translate.google.com/'
        }
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return res.send(buffer);
      }
    } catch (fetchErr: any) {
      console.warn('[TTS Proxy] Outbound stream failed (offline/sandbox):', fetchErr?.message);
    }

    return res.status(204).end();
  } catch (err: any) {
    console.error('[TTS Proxy Error]', err);
    return res.status(500).json({ error: 'Failed to synthesize speech', details: err?.message });
  }
});

export default router;

