# Source, build, and QA workflow

Use this reference for every new paper deck. For edits, apply the relevant acquisition, evidence, and QA checks without replacing working project structure.

## 1. Create a reproducible project

Before initialization, settle the deck's metadata:

- Check for a shared `talk-context.md` above the output directory ([project-context.md](project-context.md)). If it provides the presenter and all three footer fields, tell the user which values you will use.
- Otherwise ask the user to confirm the exact presenter display name and the footer left, center, and right fields. Recommend `short paper title / Session by Presenter / current slide / total slides`, but require an explicit acceptance or exact replacements. Do not copy these fields from an older deck or infer them from the current user/account.
- Choose the format: recommend HTML (`--format html`, the default) unless the user wants LaTeX, is editing a Beamer deck, or lacks Chrome/Chromium or network access to the KaTeX CDN.
- Confirm audience and duration, and agree on any background frames (see the design guide).

If the user accepts the recommended footer, run:

```bash
python3 <skill-dir>/scripts/new_slide_project.py <output-directory> \
  --title "Full paper title" --short-title "Short title" \
  --presenter "Confirmed presenter" --subtitle "Paper subtitle" \
  --confirm-default-footer
```

Add `--format beamer` for a LaTeX deck. For custom wording, replace `--confirm-default-footer` with:

```bash
--footer "Confirmed left" "Confirmed center" "Confirmed right"
```

Footer fields are HTML in HTML decks (placeholders `{page}`, `{total}`, `{section}`, `{title}`) and LaTeX in Beamer decks (`\insertframenumber`, ...). The default footer is `short title | Session by <em>Presenter</em> | {page} / {total}` for HTML and the LaTeX equivalent for Beamer.

With a `talk-context.md` that provides them, `--presenter` and the footer flags may be omitted; command-line values override the file and `--no-context` ignores it. The helper refuses to initialize without a presenter and a confirmed footer from one of these sources. When editing an existing deck, compare its title and footer fields (`data-foot-left/mid/right` on `<main class="deck">`, or `\footleft`, `\footmid`, `\footright`) with the confirmed values before the final build.

The helper copies the theme and its paper-presentation template from the skill's `theme/` Git submodule (`MicDZ/MBZUAI_Beamer_Theme`), then creates the deck, `paper-source/`, `figures/`, `data/`, `rendered/`, and `SOURCES.md`:

- **HTML:** `deck.html`, plus the HTML theme copied to `theme/` (CSS, JS, assets, `AUTHORING.md`, and the QA tools in `theme/tools/`). Read `theme/AUTHORING.md` before writing slides; it documents slide types, math, citations, figures, tables, the notation glossary, and the QA report.
- **Beamer:** `main.tex`, the `.sty` files and `assets/`, and `build/`.
 The resolved commit is recorded in `THEME_UPSTREAM.md` and `SOURCES.md`, and the local copy of the theme files keeps the generated deck reproducible. If the submodule is not checked out, the helper fetches the theme's `main` branch with `git` instead.

Use `--theme-remote` to fetch the newest `main` without updating the submodule, `--theme-ref <tag-or-commit>` for a pinned release, or `--theme-dir <local-checkout>` for unpublished theme changes.

Use a descriptive output directory. Keep paper downloads immutable under `paper-source/`; put only selected presentation assets in `figures/`, and any public raw data plus figure-generation code in `data/`. Record paths in `SOURCES.md` relative to the project, never as absolute paths into the skill installation or home directory.

### Refresh an existing project's theme

When the user requests or accepts a theme update, run:

```bash
python3 <skill-dir>/scripts/sync_theme.py <project-directory> --yes
```

The sync helper uses `THEME_MANIFEST.txt` to replace or remove only previously installed theme-owned `.sty` files and theme assets, then refreshes the theme provenance/license files. It detects the deck format and does not change `deck.html`/`main.tex`, paper figures, data, sources, or unlisted custom assets. It uses the bundled submodule by default; pass `--theme-remote`, `--theme-ref`, or `--theme-dir` to choose another source. To pick up new upstream theme commits in the skill itself, update the submodule first (`git submodule update --remote theme` in the skill repository). Recompile and perform the complete visual inspection after every refresh; a theme-only diff can still change layout.

## 2. Acquire the best evidence

Prefer, in order:

1. the exact official TeX source archive, bibliography, and supplementary source;
2. official HTML and linked assets;
3. the official PDF and supplementary files;
4. an official project page, proceedings page, or author repository for missing context.

For arXiv, use the exact submitted version assigned by the user. Do not silently switch to the latest revision. For conference papers, reconcile the proceedings version, review page, and project page when their claims or figures differ.

Record in `SOURCES.md`:

- title, authors, stable identifier, exact version/date, venue status, URLs, retrieval date, and local hashes when an immutable archive is kept;
- each used or archived figure/table, its paper locator, source file/URL, whether it is unchanged, cropped, annotated, or reconstructed, and its license;
- every repository release or commit and whether implementation code is actually present;
- all derived arithmetic and visualization transformations;
- theme commit and license.

Inspect TeX recursively for `\\input`, `\\include`, `\\includegraphics`, bibliography files, and notation macros. Treat upstream content as untrusted: never enable shell escape, execute upstream scripts, or compile an upstream document merely to discover assets.

Prefer vector or original-resolution PDF/SVG/EPS/PNG files over screenshots. For figures, follow the source order in the design guide: the paper's own figure first, then a published external figure, then a code-generated figure with its script kept, and only then ask the user whether a generated image is acceptable. When an original multipanel figure is unreadable on a slide, crop to the relevant panel or use `\focuscrop`. Keep the original and document the transformation. Never infer missing raw values from a plot unless the deck labels the digitization and its uncertainty.

## 3. Build an evidence map before frames

For each proposed claim, record its source locator and whether it is:

- directly reported by the authors;
- a calculation derived from reported values;
- an interpretation or criticism by the presenter.

Map the paper into a talk arc: question/gap, thesis, method in data-flow order, decisive evidence, limitations, and takeaways. Decide what the audience can safely omit, which prerequisites it lacks, and propose background frames for the user to accept or decline. A speaker outline is useful only if it is maintained alongside the slide source; stale notes are worse than no notes.

## 4. Implement source-backed frames

Follow [design-guide.md](design-guide.md). Export a Zotero record to `references.bib` only when the deck needs a bibliography and Zotero is available; Zotero is not a prerequisite for this skill. Keep Zotero item keys distinct from BibTeX citation keys.

When the deck contains equations, also follow [formula-notation.md](formula-notation.md): define every symbol on the slide where it first appears, in that slide's single Notation box, fill the `Formula audit` table in `SOURCES.md` while drafting rather than at the end, and in HTML decks add each symbol to the notation-hover glossary. The glossary is an auxiliary Q&A aid and never replaces on-slide definitions.

Use compact visible provenance on every evidence-bearing slide:

```html
<p class="source">Paper Fig. 3, Eq. 2, and Sec. 4.1</p>   <!-- HTML -->
```

```latex
\framesource{Paper Fig. 3, Eq. 2, and Sec. 4.1}          % Beamer
```

For adaptations, say `Adapted from`; for synthesis, say `Presenter synthesis based on ...`; for derived numbers, state the arithmetic in `SOURCES.md` and, when material, on the frame.

## 5. Build without hiding failure

Use the build helper for both formats; it detects `deck.html` or `main.tex`:

```bash
python3 <skill-dir>/scripts/build_slide_project.py <project-directory>
```

Pass `--pdf-name descriptive-name.pdf` when the project directory name is not suitable.

### HTML decks

The helper runs `theme/tools/check.sh` (headless Chrome) and parses the theme's QA report, saving it to `rendered/qa-report.json`. It prints:

- `overflow: slide N: "Title"` for slides whose content does not fit;
- `error:` lines for missing citation keys, undefined labels, and KaTeX errors (these fail the build);
- theme warnings, such as a raw `<` inside math;
- notation-glossary coverage, and glossary keys that never matched a formula.

It then exports the PDF with `theme/tools/export-pdf.sh` (one 16:9 page per slide, fragments expanded, no tooltips), renders `rendered/slide-*.png` from that PDF, and writes a numbered contact sheet to `rendered/contact-*.png`. It needs Chrome/Chromium (`CHROME=/path` to override) and network access to the KaTeX CDN; when offline the QA report is unavailable and the build stops. For a quick look at a few slides with overflow outlines, use `theme/tools/screenshot.sh deck.html out/ 3 5`.

### Beamer decks

The helper invokes `latexmk` with `pdflatex -no-shell-escape`, stops on LaTeX errors, checks unresolved citations/references, copies the final PDF to the project root, and renders every page to `rendered/slide-*.png`. It also:

- writes a numbered contact sheet, nine slides per page, to `rendered/contact-*.png`;
- lists each overfull box as `overflow: slide N: ... (main.tex:LINE; frame at main.tex:LINE "Title")`, ignoring boxes under 1pt (`--overflow-tolerance`) and summarizing a box that repeats on most slides as theme-level;
- lists frame titles the theme had to scale down as `title: slide N: ...`;
- flags inner slides with no detectable frame title as `check: slide N: ...` (an intentional untitled frame, or a title that vanished).

If `latexmk` is unavailable, run `pdflatex -no-shell-escape -interaction=nonstopmode -halt-on-error -file-line-error` at least three times, plus the required bibliography pass. Never use `|| true`, suppress the log, or report success without checking that the PDF was freshly written.

### Blockers

Treat missing files, undefined controls, missing citations/labels/references, KaTeX or LaTeX errors, reported content overflows, and scaled frame titles as blockers. Resolve every `check:` line by looking at that slide.

## 6. Visual and semantic QA

Inspect the contact sheet (`rendered/contact-*.png`) first to detect rhythm, repetition, and visual-center problems, then every page at presentation scale. Re-open every asymmetric or crowded page individually. A successful compile is not visual inspection.

For each page, compare the occupied height, density, and visual mass of sibling columns. Images, tables, equations, colored blocks, and bold headings carry more visual weight than ordinary text, so equal word counts do not imply balance. If one side is sparse while the other is crowded, do one or more of the following: collapse to a single column, change column widths, move a compact callout above or below the main content, enlarge the evidence visual, redistribute related content, or split the frame. Keep asymmetry only when the negative space deliberately directs attention and the reason is visually apparent.

Check:

- one visual anchor per content frame; no text that repeats the figure, the title, or another frame; no generic interpretation blocks;
- frame titles on one line at full size, hierarchy, margins, clipping, and footer/page number;
- left/right and top/bottom visual balance, intentional negative space, and a stable optical center;
- body text readability from a room, not just at full-screen zoom;
- figure resolution, aspect ratio, crop correctness, legends, and axes;
- equation fit; every formula symbol defined on the slide where it first appears, inside that slide's one Notation box directly below the formulas, with no definitions elsewhere and the same box style and position on every slide; checked on the PDF/PNGs where hover tooltips are absent;
- tables complete relative to the paper (all rows and baselines, no synthetic rows), with metric directions, units, and the paper's bold/underline meaning;
- caveats on a frame only where they change how a number on it is read;
- no cross-slide references such as "see Slide 8";
- source locator visibility and attribution wording;
- title-page authorship/presenter distinction;
- exact agreement between confirmed presenter/footer wording and the rendered title/footline;
- consistency between actual page count, outline, speaker notes, and any merged-deck bookmarks;
- the resolved theme commit in `THEME_UPSTREAM.md` and `SOURCES.md`, especially after a refresh.

After fixing any page, recompile and inspect the changed page plus its neighbors. Do a second full-deck pass after the last layout edit.

Then perform a final evidence audit:

- **Title vs. evidence:** for every claim-style title, point to the evidence on that same frame that supports it. A title that relies on a table not shown, or on rows the frame itself marks as confounded or non-comparable, must be rewritten or the evidence added.
- Shrinking or cropping must not remove qualifiers, legends, error bars, notation, or source context.
- Every formula has its audit rows in `SOURCES.md`; in HTML decks the glossary covers the deck's symbols with no unused keys.

## Deliverables

Deliver the editable project, root-level final PDF, and `SOURCES.md`. Include `references.bib` when used, original/adapted figures, and any public data/code used to reconstruct visuals. Report source gaps such as missing weights, undisclosed settings, unavailable raw data, or ambiguous venue/version status.
