# MBZUAI Beamer Theme

A LaTeX Beamer presentation theme based on the **Mohamed bin Zayed University of Artificial Intelligence (MBZUAI)** brand guidelines (March 2026, V1).

## Features

- 🎨 Official MBZUAI brand colors
- 📐 16:9 widescreen layout
- 🖼️ Frametitle banner with subtle pattern background
- 📄 Custom title page and "Thank You" slide
- 🧱 Styled blocks (standard, alert, example)
- 📊 Brand-colored tables
- 🔷 Diamond bullet markers in table of contents

## Preview

<p align="center">
  <img src="assets/slides/slide-01.jpg" width="800" alt="Title Slide"><br>
  <em>Title Slide</em>
</p>

<p align="center">
  <img src="assets/slides/slide-02.jpg" width="800" alt="Outline"><br>
  <em>Outline</em>
</p>

<p align="center">
  <img src="assets/slides/slide-04.jpg" width="800" alt="Content with Blocks"><br>
  <em>Content with Blocks</em>
</p>

<p align="center">
  <img src="assets/slides/slide-05.jpg" width="800" alt="Two Column Layout"><br>
  <em>Two Column Layout</em>
</p>

<p align="center">
  <img src="assets/slides/slide-07.jpg" width="800" alt="TikZ Diagram"><br>
  <em>TikZ Diagram</em>
</p>

<p align="center">
  <img src="assets/slides/slide-08.jpg" width="800" alt="Table Example"><br>
  <em>Table Example</em>
</p>

<p align="center">
  <img src="assets/slides/slide-10.jpg" width="800" alt="Thank You Slide"><br>
  <em>Thank You Slide</em>
</p>

## Installation

### Option 1: Local (recommended)

Copy the `beamerthemeMBZUAI/` directory to your project:

```bash
cp -r beamerthemeMBZUAI/ /path/to/your/project/
```

### Option 2: TeXMF (system-wide)

```bash
cp -r beamerthemeMBZUAI/ ~/Library/texmf/tex/latex/beamer/
```

## Usage

```latex
\documentclass[aspectratio=169, 11pt]{beamer}

\usetheme{MBZUAI}

\title[Short Title]{Your Presentation Title}
\subtitle{Subtitle Here}
\author[Author Name]{Author Name \\ \texttt{author@mbzuai.ac.ae}}
\institute[MBZUAI]{Mohamed bin Zayed University of Artificial Intelligence}
\date{\today}

\begin{document}

% Title slide (automatic)
\begin{frame}[t]
\titlepage
\end{frame}

% Content slides
\section{Introduction}
\begin{frame}{Introduction}
    \begin{itemize}
        \item Your content here
    \end{itemize}
\end{frame}

% Thank You slide
{
\setbeamertemplate{footline}{}
\setbeamertemplate{frametitle}{}
\begin{frame}[t]
    \mbzuaiThankYou
\end{frame}
}

\end{document}
```

## Available Colors

| Color | Hex | Usage |
|-------|-----|-------|
| `mbzuai-dark-navy` | `#0C2945` | Primary backgrounds, headers |
| `mbzuai-navy` | `#154677` | Secondary backgrounds |
| `mbzuai-sand` | `#E5C687` | Accent elements, highlights |
| `mbzuai-dark-sand` | `#8A764D` | Secondary accents |
| `mbzuai-light-gray` | `#F5F5F5` | Block backgrounds |
| `mbzuai-text` | `#1A1A1A` | Body text |
| `mbzuai-subtle` | `#666666` | Secondary text |

Use these colors in your presentation:

```latex
\textcolor{mbzuai-navy}{\textbf{Important text}}
\color{mbzuai-sand} highlighted text
```

## Customization

### Thank You Slide

The `\mbzuaiThankYou` macro creates a "Thank You" slide with:
- Subtle pattern background
- Navy header bar
- "Thank You" title
- "Questions?" subtitle
- Author and institute information

### Title Page

The title page is automatically generated from `\title`, `\subtitle`, `\author`, `\institute`, and `\date`. The title uses `\Huge` font size and automatically scales down when the text is too long to fit the page width.

## Regenerating the Banner

The frametitle banner (`assets/banner-bg.pdf`) is pre-built. To regenerate it:

```bash
cd assets/
pdflatex make-banner-bg.tex
cp make-banner-bg.pdf banner-bg.pdf
```

**Note:** Regenerating requires the MBZUAI pattern asset:
`MBZUAI-Patterns/CROPS/CMYK/PDF/MBZUAI_PATTERN_CROP 01_NAVY_CMYK.pdf`

## Building

**Recommended: use `latexmk` (handles multiple compilations automatically):**

```bash
cd beamerthemeMBZUAI/
latexmk -pdf demo.tex
```

**Or compile manually (at least twice):**

```bash
pdflatex demo.tex
pdflatex demo.tex
pdflatex demo.tex  # Ensures all overlays render correctly
```

> **⚠️ Why multiple compilations?**
>
> The title page and Thank You page backgrounds (pattern, navy bar) use TikZ's `remember picture, overlay` mechanism, which requires node positions to be written to the `.aux` file on the first pass and read back on the second pass. This is inherent to LaTeX.

## File Structure

```
beamerthemeMBZUAI/
├── beamerthemeMBZUAI.sty          # Main theme loader
├── beamercolorthemeMBZUAI.sty     # Brand color definitions
├── beamerinnerthemeMBZUAI.sty     # Title page, Thank You, blocks
├── beamerouterthemeMBZUAI.sty     # Frametitle, footline
├── beamerfontthemeMBZUAI.sty      # Font settings
├── assets/
│   ├── banner-bg.pdf              # Frametitle banner background
│   ├── pattern-bg.pdf             # Title/Thank You pattern
│   ├── logo_sand.pdf              # Sand logo (banner)
│   ├── logo_dark.pdf              # Dark logo (title/Thank You)
│   └── make-banner-bg.tex         # Banner source
├── demo.tex                       # Example presentation
├── README.md                      # This file
└── LICENSE                        # MIT License
```

## License

MIT License — see [LICENSE](LICENSE) for details.

## Brand Guidelines

This theme is based on the official MBZUAI Brand Guidelines (March 2026, V1). For the authoritative brand rules, refer to the official document.

**Pattern assets** are © Mohamed bin Zayed University of Artificial Intelligence and are included with permission for use in presentations.
