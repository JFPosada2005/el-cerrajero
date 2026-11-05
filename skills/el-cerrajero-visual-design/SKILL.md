---
name: el-cerrajero-visual-design
description: "Trigger: El Cerrajero UI, visual polish, game styling, SVG workshop, motion, accessibility. Apply the premium visual system."
license: Apache-2.0
metadata:
  author: "JFPosada2005"
  version: "1.0"
---

# El Cerrajero — Visual design

## Activation Contract

Load when styling the game UI, adding a component, changing motion, reviewing a visual PR, or fixing layout/accessibility.

## Hard Rules

- Follow `docs/VISUAL-DESIGN.md` tokens; do not invent colors, spacing, or durations.
- No retro: no pixel art, CRT, scanlines, neon, thick bevels, emoji icons, or default browser controls.
- UI words only: celda, cable, engranaje, bifurcador, resorte, pila, tambor, cinta, cerrojo, alarma. Never AFD, AFND, AP, MT, autómata, estado, transición, lenguaje.
- WCAG AA: 4.5:1 text, 3:1 large/non-text; color is never the only signal.
- Targets >= 44x44; visible focus; keyboard; Esc closes modals; respect `prefers-reduced-motion`.
- Native CSS and Web Animations API first. Do not add a library without a measured need.
- Self-host fonts; no external requests.

## Decision Gates

| Need | Action |
| --- | --- |
| New color | Use a token; verify contrast. |
| New component | Define default, hover, active, focus, disabled, loading, success, error, empty. |
| New animation | Use the motion table; max 420 ms; transform/opacity only. |
| New library | Compare against native; document weight and license. |
| New icon | Lucide inline SVG, 1.5 px stroke. |

## Execution Steps

1. Read `docs/VISUAL-DESIGN.md` and the relevant component spec.
2. Reuse tokens and components; no one-off styles.
3. Check 360, 768 and 1440 px; contrast; focus; reduced motion.
4. Run `npm test`.
5. Attach screenshots and the checklist to the PR.

## Output Contract

Return files changed, screenshots at 360 and 1440, contrast/focus/motion checks, and any new token.

## References

- `../../docs/VISUAL-DESIGN.md`
- `../../CONTRIBUTING.md`
- `../../docs/DESIGN.md`
