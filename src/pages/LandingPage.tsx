import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Heart, Briefcase, Languages } from 'lucide-react';

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRw = i18n.language?.startsWith('rw');

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full -ml-32 -mb-32 blur-3xl" />

      {/* Language Selector */}
      <div className="absolute top-8 right-8 flex bg-neutral-50 p-1 rounded-2xl border border-neutral-100 shadow-sm">
        <button 
          onClick={() => i18n.changeLanguage('en')}
          className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${!isRw ? 'bg-primary text-white shadow-md' : 'text-primary-400 hover:text-primary-600'}`}
        >
          English
        </button>
        <button 
          onClick={() => i18n.changeLanguage('rw')}
          className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${isRw ? 'bg-primary text-white shadow-md' : 'text-primary-400 hover:text-primary-600'}`}
        >
          Kinyarwanda
        </button>
      </div>

      <main className="w-full max-w-sm text-center space-y-10">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-primary/10"
        >
          <img src="/logo.png" alt="Humura AI" className="h-14 w-14 object-contain" />
        </motion.div>

        <div className="space-y-4">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl font-black text-primary-900 leading-tight"
          >
            Humura AI
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg font-bold text-primary-600 uppercase tracking-wider"
          >
            {isRw ? 'GUSHYIGIKIRA IMITEKEREREZE, GUKOMEZA UBUZIMA' : 'MIND SUPPORTED, LIFE EMPOWERED'}
          </motion.p>
        </div>

        <div className="space-y-4 pt-10">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/auth?mode=signup&role=patient')}
            className="w-full py-5 bg-primary text-white font-black rounded-3xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group"
          >
            <Heart size={20} className="group-hover:fill-white transition-all" />
            {isRw ? 'Shaka ubufasha mu buzima bwo mu mutwe' : 'Seek mental health support'}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/auth?mode=signup&role=doctor')}
            className="w-full py-5 bg-neutral-50 text-primary-900 font-black rounded-3xl border-2 border-neutral-100 flex items-center justify-center gap-3 hover:bg-neutral-100 transition-all"
          >
            <Briefcase size={20} />
            {isRw ? 'Inzobere mu buzima bwo mu mutwe' : 'Mental health professional'}
          </motion.button>
        </div>

        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-[0.2em] pt-10">
          Humura AI &copy; {new Date().getFullYear()} · Mind Supported, Life Empowered
        </p>
      </main>
    </div>
  );
}
