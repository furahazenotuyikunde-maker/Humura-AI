import React, { useState } from 'react';
import { 
  Search, Filter, Plus, MoreVertical, ChevronRight, 
  MapPin, Phone, Calendar, Heart, ShieldAlert,
  Download, FileText, Activity, Users, X, Check, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import jsPDF from 'jspdf';

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

interface PatientManagementProps {
  patients?: Patient[];
  doctorId?: string;
  onRefresh?: () => void;
}

export default function PatientManagement({ patients = [], doctorId, onRefresh }: PatientManagementProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Add Patient Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQueryModal, setSearchQueryModal] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  
  // Options Dropdown State
  const [showOptions, setShowOptions] = useState(false);

  // Edit Profile State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Partial<Patient>>({});
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filteredPatients = patients.filter(p => {
    const name = p.name || '';
    const location = p.location || '';
    const diagnosis = p.diagnosis || '';
    const query = searchQuery.toLowerCase();
    
    return name.toLowerCase().includes(query) ||
           location.toLowerCase().includes(query) ||
           diagnosis.toLowerCase().includes(query);
  });

  const handleSearchPatients = async (query: string) => {
    setSearchQueryModal(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Search for patients in profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, location')
        .eq('role', 'patient')
        .ilike('full_name', `%${query}%`)
        .limit(5);

      if (error) throw error;
      
      // Filter out patients who are already in the list
      const currentPatientIds = patients.map(p => p.id);
      setSearchResults(data.filter(p => !currentPatientIds.includes(p.id)));
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddPatient = async (patient: any) => {
    if (!doctorId) {
      showToast("Error: Doctor ID not found");
      return;
    }

    setIsAdding(patient.id);
    try {
      const response = await fetch(`${import.meta.env.VITE_RENDER_BACKEND_URL}/api/patients/assign-doctor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          doctorId: doctorId
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add patient");

      showToast(`Successfully added ${patient.full_name} to your caseload`);
      setShowAddModal(false);
      setSearchQueryModal('');
      setSearchResults([]);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setIsAdding(null);
    }
  };

  const handleSaveProfile = async () => {
    if (!editingPatient.id) return;
    setIsSaving(true);
    try {
      if (editingPatient.location !== undefined) {
        await supabase
          .from('profiles')
          .update({ location: editingPatient.location })
          .eq('id', editingPatient.id);
      }
      
      const patientUpdates: any = {};
      if (editingPatient.diagnosis !== undefined) patientUpdates.primary_concern = editingPatient.diagnosis;
      if (editingPatient.status !== undefined) patientUpdates.status = editingPatient.status;

      if (Object.keys(patientUpdates).length > 0) {
        await supabase
          .from('patients')
          .update(patientUpdates)
          .eq('id', editingPatient.id);
      }

      showToast("Profile updated successfully!");
      setShowEditModal(false);
      
      if (selectedPatient && selectedPatient.id === editingPatient.id) {
        setSelectedPatient({ ...selectedPatient, ...editingPatient as Patient });
      }

      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!selectedPatient) return;
    showToast("Downloading clinical record...");
    
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); // Primary color
    doc.text("Humura AI - Clinical Record", 20, 25);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Patient Name: ${selectedPatient.name}`, 20, 45);
    doc.text(`Patient ID: HUM-${selectedPatient.id}`, 20, 55);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Age: ${selectedPatient.age || 'N/A'} years`, 20, 75);
    doc.text(`Location: ${selectedPatient.location || 'N/A'}`, 20, 85);
    doc.text(`Risk Level: ${(selectedPatient.risk || 'low').toUpperCase()}`, 20, 95);
    doc.text(`Current Diagnosis: ${selectedPatient.diagnosis || 'N/A'}`, 20, 105);
    doc.text(`Status: ${selectedPatient.status || 'Active'}`, 20, 115);
    doc.text(`Disability Accommodations: ${selectedPatient.disability || 'None'}`, 20, 125);
    
    doc.setDrawColor(226, 232, 240); // border color
    doc.line(20, 140, 190, 140);
    
    doc.setFont("helvetica", "bold");
    doc.text("Notes / Progress Summary:", 20, 155);
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175);
    doc.text(`Generated by Humura AI on ${new Date().toLocaleString()}`, 20, 280);
    
    doc.save(`Humura_Record_${selectedPatient.name.replace(/\s+/g, '_')}.pdf`);
  };

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
          <button 
            onClick={() => showToast("Filters coming soon...")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-primary-50 rounded-2xl text-sm font-bold text-primary-700 hover:bg-primary-50 transition-all"
          >
            <Filter size={18} />
            Filters
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
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
                onClick={() => { setSelectedPatient(patient); setShowOptions(false); }}
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
                  <button 
                    onClick={handleDownloadPdf}
                    className="p-3 bg-neutral-50 text-primary-400 rounded-2xl hover:text-primary transition-colors"
                  >
                    <Download size={20} />
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setShowOptions(!showOptions)}
                      className="p-3 bg-neutral-50 text-primary-400 rounded-2xl hover:text-primary transition-colors"
                    >
                      <MoreVertical size={20} />
                    </button>
                    {showOptions && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-primary-50 overflow-hidden z-10 py-2">
                        <button onClick={() => { setEditingPatient(selectedPatient || {}); setShowEditModal(true); setShowOptions(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-primary-900 hover:bg-primary-50 transition-colors">Edit Profile</button>
                        <button onClick={() => { showToast("Discharge clicked"); setShowOptions(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-primary-900 hover:bg-primary-50 transition-colors">Discharge Patient</button>
                        <div className="h-px bg-primary-50 my-1"></div>
                        <button onClick={() => { showToast("Removed from caseload"); setShowOptions(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors">Remove from Caseload</button>
                      </div>
                    )}
                  </div>
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

      {/* Add Patient Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-primary-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-primary-50 p-8 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-primary-900">Add New Patient</h3>
                  <p className="text-xs font-bold text-primary-400">Search for patients to add to your caseload</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-3 bg-neutral-50 text-primary-400 rounded-2xl hover:bg-primary-50 hover:text-primary transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by full name..."
                    autoFocus
                    value={searchQueryModal}
                    onChange={(e) => handleSearchPatients(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-neutral-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl outline-none transition-all font-bold"
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 size={18} className="animate-spin text-primary" />
                    </div>
                  )}
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                  {searchResults.length > 0 ? (
                    searchResults.map((result) => (
                      <div 
                        key={result.id}
                        className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-transparent hover:border-primary/10 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase">
                            {result.full_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-primary-900">{result.full_name}</p>
                            <p className="text-[10px] font-bold text-primary-400 uppercase tracking-tighter">Patient · {result.location || 'Rwanda'}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleAddPatient(result)}
                          disabled={isAdding === result.id}
                          className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase rounded-xl hover:scale-105 transition-all disabled:opacity-50"
                        >
                          {isAdding === result.id ? <Loader2 size={14} className="animate-spin" /> : 'Add Patient'}
                        </button>
                      </div>
                    ))
                  ) : searchQueryModal && !isSearching ? (
                    <div className="text-center py-10 opacity-50">
                      <Users size={32} className="mx-auto mb-2" />
                      <p className="text-xs font-bold uppercase tracking-widest">No matching patients found</p>
                    </div>
                  ) : (
                    <div className="text-center py-10 opacity-30">
                      <Search size={32} className="mx-auto mb-2" />
                      <p className="text-xs font-bold uppercase tracking-widest">Start typing to search</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Patient Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-primary-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-primary-50 p-8 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-primary-900">Edit Profile</h3>
                  <p className="text-xs font-bold text-primary-400">Update clinical information for {editingPatient.name}</p>
                </div>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="p-3 bg-neutral-50 text-primary-400 rounded-2xl hover:bg-primary-50 hover:text-primary transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-primary-300 uppercase mb-1">Diagnosis</label>
                  <input 
                    type="text" 
                    value={editingPatient.diagnosis || ''} 
                    onChange={e => setEditingPatient({...editingPatient, diagnosis: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-50 border-2 border-transparent focus:border-primary/20 rounded-xl outline-none font-bold text-primary-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-primary-300 uppercase mb-1">Location</label>
                  <input 
                    type="text" 
                    value={editingPatient.location || ''} 
                    onChange={e => setEditingPatient({...editingPatient, location: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-50 border-2 border-transparent focus:border-primary/20 rounded-xl outline-none font-bold text-primary-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-primary-300 uppercase mb-1">Risk Level</label>
                  <select 
                    value={editingPatient.risk || 'low'} 
                    onChange={e => setEditingPatient({...editingPatient, risk: e.target.value as any})}
                    className="w-full px-4 py-3 bg-neutral-50 border-2 border-transparent focus:border-primary/20 rounded-xl outline-none font-bold text-primary-900"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-primary-300 uppercase mb-1">Status</label>
                  <select 
                    value={editingPatient.status || 'active'} 
                    onChange={e => setEditingPatient({...editingPatient, status: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-50 border-2 border-transparent focus:border-primary/20 rounded-xl outline-none font-bold text-primary-900"
                  >
                    <option value="active">Active</option>
                    <option value="discharged">Discharged</option>
                  </select>
                </div>

                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full mt-6 px-6 py-4 bg-primary text-white text-sm font-black uppercase rounded-2xl hover:scale-[1.02] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Internal Toast */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[150] px-6 py-3 bg-primary-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl animate-bounce">
          {toast}
        </div>
      )}
    </div>
  );
}
