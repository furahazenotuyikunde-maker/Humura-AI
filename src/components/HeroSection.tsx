import React from 'react';
import { useTranslation } from 'react-i18next';
import { HeartPulse, Video, ShieldCheck, ArrowRight, Activity, PhoneCall } from 'lucide-react';

interface HeroSectionProps {
  className?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ className = '' }) => {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');

  return (
    <section id="home" className={`relative pt-24 sm:pt-28 pb-16 overflow-hidden ${className}`}>
      
      {/* ── SUBTLE GEOMETRIC / MOLECULAR BACKGROUND WATERMARK ── */}
      <div className="absolute inset-0 pointer-events-none opacity-20 -z-10 overflow-hidden">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hex-pattern" width="60" height="103.923" patternUnits="userSpaceOnUse" patternTransform="scale(1)">
              <path
                d="M30 0 L60 17.32 L60 51.96 L30 69.28 L0 51.96 L0 17.32 Z M30 103.92 L60 86.6 L60 51.96 L30 69.28 L0 51.96 L0 86.6 Z"
                fill="none"
                stroke="#21B48D"
                strokeWidth="1"
                strokeOpacity="0.3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hex-pattern)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* ── TOP HERO ROW: CONTENT (LEFT) & DOCTOR WITH ORBITS (RIGHT) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center min-h-[500px]">
          
          {/* LEFT COLUMN: Headings, Badge & Actions */}
          <div className="lg:col-span-7 flex flex-col justify-center z-10">
            
            {/* #1 Medical Center / Health Platform Badge */}
            <div className="inline-flex items-center gap-2.5 mb-5 w-fit">
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#153C32]">
                {isRw ? '#1 Urubuga rw’Ubuzima bwo mu Mutwe' : '#1 Mental Health Platform'}
              </span>
              <div className="flex items-center gap-1 bg-[#153C32] px-2 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#21B48D] animate-pulse" />
                <span className="w-3.5 h-1.5 rounded-full bg-white/80" />
              </div>
            </div>

            {/* Giant High-Impact Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black tracking-tight text-[#153C32] leading-[1.08] mb-5">
              {isRw ? 'TWITA CYANE KU' : 'WE CARE ABOUT'} <br />
              <span className="text-[#21B48D]">
                {isRw ? 'BUZIMA BWAWE' : 'YOUR MENTAL HEALTH'}
              </span>
            </h1>

            {/* Accurate Humura AI Description */}
            <p className="text-[#35534A] text-sm sm:text-base leading-relaxed max-w-xl mb-8 font-normal">
              {isRw
                ? 'Urubuga rwigenga mu ndimi ebyiri rutanga ubufasha bwa CBT buri gihe, kumenya ururimi rw’amarenga, inyandiko za Braille, no guhuzwa n’abaganga b’inzobere mu Rwanda.'
                : 'A bilingual AI-powered mental health ecosystem providing compassionate CBT support, sign language recognition, Braille accessibility, and certified Rwandan clinical consultations.'}
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 sm:gap-4">
              <a
                href="/auth?mode=signup&role=patient"
                className="px-7 py-3.5 bg-[#153C32] hover:bg-[#1D4F42] text-white text-xs sm:text-sm font-bold rounded-full shadow-lg shadow-[#153C32]/20 hover:shadow-xl transition-all cursor-pointer active:scale-95 border border-[#153C32] flex items-center gap-2"
              >
                <span>{isRw ? 'Tangira Ubufasha' : 'Get An Appointment'}</span>
                <ArrowRight size={15} className="text-[#21B48D]" />
              </a>

              <a
                href="#services"
                className="px-7 py-3.5 bg-[#21B48D] hover:bg-[#1B9B78] text-white text-xs sm:text-sm font-bold rounded-full shadow-lg shadow-[#21B48D]/20 hover:shadow-xl transition-all cursor-pointer active:scale-95"
              >
                {isRw ? 'Menya Byinshi' : 'Explore Services'}
              </a>
            </div>

          </div>

          {/* RIGHT COLUMN: Doctor Portrait with Orbiting Circular Badges */}
          <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end py-6">
            
            {/* Visual Container */}
            <div className="relative w-[300px] sm:w-[360px] lg:w-[400px] h-[340px] sm:h-[400px] lg:h-[430px] flex items-center justify-center">
              
              {/* Curved Orbiting Ring (SVG background arc) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none -z-5" viewBox="0 0 400 400">
                <path
                  d="M 60 220 A 150 150 0 1 1 340 260"
                  fill="none"
                  stroke="#153C32"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="4 6"
                  opacity="0.35"
                />
                <circle cx="200" cy="200" r="170" fill="none" stroke="#21B48D" strokeWidth="2" opacity="0.25" strokeDasharray="8 8" />
              </svg>

              {/* Doctor Cutout / Portrait Frame */}
              <div className="w-[240px] sm:w-[280px] lg:w-[310px] h-[300px] sm:h-[360px] lg:h-[390px] rounded-b-[3rem] rounded-t-[7rem] overflow-hidden shadow-2xl shadow-[#153C32]/15 border-4 border-white bg-white relative z-10">
                <img
                  src="/doctor-hero.jpg"
                  alt="Doctor with Stethoscope"
                  className="w-full h-full object-cover object-top hover:scale-103 transition-transform duration-500"
                />
              </div>

              {/* ── CIRCULAR STAT BADGE 1: Left Orbit (24/7 AI CBT) ── */}
              <div className="absolute top-[32%] -left-3 sm:-left-6 z-20 flex flex-col items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#153C32] text-white shadow-xl ring-4 ring-[#21B48D] ring-offset-2 ring-offset-white animate-bounce-slow">
                <span className="text-lg sm:text-xl font-black leading-tight">24/7</span>
                <span className="text-[9px] sm:text-[10px] font-bold text-[#88E4CB] text-center px-2 leading-tight">
                  {isRw ? 'Ubufasha bwa AI' : 'AI CBT Companion'}
                </span>
              </div>

              {/* ── CIRCULAR STAT BADGE 2: Top Right Orbit (100+ Specialists) ── */}
              <div className="absolute top-[8%] -right-2 sm:-right-4 z-20 flex flex-col items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#21B48D] text-white shadow-xl ring-4 ring-[#153C32] ring-offset-2 ring-offset-white">
                <span className="text-lg sm:text-xl font-black leading-tight">100+</span>
                <span className="text-[9px] sm:text-[10px] font-bold text-white/95 text-center px-2 leading-tight">
                  {isRw ? 'Inzobere n’Ibitaro' : 'Doctors & Centers'}
                </span>
              </div>

              {/* ── CIRCULAR STAT BADGE 3: Bottom Right Orbit (Hotline 114) ── */}
              <div className="absolute bottom-[6%] right-0 sm:right-2 z-20 flex flex-col items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#153C32] text-white shadow-xl ring-4 ring-[#21B48D] ring-offset-2 ring-offset-white">
                <span className="text-lg sm:text-xl font-black leading-tight">114</span>
                <span className="text-[9px] sm:text-[10px] font-bold text-[#88E4CB] text-center px-2 leading-tight">
                  {isRw ? 'Ubutabazi bwihuse' : 'Crisis Hotline'}
                </span>
              </div>

            </div>

          </div>

        </div>

        {/* ── FLOATING SERVICES STRIP (UNDER HERO) ── */}
        <div className="mt-14 bg-white rounded-3xl shadow-[0_20px_50px_-15px_rgba(21,60,50,0.08)] border border-[#DCEBE3] p-6 lg:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative z-20">
          
          {/* Card 1: Empathetic CBT */}
          <div className="flex items-start gap-4">
            <div className="w-13 h-13 rounded-2xl bg-[#E8F3EE] border border-[#21B48D]/30 flex items-center justify-center flex-shrink-0 text-[#21B48D]">
              <HeartPulse size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-[#153C32] text-base mb-1">
                {isRw ? 'Ubufasha bwa CBT' : 'Empathetic CBT Chat'}
              </h3>
              <p className="text-xs text-[#52786D] leading-relaxed">
                {isRw
                  ? 'Ibiganiro biyobowe n’ubuhanga bwa AI mu Kinyarwanda no mu Cyongereza amasaha 24/7.'
                  : 'AI-guided Cognitive Behavioral Therapy available 24/7 in Kinyarwanda & English.'}
              </p>
            </div>
          </div>

          {/* Card 2: Clinical Telehealth */}
          <div className="flex items-start gap-4 border-t md:border-t-0 md:border-l border-[#E6EFEA] pt-4 md:pt-0 md:pl-6 lg:pl-8">
            <div className="w-13 h-13 rounded-2xl bg-[#E8F3EE] border border-[#21B48D]/30 flex items-center justify-center flex-shrink-0 text-[#21B48D]">
              <Video size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-[#153C32] text-base mb-1">
                {isRw ? 'Guhura n’Inzobere' : 'Clinical Telehealth'}
              </h3>
              <p className="text-xs text-[#52786D] leading-relaxed">
                {isRw
                  ? 'Guhuza abahanga b’inzobere mu buvuzi bwo mu mutwe mu byumba by’amashusho bitekanye.'
                  : 'Consultations, encrypted video rooms, and caseload tracking with licensed therapists.'}
              </p>
            </div>
          </div>

          {/* Card 3: Inclusive Accessibility */}
          <div className="flex items-start gap-4 border-t md:border-t-0 md:border-l border-[#E6EFEA] pt-4 md:pt-0 md:pl-6 lg:pl-8">
            <div className="w-13 h-13 rounded-2xl bg-[#E8F3EE] border border-[#21B48D]/30 flex items-center justify-center flex-shrink-0 text-[#21B48D]">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-[#153C32] text-base mb-1">
                {isRw ? 'Ubuvuzi Bworoheye Bose' : 'Inclusive Accessibility'}
              </h3>
              <p className="text-xs text-[#52786D] leading-relaxed">
                {isRw
                  ? 'Kumenya ururimi rw’amarenga na AI no guhindura inyandiko za Braille ku batabona.'
                  : 'Sign language vision detection AI and tactile Braille converter for full inclusivity.'}
              </p>
            </div>
          </div>

        </div>

      </div>

    </section>
  );
};

export default HeroSection;
