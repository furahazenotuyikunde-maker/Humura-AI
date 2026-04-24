import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Lock, Send, Edit2, Trash2, Check, X, Shield } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// ──────────────────────────────────────────────────────────────
// CIRCLES DATA — 4 peer support groups
// ──────────────────────────────────────────────────────────────
interface Circle {
  id: string;
  icon: string;
  color: string;
  nameEn: string;
  nameRw: string;
  descEn: string;
  descRw: string;
  moderator: string;
  moderatorRole: string;
  members: number;
  topicEn: string;
  topicRw: string;
}

const circles: Circle[] = [
  {
    id: 'anxiety',
    icon: '💙',
    color: 'from-sky-400 to-blue-600',
    nameEn: 'Anxiety & Worry',
    nameRw: 'Ubwoba n\'Amanyanga',
    descEn: 'A safe space to share about anxiety, panic and worry',
    descRw: 'Ahantu hizewe ho gusangira ku bwoba, ubwoba bwinshi n\'amanyanga',
    moderator: 'Amina K.',
    moderatorRole: 'Certified Counselor',
    members: 247,
    topicEn: 'Managing exam anxiety this week',
    topicRw: 'Gucunga ubwoba bw\'ikizamini iki cyumweru',
  },
  {
    id: 'grief',
    icon: '🌸',
    color: 'from-violet-400 to-purple-600',
    nameEn: 'Grief & Loss',
    nameRw: 'Akababaro n\'Ugupiripita',
    descEn: 'Walking together through grief and loss',
    descRw: 'Tugenda hamwe mu akababaro no gupiripita',
    moderator: 'Jean-Paul M.',
    moderatorRole: 'Volunteer',
    members: 183,
    topicEn: 'Honoring memories while moving forward',
    topicRw: 'Kubungabunga inkuru mu gihe ugenda imbere',
  },
  {
    id: 'youth',
    icon: '🌱',
    color: 'from-emerald-400 to-teal-600',
    nameEn: 'Youth Wellness',
    nameRw: 'Ubuzima bw\'Urubyiruko',
    descEn: 'Safe mental health conversations for young people',
    descRw: 'Ikiganiro cy\'ubuzima bwo mu mutwe cy\'urubyiruko',
    moderator: 'Marie C.',
    moderatorRole: 'Peer Support Leader',
    members: 412,
    topicEn: 'School pressure and mental health balance',
    topicRw: 'Ibibazo bya sukuru n\'umuzane w\'ubuzima bwo mu mutwe',
  },
  {
    id: 'trauma',
    icon: '🌅',
    color: 'from-amber-400 to-orange-600',
    nameEn: 'Trauma Recovery',
    nameRw: 'Gukira Trauma',
    descEn: 'Intergenerational healing and trauma recovery',
    descRw: 'Ugukira trauma bitandukanijwe n\'ibihe',
    moderator: 'Dr. Uwase R.',
    moderatorRole: 'Psychologist',
    members: 156,
    topicEn: 'Grounding techniques for difficult memories',
    topicRw: 'Uburyo bwo gutura mu bihe ku inkuru zigoye',
  },
];

// ──────────────────────────────────────────────────────────────
// MESSAGE TYPE
// ──────────────────────────────────────────────────────────────
interface Message {
  id: string;
  author: string;
  text: string;
  isAnon: boolean;
  isOwn: boolean;
  isModerator?: boolean;
  createdAt: Date;
  updatedAt?: Date;
  isEdited?: boolean;
}

// Sample seed messages per circle
const seedMessages: Record<string, Message[]> = {
  anxiety: [
    { id: 's1', author: 'Amina K.', text: 'Welcome to our Anxiety & Worry circle. This is a safe, moderated space. Share what\'s on your mind — no judgment here. 💙', isAnon: false, isOwn: false, isModerator: true, createdAt: new Date(Date.now() - 3600000 * 2) },
    { id: 's2', author: 'Member #472', text: 'Does anyone else find that taking a 5-minute walk helps when anxious? Discovered this last week and wow, the difference!', isAnon: true, isOwn: false, createdAt: new Date(Date.now() - 3600000) },
  ],
  grief: [
    { id: 'g1', author: 'Jean-Paul M.', text: 'Welcome, friends. This circle holds space for all your grief — whatever form it takes. We walk this together. 🌸', isAnon: false, isOwn: false, isModerator: true, createdAt: new Date(Date.now() - 7200000) },
    { id: 'g2', author: 'Member #101', text: 'Some days are harder than others. Today is one of those days. But I am still here and that counts.', isAnon: true, isOwn: false, createdAt: new Date(Date.now() - 1800000) },
  ],
  youth: [
    { id: 'y1', author: 'Marie C.', text: 'Hey everyone! This is your space. Whatever you\'re going through at school, home, or in life — share freely. We\'re all peers here. 🌱', isAnon: false, isOwn: false, isModerator: true, createdAt: new Date(Date.now() - 5400000) },
    { id: 'y2', author: 'Member #723', text: 'Exam season is so hard this year. Anyone have tips for managing test anxiety? Even a little help would mean a lot.', isAnon: true, isOwn: false, createdAt: new Date(Date.now() - 900000) },
  ],
  trauma: [
    { id: 't1', author: 'Dr. Uwase R.', text: 'Welcome to our Trauma Recovery circle. Everything shared here stays here. Healing happens at your own pace — there\'s no rush. 🌅', isAnon: false, isOwn: false, isModerator: true, createdAt: new Date(Date.now() - 10800000) },
  ],
};

function formatTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

// ──────────────────────────────────────────────────────────────
// CIRCLE CHAT COMPONENT
// ──────────────────────────────────────────────────────────────
function CircleChat({ circle, lang, onBack, userName }: { circle: Circle; lang: string; onBack: () => void; userName: string }) {
  const isRw = lang.startsWith('rw');
  const [messages, setMessages] = useState<Message[]>(seedMessages[circle.id] || []);
  const [newMsg, setNewMsg] = useState('');
  const [isAnon, setIsAnon] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Supabase realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`circle-${circle.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'circle_messages',
        filter: `circle_id=eq.${circle.id}`,
      }, () => {
        // Would refresh messages from DB here
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [circle.id]);

  const handleSend = () => {
    if (!newMsg.trim()) return;
    const msg: Message = {
      id: `u-${Date.now()}`,
      author: isAnon ? 'Anonymous' : userName,
      text: newMsg.trim(),
      isAnon,
      isOwn: true,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, msg]);
    setNewMsg('');

    // Insert to Supabase (non-blocking)
    supabase.from('circle_messages').insert({
      circle_id: circle.id,
      author: msg.author,
      text: msg.text,
      is_anon: msg.isAnon,
    }).then(() => {});
  };

  const handleEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditText(msg.text);
  };

  const saveEdit = (id: string) => {
    setMessages(prev => prev.map(m =>
      m.id === id ? { ...m, text: editText, isEdited: true, updatedAt: new Date() } : m
    ));
    setEditingId(null);
    supabase.from('circle_messages').update({ text: editText }).eq('id', id).then(() => {});
  };

  const handleDelete = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    supabase.from('circle_messages').delete().eq('id', id).then(() => {});
  };

  return (
    <div className="flex flex-col h-[calc(100vh-150px)] md:h-[calc(100vh-90px)]">
      {/* Circle header */}
      <div className={`flex-shrink-0 bg-gradient-to-br ${circle.color} p-4 rounded-t-3xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="bg-white/20 hover:bg-white/30 rounded-xl p-1.5 transition-colors"
              aria-label="Back to circles"
            >
              <X size={18} className="text-white" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{circle.icon}</span>
                <h2 className="font-extrabold text-white text-base">
                  {isRw ? circle.nameRw : circle.nameEn}
                </h2>
              </div>
              <p className="text-white/75 text-xs">
                <Shield size={10} className="inline mr-1" />
                {isRw ? `Moderator: ${circle.moderator}` : `Moderated by ${circle.moderator} · ${circle.moderatorRole}`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-xs font-medium">{circle.members} {isRw ? 'abanyamuryango' : 'members'}</p>
          </div>
        </div>
        {/* Safety notice */}
        <div className="mt-3 bg-white/15 rounded-xl px-3 py-2 flex items-center gap-2">
          <Lock size={12} className="text-white/80 flex-shrink-0" />
          <p className="text-white/80 text-xs">
            {isRw
              ? 'Ahantu hizewe kandi hagendeshwa — nta makuru y\'umwirondoro asangirwa'
              : 'Safe moderated space — no personal info shared'}
          </p>
        </div>
        {/* Current topic */}
        <div className="mt-2 text-white/70 text-xs">
          📌 {isRw ? circle.topicRw : circle.topicEn}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-primary-50">
        {messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${msg.isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className="flex items-center gap-2">
                {msg.isModerator && (
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                    🛡️ {msg.author}
                  </span>
                )}
                {!msg.isModerator && !msg.isOwn && (
                  <span className="text-xs text-neutral-400 font-medium">{msg.author}</span>
                )}
                {msg.isOwn && (
                  <span className="text-xs text-neutral-400 font-medium">
                    {msg.isAnon ? 'Anonymous (You)' : `${userName} (You)`}
                  </span>
                )}
                <span className="text-[10px] text-neutral-400">{formatTime(msg.createdAt)}</span>
                {msg.isEdited && <span className="text-[10px] text-neutral-400 italic">edited</span>}
              </div>

              {editingId === msg.id ? (
                <div className="flex items-center gap-2 w-full">
                  <input
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-primary-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    onKeyDown={e => e.key === 'Enter' && saveEdit(msg.id)}
                    autoFocus
                  />
                  <button onClick={() => saveEdit(msg.id)} className="p-1.5 bg-primary rounded-lg text-white hover:bg-primary-900">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-1.5 bg-neutral-100 rounded-lg text-neutral-600 hover:bg-neutral-200">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className={`relative px-4 py-3 rounded-3xl text-sm leading-relaxed shadow-sm ${
                  msg.isModerator
                    ? 'bg-amber-50 border border-amber-100 text-amber-900 rounded-tl-sm'
                    : msg.isOwn
                    ? 'bg-primary text-white rounded-tr-sm'
                    : 'bg-white border border-primary-100 text-primary-900 rounded-tl-sm'
                }`}>
                  {msg.text}
                  {msg.isOwn && (
                    <div className="flex gap-1.5 mt-2 justify-end">
                      <button
                        onClick={() => handleEdit(msg)}
                        className="p-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                        aria-label="Edit message"
                      >
                        <Edit2 size={11} className="text-white/80" />
                      </button>
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="p-1 bg-white/20 rounded-lg hover:bg-red-500/40 transition-colors"
                        aria-label="Delete message"
                      >
                        <Trash2 size={11} className="text-white/80" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-3 bg-white border-t border-primary-50 space-y-2">
        {/* Anon toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsAnon(a => !a)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isAnon ? 'bg-primary text-white' : 'bg-primary-50 text-primary-700'
            }`}
          >
            <Lock size={12} />
            {isAnon
              ? (isRw ? 'Ntazigaragazwa' : 'Anonymous')
              : (isRw ? `${userName} — Garagaza izina` : `${userName} — Show Name`)}
          </button>
          <p className="text-[10px] text-neutral-400">
            {isRw ? 'Amazina yawe arinda buri gihe' : 'Your identity is always protected'}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={isRw ? 'Andika hano...' : 'Share with the circle...'}
            className="flex-1 px-4 py-3 bg-primary-50 rounded-2xl border border-primary-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-neutral-400"
          />
          <button
            onClick={handleSend}
            disabled={!newMsg.trim()}
            className="p-3 bg-primary text-white rounded-2xl disabled:opacity-40 hover:bg-primary-900 transition-colors"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// MAIN COMMUNITY PAGE
// ──────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const isRw = lang.startsWith('rw');
  const [activeCircle, setActiveCircle] = useState<Circle | null>(null);
  const userName = 'Member #' + Math.floor(Math.random() * 900 + 100).toString();

  return (
    <div className="space-y-5 pb-10">
      <AnimatePresence mode="wait">
        {activeCircle ? (
          <CircleChat
            key="chat"
            circle={activeCircle}
            lang={lang}
            onBack={() => setActiveCircle(null)}
            userName={userName}
          />
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="text-primary" size={28} />
                <h1 className="text-2xl font-extrabold text-primary-900 tracking-tight">
                  {isRw ? 'Imirimo y\'Umuryango' : 'Community Circles'}
                </h1>
              </div>
              <p className="text-primary-600 text-sm">
                {isRw
                  ? 'Ikiganiro cy\'ibanga — kumva, gufasha no gutumanahana'
                  : 'Anonymous, judgment-free peer support spaces'}
              </p>
            </div>

            {/* Privacy notice */}
            <div className="flex items-center gap-2 px-4 py-3 bg-primary-50 rounded-2xl">
              <Lock size={14} className="text-primary flex-shrink-0" />
              <p className="text-xs text-primary-700 font-medium">
                {isRw
                  ? 'Amazina yawe ahishwa buri gihe. Ibiganiro byose bifite ibanga.'
                  : 'Your identity is always protected. All posts are anonymous by default.'}
              </p>
            </div>

            {/* Circle cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {circles.map((circle, idx) => (
                <motion.button
                  key={circle.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  onClick={() => setActiveCircle(circle)}
                  className="text-left rounded-3xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  <div className={`bg-gradient-to-br ${circle.color} p-6`}>
                    <div className="text-4xl mb-3">{circle.icon}</div>
                    <h3 className="font-extrabold text-white text-lg leading-tight">
                      {isRw ? circle.nameRw : circle.nameEn}
                    </h3>
                    <p className="text-white/75 text-sm mt-1 leading-snug">
                      {isRw ? circle.descRw : circle.descEn}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1 text-white/80 text-xs font-medium">
                        <Users size={13} />
                        <span>{circle.members} {isRw ? 'abanyamuryango' : 'members'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-white/70 text-xs">
                        <Shield size={11} />
                        <span>{circle.moderator}</span>
                      </div>
                    </div>
                    <div className="mt-3 bg-white/10 rounded-xl px-3 py-2">
                      <p className="text-white/80 text-xs">
                        📌 {isRw ? circle.topicRw : circle.topicEn}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


