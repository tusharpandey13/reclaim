# Icons: sources and licences

All files are in `icons/svg/`, bundled with the app. Nothing is fetched at runtime. Rules and mapping: `SPEC.md` section 8.

| Set | Version | Used for | Licence |
|---|---|---|---|
| [Lucide](https://lucide.dev) (`lucide-static`) | 1.66.0 | Categories, bills, UI. `icons/svg/lucide/` | ISC, copy at `icons/svg/lucide/LICENSE` |

**No brand logos.** The private build drew 20 merchant and bank logos. This public repository ships none: every payee gets its category's outline icon, or the neutral one, so no trademark is used. The brand slot in the mapping (`brands` in `icons/map.json`) is empty and stays supported, so a self-hoster can add logos they are entitled to use: copy an SVG into `icons/svg/brand/`, list it under `brands`, and run `node icons/build.mjs`.
