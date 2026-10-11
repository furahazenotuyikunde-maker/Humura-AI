import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, HelpCircle, PhoneCall, ShieldCheck, ArrowRight } from 'lucide-react';

interface FaqItem {
  question_en: string;
  question_rw: string;
  answer_en: string;
  answer_rw: string;
  category: string;
}

export const FaqSection: React.FC = () => {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      category: "Privacy & Confidentiality",
      question_en: "Is my conversation with Humura AI confidential and secure?",
      question_rw: "Ese ibiganiro byanjye na Humura AI birinzwe mu ibanga?",
      answer_en: "Yes, absolutely. All sessions are encrypted and adhere to strict patient data privacy standards. You can use Humura AI anonymously as a guest without creating an account, or log in securely to save your progress. Your mental health entries are never sold or shared with third parties.",
      answer_rw: "Yego, rwose. Ibiganiro byose birinzwe mu buryo bukomeye bwa tekinoloji (encryption). Ushobora no gukoresha urubuga nk’umushyitsi (guest) utarinze gutanga imyirondoro yawe. Amakuru yawe y’ubuzima ntabwo asangizwa abandi."
    },
    {
      category: "Language & Culture",
      question_en: "Does Humura AI fully understand Kinyarwanda?",
      question_rw: "Ese Humura AI yumva Ikinyarwanda neza mu buryo bwimbitse?",
      answer_en: "Yes. Humura AI is culturally tuned and trained on clinical mental health dialogues in both authentic Kinyarwanda and English. It recognizes nuanced cultural expressions of grief, stress, anxiety, and emotional trauma specific to Rwanda.",
      answer_rw: "Yego. Humura AI yatojwe neza ku rurimi rw'Ikinyarwanda no ku muco nyarwanda mu bijyanye n'ubuzima bwo mu mutwe. Yumva amagambo y’agahinda, umunaniro, n’ibindi bibazo by’imitekerereze ikabisubiza mu rukundo no kubaha."
    },
    {
      category: "Telehealth & Doctors",
      question_en: "How do virtual consultations with licensed specialists work?",
      question_rw: "Gusuzumwa n'abaganga b'inzobere ku mashusho bikora bite?",
      answer_en: "When you book a session with a licensed Rwandan psychiatrist or psychologist on Humura AI, you enter a private, browser-based WebRTC video room. No additional software downloads are needed. Doctors can securely review your clinical timeline and recommend therapy or prescriptions.",
      answer_rw: "Iyo uhisemo kubonana n'umuganga w'inzobere mu Rwanda, uhita uhabwa icyumba cy'amashusho (video call) gitunganyije mu buryo bworoshye. Nta porogaramu yindi ukenera gukuramo, kandi umuganga agufasha mu buryo bwa kinyamwuga."
    },
    {
      category: "Crisis Protocol",
      question_en: "What happens if someone is in immediate danger or severe crisis?",
      question_rw: "Bigenda bite iyo umuntu ari mu kaga gakomeye cyangwa akeneye ubutabazi bwihuse?",
      answer_en: "Humura AI has real-time crisis safety triggers. If thoughts of severe self-harm or emergency distress are detected, the system immediately presents direct one-tap calling to the Rwanda National Mental Health Toll-Free Hotline (114) and verified psychiatric hospitals such as CARAES Ndera.",
      answer_rw: "Humura AI ifite uburyo bwo gutahura ako kanya ibimenyetso by'ubutabazi bwihutirwa. Iyo umuntu ahuye n'ibitekerezo bibi cyane, ahita ahabwa umurongo w'ubutabazi bw'igihugu wa 114 (utishyurwa) n'ibitaro bya CARAES Ndera kugira ngo atabarwe byihuse."
    },
    {
      category: "Accessibility",
      question_en: "How does Humura AI support individuals with sensory disabilities?",
      question_rw: "Ese Humura AI ifasha ite abafite ubumuga bwo kutabona cyangwa kutumva?",
      answer_en: "Humura AI includes integrated Rwanda Sign Language (RSL) computer-vision recognition for deaf users, as well as Grade 1 & Grade 2 Braille text translation and high-contrast accessibility modes for visually impaired users.",
      answer_rw: "Humura AI ifite uburyo bwo gusoma ibimenyetso by'ururimi rw'amarenga yo mu Rwanda (RSL) binyuze muri camera, hamwe no guhindura inyandiko mu nyuguti za Braille z'abatabona kugira ngo buri Munyarwanda wese afashwe."
    }
  ];

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 bg-white border-t border-[#E3EFE9] relative scroll-mt-20 sm:scroll-mt-24">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E8F3EE] text-[#153C32] text-xs font-bold uppercase tracking-wider mb-3">
            <HelpCircle size={13} className="text-[#21B48D]" />
            <span>{isRw ? 'Ibibazo Bikunze Kubazwa' : 'Frequently Asked Questions'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#153C32] tracking-tight leading-tight">
            {isRw 
              ? 'Ibisobanuro ku Mikorere n’Umutekano wa Humura AI' 
              : 'Clear Answers About Humura AI & Your Care'}
          </h2>
          <p className="text-sm text-[#52786D] mt-2 font-normal">
            {isRw
              ? 'Dore ibisubizo ku bibazo bikunze kubazwa ku bijyanye n’ubuzima bwo mu mutwe, ibanga, n’abaganga.'
              : 'Everything you need to know about confidentiality, clinical accuracy, and emergency safety.'}
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen 
                    ? 'border-[#21B48D] bg-[#F4F9F6] shadow-sm' 
                    : 'border-[#DCEBE3] bg-white hover:border-[#CBDCD2]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(idx)}
                  className="w-full text-left px-5 sm:px-7 py-4.5 sm:py-5 flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOpen ? 'bg-[#21B48D]' : 'bg-[#CBDCD2]'}`} />
                    <span className="text-sm sm:text-base font-bold text-[#153C32]">
                      {isRw ? faq.question_rw : faq.question_en}
                    </span>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 bg-[#153C32] text-white' : 'bg-[#EBF3EF] text-[#153C32]'
                  }`}>
                    <ChevronDown size={16} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-7 pb-5 pt-1 text-xs sm:text-sm text-[#52786D] leading-relaxed border-t border-[#E1ECE6]/60 animate-in fade-in duration-200">
                    <p>{isRw ? faq.answer_rw : faq.answer_en}</p>
                    <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-[#21B48D]">
                      <ShieldCheck size={13} />
                      <span>{faq.category}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Hotline Direct Contact Banner */}
        <div className="mt-12 bg-[#F4F9F6] border border-[#DCEBE3] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#153C32] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <PhoneCall size={22} className="text-[#21B48D]" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-extrabold text-[#153C32]">
                {isRw ? 'Ukeneye Ubufasha bw’Ihutirwa?' : 'Need Immediate Help or Live Counseling?'}
              </h4>
              <p className="text-xs text-[#52786D] mt-0.5">
                {isRw 
                  ? 'Hamagara Umurongo w’Igihugu 114 (Utishyurwa) cyangwa utwandikire.' 
                  : 'Call Rwanda Toll-Free 114 anytime or start an instant confidential AI session.'}
              </p>
            </div>
          </div>

          <a
            href="tel:114"
            className="px-6 py-3 bg-[#153C32] hover:bg-[#1D4F42] text-white text-xs font-bold rounded-full flex items-center gap-2 shadow-sm transition-all whitespace-nowrap"
          >
            <span>{isRw ? 'Hamagara 114' : 'Call 114 Toll-Free'}</span>
            <ArrowRight size={14} className="text-[#21B48D]" />
          </a>
        </div>

      </div>
    </section>
  );
};

export default FaqSection;
