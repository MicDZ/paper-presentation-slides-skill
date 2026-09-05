#!/usr/bin/env python3
"""Fetch, validate, and install the MBZUAI Beamer theme."""

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
TEMPLATE_PATH = Path("templates/paper-presentation.tex.in")
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


def validate_theme(path: Path) -> None:
    required = [
        *(path / name for name in THEME_FILES),
        path / "assets",
        path / "LICENSE",
        path / "README.md",
        path / TEMPLATE_PATH,
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


@contextlib.contextmanager
def resolve_theme(
    *,
    repository: str = DEFAULT_THEME_REPO,
    ref: str = DEFAULT_THEME_REF,
    local_directory: Path | None = None,
) -> Iterator[ThemeSnapshot]:
    """Yield a validated local theme snapshot and clean temporary downloads."""

    if local_directory is not None:
        path = local_directory.expanduser().resolve()
        validate_theme(path)
        commit = _git_value(path, "rev-parse", "HEAD") or "unversioned"
        origin = _git_value(path, "config", "--get", "remote.origin.url")
        source = origin or "local directory"
        yield ThemeSnapshot(path, source, "local checkout", commit)
        return

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


def install_theme(snapshot: ThemeSnapshot, project: Path) -> None:
    """Install or refresh only theme-owned files in a slide project."""

    manifest_path = project / MANIFEST_FILE
    if manifest_path.is_file():
        for value in manifest_path.read_text(encoding="utf-8").splitlines():
            relative = Path(value)
            if not value or relative.is_absolute() or ".." in relative.parts:
                raise RuntimeError(f"invalid prior theme-manifest entry: {value!r}")
            target = project / relative
            if target.is_file() or target.is_symlink():
                target.unlink()

    installed: list[str] = []
    for name in THEME_FILES:
        shutil.copy2(snapshot.path / name, project / name)
        installed.append(name)

    for source in sorted((snapshot.path / "assets").rglob("*")):
        relative_asset = source.relative_to(snapshot.path / "assets")
        if "slides" in relative_asset.parts or not source.is_file():
            continue
        destination = project / "assets" / relative_asset
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        installed.append((Path("assets") / relative_asset).as_posix())

    shutil.copy2(snapshot.path / "LICENSE", project / "THEME_LICENSE")
    shutil.copy2(snapshot.path / "README.md", project / "THEME_README.md")
    installed.extend(("THEME_LICENSE", "THEME_README.md"))

    retrieved = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    provenance = f"""# MBZUAI Beamer theme provenance

- Repository/source: {snapshot.source}
- Requested ref: `{snapshot.requested_ref}`
- Resolved commit: `{snapshot.commit}`
- Retrieved: {retrieved}
- License: MIT; see `THEME_LICENSE`
"""
    (project / "THEME_UPSTREAM.md").write_text(provenance, encoding="utf-8")
    manifest_path.write_text("\n".join(installed) + "\n", encoding="utf-8")
