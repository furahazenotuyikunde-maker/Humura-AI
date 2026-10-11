import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, HeartHandshake, ShieldCheck } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');

  const steps = [
    {
      num: "01",
      icon: <Sparkles size={24} className="text-[#21B48D]" />,
      title_en: "Confidential Check-in",
      title_rw: "Gusangiza uko Umerewe mu Ibanga",
      desc_en: "Log your current emotional state or talk freely with Humura AI in Kinyarwanda or English with complete privacy.",
      desc_rw: "Andika uko umerewe cyangwa uganire na Humura AI mu Kinyarwanda cyangwa Icyongereza mu mutuzo n'ibanga rikomeye."
    },
    {
      num: "02",
      icon: <HeartHandshake size={24} className="text-[#21B48D]" />,
      title_en: "Evidence-Based Guidance",
      title_rw: "Ubufasha bushingiye ku Bumenyi",
      desc_en: "Receive immediate Cognitive Behavioral Therapy (CBT) exercises or match with a certified Rwandan mental health specialist.",
      desc_rw: "Bona imyitozo ya CBT igufasha guhindura imitekerereze cyangwa uhuzwe n’umuganga w’inzobere mu Rwanda."
    },
    {
      num: "03",
      icon: <ShieldCheck size={24} className="text-[#21B48D]" />,
      title_en: "Progress & Lasting Healing",
      title_rw: "Gukira n'Iterambere Rirambye",
      desc_en: "Track your emotional resilience over time with smart insights and continuous clinical support when needed.",
      desc_rw: "Komeza gukurikirana intambwe utera mu buzima bwo mu mutwe n'ubufasha buhoraho bw'inzobere."
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-[#F4F9F6] border-t border-b border-[#E3EFE9] relative scroll-mt-20 sm:scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E5F0EB] text-[#153C32] text-xs font-bold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-[#21B48D]" />
            <span>{isRw ? 'Uko Bikora' : 'How It Works'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#153C32] tracking-tight leading-tight">
            {isRw 
              ? 'Intambwe 3 Zoroshye zo Gutura Umutwaro' 
              : 'Your Journey to Healing in Three Simple Steps'}
          </h2>
          <p className="text-sm sm:text-base text-[#52786D] font-normal mt-3 leading-relaxed">
            {isRw
              ? 'Uburyo bworoshye, butagira igitutu, kandi bwubahiriza ubuzima bwawe bwite kuva ku munsi wa mbere.'
              : 'A secure, non-judgmental pathway to mental wellness designed around your comfort and pace.'}
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((st, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-8 border border-[#DCEBE3] relative shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-13 h-13 rounded-2xl bg-[#E8F3EE] border border-[#21B48D]/30 flex items-center justify-center">
                    {st.icon}
                  </div>
                  <span className="text-3xl font-black text-[#D0E5DC] tracking-tighter">
                    {st.num}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#153C32] mb-2.5">
                  {isRw ? st.title_rw : st.title_en}
                </h3>
                <p className="text-xs text-[#52786D] leading-relaxed font-normal">
                  {isRw ? st.desc_rw : st.desc_en}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default HowItWorksSection;
