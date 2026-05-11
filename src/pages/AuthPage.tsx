import React, { useState, useEffect } from 'react';
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

const SLIDES = [
  { url: '/welcome.jpg', caption: 'Taking the first step is an act of courage.', rw: '"Gufata intambwe ya mbere ni igikorwa cy\'ubwari."' },
  { url: 'https://images.unsplash.com/photo-1651522003310-8b0d4a946b53?auto=format&fit=crop&q=80&w=1200', caption: 'Safe, inclusive spaces for open conversations.', rw: 'Ahantu hatekanye, hasanzuye ho kuganira.' },
  { url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=1200', caption: 'You are not alone. We support you together.', rw: 'Nturi wenyine. Turagushyigikiye hamwe.' }
];

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
  
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(curr => (curr + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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

        {/* Mental Health Support Dynamic Carousel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="w-full max-w-[520px] mt-6 mb-8 relative group"
        >
          {/* Decorative Soft Glow */}
          <div className="absolute -inset-4 bg-gradient-to-br from-[#21B48D]/15 to-transparent blur-3xl opacity-60 rounded-[3rem] pointer-events-none" />
          
          <div className="relative rounded-[2rem] overflow-hidden shadow-[0_25px_50px_-15px_rgba(27,54,49,0.12)] border-4 border-white aspect-[16/10] sm:aspect-[16/9] bg-[#1B3631]">
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeSlide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0"
              >
                {/* Top Blending Fade Overlay */}
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-[#F1F7F5]/80 to-transparent z-10 pointer-events-none" />
                
                {/* Subtle Warm Tint Filter */}
                <div className="absolute inset-0 bg-[#21B48D]/5 mix-blend-color-burn pointer-events-none z-10" />

                <img 
                  src={SLIDES[activeSlide].url} 
                  alt={SLIDES[activeSlide].caption}
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    if (activeSlide === 0) {
                      // If welcome.jpg isn't synced yet, show high-res representation immediately
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516533075015-a3838414c3eb?auto=format&fit=crop&q=80&w=1200';
                    }
                  }}
                />
                
                {/* Bottom Information Scrim Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-6 pt-16 bg-gradient-to-t from-[#0C2620] via-[#0C2620]/85 to-transparent z-20 flex flex-col justify-end">
                  <motion.div 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-2 mb-1.5 opacity-90"
                  >
                    <div className="w-1.5 h-1.5 bg-[#21B48D] rounded-full animate-pulse" />
                    <span className="text-[#21B48D] text-[9px] font-black uppercase tracking-[0.2em]">Humura Support</span>
                  </motion.div>
                  
                  <motion.h3 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-white font-black text-base sm:text-lg leading-tight tracking-tight drop-shadow-sm max-w-[90%]"
                  >
                    {isRw ? SLIDES[activeSlide].rw : `"${SLIDES[activeSlide].caption}"`}
                  </motion.h3>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Carousel Pagination Dots */}
            <div className="absolute bottom-6 right-6 z-30 flex gap-1.5">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`h-1 rounded-full transition-all duration-300 ${idx === activeSlide ? 'w-5 bg-[#21B48D]' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tightened Language Selector */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur border border-slate-200 rounded-xl p-0.5">
          <button onClick={() => i18n.changeLanguage('en')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${!isRw ? 'bg-[#21B48D] text-white shadow-sm' : 'text-slate-400'}`}>English</button>
          <button onClick={() => i18n.changeLanguage('rw')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${isRw ? 'bg-[#21B48D] text-white shadow-sm' : 'text-slate-400'}`}>Kinyarwanda</button>
        </div>
      </div>

      {/* BOTTOM LANDSCAPE SECTION: Detailed Footer - Fully Restored Content */}
      <footer className="bg-[#0C2620] text-white pt-12 pb-8 px-6 border-t border-[#16372E]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            
            {/* 1. Brand Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-md border border-white p-1.5">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">Humura AI</h3>
              </div>
              <p className="text-[#83A098] text-xs leading-relaxed font-medium">
                A bilingual mental health ecosystem providing inclusive and empathetic support — bridging the wellness gap for the entire Rwandan community.
              </p>
            </div>

            {/* 2. Core Services Column */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-[#21B48D] tracking-[0.2em]">Core Services</h4>
              <ul className="space-y-2.5 text-[11px] font-medium text-[#E2EEEC]">
                <li className="flex items-start gap-2.5 hover:text-[#21B48D] cursor-pointer transition-colors">
                  <MessageCircle size={14} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-70" />
                  Empathetic CBT therapy
                </li>
                <li className="flex items-start gap-2.5 hover:text-[#21B48D] cursor-pointer transition-colors">
                  <Globe size={14} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-70" />
                  Sign language support
                </li>
                <li className="flex items-start gap-2.5 hover:text-[#21B48D] cursor-pointer transition-colors">
                  <Shield size={14} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-70" />
                  Braille document tool
                </li>
                <li className="flex items-start gap-2.5 hover:text-[#21B48D] cursor-pointer transition-colors">
                  <Globe size={14} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-70" />
                  Language translator
                </li>
                <li className="flex items-start gap-2.5 hover:text-[#21B48D] cursor-pointer transition-colors">
                  <CheckCircle2 size={14} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-70" />
                  AI progress insights
                </li>
                <li className="flex items-start gap-2.5 hover:text-[#21B48D] cursor-pointer transition-colors">
                  <Zap size={14} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-70" />
                  Emergency help (114)
                </li>
              </ul>
            </div>

            {/* 3. Innovations Column */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-[#21B48D] tracking-[0.2em]">Innovations</h4>
              <ul className="space-y-2.5 text-[11px] font-medium text-[#E2EEEC]">
                <li className="flex items-start gap-2.5">
                  <Server size={14} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-70" />
                  Next.js & Supabase stack
                </li>
                <li className="flex items-start gap-2.5">
                  <CloudLightning size={14} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-70" />
                  Render cloud backend
                </li>
                <li className="flex items-start gap-2.5">
                  <Cpu size={14} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-70" />
                  Gemini 2.5 Flash
                </li>
                <li className="flex items-start gap-2.5">
                  <Server size={14} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-70" />
                  Supabase Edge
                </li>
                <li className="flex items-start gap-2.5">
                  <Eye size={14} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-70" />
                  Sign language vision AI
                </li>
                <li className="flex items-start gap-2.5">
                  <MessageCircle size={14} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-70" />
                  Multi-turn AI memory
                </li>
              </ul>
            </div>

            {/* 4. Community Voices Column */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-[#21B48D] tracking-[0.2em]">Community Voices</h4>
              <div className="space-y-3">
                <div className="bg-[#12322A] border border-[#1C453A] rounded-xl p-3">
                  <p className="italic text-[11px] text-[#E2EEEC]">"This platform gave me a new perspective on life."</p>
                  <p className="text-[9px] font-black uppercase text-[#21B48D] tracking-wider mt-1.5">— COMMUNITY</p>
                </div>
                <div className="bg-[#12322A] border border-[#1C453A] rounded-xl p-3">
                  <p className="italic text-[11px] text-[#E2EEEC]">"The technology has made a difference for our family."</p>
                  <p className="text-[9px] font-black uppercase text-[#21B48D] tracking-wider mt-1.5">— FAMILY</p>
                </div>
              </div>
            </div>
          </div>

          {/* Divider & Middle Bar */}
          <div className="py-6 border-t border-[#16372E] flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="space-y-0.5 text-center md:text-left">
              <h5 className="font-bold text-xs text-[#E2EEEC]">Stay connected with Humura AI</h5>
              <p className="text-[#83A098] text-[10px]">Updates on features and community news.</p>
            </div>
            <div className="w-full md:w-auto flex gap-2 bg-white rounded-xl overflow-hidden p-1 pr-1.5 max-w-sm">
              <input 
                type="email" 
                placeholder="Email address" 
                className="flex-1 px-3 py-1.5 bg-transparent outline-none text-slate-800 text-xs font-medium placeholder:text-slate-400 w-full md:w-48"
              />
              <button className="bg-[#0C2620] hover:bg-[#12322A] text-[#21B48D] px-3 py-1.5 rounded-lg text-[10px] font-black transition-colors">
                Subscribe
              </button>
            </div>
          </div>

          {/* Final Bottom Bar */}
          <div className="border-t border-[#16372E] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#5F7C74]">
              © {new Date().getFullYear()} HUMURA AI · MIND SUPPORTED, LIFE EMPOWERED
            </p>
            <div className="flex items-center gap-3">
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

// Utility for icons used in the innovations block that don't come by default in standard Lucide under same name
const CloudLightning = ({ size, className }: { size: number, className: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" />
    <path d="m13 12-3 5h4l-3 5" />
  </svg>
);

const SocialIcon = ({ Icon }: { Icon: any }) => (
  <a href="#" className="w-7 h-7 rounded-lg bg-[#16372E] border border-[#1F4B3F] flex items-center justify-center text-[#83A098] hover:text-[#21B48D] hover:border-[#21B48D] transition-all cursor-pointer">
    <Icon size={12} />
  </a>
);
