import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Trash2,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Binary,
  Sparkles,
  Info,
  HelpCircle,
  Eye,
  Type,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import jsPDF from 'jspdf';
import { translateToBraille, toBrailleString } from '../../lib/braille';

// ──────────────────────────────────────────────────────────────
// BRAILLE ALPHABET REFERENCE DATA (A-Z)
// ──────────────────────────────────────────────────────────────
const BRAILLE_ALPHABET = [
  { char: 'A', braille: '⠁', dots: '1' },
  { char: 'B', braille: '⠃', dots: '1-2' },
  { char: 'C', braille: '⠉', dots: '1-4' },
  { char: 'D', braille: '⠙', dots: '1-4-5' },
  { char: 'E', braille: '⠑', dots: '1-5' },
  { char: 'F', braille: '⠋', dots: '1-2-4' },
  { char: 'G', braille: '⠛', dots: '1-2-4-5' },
  { char: 'H', braille: '⠓', dots: '1-2-5' },
  { char: 'I', braille: '⠊', dots: '2-4' },
  { char: 'J', braille: '⠚', dots: '2-4-5' },
  { char: 'K', braille: '⠅', dots: '1-3' },
  { char: 'L', braille: '⠇', dots: '1-2-3' },
  { char: 'M', braille: '⠍', dots: '1-3-4' },
  { char: 'N', braille: '⠝', dots: '1-3-4-5' },
  { char: 'O', braille: '⠕', dots: '1-3-5' },
  { char: 'P', braille: '⠏', dots: '1-2-3-4' },
  { char: 'Q', braille: '⠟', dots: '1-2-3-4-5' },
  { char: 'R', braille: '⠗', dots: '1-2-3-5' },
  { char: 'S', braille: '⠎', dots: '2-3-4' },
  { char: 'T', braille: '⠞', dots: '2-3-4-5' },
  { char: 'U', braille: '⠥', dots: '1-3-6' },
  { char: 'V', braille: '⠧', dots: '1-2-3-6' },
  { char: 'W', braille: '⠺', dots: '2-4-5-6' },
  { char: 'X', braille: '⠭', dots: '1-3-4-6' },
  { char: 'Y', braille: '⠽', dots: '1-3-4-5-6' },
  { char: 'Z', braille: '⠵', dots: '1-3-5-6' },
];

const SAMPLE_PHRASES = [
  { en: 'I am safe, calm, and grounded.', rw: 'Ndatekanye, mfite ituze mu mutima.' },
  { en: 'Take one slow, deep breath.', rw: 'Fata umwuka mwiza witonze.' },
  { en: 'You are worthy of support and peace.', rw: 'Ukwiye ubufasha n’umudendezo.' },
  { en: 'One small step at a time.', rw: 'Intambwe imwe ku yindi irahagije.' }
];

export default function BrailleGeneratorPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const isRw = lang.startsWith('rw');

  const [inputText, setInputText] = useState('I am safe, calm, and grounded.');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showAlphabet, setShowAlphabet] = useState(false);

  const brailleTokens = useMemo(() => translateToBraille(inputText), [inputText]);
  const brailleText = useMemo(() => toBrailleString(inputText), [inputText]);

  const handleClear = () => {
    setInputText('');
  };

  const handleCopy = () => {
    if (!brailleText) return;
    navigator.clipboard.writeText(brailleText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Speech Synthesis for Accessibility ──
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window) || !inputText.trim()) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(inputText);
      utterance.lang = isRw ? 'rw-RW' : 'en-US';
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // ── High Quality Tactile PDF Generation ──
  const generatePDF = () => {
    if (!brailleText) return;
    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF();
      const margin = 20;
      let x = margin;
      let y = 45;
      const dotRadius = 0.7;
      const dotSpacing = 2.6;
      const cellSpacing = 6.2;
      const lineHeight = 13;

      // Header Branding
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(8, 53, 42); // #08352A
      doc.text('Humura AI — Braille Tactile Document', margin, 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(94, 142, 129); // #5E8E81
      doc.text(`Generated on: ${new Date().toLocaleDateString()} · Unified English Braille (UEB Grade 1)`, margin, 28);

      doc.setDrawColor(220, 235, 227);
      doc.line(margin, 33, 190, 33);

      // Draw vector dots for tactile embosser or standard print
      doc.setFillColor(8, 53, 42);

      for (let i = 0; i < brailleText.length; i++) {
        const char = brailleText[i];
        const code = char.charCodeAt(0);

        if (code >= 0x2800 && code <= 0x28ff) {
          const dots = code - 0x2800;
          const dotPositions = [
            { bit: 0x01, dx: 0, dy: 0 },
            { bit: 0x02, dx: 0, dy: dotSpacing },
            { bit: 0x04, dx: 0, dy: dotSpacing * 2 },
            { bit: 0x08, dx: dotSpacing, dy: 0 },
            { bit: 0x10, dx: dotSpacing, dy: dotSpacing },
            { bit: 0x20, dx: dotSpacing, dy: dotSpacing * 2 }
          ];

          dotPositions.forEach((pos) => {
            if (dots & pos.bit) {
              doc.circle(x + pos.dx, y + pos.dy, dotRadius, 'F');
            }
          });
        }

        x += cellSpacing;
        if (x > 180 || char === '\n') {
          x = margin;
          y += lineHeight;
        }
        if (y > 270) {
          doc.addPage();
          y = margin;
        }
      }

      doc.save(`humura-braille-${Date.now()}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-7 pb-16 max-w-6xl mx-auto">
      {/* ── TOP HEADER ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DFEBE5] shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F3EE] text-[#21B48D] text-[11px] font-bold uppercase tracking-wider">
              <Binary size={13} />
              <span>{isRw ? 'Ikoranabuhanga ryo Gufasha' : 'Accessible Assistive Studio'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08352A] tracking-tight">
              {isRw ? 'Icyumba cyo Guhindura Inyandiko muri Braille' : 'Braille Document & Tactile Reader'}
            </h1>
            <p className="text-xs sm:text-sm text-[#5E8E81] max-w-2xl font-normal leading-relaxed">
              {isRw
                ? 'Hindura inyandiko zo komora ibikomere n’inama z’ubuvuzi mu nyuguti za Braille. Ushobora gukoporora, kumva ijwi, cyangwa gukuramo PDF yiteguye gucapishwa.'
                : 'Convert therapeutic reflections, clinical notes, and compassionate messages into Unified English Braille (UEB Grade 1) with tactile vector PDF generation and audio readout.'}
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={() => setShowAlphabet((prev) => !prev)}
              className="px-4 py-2.5 rounded-2xl bg-[#F4F8F6] hover:bg-[#E8F3EE] text-[#08352A] border border-[#DCEBE3] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <Eye size={15} className="text-[#21B48D]" />
              <span>{isRw ? 'Inyuguti za Braille (A-Z)' : 'Braille Alphabet (A-Z)'}</span>
              {showAlphabet ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE BRAILLE ALPHABET REFERENCE MODAL / ACCORDION ── */}
      <AnimatePresence>
        {showAlphabet && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-3xl p-6 sm:p-7 border border-[#DFEBE5] shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F5F2]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E8F3EE] text-[#21B48D] flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#08352A]">
                    {isRw ? 'Inyuguti za Braille z’Icyongereza (Grade 1 UEB)' : 'Standard Braille Alphabet Reference (A-Z)'}
                  </h3>
                  <p className="text-[11px] text-[#5E8E81]">
                    {isRw ? 'Buri nyuguti igaragaza uburyo utudomo dutondetse' : 'Visual representation of dot matrix for each Latin letter'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAlphabet(false)}
                className="text-[#8DB4A8] hover:text-[#08352A] p-1.5 rounded-xl hover:bg-[#F4F8F6] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-9 gap-2.5">
              {BRAILLE_ALPHABET.map((item) => (
                <div
                  key={item.char}
                  className="bg-[#F4F8F6] rounded-2xl p-3 border border-[#E3ECE7] flex flex-col items-center justify-center text-center hover:border-[#21B48D] transition-colors"
                >
                  <span className="text-xs font-black text-[#5E8E81] mb-1">{item.char}</span>
                  <span className="text-2xl font-mono text-[#08352A] leading-none mb-1">{item.braille}</span>
                  <span className="text-[9px] text-[#8DB4A8] font-semibold">{item.dots}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TRANSLATION WORKBENCH (SOURCE TEXT & BRAILLE OUTPUT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Text Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#DFEBE5] space-y-4 shadow-2xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#08352A] flex items-center gap-2">
                <Type size={15} className="text-[#21B48D]" />
                <span>{isRw ? 'Inyandiko y’Ibanze (Source Text)' : 'Source Text Input'}</span>
              </label>

              {inputText && (
                <button
                  onClick={handleClear}
                  className="text-xs font-bold text-[#E11D48] hover:text-[#BE123C] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>{isRw ? 'Siba' : 'Clear'}</span>
                </button>
              )}
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isRw ? 'Andika inyandiko ushaka guhindura mu nyuguti za Braille...' : 'Type or paste reflections, counseling guidance, or clinical instructions here...'}
              className="w-full min-h-[180px] p-4 rounded-2xl bg-[#F4F8F6] border border-[#DCEBE3] text-xs sm:text-sm font-medium text-[#08352A] placeholder-[#8DB4A8] outline-none focus:border-[#21B48D] transition-colors resize-none leading-relaxed"
            />

            {/* Quick Sample Clinical Phrases */}
            <div>
              <span className="text-[10px] font-bold text-[#8DB4A8] uppercase tracking-wider block mb-2">
                {isRw ? 'Ingero z’Inyandiko Zifasha:' : 'Suggested Calming Expressions:'}
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_PHRASES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputText(isRw ? sample.rw : sample.en)}
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-[#E8F3EE] hover:bg-[#D4EADE] text-[#08352A] border border-[#CDE5DC] transition-colors cursor-pointer"
                  >
                    "{isRw ? sample.rw : sample.en}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F0F5F2] flex items-center justify-between text-xs text-[#8DB4A8]">
            <span>{inputText.length} {isRw ? 'inyuguti zanditswe' : 'characters'}</span>
            <button
              onClick={toggleSpeech}
              disabled={!inputText.trim()}
              className={`flex items-center gap-1.5 font-bold transition-colors cursor-pointer disabled:opacity-40 ${
                isSpeaking ? 'text-[#E11D48]' : 'text-[#08352A] hover:text-[#21B48D]'
              }`}
            >
              {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} className="text-[#21B48D]" />}
              <span>{isSpeaking ? (isRw ? 'Hagarika Ijwi' : 'Stop Narration') : (isRw ? 'Umva Inyandiko' : 'Listen Aloud')}</span>
            </button>
          </div>
        </div>

        {/* Right: Tactile Braille Preview Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#DFEBE5] space-y-4 shadow-2xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#08352A] flex items-center gap-2">
                <Binary size={15} className="text-[#21B48D]" />
                <span>{isRw ? 'Igisubizo muri Braille' : 'Tactile Braille Output'}</span>
              </label>

              <span className="text-[10px] font-extrabold text-[#21B48D] bg-[#E8F3EE] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                UEB Grade 1
              </span>
            </div>

            {/* Visual Braille Glyphs Viewer */}
            <div className="min-h-[180px] p-5 rounded-2xl bg-[#08352A] border border-[#154E3F] text-white flex flex-col justify-between shadow-inner">
              {brailleText ? (
                <div className="font-mono text-2xl sm:text-3xl leading-relaxed tracking-wider break-words select-all text-[#21B48D]">
                  {brailleText}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#71968B] italic py-10">
                  {isRw ? 'Inyandiko ya Braille iraza kugaragara hano...' : 'Braille glyphs will appear dynamically as you type...'}
                </div>
              )}

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#A3C7BD] mt-4">
                <span>{brailleTokens.length} {isRw ? 'utubumbiro twa Braille' : 'tactile cells mapped'}</span>
                <span className="font-bold text-white">100% Tactile Standard</span>
              </div>
            </div>

            <p className="text-xs text-[#5E8E81] leading-relaxed">
              {isRw
                ? 'Utudomo twa Braille duteguye ku buryo dushobora gucapwa ku mashini zicapa inyandiko z’abatabona (Braille embossers).'
                : 'Generated dot vectors are aligned with standard cell spacing for accessible tactile readers and embossers.'}
            </p>
          </div>

          {/* Action Buttons: Copy & Download PDF */}
          <div className="pt-4 border-t border-[#F0F5F2] flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleCopy}
              disabled={!brailleText}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-40 ${
                copied
                  ? 'bg-[#21B48D] text-[#08352A]'
                  : 'bg-[#F4F8F6] hover:bg-[#E8F3EE] text-[#08352A] border border-[#DCEBE3]'
              }`}
            >
              {copied ? <Check size={14} className="stroke-[3]" /> : <Copy size={14} className="text-[#21B48D]" />}
              <span>{copied ? (isRw ? 'Byakoporowe!' : 'Copied!') : (isRw ? 'Koporora Braille' : 'Copy Braille')}</span>
            </button>

            <button
              onClick={generatePDF}
              disabled={!brailleText || isGeneratingPdf}
              className="px-5 py-2.5 rounded-2xl bg-[#08352A] hover:bg-[#154E3F] text-white text-xs font-extrabold flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-40"
            >
              <Download size={14} className="text-[#21B48D]" />
              <span>
                {isGeneratingPdf
                  ? (isRw ? 'PDF irimo Gukorwa...' : 'Generating Vector PDF...')
                  : (isRw ? 'Kuramo PDF ya Braille' : 'Download Embossed PDF')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── EDUCATIONAL TIP BANNER ── */}
      <div className="p-5 rounded-3xl bg-white border border-[#DFEBE5] flex items-center gap-4 shadow-2xs">
        <div className="w-10 h-10 rounded-2xl bg-[#E8F3EE] text-[#21B48D] flex items-center justify-center flex-shrink-0">
          <Info size={20} />
        </div>
        <div className="text-xs text-[#5E8E81] leading-relaxed">
          <span className="font-bold text-[#08352A] mr-1">
            {isRw ? 'Ubumenyi ku Nyandiko ya Braille:' : 'Accessibility Clinical Note:'}
          </span>
          {isRw
            ? 'Inyandiko ya Braille ifasha abantu bafite ubumuga bwo kutabona kugira umudendezo n’uburenganzira bwo kwiyitaho mu buzima bwo mu mutwe mu mutuzo n’umutekano.'
            : 'Tactile and sensory-inclusive mental health materials allow visually impaired individuals to access mindfulness guidance and clinical resources with complete autonomy and privacy.'}
        </div>
      </div>
    </div>
  );
}
