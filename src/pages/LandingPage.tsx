import React from 'react';
import { 
  Navbar, 
  HeroSection, 
  FeaturesSection, 
  HowItWorksSection, 
  SpecialistsSection, 
  CentersSection, 
  TestimonialsSection, 
  FaqSection, 
  CtaSection, 
  Footer 
} from '../components';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F4F9F6] text-[#153C32] flex flex-col justify-between selection:bg-[#22B58E] selection:text-white font-poppins relative overflow-x-hidden scroll-smooth">
      {/* ── TOP FLOATING PILL NAVBAR (FIXED ON SCROLL) ── */}
      <Navbar />

      {/* ── MAIN CONTENT SECTIONS ── */}
      <main className="flex-1 w-full">
        {/* ── HERO SECTION WITH DOCTOR PORTRAIT & STAT BADGES ── */}
        <HeroSection />

        {/* ── CORE CAPABILITIES & SERVICES ── */}
        <FeaturesSection />

        {/* ── 3-STEP HEALING PATHWAY ── */}
        <HowItWorksSection />

        {/* ── CERTIFIED CLINICAL SPECIALISTS ── */}
        <SpecialistsSection />

        {/* ── VERIFIED RWANDAN HEALTHCARE INSTITUTIONS & HOTLINE 114 ── */}
        <CentersSection />

        {/* ── COMMUNITY STORIES & TESTIMONIALS ── */}
        <TestimonialsSection />

        {/* ── FREQUENTLY ASKED QUESTIONS ACCORDION ── */}
        <FaqSection />

        {/* ── HIGH-IMPACT FINAL CALL TO ACTION ── */}
        <CtaSection />
      </main>

      {/* ── COMPREHENSIVE LANDSCAPE FOOTER ── */}
      <Footer />
    </div>
  );
}
