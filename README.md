# Paper Presentation Slides Skill

A Codex skill for turning an assigned research paper into a source-grounded, editable, and visually verified LaTeX Beamer presentation.

The skill uses the separately maintained [MBZUAI Beamer Theme](https://github.com/MicDZ/MBZUAI_Beamer_Theme) and codifies a research-talk workflow developed from RCL reading-group decks. It emphasizes argument structure, evidence provenance, complete mathematical notation, honest interpretation of experiments, and rendered-slide QA.

## What it does

- Builds a talk around the paper's question, thesis, method logic, decisive evidence, limitations, and takeaways.
- Uses assertion-style frame titles and checks visual weight rather than relying on fixed column layouts.
- Requires displayed equations to include operational meaning and a complete symbol/type/index/role audit.
- Records paper versions, figures, tables, repositories, transformations, licenses, and derived values in `SOURCES.md`.
- Requires the presenter name and all three footer fields to be explicitly confirmed.
- Compiles with shell escape disabled, rejects unresolved citations/references, retains logs, and renders every page for visual inspection.
- Supports multi-paper reading-group talks through an optional session-level narrative guide.
- Fetches the current upstream theme/template for new projects, records the resolved commit, and can refresh theme-owned files in existing projects.

This skill does **not** depend on browser automation or Zotero. A host agent may use its available source-retrieval tools when the task requires online evidence.

## Install

Clone the repository into the Codex skills directory using the skill's declared name:

```bash
git clone https://github.com/MicDZ/paper-presentation-slides-skill.git \
  ~/.codex/skills/paper-presentation-slides
```

Restart or reload Codex so it discovers the new skill.

## Use

Invoke it explicitly:

```text
Use $paper-presentation-slides to turn this assigned paper into a 20-minute reading-group talk.
```

The skill will ask for the exact presenter display name and footer wording before finalizing metadata.

To initialize a project manually:

```bash
python3 scripts/new_slide_project.py ./example-paper-slides \
  --title "Paper title" \
  --short-title "Short title" \
  --authors "First Author et al." \
  --presenter "Confirmed presenter" \
  --confirm-default-footer
```

To compile and render it:

```bash
python3 scripts/build_slide_project.py ./example-paper-slides
```

To update an existing project's theme without changing its `main.tex` or paper figures:

```bash
python3 scripts/sync_theme.py ./example-paper-slides --yes
python3 scripts/build_slide_project.py ./example-paper-slides
```

New projects follow the theme repository's `main` branch by default. Use `--theme-ref <tag-or-commit>` for a pinned version, or `--theme-dir <local-checkout>` for offline work and testing unpublished theme changes. Every generated project records the resolved commit in `THEME_UPSTREAM.md` and `SOURCES.md`; `THEME_MANIFEST.txt` lets later refreshes remove obsolete theme-owned files without deleting paper or custom assets.

Use `--footer "Left" "Center" "Right"` instead of `--confirm-default-footer` when custom footer text has been confirmed.

## Requirements

- Python 3.9 or later; the scripts use only the standard library.
- Git and network access to fetch the default theme, unless `--theme-dir` supplies a local checkout.
- A TeX distribution providing `pdflatex`, `latexmk`, Beamer, TikZ, AMS math packages, `booktabs`, `multirow`, `array`, `adjustbox`, and `pifont`.
- Poppler's `pdftoppm` for rendered-slide inspection.

## Repository layout

```text
SKILL.md                       Skill entrypoint
agents/openai.yaml             Codex UI metadata
references/design-guide.md     Evidence-driven frame and layout patterns
references/formula-notation.md Complete formula-notation requirements
references/multi-paper-talks.md Multi-paper session guidance
references/workflow.md         Source, build, and visual-QA workflow
scripts/new_slide_project.py   Reproducible project initializer
scripts/build_slide_project.py Safe compiler and page renderer
scripts/sync_theme.py          Existing-project theme updater
scripts/theme_source.py        Theme fetch/validation/install helper
```

## Licensing

The skill instructions and scripts are released under the [MIT License](LICENSE).

The MBZUAI Beamer theme is maintained and licensed separately. Generated projects preserve its MIT license and resolved-source provenance. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Names, logos, and brand assets may also be subject to their owners' trademark or brand-usage rules.
