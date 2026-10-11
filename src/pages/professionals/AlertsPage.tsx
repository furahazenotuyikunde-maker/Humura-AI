import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, ShieldAlert, Phone, CheckCircle2, Clock, 
  MapPin, Bot, Sparkles, Filter, ChevronRight, Activity,
  Search, Check, RefreshCw, Volume2, ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function AlertsPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRw = i18n.language?.startsWith('rw');
  const outletCtx = useOutletContext<{ doctorProfile?: any; isAvailable?: boolean; refreshCounters?: () => void }>() || {};

  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'ai_tasks' | 'sos' | 'resolved'>('all');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchAlerts();

    // Subscribe to realtime changes on crisis_events
    const channel = supabase
      .channel('alerts-page-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crisis_events' }, () => {
        fetchAlerts();
        if (outletCtx.refreshCounters) outletCtx.refreshCounters();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setDoctorId(user.id);

      const { data, error } = await supabase
        .from('crisis_events')
        .select(`
          *,
          patient:profiles!patient_id(id, full_name, phone, location, avatar_url)
        `)
        .order('triggered_at', { ascending: false });

      if (error) {
        // Fallback fetch
        const { data: fallbackData } = await supabase
          .from('crisis_events')
          .select('*')
          .order('triggered_at', { ascending: false });
        setAlerts(fallbackData || []);
      } else {
        setAlerts(data || []);
      }
    } catch (err: any) {
      console.error(err);
      showToast(isRw ? 'Gushaka ibitabaza byanze' : 'Failed to fetch clinical alerts', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Mark Alert as Resolved
  const handleResolve = async (alertId: string) => {
    if (!doctorId) return;
    setResolvingId(alertId);
    try {
      const { error } = await supabase
        .from('crisis_events')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: doctorId
        })
        .eq('id', alertId);

      if (error) throw error;

      showToast(isRw ? 'Ikibazo cyakemutse neza' : 'Alert marked as resolved', 'success');
      fetchAlerts();
      if (outletCtx.refreshCounters) outletCtx.refreshCounters();
    } catch (err: any) {
      showToast(err.message || 'Resolution failed', 'error');
    } finally {
      setResolvingId(null);
    }
  };

  // Filter logic
  const filteredAlerts = alerts.filter(a => {
    const isResolved = !!a.resolved_at || a.status === 'resolved';
    const isAi = a.trigger_reason?.toLowerCase().includes('ai') || 
                 a.notes?.toLowerCase().includes('ai') || 
                 a.notes?.toLowerCase().includes('struggle') ||
                 a.event_type === 'ai_task';
    const isSos = a.event_type === 'sos' || a.trigger_reason?.toLowerCase().includes('sos');

    // Filter by tab
    if (filter === 'resolved') {
      if (!isResolved) return false;
    } else {
      if (isResolved) return false;
      if (filter === 'ai_tasks' && !isAi) return false;
      if (filter === 'sos' && !isSos) return false;
    }

    // Search query
    const patientName = a.patient?.full_name || '';
    const content = (a.trigger_reason || '') + ' ' + (a.notes || '');
    return patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const unresolvedCount = alerts.filter(a => !a.resolved_at && a.status !== 'resolved').length;
  const aiTasksCount = alerts.filter(a => (!a.resolved_at && a.status !== 'resolved') && (a.trigger_reason?.includes('AI') || a.notes?.includes('struggle'))).length;

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="h-16 bg-white rounded-2xl border border-[#DFEBE5] animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-36 bg-white rounded-[2rem] border border-[#DFEBE5] p-6 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">

      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-xl font-bold text-xs ${
              toast.type === 'success' ? 'bg-[#08352A] text-white border border-[#21B48D]/40' : 'bg-red-600 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER WITH URGENCY BANNER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08352A] tracking-tight">
              {isRw ? 'Ibitabaza n\'Inshingano za AI' : 'Crisis Alerts & AI Clinical Tasks'}
            </h1>
            {unresolvedCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-black uppercase animate-pulse flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                {unresolvedCount} {isRw ? 'Bitegereje' : 'Pending'}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-1">
            {isRw 
              ? 'Ibibazo byagaragaye mu biganiro bya AI n\'ubutabazi bwihuse bwemejwe n\'umurwayi' 
              : 'Real-time distress flags detected by the AI health chatbot and direct patient emergency SOS triggers'}
          </p>
        </div>

        {/* Emergency Hotline 114 Pill */}
        <div className="flex items-center gap-2">
          <a
            href="tel:114"
            className="px-4 py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            title="Rwanda National Medical Helpline"
          >
            <Phone size={15} className="text-red-600" />
            <span>{isRw ? 'Ubutabazi 114 (Rwanda)' : 'National Hotline 114'}</span>
          </a>
        </div>
      </div>

      {/* ── FILTER & SEARCH CONTROLS ── */}
      <div className="bg-white p-4 sm:p-5 rounded-[2rem] border border-[#DFEBE5] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRw ? 'Shakisha umurwayi cyangwa ikibazo...' : 'Search patient or alert message...'}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[#F4F8F6] border border-[#DFEBE5] text-xs text-[#08352A] placeholder-neutral-400 focus:border-[#21B48D] focus:outline-hidden"
          />
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', en: `All Active (${unresolvedCount})`, rw: `Byose (${unresolvedCount})` },
            { id: 'ai_tasks', en: `AI Tasks (${aiTasksCount})`, rw: `Ibya AI (${aiTasksCount})` },
            { id: 'sos', en: 'Emergency SOS', rw: 'Ubutabazi SOS' },
            { id: 'resolved', en: 'Resolved Archive', rw: 'Ibyakemutse' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filter === tab.id
                  ? 'bg-[#08352A] text-white shadow-xs'
                  : 'bg-[#F4F8F6] text-neutral-600 hover:bg-[#DFEBE5]'
              }`}
            >
              {isRw ? tab.rw : tab.en}
            </button>
          ))}
        </div>
      </div>

      {/* ── ALERTS LIST ── */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-[#DFEBE5] p-12 text-center">
          <CheckCircle2 size={48} className="mx-auto text-[#21B48D] mb-3" />
          <h3 className="font-extrabold text-base text-[#08352A]">
            {isRw ? 'Nta bitabaza bihari muri iki cyiciro' : 'No clinical alerts in this category'}
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            {isRw ? 'Abarwayi bose bameze neza. Iyo hagize ikibazo kigaragara muri AI cyangwa SOS birahita biza hano.' : 'All caseload patients are currently stable. Real-time flags will appear instantly.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const patientName = alert.patient?.full_name || 'Patient';
            const patientPhone = alert.patient?.phone;
            const patientLocation = alert.patient?.location || 'Rwanda';
            const isResolved = !!alert.resolved_at || alert.status === 'resolved';

            const isAiTask = alert.trigger_reason?.toLowerCase().includes('ai') || 
                             alert.notes?.toLowerCase().includes('struggle') ||
                             alert.event_type === 'ai_task';

            const timeStr = (alert.triggered_at || alert.created_at) ? new Date(alert.triggered_at || alert.created_at).toLocaleDateString([], {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : 'Recent';

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-[2rem] border transition-all p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                  isResolved
                    ? 'border-[#DFEBE5] opacity-80'
                    : isAiTask
                      ? 'border-[#21B48D]/50 shadow-md shadow-[#21B48D]/5'
                      : 'border-red-200 shadow-md shadow-red-500/5'
                }`}
              >
                {/* Left: Patient Icon and Clinical Issue */}
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 ${
                    isResolved
                      ? 'bg-neutral-100 text-neutral-500'
                      : isAiTask
                        ? 'bg-[#08352A] text-[#21B48D]'
                        : 'bg-red-500 text-white animate-pulse'
                  }`}>
                    {isAiTask ? <Bot size={24} /> : <AlertCircle size={24} />}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-extrabold text-base text-[#08352A]">{patientName}</h3>

                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        isResolved
                          ? 'bg-neutral-200 text-neutral-700'
                          : isAiTask
                            ? 'bg-[#21B48D]/20 text-[#08352A]'
                            : 'bg-red-100 text-red-700'
                      }`}>
                        {isResolved ? (isRw ? 'Byakemutse' : 'Resolved') : isAiTask ? (isRw ? 'AI Chatbot Flag' : 'AI Flagged Struggle') : 'SOS Crisis'}
                      </span>

                      <span className="text-xs text-neutral-400 font-medium flex items-center gap-1">
                        <Clock size={12} /> {timeStr}
                      </span>
                    </div>

                    {/* Patient struggle message / notes */}
                    <div className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                      isAiTask ? 'bg-emerald-50/50 border border-[#21B48D]/20 text-[#08352A]' : 'bg-red-50/60 border border-red-100 text-red-900'
                    }`}>
                      <p className="font-bold italic">
                        "{alert.trigger_reason || alert.notes || alert.message || (alert.risk_level ? `${alert.risk_level.toUpperCase()} risk event at ${alert.location || 'Rwanda'}` : 'Elevated distress reported.')}"
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-neutral-400 font-medium pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {patientLocation}
                      </span>
                      {patientPhone && (
                        <span>• Phone: {patientPhone}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 self-end md:self-center flex-wrap">
                  {patientPhone && (
                    <a
                      href={`tel:${patientPhone}`}
                      className="px-4 py-2.5 rounded-xl bg-[#08352A] hover:bg-[#21B48D] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Direct Call"
                    >
                      <Phone size={14} />
                      <span>{isRw ? 'Hamagara' : 'Call Patient'}</span>
                    </a>
                  )}

                  {!isResolved ? (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      disabled={resolvingId === alert.id}
                      className="px-4 py-2.5 rounded-xl bg-[#21B48D] hover:bg-[#1CA07C] text-[#08352A] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 size={14} />
                      <span>{resolvingId === alert.id ? 'Saving...' : isRw ? 'Kemura' : 'Mark Resolved'}</span>
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-neutral-400 flex items-center gap-1">
                      <Check size={14} /> {isRw ? 'Byakemutse' : 'Concluded'}
                    </span>
                  )}

                  <button
                    onClick={() => navigate('/professional/patients')}
                    className="p-2.5 rounded-xl bg-[#F4F8F6] hover:bg-neutral-100 text-neutral-500 hover:text-[#08352A] transition-all"
                    title={isRw ? 'Reba Dosiye' : 'View Caseload'}
                  >
                    <ExternalLink size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

    </div>
  );
}
