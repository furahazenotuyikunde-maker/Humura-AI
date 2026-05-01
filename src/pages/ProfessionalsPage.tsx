import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Star, Clock, Phone, Globe, MessageCircle, X, CheckCircle, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Professional {
  id: string;
  name: string;
  title: string;
  titleRw: string;
  specialties: string[];
  specialtiesRw: string[];
  languages: string[];
  location: string;
  locationRw: string;
  phone: string;
  website?: string;
  available: boolean;
  rating: number;
  sessions: number;
  avatar: string;
  about: string;
  aboutRw: string;
  color: string;
  mode: ('in-person' | 'online' | 'phone')[];
}

const professionals: Professional[] = [
  {
    id: 'p1',
    name: 'Dr. Amina Uwimana',
    title: 'Clinical Psychologist',
    titleRw: 'Inzobere mu Bwonko',
    specialties: ['Trauma & PTSD', 'Anxiety', 'Grief Counseling', 'Genocide Survivors'],
    specialtiesRw: ['Trauma na PTSD', 'Ubwoba', 'Inama ku Karé', 'Abarokotse Jenoside'],
    languages: ['Kinyarwanda', 'English', 'French'],
    location: 'Kacyiru, Kigali',
    locationRw: 'Kacyiru, Kigali',
    phone: '+250 788 001 001',
    available: true,
    rating: 4.9,
    sessions: 340,
    avatar: '👩‍⚕️',
    about: 'Over 10 years experience with trauma-informed care. Specializes in helping genocide survivors and their families heal through evidence-based therapy.',
    aboutRw: 'Imyaka irenga 10 y\'uburambe mu kuvura trauma. Inararibonye mu gufasha abarokotse jenoside n\'imiryango yabo gukira binyuze mu ubuvuzi bufite ibisubizo.',
    color: 'from-teal-500 to-primary',
    mode: ['in-person', 'online'],
  },
  {
    id: 'p2',
    name: 'Dr. Jean Pierre Nkurunziza',
    title: 'Psychiatrist',
    titleRw: 'Umuganga wa Psychiatrie',
    specialties: ['Depression', 'Bipolar Disorder', 'Medication Management', 'Psychosis'],
    specialtiesRw: ['Agahinda', 'Ubwonko Bubiri', 'Gucunga Imiti', 'Ubworo'],
    languages: ['Kinyarwanda', 'French', 'English'],
    location: 'CARAES Ndera, Kigali',
    locationRw: 'CARAES Ndera, Kigali',
    phone: '+250 788 316 500',
    available: true,
    rating: 4.8,
    sessions: 520,
    avatar: '👨‍⚕️',
    about: 'Senior psychiatrist at CARAES Ndera. Expert in mood disorders, medication management and community mental health.',
    aboutRw: 'Umuganga mukuru wa psychiatrie muri CARAES Ndera. Inzobere mu ndwara z\'umutima, gucunga imiti n\'ubuzima bwo mu mutwe bw\'umuryango.',
    color: 'from-blue-500 to-indigo-600',
    mode: ['in-person', 'phone'],
  },
  {
    id: 'p3',
    name: 'Chantal Mukamana',
    title: 'Licensed Counselor',
    titleRw: 'Mutumbirizi w\'Ubuhanga',
    specialties: ['Youth Mental Health', 'School Counseling', 'Stress', 'Self-Esteem'],
    specialtiesRw: ['Ubuzima bwo mu Mutwe bw\'Urubyiruko', 'Inama z\'Ishuri', 'Ingorane', 'Kwikunda'],
    languages: ['Kinyarwanda', 'English'],
    location: 'Remera, Kigali',
    locationRw: 'Remera, Kigali',
    phone: '+250 789 002 002',
    available: true,
    rating: 4.7,
    sessions: 215,
    avatar: '🧑‍⚕️',
    about: 'Dedicated youth counselor with expertise in school-based mental health programs. Works with students from secondary school through university.',
    aboutRw: 'Umushishikari ku buzima bwo mu mutwe bw\'urubyiruko. Akora n\'abanyeshuri kuva mu mashuri ya kabiri kugeza kaminuza.',
    color: 'from-violet-500 to-purple-600',
    mode: ['in-person', 'online', 'phone'],
  },
  {
    id: 'p4',
    name: 'Emmanuel Habimana',
    title: 'Trauma Therapist & Community Healer',
    titleRw: 'Umuvuzi wa Trauma w\'Umuryango',
    specialties: ['Intergenerational Trauma', 'Community Healing', 'Group Therapy', 'Mindfulness'],
    specialtiesRw: ['Trauma y\'Ibiremwa', 'Gukira kw\'Umuryango', 'Ubuvuzi bw\'Itsinda', 'Kwibuka'],
    languages: ['Kinyarwanda', 'Swahili', 'English'],
    location: 'Musanze, Northern Province',
    locationRw: 'Musanze, Intara ya Ruguru',
    phone: '+250 789 003 003',
    available: false,
    rating: 4.9,
    sessions: 460,
    avatar: '🧔‍♂️',
    about: 'Community-based trauma therapist. Pioneered Kinyarwanda-language group healing circles for genocide survivors and their children.',
    aboutRw: 'Umuvuzi wa trauma ufatiye ku muryango. Atuye indanganyamuco z\'amatsinda yo gukira mu Kinyarwanda ku barokotse jenoside n\'abana babo.',
    color: 'from-amber-500 to-orange-600',
    mode: ['in-person', 'online'],
  },
  {
    id: 'p5',
    name: 'Dr. Fatuma Bazatoha',
    title: 'Child & Adolescent Psychiatrist',
    titleRw: 'Umuganga wa Psychiatrie ku Bana',
    specialties: ['Child Development', 'ADHD', 'Autism Spectrum', 'Adolescent Mental Health'],
    specialtiesRw: ['Iterambere ry\'Umwana', 'ADHD', 'Autism Spectrum', 'Ubuzima bw\'Ingimbi'],
    languages: ['Kinyarwanda', 'English', 'French', 'Arabic'],
    location: 'King Faisal Hospital, Kigali',
    locationRw: 'Ibitaro bya King Faisal, Kigali',
    phone: '+250 788 307 000',
    available: true,
    rating: 4.8,
    sessions: 390,
    avatar: '👩‍⚕️',
    about: 'Specialized in child and adolescent psychiatry at King Faisal Hospital. Works with families to support healthy development and mental wellness.',
    aboutRw: 'Inararibonye mu kuvura abana n\'ingimbi muri Ibitaro bya King Faisal. Akora n\'imiryango gushyigikira iterambere ryiza n\'ubuzima.',
    color: 'from-rose-500 to-pink-600',
    mode: ['in-person'],
  },
  {
    id: 'p6',
    name: 'Solange Irakoze',
    title: 'Online Therapist (Teletherapy)',
    titleRw: 'Umuvuzi kuri Internet',
    specialties: ['Anxiety', 'Depression', 'Relationships', 'Work-Life Balance'],
    specialtiesRw: ['Ubwoba', 'Agahinda', 'Imishyikirano', 'Ingano y\'Akazi n\'Ubuzima'],
    languages: ['Kinyarwanda', 'English', 'French'],
    location: 'Online (Anywhere in Rwanda)',
    locationRw: 'Kuri Internet (Ahantu hose mu Rwanda)',
    phone: '+250 789 004 004',
    available: true,
    rating: 4.6,
    sessions: 280,
    avatar: '👩‍💻',
    about: 'Accessible online therapy for Rwandans everywhere. Offers flexible scheduling to work around your daily life.',
    aboutRw: 'Ubuvuzi bwa internet bugera abantu bose bo mu Rwanda. Iteganya amasaha yaguye ashobokera akazi no kubana.',
    color: 'from-emerald-500 to-teal-600',
    mode: ['online', 'phone'],
  },
];

const modeLabels = {
  'in-person': { emoji: '🏥', label: 'In-Person', labelRw: 'Ahantu' },
  'online': { emoji: '💻', label: 'Online', labelRw: 'Kuri Internet' },
  'phone': { emoji: '📱', label: 'Phone', labelRw: 'Telefoni' },
};

export default function ProfessionalsPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const isRw = lang.startsWith('rw');
  const [selected, setSelected] = useState<Professional | null>(null);
  const [booked, setBooked] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [dbDoctors, setDbDoctors] = useState<Professional[]>([]);
  
  // Booking Form State
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'doctor');

      if (error) throw error;

      if (data && data.length > 0) {
        const mappedDoctors: Professional[] = data.map((d: any) => ({
          id: d.id,
          name: d.full_name || 'Dr. ' + (d.email?.split('@')[0] || 'Unknown'),
          title: d.specialty || 'Mental Health Professional',
          titleRw: d.specialty || 'Inzobere mu Buzima',
          specialties: [d.specialty || 'General Therapy'],
          specialtiesRw: [d.specialty || 'Ubuvuzi rusange'],
          languages: ['Kinyarwanda', 'English'],
          location: d.location || 'Kigali, Rwanda',
          locationRw: d.location || 'Kigali, Rwanda',
          phone: d.phone || '+250...',
          available: true,
          rating: 4.8,
          sessions: 120,
          avatar: d.avatar_url || (d.gender === 'female' ? '👩‍⚕️' : '👨‍⚕️'),
          about: d.bio || 'Qualified professional dedicated to your mental well-being.',
          aboutRw: d.bio || 'Inzobere yiteguye kugufasha mu bibazo byo mu mutwe.',
          color: 'from-primary to-primary-600',
          mode: ['online', 'phone']
        }));
        setDbDoctors(mappedDoctors);
      }
    } catch (err) {
      console.error("Error fetching doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  const allProfessionals = useMemo(() => {
    // Combine hardcoded and DB doctors, avoiding duplicates by ID
    const combined = [...dbDoctors];
    professionals.forEach(p => {
      if (!combined.find(cd => cd.id === p.id)) {
        combined.push(p);
      }
    });
    return combined;
  }, [dbDoctors]);

  const specialties = useMemo(() => {
    const set = new Set<string>();
    allProfessionals.forEach(p => {
      (isRw ? p.specialtiesRw : p.specialties).forEach(s => set.add(s));
    });
    return ['all', ...Array.from(set)];
  }, [isRw, allProfessionals]);

  const filteredProfessionals = useMemo(() => {
    if (activeFilter === 'all') return allProfessionals;
    return allProfessionals.filter(p => 
      (isRw ? p.specialtiesRw : p.specialties).includes(activeFilter)
    );
  }, [activeFilter, isRw, allProfessionals]);

  const handleBook = async (proId: string) => {
    if (!bookingDate || !bookingTime) {
      alert(isRw ? "Hitamo itariki n'isaha" : "Please select date and time");
      return;
    }

    setBookingLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/auth';
        return;
      }

      const scheduledAt = new Date(`${bookingDate}T${bookingTime}`).toISOString();

      const { error } = await supabase
        .from('sessions')
        .insert({
          patient_id: user.id,
          doctor_id: proId,
          scheduled_at: scheduledAt,
          status: 'scheduled'
        });

      if (error) throw error;

      // Also ensure patient is assigned to this doctor if not already
      await supabase.from('patients').upsert({
        id: user.id,
        doctor_id: proId,
        status: 'active'
      }, { onConflict: 'id' });

      setBooked(proId);
      setSelected(null);
      setTimeout(() => setBooked(null), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <User className="text-primary" size={28} />
          <h1 className="text-2xl font-extrabold text-primary-900 tracking-tight">
            {isRw ? 'Inzobere z\'Ubuzima bwo mu Mutwe' : 'Meet Professionals'}
          </h1>
        </div>
        <p className="text-primary-600 text-sm">
          {isRw
            ? 'Buka ikiganiro n\'umuganga cyangwa umuvuzi mu Rwanda'
            : 'Book a session with a qualified mental health professional in Rwanda'}
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {specialties.map(spec => (
          <button
            key={spec}
            onClick={() => setActiveFilter(spec)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeFilter === spec
                ? 'bg-primary text-white shadow-md shadow-primary/25'
                : 'bg-white border border-primary-100 text-primary-700 hover:bg-primary-50'
            }`}
          >
            {spec === 'all' ? (isRw ? 'Byose' : 'All') : spec}
          </button>
        ))}
      </div>

      {/* Booking success toast */}
      <AnimatePresence>
        {booked && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-semibold text-sm"
          >
            <CheckCircle size={18} />
            {isRw ? 'Icyifuzo cyo gutumanahana cyoherejwe!' : 'Session request sent! They\'ll contact you soon.'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Professionals List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-sm font-bold text-primary-400 uppercase tracking-widest">
              {isRw ? 'Turi gushaka abaganga...' : 'Finding professionals...'}
            </p>
          </div>
        ) : filteredProfessionals.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-400 font-bold">{isRw ? 'Nta nzirabere zashoboye kuboneka.' : 'No professionals found matching your filter.'}</p>
          </div>
        ) : (
          filteredProfessionals.map((pro, idx) => (
            <motion.button
              key={pro.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              onClick={() => setSelected(pro)}
              className="w-full glass-card rounded-2xl p-4 flex items-start gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
            >
              <div className={`w-14 h-14 flex-shrink-0 rounded-2xl bg-gradient-to-br ${pro.color} flex items-center justify-center text-3xl shadow-inner`}>
                {pro.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-primary-900 text-sm">{pro.name}</h3>
                    <p className="text-xs text-primary-600">{isRw ? pro.titleRw : pro.title}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className={`w-2 h-2 rounded-full ${pro.available ? 'bg-emerald-400' : 'bg-neutral-300'}`} />
                    <span className="text-[10px] font-medium text-neutral-400">
                      {pro.available ? (isRw ? 'Ahari' : 'Available') : (isRw ? 'Arahuriwe' : 'Busy')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center gap-0.5">
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-primary-800">{pro.rating}</span>
                  </div>
                  <span className="text-xs text-neutral-400">{pro.sessions} {isRw ? 'ibiganiro' : 'sessions'}</span>
                  <div className="flex gap-1">
                    {pro.mode.map(m => (
                      <span key={m} className="text-sm" title={modeLabels[m].label}>{modeLabels[m].emoji}</span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {(isRw ? pro.specialtiesRw : pro.specialties).slice(0, 2).map(s => (
                    <span key={s} className="text-[10px] bg-primary-50 text-primary-600 font-medium px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                  {pro.specialties.length > 2 && (
                    <span className="text-[10px] text-neutral-400 px-1">+{pro.specialties.length - 2} more</span>
                  )}
                </div>
              </div>
              <ChevronRight size={16} className="text-neutral-300 flex-shrink-0 mt-2" />
            </motion.button>
          ))
        )}
      </div>

      {/* ── PROFILE MODAL ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="min-h-screen sm:min-h-0 sm:my-8 sm:mx-auto sm:max-w-lg bg-white sm:rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              {/* Profile Header */}
              <div className={`relative bg-gradient-to-br ${selected.color} p-8`}>
                <button onClick={() => setSelected(null)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors">
                  <X size={20} className="text-white" />
                </button>
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center text-5xl">
                    {selected.avatar}
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-white">{selected.name}</h2>
                    <p className="text-white/80 text-sm">{isRw ? selected.titleRw : selected.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <Star size={13} className="text-yellow-300 fill-yellow-300" />
                        <span className="text-white font-bold text-sm">{selected.rating}</span>
                      </div>
                      <span className="text-white/60 text-xs">• {selected.sessions} sessions</span>
                      <div className={`ml-1 flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${selected.available ? 'bg-emerald-400/30 text-emerald-100' : 'bg-white/20 text-white/60'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${selected.available ? 'bg-emerald-300' : 'bg-white/40'}`} />
                        {selected.available ? (isRw ? 'Ahari' : 'Available') : (isRw ? 'Arahuriwe' : 'Busy')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* About */}
                <div>
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    {isRw ? 'Ibisobanuro' : 'About'}
                  </h3>
                  <p className="text-sm text-primary-800 leading-relaxed">
                    {isRw ? selected.aboutRw : selected.about}
                  </p>
                </div>

                {/* Specialties */}
                <div>
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    {isRw ? 'Ubunararibonye' : 'Specialties'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(isRw ? selected.specialtiesRw : selected.specialties).map(s => (
                      <span key={s} className="text-xs bg-primary-50 text-primary-700 font-medium px-3 py-1 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  {[
                    { icon: Globe, label: isRw ? 'Indimi' : 'Languages', value: selected.languages.join(', ') },
                    { icon: MessageCircle, label: isRw ? 'Uburyo' : 'Session mode', value: selected.mode.map(m => `${modeLabels[m].emoji} ${isRw ? modeLabels[m].labelRw : modeLabels[m].label}`).join('  ') },
                    { icon: Clock, label: isRw ? 'Aho biherereye' : 'Location', value: isRw ? selected.locationRw : selected.location },
                    { icon: Phone, label: isRw ? 'Telefoni' : 'Contact', value: selected.phone, href: `tel:${selected.phone}` },
                  ].map(({ icon: Icon, label, value, href }) => (
                    <div key={label} className="flex gap-3 items-start">
                      <div className="w-8 h-8 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon size={14} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-400 font-medium">{label}</p>
                        {href ? (
                          <a href={href} className="text-sm font-semibold text-primary hover:underline">{value}</a>
                        ) : (
                          <p className="text-sm font-semibold text-primary-900">{value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Booking Form */}
                <div className="bg-primary-50 p-5 rounded-3xl space-y-4">
                  <h4 className="text-sm font-black text-primary-900 uppercase tracking-tight flex items-center gap-2">
                    <Calendar size={16} />
                    {isRw ? 'Guhitamo igihe' : 'Schedule Session'}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-primary-400 uppercase ml-2">{isRw ? 'Itariki' : 'Date'}</label>
                      <input 
                        type="date" 
                        value={bookingDate}
                        onChange={e => setBookingDate(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white border border-primary-100 font-bold text-xs outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-primary-400 uppercase ml-2">{isRw ? 'Isaha' : 'Time'}</label>
                      <input 
                        type="time" 
                        value={bookingTime}
                        onChange={e => setBookingTime(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white border border-primary-100 font-bold text-xs outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-1 gap-3 pt-2">
                  <button
                    onClick={() => handleBook(selected.id)}
                    disabled={!selected.available || bookingLoading || !bookingDate || !bookingTime}
                    className="flex items-center justify-center gap-2 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:bg-primary-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {bookingLoading ? <Loader2 size={18} className="animate-spin" /> : <Calendar size={18} />}
                    {isRw ? 'Ohereza ubusabe' : 'Send Booking Request'}
                  </button>
                  <a
                    href={`tel:${selected.phone}`}
                    className="flex items-center justify-center gap-2 py-4 bg-white border-2 border-primary-50 text-primary-800 font-bold rounded-2xl hover:bg-primary-50 transition-colors"
                  >
                    <Phone size={18} />
                    {isRw ? 'Hamagara Dr.' : 'Call Professional'}
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


