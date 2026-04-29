import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, AlertCircle, Loader2, Mic, MicOff, ImagePlus, Square, Edit2, X, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Message {
  role: 'user' | 'model';
  content: string;
  image?: string; // Base64 preview
}

const AIChatPage: React.FC = () => {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = i18n.language === 'rw' ? 'rw-RW' : 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setInput(transcript);
      };

      recognitionRef.current.onend = () => setIsRecording(false);
      recognitionRef.current.onerror = () => setIsRecording(false);
    }
  }, [i18n.language]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current?.start();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage({
          data: (reader.result as string).split(',')[1],
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setError(isRw ? 'Guhagarika byakunze' : 'Generation stopped');
    }
  };

  const handleEditMessage = (index: number) => {
    const msg = messages[index];
    if (msg.role === 'user') {
      setInput(msg.content);
      setEditingIndex(index);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMessage: Message = { 
      role: 'user', 
      content: input,
      image: selectedImage ? `data:${selectedImage.mimeType};base64,${selectedImage.data}` : undefined
    };

    let newMessages = [...messages];
    if (editingIndex !== null) {
      newMessages[editingIndex] = userMessage;
      // Optionally clear subsequent messages if editing an old one
      newMessages = newMessages.slice(0, editingIndex + 1);
      setEditingIndex(null);
    } else {
      newMessages.push(userMessage);
    }

    setMessages(newMessages);
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      const rawUrl = import.meta.env.VITE_RENDER_BACKEND_URL;
      if (!rawUrl) throw new Error("Backend URL is not defined.");

      const backendUrl = rawUrl.replace(/\/$/, '');
      const targetEndpoint = `${backendUrl}/chat`;

      const response = await fetch(targetEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          message: userMessage.content,
          history: newMessages.slice(0, -1),
          image: selectedImage,
          lang: i18n.language
        })
      });

      if (!response.ok) {
        throw new Error(`Server Error (${response.status})`);
      }

      const data = await response.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'model', content: data.reply }]);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error("Chat Error:", err);
      setError(`${isRw ? 'Ikibazo' : 'Error'}: ${err.message}`);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto flex flex-col h-[80vh] bg-white rounded-3xl shadow-xl border border-[#E8E1DB] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#E8E1DB] bg-[#FDFCFB] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-[#E8E1DB] overflow-hidden">
              <img src="/logo.png" alt="Humura AI Logo" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#4A2C1A]">Humura AI</h1>
              <p className="text-sm text-[#8B5E3C]">{isRw ? 'Ubufasha mu mutima' : 'Emotional Support Assistant'}</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button 
              onClick={() => { if(confirm(isRw ? 'Gusiba ibiganiro byose?' : 'Clear all messages?')) setMessages([]); }}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title={isRw ? 'Siba byose' : 'Clear chat'}
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <img src="/logo.png" alt="Humura AI" className="mx-auto w-20 h-20 object-contain mb-4 opacity-50" />
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${msg.role === 'user' ? 'bg-[#D4A373]' : 'bg-white border border-[#E8E1DB]'
                    }`}>
                    {msg.role === 'user' ? <User size={18} className="text-white" /> : <img src="/logo.png" alt="AI" className="w-6 h-6 object-contain" />}
                  </div>
                  <div className="flex flex-col gap-1 w-full">
                    <div className={`p-4 rounded-2xl relative group ${msg.role === 'user'
                        ? 'bg-[#8B5E3C] text-white rounded-tr-none'
                        : 'bg-[#FDFCFB] border border-[#E8E1DB] text-[#4A2C1A] rounded-tl-none'
                      }`}>
                      {msg.image && (
                        <img src={msg.image} alt="Upload" className="max-w-xs rounded-lg mb-3 border border-white/20" />
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      
                      {msg.role === 'user' && !isLoading && (
                        <button 
                          onClick={() => handleEditMessage(index)}
                          className="absolute -left-8 top-2 p-1 text-gray-400 hover:text-[#8B5E3C] opacity-0 group-hover:opacity-100 transition-opacity"
                          title={isRw ? 'Guhindura' : 'Edit'}
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 items-center text-[#8B5E3C]">
                <div className="w-8 h-8 rounded-full bg-white border border-[#E8E1DB] flex items-center justify-center overflow-hidden">
                  <img src="/logo.png" alt="AI" className="w-6 h-6 object-contain" />
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  <span className="text-xs italic">{isRw ? 'Humura AI aratekereza...' : 'Humura AI is thinking...'}</span>
                  <button 
                    onClick={stopGeneration}
                    className="ml-2 flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-md text-[10px] hover:bg-red-100 transition-colors"
                  >
                    <Square size={10} fill="currentColor" />
                    {isRw ? 'Hagarika' : 'Stop'}
                  </button>
                </div>
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
          {selectedImage && (
            <div className="mb-4 relative inline-block">
              <img 
                src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} 
                alt="Preview" 
                className="w-20 h-20 object-cover rounded-xl border-2 border-[#8B5E3C]" 
              />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600"
              >
                <X size={12} />
              </button>
            </div>
          )}
          
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={editingIndex !== null ? (isRw ? 'Vugurura ubutumwa...' : 'Edit your message...') : (isRw ? 'Andika ubutumwa bwawe...' : 'Type your message...')}
                className="w-full px-6 py-3 bg-[#FDFCFB] border border-[#E8E1DB] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8B5E3C] text-[#4A2C1A] resize-none min-h-[52px] max-h-32"
                rows={1}
              />
              
              <div className="absolute right-3 bottom-2.5 flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  hidden 
                  accept="image/*" 
                  onChange={handleImageSelect} 
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-[#8B5E3C] transition-colors"
                  title={isRw ? 'Ohereza ifoto' : 'Upload image'}
                >
                  <ImagePlus size={20} />
                </button>
                <button
                  onClick={toggleRecording}
                  className={`p-2 transition-colors ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-[#8B5E3C]'}`}
                  title={isRw ? 'Koresha ijwi' : 'Voice message'}
                >
                  {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleSend}
              disabled={(!input.trim() && !selectedImage) || isLoading}
              className="w-12 h-12 bg-[#8B5E3C] text-white rounded-2xl flex items-center justify-center hover:bg-[#4A2C1A] transition-colors disabled:opacity-50 flex-shrink-0"
            >
              <Send size={20} />
            </button>
          </div>
          
          {editingIndex !== null && (
            <div className="flex justify-between items-center mt-2 px-2">
              <span className="text-[10px] text-[#8B5E3C] font-medium uppercase tracking-wider">
                {isRw ? 'UHINDURA UBUTUMWA' : 'EDITING MODE'}
              </span>
              <button 
                onClick={() => { setEditingIndex(null); setInput(''); }}
                className="text-[10px] text-gray-400 hover:text-red-500 underline"
              >
                {isRw ? 'Kureka' : 'Cancel'}
              </button>
            </div>
          )}

          <p className="text-[10px] text-center text-gray-400 mt-3">
            {isRw ? 'Humura AI ntisimbura ubufasha bw’inzobere mu buzima bwo mu mutwe.' : 'Humura AI is not a replacement for professional mental health care.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;
