import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, MessageCircle, ShieldCheck, BarChart2, BookOpen, 
  MapPin, HandMetal, Type, Languages, AlertTriangle, 
  ChevronRight, Heart, Star, Compass
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const { t, i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setProfile(data);
    }
    setLoading(false);
  };

  const menuItems = [
    { 
      title: isRw ? 'Inzobere mu Buzima' : 'Meet Professional', 
      desc: isRw ? 'Vugana n’inzobere mu buzima bwo mu mutwe' : 'Connect with certified clinical experts',
      icon: ShieldCheck, color: 'bg-emerald-500', path: '/meet-professional' 
    },
    { 
      title: isRw ? 'Ikiganiro na Humura' : 'Chat with Humura', 
      desc: isRw ? 'Ubufasha bwa AI bugufasha buri gihe' : '24/7 empathetic AI companion',
      icon: MessageCircle, color: 'bg-primary', path: '/chat' 
    },
    { 
      title: isRw ? 'Iterambere Rwanjye' : 'My Progress', 
      desc: isRw ? 'Reba uko umerewe n’amafishi yawe' : 'Analyze your mood and journaling journey',
      icon: BarChart2, color: 'bg-amber-500', path: '/progress' 
    },
    { 
      title: isRw ? 'Inyigisho' : 'Educational Hub', 
      desc: isRw ? 'Andika ubumenyi ku buzima bwo mu mutwe' : 'Learn about mental health and wellness',
      icon: BookOpen, color: 'bg-blue-500', path: '/education' 
    },
    { 
      title: isRw ? 'Ubufasha bw’Ihutirwa' : 'Emergency Support', 
      desc: isRw ? 'Ubutabazi mu gihe cy’akaga' : 'Immediate crisis intervention resources',
      icon: AlertTriangle, color: 'bg-red-500', path: '/emergency' 
    },
    { 
      title: isRw ? 'Amavuriro' : 'Support Centers', 
      desc: isRw ? 'Shaka amavuriro akwegereye' : 'Find physical support centers near you',
      icon: MapPin, color: 'bg-indigo-500', path: '/centers' 
    },
    { 
      title: isRw ? 'Gusemura mu Marenga' : 'Sign Language', 
      desc: isRw ? 'Ikoranabuhanga rigenewe abatumva' : 'AI-powered sign language translation',
      icon: HandMetal, color: 'bg-teal-500', path: '/sign-language' 
    },
    { 
      title: isRw ? 'Braille Generator' : 'Braille Tool', 
      desc: isRw ? 'Gufasha abafite ubumuga bwo kutabona' : 'Convert text to Braille for accessibility',
      icon: Type, color: 'bg-purple-500', path: '/braille' 
    },
    { 
      title: isRw ? 'Semura' : 'Language Translator', 
      desc: isRw ? 'Sema indimi zitandukanye' : 'Translate between Kinyarwanda and English',
      icon: Languages, color: 'bg-orange-500', path: '/translator' 
    },
  ];

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#FDFCFB] pt-24 pb-20 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="space-y-2">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-primary-400"
          >
            <Compass size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{isRw ? 'Shaka Ibishya' : 'Explore Humura AI'}</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-black text-primary-900 tracking-tight"
          >
            {isRw ? `Muraho neza, ${profile?.full_name?.split(' ')[0] || 'Inshuti'}` : `Welcome back, ${profile?.full_name?.split(' ')[0] || 'Friend'}`}
          </motion.h1>
          <p className="text-primary-600 font-bold max-w-lg">
            {isRw ? 'Urubuga rw’ubuzima bwo mu mutwe rwizewe kandi rudaheza ku Banyarwanda bose.' : 'Your inclusive sanctuary for mental wellness, clinical support, and personal growth.'}
          </p>
        </header>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, idx) => (
            <motion.button
              key={item.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + (idx * 0.05) }}
              onClick={() => navigate(item.path)}
              className="group relative bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all text-left flex flex-col justify-between h-56"
            >
              <div className="space-y-4">
                <div className={`w-14 h-14 ${item.color} text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <item.icon size={28} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-primary-900 text-lg leading-tight">{item.title}</h3>
                  <p className="text-xs font-bold text-neutral-400 line-clamp-2">{item.desc}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-neutral-50 mt-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary-300 group-hover:text-primary transition-colors">{isRw ? 'Tangira' : 'Get Started'}</span>
                <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-300 group-hover:bg-primary group-hover:text-white transition-all">
                  <ChevronRight size={16} />
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Footer Card */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-primary/5 border border-primary/10 p-8 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
              <Star size={24} fill="currentColor" />
            </div>
            <div>
              <p className="text-sm font-black text-primary-900 italic">
                {isRw ? '"Umutima usanzwe ni ishingiro ry’ubuzima."' : '"Your mental wellness is your greatest wealth."'}
              </p>
              <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">— Humura AI Wellness</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/progress')}
            className="px-6 py-3 bg-white text-primary font-black text-xs uppercase rounded-xl border border-primary/10 shadow-sm hover:bg-primary hover:text-white transition-all"
          >
            {isRw ? 'Reba uko umerewe' : 'Check My Wellness'}
          </button>
        </motion.div>

      </div>
    </div>
  );
}
