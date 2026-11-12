import { Language } from './translations.ts';

// Comprehensive Trilingual Translation Dictionary
export const dictionary: Record<string, { te: string; hi: string }> = {
  // Brand & Subtitles
  'AAROGYA DRISHTI': { te: 'ఆరోగ్య దృష్టి', hi: 'आरोग्य दृष्टि' },
  'AAROHAN 2026': { te: 'ఆరోహణ 2026', hi: 'आरोहण 2026' },
  'ITDA PADERU | ALLURI SITHARAMA RAJU DISTRICT': { te: 'ఐటీడీఏ పాడేరు | అల్లూరి సీతారామరాజు జిల్లా', hi: 'आईटीडीए पाडेरू | अल्लूरी सीताराम राजू जिला' },
  'ITDA Paderu • Oral Cancer Detection & Care System': { te: 'ఐటీడీఏ పాడేరు • నోటి క్యాన్సర్ నిర్ధారణ & సంరక్షణ వ్యవస్థ', hi: 'आईटीडीए पाडेरू • मुख कैंसर जांच एवं देखभाल प्रणाली' },
  'Tribal Citizen Patient Care & Health Portal': { te: 'గిరిజన పౌరుల ఆరోగ్య సంరక్షణ పోర్టల్', hi: 'जनजातीय नागरिक स्वास्थ्य देखभाल पोर्टल' },
  'Medical Officer & Tele-Oncology Command': { te: 'వైద్యాధికారి & టెలి-ఆంకాలజీ నియంత్రణ', hi: 'चिकित्सा अधिकारी एवं टेली-ऑन्कोलॉजी नियंत्रण' },
  'District Health Administration & 11 Mandals Registry': { te: 'జిల్లా ఆరోగ్య పరిపాలన & 11 మండలాల రిజిస్ట్రీ', hi: 'जिला स्वास्थ्य प्रशासन एवं 11 मंडल रजिस्ट्री' },
  'Sync Active (18ms)': { te: 'సింక్ యాక్టివ్ (18మి.సె)', hi: 'सिंक सक्रिय (18ms)' },
  'Offline Resilience': { te: 'ఆఫ్‌లైన్ రక్షణ', hi: 'ऑफ़लाइन सुरक्षा' },
  'Tribal SOS 108/104': { te: 'గిరిజన అత్యవసర 108/104', hi: 'जनजातीय आपातकालीन 108/104' },
  'Emergency 108/104': { te: 'అత్యవసర 108/104', hi: 'आपातकालीन 108/104' },
  'AI AROGYA': { te: 'ఏఐ ఆరోగ్యా', hi: 'एआई आरोग्या' },
  'Logout': { te: 'లాగౌట్', hi: 'लॉगआउट' },

  // Gateways & Home
  'Portal Gateway Selection': { te: 'పోర్టల్ ప్రవేశ ద్వారం ఎంపిక', hi: 'पोर्टल गेटवे चयन' },
  'Choose Authorized Portal Gateway': { te: 'అధీకృత పోర్టల్ ఎంపిక చేయండి', hi: 'अधिकृत पोर्टल चुनें' },
  'Citizen & Patient Portal': { te: 'పౌర & రోగి పోర్టల్', hi: 'नागरिक और मरीज पोर्टल' },
  'Medical Officer / Doctor': { te: 'వైద్యాధికారి / డాక్టర్', hi: 'चिकित्सा अधिकारी / डॉक्टर' },
  'ITDA District Admin Portal': { te: 'ఐటీడీఏ జిల్లా అడ్మిన్ పోర్టల్', hi: 'आईटीडीए जिला व्यवस्थापक पोर्टल' },
  'Patient Registration': { te: 'నూతన రోగి నమోదు', hi: 'मरीज पंजीकरण' },
  'Patient Login': { te: 'రోగి లాగిన్', hi: 'मरीज लॉगिन' },
  'Doctor Login': { te: 'డాక్టర్ లాగిన్', hi: 'डॉक्टर लॉगिन' },
  'Admin Login': { te: 'అడ్మిన్ లాగిన్', hi: 'व्यवस्थापक लॉगिन' },
  'New Patient Registration': { te: 'కొత్త రోగి నమోదు', hi: 'नया मरीज पंजीकरण' },
  'Existing Patient Sign-In': { te: 'రోగి లాగిన్', hi: 'मौजूदा मरीज लॉगिन' },
  'Doctor Portal Sign-In': { te: 'డాక్టర్ లాగిన్', hi: 'डॉक्टर पोर्टल लॉगिन' },
  'Admin Portal Sign-In': { te: 'అడ్మిన్ లాగిన్', hi: 'व्यवस्थापक पोर्टल लॉगिन' },
  'Sign In': { te: 'లాగిన్ అవ్వండి', hi: 'लॉगिन करें' },
  'Register Patient': { te: 'రోగిని నమోదు చేయండి', hi: 'मरीज को पंजीकृत करें' },
  'Registering...': { te: 'నమోదు అవుతోంది...', hi: 'पंजीकरण हो रहा है...' },
  'Authenticating...': { te: 'ధృవీకరిస్తోంది...', hi: 'प्रमाणीकरण जारी है...' },
  'Enter Doctor Workspace': { te: 'డాక్టర్ వర్క్‌స్పేస్‌లోకి ప్రవేశించండి', hi: 'डॉक्टर कार्यक्षेत्र में प्रवेश करें' },
  'Sign In to Admin Portal': { te: 'అడ్మిన్ పోర్టల్‌లోకి ప్రవేశించండి', hi: 'व्यवस्थापक पोर्टल में प्रवेश करें' },
  'Reset Password': { te: 'పాస్‌వర్డ్ రీసెట్', hi: 'पासवर्ड रीसेट करें' },
  'Forgot Password?': { te: 'పాస్‌వర్డ్ మర్చిపోయారా?', hi: 'पासवर्ड भूल गए?' },
  'Refresh Queue': { te: 'తాజాకరించండి', hi: 'रिफ्रेश करें' },
  'Search Patients, Doctors, 11 Mandals, Biopsy Orders...': { te: 'రోగులు, వైద్యులు, 11 మండలాలు, బయాప్సీ వివరాలు వెతకండి...', hi: 'मरीज, डॉक्टर, 11 मंडल, बायोप्सी खोजें...' },
  '← Portal Home': { te: '← ప్రధాన పేజీ', hi: '← मुख्य पृष्ठ' },

  // Registration & Form fields
  'Full Name': { te: 'పూర్తి పేరు', hi: 'पूरा नाम' },
  'Patient Full Name': { te: 'రోగి పూర్తి పేరు', hi: 'मरीज का पूरा नाम' },
  'Date of Birth': { te: 'పుట్టిన తేదీ', hi: 'जन्म तिथि' },
  'Age (Auto-calculated)': { te: 'వయస్సు (ఆటోమేటిక్)', hi: 'आयु (स्वचालित)' },
  'Age': { te: 'వయస్సు', hi: 'आयु' },
  'Years': { te: 'సంవత్సరాలు', hi: 'वर्ष' },
  'Gender': { te: 'లింగం', hi: 'लिंग' },
  'Male': { te: 'పురుషుడు', hi: 'पुरुष' },
  'Female': { te: 'స్త్రీ', hi: 'महिला' },
  'Other': { te: 'ఇతర', hi: 'अन्य' },
  'Blood Group': { te: 'రక్త గ్రూపు', hi: 'रक्त समूह' },
  'Phone Number': { te: 'ఫోన్ నంబర్', hi: 'फ़ोन नंबर' },
  'Aadhaar Number (12 Digits)': { te: 'ఆధార్ సంఖ్య (12 అంకెలు)', hi: 'आधार संख्या (12 अंक)' },
  'Mandal': { te: 'మండలం', hi: 'मंडल' },
  'Village': { te: 'గ్రామం', hi: 'गांव' },
  'Habitation': { te: 'నివాస ప్రాంతం', hi: 'बस्ती / निवास' },
  'Doctor User-ID or Official Email': { te: 'డాక్టర్ యూజర్ ఐడి లేదా అధికారిక ఈమెయిల్', hi: 'डॉक्टर यूजर आईडी या आधिकारिक ईमेल' },
  'Account Password': { te: 'ఖాతా పాస్‌వర్డ్', hi: 'खाता पासवर्ड' },
  'Enter Doctor ID or Email': { te: 'డాక్టర్ ఐడి లేదా ఈమెయిల్ నమోదు చేయండి', hi: 'डॉक्टर आईडी या ईमेल दर्ज करें' },
  'Enter Password': { te: 'పాస్‌వర్డ్ నమోదు చేయండి', hi: 'पासवर्ड दर्ज करें' },
  'UIDN or Phone Number': { te: 'యూఐడీఎన్ లేదా ఫోన్ నంబర్', hi: 'यूआईडीएन या फोन नंबर' },
  'Enter 12-Digit Aadhaar': { te: '12 అంకెల ఆధార్ సంఖ్య నమోదు చేయండి', hi: '12 अंकों का आधार दर्ज करें' },
  '12-Digit Aadhaar': { te: '12-అంకెల ఆధార్', hi: '12-अंकीय आधार' },
  'Phone OTP': { te: 'ఫోన్ ఓటీపీ', hi: 'फ़ोन ओटीपी' },

  // Patient Dashboard Actions
  'Core Health Actions': { te: 'ప్రధాన ఆరోగ్య చర్యలు', hi: 'मुख्य स्वास्थ्य सेवाएं' },
  '1. Check Mouth Photo': { te: '1. నోటి ఫోటో పరీక్ష (AI)', hi: '1. मुख फोटो जांच (एआई)' },
  '2. Telemedicine Video Call': { te: '2. టెలిమెడిసిన్ వీడియో సంప్రదింపులు', hi: '2. टेलीमेडिसिन वीडियो परामर्श' },
  '3. Golden Health Card': { te: '3. గోల్డెన్ హెల్త్ కార్డ్', hi: '3. गोल्डन हेल्थ कार्ड' },
  '4. Habit Cessation Tracker': { te: '4. పొగాకు మాన్పు ట్రాకర్', hi: '4. आदत मुक्ति ट्रैकर' },
  'Book Appointment': { te: 'అపాయింట్‌మెంట్ బుక్ చేయండి', hi: 'अपॉइंटमेंट बुक करें' },
  'Request Tele-Consultation Appointment': { te: 'వీడియో సంప్రదింపుల అపాయింట్‌మెంట్ కోరండి', hi: 'वीडियो परामर्श अपॉइंटमेंट का अनुरोध करें' },
  'Join Video Call': { te: 'వీడియో కాల్‌లో చేరండి', hi: 'वीडियो कॉल से जुड़ें' },
  'Booked Doctor': { te: 'కేటాయించిన వైద్యుడు', hi: 'नियुक्त डॉक्टर' },
  'No doctor appointment booked yet. Please book an appointment first.': {
    te: 'ఇంకా వైద్యుని అపాయింట్‌మెంట్ బుక్ చేయలేదు. దయచేసి ముందుగా అపాయింట్‌మెంట్ బుక్ చేసుకోండి.',
    hi: 'अभी तक कोई डॉक्टर अपॉइंटमेंट बुक नहीं हुआ है। कृपया पहले अपॉइंटमेंट बुक करें।'
  },
  'Your Booked Appointments': { te: 'మీరు బుక్ చేసిన అపాయింట్‌మెంట్‌లు', hi: 'आपके बुक किए गए अपॉइंटमेंट्स' },
  'No appointments scheduled yet. Click below to book a consultation with our specialist doctors.': {
    te: 'ఇంకా ఎలాంటి అపాయింట్‌మెంట్‌లు లేవు. నిపుణులైన వైద్యులతో సంప్రదింపుల కోసం క్రింద క్లిక్ చేయండి.',
    hi: 'अभी कोई अपॉइंटमेंट नहीं है। विशेषज्ञ डॉक्टरों से परामर्श के लिए नीचे क्लिक करें।'
  },
  'Book Specialist Appointment': { te: 'స్పెషలిస్ట్ అపాయింట్‌మెంట్ బుక్ చేయండి', hi: 'विशेषज्ञ अपॉइंटमेंट बुक करें' },
  'My Prescriptions & Biopsy Orders': { te: 'నా ప్రిస్క్రిప్షన్‌లు & బయాప్సీ రికార్డులు', hi: 'मेरे पर्चे एवं बायोप्सी आदेश' },
  'No prescriptions issued yet. Consult a doctor via Telemedicine to receive clinical guidance.': {
    te: 'ఇంకా ఎలాంటి ప్రిస్క్రిప్షన్‌లు జారీ చేయలేదు. సలహా కోసం టెలిమెడిసిన్ ద్వారా వైద్యుడిని సంప్రదించండి.',
    hi: 'अभी तक कोई पर्चा जारी नहीं किया गया है। मार्गदर्शन के लिए डॉक्टर से टेलीमेडिसिन परामर्श लें।'
  },

  // Status badges
  'Approved': { te: 'ఆమోదించబడింది', hi: 'स्वीकृत' },
  'Pending': { te: 'వేచి ఉంది', hi: 'लंबित' },
  'Rejected': { te: 'తిరస్కరించబడింది', hi: 'अस्वीकृत' },
  'Completed': { te: 'పూర్తయింది', hi: 'पूर्ण' },
  'Active': { te: 'చురుకుగా ఉంది', hi: 'सक्रिय' },

  // Habit & Camera
  'Target Oral Cavity Region': { te: 'నోటి భాగం ఎంచుకోండి', hi: 'मुख गुहा का क्षेत्र चुनें' },
  'Habit Exposure Assessment': { te: 'పొగాకు / వ్యసనాల వివరాలు', hi: 'तंबाकू/व्यसन विवरण' },
  'Reverse Smoking (Adda Poga)': { te: 'అడ్డాపొగ (రివర్స్ స్మోకింగ్)', hi: 'रिवर्स स्मोकिंग (अड्डा पोगा)' },
  'Raw/Cured Tobacco Chewing': { te: 'నమిలే పొగాకు / ఖైనీ', hi: 'तंबाकू / खैनी चबाना' },
  'Packaged Gutkha / Areca Nut': { te: 'గుట్కా / పోకచెక్క', hi: 'गुटखा / सुपारी' },
  'Duration of Habit (Years)': { te: 'అలవాటు ఉన్న కాలం (సంవత్సరాలు)', hi: 'आदत की अवधि (वर्ष)' },
  'Analyze Scan with Multimodal Gemini AI': { te: 'జెమినీ ఏఐ తో విశ్లేషించండి', hi: 'जेमिनी एआई से विश्लेषण करें' },
  'Evaluating with Gemini Onco-Model...': { te: 'ఏఐ పరిశీలిస్తోంది...', hi: 'एआई विश्लेषण जारी है...' },
  'Turn Camera Off': { te: 'కెమెరా ఆఫ్ చేయండి', hi: 'कैमरा बंद करें' },
  'Turn Camera On': { te: 'కెమెరా ఆన్ చేయండి', hi: 'कैमरा चालू करें' },
  'Mute Mic': { te: 'మైక్ మ్యూట్', hi: 'माइक म्यूट करें' },
  'Unmute Mic': { te: 'మైక్ ఆన్', hi: 'माइक चालू करें' },
  'End Consultation': { te: 'కాల్ ముగించు', hi: 'परामर्श समाप्त करें' },
  'WebRTC Telemedicine Consultation': { te: 'వెబ్‌ఆర్‌టిసి టెలిమెడిసిన్ సంప్రదింపులు', hi: 'वेबआरटीसी टेलीमेडिसिन परामर्श' },

  // Doctor Portal
  'Doctor Consultation Workspace': { te: 'వైద్యాధికారి వర్క్‌స్పేస్', hi: 'चिकित्सा अधिकारी कार्यक्षेत्र' },
  'Active for Tele-Consultation (Online)': { te: 'టెలి-సంప్రదింపులకు సిద్ధంగా ఉన్నారు (ఆన్‌లైన్)', hi: 'टेली-परामर्श हेतु उपलब्ध (ऑनलाइन)' },
  'Status: Inactive (Offline)': { te: 'స్థితి: ఆఫ్‌లైన్', hi: 'स्थिति: ऑफ़लाइन' },
  'Incoming Patient Appointments': { te: 'వచ్చిన రోగుల అపాయింట్‌మెంట్‌లు', hi: 'आगामी मरीज अपॉइंटमेंट्स' },
  'Assigned Patients Under Care': { te: 'నా పర్యవేక్షణలోని రోగులు', hi: 'मेरी देखरेख में मरीज' },
  'Histopathology Biopsy Vault': { te: 'బయాప్సీ & ప్రిస్క్రిప్షన్ రికార్డులు', hi: 'बायोप्सी और पर्चे रिकॉर्ड्स' },
  'Write e-Prescription': { te: 'ప్రిస్క్రిప్షన్ రాయండి', hi: 'ई-पर्चा लिखें' },
  'Approve': { te: 'ఆమోదించు', hi: 'स्वीकार करें' },
  'Reject': { te: 'తిరస్కరించు', hi: 'अस्वीकार करें' },

  // Admin Portal
  'Admin Workspace': { te: 'అడ్మిన్ వర్క్‌స్పేస్', hi: 'व्यवस्थापक कार्यक्षेत्र' },
  '11 Mandals Health Facilities': { te: '11 మండలాల ఆరోగ్య కేంద్రాలు', hi: '11 मंडल स्वास्थ्य केंद्र' },
  'Doctor Accounts Management': { te: 'వైద్యుల ఖాతాల నిర్వహణ', hi: 'डॉक्टर खातों का प्रबंधन' }
};

// Direct Text Translator
export function translateText(text: string, lang: Language): string {
  if (lang === 'en' || !text) return text;
  const trimmed = text.trim();
  if (dictionary[trimmed] && dictionary[trimmed][lang]) {
    return dictionary[trimmed][lang];
  }
  return text;
}

// Global WeakMap to keep original English content of DOM text nodes
const textNodeOriginals = new WeakMap<Node, string>();

// Sorted dictionary keys by length descending to match full phrases before individual words
const sortedKeys = Object.keys(dictionary).sort((a, b) => b.length - a.length);

/**
 * Traverses DOM nodes and dynamically translates visible text.
 * Runs instantly in < 5ms without altering React state or DOM tree structure.
 */
export function applyDOMTranslation(root: HTMLElement, lang: Language) {
  if (!root) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      // Ignore script, style, code, pre tags
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName.toLowerCase();
      if (['script', 'style', 'code', 'pre', 'noscript'].includes(tag)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (parent.classList.contains('notranslate')) {
        return NodeFilter.FILTER_REJECT;
      }
      if (!node.nodeValue || node.nodeValue.trim().length === 0) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const nodesToUpdate: { node: Node; newText: string }[] = [];

  let currentNode = walker.nextNode();
  while (currentNode) {
    let original = textNodeOriginals.get(currentNode);
    if (!original) {
      original = currentNode.nodeValue || '';
      textNodeOriginals.set(currentNode, original);
    }

    if (lang === 'en') {
      if (currentNode.nodeValue !== original) {
        nodesToUpdate.push({ node: currentNode, newText: original });
      }
    } else {
      let translated = original;
      const trimmed = original.trim();

      if (dictionary[trimmed] && dictionary[trimmed][lang]) {
        translated = original.replace(trimmed, dictionary[trimmed][lang]);
      } else {
        // Phrase substitution for exact sub-phrases
        for (const phrase of sortedKeys) {
          if (translated.includes(phrase)) {
            const repl = dictionary[phrase][lang];
            translated = translated.split(phrase).join(repl);
          }
        }
      }

      if (translated !== currentNode.nodeValue) {
        nodesToUpdate.push({ node: currentNode, newText: translated });
      }
    }

    currentNode = walker.nextNode();
  }

  for (const { node, newText } of nodesToUpdate) {
    node.nodeValue = newText;
  }
}
