'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

const AuthContext = createContext<{ session: Session | null }>({ session: null });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <html lang="en">
      <body className="bg-slate-950 text-white font-sans antialiased">
        <AuthContext.Provider value={{ session }}>
          <header className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Humura AI</h1>
            <nav className="flex gap-6 text-sm font-medium">
              <a href="/chat" className="hover:text-blue-400 transition-colors">AI Chat</a>
              <a href="/sign" className="hover:text-blue-400 transition-colors">Sign Detect</a>
              <a href="/progress" className="hover:text-blue-400 transition-colors">Progress</a>
            </nav>
            {session ? (
              <button onClick={() => supabase.auth.signOut()} className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition-all">Sign Out</button>
            ) : (
              <div className="text-xs text-white/50">Not Signed In</div>
            )}
          </header>
          <main className="min-h-screen p-8 max-w-5xl mx-auto">
            {children}
          </main>
        </AuthContext.Provider>
      </body>
    </html>
  );
}

export const useAuth = () => useContext(AuthContext);
