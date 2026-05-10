import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, AlertCircle, Eye, EyeOff, User, Briefcase, Mail, Lock,
  CheckCircle2, Globe, Shield, Server, Cpu, MessageCircle, Facebook, Twitter, Instagram, Linkedin, ArrowRight, Zap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

type AuthMode = 'login' | 'signup';
type UserRole = 'patient' | 'doctor';

export default function AuthPage() {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const navigate = useNavigate();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<UserRole>('patient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Doctor-specific fields
  const [specialisations, setSpecialisations] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(['en']);
  const [bio, setBio] = useState('');
  const [yearsExperience, setYearsExperience] = useState('0');

  const specialisationOptions = ['Anxiety', 'Depression', 'Trauma', 'PTSD', 'Grief', 'Bipolar', 'Youth', 'Family'];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role: role }
          }
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName,
            role: role,
            plan_type: role === 'doctor' ? 'professional' : 'free',
            language_pref: isRw ? 'rw' : 'en',
            updated_at: new Date().toISOString()
          });

          if (role === 'doctor') {
            await supabase.from('doctor_profiles').insert({
              user_id: data.user.id,
              specialisations,
              languages,
              bio,
              years_experience: parseInt(yearsExperience) || 0
            });
          }
        }
        navigate(role === 'patient' ? '/intake' : '/doctor');
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;

        const { data: prof } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', signInData.user?.id)
          .single();
      
        const userRole = prof?.role || 'patient';
        navigate(userRole === 'doctor' ? '/doctor' : '/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-[#21B48D] selection:text-white">
      
      {/* TOP SECTION: Content and Form */}
      <div className="flex-1 bg-[#F1F7F5] flex flex-col items-center py-8 px-6">
        
        {/* Main Header Logo Structure - Shrunk dimensions */}
        <div className="text-center mb-6 space-y-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-[0_10px_30px_-12px_rgba(0,0,0,0.08)] p-2.5 mb-2"
          >
             <img src="/logo.png" alt="Humura AI Logo" className="w-full h-full object-contain" />
          </motion.div>
          
          <h1 className="text-2xl font-black text-[#1B3631] tracking-tight font-display">
            Humura AI
          </h1>
          <p className="text-[10px] font-black text-[#21B48D] tracking-[0.2em] uppercase">
            {isRw ? 'GUSHYIGIKIRA IMITEKEREREZE, GUKOMEZA UBUZIMA' : 'MIND SUPPORTED, LIFE EMPOWERED'}
          </p>
        </div>

        {/* AUTH CARD - Constricted Width */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[380px] bg-white rounded-[2rem] shadow-[0_15px_50px_-12px_rgba(0,0,0,0.05)] border border-white overflow-hidden mb-8"
        >
          {/* Role Tabs Selection */}
          <div className="flex border-b border-slate-100 relative">
            <button 
              onClick={() => setRole('patient')}
              className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all duration-300 relative z-10`}
            >
              <User size={16} className={role === 'patient' ? "text-[#21B48D]" : "text-slate-300"} />
              <span className={`text-[10px] font-black uppercase tracking-wider ${role === 'patient' ? 'text-[#21B48D]' : 'text-slate-300'}`}>
                {isRw ? 'Ushaka ubufasha' : 'SEEK SUPPORT'}
              </span>
              {role === 'patient' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#21B48D] rounded-full" />}
            </button>
            <button 
              onClick={() => setRole('doctor')}
              className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all duration-300 relative z-10`}
            >
              <Briefcase size={16} className={role === 'doctor' ? "text-[#21B48D]" : "text-slate-300"} />
              <span className={`text-[10px] font-black uppercase tracking-wider ${role === 'doctor' ? 'text-[#21B48D]' : 'text-slate-300'}`}>
                {isRw ? 'Inzobere' : 'PROFESSIONAL'}
              </span>
              {role === 'doctor' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#21B48D] rounded-full" />}
            </button>
          </div>

          {/* Form Container */}
          <div className="p-6 sm:p-8 pt-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-shake">
                <AlertCircle size={16} className="flex-shrink-0" />
                <p className="text-[11px] font-bold tracking-tight leading-tight">{error}</p>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 ml-1">
                    {isRw ? 'Amazina' : 'Full Name'} <span className="text-[#21B48D]">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={fullName} 
                      onChange={e => setFullName(e.target.value)} 
                      required
                      placeholder={isRw ? "Andika amazina yawe" : "Enter your name"}
                      className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#21B48D] outline-none font-medium text-slate-700 text-sm transition-shadow focus:shadow-[0_0_0_3px_rgba(33,180,141,0.08)] placeholder:text-slate-300"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 ml-1">
                  {isRw ? 'Imeli' : 'Email'} <span className="text-[#21B48D]">*</span>
                </label>
                <div className="relative group">
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required
                    placeholder="you@example.com"
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#21B48D] outline-none font-medium text-slate-700 text-sm transition-shadow focus:shadow-[0_0_0_3px_rgba(33,180,141,0.08)] placeholder:text-slate-300"
                  />
                  <Mail size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-[#21B48D] transition-colors" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <label className="text-[11px] font-bold text-slate-600 ml-1">
                    {isRw ? 'Ijambo ry\'ibanga' : 'Password'} <span className="text-[#21B48D]">*</span>
                  </label>
                </div>
                <div className="relative group">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required
                    placeholder="••••••••"
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#21B48D] outline-none font-medium text-slate-700 text-sm transition-shadow focus:shadow-[0_0_0_3px_rgba(33,180,141,0.08)] placeholder:text-slate-300"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-200 hover:text-[#21B48D] transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {mode === 'login' && (
                  <div className="flex justify-end pt-1">
                    <button type="button" className="text-[10px] font-black text-[#21B48D] hover:underline">
                      {isRw ? 'Wibagiwe ijambo ry\'ibanga?' : 'Forgot password?'}
                    </button>
                  </div>
                )}
              </div>

              {mode === 'signup' && role === 'doctor' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-4 border-t border-slate-100 mt-1">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Specialisations</p>
                    <div className="flex flex-wrap gap-1">
                      {specialisationOptions.map(opt => (
                        <button
                          key={opt} type="button"
                          onClick={() => setSpecialisations(prev => prev.includes(opt) ? prev.filter(i => i !== opt) : [...prev, opt])}
                          className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all border ${specialisations.includes(opt) ? 'bg-[#21B48D] border-[#21B48D] text-white' : 'bg-white text-slate-500 border-slate-200'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="number" placeholder="Yrs Exp" value={yearsExperience} onChange={e => setYearsExperience(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-[#21B48D] outline-none text-xs text-slate-700"
                    />
                    <input 
                      type="text" placeholder="Short bio" maxLength={80} value={bio} onChange={e => setBio(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-[#21B48D] outline-none text-xs text-slate-700"
                    />
                  </div>
                </motion.div>
              )}

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#1B3631] hover:bg-[#254A43] text-white font-black rounded-xl shadow-lg shadow-[#1B3631]/10 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? <Loader2 className="animate-spin text-white" size={16} /> : (mode === 'login' ? (isRw ? 'Injira' : 'Sign in') : (isRw ? 'Kora Konti' : 'Create account'))}
                </button>
              </div>

              <div className="text-center pt-1">
                <p className="text-slate-400 text-[11px] font-bold">
                  {mode === 'login' ? 'New here?' : 'Already a member?'}{' '}
                  <button 
                    type="button"
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-[#21B48D] hover:underline font-black"
                  >
                    {mode === 'login' ? 'Create account' : 'Sign in'}
                  </button>
                </p>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Tightened Language Selector */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur border border-slate-200 rounded-xl p-0.5">
          <button onClick={() => i18n.changeLanguage('en')} className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all ${!isRw ? 'bg-[#21B48D] text-white shadow-sm' : 'text-slate-400'}`}>EN</button>
          <button onClick={() => i18n.changeLanguage('rw')} className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all ${isRw ? 'bg-[#21B48D] text-white shadow-sm' : 'text-slate-400'}`}>RW</button>
        </div>
      </div>

      {/* CONDENSED BOTTOM SECTION: Concise Footer */}
      <footer className="bg-[#0C2620] text-white pt-12 pb-6 px-6 border-t border-[#16372E]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            
            {/* 1. Brand Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#16372E] flex items-center justify-center shadow-md border border-[#1F4B3F]">
                  <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain brightness-200 opacity-70" />
                </div>
                <h3 className="text-lg font-bold">Humura AI</h3>
              </div>
              <p className="text-[#83A098] text-xs leading-relaxed">
                Inclusive mental health support bridging the wellness gap for Rwanda.
              </p>
            </div>

            {/* 2. Core Services */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-[#21B48D] tracking-wider">Core Services</h4>
              <ul className="space-y-2 text-[11px] text-[#E2EEEC]">
                <li className="flex items-center gap-2 opacity-80"><MessageCircle size={12} className="text-[#21B48D]"/> CBT Therapy</li>
                <li className="flex items-center gap-2 opacity-80"><Globe size={12} className="text-[#21B48D]"/> Sign Language</li>
                <li className="flex items-center gap-2 opacity-80"><Shield size={12} className="text-[#21B48D]"/> Braille Generator</li>
              </ul>
            </div>

            {/* 3. Innovations */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-[#21B48D] tracking-wider">Innovations</h4>
              <ul className="space-y-2 text-[11px] text-[#E2EEEC]">
                <li className="flex items-center gap-2 opacity-80"><Cpu size={12} className="text-[#21B48D]"/> Gemini 2.5 Flash</li>
                <li className="flex items-center gap-2 opacity-80"><Server size={12} className="text-[#21B48D]"/> Supabase Backend</li>
              </ul>
            </div>

            {/* 4. Quick Voices */}
            <div className="bg-[#12322A] border border-[#1C453A] rounded-xl p-3.5">
               <p className="italic text-[11px] text-[#E2EEEC]">"Inclusive tech has made a real difference for our family."</p>
               <p className="text-[9px] font-black uppercase text-[#21B48D] tracking-wider mt-2">— FAMILY SUPPORT</p>
            </div>
          </div>

          {/* Compact Bottom Bar */}
          <div className="border-t border-[#16372E] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[9px] font-bold uppercase tracking-wide text-[#5F7C74]">
              © {new Date().getFullYear()} HUMURA AI
            </p>
            <div className="flex items-center gap-2">
              <SocialIcon Icon={Facebook} />
              <SocialIcon Icon={Twitter} />
              <SocialIcon Icon={Instagram} />
              <SocialIcon Icon={Linkedin} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const SocialIcon = ({ Icon }: { Icon: any }) => (
  <a href="#" className="w-7 h-7 rounded-lg bg-[#16372E] border border-[#1F4B3F] flex items-center justify-center text-[#83A098] hover:text-[#21B48D] transition-all cursor-pointer">
    <Icon size={12} />
  </a>
);
