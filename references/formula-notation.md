# Formula notation and explanation

Read this reference whenever a deck contains displayed or inline mathematics. There are three layers, with different jobs:

- **The slide** defines every symbol of a formula explicitly, on the slide where the symbol first appears, inside that slide's single **Notation box**. This is what the audience relies on during the talk.
- **`SOURCES.md`** holds the complete formula audit (types, shapes, indices, status) for every formula.
- **The HTML notation hover** (HTML decks only) repeats meanings as tooltips. It is an auxiliary aid, mainly for Q&A, and never replaces on-slide definitions.

## Rule: define every symbol on the slide where it first appears

When a symbol appears in a formula for the first time in the deck, its meaning is written on that slide, visibly, in the rendered slide and PDF. This holds for every symbol, for every audience, including notation that is standard in the field. Common arithmetic and relation signs (`+`, `=`, `\le`, parentheses) are not symbols in this sense.

- Audience depth changes how much you say about a symbol (an expert audience does not need the type and shape of a SE(3) pose spelled out), not whether you define it.
- A symbol already defined on an earlier slide need not be redefined. Repeat a short reminder in the Notation box when the gap is large or the symbol is easy to confuse; never write "see Slide 8".
- Remove a formula the explanation does not use rather than displaying it with undefined symbols.

## Rule: all definitions go in one Notation box per slide

Every symbol definition on a slide lives in **one** box titled `Notation`, and nowhere else. The audience builds a habit: whenever a new formula appears, its symbols are in the Notation box, in the same place and the same style as on every other slide.

- **One box per slide** that introduces symbols. It holds every symbol newly introduced on that slide, whether it appears in a displayed formula, inline math, a figure label, or a table header.
- **Nothing outside the box:** no definitions in bullets, prose, captions, `where ...` lines, or speaker-facing callouts. Text elsewhere on the slide may *use* a symbol, but its meaning is in the box.
- **Same style and position throughout the deck:** directly below the formula(s), full width of the column that holds the formulas. On a two-column slide with a figure, the formulas and their Notation box share the text column. Do not move the box around from slide to slide or restyle it.
- **One entry per symbol** (or per closely paired symbols such as a prediction and its target): the symbol, then a short meaning, in order of first appearance in the formula.
- **Compact layout:** entries flow into several columns (three across a full-width box by default), so short entries share a line and the box stays a few lines tall. Do not spend one full-width line per symbol. Keep meanings short enough to fit their column; use fewer columns only when meanings are long.
- **Reminders** of symbols defined earlier may be added as extra entries when they help; keep them few.
- Slides without new symbols have no Notation box. When the box would need more than about ten entries, split the slide.

Markup:

```html
<!-- HTML theme: one <tr> per entry; entries flow into columns at least
     --notation-col wide (default 16em; e.g. style="--notation-col:22em" for
     longer meanings). Rows are also harvested by the notation hover. -->
<div class="block notation-box" data-title="Notation">
  <table class="notation">
    <tr><td>$Q, K, V$</td><td>queries, keys, values; one row per position</td></tr>
    <tr><td>$d_k$</td><td>key/query dimension</td></tr>
  </table>
</div>
```

```latex
% Beamer (environment defined in the template): entries fill 3 columns
% left to right; \begin{notationbox}[2] for longer meanings
\begin{notationbox}
  \nt{$Q, K, V$}{queries, keys, values}
  \nt{$d_k$}{key/query dimension}
\end{notationbox}
```

## What an equation slide needs

1. **Why it is here:** its role (definition, transformation, objective, update rule, estimator, metric), what it consumes and produces, and where the output goes next in the data flow. One line, or the slide title, is often enough.
2. **One Notation box** directly below the formula(s), defining every newly introduced symbol (see the rules above).
3. **What it does:** what minimizing, maximizing, conditioning on, or changing the important quantities achieves. For a multi-term objective, group terms by function and say what each encourages.

Do not satisfy these with a verbal reading such as "the loss is the sum of several terms", and do not restate the equation symbol by symbol in prose. Define the symbols in the box, then explain the mechanism outside it.

## Notation hover in HTML decks (auxiliary only)

The HTML theme shows a symbol's meaning when the mouse hovers over it in a formula. The rows of every Notation box (`table.notation`) are harvested automatically; the deck glossary (`<script type="application/json" id="notation">`) is needed only for symbols that appear outside any box, and a slide-local `<script type="application/json" class="notation">` overrides a symbol whose meaning changes on that slide (e.g. an index `i` reused for different things). See `theme/AUTHORING.md`, section 5a.

- Treat it strictly as an aid. In a normal talk the presenter does not hover over symbols; it is for Q&A, when someone asks what a symbol means, and for rehearsal (press `g` to underline covered symbols).
- It never counts as defining a symbol. Tooltips do not appear in the PDF, in screenshots, or on a projector the audience watches while nobody hovers.
- Write the first cell of each Notation-box entry with exactly the TeX the formulas use (`\widehat y_t`, not `\hat y_t` if the formula says `\widehat`), so hover finds it. The build helper reports deck-glossary keys that never match a formula (`unusedDeckKeys`) so misspelled keys can be fixed.
- Beamer decks have no equivalent; the on-slide rule applies unchanged.

## The complete audit (in `SOURCES.md`)

Fill the `Formula audit` table in `SOURCES.md` for every displayed formula, one row per relevant symbol:

- slide, paper locator (`Eq. 4`, `Sec. 3.2`), and the formula's role;
- plain-language meaning in this paper;
- mathematical kind (scalar, vector, matrix, tensor, set, sequence, function, distribution, operator) and shape, axes, domain, or unit when it affects interpretation;
- status: observed, derived, latent, predicted, target, learned, frozen, or optimized;
- index meanings and ranges; accents and decorations (hat, tilde, bar, prime, star, transpose, stop-gradient);
- paper-specific operators, norms, distances, indicators, expectations, and distributions;
- constants and hyperparameters, including what tradeoff a weight controls;
- the slide where the symbol is first defined.

For an objective, record the optimization variables, what is fixed, the direction of optimization, each term and weight, and whether it is a training loss, inference-time refinement, regularizer, or evaluation metric. For a probabilistic expression, record the random variables, the distribution and conditioning, and which randomness an expectation is over. If the paper leaves a symbol ambiguous, say so with a locator rather than inventing a definition.

## Final formula check

Before delivery, check every formula in the rendered PDF or slide images, where hover tooltips are absent:

- its source equation is recorded and matches the exact paper version;
- its role and what it does are clear on the slide;
- every symbol is defined on the slide where it first appears, inside that slide's single Notation box, and no definitions appear outside it;
- Notation boxes have the same style and position on every slide, with entries in compact columns rather than one full-width line each;
- its audit rows exist in `SOURCES.md`;
- in HTML decks, the glossary covers the deck's symbols and reports no unused keys;
- the formula is readable at presentation size.

A symbol whose first appearance has no on-slide definition, or a missing audit entry, is a blocker. Hover coverage does not resolve it.
