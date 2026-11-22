"""
build_thesis_docx.py — Hợp nhất 8 tệp Markdown (00-phan-dau.md .. 07-phu-luc.md)
thành tệp Word hoàn chỉnh report/RetailDSS_DATN_Final.docx tuân thủ Quy chuẩn
ĐATN-14 của Trường Đại học Xây dựng Hà Nội (HUCE).

Quy trình 2 bước:
  1. Tiền xử lý 8 tệp Markdown:
     - Loại bỏ trailing spaces gây soft line break (<w:br/>)
     - Chuyển đổi GitHub Alerts (> [!IMPORTANT], > [!NOTE], ...) thành marker định dạng
     - Chuẩn hóa Trang bìa ngoài, Trang phụ bìa, khối chữ ký (không dùng khoảng trắng)
     - Chèn các marker Section Break, Page Break, Word Fields (TOC, LOF, LOT)
  2. Gọi Pandoc chuyển Markdown (kèm LaTeX math -> OMML, pipe tables, code blocks)
     sang tệp .docx trung gian, sau đó dùng python-docx hậu xử lý OpenXML toàn diện:
     - A4 (21.0 x 29.7 cm), lề chuẩn ĐATN-14 (Bìa: L=3.0cm; Nội dung: L=3.5cm, R/T/B=2.0cm)
     - Section 0 có khung viền kép xanh đậm <w:pgBorders> chuẩn khung-do-an-tot-nghiep-chuan.docx
     - 4 Sections với đánh số trang chính xác (Sec 0-1: không số; Sec 2: i, ii; Sec 3: 1, 2)
     - Tách toàn bộ soft <w:br/> trong các đoạn JUSTIFY, thêm <w:doNotExpandShiftReturn/>
     - Định dạng Source Code (LEFT, Consolas 9.5pt, nền #F5F5F5, thụt lề 0.5cm)
     - Font Times New Roman 13pt, giãn dòng 1.3 lines, space_before=0, space_after=6pt
     - Bảng biểu có viền đen rõ ràng, header in đậm nền xám nhạt, autofit vừa khổ A4
"""

from __future__ import annotations

import copy
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import docx
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_COLOR_INDEX
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from docx.shared import Cm, Pt, RGBColor

ROOT_DIR = Path(__file__).resolve().parent.parent
REPORT_DIR = ROOT_DIR / "report"
KHUNG_DOCX = ROOT_DIR / "docs" / "khung-do-an-tot-nghiep-chuan.docx"
OUTPUT_DOCX = REPORT_DIR / "RetailDSS_DATN_Final.docx"

INPUT_FILES = [
    "00-phan-dau.md",
    "01-chuong-1.md",
    "02-chuong-2.md",
    "03-chuong-3.md",
    "04-chuong-4.md",
    "05-chuong-5.md",
    "06-ket-luan-tai-lieu.md",
    "07-phu-luc.md",
]


# ---------------------------------------------------------------------------
# 1. Tiền xử lý Markdown
# ---------------------------------------------------------------------------

def _extract_between(text: str, start_pat: str, end_pat: str | None = None) -> str:
    m1 = re.search(start_pat, text, re.MULTILINE)
    if not m1:
        return ""
    start = m1.end()
    if end_pat:
        m2 = re.search(end_pat, text[start:], re.MULTILINE)
        if m2:
            return text[start : start + m2.start()].strip()
    return text[start:].strip()


def _strip_trailing_spaces_outside_code(text: str) -> str:
    """Loại bỏ trailing spaces (gây <w:br/>) ở ngoài các khối code fence ```...```."""
    lines = text.splitlines()
    out: list[str] = []
    in_code = False
    for ln in lines:
        if ln.lstrip().startswith("```"):
            in_code = not in_code
            out.append(ln)
            continue
        if in_code:
            out.append(ln)
        else:
            out.append(re.sub(r"[ \t]+$", "", ln))
    return "\n".join(out)


def _clean_github_alerts(text: str) -> str:
    """
    Chuyển các khối GitHub Alert (> [!NOTE], > [!IMPORTANT], ...) thành:
    - Đoạn [PLACEHOLDER ...] thuần nếu bên trong là placeholder
    - Hoặc marker [[ALERT_<TYPE>]] <nội dung> để hậu xử lý thành hộp ghi chú đẹp.
    """
    lines = text.splitlines()
    out: list[str] = []
    i = 0
    in_code = False
    alert_re = re.compile(r"^>\s*\[!(NOTE|IMPORTANT|WARNING|TIP|CAUTION)\]\s*$")

    while i < len(lines):
        ln = lines[i]
        if ln.lstrip().startswith("```"):
            in_code = not in_code
            out.append(ln)
            i += 1
            continue

        if not in_code:
            m = alert_re.match(ln.strip())
            if m:
                alert_type = m.group(1)
                i += 1
                body_lines: list[str] = []
                while i < len(lines) and lines[i].lstrip().startswith(">"):
                    content = re.sub(r"^>\s?", "", lines[i]).strip()
                    if content:
                        body_lines.append(content)
                    i += 1
                joined = " ".join(body_lines).strip()
                if "[PLACEHOLDER" in joined:
                    out.append(joined)
                elif joined:
                    out.append(f"[[ALERT_{alert_type}]] {joined}")
                continue

        out.append(ln)
        i += 1

    return "\n".join(out)


def _wrap_signature_block_right(section_text: str) -> str:
    """
    Bọc khối chữ ký cuối LỜI NÓI ĐẦU và CAM ĐOAN vào [[RIGHT_BLOCK_START]]..[[RIGHT_BLOCK_END]],
    mỗi dòng là 1 đoạn riêng, loại bỏ <br><br><br>.
    """
    sig_pat = re.compile(
        r"(\*Hà Nội,\s*ngày[^\n]*\*)\s*\n"
        r"(\*\*Sinh viên thực hiện\*\*)\s*\n"
        r"(\*\(Ký,\s*ghi rõ họ tên\)\*)\s*\n"
        r"(?:<br\s*/?>|\s|\n)*"
        r"(\*\*Nguyễn Hoài Nam\*\*)",
        re.MULTILINE,
    )

    def _repl(m: re.Match[str]) -> str:
        return (
            "\n[[RIGHT_BLOCK_START]]\n\n"
            f"{m.group(1).strip()}\n\n"
            f"{m.group(2).strip()}\n\n"
            f"{m.group(3).strip()}\n\n"
            "[[EMPTY_LINE]]\n\n"
            "[[EMPTY_LINE]]\n\n"
            f"{m.group(4).strip()}\n\n"
            "[[RIGHT_BLOCK_END]]\n"
        )

    return sig_pat.sub(_repl, section_text)


def _preprocess_phan_dau(md_text: str) -> str:
    """
    Chuyển đổi 00-phan-dau.md thành cấu trúc sạch có marker Section Break & Page Break
    khớp hoàn toàn với khung-do-an-tot-nghiep-chuan.docx (Mẫu ĐATN-14).
    """
    md_text = _clean_github_alerts(md_text)
    md_text = _strip_trailing_spaces_outside_code(md_text)
    parts: list[str] = []

    # --- SECTION 0: Trang bìa ngoài + Trang phụ bìa ---
    sec_bia = _extract_between(md_text, r"^## 1\. TRANG BÌA NGOÀI VÀ GÁY SÁCH", r"^## 2\. TRANG PHỤ BÌA")
    parts.append("[[COVER_PAGE_MARKER]]")
    parts.append("\n[[PAGE_BREAK]]\n")

    spine_note = ""
    for ln in sec_bia.splitlines():
        s = ln.lstrip("> ").strip()
        if "Nguyễn Hoài Nam" in s and "-------" in s:
            spine_note = s.strip("`")
            break
    parts.append("[[SUBCOVER_PAGE_MARKER]]")
    if spine_note:
        parts.append(f"[[SPINE_BOX]] {spine_note}")
    parts.append("\n[[SECT_BREAK_1]]\n")

    # --- SECTION 1: Nhận xét GVHD, Phản biện, Tóm tắt, Nhiệm vụ ĐATN ---
    for sec_title, start_p, end_p in [
        ("NHẬN XÉT CỦA NGƯỜI HƯỚNG DẪN", r"^## 3\. NHẬN XÉT CỦA NGƯỜI HƯỚNG DẪN", r"^## 4\. NHẬN XÉT CỦA NGƯỜI PHẢN BIỆN"),
        ("NHẬN XÉT CỦA NGƯỜI PHẢN BIỆN", r"^## 4\. NHẬN XÉT CỦA NGƯỜI PHẢN BIỆN", r"^## 5\. TÓM TẮT ĐỒ ÁN"),
    ]:
        blk = _extract_between(md_text, start_p, end_p)
        parts.append(f"[[TITLE_CENTER]] **{sec_title}**\n")
        for _ in range(14):
            parts.append("." * 86 + "\n")
        role_label = "Người hướng dẫn" if "HƯỚNG DẪN" in sec_title else "Người phản biện"
        parts.append("[[RIGHT_BLOCK_START]]")
        parts.append("*Hà Nội, ngày …… tháng …… năm 2026*")
        parts.append(f"**{role_label}**")
        parts.append("*(Ký, ghi rõ họ tên)*")
        parts.append("[[RIGHT_BLOCK_END]]")
        parts.append("\n[[PAGE_BREAK]]\n")

    # Mục 5: Tóm tắt
    sec_tomtat = _extract_between(md_text, r"^## 5\. TÓM TẮT ĐỒ ÁN \(ABSTRACT\)", r"^## 6\. NHIỆM VỤ ĐỒ ÁN TỐT NGHIỆP")
    sec_tomtat = re.sub(r"```[^\n]*\n.*?```", "", sec_tomtat, flags=re.DOTALL)
    sec_tomtat = re.sub(r"^---\s*$", "", sec_tomtat, flags=re.MULTILINE).strip()
    parts.append("[[TITLE_CENTER]] **TÓM TẮT**\n")
    parts.append(sec_tomtat)
    parts.append("\n[[PAGE_BREAK]]\n")

    # Mục 6: Nhiệm vụ ĐATN
    sec_nhiemvu = _extract_between(md_text, r"^## 6\. NHIỆM VỤ ĐỒ ÁN TỐT NGHIỆP \(MẪU ĐATN-01\)", r"^## 7\. LỜI NÓI ĐẦU")
    sec_nhiemvu = re.sub(r"```[^\n]*\n\s*NHIỆM VỤ ĐỒ ÁN TỐT NGHIỆP.*?```", "", sec_nhiemvu, flags=re.DOTALL)
    sig_pat = r"### XÁC NHẬN CỦA CÁC BÊN LIÊN QUAN\s*```.*?```"
    sec_nhiemvu = re.sub(
        sig_pat,
        "### XÁC NHẬN CỦA CÁC BÊN LIÊN QUAN\n\n[[SIG_3COL_NHIEM_VU]]\n",
        sec_nhiemvu,
        flags=re.DOTALL,
    )
    sec_nhiemvu = re.sub(r"^---\s*$", "", sec_nhiemvu, flags=re.MULTILINE).strip()
    parts.append("[[TITLE_CENTER]] **NHIỆM VỤ ĐỒ ÁN TỐT NGHIỆP**\n")
    parts.append("[[TITLE_CENTER]] *(Theo Mẫu ĐATN-01)*\n")
    parts.append(sec_nhiemvu)
    parts.append("\n[[SECT_BREAK_2]]\n")

    # --- SECTION 2: Lời nói đầu -> Danh sách ký hiệu (La Mã i, ii, iii...) ---
    # Mục 7: Lời nói đầu
    sec_lnd = _extract_between(md_text, r"^## 7\. LỜI NÓI ĐẦU", r"^## 8\. LỜI CAM ĐOAN")
    sec_lnd = re.sub(r"^\*\(Bắt đầu đánh số trang.*?\*\s*$", "", sec_lnd, flags=re.MULTILINE)
    sec_lnd = re.sub(r"```[^\n]*\n\s*LỜI NÓI ĐẦU.*?```", "", sec_lnd, flags=re.DOTALL)
    sec_lnd = _wrap_signature_block_right(sec_lnd)
    sec_lnd = re.sub(r"^---\s*$", "", sec_lnd, flags=re.MULTILINE).strip()
    parts.append("[[TITLE_CENTER]] **LỜI NÓI ĐẦU**\n")
    parts.append(sec_lnd)
    parts.append("\n[[PAGE_BREAK]]\n")

    # Mục 8: Lời cam đoan
    sec_cd = _extract_between(md_text, r"^## 8\. LỜI CAM ĐOAN", r"^## 9\. MỤC LỤC")
    sec_cd = re.sub(r"^\*\(Trang ii\)\*\s*$", "", sec_cd, flags=re.MULTILINE)
    sec_cd = re.sub(r"```[^\n]*\n\s*CAM ĐOAN.*?```", "", sec_cd, flags=re.DOTALL)
    sec_cd = _wrap_signature_block_right(sec_cd)
    sec_cd = re.sub(r"^---\s*$", "", sec_cd, flags=re.MULTILINE).strip()
    parts.append("[[TITLE_CENTER]] **CAM ĐOAN**\n")
    parts.append(sec_cd)
    parts.append("\n[[PAGE_BREAK]]\n")

    # Mục 9: Mục lục
    parts.append("[[TITLE_CENTER]] **MỤC LỤC**\n")
    parts.append("[[TOC_FIELD]]\n")
    parts.append("\n[[PAGE_BREAK]]\n")

    # Mục 10: Danh sách bảng, hình vẽ
    parts.append("[[TITLE_CENTER]] **DANH SÁCH CÁC BẢNG, HÌNH VẼ**\n")
    parts.append("**Danh sách hình vẽ**\n")
    parts.append("[[LOF_FIELD]]\n")
    parts.append("**Danh sách bảng**\n")
    parts.append("[[LOT_FIELD]]\n")
    parts.append("\n[[PAGE_BREAK]]\n")

    # Mục 11: Danh sách ký hiệu, chữ viết tắt
    sec_kh = _extract_between(md_text, r"^## 11\. DANH SÁCH CÁC KÝ HIỆU, CHỮ VIẾT TẮT", r"^## 12\. MỞ ĐẦU")
    sec_kh = re.sub(r"^\*\(Trang v\)\*\s*$", "", sec_kh, flags=re.MULTILINE)
    sec_kh = re.sub(r"^---\s*$", "", sec_kh, flags=re.MULTILINE).strip()
    parts.append("[[TITLE_CENTER]] **DANH SÁCH CÁC KÝ HIỆU, CHỮ VIẾT TẮT**\n")
    parts.append(sec_kh)
    parts.append("\n[[SECT_BREAK_3]]\n")

    # --- SECTION 3: MỞ ĐẦU (Ả Rập bắt đầu từ 1) ---
    sec_md = _extract_between(md_text, r"^## 12\. MỞ ĐẦU", None)
    sec_md = re.sub(r"^\*\(Bắt đầu đánh số trang.*?\*\s*$", "", sec_md, flags=re.MULTILINE)
    sec_md = re.sub(r"```[^\n]*\n\s*MỞ ĐẦU.*?```", "", sec_md, flags=re.DOTALL)
    sec_md = re.sub(r"^### ", "## ", sec_md, flags=re.MULTILINE)
    sec_md = re.sub(r"^---\s*$", "", sec_md, flags=re.MULTILINE).strip()
    parts.append("# MỞ ĐẦU\n")
    parts.append(sec_md)

    return "\n\n".join(parts)


def _preprocess_chapter(md_text: str, fname: str) -> str:
    """Làm sạch đường kẻ '---', GitHub alert, trailing spaces và chuẩn hóa cấp Heading."""
    cleaned = _clean_github_alerts(md_text)
    cleaned = _strip_trailing_spaces_outside_code(cleaned)
    cleaned = re.sub(r"^---\s*$", "", cleaned, flags=re.MULTILINE)
    # Chuyển blockquote chứa [PLACEHOLDER ...] thành đoạn bình thường
    cleaned = re.sub(r"^>\s*(\*\*?`?\[PLACEHOLDER.*?)$", r"\1", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^>\s*(`?\[PLACEHOLDER.*?)$", r"\1", cleaned, flags=re.MULTILINE)

    if fname == "06-ket-luan-tai-lieu.md":
        cleaned = re.sub(r"^#\s+KẾT LUẬN VÀ TÀI LIỆU THAM KHẢO\s*$", "", cleaned, flags=re.MULTILINE)
        cleaned = re.sub(r"^### ", "## ", cleaned, flags=re.MULTILINE)
        cleaned = re.sub(r"^## ", "# ", cleaned, flags=re.MULTILINE)

    if fname == "07-phu-luc.md":
        cleaned = re.sub(r"^#\s+CÁC PHỤ LỤC BỔ TRỢ\s*$", "", cleaned, flags=re.MULTILINE)
        cleaned = re.sub(r"^### ", "## ", cleaned, flags=re.MULTILINE)
        cleaned = re.sub(r"^## ", "# ", cleaned, flags=re.MULTILINE)
        # Chuyển khối code chữ ký 2 bên của Phụ lục A thành bảng 2 cột không viền
        phuluc_sig_pat = re.compile(
            r"```\s*\n\s*Hà Nội, ngày[^\n]*\n\s*Xác nhận của Giảng viên hướng dẫn.*?Nguyễn Hoài Nam\s*\n```",
            re.DOTALL,
        )
        cleaned = phuluc_sig_pat.sub("\n[[SIG_2COL_PHULUC_A]]\n", cleaned)

    return cleaned.strip()


def build_combined_markdown() -> str:
    chunks: list[str] = []
    for fname in INPUT_FILES:
        fpath = REPORT_DIR / fname
        if not fpath.exists():
            raise FileNotFoundError(f"Không tìm thấy tệp nguồn: {fpath}")
        raw = fpath.read_text(encoding="utf-8")
        if fname == "00-phan-dau.md":
            chunks.append(_preprocess_phan_dau(raw))
        else:
            chunks.append(_preprocess_chapter(raw, fname))
    return "\n\n".join(chunks)


# ---------------------------------------------------------------------------
# 2. Hỗ trợ OpenXML cho python-docx
# ---------------------------------------------------------------------------

def _set_run_font(
    run,
    name: str = "Times New Roman",
    size_pt: float | None = None,
    bold: bool | None = None,
    italic: bool | None = None,
    color: RGBColor | None = None,
) -> None:
    run.font.name = name
    rPr = run._r.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = OxmlElement("w:rFonts")
        rPr.insert(0, rFonts)
    rFonts.set(qn("w:ascii"), name)
    rFonts.set(qn("w:hAnsi"), name)
    rFonts.set(qn("w:cs"), name)
    rFonts.set(qn("w:eastAsia"), name)
    if size_pt is not None:
        run.font.size = Pt(size_pt)
    if bold is not None:
        run.bold = bold
    if italic is not None:
        run.italic = italic
    if color is not None:
        run.font.color.rgb = color


def _set_paragraph_shading_and_border(
    paragraph,
    fill_hex: str,
    left_border_hex: str | None = None,
    left_border_sz: str = "18",
    all_border_hex: str | None = None,
) -> None:
    pPr = paragraph._p.get_or_add_pPr()
    old_shd = pPr.find(qn("w:shd"))
    if old_shd is not None:
        pPr.remove(old_shd)
    pPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:val="clear" w:color="auto" w:fill="{fill_hex}"/>'))

    old_bdr = pPr.find(qn("w:pBdr"))
    if old_bdr is not None:
        pPr.remove(old_bdr)

    if left_border_hex:
        pPr.append(
            parse_xml(
                f'<w:pBdr {nsdecls("w")}>'
                f'<w:left w:val="single" w:sz="{left_border_sz}" w:space="8" w:color="{left_border_hex}"/>'
                "</w:pBdr>"
            )
        )
    elif all_border_hex:
        pPr.append(
            parse_xml(
                f'<w:pBdr {nsdecls("w")}>'
                f'<w:top w:val="single" w:sz="4" w:space="4" w:color="{all_border_hex}"/>'
                f'<w:left w:val="single" w:sz="4" w:space="6" w:color="{all_border_hex}"/>'
                f'<w:bottom w:val="single" w:sz="4" w:space="4" w:color="{all_border_hex}"/>'
                f'<w:right w:val="single" w:sz="4" w:space="6" w:color="{all_border_hex}"/>'
                "</w:pBdr>"
            )
        )


def _set_page_number_type(section, fmt: str | None, start: int | None = None) -> None:
    sectPr = section._sectPr
    existing = sectPr.find(qn("w:pgNumType"))
    if existing is not None:
        sectPr.remove(existing)
    if fmt is not None:
        pgNumType = OxmlElement("w:pgNumType")
        pgNumType.set(qn("w:fmt"), fmt)
        if start is not None:
            pgNumType.set(qn("w:start"), str(start))
        sectPr.append(pgNumType)


def _apply_cover_page_borders(section) -> None:
    """
    Sao chép chính xác <w:pgBorders> viền kép xanh đậm từ
    docs/khung-do-an-tot-nghiep-chuan.docx vào Section 0.
    """
    sectPr = section._sectPr
    old_borders = sectPr.find(qn("w:pgBorders"))
    if old_borders is not None:
        sectPr.remove(old_borders)
    pgBorders = parse_xml(
        f'<w:pgBorders {nsdecls("w")} w:offsetFrom="page">'
        '<w:top w:val="thinThickSmallGap" w:sz="24" w:space="24" w:color="1B365D"/>'
        '<w:left w:val="thinThickSmallGap" w:sz="24" w:space="24" w:color="1B365D"/>'
        '<w:bottom w:val="thinThickSmallGap" w:sz="24" w:space="24" w:color="1B365D"/>'
        '<w:right w:val="thinThickSmallGap" w:sz="24" w:space="24" w:color="1B365D"/>'
        "</w:pgBorders>"
    )
    pgMar = sectPr.find(qn("w:pgMar"))
    if pgMar is not None:
        idx = list(sectPr).index(pgMar) + 1
        sectPr.insert(idx, pgBorders)
    else:
        sectPr.insert(0, pgBorders)


def _add_page_number_footer(section) -> None:
    footer = section.footer
    footer.is_linked_to_previous = False
    for p in list(footer.paragraphs):
        p.text = ""
    p = footer.paragraphs[0] if footer.paragraphs else footer.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)

    r_begin = p.add_run()
    _set_run_font(r_begin, "Times New Roman", 12)
    fld1 = OxmlElement("w:fldChar")
    fld1.set(qn("w:fldCharType"), "begin")
    r_begin._r.append(fld1)

    r_instr = p.add_run()
    _set_run_font(r_instr, "Times New Roman", 12)
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    r_instr._r.append(instr)

    r_sep = p.add_run()
    _set_run_font(r_sep, "Times New Roman", 12)
    fld2 = OxmlElement("w:fldChar")
    fld2.set(qn("w:fldCharType"), "separate")
    r_sep._r.append(fld2)

    r_val = p.add_run("1")
    _set_run_font(r_val, "Times New Roman", 12)

    r_end = p.add_run()
    _set_run_font(r_end, "Times New Roman", 12)
    fld3 = OxmlElement("w:fldChar")
    fld3.set(qn("w:fldCharType"), "end")
    r_end._r.append(fld3)


def _clear_footer(section) -> None:
    footer = section.footer
    footer.is_linked_to_previous = False
    for p in footer.paragraphs:
        p.text = ""


def _insert_toc_field(paragraph, instr_text: str, hint_text: str) -> None:
    paragraph.text = ""
    paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r_begin = paragraph.add_run()
    fld1 = OxmlElement("w:fldChar")
    fld1.set(qn("w:fldCharType"), "begin")
    r_begin._r.append(fld1)

    r_instr = paragraph.add_run()
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = f" {instr_text} "
    r_instr._r.append(instr)

    r_sep = paragraph.add_run()
    fld2 = OxmlElement("w:fldChar")
    fld2.set(qn("w:fldCharType"), "separate")
    r_sep._r.append(fld2)

    r_hint = paragraph.add_run(hint_text)
    _set_run_font(r_hint, "Times New Roman", 12, italic=True, color=RGBColor(0x55, 0x55, 0x55))

    r_end = paragraph.add_run()
    fld3 = OxmlElement("w:fldChar")
    fld3.set(qn("w:fldCharType"), "end")
    r_end._r.append(fld3)


def _configure_section_margins(section, left_cm: float = 3.5) -> None:
    section.page_width = Cm(21.0)
    section.page_height = Cm(29.7)
    section.left_margin = Cm(left_cm)
    section.right_margin = Cm(2.0)
    section.top_margin = Cm(2.0)
    section.bottom_margin = Cm(2.0)
    section.header_distance = Cm(1.27)
    section.footer_distance = Cm(1.27)


def _set_table_borderless(table, total_width_cm: float) -> None:
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    tblPr = table._tbl.tblPr
    old_borders = tblPr.find(qn("w:tblBorders"))
    if old_borders is not None:
        tblPr.remove(old_borders)
    tblPr.append(
        parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            '<w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
            '<w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
            '<w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
            '<w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
            '<w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
            '<w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
            "</w:tblBorders>"
        )
    )
    tblW = tblPr.find(qn("w:tblW"))
    if tblW is not None:
        tblPr.remove(tblW)
    dxa_total = int(total_width_cm * 567)
    tblPr.append(parse_xml(f'<w:tblW {nsdecls("w")} w:w="{dxa_total}" w:type="dxa"/>'))


def _insert_paragraph_before(anchor_p, text: str = "", align=WD_ALIGN_PARAGRAPH.CENTER,
                             size_pt: float = 13, bold: bool = False, italic: bool = False,
                             space_before: float = 0, space_after: float = 4,
                             line_spacing: float = 1.25, color: RGBColor | None = None):
    p = anchor_p.insert_paragraph_before("")
    p.alignment = align
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = line_spacing
    if text:
        r = p.add_run(text)
        _set_run_font(r, "Times New Roman", size_pt, bold=bold, italic=italic, color=color)
    return p


def _insert_table_before(doc: docx.Document, anchor_p, rows: int, cols: int):
    tbl = doc.add_table(rows=rows, cols=cols)
    anchor_p._p.addprevious(tbl._tbl)
    return tbl


def _extract_huce_logo_bytes() -> bytes | None:
    """Trích xuất ảnh Logo ĐHXDHN gốc từ docs/khung-do-an-tot-nghiep-chuan.docx."""
    if not KHUNG_DOCX.exists():
        return None
    try:
        kdoc = docx.Document(str(KHUNG_DOCX))
        for rel in kdoc.part.rels.values():
            if "image" in rel.reltype:
                return rel.target_part.blob
    except Exception:
        return None
    return None


def _render_cover_page(doc: docx.Document, anchor_p, logo_path: Path | None = None) -> None:
    """Render Trang bìa ngoài chuẩn ĐATN-14 bằng python-docx (khớp khung-do-an-tot-nghiep-chuan.docx)."""
    huce_blue = RGBColor(0x1F, 0x38, 0x64)
    _insert_paragraph_before(anchor_p, "BỘ GIÁO DỤC VÀ ĐÀO TẠO", size_pt=14, bold=True, space_before=4, space_after=2, color=huce_blue)
    _insert_paragraph_before(anchor_p, "TRƯỜNG ĐẠI HỌC XÂY DỰNG HÀ NỘI", size_pt=14, bold=True, space_after=2, color=huce_blue)
    _insert_paragraph_before(anchor_p, "----------------------------------------", size_pt=12, bold=False, space_after=14, color=huce_blue)

    if logo_path and logo_path.exists():
        p_logo = _insert_paragraph_before(anchor_p, "", space_before=4, space_after=18)
        p_logo.add_run().add_picture(str(logo_path), width=Cm(3.2))
    else:
        p_logo = _insert_paragraph_before(
            anchor_p, "[LOGO TRƯỜNG ĐHXDHN]", size_pt=13, bold=True, space_before=8, space_after=24, color=huce_blue
        )
        _set_paragraph_shading_and_border(p_logo, "F0F4F8", all_border_hex="1B365D")

    _insert_paragraph_before(anchor_p, "NGUYỄN HOÀI NAM", size_pt=14, bold=True, space_before=6, space_after=24)
    _insert_paragraph_before(
        anchor_p,
        "HỆ THỐNG HỖ TRỢ QUYẾT ĐỊNH MUA HÀNG BÁN LẺ ỨNG DỤNG AI",
        size_pt=16.5,
        bold=True,
        space_after=8,
        line_spacing=1.25,
    )
    _insert_paragraph_before(
        anchor_p,
        "(AI-Driven Retail Purchase Decision Support System)",
        size_pt=14,
        bold=True,
        italic=True,
        space_after=40,
    )
    _insert_paragraph_before(anchor_p, "ĐỒ ÁN TỐT NGHIỆP", size_pt=18, bold=True, space_after=16, color=huce_blue)
    _insert_paragraph_before(anchor_p, "Ngành: Công nghệ thông tin", size_pt=14, bold=True, space_after=4)
    _insert_paragraph_before(anchor_p, "Chuyên ngành: Công nghệ phần mềm", size_pt=14, bold=True, space_after=72)
    _insert_paragraph_before(anchor_p, "Hà Nội – 2026", size_pt=14, bold=True, space_after=4)


def _render_spine_box(doc: docx.Document, anchor_p, content: str, layout_tables: set[int]) -> None:
    """Render ghi chú quy cách gáy sách cuối Trang phụ bìa (khớp khung-do-an-tot-nghiep-chuan.docx)."""
    spine_txt = content.strip()
    tbl = _insert_table_before(doc, anchor_p, 1, 1)
    layout_tables.add(id(tbl._tbl))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    tblPr = tbl._tbl.tblPr
    old_b = tblPr.find(qn("w:tblBorders"))
    if old_b is not None:
        tblPr.remove(old_b)
    tblPr.append(
        parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            '<w:top w:val="dashed" w:sz="6" w:space="0" w:color="7F8C8D"/>'
            '<w:left w:val="dashed" w:sz="6" w:space="0" w:color="7F8C8D"/>'
            '<w:bottom w:val="dashed" w:sz="6" w:space="0" w:color="7F8C8D"/>'
            '<w:right w:val="dashed" w:sz="6" w:space="0" w:color="7F8C8D"/>'
            "</w:tblBorders>"
        )
    )
    tblW = tblPr.find(qn("w:tblW"))
    if tblW is not None:
        tblPr.remove(tblW)
    tblPr.append(parse_xml(f'<w:tblW {nsdecls("w")} w:w="{int(15.2 * 567)}" w:type="dxa"/>'))

    cell = tbl.cell(0, 0)
    cell.width = Cm(15.2)
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="F8FAFC"/>'))

    p0 = cell.paragraphs[0]
    p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p0.paragraph_format.space_before = Pt(3)
    p0.paragraph_format.space_after = Pt(2)
    p0.paragraph_format.line_spacing = 1.15
    r_lbl = p0.add_run("Ghi chú quy cách in Gáy đồ án (in dọc từ trên xuống khi đóng bìa cứng):")
    _set_run_font(r_lbl, "Times New Roman", 10, bold=True, italic=True, color=RGBColor(0x1F, 0x38, 0x64))

    if spine_txt:
        p1 = cell.add_paragraph()
        p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p1.paragraph_format.space_before = Pt(0)
        p1.paragraph_format.space_after = Pt(3)
        p1.paragraph_format.line_spacing = 1.15
        r_sp = p1.add_run(spine_txt)
        _set_run_font(r_sp, "Times New Roman", 10, bold=True)


def _render_subcover_page(doc: docx.Document, anchor_p, layout_tables: set[int], logo_path: Path | None = None) -> None:
    """Render Trang phụ bìa chuẩn ĐATN-14 (khớp khung-do-an-tot-nghiep-chuan.docx)."""
    huce_blue = RGBColor(0x1F, 0x38, 0x64)
    _insert_paragraph_before(anchor_p, "BỘ GIÁO DỤC VÀ ĐÀO TẠO", size_pt=13.5, bold=True, space_before=2, space_after=2, color=huce_blue)
    _insert_paragraph_before(anchor_p, "TRƯỜNG ĐẠI HỌC XÂY DỰNG HÀ NỘI", size_pt=13.5, bold=True, space_after=2, color=huce_blue)
    _insert_paragraph_before(anchor_p, "KHOA CÔNG NGHỆ THÔNG TIN – BỘ MÔN CÔNG NGHỆ PHẦN MỀM", size_pt=12.5, bold=True, space_after=2, color=huce_blue)
    _insert_paragraph_before(anchor_p, "----------------------------------------", size_pt=11, bold=False, space_after=8, color=huce_blue)

    if logo_path and logo_path.exists():
        p_logo = _insert_paragraph_before(anchor_p, "", space_before=2, space_after=10)
        p_logo.add_run().add_picture(str(logo_path), width=Cm(2.8))

    _insert_paragraph_before(
        anchor_p,
        "HỆ THỐNG HỖ TRỢ QUYẾT ĐỊNH MUA HÀNG BÁN LẺ ỨNG DỤNG AI",
        size_pt=15.5,
        bold=True,
        space_after=6,
        line_spacing=1.2,
    )
    _insert_paragraph_before(
        anchor_p,
        "(AI-Driven Retail Purchase Decision Support System)",
        size_pt=13,
        bold=True,
        italic=True,
        space_after=14,
    )
    _insert_paragraph_before(anchor_p, "ĐỒ ÁN TỐT NGHIỆP", size_pt=17, bold=True, space_after=14, color=huce_blue)

    info_rows = [
        ("Giảng viên hướng dẫn:", "ThS. Lương Xuân Hiếu", True),
        ("Giảng viên đồng hướng dẫn:", "Không", False),
        ("Sinh viên thực hiện:", "Nguyễn Hoài Nam – MSSV: 0019468 – Lớp: 68CNPM4", True),
        ("Ngành / Chuyên ngành:", "Công nghệ thông tin / Công nghệ phần mềm", False),
        ("Khoa / Bộ môn:", "Công nghệ thông tin / Công nghệ phần mềm", False),
        ("Khóa / Hệ đào tạo:", "Khóa 68 / Cử nhân chính quy", False),
    ]
    tbl = _insert_table_before(doc, anchor_p, len(info_rows), 2)
    layout_tables.add(id(tbl._tbl))
    _set_table_borderless(tbl, total_width_cm=15.0)
    col_w = [Cm(5.6), Cm(9.4)]
    for idx, (label, val, is_bold_val) in enumerate(info_rows):
        c0 = tbl.cell(idx, 0)
        c1 = tbl.cell(idx, 1)
        c0.width = col_w[0]
        c1.width = col_w[1]
        for cell in (c0, c1):
            tcPr = cell._tc.get_or_add_tcPr()
            tcPr.append(
                parse_xml(
                    f'<w:tcBorders {nsdecls("w")}>'
                    '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="E5E7EB"/>'
                    "</w:tcBorders>"
                )
            )

        p0 = c0.paragraphs[0]
        p0.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p0.paragraph_format.space_before = Pt(3)
        p0.paragraph_format.space_after = Pt(3)
        p0.paragraph_format.line_spacing = 1.2
        _set_run_font(p0.add_run(label), "Times New Roman", 12.5, bold=True)

        p1 = c1.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p1.paragraph_format.space_before = Pt(3)
        p1.paragraph_format.space_after = Pt(3)
        p1.paragraph_format.line_spacing = 1.2
        _set_run_font(p1.add_run(val), "Times New Roman", 12.5, bold=is_bold_val)

    _insert_paragraph_before(anchor_p, "Hà Nội – 2026", size_pt=13.5, bold=True, space_before=18, space_after=10)


def _render_signature_table_3col(doc: docx.Document, anchor_p, layout_tables: set[int]) -> None:
    """Render bảng chữ ký 3 cột không viền cho Nhiệm vụ ĐATN."""
    cols_data = [
        ("Sinh viên", "(Ký, ghi rõ họ tên)", "Nguyễn Hoài Nam"),
        ("GV hướng dẫn", "(Ký, ghi rõ họ tên)", "ThS. Lương Xuân Hiếu"),
        ("Chủ tịch Hội đồng", "(Ký, ghi rõ họ tên)", "[Chủ tịch Hội đồng...]"),
    ]
    tbl = _insert_table_before(doc, anchor_p, 1, 3)
    layout_tables.add(id(tbl._tbl))
    _set_table_borderless(tbl, total_width_cm=15.5)
    for c_idx, (title, sub, name) in enumerate(cols_data):
        cell = tbl.cell(0, c_idx)
        cell.width = Cm(15.5 / 3.0)
        p0 = cell.paragraphs[0]
        p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p0.paragraph_format.space_before = Pt(4)
        p0.paragraph_format.space_after = Pt(2)
        _set_run_font(p0.add_run(title), "Times New Roman", 12.5, bold=True)

        p1 = cell.add_paragraph()
        p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p1.paragraph_format.space_before = Pt(0)
        p1.paragraph_format.space_after = Pt(36)
        _set_run_font(p1.add_run(sub), "Times New Roman", 11.5, italic=True)

        p2 = cell.add_paragraph()
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p2.paragraph_format.space_before = Pt(0)
        p2.paragraph_format.space_after = Pt(4)
        _set_run_font(p2.add_run(name), "Times New Roman", 12.5, bold=True)


def _render_signature_table_2col_phuluc(doc: docx.Document, anchor_p, layout_tables: set[int]) -> None:
    """Render bảng chữ ký 2 cột không viền cho Phụ lục A (không dùng khoảng trắng)."""
    tbl = _insert_table_before(doc, anchor_p, 1, 2)
    layout_tables.add(id(tbl._tbl))
    _set_table_borderless(tbl, total_width_cm=15.5)

    left_cell = tbl.cell(0, 0)
    right_cell = tbl.cell(0, 1)
    left_cell.width = Cm(7.75)
    right_cell.width = Cm(7.75)

    # Cột trái: Xác nhận của GVHD
    lp0 = left_cell.paragraphs[0]
    lp0.alignment = WD_ALIGN_PARAGRAPH.CENTER
    lp0.paragraph_format.space_before = Pt(14)
    lp0.paragraph_format.space_after = Pt(2)
    _set_run_font(lp0.add_run("Xác nhận của Giảng viên hướng dẫn"), "Times New Roman", 12.5, bold=True)

    lp1 = left_cell.add_paragraph()
    lp1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    lp1.paragraph_format.space_after = Pt(42)
    _set_run_font(lp1.add_run("(Ký, ghi rõ họ tên)"), "Times New Roman", 12, italic=True)

    lp2 = left_cell.add_paragraph()
    lp2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    lp2.paragraph_format.space_after = Pt(4)
    _set_run_font(lp2.add_run("ThS. Lương Xuân Hiếu"), "Times New Roman", 12.5, bold=True)

    # Cột phải: Ngày tháng + Sinh viên thực hiện
    rp0 = right_cell.paragraphs[0]
    rp0.alignment = WD_ALIGN_PARAGRAPH.CENTER
    rp0.paragraph_format.space_before = Pt(0)
    rp0.paragraph_format.space_after = Pt(2)
    _set_run_font(rp0.add_run("Hà Nội, ngày …… tháng …… năm 2026"), "Times New Roman", 12, italic=True)

    rp1 = right_cell.add_paragraph()
    rp1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    rp1.paragraph_format.space_after = Pt(2)
    _set_run_font(rp1.add_run("Sinh viên thực hiện"), "Times New Roman", 12.5, bold=True)

    rp2 = right_cell.add_paragraph()
    rp2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    rp2.paragraph_format.space_after = Pt(42)
    _set_run_font(rp2.add_run("(Ký, ghi rõ họ tên)"), "Times New Roman", 12, italic=True)

    rp3 = right_cell.add_paragraph()
    rp3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    rp3.paragraph_format.space_after = Pt(4)
    _set_run_font(rp3.add_run("Nguyễn Hoài Nam"), "Times New Roman", 12.5, bold=True)


def _insert_tc_field(paragraph, entry_text: str, flag: str) -> None:
    """Chèn trường ẩn { TC "<entry_text>" \\f <flag> \\l 1 } để Word tạo Danh sách Bảng/Hình."""
    clean = entry_text.replace('"', "'").strip()
    if not clean:
        return
    r_begin = paragraph.add_run()
    fld1 = OxmlElement("w:fldChar")
    fld1.set(qn("w:fldCharType"), "begin")
    r_begin._r.append(fld1)

    r_instr = paragraph.add_run()
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = f' TC "{clean}" \\f {flag} \\l 1 '
    r_instr._r.append(instr)

    r_end = paragraph.add_run()
    fld3 = OxmlElement("w:fldChar")
    fld3.set(qn("w:fldCharType"), "end")
    r_end._r.append(fld3)


def _style_table(table, max_width_cm: float = 15.5) -> None:
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        '<w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        '<w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        '<w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        '<w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        "</w:tblBorders>"
    )
    old_borders = tblPr.find(qn("w:tblBorders"))
    if old_borders is not None:
        tblPr.remove(old_borders)
    tblPr.append(borders)

    dxa_total = int(max_width_cm * 567)
    tblW = tblPr.find(qn("w:tblW"))
    if tblW is not None:
        tblPr.remove(tblW)
    tblPr.append(parse_xml(f'<w:tblW {nsdecls("w")} w:w="{dxa_total}" w:type="dxa"/>'))

    tblLayout = tblPr.find(qn("w:tblLayout"))
    if tblLayout is not None:
        tblPr.remove(tblLayout)
    tblPr.append(parse_xml(f'<w:tblLayout {nsdecls("w")} w:type="fixed"/>'))

    tblCellMar = tblPr.find(qn("w:tblCellMar"))
    if tblCellMar is not None:
        tblPr.remove(tblCellMar)
    tblPr.append(
        parse_xml(
            f'<w:tblCellMar {nsdecls("w")}>'
            '<w:top w:w="60" w:type="dxa"/>'
            '<w:left w:w="80" w:type="dxa"/>'
            '<w:bottom w:w="60" w:type="dxa"/>'
            '<w:right w:w="80" w:type="dxa"/>'
            "</w:tblCellMar>"
        )
    )

    ncols = len(table.columns) if table.columns else 1
    if ncols >= 6:
        font_sz = 10.0
    elif ncols == 5:
        font_sz = 10.5
    elif ncols == 4:
        font_sz = 11.0
    else:
        font_sz = 12.0

    char_cm = 0.21 if font_sz <= 10.5 else 0.23
    min_widths: list[float] = []
    flex_weights: list[float] = []

    for c_idx in range(ncols):
        hdr_tok_max = 3
        cell_lens: list[int] = []
        for r_idx, row in enumerate(table.rows[:25]):
            if c_idx < len(row.cells):
                txt = row.cells[c_idx].text.strip()
                cell_lens.append(min(len(txt), 55))
                if r_idx == 0:
                    for tok in re.split(r"[\s/()]+", txt):
                        hdr_tok_max = max(hdr_tok_max, min(len(tok), 14))
                else:
                    for tok in re.split(r"[\s/]+", txt):
                        if len(tok) <= 10:
                            hdr_tok_max = max(hdr_tok_max, len(tok))
        cell_lens.sort()
        p90 = cell_lens[int(0.9 * (len(cell_lens) - 1))] if cell_lens else 10
        min_w = max(1.25, min(3.4, hdr_tok_max * char_cm + 0.55))
        min_widths.append(min_w)
        flex_weights.append(max(2.0, float(p90)))

    sum_min = sum(min_widths)
    if sum_min >= max_width_cm:
        scale = max_width_cm / sum_min
        col_widths_cm = [w * scale for w in min_widths]
    else:
        extra = max_width_cm - sum_min
        tot_flex = sum(flex_weights) or 1.0
        col_widths_cm = [min_widths[i] + extra * (flex_weights[i] / tot_flex) for i in range(ncols)]

    # Cập nhật <w:tblGrid> để Word tuân thủ tuyệt đối độ rộng từng cột
    col_dxas = [int(round(w * 567)) for w in col_widths_cm]
    if col_dxas:
        col_dxas[-1] += dxa_total - sum(col_dxas)
    old_grid = table._tbl.find(qn("w:tblGrid"))
    if old_grid is not None:
        table._tbl.remove(old_grid)
    new_grid = OxmlElement("w:tblGrid")
    for dxa in col_dxas:
        gc = OxmlElement("w:gridCol")
        gc.set(qn("w:w"), str(dxa))
        new_grid.append(gc)
    tblPr.addnext(new_grid)

    for r_idx, row in enumerate(table.rows):
        trPr = row._tr.get_or_add_trPr()
        if trPr.find(qn("w:cantSplit")) is None:
            trPr.append(OxmlElement("w:cantSplit"))
        if r_idx == 0 and trPr.find(qn("w:tblHeader")) is None:
            trPr.append(OxmlElement("w:tblHeader"))

        for c_idx, cell in enumerate(row.cells):
            if c_idx < len(col_dxas):
                tcPr = cell._tc.get_or_add_tcPr()
                old_tcw = tcPr.find(qn("w:tcW"))
                if old_tcw is not None:
                    tcPr.remove(old_tcw)
                tcPr.append(parse_xml(f'<w:tcW {nsdecls("w")} w:w="{col_dxas[c_idx]}" w:type="dxa"/>'))
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER

            if r_idx == 0:
                tcPr = cell._tc.get_or_add_tcPr()
                shd = tcPr.find(qn("w:shd"))
                if shd is not None:
                    tcPr.remove(shd)
                tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="D9E2F3"/>'))

            for p in cell.paragraphs:
                if p.alignment == WD_ALIGN_PARAGRAPH.JUSTIFY or p.alignment is None:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                p.paragraph_format.first_line_indent = Cm(0)
                p.paragraph_format.line_spacing = 1.15
                p.paragraph_format.space_before = Pt(2)
                p.paragraph_format.space_after = Pt(2)
                for run in p.runs:
                    _set_run_font(
                        run,
                        name="Times New Roman",
                        size_pt=font_sz,
                        bold=(True if r_idx == 0 else None),
                    )


def _highlight_placeholder(paragraph) -> None:
    """Đánh dấu nổi bật các dòng [PLACEHOLDER ...] bằng nền vàng nhạt và chữ đậm đỏ sẫm."""
    _set_paragraph_shading_and_border(paragraph, "FFF8DC", left_border_hex="D97706", left_border_sz="16")
    paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
    paragraph.paragraph_format.space_before = Pt(4)
    paragraph.paragraph_format.space_after = Pt(6)
    paragraph.paragraph_format.line_spacing = 1.25
    for run in paragraph.runs:
        _set_run_font(run, "Times New Roman", 12.5, bold=True, color=RGBColor(0x99, 0x00, 0x00))
        run.font.highlight_color = WD_COLOR_INDEX.YELLOW


def _style_alert_paragraph(paragraph, alert_type: str) -> None:
    """Định dạng khối Alert thành hộp ghi chú chuyên nghiệp (nền nhạt + viền trái)."""
    label_map = {
        "IMPORTANT": ("Quan trọng: ", "FFFBEB", "D97706"),
        "WARNING": ("Cảnh báo: ", "FEF2F2", "DC2626"),
        "TIP": ("Gợi ý: ", "F0FDF4", "16A34A"),
        "CAUTION": ("Lưu ý quan trọng: ", "FEF2F2", "DC2626"),
        "NOTE": ("Lưu ý: ", "F0F4F8", "1B365D"),
    }
    prefix_lbl, fill_hex, border_hex = label_map.get(alert_type, label_map["NOTE"])
    marker = f"[[ALERT_{alert_type}]]"

    # Loại bỏ marker khỏi các run đầu tiên mà giữ nguyên định dạng bold/italic của phần sau
    removed = False
    for r in paragraph.runs:
        if not removed and marker in r.text:
            r.text = r.text.replace(marker, "").lstrip()
            removed = True
            break
    if not removed:
        full = paragraph.text.replace(marker, "").lstrip()
        paragraph.text = ""
        paragraph.add_run(full)

    # Chèn run nhãn ở đầu đoạn
    first_r = paragraph.runs[0] if paragraph.runs else paragraph.add_run("")
    lbl_r = OxmlElement("w:r")
    t = OxmlElement("w:t")
    t.set(qn("xml:space"), "preserve")
    t.text = prefix_lbl
    lbl_r.append(t)
    first_r._r.addprevious(lbl_r)

    paragraph.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    paragraph.paragraph_format.left_indent = Cm(0.4)
    paragraph.paragraph_format.right_indent = Cm(0.2)
    paragraph.paragraph_format.space_before = Pt(4)
    paragraph.paragraph_format.space_after = Pt(6)
    paragraph.paragraph_format.line_spacing = 1.25
    _set_paragraph_shading_and_border(paragraph, fill_hex, left_border_hex=border_hex, left_border_sz="18")

    for idx, run in enumerate(paragraph.runs):
        _set_run_font(
            run,
            "Times New Roman",
            12.5,
            bold=(True if idx == 0 else None),
            color=(RGBColor.from_string(border_hex) if idx == 0 else RGBColor(0x1F, 0x29, 0x37)),
        )


def _split_soft_breaks_in_justified_paragraph(paragraph) -> None:
    """
    Tách mọi soft line break (<w:br/> không phải type="page") trong một đoạn JUSTIFY
    thành các đoạn <w:p> riêng biệt để Word tuyệt đối không kéo dãn chữ.
    """
    p_el = paragraph._p
    soft_brs = [
        br for br in p_el.findall(".//" + qn("w:br"))
        if br.get(qn("w:type")) not in ("page", "column")
    ]
    if not soft_brs:
        return

    # Xây dựng danh sách các đoạn mới bằng cách cắt theo từng soft <w:br/>
    pPr = p_el.find(qn("w:pPr"))
    segments: list[list[OxmlElement]] = [[]]

    for child in list(p_el):
        if child.tag == qn("w:pPr"):
            continue
        if child.tag == qn("w:r"):
            rPr = child.find(qn("w:rPr"))
            cur_r = OxmlElement("w:r")
            if rPr is not None:
                cur_r.append(copy.deepcopy(rPr))
            for r_child in list(child):
                if r_child.tag == qn("w:rPr"):
                    continue
                if r_child.tag == qn("w:br") and r_child.get(qn("w:type")) not in ("page", "column"):
                    if len(cur_r) > (1 if rPr is not None else 0):
                        segments[-1].append(cur_r)
                    segments.append([])
                    cur_r = OxmlElement("w:r")
                    if rPr is not None:
                        cur_r.append(copy.deepcopy(rPr))
                else:
                    cur_r.append(copy.deepcopy(r_child))
            if len(cur_r) > (1 if rPr is not None else 0):
                segments[-1].append(cur_r)
        else:
            segments[-1].append(copy.deepcopy(child))

    # Ghi đè đoạn gốc bằng segment đầu tiên và chèn các segment còn lại phía sau
    for child in list(p_el):
        if child.tag != qn("w:pPr"):
            p_el.remove(child)
    for node in segments[0]:
        p_el.append(node)

    anchor = p_el
    for seg in segments[1:]:
        new_p = OxmlElement("w:p")
        if pPr is not None:
            new_p.append(copy.deepcopy(pPr))
        for node in seg:
            new_p.append(node)
        anchor.addnext(new_p)
        anchor = new_p


def _enable_settings(doc: docx.Document) -> None:
    settings = doc.settings.element
    if settings.find(qn("w:updateFields")) is None:
        uf = OxmlElement("w:updateFields")
        uf.set(qn("w:val"), "true")
        settings.append(uf)
    compat = settings.find(qn("w:compat"))
    if compat is None:
        compat = OxmlElement("w:compat")
        settings.append(compat)
    if compat.find(qn("w:doNotExpandShiftReturn")) is None:
        compat.append(OxmlElement("w:doNotExpandShiftReturn"))


# ---------------------------------------------------------------------------
# 3. Hậu xử lý DOCX bằng python-docx
# ---------------------------------------------------------------------------

def postprocess_docx(docx_path: Path, logo_path: Path | None = None) -> None:
    doc = docx.Document(str(docx_path))

    # 3.1. Chuẩn hóa Styles theo ĐATN-14
    for sname in ("Normal", "Body Text", "First Paragraph", "Compact"):
        if sname in doc.styles:
            st = doc.styles[sname]
            st.font.name = "Times New Roman"
            st.font.size = Pt(13)
            st.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            st.paragraph_format.line_spacing = 1.3
            st.paragraph_format.space_before = Pt(0)
            st.paragraph_format.space_after = Pt(4 if sname == "Compact" else 6)

    if "Source Code" in doc.styles:
        sc = doc.styles["Source Code"]
        sc.font.name = "Consolas"
        sc.font.size = Pt(9.5)
        sc.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        sc.paragraph_format.line_spacing = 1.15
        sc.paragraph_format.space_before = Pt(2)
        sc.paragraph_format.space_after = Pt(4)
        sc.paragraph_format.left_indent = Cm(0.5)

    heading_cfg = {
        "Heading 1": (14, True, 18, 8),
        "Heading 2": (13.5, True, 12, 6),
        "Heading 3": (13, True, 8, 4),
        "Heading 4": (13, True, 6, 3),
    }
    for sname, (sz, is_bold, sb, sa) in heading_cfg.items():
        if sname in doc.styles:
            st = doc.styles[sname]
            st.font.name = "Times New Roman"
            st.font.size = Pt(sz)
            st.font.bold = is_bold
            st.font.color.rgb = RGBColor(0x00, 0x00, 0x00)
            st.paragraph_format.space_before = Pt(sb)
            st.paragraph_format.space_after = Pt(sa)
            st.paragraph_format.keep_with_next = True
            st.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT

    # 3.2. Duyệt các đoạn văn để xử lý marker và định dạng
    in_right_block = False
    in_body_prose = False
    paragraphs_to_remove = []
    layout_tables: set[int] = set()
    justified_paragraphs: list = []

    omath_para_tag = "{http://schemas.openxmlformats.org/officeDocument/2006/math}oMathPara"
    tbl_caption_re = re.compile(r"^Bảng\s+\d+\.\d+\s*[:–-]")
    fig_caption_re = re.compile(r"(Hình\s+\d+\.\d+\s*[–:-][^\]]+)")

    for p in list(doc.paragraphs):
        txt = p.text.strip()

        if txt == "[[COVER_PAGE_MARKER]]":
            _render_cover_page(doc, p, logo_path=logo_path)
            paragraphs_to_remove.append(p)
            continue

        if txt.startswith("[[SPINE_BOX]]"):
            _render_spine_box(doc, p, txt.replace("[[SPINE_BOX]]", "").strip(), layout_tables)
            paragraphs_to_remove.append(p)
            continue

        if txt == "[[SUBCOVER_PAGE_MARKER]]":
            _render_subcover_page(doc, p, layout_tables, logo_path=logo_path)
            paragraphs_to_remove.append(p)
            continue

        if txt == "[[SIG_3COL_NHIEM_VU]]":
            _render_signature_table_3col(doc, p, layout_tables)
            paragraphs_to_remove.append(p)
            continue

        if txt == "[[SIG_2COL_PHULUC_A]]":
            _render_signature_table_2col_phuluc(doc, p, layout_tables)
            paragraphs_to_remove.append(p)
            continue

        if txt == "[[RIGHT_BLOCK_START]]":
            in_right_block = True
            paragraphs_to_remove.append(p)
            continue
        if txt == "[[RIGHT_BLOCK_END]]":
            in_right_block = False
            paragraphs_to_remove.append(p)
            continue

        if txt == "[[EMPTY_LINE]]":
            p.text = ""
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT if in_right_block else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(12)
            continue

        if txt == "[[PAGE_BREAK]]":
            p.text = ""
            p.add_run().add_break(docx.enum.text.WD_BREAK.PAGE)
            continue

        if txt in ("[[SECT_BREAK_1]]", "[[SECT_BREAK_2]]", "[[SECT_BREAK_3]]"):
            if txt == "[[SECT_BREAK_2]]":
                in_body_prose = True
            p.text = ""
            pPr = p._p.get_or_add_pPr()
            sectPr = OxmlElement("w:sectPr")
            sect_type = OxmlElement("w:type")
            sect_type.set(qn("w:val"), "nextPage")
            sectPr.append(sect_type)
            pPr.append(sectPr)
            continue

        if txt == "[[TOC_FIELD]]":
            _insert_toc_field(
                p,
                'TOC \\o "1-3" \\h \\z \\u',
                "[Nhấn Ctrl + A rồi nhấn phím F9 trong Microsoft Word để cập nhật Mục lục tự động]",
            )
            continue
        if txt == "[[LOF_FIELD]]":
            _insert_toc_field(
                p,
                'TOC \\h \\z \\f H \\u',
                "[Nhấn Ctrl + A rồi nhấn phím F9 trong Microsoft Word để cập nhật Danh sách hình vẽ]",
            )
            continue
        if txt == "[[LOT_FIELD]]":
            _insert_toc_field(
                p,
                'TOC \\h \\z \\f B \\u',
                "[Nhấn Ctrl + A rồi nhấn phím F9 trong Microsoft Word để cập nhật Danh sách bảng]",
            )
            continue

        if txt.startswith("[[TITLE_CENTER]]"):
            clean_title = txt.replace("[[TITLE_CENTER]]", "").strip().strip("*")
            p.text = ""
            r = p.add_run(clean_title)
            is_sub = clean_title.startswith("(")
            _set_run_font(r, "Times New Roman", 13 if is_sub else 14, bold=not is_sub, italic=is_sub)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(0 if is_sub else 6)
            p.paragraph_format.space_after = Pt(10)
            p.paragraph_format.line_spacing = 1.3
            continue

        alert_m = re.match(r"^\[\[ALERT_(NOTE|IMPORTANT|WARNING|TIP|CAUTION)\]\]", txt)
        if alert_m:
            _style_alert_paragraph(p, alert_m.group(1))
            justified_paragraphs.append(p)
            continue

        if in_right_block:
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            p.paragraph_format.line_spacing = 1.25
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(4)
            for run in p.runs:
                _set_run_font(run, "Times New Roman", 13)
            continue

        if "[PLACEHOLDER" in txt:
            _highlight_placeholder(p)
            p.paragraph_format.first_line_indent = Cm(0)
            m_fig = fig_caption_re.search(txt)
            if m_fig:
                _insert_tc_field(p, m_fig.group(1).strip(), "H")
            continue

        # Công thức toán học hiển thị riêng dòng (oMathPara) -> luôn căn giữa, không JUSTIFY
        if p._p.findall(f".//{omath_para_tag}"):
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.first_line_indent = Cm(0)
            p.paragraph_format.line_spacing = 1.2
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(6)
            for run in p.runs:
                _set_run_font(run, "Times New Roman", 13)
            continue

        style_name = p.style.name if p.style else ""
        if "Code" in style_name or "Verbatim" in style_name:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.first_line_indent = Cm(0)
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.left_indent = Cm(0.5)
            p.paragraph_format.right_indent = Cm(0.3)
            _set_paragraph_shading_and_border(p, "F5F5F5", all_border_hex="E5E7EB")
            for run in p.runs:
                _set_run_font(run, "Consolas", 9.5)
            continue

        if style_name.startswith("Heading"):
            level = style_name.replace("Heading ", "").strip()
            sz = 14 if level == "1" else (13.5 if level == "2" else 13)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if level == "1" else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.first_line_indent = Cm(0)
            p.paragraph_format.keep_with_next = True
            if level == "1" and txt != "MỞ ĐẦU":
                p.paragraph_format.page_break_before = True
            for run in p.runs:
                _set_run_font(run, "Times New Roman", sz, bold=True, color=RGBColor(0x00, 0x00, 0x00))
            continue

        # Danh sách đầu dòng (có w:numPr)
        pPr = p._p.find(qn("w:pPr"))
        is_list = pPr is not None and pPr.find(qn("w:numPr")) is not None
        is_dots = txt.startswith("....")
        is_tbl_cap = bool(tbl_caption_re.match(txt))
        is_fig_cap = bool(re.match(r"^Hình\s+\d+\.\d+\s*[:–-]", txt))
        is_trong_do = txt.startswith("Trong đó:")

        if is_tbl_cap:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.first_line_indent = Cm(0)
            p.paragraph_format.keep_with_next = True
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(3)
            for run in p.runs:
                _set_run_font(run, "Times New Roman", 13)
            _insert_tc_field(p, txt, "B")
            continue

        if is_fig_cap:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.first_line_indent = Cm(0)
            p.paragraph_format.space_before = Pt(3)
            p.paragraph_format.space_after = Pt(6)
            for run in p.runs:
                _set_run_font(run, "Times New Roman", 13)
            _insert_tc_field(p, txt, "H")
            continue

        p.alignment = WD_ALIGN_PARAGRAPH.LEFT if is_dots else WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = 1.3
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(4 if (is_list or is_dots) else 6)
        if in_body_prose and not is_list and not is_dots and not is_trong_do and txt:
            p.paragraph_format.first_line_indent = Cm(1.0)
        else:
            p.paragraph_format.first_line_indent = Cm(0)
        for run in p.runs:
            _set_run_font(run, "Times New Roman", 13)
        if not is_dots:
            justified_paragraphs.append(p)

    # Tách mọi soft <w:br/> trong các đoạn JUSTIFY thành các đoạn <w:p> riêng biệt
    for p in justified_paragraphs:
        _split_soft_breaks_in_justified_paragraph(p)

    # Xóa các paragraph marker rỗng
    for p in paragraphs_to_remove:
        el = p._element
        if el.getparent() is not None:
            el.getparent().remove(el)

    # 3.3. Định dạng các bảng biểu nội dung (bỏ qua bảng layout không viền / hộp gáy sách)
    for tbl in doc.tables:
        if id(tbl._tbl) in layout_tables:
            continue
        _style_table(tbl, max_width_cm=15.5)

    # 3.4. Lưu tạm rồi mở lại để python-docx nhận diện đầy đủ 4 Sections mới chèn
    doc.save(str(docx_path))
    doc = docx.Document(str(docx_path))

    sections = doc.sections
    for i, sec in enumerate(sections):
        if i == 0:
            # Section 0: Bìa & Phụ bìa (lề trái 3.0cm, viền kép xanh đậm, không đánh số trang)
            _configure_section_margins(sec, left_cm=3.0)
            _apply_cover_page_borders(sec)
            _set_page_number_type(sec, None)
            _clear_footer(sec)
        elif i == 1:
            # Section 1: Nhận xét, Tóm tắt, Nhiệm vụ (lề trái 3.5cm, không đánh số trang)
            _configure_section_margins(sec, left_cm=3.5)
            _set_page_number_type(sec, None)
            _clear_footer(sec)
        elif i == 2:
            # Section 2: Lời nói đầu -> Danh sách ký hiệu (La Mã thường i, ii, iii...)
            _configure_section_margins(sec, left_cm=3.5)
            _set_page_number_type(sec, "lowerRoman", start=1)
            _add_page_number_footer(sec)
        else:
            # Section 3+: Mở đầu -> hết Phụ lục (Ả Rập 1, 2, 3...)
            _configure_section_margins(sec, left_cm=3.5)
            _set_page_number_type(sec, "decimal", start=1)
            _add_page_number_footer(sec)

    _enable_settings(doc)
    doc.save(str(docx_path))


# ---------------------------------------------------------------------------
# 4. Entrypoint
# ---------------------------------------------------------------------------

def _update_fields_with_word(docx_path: Path) -> None:
    """Cập nhật toàn bộ TOC, Danh sách Hình/Bảng và số trang thông qua Microsoft Word COM."""
    try:
        import win32com.client  # type: ignore
    except ImportError:
        return
    word = None
    try:
        word = win32com.client.DispatchEx("Word.Application")
        word.Visible = False
        word.DisplayAlerts = 0
        wdoc = word.Documents.Open(str(docx_path.resolve()))
        wdoc.Fields.Update()
        for toc in wdoc.TablesOfContents:
            toc.Update()
        for tof in wdoc.TablesOfFigures:
            tof.Update()
        wdoc.Save()
        pages = wdoc.ComputeStatistics(2)
        wdoc.Close(False)
        print(f"[4/4] Da cap nhat Muc luc / Danh sach Bang-Hinh qua Word COM (Tong so trang: {pages})")
    except Exception as exc:
        print(f"[Canh bao] Khong the cap nhat fields qua Word COM: {exc}")
    finally:
        if word is not None:
            try:
                word.Quit()
            except Exception:
                pass


def main() -> int:
    print("[1/4] Dang hop nhat va tien xu ly 8 tep Markdown...")
    combined_md = build_combined_markdown()
    logo_bytes = _extract_huce_logo_bytes()

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_dir_p = Path(tmpdir)
        tmp_md = tmp_dir_p / "combined_thesis.md"
        tmp_md.write_text(combined_md, encoding="utf-8")

        tmp_logo: Path | None = None
        if logo_bytes:
            tmp_logo = tmp_dir_p / "huce_logo.png"
            tmp_logo.write_bytes(logo_bytes)

        print(f"[2/4] Dang goi Pandoc chuyen sang DOCX: {OUTPUT_DOCX.name} ...")
        cmd = [
            "pandoc",
            str(tmp_md),
            "-f",
            "markdown+tex_math_dollars+pipe_tables+fenced_code_blocks",
            "-t",
            "docx",
            "-o",
            str(OUTPUT_DOCX),
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
        if res.returncode != 0:
            print("Loi Pandoc:", res.stderr, file=sys.stderr)
            return res.returncode

        print("[3/4] Dang hau xu ly OpenXML (pgBorders, 4 Sections, Page Numbering, Tables, Equations, Fonts)...")
        postprocess_docx(OUTPUT_DOCX, logo_path=tmp_logo)

    _update_fields_with_word(OUTPUT_DOCX)

    final_doc = docx.Document(str(OUTPUT_DOCX))
    print(
        f"Hoan tat! Tep xuat: {OUTPUT_DOCX}\n"
        f"  - So Sections : {len(final_doc.sections)}\n"
        f"  - So Paragraphs: {len(final_doc.paragraphs)}\n"
        f"  - So Tables    : {len(final_doc.tables)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
