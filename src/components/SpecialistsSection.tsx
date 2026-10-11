import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Video, Star, ArrowRight, MapPin, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface SpecialistItem {
  id: string;
  name: string;
  specialty_en: string;
  specialty_rw: string;
  location: string;
  languages: string;
  bio: string;
  available: boolean;
  avatarInitial: string;
}

// In-memory cache to guarantee zero-flicker transitions while stale-while-revalidate runs
let cachedSpecialists: SpecialistItem[] | null = null;

export const SpecialistsSection: React.FC = () => {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');

  const [specialists, setSpecialists] = useState<SpecialistItem[]>(() => cachedSpecialists || []);
  const [loading, setLoading] = useState<boolean>(!cachedSpecialists);

  const formatLanguages = (pref: string | null) => {
    if (!pref) return 'Kinyarwanda, English';
    const lower = pref.toLowerCase();
    const list: string[] = [];
    if (lower.includes('rw')) list.push('Kinyarwanda');
    if (lower.includes('en')) list.push('English');
    if (lower.includes('fr')) list.push('French');
    if (lower.includes('rsl')) list.push('RSL (Sign Language)');
    return list.length > 0 ? list.join(', ') : pref;
  };

  useEffect(() => {
    let isMounted = true;

    const loadSpecialists = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'doctor')
          .order('full_name', { ascending: true });

        if (error) throw error;

        if (data && isMounted) {
          // Deduplicate by clean name
          const uniqueMap = new Map<string, SpecialistItem>();
          
          data.forEach((doc) => {
            const cleanName = (doc.full_name || '').trim();
            if (cleanName && !uniqueMap.has(cleanName.toLowerCase())) {
              const specText = doc.specialty || 'General Mental Healthcare';
              uniqueMap.set(cleanName.toLowerCase(), {
                id: doc.id,
                name: cleanName,
                specialty_en: specText,
                specialty_rw: specText,
                location: doc.location || 'Kigali, Rwanda',
                languages: formatLanguages(doc.language_pref),
                bio: doc.bio || 'Certified specialist providing confidential mental health support and telehealth counseling.',
                available: true,
                avatarInitial: cleanName.split(' ')[1]?.[0] || cleanName[0] || 'D'
              });
            }
          });

          const formattedList = Array.from(uniqueMap.values()).slice(0, 4);
          cachedSpecialists = formattedList;
          setSpecialists(formattedList);
        }
      } catch (err) {
        console.error('Failed to load specialists:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSpecialists();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="specialists" className="py-20 bg-[#F4F9F6] border-t border-[#E3EFE9] relative scroll-mt-20 sm:scroll-mt-24 font-poppins">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E5F0EB] text-[#153C32] text-xs font-bold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-[#21B48D] animate-pulse" />
              <span>{isRw ? 'Inzobere z’Ubuvuzi' : 'Clinical Team'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#153C32] tracking-tight leading-tight">
              {isRw 
                ? 'Hura n’Abahanga b’Inzobere mu Rwanda' 
                : 'Meet Certified Mental Health Specialists'}
            </h2>
            <p className="text-sm text-[#52786D] mt-2 font-normal leading-relaxed">
              {isRw
                ? 'Abaganga n’abahanga mu mitekerereze bafite impamyabumenyi bemewe n’inzego z’ubuzima mu Rwanda biteguye kugufasha mu ibanga.'
                : 'Licensed psychologists and psychiatrists available for confidential consultations and telehealth support across Rwanda.'}
            </p>
          </div>

          <a
            href="/patient/meet-professional"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#153C32] hover:bg-[#1D4F42] text-white text-xs font-bold rounded-full shadow-sm hover:shadow-md transition-all self-start md:self-end active:scale-95 cursor-pointer"
          >
            <span>{isRw ? 'Reba Inzobere Zose' : 'View All Specialists'}</span>
            <ArrowRight size={14} className="text-[#21B48D]" />
          </a>
        </div>

        {/* Specialists Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading && specialists.length === 0 ? (
            /* ── Skeleton Loading Cards ── */
            Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 border border-[#DCEBE3] animate-pulse flex flex-col justify-between space-y-4 shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-20 h-5 bg-[#E8F3EE] rounded-full" />
                    <div className="w-12 h-3 bg-[#E8F3EE] rounded-md" />
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-[#E8F3EE] mb-4" />
                  <div className="w-3/4 h-5 bg-[#E8F3EE] rounded-md mb-2" />
                  <div className="w-1/2 h-3.5 bg-[#E8F3EE] rounded-md mb-3" />
                  <div className="w-full h-12 bg-[#F4F8F6] rounded-xl mb-3" />
                </div>
                <div className="border-t border-[#F0F5F2] pt-3 flex items-center justify-between">
                  <div className="w-24 h-3 bg-[#E8F3EE] rounded-md" />
                  <div className="w-8 h-8 rounded-full bg-[#E8F3EE]" />
                </div>
              </div>
            ))
          ) : (
            specialists.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-3xl p-6 border border-[#DCEBE3] hover:border-[#21B48D] transition-all hover:shadow-lg flex flex-col justify-between group"
              >
                <div>
                  {/* Header Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#21B48D] bg-[#E8F3EE] px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#21B48D] animate-ping" />
                      <span>{doc.available ? (isRw ? 'Arahari' : 'Available Today') : 'Busy'}</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#52786D] flex items-center gap-1">
                      <Star size={11} className="text-[#D97706] fill-current" />
                      4.9
                    </span>
                  </div>

                  {/* Avatar Initial Badge */}
                  <div className="w-14 h-14 rounded-2xl bg-[#E8F3EE] border border-[#21B48D]/30 flex items-center justify-center text-[#153C32] font-black text-xl mb-4 group-hover:scale-105 transition-transform shadow-2xs">
                    {doc.avatarInitial}
                  </div>

                  <h3 className="font-bold text-[#153C32] text-base mb-1 group-hover:text-[#21B48D] transition-colors leading-snug">
                    {doc.name}
                  </h3>
                  <p className="text-xs font-semibold text-[#21B48D] mb-2">
                    {isRw ? doc.specialty_rw : doc.specialty_en}
                  </p>
                  <p className="text-[11px] text-[#52786D] leading-relaxed mb-3 line-clamp-2 font-normal">
                    {doc.bio}
                  </p>
                </div>

                <div className="border-t border-[#F0F5F2] pt-3 mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-[#71968B] font-medium truncate max-w-[140px] flex items-center gap-1">
                    <MapPin size={10} className="text-[#21B48D] flex-shrink-0" />
                    <span>{doc.location}</span>
                  </span>
                  <a
                    href="/patient/meet-professional"
                    className="w-8 h-8 rounded-full bg-[#153C32] hover:bg-[#21B48D] text-white flex items-center justify-center transition-colors shadow-xs active:scale-95"
                    title="Connect with clinician"
                  >
                    <Video size={13} />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </section>
  );
};

export default SpecialistsSection;
