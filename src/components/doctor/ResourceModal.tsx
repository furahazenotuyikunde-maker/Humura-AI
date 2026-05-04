
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, FileText, Shield, ChevronRight, 
  BookOpen, Lock, Scale, CheckCircle2,
  AlertTriangle, Globe, HeartPulse
} from 'lucide-react';

interface ResourceModalProps {
  type: 'guidelines' | 'privacy' | null;
  isOpen: boolean;
  onClose: () => void;
  isRw: boolean;
}

export default function ResourceModal({ type, isOpen, onClose, isRw }: ResourceModalProps) {
  if (!type) return null;

  const content = {
    guidelines: {
      title: isRw ? 'Amabwiriza y\'ubuvuzi' : 'Clinical Guidelines',
      icon: <FileText className="text-emerald-600" size={24} />,
      sections: [
        {
          title: isRw ? 'Uburyo bwa CBT' : 'CBT Framework',
          icon: <BookOpen size={18} />,
          items: [
            isRw ? 'Gusesengura imitekerereze yikubita (Cognitive Reframing)' : 'Cognitive Reframing techniques for depression',
            isRw ? 'Imyitozo yo kuruhuka (Behavioral Activation)' : 'Behavioral Activation schedules for low energy',
            isRw ? 'Gukemura ibibazo (Problem Solving Therapy)' : 'Structured Problem Solving Therapy steps'
          ]
        },
        {
          title: isRw ? 'Uburyo bwo gutabara' : 'Crisis Intervention',
          icon: <AlertTriangle size={18} />,
          items: [
            isRw ? 'Gukora gahunda y\'umutekano (Safety Planning)' : 'Immediate Safety Planning for suicidal ideation',
            isRw ? 'Uburyo bwa De-escalation' : 'De-escalation protocols for acute agitation',
            isRw ? 'Kohereza ku bindi bitaro' : 'Referral pathways to Ndera Neuropsychiatric Hospital'
          ]
        },
        {
          title: isRw ? 'Ibisabwa mu Rwanda' : 'Rwanda MHC Protocols',
          icon: <Globe size={18} />,
          items: [
            isRw ? 'Amabwiriza ya Minisante' : 'MoH Mental Health Strategic Plan compliance',
            isRw ? 'Uburyo bwo gukorana n\'abajyanama b\'ubuzima' : 'Integration with Community Health Workers',
            isRw ? 'Imiti yemewe mu Rwanda' : 'Rwanda Essential Medicines List for Psychiatry'
          ]
        }
      ]
    },
    privacy: {
      title: isRw ? 'Umutekano w\'Amakuru' : 'Privacy & Security Protocol',
      icon: <Shield className="text-emerald-600" size={24} />,
      sections: [
        {
          title: isRw ? 'Kurinda amakuru' : 'Data Protection',
          icon: <Lock size={18} />,
          items: [
            isRw ? 'AES-256 mu kubika amakuru' : 'End-to-end AES-256 encryption for session data',
            isRw ? 'Kumenya uwinjiye (2FA)' : 'Mandatory Multi-Factor Authentication for providers',
            isRw ? 'Gusiba amakuru burundu' : 'Automated data scrubbing for inactive accounts'
          ]
        },
        {
          title: isRw ? 'Amategeko' : 'Legal Compliance',
          icon: <Scale size={18} />,
          items: [
            isRw ? 'Itegeko ry\'u Rwanda ryo kurinda amakuru' : 'Rwanda Data Protection Law (Law N° 058/2021)',
            isRw ? 'Kubungabunga ibanga ry\'umurwayi' : 'Patient-Provider privilege standards',
            isRw ? 'Ibisabwa na HIPAA/GDPR' : 'International HIPAA and GDPR parity'
          ]
        },
        {
          title: isRw ? 'Ibisabwa mu buvuzi' : 'Clinical Confidentiality',
          icon: <HeartPulse size={18} />,
          items: [
            isRw ? 'Ibisabwa n\'inama y\'abaganga' : 'Rwanda Medical and Dental Council ethics',
            isRw ? 'Imyitwarire kuri videwo' : 'Telemedicine conduct and privacy environment',
            isRw ? 'Gusangira amakuru mu buvuzi' : 'Informed consent for clinical data sharing'
          ]
        }
      ]
    }
  };

  const active = content[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#4A2C1A]/40 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-[#F8F5F2] flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-sm">
                  {active.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[#4A2C1A]">{active.title}</h2>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                    {isRw ? 'Uheruka kuvugururwa' : 'Last Updated'}: May 2026
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-neutral-50 rounded-full transition-colors"
              >
                <X size={24} className="text-neutral-300" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              {active.sections.map((section, idx) => (
                <div key={idx} className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#F8F5F2] text-[#8B5E3C] rounded-xl">
                      {section.icon}
                    </div>
                    <h3 className="text-sm font-black text-[#4A2C1A] uppercase tracking-widest">
                      {section.title}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {section.items.map((item, i) => (
                      <div 
                        key={i} 
                        className="p-5 bg-neutral-50 border border-neutral-100 rounded-2xl flex items-center gap-4 group hover:bg-white hover:border-emerald-100 hover:shadow-md transition-all cursor-default"
                      >
                        <div className="w-6 h-6 rounded-full bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0 group-hover:border-emerald-500 group-hover:bg-emerald-500 transition-colors">
                          <CheckCircle2 size={12} className="text-neutral-200 group-hover:text-white" />
                        </div>
                        <span className="text-sm font-bold text-primary-900 leading-relaxed">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Bottom Note */}
              <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-3xl flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm flex-shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-900 mb-1">
                    {isRw ? 'Ibi ni Amabwiriza yemewe' : 'Official Clinical Resource'}
                  </p>
                  <p className="text-[10px] font-bold text-emerald-600 leading-relaxed opacity-80">
                    {isRw 
                      ? 'Iyi mfashanyigisho yateguwe na Humura AI ifatanyije n\'abahanga mu buzima bwo mu mutwe.' 
                      : 'This documentation is verified for Humura AI Clinical Operations in partnership with mental health specialists.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#F8F5F2] bg-neutral-50 flex justify-end">
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-[#4A2C1A] text-white font-black text-xs uppercase rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                {isRw ? 'Kubyumva' : 'Understood'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
