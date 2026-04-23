import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "nav.home": "Home",
      "nav.chat": "AI Chat",
      "nav.community": "Community",
      "nav.progress": "Progress",
      "nav.education": "Education",
      "nav.centers": "Directory",
      "nav.sign": "Sign Language",
      "nav.professionals": "Professionals",
      "nav.emergency": "Emergency",
      
      "home.greeting": "Hello, how are you feeling today?",
      "home.greeting.sub": "Inkingi AI is here to support you.",
      
      "mood.great": "Great",
      "mood.good": "Good",
      "mood.neutral": "Neutral",
      "mood.anxious": "Anxious",
      "mood.sad": "Sad",
      
      "chat.placeholder": "Type your message or tap the mic...",
      "chat.crisis.alert": "Emergency Contacts Needed",
      "chat.crisis.hotline": "Rwanda Crisis Hotline: 114",
      "chat.crisis.healthminds": "Healthy Minds Rwanda: +250 790 003 002",
      "chat.crisis.police": "Police/Ambulance: 112"
    }
  },
  rw: {
    translation: {
      "nav.home": "Ahabanza",
      "nav.chat": "Ikiganiro AI",
      "nav.community": "Umuryango",
      "nav.progress": "Aho ugeze",
      "nav.education": "Kwigisha",
      "nav.centers": "Amavuriro",
      "nav.sign": "Amarenga",
      "nav.professionals": "Inzobere",
      "nav.emergency": "Ihutirwa",
      
      "home.greeting": "Muraho, umeze ute uyu munsi?",
      "home.greeting.sub": "Inkingi AI iri hano kugufasha.",
      
      "mood.great": "Neza cyane",
      "mood.good": "Neza",
      "mood.neutral": "Bisanzwe",
      "mood.anxious": "Nafashwe ubwoba",
      "mood.sad": "Nababaye",
      
      "chat.placeholder": "Andika ubutumwa cyangwa kanda mikoro...",
      "chat.crisis.alert": "Ubufasha bwihutirwa",
      "chat.crisis.hotline": "Nomero y'ubutabazi: 114",
      "chat.crisis.healthminds": "Healthy Minds Rwanda: +250 790 003 002",
      "chat.crisis.police": "Polisi/Imbangukiragutabara: 112"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;

