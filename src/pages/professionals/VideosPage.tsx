import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, PlayCircle, Plus, X, Trash2, Loader2, 
  ExternalLink, Search, Filter, Sparkles, CheckCircle2, Film
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

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

export default function VideosPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRw = i18n.language?.startsWith('rw');

  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [videos, setVideos] = useState<ProfVideo[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Video Playing Modal
  const [playingVideo, setPlayingVideo] = useState<ProfVideo | null>(null);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title_en: '',
    title_rw: '',
    description_en: '',
    description_rw: '',
    video_url: '',
    category: 'Therapy & CBT'
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setDoctorId(user.id);

      const { data, error } = await supabase
        .from('professional_videos')
        .select(`
          *,
          profiles:professional_id(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback fetch
        const { data: fallbackData } = await supabase
          .from('professional_videos')
          .select('*')
          .order('created_at', { ascending: false });
        setVideos(fallbackData || []);
      } else {
        setVideos(data || []);
      }
    } catch (err: any) {
      console.error(err);
      showToast(isRw ? 'Gushaka amashusho byanze' : 'Failed to load video library', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId || !form.video_url || !form.title_en) {
      showToast(isRw ? 'Uzuza ibisabwa byose' : 'Please fill all required fields', 'error');
      return;
    }

    setUploading(true);
    try {
      // Auto generate thumbnail if youtube
      let thumb = '';
      if (form.video_url.includes('youtube.com/watch?v=')) {
        const id = form.video_url.split('v=')[1]?.split('&')[0];
        thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
      } else if (form.video_url.includes('youtu.be/')) {
        const id = form.video_url.split('youtu.be/')[1]?.split('?')[0];
        thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
      }

      const { error } = await supabase
        .from('professional_videos')
        .insert({
          professional_id: doctorId,
          title_en: form.title_en,
          title_rw: form.title_rw || form.title_en,
          description_en: form.description_en,
          description_rw: form.description_rw || form.description_en,
          video_url: form.video_url,
          thumbnail_url: thumb,
          category: form.category
        });

      if (error) throw error;

      showToast(isRw ? 'Ishusho yashyizweho neza' : 'Video published successfully', 'success');
      setShowUploadModal(false);
      setForm({
        title_en: '',
        title_rw: '',
        description_en: '',
        description_rw: '',
        video_url: '',
        category: 'Therapy & CBT'
      });
      fetchVideos();
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm(isRw ? 'Uremeza ko ushaka gusiba iyi video?' : 'Are you sure you want to delete this video?')) return;
    try {
      const { error } = await supabase
        .from('professional_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;
      showToast(isRw ? 'Ishusho yasibwe' : 'Video removed', 'success');
      setVideos(prev => prev.filter(v => v.id !== videoId));
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const categories = [
    { id: 'All', en: 'All Videos', rw: 'Amashusho Yose' },
    { id: 'Therapy & CBT', en: 'Therapy & CBT', rw: 'Ubuvuzi bwa CBT' },
    { id: 'Mindfulness', en: 'Mindfulness & Grounding', rw: 'Guhumeka no Kwituza' },
    { id: 'Trauma Recovery', en: 'Trauma Recovery', rw: 'Gukira Ibikomere' },
    { id: 'Youth & Family', en: 'Youth & Family', rw: 'Urubyiruko n\'Umuryango' }
  ];

  const filteredVideos = videos.filter(v => {
    const matchesCat = activeCategory === 'All' || v.category === activeCategory;
    const title = (isRw ? v.title_rw : v.title_en) || v.title_en || '';
    const desc = (isRw ? v.description_rw : v.description_en) || v.description_en || '';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/').split('&')[0];
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="h-16 bg-white rounded-2xl border border-[#DFEBE5] animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="h-64 bg-white rounded-[2rem] border border-[#DFEBE5] p-5 animate-pulse" />
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

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08352A] tracking-tight">
            {isRw ? 'Isomero ry\'Amashusho y\'Ubuvuzi' : 'Clinical Video Library'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-1">
            {isRw ? 'Amashusho yo kwigisha abarwayi no gukora imyitozo yo gukira' : 'Educational and psychoeducational video resources for patient self-care and therapy'}
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-5 py-3 rounded-2xl bg-[#08352A] hover:bg-[#21B48D] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#08352A]/10 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Plus size={16} />
          <span>{isRw ? 'Shyiraho Video Nshya' : 'Add Educational Video'}</span>
        </button>
      </div>

      {/* ── CATEGORIES & SEARCH ── */}
      <div className="bg-white p-4 sm:p-5 rounded-[2rem] border border-[#DFEBE5] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRw ? 'Shakisha video...' : 'Search clinical videos...'}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[#F4F8F6] border border-[#DFEBE5] text-xs text-[#08352A] placeholder-neutral-400 focus:border-[#21B48D] focus:outline-hidden"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === c.id
                  ? 'bg-[#08352A] text-white shadow-xs'
                  : 'bg-[#F4F8F6] text-neutral-600 hover:bg-[#DFEBE5]'
              }`}
            >
              {isRw ? c.rw : c.en}
            </button>
          ))}
        </div>
      </div>

      {/* ── VIDEO CARDS GRID ── */}
      {filteredVideos.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-[#DFEBE5] p-12 text-center">
          <Film size={48} className="mx-auto text-neutral-300 mb-3" />
          <h3 className="font-extrabold text-base text-[#08352A]">
            {isRw ? 'Nta mashusho arashyirwaho muri iki cyiciro' : 'No videos found in this category'}
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            {isRw ? 'Kanda "Shyiraho Video Nshya" kugira ngo usangize abarwayi ubumenyi.' : 'Click "Add Educational Video" to share psychoeducational resources with patients.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map(video => {
            const title = (isRw ? video.title_rw : video.title_en) || video.title_en;
            const desc = (isRw ? video.description_rw : video.description_en) || video.description_en;
            const isAuthor = video.professional_id === doctorId;

            return (
              <motion.div
                key={video.id}
                whileHover={{ y: -3 }}
                className="group bg-white rounded-[2rem] border border-[#DFEBE5] hover:border-[#21B48D]/50 hover:shadow-xl hover:shadow-[#08352A]/5 transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Video Thumbnail */}
                  <div 
                    onClick={() => setPlayingVideo(video)}
                    className="relative aspect-video bg-[#08352A] overflow-hidden cursor-pointer"
                  >
                    {video.thumbnail_url ? (
                      <img 
                        src={video.thumbnail_url} 
                        alt={title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#08352A] to-[#145C4B]">
                        <Video size={40} className="text-[#21B48D]/60" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 text-[#08352A] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <PlayCircle size={24} className="text-[#21B48D]" />
                      </div>
                    </div>

                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold uppercase tracking-wider">
                      {video.category}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="p-5 space-y-2">
                    <h3 className="font-extrabold text-sm text-[#08352A] line-clamp-1 group-hover:text-[#21B48D] transition-colors">
                      {title}
                    </h3>
                    <p className="text-xs text-neutral-500 font-medium line-clamp-2 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>

                {/* Footer with Creator and Delete */}
                <div className="p-5 pt-0 flex items-center justify-between border-t border-[#DFEBE5] mt-2 pt-3">
                  <span className="text-[10px] font-bold text-neutral-400">
                    By Dr. {video.profiles?.full_name?.split(' ')[0] || 'Clinician'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPlayingVideo(video)}
                      className="text-xs font-bold text-[#21B48D] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isRw ? 'Reba' : 'Watch'}</span>
                      <ExternalLink size={12} />
                    </button>

                    {isAuthor && (
                      <button
                        onClick={() => handleDelete(video.id)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        title="Delete video"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── VIDEO PLAYER MODAL ── */}
      <AnimatePresence>
        {playingVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPlayingVideo(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-3xl bg-black rounded-[2.5rem] overflow-hidden z-10 shadow-2xl border border-white/10"
            >
              <div className="p-4 bg-[#08352A] text-white flex items-center justify-between">
                <h3 className="font-extrabold text-sm line-clamp-1">
                  {(isRw ? playingVideo.title_rw : playingVideo.title_en) || playingVideo.title_en}
                </h3>
                <button onClick={() => setPlayingVideo(null)} className="p-1.5 hover:bg-white/10 rounded-xl text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="relative aspect-video w-full bg-black">
                <iframe
                  src={getEmbedUrl(playingVideo.video_url)}
                  title={playingVideo.title_en}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── UPLOAD VIDEO MODAL ── */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-6 sm:p-8 z-10 shadow-2xl border border-[#DFEBE5] space-y-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-[#08352A]">
                    {isRw ? 'Shyiraho Ishusho Yigisha' : 'Add Psychoeducational Video'}
                  </h3>
                  <p className="text-xs text-neutral-400 font-medium mt-0.5">
                    {isRw ? 'Sangiza abarwayi amashusho yo kubafasha' : 'Share therapy exercises or mindfulness clips'}
                  </p>
                </div>
                <button onClick={() => setShowUploadModal(false)} className="p-2 text-neutral-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                {/* Video URL */}
                <div>
                  <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">
                    {isRw ? 'Aho Video Iherereye (YouTube / Vimeo URL)' : 'Video Link (YouTube / Vimeo / MP4)'}
                  </label>
                  <input
                    type="url"
                    required
                    value={form.video_url}
                    onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-3 rounded-xl bg-[#F4F8F6] border border-[#DFEBE5] text-xs text-[#08352A] font-bold focus:border-[#21B48D] focus:outline-hidden"
                  />
                </div>

                {/* Title EN & RW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">Title (English)</label>
                    <input
                      type="text"
                      required
                      value={form.title_en}
                      onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                      placeholder="e.g. 5-Minute Grounding"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F4F8F6] border border-[#DFEBE5] text-xs text-[#08352A] font-bold focus:border-[#21B48D] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">Umutwe (Kinyarwanda)</label>
                    <input
                      type="text"
                      value={form.title_rw}
                      onChange={(e) => setForm({ ...form, title_rw: e.target.value })}
                      placeholder="Urugero: Kwituza mu minota 5"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F4F8F6] border border-[#DFEBE5] text-xs text-[#08352A] font-bold focus:border-[#21B48D] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F4F8F6] border border-[#DFEBE5] text-xs text-[#08352A] font-bold focus:border-[#21B48D] focus:outline-hidden"
                  >
                    <option value="Therapy & CBT">Therapy & CBT</option>
                    <option value="Mindfulness">Mindfulness & Grounding</option>
                    <option value="Trauma Recovery">Trauma Recovery</option>
                    <option value="Youth & Family">Youth & Family</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={form.description_en}
                    onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                    placeholder="Brief explanation for patients..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F4F8F6] border border-[#DFEBE5] text-xs text-[#08352A] focus:border-[#21B48D] focus:outline-hidden"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 py-3 rounded-xl bg-[#F4F8F6] text-neutral-600 font-bold text-xs uppercase"
                  >
                    {isRw ? 'Kureka' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 py-3 rounded-xl bg-[#08352A] hover:bg-[#21B48D] text-white font-bold text-xs uppercase transition-all disabled:opacity-50"
                  >
                    {uploading ? 'Publishing...' : isRw ? 'Shyiraho' : 'Publish'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
