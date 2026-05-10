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
  const languageOptions = ['en', 'rw', 'fr'];

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

  const handleGoogleSignIn = async () => {
     try {
       const { error } = await supabase.auth.signInWithOAuth({
         provider: 'google',
         options: {
           redirectTo: window.location.origin
         }
       });
       if (error) throw error;
     } catch (err: any) {
       setError(err.message);
     }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-[#21B48D] selection:text-white">
      
      {/* TOP SECTION: Content and Form */}
      <div className="flex-1 bg-[#F1F7F5] flex flex-col items-center py-12 px-6">
        
        {/* Main Header Logo Structure */}
        <div className="text-center mb-8 space-y-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] p-3 mb-4"
          >
             <img src="/logo.png" alt="Humura AI Logo" className="w-full h-full object-contain" />
          </motion.div>
          
          <h1 className="text-4xl font-black text-[#1B3631] tracking-tight font-display">
            Humura AI
          </h1>
          <p className="text-xs font-black text-[#21B48D] tracking-[0.2em] uppercase">
            {isRw ? 'GUSHYIGIKIRA IMITEKEREREZE, GUKOMEZA UBUZIMA' : 'MIND SUPPORTED, LIFE EMPOWERED'}
          </p>
        </div>

        {/* AUTH CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[460px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.05)] border border-white overflow-hidden mb-12"
        >
          {/* Role Tabs Selection */}
          <div className="flex border-b border-slate-100 relative">
            <button 
              onClick={() => setRole('patient')}
              className={`flex-1 py-5 flex flex-col items-center gap-1.5 transition-all duration-300 relative z-10`}
            >
              <User size={18} className={role === 'patient' ? "text-[#21B48D]" : "text-slate-300"} />
              <span className={`text-[11px] font-black uppercase tracking-wider ${role === 'patient' ? 'text-[#21B48D]' : 'text-slate-300'}`}>
                {isRw ? 'Ushaka ubufasha' : 'SEEK SUPPORT'}
              </span>
              {role === 'patient' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#21B48D] rounded-full" />}
            </button>
            <button 
              onClick={() => setRole('doctor')}
              className={`flex-1 py-5 flex flex-col items-center gap-1.5 transition-all duration-300 relative z-10`}
            >
              <Briefcase size={18} className={role === 'doctor' ? "text-[#21B48D]" : "text-slate-300"} />
              <span className={`text-[11px] font-black uppercase tracking-wider ${role === 'doctor' ? 'text-[#21B48D]' : 'text-slate-300'}`}>
                {isRw ? 'Inzobere' : 'PROFESSIONAL'}
              </span>
              {role === 'doctor' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#21B48D] rounded-full" />}
            </button>
          </div>

          {/* Form Container */}
          <div className="p-8 sm:p-10 pt-8">
            {error && (
              <div className="mb-6 p-3.5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-shake">
                <AlertCircle size={18} className="flex-shrink-0" />
                <p className="text-xs font-bold tracking-tight">{error}</p>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-5">
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 ml-1">
                    {isRw ? 'Amazina' : 'Full Name'} <span className="text-[#21B48D]">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={fullName} 
                      onChange={e => setFullName(e.target.value)} 
                      required
                      placeholder={isRw ? "Andika amazina yawe" : "Enter your name"}
                      className="w-full pl-5 pr-12 py-3.5 rounded-xl bg-white border border-slate-200 focus:border-[#21B48D] outline-none font-medium text-slate-700 transition-shadow focus:shadow-[0_0_0_4px_rgba(33,180,141,0.08)] placeholder:text-slate-300"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 ml-1">
                  {isRw ? 'Imeli' : 'Email'} <span className="text-[#21B48D]">*</span>
                </label>
                <div className="relative group">
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required
                    placeholder="you@example.com"
                    className="w-full pl-5 pr-12 py-3.5 rounded-xl bg-white border border-slate-200 focus:border-[#21B48D] outline-none font-medium text-slate-700 transition-shadow focus:shadow-[0_0_0_4px_rgba(33,180,141,0.08)] placeholder:text-slate-300"
                  />
                  <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-[#21B48D] transition-colors" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-bold text-slate-600 ml-1">
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
                    className="w-full pl-5 pr-12 py-3.5 rounded-xl bg-white border border-slate-200 focus:border-[#21B48D] outline-none font-medium text-slate-700 transition-shadow focus:shadow-[0_0_0_4px_rgba(33,180,141,0.08)] placeholder:text-slate-300"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-200 hover:text-[#21B48D] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {mode === 'login' && (
                  <div className="flex justify-end pt-1">
                    <button type="button" className="text-xs font-bold text-[#21B48D] hover:underline underline-offset-2">
                      {isRw ? 'Wibagiwe ijambo ry\'ibanga?' : 'Forgot password?'}
                    </button>
                  </div>
                )}
              </div>

              {mode === 'signup' && role === 'doctor' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-5 pt-5 border-t border-slate-100 mt-2">
                  <p className="text-[10px] font-black uppercase text-[#21B48D] tracking-widest flex items-center gap-2"><Briefcase size={12} /> Professional Details</p>
                  
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Specialisations</p>
                    <div className="flex flex-wrap gap-1.5">
                      {specialisationOptions.map(opt => (
                        <button
                          key={opt} type="button"
                          onClick={() => setSpecialisations(prev => prev.includes(opt) ? prev.filter(i => i !== opt) : [...prev, opt])}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${specialisations.includes(opt) ? 'bg-[#21B48D] border-[#21B48D] text-white shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-[#21B48D]'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Experience (Yrs)</label>
                      <input 
                        type="number" value={yearsExperience} onChange={e => setYearsExperience(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#21B48D] outline-none font-bold text-sm text-slate-700"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Bio Outline</label>
                      <input 
                        type="text" placeholder="Short bio" maxLength={80}
                        value={bio} onChange={e => setBio(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#21B48D] outline-none text-sm text-slate-700"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="pt-2 space-y-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-white text-slate-800 border border-slate-200 font-bold rounded-xl shadow-sm hover:bg-slate-50 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? <Loader2 className="animate-spin text-[#21B48D]" size={18} /> : (mode === 'login' ? (isRw ? 'Injira' : 'Sign in') : (isRw ? 'Kora Konti' : 'Create account'))}
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-100"></div>
                  <span className="flex-shrink mx-4 text-slate-300 text-[10px] font-medium uppercase tracking-widest">or continue with</span>
                  <div className="flex-grow border-t border-slate-100"></div>
                </div>

                <button 
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-3.5 bg-white text-slate-700 border border-slate-200 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-3 text-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-slate-400 text-xs font-bold">
                  {mode === 'login' ? 'New here?' : 'Already a member?'}{' '}
                  <button 
                    type="button"
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-[#21B48D] hover:underline font-black"
                  >
                    {mode === 'login' ? 'Create a free account' : 'Sign in to account'}
                  </button>
                </p>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Floating Language Selector */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
          <button onClick={() => i18n.changeLanguage('en')} className={`px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all ${!isRw ? 'bg-[#21B48D] text-white' : 'text-slate-400 hover:bg-slate-50'}`}>EN</button>
          <button onClick={() => i18n.changeLanguage('rw')} className={`px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all ${isRw ? 'bg-[#21B48D] text-white' : 'text-slate-400 hover:bg-slate-50'}`}>RW</button>
        </div>
      </div>

      {/* BOTTOM LANDSCAPE SECTION: Detailed Footer */}
      <footer className="bg-[#0C2620] text-white pt-20 pb-10 px-8 border-t border-[#16372E]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            
            {/* 1. Brand Column */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#16372E] flex items-center justify-center shadow-lg border border-[#1F4B3F]">
                  <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain brightness-200 opacity-80" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">Humura AI</h3>
              </div>
              <p className="text-[#83A098] text-sm leading-relaxed font-medium">
                A bilingual mental health ecosystem providing inclusive and empathetic support — bridging the wellness gap for the entire Rwandan community.
              </p>
            </div>

            {/* 2. Core Services Column */}
            <div className="space-y-6">
              <h4 className="text-[11px] font-black uppercase text-[#21B48D] tracking-[0.2em]">Core Services</h4>
              <ul className="space-y-3 text-sm font-medium text-[#E2EEEC]">
                <li className="flex items-start gap-3 hover:text-[#21B48D] cursor-pointer transition-colors">
                  <MessageCircle size={16} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-70" />
                  Empathetic CBT therapy
                </li>
                <li className="flex items-start gap-3 hover:text-[#21B48D] cursor-pointer transition-colors">
                  <Globe size={16} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-70" />
                  Sign language support
                </li>
                <li className="flex items-start gap-3 hover:text-[#21B48D] cursor-pointer transition-colors">
                  <Shield size={16} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-70" />
                  Braille document tool
                </li>
                <li className="flex items-start gap-3 hover:text-[#21B48D] cursor-pointer transition-colors">
                  <Globe size={16} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-70" />
                  Language translator
                </li>
                <li className="flex items-start gap-3 hover:text-[#21B48D] cursor-pointer transition-colors">
                  <CheckCircle2 size={16} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-70" />
                  AI progress insights
                </li>
                <li className="flex items-start gap-3 hover:text-[#21B48D] cursor-pointer transition-colors">
                  <Zap size={16} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-70" />
                  Emergency help (114)
                </li>
              </ul>
            </div>

            {/* 3. Innovations Column */}
            <div className="space-y-6">
              <h4 className="text-[11px] font-black uppercase text-[#21B48D] tracking-[0.2em]">Innovations</h4>
              <ul className="space-y-3 text-sm font-medium text-[#E2EEEC]">
                <li className="flex items-start gap-3">
                  <Server size={16} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-70" />
                  Next.js & Supabase stack
                </li>
                <li className="flex items-start gap-3">
                  <CloudLightning size={16} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-70" />
                  Render cloud backend
                </li>
                <li className="flex items-start gap-3">
                  <Cpu size={16} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-70" />
                  Gemini 2.5 Flash
                </li>
                <li className="flex items-start gap-3">
                  <Server size={16} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-70" />
                  Supabase Edge
                </li>
                <li className="flex items-start gap-3">
                  <Eye size={16} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-70" />
                  Sign language vision AI
                </li>
                <li className="flex items-start gap-3">
                  <MessageCircle size={16} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-70" />
                  Multi-turn AI memory
                </li>
              </ul>
            </div>

            {/* 4. Community Voices Column */}
            <div className="space-y-6">
              <h4 className="text-[11px] font-black uppercase text-[#21B48D] tracking-[0.2em]">Community Voices</h4>
              <div className="space-y-4">
                <div className="bg-[#12322A] border border-[#1C453A] rounded-xl p-4 relative overflow-hidden">
                  <p className="italic text-sm text-[#E2EEEC] relative z-10">"This platform gave me a new perspective on life and mental wellness."</p>
                  <p className="text-[10px] font-black uppercase text-[#21B48D] tracking-wider mt-2.5">— COMMUNITY MEMBER</p>
                </div>
                <div className="bg-[#12322A] border border-[#1C453A] rounded-xl p-4">
                  <p className="italic text-sm text-[#E2EEEC]">"The inclusive technology has made a real difference for our family."</p>
                  <p className="text-[10px] font-black uppercase text-[#21B48D] tracking-wider mt-2.5">— FAMILY SUPPORT MEMBER</p>
                </div>
              </div>
            </div>
          </div>

          {/* Divider & Middle Bar */}
          <div className="py-10 border-t border-[#16372E] flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h5 className="font-bold text-[#E2EEEC]">Stay connected with Humura AI</h5>
              <p className="text-[#83A098] text-xs">Updates on features, resources, and community news.</p>
            </div>
            <div className="w-full md:w-auto flex gap-2 bg-white rounded-xl overflow-hidden p-1 pr-2 max-w-md">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="flex-1 px-4 py-2.5 bg-transparent outline-none text-slate-800 text-sm font-medium placeholder:text-slate-400 w-full md:w-64"
              />
              <button className="bg-[#0C2620] hover:bg-[#12322A] text-[#21B48D] px-4 py-2 rounded-lg text-xs font-black transition-colors">
                Subscribe
              </button>
            </div>
          </div>

          {/* Final Bottom Bar */}
          <div className="border-t border-[#16372E] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#5F7C74]">
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
  <a href="#" className="w-8 h-8 rounded-lg bg-[#16372E] border border-[#1F4B3F] flex items-center justify-center text-[#83A098] hover:text-[#21B48D] hover:border-[#21B48D] transition-all cursor-pointer">
    <Icon size={14} />
  </a>
);
