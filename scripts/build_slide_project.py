#!/usr/bin/env python3
"""Build a slide project (HTML or Beamer), check it, and render every slide.

HTML decks (``deck.html``) are checked with the theme's headless-Chrome QA report
and exported to PDF. Beamer decks (``main.tex``) are compiled with shell escape
disabled; every overfull box is mapped to its slide number and frame title, and
slides whose frame title appears to be missing are flagged.

Both formats produce the root-level PDF, ``rendered/slide-*.png``, and a
numbered contact sheet ``rendered/contact-*.png``.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import subprocess
import sys
import tempfile
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path


UNRESOLVED_PATTERNS = (
    r"LaTeX Warning: Reference .* undefined",
    r"LaTeX Warning: Citation .* undefined",
    r"There were undefined references",
    r"There were undefined citations",
    r"Package .* Warning: .* undefined",
)


OVERFULL = re.compile(
    r"Overfull \\([hv])box \(([0-9.]+)pt too (?:wide|high)\)"
    r"(?: in paragraph at lines (\d+)--\d+| detected at line (\d+))?"
)
SHIPOUT = re.compile(r"\[(\d+)")
FRAME_START = re.compile(r"\\begin\{frame\}")
TITLE_TOO_WIDE = re.compile(
    r"Frame title too wide by ([0-9.]+pt); scaled to fit on page (\d+)"
)
CONTACT_COLUMNS = 3
CONTACT_ROWS = 3


@dataclass(frozen=True)
class Overflow:
    slide: int
    kind: str
    amount: float
    line: int | None


def find_overflows(log: str) -> list[Overflow]:
    """Assign each overfull box to the page that is shipped out after it."""

    events = [(m.start(), "box", m) for m in OVERFULL.finditer(log)]
    events += [(m.start(), "page", m) for m in SHIPOUT.finditer(log)]
    shipped = 0
    found = []
    for _, kind, match in sorted(events, key=lambda item: item[0]):
        if kind == "page":
            if int(match.group(1)) == shipped + 1:
                shipped += 1
            continue
        line = match.group(3) or match.group(4)
        found.append(
            Overflow(shipped + 1, match.group(1), float(match.group(2)), int(line) if line else None)
        )
    return found


def _braced(text: str, start: int) -> str | None:
    if start >= len(text) or text[start] != "{":
        return None
    depth = 0
    for index in range(start, len(text)):
        if text[index] == "{":
            depth += 1
        elif text[index] == "}":
            depth -= 1
            if depth == 0:
                return text[start + 1 : index]
    return None


def frame_title_at(source_lines: list[str], line: int | None) -> str:
    """Return a short description of the frame enclosing a source line."""

    if not line:
        return "unknown frame"
    begin = None
    for number in range(min(line, len(source_lines)), 0, -1):
        if FRAME_START.search(source_lines[number - 1]):
            begin = number
            break
    if begin is None:
        return "outside any frame"
    chunk = "\n".join(source_lines[begin - 1 : begin + 4])
    rest = chunk[FRAME_START.search(chunk).end() :]
    rest = re.sub(r"^\s*(?:<[^>]*>)?\s*(?:\[[^\]]*\])?\s*", "", rest)
    title = _braced(rest, 0)
    if title is None:
        match = re.search(r"\\frametitle\s*", chunk)
        title = _braced(chunk, match.end()) if match else None
    title = " ".join((title or "untitled").split())
    return f"frame at main.tex:{begin} \"{title[:70]}\""


def report_overflows(
    overflows: list[Overflow], source_lines: list[str], pages: int, tolerance: float
) -> int:
    """Print content overflows by slide; summarize boxes repeated on most slides."""

    significant = [item for item in overflows if item.amount >= tolerance]
    groups: dict[tuple[str, float], set[int]] = defaultdict(set)
    for item in significant:
        groups[(item.kind, item.amount)].add(item.slide)
    repeated = {
        key for key, slides in groups.items() if pages >= 3 and len(slides) >= 0.6 * pages
    }
    for kind, amount in sorted(repeated):
        count = len(groups[(kind, amount)])
        print(
            f"note: overfull {kind}box {amount}pt repeats on {count}/{pages} slides; "
            "likely theme-level, not content (fix in the theme)"
        )
    content = [item for item in significant if (item.kind, item.amount) not in repeated]
    for item in sorted(set(content), key=lambda o: (o.slide, -o.amount)):
        where = f"main.tex:{item.line}" if item.line else "no line"
        print(
            f"overflow: slide {item.slide}: {item.kind}box {item.amount}pt too "
            f"{'wide' if item.kind == 'h' else 'high'} ({where}; "
            f"{frame_title_at(source_lines, item.line)})"
        )
    return len(content)


def scaled_title_slides(log: str) -> dict[int, str]:
    """Return slides whose frame title the theme had to shrink, with the excess."""

    joined = log.replace("\n", "")  # TeX hard-wraps log lines at 79 characters
    return {int(page): excess for excess, page in TITLE_TOO_WIDE.findall(joined)}


def missing_title_slides(pdf: Path, pdftotext: str) -> list[int]:
    """Flag inner slides with no large text in the frame-title band."""

    result = subprocess.run(
        [pdftotext, "-q", "-bbox", str(pdf), "-"],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    if result.returncode:
        return []
    pages = re.split(r"<page ", result.stdout)[1:]
    flagged = []
    for number, page in enumerate(pages, start=1):
        if number in (1, len(pages)):
            continue  # title and closing slides intentionally have no frame title
        height_match = re.search(r'height="([0-9.]+)"', page)
        if not height_match:
            continue
        band = 0.12 * float(height_match.group(1))
        words = re.findall(r'<word xMin="[0-9.]+" yMin="([0-9.]+)" xMax="[0-9.]+" yMax="([0-9.]+)"', page)
        if not any(float(y0) < band and float(y1) - float(y0) > 8 for y0, y1 in words):
            flagged.append(number)
    return flagged


def build_contact_sheet(
    built_pdf: Path, pages: int, pdflatex: str, pdftoppm: str, rendered: Path
) -> list[Path]:
    """Lay out numbered slides 3x3 per page and render the sheets to PNG."""

    per_page = CONTACT_COLUMNS * CONTACT_ROWS
    cells = []
    for number in range(1, pages + 1):
        cells.append(
            r"\parbox[t]{15cm}{\centering\fbox{\includegraphics[page=%d,width=14.6cm]{%s}}"
            r"\par\vspace{1mm}{\Large\bfseries %d}}" % (number, built_pdf.name, number)
        )
        if number % per_page == 0 and number != pages:
            cells.append(r"\newpage")
        elif number % CONTACT_COLUMNS == 0:
            cells.append(r"\par\vspace{4mm}")
        else:
            cells.append(r"\hfill")
    tex = "\n".join(
        [
            r"\documentclass{article}",
            r"\usepackage[paperwidth=48cm,paperheight=30.5cm,margin=0.6cm]{geometry}",
            r"\usepackage{graphicx}",
            r"\pagestyle{empty}\setlength{\parindent}{0pt}\setlength{\fboxsep}{0pt}",
            r"\begin{document}",
            *cells,
            r"\end{document}",
            "",
        ]
    )
    contact_tex = built_pdf.parent / "contact-sheet.tex"
    contact_tex.write_text(tex, encoding="utf-8")
    compile_result = subprocess.run(
        [pdflatex, "-no-shell-escape", "-interaction=nonstopmode", "-halt-on-error", contact_tex.name],
        cwd=built_pdf.parent,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )
    contact_pdf = contact_tex.with_suffix(".pdf")
    if compile_result.returncode or not contact_pdf.is_file():
        print("warning: contact sheet could not be compiled; see build/contact-sheet.log")
        return []
    for stale in rendered.glob("contact-*.png"):
        stale.unlink()
    subprocess.run(
        [pdftoppm, "-png", "-r", "50", str(contact_pdf), str(rendered / "contact")],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    return sorted(rendered.glob("contact-*.png"))


def find_chrome(project: Path) -> str | None:
    """Locate Chrome/Chromium the same way the theme's tools do."""

    helper = project / "theme" / "tools" / "_chrome.sh"
    result = subprocess.run(
        ["bash", "-c", '. "$1"; find_chrome', "_", str(helper)],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    value = result.stdout.strip()
    return value if result.returncode == 0 and value else None


def html_contact_sheet(rendered: Path, chrome: str) -> list[Path]:
    """Screenshot a 3x3 grid of the rendered slide PNGs, with slide numbers."""

    slides = sorted(rendered.glob("slide-*.png"))
    for stale in rendered.glob("contact-*"):
        stale.unlink()
    per_page = CONTACT_COLUMNS * CONTACT_ROWS
    sheets = []
    for start in range(0, len(slides), per_page):
        cells = "".join(
            f'<figure><img src="{html.escape(path.name)}"><figcaption>{start + offset + 1}'
            "</figcaption></figure>"
            for offset, path in enumerate(slides[start : start + per_page])
        )
        page = rendered / f"contact-{start // per_page + 1}.html"
        page.write_text(
            "<!doctype html><meta charset=utf-8><style>"
            "body{margin:16px;background:#fff;font:bold 22px sans-serif;display:grid;"
            "grid-template-columns:repeat(3,600px);gap:14px 20px}"
            "figure{margin:0;text-align:center}img{width:600px;border:1px solid #888;display:block}"
            "figcaption{margin-top:4px}</style>" + cells,
            encoding="utf-8",
        )
        png = page.with_suffix(".png")
        with tempfile.TemporaryDirectory() as profile:
            subprocess.run(
                [chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
                 f"--user-data-dir={profile}", "--window-size=1872,1170",
                 f"--screenshot={png}", page.as_uri()],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
        page.unlink()
        if png.is_file():
            sheets.append(png)
    return sheets


def build_html(project: Path, deck: Path, pdf_name: str, args: argparse.Namespace) -> int:
    """Check an HTML deck with the theme QA report, export the PDF, and render it."""

    tools = project / "theme" / "tools"
    if not (tools / "check.sh").is_file():
        print(f"error: theme tools not found in {tools}; run sync_theme.py", file=sys.stderr)
        return 2
    chrome = find_chrome(project)
    if not chrome:
        print("error: Chrome/Chromium is required for HTML decks; set CHROME=/path", file=sys.stderr)
        return 1

    check = subprocess.run(
        ["bash", str(tools / "check.sh"), str(deck)],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if check.returncode == 2 or "{" not in check.stdout:
        print(check.stderr or check.stdout, file=sys.stderr)
        print("error: HTML QA report unavailable (offline? KaTeX is loaded from a CDN)", file=sys.stderr)
        return 1
    report = json.loads(check.stdout[check.stdout.index("{") : check.stdout.rindex("}") + 1])
    (project / "rendered").mkdir(exist_ok=True)
    (project / "rendered" / "qa-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    blockers = 0
    for item in report.get("overflow", []):
        print(f"overflow: slide {item.get('slide')}: \"{item.get('title', '')}\" content overflows the slide")
    for key in report.get("missingCitations", []):
        print(f"error: missing citation key: {key}")
        blockers += 1
    for label in report.get("missingLabels", []):
        print(f"error: undefined label: {label}")
        blockers += 1
    for item in report.get("katexErrors", []):
        print(f"error: slide {item.get('slide')}: KaTeX error in {item.get('tex')!r}: {item.get('error')}")
        blockers += 1
    for warning in report.get("warnings", []):
        print(f"warning: {warning}")
    notation = report.get("notation") or {}
    if notation:
        print(
            f"notation hover (Q&A aid only): {notation.get('entries', 0)} glossary entries, "
            f"{notation.get('annotatedSymbols', 0)} annotated symbols"
        )
        for key in notation.get("unusedDeckKeys", []):
            print(f"notation: glossary key never matched a formula: {key}")
        if notation.get("fallbackFormulas"):
            print(f"notation: {notation['fallbackFormulas']} formula(s) fell back to plain rendering")

    final_pdf = project / pdf_name
    export = subprocess.run(
        ["bash", str(tools / "export-pdf.sh"), str(deck), str(final_pdf)],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )
    if export.returncode or not final_pdf.is_file():
        print(export.stdout, file=sys.stderr)
        print("error: PDF export failed", file=sys.stderr)
        return 1

    rendered = project / "rendered"
    contact_sheets: list[Path] = []
    pdftoppm = None if args.skip_render else shutil.which("pdftoppm")
    if not args.skip_render:
        for stale in rendered.glob("slide-*.png"):
            stale.unlink()
        if pdftoppm:
            subprocess.run(
                [pdftoppm, "-png", "-r", str(args.render_dpi), str(final_pdf), str(rendered / "slide")],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
        else:
            subprocess.run(
                ["bash", str(tools / "screenshot.sh"), str(deck), str(rendered)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
        if not args.skip_contact_sheet:
            contact_sheets = html_contact_sheet(rendered, chrome)

    print(f"Build {'OK' if not blockers else 'FAILED'}: {final_pdf} ({report.get('slides', '?')} slides)")
    print(f"QA report: {rendered / 'qa-report.json'}; overflowing slides: {len(report.get('overflow', []))}")
    if not args.skip_render:
        print(f"Rendered slides: {len(list(rendered.glob('slide-*.png')))} in {rendered}")
    if contact_sheets:
        print("Contact sheet: " + ", ".join(str(path) for path in contact_sheets))
    print("Hover tooltips never appear in the PDF or PNGs: every symbol must be defined on the slide.")
    print("Visual inspection is still required before delivery.")
    return 1 if blockers else 0


def require_command(name: str) -> str:
    path = shutil.which(name)
    if not path:
        raise RuntimeError(f"required command not found: {name}")
    return path


def main() -> int:
    cli = argparse.ArgumentParser(
        description="Build deck.html or main.tex, run QA checks, and render all slides."
    )
    cli.add_argument("project", type=Path, help="slide project directory")
    cli.add_argument("--tex", default="main.tex", help="Beamer: TeX filename inside the project")
    cli.add_argument("--pdf-name", help="root-level output name; defaults to <project>.pdf")
    cli.add_argument("--skip-render", action="store_true")
    cli.add_argument("--skip-contact-sheet", action="store_true")
    cli.add_argument("--render-dpi", type=int, default=144)
    cli.add_argument(
        "--overflow-tolerance",
        type=float,
        default=1.0,
        help="Beamer: ignore overfull boxes smaller than this many points (default 1.0)",
    )
    args = cli.parse_args()

    project = args.project.expanduser().resolve()
    if args.render_dpi < 72:
        print("error: --render-dpi must be at least 72", file=sys.stderr)
        return 2
    pdf_name = args.pdf_name or f"{project.name}.pdf"
    if Path(pdf_name).name != pdf_name or not pdf_name.lower().endswith(".pdf"):
        print("error: --pdf-name must be a PDF basename, not a path", file=sys.stderr)
        return 2

    tex = project / args.tex
    deck = project / "deck.html"
    if not tex.is_file() and deck.is_file():
        return build_html(project, deck, pdf_name, args)
    if not tex.is_file():
        print(f"error: neither deck.html nor {args.tex} found in {project}", file=sys.stderr)
        return 2

    try:
        latexmk = require_command("latexmk")
        pdflatex = require_command("pdflatex")
        pdftoppm = None if args.skip_render else require_command("pdftoppm")
    except RuntimeError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    build = project / "build"
    rendered = project / "rendered"
    build.mkdir(exist_ok=True)
    rendered.mkdir(exist_ok=True)

    command = [
        latexmk,
        "-pdf",
        "-interaction=nonstopmode",
        "-halt-on-error",
        "-file-line-error",
        f"-outdir={build}",
        "-pdflatex=pdflatex -no-shell-escape %O %S",
        tex.name,
    ]
    result = subprocess.run(
        command,
        cwd=project,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )
    if result.returncode:
        print(result.stdout, file=sys.stderr)
        print("error: LaTeX build failed", file=sys.stderr)
        return result.returncode

    built_pdf = build / f"{tex.stem}.pdf"
    log_path = build / f"{tex.stem}.log"
    if not built_pdf.is_file() or not log_path.is_file():
        print("error: build completed without the expected PDF or log", file=sys.stderr)
        return 1

    log = log_path.read_text(encoding="utf-8", errors="replace")
    unresolved = []
    for pattern in UNRESOLVED_PATTERNS:
        unresolved.extend(re.findall(pattern, log, flags=re.IGNORECASE))
    if unresolved:
        for warning in sorted(set(unresolved)):
            print(f"error: {warning}", file=sys.stderr)
        return 1

    pages_match = re.search(r"Output written on .*?\((\d+) pages?", log, flags=re.DOTALL)
    pages = int(pages_match.group(1)) if pages_match else 0
    source_lines = tex.read_text(encoding="utf-8", errors="replace").splitlines()
    overflows = find_overflows(log)
    content_overflows = report_overflows(
        overflows, source_lines, pages, args.overflow_tolerance
    )
    underfull_count = len(re.findall(r"Underfull \\[hv]box", log))

    final_pdf = project / pdf_name
    shutil.copy2(built_pdf, final_pdf)

    if pdftoppm:
        for stale in rendered.glob("slide-*.png"):
            stale.unlink()
        render = subprocess.run(
            [
                pdftoppm,
                "-png",
                "-r",
                str(args.render_dpi),
                str(final_pdf),
                str(rendered / "slide"),
            ],
            cwd=project,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            check=False,
        )
        if render.returncode:
            print(render.stdout, file=sys.stderr)
            print("error: PDF rendering failed", file=sys.stderr)
            return render.returncode

    contact_sheets: list[Path] = []
    if pdftoppm and not args.skip_contact_sheet and pages:
        contact_sheets = build_contact_sheet(built_pdf, pages, pdflatex, pdftoppm, rendered)

    scaled = scaled_title_slides(log)
    for number, excess in sorted(scaled.items()):
        print(f"title: slide {number}: frame title too wide by {excess}; theme scaled it down, shorten it")

    pdftotext = shutil.which("pdftotext")
    untitled = missing_title_slides(final_pdf, pdftotext) if pdftotext else []
    untitled = [number for number in untitled if number not in scaled]
    for number in untitled:
        print(
            f"check: slide {number}: no frame title detected in the header band "
            "(intentional untitled frame, or a title that was too long and vanished?)"
        )

    rendered_count = len(list(rendered.glob("slide-*.png"))) if pdftoppm else 0
    print(f"Build OK: {final_pdf} ({pages} pages)")
    print(f"Log retained: {log_path}")
    print(
        f"Content overflows (>= {args.overflow_tolerance}pt): {content_overflows}; "
        f"underfull boxes: {underfull_count}"
    )
    if pdftoppm:
        print(f"Rendered slides: {rendered_count} in {rendered}")
    if contact_sheets:
        print("Contact sheet: " + ", ".join(str(path) for path in contact_sheets))
    print("Visual inspection is still required before delivery.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
