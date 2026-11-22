import re
import docx
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH

# 1. Read Markdown content
with open('report/00-phan-dau.md', 'r', encoding='utf-8') as f:
    text = f.read()

# Extract Section 5 content
match = re.search(r'## 5\. TÓM TẮT ĐỒ ÁN \(ABSTRACT\)(.*?)---', text, re.DOTALL)
if not match:
    raise ValueError("Could not find Section 5 in 00-phan-dau.md")

sec5 = match.group(1).strip()
raw_paras = [p.strip() for p in sec5.split('\n\n') if p.strip()]

# Filter out title and metadata lines
body_paras = []
for p in raw_paras:
    if p.startswith('```') or 'TÓM TẮT' in p or p.startswith('**Tên đề tài'):
        continue
    # clean markdown italics/bold/math
    clean_p = p.replace('*RetailDSS*', 'RetailDSS')
    clean_p = clean_p.replace('*“AI recommends, Human decides”*', '"AI recommends, Human decides"')
    clean_p = clean_p.replace('*"AI recommends, Human decides"*', '"AI recommends, Human decides"')
    clean_p = clean_p.replace('($SS$)', '(SS)').replace('($ROP$)', '(ROP)')
    body_paras.append(clean_p)

print(f"Extracted {len(body_paras)} abstract paragraphs.")

# 2. Update docx
doc = docx.Document('report/RetailDSS_DATN_Draft.docx')

# P61: Tên đề tài
doc.paragraphs[61].text = 'Tên đề tài: Hệ thống hỗ trợ quyết định mua hàng bán lẻ ứng dụng AI'
doc.paragraphs[61].runs[0].font.name = 'Times New Roman'
doc.paragraphs[61].runs[0].font.size = Pt(13)
doc.paragraphs[61].runs[0].bold = True

# P62: Sinh viên thực hiện
doc.paragraphs[62].text = 'Sinh viên thực hiện: Nguyễn Hoài Nam    Mã SV: 0019468    Lớp: 68CNPM4'
doc.paragraphs[62].runs[0].font.name = 'Times New Roman'
doc.paragraphs[62].runs[0].font.size = Pt(13)
doc.paragraphs[62].runs[0].bold = True

# Replace P63, P64, P65, P66
target_indices = [63, 64, 65, 66]
for idx, para_text in zip(target_indices, body_paras):
    p = doc.paragraphs[idx]
    p.text = para_text
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.line_spacing = 1.3
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.first_line_indent = Pt(36) # 1.27cm standard indent
    for r in p.runs:
        r.font.name = 'Times New Roman'
        r.font.size = Pt(13)
        r.italic = False
        r.bold = False

# Clear P67 placeholder
doc.paragraphs[67].text = ''

doc.save('report/RetailDSS_DATN_Draft.docx')
print("Successfully synced Abstract to report/RetailDSS_DATN_Draft.docx!")

