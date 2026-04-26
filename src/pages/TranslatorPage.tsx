import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Languages, ArrowRightLeft, Copy, Check, Loader2, Sparkles } from 'lucide-react';
import { translateText } from '../lib/translate';

export default function TranslatorPage() {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  
  const [text, setText] = useState('');
  const [translated, setTranslated] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [targetLang, setTargetLang] = useState<'rw' | 'en'>(isRw ? 'en' : 'rw');
  const [copied, setCopied] = useState(false);

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      const res = await translateText(text, targetLang);
      setTranslated(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const swapLanguages = () => {
    setTargetLang(prev => prev === 'rw' ? 'en' : 'rw');
    setText(translated);
    setTranslated(text);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(translated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20">
            <Languages size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary-900 uppercase">
              {isRw ? 'Semura' : 'Translator'}
            </h1>
            <p className="text-sm font-bold text-primary-600 flex items-center gap-1">
              <Sparkles size={14} />
              {isRw ? 'Iri gukoresha LibreTranslate' : 'Powered by LibreTranslate'}
            </p>
          </div>
        </div>
      </div>

      {/* Language Selector */}
      <div className="flex items-center justify-center gap-4 bg-white p-3 border-2 border-black rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex-1 text-center font-black text-lg">
          {targetLang === 'rw' ? 'English' : 'Kinyarwanda'}
        </div>
        <button 
          onClick={swapLanguages}
          className="p-3 bg-black text-white rounded-full hover:scale-110 transition-transform active:rotate-180 duration-500"
        >
          <ArrowRightLeft size={20} />
        </button>
        <div className="flex-1 text-center font-black text-lg text-primary">
          {targetLang === 'rw' ? 'Kinyarwanda' : 'English'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input area */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-widest text-neutral-400 pl-2">
            {isRw ? 'Andika inyandiko hano' : 'Source Text'}
          </label>
          <div className="relative border-2 border-black rounded-[2rem] bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] min-h-[300px] flex flex-col">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isRw ? 'Andika ibyo ushaka guhindura...' : 'Type text to translate...'}
              className="w-full flex-1 resize-none bg-transparent focus:outline-none font-medium text-lg placeholder:text-neutral-300"
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleTranslate}
                disabled={isLoading || !text.trim()}
                className="px-8 py-3 bg-black text-white rounded-2xl font-black uppercase tracking-wider hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Languages size={18} />}
                {isRw ? 'Semura' : 'Translate'}
              </button>
            </div>
          </div>
        </div>

        {/* Output area */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-widest text-primary/40 pl-2">
            {isRw ? 'Inyandiko isemuye' : 'Translation Result'}
          </label>
          <div className="relative border-2 border-primary rounded-[2rem] bg-primary-50 p-6 shadow-[8px_8px_0px_0px_rgba(var(--primary-rgb),0.2)] min-h-[300px] flex flex-col group">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-primary/40 animate-pulse">
                <Loader2 size={48} className="animate-spin mb-4" />
                <p className="font-black uppercase tracking-widest text-sm">{isRw ? 'Iri guhindura...' : 'Translating...'}</p>
              </div>
            ) : (
              <>
                <div className="flex-1 font-bold text-lg text-primary-900 whitespace-pre-wrap">
                  {translated || (isRw ? 'Inyandiko isemuye izagaragara hano...' : 'Translated text will appear here...')}
                </div>
                {translated && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={copyToClipboard}
                      className="p-3 bg-white text-primary border-2 border-primary rounded-2xl hover:bg-primary hover:text-white transition-all active:scale-95 shadow-sm"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 border-2 border-black rounded-3xl bg-neutral-50 flex items-center gap-4 border-dashed"
      >
        <div className="w-12 h-12 rounded-full bg-white border-2 border-black flex items-center justify-center text-xl">
          🚀
        </div>
        <div>
          <p className="font-black text-sm uppercase tracking-tighter">Railway Production API</p>
          <p className="text-xs font-medium text-neutral-500 italic">
            libretranslate-production-06e3.up.railway.app
          </p>
        </div>
      </motion.div>
    </div>
  );
}
