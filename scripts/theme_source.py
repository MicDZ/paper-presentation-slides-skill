#!/usr/bin/env python3
"""Fetch, validate, and install the MBZUAI theme (HTML or Beamer)."""

from __future__ import annotations

import contextlib
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator


DEFAULT_THEME_REPO = "https://github.com/MicDZ/MBZUAI_Beamer_Theme.git"
DEFAULT_THEME_REF = "main"
# The skill repository tracks the theme as a Git submodule at this path.
BUNDLED_THEME_DIR = Path(__file__).resolve().parent.parent / "theme"
FORMATS = ("html", "beamer")
TEMPLATES = {
    "html": Path("templates/paper-presentation.html.in"),
    "beamer": Path("templates/paper-presentation.tex.in"),
}
DECK_FILES = {"html": "deck.html", "beamer": "main.tex"}
HTML_THEME_DIR = Path("html")  # copied to <project>/theme/
HTML_THEME_FILES = ("mbzuai-slides.css", "mbzuai-slides.js", "AUTHORING.md", "tools/check.sh")
THEME_FILES = (
    "beamerthemeMBZUAI.sty",
    "beamercolorthemeMBZUAI.sty",
    "beamerfontthemeMBZUAI.sty",
    "beamerinnerthemeMBZUAI.sty",
    "beamerouterthemeMBZUAI.sty",
)
MANIFEST_FILE = "THEME_MANIFEST.txt"


@dataclass(frozen=True)
class ThemeSnapshot:
    path: Path
    source: str
    requested_ref: str
    commit: str


def _run(command: list[str], *, cwd: Path | None = None) -> str:
    result = subprocess.run(
        command,
        cwd=cwd,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )
    if result.returncode:
        joined = " ".join(command)
        raise RuntimeError(f"command failed ({joined}):\n{result.stdout}")
    return result.stdout.strip()


def detect_format(project: Path) -> str | None:
    """Return the deck format of an existing project, or None."""

    for fmt in FORMATS:
        if (project / DECK_FILES[fmt]).is_file():
            return fmt
    return None


def validate_theme(path: Path) -> None:
    required = [
        *(path / name for name in THEME_FILES),
        *(path / HTML_THEME_DIR / name for name in HTML_THEME_FILES),
        path / "assets",
        path / "LICENSE",
        path / "README.md",
        *(path / template for template in TEMPLATES.values()),
    ]
    missing = [str(item) for item in required if not item.exists()]
    if missing:
        raise RuntimeError("theme source is incomplete: " + ", ".join(missing))
    symlinks = [str(item) for item in path.rglob("*") if item.is_symlink()]
    if symlinks:
        raise RuntimeError("theme source contains unsupported symlinks: " + ", ".join(symlinks))


def _git_value(path: Path, *arguments: str) -> str | None:
    git = shutil.which("git")
    if not git:
        return None
    result = subprocess.run(
        [git, "-C", str(path), *arguments],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    value = result.stdout.strip()
    return value if result.returncode == 0 and value else None


def bundled_theme_available() -> bool:
    """Return True when the theme submodule is checked out and complete."""

    try:
        validate_theme(BUNDLED_THEME_DIR)
    except RuntimeError:
        return False
    return True


def _local_snapshot(path: Path, requested: str) -> ThemeSnapshot:
    path = path.expanduser().resolve()
    validate_theme(path)
    commit = _git_value(path, "rev-parse", "HEAD") or "unversioned"
    if commit != "unversioned" and _git_value(path, "status", "--porcelain"):
        commit += " (with uncommitted local changes)"
    origin = _git_value(path, "config", "--get", "remote.origin.url")
    # Never record an absolute local path: provenance must stay portable.
    source = origin or "local directory"
    return ThemeSnapshot(path, source, requested, commit)


@contextlib.contextmanager
def resolve_theme(
    *,
    repository: str = DEFAULT_THEME_REPO,
    ref: str | None = None,
    local_directory: Path | None = None,
    remote: bool = False,
) -> Iterator[ThemeSnapshot]:
    """Yield a validated local theme snapshot and clean temporary downloads.

    Resolution order: an explicit ``local_directory``; a remote fetch when
    ``remote`` is set or a ``ref`` is requested; the bundled ``theme/``
    submodule; finally a remote fetch of the default branch when the submodule
    has not been initialized.
    """

    if local_directory is not None:
        yield _local_snapshot(local_directory, "local checkout")
        return

    if not remote and ref is None and bundled_theme_available():
        yield _local_snapshot(BUNDLED_THEME_DIR, "bundled submodule")
        return

    ref = ref or DEFAULT_THEME_REF

    git = shutil.which("git")
    if not git:
        raise RuntimeError("git is required to fetch the MBZUAI Beamer theme")

    with tempfile.TemporaryDirectory(prefix="mbzuai-beamer-theme-") as temporary:
        path = Path(temporary)
        _run([git, "init", "--quiet", str(path)])
        _run([git, "-C", str(path), "remote", "add", "origin", repository])
        _run([git, "-C", str(path), "fetch", "--quiet", "--depth", "1", "origin", ref])
        _run([git, "-C", str(path), "checkout", "--quiet", "--detach", "FETCH_HEAD"])
        validate_theme(path)
        commit = _run([git, "-C", str(path), "rev-parse", "HEAD"])
        yield ThemeSnapshot(path, repository, ref, commit)


def _install_html(snapshot: ThemeSnapshot, project: Path) -> list[str]:
    installed = []
    source_root = snapshot.path / HTML_THEME_DIR
    for source in sorted(source_root.rglob("*")):
        if not source.is_file():
            continue
        relative = Path("theme") / source.relative_to(source_root)
        destination = project / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        installed.append(relative.as_posix())
    return installed


def _install_beamer(snapshot: ThemeSnapshot, project: Path) -> list[str]:
    installed: list[str] = []
    for name in THEME_FILES:
        shutil.copy2(snapshot.path / name, project / name)
        installed.append(name)

    for source in sorted((snapshot.path / "assets").rglob("*")):
        relative_asset = source.relative_to(snapshot.path / "assets")
        # Skip demo screenshots (assets/slides, assets/slides-html).
        if relative_asset.parts[0].startswith("slides") or not source.is_file():
            continue
        destination = project / "assets" / relative_asset
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        installed.append((Path("assets") / relative_asset).as_posix())
    return installed


def install_theme(snapshot: ThemeSnapshot, project: Path, fmt: str = "html") -> None:
    """Install or refresh only theme-owned files in a slide project."""

    if fmt not in FORMATS:
        raise RuntimeError(f"unknown deck format: {fmt}")

    manifest_path = project / MANIFEST_FILE
    if manifest_path.is_file():
        for value in manifest_path.read_text(encoding="utf-8").splitlines():
            relative = Path(value)
            if not value or relative.is_absolute() or ".." in relative.parts:
                raise RuntimeError(f"invalid prior theme-manifest entry: {value!r}")
            target = project / relative
            if target.is_file() or target.is_symlink():
                target.unlink()

    installed = _install_html(snapshot, project) if fmt == "html" else _install_beamer(
        snapshot, project
    )

    shutil.copy2(snapshot.path / "LICENSE", project / "THEME_LICENSE")
    shutil.copy2(snapshot.path / "README.md", project / "THEME_README.md")
    installed.extend(("THEME_LICENSE", "THEME_README.md"))

    retrieved = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    provenance = f"""# MBZUAI theme provenance

- Repository/source: {snapshot.source}
- Requested ref: `{snapshot.requested_ref}`
- Resolved commit: `{snapshot.commit}`
- Retrieved: {retrieved}
- Deck format: {fmt}
- License: MIT; see `THEME_LICENSE`
"""
    (project / "THEME_UPSTREAM.md").write_text(provenance, encoding="utf-8")
    manifest_path.write_text("\n".join(installed) + "\n", encoding="utf-8")
