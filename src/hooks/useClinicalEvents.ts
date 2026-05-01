import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

export interface HandshakeEvent {
  bookingId: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed';
  token?: string;
}

export function useClinicalEvents(userId: string | undefined, role: 'patient' | 'doctor') {
  const [activeSession, setActiveSession] = useState<HandshakeEvent | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Listen to the sessions table for changes relevant to this user
    const channel = supabase
      .channel(`clinical_workspace:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: role === 'doctor' ? `doctor_id=eq.${userId}` : `patient_id=eq.${userId}`
        },
        (payload) => {
          const { id, status, session_token, doctor_id, patient_id } = payload.new as any;
          
          setActiveSession({
            bookingId: id,
            status,
            token: session_token
          });

          // Visual Feedback / Notifications
          if (status === 'pending' && role === 'doctor') {
            toast.success('New Booking Request Received!', { icon: '📅' });
          }
          
          if (status === 'confirmed') {
            toast.success(role === 'doctor' ? 'Session Confirmed!' : 'Professional Accepted your request!', {
              duration: 5000,
              icon: '🚀'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, role]);

  return { activeSession, setActiveSession };
}
