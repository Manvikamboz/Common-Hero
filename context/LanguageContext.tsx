'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    home: 'Home',
    report: 'Report Issue',
    map: 'Live Map',
    leaderboard: 'Leaderboard',
    authority: 'Authority Panel',
    analytics: 'Analytics',
    profile: 'My Profile',
    login: 'Sign In',
    logout: 'Sign Out',
    logoText: 'CommunityHero',

    // Homepage Hero
    tagline: 'Empowering Hyperlocal Civic Actions',
    heroTitlePre: 'Report Civic Issues. ',
    heroTitlePost: 'Empower Your Ward.',
    heroDesc: 'Community Hero connects citizens, validators, and municipal teams in real time. Powered by Gemini AI for automated categorizing and priority mapping.',
    reportNow: 'Report Issue Now',
    trackTickets: 'Track Open Tickets',
    live: 'Live',
    activeIncidents: 'active incidents',
    activeIncident: 'active incident',
    aiVision: 'Gemini AI Vision',
    aiDesc: 'Auto-categorizes photos → assigns severity → runs duplicate check in 500m radius → routes to municipal authority.',
    aiModel: 'Model: gemini-2.5-pro',
    aiEmbeddings: 'Embeddings: gemini-embedding-001',
    feature1Title: 'Gamified Action',
    feature1Desc: 'Earn 10 points per report and 15 points per verification. Unlock exclusive badges.',
    feature2Title: 'Hyperlocal Auto-Routing',
    feature2Desc: 'Issues are automatically routed using GeoJSON boundaries directly to assigned authorities.',
    feature3Title: 'Zero-Spam Verification',
    feature3Desc: 'Verified validators review reports locally to filter duplicates and ensure high-integrity tickets.',
    liveTickets: 'Live Tickets',
    liveTicketsSub: 'Real-time civic issues from your community',
    viewAll: 'View All',
    noIssues: 'No issues reported yet',
    noIssuesDesc: 'Be the first to report a civic issue in your area.',
    reportNowBtn: 'Report Now',

    // Emergency announcements
    emergencyTitle: 'Emergency Alerts & Public Advisories',
    emergencyActive: 'ACTIVE EMERGENCY WARNINGS',
    emergencyAlertStorm: 'Severe Weather Warning: High wind and heavy rain advisory for Ward 12 & 14. Keep indoors.',
    emergencyWaterCut: 'Scheduled Water Outage: Water supply maintenance in Ward 8 on June 29, 09:00 - 15:00.',
    emergencyHealth: 'Health Advisory: Precautionary drinking water boiling recommendation for Ward 3 due to pipe repair.',
    dismiss: 'Dismiss',

    // Notice Board
    noticeTitle: 'Official Notice Board',
    noticeSub: 'Latest resolutions, circulars and government orders.',
    notice1Title: 'Revised Civic Sanitation Bye-Laws 2026',
    notice1Date: 'June 27, 2026',
    notice1Desc: 'Draft notification for public suggestions regarding waste segregation rules and penalties.',
    notice2Title: 'Ward Development Committee Meeting Minutes',
    notice2Date: 'June 25, 2026',
    notice2Desc: 'Minutes of the meeting held on June 20 covering budget allocation for road repairs.',
    notice3Title: 'Monsoon Preparation & Drain Desilting Schedule',
    notice3Date: 'June 22, 2026',
    notice3Desc: 'Zone-wise schedule for desilting of major stormwater drains ahead of heavy rainfall.',

    // Helpline
    helplineTitle: 'Emergency Helpline Directory',
    helplineSub: 'Immediate response contacts for civic and emergency needs.',
    helpDisaster: 'Disaster Management Cell',
    helpAmbulance: 'Medical Emergency / Ambulance',
    helpFire: 'Fire & Rescue Services',
    helpPolice: 'Local Police Headquarters',
    helpWater: 'Water Supply Board Helpline',
    helpPower: 'Electricity Grid Outage Support',
    helpWomen: 'Women & Child Safety Helpline',

    // Footer
    footerGovTitle: 'Municipal Corporation Portal',
    footerGovSub: 'An official initiative of the Local Municipal Governance Board.',
    footerQuickLinks: 'Quick Links',
    footerHelpline: 'Emergency Desk',
    footerHelplineNo: '108 / 011-23456789',
    footerEmail: 'support@municipal.gov.in',
    footerAddress: 'Civil Center, Administrative Block, Ward 12, Main Metro Road',
    copyright: '© 2026 Local Government Municipal Corporation. All Rights Reserved. Powered by Community Hero AI.',
  },
  hi: {
    // Navigation
    home: 'मुख्य पृष्ठ',
    report: 'समस्या दर्ज करें',
    map: 'लाइव मानचित्र',
    leaderboard: 'लीडरबोर्ड',
    authority: 'अधिकारी पैनल',
    analytics: 'विश्लेषण',
    profile: 'मेरी प्रोफाइल',
    login: 'साइन इन करें',
    logout: 'साइन आउट',
    logoText: 'कम्युनिटीहीरो',

    // Homepage Hero
    tagline: 'अति-स्थानीय नागरिक कार्यों को सशक्त बनाना',
    heroTitlePre: 'नागरिक समस्याएं रिपोर्ट करें। ',
    heroTitlePost: 'अपने वार्ड को सशक्त बनाएं।',
    heroDesc: 'कम्युनिटी हीरो वास्तविक समय में नागरिकों, सत्यापनकर्ताओं और नगर निगम की टीमों को जोड़ता है। जेमिनी एआई द्वारा स्वचालित श्रेणीकरण और प्राथमिकता निर्धारण के साथ संचालित।',
    reportNow: 'समस्या अभी रिपोर्ट करें',
    trackTickets: 'खुली टिकटें ट्रैक करें',
    live: 'लाइव',
    activeIncidents: 'सक्रिय घटनाएं',
    activeIncident: 'सक्रिय घटना',
    aiVision: 'जेमिनी एआई विजन',
    aiDesc: 'तस्वीरों का ऑटो-वर्गीकरण → गंभीरता का निर्धारण → 500 मीटर के दायरे में डुप्लिकेट जांच → नगर निगम अधिकारी को रूट।',
    aiModel: 'मॉडल: gemini-2.5-pro',
    aiEmbeddings: 'एम्बेडिंग्स: gemini-embedding-001',
    feature1Title: 'गेमीफाइड एक्शन',
    feature1Desc: 'प्रति रिपोर्ट 10 अंक और प्रति सत्यापन 15 अंक अर्जित करें। विशेष बैज अनलॉक करें।',
    feature2Title: 'हाइपरलोकल ऑटो-रूटिंग',
    feature2Desc: 'जियोजेसन (GeoJSON) सीमाओं का उपयोग करके समस्याएं स्वचालित रूप से निर्दिष्ट अधिकारियों को भेजी जाती हैं।',
    feature3Title: 'शून्य-स्पैम सत्यापन',
    feature3Desc: 'सत्यापित नागरिक अपने क्षेत्र में रिपोर्ट की समीक्षा करते हैं ताकि डुप्लिकेट को हटाया जा सके।',
    liveTickets: 'लाइव टिकटें',
    liveTicketsSub: 'आपके समुदाय से वास्तविक समय की नागरिक समस्याएं',
    viewAll: 'सभी देखें',
    noIssues: 'अभी तक कोई समस्या रिपोर्ट नहीं की गई है',
    noIssuesDesc: 'अपने क्षेत्र में नागरिक समस्या की रिपोर्ट करने वाले पहले व्यक्ति बनें।',
    reportNowBtn: 'अभी रिपोर्ट करें',

    // Emergency announcements
    emergencyTitle: 'आपातकालीन अलर्ट और सार्वजनिक सूचनाएं',
    emergencyActive: 'सक्रिय आपातकालीन चेतावनियाँ',
    emergencyAlertStorm: 'गंभीर मौसम की चेतावनी: वार्ड 12 और 14 के लिए तेज़ हवा और भारी बारिश की सलाह। घरों के अंदर रहें।',
    emergencyWaterCut: 'निर्धारित पानी की कटौती: 29 जून को सुबह 09:00 से दोपहर 15:00 बजे तक वार्ड 8 में जलापूर्ति रखरखाव।',
    emergencyHealth: 'स्वास्थ्य सलाह: पाइप मरम्मत के कारण वार्ड 3 के लिए एहतियाती पीने के पानी को उबालने की सिफारिश।',
    dismiss: 'बंद करें',

    // Notice Board
    noticeTitle: 'आधिकारिक सूचना पट्ट',
    noticeSub: 'नवीनतम प्रस्ताव, परिपत्र और सरकारी आदेश।',
    notice1Title: 'संशोधित नागरिक स्वच्छता उप-नियम 2026',
    notice1Date: '27 जून, 2026',
    notice1Desc: 'कचरा पृथक्करण नियमों और दंडों के संबंध में जनता के सुझावों के लिए मसौदा अधिसूचना।',
    notice2Title: 'वार्ड विकास समिति की बैठक का विवरण',
    notice2Date: '25 जून, 2026',
    notice2Desc: 'सड़क मरम्मत के लिए बजट आवंटन को कवर करते हुए 20 जून को आयोजित बैठक का विवरण।',
    notice3Title: 'मानसून की तैयारी और नाला सफाई कार्यक्रम',
    notice3Date: '22 जून, 2026',
    notice3Desc: 'भारी बारिश से पहले प्रमुख तूफानी जल नालियों की सफाई के लिए क्षेत्रवार कार्यक्रम।',

    // Helpline
    helplineTitle: 'आपातकालीन हेल्पलाइन निर्देशिका',
    helplineSub: 'नागरिक और आपातकालीन आवश्यकताओं के लिए तत्काल प्रतिक्रिया संपर्क।',
    helpDisaster: 'आपदा प्रबंधन सेल',
    helpAmbulance: 'चिकित्सा आपातकाल / एम्बुलेंस',
    helpFire: 'अग्निशमन एवं बचाव सेवाएं',
    helpPolice: 'स्थानीय पुलिस मुख्यालय',
    helpWater: 'जलापूर्ति बोर्ड हेल्पलाइन',
    helpPower: 'बिजली ग्रिड आउटेज सहायता',
    helpWomen: 'महिला एवं बाल सुरक्षा हेल्पलाइन',

    // Footer
    footerGovTitle: 'नगर निगम पोर्टल',
    footerGovSub: 'स्थानीय नगर शासन बोर्ड की एक आधिकारिक पहल।',
    footerQuickLinks: 'त्वरित लिंक',
    footerHelpline: 'आपातकालीन डेस्क',
    footerHelplineNo: '108 / 011-23456789',
    footerEmail: 'support@municipal.gov.in',
    footerAddress: 'सिविल सेंटर, प्रशासनिक ब्लॉक, वार्ड 12, मुख्य मेट्रो रोड',
    copyright: '© 2026 स्थानीय सरकारी नगर निगम। सर्वाधिकार सुरक्षित। कम्युनिटी हीरो एआई द्वारा संचालित।',
  }
};

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('app_lang');
    if (saved === 'en' || saved === 'hi') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
