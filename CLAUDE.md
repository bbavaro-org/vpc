## Design system

All UI for this project follows the Vancouver Psychology Centre design system in `design-system/`.

- Before building or changing any UI, read `design-system/DESIGN.md`.
- Import `design-system/tokens.css`, then `design-system/components.css`, at the app root.
- Use tokens (`var(--lime)`, `var(--space-4)`, `var(--radius-pill)`) and the `.text-*` classes. Never hard-code colors, font sizes, radii or shadows that have a token.
- Reuse the `vpc-` component classes (buttons, cards, tags, eyebrows) before creating new styles.
- If something you need isn't covered, follow the closest existing pattern and tell me what you added.
