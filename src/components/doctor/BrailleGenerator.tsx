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
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert(isRw ? 'Nyamuneka emerera "pop-ups" kugira ngo umanure iyi PDF.' : 'Please allow pop-ups to download this PDF.');
      return;
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Humura AI - Braille Translation</title>
          <style>
            @page { margin: 20mm; }
            body { 
              font-family: 'Inter', system-ui, sans-serif; 
              color: #1f2937; 
              line-height: 1.6;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #047857;
              padding-bottom: 20px;
              margin-bottom: 40px;
            }
            h1 { 
              color: #047857; 
              margin: 0;
              font-size: 24px;
            }
            .section { margin-bottom: 40px; }
            .label { 
              font-size: 12px; 
              font-weight: bold; 
              color: #6b7280; 
              text-transform: uppercase; 
              letter-spacing: 1px;
              margin-bottom: 10px; 
            }
            .content { 
              font-size: 16px; 
              padding: 24px; 
              background-color: #f8fafc; 
              border-radius: 16px; 
              border: 1px solid #e2e8f0; 
              white-space: pre-wrap; 
            }
            .braille { 
              font-size: 36px; 
              letter-spacing: 8px; 
              line-height: 1.8; 
              color: #000;
            }
            .footer {
              margin-top: 60px;
              text-align: center;
              font-size: 10px;
              color: #9ca3af;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Humura AI</h1>
            <p>Clinical Braille Translation Record</p>
          </div>
          
          <div class="section">
            <div class="label">Original Text</div>
            <div class="content">${inputText}</div>
          </div>
          
          <div class="section">
            <div class="label">Braille Output</div>
            <div class="content braille">${brailleText}</div>
          </div>

          <div class="footer">
            Generated on ${new Date().toLocaleString()}
          </div>
          
          <script>
            window.onload = () => {
              document.title = "braille_translation_${new Date().getTime()}";
              window.print();
              // Do not auto close so they can see the print dialog or content if print fails
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
