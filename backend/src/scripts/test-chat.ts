import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function testChat() {
  const apiKey = process.env.GEMINI_API_KEY!;
  const ai = new GoogleGenAI({ apiKey });

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        { role: 'user', parts: [{ text: 'Hello, who are you?' }] }
      ],
      config: {
        systemInstruction: {
          parts: [{ text: 'You are AI Aarohi Bot, a female robot doctor assistant for Aarogya Drishti in ITDA Paderu. Reply in Telugu.' }]
        }
      }
    });

    console.log('SUCCESS! Reply:');
    console.log(res.text);
  } catch (err: any) {
    console.error('Error with config.systemInstruction:', err.message);

    // Test with combined prompt fallback
    try {
      console.log('Testing combined prompt...');
      const res2 = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'System: You are AI Aarohi Bot in ITDA Paderu. Reply in Telugu.\nUser: Hello, who are you?'
      });
      console.log('Combined prompt SUCCESS! Reply:');
      console.log(res2.text);
    } catch (e2: any) {
      console.error('Combined prompt error:', e2.message);
    }
  }
}

testChat();

