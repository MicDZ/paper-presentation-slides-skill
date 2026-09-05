# Multi-paper reading-group talks

Read this reference only when several papers are presented in one session or merged into one PDF.

## Choose a session-level question

Give the collection one organizing question or pipeline. Place each paper at a distinct role rather than repeating five isolated background sections. For example, papers may address data generation, representation learning, world modeling, policy learning, and deployment as different links in one robotics pipeline.

Write one sentence for every transition: what assumption the previous paper leaves unresolved, and how the next paper changes the problem. Put the transition in speaker notes or on a lightweight bridge frame when the conceptual jump is large.

## Keep subdecks modular

- Give each paper its own exact identity, source provenance, and self-contained claim/evidence boundary.
- Reuse theme, footer, presenter naming, notation conventions, and source-locator style.
- Avoid repeating generic motivation. Refer back to the shared session question and explain what changes.
- Normalize terminology across papers only when meanings are genuinely compatible. Do not silently equate differently defined success rates, horizons, datasets, or action spaces.
- If time is constrained, prioritize one thesis, one method mechanism, one decisive result, and one limitation per paper.

## Merge and verify

Compile every subdeck successfully before merging. Merge only fresh PDFs and preserve a top-level bookmark for each paper. Use `pypdf`/`PyPDF2` or another deterministic PDF tool; do not rasterize the decks.

After merging, verify:

- paper order, page count, page size, orientation, and bookmark labels;
- consistent footers and no duplicate or stale outline entries;
- transitions and speaker notes match the final order;
- claims remain locally attributable to the correct paper;
- the combined file opens and renders from first to last page.

Keep each editable subdeck alongside the combined PDF. A merged PDF alone is not an editable deliverable.
