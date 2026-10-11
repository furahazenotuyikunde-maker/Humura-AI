import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Languages,
  ArrowRightLeft,
  Copy,
  Check,
  Loader2,
  Sparkles,
  Volume2,
  VolumeX,
  Trash2,
  MessageSquare,
  ArrowRight,
  Send,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { translateText } from '../../lib/translate';

// ──────────────────────────────────────────────────────────────
// COMMON MENTAL HEALTH TRANSLATION PHRASES
// ──────────────────────────────────────────────────────────────
const COMMON_PHRASES = [
  {
    en: 'I feel deeply anxious and overwhelmed.',
    rw: 'Mfite ubwoba bwinshi no kurengerwa mu mutima.'
  },
  {
    en: 'How can I calm my rapid heartbeat and panic?',
    rw: 'Natuza nte umutima utera vuba n’ubwoba bukabije?'
  },
  {
    en: 'I need someone compassionate to listen to me.',
    rw: 'Nkeneye umuntu unyitaho kandi untege amatwi.'
  },
  {
    en: 'I have had trouble sleeping for two weeks.',
    rw: 'Maze ibyumweru bibiri ntasinzira neza.'
  },
  {
    en: 'Is there a therapist available today?',
    rw: 'Ese hari umuganga w’imitekerereze uboneka uyu munsi?'
  }
];

export default function TranslatorPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRw = i18n.language?.startsWith('rw');
  const [searchParams] = useSearchParams();
  const queryText = searchParams.get('text');
  const queryTarget = searchParams.get('target') as 'rw' | 'en' | null;

  const [text, setText] = useState('');
  const [translated, setTranslated] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [targetLang, setTargetLang] = useState<'rw' | 'en'>(queryTarget || (isRw ? 'en' : 'rw'));
  const [sourceLang, setSourceLang] = useState<'rw' | 'en'>(targetLang === 'rw' ? 'en' : 'rw');
  const [copied, setCopied] = useState(false);
  const [isSpeakingSource, setIsSpeakingSource] = useState(false);
  const [isSpeakingTarget, setIsSpeakingTarget] = useState(false);

  // Auto-translate if text is provided via URL
  useEffect(() => {
    if (queryText) {
      const decodedText = decodeURIComponent(queryText);
      setText(decodedText);

      const autoTranslate = async () => {
        setIsLoading(true);
        try {
          const res = await translateText(decodedText, targetLang, sourceLang);
          setTranslated(res);
        } catch (e) {
          console.error('Auto-translate failed:', e);
        } finally {
          setIsLoading(false);
        }
      };
      autoTranslate();
    }
  }, [queryText, targetLang, sourceLang]);

  const handleTranslate = async (textToTranslate = text) => {
    if (!textToTranslate.trim()) return;
    setIsLoading(true);
    try {
      const res = await translateText(textToTranslate, targetLang, sourceLang);
      setTranslated(res);
    } catch (e) {
      console.error('Translation note:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const swapLanguages = () => {
    const oldTarget = targetLang;
    const oldSource = sourceLang;
    setTargetLang(oldSource);
    setSourceLang(oldTarget);
    setText(translated);
    setTranslated(text);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeakingSource(false);
      setIsSpeakingTarget(false);
    }
  };

  const handleSelectPhrase = (phrase: typeof COMMON_PHRASES[0]) => {
    const selectedText = sourceLang === 'en' ? phrase.en : phrase.rw;
    setText(selectedText);
    handleTranslate(selectedText);
  };

  const copyToClipboard = () => {
    if (!translated) return;
    navigator.clipboard.writeText(translated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Speech Synthesis for Source & Translation ──
  const speak = (content: string, langCode: 'rw' | 'en', isSource: boolean) => {
    if (!('speechSynthesis' in window) || !content.trim()) return;

    window.speechSynthesis.cancel();

    if (isSource && isSpeakingSource) {
      setIsSpeakingSource(false);
      return;
    }
    if (!isSource && isSpeakingTarget) {
      setIsSpeakingTarget(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = langCode === 'rw' ? 'rw-RW' : 'en-US';
    utterance.rate = 0.95;
    utterance.onend = () => {
      setIsSpeakingSource(false);
      setIsSpeakingTarget(false);
    };
    utterance.onerror = () => {
      setIsSpeakingSource(false);
      setIsSpeakingTarget(false);
    };

    if (isSource) {
      setIsSpeakingSource(true);
      setIsSpeakingTarget(false);
    } else {
      setIsSpeakingTarget(true);
      setIsSpeakingSource(false);
    }

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-7 pb-16 max-w-6xl mx-auto">
      {/* ── TOP HEADER ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DFEBE5] shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F3EE] text-[#21B48D] text-[11px] font-bold uppercase tracking-wider">
              <Languages size={13} />
              <span>{isRw ? 'Ubusobanuzi bw’Indimi' : 'Empathetic Healthcare Translator'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08352A] tracking-tight">
              {isRw ? 'Umusobanuzi w’Ikinyarwanda n’Icyongereza' : 'Bilingual Mental Wellness Translator'}
            </h1>
            <p className="text-xs sm:text-sm text-[#5E8E81] max-w-2xl font-normal leading-relaxed">
              {isRw
                ? 'Semura amagambo agaragaza ibyiyumviro, ibimenyetso by’indwara, cyangwa inama z’ubuvuzi hagati y’Ikinyarwanda n’Icyongereza mu buryo bwihuse kandi bworoshye.'
                : 'Translate sensitive clinical descriptions, symptoms, and coping strategies seamlessly between Kinyarwanda and English with audio pronunciation.'}
            </p>
          </div>

          {/* Quick Clear / Reset */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-shrink-0">
            {text && (
              <button
                onClick={() => {
                  setText('');
                  setTranslated('');
                }}
                className="px-4 py-2.5 rounded-2xl bg-[#F4F8F6] hover:bg-[#E8F3EE] text-[#E11D48] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-[#DCEBE3]"
              >
                <Trash2 size={14} />
                <span>{isRw ? 'Siba Byose' : 'Clear All'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── LANGUAGE SWITCHER CONTROL BAR ── */}
      <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-[#DFEBE5] shadow-2xs flex items-center justify-between gap-3">
        {/* Source Language Chip */}
        <div className="flex-1 flex items-center justify-center sm:justify-start pl-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#08352A] text-white text-xs font-extrabold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#21B48D]" />
            <span>{sourceLang === 'en' ? 'ENGLISH' : 'IKINYARWANDA'}</span>
          </div>
        </div>

        {/* Swap Button */}
        <button
          onClick={swapLanguages}
          className="p-3 rounded-full bg-[#E8F3EE] hover:bg-[#D4EADE] text-[#08352A] hover:scale-105 active:rotate-180 transition-all duration-300 shadow-2xs cursor-pointer flex-shrink-0"
          title={isRw ? 'Hinduranya Indimi' : 'Swap Languages'}
        >
          <ArrowRightLeft size={16} className="text-[#21B48D]" />
        </button>

        {/* Target Language Chip */}
        <div className="flex-1 flex items-center justify-center sm:justify-end pr-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#E2F2EC] text-[#08352A] text-xs font-extrabold shadow-2xs border border-[#CDE5DC]">
            <span className="w-2 h-2 rounded-full bg-[#21B48D]" />
            <span>{targetLang === 'en' ? 'ENGLISH' : 'IKINYARWANDA'}</span>
          </div>
        </div>
      </div>

      {/* ── TRANSLATION DUAL WORKBENCH ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Source Text Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#DFEBE5] space-y-4 shadow-2xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#08352A]">
                {sourceLang === 'en' ? 'English Source Text' : 'Inyandiko y’Ikinyarwanda'}
              </span>
              <span className="text-[11px] font-medium text-[#8DB4A8]">
                {text.length} {isRw ? 'inyuguti' : 'characters'}
              </span>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleTranslate();
                }
              }}
              placeholder={
                sourceLang === 'en'
                  ? 'Type your feelings, medical questions, or thoughts in English...'
                  : 'Andika ibyiyumviro, ibibazo, cyangwa ibyo wifuza kumenya mu Kinyarwanda...'
              }
              className="w-full min-h-[220px] p-4 rounded-2xl bg-[#F4F8F6] border border-[#DCEBE3] text-xs sm:text-sm font-medium text-[#08352A] placeholder-[#8DB4A8] outline-none focus:border-[#21B48D] transition-colors resize-none leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-[#F0F5F2] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => speak(text, sourceLang, true)}
                disabled={!text.trim()}
                className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 ${
                  isSpeakingSource
                    ? 'bg-[#E11D48] text-white'
                    : 'bg-[#F4F8F6] hover:bg-[#E8F3EE] text-[#08352A]'
                }`}
                title={isRw ? 'Umva uko bisomwa' : 'Listen pronunciation'}
              >
                {isSpeakingSource ? <VolumeX size={15} /> : <Volume2 size={15} className="text-[#21B48D]" />}
              </button>
            </div>

            <button
              onClick={() => handleTranslate()}
              disabled={isLoading || !text.trim()}
              className="px-6 py-2.5 rounded-2xl bg-[#08352A] hover:bg-[#154E3F] text-white text-xs font-extrabold flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin text-[#21B48D]" />
                  <span>{isRw ? 'Iririmo Gusobanurwa...' : 'Translating...'}</span>
                </>
              ) : (
                <>
                  <Languages size={14} className="text-[#21B48D]" />
                  <span>{isRw ? 'Semura Ubu' : 'Translate Now'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Translation Result Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#DFEBE5] space-y-4 shadow-2xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#08352A]">
                {targetLang === 'en' ? 'English Translation' : 'Ibisubizo mu Kinyarwanda'}
              </span>
              <span className="text-[10px] font-extrabold text-[#21B48D] bg-[#E8F3EE] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {targetLang === 'en' ? 'English' : 'Kinyarwanda'}
              </span>
            </div>

            <div className="min-h-[220px] p-4 rounded-2xl bg-[#F4F8F6] border border-[#DCEBE3] flex flex-col justify-between">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center py-12 gap-3 text-[#5E8E81]">
                  <Loader2 size={24} className="animate-spin text-[#21B48D]" />
                  <p className="text-xs font-bold">{isRw ? 'Iri gukora ubusobanuzi...' : 'Processing translation...'}</p>
                </div>
              ) : translated ? (
                <p className="text-xs sm:text-sm text-[#08352A] font-medium leading-relaxed whitespace-pre-wrap select-all">
                  {translated}
                </p>
              ) : (
                <div className="h-full flex items-center justify-center py-12 text-xs text-[#8DB4A8] italic">
                  {isRw ? 'Inyandiko isemuye iraza kugaragara hano...' : 'Translation will appear here instantly...'}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#F0F5F2] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => speak(translated, targetLang, false)}
                disabled={!translated.trim()}
                className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 ${
                  isSpeakingTarget
                    ? 'bg-[#E11D48] text-white'
                    : 'bg-[#F4F8F6] hover:bg-[#E8F3EE] text-[#08352A]'
                }`}
                title={isRw ? 'Umva igisubizo cyasobanuwe' : 'Listen to translation'}
              >
                {isSpeakingTarget ? <VolumeX size={15} /> : <Volume2 size={15} className="text-[#21B48D]" />}
              </button>

              <button
                onClick={copyToClipboard}
                disabled={!translated.trim()}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 ${
                  copied
                    ? 'bg-[#21B48D] text-[#08352A]'
                    : 'bg-[#F4F8F6] hover:bg-[#E8F3EE] text-[#08352A]'
                }`}
              >
                {copied ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} className="text-[#21B48D]" />}
                <span>{copied ? (isRw ? 'Byakoporowe' : 'Copied') : (isRw ? 'Koporora' : 'Copy')}</span>
              </button>
            </div>

            {translated && (
              <button
                onClick={() => navigate(`/patient/chat?initial=${encodeURIComponent(translated)}`)}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#21B48D] hover:underline cursor-pointer"
              >
                <span>{isRw ? 'Baza AI ku Byo' : 'Discuss with AI'}</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── COMMON CLINICAL PHRASES SHORTCUTS ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#DFEBE5] space-y-4 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#E8F3EE] text-[#21B48D] flex items-center justify-center">
            <Lightbulb size={16} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#08352A]">
              {isRw ? 'Interuro zikoreshwa kenshi mu Buzima bwo mu Mutwe:' : 'Common Mental Health & Support Phrases:'}
            </h3>
            <p className="text-[11px] text-[#5E8E81]">
              {isRw ? 'Kanda ku nteruro imwe kugira ngo uyishyire mu musemuzi ako kanya.' : 'Tap any phrase below to instantly translate and practice:'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {COMMON_PHRASES.map((phrase, idx) => {
            const isEnglishSource = sourceLang === 'en';
            const primary = isEnglishSource ? phrase.en : phrase.rw;
            const secondary = isEnglishSource ? phrase.rw : phrase.en;

            return (
              <button
                key={idx}
                onClick={() => handleSelectPhrase(phrase)}
                className="text-left p-4 rounded-2xl bg-[#F4F8F6] hover:bg-[#E8F3EE] border border-[#DCEBE3] hover:border-[#21B48D] transition-all cursor-pointer group"
              >
                <p className="text-xs font-extrabold text-[#08352A] group-hover:text-[#21B48D] transition-colors leading-snug mb-1">
                  "{primary}"
                </p>
                <p className="text-[11px] text-[#5E8E81] font-normal leading-tight italic">
                  {secondary}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
