# Paper Presentation Slides Skill

An agent skill for turning an assigned research paper into a source-grounded, editable, and visually verified presentation: an HTML slide deck (recommended) or LaTeX Beamer. It follows the open `SKILL.md` format and works with Claude Code, Codex, and other agents that load skills from a directory.

The skill includes the separately maintained [MBZUAI Beamer Theme](https://github.com/MicDZ/MBZUAI_Beamer_Theme) as a Git submodule and codifies a research-talk workflow developed from reading-group decks and reviewers' edits to them. It emphasizes visual-first slides that follow the method's data flow, evidence provenance, complete result tables, explicit on-slide notation, and rendered-slide QA.

## HTML or Beamer?

The skill recommends the **HTML theme**: one `deck.html` with KaTeX math, automatic equation/figure numbering, BibTeX citations, a headless-Chrome QA report, and PDF export. It also shows a symbol's meaning when you hover over it in a formula. That hover is only an aid for Q&A; every symbol is still defined on the slide where it first appears. Choose **Beamer** (`--format beamer`) for a LaTeX deck, or when Chrome/Chromium or the KaTeX CDN is unavailable.

## What it does

- Builds a talk around the paper's question, thesis, method data flow, decisive evidence, limitations, and takeaways, with one visual anchor per slide.
- Shows the architecture once, then a focus crop per stage (`\focuscrop` in the template), and explains modules by purpose rather than by restating equations.
- Asks the user before adding background slides. Defines every formula symbol on the slide where it first appears; the complete formula audit goes into `SOURCES.md`, and HTML decks get a hover glossary for Q&A.
- Reproduces result tables completely and checks that every claim title is supported by evidence on the same slide.
- Records paper versions, figures, tables, repositories, transformations, licenses, and derived values in `SOURCES.md`.
- Requires the presenter name and all three footer fields to be confirmed, directly or through a shared `talk-context.md`.
- Builds with the theme's QA checks (HTML) or with shell escape disabled (Beamer), rejects unresolved citations/references, reports overflows by slide number, and renders every page plus a numbered contact sheet.
- Supports multi-paper reading-group talks through an optional session-level narrative guide.

This skill does **not** depend on browser automation or Zotero. A host agent may use its available source-retrieval tools when the task requires online evidence.

## Install

Clone with submodules into your agent's skills directory, using the skill's declared name:

```bash
# Claude Code (personal skills; use .claude/skills/ inside a repository for project skills)
git clone --recurse-submodules https://github.com/MicDZ/paper-presentation-slides-skill.git \
  ~/.claude/skills/paper-presentation-slides

# Codex
git clone --recurse-submodules https://github.com/MicDZ/paper-presentation-slides-skill.git \
  ~/.codex/skills/paper-presentation-slides
```

For other agents, clone it wherever they discover skills. Restart or reload the agent so it finds the new skill.

If you cloned without `--recurse-submodules`, run `git submodule update --init` in the skill directory. Without the submodule the scripts still work by fetching the theme from GitHub.

### Update

```bash
cd <skill-dir>
git pull --recurse-submodules     # skill plus the theme commit it pins
git submodule update --remote theme   # optionally move the theme to its latest main
```

The `theme/` submodule tracks the theme repository's `main` branch. In the skill repository, commit the new submodule pointer after `--remote` to share the update.

## Use

Ask for it by name or describe the task:

```text
Claude Code:  /paper-presentation-slides turn arXiv:2609.04958v2 into a 20-minute reading-group talk
Codex:        Use $paper-presentation-slides to turn this assigned paper into a 20-minute reading-group talk.
Any agent:    Make reading-group slides for this paper with the paper-presentation-slides skill.
```

The skill asks for the presenter display name and footer wording (unless a `talk-context.md` provides them), recommends the HTML format, and asks about the audience and which background slides to include.

### Shared context for several decks

Put a `talk-context.md` in a directory above your decks to share presenter, venue, footer, audience, and group preferences. Explicit instructions and command-line flags take precedence over it. See [references/project-context.md](references/project-context.md).

### Scripts

To initialize a project manually:

```bash
python3 scripts/new_slide_project.py ./example-paper-slides \
  --title "Paper title" \
  --short-title "Short title" \
  --authors "First Author et al." \
  --presenter "Confirmed presenter" \
  --confirm-default-footer
```

This creates `deck.html` with the HTML theme in `theme/`; add `--format beamer` for `main.tex`. Use `--footer "Left" "Center" "Right"` instead of `--confirm-default-footer` when custom footer text has been confirmed (HTML for HTML decks, LaTeX for Beamer). The default footer is `short title | Session by Presenter | n / N`.

To build (QA report or LaTeX compile), export/copy the PDF, render each slide, and write a numbered contact sheet:

```bash
python3 scripts/build_slide_project.py ./example-paper-slides
```

To update an existing project's theme without changing its deck file or paper figures:

```bash
python3 scripts/sync_theme.py ./example-paper-slides --yes
python3 scripts/build_slide_project.py ./example-paper-slides
```

New projects use the bundled `theme/` submodule. Use `--theme-remote` for the latest theme `main`, `--theme-ref <tag-or-commit>` for a pinned version, or `--theme-dir <local-checkout>` for unpublished theme changes. Every generated project records the resolved commit in `THEME_UPSTREAM.md` and `SOURCES.md`; `THEME_MANIFEST.txt` lets later refreshes remove obsolete theme-owned files without deleting paper or custom assets.

## Requirements

- Python 3.9 or later; the scripts use only the standard library.
- Git. Network access is needed only to clone or update the skill and its theme submodule, or for `--theme-remote`/`--theme-ref`.
- HTML decks: Chrome, Chromium, or Edge (set `CHROME=/path` to override), and network access to the KaTeX CDN when building.
- Beamer decks: a TeX distribution providing `pdflatex`, `latexmk`, Beamer, TikZ, AMS math packages, `booktabs`, `multirow`, `array`, `adjustbox`, and `pifont`.
- Poppler's `pdftoppm` for rendered slides and the contact sheet, and `pdftotext` for the Beamer missing-title check (optional).

## Repository layout

```text
SKILL.md                       Skill entrypoint
agents/openai.yaml             Codex UI metadata (optional for other agents)
theme/                         MBZUAI Beamer Theme (Git submodule, tracks main)
references/design-guide.md     Evidence-driven frame and layout patterns
references/formula-notation.md Complete formula-notation requirements
references/multi-paper-talks.md Multi-paper session guidance
references/project-context.md  Shared talk-context.md format and precedence
references/workflow.md         Source, build, and visual-QA workflow
scripts/new_slide_project.py   Reproducible project initializer (HTML or Beamer)
scripts/build_slide_project.py QA/compile, PDF, renderer, contact sheet, overflow report
scripts/sync_theme.py          Existing-project theme updater
scripts/theme_source.py        Theme fetch/validation/install helper
```

## Licensing

The skill instructions and scripts are released under the [MIT License](LICENSE).

The MBZUAI Beamer theme is maintained and licensed separately and is included as a submodule, not vendored. Generated projects preserve its MIT license and resolved-source provenance. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Names, logos, and brand assets may also be subject to their owners' trademark or brand-usage rules.
