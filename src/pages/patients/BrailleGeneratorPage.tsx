import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Check, CircleHelp, HeartHandshake,
  Keyboard, MessageCircle, RotateCcw, Send, Volume2, VolumeX
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LETTERS = [
  '⠁', '⠃', '⠉', '⠙', '⠑', '⠋', '⠛', '⠓', '⠊', '⠚',
  '⠅', '⠇', '⠍', '⠝', '⠕', '⠏', '⠟', '⠗', '⠎', '⠞',
  '⠥', '⠧', '⠺', '⠭', '⠽', '⠵'
];

const BRAILLE_TO_LETTER = new Map(LETTERS.map((cell, index) => [cell, String.fromCharCode(97 + index)]));
const BRAILLE_PUNCTUATION = new Map([
  ['⠂', ','], ['⠲', '.'], ['⠦', '?'], ['⠖', '!'], ['⠆', ';'],
  ['⠒', ':'], ['⠤', '-'], ['⠄', "'"], ['⠐⠣', '('],
  ['⠐⠜', ')'], ['⠌', '/']
]);
const NUMBER_SIGN = '⠼';
const CAPITAL_SIGN = '⠠';
const BLANK_CELL = '⠀';

function decodeBraille(input: string) {
  const cells = Array.from(input);
  let output = '';
  let capitalizeNext = false;
  let capitalWord = false;
  let numberMode = false;

  for (let index = 0; index < cells.length; index += 1) {
    const cell = cells[index];
    if (cell === '\n' || cell === '\r') {
      output += cell;
      capitalizeNext = false;
      capitalWord = false;
      numberMode = false;
      continue;
    }
    if (cell === BLANK_CELL || /\s/.test(cell)) {
      output += ' ';
      capitalizeNext = false;
      capitalWord = false;
      numberMode = false;
      continue;
    }
    if (cell === CAPITAL_SIGN) {
      if (cells[index + 1] === CAPITAL_SIGN) {
        capitalWord = true;
        index += 1;
      } else {
        capitalizeNext = true;
      }
      numberMode = false;
      continue;
    }
    if (cell === NUMBER_SIGN) {
      numberMode = true;
      capitalizeNext = false;
      continue;
    }
    if (numberMode) {
      const number = BRAILLE_TO_LETTER.get(cell);
      if (number && 'abcdefghij'.includes(number)) {
        output += String('abcdefghij'.indexOf(number) + 1).replace('10', '0');
        continue;
      }
      if (cell === '⠂') {
        output += ',';
        continue;
      }
      numberMode = false;
    }

    if (cell === '⠐' && cells[index + 1] === '⠦') {
      output += '"';
      index += 1;
      capitalizeNext = false;
      continue;
    }
    const decoded = BRAILLE_TO_LETTER.get(cell) ?? BRAILLE_PUNCTUATION.get(cell);
    if (decoded) {
      output += capitalizeNext || capitalWord ? decoded.toUpperCase() : decoded;
    } else {
      output += `[${cell}]`;
    }
    if (capitalizeNext) capitalizeNext = false;
    numberMode = false;
  }
  return output;
}

function cellFromDots(dots: number[]) {
  const mask = dots.reduce((value, dot) => value | (1 << (dot - 1)), 0);
  return String.fromCharCode(0x2800 + mask);
}

export default function BrailleGeneratorPage() {
  const navigate = useNavigate();
  const [brailleInput, setBrailleInput] = useState('');
  const [selectedDots, setSelectedDots] = useState<number[]>([]);
  const [notice, setNotice] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const decodedMessage = useMemo(() => decodeBraille(brailleInput), [brailleInput]);
  const toggleDot = (dot: number) => {
    setSelectedDots(current => current.includes(dot)
      ? current.filter(value => value !== dot)
      : [...current, dot].sort((a, b) => a - b));
  };

  const addCell = () => {
    if (!selectedDots.length) {
      setNotice('Choose one or more dots first, or enter Braille in the message field.');
      return;
    }
    setBrailleInput(current => current + cellFromDots(selectedDots));
    setSelectedDots([]);
    setNotice('');
  };

  const appendSpace = () => {
    setBrailleInput(current => `${current} `);
    setSelectedDots([]);
    setNotice('');
  };

  const removeLastCell = () => {
    setBrailleInput(current => Array.from(current).slice(0, -1).join(''));
  };

  const sendToHumura = () => {
    if (!decodedMessage.trim()) {
      setNotice('Enter a Braille message before asking for support.');
      return;
    }
    sessionStorage.setItem(
      'humura_prefilled_prompt',
      decodedMessage
    );
    sessionStorage.setItem('humura_prefilled_prompt_format', 'braille');
    navigate('/patient/chat');
  };

  const speakMessage = () => {
    if (!decodedMessage.trim() || !('speechSynthesis' in window)) {
      setNotice('Read-aloud is not available in this browser.');
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(decodedMessage);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className="min-h-screen bg-[#F4F8F6] px-4 py-6 font-poppins text-[#153C32] sm:px-7 sm:py-9 lg:px-10">
      <main className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-3xl bg-[#103C31] p-6 text-white shadow-[0_16px_38px_-24px_rgba(8,53,42,0.7)] sm:p-9">
          <button
            type="button"
            onClick={() => navigate('/patient/chat')}
            className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[#D4E8DE] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A6E5C5]"
          >
            <ArrowLeft size={17} aria-hidden="true" /> Back to AI chat
          </button>
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-[#A6E5C5]">
              <HeartHandshake size={25} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#A6E5C5]">Accessible support</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Talk to Humura in Braille</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#E1EEE7] sm:text-base">
                Enter a Braille message using your keyboard or the six-dot pad. We’ll convert it to text and send it to AI chat so you can get support.
              </p>
            </div>
          </div>
        </header>

        <section aria-labelledby="composer-heading" className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-[#DEEAE3] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EAF5EE] text-[#28745F]"><Keyboard size={20} aria-hidden="true" /></div>
              <div>
                <h2 id="composer-heading" className="text-xl font-bold">Your Braille message</h2>
                <p className="mt-1 text-sm leading-6 text-[#64776E]">Type or paste Unicode Braille cells, or build them with the dot pad.</p>
              </div>
            </div>

            <label htmlFor="braille-input" className="mt-5 block text-sm font-semibold text-[#345548]">Braille input</label>
            <textarea
              id="braille-input"
              value={brailleInput}
              onChange={event => { setBrailleInput(event.target.value); setNotice(''); }}
              placeholder="Type or paste Braille cells here…"
              aria-describedby="braille-help"
              autoComplete="off"
              spellCheck={false}
              className="mt-2 min-h-36 w-full resize-y rounded-2xl border border-[#CBDCD2] bg-[#F8FBF9] p-4 font-mono text-3xl leading-relaxed text-[#153C32] placeholder:text-base placeholder:text-[#778A80] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21805D]"
            />
            <p id="braille-help" className="mt-2 text-xs leading-5 text-[#65786E]">
              Supports uncontracted English Braille (Grade 1): letters, basic punctuation, numbers, and capital indicators. Unrecognized cells are shown in brackets.
            </p>

            <div className="mt-5 rounded-2xl border border-[#E1ECE5] bg-[#F7FAF8] p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-[#264B3C]">Six-dot Braille pad</h3>
                <span className="text-xs text-[#65786E]">Select dots, then add a cell</span>
              </div>
              <div className="mt-4 flex items-center justify-center gap-6">
                <div className="grid grid-cols-2 gap-3" role="group" aria-label="Select Braille dots">
                  {[1, 4, 2, 5, 3, 6].map(dot => (
                    <button
                      key={dot}
                      type="button"
                      aria-pressed={selectedDots.includes(dot)}
                      aria-label={`Dot ${dot}${selectedDots.includes(dot) ? ', selected' : ''}`}
                      onClick={() => toggleDot(dot)}
                      className={`grid h-12 w-12 place-items-center rounded-full border-2 text-base font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21805D] focus-visible:ring-offset-2 ${selectedDots.includes(dot) ? 'border-[#153C32] bg-[#153C32] text-white' : 'border-[#AFC7B8] bg-white text-[#345548] hover:border-[#28745F]'}`}
                    >
                      {dot}
                    </button>
                  ))}
                </div>
                <span className="min-w-16 text-center font-mono text-5xl text-[#153C32]" aria-label="Current Braille cell preview">
                  {selectedDots.length ? cellFromDots(selectedDots) : '⠀'}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <button type="button" onClick={addCell} className="min-h-11 rounded-xl bg-[#153C32] px-3 text-sm font-bold text-white hover:bg-[#205B49] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21805D] focus-visible:ring-offset-2">
                  Add cell
                </button>
                <button type="button" onClick={appendSpace} className="min-h-11 rounded-xl border border-[#D1E0D7] bg-white px-3 text-sm font-semibold text-[#345548] hover:bg-[#F2F7F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21805D]">
                  Add space
                </button>
                <button type="button" onClick={removeLastCell} disabled={!brailleInput} className="min-h-11 rounded-xl border border-[#D1E0D7] bg-white px-3 text-sm font-semibold text-[#345548] hover:bg-[#F2F7F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21805D] disabled:opacity-50">
                  Delete last
                </button>
              </div>
              <p className="sr-only" aria-live="polite">{selectedDots.length ? `Dots ${selectedDots.join(', ')} selected` : 'No dots selected'}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => { setBrailleInput(''); setSelectedDots([]); setNotice('Message cleared.'); }} disabled={!brailleInput && !selectedDots.length} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#526B62] hover:bg-[#F1F6F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21805D] disabled:opacity-50">
                <RotateCcw size={16} aria-hidden="true" /> Clear message
              </button>
              <button type="button" onClick={speakMessage} disabled={!decodedMessage.trim()} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#526B62] hover:bg-[#F1F6F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21805D] disabled:opacity-50">
                {isSpeaking ? <VolumeX size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
                {isSpeaking ? 'Stop reading' : 'Read text aloud'}
              </button>
            </div>
          </div>

          <div className="flex flex-col rounded-3xl border border-[#DEEAE3] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EAF5EE] text-[#28745F]"><MessageCircle size={20} aria-hidden="true" /></div>
              <div>
                <h2 className="text-xl font-bold">Text preview</h2>
                <p className="mt-1 text-sm leading-6 text-[#64776E]">Check the converted message before sending it to Humura AI.</p>
              </div>
            </div>
            <div className="mt-5 min-h-48 flex-1 rounded-2xl border border-[#E1ECE5] bg-[#F8FBF9] p-4" aria-live="polite" aria-atomic="true">
              {decodedMessage ? (
                <p className="whitespace-pre-wrap break-words text-base leading-7 text-[#25473A]">{decodedMessage}</p>
              ) : (
                <p className="text-sm leading-6 text-[#778A80]">Your decoded message will appear here as you enter Braille.</p>
              )}
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#F1F6F3] p-3 text-xs leading-5 text-[#526B62]">
              <CircleHelp size={16} className="mt-0.5 shrink-0 text-[#28745F]" aria-hidden="true" />
              <p>Review the preview carefully. If a cell cannot be decoded, it appears in square brackets so you can correct it before sending.</p>
            </div>
            <button
              type="button"
              onClick={sendToHumura}
              disabled={!decodedMessage.trim()}
              className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#153C32] px-5 text-sm font-bold text-white transition hover:bg-[#205B49] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21805D] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={17} aria-hidden="true" /> Send to AI chat for support <ArrowRight size={17} aria-hidden="true" />
            </button>
            <p className="mt-3 text-center text-xs leading-5 text-[#65786E]">Your message is sent to Humura AI chat so you can continue the conversation there.</p>
          </div>
        </section>

        {notice && (
          <p role="status" className="rounded-xl border border-[#D8E9DB] bg-[#F0F8F2] px-4 py-3 text-sm text-[#28583E]">
            {notice}
          </p>
        )}

        <motion.aside initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-[#DCE9E1] bg-white p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EDF5EF] text-[#28745F]"><Check size={18} aria-hidden="true" /></div>
            <div>
              <h2 className="text-sm font-bold text-[#25473A]">Designed for your preferred way to communicate</h2>
              <p className="mt-1 text-sm leading-6 text-[#64776E]">
                Use a refreshable Braille display or Braille keyboard to enter Unicode cells, or select dots with the on-screen pad. This tool converts English Grade 1 Braille; review the text preview before sending.
              </p>
            </div>
          </div>
        </motion.aside>
      </main>
    </div>
  );
}
