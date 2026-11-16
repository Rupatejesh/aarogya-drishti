import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const candidates = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.5-pro',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite'
];

async function main() {
  const apiKey = process.env.GEMINI_API_KEY!;
  const ai = new GoogleGenAI({ apiKey });

  for (const model of candidates) {
    try {
      process.stdout.write(`Testing ${model}... `);
      const res = await ai.models.generateContent({
        model,
        contents: 'Say OK'
      });
      console.log(`SUCCESS! Response: ${res.text?.trim().slice(0, 50)}`);
      break;
    } catch (e: any) {
      console.log(`FAILED: ${e.message?.slice(0, 100)}`);
    }
  }
}

main();

