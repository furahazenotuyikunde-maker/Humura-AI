import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Shell } from './components/Shell';
import Home from './pages/Home';
import AIChatPage from './pages/AIChatPage';
import SignLanguagePage from './pages/SignLanguagePage';
import EducationHubPage from './pages/EducationHubPage';
import SupportCentersPage from './pages/SupportCentersPage';
import CommunityPage from './pages/CommunityPage';
import ProgressPage from './pages/ProgressPage';
import EmergencyPage from './pages/EmergencyPage';
import SettingsPage from './pages/SettingsPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Shell />}>
          <Route index element={<Home />} />
          <Route path="chat" element={<AIChatPage />} />
          <Route path="education" element={<EducationHubPage />} />
          <Route path="centers" element={<SupportCentersPage />} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="sign-language" element={<SignLanguagePage />} />
          <Route path="emergency" element={<EmergencyPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;

