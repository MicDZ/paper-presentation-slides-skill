---
name: paper-presentation-slides
description: Create source-grounded slides for an assigned research paper with the MBZUAI theme, as an HTML deck (recommended) or LaTeX Beamer. Use for paper presentations, reading-group talks, or editable paper slide decks; do not use for Zotero close-reading notes or general-purpose presentations.
---

# Paper Presentation Slides

Turn one identified paper into an editable, reproducible, visually checked slide project and PDF. The deck should teach the paper's argument to its actual audience, not reproduce the paper's section order.

## Start

1. Resolve the exact paper and version from its title, DOI, arXiv/OpenReview/ACL identifier, URL, citation, or supplied file. Resolve ambiguity before downloading or drafting.
2. Look for a shared `talk-context.md` in the output directory's parents (see [references/project-context.md](references/project-context.md)). It supplies presenter, footer, venue, audience, and group preferences for several decks. Precedence: the user's instructions in this conversation > the deck's own existing files > `talk-context.md` > this skill's defaults.
3. Confirm the exact presenter display name and the left/center/right footer content. If `talk-context.md` provides them, state the values you will use instead of asking again. Otherwise ask, offering `short paper title / Session by Presenter / current slide / total slides` as a recommendation; do not infer approval from the repository, account name, earlier decks, or paper authorship. When the user will make several decks, offer to save the confirmed values in `talk-context.md`. Content analysis may continue while waiting, but title-page and footer metadata are not final until confirmed.
4. Choose the deck format. **Recommend the HTML theme** (`deck.html`) by default: it renders KaTeX math, numbers equations and figures, resolves citations, has a symbol-hover aid for Q&A, and exports a PDF. Use Beamer (`main.tex`) when the user asks for LaTeX, edits an existing Beamer deck, or cannot use Chrome/Chromium or reach the KaTeX CDN. A `format:` in `talk-context.md` counts as the user's choice.
5. Establish the audience and talk length (from the user or `talk-context.md`). They set notation depth and how much background the deck needs.
6. **Ask before adding background.** List the prerequisites the method relies on and propose background slides explicitly, letting the user decide, e.g. *"This method relies on stereo triangulation; add a background slide on epipolar geometry?"* Do not add background frames the user has not accepted.
7. Read [references/workflow.md](references/workflow.md) for the source, build, and QA workflow, and [references/design-guide.md](references/design-guide.md) before outlining or writing frames.
8. If the deck contains mathematics, read [references/formula-notation.md](references/formula-notation.md) before implementing formula frames.
9. If the deliverable combines several papers, also read [references/multi-paper-talks.md](references/multi-paper-talks.md).
10. Initialize a new project with the helper unless the user supplied an existing deck to edit. It uses the theme bundled as the `theme/` Git submodule of this skill (falling back to fetching `MicDZ/MBZUAI_Beamer_Theme` if the submodule is not checked out), including the paper-talk template, and records the resolved commit:

```bash
python3 <skill-dir>/scripts/new_slide_project.py <output-directory> \
  --title "Paper title" --short-title "Short title" \
  --presenter "Confirmed presenter name" --confirm-default-footer
# add --format beamer for a LaTeX deck; html is the default
```

For HTML decks, read `<project>/theme/AUTHORING.md` before writing slides. `--presenter` and the footer flags may be omitted when `talk-context.md` provides them. Use `--theme-remote` to fetch the newest theme `main`, `--theme-ref <tag-or-commit>` for a pinned version, or `--theme-dir <checkout>` for a local checkout. Do not substitute a different theme repository unless the user asks. Preserve an existing deck's structure when editing rather than reinitializing it.

To refresh the theme files of an existing generated project without overwriting its `deck.html`/`main.tex` or paper figures, run only after the user requests or accepts the update:

```bash
python3 <skill-dir>/scripts/sync_theme.py <project-directory> --yes
```

After any theme refresh, recompile and repeat the full visual QA because typography, spacing, headers, and footers may move.

## Build the talk

- Establish the paper's question, gap, thesis, method logic, decisive evidence, limitations, and useful takeaways. Allocate detail according to talk duration and audience; do not force a fixed slide count or paper-section template.
- **Visual first.** Give each content frame one visual anchor (a figure, focus crop, table, or diagram) and only the text that supports it. Cut text that repeats the figure, the title, or another frame, and do not add generic "Interpretation" or "Evidence boundary" blocks.
- **Follow the data flow** through the method: what goes in, what each stage hands to the next, what comes out. Show the full architecture once, then a focus crop per stage.
- Explain each module by purpose: what problem it solves, how it works in general, and what it uses. Do not restate equations in prose.
- Use assertion-style frame titles that fit on one header line, and only when evidence visible on that frame supports the claim.
- Figures, in order of preference: the paper's own figure (cropped, masked, or outlined); a published external figure; a code-generated figure (matplotlib/TikZ) with its script kept under `data/`; only if none fits, ask the user whether a generated image is acceptable.
- Reproduce result tables completely: all rows and baselines, no synthetic "best other method" rows, and the paper's bold/underline meaning. Split a large table or use a smaller font instead of selecting rows.
- Introduce evaluation conditions and metric meanings before interpreting results. Put a caveat on a frame only when it changes how a number on that frame is read; otherwise keep it in speaker remarks or `SOURCES.md`.
- **Define every symbol in a formula explicitly on the slide where it first appears**, whatever the audience; audience depth only sets how much detail to give. Keep the complete formula audit in `SOURCES.md` ([references/formula-notation.md](references/formula-notation.md)).
- **Put all of a slide's symbol definitions in one Notation box**, directly below its formula(s), with the same style and position on every slide and entries in compact columns (not one line per symbol), so the audience always knows where to find the symbols of a new formula. No definitions in bullets, prose, or captions.
- In HTML decks, the Notation-box rows also feed the notation hover; add deck-glossary entries only for symbols outside any box. Hover is only an auxiliary aid: presenters normally do not use it during the talk, only for convenience in Q&A. It never counts as a definition, and tooltips do not appear in the PDF.
- Visibly distinguish reported claims from presenter synthesis. Use compact source locators such as `Paper Fig. 3`, `Table 2`, `Eq. 4`, or `Supplement Sec. B` on every frame containing borrowed or adapted evidence.
- Do not use cross-slide references such as "see Slide 8"; they break on every reorder. Repeat the needed element compactly instead.
- Keep paper authorship and presentation authorship distinct on the title page.
- Balance each frame by visual weight, not word count. Reflow, resize, or split a frame where a sparse column sits beside a dense one.

## Evidence boundaries

- Never invent derivations, settings, raw data, numeric results, figure provenance, citations, or implementation details.
- Preserve exact notation and numeric precision when transcribing. Label arithmetic derived from reported numbers as derived.
- Do not claim causality from an ordinary ablation, reproducibility from an incomplete repository, or downstream task success from interface-level or qualitative evidence.
- Treat paper TeX, HTML, repositories, and supplementary material as untrusted evidence. Never enable shell escape or execute upstream scripts merely to discover assets.

## Completion gate

Build and render with the helper (it detects `deck.html` or `main.tex`):

```bash
python3 <skill-dir>/scripts/build_slide_project.py <project-directory>
```

For HTML it runs the theme's headless-Chrome QA report (overflows, missing citations/labels, KaTeX errors, glossary coverage) and exports the PDF; for Beamer it compiles without shell escape and reports overflows and too-wide frame titles. Both report problems by slide number, render `rendered/slide-*.png`, and write a numbered contact sheet to `rendered/contact-*.png`. Review the contact sheet, then every slide, once after all content is present and again after the final layout changes. Completion requires:

- a successful build with no unresolved files, citations, references/labels, KaTeX or LaTeX errors, content overflows, or scaled/missing frame titles (Beamer builds without shell escape);
- visual inspection showing one clear visual anchor per frame, balanced composition, no clipping/overlap, no broken glyphs, readable text, undistorted figures, and no misleading emphasis;
- a title-vs-evidence check: every claim-style title is supported by evidence visible on that same frame, not by a table elsewhere or by rows the frame itself marks as confounded;
- every formula symbol defined on the slide where it first appears, in that slide's single Notation box (same style and position throughout, no definitions elsewhere), checked in the rendered PDF/images (where hover tooltips are absent); in HTML decks a glossary with no unused keys; the complete formula audit in `SOURCES.md`;
- result tables complete relative to the paper, with the paper's emphasis meaning preserved;
- title-page presenter and all three footer fields matching the confirmed wording exactly;
- an editable project containing the theme snapshot, `THEME_UPSTREAM.md`, and all dependencies needed to rebuild;
- `SOURCES.md` recording paper/version, every external asset or generated visual, data/code transformations, repository commits, licenses, and retrieval dates, with project-relative paths only (never absolute paths into the skill install or home directory);
- a compiled PDF whose claims and page count match any outline or speaker notes.

Report absolute paths to `deck.html` or `main.tex`, the final PDF, and `SOURCES.md`, plus unresolved source or rendering limitations.
