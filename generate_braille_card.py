from fpdf import FPDF, XPos, YPos
from fpdf.enums import Align
import os

# ==========================================
# CONFIGURATION - CHANGE CONTENT HERE
# ==========================================
ENGLISH_PHRASE = "I AM SICK"
BRAILLE_STRING = "⠠⠊⠀⠠⠁⠠⠍⠀⠠⠎⠊⠉⠅"

# Letter-by-letter breakdown for the table
BREAKDOWN = [
    ("⠠⠊", "I"), ("⠀", " "), ("⠠⠁", "A"), ("⠠⠍", "M"), ("⠀", " "), 
    ("⠠⠎", "S"), ("⠊", "I"), ("⠉", "C"), ("⠅", "K")
]

# ==========================================
# PDF CLASS DEFINITION
# ==========================================
class BrailleCardPDF(FPDF):
    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="A4")
        
        # Color Palette
        self.navy = (15, 20, 80)
        self.card_bg = (245, 247, 255)
        self.row_a = (235, 238, 255)
        self.row_b = (255, 255, 255)
        self.label_gray = (140, 140, 160)
        self.footer_blue = (180, 185, 220)

        # Register Fonts
        # On Windows, these might be in C:\Windows\Fonts\
        # On Linux, usually in /usr/share/fonts/truetype/dejavu/
        font_path = "/usr/share/fonts/truetype/dejavu/"
        
        # Fallback check for Windows environments if Linux path fails
        if not os.path.exists(font_path):
             font_path = "C:\\Windows\\Fonts\\" # Common Windows path
             
        try:
            self.add_font("DejaVu", "", os.path.join(font_path, "DejaVuSans.ttf"))
            self.add_font("DejaVuB", "B", os.path.join(font_path, "DejaVuSans-Bold.ttf"))
        except:
            # If path still fails, try to use built-in font for labels but Braille will need Unicode support
            print("Warning: Custom fonts not found. Braille characters may not render correctly.")

    def header(self):
        # Header Bar
        self.set_fill_color(*self.navy)
        self.rect(0, 0, 210, 28, "F")
        
        # Header Text
        self.set_y(10)
        self.set_font("DejaVuB", "B", 18)
        self.set_text_color(255, 255, 255)
        self.cell(0, 8, "BRAILLE COMMUNICATION CARD", align=Align.C, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def draw_footer(self):
        # Footer Bar
        self.set_fill_color(*self.navy)
        self.rect(0, 280, 210, 17, "F")
        
        # Footer Text
        self.set_y(285)
        self.set_font("DejaVu", "", 9)
        self.set_text_color(*self.footer_blue)
        self.cell(0, 5, "Unicode Braille Patterns — Accessible Communication Tool", align=Align.C)

    def draw_main_card(self):
        # Card Box Container
        self.set_fill_color(*self.card_bg)
        self.set_draw_color(*self.navy)
        self.set_line_width(1.0) # Thicker border for premium look
        self.rect(15, 40, 180, 130, "DF")
        
        # English Text Section
        self.set_y(52)
        self.set_font("DejaVu", "", 12)
        self.set_text_color(*self.label_gray)
        self.cell(0, 10, "English Text", align=Align.C, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        self.set_font("DejaVuB", "B", 48) # Larger bold font
        self.set_text_color(*self.navy)
        self.cell(0, 25, ENGLISH_PHRASE, align=Align.C, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        # Divider Line
        self.set_draw_color(210, 215, 230)
        self.set_line_width(0.4)
        self.line(35, 100, 175, 100)
        
        # Braille Section
        self.set_y(110)
        self.set_font("DejaVu", "", 11)
        self.set_text_color(*self.label_gray)
        self.cell(0, 10, "Grade 1 English Braille (Unicode U+2800-U+28FF)", align=Align.C, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        self.set_font("DejaVu", "", 52) # Massive Braille font
        self.set_text_color(*self.navy) # Match the navy theme
        self.cell(0, 30, BRAILLE_STRING, align=Align.C, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        # Legend
        self.set_y(155)
        self.set_font("DejaVu", "", 10)
        self.set_text_color(*self.label_gray)
        self.cell(0, 10, "⠠ = Capital Indicator | Space = Word Separator", align=Align.C)

    def draw_breakdown_table(self):
        table_y = 185
        self.set_y(table_y)
        
        # Table Header
        self.set_fill_color(*self.navy)
        self.set_font("DejaVuB", "B", 12)
        self.set_text_color(255, 255, 255)
        self.set_x(15)
        self.cell(180, 12, "Letter-by-Letter Breakdown", align=Align.C, fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        # Column Logic
        num_cols = len(BREAKDOWN)
        col_width = 180 / num_cols
        
        start_y = self.get_y()
        
        # Braille Row
        for i, (braille, letter) in enumerate(BREAKDOWN):
            self.set_x(15 + (i * col_width))
            color = self.row_a if i % 2 == 0 else self.row_b
            self.set_fill_color(*color)
            self.set_text_color(*self.navy)
            self.set_font("DejaVu", "", 20)
            self.cell(col_width, 18, braille, border=1, align=Align.C, fill=True)
            
        self.set_y(start_y + 18)
        
        # Letter Row
        for i, (braille, letter) in enumerate(BREAKDOWN):
            self.set_x(15 + (i * col_width))
            color = self.row_a if i % 2 == 0 else self.row_b
            self.set_fill_color(*color)
            self.set_text_color(*self.navy)
            self.set_font("DejaVuB", "B", 16)
            self.cell(col_width, 14, letter, border=1, align=Align.C, fill=True)

# ==========================================
# GENERATION
# ==========================================
def main():
    try:
        pdf = BrailleCardPDF()
        pdf.add_page()
        pdf.draw_main_card()
        pdf.draw_breakdown_table()
        pdf.draw_footer()
        
        output_file = "braille_card.pdf"
        pdf.output(output_file)
        print(f"Successfully generated {output_file}")
    except Exception as e:
        print(f"Error generating PDF: {e}")

if __name__ == "__main__":
    main()
