# Evidence-driven paper slide design

This guide distills the strongest reusable patterns from the RCL reading-group decks in the 2026-07-17 repository, especially the later *Grasp in Gaussians* deck. Apply the patterns selectively; the paper's argument and audience still determine the final structure.

## Design the talk around claims

Use frame titles as conclusions or questions that the frame resolves:

- Strong: `Stage 2 freezes shape and guides pose over time`
- Strong: `Ablation: priors place the grasp; SoG closes the gap`
- Weak: `Method`, `Results`, or `Ablation Study`

The title, visual, and final callout should point to the same takeaway. If a title promises a comparison, show the relevant comparison and name the condition under which it holds.

For a typical single-paper talk, a productive arc is:

1. define the input, output, and why the problem is hard;
2. expose the prior tradeoff or missing capability;
3. state the paper's thesis and map the pipeline;
4. explain the method in causal or algorithmic order;
5. explain what the evaluation actually tests;
6. present decisive results, ablations, and exceptions;
7. separate method limits from evidence/reproducibility limits;
8. end with transferable takeaways and one discussion question.

This is an argument pattern, not a required section list. A short talk may omit the outline slide and move directly from title to question/thesis. Use an outline only when it genuinely helps navigation.

## Reusable frame recipes

### Problem frame

Use a high-resolution teaser plus three compact fields: input, output, and why the mapping is ill-posed. This is more informative than a generic motivation bullet list.

### Pipeline frame

Show the original overview figure at legible size, then give each stage one verb and one responsibility. Emphasize handoffs: what representation changes, what becomes fixed, and what uncertainty the next stage resolves.

### Method-stage frame

Combine one relevant visual with the minimal mechanism and a `why this choice` statement. If an ablation directly justifies the choice, place the small comparison beside it rather than many slides later.

### Equation frame

Read [formula-notation.md](formula-notation.md) and use three visible layers:

1. the equation, large enough to read;
2. a compact symbol key for every uncommon symbol and paper-specific index/subscript/superscript;
3. an `Operational meaning` or `What optimizing this does` box.

For multi-term objectives, group terms by function (appearance, geometry, contact, temporal regularization) and explain what minimizing/maximizing each encourages. A visible formula without a complete notation key and operational meaning is incomplete. Split long derivations or notation-heavy objectives across frames.

### Evaluation-protocol frame

Before headline numbers, state datasets, splits or sequence selection, preprocessing, hardware/runtime scope, and sample size. Translate each metric into the question it answers. Call out conditional averaging, failed-run exclusions, or non-comparable protocols.

### Result frame

Preserve metric arrows and units. Highlight only the cells needed for the spoken claim. Pair the headline with an important exception or caveat so the audience can calibrate it. For qualitative figures, say what visual evidence to inspect rather than merely showing the panel.

### Ablation frame

Attribute gains incrementally. Distinguish a load-bearing component from a modest refinement and from a system-level comparison confounded by other changes. Use `supports` or `is consistent with` unless the experimental design warrants a causal claim.

### Assessment frame

Separate:

- method limits: assumptions, failure modes, brittleness, scope;
- evidence limits: dataset selection, baselines, denominators, missing uncertainty;
- reproducibility limits: absent code, weights, data, hyperparameters, or licenses.

Do not inflate a qualitative downstream demonstration into task-level success. `Controller-compatible output` and `successful robot deployment` are different claims.

## Visual system

- Use 16:9 MBZUAI Beamer with the navy/sand theme fetched from `MicDZ/MBZUAI_Beamer_Theme`. Record the resolved commit for every generated deck.
- Keep title and closing frames free of normal footers and frame titles. Use the standard `\\mbzuaiThankYou` closing frame.
- Distinguish paper authors from the speaker, e.g. `Paper by ... -- Presented by ...`.
- Prefer one dominant visual or table. Two-column layouts work when one side explains and the other supplies evidence; three equal columns work for input/output/challenge or stage summaries.
- Use theme blocks as semantic layers: navy for definitions/structure, sand for the central interpretation or caution. Do not turn every paragraph into a block.
- Use bold and color to guide reading order, not to decorate. A result table should not highlight more cells than the spoken argument can explain.
- Keep ordinary content at `\\small` or larger when possible. `\\footnotesize` is for compact legends or notation; `\\scriptsize` and `\\tiny` should be limited to provenance or unavoidable table detail. If a core idea needs tiny type, split or redesign the frame.
- Preserve aspect ratio. Crop irrelevant whitespace before reducing the whole figure. Split dense multipanel figures when labels are unreadable.
- Keep a compact visible source locator at the bottom of every evidence-bearing frame. Tiny attribution is acceptable; tiny substantive content is not.

## Visual balance and column choice

Choose a layout after estimating the actual content volume, not before. Two columns are appropriate only when both sides have meaningful roles, such as `visual / explanation`, `method / consequence`, or `claim / evidence`.

- Compare optical weight: occupied height, image area, table density, equation size, colored blocks, and bold headings. Do not compare only line counts.
- Reject a frame where one column is mostly empty and the other is dense, especially when the dense column is on the right and pulls the visual center away from the title and reading order.
- If one side contains only a short callout, place it above or below the main material, or widen the main column substantially.
- If a visual is the evidence, enlarge it until its labels are readable; do not leave a small figure floating in a large empty column.
- If both columns are dense, split the frame instead of reducing everything to `\scriptsize`.
- Intentional asymmetry is acceptable when the empty space clearly isolates a hero visual or single thesis. It must look deliberate at thumbnail size.

Review the whole deck as a contact sheet for repeated imbalance and pacing, then inspect each slide full size. Re-render after corrections; source inspection alone cannot approve layout.

A theme refresh invalidates earlier visual approval. Recompile and repeat the balance, clipping, typography, header, and footer checks even when `main.tex` did not change.

## Tables and numbers

- Re-typeset a table when the paper image is too small, but preserve labels, units, precision, arrows, grouping, and footnotes.
- Define the comparison denominator for ratios and percent improvements. Distinguish percentage points from percent change.
- Put sample counts and whether metrics condition on successful runs near the result.
- State meaningful exceptions. A method that is best overall may lose on one metric or dataset; showing that exception increases credibility and prevents overclaiming.
- Keep arithmetic derived from paper values traceable in `SOURCES.md`.

## Figures and reconstructed visuals

Prefer original assets from TeX/HTML/project sources. A paper screenshot is a fallback, not the default. For reconstructed charts or diagrams:

- preserve the paper's data and meaning;
- store public input data and plotting code under `data/`;
- label the frame `Adapted from` or `Reconstructed from`;
- compare the output with the source figure;
- do not fabricate missing values or erase uncertainty.

## Lessons from the repository's weaker patterns

- Generic section-heading titles make individual frames harder to remember; claim-driven titles are stronger.
- Full paper figures and wide tables can be technically present yet unreadable. Crop, split, or re-typeset.
- Source attribution only in a final bibliography is insufficient for a research talk; use frame-level locators plus `SOURCES.md`.
- A compiler that ignores errors and deletes logs can announce success for a stale PDF. Builds must stop on failure and retain diagnostics.
- Speaker-note outlines can drift from the actual deck after slide deletion or reordering. Verify titles and page counts before delivery.
- A multi-paper session needs cross-paper transitions; six independent outlines do not automatically make one coherent talk.
- Fixed 50/50 or 60/40 columns can survive several edits after their content has become asymmetric. Reconsider the layout whenever content changes rather than merely resizing text.
