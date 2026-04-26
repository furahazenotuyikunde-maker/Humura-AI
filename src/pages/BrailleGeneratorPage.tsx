import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MoreHorizontal, FileText, Download, Trash2, Languages, Type, Copy, Check, Info } from 'lucide-react';
import jsPDF from 'jspdf';
import { addNotification } from '../lib/notifications';

// ──────────────────────────────────────────────────────────────
// BRAILLE MAPPING (UEB Grade 1)
// ──────────────────────────────────────────────────────────────
const BRAILLE_MAP: Record<string, string> = {
  // Letters
  'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑', 'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
  'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕', 'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
  'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',
  // Numbers (shared with a-j)
  '1': '⠁', '2': '⠃', '3': '⠉', '4': '⠙', '5': '⠑', '6': '⠋', '7': '⠛', '8': '⠓', '9': '⠊', '0': '⠚',
  // Punctuation & Symbols
  ' ': '⠀', 
  '.': '⠲', ',': '⠂', ';': '⠆', ':': '⠒', '!': '⠖', '?': '⠦', 
  '(': '⠦', ')': '⠴', '[': '⠨⠦', ']': '⠨⠴', '{': '⠸⠦', '}': '⠸⠴',
  '"': '⠶', "'": '⠄', '-': '⠤', '_': '⠨⠤', '/': '⠸⠌', '\\': '⠸⠡',
  '@': '⠈⠁', '#': '⠼', '$': '⠈⠎', '%': '⠨⠏', '&': '⠯', '*': '⠐⠔',
  '+': '⠐⠖', '=': '⠐⠶', '<': '⠨⠣', '>': '⠨⠜', '^': '⠈⠮'
};

const NUMBER_PREFIX = '⠼';
const CAPITAL_PREFIX = '⠠';

function convertToBraille(text: string): string {
  if (!text) return '';
  let result = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const lowerChar = char.toLowerCase();
    
    // Handle Numbers
    if (/[0-9]/.test(char)) {
      if (i === 0 || !/[0-9]/.test(text[i - 1])) {
        result += NUMBER_PREFIX;
      }
      result += BRAILLE_MAP[char] || char;
      continue;
    }
    
    // Handle Capitals
    if (char !== lowerChar && /[a-z]/i.test(char)) {
      result += CAPITAL_PREFIX;
    }
    
    result += BRAILLE_MAP[lowerChar] || char;
  }
  
  return result;
}

export default function BrailleGeneratorPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language || 'en';
  const isRw = lang.startsWith('rw');

  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const brailleText = useMemo(() => convertToBraille(inputText), [inputText]);

  const handleClear = () => {
    setInputText('');
  };

  const handleCopy = () => {
    if (!brailleText) return;
    navigator.clipboard.writeText(brailleText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generatePDF = () => {
    if (!brailleText) return;
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const margin = 20;
      let x = margin;
      let y = 45;
      const dotRadius = 0.6;
      const dotSpacing = 2.5;
      const cellSpacing = 6;
      const lineHeight = 12;

      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(15, 20, 80);
      doc.text("Braille Document", margin, 20);
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 140);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, 28);
      
      doc.setDrawColor(200, 200, 210);
      doc.line(margin, 32, 190, 32);

      // Draw Braille Dots
      doc.setFillColor(15, 20, 80);
      
      for (let i = 0; i < brailleText.length; i++) {
        const char = brailleText[i];
        const code = char.charCodeAt(0);
        
        // Unicode Braille starts at 0x2800
        if (code >= 0x2800 && code <= 0x28FF) {
          const dots = code - 0x2800;
          
          // 2x3 Grid Mapping (Dots 1-6)
          const dotPositions = [
            { bit: 0x01, dx: 0, dy: 0 },             // Dot 1
            { bit: 0x02, dx: 0, dy: dotSpacing },    // Dot 2
            { bit: 0x04, dx: 0, dy: dotSpacing * 2 },// Dot 3
            { bit: 0x08, dx: dotSpacing, dy: 0 },    // Dot 4
            { bit: 0x10, dx: dotSpacing, dy: dotSpacing }, // Dot 5
            { bit: 0x20, dx: dotSpacing, dy: dotSpacing * 2 } // Dot 6
          ];

          dotPositions.forEach(pos => {
            if (dots & pos.bit) {
              doc.circle(x + pos.dx, y + pos.dy, dotRadius, 'F');
            }
          });
        }

        // Advance X position
        x += cellSpacing;

        // Wrap text
        if (x > 180 || char === '\n') {
          x = margin;
          y += lineHeight;
        }

        // Add new page if needed
        if (y > 270) {
          doc.addPage();
          y = margin;
        }
      }

      doc.save(`braille-document-${Date.now()}.pdf`);
      
      addNotification({
        type: 'info',
        titleEn: 'PDF Generated',
        titleRw: 'PDF Yakozwe',
        messageEn: 'Your Braille document is ready with real dot vectors.',
        messageRw: 'Inyandiko yawe yarangiye neza.',
        icon: 'FileText',
        color: 'text-primary bg-primary-50',
        link: '/braille'
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans pb-10">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 p-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-600"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-black text-neutral-900 tracking-tight">
              {isRw ? 'Semura mu nshuti' : 'Braille Translator'}
            </h1>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              Grade 1 English Braille (UEB)
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 flex-1 max-w-2xl mx-auto w-full pt-8">
        {/* Input Card */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-neutral-200 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
              <Type size={14} />
              {isRw ? 'Andika inyandiko' : 'Source Text'}
            </label>
            <button 
              onClick={handleClear}
              className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
            >
              <Trash2 size={12} />
              {isRw ? 'Gusiba' : 'Clear'}
            </button>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isRw ? 'Andika hano...' : 'Enter English text to translate...'}
            className="w-full h-32 text-lg font-medium bg-neutral-50 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/10 border-none resize-none placeholder:text-neutral-300 transition-all"
          />
        </div>

        {/* Output Card */}
        <div className="bg-white rounded-[2rem] p-6 shadow-md border-2 border-primary/20 space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Languages size={14} />
              {isRw ? 'Inyandiko y\'abafite ubumuga' : 'Braille Output'}
            </label>
            <button
              onClick={handleCopy}
              disabled={!brailleText}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                copied ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary hover:bg-primary/20'
              } disabled:opacity-30`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? (isRw ? 'Byakopewe' : 'Copied!') : (isRw ? 'Kopa' : 'Copy')}
            </button>
          </div>

          <div className="min-h-[160px] flex items-center justify-center p-4 bg-primary-50/30 rounded-2xl border border-dashed border-primary/20 relative z-10">
            {brailleText ? (
              <p className="text-5xl text-primary-900 break-all leading-[1.6] font-braille w-full text-center tracking-wider">
                {brailleText}
              </p>
            ) : (
              <div className="text-center space-y-2 opacity-30">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Languages size={24} />
                </div>
                <p className="text-sm font-bold italic">
                  {isRw ? 'Inyuguti zizagaragara hano' : 'Translation will appear here'}
                </p>
              </div>
            )}
          </div>

          {/* Decorative background circle */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-3 pt-4">
          <button
            onClick={generatePDF}
            disabled={!brailleText || isGenerating}
            className="flex items-center justify-center gap-3 h-16 bg-primary text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary-900 transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={20} />}
            {isGenerating ? (isRw ? 'Gukora...' : 'Processing...') : (isRw ? 'Bika kuri PDF' : 'Save as PDF')}
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
          <Info className="text-blue-500 shrink-0" size={20} />
          <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
            {isRw 
              ? 'Iri semura rirakoresha uburyo bwa Grade 1 (UEB). Ni uburyo bwiza bwo kwigira no gukora inyandiko zoroheje z\'abafite ubumuga bwo kutabona.' 
              : 'This translator uses Unified English Braille (UEB) Grade 1. It is designed for educational purposes and creating accessible labels or short documents.'}
          </p>
        </div>
      </div>
    </div>
  );
}

