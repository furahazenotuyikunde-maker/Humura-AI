import React, { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Search, X } from 'lucide-react';

// ──────────────────────────────────────────────────────────────
// SUPPORT CENTRE DATA — 15 real Rwandan mental health centres
// ──────────────────────────────────────────────────────────────
interface Centre {
  id: string;
  name: string;
  district: string;
  phone: string;
  type: string;
  isHotline?: boolean;
}

const centres: Centre[] = [
  { id: '1', name: 'Kigali Mental Health Referral Centre', district: 'Gasabo', phone: '+250793902059', type: 'National referral center' },
  { id: '2', name: 'Ndera Neuropsychiatric Teaching Hospital', district: 'Gasabo', phone: '+250781447928', type: 'Main psychiatric hospital' },
  { id: '3', name: 'Kigali Psycho-Medical Center', district: 'Gasabo', phone: '+250784280788', type: 'Professional mental health clinic' },
  { id: '4', name: 'Humura Counseling Rwanda', district: 'Gasabo', phone: '+250790137262', type: 'Counseling & therapy services' },
  { id: '5', name: 'AVEGA Clinic', district: 'Gasabo', phone: '+250788224864', type: 'Trauma & mental health support' },
  { id: '6', name: 'mHub Africa', district: 'Kicukiro', phone: '+250785318416', type: 'Youth mental health support' },
  { id: '7', name: 'Imanzi Counseling & Rehabilitation Center', district: 'Kicukiro', phone: '+250788436901', type: 'Counseling + rehabilitation' },
  { id: '8', name: 'Wihogora Psychosocial Centre', district: 'Kicukiro', phone: '+250791955386', type: 'Affordable psychosocial services' },
  { id: '9', name: 'Nyarugenge District Hospital', district: 'Nyarugenge', phone: '+250790666663', type: 'General hospital with mental health' },
  { id: '10', name: 'Mental Health Journal Rwanda', district: 'Huye', phone: '+250783974066', type: 'University-based support' },
  { id: '11', name: 'Ruli District Hospital', district: 'Gakenke', phone: '+250787335029', type: 'District hospital care' },
  { id: '12', name: 'Icyizere Psychotherapeutic Center', district: 'National', phone: '+250783375550', type: 'Specialized psychotherapy' },
  { id: '13', name: 'Mental Health First Rwanda', district: 'National', phone: '+250789270875', type: 'Awareness & services' },
  { id: '14', name: 'DIDE Rwanda', district: 'National', phone: '+250790002452', type: 'Community support' },
  { id: '15', name: 'Healthy Minds Rwanda', district: 'Hotline', phone: '+250790003002', type: 'Hotline & counseling', isHotline: true },
];

export default function SupportCentersPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Live filter as user types + on button click
  const filtered = useMemo(() => {
    const q = activeSearch.toLowerCase().trim();
    if (!q) return centres;
    return centres.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.district.toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q)
    );
  }, [activeSearch]);

  const handleSearch = () => {
    setActiveSearch(search);
  };

  const handleClear = () => {
    setSearch('');
    setActiveSearch('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="text-primary" size={28} />
          <h1 className="text-2xl font-extrabold text-primary-900 tracking-tight">
            {lang === 'rw' ? 'Indangururamuntu y\'Ubufasha' : 'Support Centre Directory'}
          </h1>
        </div>
        <p className="text-primary-600 text-sm">
          {lang === 'rw'
            ? 'Ibigo 15 by\'ubuzima bwo mu mutwe mu Rwanda'
            : '15 verified mental health centres across Rwanda'}
        </p>
      </motion.div>

      {/* Emergency banner */}
      <motion.a
        href="tel:114"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl text-white shadow-lg shadow-red-500/30 hover:shadow-xl transition-shadow"
      >
        <Phone size={22} className="flex-shrink-0 animate-pulse" />
        <div className="flex-1">
          <p className="font-bold text-sm">{lang === 'rw' ? 'Ubufasha bwihutirwa?' : 'In crisis right now?'}</p>
          <p className="text-white/80 text-xs">
            {lang === 'rw' ? 'Hamagara 114 ubu — ubuntu, 24/7' : 'Call 114 now — free, 24/7 mental health crisis line'}
          </p>
        </div>
        <span className="font-black text-xl">114</span>
      </motion.a>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            ref={inputRef}
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setActiveSearch(e.target.value); // live filter
            }}
            onKeyDown={handleKeyDown}
            placeholder={lang === 'rw' ? 'Shakisha ikigo...' : 'Search by name, district, or type...'}
            className="w-full pl-9 pr-8 py-3 rounded-2xl bg-white border border-primary-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium placeholder:text-neutral-400"
            aria-label="Search centres"
          />
          {search && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-900 transition-colors flex-shrink-0"
          aria-label="Search"
        >
          {lang === 'rw' ? 'Shakisha' : 'Search'}
        </button>
      </div>

      {/* Results count */}
      <AnimatePresence>
        {activeSearch && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-primary-600 font-medium"
          >
            {filtered.length} {lang === 'rw' ? 'ibisubizo bya' : 'results for'} "{activeSearch}"
          </motion.p>
        )}
      </AnimatePresence>

      {/* Centres list */}
      <div className="space-y-3">
        {filtered.map((c, idx) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.04 }}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-md hover:-translate-y-0.5 ${
              c.isHotline
                ? 'bg-red-50 border-red-100'
                : 'bg-white border-primary-50'
            }`}
          >
            {/* Icon */}
            <div className={`w-11 h-11 flex-shrink-0 rounded-2xl flex items-center justify-center ${
              c.isHotline ? 'bg-red-500' : 'bg-primary'
            }`}>
              {c.isHotline ? (
                <Phone size={20} className="text-white" />
              ) : (
                <MapPin size={20} className="text-white" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-sm leading-tight ${c.isHotline ? 'text-red-900' : 'text-primary-900'}`}>
                {c.name}
                {c.isHotline && (
                  <span className="ml-2 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold align-middle">
                    HOTLINE
                  </span>
                )}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
                👉 {c.type}
              </p>
              <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                <MapPin size={10} />
                {c.district}
              </p>
            </div>

            {/* Call button */}
            <a
              href={`tel:${c.phone}`}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:scale-105 transition-transform ${
                c.isHotline
                  ? 'bg-red-500 text-white shadow-red-500/20'
                  : 'bg-primary text-white shadow-primary/20'
              }`}
              aria-label={`Call ${c.name}`}
            >
              <Phone size={14} />
              <span className="text-xs">{lang === 'rw' ? 'Hamagara' : 'Call'}</span>
            </a>
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 space-y-3"
        >
          <MapPin size={48} className="mx-auto text-primary-200" />
          <p className="text-primary-400 font-medium">
            {lang === 'rw' ? 'Nta bigo byabonetse' : 'No centres found'}
          </p>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-primary-50 text-primary font-semibold rounded-xl text-sm hover:bg-primary-100 transition-colors"
          >
            {lang === 'rw' ? 'Siba Gushakisha' : 'Clear Search'}
          </button>
        </motion.div>
      )}
    </div>
  );
}


