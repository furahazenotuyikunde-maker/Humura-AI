import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './lib/i18n';
import App from './App.tsx';

// AUDITED — Removed StrictMode to prevent double-firing of effects in development
createRoot(document.getElementById('root')!).render(
  <App />
)


