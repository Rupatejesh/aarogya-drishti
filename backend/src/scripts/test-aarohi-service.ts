import { aarohiService } from '../services/aarohi.service.js';

async function testAarohiService() {
  console.log('Testing aarohiService in Telugu...');
  const resTe = await aarohiService.chat({
    message: 'నమస్కారం, నోటి క్యాన్సర్ లక్షణాలు ఏమిటి?',
    language: 'te'
  });
  console.log('--- Telugu Response ---');
  console.log('Model:', resTe.modelUsed, '| Fallback:', resTe.isAiFallback);
  console.log(resTe.reply);

  console.log('\nTesting aarohiService in English...');
  const resEn = await aarohiService.chat({
    message: 'What is Adda Poga and why is it dangerous?',
    language: 'en'
  });
  console.log('--- English Response ---');
  console.log('Model:', resEn.modelUsed, '| Fallback:', resEn.isAiFallback);
  console.log(resEn.reply);
}

testAarohiService();

