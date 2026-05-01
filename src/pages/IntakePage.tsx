import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, 
  User, ClipboardList, ShieldCheck, Heart, Loader2 
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const STEPS = [
  { id: 'profile', title: 'Basic Profile', icon: User },
  { id: 'intake', title: 'Clinical Intake', icon: ClipboardList },
  { id: 'consent', title: 'Final Consent', icon: ShieldCheck }
];

export default function IntakePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    fullName: '',
    age: '',
    gender: '',
    location: '',
    language: 'en',
    disabilityFlags: [] as string[],
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    primaryConcern: 'anxiety',
    concernDuration: '',
    phq9: 0,
    gad7: 0,
    selfHarm: 'no',
    previousTherapy: 'no',
    consent: false
  });

  const nextStep = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!form.consent) {
      setError('You must consent to AI-assisted therapy to proceed.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Update Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: form.fullName,
          age: parseInt(form.age),
          gender: form.gender,
          location: form.location,
          language_pref: form.language,
          disability_flags: form.disabilityFlags,
          phone: form.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Create Patient Record
      const { error: patientError } = await supabase
        .from('patients')
        .upsert({
          id: user.id,
          primary_concern: form.primaryConcern,
          concern_duration: form.concernDuration,
          phq9_score: form.phq9,
          gad7_score: form.gad7,
          self_harm_flag: form.selfHarm === 'yes',
          emergency_contact: { name: form.emergencyContactName, phone: form.emergencyContactPhone },
          intake_completed_at: new Date().toISOString(),
          status: 'active'
        });

      if (patientError) throw patientError;

      // 3. Trigger Doctor Assignment
      await fetch(`${import.meta.env.VITE_RENDER_BACKEND_URL}/api/patients/assign-doctor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: user.id,
          concern: form.primaryConcern,
          lang: form.language
        })
      });

      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-6 pb-20">
      <header className="w-full max-w-2xl mb-10 pt-10">
        <div className="flex justify-between items-center mb-8">
          <img src="/logo.png" alt="Humura" className="h-10 w-10" />
          <div className="flex gap-2">
            {STEPS.map((s, i) => (
              <div 
                key={s.id} 
                className={`h-1.5 w-12 rounded-full transition-all ${i <= step ? 'bg-primary' : 'bg-primary-50'}`} 
              />
            ))}
          </div>
        </div>
        <h1 className="text-3xl font-black text-primary-900 leading-tight">
          {STEPS[step].title}
        </h1>
        <p className="text-primary-600 mt-2 font-medium">
          Step {step + 1} of 3 — Let's get you set up for success.
        </p>
      </header>

      <main className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={form.fullName}
                    onChange={e => setForm({...form, fullName: e.target.value})}
                    placeholder="e.g. Mugisha Eric"
                    className="w-full px-5 py-3.5 bg-neutral-50 border-2 border-primary-50 rounded-2xl focus:border-primary outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">Age</label>
                  <input 
                    type="number" 
                    value={form.age}
                    onChange={e => setForm({...form, age: e.target.value})}
                    placeholder="24"
                    className="w-full px-5 py-3.5 bg-neutral-50 border-2 border-primary-50 rounded-2xl focus:border-primary outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">Location (District in Rwanda)</label>
                <input 
                  type="text" 
                  value={form.location}
                  onChange={e => setForm({...form, location: e.target.value})}
                  placeholder="e.g. Gasabo, Kigali"
                  className="w-full px-5 py-3.5 bg-neutral-50 border-2 border-primary-50 rounded-2xl focus:border-primary outline-none transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">Preferred Language</label>
                  <select 
                    value={form.language}
                    onChange={e => setForm({...form, language: e.target.value})}
                    className="w-full px-5 py-3.5 bg-neutral-50 border-2 border-primary-50 rounded-2xl focus:border-primary outline-none transition-all font-medium appearance-none"
                  >
                    <option value="en">English</option>
                    <option value="rw">Kinyarwanda</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">Phone (+250)</label>
                  <input 
                    type="tel" 
                    value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                    placeholder="+250 788 000 000"
                    className="w-full px-5 py-3.5 bg-neutral-50 border-2 border-primary-50 rounded-2xl focus:border-primary outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">Emergency Contact (Name & Phone)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="text" 
                    placeholder="Contact Name"
                    value={form.emergencyContactName}
                    onChange={e => setForm({...form, emergencyContactName: e.target.value})}
                    className="w-full px-5 py-3.5 bg-neutral-50 border-2 border-primary-50 rounded-2xl focus:border-primary outline-none transition-all font-medium"
                  />
                  <input 
                    type="tel" 
                    placeholder="+250..."
                    value={form.emergencyContactPhone}
                    onChange={e => setForm({...form, emergencyContactPhone: e.target.value})}
                    className="w-full px-5 py-3.5 bg-neutral-50 border-2 border-primary-50 rounded-2xl focus:border-primary outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">Primary Concern</label>
                <select 
                  value={form.primaryConcern}
                  onChange={e => setForm({...form, primaryConcern: e.target.value})}
                  className="w-full px-5 py-3.5 bg-neutral-50 border-2 border-primary-50 rounded-2xl focus:border-primary outline-none transition-all font-medium appearance-none"
                >
                  <option value="anxiety">Anxiety</option>
                  <option value="depression">Depression</option>
                  <option value="ptsd">PTSD</option>
                  <option value="grief">Grief</option>
                  <option value="trauma">Trauma</option>
                  <option value="bipolar">Bipolar</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">How long have you felt this way?</label>
                <input 
                  type="text" 
                  value={form.concernDuration}
                  onChange={e => setForm({...form, concernDuration: e.target.value})}
                  placeholder="e.g. 6 months"
                  className="w-full px-5 py-3.5 bg-neutral-50 border-2 border-primary-50 rounded-2xl focus:border-primary outline-none transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-primary-50 rounded-3xl">
                  <p className="text-[10px] font-black text-primary-600 uppercase mb-2">PHQ-9 Score (0-27)</p>
                  <input 
                    type="range" min="0" max="27" 
                    value={form.phq9}
                    onChange={e => setForm({...form, phq9: parseInt(e.target.value)})}
                    className="w-full accent-primary"
                  />
                  <p className="text-center font-black text-primary text-xl mt-2">{form.phq9}</p>
                </div>
                <div className="p-5 bg-primary-50 rounded-3xl">
                  <p className="text-[10px] font-black text-primary-600 uppercase mb-2">GAD-7 Score (0-21)</p>
                  <input 
                    type="range" min="0" max="21" 
                    value={form.gad7}
                    onChange={e => setForm({...form, gad7: parseInt(e.target.value)})}
                    className="w-full accent-primary"
                  />
                  <p className="text-center font-black text-primary text-xl mt-2">{form.gad7}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">Have you had thoughts of self-harm?</label>
                <div className="flex gap-2">
                  {['no', 'yes', 'prefer not to say'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setForm({...form, selfHarm: opt})}
                      className={`flex-1 py-3 rounded-2xl font-bold text-sm capitalize border-2 transition-all ${
                        form.selfHarm === opt ? 'bg-primary border-primary text-white' : 'bg-white border-primary-50 text-primary-400 hover:border-primary-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="p-8 bg-neutral-50 rounded-[2.5rem] border-2 border-primary-50 space-y-4">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-3xl shadow-sm mb-4">
                  🤖
                </div>
                <h3 className="text-xl font-black text-primary-900">AI-Assisted Therapy Consent</h3>
                <p className="text-sm text-primary-600 leading-relaxed font-medium">
                  Humura AI uses advanced artificial intelligence to support your mental health journey. 
                  By proceeding, you consent to your anonymized data being processed to provide personalized insights and clinical assistance to your assigned doctor.
                </p>
                <label className="flex items-center gap-4 p-4 bg-white rounded-2xl cursor-pointer group hover:bg-primary-50 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={form.consent}
                    onChange={e => setForm({...form, consent: e.target.checked})}
                    className="w-6 h-6 rounded-lg text-primary focus:ring-0"
                  />
                  <span className="text-sm font-bold text-primary-900">I consent to AI-assisted therapy</span>
                </label>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
                  <AlertCircle size={20} />
                  {error}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-primary-50 flex justify-center">
        <div className="w-full max-w-2xl flex gap-4">
          {step > 0 && (
            <button 
              onClick={prevStep}
              className="flex-1 py-4 bg-neutral-100 text-primary-900 font-black rounded-2xl flex items-center justify-center gap-2"
            >
              <ChevronLeft size={20} />
              Back
            </button>
          )}
          <button 
            onClick={step === STEPS.length - 1 ? handleSubmit : nextStep}
            disabled={loading}
            className="flex-[2] py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {step === STEPS.length - 1 ? 'Complete Setup' : 'Continue'}
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
