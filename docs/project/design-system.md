# Design System Reference

**Brand:** Gen Z, party energy, joyful. Neon fuchsia + violet on soft blush.

**Reference prototype:** `docs/design/landing-prototype.html` — treat this as the visual source of truth.

## Colors

| Role           | Token         | Hex       |
| -------------- | ------------- | --------- |
| Primary        | fuchsia       | `#FF2D9B` |
| Primary Dark   | fuchsia-dark  | `#E01B85` |
| Primary Light  | fuchsia-light | `#FF5CB5` |
| Primary Bg     | fuchsia-bg    | `#FFF0F8` |
| Secondary      | violet        | `#8B5CF6` |
| Secondary Bg   | violet-bg     | `#F3EEFF` |
| Accent         | sunny         | `#FFCA28` |
| Accent         | sky           | `#38BDF8` |
| Accent         | mint          | `#2DD4A8` |
| Accent         | peach         | `#FF8C69` |
| Background     | —             | `#FFFAFE` |
| Surface        | —             | `#FFFFFF` |
| Border         | —             | `#F3E4EE` |
| Text Primary   | —             | `#1E0A1B` |
| Text Secondary | —             | `#5C4558` |
| Text Muted     | —             | `#A693A2` |

## Typography

- **Headings:** Outfit, weight 800–900
- **Body:** DM Sans, weight 400–700

## Shape & Shadow

- **Cards:** `border-radius: 20px`
- **Small elements:** `border-radius: 12px`
- **Pills/tags/buttons:** `border-radius: 100px`
- **Hover shadows:** fuchsia-tinted glows (not plain grey box-shadows)

## Gradient

Highlight text and accent elements use:

```css
linear-gradient(135deg, #FF2D9B, #8B5CF6)
```
