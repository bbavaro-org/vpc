# Vancouver Psychology Centre — design system guide

Read this before building any UI for Vancouver Psychology Centre (VPC). Use the tokens in `tokens.css` / `tokens.json` by name. Never hard-code a hex value, font size or radius that has a token.

Captured from the live CSS of vancouverpsychologycentre.com on November 16, 2026.

## Files in this folder

| File | What it is | How to use it |
| --- | --- | --- |
| `tokens.json` | Every token with its value and a usage note | Source of truth. Read the `usage` field before choosing a token. |
| `tokens.css` | The same tokens as CSS custom properties, plus `.text-*` classes for each text style | Import once at the app root: `@import "./design-system/tokens.css";` |
| `components.css` | Styles for the components below (classes prefixed `vpc-`) | Import after `tokens.css`. Fonts are self-hosted by the app. |
| `vpc-logo.png` | The logo (350 × 84px; display at 175 × 42px in content, 53px tall with auto width in the dashboard header) | Place on `white` or `lime-soft` only. Do not redraw or recolor it. |
| `DESIGN.md` | This guide | |

## Brand in one paragraph

VPC is a licensed psychology practice in Vancouver, BC, established in 2003 and led by two founding psychologists. The look is calm, warm and plain-spoken: lime and deep olive greens on white, an elegant serif for headlines, and pill-shaped buttons that invite the next step without pressure.

## Voice and copy

- Warm, reassuring and direct, with a professional undertone. Speak to a person, not a case.
- Headlines are short questions or statements: "Ready to feel better?", "Simple from the first message."
- Lower the barrier: "No clinical history required", "no commitment".
- Concrete credibility over adjectives: "20+ years", "17 clinicians", "Licensed clinicians, not a referral network."
- "Care built around evidence, not trend."
- Sentence case for headings and buttons. Buttons are verb-first; add " →" when they lead to another page.
- Eyebrow labels above sections: two to five words, uppercase via CSS.
- Never: urgency, clinical jargon in headlines, exclamation marks, emoji.

## Color

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | #2A3010 | Headings and primary text; text on lime buttons |
| `--ink-2` | #445228 | Secondary headings |
| `--muted` | #6B7A50 | Body copy on white (4.6:1) |
| `--green-deep` | #4C6417 | Links, ghost buttons, small colored text |
| `--lime` | #99C72E | Signature color: primary buttons and CTAs (always with `--ink` text, never white) |
| `--lime-deep` | #80A626 | Emphasis blocks, large or bold uppercase labels only (3.0:1 on white) |
| `--lime-mid` | #C8E68A | Decorative accents, hover tints; never text |
| `--lime-soft` | #EEF5D0 | Hero wash, tag fill |
| `--line` | #D9E0C4 | Hairlines and card borders |
| `--snow` | #F5F7F1 | Alternate section background |
| `--footer-bg` / `--footer-mid` | #F2F5EA / #E6ECDA | Footer and its dividers |
| `--trust-bg` | #F4F2EA | Warm band behind press logos |
| `--white` | #FFFFFF | Page and card surfaces |
| `--logo-lime` / `--logo-gray` | #A9CF52 / #A6ABB1 | Logo only; not UI |

Rules:
- One primary (lime) button per section.
- Small text (under 18px) in color uses `--green-deep`, not `--lime-deep`, to meet 4.5:1 contrast.
- No dark mode is defined. Don't invent one.
- No gradients except the dark green photo overlay on selector cards.

## Typography

Two self-hosted families (served by the app's `@font-face` declarations):
- **Source Serif 4**, weight 400 only, tracking −0.02em: all headings. The hero's key word may be italic.
- **Inter**: everything else.

| Class | Family | Size / line height | Weight | Use |
| --- | --- | --- | --- | --- |
| `.text-display` | serif | 82 / 84px | 400 | Hero headline (scale down on mobile) |
| `.text-heading-2` | serif | 28.7 / 33px | 400 | Section headlines |
| `.text-heading-3` | serif | 20 / 21.4px | 400 | Card and step titles |
| `.text-lead` | sans | 18.4 / 27.6px | 400 | Intro paragraphs |
| `.text-body` | sans | 17 / 28px | 400 | Body text |
| `.text-button` | sans | 16.5 / 20px | 600 | Buttons |
| `.text-button-small` | sans | 13.5 / 18px | 600 | Header CTA |
| `.text-tag` | sans | 12 / 16px | 500 | Specialty tags |
| `.text-eyebrow` | sans | 11 / 11px | 700, 0.12em, uppercase | Section labels |

Never bold the serif.

## Spacing, shape and depth

- Spacing: `--space-1` 4px, `--space-2` 8, `--space-3` 12, `--space-4` 16, `--space-6` 24, `--space-8` 32, `--space-12` 48, `--space-20` 80.
- Content column: `max-width: var(--max-width)` (1200px), side padding `clamp(20px, 4vw, 48px)`, sections spaced around `--space-20`.
- Radii: buttons always `--radius-pill`; selector cards `--radius-lg` (18px); photos `--radius-md` (10px); tags `--radius-xl` (20px); small panels `--radius-sm` (8px).
- The only shadow is `--shadow-card`, a soft green-tinted lift for cards. No other shadows.

## Components (`components.css`)

**Button**
- Primary: `<a class="vpc-btn">Talk to our care team</a>`. Lime fill, ink text.
- Ghost: `<a class="vpc-btn vpc-btn-ghost">See all services →</a>`. 1.5px green-deep outline.
- Small: `<a class="vpc-btn vpc-btn-small">Book a call</a>`. Header CTA.

**Selector card**: routes visitors to a type of care (Individual, Children & Teens, Couples, Family, Assessment, Executive Coaching).
```html
<a class="vpc-card" href="/individual" style="background-image: linear-gradient(transparent 40%, rgba(42,48,16,.85)), url(photo.jpg); background-size: cover;">
  <p class="vpc-card-title">Individual</p>
  <p class="vpc-card-sub">Support for myself</p>
  <span class="vpc-card-cta">Get started →</span>
</a>
```

**Tag**: `<span class="vpc-tag">Children &amp; Youth</span>`. One to three words, not clickable.

**Eyebrow + heading**:
```html
<div class="vpc-eyebrow">Getting started</div>
<h2 class="vpc-h2">Simple from the first message.</h2>
```

**Header navigation links**: Inter 15px, weight 400, color `var(--ink-2)`, `var(--green-deep)` on hover. Matches the live site; the 15px size is a literal with no token.

## Imagery and icons

- Photography: warm, candid, natural light; individuals, couples, families. Clinician headshots are rounded or circular.
- Icons: essentially none. Arrows (→) are typed characters in labels. Don't add icon sets.

## Privacy note for internal tools

For staff-facing tools (dashboards, intake views), keep the same tokens and type, show only aggregated client data unless the view requires otherwise, and never place client names or clinical details in URLs, page titles or logs.
