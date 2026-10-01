# Degree First — brand kit (v1)

**Mark:** a student (gold head + stem) inside the path that becomes the D. The gold dot is "the first step" — the same gold thread the product uses for the one next action.

| Token | Hex | oklch (source of truth: scholarship-companion/design/src/core.css) |
|---|---|---|
| Emerald (primary) | `#00684e` | `oklch(0.46 0.095 168)` |
| Emerald deep | `#004d37` | `oklch(0.37 0.085 168)` |
| Gold (next step only) | `#dfb956` | `oklch(0.80 0.125 88)` |
| Paper | `#f9f7f0` | `oklch(0.976 0.009 95)` |
| Ink | `#172b24` | `oklch(0.27 0.03 170)` |

Type: **Bricolage Grotesque 700** for the wordmark and headlines (tracking −0.035em), **Onest** for UI/body.

Files in `export/`: app icon (PNG 1024 + SVG), mark on light / on dark (transparent PNG 1024), horizontal lockups light / dark (PNG 2000×560), mark SVG, and an overview sheet.
Regenerate PNGs: `npx tsx projects/degree-first/render.ts brand <sheet|icon|mark|mark-light|lockup|lockup-dark> <out.png>`.
