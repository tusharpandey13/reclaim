# Reclaim: visual design review

Read 2 November 2026. All data on screen is invented. Nothing was tested on a real phone or with a real person: this is a reading of guidelines and a measurement of renders.

**Verdict.** Reclaim has a stronger idea than most finance apps, and the finish of a first draft. The concept, colour rules and type pairing are right and shouldn't change. It looks amateur in a few fixable places: nothing responds to touch, the page label now outranks the page's answer, 26 font sizes do the work of 9, and the most important decision screen hides its consequence below the fold. Most fixes are one CSS layer, with colour values untouched.

**How to read the labels.** GUIDELINE: the source says it. EVIDENCE: research or measurement. PRACTICE: what apps do. TASTE: my judgement. "Proxy" means I read Material's values from Google's own code and repo docs, because m3.material.io returned only a page title.

## What I reviewed

The mocks changed during the review, as warned. A first pass measured a 22 px title in a 72 px bar. At 20:45 the mocks moved to 32 px titles and 92 px bars, Today's wordmark to 42 px, and the Line into its own dark panel. All figures below are from the re-measure at 20:51, confirmed unchanged at the end of the review.

| File | SHA-1 (first 10) | Modified |
|---|---|---|
| `mocks/home-mid.html` | 5a284e3ebb | 20:45 |
| `mocks/assets/till.css` | 3cf7a2bfb3 | 20:45 |
| `plan2/mocks/plan.html` | bd2b312823 | 20:45 |
| Spend, Bills, Invest, Reports | see `work/measure.json` | 20:45 |
| Names | d47e025d08 | 20:48 |

Rendered in Chromium with touch emulation at 360, 390, 430 and 1280 px, light and dark (desktop dark for Today and Plan only). Shots: `shots/current/`. Scripts and raw data: `work/`. Older measurement kept as `work/measure-first-pass.json`.

Plan's interior states (add, pick a month) come from the same `plan.html`. Other interior states were not exercised: what-ifs, sheets, and Spend's filters were read from existing shots or not at all.

---

## 1. Scorecard

Ratings: **Strong**, **Good**, **Weak**, **Poor**. Measured at 390 light across 11 screens unless stated. Contrast computed by the WCAG formula (`work/contrast.txt`).

| Criterion | Measured | Rating | Why |
|---|---|---|---|
| Visual hierarchy | Page title 32, answer 27, section 21, chart title 17. Today: wordmark 42, hero 72 | **Weak** | One real inversion: on every page but Today the label (32) outranks the answer (27). Their "answer first" rule loses to the header. Today's hero is excellent |
| Type scale, pairing | **26 sizes** (12.5 to 72): 5 half-pixel steps, 8 from `em` multiples. 7 to 16 per screen. 4 weights, 5 widths. Vollkorn figures tabular verified (`1111` = `0000` = 88 px); off by default (62.7 vs 98.9), so the setting matters | Pairing **Strong**, scale **Weak** | Serif figures with sans words is the app's best idea. But 15, 15.5, 16, 16.5, 17 are too close to read as levels, so they add noise without hierarchy |
| Spacing, rhythm | `s1`–`s7` exist. **36% of padding, gap and margin instances are off a 4 px grid** (3, 5, 6, 10, 14). Sections 48, margin 20, rows 64–72 | **Good** | Large rhythm is right and feels roomy. The off-grid values are inside components and hardly show. Debt more than defect |
| Colour, tonal roles | 5 hues (red, green, ink, indigo, amber). 13 text colours, 29 fills incl. ramps. `-on` pairs throughout. All body text at or above 4.5:1 in every state measured | **Strong** | Better discipline than most systems. Pale tones are fills only. Indigo only for investing. **One bug**, below |
| Elevation, surfaces | Paper, band, lift. band/paper 1.08, lift/paper 1.09 (light); lift/paper 1.23 (dark). No blur shadows, only strokes | **Good** | Flat and honest. Lift is nearly invisible in light, so a stroke is doing the work. Fine, since it's on purpose |
| Shape | CSS radii 2, 3, 4, 5, 6, 14, 17, 22, 24, 50% | **Weak** | Ten values where three would do. Not visible one at a time, but it's part of why details feel unsettled |
| Iconography | 3 status marks, 1 chevron, report icons. Tabs are words only | **Strong** | Means no icons to learn. Marks always sit with a word. A real design position |
| Motion, feedback | **0 `transition` rules, 0 `:active`, 0 `:hover`** in both stylesheets. Two animations: sheet 160 ms, save flash 1.1 s. Full-screen views switch instantly. Computed tap highlight `rgba(51,181,229,.4)` | **Poor** | The largest gap. The only touch response is the browser's default blue flash, which is a hue outside the palette, and it can outlive the tap: a pale box on the next screen is visible in `plan2/shots/10-add-390-light.png` |
| Navigation, headers | Titles 32 in a 92 bar; Plan 100 (with a demo line); Today 134 (16% of an 844 screen). Tab bar 60, 5 words | Tabs **Strong**, headers **Weak** | Tabs fine. The header is now loud enough but is competing, see hierarchy. Today spends 134 px on a name its only user already knows |
| Touch targets | Controls at or above 44 px. Below 48: Reports 78×44, See each month 109×44, How to read this 108×44, chips 44, segments, event pins 44×44, Spend matrix cells 57×46 | **Good** | Passes WCAG 24 and HIG 44. Misses Android's 48 by 4 px. Cheap to close, and thumbs are what matter here |
| Forms (Plan) | Input 52, amount 22 px, 3 fields. **Amount stays `222222` while typing**; commas appear only on re-render. Focus: inset stroke plus 3 px ring with 2 px gap | **Weak** | The form is short and clear. But an Indian amount without lakh commas is exactly where the owner's number rule matters most. The double ring looks heavy |
| Chips, buttons | Status chip 13 px, radius 4; filter chip 44, pill; primary 52, radius 6. One primary per screen | **Good** | Clear status grammar. **Save anyway** is the black primary on a bad choice, which encourages the wrong action |
| Charts | Direct labels, no legend, shaded band, month list one tap away. Band vs paper **1.21:1 light, 1.27 dark**. Solid black line plus dashed red line about 5 px apart at the floor. Label collisions: `Today ₹1.1 L` touching `Laptop, Feb`; title cut to `Car down…` | Approach **Strong**, finish **Weak** | The method agrees with Datawrapper, Carbon and ONS. The black line reads as zero and isn't (open in their own COLD-READ.md). Band is below 3:1; acceptable only because the ± text and month list carry the same fact |
| Empty, error, stale | `updated 6:10 am` line and "Nothing planned yet". Spec has no stale, loading or error state | **Poor** | For an app that's right only if its data is fresh, stale is a critical state. Nothing is designed |
| Dark mode | Own ramps, not inverted. Paper #161917, lift #262B26. Text at or above 4.5:1 in measured states | **Good, one bug** | **Plan's deep red in dark is `#FFA89C` with dark text; Today's is `#C8261B` with white.** SPEC.md rejects the pale version as "weak". Plan's build carries an old token. Conflict screen in dark is 8 pale pink tiles |
| Density | Today 2862 px, Spend 3314, Plan 3333, Bills 1684. Spend has 6 chart types | Top screens **Good**, Spend **Weak** | Top of each page is roomy. Spend asks to be learned: strips, treemap, a heat calendar, a heat matrix. I'd not cut it on looks alone, since its use isn't tested |
| Consistency | Same nav, same chips. Plan builds its own CSS copy and drifts. Section heads 21 on most pages, 17 on Today (`.hd`). Dashed tag, dashed box and dashed hatching mean related but different things | **Weak** | Drift comes from two builds and literal values, not from taste |
| Accessibility | Text contrast clean. Colour never alone. Rule/paper 1.98, /lift 2.16: fails 3:1 where it's the only edge of a control (Aug and Sep tiles, 2.16). All sizes in `px`. Overflow with narrow width as a large-text proxy: **Today 327 px wide in a 277 px screen** | **Good** | Better than typical. The font-scale case needs a real phone. Text scaling in Android Chrome is unverified, so the proxy only suggests a risk |
| Distinctiveness | Italic serif hero, draining column, word-only tabs, ink panel | **Strong** | It doesn't look like shadcn or Material, and it's tied to use. Protect this |

### Already good, as a sceptical designer

The hero on Today. The draining column. Words instead of icons. Status always as word plus mark. A palette with one job per hue. No legend on charts. Twelve tiles that already show the answer.

### Still looks amateur

1. Tap anything and nothing designed happens.
2. "Plan" shouts over "March could get tight."
3. A black line and a dashed red line stacked at the chart's floor.
4. Eight identical deep red tiles, when ₹44k and ₹2.2 L aren't the same problem.
5. `222222` in an Indian money field.
6. `Car down…` in a chart label.
7. A black primary button saying **Save anyway**.
8. Bills: `Fri 27, near soft cushion` is heavier than the bill's own name.

---

## 2. Each design language

### Flat, Swiss, Tufte

| | What | Why |
|---|---|---|
| **Adopt** | Flat surfaces with strong signifiers: underlined links, filled primary, stroked controls | NN/g: weak signifiers cost +22% time and +25% fixations (71 users, 9 page pairs; web pages, not an app, so it transfers imperfectly). EVIDENCE |
| Adopt | Direct labels, no legend, no chart frame | Datawrapper and Carbon agree. GUIDELINE |
| Adopt | Single left edge, ragged right, few sizes used firmly | TASTE. The Swiss sources weren't read, and I'm citing from memory |
| **Adapt** | Data-ink: remove what competes, not everything | Bateman 2010, Inbar 2007, Borgo 2012 don't support the claim that minimal is more accurate (abstracts and secondary reads, small samples, not exact-value tasks). Keep the band and the markers |
| Adapt | Sparklines and small multiples | Only where they replace something. Tufte from memory |
| **Reject** | Ultra-flat on the dense screens | NN/g says flat suits "low information density ... and high-contrast target elements". The conflict screen isn't low density |
| Reject | Swiss purity as an argument against Vollkorn | TASTE. The serif is the identity |

**Flat verdict:** keep flat. Fix its known weakness by making controls and responses obvious.

### Material 3 and Expressive

Status: Expressive is present in Android's Compose and component docs (proxy). It's not on the web in stable form: Material Web's README says "maintenance mode pending new maintainers", with Expressive only in labs pull requests. I couldn't read m3.material.io.

| | What | Why |
|---|---|---|
| **Adopt** | Pressed overlay at 10%, hover at 8%, from ink | State layer token 0.10 and 0.08 (proxy). Costs one token, fills the largest gap |
| Adopt | 48 px minimum target | Material components, web.dev (about 48 px, 8 px apart), Fluent on Android. GUIDELINE |
| Adopt | Colour and opacity change without overshoot | Effects springs have damping 1.0, derived by me from the tokens |
| **Adapt** | Tonal surface ladder, in neutral greys | M3 tones 4/10/12/17/22 in dark, purple baseline. Their paper, band, lift already has this shape |
| Adapt | Emphasized easing `(0.2,0,0,1)`, and durations from the short scale | Without spring physics, which needs JS |
| Adapt | Sheets: visible handle, 48 px target, max 640 px wide | Radius 16, not 28 (TASTE) |
| Adapt | Type ratios as a check | Body 16/24, headline 32/40. Tracking is tuned for Roboto: don't copy |
| **Reject** | Material colour roles and dynamic colour | Conflicts with functional colour. Hue would stop meaning something |
| Reject | Shape-morph buttons, FAB, floating toolbars, bouncy spatial springs | TASTE. Playful motion on money. The full-width button already does the job |
| Reject | Taking `@material/web` as a dependency | Maintenance mode |
| Reject | Flexible top app bar collapse | Page bars don't stick now. Added complexity with no answer in it. TASTE |

**Material verdict:** take its numbers and reject its look.

### Apple HIG and Liquid Glass

**Glass: reject.** Plainly: no glass, no blur, no translucent bars, in any part of Reclaim.

1. Apple's own rule excludes it. "Don't use Liquid Glass in the content layer" (HIG Materials). Reclaim is almost all content. GUIDELINE.
2. The tab bar is the only surface Apple would allow, and it gains nothing there. Text over scrolling figures can't be proved to pass AA, whereas an opaque bar can.
3. Apple has been backing away: more opacity in beta, a Clear/Tinted setting in 26.1, a transparency slider in iOS 27. Press reports, not Apple pages, so weak EVIDENCE. NN/g's critique is expert opinion with screenshots, not a study.
4. On Android it would be a costume. `backdrop-filter` works (Baseline 2024). Refraction with SVG displacement is an approximation of an OS compositor effect, reported Chromium-only by blogs. Cost on mid-range Android: **I found no measurement**. The one figure, 24 ms against 2 ms per frame, is Firefox.
5. Costs are asymmetric: a blur risks legibility of money figures and battery on the owner's phone, to gain a look that says nothing about money.

| | What | Why |
|---|---|---|
| **Adopt** (idea, not effect) | Controls and navigation as a separate layer from content | Opaque fill plus a rule line, as now |
| Adopt | "Tint only the primary action; colour belongs in content" | WWDC25 session 219. Same as their rule |
| Adopt | Reduced motion and an increased-contrast variant | HIG Accessibility |
| **Adapt** | Large title | They have it now at 32. HIG Large Title is 34/41. Don't copy the collapse |
| Adapt | Sheets with a grabber, swipe to dismiss, two heights | Only for long sheets |
| Adapt | 3 background tiers in dark | Already there |
| **Reject** | Glass, SF fonts and Symbols, iOS back gesture imitation | Licence and platform: this is Android first |

### Figma

**Figma is a tool, not a design language.** Its Simple Design System is a sample built in the tool, and it's a reference for token practice, not a look.

| | What | Why |
|---|---|---|
| **Adopt** | Two tiers: raw values, then role names | SDS uses primitive and semantic tokens. They nearly have this in `till.css` |
| Adopt | One name, values per theme | Figma's collection-and-mode idea, and already how `[data-theme]` works |
| **Adapt** | Variants as named properties: `button: primary, secondary, text`; `state: rest, pressed, focus, disabled`; `status: ink, r1–r3, g1–g3` | "You don't need a component for every possible combination" (Figma help) |
| **Reject** | DTCG JSON (stable 2025.10), Style Dictionary, Code Connect (paid seats), a Figma library | One person, one codebase, one consumer. Complexity with no user. Revisit only with a second consumer |

### Others

| System | Adopt or adapt | Reject |
|---|---|---|
| **Fluent 2** | "Only use one primary button in a layout." "Design for and include a 'no motion' setting." 4 px base | Segoe ramp, key plus ambient shadows |
| **Carbon** | Alert palette matches theirs (red danger, green success). "Avoid filling the chart frame with too many elements". Dark layers step lighter | Categorical palette, since theirs is semantic. Chart tick pages not read |
| **Polaris** | Nothing verified: every URL redirects to pages without this content. Minus before the symbol, from a search snippet only | Don't cite it |
| **Atlassian** | "Choose tokens based on meaning." Only raised and overlay surfaces get shadow | Numbered `space.150` names |
| **Radix, shadcn** | Step-to-job thinking; a single radius base; `x` with `x-on` pair, already done | Importing either. TASTE: the shadcn default is the generic look they've avoided |
| **Neumorphism** | Nothing | Low-contrast edges against the 3:1 rule (one blog's calculation; NN/g page not found) |
| **Glassmorphism** | Nothing | As above; no independent evidence read |
| **Brutalism** | Hard edges, heavy type, flat fills, already there. NN/g: "keep it limited to visual design" | Offset shadows, breaking hierarchy for effect |
| **Datawrapper, FT, ONS** | Direct labels; hand-placed; annotations for projections. ONS: "we use a shaded band around a central estimate", explained in plain language | Error bars on forecasts (Correll and Gleicher, secondary) |
| **Revolut, Monzo, Copilot, CRED, Groww** | Mostly unverifiable. I found no first-party writing on their type, charts or motion beyond Monzo's 2022 brand post and a Copilot article. The shape "one warm face plus one plain face" holds | Don't copy any specifics. No app was opened |
| **UPI apps** | Five-ish bottom tabs, bottom action, ₹ before the figure: low-confidence PRACTICE from blogs, conflicting on details. NPCI's page has no UX guidance | Their action-first home, since Reclaim is read-mostly |

India context (EVIDENCE, StatCounter October 2026): 360×800 is the largest single size at 15.71%, widths 360 to 393 dominate, and Chrome for Android is 88.32%. So 360 is the design width, not an edge case.

---

## 3. Recommendations

### Top 10

| # | Change | Where | Benefit | Effort | Source | Conflict with the owner's rules |
|---|---|---|---|---|---|---|
| 1 | **Give every tap a response.** `-webkit-tap-highlight-color: transparent`. On `:active`, overlay ink at 10% (paper at 20% on ink-filled). Hover 8% on desktop. Spec: `background-image: linear-gradient(var(--press), var(--press))`, no layout cost | Every button, row, tile, link | Largest perceived-quality gain. Tired user knows the tap landed | S | Material state layers (proxy); computed value | None. Blue flash goes away |
| 2 | **Answer outranks label.** Page title stays **32/36** but weight 500 in `ink2`. Answer **36/40**, 600, `ink`. Bar 84 px minimum: 28 top, 20 bottom. Remove the 16 px above the answer | All page headers, `h1.a` | Keeps their bigger header, restores answer-first. At 360 some answers wrap to 2 lines | S | HIG Large Title 34/41; M3 headline 32/40 (proxy); their own answer-first rule | **Today's wordmark 42 to 32 is their call**: it frees 50 px on the first view, but they may have asked for 42 |
| 3 | **Show the consequence where you choose.** Order: title, chart at 176 px, tiles, fixes, sticky foot. Dashed "Without it" line. Only the chosen expense's flag; no end label. Tile tap redraws in view | Pick a month | No scroll to see effect. All 12 tiles and the chart fit at 360×800 and 390×844 | M | Into the Breach (DESIGNER-SAID, see section 7); Carbon on chart clutter | Changes `plan2/SPEC.md` section 5 order |
| 4 | **Nine type roles, whole pixels.** 13 note, 14 small, 16 body, 18 row figure, 22 section, 32 title, 36 answer, 44 stat, hero clamp unchanged. Weights 400, 500, 600. Widths 96% and 90%. Remove inline sizes | `till.css`, `plan.css`, `plan.js` | Clearer levels; less drift | M | SDS, Fluent, HIG, M3 all use named roles (GUIDELINE); values TASTE | None. Body grows, chips grow to 14 |
| 5 | **One source of tokens.** Plan imports `till.css` at build; fix dark `--r3`. Share `[data-theme=dark], .tl` rather than copying 16 lines | Plan build, `.tl` | Fixes a real bug: red meaning differs between pages | S | Their SPEC; Carbon and shadcn theme pattern | None |
| 6 | **Clean the chart floor.** Remove the black line. Cushion: solid `r2` 1.5 px. Minimum: dashed `r3` 1 px. Strip fades over its last 35% so it doesn't read as a floor. Month ticks, 5 and 3 px. Band `t2` at 50% (1.41:1 light, 1.58 dark). Flag text is the first word, never `…` | Plan charts | Addresses their open "reads as zero" finding. Untested with a reader | S | COLD-READ.md; Datawrapper baseline note; Padilla on band edges argues against outlining the band | None |
| 7 | **48 px targets.** `.tlink`, `.btn-q`, chips, segments, pins, stepper at 48 by padding, no visual growth. Matrix cells to 48 high | All pages | Closes a 4 px gap | S | web.dev, Material, Fluent. HIG 44, WCAG 24 are lower | None |
| 8 | **Radius and edges.** 4 tags, 8 controls and tiles, 16 sheets, full for pills. Data blocks stay square. Control edges use `ink3` (6.14:1), not `rule` (1.98:1) | All pages | Settled look; passes WCAG 1.4.11 | S | Fluent, SDS ranges GUIDELINE; values TASTE | None |
| 9 | **Motion as state, nothing else.** 90 ms press, 160 ms state, 220 ms enter, easing `(0.2,0,0,1)`. Full screens and sheets rise 12 px and fade from .4. In production, chart line interpolates between months over 220 ms. No overshoot, no count-ups. Off with reduced motion | Full screens, sheets, toast, chart | Shows where things came from. Line movement is the feedback for a tile tap | M | Material tokens; Juul and Begy (juice rated higher, performance worse; small, preliminary) | "Motion only in answer to a touch" stays |
| 10 | **Design stale, loading, error, empty.** Stale over 24 h: amber `a0` strip with `?` mark under the header, "Last updated Mon 6:10 am. These numbers may be old." Loading: keep last numbers, no spinners or skeletons over money. Error: a sentence and Try again. Empty: "No big expenses yet", and the primary | All pages | Trust. A wrong-but-confident balance is the worst failure, and very costly compared to this small job | M | TASTE plus their trust grammar. No standard read on this | Amber stays "something only you can do"; a stale strip fits that |

### Next

| # | Change | Where | Benefit | Effort | Source | Conflict |
|---|---|---|---|---|---|---|
| 11 | Live lakh formatting in the amount field, with ₹; focus as a 2 px inset, no outer ring | Add form | Their number rule, where it counts | S | MDN `en-IN`; mocked | None |
| 12 | **Save anyway** becomes secondary; Save stays primary | Pick a month | Doesn't push a bad choice | S | Fluent one-primary; mocked | None |
| 13 | Red by size: Sell under a chosen amount uses `r2`, above it `r3`. Mock uses ₹1 L, an arbitrary line | Tiles | "Lightness shows how much" now holds within Sell | S | Their rule | Changes `plan2/SPEC.md` section 4. In dark, r2 is lighter than r3 but must still read as "less" there: review with them |
| 14 | Line panel at `--area: .82` on the ink panel | Today | The mint block stops being louder than the hero. 7.2:1 still | S | Their own `--area` rule; TASTE | None |
| 15 | Say what ± means once, near each chart: "Likely range: most months should land here" (with a real definition once back-tested) | Plan, Today | ± is read correctly | S | ONS (plain words); Correll on misread bars (secondary) | None. Must match the real interval |
| 16 | Bills sub-line at weight 400, not 600 | Bills | Name leads | S | Hierarchy | None |
| 17 | Today section heads 22, same as other pages | Today | Consistency | S | Measured | None |
| 18 | Test font scale on a real phone; fix Today's overflow | Today | Reachable at 130%? Unknown | M | Android 14 nonlinear scaling (native docs) | None |
| 19 | Test the bars with Chrome's edge-to-edge. `env()` on `bottom` as well as padding | Nav, CTA | Bar not hidden by the gesture area | S | Chrome docs | None |
| 20 | Show what's already in a slot: "Laptop" on the Feb tile | Tiles | Explains "same money" before the fix box | M | Slot idea, section 7 | Tile text gets tighter at 360: test |
| 21 | Quantile dot strip for one month, inside the month sheet | Month sheet | Better sense of the odds | L | Kay 2016 (abstract), but needs learning | **Possible conflict with no learning.** Low priority |
| 22 | Spend: try cutting one of the two heat views | Spend | Less to learn | M | Density; TASTE, no use data | Needs their view |

---

## 4. Proposed tokens

Live file: `mocks/tokens.css`. **All colour values stay as they are.**

| Group | Token | Value | Replaces |
|---|---|---|---|
| Type | `t-note` | 13/18 | 12.5, 13, 13.5 |
| | `t-small` | 14/20 | 14, 14.5, 15 secondary |
| | `t-body` | 16/24, 400–500 | 15, 15.5, 16, 16.5 |
| | `t-row` | 18/24 | 17, 19 |
| | `t-head` | 22/28, 600 | 21, 22, `.hd` 17 |
| | `t-title` | 32/36, 500, `ink2`, −.012em | 32 at 600 |
| | `t-answer` | 36/40, 600, −.018em | 27 |
| | `t-stat` | 44 | 44 |
| | `t-hero` | `clamp(60px,18.5vw,76px)` | Unchanged |
| Weight, width | | 400, 500, 600; 96% and 90% | 700; 88, 92, 100% |
| Spacing | `s1`–`s7` | 4, 8, 12, 16, 24, 32, 48 | Unchanged; ban literals in components |
| | `m`, section gap, rows | 20, 48, 64–72 | Unchanged |
| Radius | `rad-s`, `rad-m`, `rad-l`, full | 4, 8, 16, 999 | 2, 3, 4, 5, 6, 14, 17, 22, 24 |
| Surfaces | paper, band, lift | Unchanged | |
| Elevation | 0 page | paper | |
| | 1 card | lift | |
| | 2 fixed bar | lift with 1 px `rule`, opaque | |
| | 3 sheet | lift, `rad-l`, scrim | No blur shadow, no glass |
| Text | `ink`, `ink2`, `ink3` | Unchanged | |
| Lines | `rule`: decorative only; `ink3`: any control edge; `t1`: row divider | | `rule` on controls, `band` dividers |
| Red, green, ink | `r0–r3`, `g0–g3`, `t1–t4`, with `-on` | Unchanged | Fix Plan's dark `r3` |
| Invest, attention | `i1–i4`; `a0`, `a2` | Unchanged; one job each | |
| State | `press`, `press-on` | ink 10%; on ink fills paper 20%. Dark: 12%, ink 16% | Blue flash |
| Motion | `d-press`, `d-state`, `d-move` | 90, 160, 220 ms | Sheet 160 |
| | `ease` | `cubic-bezier(.2,0,0,1)` | |
| Target | minimum | 48 px, 8 px apart | 44 |
| Tab bar | height | 60 | Unchanged. M3 Expressive's 64 not needed |

**Already right, leave alone:** Vollkorn and Archivo, tabular figures, the colour ramps, the draining column, word-only tabs, status as word plus mark, no legend, the hero, 48 px section gap, 20 px margin, opaque bars.

**Button variants:** primary, secondary, text. Three, one primary per screen. Status comes from the status tokens. Don't add ghost or soft.

---

## 5. Before and after

Everything below is new under `review/`; originals untouched. "After" is the same HTML and JS with one added stylesheet and a few patches listed in `work/build_after.py`, which is a fair picture of the effort. Plan's after mock is interactive.

| Screen | Compare | Mock |
|---|---|---|
| Pick a month, the largest gain | `shots/ba/compare-pick-390-light.png`, `-dark.png` | `mocks/after-plan.html` |
| Plan opening | `shots/ba/compare-plan-390-light.png`, `-dark.png` | Same |
| Today | `shots/ba/compare-today-390-light.png`, `-dark.png` | `mocks/after-today.html` |
| Add form, small extra | `shots/ba/compare-add-390-light.png` | Same as Plan |
| Press state | `shots/ba/press-tile-after-390-light.png` (Aug) | |

Single shots at all widths: `shots/ba/{today,plan,add,pick}-{before,after}-{360,390,430,1280}-{light,dark}.png`.

**Checks on the after mocks** (`work/audit-after.json`): no overflow at 360, 390, 430, 1280; no text under AA; no script errors. Targets under 48 remaining on the screens covered: `What the shades mean` at 44 and desktop calendar cells at 45×54. Sizes per screen drop from 14–19 to 11–13: not 9, because I didn't rewrite Spend or Invest, and `em` multiples and a few inline sizes remain. Those need the real refactor.

**Costs you'd see:** Plan's first view shows about the same as before, since a bigger answer takes back what the tighter header saved. The second expense row is still cut by the fixed button, as it was. `Today ₹1.1 L` and `Laptop, Feb` on Plan's opening chart are still close.

---

## 6. Where the languages disagree

| Question | Positions | Resolved | Why |
|---|---|---|---|
| Target size | WCAG 24, HIG 44, Material, web.dev and Fluent-on-Android 48 | **48** | Android first, tired thumb. Costs padding only |
| Depth | Material: tone. Fluent, Atlassian: shadow. Apple: glass. Flat: none | **Tone plus stroke, no shadow, no blur** | Numbers need certainty, and it's measurable |
| Signifiers vs minimalism | NN/g vs ultra-flat | **Flat surfaces, explicit controls** | Evidence, within limits |
| Chart ink | Tufte vs Bateman, Inbar, Borgo | **Remove only what competes** | Evidence doesn't back maximal erasure, but precise reads differ from Holmes's charts |
| Icons in nav | HIG and Material assume icons | **Words only** | Owner's no-learning rule; 5 short words fit. Material's own rule on labels is met |
| Selected tab | Material Expressive: no bold on select. Reclaim: bold plus bar | **Keep bar; 600 vs 500** | Bar carries it; weight stays as reinforcement. Grid, so nothing shifts. TASTE |
| Tab bar height | Expressive 64, classic 80, Reclaim 60 | **60** | Measured fine, and Plan already has a stacked button |
| Primary action | Material FAB vs Fluent one primary vs full width | **Full-width, one primary, at the bottom** | Thumb, and no icon to learn |
| Motion | Expressive springs vs Apple fluid vs Fluent "no motion" option vs Swiss none | **Short, no overshoot, off on request** | Money isn't playful, but silence looks broken |
| Base grid | Atlassian, Carbon 8; Fluent, Reclaim 4 | **4, with mostly 8s** | Theirs already works |
| Header | HIG large title, Material small to flexible, Swiss modest | **32 fixed, not collapsing** | Owner asked for bigger. Collapse adds machinery |
| Red and green | Datawrapper warns on pure green with red. Carbon uses both | **Keep, with word and mark** | Word and mark already solve this; their green isn't pure |
| Identity vs convention | Follow Android vs be distinctive | **Conventional controls, distinctive content** | Nothing to learn, and character from figures and charts |
| Games vs calm | Juice vs restraint | **Restraint**, see below | Section 7 |

---

## 7. Game UIs

**Evidence warning.** Sourcing was thin. Game UI Database, GDC Vault, Paradox's forum and most press pages were blocked, gated or truncated. Read in full: only the Juul and Begy abstract and the Singhal project page. The rest are interviews, headlines or search snippets. Anno, Cities: Skylines, Football Manager, XCOM, Darkest Dungeon, RimWorld, Oxygen Not Included, Hades, Destiny, Clash Royale, Monument Valley: **no readable source, so nothing is claimed about them**. Descriptions of how a game looks on screen are from memory unless stated. No user test.

| Verdict | Idea | Source and label | Where in Reclaim | Why |
|---|---|---|---|---|
| **Adopt** | Show the outcome on the choice, before you commit | Into the Breach. Justin Ma: "every enemy attack is telegraphed", "it's very clear how or why you failed" (DESIGNER-SAID, gamedeveloper.com). Board visuals from memory | Pick-a-month tiles. They already do this, and it's the app's best idea | Words and figure on each tile. Nothing to learn. **In top 10, #3** |
| **Adopt** | Preview the placement on the existing picture | Into the Breach, Slay the Spire intent (OBSERVED, snippets only) | Plan chart above the tiles, with dashed "Without it" | Tile tap isn't commit; Save is. Mocked |
| **Adopt** | Tap to place, never only drag | TASTE. Mini Metro "very fiddly" on phones (snippet) | Tiles | Their spec already removed drag. Keep it gone |
| **Adapt** | Thresholds labelled at the line | Convention, from memory | Plan chart, Today's cushion marks | Solid and dashed differ without colour. Labels there, already partly done |
| **Adapt** | "Why this number", one level only | Victoria 3 nested tooltips (OBSERVED; diary blocked). Devs: "learn ... as you play" (DESIGNER-SAID). That's the trap | Today's hero, Spend blocks, Invest blocks | One sheet, tap to open. No hover, no nesting. Already their rule: "any figure can be tapped" |
| **Adapt** | Slots show what's in them | Inventory and base screens, from memory | Feb tile: "Laptop" | **Next list, #20.** Space at 360 is tight |
| **Adapt** | Fine detail with a job: ticks, consistent frames | Mini Metro talk blurb only ("beauty through elimination"). TASTE | Month ticks (mocked). One stroke weight per job | Only where they aid reading. Not ornament |
| **Adapt** | Short confirm on commit | Juul and Begy 2016: juicy version "rated higher", "performed worse" (EVIDENCE, abstract, preliminary). Singhal 2021: haptics improved player experience, 38 people (EVIDENCE; games only) | Save: existing flash on the new row. Tile tap: line moves | Performance cost matters more than enjoyment here. Haptics: Android web vibration not tested |
| **Adapt** | Distinct style that's still readable | Persona 5: Hashino said menus were "impossible to read at first" (headline only) | Hero, Line panel | A warning, more than a model. Legibility first |
| **Reject** | Points, streaks, levels, rewards, celebrations, sound | Owner's rule; Juul and Begy | Everywhere | Money decisions must not feel like a game |
| **Reject** | Learned icons, intent symbols alone | Slay the Spire needs learning | Tiles, nav | No-learning rule |
| **Reject** | Hover tooltips, dense panels, hotkeys | Grand strategy, from memory | All | Phone, thumb, tired |
| **Reject** | Screen shake, particles, count-ups, overshoot | Vlambeer talks (video, not read); from memory | All | Calm. A counting figure is a false figure for a moment |
| **Reject** | Slanted, animated menu style | Persona, from memory | Nav, headers | Fails calm and legibility |

**In the top 10:** only consequence preview (#3), and motion restraint as support for #9. No game source covers uncertainty bands, so ± gets nothing from this section.

---

## 8. What I couldn't verify

- **No real phone.** No Android device, no real Chrome text scaling, no real tap feel, GPU cost, or gesture bar behaviour. `:active` timing on a real Android Chrome is unverified; the fix may need a short minimum.
- **Guidelines read, not user-tested.** The after mocks have had no reader. The claim that they read better is my judgement, and the before chart's "reads as zero" finding came from model readers, not people.
- **Material:** values from code and repo docs (proxy), summarised by a tool and not byte-checked. Published m3.material.io pages unread, including layout grid and spacing. Emphasized type tokens provisional.
- **Apple:** HIG read through JSON, with typography and colour truncated. Navigation bars, motion, haptics, dark mode pages and WWDC session 356 not read. iOS 26.1 and 27 facts from press.
- **Evidence read second-hand:** Bateman, Kay, Correll, Fernandes, Padilla, Borgo, Inbar through abstracts or snippets. Tufte, Müller-Brockmann, Ruder, Bringhurst books not read.
- **Not read at all:** FT Chart Doctor columns (only the Visual Vocabulary README), Polaris content, Figma's DTCG export statement, a Datawrapper post on uncertainty, NN/g on neumorphism, Carbon axis pages.
- **Finance and UPI apps:** no app opened. Very little first-party writing exists. Nothing here says what Revolut, Groww or CRED's type scale is.
- **Large text:** narrow-width overflow is a proxy, not font scaling.
- **Not exercised:** what-if screens, Reports actions, sheets, Spend filters.

## Sources

Read 2 November 2026. Full tables with labels and every failed URL: `notes/`.

**Flat, Swiss, charts:** [NN/g flat UI study](https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/), [NN/g flat design](https://www.nngroup.com/articles/flat-design/), [ONS uncertainty](https://service-manual.ons.gov.uk/data-visualisation/guidance/showing-uncertainty-in-charts), [Datawrapper colour keys](https://www.datawrapper.de/blog/color-keys-for-data-visualizations), [Datawrapper line charts](https://www.datawrapper.de/blog/line-charts), [Datawrapper colours](https://www.datawrapper.de/blog/beautifulcolors), [FT Visual Vocabulary](https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary), [Carbon palettes](https://carbondesignsystem.com/data-visualization/color-palettes/), [Carbon chart anatomy](https://carbondesignsystem.com/data-visualization/chart-anatomy/), [Carbon 2x grid](https://carbondesignsystem.com/elements/2x-grid/overview/), [Butterick figures](https://practicaltypography.com/alternate-figures.html), [Kay 2016](https://idl.uw.edu/papers/when-ish-is-my-bus), [Padilla 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5626802), [Bateman, via Eagereyes](https://eagereyes.org/blog/2010/chart-junk-considered-useful-after-all)

**Material (proxies):** [androidx Compose material3 tokens](https://github.com/androidx/androidx/tree/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3), [material-components-android docs](https://github.com/material-components/material-components-android/tree/master/docs), [Android M3 in Compose](https://developer.android.com/develop/ui/compose/designsystems/material3), [Material Web](https://github.com/material-components/material-web)

**Apple:** [HIG Materials JSON](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/materials.json), [WWDC25 219](https://developer.apple.com/videos/play/wwdc2025/219/), [Apple Newsroom](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/), [NN/g Liquid Glass](https://www.nngroup.com/articles/liquid-glass/), [MDN backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter), [caniuse](https://caniuse.com/css-backdrop-filter), [Firefox bug 1732817](https://bugzilla.mozilla.org/show_bug.cgi?id=1732817), [MacRumors iOS 27](https://www.macrumors.com/2026/06/10/how-liquid-glass-is-changing-in-ios-27/)

**Tokens and systems:** [Figma SDS](https://github.com/figma/sds), [Figma variables](https://help.figma.com/hc/en-us/articles/14506821864087-Overview-of-variables-collections-and-modes), [Figma variants](https://help.figma.com/hc/en-us/articles/360056440594-Create-and-use-variants), [DTCG](https://www.designtokens.org/), [Fluent type](https://fluent2.microsoft.design/typography), [Fluent layout](https://fluent2.microsoft.design/layout), [Fluent motion](https://fluent2.microsoft.design/motion), [Fluent button](https://fluent2.microsoft.design/components/web/react/core/button/usage), [Carbon colour](https://carbondesignsystem.com/elements/color/overview/), [Atlassian tokens](https://atlassian.design/foundations/tokens/design-tokens), [Atlassian elevation](https://atlassian.design/foundations/elevation), [Radix scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale), [shadcn theming](https://ui.shadcn.com/docs/theming), [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [WCAG target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

**Practice and Android:** [StatCounter India screens](https://gs.statcounter.com/screen-resolution-stats/mobile/india), [StatCounter India browsers](https://gs.statcounter.com/browser-version-market-share/mobile/india), [Hoober 2013](https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php), [Chrome edge-to-edge](https://developer.chrome.com/docs/css-ui/edge-to-edge), [Android edge-to-edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge), [Android 14 font scaling](https://developer.android.com/about/versions/14/features), [web.dev tap targets](https://web.dev/articles/accessible-tap-targets), [MDN NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat), [Copilot, by Apple](https://developer.apple.com/articles/copilot-money), [Monzo 2022](https://monzo.com/blog/weve-had-a-little-makeover), [NN/g brutalism](https://www.nngroup.com/articles/brutalism-antidesign/)

**Games:** [Into the Breach, IGF interview](https://gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-), [Victoria 3 tooltips, PCGamesN](https://www.pcgamesn.com/victoria-3/nested-tooltip-system), [Hashino, GamesRadar headline](https://www.gamesradar.com/games/jrpg/persona-director-and-jrpg-veteran-says-the-amazing-menus-in-metaphor-refantazio-were-really-annoying-to-make-just-as-persona-5s-were-impossible-to-read-at-first), [Mini Metro talk blurb](https://www.gamedeveloper.com/design/attend-gdc-2017-and-learn-the-value-of-less-is-more-from-a-i-mini-metro-i-dev), [Juul and Begy 2016](https://adk.elsevierpure.com/en/publications/good-feedback-for-bad-players-a-preliminary-study-of-juicy-interf), [Singhal and Schneider 2021](https://uwaterloo.ca/haptic-experience-lab/projects/juicy-haptic-design-vibrotactile-embellishments-can-improve)
