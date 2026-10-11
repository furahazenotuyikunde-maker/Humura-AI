import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Lock } from 'lucide-react';

interface TrustBadgesProps {
  className?: string;
}

export const TrustBadges: React.FC<TrustBadgesProps> = ({ className = '' }) => {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');

  return (
    <div className={`space-y-2 text-xs text-[#436A5F] ${className}`}>
      <div className="flex items-center gap-2">
        <Globe size={15} className="text-[#436A5F] flex-shrink-0" />
        <span className="font-medium">English | Kinyarwanda</span>
      </div>
      <div className="flex items-center gap-2">
        <Lock size={14} className="text-[#436A5F] flex-shrink-0" />
        <span className="font-medium">
          {isRw
            ? 'Ibiganiro byawe ni ibanga kandi bicunzwe neza.'
            : 'Your conversations are private and handled with care.'}
        </span>
      </div>
    </div>
  );
};

export default TrustBadges;
