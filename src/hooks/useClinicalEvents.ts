import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface HandshakeEvent {
  booking_id: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed';
  session_token: string | null;
}

export function useClinicalEvents(userId: string | undefined, role: 'patient' | 'doctor') {
  const [activeSession, setActiveSession] = useState<HandshakeEvent | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Listen for session status changes
    const channel = supabase
      .channel('clinical-handshake')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `${role === 'patient' ? 'patient_id' : 'doctor_id'}=eq.${userId}`
        },
        (payload) => {
          if (payload.new) {
            const updatedSession: HandshakeEvent = {
              booking_id: payload.new.id,
              status: payload.new.status,
              session_token: payload.new.session_token
            };
            setActiveSession(updatedSession);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, role]);

  return { activeSession };
}
