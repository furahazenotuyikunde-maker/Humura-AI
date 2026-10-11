import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  User, Shield, Languages, Eye, Bell, Phone, MapPin, 
  ChevronRight, Check, X, LogOut, Loader2, Sparkles, 
  FileText, ArrowLeft, Heart, Moon, Sun, Type, AlertTriangle,
  Stethoscope, Volume2, ShieldAlert, Trash2,
  Lock, RefreshCw, CheckCircle2, ChevronDown, Calendar
} from 'lucide-react';

type TextSize = 'sm' | 'md' | 'lg' | 'xl';

interface SettingsState {
  screenReader: boolean;
  textSize: TextSize;
  highContrast: boolean;
  voiceNav: boolean;
  notifications: boolean;
  sessionAlerts: boolean;
  emergencySms: boolean;
  darkMode: boolean;
}

const RWANDA_DISTRICTS = [
  'Gasabo (Kigali)',
  'Kicukiro (Kigali)',
  'Nyarugenge (Kigali)',
  'Musanze (Northern)',
  'Gicumbi (Northern)',
  'Rubavu (Western)',
  'Rusizi (Western)',
  'Karongi (Western)',
  'Huye (Southern)',
  'Muhanga (Southern)',
  'Rwamagana (Eastern)',
  'Bugesera (Eastern)',
  'Kayonza (Eastern)',
  'Other / Diaspora'
];

const getInitialProfileCache = () => {
  try {
    const raw = localStorage.getItem('humura_profile_cache');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export default function SettingsPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRw = i18n.language?.startsWith('rw');

  const cachedProfile = getInitialProfileCache();

  // Loading & Session States
  const [loading, setLoading] = useState(!cachedProfile);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Profile & Clinical Care State
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(cachedProfile?.profile || null);
  const [patientRecord, setPatientRecord] = useState<any>(cachedProfile?.patientRecord || null);
  const [assignedDoctor, setAssignedDoctor] = useState<any>(cachedProfile?.assignedDoctor || null);

  // Form Inputs
  const [fullName, setFullName] = useState(cachedProfile?.fullName || '');
  const [phone, setPhone] = useState(cachedProfile?.phone || '');
  const [location, setLocation] = useState(cachedProfile?.location || '');
  const [emergencyName, setEmergencyName] = useState(cachedProfile?.emergencyName || '');
  const [emergencyPhone, setEmergencyPhone] = useState(cachedProfile?.emergencyPhone || '');

  // Modals
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  // UI Settings State
  const [settings, setSettings] = useState<SettingsState>(() => {
    const saved = localStorage.getItem('Humura_settings_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback below
      }
    }
    return {
      screenReader: false,
      textSize: 'md',
      highContrast: false,
      voiceNav: false,
      notifications: true,
      sessionAlerts: true,
      emergencySms: true,
      darkMode: false,
    };
  });

  // Sync settings with UI classes & localStorage
  useEffect(() => {
    localStorage.setItem('Humura_settings_v2', JSON.stringify(settings));
    window.dispatchEvent(new Event('storage'));

    // High Contrast
    document.documentElement.classList.toggle('high-contrast', settings.highContrast);
    // Dark Theme
    document.documentElement.classList.toggle('humura-dark', settings.darkMode);

    // Text Size
    const sizeClasses = ['text-sm', 'text-md', 'text-lg', 'text-xl'];
    document.documentElement.classList.remove(...sizeClasses);
    document.documentElement.classList.add(`text-${settings.textSize}`);
  }, [settings]);

  useEffect(() => {
    loadUserData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadUserData = async () => {
    if (!cachedProfile) {
      setLoading(true);
    }
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate('/auth');
        return;
      }
      setUser(authUser);

      // Fetch Profile
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      let currentFullName = fullName;
      let currentPhone = phone;
      let currentLocation = location;

      if (profData) {
        setProfile(profData);
        currentFullName = profData.full_name || '';
        currentPhone = profData.phone || '';
        currentLocation = profData.location || '';
        setFullName(currentFullName);
        setPhone(currentPhone);
        setLocation(currentLocation);
      }

      // Fetch Patient Record & Doctor
      const { data: pRecord } = await supabase
        .from('patients')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      let currentEmergencyName = emergencyName;
      let currentEmergencyPhone = emergencyPhone;
      let currentDoctor = assignedDoctor;

      if (pRecord) {
        setPatientRecord(pRecord);
        if (pRecord.emergency_contact) {
          currentEmergencyName = pRecord.emergency_contact.name || '';
          currentEmergencyPhone = pRecord.emergency_contact.phone || '';
          setEmergencyName(currentEmergencyName);
          setEmergencyPhone(currentEmergencyPhone);
        }

        // If assigned doctor exists, fetch doctor info
        if (pRecord.doctor_id) {
          const { data: docData } = await supabase
            .from('profiles')
            .select('id, full_name, specialty, phone, location, avatar_url')
            .eq('id', pRecord.doctor_id)
            .maybeSingle();

          if (docData) {
            currentDoctor = docData;
            setAssignedDoctor(docData);
          }
        }
      }

      // Sync offline memory cache
      try {
        localStorage.setItem('humura_profile_cache', JSON.stringify({
          fullName: currentFullName,
          phone: currentPhone,
          location: currentLocation,
          emergencyName: currentEmergencyName,
          emergencyPhone: currentEmergencyPhone,
          assignedDoctor: currentDoctor,
          profile: profData,
          patientRecord: pRecord
        }));
      } catch (e) {
        // storage fallback
      }
    } catch (err: any) {
      console.error('Error loading settings data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      // 1. Update Profiles Table
      const { error: profError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          location: location,
          language_pref: i18n.language?.startsWith('rw') ? 'rw' : 'en',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profError) throw profError;

      // 2. Update Patients Table with Emergency Contact
      const emergencyContactObj = {
        name: emergencyName.trim(),
        phone: emergencyPhone.trim()
      };

      const { error: patientError } = await supabase
        .from('patients')
        .upsert({
          id: user.id,
          emergency_contact: emergencyContactObj,
          status: 'active'
        });

      if (patientError) throw patientError;

      // Update cache
      try {
        localStorage.setItem('humura_profile_cache', JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          location: location,
          emergencyName: emergencyName.trim(),
          emergencyPhone: emergencyPhone.trim(),
          assignedDoctor: assignedDoctor,
          profile: { ...(profile || {}), full_name: fullName.trim(), phone: phone.trim(), location },
          patientRecord: {
            ...(patientRecord || {}),
            emergency_contact: emergencyContactObj
          }
        }));
      } catch (e) {}

      showToast(
        isRw
          ? 'Umwirondoro wawe wabitswe neza!'
          : 'Your personal information was updated successfully!',
        'success'
      );
      loadUserData();
    } catch (err: any) {
      console.error('Save error:', err);
      showToast(
        isRw ? 'Ntibyashobotse kubika impinduka. Ongera ugerageze.' : 'Unable to save your details right now. Please try again.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof SettingsState) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const setTextSize = (size: TextSize) => {
    setSettings(prev => ({ ...prev, textSize: size }));
  };

  const handleClearHistory = () => {
    setClearing(true);
    try {
      localStorage.removeItem('humura_chat_history_v6');
      localStorage.removeItem('Humura_chat_sessions');
      localStorage.removeItem('humura_prefilled_prompt');
      showToast(
        isRw ? 'Amateka yose y\'ibiganiro yasibwe!' : 'All conversation records have been cleared!',
        'success'
      );
      setShowClearHistoryModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setClearing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('Humura_settings_v2');
      localStorage.removeItem('humura_profile_cache');
      navigate('/');
    } catch (err) {
      navigate('/');
    }
  };

  const handleSafetyExit = () => {
    window.location.replace('https://www.google.com');
  };

  const userInitials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  if (loading) {
    return <SettingsSkeleton isRw={isRw} />;
  }

  return (
    <div className="min-h-screen bg-[#F4F8F6] text-[#08352A] font-poppins pb-24">
      {/* Toast Feedback */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 font-bold text-xs ${
              toast.type === 'success'
                ? 'bg-[#08352A] text-white border border-[#21B48D]/40'
                : 'bg-red-600 text-white border border-red-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={16} className="text-[#21B48D]" />
            ) : (
              <AlertTriangle size={16} />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inner Page Context Bar */}
      <div className="bg-white/80 border-b border-[#DFEBE5] px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/patient/dashboard')}
              className="p-1.5 -ml-1 text-[#5E8E81] hover:text-[#08352A] rounded-xl hover:bg-[#F4F8F6] transition-colors"
              title={isRw ? 'Gusubira ku rubuga' : 'Back to Dashboard'}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-[#08352A] leading-tight">
                {isRw ? 'Igenamiterere n\'Umwirondoro' : 'Account & Preferences'}
              </h1>
              <p className="text-[11px] font-semibold text-[#5E8E81] leading-none mt-0.5">
                {isRw ? 'Guhindura amakuru, ubugari, n\'umutekano' : 'Personal information, care team, and accessibility'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSafetyExit}
              className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
              title={isRw ? 'Gusohoka byihuse' : 'Instant Privacy Exit'}
            >
              <ShieldAlert size={14} className="text-red-600" />
              <span className="hidden sm:inline">{isRw ? 'Sohoka Vuba' : 'Quick Exit'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-8 space-y-8">

        {/* ── 1. PROFILE HEADER CARD ── */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-[#DFEBE5] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#08352A] text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-sm relative shrink-0">
              {userInitials}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#21B48D] border-2 border-white flex items-center justify-center text-[10px] text-white">
                ✓
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-[#08352A]">
                  {fullName || (isRw ? 'Umukoresha wa Humura' : 'Humura Member')}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-[#EAF5F0] text-[#1B7E64] border border-[#CDE5DA]">
                  {profile?.role === 'doctor' ? (isRw ? 'Inzobere' : 'Clinician') : (isRw ? 'Umurwayi' : 'Patient')}
                </span>
              </div>
              <p className="text-xs font-semibold text-[#5E8E81] mt-0.5">
                {user?.email || 'Confidential Member Account'}
              </p>
              <p className="text-[11px] font-medium text-[#21B48D] mt-1 flex items-center gap-1">
                <Shield size={12} />
                <span>{isRw ? 'Umutekano n\'ibanga byubahirijwe' : 'HIPAA-aligned & Confidential Care'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => handleSaveProfile()}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 bg-[#08352A] hover:bg-[#153C32] text-white font-extrabold text-xs rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin text-[#21B48D]" /> : <Check size={15} className="text-[#21B48D]" />}
            <span>{isRw ? 'Bika Byose' : 'Save Changes'}</span>
          </button>
        </div>

        {/* ── 2. PERSONAL PROFILE & EMERGENCY CONTACT ── */}
        <section className="bg-white rounded-[2rem] p-6 sm:p-8 border border-[#DFEBE5] shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#EEF5F1]">
            <div className="w-9 h-9 rounded-xl bg-[#EAF5F0] text-[#1B7E64] flex items-center justify-center">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#08352A]">
                {isRw ? 'Amakuru Bwite n\'Ubufasha Bwihutirwa' : 'Personal Profile & Emergency Contact'}
              </h3>
              <p className="text-xs font-medium text-[#5E8E81]">
                {isRw ? 'Amakuru akoreshwa mu gutanga ubufasha buboneye' : 'Your contact details and immediate emergency reachout person'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-[#08352A] mb-1.5">
                {isRw ? 'Amazina Yombi' : 'Full Name'}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Marie Mukamana"
                className="w-full px-4 py-3 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5] focus:border-[#21B48D] focus:bg-white text-xs font-bold text-[#08352A] outline-none transition-all placeholder:text-[#8DB4A8]"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-[#08352A] mb-1.5">
                {isRw ? 'Nimero ya Telefoni' : 'Phone Number'}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+250 788 000 000"
                className="w-full px-4 py-3 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5] focus:border-[#21B48D] focus:bg-white text-xs font-bold text-[#08352A] outline-none transition-all placeholder:text-[#8DB4A8]"
              />
            </div>

            {/* Residence / District */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#08352A] mb-1.5 flex items-center gap-1.5">
                <MapPin size={13} className="text-[#21B48D]" />
                <span>{isRw ? 'Akarere Utuyemo' : 'District of Residence (Rwanda)'}</span>
              </label>
              <div className="relative">
                <select
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5] focus:border-[#21B48D] focus:bg-white text-xs font-bold text-[#08352A] outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">{isRw ? '-- Hitamo Akarere --' : '-- Select Your District --'}</option>
                  {RWANDA_DISTRICTS.map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5E8E81] pointer-events-none" />
              </div>
            </div>

            {/* Emergency Contact Subsection */}
            <div className="sm:col-span-2 pt-4 border-t border-[#EEF5F1]">
              <div className="flex items-center gap-2 mb-3">
                <Heart size={16} className="text-red-500" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#08352A]">
                  {isRw ? 'Umuntu Wo Guhamagara Mu Byihutirwa' : 'Designated Emergency Contact'}
                </h4>
              </div>
              <p className="text-[11px] font-medium text-[#5E8E81] mb-3">
                {isRw
                  ? 'Uyu muntu ahamagarwa mu ibanga rikomeye mu gihe habaye ikibazo cyihutirwa cy\'ubuzima bwo mu mutwe.'
                  : 'This contact is securely stored and notified only during urgent mental health emergencies.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#08352A] mb-1">
                    {isRw ? 'Izina ry\'umuntu w\'ubutabazi' : 'Contact Person Full Name'}
                  </label>
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={e => setEmergencyName(e.target.value)}
                    placeholder="e.g. Papa, Mama, Partner, Friend"
                    className="w-full px-4 py-3 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5] focus:border-[#21B48D] focus:bg-white text-xs font-bold text-[#08352A] outline-none transition-all placeholder:text-[#8DB4A8]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#08352A] mb-1">
                    {isRw ? 'Telefoni y\'umuntu w\'ubutabazi' : 'Contact Emergency Phone'}
                  </label>
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={e => setEmergencyPhone(e.target.value)}
                    placeholder="+250 788 111 222"
                    className="w-full px-4 py-3 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5] focus:border-[#21B48D] focus:bg-white text-xs font-bold text-[#08352A] outline-none transition-all placeholder:text-[#8DB4A8]"
                  />
                </div>
              </div>
            </div>
          </form>
        </section>

        {/* ── 3. ASSIGNED CLINICIAN & CARE TEAM ── */}
        <section className="bg-white rounded-[2rem] p-6 sm:p-8 border border-[#DFEBE5] shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#EEF5F1]">
            <div className="w-9 h-9 rounded-xl bg-[#EAF5F0] text-[#1B7E64] flex items-center justify-center">
              <Stethoscope size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#08352A]">
                {isRw ? 'Inzobere y\'Ubuvuzi Ikuri Hafi' : 'Assigned Clinical Specialist'}
              </h3>
              <p className="text-xs font-medium text-[#5E8E81]">
                {isRw ? 'Muganga wawe ukurikiranira hafi ibibazo n\'intambwe utera' : 'The mental health professional assigned to support your care journey'}
              </p>
            </div>
          </div>

          {assignedDoctor ? (
            <div className="p-5 sm:p-6 rounded-3xl bg-[#F4F8F6] border border-[#DFEBE5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#08352A] text-white flex items-center justify-center font-black text-xl shrink-0 shadow-2xs">
                  {assignedDoctor.full_name?.charAt(0) || 'D'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-black text-[#08352A]">
                      {assignedDoctor.full_name}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      {isRw ? 'Uhoraho' : 'Active Clinician'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#21B48D] mt-0.5">
                    {assignedDoctor.specialty || (isRw ? 'Inzobere mu buzima bwo mu mutwe' : 'Psychiatrist / CBT Therapist')}
                  </p>
                  {assignedDoctor.location && (
                    <p className="text-[11px] font-medium text-[#5E8E81] mt-0.5 flex items-center gap-1">
                      <MapPin size={11} /> {assignedDoctor.location}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {assignedDoctor.phone && (
                  <button
                    onClick={() => window.location.href = `tel:${assignedDoctor.phone}`}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-[#DFEBE5] hover:border-[#21B48D] text-[#08352A] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Phone size={14} className="text-[#21B48D]" />
                    <span>{isRw ? 'Hamagara' : 'Call'}</span>
                  </button>
                )}
                <button
                  onClick={() => navigate('/patient/meet-professional')}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-[#08352A] hover:bg-[#153C32] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Calendar size={14} className="text-[#21B48D]" />
                  <span>{isRw ? 'Gana Inzobere' : 'Consultations'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-[#F8FAF9] border border-dashed border-[#DFEBE5] text-center space-y-3">
              <Stethoscope size={32} className="mx-auto text-[#8DB4A8]" />
              <p className="text-xs font-bold text-[#08352A]">
                {isRw ? 'Nta muganga uragenerwa ubu' : 'No primary clinician currently linked'}
              </p>
              <p className="text-[11px] text-[#5E8E81] max-w-sm mx-auto">
                {isRw
                  ? 'Urashobora guhitamo inzobere mu buzima bwo mu mutwe mu itsinda ryacu kugira ngo ijye igufasha.'
                  : 'You can choose a licensed mental health specialist from our clinical roster for tailored care.'}
              </p>
              <button
                onClick={() => navigate('/patient/meet-professional')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#08352A] text-white font-extrabold text-xs rounded-xl hover:bg-[#153C32] transition-all shadow-xs"
              >
                <Sparkles size={14} className="text-[#21B48D]" />
                <span>{isRw ? 'Hitamo Inzobere' : 'Select a Specialist'}</span>
              </button>
            </div>
          )}
        </section>

        {/* ── 4. LANGUAGE PREFERENCE ── */}
        <section className="bg-white rounded-[2rem] p-6 sm:p-8 border border-[#DFEBE5] shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#EEF5F1]">
            <div className="w-9 h-9 rounded-xl bg-[#EAF5F0] text-[#1B7E64] flex items-center justify-center">
              <Languages size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#08352A]">
                {isRw ? 'Ururimi Porogaramu Ikoresha' : 'Language & Regional Localization'}
              </h3>
              <p className="text-xs font-medium text-[#5E8E81]">
                {isRw ? 'Hitamo ururimi wifuza gukoresha muri Humura AI' : 'Select your primary language for therapy, navigation, and audio tools'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'en', title: 'English', sub: 'Standard International English' },
              { id: 'rw', title: 'Ikinyarwanda', sub: 'Ururimi kavukire rwa Kinyarwanda' }
            ].map(lang => {
              const active = i18n.language?.startsWith(lang.id);
              return (
                <button
                  key={lang.id}
                  onClick={() => {
                    i18n.changeLanguage(lang.id);
                    showToast(lang.id === 'rw' ? 'Ururimi rwahinduwe mu Kinyarwanda' : 'Language switched to English');
                  }}
                  className={`p-5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    active
                      ? 'bg-[#EAF5F0] border-[#21B48D] shadow-xs'
                      : 'bg-white border-[#DFEBE5] hover:border-[#8DB4A8]'
                  }`}
                >
                  <div>
                    <p className="text-sm font-extrabold text-[#08352A]">{lang.title}</p>
                    <p className="text-xs font-medium text-[#5E8E81] mt-0.5">{lang.sub}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    active ? 'border-[#21B48D] bg-[#21B48D] text-white' : 'border-[#DFEBE5] bg-white'
                  }`}>
                    {active && <Check size={14} />}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── 5. ACCESSIBILITY & DISPLAY COMFORT ── */}
        <section className="bg-white rounded-[2rem] p-6 sm:p-8 border border-[#DFEBE5] shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#EEF5F1]">
            <div className="w-9 h-9 rounded-xl bg-[#EAF5F0] text-[#1B7E64] flex items-center justify-center">
              <Eye size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#08352A]">
                {isRw ? 'Uburyo bwo Koroshya Imikoreshereze' : 'Accessibility & Viewing Comfort'}
              </h3>
              <p className="text-xs font-medium text-[#5E8E81]">
                {isRw ? 'Guhindura ingano y\'inyandiko, ibara rikomeye, n\'ubufasha bw\'ijwi' : 'Text sizing, contrast optimization, screen readers, and tactile tools'}
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* 1. Text Size Selector */}
            <div className="p-5 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-bold text-[#08352A] flex items-center gap-1.5">
                    <Type size={14} className="text-[#21B48D]" />
                    <span>{isRw ? 'Ingano y\'Inyandiko' : 'Interface Font Size'}</span>
                  </p>
                  <p className="text-[11px] font-medium text-[#5E8E81]">
                    {isRw ? 'Bikora kuri porogaramu yose mu buryo bworoshye' : 'Scales typography across all pages for comfortable readability'}
                  </p>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white border border-[#DFEBE5] text-[#08352A]">
                  {settings.textSize.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'sm' as TextSize, label: 'SM (14px)' },
                  { id: 'md' as TextSize, label: 'MD (16px)' },
                  { id: 'lg' as TextSize, label: 'LG (20px)' },
                  { id: 'xl' as TextSize, label: 'XL (24px)' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setTextSize(item.id)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      settings.textSize === item.id
                        ? 'bg-[#08352A] text-white border-[#08352A] shadow-xs'
                        : 'bg-white text-[#08352A] border-[#DFEBE5] hover:bg-[#EEF5F1]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. High Contrast Mode */}
            <div className="p-4 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#08352A]">
                  {isRw ? 'Ibara Rikomeye cyane (High Contrast)' : 'High Contrast Monochrome'}
                </p>
                <p className="text-[11px] font-medium text-[#5E8E81]">
                  {isRw ? 'Koresha umukara n\'umweru gusa mu koroshya kubona' : 'Maximizes visual contrast between background and text for visual comfort'}
                </p>
              </div>
              <button
                onClick={() => toggle('highContrast')}
                className={`w-14 h-8 rounded-full transition-colors relative border ${
                  settings.highContrast ? 'bg-[#21B48D] border-[#1B8C6C]' : 'bg-[#DFEBE5] border-[#CAD8D1]'
                }`}
                role="switch"
                aria-checked={settings.highContrast}
              >
                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-xs transition-transform ${
                  settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* 3. Screen Reader Optimization */}
            <div className="p-4 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#08352A] flex items-center gap-1.5">
                  <Volume2 size={13} className="text-[#21B48D]" />
                  <span>{isRw ? 'Ubufasha bwa TalkBack na VoiceOver' : 'Screen Reader Optimization'}</span>
                </p>
                <p className="text-[11px] font-medium text-[#5E8E81]">
                  {isRw ? 'Ihuza porogaramu na porogaramu zisomeramo abafite ubumuga bwo kutabona' : 'Enhanced ARIA labels and structure for assistive screen readers'}
                </p>
              </div>
              <button
                onClick={() => toggle('screenReader')}
                className={`w-14 h-8 rounded-full transition-colors relative border ${
                  settings.screenReader ? 'bg-[#21B48D] border-[#1B8C6C]' : 'bg-[#DFEBE5] border-[#CAD8D1]'
                }`}
                role="switch"
                aria-checked={settings.screenReader}
              >
                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-xs transition-transform ${
                  settings.screenReader ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* 4. Midnight Theme */}
            <div className="p-4 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#08352A] flex items-center gap-1.5">
                  {settings.darkMode ? <Moon size={13} className="text-[#21B48D]" /> : <Sun size={13} className="text-[#21B48D]" />}
                  <span>{isRw ? 'Isura y\'Ijoro (Midnight Dark Theme)' : 'Midnight Dark Theme'}</span>
                </p>
                <p className="text-[11px] font-medium text-[#5E8E81]">
                  {isRw ? 'Kugabanya urumuri mu masaha y\'umugoroba' : 'Softens eye strain during nighttime relaxation sessions'}
                </p>
              </div>
              <button
                onClick={() => toggle('darkMode')}
                className={`w-14 h-8 rounded-full transition-colors relative border ${
                  settings.darkMode ? 'bg-[#08352A] border-[#153C32]' : 'bg-[#DFEBE5] border-[#CAD8D1]'
                }`}
                role="switch"
                aria-checked={settings.darkMode}
              >
                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-xs transition-transform ${
                  settings.darkMode ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Direct Tool Shortcuts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => navigate('/patient/braille')}
                className="p-4 rounded-2xl bg-[#F4F8F6] hover:bg-[#EAF5F0] border border-[#DFEBE5] transition-all flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#DFEBE5] flex items-center justify-center text-[#08352A]">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#08352A]">
                      {isRw ? 'Inyandiko za Braille' : 'Tactile Braille Studio'}
                    </p>
                    <p className="text-[10px] text-[#5E8E81]">
                      {isRw ? 'Uburyo bwo gusoma n\'intoki' : 'Unicode 6-dot Braille generator'}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#8DB4A8] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/patient/sign-language')}
                className="p-4 rounded-2xl bg-[#F4F8F6] hover:bg-[#EAF5F0] border border-[#DFEBE5] transition-all flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#DFEBE5] flex items-center justify-center text-[#08352A]">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#08352A]">
                      {isRw ? 'Ururimi rw\'Amarenga' : 'Sign Language Studio'}
                    </p>
                    <p className="text-[10px] text-[#5E8E81]">
                      {isRw ? 'Amarenga y\'u Rwanda' : 'Rwandan Sign Language gestures'}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#8DB4A8] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>
        </section>

        {/* ── 6. NOTIFICATIONS & REMINDERS ── */}
        <section className="bg-white rounded-[2rem] p-6 sm:p-8 border border-[#DFEBE5] shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#EEF5F1]">
            <div className="w-9 h-9 rounded-xl bg-[#EAF5F0] text-[#1B7E64] flex items-center justify-center">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#08352A]">
                {isRw ? 'Imenyesha n\'Ubutumwa Butoza' : 'Notifications & Wellness Alerts'}
              </h3>
              <p className="text-xs font-medium text-[#5E8E81]">
                {isRw ? 'Kugufasha kwibuka kwisuzuma no gukurikirana intambwe utera' : 'Gentle nudges for daily reflections, scheduled appointments, and emergency checks'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Daily Wellness Check-in */}
            <div className="p-4 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#08352A]">
                  {isRw ? 'Kwibutswa Kwisuzuma Buri Munsi' : 'Daily Mood & Reflection Reminders'}
                </p>
                <p className="text-[11px] font-medium text-[#5E8E81]">
                  {isRw ? 'Ubutumwa bworoshye bwo kumenya uko umerewe mu gitondo cyangwa nimugoroba' : 'A gentle daily check-in prompt to log thoughts and track emotional health'}
                </p>
              </div>
              <button
                onClick={() => toggle('notifications')}
                className={`w-14 h-8 rounded-full transition-colors relative border ${
                  settings.notifications ? 'bg-[#21B48D] border-[#1B8C6C]' : 'bg-[#DFEBE5] border-[#CAD8D1]'
                }`}
                role="switch"
                aria-checked={settings.notifications}
              >
                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-xs transition-transform ${
                  settings.notifications ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Session Alerts */}
            <div className="p-4 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#08352A]">
                  {isRw ? 'Kwibutswa Ibiganiro na Muganga' : 'Session & Consultation Alerts'}
                </p>
                <p className="text-[11px] font-medium text-[#5E8E81]">
                  {isRw ? 'Ubutumwa bwibutsa imibonano ya videwo iteganyijwe' : 'Alerts before confirmed consultations or video sessions'}
                </p>
              </div>
              <button
                onClick={() => toggle('sessionAlerts')}
                className={`w-14 h-8 rounded-full transition-colors relative border ${
                  settings.sessionAlerts ? 'bg-[#21B48D] border-[#1B8C6C]' : 'bg-[#DFEBE5] border-[#CAD8D1]'
                }`}
                role="switch"
                aria-checked={settings.sessionAlerts}
              >
                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-xs transition-transform ${
                  settings.sessionAlerts ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </section>

        {/* ── 7. PRIVACY, SAFETY & ACCOUNT ── */}
        <section className="bg-white rounded-[2rem] p-6 sm:p-8 border border-[#DFEBE5] shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#EEF5F1]">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#08352A]">
                {isRw ? 'Umutekano n\'Isuku y\'Amakuru' : 'Privacy, Security & Session Management'}
              </h3>
              <p className="text-xs font-medium text-[#5E8E81]">
                {isRw ? 'Kugenzura amateka no gusohoka mu buryo butekanye' : 'Control your session logs, local records, and secure sign-out'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Clear Conversation History */}
            <div className="p-4 rounded-2xl bg-[#FDF8F7] border border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                  <Trash2 size={13} className="text-red-500" />
                  <span>{isRw ? 'Gusiba Amateka y\'Ibiganiro' : 'Clear Chat Conversation History'}</span>
                </p>
                <p className="text-[11px] font-medium text-red-700/70">
                  {isRw ? 'Gusiba ibiganiro byose byabitswe ku gikoresho cyawe' : 'Permanently resets local AI chat memory on this device'}
                </p>
              </div>
              <button
                onClick={() => setShowClearHistoryModal(true)}
                className="px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 font-bold text-xs rounded-xl transition-all shadow-2xs self-start sm:self-auto shrink-0"
              >
                {isRw ? 'Siba Amateka' : 'Clear History'}
              </button>
            </div>

            {/* Quick Safety Exit */}
            <div className="p-4 rounded-2xl bg-red-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <p className="text-xs font-extrabold flex items-center gap-1.5">
                  <ShieldAlert size={14} />
                  <span>{isRw ? 'Gusohoka Byihuse (Emergency Privacy Exit)' : 'Emergency Privacy Exit'}</span>
                </p>
                <p className="text-[11px] font-medium opacity-90">
                  {isRw ? 'Kanda hano uhite usohoka kuri porogaramu mu masegonda' : 'Instantly leaves the page and redirects to a neutral search portal'}
                </p>
              </div>
              <button
                onClick={handleSafetyExit}
                className="px-4 py-2 bg-white text-red-700 hover:bg-neutral-100 font-extrabold text-xs rounded-xl transition-all self-start sm:self-auto shrink-0 shadow-sm"
              >
                {isRw ? 'Sohoka Vuba' : 'Exit Now'}
              </button>
            </div>

            {/* Logout Button */}
            <div className="pt-3 flex justify-end">
              <button
                onClick={() => setShowLogoutModal(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#5E8E81] hover:text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <LogOut size={14} />
                <span>{isRw ? 'Gusohoka muri Konti' : 'Sign Out of Account'}</span>
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* ── CONFIRMATION MODAL: CLEAR HISTORY ── */}
      <AnimatePresence>
        {showClearHistoryModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#DFEBE5] space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                <Trash2 size={22} />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-[#08352A]">
                  {isRw ? 'Uremeza gusiba amateka?' : 'Clear conversation history?'}
                </h4>
                <p className="text-xs text-[#5E8E81] mt-1 leading-relaxed">
                  {isRw
                    ? 'Ibi birasiba amagambo yose y\'ibiganiro yabitswe ku gikoresho cyawe. Iki gikorwa ntigishobora kugarurwa.'
                    : 'This action permanently erases your saved conversations on this device. You will start with a fresh companion memory.'}
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setShowClearHistoryModal(false)}
                  className="flex-1 py-2.5 bg-[#F4F8F6] text-[#08352A] font-bold text-xs rounded-xl hover:bg-[#EEF5F1] transition-colors"
                >
                  {isRw ? 'Hagarika' : 'Cancel'}
                </button>
                <button
                  onClick={handleClearHistory}
                  disabled={clearing}
                  className="flex-1 py-2.5 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition-colors shadow-xs"
                >
                  {clearing ? (isRw ? 'Gusiba...' : 'Clearing...') : (isRw ? 'Yego, Siba' : 'Yes, Clear')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CONFIRMATION MODAL: LOGOUT ── */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#DFEBE5] space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#EAF5F0] text-[#1B7E64] flex items-center justify-center">
                <LogOut size={22} />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-[#08352A]">
                  {isRw ? 'Gusohoka muri Konti?' : 'Sign out of your account?'}
                </h4>
                <p className="text-xs text-[#5E8E81] mt-1 leading-relaxed">
                  {isRw
                    ? 'Ugiye gusohoka muri Humura AI. Urashobora kongera kwinjira igihe cyose wifuje.'
                    : 'You are about to sign out. You can return anytime with your credentials.'}
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-2.5 bg-[#F4F8F6] text-[#08352A] font-bold text-xs rounded-xl hover:bg-[#EEF5F1] transition-colors"
                >
                  {isRw ? 'Guma hano' : 'Stay'}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2.5 bg-[#08352A] text-white font-bold text-xs rounded-xl hover:bg-[#153C32] transition-colors shadow-xs"
                >
                  {isRw ? 'Sohoka' : 'Sign Out'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function SettingsSkeleton({ isRw }: { isRw: boolean }) {
  return (
    <div className="min-h-screen bg-[#F4F8F6] text-[#08352A] font-poppins pb-24">
      {/* Top Header Sticky Bar Skeleton */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-[#DFEBE5] px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#DFEBE5] animate-pulse" />
            <div className="space-y-1.5">
              <div className="w-36 h-4 rounded-md bg-[#DFEBE5] animate-pulse" />
              <div className="w-52 h-2.5 rounded-md bg-[#E8F2ED] animate-pulse" />
            </div>
          </div>
          <div className="w-24 h-7 rounded-xl bg-red-100/60 animate-pulse" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-8 space-y-8 animate-pulse">
        {/* Profile Header Card Skeleton */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-[#DFEBE5] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#DFEBE5]" />
            <div className="space-y-2">
              <div className="w-48 h-6 rounded-lg bg-[#DFEBE5]" />
              <div className="w-36 h-3.5 rounded-md bg-[#E8F2ED]" />
              <div className="w-32 h-3 rounded-md bg-[#E8F2ED]" />
            </div>
          </div>
          <div className="w-32 h-11 rounded-2xl bg-[#DFEBE5]" />
        </div>

        {/* Section 1 Skeleton: Profile Fields */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-[#DFEBE5] shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="w-56 h-5 rounded-md bg-[#DFEBE5]" />
              <div className="w-72 h-3 rounded-md bg-[#E8F2ED]" />
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[#E8F2ED]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="w-24 h-3.5 rounded bg-[#E8F2ED]" />
              <div className="w-full h-11 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5]" />
            </div>
            <div className="space-y-2">
              <div className="w-28 h-3.5 rounded bg-[#E8F2ED]" />
              <div className="w-full h-11 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5]" />
            </div>
            <div className="space-y-2">
              <div className="w-32 h-3.5 rounded bg-[#E8F2ED]" />
              <div className="w-full h-11 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5]" />
            </div>
            <div className="space-y-2">
              <div className="w-36 h-3.5 rounded bg-[#E8F2ED]" />
              <div className="w-full h-11 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5]" />
            </div>
          </div>
        </div>

        {/* Section 2 Skeleton: Clinician Card */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-[#DFEBE5] shadow-xs space-y-4">
          <div className="w-52 h-5 rounded-md bg-[#DFEBE5]" />
          <div className="w-full h-24 rounded-3xl bg-[#F4F8F6] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#DFEBE5]" />
              <div className="space-y-2">
                <div className="w-40 h-4 rounded bg-[#DFEBE5]" />
                <div className="w-28 h-3 rounded bg-[#E8F2ED]" />
              </div>
            </div>
            <div className="w-24 h-9 rounded-xl bg-[#DFEBE5]" />
          </div>
        </div>

        {/* Section 3 Skeleton: Accessibility & Preferences */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-[#DFEBE5] shadow-xs space-y-5">
          <div className="w-48 h-5 rounded-md bg-[#DFEBE5]" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="h-14 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5]" />
            <div className="h-14 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5]" />
            <div className="h-14 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5]" />
            <div className="h-14 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5]" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-14 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5]" />
            <div className="h-14 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5]" />
          </div>
        </div>
      </div>
    </div>
  );
}

