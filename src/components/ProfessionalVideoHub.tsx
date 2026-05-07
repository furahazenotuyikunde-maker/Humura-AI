import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, Plus, X, Video, User, Trash2, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface ProfVideo {
  id: string;
  professional_id: string;
  title_en: string;
  title_rw: string;
  description_en: string;
  description_rw: string;
  video_url: string;
  thumbnail_url: string;
  category: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export default function ProfessionalVideoHub() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language || 'en';
  const isRw = lang.startsWith('rw');

  const [videos, setVideos] = useState<ProfVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProf, setIsProf] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title_en: '',
    title_rw: '',
    description_en: '',
    description_rw: '',
    video_url: '',
    category: 'General'
  });

  useEffect(() => {
    fetchVideos();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan_type, role')
        .eq('id', user.id)
        .single();
      
      if (profile?.plan_type === 'professional' || profile?.role === 'doctor') {
        setIsProf(true);
      }
    }
  };


  const fetchVideos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('professional_videos')
      .select(`
        *,
        profiles:professional_id ( full_name )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setVideos(data);
    }
    setLoading(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUploading(true);

    // Extract YouTube ID if it's a full URL
    let videoId = form.video_url;
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = form.video_url.match(ytRegex);
    if (match) videoId = match[1];

    const { error } = await supabase
      .from('professional_videos')
      .insert([{
        ...form,
        video_url: videoId,
        professional_id: user.id,
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      }]);

    if (!error) {
      setShowUpload(false);
      setForm({
        title_en: '',
        title_rw: '',
        description_en: '',
        description_rw: '',
        video_url: '',
        category: 'General'
      });
      fetchVideos();
    } else {
      alert(error.message);
    }
    setUploading(false);
  };

  const deleteVideo = async (id: string) => {
    if (!window.confirm(isRw ? 'Ushaka gusiba iyi videwo?' : 'Delete this video?')) return;
    const { error } = await supabase.from('professional_videos').delete().eq('id', id);
    if (!error) fetchVideos();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="text-primary" size={24} />
          <h2 className="text-xl font-bold text-primary-900">
            {isRw ? 'Amashusho y\'Inzobere' : 'Professional Videos'}
          </h2>
        </div>
        {isProf ? (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            <Plus size={18} />
            {isRw ? 'Ohereza' : 'Upload'}
          </button>
        ) : !user ? (
          <button
            onClick={() => navigate('/auth?redirect=/education')}
            className="text-[10px] font-bold text-primary hover:underline"
          >
            {isRw ? 'Injira nka muganga ubashe kohereza amashusho' : 'Sign in as a professional to upload'}
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : videos.length === 0 ? (
        <div className="glass-card rounded-3xl p-10 text-center space-y-4">
          <Video size={48} className="mx-auto text-neutral-200" />
          <p className="text-neutral-500 font-medium">
            {isRw ? 'Nta mashusho arahari.' : 'No videos uploaded yet.'}
          </p>
          {isProf && (
            <button
              onClick={() => setShowUpload(true)}
              className="text-primary font-bold hover:underline"
            >
              {isRw ? 'Ba uwa mbere wohereje!' : 'Be the first to upload!'}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map((vid) => (
            <motion.div
              key={vid.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-3xl overflow-hidden flex flex-col group"
            >
              <div className="relative aspect-video bg-black overflow-hidden">
                <img 
                  src={vid.thumbnail_url || `https://img.youtube.com/vi/${vid.video_url}/mqdefault.jpg`} 
                  alt={isRw ? vid.title_rw : vid.title_en}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <a 
                    href={`https://youtube.com/watch?v=${vid.video_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 hover:scale-110 transition-transform"
                  >
                    <PlayCircle size={32} />
                  </a>
                </div>
                <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">
                  {vid.category}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-bold text-primary-900 leading-tight">
                    {isRw ? vid.title_rw : vid.title_en}
                  </h3>
                  {isProf && vid.professional_id === user?.id && (
                    <button 
                      onClick={() => deleteVideo(vid.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-primary-600 line-clamp-2 mb-4">
                  {isRw ? vid.description_rw : vid.description_en}
                </p>
                <div className="mt-auto pt-3 border-t border-primary-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-[10px] font-bold text-primary">
                      {vid.profiles?.full_name?.charAt(0) || 'P'}
                    </div>
                    <span className="text-[10px] font-bold text-primary-700">
                      {vid.profiles?.full_name || (isRw ? 'Inzobere' : 'Professional')}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    {new Date(vid.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowUpload(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-primary-50 flex items-center justify-between bg-primary-50/50">
                <div className="flex items-center gap-2">
                  <Video size={20} className="text-primary" />
                  <h3 className="font-bold text-primary-900">{isRw ? 'Ohereza Videwo' : 'Upload Educational Video'}</h3>
                </div>
                <button onClick={() => setShowUpload(false)} className="p-2 hover:bg-primary-100 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpload} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Title (EN)</label>
                    <input
                      required
                      type="text"
                      value={form.title_en}
                      onChange={e => setForm({...form, title_en: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-primary-50 focus:border-primary focus:ring-0 transition-all text-sm"
                      placeholder="Anxiety Management"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Title (RW)</label>
                    <input
                      required
                      type="text"
                      value={form.title_rw}
                      onChange={e => setForm({...form, title_rw: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-primary-50 focus:border-primary focus:ring-0 transition-all text-sm"
                      placeholder="Gucunga Ubwoba"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">YouTube URL or ID</label>
                  <input
                    required
                    type="text"
                    value={form.video_url}
                    onChange={e => setForm({...form, video_url: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-primary-50 focus:border-primary focus:ring-0 transition-all text-sm"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-primary-50 focus:border-primary focus:ring-0 transition-all text-sm"
                  >
                    <option value="Anxiety">Anxiety</option>
                    <option value="Depression">Depression</option>
                    <option value="Trauma">Trauma</option>
                    <option value="Resilience">Resilience</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Description (EN)</label>
                    <textarea
                      rows={3}
                      value={form.description_en}
                      onChange={e => setForm({...form, description_en: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-primary-50 focus:border-primary focus:ring-0 transition-all text-sm resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">Description (RW)</label>
                    <textarea
                      rows={3}
                      value={form.description_rw}
                      onChange={e => setForm({...form, description_rw: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-primary-50 focus:border-primary focus:ring-0 transition-all text-sm resize-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    disabled={uploading}
                    className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        {isRw ? 'Birajyaho...' : 'Uploading...'}
                      </>
                    ) : (
                      <>
                        <Plus size={20} />
                        {isRw ? 'Ohereza Videwo' : 'Post Video'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
