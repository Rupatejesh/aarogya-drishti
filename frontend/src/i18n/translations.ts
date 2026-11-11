export type Language = 'en' | 'te' | 'hi';

export interface Translations {
  appName: string;
  pillBadge: string;
  subtitle: string;
  onlineSync: string;
  offlineDrafts: string;
  emergencySos: string;
  dispatchAmbulance: string;
  rolePatient: string;
  roleDoctor: string;
  roleAdmin: string;
  aiArogyaLauncher: string;
  heroBadge: string;
  heroHeading: string;
  heroHighlight: string;
  heroDescription: string;
  startScreening: string;
  openTelemedicine: string;
  explore11Mandals: string;
  biomarkerTitle: string;
  biomarkerSubtitle: string;
  dragToRotate: string;
  patientRosterTitle: string;
  patientRosterSubtitle: string;
  quickLoginPrompt: string;
  authenticatedAs: string;
  ageYears: string;
  mandal: string;
  phone: string;
  aadhar: string;
  condition: string;
  confidence: string;
  recommendation: string;
  teleConsultation: string;
  startCall: string;
  cameraTitle: string;
  cameraSubtitle: string;
  freezeCapture: string;
  retake: string;
  uploadPhoto: string;
  selectOralRegion: string;
  habitsExposure: string;
  reverseSmoking: string;
  tobaccoChewing: string;
  gutkhaAreca: string;
  yearsOfHabit: string;
  analyzeWithAi: string;
  analyzingWithGemini: string;
  suspiciousLesionArea: string;
  telemedicineRoomTitle: string;
  connectingP2P: string;
  muteMic: string;
  unmuteMic: string;
  cameraOff: string;
  cameraOn: string;
  endCall: string;
  patientVitals: string;
  clinicalNotes: string;
  prescribeMedicines: string;
  schedulePunchBiopsy: string;
  generatePrescription: string;
  prescriptionBarcode: string;
  mandalsGridTitle: string;
  mandalsGridSubtitle: string;
  biopsyAvailable: string;
  referralRequired: string;
  activeCases: string;
  dischargedCases: string;
  medicalOfficer: string;
  aiArogyaTitle: string;
  aiArogyaSubtitle: string;
  askQuestion: string;
  send: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'AAROGYA DRISHTI',
    pillBadge: 'AAROHAN 2026',
    subtitle: 'ITDA Paderu | Alluri Sitharama Raju District | Oral Cancer Detection & Care',
    onlineSync: 'Online Sync Active',
    offlineDrafts: 'Offline Drafts Ready',
    emergencySos: 'Tribal SOS 108/104',
    dispatchAmbulance: 'Emergency 108/104 Dispatch Active',
    rolePatient: 'Patient',
    roleDoctor: 'Doctor',
    roleAdmin: 'Admin (11 Mandals)',
    aiArogyaLauncher: 'AI AROGYA',
    heroBadge: 'Tribal Tele-Oncology Innovation',
    heroHeading: 'Saving Lives in ASR District Through',
    heroHighlight: 'Early Oral Cancer AI Detection',
    heroDescription: 'Autonomous multimodal clinical triage for high-risk tribal habits including reverse smoking and chewable tobacco. Connecting 11 Mandals of ITDA Paderu to onco-pathologists via WebRTC.',
    startScreening: 'Start Live AI Oral Screening',
    openTelemedicine: 'Launch WebRTC Tele-Consultation',
    explore11Mandals: 'Explore 11 Mandals Health Grid',
    biomarkerTitle: '3D Oral Biomarker Double Helix',
    biomarkerSubtitle: 'Molecular onco-protein surveillance (p53, EGFR, Ki-67, CD44)',
    dragToRotate: 'Click and drag mouse to rotate 360°',
    patientRosterTitle: 'Compulsory Hackathon 1-Click Patient Roster',
    patientRosterSubtitle: 'Select K. Somanna or another clinical case to authenticate instantly',
    quickLoginPrompt: 'Click any patient card for instant JWT authentication',
    authenticatedAs: 'Authenticated Patient',
    ageYears: 'Years',
    mandal: 'Mandal',
    phone: 'Phone',
    aadhar: 'Aadhar',
    condition: 'Triage Condition',
    confidence: 'AI Confidence Score',
    recommendation: 'Clinical Recommendation',
    teleConsultation: 'Tele-Oncology Consultation',
    startCall: 'Connect Live with Specialist',
    cameraTitle: 'Live Intra-Oral Optical Screening Camera',
    cameraSubtitle: 'Webcam snapshot or high-resolution intra-oral image upload with real-time AI bounding box',
    freezeCapture: 'Freeze & Capture Snapshot',
    retake: 'Retake Camera Feed',
    uploadPhoto: 'Or Drag & Drop Oral Photo',
    selectOralRegion: 'Target Oral Cavity Region',
    habitsExposure: 'Habit Exposure Assessment',
    reverseSmoking: 'Reverse Smoking (Adda Poga)',
    tobaccoChewing: 'Raw/Cured Tobacco Chewing',
    gutkhaAreca: 'Packaged Gutkha / Areca Nut',
    yearsOfHabit: 'Duration of Habit (Years)',
    analyzeWithAi: 'Analyze Scan with Multimodal Gemini AI',
    analyzingWithGemini: 'Evaluating with Gemini Onco-Model...',
    suspiciousLesionArea: 'Suspicious Lesion Bounding Box',
    telemedicineRoomTitle: 'WebRTC Tele-Oncology Consultation Room',
    connectingP2P: 'Low-latency Encrypted P2P Media Stream Active',
    muteMic: 'Mute Mic',
    unmuteMic: 'Unmute Mic',
    cameraOff: 'Turn Camera Off',
    cameraOn: 'Turn Camera On',
    endCall: 'End Consultation',
    patientVitals: 'Patient Vitals & Exposure Profile',
    clinicalNotes: 'Specialist Clinical Notes & Assessment',
    prescribeMedicines: 'Dispense Oral Mucosal Medicines',
    schedulePunchBiopsy: 'Schedule Immediate 4mm Punch Biopsy',
    generatePrescription: 'Save e-Prescription & Barcode',
    prescriptionBarcode: 'Verified Barcode Identifier',
    mandalsGridTitle: '11 Mandals Health Facilities & Biopsy Grid',
    mandalsGridSubtitle: 'Alluri Sitharama Raju District ITDA Paderu Healthcare Infrastructure',
    biopsyAvailable: 'Biopsy Available',
    referralRequired: 'Referral Required',
    activeCases: 'Active Case Sheets',
    dischargedCases: 'Discharged Cases',
    medicalOfficer: 'MO in Charge',
    aiArogyaTitle: 'AI Arogya Clinical Assistant',
    aiArogyaSubtitle: 'Bilingual AI guidance for tribal oral health and habit cessation',
    askQuestion: 'Ask in Telugu, English or Hindi...',
    send: 'Send'
  },
  te: {
    appName: 'ఆరోగ్య దృష్టి',
    pillBadge: 'ఆరోహణ 2026',
    subtitle: 'ఐ.టి.డి.ఎ పాడేరు | అల్లూరి సీతారామరాజు జిల్లా | నోటి క్యాన్సర్ ప్రారంభ నిర్ధారణ & సంరక్షణ',
    onlineSync: 'లైవ్ ఆన్‌లైన్ సమకాలీకరణ చురుకుగా ఉంది',
    offlineDrafts: 'ఆఫ్‌లైన్ డ్రాఫ్ట్‌లు సిద్ధంగా ఉన్నాయి',
    emergencySos: 'గిరిజన అత్యవసర 108/104 SOS',
    dispatchAmbulance: 'అత్యవసర 108/104 అంబులెన్స్ సిద్ధంగా ఉంది',
    rolePatient: 'రోగి (Patient)',
    roleDoctor: 'వైద్యుడు (Doctor)',
    roleAdmin: 'అడ్మిన్ (11 మండలాలు)',
    aiArogyaLauncher: 'ఏఐ ఆరోగ్యా (AI AROGYA)',
    heroBadge: 'గిరిజన టెలి-ఆంకాలజీ ఆవిష్కరణ',
    heroHeading: 'అల్లూరి జిల్లా ప్రజల ప్రాణరక్షణ కోసం',
    heroHighlight: 'ఆర్టిఫిషియల్ ఇంటెలిజెన్స్ నోటి క్యాన్సర్ స్క్రీనింగ్',
    heroDescription: 'అడ్డాపొగ (రివర్స్ స్మోకింగ్), ఖైనీ, పొగాకు అలవాట్లు ఉన్న గిరిజన ప్రాంత ప్రజల కోసం పాడేరు ఐటిడిఎ 11 మండలాల ఆరోగ్య కేంద్రాలను నిపుణులైన క్యాన్సర్ వైద్యులతో అనుసంధానించే వ్యవస్థ.',
    startScreening: 'లైవ్ ఏఐ నోటి స్క్రీనింగ్ ప్రారంభించండి',
    openTelemedicine: 'వెబ్‌ఆర్‌టిసి టెలి-కన్సల్టేషన్ ప్రారంభించండి',
    explore11Mandals: '11 మండలాల ఆసుపత్రుల నెట్‌వర్క్ చూడండి',
    biomarkerTitle: '3D నోటి బయోమార్కర్ డబుల్ హెలిక్స్',
    biomarkerSubtitle: 'కణజాల మార్పుల అధ్యయనం (p53, EGFR, Ki-67, CD44)',
    dragToRotate: 'మౌస్‌తో 360 డిగ్రీలు తిప్పండి',
    patientRosterTitle: 'హ్యాకథాన్ రోగుల రోస్టర్ (1-క్లిక్ లాగిన్)',
    patientRosterSubtitle: 'కే. సోమన్న లేదా ఇతర రోగుల కార్డుపై క్లిక్ చేసి వెంటనే లాగిన్ అవ్వండి',
    quickLoginPrompt: 'వెంటనే లాగిన్ కావడానికి ఏదైనా కార్డును ఎంచుకోండి',
    authenticatedAs: 'ధృవీకరించబడిన రోగి',
    ageYears: 'సంవత్సరాలు',
    mandal: 'మండలం',
    phone: 'ఫోన్ నంబర్',
    aadhar: 'ఆధార్',
    condition: 'నిర్ధారణ స్థితి',
    confidence: 'ఏఐ ఖచ్చితత్వం',
    recommendation: 'వైద్యుని సిఫార్సు',
    teleConsultation: 'టెలి-ఆంకాలజీ వీడియో సంప్రదింపులు',
    startCall: 'వైద్యునితో లైవ్ వీడియో ప్రారంభించండి',
    cameraTitle: 'లైవ్ నోటి పరీక్ష కెమెరా (Oral Camera)',
    cameraSubtitle: 'వెబ్‌క్యామ్ ద్వారా ఫోటో తీయండి లేదా ఫోటో అప్‌లోడ్ చేసి క్షణాల్లో ఏఐ ఫలితం పొందండి',
    freezeCapture: 'ఫోటో క్లిక్ చేయండి (Capture)',
    retake: 'మళ్ళీ తీయండి (Retake)',
    uploadPhoto: 'లేదా నోటి ఫోటోను అప్‌లోడ్ చేయండి',
    selectOralRegion: 'నోటి భాగం ఎంచుకోండి',
    habitsExposure: 'పొగాకు / అలవాట్ల వివరాలు',
    reverseSmoking: 'అడ్డాపొగ (రివర్స్ స్మోకింగ్)',
    tobaccoChewing: 'నమిలే పొగాకు / ఖైనీ',
    gutkhaAreca: 'గుట్కా / పోకచెక్క',
    yearsOfHabit: 'అలవాటు ఉన్న సంవత్సరాలు',
    analyzeWithAi: 'జెమినీ ఏఐ తో విశ్లేషించండి',
    analyzingWithGemini: 'ఏఐ పరిశీలిస్తోంది...',
    suspiciousLesionArea: 'అనుమానాస్పద మచ్చ గుర్తింపు బాక్స్',
    telemedicineRoomTitle: 'వెబ్‌ఆర్‌టిసి టెలిమెడిసిన్ కన్సల్టేషన్ రూమ్',
    connectingP2P: 'ఎన్‌క్రిప్టెడ్ వీడియో సంభాషణ చురుకుగా ఉంది',
    muteMic: 'మైక్ మ్యూట్',
    unmuteMic: 'మైక్ ఆన్',
    cameraOff: 'కెమెరా ఆఫ్',
    cameraOn: 'కెమెరా ఆన్',
    endCall: 'కాల్ ముగించు',
    patientVitals: 'రోగి ఆరోగ్య వివరాలు',
    clinicalNotes: 'వైద్యుని నోట్స్ & సలహాలు',
    prescribeMedicines: 'మందుల ప్రిస్క్రిప్షన్',
    schedulePunchBiopsy: 'పంచ్ బయాప్సీ షెడ్యూల్ చేయండి',
    generatePrescription: 'బార్‌కోడ్ ప్రిస్క్రిప్షన్ డౌన్‌లోడ్ చేయండి',
    prescriptionBarcode: 'ధృవీకరించబడిన బార్‌కోడ్ ఐడి',
    mandalsGridTitle: 'అల్లూరి జిల్లా 11 మండలాల ఆసుపత్రుల నెట్‌వర్క్',
    mandalsGridSubtitle: 'పాడేరు, అరకు, చింతపల్లి, జి.మాడుగుల సహా 11 మండలాల ఆరోగ్య సేవలు',
    biopsyAvailable: 'బయాప్సీ సౌకర్యం ఉంది',
    referralRequired: 'రిఫరల్ అవసరం',
    activeCases: 'చికిత్స పొందుతున్న కేసులు',
    dischargedCases: 'కోలుకున్న రోగులు',
    medicalOfficer: 'వైద్యాధికారి (MO)',
    aiArogyaTitle: 'ఏఐ ఆరోగ్యా సహాయకుడు (AI Arogya)',
    aiArogyaSubtitle: 'నోటి క్యాన్సర్ మరియు అలవాట్ల మాన్పుపై గిరిజన భాషా సహాయం',
    askQuestion: 'తెలుగు లేదా ఇంగ్లీషులో ప్రశ్న అడగండి...',
    send: 'పంపు'
  },
  hi: {
    appName: 'आरोग्य दृष्टि',
    pillBadge: 'आरोहण 2026',
    subtitle: 'आईटीडीए पाडेरू | अल्लूरी सीताराम राजू जिला | मुख कैंसर प्रारंभिक जांच और देखभाल',
    onlineSync: 'ऑनलाइन सिंक सक्रिय',
    offlineDrafts: 'ऑफ़लाइन ड्राफ्ट तैयार',
    emergencySos: 'जनजातीय आपातकालीन 108/104 एसओएस',
    dispatchAmbulance: 'आपातकालीन 108/104 एम्बुलेंस सेवा सक्रिय',
    rolePatient: 'मरीज (Patient)',
    roleDoctor: 'चिकित्सक (Doctor)',
    roleAdmin: 'व्यवस्थापक (11 मंडल)',
    aiArogyaLauncher: 'एआई आरोग्या (AI AROGYA)',
    heroBadge: 'जनजातीय टेली-ऑन्कोलॉजी नवाचार',
    heroHeading: 'अल्लूरी जिले में जीवन रक्षा हेतु',
    heroHighlight: 'प्रारंभिक मुख कैंसर एआई जांच',
    heroDescription: 'रिवर्स स्मोकिंग और तंबाकू सेवन जैसी आदतों के लिए मल्टीमॉडल एआई द्वारा प्रारंभिक जांच। आईटीडीए पाडेरू के 11 मंडलों को कैंसर विशेषज्ञों से जोड़ना।',
    startScreening: 'लाइव एआई मुख जांच शुरू करें',
    openTelemedicine: 'वेबआरटीसी टेली-परामर्श शुरू करें',
    explore11Mandals: '11 मंडलों का स्वास्थ्य ग्रिड देखें',
    biomarkerTitle: '3डी ओरल बायोमार्कर डबल हेलिक्स',
    biomarkerSubtitle: 'आणविक ऑन्को-प्रोटीन निगरानी (p53, EGFR, Ki-67, CD44)',
    dragToRotate: '360° घुमाने के लिए माउस ड्रैग करें',
    patientRosterTitle: 'हैकथॉन मरीज रोस्टर (1-क्लिक लॉगिन)',
    patientRosterSubtitle: 'तुरंत लॉगिन करने के लिए के. सोमन्ना या अन्य मरीज का चयन करें',
    quickLoginPrompt: 'त्वरित प्रमाणीकरण हेतु कार्ड पर क्लिक करें',
    authenticatedAs: 'प्रमाणित मरीज',
    ageYears: 'वर्ष',
    mandal: 'मंडल',
    phone: 'फोन',
    aadhar: 'आधार',
    condition: 'ट्राइएज स्थिति',
    confidence: 'एआई सटीकता स्कोर',
    recommendation: 'नैदानिक सिफारिश',
    teleConsultation: 'टेली-ऑन्कोलॉजी परामर्श',
    startCall: 'विशेषज्ञ से लाइव वीडियो कनेक्ट करें',
    cameraTitle: 'लाइव मुख जांच कैमरा (Oral Camera)',
    cameraSubtitle: 'वेबकैम कैप्चर या फोटो अपलोड के साथ रियल-टाइम एआई विश्लेषण',
    freezeCapture: 'फोटो लें (Capture)',
    retake: 'पुनः प्रयास करें (Retake)',
    uploadPhoto: 'या मुख का फोटो अपलोड करें',
    selectOralRegion: 'मुख गुहा का क्षेत्र चुनें',
    habitsExposure: 'तंबाकू/व्यसन विवरण',
    reverseSmoking: 'रिवर्स स्मोकिंग (अड्डा पोगा)',
    tobaccoChewing: 'तंबाकू / खैनी चबाना',
    gutkhaAreca: 'गुटखा / सुपारी',
    yearsOfHabit: 'आदत की अवधि (वर्ष)',
    analyzeWithAi: 'जेमिनी एआई से विश्लेषण करें',
    analyzingWithGemini: 'एआई विश्लेषण जारी है...',
    suspiciousLesionArea: 'संदिग्ध घाव पहचान बॉक्स',
    telemedicineRoomTitle: 'वेबआरटीसी टेली-ऑन्कोलॉजी परामर्श कक्ष',
    connectingP2P: 'सुरक्षित पीयर-टू-पीयर वीडियो स्ट्रीम सक्रिय',
    muteMic: 'माइक म्यूट करें',
    unmuteMic: 'माइक चालू करें',
    cameraOff: 'कैमरा बंद करें',
    cameraOn: 'कैमरा चालू करें',
    endCall: 'परामर्श समाप्त करें',
    patientVitals: 'मरीज के महत्वपूर्ण लक्षण व आदतें',
    clinicalNotes: 'विशेषज्ञ की नैदानिक टिप्पणी',
    prescribeMedicines: 'दवाइयाँ लिखें',
    schedulePunchBiopsy: '4 मिमी पंच बायोप्सी निर्धारित करें',
    generatePrescription: 'बारकोड ई-पर्चा सहेजें',
    prescriptionBarcode: 'सत्यापित बारकोड पहचानकर्ता',
    mandalsGridTitle: '11 मंडल स्वास्थ्य केंद्र व बायोप्सी ग्रिड',
    mandalsGridSubtitle: 'अल्लूरी सीताराम राजू जिला आईटीडीए पाडेरू स्वास्थ्य ढांचा',
    biopsyAvailable: 'बायोप्सी उपलब्ध',
    referralRequired: 'रेफरल आवश्यक',
    activeCases: 'सक्रिय मामले',
    dischargedCases: 'स्वस्थ हुए मरीज',
    medicalOfficer: 'प्रभारी चिकित्सा अधिकारी',
    aiArogyaTitle: 'एआई आरोग्या नैदानिक सहायक',
    aiArogyaSubtitle: 'मुख स्वास्थ्य एवं व्यसन मुक्ति हेतु द्विभाषी एआई परामर्श',
    askQuestion: 'हिंदी, तेलुगु या अंग्रेजी में प्रश्न पूछें...',
    send: 'भेजें'
  }
};

