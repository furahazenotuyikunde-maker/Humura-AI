import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, User, Shield, Bell, Lock, Globe, 
  Save, Check, AlertCircle, Phone, Mail, Stethoscope,
  Building, Award, LogOut, Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function SettingsPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRw = i18n.language?.startsWith('rw');
  const outletCtx = useOutletContext<{ doctorProfile?: any; isAvailable?: boolean; refreshCounters?: () => void }>() || {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('Clinical Psychologist');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [hospital, setHospital] = useState('');
  const [yearsExp, setYearsExp] = useState('5');
  const [bio, setBio] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [aiAlertsEnabled, setAiAlertsEnabled] = useState(true);

  // Password Update
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchDoctorSettings();
  }, []);

  const fetchDoctorSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUserId(user.id);
      setEmail(user.email || '');

      // 1. Fetch Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setFullName(profile.full_name || '');
        setPhone(profile.phone || '');
      }

      // 2. Fetch Doctor Profile
      const { data: docProf } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (docProf) {
        setSpecialty(docProf.specialisations?.[0] || docProf.specialty || 'Clinical Psychologist');
        setLicenseNumber(docProf.license_number || '');
        setHospital(docProf.hospital || docProf.clinic || 'Kigali Health Center');
        setYearsExp(String(docProf.years_experience || '5'));
        setBio(docProf.bio || '');
        if (docProf.is_available !== undefined) setIsAvailable(docProf.is_available);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);

    try {
      // 1. Update Profiles
      const { error: pErr } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (pErr) throw pErr;

      // 2. Upsert Doctor Profiles
      const { error: dErr } = await supabase
        .from('doctor_profiles')
        .upsert({
          user_id: userId,
          specialisations: [specialty],
          license_number: licenseNumber,
          hospital: hospital,
          years_experience: parseInt(yearsExp) || 0,
          bio: bio,
          is_available: isAvailable,
          last_seen_at: new Date().toISOString()
        });

      if (dErr) throw dErr;

      showToast(isRw ? 'Amakuru yawe yabitswe neza' : 'Settings saved successfully', 'success');
      if (outletCtx.refreshCounters) outletCtx.refreshCounters();
    } catch (err: any) {
      showToast(err.message || 'Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast(isRw ? 'Ijambobanga rigomba kugira inyuguti 6 nibura' : 'Password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast(isRw ? 'Amagambobanga ntabwo ahuye' : 'Passwords do not match', 'error');
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showToast(isRw ? 'Ijambobanga ryahinduwe neza' : 'Password updated successfully', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Password update failed', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      window.location.href = '/welcome';
    } catch {
      window.location.href = '/welcome';
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full">
        <div className="h-16 bg-white rounded-2xl border border-[#DFEBE5] animate-pulse" />
        <div className="h-96 bg-white rounded-[2rem] border border-[#DFEBE5] p-6 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-4xl mx-auto w-full">

      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-xl font-bold text-xs ${
              toast.type === 'success' ? 'bg-[#08352A] text-white border border-[#21B48D]/40' : 'bg-red-600 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08352A] tracking-tight">
          {isRw ? 'Igenamiterere rya Muganga' : 'Clinical & Practice Settings'}
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-1">
          {isRw ? 'Genzura umwirondoro w\'ubuvuzi, gahunda y\'akazi, n\'umutekano' : 'Manage your clinical credentials, caseload availability, and account security'}
        </p>
      </div>

      {/* ── PROFILE & PRACTICE SETTINGS FORM ── */}
      <form onSubmit={handleSaveProfile} className="space-y-6 sm:space-y-8">
        
        {/* Practice Credentials Card */}
        <div className="bg-white rounded-[2rem] border border-[#DFEBE5] p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-[#DFEBE5]">
            <div className="w-10 h-10 rounded-2xl bg-[#08352A] text-[#21B48D] flex items-center justify-center font-bold">
              <Stethoscope size={20} />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-[#08352A]">
                {isRw ? 'Umwirondoro w\'Ubuvuzi' : 'Clinical Credentials & Practice'}
              </h2>
              <p className="text-[11px] text-neutral-400 font-medium">
                {isRw ? 'Amakuru agaragara ku barwayi bawe' : 'Information visible to assigned caseload patients'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Full Name */}
            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1.5">
                {isRw ? 'Amazina Yose' : 'Full Name & Title'}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#F4F8F6] border border-[#DFEBE5] text-xs font-bold text-[#08352A] focus:border-[#21B48D] focus:outline-hidden"
              />
            </div>

            {/* Email (Readonly) */}
            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1.5">
                Email
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-4 py-3 rounded-xl bg-neutral-100 border border-neutral-200 text-xs font-bold text-neutral-400 cursor-not-allowed"
              />
            </div>

            {/* Telephone */}
            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1.5">
                {isRw ? 'Telefoni y\'Akazi' : 'Clinical Phone Number'}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+250 7..."
                className="w-full px-4 py-3 rounded-xl bg-[#F4F8F6] border border-[#DFEBE5] text-xs font-bold text-[#08352A] focus:border-[#21B48D] focus:outline-hidden"
              />
            </div>

            {/* Specialization */}
            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1.5">
                {isRw ? 'Ubuvuzi bw\'Umwihariko' : 'Clinical Specialization'}
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#F4F8F6] border border-[#DFEBE5] text-xs font-bold text-[#08352A] focus:border-[#21B48D] focus:outline-hidden"
              >
                <option value="Clinical Psychologist">Clinical Psychologist</option>
                <option value="Psychiatrist">Psychiatrist</option>
                <option value="Trauma & PTSD Counselor">Trauma & PTSD Counselor</option>
                <option value="Adolescent Psychotherapist">Adolescent Psychotherapist</option>
                <option value="Addiction & Recovery Specialist">Addiction & Recovery Specialist</option>
              </select>
            </div>

            {/* License Number */}
            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1.5">
                {isRw ? 'Inomero y\'Uruhushya rwo Gukora' : 'Medical License / Council ID'}
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="RMP-2024-..."
                className="w-full px-4 py-3 rounded-xl bg-[#F4F8F6] border border-[#DFEBE5] text-xs font-bold text-[#08352A] focus:border-[#21B48D] focus:outline-hidden"
              />
            </div>

            {/* Affiliated Hospital / Center */}
            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1.5">
                {isRw ? 'Ibitaro cyangwa Ikigo ukoramo' : 'Clinic / Hospital Affiliation'}
              </label>
              <input
                type="text"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                placeholder="e.g. Ndera Hospital / Kigali Health Center"
                className="w-full px-4 py-3 rounded-xl bg-[#F4F8F6] border border-[#DFEBE5] text-xs font-bold text-[#08352A] focus:border-[#21B48D] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1.5">
              {isRw ? 'Ibisobanuro ku Bunararibonye' : 'Clinical Biography & Philosophy'}
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Summary of therapeutic approach, CBT background..."
              className="w-full p-4 rounded-xl bg-[#F4F8F6] border border-[#DFEBE5] text-xs font-medium text-[#08352A] focus:border-[#21B48D] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Practice Availability & Real-Time Alerts Card */}
        <div className="bg-white rounded-[2rem] border border-[#DFEBE5] p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-[#DFEBE5]">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-[#08352A]">
                {isRw ? 'Kuboneka no Kwakira Abarwayi' : 'Availability & Practice Status'}
              </h2>
              <p className="text-[11px] text-neutral-400 font-medium">
                {isRw ? 'Hitamo niba ushobora guhita uhura n\'abarwayi' : 'Manage your real-time session visibility'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Availability Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5]">
              <div>
                <h4 className="font-extrabold text-xs text-[#08352A]">
                  {isRw ? 'Niteguye Kwakira Abarwayi (Active Availability)' : 'Accepting Tele-Sessions & New Caseload'}
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {isRw ? 'Garagaza ko uri ku murongo ku barwayi bakeneye ubufasha' : 'When enabled, patients can book appointments with you'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAvailable(!isAvailable)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  isAvailable ? 'bg-[#21B48D]' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAvailable ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* AI Flags Real-Time Alert Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5]">
              <div>
                <h4 className="font-extrabold text-xs text-[#08352A]">
                  {isRw ? 'Kwakira Ibitabaza bya AI Ako Kanya' : 'Real-Time AI Struggle Flag Alerts'}
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {isRw ? 'Bimenyeshwe ako kanya iyo umurwayi agaragaje ikibazo mu kiganiro cya AI' : 'Receive instant notifications when AI detects clinical distress in patient chat'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAiAlertsEnabled(!aiAlertsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  aiAlertsEnabled ? 'bg-[#21B48D]' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    aiAlertsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-2xl bg-[#08352A] hover:bg-[#21B48D] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#08352A]/10 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save size={16} />
              <span>{saving ? 'Saving...' : isRw ? 'Bika Impinduka' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* ── SECURITY: PASSWORD UPDATE CARD ── */}
      <form onSubmit={handleChangePassword} className="bg-white rounded-[2rem] border border-[#DFEBE5] p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex items-center gap-3 pb-3 border-b border-[#DFEBE5]">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Lock size={20} />
          </div>
          <div>
            <h2 className="font-extrabold text-base text-[#08352A]">
              {isRw ? 'Umutekano n\'Ijambobanga' : 'Security & Password'}
            </h2>
            <p className="text-[11px] text-neutral-400 font-medium">
              {isRw ? 'Hindura ijambobanga ry\'urubuga' : 'Update your clinical portal password'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1.5">
              {isRw ? 'Ijambobanga Rishya' : 'New Password'}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-[#F4F8F6] border border-[#DFEBE5] text-xs font-bold text-[#08352A] focus:border-[#21B48D] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1.5">
              {isRw ? 'Subiramo Ijambobanga' : 'Confirm Password'}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-[#F4F8F6] border border-[#DFEBE5] text-xs font-bold text-[#08352A] focus:border-[#21B48D] focus:outline-hidden"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={updatingPassword || !newPassword}
            className="px-6 py-3 rounded-2xl bg-[#08352A] hover:bg-[#21B48D] text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
          >
            {updatingPassword ? 'Updating...' : isRw ? 'Hindura Ijambobanga' : 'Update Password'}
          </button>
        </div>
      </form>

      {/* ── DANGER ZONE CARD ── */}
      <div className="bg-white rounded-[2rem] border border-red-200 p-6 sm:p-8 space-y-4 shadow-xs">
        <h3 className="font-extrabold text-sm text-red-700 uppercase tracking-wider">
          {isRw ? 'Gusoza Umunsi w\'Akazi' : 'Session Sign Out'}
        </h3>
        <p className="text-xs text-neutral-500 leading-relaxed">
          {isRw 
            ? 'Gusohoka mu buryo bwizewe bifunga amashusho n\'ububiko bwose by\'uyu munsi kuri iki gikoresho.' 
            : 'Securely signing out clears all temporary encrypted clinical tokens and ends your active session on this device.'}
        </p>

        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-red-600/20 active:scale-95"
          >
            <LogOut size={16} />
            <span>{isRw ? 'Sohoka mu Buvuzi' : 'Sign Out of Practice'}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
