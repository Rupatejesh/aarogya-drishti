import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  console.log(`Checking Gemini API... Key Present: ${Boolean(apiKey)}, Length: ${apiKey ? apiKey.length : 0}, Model: ${model}`);

  if (!apiKey) {
    console.error('No GEMINI_API_KEY found in .env');
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    console.log('Sending test prompt to Gemini...');
    const response = await ai.models.generateContent({
      model: model,
      contents: 'You are Aarohi AI for Aarogya Drishti oral cancer screening in ITDA Paderu. Reply in Telugu and English: Say you are online and ready to assist tribal citizens with oral cancer triage.'
    });

    console.log('--- GEMINI RESPONSE RECEIVED ---');
    console.log(response.text);
    console.log('--- TEST PASSED ---');
  } catch (error: any) {
    console.error('--- GEMINI ERROR ---', error.message || error);
  }
}

main();

