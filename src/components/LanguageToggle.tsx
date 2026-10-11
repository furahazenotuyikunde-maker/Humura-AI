import React from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ 
  className = '',
  size = 'md'
}) => {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');

  const setLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    try {
      localStorage.setItem('i18nextLng', lang);
    } catch {
      // ignore
    }
  };

  const padClass = size === 'sm' ? 'px-2.5 py-1 text-[10px]' : 'px-4 py-1.5 text-xs';

  return (
    <div className={`flex items-center bg-[#E5F0EB] p-1 rounded-full border border-[#D6E6DF] shadow-sm select-none ${className}`}>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`${padClass} rounded-full font-semibold transition-all cursor-pointer ${
          !isRw
            ? 'bg-[#153C32] text-white shadow-sm'
            : 'text-[#244A41] hover:text-[#153C32]'
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLanguage('rw')}
        className={`${padClass} rounded-full font-semibold transition-all cursor-pointer ${
          isRw
            ? 'bg-[#153C32] text-white shadow-sm'
            : 'text-[#244A41] hover:text-[#153C32]'
        }`}
      >
        Kinyarwanda
      </button>
    </div>
  );
};

export default LanguageToggle;
