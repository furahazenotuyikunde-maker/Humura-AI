import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Download, Copy, Printer, Check, 
  Sparkles, RefreshCw, Eye, BookOpen, Layers,
  Volume2, VolumeX, ChevronDown, ChevronUp, Trash2, Binary
} from 'lucide-react';
import jsPDF from 'jspdf';
import { translateToBraille, toBrailleString, BrailleToken } from '../../lib/braille';

// ──────────────────────────────────────────────────────────────
// BRAILLE ALPHABET REFERENCE DATA (A-Z UEB GRADE 1)
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

export default function BraillePage() {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');

  const [inputText, setInputText] = useState(
    isRw 
      ? "Ubufasha bw'ubuzima bwo mu mutwe. Hamagara 114 cyangwa ikigo cyawe cya muganga."
      : "Humura Mental Health Care. In emergency, call 114 or visit your health center."
  );
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showAlphabet, setShowAlphabet] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [tactileMode, setTactileMode] = useState<'embosser' | 'dual'>('dual');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Translate using verified UEB Grade 1 engine
  const brailleTokens = useMemo(() => translateToBraille(inputText), [inputText]);
  const brailleText = useMemo(() => toBrailleString(inputText), [inputText]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCopy = () => {
    if (!brailleText) return;
    navigator.clipboard.writeText(brailleText);
    setCopied(true);
    showToast(isRw ? 'Inyuguti za Braille zakuwe' : 'Braille unicode string copied to clipboard', 'success');
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

  // ── High Quality Tactile Vector PDF Generation ──
  const handleDownloadPDF = () => {
    if (!inputText.trim()) {
      showToast(isRw ? 'Nta nyandiko yo gucapa ihari' : 'Please provide text to export', 'error');
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const margin = 20;
      const pageWidth = 210;
      const pageHeight = 297;
      const maxLineWidth = pageWidth - margin * 2;

      // 1. Header Branding
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(8, 53, 42); // Deep Forest #08352A
      doc.text('HUMURA AI — CLINICAL BRAILLE MATERIAL', margin, 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(33, 180, 141); // Emerald Teal #21B48D
      doc.text(
        `ACCESSIBLE TACTILE GRADE-1 BRAILLE · GENERATED: ${new Date().toLocaleDateString()} · UEB COMPLIANT`,
        margin,
        27
      );

      doc.setDrawColor(220, 235, 227);
      doc.setLineWidth(0.4);
      doc.line(margin, 31, pageWidth - margin, 31);

      // 2. Original Text Overview (Dual-Readable header)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('CLINICAL SOURCE TEXT (ENGLISH / KINYARWANDA):', margin, 38);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      const splitText = doc.splitTextToSize(inputText, maxLineWidth);
      doc.text(splitText, margin, 44);

      let currentY = 44 + splitText.length * 5 + 6;
      doc.setDrawColor(220, 235, 227);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 8;

      // 3. Section Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(8, 53, 42);
      doc.text('TACTILE BRAILLE CODES (AUTHENTIC 6-DOT MATRIX):', margin, currentY);
      currentY += 8;

      // 4. Exact Physical Tactile Braille Dot Specs (ISO/IEC 11548-1 compliant)
      const dotRadius = 0.70;       // ~1.4mm diameter
      const dotSpacing = 2.45;      // vertical & horizontal dot center distance
      const cellSpacing = 6.20;     // horizontal distance between cell origins
      const lineHeight = 13.5;      // distance between braille lines

      let x = margin;
      let y = currentY + 3;

      // Standard 6-dot matrix bit offsets:
      // Dot 1: Top-Left (0x01)
      // Dot 2: Mid-Left (0x02)
      // Dot 3: Bot-Left (0x04)
      // Dot 4: Top-Right (0x08)
      // Dot 5: Mid-Right (0x10)
      // Dot 6: Bot-Right (0x20)
      const dotPositions = [
        { bit: 0x01, dx: 0, dy: 0 },
        { bit: 0x02, dx: 0, dy: dotSpacing },
        { bit: 0x04, dx: 0, dy: dotSpacing * 2 },
        { bit: 0x08, dx: dotSpacing, dy: 0 },
        { bit: 0x10, dx: dotSpacing, dy: dotSpacing },
        { bit: 0x20, dx: dotSpacing, dy: dotSpacing * 2 }
      ];

      for (let i = 0; i < brailleText.length; i++) {
        const char = brailleText[i];
        const code = char.charCodeAt(0);

        // Check for line wrap or newline
        if (char === '\n' || x + cellSpacing > pageWidth - margin) {
          x = margin;
          y += lineHeight;

          // Check for page break
          if (y + lineHeight > pageHeight - margin - 15) {
            doc.addPage();
            x = margin;
            y = margin + 10;
          }

          if (char === '\n') continue;
        }

        // Draw Braille cell if in Unicode Braille range (U+2800 to U+28FF)
        if (code >= 0x2800 && code <= 0x28ff) {
          const dots = code - 0x2800;

          // In dual guide mode, draw faint matrix guide dots for unraised positions
          if (tactileMode === 'dual' && dots > 0) {
            doc.setFillColor(224, 238, 232); // very light mint guide
            dotPositions.forEach(pos => {
              if (!(dots & pos.bit)) {
                doc.circle(x + pos.dx, y + pos.dy, dotRadius * 0.55, 'F');
              }
            });
          }

          // Draw the real, active tactile raised dots in deep forest green
          doc.setFillColor(8, 53, 42); // #08352A
          dotPositions.forEach(pos => {
            if (dots & pos.bit) {
              doc.circle(x + pos.dx, y + pos.dy, dotRadius, 'F');
            }
          });
        }

        x += cellSpacing;
      }

      // 5. Document Footer
      const finalY = pageHeight - 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Humura AI Clinical Assistive Studio · Embosser & Tactile Print Compatible · Unified English Braille (UEB)',
        margin,
        finalY
      );

      doc.save(`Humura_Braille_Clinical_${Date.now()}.pdf`);
      showToast(isRw ? 'PDF ya Braille yakuwe neza' : 'Real tactile Braille PDF exported successfully', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error generating Braille PDF', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const presets = [
    {
      title_en: 'Grounding Technique (5-4-3-2-1)',
      title_rw: 'Kwituza (5-4-3-2-1)',
      text_en: 'Look for 5 things you see. Touch 4 things you feel. Listen for 3 sounds. Notice 2 smells. Take 1 deep breath.',
      text_rw: 'Reba ibintu 5 ubona. Kora ku bintu 4 wumva. Tegereza amajwi 3. Humurirwa ibintu 2. Humeka rimwe ryimbitse.'
    },
    {
      title_en: 'Deep Breathing Exercise',
      title_rw: 'Umwitozo wo Guhumeka',
      text_en: 'Inhale through your nose for 4 seconds. Hold for 4 seconds. Exhale slowly through your mouth for 6 seconds.',
      text_rw: 'Kurura umwuka mu mazuru mu masegonda 4. Gumana umwuka amasegonda 4. Sohoka umwuka mu munwa buhoro buhoro mu masegonda 6.'
    },
    {
      title_en: 'Emergency Contact Card',
      title_rw: 'Ikarita y\'Ubutabazi',
      text_en: 'Emergency Hotline: 114. Humura AI Crisis Support is always active. You are not alone.',
      text_rw: 'Nomero y\'ubutabazi: 114. Ubufasha bwa Humura AI burahari igihe cyose. Ntabwo uri wenyine.'
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">

      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-xl font-bold text-xs ${
              toast.type === 'success' ? 'bg-[#08352A] text-white border border-[#21B48D]/40' : 'bg-red-600 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F3EE] text-[#21B48D] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Binary size={13} />
            <span>{isRw ? 'Ikoranabuhanga ryo Gufasha' : 'Tactile Braille Engine (UEB Grade 1)'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08352A] tracking-tight">
            {isRw ? 'Guhindura mu Nyuguti za Braille' : 'Accessible Braille Generator'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-1">
            {isRw ? 'Tegura inyandiko zigenewe abafite ubumuga bwo kutabona mu buvuzi bwawe' : 'Generate mathematically accurate 6-dot tactile vector Braille PDFs for visually impaired patients'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAlphabet(!showAlphabet)}
            className="px-4 py-3 rounded-2xl bg-white hover:bg-[#F4F8F6] text-[#08352A] border border-[#DFEBE5] font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Eye size={15} className="text-[#21B48D]" />
            <span>{isRw ? 'Inyuguti (A-Z)' : 'Braille Alphabet (A-Z)'}</span>
            {showAlphabet ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="px-5 py-3 rounded-2xl bg-[#08352A] hover:bg-[#21B48D] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#08352A]/10 transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Download size={16} />
            <span>{isGeneratingPdf ? 'Generating...' : (isRw ? 'Manura PDF ya Braille' : 'Export Braille PDF')}</span>
          </button>
        </div>
      </div>

      {/* ── ALPHABET REFERENCE ACCORDION ── */}
      <AnimatePresence>
        {showAlphabet && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-[2rem] p-6 border border-[#DFEBE5] shadow-xs space-y-4"
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
                  <p className="text-[11px] text-neutral-400">
                    {isRw ? 'Buri nyuguti igaragaza uburyo utudomo dutondetse' : 'Visual representation of dot matrix for each Latin letter'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAlphabet(false)}
                className="text-neutral-400 hover:text-[#08352A] p-1.5 rounded-xl hover:bg-[#F4F8F6] cursor-pointer"
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
                  <span className="text-xs font-black text-neutral-500 mb-1">{item.char}</span>
                  <span className="text-2xl font-mono text-[#08352A] leading-none mb-1">{item.braille}</span>
                  <span className="text-[9px] text-[#21B48D] font-bold">{item.dots}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PRESETS & FORMAT TOGGLE ── */}
      <div className="bg-white p-5 rounded-[2rem] border border-[#DFEBE5] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 block">
            {isRw ? 'Inyandiko ziteguye z\'ubuvuzi' : 'Clinical Presets & Therapy Guides'}
          </span>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-neutral-400 uppercase">PDF Format:</span>
            <button
              onClick={() => setTactileMode('dual')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                tactileMode === 'dual'
                  ? 'bg-[#08352A] text-white'
                  : 'bg-[#F4F8F6] text-neutral-600 hover:bg-[#DFEBE5]'
              }`}
            >
              Dual Tactile Guide
            </button>
            <button
              onClick={() => setTactileMode('embosser')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                tactileMode === 'embosser'
                  ? 'bg-[#08352A] text-white'
                  : 'bg-[#F4F8F6] text-neutral-600 hover:bg-[#DFEBE5]'
              }`}
            >
              Embosser Clean Only
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setInputText(isRw ? p.text_rw : p.text_en)}
              className="text-left p-3.5 rounded-2xl bg-[#F4F8F6] hover:bg-[#21B48D]/15 hover:border-[#21B48D]/40 border border-[#DFEBE5] transition-all cursor-pointer"
            >
              <h4 className="font-extrabold text-xs text-[#08352A] mb-1">
                {isRw ? p.title_rw : p.title_en}
              </h4>
              <p className="text-[11px] text-neutral-500 line-clamp-2">
                {isRw ? p.text_rw : p.text_en}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* ── TRANSLATOR DUAL WORKSPACE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Source Text Input */}
        <div className="bg-white rounded-[2rem] border border-[#DFEBE5] p-6 sm:p-8 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-[#08352A]">
                {isRw ? 'Inyandiko Isanzwe (Standard Text)' : 'Clinical Text Input'}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSpeech}
                  className={`p-1.5 rounded-xl border transition-all ${
                    isSpeaking 
                      ? 'bg-[#21B48D] text-white border-[#21B48D]' 
                      : 'bg-[#F4F8F6] text-neutral-500 border-[#DFEBE5] hover:text-[#08352A]'
                  }`}
                  title="Audio readout"
                >
                  {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
                <span className="text-xs text-neutral-400 font-bold">
                  {inputText.length} {isRw ? 'inyuguti' : 'characters'}
                </span>
              </div>
            </div>

            <textarea
              rows={8}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isRw ? 'Andika inyandiko ushaka guhindura mu nyuguti za Braille...' : 'Type or paste clinical guidelines, homework instructions, or contact details...'}
              className="w-full p-4 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5] text-sm text-[#08352A] font-medium leading-relaxed focus:border-[#21B48D] focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setInputText('')}
              className="text-xs font-bold text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
            >
              {isRw ? 'Gusiba Byose' : 'Clear Text'}
            </button>
            <span className="text-[11px] font-semibold text-neutral-400">
              {isRw ? 'Bihinduka ako kanya' : 'Instant live transliteration'}
            </span>
          </div>
        </div>

        {/* Braille Output with Tactile Visualization */}
        <div className="bg-[#08352A] text-white rounded-[2rem] p-6 sm:p-8 space-y-4 shadow-xl border border-[#21B48D]/30 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#21B48D] animate-pulse" />
                <h3 className="font-extrabold text-base text-[#21B48D]">
                  {isRw ? 'Inyuguti za Braille (Grade 1)' : 'Grade-1 Braille Output'}
                </h3>
              </div>

              <button
                onClick={handleCopy}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check size={14} className="text-[#21B48D]" /> : <Copy size={14} />}
                <span>{copied ? (isRw ? 'Byakuwe!' : 'Copied!') : (isRw ? 'Koporora' : 'Copy')}</span>
              </button>
            </div>

            {/* Braille Display Box */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 min-h-[190px] max-h-[260px] overflow-y-auto font-mono text-2xl tracking-widest text-emerald-300 leading-loose selection:bg-[#21B48D] selection:text-[#08352A]">
              {brailleText || (
                <span className="text-sm font-sans text-white/40 tracking-normal">
                  {isRw ? 'Inyuguti za Braille zizagaragara hano...' : 'Braille glyphs will render here in real-time...'}
                </span>
              )}
            </div>

            {/* Letter-by-letter live token inspector */}
            {brailleTokens.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1.5">
                  Interactive Dot Matrix Inspector:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-xl bg-black/20">
                  {brailleTokens.filter(t => t.type !== 'space').slice(0, 20).map((tok, idx) => (
                    <div 
                      key={idx}
                      className="px-2 py-1 rounded-lg bg-white/10 border border-white/10 text-center"
                    >
                      <span className="block text-[9px] text-[#21B48D] font-bold">{tok.english}</span>
                      <span className="block text-base font-mono leading-none text-white">{tok.braille}</span>
                    </div>
                  ))}
                  {brailleTokens.length > 20 && (
                    <span className="text-[10px] text-white/40 self-center">+{brailleTokens.length - 20} more</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 text-white/60 text-xs border-t border-white/10">
            <span>Vector 6-Dot Tactile Generation</span>
            <span className="text-[#21B48D] font-bold">100% Embosser & High-DPI Ready</span>
          </div>
        </div>
      </div>

    </div>
  );
}
