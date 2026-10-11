import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ActionCardProps {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
  onClick?: () => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  href,
  title,
  subtitle,
  icon,
  variant = 'primary',
  className = '',
  onClick
}) => {
  const isPrimary = variant === 'primary';

  const containerStyles = isPrimary
    ? 'bg-[#153C32] hover:bg-[#1D4F42] text-white border border-[#153C32] shadow-lg shadow-[#153C32]/15 hover:shadow-[#153C32]/25'
    : 'bg-white hover:bg-[#FAFDFB] border border-[#CFDFD7] hover:border-[#22B58E] text-[#153C32] shadow-sm hover:shadow-md';

  const iconCircleStyles = isPrimary
    ? 'border border-white/20 bg-white/10 text-white'
    : 'border border-[#D9E6E0] bg-[#F1F6F3] text-[#153C32]';

  const titleStyles = isPrimary ? 'text-white' : 'text-[#153C32]';
  const subtitleStyles = isPrimary ? 'text-[#9EC4BA]' : 'text-[#638379]';
  const arrowStyles = isPrimary ? 'text-white' : 'text-[#22B58E]';

  return (
    <a
      href={href}
      onClick={onClick}
      className={`w-full rounded-full py-4 px-6 flex items-center justify-between transition-all group cursor-pointer ${containerStyles} ${className}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${iconCircleStyles}`}>
          {icon}
        </div>
        <div className="text-left">
          <div className={`font-bold text-base leading-tight ${titleStyles}`}>
            {title}
          </div>
          <div className={`text-xs font-normal leading-tight mt-0.5 ${subtitleStyles}`}>
            {subtitle}
          </div>
        </div>
      </div>
      <ArrowRight
        size={20}
        className={`group-hover:translate-x-1.5 transition-transform flex-shrink-0 ml-2 ${arrowStyles}`}
      />
    </a>
  );
};

export default ActionCard;
