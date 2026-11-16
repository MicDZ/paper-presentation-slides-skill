# MBZUAI HTML Slides — Authoring Guide

This guide is for people and coding agents writing decks with the MBZUAI HTML theme.
A deck is one HTML file. Each slide is a `<section class="slide">` on a fixed
**1280 × 720 px** canvas (16:9). The runtime (`mbzuai-slides.js`) adds the banner,
footer and page numbers, numbers equations, figures, tables and theorems, resolves
citations and cross-references, lays out footnotes, and renders math with **KaTeX**.

Start from `demo.html`, which shows every feature, or `../templates/paper-presentation.html.in`.

---

## 1. Skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Deck title</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<link rel="stylesheet" href="theme/mbzuai-slides.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script defer src="theme/mbzuai-slides.js"></script>
<script type="text/x-bibtex" id="bibliography">
@inproceedings{vaswani2017attention, title={Attention Is All You Need}, author={Vaswani, Ashish and others},
  booktitle={Advances in Neural Information Processing Systems}, shortbooktitle={NeurIPS}, year={2017}}
</script>
</head>
<body>
<main class="deck" data-short-title="Short Title">
  <section class="slide title-slide"> … </section>
  <section class="slide" data-section="Introduction">
    <h2>Frame title</h2>
    <p>Content …</p>
  </section>
  <section class="slide references"><h2>References</h2></section>
  <section class="slide closing-slide"></section>
</main>
</body>
</html>
```

`theme/` is a copy of this `html/` directory. You can also load the files from a CDN pinned
to a commit, for example
`https://cdn.jsdelivr.net/gh/MicDZ/MBZUAI_Beamer_Theme@<commit>/html/mbzuai-slides.css` (and the same for `.js`).
Logos and the pattern background resolve relative to the theme files, so no other paths are needed.

---

## 2. Deck options (`<main class="deck" …>`)

| Attribute | Default | Meaning |
|---|---|---|
| `data-short-title` | title-slide `<h1>` | Left footer text |
| `data-foot-left` / `data-foot-mid` / `data-foot-right` | short title / subtitle / `{page} / {total}` | Footer fields (Beamer `\footleft` …). Placeholders: `{page}` `{total}` `{section}` `{title}`. Set one to `""` to leave it empty |
| `data-cite-style` | `numeric` | `numeric` → `[1, 3–5]`, numbered by order of first citation (unsrt). `author-year` → `(Vaswani et al., 2017)`, sorted alphabetically (natbib) |
| `data-slide-refs` | `true` | List the full references cited on each slide at the bottom of that slide. Can be overridden per slide |
| `data-footnote-style` | `number` | `number` (1, 2, …) or `symbol` (*, †, ‡, §, …) |
| `data-footnote-numbering` | `slide` | `slide` restarts at 1 on every slide; `global` counts across the deck |
| `data-equation-numbering` | `global` | `global` → (1), (2) …; `section` → (2.1), (2.2) … |
| `data-header-logos` | `rcl mbzuai` | Banner logos, separated by a rule. Tokens `mbzuai`, `rcl`, image URLs, or `none` |
| `data-title-logos` | `mbzuai` | Logos on the title and closing slides |
| `data-bib-max-authors` | `8` | More authors than this are shortened to "et al." in References |
| `data-bib-all` | `false` | `true` lists every BibTeX entry in References, cited or not (`\nocite{*}`) |

---

## 3. Slide types

| Markup | Result |
|---|---|
| `<section class="slide title-slide">` with `h1`, `p.subtitle`, `p.author`, `p.presenter`, `p.email`, `p.institute`, `p.venue`, `p.date` | Navy title bar and centered metadata. Long titles shrink automatically. `data-logos="mbzuai rcl"` overrides the logos |
| `<section class="slide">` with a first-child `<h2>` | Standard frame. The `<h2>` becomes the banner title and shrinks to fit one line. `<h2>Title <small class="framesubtitle">sub</small></h2>` adds a subtitle. A slide with no `<h2>` has no banner |
| `<section class="slide section-slide" data-section="Method">` | Section divider ("Section 2 / Method"). An optional `<p>` becomes the lead text |
| `<section class="slide references"><h2>References</h2></section>` | Full bibliography of cited works. It continues onto "References (cont.)" slides when it overflows |
| `<section class="slide closing-slide"></section>` | "Thank You / Questions?" slide that reuses the presenter and institute from the title slide. Put your own `h1`/`p` inside to override |

Slide attributes:
- `data-section="Name"` puts the slide in a section. The outline uses it, and it is inherited by later slides until it changes.
- `data-align="top"` (or `bottom`) changes vertical alignment. The default is centered, like Beamer.
- `data-slide-refs="false"` hides the bottom reference list on this slide.
- Classes `no-header` and `no-footer`.
- `<aside class="notes">` holds speaker notes, which are never rendered.

Outline: `<div class="toc"></div>` is filled with the sections and diamond markers. Use
`<div class="toc" data-current="Method"></div>` to highlight one section and dim the others.

---

## 4. Mathematics (KaTeX)

| Write | Renders as |
|---|---|
| `$…$` or `\(…\)` | inline math |
| `$$…$$` or `\[…\]` | unnumbered display |
| `<div class="equation" id="eq:loss">…TeX…</div>` | **numbered** display, with (1) set at the right margin |
| `\begin{equation} … \label{eq:loss} \end{equation}` | numbered display. The `\label` becomes the id |
| `\begin{equation*}`, `<div class="equation nonumber">`, `\nonumber`, `\notag` | unnumbered |
| `\begin{align} a &= b \\ &= c \end{align}` | multi-line `aligned` block with **one** number for the whole block (`gather` works the same way). Use separate `.equation` blocks to number lines individually |
| `\tag{A}` | custom number "(A)" |
| `$$ … \label{eq:x} $$` | a display with a `\label` is numbered automatically |

- **Macros:** add `<script type="application/json" id="katex-macros">{"\\R": "\\mathbb{R}"}</script>` to `<head>`. Backslashes are doubled because this is JSON. `\gdef` inside math also works.
- **HTML pitfalls:** write `<` as `\lt` or `&lt;`, and `>` as `\gt` or `&gt;`. A raw `a<b` is parsed as an HTML tag (the QA report flags this). `&` in `aligned` is fine when followed by a space or `=`.
- To show a literal dollar sign, write `\$`. Math is not processed inside `code`, `pre`, `script`, or `.nomath`.
- Styling: centered displays, numbers in KaTeX's Computer Modern font with parentheses, and upright math inside italic theorem text, following amsmath conventions.
- `.equation.boxed-eq` puts a framed background behind a key equation. `.equation.left` left-aligns it.

---

## 5. Citations and bibliography

Put the bibliography in `<head>` as BibTeX, pasted verbatim:

```html
<script type="text/x-bibtex" id="bibliography"> @article{…} @inproceedings{…} </script>
```

The parser supports `@string`, `#` concatenation, month macros, LaTeX accents (`\"o`, `{\'e}`,
`\L`), `--`, `~`, `{Protected Case}`, `{Corporate Author}`, `$math$` in titles, `doi`, `url`, and
`eprint` + `archivePrefix={arXiv}`. Optional fields `shortbooktitle`, `shortjournal` or `venueshort`
give the short venue name used in the per-slide reference lines.
(You can also use JSON instead: `<script type="application/json" id="bibliography">[{"id": "…", "type": "article", "author": "A and B", "title": "…", "journal": "…", "year": 2020}]</script>`.)

| Write | Numeric style | Author-year style |
|---|---|---|
| `<cite>key</cite>` or `\cite{key}` / `\citep{key}` | `[1]` | `(Vaswani et al., 2017)` |
| `<cite>a,b,c</cite>` or `\cite{a,b,c}` | `[1–3]` (sorted and compressed) | `(A, 2017; B, 2019)` |
| `<cite class="t">key</cite>` or `\citet{key}` | `Vaswani et al. [1]` | `Vaswani et al. (2017)` |
| `<cite data-note="Thm. 2">key</cite>` | `[1, Thm. 2]` | `(Vaswani et al., 2017, Thm. 2)` |

- Citation numbers come from the order of first citation across the deck. Same-author, same-year works get 2019a/2019b.
- **Bottom of each slide:** a short, full reference for each work cited on that slide, under a footnote rule:
  `[1] A. Vaswani et al. “Attention is all you need.” NeurIPS 2017.`
- **References slide:** the complete entry, e.g. `A. Vaswani, N. Shazeer, …, and I. Polosukhin. Attention is all you need. In Advances in Neural Information Processing Systems, pages 5998–6008, 2017.` Titles link to the DOI/URL/arXiv page when one exists.
- An unknown key renders in red as `[?key]` and appears in the QA report.

---

## 5a. Notation hover (symbol glossary)

During the talk, hovering a symbol inside **any** formula shows a tooltip with its meaning, and every
occurrence of that symbol on the slide is highlighted. Tapping works on touch screens. Press `g` to underline
every symbol that has an entry, which is useful when rehearsing to check coverage. Glossary entries come from three sources:

1. **Deck glossary** in `<head>`. The key is TeX, and the value is a meaning, or `{type, meaning}`. A meaning may contain `$math$` and HTML:
   ```html
   <script type="application/json" id="notation">
   {
     "\\theta":       "All learnable weights of the model.",
     "x_t":           {"type": "input", "meaning": "Token embedding at step $t$, $x_t\\in\\R^d$."},
     "\\mathcal{L}":  {"type": "scalar", "meaning": "Training loss."},
     "\\bar\\alpha_t": "Cumulative noise schedule."
   }
   </script>
   ```
   Put `<script type="application/json" class="notation">{…}</script>` inside a slide to override meanings for that slide only.
2. **Notation tables** are harvested automatically. In `<table class="notation">`, each row's first cell holds the symbol(s) (comma-separated math), its last
   cell holds the meaning, and a middle cell, if there is one, holds the type. Use `<tr data-sym="\theta^\star">` to set the key explicitly, and
   `<table class="notation" data-notation="local">` to limit a table to its own slide.
3. **One-off explanations** inside a formula: `\explain{p(z)}{Prior density of the latent $z$}`. These render exactly as `p(z)`.

Precedence, highest first: slide-local JSON, then the same slide's notation table, then the deck glossary, then notation tables on other slides.

Matching rules:
- Matching works on TeX tokens, so `y_{t}` = `y_t` and `\hat{y}` = `\hat y`. Longest keys win, so with `x`, `x_t` and `\hat x_t` all defined, each formula picks the most specific one.
- A modifier changes identity: `\mathcal{L}`, `\hat y`, `\bar\alpha` and `\mathbf x` match only their own keys, never plain `L`, `y`, `\alpha` or `x`. Text inside `\text{}`, `\operatorname{}` and `\mathrm{}` is never matched by single letters. Write the key with the same macro the formulas use, for example `\vx` if formulas use `\vx`.
- A matched symbol keeps its scripts attached (`K^\top`, `x_t'`), so typesetting is identical to the unannotated formula. Symbols inside those scripts are still matched.
- If an annotated formula fails to render, it falls back to the plain formula. The QA report includes
  `notation: {entries, annotatedSymbols, unusedDeckKeys, fallbackFormulas}`. Use `unusedDeckKeys` to catch keys spelled differently from the formulas.
- Turn the feature off with `<main class="deck" data-notation-hover="false">`. Tooltips never appear in print or PDF.

Agent tip: when a slide introduces notation, also add its symbols to the deck glossary, keeping the meanings to one short sentence.
Add a `type` such as matrix, scalar, distribution or hyper-parameter, because it helps the audience most.

---

## 6. Cross-references

Labels come from `id` attributes (or `\label{}` inside an equation).

| Write | Renders as |
|---|---|
| `<a class="ref" href="#fig:arch"></a>` or `\cref{fig:arch}` | `Figure 1`, `Table 2`, `Eq. (3)`, `Theorem 1`, … |
| `<a class="eqref" href="#eq:loss"></a>` or `\eqref{eq:loss}` | `(3)` |
| `\ref{fig:arch}` | `1` |

If the anchor already contains text, that text is kept and only linked. Clicking any reference
jumps to the slide that holds the target. An undefined label renders as a red **??** and appears in the QA report.

---

## 7. Footnotes and source locators

- `<span class="footnote">Text, may include $math$ and <cite>key</cite>.</span>` or `\footnote{plain text}`
  becomes a superscript marker in place, and the note is set at the bottom of the slide below a short rule, as LaTeX does.
- `<p class="source">Paper Sec. 3, Table 2</p>` as a direct child of the slide is a small, right-aligned source
  locator pinned to the bottom of the slide (Beamer `\framesource`).
- Order in the bottom zone: footnotes, then per-slide references, then the source.

---

## 8. Figures, tables, algorithms

```html
<figure id="fig:arch">
  <img src="figures/arch.png" style="max-height:380px" alt="…">
  <figcaption>Architecture overview.</figcaption>      <!-- → "Figure 1: Architecture overview." -->
</figure>

<figure class="table" id="tab:main">
  <figcaption>Results on ImageNet.</figcaption>       <!-- caption above, as for tables in papers -->
  <table>
    <thead><tr><th class="l">Method</th><th>Top-1 ↑</th></tr></thead>
    <tbody>
      <tr><td class="l">Baseline</td><td class="num second">76.1</td></tr>
      <tr class="ours"><td class="l">Ours</td><td class="num best">79.4</td></tr>
    </tbody>
  </table>
</figure>
```

- Only figures with a `<figcaption>` are numbered. Add `class="nonumber"` to opt out. `figure.algorithm` → "Algorithm 1".
- Tables use **booktabs** rules by default. Cell classes: `l`, `c`, `num` (right, tabular figures), `best` (bold), `second` (underline). Row classes: `ours` (sand tint), `midrule`, `group`. Table classes: `compact`, `full` (100% width), `brand` (navy header, zebra rows, as in the Beamer table slide), `notation`.
- Diagrams: inline `<svg>` using the brand colors (navy `#0C2945`/`#154677`, sand `#E5C687`).
- `<div class="placeholder" style="height:300px">…</div>` is a dashed box for a figure that has not been added yet.

---

## 9. Blocks and theorem environments

```html
<div class="block" data-title="Standard Block">…</div>          <!-- navy title (Beamer block) -->
<div class="block alert" data-title="Important Note">…</div>    <!-- sand title (alertblock) -->
<div class="block example" data-title="Example">…</div>         <!-- dark navy (exampleblock) -->
<div class="block plain" data-title="Note">…</div>              <!-- left rule only -->
<p class="takeaway">One-sentence key message.</p>

<div class="theorem" id="thm:main" data-name="Convergence"><p>…</p></div>   <!-- Theorem 1 (Convergence). italic body -->
<div class="definition"><p>…</p></div>                                     <!-- Definition 1. upright body -->
<div class="proof"><p>…</p></div>                                          <!-- Proof. … □ -->
```

Environments: `theorem`, `lemma`, `proposition`, `corollary`, `conjecture` (italic body);
`definition`, `assumption` (upright); `remark`, `example-env` (italic head); `proof`.
Each type has its own counter. Add `nonumber` to suppress the number and `boxed` to frame the environment.

---

## 10. Layout and typography

- Columns: `<div class="columns"><div class="column" style="--w:58%">…</div><div class="column">…</div></div>`.
  Add `c` to center columns vertically and `stretch` for equal heights. `--gap: 24px` changes the gutter. `.grid-2` and `.grid-3` give simple grids.
- Sizes follow the LaTeX names: `Huge huge LARGE Large large normalsize small footnotesize scriptsize tiny`.
- Emphasis: `.strong` (navy bold, Beamer `\structure`), `.alert` (red text), `.accent-text` (dark sand), `.muted`, `mark`/`.hl`, `.sc` (small caps).
- Lists use navy triangles, as in Beamer. `ul.check` / `ul.cross` give ✓ / ✗ markers, and `ul.plain` has none. `<dl>` gives a description list.
- Utilities: `center`, `right`, `mt-0/1/2`, `mb-0/1/2`, `w-100`, `nowrap`, colors `navy dark-navy sand dark-sand subtle`.
- Incremental reveal (Beamer `\pause`): add `class="fragment"`, or `data-step="n"` to group elements. Fragments are all visible in print/PDF.
- Theme tokens are CSS variables on `:root` (`--mbz-navy`, `--fs-base`, `--font-sans`, …), so a deck can override them in its own `<style>`.

**Content budget.** The content area is about 1150 × 560 px, with 27 px body text. Aim for at most about 6 bullets or
about 60 words per slide. When the QA report flags overflow, split the slide or use `.small`/`.footnotesize`. Do not shrink everything.

---

## 11. Viewing, QA, export

- **Keys:** → / Space / PgDn next, ← / PgUp previous, ↑ ↓ jump a whole slide, Home/End, `o` or Esc overview, `f` fullscreen, `g` marks the symbols that have notation entries, `d` toggles debug outlines.
- **URLs:** `deck.html#/5` opens slide 5, `deck.html#fig:arch` opens the slide containing `#fig:arch`, `?print` lays out all slides for printing, and `?debug` outlines overflowing slides in red.
- **QA report:** once rendered, the theme sets `<html data-mbz-ready="true">`, fires the `mbzuai:ready` event, sets `window.MBZUAI.report`,
  and adds `<script id="mbz-report" type="application/json">` containing:
  `{ slides, sections, overflow:[{slide,title}], missingCitations, missingLabels, katexErrors:[{slide,tex,error}], warnings, notation }`.
- **Agent tools** (they need Chrome or Chromium; set `CHROME=` to override the path):

```bash
html/tools/check.sh deck.html                 # print the QA report; exit 1 if anything is wrong
html/tools/screenshot.sh deck.html out/ 3 5   # PNGs of slides 3–5 for visual review
html/tools/export-pdf.sh deck.html deck.pdf   # one 16:9 page per slide
```

Recommended agent loop: write the deck → `check.sh` → fix every overflow, missing key and KaTeX error →
`screenshot.sh` the slides you changed and look at them → `export-pdf.sh` if you need a PDF.
