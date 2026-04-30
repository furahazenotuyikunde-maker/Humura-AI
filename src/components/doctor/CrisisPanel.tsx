import React from 'react';
import { motion } from 'framer-motion';
import { 
  AlertCircle, Phone, MapPin, Send, 
  CheckCircle, ShieldAlert, ExternalLink, Activity
} from 'lucide-react';

const alerts = [
  { 
    id: '1', 
    name: 'Mugisha Eric', 
    triggered: '12m ago', 
    risk: 'high', 
    location: 'Kigali, Gasabo', 
    message: 'I feel like I can\'t breathe and everything is falling apart. Please help.',
    details: 'AI flagged suicidal ideation keywords and high distress score.'
  },
  { 
    id: '2', 
    name: 'Uwase Aline', 
    triggered: '45m ago', 
    risk: 'medium', 
    location: 'Gisenyi, Rubavu', 
    message: 'I haven\'t slept in 3 days. My heart won\'t stop racing.',
    details: 'Persistent physical symptoms of severe panic attack.'
  }
];

export default function CrisisPanel() {
  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-2xl font-black text-primary-900 tracking-tight">Active Crisis Alerts</h2>
            <p className="text-sm font-bold text-primary-400">Immediate response required for these events</p>
         </div>
         <div className="flex gap-2">
            <span className="px-4 py-2 bg-red-100 text-red-600 rounded-xl text-xs font-black uppercase flex items-center gap-2">
               <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
               3 Pending Alerts
            </span>
         </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary-50">
         {alerts.map((alert) => (
            <motion.div 
              key={alert.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] border-2 border-red-50 overflow-hidden shadow-xl shadow-red-500/5 flex flex-col"
            >
               <div className="p-8 space-y-6 flex-1">
                  <div className="flex items-start justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-red-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-red-500/20">
                           {alert.name.charAt(0)}
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-primary-900">{alert.name}</h3>
                           <p className="text-xs font-bold text-red-400 flex items-center gap-1">
                              <AlertCircle size={12} /> {alert.risk.toUpperCase()} RISK ALERT
                           </p>
                        </div>
                     </div>
                     <span className="text-xs font-bold text-primary-300">{alert.triggered}</span>
                  </div>

                  <div className="p-6 bg-red-50/50 rounded-3xl border border-red-100 italic text-sm text-red-800 font-medium leading-relaxed">
                     "{alert.message}"
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center gap-3 text-sm font-bold text-primary-600">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                           <MapPin size={16} />
                        </div>
                        {alert.location}
                     </div>
                     <div className="flex items-start gap-3 text-xs font-medium text-primary-400 bg-neutral-50 p-4 rounded-2xl">
                        <Activity size={16} className="mt-0.5 flex-shrink-0" />
                        <div>
                           <p className="font-black text-primary-900 uppercase text-[8px] tracking-widest mb-1">AI Assessment</p>
                           {alert.details}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="p-6 bg-neutral-50 border-t border-red-50 grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 py-4 bg-red-500 text-white text-xs font-black uppercase rounded-2xl shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                     <Phone size={18} /> Call Patient
                  </button>
                  <button className="flex items-center justify-center gap-2 py-4 bg-white border-2 border-red-100 text-red-600 text-xs font-black uppercase rounded-2xl hover:bg-red-50 transition-all">
                     Alert 114
                  </button>
                  <button className="col-span-2 flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-emerald-500/10 hover:bg-emerald-600 transition-all">
                     <CheckCircle size={16} /> Mark as Resolved
                  </button>
               </div>
            </motion.div>
         ))}
      </div>
    </div>
  );
}
