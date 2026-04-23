import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Phone, AlertTriangle, ShieldAlert, Heart, MessageCircle, MapPin, Clock, CheckCircle } from 'lucide-react';

interface Contact {
  id: string;
  nameEn: string;
  nameRw: string;
  number: string;
  descEn: string;
  descRw: string;
  available: string;
  color: string;
  bg: string;
  emoji: string;
}

const contacts: Contact[] = [
  {
    id: 'crisisline',
    nameEn: 'Rwanda Mental Health Hotline',
    nameRw: 'Hotline y\'Ubuzima bwo mu Mutwe (Rwanda)',
    number: '114',
    descEn: 'Free 24/7 mental health crisis line. Call when you feel overwhelmed, suicidal, or need urgent support.',
    descRw: 'Hotline y\'ubuntu 24/7 y\'ubuzima bwo mu mutwe. Hamagara iyo wumva uremerewe, ufite ibitekerezo byo kwiyahura, cyangwa ukeneye ubufasha bwihutirwa.',
    available: '24/7 · Free',
    color: 'text-red-600',
    bg: 'from-red-500 to-rose-600',
    emoji: '🆘',
  },
  {
    id: 'healthyminds',
    nameEn: 'Healthy Minds Rwanda',
    nameRw: 'Healthy Minds Rwanda',
    number: '+250 790 003 002',
    descEn: 'Counseling and crisis support. Talk to a trained mental health professional in Kinyarwanda or English.',
    descRw: 'Inama na serivisi mu bihe bikomeye. Ganira n\'inzobere y\'ubuzima bwo mu mutwe mu Kinyarwanda cyangwa Icyongereza.',
    available: 'Mon–Fri 8am–6pm',
    color: 'text-rose-600',
    bg: 'from-pink-500 to-rose-600',
    emoji: '💚',
  },
  {
    id: 'police',
    nameEn: 'Police / Ambulance',
    nameRw: 'Polisi / Imbangukiragutabara',
    number: '112',
    descEn: 'For immediate physical danger or medical emergencies. Police and ambulance services.',
    descRw: 'Ku makuru ya Polisi cyangwa imbangukiragutabara. Koresha iyo uri mu kaga karomerwa.',
    available: '24/7',
    color: 'text-blue-600',
    bg: 'from-blue-500 to-indigo-600',
    emoji: '🚨',
  },
  {
    id: 'caraes',
    nameEn: 'CARAES Ndera 24H Emergency',
    nameRw: 'CARAES Ndera Ihutirwa 24/7',
    number: '+250 788 316 500',
    descEn: 'Rwanda\'s main psychiatric hospital emergency unit. Available 24 hours for mental health emergencies.',
    descRw: 'Ibitaro bya mbere bya psychiatrie mu Rwanda. Ihari amasaha 24 ku bibazo bya emerijanse by\'ubuzima bwo mu mutwe.',
    available: '24/7 Emergency',
    color: 'text-teal-600',
    bg: 'from-teal-500 to-primary',
    emoji: '🏥',
  },
  {
    id: 'suicide',
    nameEn: 'Befrienders Kenya (Regional)',
    nameRw: 'Befrienders Kenya (Akarere)',
    number: '+254 722 178 177',
    descEn: 'Regional suicide prevention line serving East Africa. Confidential listening and support.',
    descRw: 'Hotline yo gukumira kwiyahura mu karere k\'Afrika y\'Iburasirazuba. Kwumva ibanga na serivisi.',
    available: '24/7',
    color: 'text-purple-600',
    bg: 'from-purple-500 to-violet-600',
    emoji: '🤝',
  },
  {
    id: 'gbv',
    nameEn: 'Isange One-Stop Center (GBV)',
    nameRw: 'Isange (Ubukangurambaga bw\'Igitsina)',
    number: '+250 788 386 000',
    descEn: 'Gender-based violence support, counseling and medical care at CHUK hospital.',
    descRw: 'Ubufasha ku makamba y\'igitsina, inama n\'ubuvuzi muri CHUK.',
    available: '24/7',
    color: 'text-rose-600',
    bg: 'from-rose-400 to-pink-600',
    emoji: '🛡️',
  },
];

const safetySteps = [
  { en: 'Tell someone you trust how you are feeling right now', rw: 'Bwira umuntu uizeye uko umererwa ubu' },
  { en: 'Remove access to any means of harm (medications, sharp objects)', rw: 'Tangaho ibintu bishobora kukugirira nabi (imiti, ibintu bikomeye)' },
  { en: 'Call one of the numbers above immediately', rw: 'Hamagara imwe mu nomero zo hejuru ako kanya' },
  { en: 'Go to your nearest hospital emergency room', rw: 'Jenda mu bitaro bya hafi yawe mu gice cy\'ihutirwa' },
  { en: 'Stay with someone until you feel safe again', rw: 'Guma n\'umuntu kugeza ubona umutekano' },
];

export default function EmergencyPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [called, setCalled] = useState<string | null>(null);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-red-500 to-rose-700 rounded-3xl p-6 text-white"
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={28} className="animate-pulse" />
          <h1 className="text-2xl font-extrabold tracking-tight">
            {lang === 'rw' ? 'Ubufasha Bwihutirwa' : 'Emergency & Crisis'}
          </h1>
        </div>
        <p className="text-white/85 text-sm leading-relaxed">
          {lang === 'rw'
            ? 'Niba uri mu kaga cyangwa uri hafi yo kwigirira nabi — ntutindeho guhamagara. Ubuzima bwawe bufite agaciro.'
            : 'If you are in crisis or thinking about harming yourself — please call now. Your life has value and you matter.'}
        </p>
        <div className="mt-4 flex items-center gap-2 bg-white/15 rounded-2xl px-4 py-2">
          <ShieldAlert size={16} />
          <span className="text-sm font-semibold">
            {lang === 'rw' ? 'Ikiganiro cyose gifite ibanga' : 'All calls are confidential and judgment-free'}
          </span>
        </div>
      </motion.div>

      {/* Quick Exit Button */}
      <a
        href="https://google.com"
        className="flex items-center justify-center gap-2 w-full py-3.5 bg-neutral-800 text-white text-sm font-bold rounded-2xl hover:bg-black transition-colors"
      >
        <ShieldAlert size={16} />
        {lang === 'rw' ? 'Sohoka Vuba (Hisha Gahunda)' : 'Quick Exit (Hide Page Immediately)'}
      </a>

      {/* Emergency Contacts */}
      <div className="space-y-3">
        <h2 className="font-bold text-primary-900 text-lg flex items-center gap-2">
          <Phone size={18} className="text-red-500" />
          {lang === 'rw' ? 'Hamagara Ubu' : 'Call Right Now'}
        </h2>

        {contacts.map((c, idx) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="glass-card rounded-2xl p-4 flex items-start gap-4"
          >
            <div className={`w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-br ${c.bg} flex items-center justify-center text-2xl`}>
              {c.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-primary-900 text-sm">
                {lang === 'rw' ? c.nameRw : c.nameEn}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5 leading-snug">
                {lang === 'rw' ? c.descRw : c.descEn}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock size={11} className="text-neutral-400" />
                <span className="text-[10px] text-neutral-400 font-medium">{c.available}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <a
                href={`tel:${c.number}`}
                onClick={() => setCalled(c.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-br ${c.bg} text-white font-bold text-sm shadow-md hover:opacity-90 transition-opacity`}
              >
                <Phone size={14} />
                {c.number}
              </a>
              {called === c.id && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 text-emerald-600 text-[10px] font-semibold">
                  <CheckCircle size={11} />
                  {lang === 'rw' ? 'Urahamagara...' : 'Calling...'}
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Safety Plan */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-primary-900 flex items-center gap-2">
          <Heart size={18} className="text-rose-500" />
          {lang === 'rw' ? 'Gahunda y\'Umutekano' : 'Safety Plan'}
        </h2>
        <p className="text-xs text-neutral-500">
          {lang === 'rw'
            ? 'Ibyo wakora ubu niba uri mu kaga:'
            : 'Steps to take right now if you are in crisis:'}
        </p>
        <div className="space-y-2">
          {safetySteps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.07 }}
              className="flex gap-3 p-3 bg-primary-50 rounded-xl"
            >
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {i + 1}
              </div>
              <p className="text-sm font-medium text-primary-900 leading-snug">
                {lang === 'rw' ? step.rw : step.en}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Chat link */}
      <div className="glass-card rounded-2xl p-4 flex items-start gap-3">
        <MessageCircle size={20} className="text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-primary-900 text-sm">
            {lang === 'rw' ? 'Vuga na Inkingi AI' : 'Talk to Inkingi AI'}
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            {lang === 'rw'
              ? 'Inkingi AI itangirana gufotora ubuzima bwawe no kukugobotora — amasaa yose.'
              : 'Inkingi AI is always here to listen, support and guide you — no judgment, any time.'}
          </p>
          <a
            href="/chat"
            className="inline-flex items-center gap-1.5 mt-2 text-primary font-bold text-xs hover:underline"
          >
            <MessageCircle size={13} />
            {lang === 'rw' ? 'Tangira ikiganiro' : 'Start a conversation'}
          </a>
        </div>
      </div>

      {/* Nearby help */}
      <div className="glass-card rounded-2xl p-4 flex items-start gap-3">
        <MapPin size={20} className="text-rose-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-primary-900 text-sm">
            {lang === 'rw' ? 'Ibitaro bya Hafi Yawe' : 'Nearest Hospital'}
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            {lang === 'rw'
              ? 'Jenda mu gice cy\'ihutirwa cy\'ibitaro bya hafi yawe buri gihe'
              : 'Walk into any hospital emergency room — they must help you regardless of payment.'}
          </p>
          <a
            href="/centers"
            className="inline-flex items-center gap-1.5 mt-2 text-rose-500 font-bold text-xs hover:underline"
          >
            <MapPin size={13} />
            {lang === 'rw' ? 'Reba amavuriro' : 'Find centers'}
          </a>
        </div>
      </div>
    </div>
  );
}

