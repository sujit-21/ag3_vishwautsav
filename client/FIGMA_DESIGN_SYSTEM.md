# Vishwa Utsav — Figma Design System Quick Reference

Use this exact reference to set up your Figma file in under 2 minutes. All values match the production codebase.

---

## 1. Color Palette (Styles)

| Token Name | Hex Code | Role | Figma Usage |
| :--- | :--- | :--- | :--- |
| **Terracotta (Brand Primary)** | `#E07A43` | Primary CTA, focus rings, brand gradient start | Buttons, active navigation pills, badges |
| **Rust (Brand Accent)** | `#D95A22` | Primary CTA hover, gradient end | Button gradients, danger/alert accents |
| **Amber (Warm Glow)** | `#F9B362` | Subtle glowing ambient highlights | Shimmer cards, gold VIP badges, stars |
| **Slate Teal** | `#438295` | Secondary brand accent, dark-mode borders | Card borders, secondary icons |
| **Ocean Dark (Base Surface)** | `#1E4755` | Card backgrounds, modal surfaces | Modal containers, card backgrounds |
| **Ocean Deep (Dark Background)**| `#143039` | Deep background (no pitch black) | Page background for Dark Mode |
| **Sage Mint (Text Muted)** | `#A3D9C9` | Secondary text, subtle borders | Captions, placeholders, icon inactive |
| **Mint Light (Text Main)** | `#F0F9F8` | Primary body text in dark mode | Main headings and labels |

---

## 2. Typography (Google Fonts)

Activate these three free Google Fonts in your Figma canvas:

| Layer | Font Family | Weights | Usage |
| :--- | :--- | :--- | :--- |
| **Headings & Display** | **Plus Jakarta Sans** | 600 (SemiBold), 700 (Bold), 800 (ExtraBold) | Hero headlines, section titles, modal titles |
| **Body & UI Elements** | **Inter** | 400 (Regular), 500 (Medium), 600 (SemiBold) | Paragraphs, button text, form inputs, labels |
| **Monospace / Codes & IDs** | **JetBrains Mono** | 500 (Medium), 700 (Bold) | Pass IDs (e.g. `PB7V15T64S`), timestamps, amounts |

---

## 3. Spacing & Corner Radius (Auto-Layout)

- **Input Fields:** `H: 42px` — Corner Radius: `12px` — Padding: `10px 14px`
- **Buttons (CTA):** `H: 44px` — Corner Radius: `9999px` (Pill) — Padding: `10px 24px`
- **Cards & Bento Grid:** Corner Radius: `20px` — Padding: `24px`
- **Floating Navbar:** `H: 56px` — Corner Radius: `50px` (Full Pill) — Padding: `6px 16px`
- **Modals:** Corner Radius: `24px` — Max Width: `760px` — Padding: `28px`

---

## 4. Shadows & Blurs (Effects)

- **Modal Elevation:** `Drop Shadow: X: 0, Y: 25, Blur: 60, Spread: -12, Color: #000000 @ 45%`
- **Card Hover Glow:** `Drop Shadow: X: 0, Y: 8, Blur: 24, Spread: -4, Color: #E07A43 @ 30%`
- **Frosted Glass:** `Background Blur: 24px`

---

## 5. Standard Artboard Frames

When testing new features in Figma, create only these two frames:
1. **Desktop:** `1440 × 900`
2. **Mobile:** `390 × 844` (iPhone 14 / modern standard)
