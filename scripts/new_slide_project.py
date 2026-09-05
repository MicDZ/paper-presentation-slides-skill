#!/usr/bin/env python3
"""Create a reproducible paper-talk project from the upstream MBZUAI theme."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from theme_source import (
    DEFAULT_THEME_REF,
    DEFAULT_THEME_REPO,
    TEMPLATE_PATH,
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

- Repository/source: @@THEME_SOURCE@@
- Requested ref: `@@THEME_REF@@`
- Resolved commit: `@@THEME_COMMIT@@`
- License: MIT; see `THEME_LICENSE`
- Local provenance: `THEME_UPSTREAM.md`

## Scope of interpretation

Separate paper-reported claims, derived values, and presenter synthesis. Record unresolved version, source, or reproducibility limitations.
"""


def materialize(template: str, values: dict[str, str]) -> str:
    result = template
    for key, value in values.items():
        result = result.replace(f"@@{key}@@", value)
    return result


def main() -> int:
    cli = argparse.ArgumentParser(
        description="Create an MBZUAI Beamer project for one paper presentation."
    )
    cli.add_argument("output", type=Path, help="new project directory")
    cli.add_argument("--title", default="Paper title", help="full LaTeX-safe paper title")
    cli.add_argument("--short-title", help="short title for headers and footers")
    cli.add_argument("--subtitle", default="Research paper presentation")
    cli.add_argument("--authors", default="Paper authors")
    cli.add_argument(
        "--presenter",
        required=True,
        help="presenter display name confirmed by the user",
    )
    cli.add_argument("--venue", default="RCL Reading Group")
    cli.add_argument("--date", default=r"\today", help="LaTeX-safe date/version line")
    cli.add_argument("--retrieved", default="YYYY-MM-DD")
    footer = cli.add_mutually_exclusive_group(required=True)
    footer.add_argument(
        "--confirm-default-footer",
        action="store_true",
        help="use confirmed short-title / session-by-presenter / slide-count footer",
    )
    footer.add_argument(
        "--footer",
        nargs=3,
        metavar=("LEFT", "CENTER", "RIGHT"),
        help="three LaTeX-safe footer fields confirmed by the user",
    )
    cli.add_argument(
        "--theme-repo",
        default=DEFAULT_THEME_REPO,
        help="MBZUAI theme Git repository",
    )
    cli.add_argument(
        "--theme-ref",
        default=DEFAULT_THEME_REF,
        help="theme branch, tag, or reachable commit; defaults to main",
    )
    cli.add_argument(
        "--theme-dir",
        type=Path,
        help="use a local theme checkout instead of fetching the repository",
    )
    args = cli.parse_args()

    output = args.output.expanduser().resolve()
    if output.exists() and (not output.is_dir() or any(output.iterdir())):
        print(f"error: output directory is not empty: {output}", file=sys.stderr)
        return 2

    short_title = args.short_title or args.title
    if args.confirm_default_footer:
        foot_left = short_title
        foot_center = rf"RCL Reading Group by \textit{{{args.presenter}}}"
        foot_right = r"\insertframenumber{} / \inserttotalframenumber"
    else:
        foot_left, foot_center, foot_right = args.footer

    try:
        with resolve_theme(
            repository=args.theme_repo,
            ref=args.theme_ref,
            local_directory=args.theme_dir,
        ) as snapshot:
            main_template = (snapshot.path / TEMPLATE_PATH).read_text(encoding="utf-8")
            values = {
                "TITLE": args.title,
                "SHORT_TITLE": short_title,
                "SUBTITLE": args.subtitle,
                "AUTHORS": args.authors,
                "PRESENTER": args.presenter,
                "VENUE": args.venue,
                "DATE": args.date,
                "RETRIEVED": args.retrieved,
                "FOOT_LEFT": foot_left,
                "FOOT_CENTER": foot_center,
                "FOOT_RIGHT": foot_right,
                "THEME_SOURCE": snapshot.source,
                "THEME_REF": snapshot.requested_ref,
                "THEME_COMMIT": snapshot.commit,
            }

            output.mkdir(parents=True, exist_ok=True)
            install_theme(snapshot, output)
            for name in ("paper-source", "figures", "data", "build", "rendered"):
                (output / name).mkdir()
            (output / "main.tex").write_text(
                materialize(main_template, values), encoding="utf-8"
            )
            (output / "SOURCES.md").write_text(
                materialize(SOURCES, values), encoding="utf-8"
            )
            print(f"Created MBZUAI Beamer paper-talk project: {output}")
            print(f"Theme commit: {snapshot.commit}")
    except (OSError, RuntimeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
