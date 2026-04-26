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

  // Numbers (number indicator ⠼ must prefix)
  '1': '⠁', '2': '⠃', '3': '⠉', '4': '⠙', '5': '⠑',
  '6': '⠋', '7': '⠛', '8': '⠓', '9': '⠊', '0': '⠚',

  // Punctuation
  '.': '⠲', ',': '⠂', '?': '⠦', '!': '⠖', ';': '⠆',
  ':': '⠒', '-': '⠤', "'": '⠄', '"': '⠐⠦', '/': '⠌',
  '(': '⠐⠣', ')': '⠐⠜',

  // Space
  ' ': '⠀',
};

// Special indicators
const CAPITAL_INDICATOR = '⠠';
const NUMBER_INDICATOR  = '⠼';

/**
 * Translate a plain English string to Grade 1 Braille Unicode tokens.
 */
export function translateToBraille(text: string): BrailleToken[] {
  const tokens: BrailleToken[] = [];
  let i = 0;
  let inNumberMode = false;

  while (i < text.length) {
    const char = text[i];
    const lower = char.toLowerCase();

    // Space
    if (char === ' ') {
      tokens.push({ english: ' ', braille: '⠀', type: 'space' });
      inNumberMode = false;
      i++;
      continue;
    }

    // Uppercase letter
    if (char >= 'A' && char <= 'Z') {
      const brailleChar = BRAILLE_MAP[lower] || '⠿';
      tokens.push({
        english: char,
        braille: CAPITAL_INDICATOR + brailleChar,
        type: 'letter',
        capital: true
      });
      inNumberMode = false;
      i++;
      continue;
    }

    // Lowercase letter
    if (char >= 'a' && char <= 'z') {
      tokens.push({
        english: char,
        braille: BRAILLE_MAP[lower] || '⠿',
        type: 'letter',
        capital: false
      });
      inNumberMode = false;
      i++;
      continue;
    }

    // Digit
    if (char >= '0' && char <= '9') {
      const prefix = inNumberMode ? '' : NUMBER_INDICATOR;
      tokens.push({
        english: char,
        braille: prefix + (BRAILLE_MAP[char] || '⠿'),
        type: 'number'
      });
      inNumberMode = true;
      i++;
      continue;
    }

    // Punctuation & other
    if (BRAILLE_MAP[char]) {
      tokens.push({ english: char, braille: BRAILLE_MAP[char], type: 'punct' });
    } else {
      tokens.push({ english: char, braille: '⠿', type: 'unknown' });
    }
    inNumberMode = false;
    i++;
  }

  return tokens;
}

/**
 * Return just the Braille string for a given text.
 */
export function toBrailleString(text: string): string {
  return translateToBraille(text).map(t => t.braille).join('');
}
