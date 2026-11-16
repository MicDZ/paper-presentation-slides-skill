# Evidence-driven paper slide design

This guide distills reusable patterns from reading-group decks and from reviewers' edits to decks this skill produced. Apply the patterns selectively; the paper's argument and audience still determine the final structure.

## Visual first

Each content frame has one visual anchor (a paper figure, focus crop, table, or diagram) and only the text that supports it. Most reviewer edits to generated decks removed text, especially text that:

- repeats what the figure already shows, or what the title already says;
- repeats another frame;
- fills a generic block such as "Interpretation", "Why this matters", or "Evidence boundary" that adds no information specific to this frame.

Before keeping a sentence, ask what the audience would lose without it. Say the rest aloud. A frame with a figure and two short supporting lines is usually stronger than one with a figure and four blocks.

## Design the talk around claims

Use frame titles as conclusions or questions that the frame resolves:

- Strong: `Stage 2 freezes shape and guides pose over time`
- Strong: `Priors place the grasp; SoG closes the gap`
- Weak: `Method`, `Results`, or `Ablation Study`

The title, visual, and spoken takeaway point to the same claim. A claim title must be supported by evidence **visible on that frame**: not by a table shown elsewhere, and not by rows the frame itself marks as confounded or non-comparable. If the frame cannot carry the evidence, use a descriptive title instead.

Titles must fit on one header line at full size. Both themes shrink a too-long title to fit, which makes it hard to read; shorten it instead. In Beamer, with the default header logos, that is roughly 45 characters (`\headerlogo{}` removes the secondary logo and allows roughly 55) and the build helper reports scaled titles. In HTML, `data-header-logos="mbzuai"` on `<main class="deck">` drops the secondary logo; compare title sizes on the contact sheet.

For a typical single-paper talk, a productive arc is:

1. define the input, output, and why the problem is hard;
2. expose the prior tradeoff or missing capability;
3. state the paper's thesis and show the pipeline;
4. walk the method in data-flow order;
5. explain what the evaluation actually tests;
6. present decisive results and ablations;
7. state the limits that matter;
8. end with takeaways and one discussion question.

This is an argument pattern, not a required section list. A short talk may skip the outline slide and move directly from title to question.

## Follow the data flow

Following the data through the method is the most useful explanation technique. For every stage, the audience should be able to answer: what goes in, what happens, what comes out, and where it goes next. Order method frames by that flow, not by the paper's section order.

Do not write cross-slide references such as "see Slide 8" or "as on the previous slide"; they break on every reorder. When a later frame needs an earlier element, repeat it compactly (a small crop, a one-line reminder of a symbol).

## Background is the user's decision

How much background a deck needs depends on the audience. Identify the prerequisites the method relies on and propose background frames explicitly, e.g. *"This method relies on stereo triangulation; add a background slide on epipolar geometry?"* Add only the background the user accepts, and keep it short and in service of the method.

## Reusable frame recipes

### Problem frame

A high-resolution teaser as the anchor, plus one line each for input, output, and why the mapping is hard. This is more informative than a generic motivation bullet list.

### Pipeline frame

Show the full architecture figure once, at legible size. Narrate the data flow through it in one or two lines; the per-stage detail belongs on the stage frames.

### Method-stage (module) frame

Anchor on a focus crop of the overview figure for this stage (see Figures). Tell a short story the audience can follow:

1. **Problem:** what this module is for, i.e. which gap it closes;
2. **How:** the idea in general terms, one or two sentences;
3. **Uses:** its inputs, outputs, and key components, with only the notation the explanation needs.

Restating each equation in prose works poorly; explain what the module achieves and let the equation, if shown, carry the detail. If an ablation directly justifies the design choice, a small comparison beside it is better than one many slides later.

### Equation frame

Show an equation only when the explanation uses it. Read [formula-notation.md](formula-notation.md): define every symbol explicitly on the slide where it first appears (a short `where` list is usually enough), and keep the complete audit in `SOURCES.md`. In HTML decks the notation hover is only a Q&A aid on top of this. For a multi-term objective, group terms by function and say what minimizing each term encourages.

### Evaluation-protocol frame

Before headline numbers, state datasets, splits, sample sizes, and comparison conditions, and translate each metric into the question it answers, with its direction.

### Result frame

The table or plot is the anchor. Preserve metric arrows and units. Add a caveat only when it changes how a number on this frame is read (for example, a baseline evaluated under a different protocol, or an average over successful runs only). Caveats that do not change the reading belong in speaker remarks or `SOURCES.md`. For qualitative figures, say what to look at rather than merely showing the panel.

### Ablation frame

Attribute gains incrementally. Distinguish a load-bearing component from a modest refinement and from a system-level comparison confounded by other changes. Use `supports` or `is consistent with` unless the experimental design warrants a causal claim.

### Assessment frame

Name the limits that matter for this audience: method assumptions and failure modes, evidence gaps that change how results should be read, and reproducibility gaps (missing code, weights, data, or settings). Do not inflate a qualitative downstream demonstration into task-level success.

## Figures

### Source order

1. The paper's own figure, cropped, masked, or outlined as needed.
2. A published external figure, with its source and license recorded.
3. A code-generated figure (matplotlib, TikZ), with the script and any public input data kept under `data/`.
4. Only if none of these fits, ask the user whether a generated image is acceptable.

Prefer original assets from TeX/HTML/project sources over screenshots. Preserve aspect ratio; crop irrelevant whitespace before shrinking a whole figure.

### Focus crops

"Full architecture once, then focus crops per stage" works very well. Dim everything except the stage's window(s).

HTML (the template's Stage slide contains this): an SVG overlay whose coordinates are fractions of the image measured from the **top-left**, one `M x0 y0 H x1 V y1 H x0 Z` per window:

```html
<div style="position:relative">
  <img src="figures/overview.png" style="width:100%;display:block" alt="Stage 1">
  <svg viewBox="0 0 1 1" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%">
    <path fill="#fff" fill-opacity=".62" fill-rule="evenodd" d="M0 0H1V1H0Z M.11 .40H.31V.96H.11Z"/>
  </svg>
</div>
```

Beamer: the template's `\focuscrop` macro, with coordinates from the **bottom-left**; several windows can be listed one after another:

```latex
\focuscrop[width=\linewidth]{overview.pdf}{(.11,.04) rectangle (.31,.60)}
```

Rules:

- each crop includes the stage's **input and output**, not only its internal block;
- overlays, labels, and arrows never cover figure content;
- render and check that the window is where you intended; coordinates are easy to get wrong.

For a stage too small to read in the full figure, crop the region instead (an image editor or script, kept under `data/`; or `\includegraphics[trim=...,clip]` in Beamer), and say `Adapted from Paper Fig. N`.

### Generated or reconstructed visuals

- Preserve the paper's data and meaning; never fabricate missing values or erase uncertainty.
- Store public input data and plotting code under `data/`.
- Label the frame `Adapted from` or `Reconstructed from`, and compare the output with the source figure.

## Tables and numbers

- **Reproduce the paper's tables completely.** Selected rows, dropped baselines, or synthetic rows such as "best other method" change the impression a table gives; reviewers restored the full tables in most decks. When a table is large, split it across frames (for example, by dataset) or use `\footnotesize`/`\scriptsize` for the table body.
- Keep the paper's bold/underline meaning and state it in a small legend (e.g. `Bold: best; underline: second best`). If you add your own emphasis, use a visibly different marker (such as a light row background) and say what it marks.
- Re-typeset a table when the paper image is too small, preserving labels, units, precision, arrows, grouping, and footnotes. In HTML use `<figure class="table">` with the `best` (bold) and `second` (underline) cell classes to carry the paper's emphasis.
- Define the denominator for ratios and percent improvements; distinguish percentage points from percent change.
- Keep arithmetic derived from paper values traceable in `SOURCES.md`.

## Visual system

- Use the 16:9 navy/sand MBZUAI theme from `MicDZ/MBZUAI_Beamer_Theme` (bundled as the skill's `theme/` submodule), preferably its HTML version. Record the resolved commit for every generated deck.
- Keep title and closing slides free of normal footers and frame titles: `title-slide` and `closing-slide` in HTML, the template's title frame and `\mbzuaiThankYou` in Beamer.
- Distinguish paper authors from the speaker, e.g. `Paper by ... -- Presented by ...`.
- Two-column layouts work when one side is the visual and the other supports it; three equal columns work for input/output/challenge or stage summaries.
- Use theme blocks sparingly and only with frame-specific content: navy for definitions/structure, sand for the one central point or a caveat that changes the reading. Do not turn every paragraph into a block.
- Use bold and color to guide reading order, not to decorate.
- Keep ordinary content at `small` or larger (the classes and commands share LaTeX names in both themes). `footnotesize` is for legends, notation, and table bodies; `scriptsize` and `tiny` are for provenance and unavoidable table detail. If a core idea needs tiny type, split or redesign the frame. The HTML content area is about 1150 × 560 px with 27 px body text; aim for about 60 words per slide at most.
- Keep a compact visible source locator at the bottom of every evidence-bearing frame.

## Visual balance and column choice

Choose a layout after estimating the actual content volume, not before.

- Compare optical weight: occupied height, image area, table density, equation size, colored blocks, and bold headings, not only line counts.
- Reject a frame where one column is mostly empty and the other is dense.
- If one side contains only a short callout, place it above or below the visual, or widen the visual column substantially.
- If a visual is the evidence, enlarge it until its labels are readable.
- If both columns are dense, split the frame instead of shrinking everything.
- Intentional asymmetry is acceptable when the empty space clearly isolates a hero visual.

Review the whole deck on the contact sheet (`rendered/contact-*.png`) for repeated imbalance and pacing, then inspect each slide full size. A theme refresh invalidates earlier visual approval.

## Lessons from reviewed decks

- Text that restates the figure, title, or another slide was the most common reviewer deletion.
- Full symbol tables on every equation frame were unnecessary for an expert audience; the complete audit fits better in `SOURCES.md`.
- Module frames that walked through the data flow with a focus crop were easier to follow than frames that paraphrased equations.
- Selected-row tables and synthetic comparison rows misled; full tables, split if necessary, did not.
- Claim titles sometimes relied on tables not shown on the frame, or on rows the frame itself marked as confounded.
- Cross-slide references broke on every reorder.
- Generic section-heading titles make frames harder to remember; claim titles that are supported on the frame are stronger.
- Speaker-note outlines drift after deletion or reordering. Verify titles and page counts before delivery.
