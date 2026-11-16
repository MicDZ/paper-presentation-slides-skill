# Formula notation and explanation

Read this reference whenever a deck contains displayed or inline mathematics. There are three layers, with different jobs:

- **The slide** defines every symbol of a formula explicitly, on the slide where the symbol first appears. This is what the audience relies on during the talk.
- **`SOURCES.md`** holds the complete formula audit (types, shapes, indices, status) for every formula.
- **The HTML notation hover** (HTML decks only) repeats meanings as tooltips. It is an auxiliary aid, mainly for Q&A, and never replaces on-slide definitions.

## Rule: define every symbol on the slide where it first appears

When a symbol appears in a formula for the first time in the deck, its meaning is written on that slide, visibly, in the rendered slide and PDF. This holds for every symbol, for every audience, including notation that is standard in the field. Common arithmetic and relation signs (`+`, `=`, `\le`, parentheses) are not symbols in this sense.

- Keep definitions short: an inline `where` list under the equation (`$z_t$: per-frame feature; $\theta$: network weights`), a two- or three-line key, or a compact `notation` table when there are many symbols.
- A symbol already defined on an earlier slide need not be redefined. Repeat a short reminder when the gap is large or the symbol is easy to confuse; never write "see Slide 8".
- Audience depth changes how much you say about a symbol (an expert audience does not need the type and shape of a SE(3) pose spelled out), not whether you define it.
- Remove a formula the explanation does not use rather than displaying it with undefined symbols.

## What an equation slide needs

1. **Why it is here:** its role (definition, transformation, objective, update rule, estimator, metric), what it consumes and produces, and where the output goes next in the data flow. One line, or the slide title, is often enough.
2. **Definitions of every newly introduced symbol** (see the rule above).
3. **What it does:** what minimizing, maximizing, conditioning on, or changing the important quantities achieves. For a multi-term objective, group terms by function and say what each encourages.

Do not satisfy these with a verbal reading such as "the loss is the sum of several terms", and do not restate the equation symbol by symbol in prose. Define the symbols, then explain the mechanism.

## Notation hover in HTML decks (auxiliary only)

The HTML theme shows a symbol's meaning when the mouse hovers over it in a formula (glossary in `<script type="application/json" id="notation">`, harvested `table.notation` rows, or `\explain{}{}`; see `theme/AUTHORING.md`, section 5a).

- Treat it strictly as an aid. In a normal talk the presenter does not hover over symbols; it is for Q&A, when someone asks what a symbol means, and for rehearsal (press `g` to underline covered symbols).
- It never counts as defining a symbol. Tooltips do not appear in the PDF, in screenshots, or on a projector the audience watches while nobody hovers.
- Still fill the deck glossary for every symbol in the deck's formulas, with one short sentence and a `type`, consistent with the on-slide definition. The build helper reports glossary keys that never match a formula (`unusedDeckKeys`) so misspelled keys can be fixed.
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
- every symbol is defined on the slide where it first appears;
- its audit rows exist in `SOURCES.md`;
- in HTML decks, the glossary covers the deck's symbols and reports no unused keys;
- the formula is readable at presentation size.

A symbol whose first appearance has no on-slide definition, or a missing audit entry, is a blocker. Hover coverage does not resolve it.
