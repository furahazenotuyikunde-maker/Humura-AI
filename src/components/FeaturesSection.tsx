import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquareHeart, Video, HandMetal, FileText, LineChart, PhoneCall, ArrowRight } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');

  const services = [
    {
      icon: <MessageSquareHeart size={26} className="text-[#21B48D]" />,
      title_en: "AI Cognitive Behavioral Therapy",
      title_rw: "Ubufasha bwa CBT bwa AI",
      desc_en: "Empathetic, multi-turn CBT guidance trained to listen, validate emotions, and support daily stress in Kinyarwanda or English.",
      desc_rw: "Ibiganiro bya CBT byumva kandi bihumuriza umutima mu Kinyarwanda cyangwa Icyongereza igihe cyose.",
      badge: "24/7 Live",
      href: "/chat"
    },
    {
      icon: <Video size={26} className="text-[#21B48D]" />,
      title_en: "Licensed Telehealth Consultations",
      title_rw: "Gusuzumwa n'Abaganga b'Inzobere",
      desc_en: "Connect with certified Rwandan therapists and psychiatrists via encrypted video rooms and clinical case tracking.",
      desc_rw: "Guhuza n’abaganga b’inzobere mu mutwe mu Rwanda mu byumba by’amashusho bitekanye kandi byizewe.",
      badge: "Clinical Care",
      href: "/auth?role=doctor"
    },
    {
      icon: <HandMetal size={26} className="text-[#21B48D]" />,
      title_en: "Sign Language Recognition",
      title_rw: "Kumenya Ururimi rw’Amarenga",
      desc_en: "Real-time webcam computer vision AI detecting sign language gestures to ensure full accessibility for the deaf community.",
      desc_rw: "Ikoranabuhanga rya AI rireba ibimenyetso by’amarenga kuri camera kugira ngo abafite ubumuga bwo kutumva bafashwe.",
      badge: "Vision AI",
      href: "/auth?role=patient"
    },
    {
      icon: <FileText size={26} className="text-[#21B48D]" />,
      title_en: "Tactile Braille Document Tool",
      title_rw: "Inyandiko za Braille z'Abatabona",
      desc_en: "Instant Grade 1 & Grade 2 Braille translation and printable card generation for visually impaired individuals.",
      desc_rw: "Guhindura inyandiko mu nyuguti za Braille z'abatabona no gukora amakarita asomeka mu buryo bworoshye.",
      badge: "Accessibility",
      href: "/auth?role=patient"
    },
    {
      icon: <LineChart size={26} className="text-[#21B48D]" />,
      title_en: "Mood Intelligence & Tracking",
      title_rw: "Gukurikirana Uko Umeze",
      desc_en: "Log daily moods with 1–5 emotional scoring, view progress trends, and receive personalized daily mental affirmations.",
      desc_rw: "Kwandika uko umerewe buri munsi, kureba intambwe utera, no kubona amagambo agukomeza.",
      badge: "Analytics",
      href: "/auth?role=patient"
    },
    {
      icon: <PhoneCall size={26} className="text-[#21B48D]" />,
      title_en: "Rwanda Crisis Emergency (114)",
      title_rw: "Ubutabazi bw'Ihutirwa (114)",
      desc_en: "Automated crisis keyword detection routing distressed individuals directly to the Rwanda National Mental Health Hotline at 114.",
      desc_rw: "Kumenya niba umuntu ari mu kaga gakomeye no guhita amuhuza n’umurongo w’ubutabazi bw’igihugu 114.",
      badge: "Toll-Free 114",
      href: "#emergency"
    }
  ];

  return (
    <section id="services" className="py-20 bg-white relative scroll-mt-20 sm:scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E8F3EE] text-[#153C32] text-xs font-bold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-[#21B48D]" />
            <span>{isRw ? 'Serivisi Zacu' : 'Our Capabilities'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#153C32] tracking-tight leading-tight">
            {isRw 
              ? 'Serivisi z’Ubuzima bwo mu Mutwe Zateguriwe u Rwanda' 
              : 'Comprehensive Mental Health Services Tailored for Rwanda'}
          </h2>
          <p className="text-sm sm:text-base text-[#52786D] font-normal mt-3 leading-relaxed">
            {isRw
              ? 'Ubuvuzi bugezweho buhuza ubwenge bw’ubukorano bwuje impuhwe, abaganga b’inzobere bemewe, n’uburyo bworoheye buri wese.'
              : 'Evidence-based digital healthcare combining AI empathy, licensed clinical oversight, and radical inclusivity.'}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((svc, i) => (
            <div
              key={i}
              className="bg-[#F9FCFA] rounded-3xl p-7 border border-[#E3EFE9] hover:border-[#21B48D] transition-all hover:shadow-xl hover:shadow-[#153C32]/5 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-[#DCEBE3] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    {svc.icon}
                  </div>
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#E8F3EE] text-[#153C32] border border-[#21B48D]/20">
                    {svc.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#153C32] mb-2 group-hover:text-[#21B48D] transition-colors">
                  {isRw ? svc.title_rw : svc.title_en}
                </h3>
                <p className="text-xs text-[#52786D] leading-relaxed mb-6 font-normal">
                  {isRw ? svc.desc_rw : svc.desc_en}
                </p>
              </div>

              <a
                href={svc.href}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#153C32] group-hover:text-[#21B48D] transition-colors"
              >
                <span>{isRw ? 'Koresha serivisi' : 'Learn more'}</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeaturesSection;
