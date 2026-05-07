import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, AlertCircle, Eye, EyeOff, User, Briefcase
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">
      {/* Branding Section */}
      <div className="text-center mb-10 space-y-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-primary/5 mb-6"
        >
          <img src="/logo.png" alt="Humura AI" className="h-12 w-12 object-contain" />
        </motion.div>
        
        <h1 className="text-4xl font-black text-primary-900 tracking-tight">
          Humura AI
        </h1>
        <p className="text-sm font-bold text-primary-600 uppercase tracking-[0.2em]">
          {isRw ? 'GUSHYIGIKIRA IMITEKEREREZE, GUKOMEZA UBUZIMA' : 'MIND SUPPORTED, LIFE EMPOWERED'}
        </p>
      </div>

      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden"
      >
        {/* Role Selector Tabs */}
        <div className="flex border-b border-slate-50">
          <button 
            onClick={() => setRole('patient')}
            className={`flex-1 py-5 flex flex-col items-center gap-2 transition-all ${role === 'patient' ? 'bg-white border-b-2 border-[#005691] text-[#005691]' : 'bg-slate-50/50 text-slate-400 hover:text-slate-600'}`}
          >
            <User size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">{isRw ? 'Ushaka ubufasha' : 'Seek Support'}</span>
          </button>
          <button 
            onClick={() => setRole('doctor')}
            className={`flex-1 py-5 flex flex-col items-center gap-2 transition-all ${role === 'doctor' ? 'bg-white border-b-2 border-[#005691] text-[#005691]' : 'bg-slate-50/50 text-slate-400 hover:text-slate-600'}`}
          >
            <Briefcase size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">{isRw ? 'Inzobere' : 'Professional'}</span>
          </button>
        </div>

        <form onSubmit={handleAuth} className="p-10 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600">
              <AlertCircle size={18} />
              <p className="text-xs font-bold uppercase tracking-tighter">{error}</p>
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">{isRw ? 'Amazina' : 'Full Name'} <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder={isRw ? 'Andika amazina yawe' : 'Enter your full name'}
                value={fullName} 
                onChange={e => setFullName(e.target.value)} 
                required
                className="w-full px-6 py-4 rounded-xl bg-white border border-slate-200 focus:border-[#005691] focus:ring-4 ring-[#005691]/5 outline-none font-medium text-slate-600 transition-all placeholder:text-slate-300"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">{isRw ? 'Imeli' : 'Email'} <span className="text-red-500">*</span></label>
            <input 
              type="email" 
              placeholder={isRw ? 'Andika imeli yawe' : 'Enter email address'}
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required
              className="w-full px-6 py-4 rounded-xl bg-white border border-slate-200 focus:border-[#005691] focus:ring-4 ring-[#005691]/5 outline-none font-medium text-slate-600 transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">{isRw ? 'Ijambo ry\'ibanga' : 'Password'} <span className="text-red-500">*</span></label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder={isRw ? 'Andika ijambo ry\'ibanga' : 'Enter password'}
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required
                className="w-full px-6 py-4 rounded-xl bg-white border border-slate-200 focus:border-[#005691] focus:ring-4 ring-[#005691]/5 outline-none font-medium text-slate-600 transition-all placeholder:text-slate-300"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-[#005691] transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {mode === 'login' && (
              <div className="flex justify-end pt-1">
                <button type="button" className="text-sm font-bold text-[#005691] hover:underline transition-all">
                  {isRw ? 'Wibagiwe ijambo ry\'ibanga?' : 'Forgot Password?'}
                </button>
              </div>
            )}
          </div>

          {mode === 'signup' && role === 'doctor' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6 pt-6 border-t border-slate-50">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Professional Details</p>
              
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400">Specialisations</p>
                <div className="flex flex-wrap gap-2">
                  {specialisationOptions.map(opt => (
                    <button
                      key={opt} type="button"
                      onClick={() => setSpecialisations(prev => prev.includes(opt) ? prev.filter(i => i !== opt) : [...prev, opt])}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${specialisations.includes(opt) ? 'bg-[#005691] text-white shadow-md' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                 <p className="text-[10px] font-bold text-slate-400">Languages</p>
                 <div className="flex gap-2">
                  {languageOptions.map(opt => (
                    <button
                      key={opt} type="button"
                      onClick={() => setLanguages(prev => prev.includes(opt) ? prev.filter(i => i !== opt) : [...prev, opt])}
                      className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${languages.includes(opt) ? 'bg-[#005691] text-white shadow-md' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Exp (Years)</label>
                  <input 
                    type="number" value={yearsExperience} onChange={e => setYearsExperience(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#005691] outline-none font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Short Bio</label>
                  <input 
                    type="text" placeholder="Bio (max 100 chars)" maxLength={100}
                    value={bio} onChange={e => setBio(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#005691] outline-none font-bold text-sm"
                  />
                </div>
              </div>
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#005691] text-white font-black rounded-xl shadow-lg shadow-[#005691]/20 hover:bg-[#004a7c] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (mode === 'login' ? (isRw ? 'Injira' : 'Login') : (isRw ? 'Iyandikishe' : 'Register'))}
          </button>

          <div className="text-center pt-4">
            <p className="text-slate-400 font-bold text-sm">
              {mode === 'login' 
                ? (isRw ? 'Nturagira konti?' : "Don't have an account?") 
                : (isRw ? 'Usanganywe konti?' : "Already have an account?")
              }{' '}
              <button 
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-[#005691] hover:underline"
              >
                {mode === 'login' ? (isRw ? 'Iyandikishe' : 'Register') : (isRw ? 'Injira' : 'Login')}
              </button>
            </p>
          </div>
        </form>
      </motion.div>

      {/* Language Switcher */}
      <div className="mt-10 flex bg-white/50 backdrop-blur-sm p-1 rounded-2xl border border-slate-200 shadow-sm">
        <button 
          onClick={() => i18n.changeLanguage('en')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${!isRw ? 'bg-[#005691] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
        >
          English
        </button>
        <button 
          onClick={() => i18n.changeLanguage('rw')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${isRw ? 'bg-[#005691] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Kinyarwanda
        </button>
      </div>
    </div>
  );
}
