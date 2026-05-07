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
      "nav.education": "Education Hub",
      "nav.centers": "Directory",
      "nav.sign": "Sign Language",
      "nav.professionals": "Mental Health Professionals",
      "nav.emergency": "Emergency",
      "nav.braille": "Braille Generator",
      "nav.settings": "Settings",
      
      "common.call_directory": "Call Support Directory",
      "common.view_directory": "View Centers Directory",
      
      "home.greeting": "Hello, how are you feeling today?",
      "home.greeting.sub": "Humura AI is here to support you.",
      
      "mood.great": "Great",
      "mood.good": "Good",
      "mood.neutral": "Neutral",
      "mood.anxious": "Anxious",
      "mood.sad": "Sad",
      
      "chat.placeholder": "Type your message or tap the mic...",
      "chat.crisis.alert": "Emergency Contacts Needed",
      "chat.crisis.hotline": "Rwanda Crisis Hotline: 114",
      "chat.crisis.healthminds": "Healthy Minds Rwanda: +250 790 003 002",
      "chat.crisis.police": "Police/Ambulance: 112",
      
      "glossary.mental_health": "Mental health",
      "glossary.anxiety": "Anxiety",
      "glossary.depression": "Depression",
      "glossary.stress": "Stress",
      "glossary.trauma": "Trauma",
      "glossary.crisis": "Crisis",
      "glossary.burnout": "Burnout",
      "glossary.panic_attack": "Panic attack",
      "glossary.self-harm": "Self-harm",
      "glossary.suicide": "Suicide",
      "glossary.wellness": "Wellness",
      "glossary.mind": "Mind",
      "glossary.grief": "Grief",
      "glossary.fear": "Fear",
      "glossary.sadness": "Sadness",
      "glossary.anger": "Anger",
      "glossary.loneliness": "Loneliness",
      "glossary.hope": "Hope",
      "glossary.joy": "Joy",
      "glossary.shame": "Shame",
      "glossary.guilt": "Guilt",
      "glossary.worry": "Worry",
      "glossary.mood": "Mood",
      "glossary.feelings": "Feelings",
      "glossary.emotions": "Emotions",
      "glossary.therapy": "Therapy",
      "glossary.counselling": "Counselling",
      "glossary.support": "Support",
      "glossary.healing": "Healing",
      "glossary.recovery": "Recovery",
      "glossary.breathe": "Breathe",
      "glossary.relax": "Relax",
      "glossary.journal": "Journal",
      "glossary.meditate": "Meditate",
      "glossary.rest": "Rest",
      "glossary.talk_to_someone": "Talk to someone",
      "glossary.seek_help": "Seek mental health support",
      "glossary.exercise": "Exercise",
      "glossary.sleep": "Sleep",
      "glossary.eat_well": "Eat well",
      "glossary.how_are_you_feeling": "How are you feeling?",
      "glossary.you_are_not_alone": "MIND SUPPORTED, LIFE EMPOWERED",
      "glossary.we_are_here_for_you": "We are here for you",
      "glossary.take_a_deep_breath": "Take a deep breath",
      "glossary.log_your_mood": "Log your mood",
      "glossary.daily_check-in": "Daily check-in",
      "glossary.emergency_help": "Emergency help",
      "glossary.settings": "Settings",
      "glossary.notifications": "Notifications",
      "glossary.get_started": "Get started"
    }
  },
  rw: {
    translation: {
      "nav.home": "Ahabanza",
      "nav.chat": "Ikiganiro AI",
      "nav.community": "urubuga rwo kugirana inama",
      "nav.progress": "impinduka",
      "nav.education": "Kwigisha",
      "nav.centers": "Amavuriro",
      "nav.sign": "Amarenga",
      "nav.professionals": "hura n'inzobere mu buzima bwo mu mutwe",
      "nav.emergency": "ubufasha bw’ihutirwa",
      "nav.braille": "Inyandiko z'abafite ubumuga bwo kutabona",
      "nav.settings": "Igenamiterere",
      "common.call_directory": "Hamagara Indangururamuntu",
      "common.view_directory": "Reba Amavuriro",
      "history.title": "ibiganiro twagiranye",

      
      "home.greeting": "Muraho, umeze ute uyu munsi?",
      "home.greeting.sub": "Humura AI iri hano kugufasha.",
      
      "mood.great": "Neza cyane",
      "mood.good": "Neza",
      "mood.neutral": "Bisanzwe",
      "mood.anxious": "Nafashwe ubwoba",
      "mood.sad": "Nababaye",
      
      "chat.placeholder": "Andika ubutumwa cyangwa kanda mikoro...",
      "chat.crisis.alert": "ubufasha bw’ihutirwa",
      "chat.crisis.hotline": "Nomero y'ubutabazi: 114",
      "chat.crisis.healthminds": "Healthy Minds Rwanda: +250 790 003 002",
      "chat.crisis.police": "Polisi/Imbangukiragutabara: 112",
      
      "glossary.mental_health": "Ubuzima bwo mu mutwe",
      "glossary.anxiety": "Impungenge",
      "glossary.depression": "Agahinda gakabije",
      "glossary.stress": "Umunaniro ukabije",
      "glossary.trauma": "Ihungabana",
      "glossary.crisis": "Ikibazo gikabije",
      "glossary.burnout": "Kunanirwa bikabije",
      "glossary.panic_attack": "Gutinya bikabije",
      "glossary.self-harm": "Kwigirira nabi",
      "glossary.suicide": "Kwiyahura",
      "glossary.wellness": "Kumera neza",
      "glossary.mind": "Ubwenge",
      "glossary.grief": "ISHAVU",
      "glossary.fear": "Ubwoba",
      "glossary.sadness": "Agahinda",
      "glossary.anger": "Uburakari",
      "glossary.loneliness": "Kwiyumva wenyine",
      "glossary.hope": "Ibyiringiro",
      "glossary.joy": "Ibyishimo",
      "glossary.shame": "Isoni",
      "glossary.guilt": "Ibyaha",
      "glossary.worry": "Gutinya",
      "glossary.mood": "Imyitwarire y'umutima",
      "glossary.feelings": "Ibyiyumvo",
      "glossary.emotions": "Amarangamutima",
      "glossary.therapy": "Ubuvuzi bwo guturisha umutima",
      "glossary.counselling": "Ubujyanama",
      "glossary.support": "ubufasha",
      "glossary.healing": "Gukira",
      "glossary.recovery": "Gusubirana",
      "glossary.breathe": "Humeka",
      "glossary.relax": "Tegereza",
      "glossary.journal": "Andika iby’uyumunsi",
      "glossary.meditate": "itekerezeho",
      "glossary.rest": "Ruhuka",
      "glossary.talk_to_someone": "Bwira umuntu",
      "glossary.seek_help": "Shaka ubufasha mu buzima bwo mu mutwe",
      "glossary.exercise": "Imyitozo ngororamubiri",
      "glossary.sleep": "Sinzira",
      "glossary.eat_well": "Rya neza",
      "glossary.how_are_you_feeling": "Umeze ute?",
      "glossary.you_are_not_alone": "GUSHYIGIKIRA IMITEKEREREZE, GUKOMEZA UBUZIMA",
      "glossary.we_are_here_for_you": "Turi hano ngo tugufashe",
      "glossary.take_a_deep_breath": "Humeka neza",
      "glossary.log_your_mood": "Andika uko wiyumva",
      "glossary.daily_check-in": "Kwisuzuma buri munsi",
      "glossary.emergency_help": "Ubufasha bw'ihutirwa",
      "glossary.settings": "Igenamiterere",
      "glossary.notifications": "Amamenyesha",
      "glossary.get_started": "Tangira"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    load: 'languageOnly',
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;


