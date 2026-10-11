import React, { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Phone,
  Search,
  X,
  Building2,
  ShieldCheck,
  PhoneCall,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
  Sparkles,
  HeartHandshake
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────
// VERIFIED RWANDAN MENTAL HEALTH INSTITUTIONS & HOTLINES
// ──────────────────────────────────────────────────────────────
interface Centre {
  id: string;
  name: string;
  district: string;
  province: 'Kigali' | 'Northern' | 'Southern' | 'Eastern' | 'Western' | 'National';
  phone: string;
  typeEn: string;
  typeRw: string;
  servicesEn: string;
  servicesRw: string;
  isHotline?: boolean;
  hoursEn: string;
  hoursRw: string;
}

const centres: Centre[] = [
  {
    id: '1',
    name: 'CARAES Ndera Neuropsychiatric Teaching Hospital',
    district: 'Gasabo',
    province: 'Kigali',
    phone: '+250781447928',
    typeEn: 'National Referral Psychiatric Hospital',
    typeRw: 'Ibitaro Bikuru By’Ubuvuzi bwo mu Mutwe',
    servicesEn: 'Inpatient & outpatient clinical psychiatry, trauma care, psychotherapy, addiction rehabilitation.',
    servicesRw: 'Ubuvuzi bwo mu bitaro no gutaha, kuvura ihungabana, n’ubuvuzi bwo kureka ibiyobyabwenge.',
    hoursEn: '24/7 Emergency & Inpatient',
    hoursRw: 'Amasaha 24/7'
  },
  {
    id: '2',
    name: 'Kigali Mental Health Referral Centre',
    district: 'Gasabo',
    province: 'Kigali',
    phone: '+250793902059',
    typeEn: 'Specialized Clinical Referral Center',
    typeRw: 'Ikigo cy’Inzobere mu Buvuzi bwo mu Mutwe',
    servicesEn: 'Psychiatric consultations, individualized counseling, child & adolescent mental wellness.',
    servicesRw: 'Kugisha inama abaganga b’inzobere, ubufasha ku bana n’urubyiruko.',
    hoursEn: 'Mon - Fri: 8:00 AM - 5:00 PM',
    hoursRw: 'Kuwa Mbere - Kuwa Gatanu'
  },
  {
    id: '3',
    name: 'Healthy Minds Rwanda Crisis Hotline',
    district: 'Kicukiro',
    province: 'National',
    phone: '+250790003002',
    typeEn: '24/7 Mental Health Hotline & Counseling',
    typeRw: 'Umurongo Utishyurwa w’Ubutabazi n’Inama',
    servicesEn: 'Free telephone counseling, suicide prevention, acute anxiety stabilization, community referrals.',
    servicesRw: 'Inama kuri telefone ku buntu, kurwanya kwiheba, no gufasha abafite ubwoba bukabije.',
    isHotline: true,
    hoursEn: '24/7 Dedicated Helpline',
    hoursRw: 'Amasaha 24/7'
  },
  {
    id: '4',
    name: 'Kigali Psycho-Medical Center',
    district: 'Gasabo',
    province: 'Kigali',
    phone: '+250784280788',
    typeEn: 'Private Psychological Center',
    typeRw: 'Ivuriro ry’Imitekerereze n’Umutuzo',
    servicesEn: 'Cognitive behavioral therapy (CBT), couple counseling, stress & burnout recovery.',
    servicesRw: 'Ubuvuzi bwa CBT, inama z’abashakanye, no gukira umunaniro ukabije w’akazi.',
    hoursEn: 'Mon - Sat: 8:00 AM - 6:00 PM',
    hoursRw: 'Kuwa Mbere - Kuwa Gatandatu'
  },
  {
    id: '5',
    name: 'Humura Counseling & Psychosocial Care',
    district: 'Gasabo',
    province: 'Kigali',
    phone: '+250790137262',
    typeEn: 'Psychosocial Therapy Services',
    typeRw: 'Ubufasha mu Mitekerereze n’Imibanire',
    servicesEn: 'Evidence-based psychotherapy, grief counseling, youth empowerment circles.',
    servicesRw: 'Ubuvuzi bwa gihanga, kwakira akababaro k’urupfu, n’inama z’urubyiruko.',
    hoursEn: 'Mon - Fri: 8:30 AM - 5:30 PM',
    hoursRw: 'Kuwa Mbere - Kuwa Gatanu'
  },
  {
    id: '6',
    name: 'CHUK (University Teaching Hospital of Kigali)',
    district: 'Nyarugenge',
    province: 'Kigali',
    phone: '+250788384000',
    typeEn: 'University Referral Hospital Psychiatry Unit',
    typeRw: 'Ishami ry’Ubuzima bwo mu Mutwe muri CHUK',
    servicesEn: 'Consultation-liaison psychiatry, neuropsychiatric assessments, clinical emergency triage.',
    servicesRw: 'Ubuvuzi bw’inzobere z’ubwonko, isuzuma ryimbitse, n’ubutabazi bwihuse.',
    hoursEn: '24/7 Emergency Care',
    hoursRw: 'Amasaha 24/7'
  },
  {
    id: '7',
    name: 'AVEGA Agahozo Clinic',
    district: 'Gasabo',
    province: 'Kigali',
    phone: '+250788224864',
    typeEn: 'Trauma & Family Support Clinic',
    typeRw: 'Ivuriro ryo Gukira Ihungabana n’Umuryango',
    servicesEn: 'Trauma recovery (TF-CBT), community healing circles, women & family psychosocial assistance.',
    servicesRw: 'Kuvura ihungabana rya Jenoside, amatsinda yo komora ibikomere, n’ubufasha bw’umuryango.',
    hoursEn: 'Mon - Fri: 8:00 AM - 5:00 PM',
    hoursRw: 'Kuwa Mbere - Kuwa Gatanu'
  },
  {
    id: '8',
    name: 'mHub Africa Youth Wellness',
    district: 'Kicukiro',
    province: 'Kigali',
    phone: '+250785318416',
    typeEn: 'Youth & Young Adult Mental Wellness Hub',
    typeRw: 'Ikigo cy’Ubuzima bwo mu Mutwe ku Rubyiruko',
    servicesEn: 'Peer counseling, digital mental health workshops, artistic expression & mindfulness therapy.',
    servicesRw: 'Gufashanya hagati y’urubyiruko, amahugurwa y’imitekerereze, n’ubugeni buhumuriza.',
    hoursEn: 'Tue - Sun: 9:00 AM - 6:00 PM',
    hoursRw: 'Kuwa Kabiri - Ku Cyumweru'
  },
  {
    id: '9',
    name: 'Imanzi Counseling & Rehabilitation Center',
    district: 'Kicukiro',
    province: 'Kigali',
    phone: '+250788436901',
    typeEn: 'Rehabilitation & Addiction Recovery Center',
    typeRw: 'Ikigo Ngororamuco n’Ubufasha bwo Kureka Ibiyobyabwenge',
    servicesEn: 'Residential addiction rehabilitation, behavioral health therapy, family reintegration.',
    servicesRw: 'Kugorora imyifatire, guhagarika inzoga n’ibiyobyabwenge, no kongera gusubira mu muryango.',
    hoursEn: 'Mon - Sat: 8:00 AM - 5:00 PM',
    hoursRw: 'Kuwa Mbere - Kuwa Gatandatu'
  },
  {
    id: '10',
    name: 'Wihogora Psychosocial Centre',
    district: 'Kicukiro',
    province: 'Kigali',
    phone: '+250791955386',
    typeEn: 'Community Psychosocial Care',
    typeRw: 'Ubufasha bw’Abaturage mu Mitekerereze',
    servicesEn: 'Subsidized community therapy, grief counseling, group support sessions.',
    servicesRw: 'Ubuvuzi bworoherejwe bwo mu mutwe, kwakira ibyago, n’amatsinda yo gufashanya.',
    hoursEn: 'Mon - Fri: 8:00 AM - 5:00 PM',
    hoursRw: 'Kuwa Mbere - Kuwa Gatanu'
  },
  {
    id: '11',
    name: 'Nyarugenge District Hospital Mental Health Service',
    district: 'Nyarugenge',
    province: 'Kigali',
    phone: '+250790666663',
    typeEn: 'Public District Hospital Mental Health Clinic',
    typeRw: 'Ishami ry’Ubuzima bwo mu Mutwe mu Bitaro bya Nyarugenge',
    servicesEn: 'Outpatient psychiatric consultations, psychotropic medication management, general counseling.',
    servicesRw: 'Gusuzuma no gutanga imiti y’ubuzima bwo mu mutwe, n’inama z’abaganga.',
    hoursEn: 'Mon - Fri: 7:30 AM - 5:00 PM',
    hoursRw: 'Kuwa Mbere - Kuwa Gatanu'
  },
  {
    id: '12',
    name: 'University of Rwanda Mental Health Clinic',
    district: 'Huye',
    province: 'Southern',
    phone: '+250783974066',
    typeEn: 'University & Southern Province Clinical Center',
    typeRw: 'Ivuriro rya Kaminuza y’u Rwanda mu Majyepfo',
    servicesEn: 'Student and public clinical counseling, academic stress therapy, cognitive evaluations.',
    servicesRw: 'Ubufasha ku banyeshuri n’abaturage bose, gucunga umunaniro w’amasomo, n’isuzuma.',
    hoursEn: 'Mon - Fri: 8:00 AM - 5:00 PM',
    hoursRw: 'Kuwa Mbere - Kuwa Gatanu'
  },
  {
    id: '13',
    name: 'Ruli District Hospital Mental Health Wing',
    district: 'Gakenke',
    province: 'Northern',
    phone: '+250787335029',
    typeEn: 'Northern Province District Care',
    typeRw: 'Ibitaro bya Ruli mu Majyaruguru',
    servicesEn: 'Decentralized psychiatric outpatient care, rural community mental health outreach.',
    servicesRw: 'Ubuvuzi bwo mu mutwe bwegerejwe abaturage bo mu Majyaruguru.',
    hoursEn: 'Mon - Fri: 8:00 AM - 5:00 PM',
    hoursRw: 'Kuwa Mbere - Kuwa Gatanu'
  },
  {
    id: '14',
    name: 'Icyizere Psychotherapeutic Center',
    district: 'Kicukiro',
    province: 'Kigali',
    phone: '+250783375550',
    typeEn: 'Specialized Psychotherapy Center',
    typeRw: 'Ikigo cy’Inzobere mu Buvuzi bw’Imitekerereze',
    servicesEn: 'Intensive psychotherapy, behavioral therapy, family and adolescent care.',
    servicesRw: 'Ubuvuzi bwa gihanga bw’imitekerereze, inama z’umuryango n’ingimbi.',
    hoursEn: 'Mon - Sat: 8:00 AM - 6:00 PM',
    hoursRw: 'Kuwa Mbere - Kuwa Gatandatu'
  },
  {
    id: '15',
    name: 'Rwanda Biomedical Centre (RBC) Helpline 114',
    district: 'National',
    province: 'National',
    phone: '114',
    typeEn: 'National Emergency Mental Health Helpline',
    typeRw: 'Umurongo Mugari w’Igihugu 114 (Ku Buntu)',
    servicesEn: 'Toll-free 24/7 national health assistance, mental health crisis triage, immediate ambulance referral.',
    servicesRw: 'Guhamagara ku buntu 24/7, ubufasha bwihutirwa mu buzima bwo mu mutwe mu Rwanda hose.',
    isHotline: true,
    hoursEn: '24/7 National Emergency Toll-Free',
    hoursRw: 'Amasaha 24/7 Ku Buntu'
  }
];

export default function SupportCentersPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const isRw = lang.startsWith('rw');

  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'kigali' | 'hotline' | 'provincial'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter computation
  const filteredCentres = useMemo(() => {
    return centres.filter((c) => {
      // 1. Category Filter
      let matchCategory = true;
      if (selectedFilter === 'kigali') {
        matchCategory = c.province === 'Kigali';
      } else if (selectedFilter === 'hotline') {
        matchCategory = !!c.isHotline;
      } else if (selectedFilter === 'provincial') {
        matchCategory = c.province !== 'Kigali' && !c.isHotline;
      }

      // 2. Search query
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q) ||
        c.typeEn.toLowerCase().includes(q) ||
        c.typeRw.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q);

      return matchCategory && matchSearch;
    });
  }, [search, selectedFilter]);

  const handleClear = () => {
    setSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-7 pb-16 max-w-6xl mx-auto">
      {/* ── TOP HEADER ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DFEBE5] shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F3EE] text-[#21B48D] text-[11px] font-bold uppercase tracking-wider">
              <ShieldCheck size={14} />
              <span>{isRw ? 'Indangururamuntu y’Amavuriro Yemewe' : 'Verified Clinical Directory'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08352A] tracking-tight">
              {isRw ? 'Ibitaro n’Ibigo By’Ubuzima bwo mu Mutwe' : 'Verified Mental Health Centers in Rwanda'}
            </h1>
            <p className="text-xs sm:text-sm text-[#5E8E81] max-w-2xl font-normal leading-relaxed">
              {isRw
                ? 'Reba amakuru yizewe y’ibitaro bikuru, amavuriro y’imitekerereze, n’imirongo y’ubutabazi iboneka mu Rwanda hose.'
                : 'Direct contact numbers, service details, and locations for licensed psychiatric referral hospitals, trauma clinics, and community counselors across Rwanda.'}
            </p>
          </div>

          {/* Quick Counter Badge */}
          <div className="flex items-center gap-3 bg-[#F4F8F6] p-3.5 rounded-2xl border border-[#DFEBE5] self-start md:self-auto flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#08352A] text-[#21B48D] flex items-center justify-center font-black text-sm">
              15
            </div>
            <div>
              <p className="text-xs font-black text-[#08352A] leading-tight">
                {isRw ? 'Ibigo Byemewe' : 'Verified Centers'}
              </p>
              <p className="text-[10px] text-[#5E8E81] font-medium">
                {isRw ? 'Mu Turere Twose' : 'Across Rwanda'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── EMERGENCY CRISIS CALLOUT BANNER ── */}
      <div className="bg-gradient-to-r from-[#08352A] to-[#124E3F] rounded-3xl p-6 sm:p-7 text-white shadow-lg border border-[#154E3F] flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#21B48D]/20 border border-[#21B48D]/30 flex items-center justify-center text-[#21B48D] flex-shrink-0">
            <PhoneCall size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold bg-[#21B48D] text-[#08352A] px-2 py-0.5 rounded-full uppercase tracking-wider">
                {isRw ? 'UBUTABAZI BW’IHUTIRWA' : '24/7 CRISIS HELPLINE'}
              </span>
              <span className="text-xs text-[#A3C7BD]">
                {isRw ? 'Birasubizwa ako kanya' : 'Instant connection'}
              </span>
            </div>
            <h3 className="text-lg font-black text-white mt-1">
              {isRw ? 'Ukeneye Ubufasha Ako Kanya? Hamagara 114' : 'Need Immediate Support? Dial 114 or +250 790 003 002'}
            </h3>
            <p className="text-xs text-[#C8E0D7] mt-0.5 font-normal">
              {isRw
                ? 'Umurongo utishyurwa w’igihugu 114 (RBC) n’umurongo wa Healthy Minds Rwanda witeguye kugutega amatwi 24/7.'
                : 'Toll-free national crisis line 114 and Healthy Minds hotline operate 24/7 with confidential clinical guidance.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <a
            href="tel:114"
            className="flex-1 md:flex-initial px-5 py-3 rounded-2xl bg-[#21B48D] hover:bg-[#1CA07D] text-[#08352A] font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <Phone size={15} />
            <span>114 ({isRw ? 'Ku Buntu' : 'Toll-Free'})</span>
          </a>
          <a
            href="tel:+250790003002"
            className="flex-1 md:flex-initial px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Phone size={15} />
            <span>+250 790 003 002</span>
          </a>
        </div>
      </div>

      {/* ── SEARCH & CATEGORY FILTER BAR ── */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#DFEBE5] space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8DB4A8]" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isRw ? 'Shakisha izina ry’ikigo, akarere (urugero: Gasabo, Huye), cyangwa serivisi...' : 'Search by center name, district (e.g. Gasabo, Huye), or service type...'}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F4F8F6] border border-[#DCEBE3] text-xs font-medium text-[#08352A] placeholder-[#8DB4A8] outline-none focus:border-[#21B48D] transition-colors"
            />
            {search && (
              <button
                onClick={handleClear}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8DB4A8] hover:text-[#08352A] cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-[#5E8E81] self-end sm:self-auto flex-shrink-0">
            <Filter size={14} className="text-[#21B48D]" />
            <span>
              {filteredCentres.length} {isRw ? 'Ibigo Byabonetse' : 'Centers Found'}
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-[#08352A] text-white shadow-xs'
                : 'bg-[#F4F8F6] text-[#08352A] hover:bg-[#E8F3EE] border border-[#DCEBE3]'
            }`}
          >
            {isRw ? 'Byose Hamwe (All)' : 'All Institutions (15)'}
          </button>

          <button
            onClick={() => setSelectedFilter('kigali')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
              selectedFilter === 'kigali'
                ? 'bg-[#08352A] text-white shadow-xs'
                : 'bg-[#F4F8F6] text-[#08352A] hover:bg-[#E8F3EE] border border-[#DCEBE3]'
            }`}
          >
            {isRw ? 'Umujyi wa Kigali' : 'Kigali City (Gasabo / Kicukiro / Nyarugenge)'}
          </button>

          <button
            onClick={() => setSelectedFilter('hotline')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
              selectedFilter === 'hotline'
                ? 'bg-[#08352A] text-white shadow-xs'
                : 'bg-[#F4F8F6] text-[#08352A] hover:bg-[#E8F3EE] border border-[#DCEBE3]'
            }`}
          >
            {isRw ? 'Imirongo y’Ubutabazi 24/7' : '24/7 Helplines & Hotlines'}
          </button>

          <button
            onClick={() => setSelectedFilter('provincial')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
              selectedFilter === 'provincial'
                ? 'bg-[#08352A] text-white shadow-xs'
                : 'bg-[#F4F8F6] text-[#08352A] hover:bg-[#E8F3EE] border border-[#DCEBE3]'
            }`}
          >
            {isRw ? 'Intara n’Uturere' : 'Provincial & District Centers'}
          </button>
        </div>
      </div>

      {/* ── CENTERS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCentres.map((c) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-3xl p-6 sm:p-7 border transition-all hover:shadow-md flex flex-col justify-between group ${
              c.isHotline
                ? 'border-[#21B48D]/40 bg-gradient-to-b from-[#F4FAF7] to-white'
                : 'border-[#DFEBE5] hover:border-[#21B48D]'
            }`}
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-[#21B48D] bg-[#E8F3EE] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {isRw ? c.typeRw : c.typeEn}
                    </span>
                    {c.isHotline && (
                      <span className="text-[10px] font-black text-white bg-[#E11D48] px-2 py-0.5 rounded-full uppercase tracking-wider">
                        24/7 HOTLINE
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#08352A] group-hover:text-[#21B48D] transition-colors leading-snug">
                    {c.name}
                  </h3>
                </div>

                <div className="w-10 h-10 rounded-2xl bg-[#E2F2EC] text-[#08352A] flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <Building2 size={20} />
                </div>
              </div>

              {/* Location & Working Hours */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#5E8E81] mb-4">
                <span className="flex items-center gap-1 font-semibold text-[#08352A]">
                  <MapPin size={13} className="text-[#21B48D]" />
                  <span>{c.district}, {c.province}</span>
                </span>
                <span className="text-[#C5DCD4]">•</span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-[#71968B]">
                  <Clock size={12} />
                  <span>{isRw ? c.hoursRw : c.hoursEn}</span>
                </span>
              </div>

              {/* Clinical Services Text */}
              <p className="text-xs text-[#5E8E81] font-normal leading-relaxed mb-6">
                {isRw ? c.servicesRw : c.servicesEn}
              </p>
            </div>

            {/* Bottom Call & Connect Action */}
            <div className="pt-4 border-t border-[#F0F5F2] flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#08352A]">
                <Phone size={13} className="text-[#21B48D]" />
                <span>{c.phone}</span>
              </div>

              <a
                href={`tel:${c.phone.replace(/\s+/g, '')}`}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs ${
                  c.isHotline
                    ? 'bg-[#08352A] hover:bg-[#154E3F] text-white'
                    : 'bg-[#E2F2EC] hover:bg-[#D4EADE] text-[#08352A]'
                }`}
              >
                <Phone size={13} className={c.isHotline ? 'text-[#21B48D]' : 'text-[#08352A]'} />
                <span>{isRw ? 'Hamagara Ako Kanya' : 'Direct Call'}</span>
              </a>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCentres.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#DFEBE5] space-y-3">
          <Building2 size={40} className="mx-auto text-[#8DB4A8]" />
          <h3 className="text-base font-extrabold text-[#08352A]">
            {isRw ? 'Nta vuriro ryabonetse rijyanye n’ibyo ushaka' : 'No centers match your search'}
          </h3>
          <p className="text-xs text-[#5E8E81] max-w-sm mx-auto">
            {isRw ? 'Ongera ugerageze uhindura akarere cyangwa ijambo wakoresheje.' : 'Try adjusting your district filter or searching by hospital name or specialty.'}
          </p>
          <button
            onClick={handleClear}
            className="px-4 py-2 rounded-2xl bg-[#08352A] text-white text-xs font-bold hover:bg-[#154E3F] transition-colors cursor-pointer"
          >
            {isRw ? 'Garura Byose' : 'Reset Search'}
          </button>
        </div>
      )}
    </div>
  );
}
