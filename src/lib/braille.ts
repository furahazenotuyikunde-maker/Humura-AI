/**
 * braille.ts
 * Grade 1 English Braille translation engine
 * Uses Unicode Braille Patterns (U+2800–U+28FF)
 */

export interface BrailleToken {
  english: string;
  braille: string;
  type: 'letter' | 'number' | 'punct' | 'space' | 'unknown';
  capital?: boolean;
}

const BRAILLE_MAP: Record<string, string> = {
  // Letters
  'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑',
  'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
  'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕',
  'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
  'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',

  // Numbers (numeric indicator ⠼ must prefix)
  '1': '⠁', '2': '⠃', '3': '⠉', '4': '⠙', '5': '⠑',
  '6': '⠋', '7': '⠛', '8': '⠓', '9': '⠊', '0': '⠚',

  // UEB Punctuation
  '.': '⠲',
  ',': '⠂',
  '?': '⠦',
  '!': '⠖',
  ';': '⠆',
  ':': '⠒',
  '-': '⠤',
  "'": '⠄',
  '"': '⠐⠦', // UEB double quote opening is often ⠐⠦ or ⠘⠦
  '“': '⠘⠦',
  '”': '⠘⠴',
  '‘': '⠠⠦',
  '’': '⠠⠴',
  '/': '⠸⠌',
  '\\': '⠸⠡',
  '(': '⠐⠣',
  ')': '⠐⠜',
  '[': '⠨⠣',
  ']': '⠨⠜',
  '{': '⠸⠣',
  '}': '⠸⠜',
  '•': '⠸⠲',
  '*': '⠐⠔',
  ' ': '⠀',
};

// UEB Indicators
const CAPITAL_INDICATOR = '⠠';
const WORD_CAPITAL_INDICATOR = '⠠⠠';
const NUMBER_INDICATOR  = '⠼';

/**
 * Translate a plain English string to Grade 1 UEB Braille Unicode tokens.
 */
export function translateToBraille(text: string): BrailleToken[] {
  const tokens: BrailleToken[] = [];
  const words = text.split(/(\s+)/); // Keep delimiters
  
  let inNumberMode = false;

  for (const segment of words) {
    // Handle whitespace
    if (/^\s+$/.test(segment)) {
      for (const char of segment) {
        tokens.push({ english: char, braille: BRAILLE_MAP[char] || '⠀', type: 'space' });
      }
      inNumberMode = false;
      continue;
    }

    // Check if word is fully capitalized (UEB word capital indicator)
    const isWordAllCaps = segment.length > 1 && /^[A-Z]+$/.test(segment.replace(/[^\w]/g, ''));
    
    if (isWordAllCaps) {
      tokens.push({ english: '', braille: WORD_CAPITAL_INDICATOR, type: 'unknown' });
    }

    for (let j = 0; j < segment.length; j++) {
      const char = segment[j];
      const lower = char.toLowerCase();

      // Letters
      if (/[a-zA-Z]/.test(char)) {
        const isUpper = char === char.toUpperCase();
        const brailleChar = BRAILLE_MAP[lower] || '⠿';
        
        // If whole word is all caps, don't add single cap indicators
        if (isUpper && !isWordAllCaps) {
          tokens.push({
            english: char,
            braille: CAPITAL_INDICATOR + brailleChar,
            type: 'letter',
            capital: true
          });
        } else {
          tokens.push({
            english: char,
            braille: brailleChar,
            type: 'letter',
            capital: isUpper
          });
        }
        inNumberMode = false;
        continue;
      }

      // Digits
      if (/[0-9]/.test(char)) {
        const prefix = inNumberMode ? '' : NUMBER_INDICATOR;
        tokens.push({
          english: char,
          braille: prefix + (BRAILLE_MAP[char] || '⠿'),
          type: 'number'
        });
        inNumberMode = true;
        continue;
      }

      // Punctuation & other
      if (BRAILLE_MAP[char]) {
        tokens.push({ english: char, braille: BRAILLE_MAP[char], type: 'punct' });
      } else {
        tokens.push({ english: char, braille: '⠿', type: 'unknown' });
      }
      inNumberMode = false;
    }
  }

  return tokens;
}

/**
 * Return just the Braille string for a given text.
 */
export function toBrailleString(text: string): string {
  return translateToBraille(text).map(t => t.braille).join('');
}
