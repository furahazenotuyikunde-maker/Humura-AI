import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Message {
  role: 'user' | 'model';
  content: string;
}

const AIChatPage: React.FC = () => {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API Key missing");

      // Build context from history
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            ...history,
            { role: 'user', parts: [{ text: input }] }
          ],
          systemInstruction: {
            parts: [{
              text: `You are Humura AI, a compassionate mental health assistant dedicated to supporting young people in Rwanda. 
              Your tone is warm, non-judgmental, and culturally sensitive. 
              You understand the Rwandan context, including local values (Ubumuntu, Ubupfura) and challenges.
              Support the user in ${isRw ? 'Kinyarwanda' : 'English'}. 
              If the user is in crisis, prioritize empathy and gently suggest professional help (like calling 114).
              Keep responses concise but deeply empathetic.`
            }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Failed to get AI response");

      const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (aiReply) {
        setMessages(prev => [...prev, { role: 'model', content: aiReply }]);
      }
    } catch (err: any) {
      console.error("Chat Error:", err);
      setError(isRw ? "Habaye ikosa. Nyamuneka gerageza nanone." : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto flex flex-col h-[80vh] bg-white rounded-3xl shadow-xl border border-[#E8E1DB] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#E8E1DB] bg-[#FDFCFB] flex items-center gap-4">
          <div className="w-12 h-12 bg-[#8B5E3C] rounded-2xl flex items-center justify-center text-white">
            <Bot size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#4A2C1A]">Humura AI</h1>
            <p className="text-sm text-[#8B5E3C]">{isRw ? 'Ubufasha mu mutima' : 'Emotional Support Assistant'}</p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Bot className="mx-auto text-[#E8E1DB] mb-4" size={48} />
              <h2 className="text-[#8B5E3C] font-medium mb-2">
                {isRw ? 'Muraho! Nakufasha iki uyu munsi?' : 'Hello! How can I support you today?'}
              </h2>
              <p className="text-sm text-gray-400 max-w-xs mx-auto">
                {isRw ? 'Humura AI iri hano kugutegeka amatwi no kugufasha.' : 'Humura AI is here to listen and support you in a safe space.'}
              </p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-[#D4A373]' : 'bg-[#8B5E3C]'
                  }`}>
                    {msg.role === 'user' ? <User size={18} className="text-white" /> : <Bot size={18} className="text-white" />}
                  </div>
                  <div className={`p-4 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-[#8B5E3C] text-white rounded-tr-none' 
                      : 'bg-[#FDFCFB] border border-[#E8E1DB] text-[#4A2C1A] rounded-tl-none'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 items-center text-[#8B5E3C]">
                <div className="w-8 h-8 rounded-full bg-[#8B5E3C] flex items-center justify-center">
                  <Bot size={18} className="text-white" />
                </div>
                <Loader2 className="animate-spin" size={18} />
                <span className="text-xs italic">{isRw ? 'Humura AI aratekereza...' : 'Humura AI is thinking...'}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-[#E8E1DB]">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isRw ? 'Andika ubutumwa bwawe...' : 'Type your message...'}
              className="flex-1 px-6 py-3 bg-[#FDFCFB] border border-[#E8E1DB] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8B5E3C] text-[#4A2C1A]"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 bg-[#8B5E3C] text-white rounded-2xl flex items-center justify-center hover:bg-[#4A2C1A] transition-colors disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-[10px] text-center text-gray-400 mt-3">
            {isRw ? 'Humura AI ntisimbura ubufasha bw’inzobere mu buzima bwo mu mutwe.' : 'Humura AI is not a replacement for professional mental health care.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;
