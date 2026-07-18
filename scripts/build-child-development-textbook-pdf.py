#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/wonderpacks/CHILD_DEVELOPMENT_MISSION_DESIGN_TEXTBOOK.md"
OUTPUT = ROOT / "output/pdf/child-development-mission-design-textbook.pdf"

BLUE = colors.HexColor("#0167D3")
YELLOW = colors.HexColor("#F3B806")
RED = colors.HexColor("#EC2127")
INK = colors.HexColor("#172033")
MUTED = colors.HexColor("#5D687A")
PALE_BLUE = colors.HexColor("#EAF4FF")
PALE_YELLOW = colors.HexColor("#FFF7D8")
LINE = colors.HexColor("#D9E1EC")
PAPER = colors.HexColor("#F7F9FC")


def register_fonts() -> None:
    font_dir = Path.home() / "Library/Fonts"
    pdfmetrics.registerFont(TTFont("NotoKR", str(font_dir / "NotoSansKR-Regular.ttf")))
    pdfmetrics.registerFont(TTFont("NotoKR-Medium", str(font_dir / "NotoSansKR-Medium.ttf")))
    pdfmetrics.registerFont(TTFont("NotoKR-Bold", str(font_dir / "NotoSansKR-SemiBold.ttf")))


class TextbookDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str, **kwargs):
        super().__init__(filename, **kwargs)
        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            id="normal",
            leftPadding=0,
            rightPadding=0,
            topPadding=0,
            bottomPadding=0,
        )
        self.addPageTemplates(PageTemplate(id="content", frames=[frame], onPage=self._decorate_page))
        self._bookmark_id = 0

    def beforeDocument(self):
        self._bookmark_id = 0

    def _decorate_page(self, canvas, doc):
        canvas.saveState()
        width, height = A4
        if doc.page == 1:
            canvas.setFillColor(BLUE)
            canvas.rect(0, height - 14 * mm, width, 14 * mm, fill=1, stroke=0)
            canvas.setFillColor(YELLOW)
            canvas.rect(0, 0, width * 0.66, 5 * mm, fill=1, stroke=0)
            canvas.setFillColor(RED)
            canvas.rect(width * 0.66, 0, width * 0.34, 5 * mm, fill=1, stroke=0)
        else:
            canvas.setStrokeColor(LINE)
            canvas.setLineWidth(0.5)
            canvas.line(22 * mm, height - 15 * mm, width - 22 * mm, height - 15 * mm)
            canvas.setFont("NotoKR", 7.5)
            canvas.setFillColor(MUTED)
            canvas.drawString(22 * mm, height - 11.5 * mm, "원더미션을 만드는 사람을 위한 아동 발달 자습서")
            canvas.drawRightString(width - 22 * mm, 11 * mm, str(doc.page))
        canvas.restoreState()

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            style_name = flowable.style.name
            if style_name in ("Chapter", "Section"):
                level = 0 if style_name == "Chapter" else 1
                text = flowable.getPlainText()
                self._bookmark_id += 1
                key = f"h{self._bookmark_id}"
                self.canv.bookmarkPage(key)
                self.canv.addOutlineEntry(text, key, level=level, closed=False)
                self.notify("TOCEntry", (level, text, self.page, key))


def styles():
    base = getSampleStyleSheet()
    body = ParagraphStyle(
        "BodyKR",
        parent=base["BodyText"],
        fontName="NotoKR",
        fontSize=9.2,
        leading=15.2,
        textColor=INK,
        spaceAfter=3.2 * mm,
        wordWrap="CJK",
        splitLongWords=True,
    )
    return {
        "cover_title": ParagraphStyle(
            "CoverTitle",
            fontName="NotoKR-Bold",
            fontSize=27,
            leading=38,
            textColor=INK,
            alignment=TA_LEFT,
            wordWrap="CJK",
            spaceAfter=7 * mm,
        ),
        "cover_subtitle": ParagraphStyle(
            "CoverSubtitle",
            fontName="NotoKR-Medium",
            fontSize=13,
            leading=22,
            textColor=BLUE,
            wordWrap="CJK",
            spaceAfter=12 * mm,
        ),
        "cover_meta": ParagraphStyle(
            "CoverMeta",
            fontName="NotoKR",
            fontSize=9.5,
            leading=17,
            textColor=MUTED,
            wordWrap="CJK",
        ),
        "chapter": ParagraphStyle(
            "Chapter",
            fontName="NotoKR-Bold",
            fontSize=20,
            leading=29,
            textColor=BLUE,
            spaceBefore=3 * mm,
            spaceAfter=6 * mm,
            keepWithNext=True,
            wordWrap="CJK",
        ),
        "section": ParagraphStyle(
            "Section",
            fontName="NotoKR-Bold",
            fontSize=13.5,
            leading=21,
            textColor=INK,
            spaceBefore=5 * mm,
            spaceAfter=2.5 * mm,
            keepWithNext=True,
            wordWrap="CJK",
        ),
        "subsection": ParagraphStyle(
            "Subsection",
            fontName="NotoKR-Bold",
            fontSize=10.5,
            leading=17,
            textColor=RED,
            spaceBefore=3.5 * mm,
            spaceAfter=1.8 * mm,
            keepWithNext=True,
            wordWrap="CJK",
        ),
        "body": body,
        "bullet": ParagraphStyle(
            "BulletKR",
            parent=body,
            leftIndent=5 * mm,
            firstLineIndent=-3.5 * mm,
            bulletIndent=0,
            spaceAfter=1.4 * mm,
        ),
        "quote": ParagraphStyle(
            "QuoteKR",
            parent=body,
            leftIndent=6 * mm,
            rightIndent=4 * mm,
            borderColor=BLUE,
            borderWidth=0,
            borderPadding=4 * mm,
            backColor=PALE_BLUE,
            textColor=INK,
            spaceBefore=2 * mm,
            spaceAfter=4 * mm,
        ),
        "toc_title": ParagraphStyle(
            "TOCTitle",
            fontName="NotoKR-Bold",
            fontSize=20,
            leading=28,
            textColor=BLUE,
            spaceAfter=8 * mm,
        ),
        "toc0": ParagraphStyle(
            "TOC0",
            fontName="NotoKR-Medium",
            fontSize=9.4,
            leading=15,
            textColor=INK,
            leftIndent=0,
            firstLineIndent=0,
            spaceBefore=1.3 * mm,
        ),
        "toc1": ParagraphStyle(
            "TOC1",
            fontName="NotoKR",
            fontSize=8.3,
            leading=13,
            textColor=MUTED,
            leftIndent=7 * mm,
            firstLineIndent=0,
            spaceBefore=0.7 * mm,
        ),
        "table_header": ParagraphStyle(
            "TableHeader",
            fontName="NotoKR-Bold",
            fontSize=7.8,
            leading=11.5,
            textColor=colors.white,
            alignment=TA_CENTER,
            wordWrap="CJK",
        ),
        "table_cell": ParagraphStyle(
            "TableCell",
            fontName="NotoKR",
            fontSize=7.5,
            leading=11.5,
            textColor=INK,
            wordWrap="CJK",
        ),
    }


def inline_markup(text: str) -> str:
    text = text.strip()
    text = re.sub(r"`([^`]+)`", r"<font name='NotoKR-Medium' color='#0167D3'>\1</font>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"\[([^]]+)\]\(([^)]+)\)", r"<link href='\2' color='#0167D3'>\1</link>", text)
    return text


def parse_table(lines: list[str], style_map, available_width: float):
    rows = []
    for line in lines:
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        rows.append(cells)
    if len(rows) >= 2 and all(set(cell) <= {"-", ":", " "} for cell in rows[1]):
        rows.pop(1)
    col_count = max(len(row) for row in rows)
    for row in rows:
        row.extend([""] * (col_count - len(row)))
    rendered = []
    for r_idx, row in enumerate(rows):
        style = style_map["table_header"] if r_idx == 0 else style_map["table_cell"]
        rendered.append([Paragraph(inline_markup(cell), style) for cell in row])
    if col_count == 2:
        widths = [available_width * 0.28, available_width * 0.72]
    elif col_count == 3:
        widths = [available_width * 0.22, available_width * 0.39, available_width * 0.39]
    elif col_count == 4:
        widths = [available_width * 0.18, available_width * 0.27, available_width * 0.27, available_width * 0.28]
    else:
        widths = [available_width / col_count] * col_count
    table = Table(rendered, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BLUE),
                ("GRID", (0, 0), (-1, -1), 0.4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PAPER]),
            ]
        )
    )
    return table


def paragraph_from_buffer(buffer: list[str], style_map, story):
    if not buffer:
        return
    text = " ".join(part.strip() for part in buffer).strip()
    if text:
        story.append(Paragraph(inline_markup(text), style_map["body"]))
    buffer.clear()


def build_story(markdown: str, style_map, page_width: float):
    lines = markdown.splitlines()
    story = []
    body_lines: list[str] = []

    title = lines[0].removeprefix("# ").strip()
    subtitle = lines[2].removeprefix("부제:").strip()
    meta = []
    idx = 3
    while idx < len(lines) and "<!-- pagebreak -->" not in lines[idx]:
        line = lines[idx].strip()
        if line.startswith("- "):
            meta.append(line[2:])
        idx += 1

    story.extend(
        [
            Spacer(1, 38 * mm),
            Paragraph(title, style_map["cover_title"]),
            Paragraph(subtitle, style_map["cover_subtitle"]),
            HRFlowable(width="34%", thickness=4, color=YELLOW, spaceAfter=9 * mm, hAlign="LEFT"),
            Paragraph("<br/>".join(meta), style_map["cover_meta"]),
            Spacer(1, 34 * mm),
            Paragraph("WONDERPIN STUDY SERIES · 01", style_map["cover_meta"]),
            PageBreak(),
            Paragraph("목차", style_map["toc_title"]),
        ]
    )
    toc = TableOfContents()
    toc.levelStyles = [style_map["toc0"], style_map["toc1"]]
    story.extend([toc, PageBreak()])

    idx += 1
    while idx < len(lines):
        raw = lines[idx]
        stripped = raw.strip()

        if stripped == "<!-- pagebreak -->":
            paragraph_from_buffer(body_lines, style_map, story)
            if story and not isinstance(story[-1], PageBreak):
                story.append(PageBreak())
            idx += 1
            continue

        if stripped.startswith("| "):
            paragraph_from_buffer(body_lines, style_map, story)
            table_lines = []
            while idx < len(lines) and lines[idx].strip().startswith("|"):
                table_lines.append(lines[idx].strip())
                idx += 1
            story.extend([parse_table(table_lines, style_map, page_width), Spacer(1, 4 * mm)])
            continue

        if stripped.startswith("# "):
            paragraph_from_buffer(body_lines, style_map, story)
            if story and not isinstance(story[-1], PageBreak):
                story.append(PageBreak())
            story.append(Paragraph(inline_markup(stripped[2:]), style_map["chapter"]))
            idx += 1
            continue

        if stripped.startswith("## "):
            paragraph_from_buffer(body_lines, style_map, story)
            story.append(Paragraph(inline_markup(stripped[3:]), style_map["section"]))
            idx += 1
            continue

        if stripped.startswith("### "):
            paragraph_from_buffer(body_lines, style_map, story)
            story.append(Paragraph(inline_markup(stripped[4:]), style_map["subsection"]))
            idx += 1
            continue

        if stripped.startswith("> "):
            paragraph_from_buffer(body_lines, style_map, story)
            quote_lines = []
            while idx < len(lines) and lines[idx].strip().startswith(">"):
                quote_lines.append(lines[idx].strip().lstrip(">").strip())
                idx += 1
            story.append(Paragraph(inline_markup("<br/>".join(quote_lines)), style_map["quote"]))
            continue

        bullet_match = re.match(r"^(-|\d+\.)\s+(.*)$", stripped)
        if bullet_match:
            paragraph_from_buffer(body_lines, style_map, story)
            marker, text = bullet_match.groups()
            bullet = "•" if marker == "-" else marker
            story.append(Paragraph(inline_markup(text), style_map["bullet"], bulletText=bullet))
            idx += 1
            continue

        if stripped == "":
            paragraph_from_buffer(body_lines, style_map, story)
            idx += 1
            continue

        body_lines.append(stripped)
        idx += 1

    paragraph_from_buffer(body_lines, style_map, story)
    return story


def main() -> None:
    register_fonts()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    style_map = styles()
    doc = TextbookDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=22 * mm,
        rightMargin=22 * mm,
        topMargin=21 * mm,
        bottomMargin=18 * mm,
        title="원더미션을 만드는 사람을 위한 아동 발달 자습서",
        author="Wonderpin",
        subject="만 4~9세 아동 발달과 원더미션 설계",
    )
    markdown = SOURCE.read_text(encoding="utf-8")
    story = build_story(markdown, style_map, doc.width)
    doc.multiBuild(story)
    print(OUTPUT)


if __name__ == "__main__":
    main()
