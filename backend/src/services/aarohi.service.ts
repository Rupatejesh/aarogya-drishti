import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });

export interface ChatMessage {
  role: 'user' | 'assistant' | 'model';
  content?: string;
  text?: string;
}

export interface AarohiChatRequest {
  message: string;
  language?: 'te' | 'hi' | 'en';
  history?: ChatMessage[];
  role?: string;
}

export interface AarohiChatResponse {
  success: boolean;
  reply: string;
  language: 'te' | 'hi' | 'en';
  modelUsed: string;
  isAiFallback: boolean;
}

class AarohiAiService {
  private primaryModel: string;
  private candidateModels: string[];

  constructor() {
    this.primaryModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    this.candidateModels = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  }

  private getApiKey(): string | undefined {
    return process.env.GEMINI_API_KEY;
  }

  public async chat(request: AarohiChatRequest): Promise<AarohiChatResponse> {
    const { message, language = 'te', history = [], role = 'citizen' } = request;
    const apiKey = this.getApiKey();

    const targetLang = language === 'hi' ? 'Hindi' : language === 'en' ? 'English' : 'Telugu';
    const langCode = language === 'hi' ? 'hi' : language === 'en' ? 'en' : 'te';

    console.log(`[AarohiService] Chat request: "${message.slice(0, 60)}" | Lang: ${langCode} (${targetLang}) | History: ${history.length}`);

    if (apiKey && apiKey.length > 10) {
      // Try Gemini API with retry for transient 503 spikes
      for (const model of this.candidateModels) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const reply = await this.callGemini(model, message, langCode, targetLang, history, role);
            if (reply && reply.trim().length > 0) {
              console.log(`[AarohiService] Gemini (${model}) response generated (${reply.length} chars)`);
              return {
                success: true,
                reply: reply.trim(),
                language: langCode,
                modelUsed: model,
                isAiFallback: false
              };
            }
          } catch (err: any) {
            console.warn(`[AarohiService] Model ${model} attempt ${attempt} notice: ${err?.message || err}`);
            if (attempt === 1 && (err?.message?.includes('503') || err?.message?.includes('429'))) {
              await new Promise(r => setTimeout(r, 600));
              continue;
            }
            break;
          }
        }
      }
    }

    // Graceful Fallback Knowledge Engine (guarantees instantaneous, compassionate clinical reply)
    console.log(`[AarohiService] Using clinical fallback response engine for "${message.slice(0, 40)}"`);
    const fallbackReply = this.generateFallbackResponse(message, langCode);
    return {
      success: true,
      reply: fallbackReply,
      language: langCode,
      modelUsed: 'Aarohi-Clinical-Expert-v2.6',
      isAiFallback: true
    };
  }

  private async callGemini(
    model: string,
    message: string,
    langCode: 'te' | 'hi' | 'en',
    targetLang: string,
    history: ChatMessage[],
    role: string
  ): Promise<string | null> {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });

    // Format previous turns for context
    const recentHistory = history.slice(-6).map((h) => {
      const sender = h.role === 'user' ? 'User' : 'Dr. Aarohi';
      const text = h.text || h.content || '';
      return `${sender}: ${text}`;
    }).join('\n');

    const systemPrompt = `You are Dr. Aarohi (AI Aarohi Bot / ఏఐ ఆరోహి బోట్ / एआई आरोही बॉट), the empathetic, knowledgeable female robot doctor assistant for "Aarogya Drishti" (ఆరోగ్య దృష్టి / आरोग्य दृष्टि) — the Autonomous AI Oral Cancer Detection & Tele-Oncology Platform engineered for the Integrated Tribal Development Agency (ITDA) Paderu in Alluri Sitharama Raju (ASR) District, Andhra Pradesh.

YOUR ROLE & MISSION:
- Provide clear, culturally warm, medically sound guidance to tribal citizens, patients, ASHA workers, and doctors.
- Answer ANY free-form question the user asks clearly, accurately, and empathetically:
  1. Understand intent regardless of phrasing: The user may ask casual, colloquial, misspelled, or transliterated questions (e.g. "naku notlo manta undi em cheyali", "thooti lo pain", "gale me jalan", "chutta tagadam maneyyala", "can oral cancer be cured", "how to book appointment", "who are you").
  2. Oral cancer & precancerous lesions: Oral Leukoplakia (తెల్లటి మచ్చ), Erythroplakia (ఎర్రటి మచ్చ), Oral Submucous Fibrosis / OSMF (నోరు తెరవలేకపోవడం, మంట), chronic non-healing ulcers (>2 weeks), gum induration.
  3. Tribal risk habits: "Adda Poga" (అడ్డాపొగ - reverse smoking of cigars with the burning end held inside the mouth, generating >58°C heat and raising palatal cancer risk 14-fold), chewable khaini, tobacco, and gutkha.
  4. Warning signs: non-healing mouth ulcers, burning with spicy food, restricted mouth opening (less than 3 fingers), persistent white/red patches, difficulty swallowing, or neck lumps.
  5. Platform guidance: how to use the intra-oral camera to upload/scan lesion photos, understanding the 3D p53 and Ki-67 biomarker helix, Golden Health Card (UIDN), booking tele-consultation or 4mm punch biopsy appointments at PHC G. Madugula, Area Hospital Chintapalli, or Area Hospital Paderu, and WebRTC video calls with specialist doctors (e.g. Dr. Swapna Devi, Dr. Anil Kumar).
  6. General user questions: If the user asks general questions (greetings, lifestyle tips, who you are, what to eat, health queries), answer kindly, clearly, and helpfully.

LANGUAGE REQUIREMENT (STRICT):
- The user is conversing in: ${targetLang} (code: ${langCode}).
- You MUST answer COMPLETELY in ${targetLang}.
- If Telugu ('te'): Write entirely in natural, respectful, compassionate Telugu using Telugu script (తెలుగు లిపి). Even if the user asked in transliterated English-Telugu ("naku notlo manta ga undi"), reply in Telugu script!
- If Hindi ('hi'): Write entirely in natural, respectful Hindi using Devanagari script (हिन्दी).
- If English ('en'): Write in clear, empathetic clinical English.

STYLE:
- 2 to 4 concise, easy-to-read paragraphs.
- Keep the tone polite, supportive, and empowering.
- If discussing potential cancer symptoms, warmly encourage booking a free tele-consultation or visiting the nearest PHC for an in-person doctor evaluation and 4mm punch biopsy.`;

    const fullPrompt = `${systemPrompt}

${recentHistory ? `PREVIOUS CONVERSATION CONTEXT:\n${recentHistory}\n` : ''}
User Query: "${message}"

Dr. Aarohi (${targetLang} Response):`;

    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt
    });

    return response.text || null;
  }

  private generateFallbackResponse(query: string, lang: 'te' | 'hi' | 'en'): string {
    const q = query.toLowerCase();

    // 1. Leukoplakia / White patch
    if (q.includes('leuko') || q.includes('white') || q.includes('patch') || q.includes('మచ్చ') || q.includes('తెల్ల') || q.includes('ల్యూకో') || q.includes('धब्बा') || q.includes('सफेद')) {
      if (lang === 'te') {
        return `నమస్కారం! నేను ఏఐ ఆరోహి బోట్‌ని. 

ల్యూకోప్లాకియా (Oral Leukoplakia) అనేది నోటి లోపలి బుగ్గలు, నాలుక లేదా అంగిలిపై వచ్చే తెల్లటి మచ్చ. ఇది సాధారణంగా గీకినా లేదా తుడిచినా పోదు. ఇది 2 నుండి 3 వారాలకు మించి తగ్గకపోతే, వెంటనే వైద్యులచే పరీక్షించబడాలి.

మా ఆరోగ్య దృష్టి ప్లాట్‌ఫారమ్‌లో మీ నోటి ఫోటోను కెమెరా ద్వారా స్కాన్ చేయవచ్చు. జీ.మాడుగుల పీహెచ్‌సీ లేదా పాడేరు ఏరియా ఆసుపత్రిలోని క్యాన్సర్ నిపుణులతో లైవ్ వీడియో కాల్‌లో మాట్లాడటానికి అపాయింట్‌మెంట్ బుక్ చేసుకోండి. అవసరమైతే 4 మి.మీ డయాగ్నస్టిక్ పంచ్ బయాప్సీ చేయించుకోవడం మంచిది.`;
      }
      if (lang === 'hi') {
        return `नमस्ते! मैं एआई आरोही बॉट हूँ। 

ल्यूकोप्लाकिया (Oral Leukoplakia) मुंह के अंदर, जीभ या गालों पर बनने वाला सफेद धब्बा है जो खुरचने पर भी नहीं हटता। यदि यह 2-3 हफ्तों से अधिक समय तक बना रहे, तो यह कैंसर-पूर्व लक्षण हो सकता है।

आरोग्य दृष्टि पर आप अपने मुंह की तस्वीर अपलोड करके जांच करवा सकते हैं। कृपया नजदीकी प्राथमिक स्वास्थ्य केंद्र या पाडेरू एरिया अस्पताल के डॉक्टरों से टेली-परामर्श लें और आवश्यक होने पर 4 मिमी पंच बायोप्सी करवाएं।`;
      }
      return `Hello! I am AI Aarohi Bot. 

Oral Leukoplakia is a persistent, non-scrapable white patch in the oral cavity. If it persists for more than 2-3 weeks, it is considered a potentially malignant oral lesion that requires clinical assessment.

You can upload a photo of the affected area using our AI Oral Camera. I strongly recommend booking a tele-consultation with our specialist oncologists at PHC G. Madugula or Area Hospital Paderu for a confirmatory 4mm punch biopsy.`;
    }

    // 2. Adda Poga / Reverse Smoking / Tobacco
    if (q.includes('adda') || q.includes('poga') || q.includes('smoke') || q.includes('tobacco') || q.includes('చుట్ట') || q.includes('పొగ') || q.includes('ఖైనీ') || q.includes('धूम्रपान') || q.includes('तंबाकू')) {
      if (lang === 'te') {
        return `నమస్కారం! అడ్డాపొగ (రివర్స్ స్మోకింగ్) అనేది అల్లూరి సీతారామరాజు జిల్లా గిరిజన ప్రాంతాల్లో చుట్ట కాలుతున్న నిప్పు కొసను నోటి లోపలికి పెట్టుకుని తాగే ప్రమాదకర అలవాటు.

దీనివల్ల నోటి లోపల 58°C కంటే ఎక్కువ ఉష్ణోగ్రత మరియు హానికరమైన పొగ చేరి, అంగిలి (Palate) కణజాలం తీవ్రంగా దెబ్బతింటుంది. సాధారణ వ్యక్తుల కంటే అడ్డాపొగ తాగే వారికి అంగిలి క్యాన్సర్ వచ్చే ప్రమాదం 14 రెట్లు ఎక్కువ!

మీ ఆరోగ్యం కోసం ఈ అలవాటును వెంటనే మానుకోవాలని కోరుతున్నాను. మా వెబ్‌సైట్‌లోని 'హ్యాబిట్ ట్రాకర్' ద్వారా పొగాకు రహిత రోజులను నమోదు చేసుకోండి మరియు వైద్యుల కౌన్సెలింగ్ పొందండి.`;
      }
      if (lang === 'hi') {
        return `नमस्ते! 'अड्डा पोगा' (उलटा धूम्रपान) अल्लूरी सीताराम राजू जिले में प्रचलित एक प्रथा है जिसमें जलती हुई चट्टा को मुंह के भीतर रखकर पिया जाता है।

इससे मुंह के भीतर 58 डिग्री सेल्सियस से अधिक गर्मी और विषाक्त रसायन पहुंचते हैं, जिससे तालु का कैंसर होने का खतरा 14 गुना बढ़ जाता है।

अपने स्वास्थ्य की सुरक्षा के लिए इस आदत को तुरंत छोड़ें। आरोग्य दृष्टि के हैबिट ट्रैकर का उपयोग करके तंबाकू मुक्ति की यात्रा शुरू करें और हमारे डॉक्टरों से परामर्श लें।`;
      }
      return `Hello! Adda Poga (Reverse Smoking) is an indigenous custom where homemade cigars are smoked with the glowing ember held inside the oral cavity.

This subjects the palatal mucosa to thermal burns exceeding 58°C and concentrated carcinogens, elevating the risk of palatal oral cancer by 14-fold compared to non-smokers.

We strongly encourage smoking cessation. Please track your tobacco-free days with our Habit Cessation Tracker and connect with our medical officers for counseling.`;
    }

    // 3. Symptoms / Ulcers / Burning / Transliterated
    if (
      q.includes('symptom') ||
      q.includes('ulcer') ||
      q.includes('pain') ||
      q.includes('burn') ||
      q.includes('పుండు') ||
      q.includes('మంట') ||
      q.includes('లక్షణాలు') ||
      q.includes('छाला') ||
      q.includes('लक्षण') ||
      q.includes('manta') ||
      q.includes('punndu') ||
      q.includes('gadda') ||
      q.includes('swelling') ||
      q.includes('gale') ||
      q.includes('jalan')
    ) {
      if (lang === 'te') {
        return `నమస్కారం! నోటి క్యాన్సర్ లేదా ముందస్తు వ్యాధుల ప్రధాన లక్షణాలు ఇవి:

1. రెండు వారాలకు మించి మానని నోటి పుండ్లు లేదా అల్సర్లు.
2. కారం లేదా మసాలా ఆహారం తిన్నప్పుడు నోట్లో తీవ్రమైన మంట (నోటి లోపల లైనింగ్ దెబ్బతినడం).
3. నోరు పూర్తిగా తెరవలేకపోవడం (3 వేళ్ళు పట్టకపోవడం - OSMF లక్షణం).
4. బుగ్గలు లేదా నాలుకపై ఎర్రటి లేదా తెల్లటి మచ్చలు.
5. మెడలో గడ్డలు లేదా ఆహారం మింగడంలో ఇబ్బంది.

ఈ లక్షణాలు ఏవైనా ఉంటే ఏమాత్రం నిర్లక్ష్యం చేయవద్దు. వెంటనే మా 'లైవ్ ఏఐ స్క్రీనింగ్' ద్వారా ఫోటో తీసి పరిశీలించండి మరియు నిపుణులైన వైద్యులను సంప్రదించండి.`;
      }
      if (lang === 'hi') {
        return `नमस्ते! मुख कैंसर एवं कैंसर-पूर्व अवस्थाओं के मुख्य लक्षण निम्नलिखित हैं:

1. दो सप्ताह से अधिक समय तक न भरने वाले मुंह के छाले।
2. मसालेदार या तीखा भोजन खाने पर मुंह में तेज जलन।
3. मुंह पूरी तरह न खुल पाना (तीन उंगलियां न जाना - OSMF का संकेत)।
4. गालों, जीभ या मसूड़ों पर लाल या सफेद धब्बे।
5. गर्दन में गांठ या निगलने में कठिनाई।

यदि इनमें से कोई भी लक्षण हो, तो तुरंत आरोग्य दृष्टि पर अपनी जांच करवाएं और हमारे विशेषज्ञ डॉक्टरों से परामर्श लें।`;
      }
      return `Hello! The primary warning signs of oral precancerous and cancerous conditions include:

1. Non-healing oral ulcers or sores lasting more than 2 weeks.
2. Severe burning sensation when consuming spicy food.
3. Restricted mouth opening (inability to insert 3 fingers vertically — hallmark of OSMF).
4. Persistent red (Erythroplakia) or white (Leukoplakia) patches.
5. Difficulty swallowing or painless swelling in the neck.

If you or a family member experience any of these signs, please use our Live AI Camera for immediate screening and schedule a tele-consultation with our oncologists.`;
    }

    // 4. Biopsy / 4mm Punch / Pain
    if (q.includes('biopsy') || q.includes('punch') || q.includes('బయాప్సీ') || q.includes('बायोप्सी')) {
      if (lang === 'te') {
        return `నమస్కారం! 4మి.మీ డయాగ్నస్టిక్ పంచ్ బయాప్సీ అనేది సురక్షితమైన, నొప్పి లేని 5 నిమిషాల చిన్న ప్రక్రియ. స్థానిక మత్తుమందు (లోకల్ అనెస్తీషియా) ఇవ్వడం వల్ల ఎలాంటి నొప్పి తెలియదు. వ్యాధి ప్రాథమిక దశలోనే ఉందో లేదో నిర్ధారించడానికి మరియు సరైన మందులు ఇవ్వడానికి ఈ పరీక్ష చాలా ముఖ్యం. ఏరియా ఆసుపత్రి పాడేరు మరియు సీహెచ్‌సీల్లో ఇది ఉచితంగా అందుబాటులో ఉంది.`;
      }
      if (lang === 'hi') {
        return `नमस्ते! 4 मिमी पंच बायोप्सी एक पूरी तरह सुरक्षित और दर्द रहित 5 मिनट की प्रक्रिया है। हल्का सुन्न करके ऊतक की जांच की जाती है जिससे बीमारी की शुरुआती अवस्था का सही पता लगाकर 100% इलाज सुनिश्चित किया जा सके।`;
      }
      return `Hello! A 4mm diagnostic punch biopsy is a painless, safe 5-minute procedure performed under local anesthesia. It confirms whether an oral lesion is benign, precancerous, or dysplastic, enabling early and complete cure. It is available free of charge across ITDA Paderu health facilities.`;
    }

    // 5. Booking / Doctor / Telemedicine
    if (
      q.includes('book') ||
      q.includes('appoint') ||
      q.includes('doctor') ||
      q.includes('daktar') ||
      q.includes('video') ||
      q.includes('అపాయింట్') ||
      q.includes('డాక్టర్') ||
      q.includes('अपॉइंटमेंट') ||
      q.includes('डॉक्टर')
    ) {
      if (lang === 'te') {
        return `నమస్కారం! మా ప్లాట్‌ఫారమ్‌లో మీరు డాక్టర్ అపాయింట్‌మెంట్ చాలా సులభంగా బుక్ చేసుకోవచ్చు. మీ డ్యాష్‌బోర్డ్‌లోని "బుక్ డాక్టర్ / బయాప్సీ" బటన్ నొక్కండి, మీ సమీప మండలం (పాడేరు, అరకు, చింతపల్లి మొదలైనవి) మరియు అందుబాటులో ఉన్న సమయాన్ని ఎంచుకోండి. అలాగే ఆంకాలజిస్ట్ డాక్టర్ స్వప్నా దేవి గారితో వెబ్‌ఆర్‌టిసి ద్వారా నేరుగా లైవ్ వీడియో కాల్‌లో మాట్లాడవచ్చు.`;
      }
      if (lang === 'hi') {
        return `नमस्ते! आप हमारे डैशबोर्ड से "बुक डॉक्टर" पर क्लिक करके सामान्य जांच या बायोप्सी हेतु नजदीकी स्वास्थ्य केंद्र और समय चुन सकते हैं। साथ ही विशेषज्ञ डॉक्टरों से लाइव वीडियो कॉल पर सीधे परामर्श प्राप्त कर सकते हैं।`;
      }
      return `Hello! You can easily book an appointment by clicking "Book Doctor / Biopsy" on your dashboard. Select your nearest Mandal health facility and preferred time slot. You can also launch an encrypted 1-click WebRTC live video consultation with specialist oncologists.`;
    }

    // 6. Default warm response
    if (lang === 'te') {
      return `నమస్కారం! నేను ఏఐ ఆరోహి బోట్‌ని (AI Aarohi Bot) — ఐటీడీఏ పాడేరు ఆరోగ్య దృష్టి వ్యవస్థ యొక్క డిజిటల్ వైద్య సహాయకురాలిని.

అల్లూరి సీతారామరాజు జిల్లాలోని గిరిజన ప్రజలకు నోటి క్యాన్సర్ ముందస్తు నిర్ధారణ, అడ్డాపొగ మరియు ఖైనీ అలవాట్ల నివారణ, మరియు ఆసుపత్రుల వివరాలు అందించడంలో నేను మీకు సహాయపడతాను.

మీరు మీ నోటి భాగం ఫోటో తీసి ఏఐ స్క్రీనింగ్ చేయవచ్చు, గోల్డెన్ హెల్త్ కార్డు పొందవచ్చు లేదా డాక్టర్ స్వప్నా దేవి గారి వద్ద లైవ్ వీడియో కాల్ అపాయింట్‌మెంట్ బుక్ చేసుకోవచ్చు. మీకు ఇంకా ఎలాంటి సమాచారం కావాలి?`;
    }
    if (lang === 'hi') {
      return `नमस्ते! मैं एआई आरोही बॉट हूँ (AI Aarohi Bot) — आईटीडीए पाडेरू आरोग्य दृष्टि प्रणाली की डिजिटल डॉक्टर सहायक।

अल्लूरी सीताराम राजू जिले के जनजातीय नागरिकों के लिए मुख कैंसर की प्रारंभिक पहचान, तंबाकू और उलटा धूम्रपान मुक्ति, तथा अस्पतालों की जानकारी देने के लिए मैं यहाँ हूँ।

आप अपने मुंह की तस्वीर स्कैन कर सकते हैं, गोल्डन हेल्थ कार्ड डाउनलोड कर सकते हैं या विशेषज्ञ डॉक्टरों के साथ वीडियो कॉल परामर्श बुक कर सकते हैं। मैं आपकी किस प्रकार सहायता कर सकती हूँ?`;
    }
    return `Hello! I am AI Aarohi Bot, your empathetic AI doctor assistant for Aarogya Drishti in ITDA Paderu, Alluri Sitharama Raju District.

I am here to assist you with early oral cancer screening, tobacco and reverse smoking cessation guidance, and connecting you to nearby Primary Health Centres and Area Hospital Paderu.

You can capture an intra-oral image for AI triage, download your Golden Health Card, or book a live WebRTC tele-consultation with our specialist oncologists. How can I assist you today?`;
  }
}

export const aarohiService = new AarohiAiService();
export default aarohiService;

