import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from './components/Shell';
import Home from './pages/Home';
import AIChatPage from './pages/AIChatPage';
import SignLanguagePage from './pages/SignLanguagePage';
import EducationHubPage from './pages/EducationHubPage';
import SupportCentersPage from './pages/SupportCentersPage';
import CommunityPage from './pages/CommunityPage';
import ProgressPage from './pages/ProgressPage';
import EmergencyPage from './pages/EmergencyPage';
import ProfessionalsPage from './pages/ProfessionalsPage';
import SettingsPage from './pages/SettingsPage';
import BrailleGeneratorPage from './pages/BrailleGeneratorPage';
import NotificationsPage from './pages/NotificationsPage';
import TranslatorPage from './pages/TranslatorPage';
import AuthPage from './pages/AuthPage';
import DoctorDashboard from './pages/DoctorDashboard';
import IntakePage from './pages/IntakePage';
import MoodLogPage from './pages/MoodLogPage';
import LandingPage from './pages/LandingPage';
import { supabase } from './lib/supabaseClient';
import { useEffect, useState } from 'react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
    setRole(data?.role || 'patient');
    setLoading(false);
  };

  if (loading) return null; // Or a splash screen

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          !session ? <LandingPage /> : 
          role === 'doctor' ? <Navigate to="/doctor" replace /> : <Shell />
        }>
          <Route index element={<Home />} />
          <Route path="chat" element={<AIChatPage />} />
          <Route path="education" element={<EducationHubPage />} />
          <Route path="centers" element={<SupportCentersPage />} />
          <Route path="professionals" element={<ProfessionalsPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="sign-language" element={<SignLanguagePage />} />
          <Route path="emergency" element={<EmergencyPage />} />
          <Route path="braille" element={<BrailleGeneratorPage />} />
          <Route path="translator" element={<TranslatorPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="intake" element={<IntakePage />} />
          <Route path="mood" element={<MoodLogPage />} />
        </Route>
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/welcome" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;


