import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X, ArrowRight } from 'lucide-react';
import { LanguageToggle } from './LanguageToggle';

interface NavbarProps {
  className?: string;
  logoHref?: string;
  contactHref?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  className = '', 
  logoHref = '/',
  contactHref = '/auth?mode=signup&role=patient'
}) => {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const [activeTab, setActiveTab] = useState('#home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const navLinks = [
    { label_en: 'Home', label_rw: 'Ahabanza', href: '#home' },
    { label_en: 'Services', label_rw: 'Serivisi', href: '#services' },
    { label_en: 'How it Works', label_rw: 'Uko Bikora', href: '#how-it-works' },
    { label_en: 'Specialists', label_rw: 'Inzobere', href: '#specialists' },
    { label_en: 'Centers', label_rw: 'Ibitaro', href: '#centers' },
    { label_en: 'FAQ', label_rw: 'Ibibazo', href: '#faq' },
  ];

  // Scroll detection to update sticky bar styling & active indicator
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);

      // Detect active section on scroll
      const sections = ['faq', 'centers', 'specialists', 'how-it-works', 'services', 'home'];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160) {
            setActiveTab(`#${section}`);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTab(href);
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-[#F4F9F6]/95 backdrop-blur-md shadow-md border-b border-[#DCEBE3] py-2.5' 
        : 'bg-[#F4F9F6]/85 backdrop-blur-sm py-3 sm:py-3.5 border-b border-[#E3EFE9]/50'
    } ${className}`}>
      
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <a href={logoHref} className="inline-flex items-center group flex-shrink-0">
          <img
            src="/fixedLogo.png"
            alt="Humura AI"
            className="h-9 sm:h-11 w-auto object-contain transition-transform group-hover:scale-102"
          />
        </a>

        {/* ── SLEEK FLOATING PILL MENU (FIXED ON SCROLL) ── */}
        <nav className="hidden lg:inline-flex items-center bg-[#DDE4E0]/90 backdrop-blur-md p-1.5 rounded-full border border-[#CBD7D1] shadow-sm">
          {navLinks.map((link) => {
            const isActive = activeTab === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(link.href, e)}
                className={`px-3.5 xl:px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#153C32] shadow-sm font-bold'
                    : 'text-[#3E5C52] hover:text-[#153C32] font-semibold'
                }`}
              >
                {isRw ? link.label_rw : link.label_en}
              </a>
            );
          })}

          {/* Right End Pill CTA inside the menu */}
          <a
            href={contactHref}
            className="ml-1 px-4 py-1.5 bg-[#153C32] hover:bg-[#1D4F42] text-white text-xs font-bold rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95 border border-[#153C32]"
          >
            {isRw ? 'Tangira' : 'Get Started'}
          </a>
        </nav>

        {/* Right Section: Language Toggle & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle size="sm" />

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-[#153C32] hover:bg-[#E5F0EB] transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

      </div>

      {/* Mobile Dropdown Pill Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mx-4 mt-2 bg-white/98 backdrop-blur-md rounded-3xl shadow-xl border border-[#DCEBE3] p-4 flex flex-col gap-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(link.href, e)}
              className={`text-xs font-bold py-2 px-3.5 rounded-xl transition-colors ${
                activeTab === link.href
                  ? 'bg-[#153C32] text-white'
                  : 'text-[#153C32] hover:bg-[#F0F7F4]'
              }`}
            >
              {isRw ? link.label_rw : link.label_en}
            </a>
          ))}
          <a
            href={contactHref}
            onClick={() => setMobileMenuOpen(false)}
            className="mt-2 w-full py-2.5 bg-[#21B48D] text-white text-xs font-bold rounded-full flex items-center justify-center gap-1.5 shadow-sm text-center"
          >
            <span>{isRw ? 'Tangira' : 'Get Started'}</span>
            <ArrowRight size={13} />
          </a>
        </div>
      )}
    </header>
  );
};

export default Navbar;
