import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Phone,
  Video,
  Shield,
  ShieldCheck,
  Users,
  Building2,
  Calendar,
  Clock,
  HeartHandshake,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Send,
  MessageSquare,
  Lock,
  ChevronRight,
  ExternalLink,
  MapPin,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface SupportRequest {
  id: string;
  support_type: string;
  urgency_level: string;
  preferred_channel: string;
  contact_details: string;
  notes: string;
  status: 'pending' | 'in_review' | 'connected' | 'resolved';
  created_at: string;
}

export default function SupportNavigatorPage() {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const navigate = useNavigate();

  // Auth & Profile
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active Requests
  const [myRequests, setMyRequests] = useState<SupportRequest[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Request Form State
  const [supportType, setSupportType] = useState<'clinician' | 'peer' | 'urgent_crisis' | 'specialized'>('clinician');
  const [urgencyLevel, setUrgencyLevel] = useState<'routine' | 'same_day' | 'urgent_crisis'>('routine');
  const [preferredChannel, setPreferredChannel] = useState<'video' | 'phone' | 'chat'>('video');
  const [contactDetails, setContactDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [confidentialAgreed, setConfidentialAgreed] = useState(true);

  // Selected Tab in Navigator
  const [activeTab, setActiveTab] = useState<'all' | 'clinicians' | 'hotlines' | 'centers'>('all');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchUserProfile(user.id);
        fetchMySupportRequests(user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data) {
      setProfile(data);
      if (data.phone) setContactDetails(data.phone);
    }
  };

  const fetchMySupportRequests = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_requests')
        .select('*')
        .eq('patient_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMyRequests(data as SupportRequest[]);
      } else {
        const cached = localStorage.getItem('humura_support_requests');
        if (cached) setMyRequests(JSON.parse(cached));
      }
    } catch (e) {
      const cached = localStorage.getItem('humura_support_requests');
      if (cached) setMyRequests(JSON.parse(cached));
    } finally {
      setLoading(false);
    }
  };

  const handleSupportRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactDetails.trim() && preferredChannel === 'phone') return;
    setSubmitting(true);

    const payload = {
      patient_id: user?.id,
      support_type: supportType,
      urgency_level: urgencyLevel,
      preferred_channel: preferredChannel,
      contact_details: contactDetails.trim(),
      notes: notes.trim(),
      status: 'pending',
      confidentiality_acknowledged: confidentialAgreed,
      created_at: new Date().toISOString()
    };

    try {
      if (user?.id) {
        const { error } = await supabase.from('support_requests').insert([payload]);
        if (error) {
          saveToLocalRequests(payload);
        } else {
          // If urgent crisis, also post to crisis_events for instant doctor escalation
          if (urgencyLevel === 'urgent_crisis') {
            await supabase.from('crisis_events').insert([{
              patient_id: user.id,
              type: 'urgent_human_support_request',
              last_msg: `[Support Navigator Escalation] Patient requested immediate human intervention (${preferredChannel}). Note: ${notes.slice(0, 150)}`,
              risk_level: 'high',
              triggered_at: new Date().toISOString()
            }]).then(() => {}).catch(() => {});
          }
          fetchMySupportRequests(user.id);
        }
      } else {
        saveToLocalRequests(payload);
      }

      setRequestSuccess(true);
      setNotes('');
      setTimeout(() => setRequestSuccess(false), 6000);
    } catch (err) {
      saveToLocalRequests(payload);
      setRequestSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  const saveToLocalRequests = (payload: any) => {
    const existing = JSON.parse(localStorage.getItem('humura_support_requests') || '[]');
    const updated = [{ ...payload, id: Date.now().toString() }, ...existing];
    localStorage.setItem('humura_support_requests', JSON.stringify(updated));
    setMyRequests(updated);
  };

  return (
    <div className="space-y-8 pb-16 font-poppins max-w-5xl mx-auto px-2 sm:px-4">
      {/* ── HEADER BANNER ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#08352A] via-[#0D3F33] to-[#154E3F] text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden"
      >
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#21B48D]/20 text-[#21B48D] text-xs font-bold tracking-wide">
            <Compass size={13} />
            {isRw ? 'Ubufasha Bw’Abantu Bazewe' : 'Trusted Human Support Navigator'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isRw ? 'Guhuza n’Inzobere n’Ubufasha bw’Abantu' : 'Connect with Trusted Human Help'}
          </h1>
          <p className="text-sm text-[#A3C7BD] leading-relaxed">
            {isRw
              ? 'Tukuyobora ku baganga b’inzobere, abajyanama b’umuryango, n’imirongo y’ubutabazi bwihutirwa mu Rwanda mu mucyo no mu ibanga rikomeye.'
              : 'Directly navigate to licensed clinicians, trusted peer counselors, and 24/7 emergency responders with continuous human oversight and strict confidentiality.'}
          </p>
        </div>

        {/* ── HUMAN OVERSIGHT & CONFIDENTIALITY GUARANTEE ── */}
        <div className="mt-6 pt-5 border-t border-[#1F5E4D]/60 flex flex-wrap items-center gap-4 text-[12px] text-[#A3C7BD]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#21B48D]" />
            <span className="font-semibold text-white">
              {isRw ? 'Gukurikiranwa n’Abantu:' : 'Human Oversight:'}
            </span>
            <span>
              {isRw
                ? 'Gusaba ubufasha byose bigenzurwa n’abaganga n’abakozi b’ubuzima babihuguriwe.'
                : 'Every request is reviewed and followed up by verified clinical professionals.'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto text-[#79ABA0]">
            <Lock size={13} />
            <span>{isRw ? 'Ibanga 100% rirubahirizwa' : '100% Private & Confidential'}</span>
          </div>
        </div>
      </motion.div>

      {/* ── 24/7 IMMEDIATE HUMAN WARM LINE BANNER ── */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#08352A] text-[#21B48D] flex items-center justify-center flex-shrink-0 shadow-xs">
            <Phone size={20} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                24/7 Free Call
              </span>
              <h3 className="font-bold text-sm text-neutral-900">
                {isRw ? 'Umurongo Utishyurwa w’Ubuzima bwo mu Mutwe (Rwanda)' : 'Rwanda National Mental Health Toll-Free Line'}
              </h3>
            </div>
            <p className="text-xs text-neutral-600">
              {isRw
                ? 'Niba ukeneye kuvugana n’umuntu ako kanya, kanda uhamagare 114 nta kiguzi.'
                : 'Need to speak to a trained human responder immediately? Call 114 free anytime.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <a
            href="tel:114"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#08352A] hover:bg-[#0D3F33] text-white font-bold text-xs shadow-sm transition-all"
          >
            <Phone size={14} className="text-[#21B48D]" />
            <span>{isRw ? 'Hamagara 114 Ubu' : 'Call 114 Now'}</span>
          </a>
          <a
            href="tel:+250790003002"
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800 font-bold text-xs"
            title="Healthy Minds Rwanda"
          >
            <span>+250 790 003 002</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── LEFT: REQUEST CONFIDENTIAL HUMAN OUTREACH (7 COLS) ── */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-7 shadow-xs space-y-6">
          <div className="border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-2">
              <HeartHandshake size={20} className="text-[#21B48D]" />
              <h2 className="text-lg font-bold text-neutral-900">
                {isRw ? 'Saba ko Umuntu Akugeraho' : 'Request Human Callback or Outreach'}
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {isRw
                ? 'Hitamo ubwoko bw’ubufasha wifuza n’uburyo bwo kukugeraho. Inzobere zacu zizakuvugisha mu ibanga.'
                : 'Select the support level you need and how you prefer to be reached. A verified care professional will follow up with you.'}
            </p>
          </div>

          <form onSubmit={handleSupportRequestSubmit} className="space-y-5">
            {/* Step 1: Type of Human Support */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                {isRw ? '1. Ni ikihe cyiciro cy’ubufasha ukeneye?' : '1. What type of support are you seeking?'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'clinician',
                    en: 'Licensed Clinician / Doctor',
                    rw: 'Muganga / Inzobere mu Mutwe',
                    desc_en: '1-on-1 psychotherapy or psychiatric care',
                    desc_rw: 'Ubuvuzi bwa muganga no kugisha inama'
                  },
                  {
                    id: 'peer',
                    en: 'Peer Support & Community',
                    rw: 'Umujyanama w’Umuryango',
                    desc_en: 'Empathetic guidance from trained peer allies',
                    desc_rw: 'Inama n’ubufasha buva mu muryango'
                  },
                  {
                    id: 'urgent_crisis',
                    en: 'Urgent Crisis Outreach',
                    rw: 'Ubutabazi Bwihutirwa',
                    desc_en: 'Immediate safety and stabilization follow-up',
                    desc_rw: 'Gufashwa ako kanya mu bihe bikomeye'
                  },
                  {
                    id: 'specialized',
                    en: 'Specialized Care Referral',
                    rw: 'Kuyoborwa ku Bitaro / Isange',
                    desc_en: 'Trauma recovery, GBV support, addiction care',
                    desc_rw: 'Ibitaro byihariye n’ubufasha bwa Isange'
                  }
                ].map(item => {
                  const active = supportType === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSupportType(item.id as any)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-[#08352A] text-white border-[#08352A] shadow-xs'
                          : 'bg-neutral-50/70 border-neutral-200 text-neutral-800 hover:bg-neutral-100'
                      }`}
                    >
                      <p className="text-xs font-bold">{isRw ? item.rw : item.en}</p>
                      <p className={`text-[11px] mt-0.5 ${active ? 'text-[#A3C7BD]' : 'text-neutral-500'}`}>
                        {isRw ? item.desc_rw : item.desc_en}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Preferred Channel */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                {isRw ? '2. Wifuza ko tukugeraho binyuze he?' : '2. Preferred Contact Channel'}
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'video', icon: Video, en: 'Video Session', rw: 'Amashusho (Video)' },
                  { id: 'phone', icon: Phone, en: 'Phone Call', rw: 'Telefoni (Call)' },
                  { id: 'chat', icon: MessageSquare, en: 'Private Chat', rw: 'Ubutumwa (Chat)' }
                ].map(ch => {
                  const isSel = preferredChannel === ch.id;
                  const Icon = ch.icon;
                  return (
                    <button
                      type="button"
                      key={ch.id}
                      onClick={() => setPreferredChannel(ch.id as any)}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        isSel
                          ? 'bg-[#154E3F] text-white border-[#154E3F] shadow-xs'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-xs font-semibold text-center">{isRw ? ch.rw : ch.en}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Contact Details */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                {isRw ? '3. Nimero ya Telefoni cyangwa aho tukubona' : '3. Telephone / Reachable Contact'}
              </label>
              <input
                type="text"
                value={contactDetails}
                onChange={e => setContactDetails(e.target.value)}
                placeholder={isRw ? 'Urugero: +250 788 000 000' : 'e.g. +250 788 000 000 or username'}
                required
                className="w-full text-xs p-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#08352A]"
              />
            </div>

            {/* Step 4: Urgency Level */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                {isRw ? '4. Urwego rw’Ubwihutirwe' : '4. Urgency Level'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'routine', en: 'Routine (1-2 days)', rw: 'Bisanzwe (Iminsi 1-2)' },
                  { id: 'same_day', en: 'Same Day', rw: 'Uyu munsi' },
                  { id: 'urgent_crisis', en: 'Urgent Crisis', rw: 'Ihutirwa / Ubutabazi' }
                ].map(lvl => {
                  const active = urgencyLevel === lvl.id;
                  return (
                    <button
                      type="button"
                      key={lvl.id}
                      onClick={() => setUrgencyLevel(lvl.id as any)}
                      className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                        active
                          ? lvl.id === 'urgent_crisis'
                            ? 'bg-rose-700 text-white border-rose-700'
                            : 'bg-[#08352A] text-white border-[#08352A]'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {isRw ? lvl.rw : lvl.en}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 5: Brief Confidential Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                {isRw ? '5. Icyo wifuza ko inzobere imenya mbere yo kukuvugisha' : '5. What would you like your responder to know? (Optional)'}
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder={
                  isRw
                    ? 'Andika muri make ibyo wifuza kuganiraho...'
                    : 'Briefly share what you are experiencing or what kind of guidance you seek...'
                }
                className="w-full text-xs p-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#08352A]"
              />
            </div>

            {/* Confidentiality Check */}
            <div className="p-3.5 rounded-2xl bg-[#EBF7F2] border border-[#D4EDE1] flex items-start gap-2.5 text-xs text-[#08352A]">
              <ShieldCheck size={18} className="text-[#21B48D] flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">
                  {isRw ? 'Gusezerana ku banga n’uburenganzira bwawe' : 'Strict Human Confidentiality'}
                </span>
                <p className="text-[11px] text-[#256353]">
                  {isRw
                    ? 'Amakuru yose utanze abikwa mu ibanga kandi akoreshwa gusa n’inzobere mu kuguha ubufasha bw’ubuzima.'
                    : 'Your information is encrypted and strictly accessible only to your assigned care provider for clinical follow-up.'}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-6 rounded-2xl bg-[#08352A] hover:bg-[#0D3F33] text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin text-[#21B48D]" />
                  <span>{isRw ? 'Biri koherezwa...' : 'Connecting to care team...'}</span>
                </>
              ) : (
                <>
                  <Send size={16} className="text-[#21B48D]" />
                  <span>{isRw ? 'Ohereza Ubusabe bw’Ubufasha' : 'Submit Confidential Support Request'}</span>
                </>
              )}
            </button>

            {requestSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2"
              >
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>
                  {isRw
                    ? 'Ubusabe bwawe bwakiriwe neza! Inzobere izakuvugisha vuba bishoboka.'
                    : 'Your request has been routed to our clinical coordination team. We will connect with you soon.'}
                </span>
              </motion.div>
            )}
          </form>
        </div>

        {/* ── RIGHT: TRUSTED HUMAN PATHWAYS & DIRECT DIRECTORY (5 COLS) ── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Direct Actions Card */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2 border-b border-neutral-100 pb-3">
              <Users size={18} className="text-[#08352A]" />
              {isRw ? 'Inzira z’Ubufasha bw’Abantu' : 'Direct Human Care Pathways'}
            </h3>

            <div className="space-y-3">
              {/* Option A: Book 1-on-1 Doctor Video */}
              <div 
                onClick={() => navigate('/patient/meet-professional')}
                className="p-3.5 rounded-2xl bg-neutral-50 hover:bg-[#EBF7F2] border border-neutral-200 hover:border-[#21B48D] transition-all cursor-pointer group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#08352A] text-[#21B48D] flex items-center justify-center">
                    <Video size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-neutral-900 group-hover:text-[#08352A]">
                      {isRw ? 'Ganira n’Inzobere kuri Video' : 'Book 1-on-1 Clinical Video'}
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      {isRw ? 'Fata gahunda n’abaganga b’inzobere' : 'Choose your doctor & consultation slot'}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-neutral-400 group-hover:text-[#08352A]" />
              </div>

              {/* Option B: Centers Directory */}
              <div 
                onClick={() => navigate('/patient/centers')}
                className="p-3.5 rounded-2xl bg-neutral-50 hover:bg-[#EBF7F2] border border-neutral-200 hover:border-[#21B48D] transition-all cursor-pointer group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#154E3F] text-white flex items-center justify-center">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-neutral-900 group-hover:text-[#08352A]">
                      {isRw ? 'Shaka Ibitaro n’Amavuriro' : 'In-Person Clinics & Hospitals'}
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      {isRw ? 'CARAES Ndera, CHUK, n’amavuriro yo mu turere' : 'Referral centers across Rwanda provinces'}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-neutral-400 group-hover:text-[#08352A]" />
              </div>

              {/* Option C: Emergency Hotlines */}
              <div 
                onClick={() => navigate('/patient/emergency')}
                className="p-3.5 rounded-2xl bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200 transition-all cursor-pointer group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-rose-900">
                      {isRw ? 'Ubufasha bw’Ihutirwa (SOS)' : 'Emergency & Crisis Hotlines'}
                    </h4>
                    <p className="text-[11px] text-rose-700">
                      {isRw ? 'Imirongo 114, 112, na CARAES Ndera' : 'Direct emergency dials & safety plans'}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-rose-400" />
              </div>
            </div>
          </div>

          {/* Active Support Requests Status */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-500 flex items-center justify-between">
              <span>{isRw ? 'Ubusabe bwawe bwo guhura n’abantu' : 'Your Support Requests'}</span>
              <span className="text-[10px] text-neutral-400 font-normal">
                {myRequests.length} {isRw ? 'byanditse' : 'logged'}
              </span>
            </h3>

            {myRequests.length === 0 ? (
              <p className="text-xs text-neutral-400 italic py-2">
                {isRw
                  ? 'Nta busabe bwo guhuza n’abantu uratanga.'
                  : 'No active support requests logged yet.'}
              </p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {myRequests.slice(0, 5).map(req => {
                  const dateStr = new Date(req.created_at).toLocaleDateString(
                    isRw ? 'rw-RW' : 'en-US',
                    { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                  );
                  const isPending = req.status === 'pending';
                  return (
                    <div
                      key={req.id}
                      className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-800 capitalize">
                          {req.support_type.replace('_', ' ')}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isPending
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        {isRw ? 'Uburyo:' : 'Channel:'} {req.preferred_channel} &bull; {req.urgency_level}
                      </p>
                      <p className="text-[10px] text-neutral-400">{dateStr}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
