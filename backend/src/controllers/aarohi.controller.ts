import { Request, Response } from 'express';
import { aarohiService } from '../services/aarohi.service.js';

export const chatWithAarohi = async (req: Request, res: Response) => {
  try {
    const { message, language = 'te', history = [], role = 'citizen' } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message string is required'
      });
    }

    const validatedLang = (['te', 'hi', 'en'].includes(language) ? language : 'te') as 'te' | 'hi' | 'en';

    const result = await aarohiService.chat({
      message: message.trim(),
      language: validatedLang,
      history: Array.isArray(history) ? history : [],
      role
    });

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[AarohiController] Error processing chat:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to process Aarohi chat',
      reply: 'నమస్కారం! సర్వర్‌లో చిన్న సమస్య వచ్చింది. దయచేసి కాసేపటి తర్వాత మళ్ళీ ప్రయత్నించండి.'
    });
  }
};

