import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X, Video, User } from 'lucide-react';

interface IncomingCallProps {
  doctorName: string;
  onAccept: () => void;
  onDecline: () => void;
}

const IncomingCall: React.FC<IncomingCallProps> = ({ doctorName, onAccept, onDecline }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-neutral-100 p-8 z-[110] overflow-hidden"
    >
      {/* Background Pulse */}
      <div className="absolute inset-0 bg-primary/5 animate-pulse" />
      
      <div className="relative z-10 space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-700 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-primary/20">
              {doctorName?.charAt(0) || <User />}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center text-white">
              <Video size={14} />
            </div>
          </div>
          
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Incoming Live Session</p>
            <h3 className="text-xl font-black text-neutral-900">{doctorName}</h3>
            <p className="text-xs font-bold text-neutral-400">Your mental health professional is calling...</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={onDecline}
            className="flex-1 py-4 bg-neutral-100 text-neutral-500 font-black text-xs uppercase rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center gap-2"
          >
            <X size={18} />
            Decline
          </button>
          
          <button 
            onClick={onAccept}
            className="flex-1 py-4 bg-primary text-white font-black text-xs uppercase rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Phone size={18} className="animate-bounce" />
            Join Now
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default IncomingCall;
