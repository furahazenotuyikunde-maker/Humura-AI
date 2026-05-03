'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../layout';

/**
 * AI Chat Page
 * Features: Gemini 2.5 Flash integration, strict deduplication guards,
 * useRef for history management, and premium dark-mode design.
 */
export default function ChatPage() {
  const [input, setInput] = useState('');
  const [uiMessages, setUiMessages] = useState<{role: string, content: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const STORAGE_KEY = 'humura_chat_history';
  
  // Rule: Conversation history stored in useRef, NOT useState
  const historyRef = useRef<{role: string, content: string}[]>([]);
  // Rule: hard lock isSending
  const isSending = useRef(false);
  // Rule: debounce timer
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Persistence: Load
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUiMessages(parsed);
        historyRef.current = parsed;
      } catch (e) { console.error(e); }
    }
  }, []);

  // Persistence: Save
  useEffect(() => {
    if (uiMessages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(uiMessages));
    }
  }, [uiMessages]);

  const clearHistory = () => {
    if (confirm('Clear chat history?')) {
      setUiMessages([]);
      historyRef.current = [];
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const sendMessage = async () => {
    // Rule: hard lock checked at top
    if (isSending.current) return;
    
    // Rule: 300ms debounce
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(async () => {
      if (!input.trim()) return;

      isSending.current = true;
      setLoading(true);
      setError(null);

      const userMessage = { role: 'user', content: input.trim() };
      
      // Update Ref (Source of truth for API, never triggers re-render)
      historyRef.current = [...historyRef.current, userMessage];
      
      // Update UI state separately so user can see their message
      setUiMessages(prev => [...prev, userMessage]);
      setInput('');

      // Rule: console.log before every fetch
      console.log('[CHAT] ▶ Gemini 2.5 Flash request fired | id=REQ-' + Date.now());

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: input.trim(),
            history: historyRef.current.slice(0, -1) // Exclude the message we just added since generateResponse adds it
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to fetch AI response');
        }

        const data = await response.json();
        
        if (data.reply) {
          const aiMessage = { role: 'model', content: data.reply };
          // Update history ref
          historyRef.current = [...historyRef.current, aiMessage];
          // Update UI
          setUiMessages(prev => [...prev, aiMessage]);
        }
      } catch (error: any) {
        console.error('[CHAT] Error:', error);
        setError(`Chat Error: ${error.message || 'Failed to fetch AI response'}. Please try again.`);
        // Rule: No auto-retry in catch block
      } finally {
        // Rule: released in finally{}
        isSending.current = false;
        setLoading(false);
        debounceTimer.current = null;
      }
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Rule: Send triggered by Enter key (Shift+Enter = newline)
    if (e.key === 'Enter' && !e.shiftKey) {
      // Rule: e.preventDefault() on Enter keydown to block form submit
      e.preventDefault(); 
      sendMessage();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-white">AI Assistant</h2>
        <p className="text-white/50">Powered by Gemini 2.5 Flash</p>
      </div>

      <div className="flex flex-col h-[600px] bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
          {uiMessages.length === 0 && (
            <div className="h-full flex items-center justify-center text-white/20 italic">
              Start a conversation...
            </div>
          )}
          {uiMessages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl ${
                m.role === 'user' 
                  ? 'bg-blue-600/20 border border-blue-500/30 text-blue-50' 
                  : 'bg-white/5 border border-white/10 text-slate-200'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex gap-2 items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          {error && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-xs">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-6 bg-slate-950/50 border-t border-white/5">
          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="How can I help you today?"
              className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 pr-16 focus:outline-none focus:border-blue-500/50 transition-all resize-none disabled:opacity-50 min-h-[80px]"
              rows={2}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="absolute right-3 bottom-3 p-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-white/20 rounded-xl transition-all shadow-lg active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
          <div className="mt-3 flex justify-between items-center text-[10px] text-white/20 px-1">
            <span>Shift + Enter for newline</span>
            <span>RLS Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
