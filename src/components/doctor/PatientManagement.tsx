import React, { useState } from 'react';
import { 
  Search, Filter, Plus, MoreVertical, ChevronRight, 
  MapPin, Phone, Calendar, Heart, ShieldAlert,
  Download, FileText, Activity, Users
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Patient {
  id: string;
  name: string;
  age?: number;
  location?: string;
  risk?: 'low' | 'medium' | 'high';
  status: string;
  disability?: string;
  diagnosis?: string;
}

export default function PatientManagement({ patients = [] }: { patients?: Patient[] }) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, ID, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-primary-50 rounded-2xl text-sm focus:border-primary/50 outline-none transition-all"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-primary-50 rounded-2xl text-sm font-bold text-primary-700 hover:bg-primary-50 transition-all">
            <Filter size={18} />
            Filters
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all">
            <Plus size={18} />
            Add Patient
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-8 min-h-0">
        {/* Patient List */}
        <div className="xl:col-span-2 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-primary-100">
          {filteredPatients.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-10 bg-neutral-50 rounded-[2.5rem] border-2 border-dashed border-primary-100">
              <Users size={32} className="text-primary-100 mb-4" />
              <p className="text-primary-300 font-bold text-sm">No patients found</p>
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <motion.button
                key={patient.id}
                whileHover={{ x: 5 }}
                onClick={() => setSelectedPatient(patient)}
                className={`w-full glass-card p-5 rounded-3xl flex items-center gap-4 text-left transition-all border-2 ${
                  selectedPatient?.id === patient.id ? 'border-primary bg-primary/5 shadow-inner' : 'border-transparent'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center text-2xl font-black text-primary">
                  {patient.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-primary-900 truncate">{patient.name}</h3>
                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-full ${
                      patient.risk === 'high' ? 'bg-red-100 text-red-600' : 
                      patient.risk === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {patient.risk || 'low'} risk
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-primary-400 font-bold">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {patient.location || 'Kigali'}</span>
                    <span className="flex items-center gap-1"><Activity size={12} /> {patient.diagnosis || 'Active'}</span>
                  </div>
                </div>
                <ChevronRight size={20} className={selectedPatient?.id === patient.id ? 'text-primary' : 'text-primary-100'} />
              </motion.button>
            ))
          )}
        </div>

        {/* Detail Panel */}
        <div className="hidden xl:block">
          {selectedPatient ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[2.5rem] border border-primary-50 p-8 shadow-2xl shadow-primary/5 h-full flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="w-20 h-20 rounded-3xl bg-primary-50 flex items-center justify-center text-4xl">
                   {selectedPatient.disability === 'Deaf' ? '🤟' : selectedPatient.disability === 'Blind' ? '👨‍🦯' : '👤'}
                </div>
                <div className="flex gap-2">
                  <button className="p-3 bg-neutral-50 text-primary-400 rounded-2xl hover:text-primary transition-colors">
                    <Download size={20} />
                  </button>
                  <button className="p-3 bg-neutral-50 text-primary-400 rounded-2xl hover:text-primary transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-6 flex-1">
                <div>
                  <h2 className="text-2xl font-black text-primary-900">{selectedPatient.name}</h2>
                  <p className="text-sm font-bold text-primary-400">Patient ID: HUM-{selectedPatient.id}9023</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-neutral-50 rounded-2xl">
                    <p className="text-[10px] font-black text-primary-300 uppercase mb-1">Age</p>
                    <p className="font-bold text-primary-900">{selectedPatient.age} years</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-2xl">
                    <p className="text-[10px] font-black text-primary-300 uppercase mb-1">Location</p>
                    <p className="font-bold text-primary-900">{selectedPatient.location}, RW</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Current Diagnosis</p>
                      <p className="text-sm font-bold text-primary-900">{selectedPatient.diagnosis}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary flex items-center justify-center flex-shrink-0">
                      <Activity size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest">CBT Program</p>
                      <p className="text-sm font-bold text-primary-900">Anxiety & Exposure Therapy (60%)</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-primary-50">
                   <h3 className="text-xs font-black text-primary-900 uppercase tracking-widest mb-3">Quick Actions</h3>
                   <div className="grid grid-cols-2 gap-3">
                     <button className="py-3 bg-primary text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-primary/20">Start Session</button>
                     <button className="py-3 bg-white border border-primary-200 text-primary text-[10px] font-black uppercase rounded-xl">View History</button>
                   </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-neutral-50 rounded-[2.5rem] border-2 border-dashed border-primary-100">
              <Users size={48} className="text-primary-100 mb-4" />
              <p className="text-primary-300 font-bold">Select a patient to view detailed clinical records</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
