import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  PlayCircle,
  Headphones,
  ChevronLeft,
  X,
  Volume2,
  VolumeX,
  ExternalLink,
  Lightbulb,
  ChevronRight,
  Wind,
  HeartHandshake,
  Sparkles,
  Shield,
  Heart,
  Sun,
  Moon,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  PhoneCall,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  RefreshCw,
  Loader2,
  Check
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

// ──────────────────────────────────────────────────────────────
// TOPIC INTERFACE & CLINICAL MODULES (Lucide Icons, No Emojis)
// ──────────────────────────────────────────────────────────────
interface Topic {
  id: string;
  category: string;
  category_rw: string;
  readTime: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentColor: string;
  titleEn: string;
  titleRw: string;
  descEn: string;
  descRw: string;
  articleEn: string;
  articleRw: string;
  videoId: string;
  tips: { en: string; rw: string }[];
}

const PSYCHOEDUCATION_TOPICS: Topic[] = [
  {
    id: 'anxiety',
    category: 'Anxiety & Grounding',
    category_rw: 'Ubwoba n\'Umutuzo',
    readTime: '4 min read',
    icon: Wind,
    accentColor: '#21B48D',
    titleEn: 'Anxiety & Worry Management',
    titleRw: 'Gucunga Ubwoba n’Amanyanga',
    descEn: 'Understanding your body\'s natural alarm system, parasympathetic breathing, and how to interrupt panic spirals.',
    descRw: 'Gusobanukirwa uko umubiri wawe witwara mu bihe by’ubwoba, uburyo bwo guhumeka buhumuriza, no kugarura ituze.',
    videoId: 'WWloIAQpMcQ',
    articleEn: `Anxiety is your body's built-in survival system — it is not a flaw, it is evolutionary biology at work. When your brain perceives a potential threat (real or anticipated), it activates the sympathetic nervous system, releasing adrenaline that elevates heart rate and triggers rapid breathing. This is the physiological "fight-or-flight" response.

In modern daily life, our nervous systems cannot always distinguish between an immediate physical predator and situational stressors like deadlines, social expectations, or unresolved worries. Consequently, our bodies become activated by everyday triggers.

The 4-7-8 Breathing Technique: One of the most researched methods to signal safety to your nervous system. Inhale smoothly through your nose for 4 counts, gently hold for 7 counts, and exhale completely through your mouth for 8 counts. The extended exhalation stimulates the vagus nerve, initiating your parasympathetic relaxation response.

The 5-4-3-2-1 Sensory Grounding Technique: When anxiety projects your mind into future catastrophes, your physical senses anchor you back to safety:
• Name 5 things you can see around you.
• Name 4 things you can physically touch.
• Name 3 distinct sounds you can hear.
• Name 2 scents you can identify.
• Name 1 taste or swallow slowly.

Remember: anxiety is a physiological signal, not a character flaw. Your nervous system can be trained toward calm through daily practice.`,
    articleRw: `Ubwoba ni uburyo rusange umubiri wacu ukoresha mu kwirinda akaga — si ubumuga cyangwa intege nke, ni uburyo karemano bwo kubaho. Iyo ubwonko bwawe bwumvise ko hari ikintu kiguteye ubwoba, buhagarika umutuzo bugatanga umusemburo wa adrenaline utuma umutima utera vuba n'amaraso agana mu mitsi.

Mu buzima bwa none, ubwonko ntibubasha buri gihe gutandukanya akaga k'ukuri n'ibibazo by'akazi, amasomo, cyangwa ibitekerezo byo mu mutwe. Bityo, umubiri wacu ushobora kwikanga no guhangayika bitari ngombwa.

Uburyo bwo guhumeka bwa 4-7-8: Bumwe mu buryo buzwi bufasha gucururuka. Humeka buhoro mu mazuru mu masegonda 4, gumana umwuka mu masegonda 7, hanyuma usohore umwuka wose mu kanwa mu masegonda 8. Ibi bitanga ubutumwa ku bwonko ko nta kaga gakomeye gahari.

Uburyo bwa 5-4-3-2-1 bwo kwiyumvamo ituze: Iyo ibitekerezo bikujyanye mu bwoba bw'ejo hazaza, garura ubwenge ku byo urimo ubu:
• Reba ibintu 5 ubona mu maso yawe.
• Kora ku bintu 4 ushobora gukoraho.
• Tegereza amatwi wumve amajwi 3 akuzengurutse.
• Huha cyangwa unuke impumuro 2.
• Simbuka cyangwa wiyumvemo icyanga 1 mu kanwa.

Ibuka: Ubwoba si umwanzi wawe. Ni ikimenyetso cy'umubiri gishobora gutuzwa binyuze mu myitozo yo guhumeka no kwiyitaho buri munsi.`,
    tips: [
      { en: 'Practice 4-7-8 breathing twice daily to train vagal tone', rw: 'Kora imyitozo yo guhumeka ya 4-7-8 kabiri ku munsi' },
      { en: 'Use the 5-4-3-2-1 grounding exercise when your thoughts begin to race', rw: 'Koresha uburyo bwa 5-4-3-2-1 iyo wumvise ibitekerezo byikubye' },
      { en: 'Ask yourself: "Is this thought an absolute certainty, or an anxious assumption?"', rw: 'Baza umutima wawe: "Ese ibi ni ukuri kudakuka, cyangwa ni ubwoba gusa?"' },
      { en: 'Limit afternoon caffeine intake and aim for consistent sleep cycles', rw: 'Gabanya kawa cyangwa ibinyobwa birimo caffeine mu masaha y\'umugoroba' },
      { en: 'Gentle physical movement releases built-up muscular tension', rw: 'Gukora imyitozo ngororangingo yoroshye birwanya umunaniro mu mubiri' }
    ]
  },
  {
    id: 'depression',
    category: 'Mood Care',
    category_rw: 'Imitekerereze',
    readTime: '5 min read',
    icon: HeartHandshake,
    accentColor: '#10B981',
    titleEn: 'Depression & Low Mood Recovery',
    titleRw: 'Kwikura mu Gahinda n’Umuturiro',
    descEn: 'Understanding low mood cycles, brain neurochemistry, and behavioral activation steps to rebuild daily momentum.',
    descRw: 'Gusobanukirwa impamvu z’agahinda k’igihe kirekire n’intambwe ntoya zo kugarura imbaraga n’ibyishimo mu buzima.',
    videoId: 'z-IR48Mb3W0',
    articleEn: `Depression is one of the most widely diagnosed mental health conditions globally, yet it remains profoundly misunderstood — often unfairly mischaracterized as "laziness," "spiritual weakness," or lack of willpower. In modern clinical psychiatry, this assumption is recognized as medically inaccurate and deeply stigmatizing.

Depression involves measurable neurochemical shifts affecting neurotransmitters like serotonin, norepinephrine, and dopamine. It alters neural connectivity governing motivation, concentration, sleep rhythms, and emotional processing. It is not a choice, and you cannot simply "snap out of it" through willpower alone.

Common Clinical Signs: Persistent emptiness or heavy sadness, loss of pleasure in previously enjoyed passions (anhedonia), pervasive cognitive fatigue, disrupted sleep patterns, feelings of worthlessness, and difficulty starting small tasks.

Behavioral Activation (The Evidence-Based First Step): Depression naturally inclines individuals toward social withdrawal and inactivity. However, inactivity further starves the brain of positive reinforcement, deepening the depressive loop. Behavioral activation reverses this momentum: action precedes motivation. Do not wait until you feel motivated — take microscopic, guaranteed actions first (e.g., drink a glass of water, step outside into morning daylight for 4 minutes, make your bed).

You deserve supportive care. Reading this psychoeducation is an active step forward. Professional psychologists and counseling specialists are available in Rwanda to walk beside you.`,
    articleRw: `Agahinda gakabije (depression) ni ikibazo cy’ubuzima bwo mu mutwe gifata abantu benshi ku isi, ariko kenshi ntigisobanukirwe neza — rimwe na rimwe kigafatwa nk’ubunebwe, intege nke, cyangwa kutagira ukwemera. Mu buvuzi bwa kijyambere, ibi ntaho bihuriye n'ukuri.

Agahinda gakabije kagaragaza impinduka zifatika mu bwonko (neurotransmitters nka serotonin na dopamine), bikagira ingaruka ku buryo wiyumva, uko utekereza, n'uburyo ukora imirimo ya buri munsi. Si ikosa ryawe, kandi si amahitamo yawe.

Ibimenyetso bisanzwe: Kumva nta byishimo mu bintu wari usanzwe ukunda, umunaniro udashira n'ubwo waba waryamye, kwiheba, kubura ibitotsi cyangwa kuryama birenze urugero, no gutinya guhura n'abandi.

Intambwe y’Ibikorwa Bito (Behavioral Activation): Agahinda gatuma umuntu yigunga, nyamara uko wigunga ni ko agahinda kiyongera. Igisubizo ni ugutangira gukora ibikorwa bito cyane bitagusaba imbaraga nyinshi: Gukora uburiri bwawe, gusohoka hanze iminota 5 ukabona urumuri rw'izuba, cyangwa koherereza inshuti ubutumwa bugufi.

Ukwiye kubona ubufasha n'amahoro mu mutima. Inzobere mu buzima bwo mu mutwe ziri mu Rwanda ziteguye kugutega amatwi no kugufasha.`,
    tips: [
      { en: 'Break your day into tiny, manageable micro-goals', rw: 'Gabaganya umunsi wawe mu bikorwa bito cyane byoroshye gukora' },
      { en: 'Prioritize natural morning sunlight exposure within 30 minutes of waking', rw: 'Reba urumuri rw\'izuba rya mugitondo mu minota ya mbere yo kubyuka' },
      { en: 'Reach out to one trusted friend — connection disrupts depressive isolation', rw: 'Vugana n\'inshuti imwe wizeye — kumenya ko uri kumwe n\'abandi birafasha' },
      { en: 'Challenge self-critical thoughts with clinical compassion', rw: 'Wikwirakarira igihe wumva unaniwe — gira impuhwe ku mubiri wawe' },
      { en: 'Schedule professional counseling whenever low mood persists beyond two weeks', rw: 'Gana inzobere mu buvuzi igihe agahinda kamaze ibyumweru birenze bibiri' }
    ]
  },
  {
    id: 'stress',
    category: 'Stress Mastery',
    category_rw: 'Umunaniro',
    readTime: '3 min read',
    icon: Sparkles,
    accentColor: '#3B82F6',
    titleEn: 'Stress Mastery & Burnout Prevention',
    titleRw: 'Gucunga Umunaniro n’Uburakari',
    descEn: 'Science-backed strategies to manage demands, protect mental energy, and restore physical equilibrium.',
    descRw: 'Uburyo bwa gihanga bwo kwirinda kurengerwa n’inshingano, kurinda intege zo mu mutwe, no kugarura umutuzo.',
    videoId: 'RcGyVTAoXEU',
    articleEn: `Stress is a biological feedback mechanism that mobilizes energy to solve acute problems. A moderate amount of stress can enhance cognitive clarity and drive performance — psychologists categorize this as "eustress." However, chronic, unmanaged stress depletes cortisol reserves, impairs the immune system, and contributes to burnout.

Progressive Muscle Relaxation (PMR): Chronic stress causes unconscious muscular contractions throughout the shoulders, jaw, and lower back. PMR systematically tightens muscle groups for 5 seconds and abruptly releases them, teaching the central nervous system the tactile difference between tension and absolute relaxation.

The "Worry Boundary" Principle: Anxious rumination often hijacks the entire day. Dedicate an intentional 15-minute slot each evening (e.g., 5:30 PM) as your designated reflection time. When repetitive worries intrude outside that window, gently postpone them: "I will review this thoroughly at 5:30 PM." This cognitive boundary reduces intrusive loops.

Social buffering: Engaging in genuine, authentic dialogue with a trusted person significantly lowers circulating cortisol levels. You do not have to carry obligations alone.`,
    articleRw: `Umunaniro (stress) ni igice gisanzwe cy'ubuzima kigaragaza ko umubiri uri gukoresha imbaraga mu gukemura ibibazo. Icyakora, iyo umunaniro ubaye uw'igihe kirekire udacunzwe, ugira ingaruka mbi ku bwirinzi bw'umubiri, ku itiro, no ku mutuzo w'umutima.

Kworoshya Imitsi (Progressive Muscle Relaxation): Umunaniro utuma imitsi yo mu bitugu, mu rwasaya, no mu mugongo ikomera tutabizi. Itegereze aho ufite umurego, unanure uwo mwanya imasegonda 5, hanyuma woroshye burundu. Ibi bifasha umubiri kumva itandukaniro ryo gukomera no gutuza.

Gushyiraho Igihe cyo Gutekereza ku Bibazo: Aho kugira ngo ibibazo bikwirukankane umunsi wose, teka iminota 15 buri mugoroba yo kwicara ugakemura ibyo utekereza. Iyo ibitekerezo bije ku manywa, ibwire uti: "Ibi ndabikemura saa kumi n'imwe n'igice."

Kuganira n'abandi: Gusangira ibikuremereye n'umuntu wizeye bigabanya imisemburo y'umunaniro mu mubiri mu buryo bugaragara. Ntukikoreye umutwaro wenyine.`,
    tips: [
      { en: 'Identify your non-negotiable stress signals (jaw clenching, shallow breathing)', rw: 'Menya ibimenyetso byawe by\'ibanze by\'umunaniro (gukanyaga amenyo, guhumeka nabi)' },
      { en: 'Use progressive muscle relaxation before sleep to release tension', rw: 'Koresha imyitozo yo kworoshya imitsi mbere yo kuryama' },
      { en: 'Set explicit boundaries between working hours and restorative personal time', rw: 'Tandukanya neza amasaha y\'akazi n\'amasaha yo kuruhuka' },
      { en: 'Spend at least 15 minutes outdoors connecting with nature', rw: 'Fata byibura iminota 15 yo gutembera hanze ahari amahumbezi' }
    ]
  },
  {
    id: 'trauma',
    category: 'Trauma Care',
    category_rw: 'Ihungabana',
    readTime: '6 min read',
    icon: Shield,
    accentColor: '#8B5CF6',
    titleEn: 'Trauma Recovery & Emotional Healing',
    titleRw: 'Gukira Ihungabana n’Ibikomere',
    descEn: 'Understanding trauma pathways, emotional windows of tolerance, and culturally rooted collective resilience in Rwanda.',
    descRw: 'Gusobanukirwa uko ihungabana ribaho, uburyo bwo gukira ibikomere, n’imbaraga z’ubufatanye mu muco nyarwanda.',
    videoId: 'G7zAseaIyFA',
    articleEn: `Trauma is not fundamentally the traumatic event itself — it is the lasting imprint left upon the autonomic nervous system when an experience overwhelms our capacity to process it safely. Trauma responses like hypervigilance, emotional numbness, and intrusive memories are not signs of personal brokenness; they are protective survival adaptations that once kept you safe.

Rwanda holds a unique and profound history of collective resilience and reconciliation following the 1994 Genocide against the Tutsi. Healing from severe historical or personal trauma takes time, compassion, and shared solidarity.

The Window of Tolerance: Trauma therapy operates by helping individuals remain within an optimal emotional "window" — neither hyperaroused (panic, rage, panic attacks) nor hypoaroused (emotional dissociation, total numbness). Mindful grounding practices assist in restoring your nervous system to this safe zone.

Trauma-Focused Cognitive Behavioral Therapy (TF-CBT) and Eye Movement Desensitization and Reprocessing (EMDR) are evidence-based, scientifically proven clinical treatments available through licensed psychiatric centers in Rwanda. Healing is not linear, but whole recovery is achievable.`,
    articleRw: `Ihungabana si igikorwa cyabaye cyonyine — ni ibikomere n'ingaruka bisigara mu mikorere y'ubwonko n'umubiri igihe ibyabaye byarenze ubushobozi bw'umuntu bwo kubyihanganira. Kumva uhangayitse buri kanya, gushiguka, cyangwa kumva nta byiyumvo ufite si intege nke; ni uburyo umubiri wakoresheje mu kwirinda akaga.

U Rwanda rufite amateka yihariye yo kwiyubaka no gukira ibikomere nyuma ya Jenoside yakorewe Abatutsi mu 1994. Gukira ibikomere by’amateka cyangwa iby’ubuzima bisaba igihe, impuhwe, no gushyigikirana mu muryango.

Gutuza mu Mutima (Window of Tolerance): Ubufasha bwa muganga bufasha umuntu kutarengerwa n’ubwoba bukabije cyangwa ngo yigungire mu kababaro kadashira. Imyitozo yo kwiyumvamo umutuzo ifasha umubiri kugaruka mu mudendezo.

Uburyo bwa TF-CBT na EMDR ni uburyo bwizewe bw’ubuvuzi bukoreshwa n’abaganga b’inzobere mu Rwanda mu gufasha abantu gukira ibikomere by’ihungabana. Gukira birashoboka, kandi ntabwo uri wenyine.`,
    tips: [
      { en: 'Remind yourself: Trauma responses are protective survival adaptations', rw: 'Ibuka ko ibimenyetso by\'ihungabana ari uburyo umubiri wakoresheje mu kwirinda' },
      { en: 'Grounding in the present moment interrupts trauma flashbacks', rw: 'Kwibuka ko uri ahantu hatekanye ubu birwanya gushiguka' },
      { en: 'Healing unfolds gradually — honor good days and difficult days equally', rw: 'Gukira bifata igihe — jya wishimira intambwe yose uteye' },
      { en: 'Connect with certified trauma specialists at CARAES Ndera or local district clinics', rw: 'Gana inzobere z\'ubuvuzi bwo mu mutwe nko muri CARAES Ndera cyangwa ibitaro bya leta' }
    ]
  },
  {
    id: 'grief',
    category: 'Grief Care',
    category_rw: 'Akababaro',
    readTime: '4 min read',
    icon: Heart,
    accentColor: '#EC4899',
    titleEn: 'Navigating Grief & Significant Loss',
    titleRw: 'Kwakira Akababaro k’Urupfu',
    descEn: 'Understanding the non-linear waves of grief, honoring memories, and finding gentle space to heal.',
    descRw: 'Gusobanukirwa imiterere y’akababaro, kwibuka abacu twakundaga, no kubona ituze ryo gukomeza ubuzima.',
    videoId: 'NDQ1Mi5I4rg',
    articleEn: `Grief has been described as love with nowhere to go. When someone or something irreplaceable is lost, that love does not dissolve — it translates into the aching weight of absence. This grief is not a clinical pathology; it is the natural consequence of having deeply bonded with another human being.

The Myth of Sequential Stages: Modern psychological science emphasizes that grief does not follow rigid, orderly stages. In reality, grief moves in undulating waves — crashing with sudden intensity on some days, softening into gentle reflection on others.

Experiencing grief can include sudden tears, deep physical exhaustion, feelings of guilt, numbness, or even unexpected moments of laughter followed by self-reproach. Experiencing momentary joy does not mean you care any less; it reflects your nervous system seeking balance.

Allow yourself to honor your loved ones in ways that feel authentic to your heart. Healing does not mean forgetting; it means learning how to carry love forward with peace.`,
    articleRw: `Akababaro k'umuntu wapfuye ni urukundo rusigaye rudafite aho rugana. Iyo tubuze umuntu w'agaciro gakomeye, urwo rukundo ntirushira — ruhinduka agahinda ko kutamubona iruhande rwacu. Aka kababaro si uburwayi; ni ikimenyetso cy'uko wamukunze by'ukuri.

Akababaro ntikagira amatariki ahamye: Abahanga mu mitekerereze bagaragaza ko akababaro kaza mu buryo butunguranye — rimwe kaza ari kenshi cyane, ubundi kagatanga agahenge.

Buri wese yakira akababaro mu buryo bwe: Ushobora kurira, kumva unaniwe cyane mu mubiri, cyangwa rimwe na rimwe ukishima mu mwanya muto. Kugerageza guseka ntibisobanura ko wibagiwe uwakuvuyemo; ni umutima uri gushaka ituze.

Fata umwanya wo kwibuka abavandimwe n'inshuti mu ituze no kubaha. Gukira ntibivuze kwibagirwa; bivuze kwiga gukomeza ubuzima ufite ituze mu mutima.`,
    tips: [
      { en: 'Allow your emotions to surface without judgment or forced timelines', rw: 'Irekure wumve uko umeze nta kwicira urubanza cyangwa kwihutisha ibintu' },
      { en: 'Talk openly about fond memories with supportive family members', rw: 'Sangira amateka meza n\'abandi bo mu muryango bakumva' },
      { en: 'Maintain gentle daily routines for nutrition, hydration, and sleep', rw: 'Komeza gufata amafunguro meza no kuryama neza uko bishoboka' },
      { en: 'Seek grief counseling if daily functioning remains severely impaired', rw: 'Gana inzobere mu kwakira ibyago niba ubuzima bwawe bwahungabanye cyane' }
    ]
  },
  {
    id: 'resilience',
    category: 'Hope & Ubuntu',
    category_rw: 'Icyizere',
    readTime: '4 min read',
    icon: Sun,
    accentColor: '#F59E0B',
    titleEn: 'Cultivating Hope & Personal Resilience',
    titleRw: 'Kubaka Icyizere n’Imbaraga',
    descEn: 'Harnessing neuroplasticity, small compounding habits, and the Rwandan philosophy of Ubuntu to navigate challenges.',
    descRw: 'Gukoresha ubushobozi bw’ubwonko bwo kwiyubaka, intambwe nto z’ingirakamaro, n’ubumuntu mu kurenga imbogamizi.',
    videoId: '_X0mgOOSpLU',
    articleEn: `Resilience is not the stoic absence of emotional pain. It is the capacity to endure adversity, adapt flexibly, and continue stepping forward — changed by the journey, but fortified within. The most resilient individuals are not those who suffer the least; they are those who build practical internal tools, cultivate deep social relationships, and maintain realistic optimism.

Neuroplasticity: The human brain possesses lifelong neuroplasticity — the physical ability to forge new synaptic pathways in response to deliberate practice and new cognitive choices. Every time you consciously practice self-compassion, grounding, or gratitude, you are wiring the biological architecture of resilience.

Small Wins Compound: Experiencing even tiny, dependable successes releases dopamine, which naturally motivates further positive behavior. Clean a single corner of your room, take ten deep breaths, or drink water. Small intentional actions trigger an upward spiral.

Ubuntu — "I am because we are": Rwandan culture embodies relational resilience. We heal best when supported within community. Leaning into trusted connections is a profound strength.`,
    articleRw: `Gukomera mu bitekerezo (resilience) ntibivuze ko utababara. Bivuze ubushobozi bwo guhangana n'ibikomeye, guhindura uburyo ubyitwaramo, no gukomeza intambwe y'imbere. Abantu bakomeye si abatarahuye n'ibibazo; ni abubaka imbaraga z'imbere n'ubucuti bukomeye.

Ubwonko bwikorera imbaraga nshya (Neuroplasticity): Ubwonko bw'umuntu bufite ubushobozi bwo kwiyubaka buri gihe bitewe n'ibyo uhitamo gukora. Buri gihe uhisemo kugirira impuhwe umubiri wawe no gushimira ku byo ufite, uri kubaka imbaraga nshya z'ubwenge.

Intsinzi nto ziratubuka: Kugira icyo ugeraho n'ubwo cyaba gito cyane bitanga imbaraga zo gukora ikindi cyiza. Sukura akantu kamwe, humeka neza inshuro 10, cyangwa nywa amazi. Ibi bitangiza urugendo rwiza.

Ubumuntu: Umico w'u Rwanda utwibutsa ko umuntu ari umuntu ku bw'abandi. Twikura mu bibazo byoroshye iyo dufatanyije n'abandi. Kwiyambaza inshuti n'inzobere ni ubupfura n'ubutwari.`,
    tips: [
      { en: 'Celebrate micro-achievements daily — momentum builds resilience', rw: 'Jya wishimira utuntu duto wagezeho buri munsi — bitera ingufu' },
      { en: 'Nurture 2-3 genuine, safe relationships based on mutual trust', rw: 'Kubaka umubano mwiza n\'inshuti 2 cyangwa 3 wizeye' },
      { en: 'Notice three positive observations every morning to train optimistic attention', rw: 'Vuga ibintu 3 ushimira buri gitondo kugira ngo utegure ubwonko neza' },
      { en: 'Restorative sleep is foundational to cognitive and emotional resilience', rw: 'Kuruhuka neza ni inkingi ikomeye yo kugira imitekerereze myiza' }
    ]
  }
];

// In-memory cache for clinical video collection & psychoeducation modules
let cachedClinicalVideos: any[] | null = null;
let cachedTopics: Topic[] | null = null;

export default function EducationHubPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const isRw = lang.startsWith('rw');
  const navigate = useNavigate();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);

  // Dynamic Psychoeducation Modules from Database
  const [topicsList, setTopicsList] = useState<Topic[]>(() => cachedTopics || PSYCHOEDUCATION_TOPICS);
  const [topicsLoading, setTopicsLoading] = useState<boolean>(!cachedTopics);

  // Dynamic Clinical Videos from Database
  const [clinicalVideos, setClinicalVideos] = useState<any[]>(() => cachedClinicalVideos || []);
  const [videosLoading, setVideosLoading] = useState<boolean>(!cachedClinicalVideos);

  // Active Video Modal
  const [activeVideoModal, setActiveVideoModal] = useState<{ title: string; videoId: string } | null>(null);

  // Audio Playback State
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Interactive 4-7-8 Breathing Pacer State
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathingCounter, setBreathingCounter] = useState(4);

  // Completed tips tracker
  const [completedTips, setCompletedTips] = useState<Record<string, boolean>>({});

  // ── 1. Fetch Psychoeducation Modules & Clinical Videos from Database ──
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        // A. Fetch verified psychoeducation modules from database
        const { data: dbPosts, error: postsErr } = await supabase
          .from('community_posts')
          .select('*')
          .eq('circle_id', 'psychoeducation');

        if (!postsErr && dbPosts && dbPosts.length > 0 && isMounted) {
          // Merge dynamic database updates with psychoeducation topics
          const merged = PSYCHOEDUCATION_TOPICS.map((t) => {
            const found = dbPosts.find((p) => p.tag === t.id);
            if (found) {
              return {
                ...t,
                // Keep richest text and sync updates
                articleEn: found.content || t.articleEn,
                articleRw: found.content_rw || t.articleRw
              };
            }
            return t;
          });
          cachedTopics = merged;
          setTopicsList(merged);
        }

        // B. Fetch verified clinical videos from database
        const { data: vids, error: vidsErr } = await supabase
          .from('professional_videos')
          .select('*, profiles:professional_id(full_name)')
          .order('created_at', { ascending: false });

        if (!vidsErr && vids && isMounted) {
          cachedClinicalVideos = vids;
          setClinicalVideos(vids);
        }
      } catch (err) {
        console.error('Data sync note:', err);
      } finally {
        if (isMounted) {
          setTopicsLoading(false);
          setVideosLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // ── Filtered Topics ──
  const filteredTopics = useMemo(() => {
    return topicsList.filter((t) => {
      const matchCategory =
        selectedCategory === 'all' ||
        t.id === selectedCategory;

      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        t.titleEn.toLowerCase().includes(q) ||
        t.titleRw.toLowerCase().includes(q) ||
        t.descEn.toLowerCase().includes(q) ||
        t.descRw.toLowerCase().includes(q);

      return matchCategory && matchSearch;
    });
  }, [topicsList, searchQuery, selectedCategory]);

  // ── Audio Speech Synthesis ──
  const toggleAudio = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isAudioPlaying) {
      window.speechSynthesis.cancel();
      setIsAudioPlaying(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsAudioPlaying(false);
      utterance.onerror = () => setIsAudioPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsAudioPlaying(true);
    }
  };

  // Stop speech when navigating
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeTopic]);

  // ── Interactive 4-7-8 Breathing Pacer Timer ──
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (breathingActive) {
      timer = setInterval(() => {
        setBreathingCounter((prev) => {
          if (prev <= 1) {
            setBreathingPhase((current) => {
              if (current === 'inhale') {
                return 'hold';
              } else if (current === 'hold') {
                return 'exhale';
              } else {
                return 'inhale';
              }
            });
            if (breathingPhase === 'inhale') return 7;
            if (breathingPhase === 'hold') return 8;
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [breathingActive, breathingPhase]);

  const toggleTip = (id: string) => {
    setCompletedTips((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-[#F4F8F6] text-[#08352A] font-poppins p-4 sm:p-8 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8 pb-12">

        {/* ── TOP HEADER SECTION ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E2F2EC] text-[#08352A] text-xs font-bold uppercase tracking-wider mb-2.5">
              <span className="w-2 h-2 rounded-full bg-[#21B48D] animate-ping" />
              <span>{isRw ? 'Igicumbi cy’Ubumenyi • Rwanda' : 'Psychoeducation Hub • Mental Wellness'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#08352A] tracking-tight">
              {isRw ? 'Igicumbi cy’Ubumenyi n’Imyitozo yo mu Mutwe' : 'Psychoeducation & Mind Wellness Hub'}
            </h1>
            <p className="text-xs sm:text-sm text-[#5E8E81] mt-1.5 max-w-2xl font-normal leading-relaxed">
              {isRw
                ? 'Soma inyandiko zizewe, kurikira amashusho y’abaganga b’inzobere, kandi ukoreshe imyitozo ifatika yo guhumeka no kwiyumvamo ituze mu Kinyarwanda cyangwa Icyongereza.'
                : 'Evidence-based articles, guided audios, interactive breathing exercises, and clinical video insights curated by licensed mental health specialists in Rwanda.'}
            </p>
          </div>

          {/* Quick Rwanda 114 Toll-Free Lifeline */}
          <div className="flex items-center gap-3 self-start md:self-auto flex-shrink-0 flex-wrap">
            <a
              href="tel:114"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#08352A] hover:bg-[#154E3F] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              <PhoneCall size={14} className="text-[#21B48D]" />
              <span>114 Toll-Free RBC</span>
            </a>
            <button
              onClick={() => navigate('/patient/meet-professional')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-[#EBF3EF] border border-[#DCEBE3] text-[#08352A] text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <UserCheck size={14} className="text-[#21B48D]" />
              <span>{isRw ? 'Gana Umuganga' : 'Consult Specialist'}</span>
            </button>
          </div>
        </div>

        {/* ── INTERACTIVE 4-7-8 BREATHING PACER WIDGET ── */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-[#DFEBE5] shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E2F2EC] text-[#08352A] text-[10px] font-bold uppercase tracking-wider">
              <Wind size={12} className="text-[#21B48D]" />
              <span>{isRw ? 'Imyitozo yo Guhumeka' : 'Interactive Relaxation Pacer'}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-[#08352A]">
              {isRw ? 'Imyitozo ya 4-7-8 yo Guhumeka no Gutuza' : '4-7-8 Guided Breathing Exercise'}
            </h3>
            <p className="text-xs text-[#5E8E81] leading-relaxed font-normal">
              {isRw
                ? 'Iyi myitozo ikangura urwungano rurinda umubiri umunaniro (parasympathetic nervous system). Koresha iyi shusho igufasha guhumeka neza.'
                : 'Clinically proven to reduce heart rate and quiet anxiety by stimulating the vagus nerve. Follow the expanding rhythm below.'}
            </p>
            <div className="pt-2">
              <button
                onClick={() => setBreathingActive(!breathingActive)}
                className="px-5 py-2.5 rounded-full bg-[#08352A] hover:bg-[#154E3F] text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Wind size={14} className="text-[#21B48D]" />
                <span>
                  {breathingActive
                    ? (isRw ? 'Hagarika Imyitozo' : 'Stop Exercise')
                    : (isRw ? 'Tangira Guhumeka (Start)' : 'Start Guided Breathing')}
                </span>
              </button>
            </div>
          </div>

          {/* Animated Breathing Circle */}
          <div className="relative flex items-center justify-center w-40 h-40 flex-shrink-0">
            <motion.div
              animate={{
                scale: breathingActive
                  ? breathingPhase === 'inhale'
                    ? 1.35
                    : breathingPhase === 'hold'
                    ? 1.35
                    : 0.85
                  : 1
              }}
              transition={{
                duration: breathingActive
                  ? breathingPhase === 'inhale'
                    ? 4
                    : breathingPhase === 'hold'
                    ? 7
                    : 8
                  : 1,
                ease: 'easeInOut'
              }}
              className="absolute inset-0 rounded-full bg-[#E2F2EC] border border-[#21B48D]/40"
            />
            <div className="relative z-10 text-center space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#21B48D]">
                {breathingActive
                  ? breathingPhase === 'inhale'
                    ? (isRw ? 'Humeka' : 'Inhale')
                    : breathingPhase === 'hold'
                    ? (isRw ? 'Gumana' : 'Hold')
                    : (isRw ? 'Sohora' : 'Exhale')
                  : (isRw ? 'Umutuzo' : 'Ready')}
              </span>
              <p className="text-2xl font-black text-[#08352A]">
                {breathingActive ? `${breathingCounter}s` : '4-7-8'}
              </p>
            </div>
          </div>
        </div>

        {/* ── SEARCH & CATEGORY FILTER BAR ── */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#DFEBE5] space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8DB4A8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRw ? 'Shakisha inyandiko ku bwoba, agahinda, cyangwa umunaniro...' : 'Search articles on anxiety, depression, trauma, stress...'}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F4F8F6] border border-[#DCEBE3] text-xs font-medium text-[#08352A] placeholder-[#8DB4A8] outline-none focus:border-[#21B48D] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8DB4A8] hover:text-[#08352A]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-[#5E8E81] self-end sm:self-auto flex-shrink-0">
              <Filter size={14} className="text-[#21B48D]" />
              <span>
                {filteredTopics.length} {isRw ? 'Inyigisho Ziboneka' : 'Topics Available'}
              </span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#08352A] text-white shadow-xs'
                  : 'bg-[#F4F8F6] text-[#08352A] hover:bg-[#E8F3EE] border border-[#DCEBE3]'
              }`}
            >
              {isRw ? 'Inyigisho Zose (All)' : 'All Topics'}
            </button>

            {topicsList.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setSelectedCategory(topic.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                  selectedCategory === topic.id
                    ? 'bg-[#08352A] text-white shadow-xs'
                    : 'bg-[#F4F8F6] text-[#08352A] hover:bg-[#E8F3EE] border border-[#DCEBE3]'
                }`}
              >
                {isRw ? topic.titleRw : topic.titleEn}
              </button>
            ))}
          </div>
        </div>

        {/* ── PSYCHOEDUCATION TOPICS GRID ── */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#08352A]">
              {isRw ? 'Inyigisho Z’Ubuzima bwo mu Mutwe' : 'Psychoeducation Knowledge Modules'}
            </h2>
            <span className="text-xs text-[#5E8E81] font-semibold">
              {filteredTopics.length} {isRw ? 'Byatoranyijwe' : 'Evidence-Based Modules'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map((topic) => {
              const IconComp = topic.icon;

              return (
                <div
                  key={topic.id}
                  onClick={() => setActiveTopic(topic)}
                  className="bg-white rounded-[2rem] p-6 sm:p-7 border border-[#DFEBE5] hover:border-[#21B48D] transition-all hover:shadow-md flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    {/* Header category badge & read time — Clean flex layout */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="text-[10px] font-bold text-[#21B48D] bg-[#E8F3EE] px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap truncate">
                        {isRw ? topic.category_rw : topic.category}
                      </span>
                      <span className="text-[10px] text-[#8DB4A8] font-semibold flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                        <Clock size={11} />
                        {topic.readTime}
                      </span>
                    </div>

                    {/* Topic Icon Container */}
                    <div className="w-14 h-14 rounded-2xl bg-[#E2F2EC] border border-[#CDE5DC] flex items-center justify-center text-[#08352A] mb-4 group-hover:scale-105 transition-transform shadow-2xs">
                      <IconComp size={24} className="text-[#08352A]" />
                    </div>

                    <h3 className="text-lg font-extrabold text-[#08352A] group-hover:text-[#21B48D] transition-colors leading-tight mb-2">
                      {isRw ? topic.titleRw : topic.titleEn}
                    </h3>
                    <p className="text-xs text-[#5E8E81] leading-relaxed line-clamp-3 font-normal mb-5">
                      {isRw ? topic.descRw : topic.descEn}
                    </p>
                  </div>

                  {/* Card Bottom Media Badges with direct interactive triggers */}
                  <div className="pt-3 border-t border-[#F0F5F2] flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[11px] text-[#71968B] font-medium">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAudio(isRw ? topic.articleRw : topic.articleEn);
                        }}
                        className="flex items-center gap-1 hover:text-[#21B48D] transition-colors py-1 cursor-pointer"
                        title="Listen to audio narration"
                      >
                        <Headphones size={13} className="text-[#21B48D]" />
                        <span>{isRw ? 'Ijwi' : 'Audio'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveVideoModal({
                            title: isRw ? topic.titleRw : topic.titleEn,
                            videoId: topic.videoId
                          });
                        }}
                        className="flex items-center gap-1 hover:text-[#21B48D] transition-colors py-1 cursor-pointer"
                        title="Watch video overview"
                      >
                        <PlayCircle size={13} className="text-[#21B48D]" />
                        <span>{isRw ? 'Video' : 'Video'}</span>
                      </button>
                    </div>

                    <div
                      className="w-8 h-8 rounded-full bg-[#08352A] group-hover:bg-[#21B48D] text-white flex items-center justify-center transition-colors shadow-xs"
                      title="Open full article"
                    >
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── VERIFIED CLINICAL VIDEO GUIDES (FROM DATABASE) ── */}
        <div className="space-y-4 pt-4 border-t border-[#DFEBE5]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#08352A]">
                {isRw ? 'Amashusho y’Inzobere zo mu Rwanda' : 'Verified Clinical Video Insights'}
              </h2>
              <p className="text-xs text-[#5E8E81] mt-0.5">
                {isRw
                  ? 'Amashusho magufi atangwa n’abaganga b’inzobere mu buvuzi bwo mu mutwe mu Rwanda.'
                  : 'Practical video guides delivered by licensed Rwandan psychiatrists and psychologists.'}
              </p>
            </div>
            <span className="text-xs text-[#5E8E81] font-semibold">
              {clinicalVideos.length} {isRw ? 'Amashusho' : 'Video Guides'}
            </span>
          </div>

          {videosLoading && clinicalVideos.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-6 border border-[#DCEBE3] h-60" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {clinicalVideos.map((vid) => (
                <div
                  key={vid.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-[#DFEBE5] hover:border-[#21B48D] transition-all hover:shadow-md flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div
                      onClick={() =>
                        setActiveVideoModal({
                          title: isRw ? (vid.title_rw || vid.title_en) : vid.title_en,
                          videoId: vid.video_url
                        })
                      }
                      className="relative w-full aspect-video rounded-2xl overflow-hidden bg-neutral-900 cursor-pointer shadow-xs group-hover:scale-[1.01] transition-transform"
                    >
                      <img
                        src={vid.thumbnail_url || `https://img.youtube.com/vi/${vid.video_url}/mqdefault.jpg`}
                        alt={vid.title_en}
                        className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#08352A]/80 text-white flex items-center justify-center group-hover:bg-[#21B48D] transition-colors shadow-lg">
                          <PlayCircle size={26} />
                        </div>
                      </div>
                      <div className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-bold">
                        {vid.category || 'Clinical Guidance'}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-[#08352A] text-base group-hover:text-[#21B48D] transition-colors leading-snug">
                        {isRw ? (vid.title_rw || vid.title_en) : vid.title_en}
                      </h4>
                      <p className="text-xs text-[#5E8E81] mt-1 line-clamp-2 leading-relaxed">
                        {isRw ? (vid.description_rw || vid.description_en) : vid.description_en}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#F0F5F2] flex items-center justify-between">
                    <span className="text-[11px] text-[#21B48D] font-bold flex items-center gap-1.5">
                      <UserCheck size={12} />
                      <span>{vid.profiles?.full_name || 'Rwandan Clinical Specialist'}</span>
                    </span>

                    <button
                      onClick={() =>
                        setActiveVideoModal({
                          title: isRw ? (vid.title_rw || vid.title_en) : vid.title_en,
                          videoId: vid.video_url
                        })
                      }
                      className="text-xs font-bold text-[#08352A] hover:text-[#21B48D] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isRw ? 'Reba hano' : 'Watch Session'}</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RWANDA CRISIS NOTICE & 114 BANNER ── */}
        <div className="bg-white rounded-3xl p-6 border border-[#DFEBE5] flex flex-col sm:flex-row items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-[#08352A] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <AlertTriangle size={24} className="text-[#21B48D]" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h4 className="text-sm font-extrabold text-[#08352A]">
              {isRw ? 'Ukeneye Ubufasha bw’Ubutabazi bwihuse?' : 'Need Immediate Emotional Crisis Support?'}
            </h4>
            <p className="text-xs text-[#5E8E81] mt-0.5 leading-relaxed">
              {isRw
                ? 'Hamagara 114 (umurongo wa RBC w\'ubuntu) igihe wumva ukeneye kuvugana n’umuntu uhagaze neza cyangwa ugize ikibazo gikomeye cy’umutima.'
                : 'Dial 114 (RBC Toll-Free Hotline) 24/7 to connect immediately with compassionate Rwandan mental health counselors.'}
            </p>
          </div>
          <a
            href="tel:114"
            className="px-5 py-2.5 rounded-full bg-[#08352A] hover:bg-[#154E3F] text-white text-xs font-bold transition-all shadow-xs flex-shrink-0 flex items-center gap-1.5"
          >
            <PhoneCall size={14} className="text-[#21B48D]" />
            <span>114 Toll-Free</span>
          </a>
        </div>

      </div>

      {/* ── IMMERSIVE READER MODAL (POPS UP IMMEDIATELY WHEN ANY CARD IS CLICKED) ── */}
      <AnimatePresence>
        {activeTopic && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                setIsAudioPlaying(false);
                setActiveTopic(null);
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-[2rem] shadow-2xl overflow-y-auto p-6 sm:p-9 space-y-6 z-10 border border-[#DFEBE5]"
            >
              {/* Header bar with Back / Close */}
              <div className="flex items-center justify-between pb-4 border-b border-[#F0F5F2] sticky top-0 bg-white z-10 pt-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-bold text-[#21B48D] bg-[#E8F3EE] px-3 py-1 rounded-full uppercase tracking-wider">
                    {isRw ? activeTopic.category_rw : activeTopic.category}
                  </span>
                  <span className="text-xs text-[#8DB4A8] font-medium flex items-center gap-1">
                    <Clock size={12} />
                    {activeTopic.readTime}
                  </span>
                </div>

                <button
                  onClick={() => {
                    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                    setIsAudioPlaying(false);
                    setActiveTopic(null);
                  }}
                  className="p-2 text-[#8DB4A8] hover:text-[#08352A] rounded-xl hover:bg-[#F4F8F6] transition-colors cursor-pointer"
                  title="Close reader"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Title & Media Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#08352A]">
                    {isRw ? activeTopic.titleRw : activeTopic.titleEn}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5E8E81] mt-1 font-normal leading-relaxed">
                    {isRw ? activeTopic.descRw : activeTopic.descEn}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
                  <button
                    onClick={() =>
                      toggleAudio(isRw ? activeTopic.articleRw : activeTopic.articleEn)
                    }
                    className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                      isAudioPlaying
                        ? 'bg-[#E11D48] text-white shadow-md'
                        : 'bg-[#08352A] hover:bg-[#154E3F] text-white'
                    }`}
                  >
                    {isAudioPlaying ? <VolumeX size={15} /> : <Headphones size={15} className="text-[#21B48D]" />}
                    <span>
                      {isAudioPlaying
                        ? (isRw ? 'Hagarika Ijwi' : 'Stop Narration')
                        : (isRw ? 'Wumva Ijwi' : 'Listen Narration')}
                    </span>
                  </button>

                  <button
                    onClick={() =>
                      setActiveVideoModal({
                        title: isRw ? activeTopic.titleRw : activeTopic.titleEn,
                        videoId: activeTopic.videoId
                      })
                    }
                    className="px-4 py-2.5 rounded-full bg-[#E2F2EC] hover:bg-[#D4EADE] text-[#08352A] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
                  >
                    <PlayCircle size={15} className="text-[#08352A]" />
                    <span>{isRw ? 'Reba Amashusho' : 'Watch Video'}</span>
                  </button>
                </div>
              </div>

              {/* Audio Reading Banner */}
              {isAudioPlaying && (
                <div className="p-3.5 rounded-2xl bg-[#E8F3EE] border border-[#21B48D]/30 flex items-center justify-between text-xs font-bold text-[#08352A]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#21B48D] animate-ping" />
                    <span>{isRw ? 'Ijwi ririmo gusoma inyandiko...' : 'Reading article out loud...'}</span>
                  </div>
                  <button
                    onClick={() => toggleAudio('')}
                    className="text-xs text-[#E11D48] hover:underline cursor-pointer"
                  >
                    {isRw ? 'Hagarika' : 'Dismiss'}
                  </button>
                </div>
              )}

              {/* Full Article Text */}
              <div className="bg-[#F4F8F6] rounded-2xl p-6 sm:p-7 border border-[#E3ECE7] space-y-4 text-xs sm:text-sm text-[#08352A] leading-relaxed font-normal">
                {(isRw ? activeTopic.articleRw : activeTopic.articleEn)
                  .split('\n\n')
                  .map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
              </div>

              {/* Evidence-Based Practice Tips */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <Lightbulb size={18} className="text-[#21B48D]" />
                  <h3 className="text-sm font-extrabold text-[#08352A]">
                    {isRw ? 'Inama z’Ingirakamaro Ushobora Gukurikiza Uyu Munsi:' : 'Evidence-Based Self-Care Practices:'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeTopic.tips.map((tip, idx) => {
                    const tipKey = `${activeTopic.id}-tip-${idx}`;
                    const isChecked = !!completedTips[tipKey];

                    return (
                      <button
                        key={idx}
                        onClick={() => toggleTip(tipKey)}
                        className={`text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                          isChecked
                            ? 'bg-[#E8F3EE] border-[#21B48D] text-[#08352A]'
                            : 'bg-white border-[#DCEBE3] hover:border-[#21B48D] text-[#5E8E81]'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 border transition-all ${
                            isChecked
                              ? 'bg-[#21B48D] border-[#21B48D] text-white'
                              : 'bg-white border-[#DCEBE3] text-transparent'
                          }`}
                        >
                          <Check size={12} className="stroke-[3]" />
                        </div>
                        <span className="text-xs font-semibold leading-relaxed">
                          {isRw ? tip.rw : tip.en}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── VIDEO PLAYER MODAL ── */}
      <AnimatePresence>
        {activeVideoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveVideoModal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-3xl bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl z-10 border border-neutral-700"
            >
              <div className="flex items-center justify-between p-4 bg-neutral-900 text-white border-b border-neutral-800">
                <h3 className="text-sm font-bold truncate pr-4">
                  {activeVideoModal.title}
                </h3>
                <button
                  onClick={() => setActiveVideoModal(null)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="aspect-video w-full bg-black">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${activeVideoModal.videoId}?autoplay=1&rel=0&modestbranding=1`}
                  title={activeVideoModal.title}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
