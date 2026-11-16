# Sources and provenance

Retrieval date for online sources: **2026-11-16**.

## Paper identity

- Title: *Attention Is All You Need*
- Authors: Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin
- Stable identifier: arXiv:1706.03762
- Exact version/date used: **v7, 2 Aug 2023** (as assigned; not the latest-revision default)
- Venue/status: NIPS 2017 (31st Conference on Neural Information Processing Systems); arXiv v7 is a later revision of the camera-ready paper
- Official landing page: https://arxiv.org/abs/1706.03762v7
- Official PDF: https://arxiv.org/pdf/1706.03762v7 → `paper-source/1706.03762v7.pdf`
  - SHA-256 `bdfaa68d8984f0dc02beaca527b76f207d99b666d31d1da728ee0728182df697`
- Official TeX source: https://arxiv.org/e-print/1706.03762v7 → `paper-source/1706.03762v7-src.tar.gz`, extracted to `paper-source/src/`
  - SHA-256 `2e7a7d9ee2520d22eb23dae0cb148e167be02a30d6cb3f11b1c67723194339c6`
  - TeX inspected recursively (`ms.tex` → `introduction`, `background`, `model_architecture`, `why_self_attention`, `training`, `results`, `visualizations`); inline `thebibliography`, no `.bib`. Nothing was compiled or executed.
- Supplementary material: none beyond the appendix (attention visualizations) in the main PDF.
- License: the PDF front page states: "Provided proper attribution is provided, Google hereby grants permission to reproduce the tables and figures in this paper solely for use in journalistic or scholarly works." The reading-group use here is scholarly.

## Figures and tables

| Local file | Paper locator | Original source | Adaptation | License | Use |
|---|---|---|---|---|---|
| `figures/transformer-architecture.png` | Fig. 1 | `paper-source/src/Figures/ModalNet-21.png` | unchanged | paper grant (above) | Slide 4 |
| `figures/arch-crop-inputs.png` | Fig. 1 (bottom) | same | cropped (x 0–1, y 0.725–1.0) by `data/prepare_figures.py` | paper grant | Slide 5 |
| `figures/arch-crop-encoder.png` | Fig. 1 (encoder) | same | cropped (x 0–0.48, y 0.345–0.80) | paper grant | Slide 8 |
| `figures/arch-crop-decoder.png` | Fig. 1 (decoder + output) | same | cropped (x 0.50–1.0, y 0–0.745) | paper grant | Slide 9 |
| `figures/scaled-dot-product-attention.png` | Fig. 2 (left) | `paper-source/src/Figures/ModalNet-19.png` | unchanged | paper grant | Slide 6 |
| `figures/multi-head-attention.png` | Fig. 2 (right) | `paper-source/src/Figures/ModalNet-20.png` | bottom whitespace cropped | paper grant | Slide 7 |
| `figures/attention-vis-making.png` | Fig. 3 (appendix) | `paper-source/src/vis/making_more_difficult5_new.pdf` | rasterized at 300 dpi with `pdftoppm`; top 36 pt trimmed as the paper's own `trim=0 0 0 36`; white margin cropped | paper grant | Slide 17 |
| `figures/lr-schedule.png` | Eq. 3 | generated | plotted from Eq. 3 with the paper's $d_{\text{model}}=512$, $warmup\_steps=4000$, steps 1–100K; no values read from a figure | own work | Slide 10 |
| inline SVG (unrolled RNN) | Sec. 1 text | presenter diagram | presenter-drawn illustration of the recurrence the paper describes; the cell symbol $f$ is presenter notation | own work | Slide 2 |
| HTML table | Table 1 | `why_self_attention.tex` | re-typeset, all 4 rows; shaded row = presenter highlight | paper grant | Slide 3 |
| HTML table | Table 2 | `results.tex` | re-typeset, all 10 rows; bold exactly as in v7 source (41.29, 28.4, 41.8, $3.3\cdot10^{18}$) | paper grant | Slide 12 |
| HTML tables | Table 3 | `results.tex` | re-typeset, all 20 rows split across three slides (base+A+B; base+C; base+D+E+big). The base row is repeated on each slide for reference; bold (4.33, 26.4) as in the paper | paper grant | Slides 13–15 |
| HTML table | Table 4 | `results.tex` | re-typeset, all 12 rows; row labels verbatim incl. the paper's "el al." typo; no bold in the paper | paper grant | Slide 16 |
| HTML table | — | Sec. 5.1, 6.1–6.3 | presenter summary of protocol | — | Slide 11 |

Figure preparation is reproducible: `python3 -I data/prepare_figures.py` (from the project root; needs Pillow, matplotlib, poppler `pdftoppm`).

## Formula audit

Deck equations are unnumbered; the paper locator is given on each slide's source line.

| Slide | Paper locator | Role | Symbol | Type / shape / status | Paper-specific meaning | Shown on slide? |
|---|---|---|---|---|---|---|
| 2 | Sec. 1 (text); formula is presenter notation | recurrence (background) | $h_t$ | vector; latent, computed | hidden state at position $t$ | yes (first def.) |
| 2 | Sec. 1 | " | $h_{t-1}$ | vector; latent | previous hidden state | yes |
| 2 | Sec. 1 | " | $x_t$ | vector; observed input | input for position $t$ | yes |
| 2 | presenter | " | $f$ | function; learned | recurrent cell (LSTM/GRU); not named in paper | yes |
| 2, 3 | Sec. 1, Table 1 | " | $n$ | scalar (integer) | sequence length | yes (slide 2; again slide 3) |
| 3 | Table 1 caption | complexity analysis | $d$ | scalar | representation dimension | yes |
| 3 | Table 1 caption | " | $k$ | scalar | convolution kernel size | yes |
| 3 | Table 1 caption | " | $r$ | scalar | neighborhood size, restricted self-attention | yes |
| 3 | Table 1 | " | $O(\cdot)$ | operator | asymptotic order | yes |
| 4 | Sec. 3 | I/O definition | $(x_1,\dots,x_n)$ | sequence of symbol representations; observed | encoder input | yes |
| 4 | Sec. 3 | " | $\mathbf{z}=(z_1,\dots,z_n)$ | sequence of vectors in $\R^{d_{\text{model}}}$; computed | encoder output, consumed by every decoder layer | yes |
| 4 | Sec. 3 | " | $(y_1,\dots,y_m)$, $m$ | sequence of symbols; predicted (target at training) | decoder output, generated auto-regressively; $m$ its length | yes |
| 4 | Sec. 3.1 | hyper-parameter | $N$ | integer; fixed (6) | layers per stack | yes |
| 4 | Sec. 3.1 | hyper-parameter | $d_{\text{model}}$ | integer; fixed (512 base, 1024 big) | width of all sub-layer outputs and embeddings | yes |
| 5 | Sec. 3.5 (unnumbered align) | fixed encoding added to embeddings | $PE_{(pos,2i)}$, $PE_{(pos,2i+1)}$ | matrix entries (position × dim); fixed, not learned | sinusoidal positional encoding | yes |
| 5 | Sec. 3.5 | " | $pos$ | index, $0,1,\dots$ | token position | yes |
| 5 | Sec. 3.5 | " | $i$ | index, $0\le 2i\lt d_{\text{model}}$ | dimension-pair index | yes |
| 5 | Sec. 3.4 | scaling | $\sqrt{d_{\text{model}}}$ | scalar | embedding weight multiplier | yes |
| 6 | Eq. 1 | core attention operator | $Q$ | matrix, (#queries × $d_k$); computed | packed queries | yes |
| 6 | Eq. 1 | " | $K$ | matrix, (#keys × $d_k$); computed | packed keys | yes |
| 6 | Eq. 1 | " | $V$ | matrix, (#keys × $d_v$); computed | packed values | yes |
| 6 | Eq. 1 | " | $d_k$, $d_v$ | integers; fixed (64 base) | key/query and value dims | yes |
| 6 | Eq. 1 | " | $K^T$ | transpose | transpose of $K$ | yes |
| 6 | Eq. 1 | " | $\mathrm{softmax}$ | operator, row-wise over keys | attention weights sum to 1 per query | yes |
| 6 | Sec. 3.2.1 footnote 4 | scaling argument | $q$, $k$, $q_i$, $k_i$ | vectors / components; assumed i.i.d. mean 0, var 1 | why $q\cdot k$ has variance $d_k$; here $i$ indexes components $1..d_k$ (slide-local glossary override) | yes |
| 7 | Sec. 3.2.2 (unnumbered align) | multi-head attention | $h$ | integer; fixed (8 base, 16 big) | number of heads | yes |
| 7 | Sec. 3.2.2 | " | $\mathrm{head_i}$, $i$ | matrix; computed; $i=1..h$ | output of head $i$ (slide-local override for $i$) | yes |
| 7 | Sec. 3.2.2 | " | $W^Q_i, W^K_i$ | $\R^{d_{\text{model}}\times d_k}$; learned | per-head query/key projections | yes |
| 7 | Sec. 3.2.2 | " | $W^V_i$ | $\R^{d_{\text{model}}\times d_v}$; learned | per-head value projection | yes |
| 7 | Sec. 3.2.2 | " | $W^O$ | $\R^{hd_v\times d_{\text{model}}}$; learned | output projection | yes |
| 7 | Sec. 3.2.2 | " | $\mathrm{Concat}$, $\R$ | operator; set | concatenate head outputs; real numbers | yes |
| 8 | Sec. 3.1 | residual + normalization wrapper | $x$, $\mathrm{Sublayer}$, $\mathrm{LayerNorm}$ | vector in $\R^{d_{\text{model}}}$; function; operator | sub-layer input; wrapped attention/FFN; layer normalization | yes |
| 8 | Eq. 2 | position-wise FFN | $W_1$, $b_1$ | $\R^{d_{\text{model}}\times d_{ff}}$, $\R^{d_{ff}}$; learned (shapes implied by Sec. 3.3 dims) | first linear map | yes |
| 8 | Eq. 2 | " | $W_2$, $b_2$ | $\R^{d_{ff}\times d_{\text{model}}}$, $\R^{d_{\text{model}}}$; learned | second linear map | yes |
| 8 | Eq. 2 / Sec. 3.3 | " | $d_{ff}$, $\max(0,\cdot)$ | integer (2048 base, 4096 big); operator | inner width; ReLU | yes |
| 9 | Sec. 3.2.3 | decoder masking | $-\infty$ | constant | softmax inputs of illegal (future) connections; $i$ here = output position (slide-local override) | yes |
| 10 | Eq. 3 | learning-rate schedule (training) | $lrate$ | scalar; function of step | Adam learning rate | yes |
| 10 | Eq. 3 | " | $step\_num$ | integer index | current training step | yes |
| 10 | Eq. 3 | " | $warmup\_steps$ | integer hyper-parameter (4000) | linear warm-up length; afterwards decay ∝ $step\_num^{-0.5}$ | yes |
| 10 | Sec. 5.3 | optimizer | $\beta_1$, $\beta_2$, $\epsilon$ | hyper-parameters (0.9, 0.98, $10^{-9}$) | Adam moment decays, stability constant | yes |
| 10 | Sec. 5.4 | regularization | $P_{drop}$, $\epsilon_{ls}$ | hyper-parameters (0.1, 0.1 base) | residual dropout rate; label smoothing | yes |
| 11 | Sec. 6.1 | decoding | $\alpha$ | hyper-parameter (0.6 MT, 0.3 parsing) | beam-search length penalty | yes |
| 13–15 | Table 3 header | ablation axes | $N, d_{\text{model}}, d_{ff}, h, d_k, d_v, P_{drop}, \epsilon_{ls}$ | as above | reminders printed on each Table 3 slide | yes (reminder) |
| 18–19 | Table 1 | recap | $O(n^2\cdot d)$, $O(n)$, $PE$ | as above | recalled, already defined | n/a |

Glossary: 56 deck entries; QA reports `unusedDeckKeys: []`, `fallbackFormulas: 0`. Slide-local overrides for $i$ on slides 6, 7, 9.

## Equations and derived values

- Eq. 1 (slide 6), Sec. 3.2.2 align (slide 7), Sec. 3.5 align (slide 5), Eq. 2 (slide 8), Eq. 3 (slide 10) are transcribed from `model_architecture.tex` / `training.tex` with the macro `\dmodel` expanded to `d_{\text{model}}`; `\frac`/`\mathrm` kept. Eq. 3 is line-broken for width only.
- $\mathrm{LayerNorm}(x+\mathrm{Sublayer}(x))$ is the inline expression from Sec. 3.1.
- $h_t=f(h_{t-1},x_t)$ (slide 2) is presenter notation for the Sec. 1 sentence "a sequence of hidden states $h_t$, as a function of the previous hidden state $h_{t-1}$ and the input for position $t$".
- Derived (slide 14): parameter ratios $168/65 = 2.58 \approx 2.6\times$ and $90/65 = 1.38 \approx 1.4\times$; BLEU gap $25.8-23.7=2.1$ for $N=2$. Slide 13: $25.8-24.9 = 0.9$ (also stated in paper Sec. 6.2).
- Slide 10 plot: peak $lrate \approx 6.99\cdot10^{-4}$ at step 4000 (computed, not reported in the paper).
- **Version inconsistency (v7):** Table 2 and the abstract give EN-FR BLEU **41.8** for Transformer (big); Sec. 6.1 text says **41.0**. Shown on slide 12 and slide 18. v7 also bolds both 41.29 (ConvS2S Ensemble) and 41.8; reproduced as is.
- Training-cost FLOPs in Table 2 are the authors' estimates (time × #GPUs × assumed sustained TFLOPS: 2.8, 3.7, 6.0, 9.5 for K80, K40, M40, P100; footnote 5).

## Data and code

- Repository/release/commit: none used. The paper mentions tensor2tensor in the v7 text; no code was retrieved or run.
- Local snapshot: none.
- License: n/a.
- Implementation status at retrieval: not checked.
- Public data and transformations used for reconstructed visuals: only Eq. 3 (formula) for `figures/lr-schedule.png`; script `data/prepare_figures.py`.

## Theme

- Deck format: html
- Repository/source: https://github.com/MicDZ/MBZUAI_Beamer_Theme.git
- Requested ref: `bundled submodule`
- Resolved commit: `f15be7830bad632332a7f071d88dd5f9b7fcf669 (with uncommitted local changes)` — the skill's bundled submodule had uncommitted changes at initialization, so this commit alone does not reproduce the theme; the local `theme/` copy is authoritative.
- License: MIT; see `THEME_LICENSE`
- Local provenance: `THEME_UPSTREAM.md`

## Scope of interpretation

- Paper-reported: all table values, hyper-parameters, figure content, and the 41.0/41.8 discrepancy.
- Presenter synthesis: slide titles, slide 2 diagram, "Problem/How/Why" phrasings, slide 18 assessment table, slide 19 takeaways and discussion question, shaded-row highlights (marked on slides).
- Caveats kept off slides: Table 2 baselines are numbers reported by their own papers, not re-run; parsing used beam 21 and $\alpha=0.3$ (Sec. 6.3); checkpoint averaging (last 5 base / last 20 big).
- Metadata not confirmed by the user: presenter shown as "Presenter Name" and the default footer (`Attention Is All You Need | Session by Presenter Name | page / total`).
- Background: one background slide (seq2seq/RNN sequential bottleneck) was included without explicit user acceptance, per the task instructions; others were not added.
