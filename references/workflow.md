# Source, build, and QA workflow

Use this reference for every new paper deck. For edits, apply the relevant acquisition, evidence, and QA checks without replacing working project structure.

## 1. Create a reproducible project

Before initialization, ask the user to confirm:

- the exact presenter display name;
- footer left, center, and right fields.

Recommend `short paper title / session by Presenter / current slide / total slides`, but require an explicit acceptance or exact replacements. Do not copy these fields from an older deck or infer them from the current user/account. If the user wants the recommended footer, run:

Run:

```bash
python3 <skill-dir>/scripts/new_slide_project.py <output-directory> \
  --title "Full paper title" --short-title "Short title" \
  --presenter "Confirmed presenter" --subtitle "Paper subtitle" \
  --confirm-default-footer
```

For custom wording, replace `--confirm-default-footer` with:

```bash
--footer "Confirmed left" "Confirmed center" "Confirmed right"
```

The helper refuses to initialize without a presenter and one of these two footer confirmations. When editing an existing deck, compare its title and `\footleft`, `\footmid`, and `\footright` fields with the user's reply before final compilation.

The helper fetches `MicDZ/MBZUAI_Beamer_Theme` and its paper-presentation template, then creates `main.tex`, `paper-source/`, `figures/`, `data/`, `build/`, `rendered/`, and `SOURCES.md`. It follows the repository's `main` branch by default so newly created decks receive theme improvements. The exact resolved commit is recorded in `THEME_UPSTREAM.md` and `SOURCES.md`, while a local copy of the theme files keeps the generated deck reproducible.

Use `--theme-ref <tag-or-commit>` for a pinned release. Use `--theme-dir <local-checkout>` when working offline or testing unpublished theme changes. Theme retrieval uses `git` directly and does not require browser automation.

Use a descriptive output directory. Keep paper downloads immutable under `paper-source/`; put only selected presentation assets in `figures/`, and any public raw data plus transformation code in `data/`.

### Refresh an existing project's theme

When the user requests or accepts a theme update, run:

```bash
python3 <skill-dir>/scripts/sync_theme.py <project-directory> --yes
```

The sync helper uses `THEME_MANIFEST.txt` to replace or remove only previously installed theme-owned `.sty` files and theme assets, then refreshes the theme provenance/license files. It does not change `main.tex`, paper figures, data, sources, or unlisted custom assets. Pass `--theme-ref` to select a tag/commit, or `--theme-dir` for a local checkout. Recompile and perform the complete visual inspection after every refresh; a theme-only diff can still change layout.

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

Prefer vector or original-resolution PDF/SVG/EPS/PNG files over screenshots. When an original multipanel figure is unreadable on a slide, crop to the relevant panel or reconstruct from public data. Keep the original and document the transformation. Never infer missing raw values from a plot unless the deck labels the digitization and its uncertainty.

## 3. Build an evidence map before frames

For each proposed claim, record its source locator and whether it is:

- directly reported by the authors;
- a calculation derived from reported values;
- an interpretation or criticism by the presenter.

Map the paper into a talk arc: question/gap, thesis, method logic, decisive evidence, limitations, and transferable takeaways. Decide what the audience can safely omit. A speaker outline is useful only if it is maintained alongside the slide source; stale notes are worse than no notes.

## 4. Implement source-backed frames

Follow [design-guide.md](design-guide.md). Export a Zotero record to `references.bib` only when the deck needs a bibliography and Zotero is available; Zotero is not a prerequisite for this skill. Keep Zotero item keys distinct from BibTeX citation keys.

When the deck contains displayed equations, also follow [formula-notation.md](formula-notation.md) and maintain a formula audit while drafting. Do not postpone symbol definitions until visual QA.

Use compact visible provenance with the starter macro:

```latex
\\framesource{Paper Fig. 3, Eq. 2, and Sec. 4.1}
```

For adaptations, say `Adapted from`; for synthesis, say `Presenter synthesis based on ...`; for derived numbers, state the arithmetic in `SOURCES.md` and, when material, on the frame.

## 5. Compile without hiding failure

Use the build helper:

```bash
python3 <skill-dir>/scripts/build_slide_project.py <project-directory>
```

It invokes `latexmk` with `pdflatex -no-shell-escape`, stops on LaTeX errors, checks unresolved citations/references, copies the final PDF to the project root, and renders every page to `rendered/`. Pass `--pdf-name descriptive-name.pdf` when the project directory name is not suitable.

If `latexmk` is unavailable, run `pdflatex -no-shell-escape -interaction=nonstopmode -halt-on-error -file-line-error` at least three times, plus the required bibliography pass. Never use `|| true`, suppress the log, or report success without checking that the PDF was freshly written.

Treat missing files, undefined controls, undefined citations/references, and fatal errors as blockers. Review overfull/underfull boxes in context: theme overlays can produce benign warnings, but content overflow must be fixed.

## 6. Visual and semantic QA

Inspect the contact sheet first to detect rhythm and visual-center problems, then every page at presentation scale. Re-open every asymmetric or crowded page individually. A successful compile is not visual inspection.

For each page, compare the occupied height, density, and visual mass of sibling columns. Images, tables, equations, colored blocks, and bold headings carry more visual weight than ordinary text, so equal word counts do not imply balance. If one side is sparse while the other is crowded, do one or more of the following: collapse to a single column, change column widths, move a compact callout above or below the main content, enlarge the evidence visual, redistribute related content, or split the frame. Keep asymmetry only when the negative space deliberately directs attention and the reason is visually apparent.

Check:

- frame title length, hierarchy, margins, clipping, and footer/page number;
- left/right and top/bottom visual balance, intentional negative space, and a stable optical center;
- body text readability from a room, not just at full-screen zoom;
- figure resolution, aspect ratio, crop correctness, legends, and axes;
- equation fit, notation completeness, and visible operational meaning;
- table metric directions, units, sample sizes, denominators, and highlighted cells;
- source locator visibility and attribution wording;
- title-page authorship/presenter distinction;
- exact agreement between confirmed presenter/footer wording and the rendered title/footline;
- consistency between actual page count, outline, speaker notes, and any merged-deck bookmarks;
- the resolved theme commit in `THEME_UPSTREAM.md` and `SOURCES.md`, especially after a refresh.

After fixing any page, recompile and inspect the changed page plus its neighbors. Do a second full-deck pass after the last layout edit. Then perform a final evidence audit: shrinking or cropping must not remove qualifiers, legends, error bars, notation, or source context.

## Deliverables

Deliver the editable project, root-level final PDF, and `SOURCES.md`. Include `references.bib` when used, original/adapted figures, and any public data/code used to reconstruct visuals. Report source gaps such as missing weights, undisclosed settings, unavailable raw data, or ambiguous venue/version status.
