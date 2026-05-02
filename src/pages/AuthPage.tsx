import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Mail, Lock, User, UserCircle, Briefcase, 
  ArrowRight, Loader2, AlertCircle, CheckCircle2, ChevronLeft, Phone
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

type AuthMode = 'login' | 'signup';
type UserRole = 'patient' | 'doctor';

export default function AuthPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const isRw = lang.startsWith('rw');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // URL Params for Step 1 Navigation
  const initialMode = (searchParams.get('mode') as AuthMode) || 'login';
  const initialRole = (searchParams.get('role') as UserRole) || 'patient';

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  
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
        // Sign up logic
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email || `${phone}@humura.ai`, // Mock email if only phone provided
          password,
          options: {
            data: { full_name: fullName, role: role }
          }
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // 1. Create Profile
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName,
            phone: phone,
            role: role,
            language_pref: isRw ? 'rw' : 'en',
            updated_at: new Date().toISOString()
          });

          // 2. Create Doctor Profile if applicable
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

        setSuccess(true);
        setTimeout(() => navigate(role === 'patient' ? '/intake' : '/doctor'), 1500);
      } else {
        // Login logic
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email || `${phone}@humura.ai`,
          password
        });

        if (signInError) throw signInError;

        // Fetch role to decide where to navigate
        const { data: prof } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', signInData.user?.id)
          .single();
      
        const userRole = prof?.role || 'patient';
      
        if (userRole === 'doctor') {
          navigate('/doctor');
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="fixed top-8 right-8 flex bg-neutral-50 p-1 rounded-2xl border border-neutral-100 shadow-sm">
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

      <button 
        onClick={() => navigate('/welcome')}
        className="fixed top-8 left-8 p-3 rounded-2xl bg-neutral-50 text-primary-900"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="w-full max-w-sm space-y-10">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-black text-primary-900 tracking-tight">
            {mode === 'login' ? (isRw ? 'Injira' : 'Welcome Back') : (isRw ? 'Twagufasha' : 'Get mental health support')}
          </h1>
          <p className="text-primary-600 font-bold">
            {mode === 'login' ? (isRw ? 'Komeza urugendo rwawe' : 'Continue your journey') : (isRw ? 'Andika imyirondoro yawe' : 'Tell us a little about yourself')}
          </p>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleAuth} className="space-y-4">
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300" size={18} />
                <input 
                  type="text" placeholder={isRw ? 'Amazina yawe' : 'Your name'}
                  value={fullName} onChange={e => setFullName(e.target.value)} required
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-neutral-50 border-2 border-transparent focus:border-primary outline-none font-bold text-sm transition-all"
                />
              </div>
            )}

            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300" size={18} />
              <input 
                type="tel" placeholder={isRw ? 'Nomero ya terefone' : 'Phone (+250...)'}
                value={phone} onChange={e => setPhone(e.target.value)} required
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-neutral-50 border-2 border-transparent focus:border-primary outline-none font-bold text-sm transition-all"
              />
            </div>

            {/* Email is still needed for Supabase behind the scenes, but we can hide it or make it clear */}
            <div className="relative">
               <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300" size={18} />
               <input 
                type="email" placeholder="Email Address"
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-neutral-50 border-2 border-transparent focus:border-primary outline-none font-bold text-sm transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300" size={18} />
              <input 
                type="password" placeholder={isRw ? 'Ijambo ry\'ibanga' : 'Password'}
                value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-neutral-50 border-2 border-transparent focus:border-primary outline-none font-bold text-sm transition-all"
              />
            </div>

            {mode === 'signup' && role === 'doctor' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-4 border-t border-neutral-100">
                <p className="text-[10px] font-black uppercase text-primary-400 tracking-widest">Professional Details</p>
                
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-neutral-400">Specialisations</p>
                  <div className="flex flex-wrap gap-2">
                    {specialisationOptions.map(opt => (
                      <button
                        key={opt} type="button"
                        onClick={() => setSpecialisations(prev => prev.includes(opt) ? prev.filter(i => i !== opt) : [...prev, opt])}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${specialisations.includes(opt) ? 'bg-primary text-white' : 'bg-neutral-50 text-primary-600 border border-neutral-100'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                   <p className="text-[10px] font-bold text-neutral-400">Languages</p>
                   <div className="flex gap-2">
                    {languageOptions.map(opt => (
                      <button
                        key={opt} type="button"
                        onClick={() => setLanguages(prev => prev.includes(opt) ? prev.filter(i => i !== opt) : [...prev, opt])}
                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${languages.includes(opt) ? 'bg-primary text-white' : 'bg-neutral-50 text-primary-600 border border-neutral-100'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-neutral-400">Exp (Years)</p>
                    <input 
                      type="number" value={yearsExperience} onChange={e => setYearsExperience(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-neutral-50 border-2 border-transparent focus:border-primary outline-none font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-neutral-400">Short Bio</p>
                    <input 
                      type="text" placeholder="Bio (max 100 chars)" maxLength={100}
                      value={bio} onChange={e => setBio(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-neutral-50 border-2 border-transparent focus:border-primary outline-none font-bold text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>}

            <button 
              disabled={loading}
              className="w-full py-5 bg-primary text-white font-black rounded-3xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 mt-6"
            >
              {loading ? <Loader2 className="animate-spin" /> : (isRw ? 'Komeza' : 'Continue')}
            </button>
          </form>

          <button 
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="w-full text-center text-xs font-bold text-primary-400 hover:text-primary transition-colors"
          >
            {mode === 'login' ? (isRw ? 'Nturagira konti? Iyandikishe' : 'No account? Sign up') : (isRw ? 'Usanganywe konti? Injira' : 'Have an account? Login')}
          </button>
        </div>
      </div>
    </div>
  );
}
