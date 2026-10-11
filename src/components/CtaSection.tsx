import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, User, Briefcase, Heart } from 'lucide-react';

export const CtaSection: React.FC = () => {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');

  return (
    <section className="py-20 bg-[#F4F9F6] relative overflow-hidden">
      
      {/* Decorative gradient background circles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#21B48D]/10 rounded-full blur-3xl pointer-events-none -z-5" />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E5F0EB] text-[#153C32] text-xs font-bold uppercase tracking-wider mb-5">
          <Heart size={13} className="text-[#21B48D] fill-current" />
          <span>{isRw ? 'Urugendo Rwawe Rutangire Uyu Munsi' : 'Begin Your Healing Journey Today'}</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black text-[#153C32] tracking-tight leading-tight mb-4">
          {isRw 
            ? 'Umutuzo w’Imitekerereze yawe Uri mu Biganza Byawe' 
            : 'Your Mental Wellness Matters. We Are Here For You.'}
        </h2>

        <p className="text-sm sm:text-base text-[#52786D] leading-relaxed max-w-xl mx-auto mb-9 font-normal">
          {isRw
            ? 'Tangira ikiganiro cyizewe kandi cy’ibanga na Humura AI, cyangwa winjire nk’umuganga w’inzobere mu buvuzi bwo mu mutwe.'
            : 'Start a free, confidential conversation with Humura AI, or access the clinical professional portal to support patients.'}
        </p>

        {/* Dual Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="/auth?mode=signup&role=patient"
            className="px-8 py-4 bg-[#153C32] hover:bg-[#1D4F42] text-white text-xs sm:text-sm font-bold rounded-full shadow-lg shadow-[#153C32]/20 hover:shadow-xl transition-all cursor-pointer active:scale-95 flex items-center gap-2.5 border border-[#153C32]"
          >
            <User size={16} className="text-[#21B48D]" />
            <span>{isRw ? 'Tangira Ubu (Ubuntu)' : 'Start Free Session'}</span>
            <ArrowRight size={15} />
          </a>

          <a
            href="/auth?mode=login&role=doctor"
            className="px-8 py-4 bg-white hover:bg-[#F9FCFA] border border-[#CFDFD7] hover:border-[#21B48D] text-[#153C32] text-xs sm:text-sm font-bold rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-2.5"
          >
            <Briefcase size={16} className="text-[#21B48D]" />
            <span>{isRw ? 'Injira nk’Inzobere' : "I'm a Professional"}</span>
          </a>
        </div>

      </div>
    </section>
  );
};

export default CtaSection;
