import React from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Phone, MapPin, ExternalLink, ShieldAlert } from 'lucide-react';

export const CentersSection: React.FC = () => {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');

  const centers = [
    {
      name: "CARAES Ndera Neuropsychiatric Hospital",
      location: "Kigali, Gasabo",
      phone: "+250 788 300 000",
      services_en: "Psychiatric consultation, inpatient & outpatient psychological care, addiction rehabilitation.",
      services_rw: "Gusuzuma indwara zo mu mutwe, ubuvuzi bw'abari mu bitaro n'abataha, no gusubiza mu buzima busanzwe."
    },
    {
      name: "CHUK (University Teaching Hospital of Kigali)",
      location: "Kigali, Nyarugenge",
      phone: "+250 788 384 000",
      services_en: "Specialized clinical psychiatry, trauma care, and multidisciplinary medical support.",
      services_rw: "Ubuvuzi bw'inzobere mu by'ubuzima bwo mu mutwe, guhangana n'ihungabana, n'ubuvuzi rusange."
    },
    {
      name: "Rwanda Biomedical Centre (RBC) Mental Health",
      location: "Kigali, Remera",
      phone: "114 (Toll-Free)",
      services_en: "National psychiatric coordination, public health guidelines, and mental wellness initiatives.",
      services_rw: "Ubuyobozi bw'igihugu bw'ubuzima bwo mu mutwe, amabwiriza y'ubuvuzi, n'ubutabazi bw'igihugu."
    },
    {
      name: "Healthy Minds Rwanda",
      location: "Kigali, Kicukiro",
      phone: "+250 790 003 002",
      services_en: "Community youth counseling, trauma recovery, and psychosocial therapy programs.",
      services_rw: "Inama z'urubyiruko mu muryango, gufasha abahuye n'ihungabana, n'ubuvuzi bw'imyifatire."
    }
  ];

  return (
    <section id="centers" className="py-20 bg-white relative scroll-mt-20 sm:scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E8F3EE] text-[#153C32] text-xs font-bold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-[#21B48D]" />
            <span>{isRw ? 'Ibitaro n’Inzobere' : 'Trusted Centers in Rwanda'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#153C32] tracking-tight leading-tight">
            {isRw 
              ? 'Ibitaro n’Ibigo Byemewe by’Ubuzima bwo mu Mutwe' 
              : 'Verified Rwandan Mental Health Institutions'}
          </h2>
          <p className="text-sm sm:text-base text-[#52786D] font-normal mt-3 leading-relaxed">
            {isRw
              ? 'Dukorana n’ibigo by’ubuvuzi bwo mu mutwe byemewe n’amategeko mu gihugu hose kugira ngo ubone ubuvuzi bunoze.'
              : 'Direct links to certified public and referral healthcare centers across Rwanda.'}
          </p>
        </div>

        {/* Centers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {centers.map((c, i) => (
            <div
              key={i}
              className="bg-[#F8FAF9] rounded-3xl p-6 sm:p-7 border border-[#DCEBE3] hover:border-[#21B48D] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-bold text-base sm:text-lg text-[#153C32]">
                    {c.name}
                  </h3>
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#DCEBE3] flex items-center justify-center text-[#21B48D] flex-shrink-0">
                    <Building2 size={18} />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#52786D] mb-3">
                  <span className="flex items-center gap-1.5 font-medium">
                    <MapPin size={13} className="text-[#21B48D]" /> {c.location}
                  </span>
                  <span className="flex items-center gap-1.5 font-bold text-[#153C32]">
                    <Phone size={13} className="text-[#21B48D]" /> {c.phone}
                  </span>
                </div>

                <p className="text-xs text-[#52786D] leading-relaxed font-normal">
                  {isRw ? c.services_rw : c.services_en}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── CRISIS EMERGENCY CALLOUT BOX ── */}
        <div id="emergency" className="bg-[#153C32] rounded-3xl p-7 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-[#153C32]/10 border border-[#153C32]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#21B48D]/20 border border-[#21B48D]/40 flex items-center justify-center text-[#21B48D] flex-shrink-0">
              <ShieldAlert size={26} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#21B48D] block mb-1">
                {isRw ? 'Ubufasha bwihutirwa mu Rwanda' : 'Emergency Crisis Support'}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                {isRw 
                  ? 'Ukeneye ubufasha bwihuse ako kanya? Hamagara 114' 
                  : 'In Immediate Distress? Call Rwanda Hotline: 114'}
              </h3>
              <p className="text-xs text-[#C6E2D8] mt-1 max-w-xl font-normal">
                {isRw
                  ? 'Umurongo utishyurwa w’igihugu ufasha mu bibazo byihutirwa by’ubuzima bwo mu mutwe n’ihungabana. Ufungura amasaha 24/7.'
                  : 'Toll-free national emergency service provided by Rwanda Biomedical Centre (RBC) for mental health crisis & counseling.'}
              </p>
            </div>
          </div>

          <a
            href="tel:114"
            className="flex-shrink-0 px-8 py-3.5 bg-[#21B48D] hover:bg-[#1CA07C] text-white text-xs sm:text-sm font-black rounded-full shadow-lg shadow-[#21B48D]/25 transition-all cursor-pointer active:scale-95 flex items-center gap-2"
          >
            <Phone size={15} />
            <span>{isRw ? 'Hamagara 114 Ako Kanya' : 'Call 114 Toll-Free'}</span>
          </a>
        </div>

      </div>
    </section>
  );
};

export default CentersSection;
