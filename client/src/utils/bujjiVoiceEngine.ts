export type BujjiLanguage = 'TE' | 'EN' | 'HI' | 'te' | 'en' | 'hi'

export interface QuickSpeechTopic {
  id: string
  labelTe: string
  subLabelEn: string
  icon: string
  speechTextTe: string
  speechTextEn: string
  speechTextHi: string
}

/**
 * Natural Conversational Greetings across Telugu, English, and Hindi.
 */
export const BUJJI_NATURAL_GREETINGS = {
  EN: 'Hey, hi! How can I help you today? I can guide you through oral screening, symptom checking, or booking a specialist.',
  TE: 'హే, హలో! నేను మీకు ఈరోజు ఎలా సహాయపడగలను? నోటి పరీక్ష, లక్షణాల తనిఖీ లేదా స్పెషలిస్ట్ అపాయింట్మెంట్ తీసుకోవడంలో నేను మీకు మార్గదర్శనం చేస్తాను.',
  HI: 'अरे, नमस्ते! मैं आज आपकी क्या मदद कर सकती हूँ? मौखिक जांच, लक्षणों की पहचान या डॉक्टर से मिलने में मैं आपका मार्गदर्शन कर सकती हूँ।',
}

export function getNaturalGreeting(lang: BujjiLanguage = 'TE'): string {
  const norm = lang.toUpperCase() as 'TE' | 'EN' | 'HI'
  return BUJJI_NATURAL_GREETINGS[norm] || BUJJI_NATURAL_GREETINGS.TE
}

export function isGreetingIntent(raw: string): boolean {
  if (!raw) return false
  const lower = raw.trim().toLowerCase()
  const greetingWords = [
    'hi',
    'hello',
    'hey',
    'namaste',
    'namaskaram',
    'హాయ్',
    'హలో',
    'నమస్తే',
    'నమస్కారం',
    'బుజ్జి',
    'नमस्ते',
    'हाय',
    'हेलो',
    'good morning',
    'good afternoon',
    'good evening',
  ]
  return greetingWords.some((w) => lower === w || lower.startsWith(`${w} `) || lower.endsWith(` ${w}`))
}

/**
 * Strips markdown syntax (**bold**, # headers, bullet symbols, backticks, links)
 * and technical characters so speech synthesis engines articulate pure clinical words.
 */
export function cleanTextForSpeech(raw: string): string {
  if (!raw) return ''
  return raw
    .replace(/[*#_~`>]/g, '')
    .replace(/^[\s•\-+*]+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/http\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Symptom Evaluator & Awareness Engine
 */
export interface SymptomEvaluationResult {
  category: 'ULCER' | 'BURNING' | 'PATCH' | 'STIFFNESS' | 'TOOTHACHE' | 'HABIT' | 'GENERAL'
  severity: 'MILD' | 'MODERATE' | 'URGENT'
  replyText: string
  actionRecommendation: 'AI_SCREENING' | 'SPECIALIST_BOOKING' | 'EMERGENCY_VISIT'
}

export function evaluateOralSymptom(query: string, lang: BujjiLanguage = 'TE'): SymptomEvaluationResult {
  const q = query.toLowerCase()
  const norm = lang.toUpperCase() as 'TE' | 'EN' | 'HI'

  // 1. Persistent Ulcer > 14 days
  if (
    q.includes('పుండు') ||
    q.includes('ulcer') ||
    q.includes('छाले') ||
    q.includes('14') ||
    q.includes('రెండు వారాలు') ||
    q.includes('not healing')
  ) {
    const replyText =
      norm === 'TE'
        ? 'నోటిలో 14 రోజుల కంటే ఎక్కువ కాలం ఉండే పుండును ఏమాత్రం నిర్లక్ష్యం చేయరాదు. ముఖ్యంగా గుట్కా, పొగాకు అలవాటు ఉన్నవారిలో ఇది క్యాన్సర్ పూర్వ లక్షణం కావచ్చు. దయచేసి వెంటనే ఏఐ ఓరల్ ఫోటో స్క్రీనింగ్ నిర్వహించి లేదా పాడేరు డిస్ట్రిక్ట్ హాస్పిటల్ ఓరల్ ఆంకాలజిస్ట్‌తో వీడియో కాల్ మాట్లాడండి!'
        : norm === 'HI'
        ? 'मुंह में 14 दिनों से अधिक रहने वाले छाले को बिल्कुल अनदेखा न करें। यह तंबाकू और गुटखा खाने वालों में कैंसर पूर्व लक्षण हो सकता है। कृपया तुरंत एआई फोटो जांच कराएं या विशेषज्ञ से परामर्श लें!'
        : 'An oral ulcer persisting for over 14 days must never be neglected. In individuals with tobacco or gutkha habits, this may represent pre-cancerous dysplasia. Please perform an AI photo screening immediately or consult Dr. V. Anitha Rao!'

    return {
      category: 'ULCER',
      severity: 'URGENT',
      replyText,
      actionRecommendation: 'SPECIALIST_BOOKING',
    }
  }

  // 2. Burning Sensation with spicy food
  if (
    q.includes('మంట') ||
    q.includes('కారం') ||
    q.includes('burning') ||
    q.includes('spicy') ||
    q.includes('जलन') ||
    q.includes('मिर्च')
  ) {
    const replyText =
      norm === 'TE'
        ? 'కారం లేదా వేడి ఆహారం తిన్నప్పుడు నోరు మంటగా ఉండటం ఓరల్ సబ్‌మ్యూకస్ ఫైబ్రోసిస్ (OSMF) యొక్క ముఖ్య లక్షణం. సుపారీ, గుట్కా నమలడం వల్ల నోటి లోపలి చర్మం బిగుతుగా మారుతుంది. వెంటనే పొగాకు, గుట్కా మానేసి ఓరల్ మెడిసిన్ స్పెషలిస్ట్‌తో సంప్రదింపు బుక్ చేసుకోండి!'
        : norm === 'HI'
        ? 'तीखा या गर्म खाने पर मुंह में जलन होना ओरल सबम्यूकस फाइब्रोसिस (OSMF) का मुख्य लक्षण है। गुटखा और सुपारी चबाने से मुंह की अंदरूनी त्वचा सख्त हो जाती है। तुरंत विशेषज्ञ परामर्श लें!'
        : 'A burning sensation while eating spicy or hot food is a hallmark indicator of Oral Submucous Fibrosis (OSMF) caused by areca nut and gutkha chewing. Please stop gutkha immediately and book a specialist consultation!'

    return {
      category: 'BURNING',
      severity: 'MODERATE',
      replyText,
      actionRecommendation: 'SPECIALIST_BOOKING',
    }
  }

  // 3. White or Red Patch (Leukoplakia / Erythroplakia)
  if (
    q.includes('తెల్ల') ||
    q.includes('ఎర్ర') ||
    q.includes('మచ్చ') ||
    q.includes('white') ||
    q.includes('red') ||
    q.includes('patch') ||
    q.includes('leukoplakia') ||
    q.includes('erythroplakia') ||
    q.includes('धब्बा')
  ) {
    const replyText =
      norm === 'TE'
        ? 'నోటి లోపల చెంప లేదా నాలుకపై తెల్లటి లేదా ఎర్రటి మచ్చలు రాపిడి చేసినా పోకపోతే అది ల్యూకోప్లాకియా లేదా ఎరిత్రోప్లాకియా కావచ్చు. ముందస్తు దశలోనే గుర్తిస్తే 100 శాతం నయం చేయవచ్చు. వెంటనే మన యాప్‌లోని కెమెరాతో ఫోటో తీసి జెమినీ ఏఐ విశ్లేషణ పొందండి!'
        : norm === 'HI'
        ? 'मुंह के अंदर गाल या जीभ पर सफेद या लाल धब्बे ल्यूकोप्लाकिया हो सकते हैं। शुरुआती पहचान से शत-प्रतिशत इलाज संभव है। अभी कैमरे से फोटो लेकर जेमिनी एआई जांच कराएं!'
        : 'Non-scrapable white or fiery red patches on the buccal mucosa or tongue require urgent evaluation for Leukoplakia or Erythroplakia. Early detection guarantees 100% cure. Capture an oral photo now for instant Gemini AI triage!'

    return {
      category: 'PATCH',
      severity: 'MODERATE',
      replyText,
      actionRecommendation: 'AI_SCREENING',
    }
  }

  // 4. Restricted Jaw Opening / Stiffness (OSMF)
  if (
    q.includes('నోరు తెరవడం') ||
    q.includes('దగ్గరగా') ||
    q.includes('stiff') ||
    q.includes('mouth opening') ||
    q.includes('jaw') ||
    q.includes('मुंह खोलने')
  ) {
    const replyText =
      norm === 'TE'
        ? 'నోరు పూర్తిగా తెరవలేకపోవడం (మూడు వేళ్ళు పట్టకపోవడం) ఓరల్ సబ్‌మ్యూకస్ ఫైబ్రోసిస్ తీవ్రతను సూచిస్తుంది. గుట్కా నమలడం దీనికి ప్రధాన కారణం. మా వద్ద అందుబాటులో ఉన్న ట్రయామ్సినోలోన్ ఆయింట్‌మెంట్ మరియు లైకోపీన్ క్యాప్సూల్స్ చికిత్స కోసం స్థానిక పీహెచ్‌సీ లేదా టెలిమెడిసిన్ ద్వారా సంప్రదించండి.'
        : norm === 'HI'
        ? 'मुंह पूरा न खुल पाना (तीन उंगलियां न जाना) ओएसएमएफ की गंभीरता दर्शाता है। इसका मुख्य कारण गुटखा है। उचित दवा और जांच के लिए स्थानीय पीएचसी या टेलीमेडिसिन पर संपर्क करें।'
        : 'Inability to open the mouth fully (fewer than 3 fingers width) indicates advancing Oral Submucous Fibrosis due to areca nut habits. Consult our visiting specialist Dr. V. Anitha Rao for early medical management.'

    return {
      category: 'STIFFNESS',
      severity: 'MODERATE',
      replyText,
      actionRecommendation: 'SPECIALIST_BOOKING',
    }
  }

  // 5. Toothache or Bleeding Gums
  if (
    q.includes('దంతాలు') ||
    q.includes('పంటి నొప్పి') ||
    q.includes('tooth') ||
    q.includes('teeth') ||
    q.includes('gum') ||
    q.includes('bleeding') ||
    q.includes('दांत')
  ) {
    const replyText =
      norm === 'TE'
        ? 'పంటి నొప్పి మరియు చిగుళ్ళ నుండి రక్తం కారడం దంత క్షయం లేదా చిగుళ్ళ వ్యాధి లక్షణం. స్థానిక పీహెచ్‌సీ వద్ద డెంటల్ సర్జన్‌ను కలవడానికి అపాయింట్మెంట్ బుక్ చేసుకోండి.'
        : norm === 'HI'
        ? 'दांत दर्द या मसूड़ों से खून आना पायरिया या कैविटी का संकेत है। अपने नजदीकी पीएचसी में डेंटल डॉक्टर से मिलने का अपॉइंटमेंट लें।'
        : 'Toothache and bleeding gums indicate dental caries or periodontal infection. Please book an in-person dental consultation at your nearest Primary Health Centre.'

    return {
      category: 'TOOTHACHE',
      severity: 'MILD',
      replyText,
      actionRecommendation: 'SPECIALIST_BOOKING',
    }
  }

  // 6. Tobacco / Gutkha / Pan Cessation
  if (
    q.includes('పొగాకు') ||
    q.includes('గుట్కా') ||
    q.includes('ఖైనీ') ||
    q.includes('tobacco') ||
    q.includes('gutkha') ||
    q.includes('तंबाकू') ||
    q.includes('गुटखा')
  ) {
    const replyText =
      norm === 'TE'
        ? 'పొగాకు, గుట్కా మరియు పుల్లచుట్ట మానుకోవడం మీ నోటి ఆరోగ్యానికి అతిముఖ్యమైన అడుగు. అలవాటు మానేసిన కొద్ది రోజుల్లోనే నోటి లోపలి కణాలు స్వస్థత పొందడం ప్రారంభిస్తాయి. స్థానిక ఆశా వర్కర్ సహాయంతో నికోటిన్ రీప్లేస్‌మెంట్ సలహాలు పొందండి.'
        : norm === 'HI'
        ? 'तंबाकू और गुटखा छोड़ना ओरल कैंसर से बचने का सबसे प्रभावी उपाय है। आशा दीदी की मदद से नशा मुक्ति परामर्श लें।'
        : 'Quitting all forms of smokeless tobacco, gutkha, and reverse chutta is the single most vital intervention for oral cancer prevention. Contact your local ASHA lead for tobacco cessation counseling.'

    return {
      category: 'HABIT',
      severity: 'MILD',
      replyText,
      actionRecommendation: 'AI_SCREENING',
    }
  }

  // General Guidance Fallback
  const replyText =
    norm === 'TE'
      ? 'నమస్కారం! మీ నోటి ఆరోగ్యం గురించి ఏవైనా సందేహాలు ఉంటే అడగండి. పుండ్లు, మంట, తెల్ల లేదా ఎర్ర మచ్చలు ఉంటే వెంటనే పరీక్షించుకోవడం శ్రేయస్కరం. ముందస్తు గుర్తింపుతో నోటి క్యాన్సర్‌ను 100 శాతం నయం చేయవచ్చు!'
      : norm === 'HI'
      ? 'नमस्ते! ओरल हेल्थ के बारे में कोई भी सवाल पूछें। छाले, जलन या धब्बे होने पर तुरंत जांच कराएं। समय पर पहचान से शत-प्रतिशत इलाज संभव है!'
      : 'Hello! I am Bujji AI, your oral health companion. If you have ulcers, burning sensation, or mucosal patches, please screen early. Early detection cures oral cancer 100%!'

  return {
    category: 'GENERAL',
    severity: 'MILD',
    replyText,
    actionRecommendation: 'AI_SCREENING',
  }
}

export const BUJJI_QUICK_SPEECH_TOPICS: QuickSpeechTopic[] = [
  {
    id: 'greeting_warm',
    labelTe: 'బుజ్జి పలకరింపు & స్వాగతం (Hey, Hi!)',
    subLabelEn: 'Conversational Greeting & Clinical Welcome',
    icon: '👋',
    speechTextTe: BUJJI_NATURAL_GREETINGS.TE,
    speechTextEn: BUJJI_NATURAL_GREETINGS.EN,
    speechTextHi: BUJJI_NATURAL_GREETINGS.HI,
  },
  {
    id: 'early_signs',
    labelTe: 'నోటి క్యాన్సర్ ప్రాథమిక లక్షణాలు (>14 రోజులు)',
    subLabelEn: 'Oral Cancer Early Warning Signs & Ulcers (>14 Days)',
    icon: '🔍',
    speechTextTe:
      'నోటిలో 14 రోజుల కంటే ఎక్కువ కాలం ఉండే తెల్ల మచ్చలు (ల్యూకోప్లాకియా), ఎర్ర మచ్చలు (ఎరిత్రోప్లాకియా), తగ్గని పుండ్లు మరియు నోరు తెరవడం కష్టంగా ఉండటం నోటి క్యాన్సర్ ప్రాథమిక లక్షణాలు. నిర్లక్ష్యం చేయకుండా వెంటనే స్క్రీనింగ్ చేయించుకోండి. ముందస్తు గుర్తింపుతో నోటి క్యాన్సర్‌ను 100 శాతం నయం చేయవచ్చు!',
    speechTextEn:
      'Persistent white patches (Leukoplakia) or fiery red patches lasting over 14 days, non-healing oral ulcers, burning sensation when eating, and difficulty opening the mouth are early oral cancer warning signs. Early detection guarantees a 100% cure rate!',
    speechTextHi:
      'मुंह में 14 दिनों से अधिक रहने वाले सफेद धब्बे (ल्यूकोप्लाकिया), लाल धब्बे और न भरने वाले छाले ओरल कैंसर के शुरुआती लक्षण हैं। तुरंत जांच कराएं, समय पर पहचान से शत-प्रतिशत इलाज संभव है!',
  },
  {
    id: 'symptom_burning',
    labelTe: 'కారం తింటే మంట & నోరు తెరవలేకపోవడం (OSMF)',
    subLabelEn: 'Burning Sensation & Trismus / Restricted Jaw Opening',
    icon: '🌶️',
    speechTextTe:
      'కారం తిన్నప్పుడు నోరు తీవ్రంగా మండటం మరియు మూడు వేళ్ళు పట్టేంతగా నోరు తెరవలేకపోవడం ఓరల్ సబ్‌మ్యూకస్ ఫైబ్రోసిస్ (OSMF) లక్షణాలు. గుట్కా మరియు సుపారీ అలవాట్లను వెంటనే మానుకోండి. మా యాప్‌లో స్పెషలిస్ట్ డాక్టర్ అపాయింట్మెంట్ వెంటనే తీసుకోండి!',
    speechTextEn:
      'Severe burning sensation when eating spicy food and restricted mouth opening (inability to insert 3 fingers) are signs of OSMF caused by gutkha and areca nut. Stop tobacco chewing immediately and schedule a specialist consult!',
    speechTextHi:
      'तीखा खाने पर जलन और मुंह खोलने में परेशानी ओएसएमएफ के लक्षण हैं। गुटखा तुरंत छोड़ें और विशेषज्ञ डॉक्टर से जांच कराएं!',
  },
  {
    id: 'tobacco_hazards',
    labelTe: 'పొగాకు, గుట్కా & పుల్లచుట్ట ప్రమాదాలు',
    subLabelEn: 'Tobacco, Gutkha & Reverse Smoking Hazards',
    icon: '🚭',
    speechTextTe:
      'పొగాకు, గుట్కా, ఖైనీ మరియు మన ఏజెన్సీ ప్రాంతాల్లో కాల్చే పుల్లచుట్ట (రివర్స్ స్మోకింగ్) వల్ల బుక్కల్ మ్యూకోసా తీవ్రంగా దెబ్బతింటుంది. ఇది ల్యూకోప్లాకియా మరియు కణితిగా మారే ప్రమాదం ఉంది. పొగాకు మరియు గుట్కాను వెంటనే మానుకోండి — సంపూర్ణ ఆరోగ్యాన్ని కాపాడుకోండి!',
    speechTextEn:
      'Chewing smokeless tobacco, gutkha, khaini, and reverse chutta smoking severely damage the oral mucosal lining, accelerating leukoplakia into invasive cancer. Quitting tobacco completely prevents oral dysplasia!',
    speechTextHi:
      'तंबाकू, गुटखा और सिगरेट चबाने व पीने से मुंह की झिल्ली खराब होकर कैंसर का रूप ले सकती है। तंबाकू का सेवन तुरंत बंद करें और स्वस्थ जीवन चुनें!',
  },
  {
    id: 'app_navigation',
    labelTe: 'యాప్ ఎలా వాడాలి? (పూర్తి మార్గదర్శి)',
    subLabelEn: 'End-to-End Application Navigation Guide',
    icon: '📱',
    speechTextTe:
      'ఆరోగ్య దృష్టిలో 4 సులభమైన దశలు ఉన్నాయి. మొదటిది: కెమెరాతో నోటి లోపల ఫోటో తీయండి — జెమినీ ఏఐ వెంటనే తనిఖీ చేస్తుంది. రెండవది: ఎటువంటి యాప్ డౌన్‌లోడ్ లేకుండా పాడేరు డిస్ట్రిక్ట్ హాస్పిటల్ డాక్టర్ వి. అనిత రావు గారితో ఉచిత లైవ్ వీడియో కాల్ మాట్లాడండి. మూడవది: క్యూఆర్ కోడ్ ఉన్న అధికారిక రెఫరల్ స్లిప్‌ను డౌన్‌లోడ్ చేసుకోండి. నాల్గవది: జీ. మడుగుల, హుకుంపేట, చింతపల్లి పీహెచ్‌సీల వారపు క్యాంపులలో ఉచిత బయాప్సీ చేయించుకోండి.',
    speechTextEn:
      'Aarogya Drishti operates in 4 seamless steps: First, capture an oral mucosal photo for instant Google Gemini AI triage. Second, start a zero-install WebRTC live video consultation with specialist Dr. V. Anitha Rao at District Hospital Paderu. Third, download your scannable QR referral slip. Fourth, attend weekly specialist diagnostic camps at G. Madugula, Hukumpeta, or Chintapalli PHCs for fast-track biopsy and medical drone medicines!',
    speechTextHi:
      'आरोग्य दृष्टि में 4 सरल कदम हैं: पहले कैमरे से फोटो लेकर जेमिनी एआई जांच कराएं। फिर बिना किसी ऐप डाउनलोड के पाडेरू जिला अस्पताल की डॉ. अनिता राव से लाइव वीडियो कॉल करें। क्यूआर कोड पर्ची डाउनलोड करें और साप्ताहिक पीएचसी शिविर में जांच कराएं।',
  },
  {
    id: 'telemedicine_call',
    labelTe: 'డాక్టర్ వి. అనిత రావు గారితో వీడియో సంప్రదింపు',
    subLabelEn: 'Live Telemedicine Video Call with Dr. V. Anitha Rao',
    icon: '🩺',
    speechTextTe:
      'లైవ్ వీడియో కన్సల్టేషన్ బటన్ నొక్కగానే ఎటువంటి గూగుల్ లాగిన్ లేదా ఎక్స్‌టెన్షన్స్ లేకుండా నేరుగా పాడేరు డిస్ట్రిక్ట్ హాస్పిటల్ ఓరల్ ఆంకాలజిస్ట్ డాక్టర్ వి. అనిత రావు గారితో హై-డెఫినిషన్ వీడియో కాల్ ప్రారంభమవుతుంది. డాక్టర్ గారు మీ సమస్యను చూసి తక్షణ ప్రిస్క్రిప్షన్ ఇస్తారు.',
    speechTextEn:
      'Clicking Live Video Consultation instantly starts a high-definition WebRTC video call with oral oncologist Dr. V. Anitha Rao at District Hospital Paderu with zero extension prompts or Google logins required.',
    speechTextHi:
      'लाइव वीडियो कॉल बटन दबाते ही बिना किसी ऐप या लॉगिन के सीधे पाडेरू जिला अस्पताल की डॉ. अनिता राव से उच्च गुणवत्ता वाला वीडियो परामर्श शुरू हो जाता है।',
  },
  {
    id: 'circuit_camps',
    labelTe: '3-పీహెచ్‌సీ క్యాంపులు & మెడికల్ డ్రోన్ సేవలు',
    subLabelEn: '3-PHC Circuit Camps & Medical Drone Logistics',
    icon: '🚁',
    speechTextTe:
      'పాడేరు డివిజన్ పరిధిలోని జీ. మడుగుల, హుకుంపేట మరియు చింతపల్లి పీహెచ్‌సీలలో ప్రతి వారం స్పెషలిస్ట్ క్యాంపులు జరుగుతాయి. అత్యవసర మందులు మరియు బయాప్సీ కిట్లను పాడేరు సెంట్రల్ హబ్ నుండి మెడికల్ డ్రోన్ ద్వారా 20 నిమిషాల్లో వేగంగా డెలివరీ చేస్తాము.',
    speechTextEn:
      'Weekly specialist circuit camps run across G. Madugula, Hukumpeta, and Chintapalli PHCs. Urgent pharmaceuticals and biopsy diagnostic kits are flown directly from Paderu Central Hub within 20 minutes via autonomous medical drones.',
    speechTextHi:
      'जी. माडुगुला, हुकुंपेटा और चिंतापल्ली में हर सप्ताह विशेषज्ञ शिविर आयोजित होते हैं और मेडिकल ड्रोन द्वारा 20 मिनट में आपातकालीन दवाएं पहुंचाई जाती हैं।',
  },
]

export function getTopicSpeechText(
  topic: QuickSpeechTopic,
  lang: BujjiLanguage
): string {
  const norm = lang.toUpperCase() as 'TE' | 'EN' | 'HI'
  if (norm === 'HI') return topic.speechTextHi
  if (norm === 'EN') return topic.speechTextEn
  return topic.speechTextTe
}

/**
 * Universal speech synthesis helper strictly following:
 * 1. Telugu (te-IN): rate: 0.88, pitch: 1.0 (Optimal native clarity for rural & tribal articulation)
 * 2. Hindi (hi-IN): rate: 0.90, pitch: 1.0
 * 3. English (en-IN): rate: 0.95, pitch: 1.0
 * Pure cleaned text without markdown artifacts.
 */
export function speakBujjiTeluguVoice(
  text: string,
  preferredLang: BujjiLanguage = 'TE',
  onStart?: () => void,
  onEnd?: () => void
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

  window.speechSynthesis.cancel()

  const normalizedLang = preferredLang.toUpperCase() as 'TE' | 'EN' | 'HI'
  const cleanedText = cleanTextForSpeech(text)
  if (!cleanedText) return

  const utterance = new SpeechSynthesisUtterance(cleanedText)
  const langTag =
    normalizedLang === 'TE' ? 'te-IN' : normalizedLang === 'HI' ? 'hi-IN' : 'en-IN'
  utterance.lang = langTag

  // Specific rate and pitch constraints for high clinical clarity
  if (normalizedLang === 'TE') {
    utterance.rate = 0.88
    utterance.pitch = 1.0
  } else if (normalizedLang === 'HI') {
    utterance.rate = 0.9
    utterance.pitch = 1.0
  } else {
    utterance.rate = 0.95
    utterance.pitch = 1.0
  }

  const selectVoice = (voices: SpeechSynthesisVoice[]) => {
    let matchedVoice: SpeechSynthesisVoice | undefined

    if (normalizedLang === 'TE') {
      matchedVoice =
        voices.find(
          (v) =>
            v.lang.toLowerCase().replace('_', '-') === 'te-in' ||
            v.lang.toLowerCase().startsWith('te') ||
            v.name.toLowerCase().includes('telugu')
        ) ||
        voices.find((v) => v.name.toLowerCase().includes('mohan') || v.name.toLowerCase().includes('chitra')) ||
        voices.find((v) => v.lang.toLowerCase().includes('in'))
    } else if (normalizedLang === 'HI') {
      matchedVoice =
        voices.find(
          (v) =>
            v.lang.toLowerCase().replace('_', '-') === 'hi-in' ||
            v.lang.toLowerCase().startsWith('hi') ||
            v.name.toLowerCase().includes('hindi')
        ) ||
        voices.find((v) => v.name.toLowerCase().includes('swara') || v.name.toLowerCase().includes('madhur')) ||
        voices.find((v) => v.lang.toLowerCase().includes('in'))
    } else {
      matchedVoice =
        voices.find((v) => v.lang.toLowerCase().replace('_', '-') === 'en-in') ||
        voices.find((v) => v.name.toLowerCase().includes('india')) ||
        voices.find((v) => v.lang.toLowerCase().startsWith('en'))
    }

    if (matchedVoice) {
      utterance.voice = matchedVoice
    }
  }

  const existingVoices = window.speechSynthesis.getVoices()
  if (existingVoices.length > 0) {
    selectVoice(existingVoices)
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      const freshVoices = window.speechSynthesis.getVoices()
      selectVoice(freshVoices)
    }
  }

  if (onStart) utterance.onstart = onStart
  if (onEnd) {
    utterance.onend = onEnd
    utterance.onerror = onEnd
  }

  window.speechSynthesis.speak(utterance)
}
