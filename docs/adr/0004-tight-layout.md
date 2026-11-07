# 0004. Tight layout: one fact per line, explanations behind (i)

Status: Accepted

## Context

The frozen design was careful to explain itself. Every chart had a caption saying what its colours meant, sections opened with method notes, and Today carried a "How sure these figures are" section. Reviewing it on a design canvas, the owner's first comment was that every page held a lot of information and a person will not read it all: filler text, explanations, paragraphs.

Three lighter variants were drawn beside each screen. Lean moved explanations behind an icon and kept only the first sentence of subtitles. Glance folded every section after the first three into one-line rows. Tight went further and was the one the owner picked ("looks the best").

## Decision

Tight is the layout for phone and desktop.

- **One fact per line.** A row holds a name, at most one short chip or date, and one figure. Long sentences become a figure, a small period mark (a calendar glyph holding "30", "M" or "Y"), and a status chip.
- **Explanations sit behind an (i)** on the heading: legends, captions, method notes, chart read-outs and the working behind a figure. The (i) stays on the same line as the heading's last word.
- **Folded rows for the calm case.** Groups within their usual collapse into one line such as "Housing, Shopping and Travel: within usual". Desktop keeps them expanded, since it has the room.
- **Provenance moves to the foot.** The date, "updated" time and data sources leave the header and open from an "About this data" row.
- **All modals share one style**: a bottom sheet with a grab handle and close button on phone, a centred card on desktop.

## Consequences

The first screen is scannable, and the answer is no longer buried in its own justification. The cost is discoverability: a reader who wants to know what a colour means or how a range was made has to tap. Rules that made the frozen design honest still hold, only further down: every figure can still be tapped for its source and arithmetic, and every chart keeps a list twin.

Rejected: Glance as the default (too much folded, sections lost their identity); trimming text page by page without a shared rule; arrows for variance (replaced by chips, see 0005).
