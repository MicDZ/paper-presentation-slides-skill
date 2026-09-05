#!/usr/bin/env python3
"""Create a reproducible MBZUAI Beamer project for one research paper."""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path


MAIN_TEX = r"""\documentclass[aspectratio=169,11pt]{beamer}

\usepackage{amsmath,amssymb,bm,mathtools}
\usepackage{booktabs,multirow,array}
\usepackage{graphicx,adjustbox}
\usepackage{pifont}
\usetheme{MBZUAI}
\graphicspath{{assets/}{figures/}{paper-source/}}

\setbeamertemplate{navigation symbols}{}
\setlength{\abovedisplayskip}{5pt}
\setlength{\belowdisplayskip}{5pt}

\newcommand{\cmark}{\textcolor{mbzuai-navy}{\ding{51}}}
\newcommand{\xmark}{\textcolor{red!70!black}{\ding{55}}}
\newcommand{\strong}[1]{\textcolor{mbzuai-navy}{\textbf{#1}}}
\newcommand{\framesource}[1]{%
  \par\hfill{\tiny\color{mbzuai-subtle}#1}%
}

\title[@@SHORT_TITLE@@]{@@TITLE@@}
\subtitle{@@SUBTITLE@@}
\author[@@PRESENTER@@]{Paper by @@AUTHORS@@ -- Presented by \textit{@@PRESENTER@@}}
\institute[RCL]{@@VENUE@@}
\date{@@DATE@@}

\titlelogos{assets/logo_dark.pdf}
\footleft{@@FOOT_LEFT@@}
\footmid{@@FOOT_CENTER@@}
\footright{@@FOOT_RIGHT@@}

\begin{document}

{
\setbeamertemplate{footline}{}
\setbeamertemplate{frametitle}{}
\begin{frame}[t]
  \titlepage
\end{frame}
}

% Build an argument, not a copy of the paper's section order.
\section{Question and Thesis}

\begin{frame}{The paper's central question in one sentence}
  \small
  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.31\textwidth}
      \strong{Input}\par
      State what the method receives.
    \end{column}
    \begin{column}{0.34\textwidth}
      \strong{Output}\par
      State what it must produce or predict.
    \end{column}
    \begin{column}{0.31\textwidth}
      \strong{Why it is hard}\par
      Name the uncertainty, bottleneck, or tradeoff.
    \end{column}
  \end{columns}
  \framesource{Paper Sec. 1}
\end{frame}

\begin{frame}{The thesis should answer the question}
  \begin{block}{Paper's thesis}
    Replace this with one precise, source-backed claim.
  \end{block}
  \begin{alertblock}{Presenter roadmap}
    Name the minimum method mechanism and decisive evidence needed to evaluate it.
  \end{alertblock}
  \framesource{Paper Secs. 1 and 3}
\end{frame}

\section{Method}

\begin{frame}{The method title should state what changes and why}
  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.58\textwidth}
      \centering
      % \includegraphics[width=\linewidth,height=0.58\textheight,keepaspectratio]{overview.pdf}
      \fbox{\parbox[c][0.48\textheight][c]{0.9\linewidth}{\centering Place one legible original or adapted figure here.}}
    \end{column}
    \begin{column}{0.38\textwidth}
      \small
      \begin{enumerate}
        \item Name the representation or state.
        \item Explain the transformation.
        \item State the operational consequence.
      \end{enumerate}
    \end{column}
  \end{columns}
  \framesource{Paper Fig. X and Sec. Y}
\end{frame}

% Delete this frame when mathematics does not advance the talk.
\begin{frame}{The central equation must expose the mechanism}
  \small
  \begin{equation*}
    \widehat y_t=f_\theta(x_{1:t},c),
    \qquad
    \theta^\star=\arg\min_\theta \mathcal L(\widehat y_t,y_t).
  \end{equation*}
  \vspace{-2mm}
  {\centering
    \footnotesize
    \setlength{\tabcolsep}{3pt}
    \renewcommand{\arraystretch}{0.98}
    \begin{tabular}{@{}p{0.15\linewidth}p{0.19\linewidth}p{0.57\linewidth}@{}}
      \toprule
      \textbf{Symbol} & \textbf{Type / status} & \textbf{Paper-specific meaning and role} \\
      \midrule
      $t,1{:}t$ & index / range & Current step and inclusive input-history range. \\
      $x_{1:t},c$ & input / condition & Observed sequence and condition; give exact types and shapes. \\
      $f_\theta$ & learned function & Maps inputs to the prediction under parameters $\theta$. \\
      $\widehat y_t,y_t$ & prediction / target & Model output and target; the hat marks an estimate. \\
      $\mathcal L,\theta^\star$ & scalar / optimum & Training objective and its minimizing parameters; explain every term. \\
      \bottomrule
    \end{tabular}
    \par}
  \vspace{1mm}
  \begin{alertblock}{Operational meaning}
    \footnotesize Replace this scaffold with what the paper computes, what is optimized or fixed, and how the output drives the next method stage.
  \end{alertblock}
  \framesource{Paper Eq. X and Sec. Y}
\end{frame}

\section{Evidence}

\begin{frame}{The evaluation must test the stated thesis}
  \small
  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.43\textwidth}
      \begin{block}{Protocol}
        Dataset, split, sample count, preprocessing, hardware, and comparison conditions.
      \end{block}
    \end{column}
    \begin{column}{0.53\textwidth}
      \begin{block}{Metric meaning}
        Translate every reported metric into the question it answers.
      \end{block}
      \begin{alertblock}{Caveat}
        State conditional averaging, exclusions, or a comparability limitation.
      \end{alertblock}
    \end{column}
  \end{columns}
  \framesource{Paper Sec. X and Table Y}
\end{frame}

\begin{frame}{The decisive result, including its important exception}
  \begin{block}{Supported result}
    Report the exact value, denominator, metric direction, and test condition.
  \end{block}
  \begin{alertblock}{What it does not establish}
    State the strongest relevant exception or evidentiary boundary.
  \end{alertblock}
  \framesource{Paper Table X, Fig. Y, and Sec. Z}
\end{frame}

\section{Assessment}

\begin{frame}{What remains brittle}
  \small
  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.47\textwidth}
      \begin{block}{Method limits}
        Assumptions, scope, and failure modes.
      \end{block}
    \end{column}
    \begin{column}{0.49\textwidth}
      \begin{block}{Evidence and reproducibility limits}
        Dataset selection, missing uncertainty, unavailable code/data, or undisclosed settings.
      \end{block}
    \end{column}
  \end{columns}
  \framesource{Paper limitations and presenter assessment}
\end{frame}

\begin{frame}{Three takeaways for the audience}
  \begin{enumerate}
    \item One transferable representation or modeling lesson.
    \item One evidence or evaluation lesson.
    \item One open problem or deployment lesson.
  \end{enumerate}
  \begin{alertblock}{Discussion}
    End with one question that follows from a documented limitation.
  \end{alertblock}
  \framesource{Presenter synthesis based on the paper}
\end{frame}

{
\setbeamertemplate{footline}{}
\setbeamertemplate{frametitle}{}
\begin{frame}[t]
  \mbzuaiThankYou
\end{frame}
}

\end{document}
"""


SOURCES = """# Sources and provenance

Retrieval date for online sources: **@@RETRIEVED@@**.

## Paper identity

- Title: *@@TITLE@@*
- Authors:
- Stable identifier:
- Exact version/date used:
- Venue/status:
- Official landing page:
- Official PDF:
- Official TeX or HTML source:
- Supplementary material:
- License:

Keep immutable source copies under `paper-source/`. Record filenames and SHA-256 hashes for archived downloads.

## Figures and tables

| Local file | Paper locator | Original source | Adaptation | License | Use |
|---|---|---|---|---|---|

List used and archived assets. Mark each as unchanged, cropped, annotated, re-typeset, or reconstructed.

## Equations and derived values

- Record each transcribed equation locator and any notation changes.
- Record arithmetic derived from reported values, including operands and rounding.
- Do not reconstruct unavailable raw data.

## Data and code

- Repository/release/commit:
- Local snapshot:
- License:
- Implementation status at retrieval:
- Public data and transformations used for reconstructed visuals:

## Theme

- Repository: https://github.com/MicDZ/MBZUAI_Beamer_Theme
- Bundled commit: 061598c04f99f87a14172e239e3d0c54f96246a8
- License: MIT; see `THEME_LICENSE`

## Scope of interpretation

Separate paper-reported claims, derived values, and presenter synthesis. Record unresolved version, source, or reproducibility limitations.
"""


def materialize(template: str, values: dict[str, str]) -> str:
    result = template
    for key, value in values.items():
        result = result.replace(f"@@{key}@@", value)
    return result


def copy_theme(theme: Path, output: Path) -> None:
    for source in theme.glob("*.sty"):
        shutil.copy2(source, output / source.name)
    shutil.copytree(theme / "assets", output / "assets")
    shutil.copy2(theme / "LICENSE", output / "THEME_LICENSE")
    shutil.copy2(theme / "UPSTREAM.md", output / "THEME_UPSTREAM.md")
    shutil.copy2(theme / "README.md", output / "THEME_README.md")


def main() -> int:
    cli = argparse.ArgumentParser(
        description="Create an MBZUAI Beamer project for one paper presentation."
    )
    cli.add_argument("output", type=Path, help="new project directory")
    cli.add_argument("--title", default="Paper title", help="full LaTeX-safe paper title")
    cli.add_argument("--short-title", help="short title for headers and footers")
    cli.add_argument("--subtitle", default="Research paper presentation")
    cli.add_argument("--authors", default="Paper authors")
    cli.add_argument(
        "--presenter",
        required=True,
        help="presenter display name confirmed by the user",
    )
    cli.add_argument("--venue", default="RCL Reading Group")
    cli.add_argument("--date", default=r"\today", help="LaTeX-safe date/version line")
    cli.add_argument("--retrieved", default="YYYY-MM-DD")
    footer = cli.add_mutually_exclusive_group(required=True)
    footer.add_argument(
        "--confirm-default-footer",
        action="store_true",
        help="use confirmed short-title / session-by-presenter / slide-count footer",
    )
    footer.add_argument(
        "--footer",
        nargs=3,
        metavar=("LEFT", "CENTER", "RIGHT"),
        help="three LaTeX-safe footer fields confirmed by the user",
    )
    args = cli.parse_args()

    output = args.output.expanduser().resolve()
    if output.exists() and (not output.is_dir() or any(output.iterdir())):
        print(f"error: output directory is not empty: {output}", file=sys.stderr)
        return 2

    skill_dir = Path(__file__).resolve().parent.parent
    theme = skill_dir / "assets" / "MBZUAI_Beamer_Theme"
    required = [
        theme / "beamerthemeMBZUAI.sty",
        theme / "assets",
        theme / "UPSTREAM.md",
        theme / "LICENSE",
    ]
    missing = [str(path) for path in required if not path.exists()]
    if missing:
        print("error: bundled theme is incomplete: " + ", ".join(missing), file=sys.stderr)
        return 1

    short_title = args.short_title or args.title
    if args.confirm_default_footer:
        foot_left = short_title
        foot_center = rf"RCL Reading Group by \textit{{{args.presenter}}}"
        foot_right = r"\insertframenumber{} / \inserttotalframenumber"
    else:
        foot_left, foot_center, foot_right = args.footer

    values = {
        "TITLE": args.title,
        "SHORT_TITLE": short_title,
        "SUBTITLE": args.subtitle,
        "AUTHORS": args.authors,
        "PRESENTER": args.presenter,
        "VENUE": args.venue,
        "DATE": args.date,
        "RETRIEVED": args.retrieved,
        "FOOT_LEFT": foot_left,
        "FOOT_CENTER": foot_center,
        "FOOT_RIGHT": foot_right,
    }

    output.mkdir(parents=True, exist_ok=True)
    copy_theme(theme, output)
    for name in ("paper-source", "figures", "data", "build", "rendered"):
        (output / name).mkdir()
    (output / "main.tex").write_text(materialize(MAIN_TEX, values), encoding="utf-8")
    (output / "SOURCES.md").write_text(materialize(SOURCES, values), encoding="utf-8")
    print(f"Created MBZUAI Beamer paper-talk project: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
