import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Loader2, AlertCircle, Eye, EyeOff, User, Briefcase, ArrowLeft, ChevronLeft, ChevronRight, Heart
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

type AuthMode = 'login' | 'signup';
type UserRole = 'patient' | 'doctor';

const SLIDES = [
  {
    image: '/login-healthcare.jpg',
    title_en: "Finally, all your care in one place.",
    title_rw: "Hanyuma, ubufasha bwawe bwose ahantu hamwe.",
    subtitle_en: "Compassionate therapy & clinical support in Rwanda.",
    subtitle_rw: "Ubufasha bw'ubuzima bwo mu mutwe mu Rwanda."
  },
  {
    image: '/login-health.jpg',
    title_en: "Mind supported, life empowered.",
    title_rw: "Gushyigikira imitekerereze, gukomeza ubuzima.",
    subtitle_en: "Cultivate inner peace and mental wellness daily.",
    subtitle_rw: "Gukira, kwitekerezaho, no kugarura ituze mu mutima."
  }
];

export default function AuthPage() {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const queryMode = searchParams.get('mode') as AuthMode;
  const queryRole = searchParams.get('role') as UserRole;
  
  const [mode, setMode] = useState<AuthMode>(queryMode === 'signup' ? 'signup' : 'login');
  const [role, setRole] = useState<UserRole>(queryRole === 'doctor' ? 'doctor' : 'patient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Doctor-specific fields
  const [specialisations, setSpecialisations] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(['en']);
  const [bio, setBio] = useState('');
  const [yearsExperience, setYearsExperience] = useState('0');

  const specialisationOptions = ['Anxiety', 'Depression', 'Trauma', 'PTSD', 'Grief', 'Bipolar', 'Youth', 'Family'];

  useEffect(() => {
    if (queryRole === 'doctor' || queryRole === 'patient') {
      setRole(queryRole);
    }
    if (queryMode === 'signup' || queryMode === 'login') {
      setMode(queryMode);
    }
  }, [queryRole, queryMode]);

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
        window.location.href = role === 'patient' ? '/patient/intake' : '/professional/dashboard';
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
          .maybeSingle();
      
        const userRole = prof?.role || 'patient';
        window.location.href = userRole === 'doctor' ? '/professional/dashboard' : '/patient/dashboard';
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'apple' | 'facebook') => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}`);
    }
  };

  return (
    <div className="min-h-screen sm:h-screen bg-[#F4F9F6] flex items-center justify-center p-2 sm:p-4 lg:p-6 font-poppins selection:bg-[#21B48D] selection:text-white overflow-y-auto sm:overflow-hidden">
      
      {/* ── MAIN SPLIT CONTAINER CARD (COMPACT HEIGHT - NO SCROLL) ── */}
      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-[0_20px_50px_-15px_rgba(21,60,50,0.08)] border border-[#E3EFE9] overflow-hidden grid grid-cols-1 lg:grid-cols-12 max-h-[96vh] my-auto">
        
        {/* ── LEFT COLUMN: AUTH FORM ── */}
        <div className="lg:col-span-6 xl:col-span-6 p-5 sm:p-7 lg:p-8 flex flex-col justify-between overflow-y-auto scrollbar-none">
          
          {/* Top Bar: Back to Home & Language Switcher */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <a 
              href="/" 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#153C32]/70 hover:text-[#21B48D] transition-colors cursor-pointer group"
            >
              <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform text-[#21B48D]" />
              <span>{isRw ? 'Ahabanza' : 'Home'}</span>
            </a>

            {/* Language Switcher Pill */}
            <div className="flex items-center bg-[#E8F3EE] p-0.5 rounded-full border border-[#D5E6DE]">
              <button 
                type="button"
                onClick={() => i18n.changeLanguage('en')} 
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${!isRw ? 'bg-[#153C32] text-white shadow-xs' : 'text-[#2D4E45] hover:text-[#153C32]'}`}
              >
                English
              </button>
              <button 
                type="button"
                onClick={() => i18n.changeLanguage('rw')} 
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${isRw ? 'bg-[#153C32] text-white shadow-xs' : 'text-[#2D4E45] hover:text-[#153C32]'}`}
              >
                Kinyarwanda
              </button>
            </div>
          </div>

          {/* Form Content Wrapper */}
          <div className="my-auto max-w-sm mx-auto w-full py-1">
            
            {/* Main Heading */}
            <div className="text-center mb-3 sm:mb-4">
              <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#153C32] tracking-tight leading-tight">
                {mode === 'login' ? (isRw ? 'Murakaza neza!' : 'Hello Again!') : (isRw ? 'Tangira ubu!' : 'Create Account')}
              </h1>
              <p className="text-[11px] sm:text-xs text-[#52786D] font-medium mt-1 leading-snug">
                {mode === 'login'
                  ? (isRw ? "Injira ukomeze urugendo rwawe rw'ubuzima bwo mu mutwe" : "Welcome back to your mental wellness space")
                  : (isRw ? "Iyandikishe ubone ubufasha bwawe bwihariye" : "Let's get started with your healing journey")}
              </p>
            </div>

            {/* Role Tabs Selection (Seek Support / Professional) */}
            <div className="flex bg-[#F0F7F4] p-1 rounded-xl mb-3 sm:mb-4 border border-[#DCEBE3]">
              <button 
                type="button"
                onClick={() => setRole('patient')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                  role === 'patient' 
                    ? 'bg-white text-[#153C32] shadow-xs' 
                    : 'text-[#5C8276] hover:text-[#153C32]'
                }`}
              >
                <User size={13} className={role === 'patient' ? "text-[#21B48D]" : "text-[#5C8276]"} />
                <span>{isRw ? 'Ushaka ubufasha' : 'Seek Support'}</span>
              </button>
              <button 
                type="button"
                onClick={() => setRole('doctor')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                  role === 'doctor' 
                    ? 'bg-white text-[#153C32] shadow-xs' 
                    : 'text-[#5C8276] hover:text-[#153C32]'
                }`}
              >
                <Briefcase size={13} className={role === 'doctor' ? "text-[#21B48D]" : "text-[#5C8276]"} />
                <span>{isRw ? 'Inzobere' : 'Professional'}</span>
              </button>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mb-2.5 p-2.5 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-[11px] font-semibold animate-shake">
                <AlertCircle size={14} className="flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAuth} className="space-y-2.5">
              
              {mode === 'signup' && (
                <div>
                  <input 
                    type="text" 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    required
                    placeholder={isRw ? "Amazina yawe yose" : "Full Name"}
                    className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-white border border-[#D2E4DC] focus:border-[#21B48D] outline-none font-medium text-slate-800 text-xs sm:text-sm transition-all focus:ring-2 focus:ring-[#21B48D]/15 placeholder:text-slate-400 shadow-2xs"
                  />
                </div>
              )}

              <div>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required
                  placeholder={isRw ? "Imeli yawe" : "Email"}
                  className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-white border border-[#D2E4DC] focus:border-[#21B48D] outline-none font-medium text-slate-800 text-xs sm:text-sm transition-all focus:ring-2 focus:ring-[#21B48D]/15 placeholder:text-slate-400 shadow-2xs"
                />
              </div>

              <div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required
                    placeholder={isRw ? "Ijambo ry'ibanga" : "Password"}
                    className="w-full pl-4 pr-11 py-2.5 sm:py-3 rounded-xl bg-white border border-[#D2E4DC] focus:border-[#21B48D] outline-none font-medium text-slate-800 text-xs sm:text-sm transition-all focus:ring-2 focus:ring-[#21B48D]/15 placeholder:text-slate-400 shadow-2xs"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#21B48D] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {mode === 'login' && (
                  <div className="flex justify-end pt-1">
                    <button 
                      type="button" 
                      onClick={() => setError(isRw ? "Itegurwa ryo kugarura ijambo ry'ibanga riri kwitegurwa." : "Password reset instruction sent to your email if registered.")}
                      className="text-[10px] sm:text-[11px] font-semibold text-[#52786D] hover:text-[#21B48D] transition-colors cursor-pointer"
                    >
                      {isRw ? "Wibagiwe ijambo ry'ibanga?" : "Recovery Password"}
                    </button>
                  </div>
                )}
              </div>

              {/* Doctor Specialisation Fields for Signup */}
              {mode === 'signup' && role === 'doctor' && (
                <div className="space-y-2 pt-1">
                  <p className="text-[9px] font-bold text-[#52786D] uppercase tracking-wider">Specialisations</p>
                  <div className="flex flex-wrap gap-1">
                    {specialisationOptions.map(opt => (
                      <button
                        key={opt} type="button"
                        onClick={() => setSpecialisations(prev => prev.includes(opt) ? prev.filter(i => i !== opt) : [...prev, opt])}
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-bold transition-all border cursor-pointer ${
                          specialisations.includes(opt) 
                            ? 'bg-[#21B48D] border-[#21B48D] text-white' 
                            : 'bg-white text-slate-600 border-[#D2E4DC]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="number" placeholder="Yrs Exp" value={yearsExperience} onChange={e => setYearsExperience(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#D2E4DC] focus:border-[#21B48D] outline-none text-[11px] text-slate-700"
                    />
                    <input 
                      type="text" placeholder="Short bio" maxLength={80} value={bio} onChange={e => setBio(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#D2E4DC] focus:border-[#21B48D] outline-none text-[11px] text-slate-700"
                    />
                  </div>
                </div>
              )}

              {/* Main Submit Button (Humura AI Forest Green) */}
              <div className="pt-1">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 sm:py-3 bg-[#153C32] hover:bg-[#1C4E41] text-white font-bold rounded-xl shadow-md shadow-[#153C32]/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-60 border border-[#153C32]"
                >
                  {loading ? (
                    <Loader2 className="animate-spin text-white" size={16} />
                  ) : (
                    mode === 'login' 
                      ? (isRw ? 'Injira' : 'Sign In') 
                      : (isRw ? 'Kora Konti' : 'Create Account')
                  )}
                </button>
              </div>

            </form>

            {/* Divider: Or continue with */}
            <div className="relative my-3 sm:my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E3EFE9]" />
              </div>
              <span className="relative bg-white px-2.5 text-[10px] font-medium text-[#64887D]">
                {isRw ? 'Cyangwa ukoreshe' : 'Or continue with'}
              </span>
            </div>

            {/* Social Logins */}
            <div className="flex items-center justify-center gap-2.5">
              {/* Google Button */}
              <button 
                type="button"
                onClick={() => handleSocialAuth('google')}
                className="w-14 h-10 sm:h-11 rounded-xl bg-white border border-[#D2E4DC] hover:border-[#21B48D] shadow-2xs hover:shadow-sm flex items-center justify-center transition-all cursor-pointer active:scale-95 group"
                title="Google"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </button>

              {/* Apple Button */}
              <button 
                type="button"
                onClick={() => handleSocialAuth('apple')}
                className="w-14 h-10 sm:h-11 rounded-xl bg-white border border-[#D2E4DC] hover:border-[#21B48D] shadow-2xs hover:shadow-sm flex items-center justify-center transition-all cursor-pointer active:scale-95 group"
                title="Apple"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-slate-900 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.71-.93 2.73 1.01.08 2.02-.48 2.63-1.23z"/>
                </svg>
              </button>

              {/* Facebook Button */}
              <button 
                type="button"
                onClick={() => handleSocialAuth('facebook')}
                className="w-14 h-10 sm:h-11 rounded-xl bg-white border border-[#D2E4DC] hover:border-[#21B48D] shadow-2xs hover:shadow-sm flex items-center justify-center transition-all cursor-pointer active:scale-95 group"
                title="Facebook"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-[#1877F2] group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
            </div>

            {/* Bottom Mode Toggle (Login vs Signup) */}
            <div className="text-center mt-3 sm:mt-4">
              <p className="text-[#52786D] text-[11px] font-medium">
                {mode === 'login' ? (isRw ? "Ntabwo uragira konti?" : "Don't have an account?") : (isRw ? "Ubusanzwe ufite konti?" : "Already have an account?")}{' '}
                <button 
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-[#21B48D] hover:text-[#178567] hover:underline font-bold transition-colors cursor-pointer"
                >
                  {mode === 'login' ? (isRw ? "Iyandikishe" : "Create Account") : (isRw ? "Injira" : "Sign In")}
                </button>
              </p>
            </div>

          </div>

          {/* Footer Copyright Note */}
          <div className="text-center pt-1">
            <p className="text-[9px] font-semibold text-[#52786D]/60">
              © {new Date().getFullYear()} Humura AI · Mind Supported, Life Empowered
            </p>
          </div>

        </div>

        {/* ── RIGHT COLUMN: HEALTH & WELLNESS SCENE ── */}
        <div className="hidden lg:block lg:col-span-6 xl:col-span-6 p-2.5">
          <div className="w-full h-full min-h-[460px] max-h-[580px] rounded-[1.75rem] overflow-hidden relative shadow-sm bg-[#153C32]">
            
            {/* Background Health & Wellness Image */}
            <AnimatePresence mode="wait">
              <motion.img 
                key={slideIdx}
                src={SLIDES[slideIdx].image} 
                alt="Mental health and healing" 
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full object-cover object-center"
              />
            </AnimatePresence>

            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0C2620]/90 via-[#0C2620]/25 to-transparent pointer-events-none" />

            {/* Bottom Overlay Text & Glass Navigation Arrows */}
            <div className="absolute bottom-6 left-6 right-6 text-white z-10 flex flex-col gap-3">
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={slideIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#21B48D]/20 backdrop-blur-md border border-[#21B48D]/30 text-[#85E4CA] text-[9px] font-bold uppercase tracking-wider mb-1.5">
                    <Heart size={10} className="fill-current text-[#21B48D]" />
                    <span>Mental Health & Wellness</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-md leading-snug">
                    {isRw ? SLIDES[slideIdx].title_rw : SLIDES[slideIdx].title_en}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#D3E8E0] font-medium mt-0.5 drop-shadow-sm">
                    {isRw ? SLIDES[slideIdx].subtitle_rw : SLIDES[slideIdx].subtitle_en}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Glass Arrow Controls */}
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setSlideIdx((slideIdx - 1 + SLIDES.length) % SLIDES.length)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-[#21B48D] backdrop-blur-md border border-white/30 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  aria-label="Previous slide"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setSlideIdx((slideIdx + 1) % SLIDES.length)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-[#21B48D] backdrop-blur-md border border-white/30 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  aria-label="Next slide"
                >
                  <ChevronRight size={15} />
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
