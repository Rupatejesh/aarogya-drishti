import { Language } from './translations.ts';

// Comprehensive Trilingual Translation Dictionary covering 100% of Aarogya Drishti
export const dictionary: Record<string, { te: string; hi: string }> = {
  // Brand, District & Header
  'AAROGYA DRISHTI': { te: 'ఆరోగ్య దృష్టి', hi: 'आरोग्य दृष्टि' },
  'AAROHAN 2026': { te: 'ఆరోహణ 2026', hi: 'आरोहण 2026' },
  'AAROHAN 2026 • ITDA PADERU TRIBAL ONCO-CARE INITIATIVE': {
    te: 'ఆరోహణ 2026 • ఐటీడీఏ పాడేరు గిరిజన క్యాన్సర్ సంరక్షణ కార్యక్రమం',
    hi: 'आरोहण 2026 • आईटीडीए पाडेरू जनजातीय कैंसर देखभाल पहल'
  },
  'ITDA PADERU | ALLURI SITHARAMA RAJU DISTRICT': {
    te: 'ఐటీడీఏ పాడేరు | అల్లూరి సీతారామరాజు జిల్లా',
    hi: 'आईटीडीए पाडेरू | अल्लूरी सीताराम राजू जिला'
  },
  'ITDA Paderu • Oral Cancer Detection & Care System': {
    te: 'ఐటీడీఏ పాడేరు • నోటి క్యాన్సర్ నిర్ధారణ & సంరక్షణ వ్యవస్థ',
    hi: 'आईटीडीए पाडेरू • मुख कैंसर जांच एवं देखभाल प्रणाली'
  },
  'Integrated Tribal Healthcare Network (AP Govt)': {
    te: 'సమీకృత గిరిజన ఆరోగ్య నెట్‌వర్క్ (ఆంధ్రప్రదేశ్ ప్రభుత్వం)',
    hi: 'एकीकृत जनजातीय स्वास्थ्य नेटवर्क (आंध्र प्रदेश सरकार)'
  },
  'Tribal Citizen Patient Care & Health Portal': {
    te: 'గిరిజన పౌరుల ఆరోగ్య సంరక్షణ పోర్టల్',
    hi: 'जनजातीय नागरिक स्वास्थ्य देखभाल पोर्टल'
  },
  'Medical Officer & Tele-Oncology Command': {
    te: 'వైద్యాధికారి & టెలి-ఆంకాలజీ నియంత్రణ విభాగం',
    hi: 'चिकित्सा अधिकारी एवं टेली-ऑन्कोलॉजी नियंत्रण'
  },
  'District Health Administration & 11 Mandals Registry': {
    te: 'జిల్లా ఆరోగ్య పరిపాలన & 11 మండలాల రిజిస్ట్రీ',
    hi: 'जिला स्वास्थ्य प्रशासन एवं 11 मंडल रजिस्ट्री'
  },
  'Sync Active (18ms)': { te: 'సింక్ యాక్టివ్ (18మి.సె)', hi: 'सिंक सक्रिय (18ms)' },
  'Offline Resilience': { te: 'ఆఫ్‌లైన్ రక్షణ', hi: 'ऑफ़लाइन सुरक्षा' },
  'Tribal SOS 108/104': { te: 'గిరిజన అత్యవసర 108/104', hi: 'जनजातीय आपातकालीन 108/104' },
  'Emergency SOS': { te: 'అత్యవసర SOS', hi: 'आपातकालीन एसओएस' },
  'Emergency 108/104': { te: 'అత్యవసర 108/104', hi: 'आपातकालीन 108/104' },
  'AI AROGYA': { te: 'ఏఐ ఆరోగ్యా', hi: 'एआई आरोग्या' },
  'AI Aarohi Bot': { te: 'ఏఐ ఆరోహి బోట్', hi: 'आई आरोही बॉट' },
  'Logout': { te: 'లాగౌట్', hi: 'लॉगआउट' },

  // Hero & Landing
  'AI-Powered Early Oral Cancer Detection, Tele-Consultation & Biopsy Tracking designed specifically for the tribal agency areas of 11 Mandals in Alluri Sitharama Raju District, Andhra Pradesh.': {
    te: 'ఆంధ్రప్రదేశ్ లోని అల్లూరి సీతారామరాజు జిల్లా పరిధిలోని 11 మండలాల గిరిజన ప్రాంతాల కోసం ప్రత్యేకంగా రూపొందించబడిన ఏఐ ఆధారిత నోటి క్యాన్సర్ ప్రారంభ గుర్తింపు, టెలి-కన్సల్టేషన్ మరియు బయాప్సీ పర్యవేక్షణ వ్యవస్థ.',
    hi: 'आंध्र प्रदेश के अल्लूरी सीताराम राजू जिले के 11 जनजातीय मंडलों हेतु विशेष रूप से विकसित एआई-आधारित प्रारंभिक मुख कैंसर जांच, टेली-परामर्श एवं बायोप्सी ट्रैकिंग प्रणाली।'
  },
  'Saving Lives in ASR District Through': {
    te: 'అల్లూరి జిల్లా ప్రజల ప్రాణరక్షణ కోసం',
    hi: 'अल्लूरी जिले में जीवन रक्षा हेतु'
  },
  'Early Oral Cancer AI Detection': {
    te: 'ప్రారంభ దశ నోటి క్యాన్సర్ ఏఐ గుర్తింపు',
    hi: 'प्रारंभिक मुख कैंसर एआई पहचान'
  },
  'HACKATHON COMPULSORY EVALUATION FAST-TRACK': {
    te: 'హ్యాకథాన్ తక్షణ ప్రవేశం (ఫాస్ట్-ట్రాక్)',
    hi: 'हैकथॉन मूल्यांकन त्वरित प्रवेश'
  },
  '1-Click Instant Enter': { te: '1-క్లిక్ తక్షణ ప్రవేశం', hi: '1-क्लिक त्वरित प्रवेश' },
  'ORAL ONCO-BIOMARKER 3D HELIX': { te: 'నోటి క్యాన్సర్ 3D బయోమార్కర్ హెలిక్స్', hi: 'मुख कैंसर 3डी बायोमार्कर हेलिक्स' },
  'Drag 360°': { te: '360° తిప్పండి', hi: '360° घुमाएं' },
  'Tumor Suppressor Protein p53': { te: 'ట్యూమర్ సప్రెసర్ ప్రోటీన్ p53', hi: 'ट्यूमर सप्रेसर प्रोटीन p53' },
  'Cell Cycle & Apoptosis Regulator': { te: 'కణ విభజన & నియంత్రణ వ్యవస్థ', hi: 'कोशिका चक्र व एपोप्टोसिस नियामक' },
  'Overexpression/mutation strongly correlates with malignant transformation of Leukoplakia in reverse smokers.': {
    te: 'అడ్డాపొగ త్రాగే వారిలో ల్యూకోప్లాకియా క్యాన్సర్‌గా మారడానికి ఈ ప్రోటీన్ మార్పులు ప్రధాన సంకేతం.',
    hi: 'रिवर्स स्मोकिंग करने वालों में ल्यूकोप्लाकिया के कैंसर में बदलने का यह प्रमुख जैविक संकेतक है।'
  },
  'PRESENTATION DEMO FLOW (4-STAGE GUIDED ARCHITECTURE)': {
    te: 'ప్రెజెంటేషన్ డెమో విధానం (4-దశల ఆర్కిటెక్చర్)',
    hi: 'प्रस्तुति डेमो प्रवाह (4-चरणीय वास्तुकला)'
  },
  'Click any stage to transition directly for evaluator demonstrations': {
    te: 'డెమో ప్రదర్శన కోసం ఏదైనా దశపై క్లిక్ చేయండి',
    hi: 'मूल्यांकन डेमो हेतु किसी भी चरण पर क्लिक करें'
  },
  'Patient Registration & Card': { te: 'రోగి నమోదు & హెల్త్ కార్డ్', hi: 'मरीज पंजीकरण व कार्ड' },
  'Oral Photo & AI Triage': { te: 'నోటి ఫోటో & ఏఐ పరీక్ష', hi: 'मुख फोटो व एआई जांच' },
  'Doctor Review & WebRTC': { te: 'వైద్యుల సమీక్ష & వెబ్‌ఆర్‌టిసి', hi: 'डॉक्टर समीक्षा व वेबआरटीसी' },
  'Biopsy Slip & 11 Mandals': { te: 'బయాప్సీ స్లిప్ & 11 మండలాలు', hi: 'बायोप्सी पर्ची व 11 मंडल' },
  'Live Reticle • 92.4% Leukoplakia': { te: 'లైవ్ స్కానర్ • 92.4% ల్యూకోప్లాకియా', hi: 'लाइव स्कैनर • 92.4% ल्यूकोप्लाकिया' },
  'Dr. Swapna • Queue & Tele-Call': { te: 'డా. స్వప్న • పేషెంట్ క్యూ & వీడియో కాల్', hi: 'डॉ. स्वप्ना • मरीज कतार व कॉल' },
  'Barcode • GGH Paderu • Admin': { te: 'బార్‌కోడ్ • జీజీహెచ్ పాడేరు • అడ్మిన్', hi: 'बारकोड • जीजीएच पाडेरू • व्यवस्थापक' },

  // Gateways & Home Selection
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
  'Register as New Patient': { te: 'కొత్త రోగిగా నమోదు చేసుకోండి', hi: 'नए मरीज के रूप में पंजीकरण करें' },
  'Authorized Portal Sign-In': { te: 'అధీకృత పోర్టల్ లాగిన్', hi: 'अधिकृत पोर्टल लॉगिन' },
  'Registering...': { te: 'నమోదు అవుతోంది...', hi: 'पंजीकरण हो रहा है...' },
  'Authenticating...': { te: 'ధృవీకరిస్తోంది...', hi: 'प्रमाणीकरण जारी है...' },
  'Enter Doctor Workspace': { te: 'డాక్టర్ వర్క్‌స్పేస్‌లోకి ప్రవేశించండి', hi: 'डॉक्टर कार्यक्षेत्र में प्रवेश करें' },
  'Sign In to Admin Portal': { te: 'అడ్మిన్ పోర్టల్‌లోకి ప్రవేశించండి', hi: 'व्यवस्थापक पोर्टल में प्रवेश करें' },
  'Reset Password': { te: 'పాస్‌వర్డ్ రీసెట్', hi: 'पासवर्ड रीसेट करें' },
  'Forgot Password?': { te: 'పాస్‌వర్డ్ మర్చిపోయారా?', hi: 'पासवर्ड भूल गए?' },
  'Refresh Queue': { te: 'తాజాకరించండి', hi: 'रिफ्रेश करें' },
  'Search Patients, Doctors, 11 Mandals, Biopsy Orders...': {
    te: 'రోగులు, వైద్యులు, 11 మండలాలు, బయాప్సీ వివరాలు వెతకండి...',
    hi: 'मरीज, डॉक्टर, 11 मंडल, बायोप्सी खोजें...'
  },
  '← Portal Home': { te: '← ప్రధాన పేజీ', hi: '← मुख्य पृष्ठ' },

  // Forms & Profile
  'Full Name': { te: 'పూర్తి పేరు', hi: 'पूरा नाम' },
  'Full Name (Tribal Citizen) *': { te: 'పూర్తి పేరు (గిరిజన పౌరుడు) *', hi: 'पूरा नाम (जनजातीय नागरिक) *' },
  'Patient Full Name': { te: 'రోగి పూర్తి పేరు', hi: 'मरीज का पूरा नाम' },
  'Date of Birth': { te: 'పుట్టిన తేదీ', hi: 'जन्म तिथि' },
  'Date of Birth *': { te: 'పుట్టిన తేదీ *', hi: 'जन्म तिथि *' },
  'Age (Auto-calculated)': { te: 'వయస్సు (ఆటోమేటిక్)', hi: 'आयु (स्वचालित)' },
  'Calculated Age': { te: 'లెక్కించబడిన వయస్సు', hi: 'गणना की गई आयु' },
  'Age': { te: 'వయస్సు', hi: 'आयु' },
  'Years': { te: 'సంవత్సరాలు', hi: 'वर्ष' },
  'Gender': { te: 'లింగం', hi: 'लिंग' },
  'Male': { te: 'పురుషుడు', hi: 'पुरुष' },
  'Female': { te: 'స్త్రీ', hi: 'महिला' },
  'Other': { te: 'ఇతర', hi: 'अन्य' },
  'Blood Group': { te: 'రక్త గ్రూపు', hi: 'रक्त समूह' },
  'Phone Number': { te: 'ఫోన్ నంబర్', hi: 'फ़ोन नंबर' },
  'Mobile Phone *': { te: 'మొబైల్ ఫోన్ *', hi: 'मोबाइल फ़ोन *' },
  '10-Digit Mobile Number': { te: '10 అంకెల మొబైల్ సంఖ్య', hi: '10 अंकों का मोबाइल नंबर' },
  'Aadhaar Number (12 Digits)': { te: 'ఆధార్ సంఖ్య (12 అంకెలు)', hi: 'आधार संख्या (12 अंक)' },
  'Aadhaar Number': { te: 'ఆధార్ సంఖ్య', hi: 'आधार संख्या' },
  '12-Digit Aadhaar or Patient UIDN': { te: '12 అంకెల ఆధార్ లేదా రోగి యూఐడీఎన్', hi: '12 अंकों का आधार या मरीज यूआईडीएन' },
  'Mandal': { te: 'మండలం', hi: 'मंडल' },
  'Village': { te: 'గ్రామం', hi: 'गांव' },
  'Village Name': { te: 'గ్రామం పేరు', hi: 'गांव का नाम' },
  'Habitation': { te: 'నివాస ప్రాంతం', hi: 'बस्ती / निवास' },
  'Habitation / Gudem': { te: 'నివాసం / గూడెం', hi: 'बस्ती / निवास' },
  'ITDA Paderu Agency Mandal *': { te: 'ఐటీడీఏ పాడేరు ఏజెన్సీ మండలం *', hi: 'आईटीडीए पाडेरू एजेंसी मंडल *' },
  'Doctor User-ID or Official Email': { te: 'డాక్టర్ యూజర్ ఐడి లేదా అధికారిక ఈమెయిల్', hi: 'डॉक्टर यूजर आईडी या आधिकारिक ईमेल' },
  'Account Password': { te: 'ఖాతా పాస్‌వర్డ్', hi: 'खाता पासवर्ड' },
  'Enter Doctor ID or Email': { te: 'డాక్టర్ ఐడి లేదా ఈమెయిల్ నమోదు చేయండి', hi: 'डॉक्टर आईडी या ईमेल दर्ज करें' },
  'Enter Password': { te: 'పాస్‌వర్డ్ నమోదు చేయండి', hi: 'पासवर्ड दर्ज करें' },
  'UIDN or Phone Number': { te: 'యూఐడీఎన్ లేదా ఫోన్ నంబర్', hi: 'यूआईडीएन या फोन नंबर' },
  'Enter 12-Digit Aadhaar': { te: '12 అంకెల ఆధార్ సంఖ్య నమోదు చేయండి', hi: '12 अंकों का आधार दर्ज करें' },
  '12-Digit Aadhaar': { te: '12-అంకెల ఆధార్', hi: '12-अंकीय आधार' },
  'Phone OTP': { te: 'ఫోన్ ఓటీపీ', hi: 'फ़ोन ओटीपी' },
  'Send OTP': { te: 'ఓటీపీ పంపండి', hi: 'ओटीपी भेजें' },
  'Enter 6-Digit OTP': { te: '6 అంకెల ఓటీపీ నమోదు చేయండి', hi: '6 अंकों का ओटीपी दर्ज करें' },
  'Verify OTP & Login': { te: 'ఓటీపీ ధృవీకరించి లాగిన్ అవ్వండి', hi: 'ओटीपी सत्यापित कर लॉगिन करें' },
  'Login with Aadhaar / UIDN': { te: 'ఆధార్ / యూఐడీఎన్ తో లాగిన్ అవ్వండి', hi: 'आधार / यूआईडीएन से लॉगिन करें' },
  'Register Citizen & Generate UIDN': { te: 'పౌరుడిని నమోదు చేసి యూఐడీఎన్ పొందండి', hi: 'नागरिक पंजीकृत करें और यूआईडीएन प्राप्त करें' },

  // Patient Dashboard Actions
  'Core Health Actions': { te: 'ప్రధాన ఆరోగ్య చర్యలు', hi: 'मुख्य स्वास्थ्य सेवाएं' },
  '1. Check Mouth Photo': { te: '1. నోటి ఫోటో పరీక్ష (AI)', hi: '1. मुख फोटो जांच (एआई)' },
  '2. Telemedicine Video Call': { te: '2. టెలిమెడిసిన్ వీడియో సంప్రదింపులు', hi: '2. टेलीमेडिसिन वीडियो परामर्श' },
  '3. Golden Health Card': { te: '3. గోల్డెన్ హెల్త్ కార్డ్', hi: '3. गोल्डन हेल्थ कार्ड' },
  '4. Habit Cessation Tracker': { te: '4. పొగాకు మాన్పు ట్రాకర్', hi: '4. आदत मुक्ति ट्रैकर' },
  'Book Appointment': { te: 'అపాయింట్‌మెంట్ బుక్ చేయండి', hi: 'अपॉइंटमेंट बुक करें' },
  'BOOK DOCTOR APPOINTMENT': { te: 'వైద్యుని అపాయింట్‌మెంట్ బుక్ చేయండి', hi: 'डॉक्टर अपॉइंटमेंट बुक करें' },
  'Request Tele-Consultation Appointment': { te: 'వీడియో సంప్రదింపుల అపాయింట్‌మెంట్ కోరండి', hi: 'वीडियो परामर्श अपॉइंटमेंट का अनुरोध करें' },
  'Join Video Call': { te: 'వీడియో కాల్‌లో చేరండి', hi: 'वीडियो कॉल से जुड़ें' },
  'Booked Doctor': { te: 'కేటాయించిన వైద్యుడు', hi: 'नियुक्त डॉक्टर' },
  'Your Booked Appointments': { te: 'మీరు బుక్ చేసిన అపాయింట్‌మెంట్‌లు', hi: 'आपके बुक किए गए अपॉइंटमेंट्स' },
  'Book Specialist Appointment': { te: 'స్పెషలిస్ట్ అపాయింట్‌మెంట్ బుక్ చేయండి', hi: 'विशेषज्ञ अपॉइंटमेंट बुक करें' },
  'My Prescriptions & Biopsy Orders': { te: 'నా ప్రిస్క్రిప్షన్‌లు & బయాప్సీ రికార్డులు', hi: 'मेरे पर्चे एवं बायोप्सी आदेश' },
  'Oral Screening Photo AI Reticle': { te: 'నోటి ఫోటో ఏఐ స్క్రీనింగ్ రెటికల్', hi: 'मुख फोटो एआई स्क्रीनिंग रेटिकल' },

  // Appointment Modal
  'Select Consultation Mode (Online or Offline)': {
    te: 'సంప్రదింపుల విధానం ఎంచుకోండి (ఆన్‌లైన్ లేదా ఆఫ్‌లైన్)',
    hi: 'परामर्श माध्यम चुनें (ऑनलाइन या ऑफ़लाइन)'
  },
  'Online Tele-Consultation': { te: 'ఆన్‌లైన్ టెలి-సంప్రదింపులు', hi: 'ऑनलाइन टेली-परामर्श' },
  'Live WebRTC Video Call with Specialist': { te: 'నిపుణులతో లైవ్ వీడియో కాల్', hi: 'विशेषज्ञ के साथ लाइव वीडियो कॉल' },
  'Offline In-Person Visit': { te: 'ఆఫ్‌లైన్ ప్రత్యక్ష పరీక్ష', hi: 'ऑफ़लाइन प्रत्यक्ष जांच' },
  'Physical OPD Visit at PHC / CHC Clinic': { te: 'ఆసుపత్రి / పీహెచ్‌సీ వద్ద ప్రత్యక్ష పరీక్ష', hi: 'अस्पताल में प्रत्यक्ष ओपीडी जांच' },
  'Appointment Category': { te: 'అపాయింట్‌మెంట్ వర్గం', hi: 'अपॉइंटमेंट श्रेणी' },
  'General Oral Consultation': { te: 'సాధారణ నోటి పరీక్ష', hi: 'सामान्य मुख जांच' },
  'Clinical Examination & Medical Rx': { te: 'వైద్య పరీక్ష & మందుల సూచన', hi: 'नैदानिक परीक्षण एवं दवाइयां' },
  'Biopsy Procedure': { te: 'బయాప్సీ ప్రక్రియ', hi: 'बायोप्सी प्रक्रिया' },
  'Biopsy Procedure Appointment': { te: 'బయాప్సీ ప్రక్రియ అపాయింట్‌మెంట్', hi: 'बायोप्सी प्रक्रिया अपॉइंटमेंट' },
  'Diagnostic 4mm Punch Biopsy': { te: 'డయాగ్నస్టిక్ 4మిమీ పంచ్ బయాప్సీ', hi: '4 मिमी पंच बायोप्सी जांच' },
  'Attending Specialist Doctor *': { te: 'హాజరయ్యే స్పెషలిస్ట్ డాక్టర్ *', hi: 'उपस्थित विशेषज्ञ डॉक्टर *' },
  'Health Facility': { te: 'ఆరోగ్య కేంద్రం / ఆసుపత్రి', hi: 'स्वास्थ्य केंद्र / अस्पताल' },
  'Appointment Date': { te: 'అపాయింట్‌మెంట్ తేదీ', hi: 'अपॉइंटमेंट तिथि' },
  'Time Slot': { te: 'సమయం స్లాట్', hi: 'समय स्लॉट' },
  'Doctor Free Slots Available': { te: 'డాక్టర్ ఖాళీ సమయ స్లాట్లు', hi: 'डॉक्टर उपलब्ध समय स्लॉट' },
  'Patient Symptoms & Consultation Purpose': { te: 'రోగి లక్షణాలు & సంప్రదింపుల కారణం', hi: 'मरीज के लक्षण और परामर्श उद्देश्य' },
  'Confirm Online Video Appointment': { te: 'ఆన్‌లైన్ వీడియో అపాయింట్‌మెంట్ నిర్ధారించండి', hi: 'ऑनलाइन वीडियो अपॉइंटमेंट पुष्टि करें' },
  'Confirm Offline In-Person Appointment': { te: 'ఆఫ్‌లైన్ ప్రత్యక్ష అపాయింట్‌మెంట్ నిర్ధారించండి', hi: 'ऑफ़लाइन प्रत्यक्ष अपॉइंटमेंट पुष्टि करें' },
  'AI Oral Screening Finding:': { te: 'ఏఐ నోటి స్క్రీనింగ్ ఫలితం:', hi: 'एआई मुख जांच परिणाम:' },
  '📹 Online Video Call': { te: '📹 ఆన్‌లైన్ వీడియో కాల్', hi: '📹 ऑनलाइन वीडियो कॉल' },
  '🏥 Offline In-Person Visit': { te: '🏥 ఆఫ్‌లైన్ ప్రత్యక్ష పరీక్ష', hi: '🏥 ऑफ़लाइन प्रत्यक्ष जांच' },
  'Report to OPD at': { te: 'ఓపీడీ వద్ద రిపోర్ట్ చేయండి:', hi: 'ओपीडी में उपस्थित हों:' },

  // Status badges
  'Approved': { te: 'ఆమోదించబడింది', hi: 'स्वीकृत' },
  'APPROVED': { te: 'ఆమోదించబడింది', hi: 'स्वीकृत' },
  'Pending': { te: 'వేచి ఉంది', hi: 'लंबित' },
  'PENDING': { te: 'వేచి ఉంది', hi: 'लंबित' },
  'Rejected': { te: 'తిరస్కరించబడింది', hi: 'अस्वीकृत' },
  'REJECTED': { te: 'తిరస్కరించబడింది', hi: 'अस्वीकृत' },
  'Completed': { te: 'పూర్తయింది', hi: 'पूर्ण' },
  'Active': { te: 'చురుకుగా ఉంది', hi: 'सक्रिय' },
  'Inactive': { te: 'సెలవులో ఉన్నారు', hi: 'निष्क्रिय' },
  'On Visit': { te: 'క్షేత్ర పర్యటనలో ఉన్నారు', hi: 'क्षेत्रीय दौरे पर' },
  'ACTIVE': { te: 'చురుకుగా ఉంది', hi: 'सक्रिय' },
  'INACTIVE': { te: 'సెలవులో ఉన్నారు', hi: 'निष्क्रिय' },
  'ON VISIT': { te: 'క్షేత్ర పర్యటనలో ఉన్నారు', hi: 'क्षेत्रीय दौरे पर' },

  // Habits & Oral AI Scan
  'Target Oral Cavity Region': { te: 'నోటి భాగం ఎంచుకోండి', hi: 'मुख गुहा का क्षेत्र चुनें' },
  'Habit Exposure Assessment': { te: 'పొగాకు / వ్యసనాల వివరాలు', hi: 'तंबाकू/व्यसन विवरण' },
  'Reverse Smoking (Adda Poga)': { te: 'అడ్డాపొగ (రివర్స్ స్మోకింగ్)', hi: 'रिवर्स स्मोकिंग (अड्डा पोगा)' },
  'Reverse Smoking (Chutta)': { te: 'అడ్డాపొగ (చుట్ట)', hi: 'रिवर्स स्मोकिंग (छुट्टा)' },
  'Chewing Tobacco': { te: 'నమిలే పొగాకు', hi: 'तंबाकू चबाना' },
  'Raw/Cured Tobacco Chewing': { te: 'నమిలే పొగాకు / ఖైనీ', hi: 'तंबाकू / खैनी चबाना' },
  'Packaged Gutkha / Areca Nut': { te: 'గుట్కా / పోకచెక్క', hi: 'गुटखा / सुपारी' },
  'Gutkha / Pan Masala': { te: 'గుట్కా / పాన్ మసాలా', hi: 'गुटखा / पान मसाला' },
  'Areca Nut': { te: 'పోకచెక్క', hi: 'सुपारी' },
  'Duration of Habit (Years)': { te: 'అలవాటు ఉన్న కాలం (సంవత్సరాలు)', hi: 'आदत की अवधि (वर्ष)' },
  'Analyze Scan with Multimodal AI': { te: 'మల్టీమోడల్ ఏఐ తో విశ్లేషించండి', hi: 'मल्टीमॉडल एआई से जांच करें' },
  'Analyzing with Gemini Onco-Model...': { te: 'ఏఐ పరిశీలిస్తోంది...', hi: 'एआई जांच जारी है...' },
  'Evaluating with AI Onco-Model...': { te: 'ఏఐ నమూనా పరిశీలిస్తోంది...', hi: 'एआई विश्लेषण जारी है...' },
  'Freeze & Capture Snapshot': { te: 'ఫోటో క్లిక్ చేయండి (Capture)', hi: 'फोटो लें (Capture)' },
  'Retake Camera Feed': { te: 'మళ్ళీ తీయండి (Retake)', hi: 'पुनः प्रयास करें (Retake)' },
  'Or Drag & Drop Oral Photo': { te: 'లేదా నోటి ఫోటోను అప్‌లోడ్ చేయండి', hi: 'या मुख का फोटो अपलोड करें' },
  'Suspicious Lesion Bounding Box': { te: 'అనుమానాస్పద మచ్చ గుర్తింపు బాక్స్', hi: 'संदिग्ध घाव पहचान बॉक्स' },
  'High Risk': { te: 'అధిక ప్రమాదం', hi: 'उच्च जोखिम' },
  'Moderate Risk': { te: 'మధ్యస్థ ప్రమాదం', hi: 'मध्यम जोखिम' },
  'Low Risk': { te: 'తక్కువ ప్రమాదం', hi: 'कम जोखिम' },
  'Normal Mucosa': { te: 'సాధారణ నోటి కణజాలం', hi: 'सामान्य मुख ऊतक' },
  'Leukoplakia': { te: 'ల్యూకోప్లాకియా (తెల్ల మచ్చ)', hi: 'ल्यूकोप्लाकिया (सफेद धब्बा)' },
  'Erythroplakia': { te: 'ఎరిథ్రోప్లాకియా (ఎరుపు మచ్చ)', hi: 'एरिथ्रोप्लाकिया (लाल धब्बा)' },
  'Oral Submucous Fibrosis (OSMF)': { te: 'ఓరల్ సబ్‌మ్యూకస్ ఫైబ్రోసిస్ (నోరు తెరవకపోవడం)', hi: 'ओरल सबम्यूकस फाइब्रोसिस' },
  'Squamous Cell Carcinoma': { te: 'స్క్వామస్ సెల్ క్యాన్సర్', hi: 'स्क्वैमस सेल कार्सिनोमा' },

  // WebRTC Telemedicine Call
  'Live WebRTC Telemedicine Consultation': { te: 'లైవ్ వెబ్‌ఆర్‌టిసి టెలిమెడిసిన్ సంప్రదింపులు', hi: 'लाइव वेबआरटीसी टेलीमेडिसिन परामर्श' },
  'CONNECTED SUCCESSFULLY • LIVE': { te: 'విజయవంతంగా అనుసంధానించబడింది • లైవ్', hi: 'सफलतापूर्वक जुड़ा • लाइव' },
  'WebRTC Telemedicine Consultation Room': { te: 'వెబ్‌ఆర్‌టిసి టెలిమెడిసిన్ కన్సల్టేషన్ రూమ్', hi: 'वेबआरटीसी टेली-परामर्श कक्ष' },
  'Encrypted Real-Time Tele-Oncology Network': { te: 'సురక్షిత రియల్-టైమ్ టెలి-ఆంకాలజీ నెట్‌వర్క్', hi: 'सुरक्षित रियल-टाइम टेली-ऑन्कोलॉजी नेटवर्क' },
  'Turn Camera Off': { te: 'కెమెరా ఆఫ్ చేయండి', hi: 'कैमरा बंद करें' },
  'Turn Camera On': { te: 'కెమెరా ఆన్ చేయండి', hi: 'कैमरा चालू करें' },
  'Mute Mic': { te: 'మైక్ మ్యూట్', hi: 'माइक म्यूट करें' },
  'Unmute Mic': { te: 'మైక్ ఆన్', hi: 'माइक चालू करें' },
  'End Consultation': { te: 'కాల్ ముగించు', hi: 'परामर्श समाप्त करें' },
  'Patient Vitals & Exposure Profile': { te: 'రోగి ఆరోగ్య వివరాలు & వ్యసనాలు', hi: 'मरीज के महत्वपूर्ण लक्षण व आदतें' },
  'Specialist Clinical Notes & Assessment': { te: 'వైద్యుని క్లినికల్ నోట్స్ & సలహాలు', hi: 'विशेषज्ञ की नैदानिक टिप्पणी' },
  'Dispense Oral Mucosal Medicines': { te: 'నోటి మందుల ప్రిస్క్రిప్షన్', hi: 'दवाइयां लिखें' },
  'Schedule Immediate 4mm Punch Biopsy': { te: '4మిమీ పంచ్ బయాప్సీ షెడ్యూల్ చేయండి', hi: '4 मिमी पंच बायोप्सी निर्धारित करें' },
  'Save e-Prescription & Barcode': { te: 'బార్‌కోడ్ ప్రిస్క్రిప్షన్ డౌన్‌లోడ్ చేయండి', hi: 'बारकोड ई-पर्चा सहेजें' },
  'Apply AI Findings into Specialist Notes': { te: 'ఏఐ ఫలితాలను ప్రిస్క్రిప్షన్‌లో చేర్చండి', hi: 'एआई निष्कर्षों को पर्चे में जोड़ें' },
  'Waiting for peer to connect...': { te: 'అవతలి వ్యక్తి కలవడానికి వేచి ఉంది...', hi: 'अन्य पक्ष के जुड़ने की प्रतीक्षा...' },

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
  'Start Call': { te: 'వీడియో కాల్ ప్రారంభించండి', hi: 'वीडियो कॉल शुरू करें' },
  'Doctor Availability Slots Manager': { te: 'వైద్యుల అందుబాటు సమయ స్లాట్లు', hi: 'डॉक्टर उपलब्धता समय स्लॉट' },

  // Admin Portal & 11 Mandals
  'Admin Workspace': { te: 'అడ్మిన్ వర్క్‌స్పేస్', hi: 'व्यवस्थापक कार्यक्षेत्र' },
  '11 Mandals Healthcare Command & Registry Portal': {
    te: '11 మండలాల ఆరోగ్య నియంత్రణ & రిజిస్ట్రీ పోర్టల్',
    hi: '11 मंडल स्वास्थ्य नियंत्रण एवं रजिस्ट्री पोर्टल'
  },
  '11 Mandals Health Facilities Directory': { te: '11 మండలాల ఆరోగ్య కేంద్రాల డైరెక్టరీ', hi: '11 मंडल स्वास्थ्य केंद्र निर्देशिका' },
  'Doctors Roster & Login Credentials': { te: 'వైద్యుల జాబితా & లాగిన్ వివరాలు', hi: 'डॉक्टर सूची व लॉगिन विवरण' },
  'Generate Doctor Credentials': { te: 'కొత్త డాక్టర్ ఖాతా & పాస్‌వర్డ్ సృష్టించండి', hi: 'नया डॉक्टर खाता बनाएं' },
  '+ Add Specialist Doctor': { te: '+ కొత్త స్పెషలిస్ట్ డాక్టర్‌ను చేర్చండి', hi: '+ नया विशेषज्ञ डॉक्टर जोड़ें' },
  'Edit Doctor Details': { te: 'వైద్యుని వివరాలు సవరించండి', hi: 'डॉक्टर विवरण संपादित करें' },
  'Save Doctor Changes': { te: 'మార్పులను భద్రపరచండి', hi: 'परिवर्तन सहेजें' },
  'Registered Doctors': { te: 'నమోదైన వైద్యులు', hi: 'पंजीकृत डॉक्टर' },
  'Active on Duty': { te: 'టెలి-డ్యూటీలో ఉన్నవారు', hi: 'टेली-ड्यूटी पर सक्रिय' },
  'On Tribal Field Visit': { te: 'గిరిజన ప్రాంత పర్యటనలో ఉన్నవారు', hi: 'जनजातीय दौरे पर' },
  'Off-Duty / Inactive': { te: 'సెలవులో ఉన్నవారు', hi: 'अवकाश पर / निष्क्रिय' },
  'Biopsy Punch Kits': { te: 'బయాప్సీ పంచ్ కిట్లు', hi: 'बायोप्सी पंच किट' },
  'Active Tribal Cases': { te: 'చికిత్స పొందుతున్న గిరిజన రోగులు', hi: 'उपचाराधीन जनजातीय मामले' },
  '11 Mandals Network': { te: '11 మండలాల నెట్‌వర్క్', hi: '11 मंडल नेटवर्क' },

  // 11 Mandals Names
  'Paderu HQ': { te: 'పాడేరు హెచ్‌క్యూ', hi: 'पाडेरू मुख्यालय' },
  'Paderu': { te: 'పాడేరు', hi: 'पाडेरू' },
  'Araku Valley': { te: 'అరకు లోయ', hi: 'अरकु घाटी' },
  'Araku': { te: 'అరకు', hi: 'अरकु' },
  'Chintapalle': { te: 'చింతపల్లి', hi: 'चिंतापल्ली' },
  'Chintapalli': { te: 'చింతపల్లి', hi: 'चिंतापल्ली' },
  'G. Madugula': { te: 'జి. మాడుగుల', hi: 'जी. माडुगुला' },
  'Ananthagiri': { te: 'అనంతగిరి', hi: 'अनंतगिरि' },
  'Dumbriguda': { te: 'డుంబ్రిగుడ', hi: 'डुंब्रिगुड़ा' },
  'Hukumpeta': { te: 'హుకుంపేట', hi: 'हुकुंपेटा' },
  'G.K. Veedhi': { te: 'జి.కె. వీధి', hi: 'जी.के. वीधि' },
  'Koyyuru': { te: 'కొయ్యూరు', hi: 'कोय्यूर' },
  'Munchingiputtu': { te: 'ముంచింగిపుట్టు', hi: 'मुंचिंगिपट्टू' },
  'Pedabayalu': { te: 'పెదబయలు', hi: 'पेदाबायलू' },

  // AI Aarohi Bot Actions
  'Point & Explain': { te: 'పాయింట్ & వివరణ', hi: 'पॉइंट व व्याख्या' },
  'Inspecting...': { te: 'పరిశీలిస్తోంది...', hi: 'जांच जारी...' },
  '🤸‍♀️ Wind Wheel': { te: '🤸‍♀️ గాలి చక్రం', hi: '🤸‍♀️ पवन चक्र' },
  'Stop Voice ⏹️': { te: 'వాయిస్ ఆపు ⏹️', hi: 'आवाज रोकें ⏹️' },
  'Stop Voice': { te: 'వాయిస్ ఆపు', hi: 'आवाज रोकें' },
  'Stop': { te: 'ఆపు', hi: 'रोकें' }
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

// Global WeakMaps to store pristine original English content
const textNodeOriginals = new WeakMap<Node, string>();
const elementPlaceholderOriginals = new WeakMap<Element, string>();
const elementTitleOriginals = new WeakMap<Element, string>();

// Sorted dictionary keys by length descending to match full phrases before individual words
const sortedKeys = Object.keys(dictionary).sort((a, b) => b.length - a.length);

// Concurrency flag to prevent recursive MutationObserver loops
let isTranslating = false;

/**
 * Traverses DOM nodes and dynamically translates visible text, placeholders, and titles.
 * Guarantees instantaneous conversion without reloading the page.
 */
export function applyDOMTranslation(root: HTMLElement, lang: Language) {
  if (!root || isTranslating) return;

  try {
    isTranslating = true;

    // 1. Walk Text Nodes
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
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

        // Check exact match first
        if (dictionary[trimmed] && dictionary[trimmed][lang]) {
          translated = original.replace(trimmed, dictionary[trimmed][lang]);
        } else {
          // Check sorted multi-word phrases
          for (const phrase of sortedKeys) {
            if (phrase.length > 2 && translated.includes(phrase)) {
              const repl = dictionary[phrase][lang];
              if (repl) {
                translated = translated.split(phrase).join(repl);
              }
            }
          }
        }

        if (translated !== currentNode.nodeValue) {
          nodesToUpdate.push({ node: currentNode, newText: translated });
        }
      }

      currentNode = walker.nextNode();
    }

    // Apply batch updates
    for (const { node, newText } of nodesToUpdate) {
      node.nodeValue = newText;
    }

    // 2. Input/Textarea Placeholders Translation
    const inputs = root.querySelectorAll('input[placeholder], textarea[placeholder]');
    inputs.forEach((el) => {
      const inputEl = el as HTMLInputElement | HTMLTextAreaElement;
      let original = elementPlaceholderOriginals.get(inputEl);
      if (!original) {
        original = inputEl.placeholder;
        elementPlaceholderOriginals.set(inputEl, original);
      }

      if (lang === 'en') {
        inputEl.placeholder = original;
      } else {
        const trimmed = original.trim();
        if (dictionary[trimmed] && dictionary[trimmed][lang]) {
          inputEl.placeholder = dictionary[trimmed][lang];
        } else {
          let translated = original;
          for (const phrase of sortedKeys) {
            if (translated.includes(phrase)) {
              translated = translated.split(phrase).join(dictionary[phrase][lang]);
            }
          }
          inputEl.placeholder = translated;
        }
      }
    });

    // 3. Titles / Tooltips Translation
    const titled = root.querySelectorAll('[title]');
    titled.forEach((el) => {
      let original = elementTitleOriginals.get(el);
      if (!original) {
        original = el.getAttribute('title') || '';
        elementTitleOriginals.set(el, original);
      }

      if (lang === 'en') {
        el.setAttribute('title', original);
      } else {
        const trimmed = original.trim();
        if (dictionary[trimmed] && dictionary[trimmed][lang]) {
          el.setAttribute('title', dictionary[trimmed][lang]);
        } else {
          let translated = original;
          for (const phrase of sortedKeys) {
            if (translated.includes(phrase)) {
              translated = translated.split(phrase).join(dictionary[phrase][lang]);
            }
          }
          el.setAttribute('title', translated);
        }
      }
    });
  } finally {
    isTranslating = false;
  }
}
