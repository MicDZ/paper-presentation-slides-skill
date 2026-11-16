# Shared project context (`talk-context.md`)

Read this when several decks share a presenter, venue, footer, or audience, or when a `talk-context.md` exists above the deck directory.

## Purpose

A reading group or lecture series usually repeats the same metadata and preferences across decks. Keep them in one `talk-context.md` in a common parent directory instead of re-confirming them per deck, and keep group-specific defaults out of the skill itself.

```text
reading-group/
  talk-context.md          shared context, written or approved by the user
  2026-09-mint/            one deck
  2026-10-streamsplat/     another deck
```

## Format

Flat `key: value` front matter between `---` lines, followed by free-form Markdown. `@@SHORT_TITLE@@`, `@@TITLE@@`, and `@@PRESENTER@@` in footer values are replaced per deck.

Footer values are HTML for HTML decks and LaTeX for Beamer decks. `footer_left/center/right` apply to both; `html_footer_*` and `beamer_footer_*` override them for one format, so a group that uses both can keep one file.

```markdown
---
presenter: Jane Doe
venue: Example Reading Group
format: html
footer_left: "@@SHORT_TITLE@@"
footer_center: "Example Reading Group by <em>@@PRESENTER@@</em>"
footer_right: "{page} / {total}"
beamer_footer_center: "Example Reading Group by \textit{@@PRESENTER@@}"
beamer_footer_right: \insertframenumber{} / \inserttotalframenumber
subtitle: Reading-group presentation
audience: researchers in 3D vision and robotics; comfortable with transformers and SE(3)
duration: 25 minutes plus discussion
notation_depth: expert
---

## Group preferences

- Prefer the paper's own figures; external figures only with a clear source.
- Background slides only when we agree on them beforehand.
- One discussion question at the end.
```

`new_slide_project.py` reads `presenter`, `venue`, `subtitle`, `date`, `format` (`html` or `beamer`; `--format` overrides it), and the footer keys. The agent reads every field, including the free-form body, when outlining and writing frames.

## Precedence

1. The user's instructions in the current conversation.
2. The deck's own existing files (`deck.html` or `main.tex`, `SOURCES.md`) when editing.
3. `talk-context.md` (nearest one above the output directory, or `--context <file>`).
4. This skill's defaults.

Command-line flags passed to `new_slide_project.py` override the file; `--no-context` ignores it.

## Rules

- Treat presenter and footer values in `talk-context.md` as confirmed only because the user wrote or approved the file. Tell the user which values you are using; do not ask again unless something is missing or contradicts the conversation.
- Create or edit `talk-context.md` only with the user's agreement, e.g. after they confirm metadata for the first of several decks.
- Do not copy context from an unrelated directory or from another group's decks.
