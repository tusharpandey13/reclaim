# 0005. Status chips for variance, not colour

Status: Accepted

## Context

The design gives hue a strict job: red, ink and green say whether something is a problem, measured against the owner's own cushions and usual spending; ink tints and indigo carry amount only. Two pressures broke that in practice.

First, when blocks in a treemap or grid were shaded by how far they ran from usual, several unrelated groups ended up the same colour. On review the owner pointed out that shared colour visually groups things together, which was not intended. Second, the Tight layout first marked variance with up and down arrows. These looked foreign to the rest of the interface and needed their own explanation.

## Decision

Variance is told by the app's status chip, a word in a small tag, not by fill colour or by an arrow.

- The chip reads "Above", "Far above", "Below" or a quiet "Usual", from one ladder against the group's own usual. Gains on Invest use the same chip ("Up" with a percentage).
- In grids and treemaps, shade no longer encodes anything. Same colour means same group only.
- Chips sit beside the name on one line and hold a word or two. Anything longer goes in the sub-line.
- A chip must stay rare to mean something. Estimate chips appear only where a figure is really uncertain (mostly not on a statement, or a wide range), not on every figure with any doubt behind it.
- Every status step stays readable without colour, through a word, a mark or a printed number.

## Consequences

Colour can be used for identity in charts without implying judgement, and variance reads the same way on every page. Colour-vision differences matter less, since the word carries the state. The cost is width: a chip takes horizontal space a tint did not, which on 360 px phones forces wrapping and sometimes moves a chart under the name.

"Above" means unusual, not dangerous. Nothing in the variance ladder checks against the cushion; danger is the cushion rule's job (see 0007).

Rejected: arrows; colour-only variance; a chip on every estimated figure.
