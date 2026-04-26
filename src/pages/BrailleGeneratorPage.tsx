import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MoreHorizontal, FileText, Download, Trash2, Languages, Type } from 'lucide-react';
import jsPDF from 'jspdf';
import { addNotification } from '../lib/notifications';

// ──────────────────────────────────────────────────────────────
// BRAILLE MAPPING (Grade 1 English)
// ──────────────────────────────────────────────────────────────
const BRAILLE_MAP: Record<string, string> = {
  'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑', 'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
  'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕', 'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
  'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',
  '1': '⠁', '2': '⠃', '3': '⠉', '4': '⠙', '5': '⠑', '6': '⠋', '7': '⠛', '8': '⠓', '9': '⠊', '0': '⠚',
  ' ': '⠀', '.': '⠲', ',': '⠂', ';': '⠆', ':': '⠒', '!': '⠖', '?': '⠦', '"': '⠶', '(': '⠦', ')': '⠴', '-': '⠤',
};

const NUMBER_PREFIX = '⠼';
const CAPITAL_PREFIX = '⠠';

function convertToBraille(text: string): string {
  let result = '';
  const lowerText = text.toLowerCase();
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const lowerChar = lowerText[i];
    
    // Handle Capitalization
    if (char !== lowerChar && /[a-z]/i.test(char)) {
      result += CAPITAL_PREFIX;
    }
    
    // Handle Numbers (simplified Grade 1)
    if (/[0-9]/.test(char)) {
      if (i === 0 || !/[0-9]/.test(text[i - 1])) {
        result += NUMBER_PREFIX;
      }
    }
    
    result += BRAILLE_MAP[lowerChar] || char;
  }
  
  return result;
}

// ──────────────────────────────────────────────────────────────
// COMPONENT
// ──────────────────────────────────────────────────────────────
export default function BrailleGeneratorPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language || 'en';
  const isRw = lang.startsWith('rw');

  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const brailleText = useMemo(() => convertToBraille(inputText), [inputText]);

  const handleClear = () => {
    setInputText('');
  };

  const generatePDF = () => {
    if (!brailleText) return;
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Braille Document", 20, 20);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 28);
      doc.setFontSize(24);
      const splitBraille = doc.splitTextToSize(brailleText, 170);
      doc.text(splitBraille, 20, 45);
      doc.save(`braille-document-${Date.now()}.pdf`);
      
      addNotification({
        type: 'info',
        titleEn: 'Braille Document Ready',
        titleRw: 'Inyandiko y\'Impumyi Yarangiye',
        messageEn: 'Your Braille PDF has been generated and saved successfully.',
        messageRw: 'Inyandiko yawe ya PDF mu mpumyi yateguwe kandi yabitswe neza.',
        icon: 'FileText',
        color: 'text-blue-500 bg-blue-50',
        link: '/braille'
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Blue Gradient Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 flex items-center gap-3 shadow-md">
        <button 
          onClick={() => navigate(-1)}
          className="text-white p-1 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-white text-xl font-bold tracking-tight">
          {isRw ? 'Gukora Inyandiko mu Nyuguti z’Impumyi' : 'Braille Document Generator'}
        </h1>
        <div className="ml-auto">
          <button className="text-white p-1 opacity-60">
            <MoreHorizontal size={24} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6 flex-1 max-w-2xl mx-auto w-full">
        {/* Input Section */}
        <div className="space-y-2">
          <label className="block text-neutral-700 font-bold text-sm ml-1">
            {isRw ? 'Andika inyandiko yawe' : 'Enter your text'}
          </label>
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isRw ? 'Andika ikintu hano... urugero: Muraho' : 'Type something here... e.g. Hello World'}
              className="w-full h-40 p-4 text-lg border border-neutral-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-white transition-all resize-none text-neutral-800"
            />
            <div className="text-right text-xs text-neutral-500 mt-1 mr-1">
              {inputText.length} {isRw ? 'inyuguti' : 'characters'}
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-2">
          <label className="block text-neutral-700 font-bold text-sm ml-1">
            {isRw ? 'Icyitegererezo cy’impumyi' : 'Braille preview'}
          </label>
          <div 
            className={`w-full min-h-[120px] p-6 rounded-xl border border-neutral-200 flex items-center justify-center text-center transition-all ${
              brailleText ? 'bg-neutral-50 border-neutral-300' : 'bg-[#F9F8F3]'
            }`}
          >
            {brailleText ? (
              <p className="text-4xl text-neutral-800 break-all leading-relaxed font-braille w-full">
                {brailleText}
              </p>
            ) : (
              <p className="text-neutral-400 italic">
                {isRw ? 'Inyuguti z’impumyi zizagaragara hano' : 'Braille symbols will appear here'}
              </p>
            )}
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          <button
            onClick={generatePDF}
            disabled={!brailleText || isGenerating}
            className="h-14 bg-white border border-neutral-300 text-neutral-800 rounded-xl font-bold hover:bg-neutral-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? (isRw ? 'Gukora...' : 'Generating...') : (isRw ? 'Bika PDF' : 'Generate PDF')}
          </button>
          <button
            onClick={handleClear}
            className="h-14 bg-white border border-neutral-300 text-neutral-800 rounded-xl font-bold hover:bg-neutral-50 transition-all shadow-sm active:scale-95"
          >
            {isRw ? 'Kuraho' : 'Clear'}
          </button>
        </div>
      </div>

      {/* Accessibility / Bottom Info */}
      <div className="p-6 text-center">
        <p className="text-xs text-neutral-400 italic font-medium">
          {isRw 
            ? 'Yateguwe mu buryo bworoshye gukoreshwa.' 
            : 'Designed for accessibility and simple touch navigation.'}
        </p>
      </div>
    </div>
  );
}
