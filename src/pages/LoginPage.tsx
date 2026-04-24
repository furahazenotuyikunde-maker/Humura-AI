import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, UserPlus, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const isRw = lang.startsWith('rw');
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccess(isRw ? 'Twebure ubutumwa muri email yawe kugira ngo wemeze konte.' : 'Check your email for the confirmation link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo/Icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center mb-4 shadow-inner">
            <ShieldCheck size={40} className="text-primary" />
          </div>
          <h1 className="text-3xl font-black text-primary-900 tracking-tight">
            {isSignUp 
              ? (isRw ? 'Fungura Konte' : 'Create Account') 
              : (isRw ? 'Injira muri Humura' : 'Sign In to Humura')}
          </h1>
          <p className="text-neutral-500 mt-2 text-center text-sm">
            {isSignUp 
              ? (isRw ? 'Tangira urugendo rwawe rw\'ubuzima bwo mu mutwe uyu munsi' : 'Start your mental wellness journey today')
              : (isRw ? 'Komeza urugendo rwawe n\'ubufasha bwa AI' : 'Continue your journey with AI support')}
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-card rounded-[2.5rem] p-8 shadow-2xl shadow-primary/5 border border-white/50">
          <form onSubmit={handleAuth} className="space-y-5">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-medium flex items-center gap-2"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-green-50 text-green-600 rounded-2xl text-xs font-medium flex items-center gap-2"
                >
                  <ShieldCheck size={16} />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-primary-900 uppercase tracking-widest ml-4 mb-2">
                  {isRw ? 'Email yanyu' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-4 bg-primary-50/50 border border-transparent focus:border-primary/30 rounded-2xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-primary/5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-primary-900 uppercase tracking-widest ml-4 mb-2">
                  {isRw ? 'Ijambo ry\'ibanga' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 bg-primary-50/50 border border-transparent focus:border-primary/30 rounded-2xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-primary/5"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:translate-y-0"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />}
                  {isSignUp 
                    ? (isRw ? 'Fungura Konte' : 'Create Account') 
                    : (isRw ? 'Injira' : 'Sign In')}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-primary-50 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-bold text-neutral-500 hover:text-primary transition-colors flex items-center gap-1 mx-auto"
            >
              {isSignUp 
                ? (isRw ? 'Ufite konte? Injira hano' : 'Already have an account? Sign in')
                : (isRw ? 'Ntabwo ufite konte? Fungura hano' : "Don't have an account? Sign up")}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <p className="text-[10px] text-neutral-400 text-center mt-8 px-4 leading-relaxed">
          {isRw 
            ? 'Iyo winjiye, uba wemeye amategeko n\'amabwiriza ya Humura AI. Amakuru yawe abikwa mu buryo bwizewe.'
            : 'By continuing, you agree to Humura AI\'s Terms of Service and Privacy Policy. Your data is encrypted and secure.'}
        </p>
      </motion.div>
    </div>
  );
}
