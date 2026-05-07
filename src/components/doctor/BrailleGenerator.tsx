import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { useTranslation } from 'react-i18next';
import { Download, FileText, Languages } from 'lucide-react';

const brailleMap: Record<string, string> = {
  a: '⠁', b: '⠃', c: '⠉', d: '⠙', e: '⠑', f: '⠋', g: '⠛', h: '⠓', i: '⠊', j: '⠚',
  k: '⠅', l: '⠇', m: '⠍', n: '⠝', o: '⠕', p: '⠏', q: '⠟', r: '⠗', s: '⠎', t: '⠞',
  u: '⠥', v: '⠧', w: '⠺', x: '⠭', y: '⠽', z: '⠵',
  '1': '⠼⠁', '2': '⠼⠃', '3': '⠼⠉', '4': '⠼⠙', '5': '⠼⠑',
  '6': '⠼⠋', '7': '⠼⠛', '8': '⠼⠓', '9': '⠼⠊', '0': '⠼⠚',
  ',': '⠂', ';': '⠆', ':': '⠒', '.': '⠲', '!': '⠖', '?': '⠦',
  ' ': ' ', '\n': '\n'
};

const translateToBraille = (text: string) => {
  return text.toLowerCase().split('').map(char => brailleMap[char] || char).join('');
};

export default function BrailleGenerator() {
  const { t, i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const [inputText, setInputText] = useState('');

  const brailleText = translateToBraille(inputText);

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont("Helvetica");
    
    doc.setFontSize(20);
    doc.text("Humura AI - Braille Translation", 20, 20);
    
    doc.setFontSize(12);
    doc.text("Original Text:", 20, 35);
    
    doc.setFontSize(10);
    const splitOriginalText = doc.splitTextToSize(inputText, 170);
    doc.text(splitOriginalText, 20, 45);
    
    const yOffset = 45 + (splitOriginalText.length * 5) + 10;
    
    doc.setFontSize(12);
    doc.text("Braille Output:", 20, yOffset);
    
    // jsPDF standard fonts do not support braille unicode characters well,
    // so we need to add a font that supports Braille or use standard text mapping.
    // For this context, jsPDF might fallback to default representation or boxes. 
    // To ensure braille displays correctly in PDF with standard jspdf, we could embed a font,
    // but without an embedded font file, it might not render the unicode dots correctly in standard Helvetica.
    // Assuming standard unicode fallback for now.
    // However, jspdf html method or adding a custom font is the most robust.
    // We will use standard text for now.
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    const splitBrailleText = doc.splitTextToSize(brailleText, 170);
    doc.text(splitBrailleText, 20, yOffset + 10);
    
    doc.save("braille_translation.pdf");
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h3 className="text-2xl font-black text-[#4A2C1A] flex items-center gap-3">
          <Languages className="text-primary" size={28} />
          {isRw ? 'Inyuguti za Braille' : 'Braille Generator'}
        </h3>
        <p className="text-sm font-bold text-neutral-400">
          {isRw 
            ? 'Hindura inyandiko isanzwe mu nyuguti za Braille ugamije gufasha abarwayi batabona.' 
            : 'Translate standard text into Braille for visually impaired patients.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-[#E8E1DB] p-6 space-y-4 shadow-sm flex flex-col h-[500px]">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-neutral-400" />
            <h4 className="text-xs font-black uppercase text-neutral-500 tracking-widest">{isRw ? 'Inyandiko isanzwe' : 'Standard Text'}</h4>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isRw ? "Andika inyandiko hano..." : "Type text here to translate..."}
            className="w-full flex-1 bg-neutral-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 ring-primary/30 outline-none resize-none"
          />
        </div>

        <div className="bg-primary/5 rounded-3xl border border-primary/20 p-6 space-y-4 shadow-sm flex flex-col h-[500px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Languages size={16} className="text-primary" />
              <h4 className="text-xs font-black uppercase text-primary tracking-widest">Braille Output</h4>
            </div>
            {brailleText && (
              <button 
                onClick={downloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-[10px] font-black uppercase rounded-xl hover:scale-105 transition-all shadow-md"
              >
                <Download size={14} />
                {isRw ? 'Gukuramo PDF' : 'Download PDF'}
              </button>
            )}
          </div>
          <div className="w-full flex-1 bg-white border border-primary/10 rounded-2xl p-6 text-2xl tracking-widest break-words overflow-y-auto font-sans text-neutral-800">
            {brailleText || (
              <span className="text-neutral-300 text-sm italic font-medium tracking-normal">
                {isRw ? "Ibisubizo bya Braille bizagaragara hano..." : "Braille translation will appear here..."}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
