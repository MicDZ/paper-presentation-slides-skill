#!/usr/bin/env python3
"""Refresh theme-owned files in an existing paper-slide project."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from theme_source import DECK_FILES, DEFAULT_THEME_REPO, detect_format, install_theme, resolve_theme


def main() -> int:
    cli = argparse.ArgumentParser(
        description="Refresh MBZUAI theme files without changing the paper-specific deck."
    )
    cli.add_argument("project", type=Path, help="existing slide project directory")
    cli.add_argument("--theme-repo", default=DEFAULT_THEME_REPO)
    cli.add_argument(
        "--theme-ref",
        help="fetch this branch, tag, or commit instead of using the bundled submodule",
    )
    cli.add_argument(
        "--theme-remote",
        action="store_true",
        help="fetch the latest default branch instead of using the bundled submodule",
    )
    cli.add_argument("--theme-dir", type=Path, help="use an existing local theme checkout")
    cli.add_argument("--yes", action="store_true", help="confirm overwriting theme-owned files")
    args = cli.parse_args()

    project = args.project.expanduser().resolve()
    fmt = detect_format(project)
    if fmt is None:
        names = " or ".join(DECK_FILES.values())
        print(f"error: no {names} found in existing project: {project}", file=sys.stderr)
        return 2
    if not args.yes:
        print("error: pass --yes after confirming the theme update", file=sys.stderr)
        return 2

    try:
        with resolve_theme(
            repository=args.theme_repo,
            ref=args.theme_ref,
            local_directory=args.theme_dir,
            remote=args.theme_remote or args.theme_repo != DEFAULT_THEME_REPO,
        ) as snapshot:
            install_theme(snapshot, project, fmt)
            print(f"Theme updated to {snapshot.commit}")
            print(f"Source: {snapshot.source} ({snapshot.requested_ref})")
            print(f"Paper-specific {DECK_FILES[fmt]} and figures were not changed.")
    except RuntimeError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
