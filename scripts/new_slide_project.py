#!/usr/bin/env python3
"""Create a reproducible paper-talk project from the MBZUAI theme (HTML or Beamer)."""

from __future__ import annotations

import argparse
import html
import sys
from datetime import date as _date
from pathlib import Path

from theme_source import (
    DECK_FILES,
    DEFAULT_THEME_REPO,
    FORMATS,
    TEMPLATES,
    install_theme,
    resolve_theme,
)


SOURCES = """# Sources and provenance

Retrieval date for online sources: **@@RETRIEVED@@**.

## Paper identity

- Title: *@@TITLE@@*
- Authors:
- Stable identifier:
- Exact version/date used:
- Venue/status:
- Official landing page:
- Official PDF:
- Official TeX or HTML source:
- Supplementary material:
- License:

Keep immutable source copies under `paper-source/`. Record filenames and SHA-256 hashes for archived downloads.

## Figures and tables

| Local file | Paper locator | Original source | Adaptation | License | Use |
|---|---|---|---|---|---|

List used and archived assets. Mark each as unchanged, cropped, annotated, re-typeset, or reconstructed.

## Formula audit

Complete notation audit for every displayed formula. Slides show only the symbols the spoken explanation uses; this table holds the rest.

| Slide | Paper locator | Role | Symbol | Type / shape / status | Paper-specific meaning | Shown on slide? |
|---|---|---|---|---|---|---|

## Equations and derived values

- Record each transcribed equation locator and any notation changes.
- Record arithmetic derived from reported values, including operands and rounding.
- Do not reconstruct unavailable raw data.

## Data and code

- Repository/release/commit:
- Local snapshot:
- License:
- Implementation status at retrieval:
- Public data and transformations used for reconstructed visuals:

## Theme

- Deck format: @@FORMAT@@
- Repository/source: @@THEME_SOURCE@@
- Requested ref: `@@THEME_REF@@`
- Resolved commit: `@@THEME_COMMIT@@`
- License: MIT; see `THEME_LICENSE`
- Local provenance: `THEME_UPSTREAM.md`

## Scope of interpretation

Separate paper-reported claims, derived values, and presenter synthesis. Record unresolved version, source, or reproducibility limitations, and caveats that were moved off the slides.

Record local files relative to this project directory. Do not record absolute paths to the skill installation, home directory, or agent-specific folders.
"""

CONTEXT_FILENAME = "talk-context.md"
FOOTER_SIDES = ("left", "center", "right")
CONTEXT_KEYS = {
    "presenter",
    "venue",
    "subtitle",
    "date",
    "format",
    *(f"{prefix}footer_{side}" for prefix in ("", "html_", "beamer_") for side in FOOTER_SIDES),
}
DEFAULT_FOOTERS = {
    "html": ("@@SHORT_TITLE@@", "Session by <em>@@PRESENTER@@</em>", "{page} / {total}"),
    "beamer": (
        "@@SHORT_TITLE@@",
        r"Session by \textit{@@PRESENTER@@}",
        r"\insertframenumber{} / \inserttotalframenumber",
    ),
}


def find_context(start: Path) -> Path | None:
    """Return the nearest talk-context.md in start or its ancestors."""

    for directory in (start, *start.parents):
        candidate = directory / CONTEXT_FILENAME
        if candidate.is_file():
            return candidate
    return None


def read_context(path: Path) -> dict[str, str]:
    """Parse the flat ``key: value`` front matter of a talk-context file."""

    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0].strip() != "---":
        return {}
    values: dict[str, str] = {}
    for line in lines[1:]:
        stripped = line.strip()
        if stripped == "---":
            break
        if not stripped or stripped.startswith("#") or ":" not in stripped:
            continue
        key, value = (part.strip() for part in stripped.split(":", 1))
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        if key in CONTEXT_KEYS and value:
            values[key] = value
    return values


def materialize(template: str, values: dict[str, str]) -> str:
    result = template
    for key, value in values.items():
        result = result.replace(f"@@{key}@@", value)
    return result


def main() -> int:
    cli = argparse.ArgumentParser(
        description="Create an MBZUAI slide project (HTML by default, or Beamer) for one paper."
    )
    cli.add_argument("output", type=Path, help="new project directory")
    cli.add_argument(
        "--format",
        choices=FORMATS,
        help="deck format; defaults to the context file's format, else html (recommended)",
    )
    cli.add_argument("--title", default="Paper title", help="full LaTeX-safe paper title")
    cli.add_argument("--short-title", help="short title for headers and footers")
    cli.add_argument("--subtitle", help="defaults to the context file or a generic line")
    cli.add_argument("--authors", default="Paper authors")
    cli.add_argument(
        "--presenter",
        help="presenter display name confirmed by the user (or from talk-context.md)",
    )
    cli.add_argument("--venue", help="session/venue line; empty unless given or in context")
    cli.add_argument("--date", help=r"date/version line; defaults to today (\today in Beamer)")
    cli.add_argument("--retrieved", default="YYYY-MM-DD")
    context = cli.add_mutually_exclusive_group()
    context.add_argument(
        "--context",
        type=Path,
        help=f"shared {CONTEXT_FILENAME}; by default the nearest one above the output is used",
    )
    context.add_argument(
        "--no-context",
        action="store_true",
        help=f"ignore any {CONTEXT_FILENAME} found above the output directory",
    )
    footer = cli.add_mutually_exclusive_group()
    footer.add_argument(
        "--confirm-default-footer",
        action="store_true",
        help="use the confirmed short-title / Session by presenter / page-count footer",
    )
    footer.add_argument(
        "--footer",
        nargs=3,
        metavar=("LEFT", "CENTER", "RIGHT"),
        help="three confirmed footer fields (HTML for html decks, LaTeX for beamer decks)",
    )
    cli.add_argument(
        "--theme-repo",
        default=DEFAULT_THEME_REPO,
        help="MBZUAI theme Git repository used for remote fetches",
    )
    cli.add_argument(
        "--theme-ref",
        help="fetch this theme branch, tag, or commit instead of the bundled submodule",
    )
    cli.add_argument(
        "--theme-remote",
        action="store_true",
        help="fetch the latest theme main branch instead of the bundled submodule",
    )
    cli.add_argument(
        "--theme-dir",
        type=Path,
        help="use a local theme checkout instead of the bundled submodule",
    )
    args = cli.parse_args()

    output = args.output.expanduser().resolve()
    if output.exists() and (not output.is_dir() or any(output.iterdir())):
        print(f"error: output directory is not empty: {output}", file=sys.stderr)
        return 2

    # Precedence: explicit command-line values > shared context file > skill defaults.
    context_path = None
    if args.context is not None:
        context_path = args.context.expanduser().resolve()
        if not context_path.is_file():
            print(f"error: context file not found: {context_path}", file=sys.stderr)
            return 2
    elif not args.no_context:
        context_path = find_context(output.parent)
    shared = read_context(context_path) if context_path else {}
    if context_path:
        keys = ", ".join(sorted(shared)) or "no recognized metadata keys"
        print(f"Using shared context {context_path} ({keys})")

    presenter = args.presenter or shared.get("presenter")
    if not presenter:
        print(
            "error: pass --presenter with the user-confirmed name "
            f"or set presenter in {CONTEXT_FILENAME}",
            file=sys.stderr,
        )
        return 2

    fmt = args.format or shared.get("format", "html")
    if fmt not in FORMATS:
        print(f"error: unknown format {fmt!r} in {CONTEXT_FILENAME}", file=sys.stderr)
        return 2

    short_title = args.short_title or args.title
    # Format-specific context keys (html_footer_left, ...) win over generic ones.
    context_footer = [
        shared.get(f"{fmt}_footer_{side}") or shared.get(f"footer_{side}") for side in FOOTER_SIDES
    ]
    if args.footer:
        foot_left, foot_center, foot_right = args.footer
    elif args.confirm_default_footer:
        foot_left, foot_center, foot_right = DEFAULT_FOOTERS[fmt]
    elif all(context_footer):
        foot_left, foot_center, foot_right = context_footer
    else:
        print(
            "error: confirm the footer with --confirm-default-footer or --footer, "
            f"or set footer_left/center/right in {CONTEXT_FILENAME}",
            file=sys.stderr,
        )
        return 2

    subtitle = args.subtitle or shared.get("subtitle") or "Research paper presentation"
    venue = args.venue if args.venue is not None else shared.get("venue", "")
    date = args.date or shared.get("date") or (r"\today" if fmt == "beamer" else _date.today().isoformat())
    placeholders = {"SHORT_TITLE": short_title, "PRESENTER": presenter, "TITLE": args.title}
    foot_left, foot_center, foot_right = (
        materialize(field, placeholders) for field in (foot_left, foot_center, foot_right)
    )

    try:
        with resolve_theme(
            repository=args.theme_repo,
            ref=args.theme_ref,
            local_directory=args.theme_dir,
            remote=args.theme_remote or args.theme_repo != DEFAULT_THEME_REPO,
        ) as snapshot:
            main_template = (snapshot.path / TEMPLATES[fmt]).read_text(encoding="utf-8")
            values = {
                "TITLE": args.title,
                "SHORT_TITLE": short_title,
                "SUBTITLE": subtitle,
                "AUTHORS": args.authors,
                "PRESENTER": presenter,
                "VENUE": venue,
                "DATE": date,
                "RETRIEVED": args.retrieved,
                "FOOT_LEFT": foot_left,
                "FOOT_CENTER": foot_center,
                "FOOT_RIGHT": foot_right,
                "THEME_SOURCE": snapshot.source,
                "THEME_REF": snapshot.requested_ref,
                "THEME_COMMIT": snapshot.commit,
            }
            deck_values = values
            if fmt == "html":
                # Footer fields go into HTML attributes; other fields into element text.
                deck_values = {key: html.escape(value, quote=True) if key.startswith("FOOT_") else value
                               for key, value in values.items()}

            output.mkdir(parents=True, exist_ok=True)
            install_theme(snapshot, output, fmt)
            folders = ["paper-source", "figures", "data", "rendered"]
            if fmt == "beamer":
                folders.append("build")
            for name in folders:
                (output / name).mkdir()
            (output / DECK_FILES[fmt]).write_text(
                materialize(main_template, {**deck_values, "FORMAT": fmt}), encoding="utf-8"
            )
            (output / "SOURCES.md").write_text(
                materialize(SOURCES, {**values, "FORMAT": fmt}), encoding="utf-8"
            )
            print(f"Created MBZUAI {fmt} paper-talk project: {output / DECK_FILES[fmt]}")
            print(f"Theme: {snapshot.requested_ref} @ {snapshot.commit}")
            print(f"Footer: {foot_left} | {foot_center} | {foot_right}")
    except (OSError, RuntimeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
