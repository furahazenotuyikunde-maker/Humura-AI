import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Mail, Lock, User, UserCircle, Briefcase, 
  ArrowRight, Loader2, AlertCircle, CheckCircle2, ChevronLeft 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

type AuthMode = 'login' | 'signup';
type UserRole = 'free' | 'professional';

export default function AuthPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const isRw = lang.startsWith('rw');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<UserRole>('free');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

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
            data: {
              full_name: fullName,
              plan_type: role
            }
          }
        });

        if (signUpError) throw signUpError;

        // Note: Supabase automatically creates the profile via trigger usually, 
        // but let's ensure it exists if no trigger is set up.
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              full_name: fullName,
              plan_type: role,
              updated_at: new Date().toISOString()
            });
          if (profileError) console.error("Profile creation error:", profileError);
        }

        setSuccess(true);
        const nextUrl = role === 'free' ? '/intake' : redirectTo;
        setTimeout(() => navigate(nextUrl), 1500);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;
        navigate(redirectTo);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/')}
        className="fixed top-8 left-8 flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all"
      >
        <ChevronLeft size={20} />
        {isRw ? 'Gusubira inyuma' : 'Back to Home'}
      </motion.button>

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6"
          >
            <img src="/logo.png" alt="Humura AI" className="h-12 w-12 object-contain" />
          </motion.div>
          <h1 className="text-3xl font-black text-primary-900 tracking-tight mb-2">
            {mode === 'login' 
              ? (isRw ? 'Injira muri Humura' : 'Welcome Back')
              : (isRw ? 'Yifungurire konti' : 'Create Account')}
          </h1>
          <p className="text-primary-600 font-medium">
            {mode === 'login'
              ? (isRw ? 'Komeza urugendo rwawe rwo gukira' : 'Continue your journey to wellness')
              : (isRw ? 'Fatanya natwe mu gushyigikira ubuzima bw\'umutwe' : 'Join our mental health ecosystem')}
          </p>
        </div>

        <motion.div
          layout
          className="glass-card rounded-[2.5rem] p-8 shadow-2xl shadow-primary/5 border border-primary-50"
        >
          {/* Mode Switcher */}
          <div className="flex bg-primary-50 p-1.5 rounded-2xl mb-8">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === 'login' ? 'bg-white text-primary shadow-sm' : 'text-primary-400 hover:text-primary-600'
              }`}
            >
              {isRw ? 'Injira' : 'Login'}
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === 'signup' ? 'bg-white text-primary shadow-sm' : 'text-primary-400 hover:text-primary-600'
              }`}
            >
              {isRw ? 'Iyandikishe' : 'Sign Up'}
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5 overflow-hidden"
                >
                  {/* Role Selector */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      type="button"
                      onClick={() => setRole('free')}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                        role === 'free' 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-primary-50 text-primary-400 hover:border-primary-100'
                      }`}
                    >
                      <UserCircle size={24} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {isRw ? 'Ushaka ubufasha' : 'Seeking Help'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('professional')}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                        role === 'professional' 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-primary-50 text-primary-400 hover:border-primary-100'
                      }`}
                    >
                      <Briefcase size={24} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {isRw ? 'Inzobere' : 'Professional'}
                      </span>
                    </button>
                  </div>

                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300" size={18} />
                    <input
                      required={mode === 'signup'}
                      type="text"
                      placeholder={isRw ? 'Amazina yose' : 'Full Name'}
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-primary-50 focus:border-primary focus:ring-0 transition-all outline-none text-sm font-medium"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300" size={18} />
              <input
                required
                type="email"
                placeholder={isRw ? 'Imeri' : 'Email Address'}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-primary-50 focus:border-primary focus:ring-0 transition-all outline-none text-sm font-medium"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300" size={18} />
              <input
                required
                type="password"
                placeholder={isRw ? 'Ijambo ry\'ibanga' : 'Password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-primary-50 focus:border-primary focus:ring-0 transition-all outline-none text-sm font-medium"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 text-xs font-bold"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-emerald-600 text-xs font-bold"
              >
                <CheckCircle2 size={16} />
                {isRw ? 'Byagenze neza! Winjiye...' : 'Success! Redirecting...'}
              </motion.div>
            )}

            <button
              disabled={loading || success}
              type="submit"
              className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {mode === 'login' ? (isRw ? 'Injira' : 'Sign In') : (isRw ? 'Iyandikishe' : 'Sign Up')}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-8 text-sm font-medium text-primary-400">
            {mode === 'login' 
              ? (isRw ? 'Nturagira konti?' : 'Don\'t have an account?')
              : (isRw ? 'Usanganywe konti?' : 'Already have an account?')}{' '}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-primary font-bold hover:underline"
            >
              {mode === 'login' ? (isRw ? 'Iyandikishe' : 'Sign Up') : (isRw ? 'Injira' : 'Login')}
            </button>
          </p>
        </motion.div>

        <p className="text-center mt-8 text-[10px] text-primary-300 font-bold uppercase tracking-widest">
          Humura AI &copy; {new Date().getFullYear()} · Mind Supported, Life Empowered.
        </p>
      </div>
    </div>
  );
}
