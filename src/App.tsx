import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from './components/Shell';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DoctorDashboard from './pages/DoctorDashboard';
import {
  PatientDashboard,
  AIChatPage,
  BrailleGeneratorPage,
  CommunityPage,
  EducationHubPage,
  EmergencyPage,
  IntakePage,
  MeetProfessionalPage,
  MoodLogPage,
  NotificationsPage,
  ProfessionalsPage,
  ProgressPage,
  SettingsPage,
  SignLanguagePage,
  SupportCentersPage,
  TranslatorPage
} from './pages/patients';
import { ProfessionalShell } from './components/professional/ProfessionalShell';
import {
  DashboardPage as ProfessionalDashboardPage,
  PatientsPage as ProfessionalPatientsPage,
  SessionsPage as ProfessionalSessionsPage,
  AlertsPage as ProfessionalAlertsPage,
  AnalyticsPage as ProfessionalAnalyticsPage,
  VideosPage as ProfessionalVideosPage,
  BraillePage as ProfessionalBraillePage,
  SettingsPage as ProfessionalSettingsPage
} from './pages/professionals';
import { supabase } from './lib/supabaseClient';

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

  if (loading) return null;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Pages */}
        <Route path="/welcome" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />

        {/* Public Auth Pages */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/login" element={<AuthPage />} />

        {/* Root Route: If no session, show Public Landing Page directly. If logged in, redirect to respective dashboard */}
        <Route 
          path="/" 
          element={
            !session 
              ? <LandingPage /> 
              : (role === 'doctor' ? <Navigate to="/professional/dashboard" replace /> : <Navigate to="/patient/dashboard" replace />)
          } 
        />

        {/* ── PATIENT SECTION (domain/patient/...) ── */}
        <Route path="/patient" element={!session ? <Navigate to="/auth" replace /> : <Shell />}>
          <Route index element={<Navigate to="/patient/dashboard" replace />} />
          <Route path="dashboard" element={<PatientDashboard />} />
          <Route path="dashboards" element={<PatientDashboard />} />
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
          <Route path="meet-professional" element={<MeetProfessionalPage />} />
          <Route path="community" element={<CommunityPage />} />
        </Route>

        {/* ── PROFESSIONAL SECTION (domain/professional/...) ── */}
        <Route path="/professional" element={!session ? <Navigate to="/auth" replace /> : <ProfessionalShell />}>
          <Route index element={<Navigate to="/professional/dashboard" replace />} />
          <Route path="dashboard" element={<ProfessionalDashboardPage />} />
          <Route path="dashboards" element={<ProfessionalDashboardPage />} />
          <Route path="patients" element={<ProfessionalPatientsPage />} />
          <Route path="sessions" element={<ProfessionalSessionsPage />} />
          <Route path="alerts" element={<ProfessionalAlertsPage />} />
          <Route path="analytics" element={<ProfessionalAnalyticsPage />} />
          <Route path="videos" element={<ProfessionalVideosPage />} />
          <Route path="braille" element={<ProfessionalBraillePage />} />
          <Route path="settings" element={<ProfessionalSettingsPage />} />
        </Route>

        {/* Legacy flat route redirects to /patient/... */}
        <Route path="/chat" element={<Navigate to="/patient/chat" replace />} />
        <Route path="/education" element={<Navigate to="/patient/education" replace />} />
        <Route path="/centers" element={<Navigate to="/patient/centers" replace />} />
        <Route path="/professionals" element={<Navigate to="/patient/professionals" replace />} />
        <Route path="/progress" element={<Navigate to="/patient/progress" replace />} />
        <Route path="/notifications" element={<Navigate to="/patient/notifications" replace />} />
        <Route path="/sign-language" element={<Navigate to="/patient/sign-language" replace />} />
        <Route path="/emergency" element={<Navigate to="/patient/emergency" replace />} />
        <Route path="/braille" element={<Navigate to="/patient/braille" replace />} />
        <Route path="/translator" element={<Navigate to="/patient/translator" replace />} />
        <Route path="/settings" element={<Navigate to="/patient/settings" replace />} />
        <Route path="/intake" element={<Navigate to="/patient/intake" replace />} />
        <Route path="/mood" element={<Navigate to="/patient/mood" replace />} />
        <Route path="/meet-professional" element={<Navigate to="/patient/meet-professional" replace />} />
        <Route path="/community" element={<Navigate to="/patient/community" replace />} />

        {/* Legacy Doctor route redirect */}
        <Route path="/doctor" element={<Navigate to="/professional/dashboard" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
