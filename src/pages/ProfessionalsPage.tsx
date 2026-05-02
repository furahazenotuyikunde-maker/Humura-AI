import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Star, Clock, Phone, Globe, MessageCircle, X, CheckCircle, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

import { io } from 'socket.io-client';

interface Professional {
  id: string;
  name: string;
  specialisations: string[];
  languages: string[];
  bio: string;
  years_experience: number;
  is_available: boolean;
  caseload_count: number;
  rating_avg: number;
  session_count: number;
  avatar_url?: string;
}

// Professionals are fetched dynamically from the database.
const modeLabels = {
  'in-person': { emoji: '🏥', label: 'In-Person', labelRw: 'Ahantu' },
  'online': { emoji: '💻', label: 'Online', labelRw: 'Kuri Internet' },
  'phone': { emoji: '📱', label: 'Phone', labelRw: 'Telefoni' },
};

const specialties = ['all', 'Anxiety', 'Depression', 'Trauma', 'PTSD', 'Bipolar', 'Youth'];

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
    listenToPresence();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_RENDER_BACKEND_URL}/api/doctors/available`);
      const data = await res.json();
      setDbDoctors(data);
    } catch (err) {
      console.error("Error fetching doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  const listenToPresence = () => {
    const socket = io(import.meta.env.VITE_RENDER_BACKEND_URL, {
      transports: ["websocket"]
    });

    socket.on("doctor:online", ({ doctor_id }: { doctor_id: string }) => {
      setDbDoctors(prev => prev.map(d => 
        d.id === doctor_id ? { ...d, is_available: true } : d
      ));
    });

    socket.on("doctor:offline", ({ doctor_id }: { doctor_id: string }) => {
      setDbDoctors(prev => prev.map(d => 
        d.id === doctor_id ? { ...d, is_available: false } : d
      ));
    });

    return () => socket.disconnect();
  };

  const filteredProfessionals = useMemo(() => {
    if (activeFilter === 'all') return dbDoctors;
    return dbDoctors.filter(p => p.specialisations.includes(activeFilter));
  }, [activeFilter, dbDoctors]);

  const handleConnect = async (doctor: Professional) => {
    setBookingLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/auth';
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_RENDER_BACKEND_URL}/api/patients/assign-doctor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: session.user.id, doctorId: doctor.id })
      });
      
      const data = await res.json();
      if (data.success) {
        setBooked(doctor.id);
        setTimeout(() => window.location.href = '/meet-professional', 1500);
      }
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
            {isRw ? 'Inzobere z\'Ubuzima bwo mu Mutwe' : 'Meet Mental Health Professionals'}
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
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-primary" size={48} />
            <p className="text-sm font-black text-primary-400 uppercase tracking-widest">
              {isRw ? 'Turi gushaka abaganga...' : 'Finding professionals...'}
            </p>
          </div>
        ) : filteredProfessionals.length === 0 ? (
          <div className="bg-white p-16 rounded-[2.5rem] border-2 border-dashed border-neutral-100 text-center space-y-4">
            <div className="text-6xl">🩺</div>
            <h3 className="text-xl font-black text-primary-900">
              {isRw ? 'Nta baganga bashoboye kuboneka' : 'No professionals available right now'}
            </h3>
            <p className="text-xs font-bold text-neutral-400">
              {isRw ? 'Ongera ugerageze mu kanya cyangwa uhindure akayunguruzo.' : 'Check back soon or change your filter'}
            </p>
          </div>
        ) : (
          filteredProfessionals.map((doctor, idx) => {
            const initials = doctor.name.split(" ").slice(0, 2).map(n => n[0]).join("");
            return (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary font-black text-xl">
                      {doctor.avatar_url ? <img src={doctor.avatar_url} className="w-full h-full object-cover rounded-3xl" /> : initials}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-primary-900">{doctor.name}</h3>
                      <p className="text-xs font-bold text-primary-400 uppercase tracking-widest">
                        {doctor.years_experience} yrs experience
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${doctor.is_available ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-50 text-neutral-400'}`}>
                      {doctor.is_available ? (isRw ? 'Ahari' : 'Available now') : (isRw ? 'Offline' : 'Offline')}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {doctor.specialisations.map(s => (
                    <span key={s} className="px-3 py-1 bg-neutral-50 text-primary-600 rounded-xl text-[10px] font-bold">
                      {s}
                    </span>
                  ))}
                </div>

                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  {doctor.languages.join(" · ")}
                </div>

                {doctor.session_count > 0 && (
                  <div className="flex items-center gap-1 text-xs font-bold text-primary-900">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    {doctor.rating_avg} ({doctor.session_count} sessions)
                  </div>
                )}

                {doctor.bio && (
                  <p className="text-sm font-medium text-primary-600/70 leading-relaxed italic line-clamp-2">
                    "{doctor.bio}"
                  </p>
                )}

                <button
                  onClick={() => handleConnect(doctor)}
                  disabled={!doctor.is_available || bookingLoading}
                  className={`w-full py-5 rounded-3xl font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    doctor.is_available 
                      ? 'bg-primary text-white shadow-xl shadow-primary/20 hover:bg-primary-900' 
                      : 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
                  }`}
                >
                  {bookingLoading ? <Loader2 className="animate-spin" /> : (doctor.is_available ? (isRw ? 'Kuvugana ubu' : 'Connect now') : (isRw ? 'Ntaboneka' : 'Not available'))}
                </button>
              </motion.div>
            );
          })
        )}
      </div>


    </div>
  );
}


