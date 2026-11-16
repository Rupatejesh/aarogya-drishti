import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Flame,
  Search,
  Volume2,
  VolumeX,
  Square,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Info,
  ChevronRight,
  ExternalLink,
  HeartPulse,
  Activity
} from 'lucide-react';
import { Language } from '../i18n/translations.ts';

interface OralCancerAwarenessSectionProps {
  lang: Language;
  onOpenScreening?: () => void;
  onOpenAppointment?: () => void;
}

export const OralCancerAwarenessSection: React.FC<OralCancerAwarenessSectionProps> = ({
  lang,
  onOpenScreening,
  onOpenAppointment
}) => {
  const [activeSpeakingCardId, setActiveSpeakingCardId] = useState<string | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      stopSpeaking();
    };
  }, []);

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    setActiveSpeakingCardId(null);
  };

  const handleSpeak = (cardId: string, textToSpeak: string) => {
    if (activeSpeakingCardId === cardId) {
      stopSpeaking();
      return;
    }

    stopSpeaking();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      setActiveSpeakingCardId(cardId);
      const cleanText = textToSpeak.replace(/[#*`_~\[\]()•📍❓🤸‍♀️⏹️🎙️🔊\n]/g, ' ').replace(/\s+/g, ' ').trim();
      const sentences = cleanText.split(/(?<=[.!?।])\s+/).filter(Boolean);

      const voices = window.speechSynthesis.getVoices();
      let targetVoice: SpeechSynthesisVoice | undefined;

      if (lang === 'te') {
        targetVoice = voices.find((v) => v.lang.includes('te') || v.name.toLowerCase().includes('telugu'));
      } else if (lang === 'hi') {
        targetVoice = voices.find((v) => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi'));
      } else {
        targetVoice = voices.find(
          (v) => (v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en')) &&
                 (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('google'))
        );
      }

      let idx = 0;
      const playNext = () => {
        if (idx >= sentences.length) {
          setActiveSpeakingCardId(null);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(sentences[idx]);
        utterance.lang = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
        if (targetVoice) utterance.voice = targetVoice;
        utterance.rate = 0.95;
        utterance.pitch = 1.05;

        utterance.onend = () => {
          idx++;
          playNext();
        };

        utterance.onerror = () => {
          idx++;
          playNext();
        };

        window.speechSynthesis.speak(utterance);
      };

      playNext();
    } catch (e) {
      setActiveSpeakingCardId(null);
    }
  };

  const awarenessCards = [
    {
      id: 'warning-signs',
      badgeColor: 'bg-red-50 text-red-800 border-red-200',
      badgeIcon: AlertTriangle,
      iconColor: 'bg-red-600 text-white',
      badgeTitle: {
        en: 'EARLY WARNING SIGNS',
        te: 'ముందస్తు హెచ్చరిక సంకేతాలు',
        hi: 'प्रारंभिक चेतावनी संकेत'
      },
      title: {
        en: '4 Critical Oral Signs to Never Ignore',
        te: 'ఎన్నడూ నిర్లక్ష్యం చేయకూడని 4 ముఖ్య సంకేతాలు',
        hi: 'कदापि नजरअंदाज न किए जाने वाले 4 मुख्य लक्षण'
      },
      bullets: [
        {
          en: 'Ulcers lasting > 2 weeks: Persistent sores that do not heal with ordinary ointments.',
          te: '2 వారాలకు మించి తగ్గని పుండ్లు: సాధారణ మందులతో మానని నోటి పుండ్లు లేదా అల్సర్లు.',
          hi: '2 सप्ताह से अधिक पुराने छाले: साधारण दवाओं से ठीक न होने वाले लगातार घाव।'
        },
        {
          en: 'White or Red Patches: Non-scrapable white (Leukoplakia) or velvety red (Erythroplakia) patches on cheeks or tongue.',
          te: 'తెల్లటి లేదా ఎర్రటి మచ్చలు: గీకినా పోని తెల్లటి (ల్యూకోప్లాకియా) లేదా ఎర్రటి (ఎరిత్రోప్లాకియా) మచ్చలు.',
          hi: 'सफेद या लाल धब्बे: खुरचने पर न हटने वाले सफेद (ल्यूकोप्लाकिया) या मखमली लाल धब्बे।'
        },
        {
          en: '3-Finger Restricted Opening: Difficulty inserting 3 fingers vertically due to stiff cheeks (OSMF).',
          te: '3 వేళ్ళు పట్టకపోవడం: బుగ్గలు బిగుసుకుపోయి నోరు పూర్తిగా తెరవలేకపోవడం (OSMF సంకేతం).',
          hi: 'मुंह का कम खुलना: गालों के कड़ेपन के कारण 3 उंगलियां लंबवत न जाना (OSMF का संकेत)।'
        },
        {
          en: 'Severe Burning & Neck Lumps: Burning sensation with spicy foods, difficulty swallowing, or painless neck swelling.',
          te: 'కారం తిన్నప్పుడు తీవ్ర మంట & గడ్డలు: కారంతో నోరు మంట, ఆహారం మింగడంలో ఇబ్బంది లేదా మెడలో గడ్డలు.',
          hi: 'तीखे भोजन से तेज जलन व गांठें: मिर्च-मसाले से जलन, निगलने में कठिनाई या गर्दन में सूजन।'
        }
      ],
      listenText: {
        en: 'Oral cancer early warning signs: Ulcers lasting more than 2 weeks that do not heal. White or red non-scrapable patches on cheeks or tongue. Restricted mouth opening where you cannot insert three fingers. Severe burning sensation with spicy food or difficulty swallowing. Please book a free screening immediately.',
        te: 'నోటి క్యాన్సర్ ముందస్తు హెచ్చరిక సంకేతాలు: రెండు వారాలకు మించి తగ్గని నోటి పుండ్లు. బుగ్గలు లేదా నాలుకపై గీకినా పోని తెల్లటి లేదా ఎర్రటి మచ్చలు. నోరు పూర్తిగా తెరవలేకపోవడం మరియు మూడు వేళ్ళు పట్టకపోవడం. కారంతో తీవ్రమైన మంట లేదా మింగడంలో ఇబ్బంది. వెంటనే ఉచిత పరీక్ష చేయించుకోండి.',
        hi: 'मुख कैंसर के शुरुआती लक्षण: दो सप्ताह से अधिक पुराने न भरने वाले छाले। गालों या जीभ पर सफेद या लाल धब्बे। मुंह का कम खुलना जिसमें तीन उंगलियां न जा सकें। तीखा खाने पर तेज जलन या निगलने में दर्द। तुरंत निःशुल्क जांच करवाएं।'
      },
      actionText: {
        en: 'Scan Mouth Now',
        te: 'ఇప్పుడే నోటి ఫోటో తీయండి',
        hi: 'अभी मुख की जांच करें'
      },
      action: onOpenScreening
    },
    {
      id: 'tribal-habits',
      badgeColor: 'bg-amber-50 text-amber-900 border-amber-200',
      badgeIcon: Flame,
      iconColor: 'bg-amber-600 text-white',
      badgeTitle: {
        en: 'TRIBAL RISK HABITS & ADDA POGA',
        te: 'ప్రమాదకర అలవాట్లు & అడ్డాపొగ',
        hi: 'जोखिम भरे व्यसन व अड्डा पोगा'
      },
      title: {
        en: 'Why Reverse Smoking Raises Cancer 14x',
        te: 'అడ్డాపొగ వల్ల క్యాన్సర్ ముప్పు 14 రెట్లు ఎందుకు ఎక్కువ?',
        hi: 'उलटा धूम्रपान से कैंसर का खतरा 14 गुना क्यों?'
      },
      bullets: [
        {
          en: 'Adda Poga (Reverse Smoking): Holding the burning end of cigars inside the oral cavity generates temperatures above 58°C, cooking the palatal tissues.',
          te: 'అడ్డాపొగ (రివర్స్ స్మోకింగ్): చుట్ట వెలిగించిన కొనను నోటిలో పెట్టుకుని తాగడం వల్ల 58 డిగ్రీల తీవ్ర వేడి పుట్టి అంగిలి కణజాలం కాలిపోతుంది.',
          hi: 'अड्डा पोगा (उलटा धूम्रपान): जलते हुए सिरे को मुंह में रखकर पीने से 58 डिग्री से अधिक गर्मी तालु को जला देती है।'
        },
        {
          en: '14-Fold Cancer Surge: Direct thermal burn coupled with concentrated tobacco tar triggers rapid malignant palatal transformations.',
          te: '14 రెట్ల క్యాన్సర్ ప్రమాదం: విపరీతమైన వేడి మరియు పొగాకు విష రసాయనాలు కలిసి అంగిలి క్యాన్సర్‌కు ప్రధాన కారణమవుతాయి.',
          hi: '14 गुना अधिक जोखिम: तेज गर्मी और तंबाकू के विषैले तत्व मिलकर तालु के कैंसर को तेजी से जन्म देते हैं।'
        },
        {
          en: 'Chewable Khaini & Gutkha: Keeping tobacco quids against the buccal mucosa causes continuous chemical erosion and OSMF fibrotic bands.',
          te: 'ఖైనీ & గుట్కా నమలడం: బుగ్గల వద్ద పొగాకు ముద్దను ఎక్కువసేపు ఉంచడం వల్ల కణజాలం గట్టిపడి నోరు బిగుసుకుపోతుంది.',
          hi: 'खैनी व गुटखा दबाना: गाल के पास तंबाकू रखने से कोशिकाएं नष्ट होती हैं और मुंह का खुलना बंद हो जाता है।'
        },
        {
          en: 'Mucosal Recovery is Possible: Quitting tobacco today initiates mucosal healing within 14 days. Start your cessation journey with our Habit Tracker.',
          te: 'తిరిగి కోలుకోవడం సాధ్యమే: అలవాటు మానేసిన 14 రోజుల్లోనే నోటి కణజాలం కోలుకోవడం ప్రారంభమవుతుంది. మా ట్రాకర్‌తో అలవాటు మానండి.',
          hi: 'सुधार पूरी तरह संभव है: तंबाकू छोड़ने के 14 दिनों के भीतर ही मुंह के घाव ठीक होने लगते हैं। आज ही आदत छोड़ें।'
        }
      ],
      listenText: {
        en: 'Adda Poga or reverse smoking involves holding the lighted end of cigars inside the mouth. It generates heat over 58 degrees Celsius and raises palatal cancer risk fourteen-fold! Chewable khaini and gutkha also erode mouth tissues. Stop today to allow your oral lining to heal.',
        te: 'అడ్డాపొగ తాగడం వల్ల నోటి లోపల 58 డిగ్రీలకు పైగా విపరీతమైన వేడి పుడుతుంది. దీనివల్ల సాధారణం కంటే అంగిలి క్యాన్సర్ వచ్చే ప్రమాదం 14 రెట్లు ఎక్కువ! ఖైనీ, గుట్కా నోటి కణజాలాన్ని పాడుచేస్తాయి. ఈ రోజే అలవాటు మానుకోండి, మీ నోరు ఆరోగ్యంగా మారుతుంది.',
        hi: 'अड्डा पोगा में जलती चट्टा को मुंह में रखकर पीने से 58 डिग्री से अधिक गर्मी पैदा होती है जो तालु के कैंसर का खतरा 14 गुना बढ़ा देती है। खैनी और गुटखा भी मुंह को नुकसान पहुंचाते हैं। अपनी सेहत के लिए आज ही व्यसन छोड़ें।'
      },
      actionText: {
        en: 'Habit Counseling',
        te: 'అలవాటు మాన్పు సలహా',
        hi: 'व्यसन मुक्ति परामर्श'
      },
      action: onOpenAppointment
    },
    {
      id: 'self-exam',
      badgeColor: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      badgeIcon: Search,
      iconColor: 'bg-emerald-600 text-white',
      badgeTitle: {
        en: '2-MINUTE MOUTH SELF-CHECK',
        te: '2 నిమిషాల నోటి స్వీయ పరీక్ష',
        hi: '2-मिनट मुख स्व-जांच'
      },
      title: {
        en: 'How to Check Your Mouth in 3 Simple Steps',
        te: '3 సులభమైన దశల్లో మీ నోటిని మీరే పరీక్షించుకోండి',
        hi: '3 आसान चरणों में अपने मुंह की खुद जांच करें'
      },
      bullets: [
        {
          en: '1. Mirror & Clean Hands: Look into a mirror in good light. Pull lips outward and inspect the inner gums and cheek linings.',
          te: '1. అద్దం & శుభ్రమైన చేతులు: మంచి వెలుతురులో అద్దం ముందు నిలబడి పెదవులు, చిగుళ్ళు మరియు బుగ్గల లోపలి భాగాన్ని పరిశీలించండి.',
          hi: '1. शीशा व साफ हाथ: रोशनी में शीशे के सामने खड़े होकर होंठ, मसूड़े और भीतरी गालों की जांच करें।'
        },
        {
          en: '2. Tongue Check: Stick out your tongue and inspect both the top and lateral sides for any white or red roughness.',
          te: '2. నాలుక పరీక్ష: నాలుకను బయటకు చాచి పైభాగం మరియు పక్క అంచులను పరిశీలించండి. తెల్లటి లేదా ఎర్రటి మచ్చలు ఏవైనా ఉన్నాయా చూడండి.',
          hi: '2. जीभ की जांच: जीभ को बाहर निकालकर ऊपर और दोनों किनारों पर किसी भी खुरदरे लाल या सफेद धब्बे को देखें।'
        },
        {
          en: '3. 3-Finger Test: Try inserting three fingers vertically into your mouth. If you cannot, it indicates restricted opening (OSMF).',
          te: '3. మూడు వేళ్ళ పరీక్ష: నిలువుగా మూడు వేళ్ళను నోటి లోపలికి పెట్టడానికి ప్రయత్నించండి. పట్టకపోతే అది దవడల బిగువును (OSMF) సూచిస్తుంది.',
          hi: '3. 3-उंगली जांच: तीन उंगलियों को एक साथ सीधा मुंह में डालने का प्रयास करें। यदि न जाएं तो तुरंत डॉक्टर को दिखाएं।'
        },
        {
          en: 'Painless 4mm Punch Biopsy: If any lesion persists, a 5-minute painless biopsy under local anesthesia confirms 100% cure at your PHC.',
          te: 'నొప్పి లేని 4మి.మీ బయాప్సీ: మచ్చలు తగ్గకపోతే లోకల్ అనెస్తీషియాతో చేసే 5 నిమిషాల సులువైన బయాప్సీ ద్వారా వ్యాధిని పూర్తిగా నయం చేయవచ్చు.',
          hi: 'दर्द रहित 4 मिमी बायोप्सी: यदि कोई धब्बा न ठीक हो, तो स्थानीय एनेस्थीसिया में 5 मिनट की सुरक्षित बायोप्सी द्वारा शत-प्रतिशत इलाज संभव है।'
        }
      ],
      listenText: {
        en: 'Perform a two-minute mouth self-check: First, inspect your lips, gums, and inner cheeks in front of a mirror. Second, check both sides of your tongue for unusual patches. Third, perform the three-finger opening test. If you notice any warning signs, schedule a free consultation and painless four-millimeter punch biopsy at your nearest PHC.',
        te: 'రెండు నిమిషాల నోటి స్వీయ పరీక్ష: మొదట అద్దం ముందు మీ పెదవులు, చిగుళ్ళు, బుగ్గల లోపలి భాగాన్ని చూడండి. రెండవది నాలుక పక్క అంచులను పరిశీలించండి. మూడవది మూడు వేళ్ళతో నోరు తెరిచే పరీక్ష చేయండి. ఏవైనా అనుమానాస్పద మచ్చలు ఉంటే వెంటనే పిహెచ్‌సిలో ఉచిత పరీక్ష మరియు నొప్పి లేని బయాప్సీ చేయించుకోండి.',
        hi: 'दो मिनट में मुख स्व-जांच करें: सबसे पहले शीशे के सामने होंठ, मसूड़े और गालों के अंदरूनी हिस्से को देखें। दूसरा, जीभ के दोनों किनारों की जांच करें। तीसरा, तीन उंगली डालने का परीक्षण करें। कोई भी लक्षण दिखने पर नजदीकी स्वास्थ्य केंद्र में निःशुल्क जांच और दर्द रहित बायोप्सी करवाएं।'
      },
      actionText: {
        en: 'Book Free Biopsy Slot',
        te: 'ఉచిత బయాప్సీ స్లాట్ బుక్ చేయండి',
        hi: 'निःशुल्क बायोप्सी बुक करें'
      },
      action: onOpenAppointment
    }
  ];

  return (
    <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full text-xs font-bold text-royal-800 shadow-2xs mb-2">
            <Sparkles className="w-3.5 h-3.5 text-royal-600" />
            <span>
              {lang === 'te'
                ? 'గిరిజన ఆరోగ్య చైతన్యం • ఐటీడీఏ పాడేరు'
                : lang === 'hi'
                ? 'जनजातीय स्वास्थ्य जागरूकता • आईटीडीए पाडेरू'
                : 'TRIBAL ORAL HEALTH AWARENESS • ITDA PADERU'}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center space-x-2">
            <HeartPulse className="w-6 h-6 text-red-600" />
            <span>
              {lang === 'te'
                ? 'నోటి క్యాన్సర్ అవగాహన & ముందస్తు గుర్తింపు గైడ్'
                : lang === 'hi'
                ? 'मुख कैंसर जागरूकता एवं प्रारंभिक पहचान निर्देशिका'
                : 'Oral Cancer Awareness & Early Detection Guide'}
            </span>
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            {lang === 'te'
              ? 'అల్లూరి సీతారామరాజు జిల్లాలోని 11 మండలాల ప్రజల కోసం ప్రత్యేకంగా రూపొందించిన నోటి ఆరోగ్య మార్గదర్శకాలు. ప్రతి కార్డుపై "వినండి" బటన్ నొక్కి వాయిస్ ద్వారా వినవచ్చు.'
              : lang === 'hi'
              ? 'अल्लूरी सीताराम राजू जिले के 11 मंडलों के लिए विशेष स्वास्थ्य मार्गदर्शन। प्रत्येक कार्ड पर "सुनें" बटन दबाकर आवाज में जानकारी प्राप्त करें।'
              : 'Clinical awareness guidelines tailored for the 11 agency mandals of ASR District. Tap the "Listen" button on any card to hear the full guidance spoken aloud in your language.'}
          </p>
        </div>

        {activeSpeakingCardId && (
          <button
            onClick={stopSpeaking}
            className="self-start md:self-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow-md animate-pulse cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>{lang === 'te' ? 'వాయిస్ ఆపు' : lang === 'hi' ? 'आवाज रोकें' : 'Stop Audio'}</span>
          </button>
        )}
      </div>

      {/* 3 Awareness Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {awarenessCards.map((card) => {
          const isSpeakingThis = activeSpeakingCardId === card.id;
          const BadgeIcon = card.badgeIcon;

          return (
            <div
              key={card.id}
              className={`rounded-3xl border p-6 flex flex-col justify-between transition-all duration-200 ${
                isSpeakingThis
                  ? 'bg-blue-50/50 border-royal-500 ring-2 ring-royal-200 shadow-md'
                  : 'bg-slate-50/70 hover:bg-white border-slate-200 hover:border-royal-300 shadow-2xs hover:shadow-md'
              }`}
            >
              <div className="space-y-4">
                {/* Top Badge & Voice Button */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-extrabold border ${card.badgeColor}`}
                  >
                    <BadgeIcon className="w-3 h-3 flex-shrink-0" />
                    <span>{card.badgeTitle[lang]}</span>
                  </span>

                  {/* Listen Aloud Button */}
                  <button
                    onClick={() => handleSpeak(card.id, card.listenText[lang])}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                      isSpeakingThis
                        ? 'bg-red-600 text-white shadow-sm animate-pulse'
                        : 'bg-white hover:bg-royal-50 text-royal-700 border border-slate-200 hover:border-royal-300 shadow-2xs'
                    }`}
                    title={
                      isSpeakingThis
                        ? 'Stop speaking'
                        : lang === 'te'
                        ? 'వాయిస్ ద్వారా వినండి'
                        : lang === 'hi'
                        ? 'आवाज में सुनें'
                        : 'Listen to guidance'
                    }
                  >
                    {isSpeakingThis ? (
                      <>
                        <Square className="w-3 h-3 fill-current" />
                        <span className="text-[11px] font-extrabold">
                          {lang === 'te' ? 'ఆపు' : lang === 'hi' ? 'रोकें' : 'Stop'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-royal-600" />
                        <span className="text-[11px] font-bold">
                          {lang === 'te' ? 'వినండి' : lang === 'hi' ? 'सुनें' : 'Listen'}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* Card Title */}
                <h4 className="text-base sm:text-lg font-black text-slate-950 leading-snug">
                  {card.title[lang]}
                </h4>

                {/* Educational Bullet Points */}
                <ul className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                  {card.bullets.map((b, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-royal-600 mt-1.5 flex-shrink-0" />
                      <span>{b[lang]}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button at bottom of card */}
              <div className="pt-6 border-t border-slate-200/80 mt-4">
                <button
                  onClick={card.action}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-royal-600 text-royal-900 hover:text-white border border-slate-200 hover:border-royal-600 font-extrabold text-xs shadow-2xs transition-all flex items-center justify-center space-x-2 group cursor-pointer"
                >
                  <span>{card.actionText[lang]}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default OralCancerAwarenessSection;

