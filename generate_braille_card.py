from fpdf import FPDF, XPos, YPos
from fpdf.enums import Align
import os

# ==========================================
# CONFIGURATION - CHANGE CONTENT HERE
# ==========================================
ENGLISH_PHRASE = "I AM SICK"
BRAILLE_STRING = "⠠⠊⠀⠠⠁⠠⠍⠀⠠⠎⠊⠉⠅"

# Letter-by-letter breakdown for the table
# Each tuple: (Braille Cell, English Letter)
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
        self.label_gray = (120, 120, 140)
        self.footer_blue = (180, 185, 220)

        # Register Fonts (Linux paths as requested)
        # Change these to local paths if running on Windows (e.g. "C:\\Windows\\Fonts\\DejaVuSans.ttf")
        font_path = "/usr/share/fonts/truetype/dejavu/"
        self.add_font("DejaVu", "", os.path.join(font_path, "DejaVuSans.ttf"))
        self.add_font("DejaVuB", "B", os.path.join(font_path, "DejaVuSans-Bold.ttf"))

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
        self.set_line_width(0.8)
        self.rect(15, 40, 180, 120, "DF")
        
        # English Text Section
        self.set_y(50)
        self.set_font("DejaVu", "", 10)
        self.set_text_color(*self.label_gray)
        self.cell(0, 10, "English Text", align=Align.C, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        self.set_font("DejaVuB", "B", 38)
        self.set_text_color(*self.navy)
        self.cell(0, 20, ENGLISH_PHRASE, align=Align.C, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        # Divider Line
        self.set_draw_color(200, 200, 210)
        self.set_line_width(0.3)
        self.line(30, 95, 180, 95)
        
        # Braille Section
        self.set_y(105)
        self.set_font("DejaVu", "", 10)
        self.set_text_color(*self.label_gray)
        self.cell(0, 10, "Grade 1 English Braille (Unicode U+2800–U+28FF)", align=Align.C, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        self.set_font("DejaVu", "", 44)
        self.set_text_color(0, 0, 0)
        self.cell(0, 25, BRAILLE_STRING, align=Align.C, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        # Legend
        self.set_font("DejaVu", "", 9)
        self.set_text_color(*self.label_gray)
        self.cell(0, 10, "⠠ = Capital Indicator | Space = Word Separator", align=Align.C)

    def draw_breakdown_table(self):
        table_y = 175
        self.set_y(table_y)
        
        # Table Header
        self.set_fill_color(*self.navy)
        self.set_font("DejaVuB", "B", 11)
        self.set_text_color(255, 255, 255)
        self.set_x(15)
        self.cell(180, 10, "Letter-by-Letter Breakdown", align=Align.C, fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        # Column Logic
        num_cols = len(BREAKDOWN)
        col_width = 180 / num_cols
        
        start_y = self.get_y()
        
        # Braille Row
        for i, (braille, letter) in enumerate(BREAKDOWN):
            self.set_x(15 + (i * col_width))
            color = self.row_a if i % 2 == 0 else self.row_b
            self.set_fill_color(*color)
            self.set_text_color(0, 0, 0)
            self.set_font("DejaVu", "", 18)
            self.cell(col_width, 15, braille, border=1, align=Align.C, fill=True)
            
        self.set_y(start_y + 15)
        
        # Letter Row
        for i, (braille, letter) in enumerate(BREAKDOWN):
            self.set_x(15 + (i * col_width))
            color = self.row_a if i % 2 == 0 else self.row_b
            self.set_fill_color(*color)
            self.set_text_color(*self.navy)
            self.set_font("DejaVuB", "B", 14)
            self.cell(col_width, 12, letter, border=1, align=Align.C, fill=True)

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
        print("\nNOTE: Ensure DejaVu fonts are installed in /usr/share/fonts/truetype/dejavu/")
        print("On Windows, update the font_path variable in the script to point to your Fonts folder.")

if __name__ == "__main__":
    main()
