# Formula notation and explanation

Read this reference whenever a deck contains displayed mathematics. Audit each displayed formula independently; familiarity from an earlier paper section or hidden speaker notes does not make slide notation self-explanatory.

## Required explanation layers

Every displayed formula needs all three layers on the same frame, or across immediately adjacent frames with an explicit pointer:

1. **Operational role:** identify whether it is a definition, representation, transformation, probability, constraint, optimization objective, update rule, estimator, or evaluation metric. State what it consumes, what it produces, and where the output goes next in the method.
2. **Complete notation key:** define every uncommon symbol and every paper-specific use of a common symbol.
3. **Behavioral meaning:** explain what changing, minimizing, maximizing, conditioning on, or marginalizing each important quantity does.

Do not satisfy these layers with a verbal reading such as “the loss is the sum of several terms.” Explain the mechanism.

## What the notation key must cover

For every relevant symbol, record the applicable fields:

- plain-language meaning in this paper;
- mathematical kind: scalar, vector, matrix, tensor, set, sequence, function, distribution, event, or operator;
- shape, axes, domain/codomain, or physical unit when it affects interpretation;
- observed, derived, latent, predicted, target, learned, frozen, or optimized status;
- index meaning and range, including time, batch, view, layer, sample, joint, or Gaussian indices;
- accents and decorations: hat/tilde/bar, prime, star, superscripts, subscripts, transpose, inverse, stop-gradient, or detached values;
- paper-specific operators, norms, distances, indicator functions, expectations, probability distributions, and conditioning bars;
- constants and hyperparameters, including whether a weight is non-negative and what tradeoff it controls.

Common arithmetic signs do not need definitions. Symbols such as `t`, `x`, `p`, `q`, `L`, or `E` still need definitions when their meaning is paper-specific. If the paper itself leaves a symbol ambiguous, say so with a source locator rather than inventing a definition.

## Objectives and probabilistic expressions

For an optimization objective:

- name the optimization variables and what is fixed;
- state the direction of optimization;
- explain every term and what minimizing/maximizing it encourages;
- explain each weight and any schedule or activation condition;
- distinguish training loss, inference-time refinement, regularization, and evaluation metrics.

For a probabilistic expression:

- name random variables and realized observations;
- identify the distribution and conditioning information;
- state which expectation is over which source of randomness;
- explain any factorization or independence assumption used by the method.

For tensor/matrix expressions, state shapes or axes when they are needed to understand broadcasting, attention, concatenation, projection, or aggregation.

## Slide layout

Prefer a large equation followed by either a compact notation table or two balanced notation blocks, plus one highlighted operational-meaning block. A useful notation table has columns such as `symbol / type or shape / paper-specific meaning and role`.

Do not compress a large equation, complete notation, and detailed interpretation into tiny text. Split into:

- a setup/notation frame followed by a mechanism frame; or
- an objective overview followed by term-by-term frames.

When notation is reused later, show a compact local reminder or explicitly point to the earlier notation frame. Audience memory is not a substitute for visible definitions.

## Final formula audit

Before delivery, enumerate every displayed formula and verify:

- its source equation/section is recorded;
- its operational role is stated;
- all uncommon symbols, indices, accents, operators, types/shapes, and units resolve visibly;
- all objective terms and optimization variables are explained;
- the explanation matches the exact paper version;
- the formula and notation remain readable in the rendered PDF.

Any unresolved item is a blocker. Remove a nonessential formula rather than presenting it without enough explanation.
