import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import ProfessionalVideoHub from '../components/ProfessionalVideoHub';
import {
  BookOpen, PlayCircle, Headphones, ChevronLeft, X,
  Volume2, VolumeX, ExternalLink, Lightbulb, ChevronRight
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────
// TOPIC DATA — 6 topics with full content, audio & video
// ──────────────────────────────────────────────────────────────
interface Topic {
  id: string;
  iconEmoji: string;
  color: string;
  bg: string;
  titleEn: string;
  titleRw: string;
  descEn: string;
  descRw: string;
  articleEn: string;
  articleRw: string;
  videoId: string;
  tips: { en: string; rw: string }[];
}

const topics: Topic[] = [
  {
    id: 'anxiety',
    iconEmoji: '🌬️',
    color: 'text-sky-700',
    bg: 'from-sky-400 to-blue-600',
    titleEn: 'Anxiety & Worry',
    titleRw: 'Ubwoba n\'Amanyanga',
    descEn: 'Understanding your body\'s alarm system and how to calm it',
    descRw: 'Gusobanukirwa sisitemu y\'akaga ku mubiri wawe no kuyitonza',
    videoId: 'WWloIAQpMcQ',
    articleEn: `Anxiety is your body's built-in survival system — it's not a flaw, it's evolution at work. When your brain detects a threat (real or imagined), it floods your body with adrenaline, making your heart race and your thoughts spiral. This is called the "fight-or-flight" response.

The problem? In modern life, our brains can't always tell the difference between a deadline and a lion. So we get physiologically activated by emails, social situations, and "what ifs."

The 4-7-8 Breathing Technique: One of the most research-backed ways to calm the anxious nervous system. Inhale for 4 counts, hold for 7, exhale fully for 8. The extended exhale activates your parasympathetic system — the "rest and digest" mode. Try it three times, right now.

The 5-4-3-2-1 Grounding Technique: When anxiety pulls you into the future, your senses bring you back to the present. Name 5 things you can see, 4 you can physically feel, 3 you can hear, 2 you can smell, 1 you can taste. This interrupts the anxiety spiral.

Remember: anxiety is not your enemy. It's a signal worth listening to — and a body that can be calmed.`,
    articleRw: `Ubwoba ni sisitemu ya mbere y'agakiza mu mubiri wawe — si ikosa, ni uguteza imbere. Iyo ubwonko bwawe buhasanze akaga (ko ku ukuri cyangwa mu biganiro), butera umubiri uburinzi bwa adrenaline, bituma umutima utera byihuse kandi ibitekerezo birenza. Ibi birasabwa "guhunga cyangwa kurwana."

Ikibazo? Mu buzima buno, ubwonko bwacu ntibushobora buri gihe gutandukanya igihe cy'akazi n'intare. Bityo turitiranywa n'amavuruguto, ibihe n'abantu, n'ibibazo bya "niba."

Ubuhumekero bwa 4-7-8: Humeka amasekunida 4, komeza 7, sohora 8. Ubuhumekero bureruka butera sisitemu y'amahoro — "isorore." Gerageza inshuro eshatu, ubu.

Uburyo bwa 5-4-3-2-1: Iyo ubwoba bukuzana mu bihe bizaza, ubumva inyuma ibihe bibaho. Tanga izina ibintu 5 ubona, 4 wumva kuri/ukuboko, 3 wumva ijwi, 2 ugira isura, 1 ugushoma. Ibi bihagarika ubwoba.

Ibuka: ubwoba si umwanzi wawe. Ni ikimenyetso gikwiye kumva — n'umubiri ushobora gutonozwa.`,
    tips: [
      { en: 'Practice 4-7-8 breathing: inhale 4, hold 7, exhale 8 counts', rw: 'Koresha ubuhumekero bwa 4-7-8: humeka 4, komeza 7, sohora 8' },
      { en: 'Use 5-4-3-2-1 grounding when anxiety spikes', rw: 'Koresha uburyo bwa 5-4-3-2-1 iyo ubwoba bwiyongera' },
      { en: 'Challenge anxious thoughts: "Is this fact or fear?"', rw: 'Baza ibibazo amitekerereze: "Ese ni ukuri cyangwa ubwoba?"' },
      { en: 'Limit caffeine and prioritize 7-9 hours of sleep', rw: 'Gabanya kafeine kandi ushake amasaha 7-9 y\'itiro' },
      { en: 'Exercise releases natural anti-anxiety chemicals', rw: 'Imyitozo y\'umubiri igabanya ubwoba' },
    ]
  },
  {
    id: 'depression',
    iconEmoji: '❤️‍🩹',
    color: 'text-rose-700',
    bg: 'from-rose-400 to-pink-600',
    titleEn: 'Depression & Low Mood',
    titleRw: 'Agahinda n\'Guturika Umutima',
    descEn: 'Depression is not weakness — it\'s an illness with real treatments',
    descRw: 'Agahinda si ubudahangarwa — ni indwara ifite ubuvuzi',
    videoId: 'z-IR48Mb3W0',
    articleEn: `Depression is one of the most common mental health conditions worldwide, affecting 280 million people. Yet it remains deeply misunderstood — often dismissed as "laziness" or "weakness." This is medically incorrect and deeply harmful.

Depression is a medical condition involving chemical changes in the brain. It affects how you feel, think, and function. It is not a choice. It is not a character flaw. And critically — it is treatable.

What depression actually feels like: not just sadness, but a pervasive emptiness, loss of pleasure in things you once loved, fatigue that no amount of sleep fixes, difficulty concentrating, and sometimes physical pain.

Behavioral Activation — the most evidence-based first step: Depression makes you withdraw from activities, which deepens the depression. The therapeutic antidote is action — not feeling your way to action, but acting your way to feeling. Start tiny: a 5-minute walk, texting one friend, making your bed.

You deserve to feel better. Reaching out — including reading this — is a form of that action. Rwanda has mental health professionals who understand your experience and can help.`,
    articleRw: `Agahinda ni imwe mu ndwara ngarukamwaka zo mu mutwe muri isi hose, zikuruza abantu miliyoni 280. Ariko agahinda ntikamenya neza — kenshi gafatwa nk'"uburyarya" cyangwa "ubudahangarwa." Ibi si ukuri kandi biranakamunye.

Agahinda ni indwara yo mu ubwonko. Ikora uko umva, utekereza, n'ukora. Si hitamo. Si ikosa cy'indangamuntu. Kandi uhakana — ifite ubuvuzi.

Agahinda gukumvikana bute: si agahinda gusa, keretsi ubujiji bujemo, gutakaza ibyibuho mu bintu warebanye, umunaniro ugerageza guhindura itiro, gutekereza bigoye, n'imikorere bigoye.

Gukorerwa Imirimo (Behavioral Activation) — intambwe ya mbere yuzuye ibimenyetso: Agahinda kugutera gukuraho ibikorwa, bikinuye agahinda. Umuti wa therapie ni ibikorwa — si gutekereza ibyo gukora, ariko gukora kugira ngo utekereze. Tangira utoya: kugenda iminota 5, kohereza SMS inshuti, gusana uburiri bwawe.

Ukwiye ugire amahoro. Gushakana — harimo gusoma ibi — ni igice cy'ibikorwa ibyo.`,
    tips: [
      { en: 'Start with one tiny action — even making your bed counts', rw: 'Tangira n\'igikorwa kimwe gito — no gusana uburiri bwawe birahagije' },
      { en: 'Stay connected — isolation worsens depression', rw: 'Komeza gutumanahana — kwigengwa bigurisha agahinda' },
      { en: 'Exercise releases serotonin and dopamine naturally', rw: 'Imyitozo y\'umubiri ikuraho serotonin na dopamine nta miti' },
      { en: 'Depression lies — challenge its negative thoughts', rw: 'Agahinda gahusha — banga ibitekerezo bihembyegura' },
      { en: 'Professional support works — please consider reaching out', rw: 'Ubufasha bwa nyirubwite bufasha — tekereza gushakana n\'inzobere' },
    ]
  },
  {
    id: 'stress',
    iconEmoji: '🔥',
    color: 'text-orange-700',
    bg: 'from-orange-400 to-red-500',
    titleEn: 'Stress Management',
    titleRw: 'Gucunga Ingorane z\'Umutima',
    descEn: 'Practical tools to manage life\'s demands and protect your health',
    descRw: 'Ibikoresho bifatika byo gucunga ibibazo by\'ubuzima',
    videoId: 'RcGyVTAoXEU',
    articleEn: `Stress is a natural, even essential part of human life. A certain amount of stress sharpens focus and motivates action — psychologists call this "eustress." But chronic, unmanaged stress is a different matter entirely. It damages the immune system, disrupts sleep, and contributes to anxiety, depression, and physical illness.

The 5-4-3-2-1 Grounding Technique for Stress: When stress feels acute, this sense-based technique interrupts the spiral. Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste. This brings your brain from future-worry back to present-safe.

Progressive Muscle Relaxation: Tense each muscle group tightly for 5-7 seconds, then release completely. Start with your toes and move upward. The contrast between tension and release teaches your body what relaxation actually feels like.

The "Worry Window" Technique: Anxiety loves to intrude. Schedule a specific 15-minute window each day for your worries. When anxious thoughts arise outside that window, gently note: "Not now — I'll address that at 6pm." This reduces rumination significantly.

Social support is one of the most powerful stress buffers research has identified. Talking to someone you trust — even for 10 minutes — measurably reduces cortisol.`,
    articleRw: `Ingorane ni igice gisanzwe, n'ingenzi, cy'ubuzima bw'umuntu. Ingorane nkeya zishyigikira icyifuzo no gutera imbere — abahanga mu bya siyanse bita "eustress." Ariko ingorane zihamye, zidacungwa ni izindi nteruro entirely. Zitera indwara z'amagara, zivuruga itiro, kandi zitera ubwoba, agahinda, n'indwara z'umubiri.

Uburyo bwa 5-4-3-2-1 bwo Gutegura Ubwonko: Iyo ingorane zumvikana nkizirahinduka, uburyo bw'ubumva buhagarika ibintu. Tanga izina ibintu 5 ubona, 4 ushobora gukora, 3 wumva ijwi, 2 ugira isura, 1 ugushoma. Ibi ziganisha ubwonko bwawe kuva ku bihe bizaza ukisira ubu mubukiro.

Kwitonda kw'Imitsi (Progressive Muscle Relaxation): Menyeresha imitsi buri gice nkizihamye amasekonda 5-7, hanyuma yitonze burundu. Tangira ku birenge ugire ukihanagura. Gutandukanya guhamara no gukira bigisha umubiri ikimenyetso cy'isorore.

Tekereza kureba inzobere iyo ingorane zikurengeye. Rwanda ifite abahanga mu buzima bwo mu mutwe nabashobora kukugirira neza.`,
    tips: [
      { en: 'Identify your top 3 stressors and make a specific plan for each', rw: 'Menya ingorane zawe 3 zo hejuru ukore gahunda y\'ubwami' },
      { en: 'Use progressive muscle relaxation before bed', rw: 'Koresha kwitonda kw\'imitsi mbere yo kuryama' },
      { en: 'Schedule a daily "worry window" — 15 minutes only', rw: 'Teganya "igihe cy\'ingorane" buri munsi — iminota 15 gusa' },
      { en: 'Talk to someone you trust — it measurably lowers cortisol', rw: 'Vuga n\'umuntu uizeye — bigabanya cortisol bikurikirana' },
      { en: 'Nature exposure for 20+ minutes reduces stress hormones', rw: 'Kuba mu kamere iminota 20+ bigabanya imisemburo y\'ingorane' },
    ]
  },
  {
    id: 'trauma',
    iconEmoji: '🌿',
    color: 'text-purple-700',
    bg: 'from-purple-400 to-violet-600',
    titleEn: 'Trauma & PTSD',
    titleRw: 'Trauma na PTSD',
    descEn: 'Healing is possible — understanding trauma and the journey forward',
    descRw: 'Gukira birashoboka — gusobanukirwa trauma n\'urugendo rugana imbere',
    videoId: 'G7zAseaIyFA',
    articleEn: `Trauma is what happens in the nervous system in response to events that overwhelm our ability to cope. It is not what happened to you — it is how your body holds what happened. And your body's response to trauma is not weakness. It is an intelligent, protective response to an overwhelming experience.

Rwanda carries a unique national story of collective trauma — the 1994 Genocide Against the Tutsi left deep wounds across generations. If your trauma is connected to this history, MIND SUPPORTED, LIFE EMPOWERED — and community healing, including ingando and community reconciliation practices, can be profound.

Understanding trauma responses: Flashbacks, hypervigilance, emotional numbing, and avoidance are not signs of being "broken." They are survival strategies that once served a purpose. Healing involves gradually updating these responses so the past stays in the past.

The Window of Tolerance: Trauma therapy works by keeping you within a "window" of manageable activation — neither too numb nor too overwhelmed. Grounding exercises bring you back to this window.

Healing is not linear. Good days and hard days will alternate. What matters is the general direction. Trauma-Focused CBT (TF-CBT) and EMDR are highly effective evidence-based treatments available in Rwanda.`,
    articleRw: `Trauma ni igikorwa gikurikiraho mu sisitemu y'ubwonko muri igisubizo cy'ibikorwa byemurira ubushobozi bwacu bwo guhangana. Si ibyo byakubayeho — ni uburyo umubiri wawe ubika ibyo byabaye. Kandi igisubizo cy'umubiri ku trauma si ubudahangarwa. Ni igisubizo cyiza cy'agakiza ku bikorwa byaremeje.

U Rwanda gifite inkuru yihariye ya gakondo bya collectif — Jenoside yakorewe Abatutsi mu 1994 yasize intihanyi z'ibihe ku bihe. Niba trauma yawe ihuzwa n'amateka aya, GUSHYIGIKIRA IMITEKEREREZE, GUKOMEZA UBUZIMA — kandi ugukira umuryango, harimo ingando na reconciliation z'umuryango, birabonetse cyane.

Gusobanukirwa igisubizo cha trauma: Ibintu bi flashback, kwitangagura, gutakaza ibyumviro, no kwirinda ntibimvikana ko "warangiranye." Ni ingamba zo kwirinda zarakoraga kera. Ugukira bikorwa buhoro buhoro gusukiranya igisubizo iyi kugira ngo ibihe bihise bikomere aho biherereye.

Ugukira si gukurikirana neza. Iminsi myiza n'imibi bizabana. Ubwo burasaba inzira rusange. Ubuvuzi bwa Trauma-Focused CBT (TF-CBT) na EMDR ni uburyo bwizewe bubonetse mu Rwanda.`,
    tips: [
      { en: 'Trauma is a normal response to abnormal events — not weakness', rw: 'Trauma ni igisubizo gisanzwe ku bidasanzwe — si ubudahangarwa' },
      { en: 'Grounding exercises help when flashbacks hit', rw: 'Imyitozo yo gutura mu bihe bifasha iyo ibintu bya flashback bifika' },
      { en: 'Healing is not linear — good and bad days are both normal', rw: 'Ugukira si gukurikirana neza — iminsi myiza n\'imibi byombi ni bisanzwe' },
      { en: 'Trauma-Focused CBT (TF-CBT) is highly effective', rw: 'Ubuvuzi bwa TF-CBT bufite imbaraga nyinshi' },
      { en: 'Community and connection are powerful healing forces', rw: 'Umuryango no gutumanahana ni inzatsi z\'ugukira' },
    ]
  },
  {
    id: 'grief',
    iconEmoji: '🕊️',
    color: 'text-violet-700',
    bg: 'from-violet-400 to-indigo-600',
    titleEn: 'Grief & Loss',
    titleRw: 'Akababaro n\'Ugupiripita',
    descEn: 'There is no timeline for grief — only the journey through it',
    descRw: 'Akababaro ntagira igihe — inzira gusa yo gukarekura',
    videoId: 'NDQ1Mi5I4rg',
    articleEn: `Grief is love with nowhere to go. When we lose someone or something deeply important to us, the love doesn't disappear — it transforms into the ache of absence. This is not pathology. This is what it means to have loved.

The myth of "stages": You may have heard of the "5 stages of grief" (denial, anger, bargaining, depression, acceptance). Modern grief research has moved away from this linear model. In reality, grief is non-linear, personal, and comes in waves — sometimes crashing without warning.

What grief actually looks like: Profound sadness, yes — but also unexpected moments of joy (and guilt about that joy), anger, confusion, physical symptoms (chest tightness, fatigue), difficulty concentrating, and social withdrawal.

Grief waves: The emotions don't come in a neat schedule. At first they may feel constant. Over time, the waves typically become less frequent and shorter in duration — though certain anniversaries, songs, or smells can bring them crashing back.

No one "gets over" a significant loss. But people learn to carry it differently — and eventually, to carry it with more ease. Your relationship with the person you've lost doesn't end — it changes. Honoring that relationship, in whatever form makes sense to you, is part of healing.`,
    articleRw: `Akababaro ni urukundo rudafite aho rugereka. Twapiripitiye umuntu cyangwa ikintu cyane cy'ingenzi, urukundo ntirugera — ruhinduka uburibwe bw'uburyo buriho. Si indwara. Ni icyo bivuze gukunda.

Inkuru ya "intera": Wenda wumvise "intera 5 z'akababaro" (guhakanira, umujinya, gusezeranya, agahinda, kwemera). Pesheni z'akababaro za none zihagurukiye umubare wa site wa linear. Ukuri, akababaro ntikurikira inzira, ni bwite, kandi kaza mu mafuriko — rimwe bigatwikira utiteguye.

Akababaro gukumvikana bute: Agahinda gakomeye, yego — ariko n'ibihe bikumvikana by'ibyishimo (n'icyaha by'ibyishimo byo), umujinya, gutatana, ibimenyetso by'umubiri (guturika mu gituza, umunaniro), gutekereza bigoye, n'kwigenga.

Mafuriko y'akababaro: Ibyumviro ntibiza mu gahunda nziza. Mu rugendo rw'ibanze birashobora kumvikana nk'buri gihe. Igihe cyinjiye, mafuriko akaba make ari make kandi make mu gihe — nubwo iminsi y'inzira, indirimbo, cyangwa isura bishobora kuyagarura.

Nta muntu "arenguka" ugupiripita gukomeye. Ariko abantu bigwa gukubwira batandukanye — kandi amaherezo, kujya kubwira bikorwa ubusobanuro burashimishije. Ubushirikere bwawe n'uwapiripiriwe ntibuzira — buhinduka. Kubungabunga ubushirikere ubwo, mu buryo bumvikana, ni igice cy'ugukira.`,
    tips: [
      { en: 'Grief has no timeline — be gentle with yourself', rw: 'Akababaro ntagira igihe — jya wiroroheje' },
      { en: 'Let yourself feel all emotions — including unexpected joy', rw: 'Itege ibyumviro byose — harimo n\'ibyishimo bidasimuriwe' },
      { en: 'Grief comes in waves — the intensity reduces over time', rw: 'Akababaro kaza mu mafuriko — imbaraga zigabanya mu gihe' },
      { en: 'Honor the relationship in whatever way feels right', rw: 'Bungabunga ubushirikere mu buryo bwiyumva' },
      { en: 'Talking about the person you lost can be healing', rw: 'Kuvuga ku wapiripiriwe bishobora kugufasha gukira' },
    ]
  },
  {
    id: 'resilience',
    iconEmoji: '🌅',
    color: 'text-emerald-700',
    bg: 'from-emerald-400 to-teal-600',
    titleEn: 'Hope & Resilience',
    titleRw: 'Icyizere n\'Gukomera',
    descEn: 'Building inner strength — small wins, strong connections, and hope',
    descRw: 'Kubaka imbaraga z\'imbere — intsinzi nto, isano, n\'icyizere',
    videoId: '_X0mgOOSpLU',
    articleEn: `Resilience is not the absence of difficulty. It is the capacity to navigate difficulty and emerge — changed, but still moving forward. The most resilient people are not those who experience the least pain. They are those who have built the skills, relationships, and mindset to move through pain.

The neuroscience of resilience: Your brain has neuroplasticity — the ability to physically rewire itself based on experience and practice. Every time you choose to take one small positive action in the face of difficulty, you are literally building the neural pathways of resilience.

Small wins compound: Research shows that experiencing even small successes triggers dopamine release, which in turn motivates further action. The key is starting small enough that success is guaranteed. Make your bed. Take one step outside. Drink one glass of water. These micro-actions initiate an upward spiral.

Relational resilience: Humans are wired for connection. Strong social relationships are the single most consistent predictor of psychological resilience across cultures and contexts. Investing in relationships — even when it feels effortful — is investing in your mental health.

Rwanda's collective resilience: Rwanda has demonstrated one of history's most remarkable examples of national healing and rebuilding. The concept of ubuntu — "I am because we are" — is embedded in Rwandan culture and represents a profound model of relational resilience.`,
    articleRw: `Gukomera si guturika nta ngorane. Ni ubushobozi bwo kugenda mu ngorane ugahaguka — wahindutse, ariko ukaguma ugenda imbere. Abantu bafite gukomera gukomeye si abo bagira uburiho buke cyane. Ni abo bafite ubushobozi, isano, n'ibitekerezo byo kugenda mu buriho.

Neuroscience y'ingukomere: Ubwonko bwawe bufite neuroplasticity — ubushobozi bwo guhindura imiterere yabwo nyuma y'uburambe na ibikorwa. Buri gihe uhitamo gutera intambwe imwe nto nziza mu maso h'ingorane, uri kubaka inzira z'ubwonko bw'ingukomere.

Intsinzi nto ziyongera: Pesheni yerekana ko kugira n'intsinzi nto zitangiza dopamine, bituma utera imbere gutera imbere. Sano ntoya bihagije yemera intsinzi. Sana uburiri bwawe. Genda inshuro imwe hanze. Nywa gilasi imwe y'amazi. Ibikorwa bya micro bitangiza kuzamuka.

Isano y'ingukomere: Abantu bifuzwa gutumanahana. Isano y'umuryango ikomeye ni ibimenyetso byiza bya psychological resilience barimo mu muco n'uburinganire. Gutanga mu isano — n'iyo bimvikana bigoye — ni gutanga mu buzima bwawe bwo mu mutwe.

Ingukomere y'umuryango w'u Rwanda: U Rwanda yerekeje ubwenzuri bumwe mu by'amateka bwa kuzira burundu no kugenzura. Itekerezo rya ubuntu — "Ndi jye kubera turutse" — rifatanyije n'umuco w'u Rwanda kandi rirerekeza ingukomere y'isano.`,
    tips: [
      { en: 'Celebrate even tiny wins — they trigger the dopamine cycle', rw: 'Ishimire n\'intsinzi nto — zitangiza cycle ya dopamine' },
      { en: 'Invest in 2-3 deep relationships — quality over quantity', rw: 'Tanga mu isano 2-3 z\'ukuri — ubwiza kuruta umubare' },
      { en: 'Practice gratitude: 3 things daily rewires your brain toward hope', rw: 'Kora gushimira: ibintu 3 buri munsi bisukiranya ubwonko ku cyizere' },
      { en: 'Find meaning in difficulty — "what is this teaching me?"', rw: 'Shaka ubusobanuro mu ngorane — "ibi binsigisha iki?"' },
      { en: 'Rest is resilience — protect your sleep and recovery time', rw: 'Isorore ni ingukomere — rinda itiro n\'igihe cyo gukira' },
    ]
  }
];

// ──────────────────────────────────────────────────────────────
// ARTICLE CARD COMPONENT
// ──────────────────────────────────────────────────────────────
function TopicDetail({ topic, lang, onBack }: { topic: Topic; lang: string; onBack: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [activeTab, setActiveTab] = useState<'article' | 'tips'>('article');
  const utteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);

  const isRw = lang.startsWith('rw');
  const article = isRw ? topic.articleRw : topic.articleEn;

  const handleListen = () => {
    if (!('speechSynthesis' in window)) return;
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(article);
      utterance.lang = isRw ? 'rw-RW' : 'en-US';
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const handleWatch = () => {
    setShowVideo(true);
    setVideoError(false);
  };

  const stopVideo = () => {
    setShowVideo(false);
  };

  const videoUrl = `https://www.youtube.com/embed/${topic.videoId}?autoplay=1&rel=0&modestbranding=1&cc_load_policy=1`;
  const ytFallback = `https://www.youtube.com/watch?v=${topic.videoId}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="space-y-4 pb-10"
    >
      {/* Back + Topic badge */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft size={20} />
        </button>
        <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${topic.bg} text-white`}>
          {topic.iconEmoji} {isRw ? topic.titleRw : topic.titleEn}
        </span>
      </div>

      {/* Hero */}
      <div className={`rounded-3xl bg-gradient-to-br ${topic.bg} p-6 text-white`}>
        <div className="text-5xl mb-3">{topic.iconEmoji}</div>
        <h1 className="text-2xl font-extrabold mb-1">{isRw ? topic.titleRw : topic.titleEn}</h1>
        <p className="text-white/80 text-sm leading-relaxed">{isRw ? topic.descRw : topic.descEn}</p>

        {/* Listen + Watch buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleListen}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all ${
              isPlaying
                ? 'bg-white text-primary shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {isPlaying ? (
              <>
                <span className="flex items-center gap-0.5">
                  <span className="audio-bar h-4" />
                  <span className="audio-bar h-4" />
                  <span className="audio-bar h-4" />
                  <span className="audio-bar h-4" />
                  <span className="audio-bar h-4" />
                </span>
                {isRw ? 'Hagarika' : 'Stop'}
              </>
            ) : (
              <>
                <Headphones size={16} />
                {isRw ? 'Wumva' : 'Listen'}
              </>
            )}
          </button>

          <button
            onClick={showVideo ? stopVideo : handleWatch}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all ${
              showVideo
                ? 'bg-white text-primary shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {showVideo ? <VolumeX size={16} /> : <PlayCircle size={16} />}
            {showVideo ? (isRw ? 'Hagarika Amashusho' : 'Stop Video') : (isRw ? 'Reba' : 'Watch')}
          </button>
        </div>
      </div>

      {/* Video Player */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-3xl overflow-hidden bg-black"
          >
            {!videoError ? (
              <iframe
                className="w-full aspect-video"
                src={videoUrl}
                title={isRw ? topic.titleRw : topic.titleEn}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                onError={() => setVideoError(true)}
              />
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center bg-neutral-900 text-white p-8 text-center">
                <PlayCircle size={48} className="mb-3 opacity-50" />
                <p className="text-sm mb-3">{isRw ? 'Amashusho ntashobora gutangira' : 'Video failed to load'}</p>
                <a
                  href={ytFallback}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
                >
                  <ExternalLink size={14} />
                  {isRw ? 'Reba kuri YouTube' : 'Watch on YouTube'}
                </a>
              </div>
            )}
            <div className="p-3 bg-neutral-900 flex items-center justify-between">
              <a
                href={ytFallback}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-white/70 text-xs hover:text-white transition-colors"
              >
                <ExternalLink size={12} />
                {isRw ? 'Reba kuri YouTube ↗' : 'Watch on YouTube ↗'}
              </a>
              <button onClick={stopVideo} className="text-white/50 hover:text-white text-xs transition-colors">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-primary-50 p-1 gap-1">
        {(['article', 'tips'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-primary'
            }`}
          >
            {tab === 'article'
              ? (isRw ? '📖 Inyandiko' : '📖 Article')
              : (isRw ? '💡 Inama' : '💡 Tips')}
          </button>
        ))}
      </div>

      {/* Article */}
      {activeTab === 'article' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-3xl p-5">
          {article.split('\n\n').map((para, i) => (
            <p key={i} className="text-sm text-primary-900 leading-relaxed mb-4 last:mb-0">{para}</p>
          ))}
        </motion.div>
      )}

      {/* Tips */}
      {activeTab === 'tips' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {topic.tips.map((tip, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-3 p-4 glass-card rounded-2xl"
            >
              <Lightbulb size={18} className="text-accent flex-shrink-0 mt-0.5" />
              <p className="text-sm text-primary-800 font-medium leading-relaxed">
                {isRw ? tip.rw : tip.en}
              </p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────
// MAIN EDUCATION HUB PAGE
// ──────────────────────────────────────────────────────────────
export default function EducationHubPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const isRw = lang.startsWith('rw');
  const [selected, setSelected] = useState<Topic | null>(null);

  return (
    <div className="pb-10">
      <AnimatePresence mode="wait">
        {selected ? (
          <TopicDetail
            key="detail"
            topic={selected}
            lang={lang}
            onBack={() => setSelected(null)}
          />
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="text-primary" size={28} />
                <h1 className="text-2xl font-extrabold text-primary-900 tracking-tight">
                  {isRw ? 'Igicumbi cy\'ubumenyi' : 'Educational Hub'}
                </h1>
              </div>
              <p className="text-primary-600 text-sm">
                {isRw
                  ? 'Inyigisho, amashusho n\'amajwi ku buzima bwo mu mutwe'
                  : 'Psychoeducation articles, guided audio & curated videos for mental wellness'}
              </p>
            </div>

            {/* Topic grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {topics.map((topic, idx) => (
                <motion.button
                  key={topic.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.07 }}
                  onClick={() => setSelected(topic)}
                  className="text-left group rounded-3xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  <div className={`bg-gradient-to-br ${topic.bg} p-5 flex flex-col gap-3`}>
                    <div className="text-4xl">{topic.iconEmoji}</div>
                    <div>
                      <h3 className="font-bold text-white text-sm leading-tight">
                        {isRw ? topic.titleRw : topic.titleEn}
                      </h3>
                      <p className="text-white/70 text-xs mt-1 leading-snug line-clamp-2">
                        {isRw ? topic.descRw : topic.descEn}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-white/80 text-xs">
                      <span className="flex items-center gap-1">
                        <Headphones size={11} />
                        {isRw ? 'Wumva' : 'Audio'}
                      </span>
                      <span className="flex items-center gap-1">
                        <PlayCircle size={11} />
                        {isRw ? 'Reba' : 'Video'}
                      </span>
                      <span className="flex items-center gap-1">
                        <ChevronRight size={11} />
                        {isRw ? 'Soma' : 'Read'}
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Professional Video Section */}
            <div className="pt-4 border-t border-primary-50">
               <ProfessionalVideoHub />
            </div>

            {/* Offline note */}
            <div className="glass-card rounded-2xl p-4 flex items-start gap-3">
              <Headphones size={20} className="text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-primary-900">
                  {isRw ? 'Inyigisho zose zishobora kumvwa amajwi' : 'All articles available as audio'}
                </p>
                <p className="text-xs text-primary-600 mt-0.5">
                  {isRw
                    ? 'Kanda "Wumva", "Reba" cyangwa "Soma" kuri buri nyigisho kugira ngo uyikurikire mu rurimi rwawe'
                    : 'Tap "Listen", "Watch" or "Read" on any topic to follow the content in your preferred way.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


