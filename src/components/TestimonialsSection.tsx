import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Quote, CheckCircle2, Heart } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface TestimonialItem {
  id: string;
  author: string;
  location: string;
  content_en: string;
  content_rw: string;
  tag: string;
  likes: number;
}

// In-memory cache for zero-flicker re-rendering
let cachedTestimonials: TestimonialItem[] | null = null;

export const TestimonialsSection: React.FC = () => {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');

  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(() => cachedTestimonials || []);
  const [loading, setLoading] = useState<boolean>(!cachedTestimonials);

  useEffect(() => {
    let isMounted = true;

    const loadTestimonials = async () => {
      try {
        const { data, error } = await supabase
          .from('community_posts')
          .select('*')
          .eq('circle_id', 'community-testimonials')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && isMounted) {
          const formatted: TestimonialItem[] = data.map((item) => {
            // Split author and location if separated by bullet
            const parts = (item.author || '').split('•');
            const authorName = (parts[0] || 'Community Member').trim();
            const locationName = (parts[1] || 'Rwanda').trim();

            return {
              id: item.id,
              author: authorName,
              location: locationName,
              content_en: item.content,
              content_rw: item.content_rw || item.content,
              tag: item.tag || 'Community Voice',
              likes: item.likes || 45
            };
          });

          cachedTestimonials = formatted;
          setTestimonials(formatted);
        }
      } catch (err) {
        console.error('Failed to load community voices:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTestimonials();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="py-20 bg-[#F4F9F6] border-t border-[#E3EFE9] relative font-poppins">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E5F0EB] text-[#153C32] text-xs font-bold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-[#21B48D]" />
            <span>{isRw ? 'Ubuhamya bw’Abanyarwanda' : 'Community Voices'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#153C32] tracking-tight leading-tight">
            {isRw 
              ? 'Ubuhamya bw’Ubuzima Bwahindutse binyuze muri Humura AI' 
              : 'Real Stories of Healing Across Rwanda'}
          </h2>
          <p className="text-sm text-[#52786D] mt-2 font-normal leading-relaxed">
            {isRw
              ? 'Abantu batandukanye babonye umutuzo n’ubuvuzi bunoze binyuze mu ikoranabuhanga ryacu ryizewe.'
              : 'Empowering individuals, students, and families across Rwanda with accessible, culturally-grounded mental healthcare.'}
          </p>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {loading && testimonials.length === 0 ? (
            /* ── Skeleton Loading State ── */
            Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-7 border border-[#DCEBE3] animate-pulse flex flex-col justify-between space-y-6 shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-24 h-4 bg-[#E8F3EE] rounded-md" />
                    <div className="w-20 h-5 bg-[#E8F3EE] rounded-full" />
                  </div>
                  <div className="w-8 h-8 bg-[#E8F3EE] rounded-lg mb-4" />
                  <div className="w-full h-4 bg-[#F4F8F6] rounded-md mb-2" />
                  <div className="w-full h-4 bg-[#F4F8F6] rounded-md mb-2" />
                  <div className="w-4/5 h-4 bg-[#F4F8F6] rounded-md" />
                </div>
                <div className="border-t border-[#F0F5F2] pt-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E8F3EE]" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-24 h-4 bg-[#E8F3EE] rounded-md" />
                    <div className="w-32 h-3 bg-[#F4F8F6] rounded-md" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            testimonials.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-7 border border-[#DCEBE3] hover:border-[#21B48D] transition-all hover:shadow-lg flex flex-col justify-between relative group"
              >
                <div>
                  {/* Rating Stars & Tag */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-1 text-[#21B48D]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className="fill-current text-[#21B48D]" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-[#153C32] bg-[#E8F3EE] px-2.5 py-0.5 rounded-full">
                      {item.tag}
                    </span>
                  </div>

                  {/* Quote Icon */}
                  <Quote size={24} className="text-[#21B48D]/30 mb-3" />

                  {/* Body Text */}
                  <p className="text-xs sm:text-sm text-[#3E5C52] leading-relaxed mb-6 font-normal">
                    "{isRw ? item.content_rw : item.content_en}"
                  </p>
                </div>

                {/* Author footer */}
                <div className="border-t border-[#F0F5F2] pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#153C32] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {item.author.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-[#153C32]">{item.author}</span>
                        <CheckCircle2 size={12} className="text-[#21B48D]" />
                      </div>
                      <p className="text-[11px] text-[#71968B] font-medium">
                        {item.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-semibold text-[#8DB4A8]">
                    <Heart size={12} className="text-[#21B48D] fill-current" />
                    <span>{item.likes}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </section>
  );
};

export default TestimonialsSection;
