import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Bell, Heart, AlertTriangle, TrendingUp, Headphones, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationItem {
  id: string;
  type: 'wellness' | 'crisis' | 'progress' | 'therapy';
  titleEn: string;
  titleRw: string;
  messageEn: string;
  messageRw: string;
  timeEn: string;
  timeRw: string;
  icon: any;
  color: string;
  link: string;
}

const notifications: NotificationItem[] = [
  {
    id: '1',
    type: 'wellness',
    titleEn: 'Daily Wellness Check-in',
    titleRw: 'Isuzuma ry\'Ubuzima rya buri munsi',
    messageEn: 'Hi, how are you feeling today? Take 2 minutes to log your mood and stay on track. 💙',
    messageRw: 'Muraho, umeze ute uyu munsi? Fata iminota 2 wandike uko umeze kugira ngo ukomeze gahunda. 💙',
    timeEn: '2 hours ago',
    timeRw: 'amasaha 2 ashize',
    icon: Heart,
    color: 'text-blue-500 bg-blue-50',
    link: '/'
  },
  {
    id: '2',
    type: 'crisis',
    titleEn: 'Crisis Support Alert',
    titleRw: 'Ubutumwa bw\'Ubutabazi',
    messageEn: 'We noticed you may be going through something difficult. You are not alone — tap here to talk to Humura AI or call RBC helpline now.',
    messageRw: 'Twabonye ko ushobora kuba urimo guca mu bihe bikomeye. Nturi wenyine — kanda hano uvugane na Humura AI cyangwa uhamagare RBC nonaha.',
    timeEn: '5 hours ago',
    timeRw: 'amasaha 5 ashize',
    icon: AlertTriangle,
    color: 'text-red-500 bg-red-50',
    link: '/emergency'
  },
  {
    id: '3',
    type: 'progress',
    titleEn: 'Motivation & Progress Reminder',
    titleRw: 'Isura y\'Iterambere n\'Icyizere',
    messageEn: "You've been consistent for 3 days! Keep going — your mental health journey matters. Open Humura AI to see your progress report.",
    messageRw: 'Umaze iminsi 3 ukurikirana neza! Komera — urugendo rwawe rw\'ubuzima bwo mu mutwe rurakomeye. Fungura Humura AI urebe raporo y\'aho ugeze.',
    timeEn: 'Yesterday',
    timeRw: 'Ejo hashize',
    icon: TrendingUp,
    color: 'text-green-500 bg-green-50',
    link: '/progress'
  },
  {
    id: '4',
    type: 'therapy',
    titleEn: 'Therapy Session Reminder',
    titleRw: 'Kwibuka Gahunda y\'Inama',
    messageEn: 'Your guided voice therapy session is ready in Kinyarwanda. Tap to start whenever you feel ready. 🎧',
    messageRw: 'Gahunda yawe y\'inama n\'amajwi mu Kinyarwanda yateguwe. Kanda utangire igihe cyose wumva witeguye. 🎧',
    timeEn: '2 days ago',
    timeRw: 'iminsi 2 ishize',
    icon: Headphones,
    color: 'text-purple-500 bg-purple-50',
    link: '/chat'
  }
];

export default function NotificationsPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRw = i18n.language?.startsWith('rw');

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <header className="flex items-center justify-between mb-8 pt-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20">
            <Bell size={24} />
          </div>
          <h1 className="text-3xl font-black text-primary-900 tracking-tight">
            {isRw ? 'Imenyesha' : 'Notifications'}
          </h1>
        </div>
        <button className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full hover:bg-primary-100 transition-colors">
          {isRw ? 'Siba byose' : 'Clear All'}
        </button>
      </header>

      <div className="space-y-4">
        {notifications.map((notif, index) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => navigate(notif.link)}
            className="group relative bg-white border border-primary-100 rounded-[2rem] p-5 shadow-sm hover:shadow-xl hover:border-primary-200 transition-all cursor-pointer overflow-hidden"
          >
            {/* Unread indicator */}
            {index < 2 && (
              <div className="absolute top-6 right-6 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]" />
            )}

            <div className="flex gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${notif.color}`}>
                <notif.icon size={28} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-black text-primary-900 truncate pr-4">
                    {isRw ? notif.titleRw : notif.titleEn}
                  </h3>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest whitespace-nowrap">
                    {isRw ? notif.timeRw : notif.timeEn}
                  </span>
                </div>
                
                <p className="text-sm text-neutral-600 leading-relaxed font-medium mb-3">
                  {isRw ? notif.messageRw : notif.messageEn}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary-600 uppercase tracking-wider">
                    {isRw ? 'Kanda hano' : 'Tap to open'}
                    <ChevronRight size={12} />
                  </div>
                  {index >= 2 && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 uppercase">
                      <CheckCircle2 size={12} />
                      {isRw ? 'Byasomwe' : 'Read'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center text-primary-200 mb-4">
            <Bell size={40} />
          </div>
          <p className="text-neutral-400 font-medium">
            {isRw ? 'Nta menyesha rishya ufite.' : 'No new notifications yet.'}
          </p>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-12 p-6 bg-neutral-50 rounded-[2rem] border border-dashed border-neutral-200">
        <p className="text-xs text-neutral-500 text-center leading-relaxed font-medium">
          {isRw 
            ? 'Imenyesha ryawe rigufasha gukurikirana intambwe utera mu buzima bwo mu mutwe. Urashobora guhindura ibyo ubona mu igenamiterere.' 
            : 'Notifications help you stay consistent with your mental health journey. You can manage your preferences in Settings.'}
        </p>
      </div>
    </div>
  );
}
