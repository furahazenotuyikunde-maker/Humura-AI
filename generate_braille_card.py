from fpdf import FPDF, XPos, YPos
from fpdf.enums import Align
import os
import re

# ==========================================
# UEB TRANSLATION ENGINE (GRADE 1)
# ==========================================
BRAILLE_MAP = {
    'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑',
    'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
    'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕',
    'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
    'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',
    '1': '⠁', '2': '⠃', '3': '⠉', '4': '⠙', '5': '⠑',
    '6': '⠋', '7': '⠛', '8': '⠓', '9': '⠊', '0': '⠚',
    '.': '⠲', ',': '⠂', '?': '⠦', '!': '⠖', ';': '⠆',
    ':': '⠒', '-': '⠤', "'": '⠄', '"': '⠐⠦', '/': '⠸⠌',
    '(': '⠐⠣', ')': '⠐⠜', '•': '⠸⠲', ' ': '⠀'
}

CAPITAL_INDICATOR = '⠠'
WORD_CAPITAL_INDICATOR = '⠠⠠'
NUMBER_INDICATOR = '⠼'

def translate_to_braille(text):
    tokens = []
    # Split into words and spaces
    words = re.split(r'(\s+)', text)
    in_number_mode = False
    
    for segment in words:
        if not segment: continue
        
        # Whitespace
        if segment.isspace():
            for char in segment:
                tokens.append((BRAILLE_MAP.get(char, '⠀'), char))
            in_number_mode = False
            continue
            
        # UEB Word Capitalization
        is_word_all_caps = len(segment) > 1 and segment.isalpha() and segment.isupper()
        if is_word_all_caps:
            tokens.append((WORD_CAPITAL_INDICATOR, ""))
            
        for char in segment:
            lower = char.lower()
            
            # Letters
            if char.isalpha():
                is_upper = char.isupper()
                braille_char = BRAILLE_MAP.get(lower, '⠿')
                if is_upper and not is_word_all_caps:
                    tokens.append((CAPITAL_INDICATOR + braille_char, char))
                else:
                    tokens.append((braille_char, char))
                in_number_mode = False
            
            # Numbers
            elif char.isdigit():
                prefix = "" if in_number_mode else NUMBER_INDICATOR
                tokens.append((prefix + BRAILLE_MAP.get(char, '⠿'), char))
                in_number_mode = True
                
            # Punctuation
            else:
                tokens.append((BRAILLE_MAP.get(char, '⠿'), char))
                in_number_mode = False
                
    return tokens

# ==========================================
# CONFIGURATION
# ==========================================
ENGLISH_PHRASE = "INTERPRETATION: NO TREND"
BREAKDOWN = translate_to_braille(ENGLISH_PHRASE)
BRAILLE_STRING = "".join([t[0] for t in BREAKDOWN])

# ==========================================
# PDF CLASS DEFINITION
# ==========================================
class BrailleCardPDF(FPDF):
    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.navy = (15, 20, 80)
        self.card_bg = (245, 247, 255)
        self.row_a = (235, 238, 255)
        self.row_b = (255, 255, 255)
        self.label_gray = (140, 140, 160)
        self.footer_blue = (180, 185, 220)

        # Font setup
        font_path = "C:\\Windows\\Fonts\\" if os.name == 'nt' else "/usr/share/fonts/truetype/dejavu/"
        try:
            self.add_font("DejaVu", "", os.path.join(font_path, "DejaVuSans.ttf"))
            self.add_font("DejaVuB", "B", os.path.join(font_path, "DejaVuSans-Bold.ttf"))
        except:
            print("Warning: Custom fonts not found.")

    def header(self):
        self.set_fill_color(*self.navy)
        self.rect(0, 0, 210, 28, "F")
        self.set_y(10)
        self.set_font("DejaVuB", "B", 18) if "DejaVuB" in self.fonts else self.set_font("Helvetica", "B", 18)
        self.set_text_color(255, 255, 255)
        self.cell(0, 8, "BRAILLE COMMUNICATION CARD", align=Align.C, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def draw_footer(self):
        self.set_fill_color(*self.navy)
        self.rect(0, 280, 210, 17, "F")
        self.set_y(285)
        self.set_font("DejaVu", "", 9) if "DejaVu" in self.fonts else self.set_font("Helvetica", "", 9)
        self.set_text_color(*self.footer_blue)
        self.cell(0, 5, "Unified English Braille (UEB) — Grade 1", align=Align.C)

    def draw_main_card(self):
        self.set_fill_color(*self.card_bg)
        self.set_draw_color(*self.navy)
        self.set_line_width(1.0)
        self.rect(15, 40, 180, 130, "DF")
        
        self.set_y(52)
        self.set_font("DejaVu", "", 12) if "DejaVu" in self.fonts else self.set_font("Helvetica", "", 12)
        self.set_text_color(*self.label_gray)
        self.cell(0, 10, "English Text", align=Align.C, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        # Adjust font size for longer text
        font_size = 48 if len(ENGLISH_PHRASE) < 15 else 32
        self.set_font("DejaVuB", "B", font_size) if "DejaVuB" in self.fonts else self.set_font("Helvetica", "B", font_size)
        self.set_text_color(*self.navy)
        self.cell(0, 25, ENGLISH_PHRASE, align=Align.C, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        self.set_draw_color(210, 215, 230)
        self.set_line_width(0.4)
        self.line(35, 100, 175, 100)
        
        self.set_y(110)
        self.set_font("DejaVu", "", 11) if "DejaVu" in self.fonts else self.set_font("Helvetica", "", 11)
        self.set_text_color(*self.label_gray)
        self.cell(0, 10, "Unified English Braille (UEB) Grade 1", align=Align.C, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        # Adjust Braille font size
        braille_font_size = 52 if len(BRAILLE_STRING) < 15 else 32
        self.set_font("DejaVu", "", braille_font_size) if "DejaVu" in self.fonts else self.set_font("Helvetica", "", braille_font_size)
        self.set_text_color(*self.navy)
        self.cell(0, 30, BRAILLE_STRING, align=Align.C, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        self.set_y(155)
        self.set_font("DejaVu", "", 10) if "DejaVu" in self.fonts else self.set_font("Helvetica", "", 10)
        self.set_text_color(*self.label_gray)
        self.cell(0, 10, "⠠⠠ = Word Caps | ⠼ = Number | UEB Standard", align=Align.C)

    def draw_breakdown_table(self):
        if not BREAKDOWN: return
        table_y = 185
        self.set_y(table_y)
        self.set_fill_color(*self.navy)
        self.set_font("DejaVuB", "B", 12) if "DejaVuB" in self.fonts else self.set_font("Helvetica", "B", 12)
        self.set_text_color(255, 255, 255)
        self.set_x(15)
        self.cell(180, 12, "UEB Breakdown", align=Align.C, fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        # Split breakdown into chunks to avoid table overflow
        chunk_size = 12
        for start_idx in range(0, len(BREAKDOWN), chunk_size):
            chunk = BREAKDOWN[start_idx:start_idx + chunk_size]
            num_cols = len(chunk)
            col_width = 180 / num_cols
            start_y = self.get_y()
            
            # Braille Row
            for i, (braille, letter) in enumerate(chunk):
                self.set_x(15 + (i * col_width))
                color = self.row_a if i % 2 == 0 else self.row_b
                self.set_fill_color(*color)
                self.set_text_color(*self.navy)
                self.set_font("DejaVu", "", 18) if "DejaVu" in self.fonts else self.set_font("Helvetica", "", 18)
                self.cell(col_width, 14, braille, border=1, align=Align.C, fill=True)
            self.set_y(start_y + 14)
            
            # Letter Row
            for i, (braille, letter) in enumerate(chunk):
                self.set_x(15 + (i * col_width))
                color = self.row_a if i % 2 == 0 else self.row_b
                self.set_fill_color(*color)
                self.set_text_color(*self.navy)
                self.set_font("DejaVuB", "B", 12) if "DejaVuB" in self.fonts else self.set_font("Helvetica", "B", 12)
                self.cell(col_width, 10, letter if letter else "IND", border=1, align=Align.C, fill=True)
            self.set_y(self.get_y() + 5)

def main():
    try:
        pdf = BrailleCardPDF()
        pdf.add_page()
        pdf.draw_main_card()
        pdf.draw_breakdown_table()
        pdf.draw_footer()
        pdf.output("braille_card_ueb.pdf")
        print("Generated braille_card_ueb.pdf using UEB Model.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
