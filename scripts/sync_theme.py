#!/usr/bin/env python3
"""Refresh theme-owned files in an existing paper-slide project."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from theme_source import DEFAULT_THEME_REF, DEFAULT_THEME_REPO, install_theme, resolve_theme


def main() -> int:
    cli = argparse.ArgumentParser(
        description="Refresh MBZUAI theme files without changing paper-specific main.tex."
    )
    cli.add_argument("project", type=Path, help="existing slide project directory")
    cli.add_argument("--theme-repo", default=DEFAULT_THEME_REPO)
    cli.add_argument("--theme-ref", default=DEFAULT_THEME_REF)
    cli.add_argument("--theme-dir", type=Path, help="use an existing local theme checkout")
    cli.add_argument("--yes", action="store_true", help="confirm overwriting theme-owned files")
    args = cli.parse_args()

    project = args.project.expanduser().resolve()
    if not (project / "main.tex").is_file():
        print(f"error: existing project main.tex not found: {project}", file=sys.stderr)
        return 2
    if not args.yes:
        print("error: pass --yes after confirming the theme update", file=sys.stderr)
        return 2

    try:
        with resolve_theme(
            repository=args.theme_repo,
            ref=args.theme_ref,
            local_directory=args.theme_dir,
        ) as snapshot:
            install_theme(snapshot, project)
            print(f"Theme updated to {snapshot.commit}")
            print(f"Source: {snapshot.source} ({snapshot.requested_ref})")
            print("Paper-specific main.tex and figures were not changed.")
    except RuntimeError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
