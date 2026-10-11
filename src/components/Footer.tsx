import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MessageCircle, Globe, Shield, CheckCircle2, Zap, Server, Cpu, Eye,
  Facebook, Twitter, Instagram, Linkedin
} from 'lucide-react';

interface FooterProps {
  showRibbon?: boolean;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ showRibbon = true, className = '' }) => {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setNewsletterEmail('');
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* ── OPTIONAL TOP BANNER RIBBON ── */}
      {showRibbon && (
        <div className="w-full bg-[#133830] text-white py-3.5 px-6 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium tracking-wide relative z-20 border-b border-[#18463C]">
          <svg
            className="w-4 h-4 text-[#35D0A1] flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 20h10" />
            <path d="M10 20c5.5-2.5.8-6.4 3-13" />
            <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4-.1 5.5.8z" />
            <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.4 1.7-4.6-2.7.1-4.2.9-4.9 2z" />
          </svg>
          <span>
            {isRw
              ? 'Ubuzima bwo mu mutwe bwiza • Ejo hazaza heza'
              : 'Better mental health • Brighter futures'}
          </span>
        </div>
      )}

      {/* ── DETAILED LANDSCAPE FOOTER ── */}
      <footer className="bg-[#0C2620] text-white pt-12 pb-8 px-6 sm:px-10 lg:px-16 border-t border-[#16372E] relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            
            {/* 1. Brand Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-md border border-white p-1.5">
                  <img src="/fixedLogo.png" alt="Humura AI" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-lg font-bold tracking-tight text-white">Humura AI</h3>
              </div>
              <p className="text-[#83A098] text-xs leading-relaxed font-medium">
                {isRw
                  ? 'Urubuga rw’ubuzima bwo mu mutwe mu ndimi ebyiri rutanga ubufasha bwuzuye — rwubaka ikiraro cy’ubuzima bwiza mu muryango nyarwanda wose.'
                  : 'A bilingual mental health ecosystem providing inclusive and empathetic support — bridging the wellness gap for the entire Rwandan community.'}
              </p>
            </div>

            {/* 2. Core Services Column */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-[#21B48D] tracking-[0.2em]">
                {isRw ? 'Serivisi z’Imena' : 'Core Services'}
              </h4>
              <ul className="space-y-2.5 text-[11px] font-medium text-[#E2EEEC]">
                <li className="flex items-start gap-2.5 hover:text-[#21B48D] cursor-pointer transition-colors">
                  <MessageCircle size={14} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-80" />
                  {isRw ? 'Ubufasha bwa CBT bwuje impuhwe' : 'Empathetic CBT therapy'}
                </li>
                <li className="flex items-start gap-2.5 hover:text-[#21B48D] cursor-pointer transition-colors">
                  <Globe size={14} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-80" />
                  {isRw ? 'Ururimi rw’amarenga' : 'Sign language support'}
                </li>
                <li className="flex items-start gap-2.5 hover:text-[#21B48D] cursor-pointer transition-colors">
                  <Shield size={14} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-80" />
                  {isRw ? 'Inyandiko za Braille' : 'Braille document tool'}
                </li>
                <li className="flex items-start gap-2.5 hover:text-[#21B48D] cursor-pointer transition-colors">
                  <Globe size={14} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-80" />
                  {isRw ? 'Usemura mu Kinyarwanda n’Icyongereza' : 'Bilingual translator'}
                </li>
                <li className="flex items-start gap-2.5 hover:text-[#21B48D] cursor-pointer transition-colors">
                  <CheckCircle2 size={14} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-80" />
                  {isRw ? 'Isesengura ry’iterambere rya AI' : 'AI progress insights'}
                </li>
                <li className="flex items-start gap-2.5 hover:text-[#21B48D] cursor-pointer transition-colors">
                  <Zap size={14} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-80" />
                  {isRw ? 'Ubufasha bwihuse (114)' : 'Emergency help (114)'}
                </li>
              </ul>
            </div>

            {/* 3. Innovations Column */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-[#21B48D] tracking-[0.2em]">
                {isRw ? 'Ikoranabuhanga' : 'Innovations'}
              </h4>
              <ul className="space-y-2.5 text-[11px] font-medium text-[#E2EEEC]">
                <li className="flex items-start gap-2.5">
                  <Server size={14} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-80" />
                  Vite, React & Supabase
                </li>
                <li className="flex items-start gap-2.5">
                  <CloudLightningIcon size={14} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-80" />
                  Render cloud service
                </li>
                <li className="flex items-start gap-2.5">
                  <Cpu size={14} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-80" />
                  Gemini 3 Flash & 1.5 Flash
                </li>
                <li className="flex items-start gap-2.5">
                  <Server size={14} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-80" />
                  Supabase Edge Functions
                </li>
                <li className="flex items-start gap-2.5">
                  <Eye size={14} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-80" />
                  {isRw ? 'Kumenya amarenga na AI' : 'Sign language vision AI'}
                </li>
                <li className="flex items-start gap-2.5">
                  <MessageCircle size={14} className="text-[#21B48D] mt-0.5 flex-shrink-0 opacity-80" />
                  {isRw ? 'Kwibuka ibiganiro k’ubufatanye' : 'Multi-turn AI memory'}
                </li>
              </ul>
            </div>

            {/* 4. Community Voices Column */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-[#21B48D] tracking-[0.2em]">
                {isRw ? 'Ijwi ry’Umuryango' : 'Community Voices'}
              </h4>
              <div className="space-y-3">
                <div className="bg-[#12322A] border border-[#1C453A] rounded-xl p-3">
                  <p className="italic text-[11px] text-[#E2EEEC]">
                    {isRw
                      ? '"Uru rubuga rwamfashije kubona icyerekezo gishya mu buzima."'
                      : '"This platform gave me a new perspective on life."'}
                  </p>
                  <p className="text-[9px] font-black uppercase text-[#21B48D] tracking-wider mt-1.5">
                    — {isRw ? 'UMURYANGO' : 'COMMUNITY'}
                  </p>
                </div>
                <div className="bg-[#12322A] border border-[#1C453A] rounded-xl p-3">
                  <p className="italic text-[11px] text-[#E2EEEC]">
                    {isRw
                      ? '"Iri koranabuhanga ryahinduye byinshi mu muryango wacu."'
                      : '"The technology has made a difference for our family."'}
                  </p>
                  <p className="text-[9px] font-black uppercase text-[#21B48D] tracking-wider mt-1.5">
                    — {isRw ? 'ABAKIRI BATO' : 'FAMILY'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Divider & Newsletter Subscription Bar */}
          <div className="py-6 border-t border-[#16372E] flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="space-y-0.5 text-center md:text-left">
              <h5 className="font-bold text-xs text-[#E2EEEC]">
                {isRw ? 'Guma hafi ya Humura AI' : 'Stay connected with Humura AI'}
              </h5>
              <p className="text-[#83A098] text-[10px]">
                {isRw ? 'Amakuru mashya ku bikorwa n’ubufasha.' : 'Updates on features and community news.'}
              </p>
            </div>
            
            <form onSubmit={handleSubscribe} className="w-full md:w-auto flex gap-2 bg-white rounded-xl overflow-hidden p-1 pr-1.5 max-w-sm">
              <input 
                type="email" 
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                placeholder={isRw ? "Imeli yawe" : "Email address"}
                className="flex-1 px-3 py-1.5 bg-transparent outline-none text-slate-800 text-xs font-medium placeholder:text-slate-400 w-full md:w-48"
                required
              />
              <button 
                type="submit" 
                className="bg-[#0C2620] hover:bg-[#12322A] text-[#21B48D] px-3.5 py-1.5 rounded-lg text-[10px] font-black transition-colors cursor-pointer"
              >
                {subscribed ? (isRw ? 'Bikozwe!' : 'Joined!') : (isRw ? 'Iyandikishe' : 'Subscribe')}
              </button>
            </form>
          </div>

          {/* Final Bottom Bar */}
          <div className="border-t border-[#16372E] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#5F7C74]">
              © {new Date().getFullYear()} HUMURA AI · MIND SUPPORTED, LIFE EMPOWERED
            </p>
            <div className="flex items-center gap-3">
              <SocialIcon Icon={Facebook} href="https://facebook.com" />
              <SocialIcon Icon={Twitter} href="https://twitter.com" />
              <SocialIcon Icon={Instagram} href="https://instagram.com" />
              <SocialIcon Icon={Linkedin} href="https://linkedin.com" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;

const CloudLightningIcon = ({ size, className }: { size: number, className: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" />
    <path d="m13 12-3 5h4l-3 5" />
  </svg>
);

const SocialIcon = ({ Icon, href }: { Icon: any, href: string }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noreferrer"
    className="w-7 h-7 rounded-lg bg-[#16372E] border border-[#1F4B3F] flex items-center justify-center text-[#83A098] hover:text-[#21B48D] hover:border-[#21B48D] transition-all cursor-pointer"
  >
    <Icon size={12} />
  </a>
);
