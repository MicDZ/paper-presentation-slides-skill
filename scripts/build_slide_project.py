#!/usr/bin/env python3
"""Compile a Beamer project safely, check references, and render every slide."""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path


UNRESOLVED_PATTERNS = (
    r"LaTeX Warning: Reference .* undefined",
    r"LaTeX Warning: Citation .* undefined",
    r"There were undefined references",
    r"There were undefined citations",
    r"Package .* Warning: .* undefined",
)


def require_command(name: str) -> str:
    path = shutil.which(name)
    if not path:
        raise RuntimeError(f"required command not found: {name}")
    return path


def main() -> int:
    cli = argparse.ArgumentParser(
        description="Compile main.tex with shell escape disabled and render all slides."
    )
    cli.add_argument("project", type=Path, help="slide project directory")
    cli.add_argument("--tex", default="main.tex", help="TeX filename inside the project")
    cli.add_argument("--pdf-name", help="root-level output name; defaults to <project>.pdf")
    cli.add_argument("--skip-render", action="store_true")
    cli.add_argument("--render-dpi", type=int, default=144)
    args = cli.parse_args()

    project = args.project.expanduser().resolve()
    tex = project / args.tex
    if not tex.is_file():
        print(f"error: TeX source not found: {tex}", file=sys.stderr)
        return 2
    if args.render_dpi < 72:
        print("error: --render-dpi must be at least 72", file=sys.stderr)
        return 2

    pdf_name = args.pdf_name or f"{project.name}.pdf"
    if Path(pdf_name).name != pdf_name or not pdf_name.lower().endswith(".pdf"):
        print("error: --pdf-name must be a PDF basename, not a path", file=sys.stderr)
        return 2

    try:
        latexmk = require_command("latexmk")
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

    overfull_count = len(re.findall(r"Overfull \\[hv]box", log))
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

    rendered_count = len(list(rendered.glob("slide-*.png"))) if pdftoppm else 0
    print(f"Build OK: {final_pdf}")
    print(f"Log retained: {log_path}")
    print(f"Box warnings: overfull={overfull_count}, underfull={underfull_count}")
    if pdftoppm:
        print(f"Rendered slides: {rendered_count} in {rendered}")
    print("Visual inspection is still required before delivery.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
