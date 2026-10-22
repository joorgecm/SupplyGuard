# Design

SupplyGuard's interface borrows the plant's own safety signage (ISO 3864 colours and sign shapes) as the state language of incoming quality. It is a working tool first: standard web controls, flat colour, borders instead of shadows.

## Colour

Tokens live in `frontend/src/app/globals.css` (`@theme`).

| Role | Token | Use |
|---|---|---|
| Ground | `ground` #e9e8e3 | Page background, warm concrete grey |
| Surface | `surface` #fff, `sunken` #f4f3ef | Panels, table headers, hover rows |
| Control | `control` #7d7970 | Borders of inputs, selects, secondary buttons, checkboxes and option cards; 3:1 on surface and ground (WCAG 1.4.11) |
| Ink | `ink` #1d1d1b, `ink-muted`, `ink-subtle` | Text; `ink` is also the primary button |
| Shell | `shell` #1d1d1b and friends | Top bar and login panel (signal black) |
| Safety yellow | `yellow` / `yellow-hover` / `yellow-soft` / `yellow-ink` | Needs attention: status *open*, "next step" panel, report CTA, selection |
| Safety blue | `blue` / `blue-soft` / `blue-ink` | Mandatory action: *in analysis* (hollow), *corrective action* (solid); focus ring |
| Safety green | `green` / `green-soft` / `green-ink` | Safe condition: *closed*, completed tasks, the safety board |
| Orange / red | `orange`, `red` (+ soft/ink) | Severity high / critical, overdue, errors |

Hazard tape (`.hazard`, yellow/black stripes) is reserved for a real hazard: critical and active incidents, overdue tasks, and the login panel edge.

## Type

- Barlow Condensed (`font-display`, `.display`, `.label`): headings, labels, buttons, nav. Uppercase with tracking for labels and buttons.
- Barlow (`font-sans`): body text, 15px base.
- Geist Mono (`font-mono`): only part references, lots and incident numbers.
- Tabular figures on the whole document.

## Components

- `StatusSign` / `StatusBadge`: ISO shapes. Triangle = open, hollow circle = in analysis, solid circle = corrective action, square with check = closed.
- `SeverityMeter` / `SeverityBadge`: four rising bars; load is read by how many are filled, not only by colour.
- `RoleTag`: operator yellow, engineer blue, admin black.
- `Panel`: white surface, 1px border, uppercase condensed header row. Radius 6px (`rounded-md`); controls 4px (`rounded-sm`).
- `buttonClass`: `primary` (ink), `attention` (yellow, for reporting), `secondary` (outlined), `quiet`.

## Signature moments

- Dashboard **safety board**: "N days without a critical incident" in white number plates on green, like the plant's accident-free board, with the record streak.
- Incident **workflow rail**: four signs joined by a tape that fills to the current step; after a status change the new step stays lit until the user looks at it.

## Motion

Ease-out `cubic-bezier(0.23, 1, 0.32, 1)`. Buttons scale to 0.97 on press. Page content fades up 6px; the tape fills once; board digits count up. Everything respects `prefers-reduced-motion`.
