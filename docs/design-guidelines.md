# AI Image Dictionary - Design Guidelines

**Version:** 1.0.0
**Last Updated:** 2026-02-16
**Platform:** Web + Mobile (iOS/Android via Capacitor)

---

## Design Philosophy

**Principle:** Elegant simplicity focused on learning, not distraction.

- **Dark-first:** Reduce eye strain for long study sessions
- **Accessible:** WCAG 2.1 Level AA compliance
- **Responsive:** Mobile-first design for all screen sizes
- **Engaging:** Micro-interactions (animations, haptics) drive delight
- **Educational:** Visual hierarchy emphasizes learning content

---

## Color System

### Dark Theme (Default)

| Element | Color | Hex | Tailwind | Usage |
|---------|-------|-----|----------|-------|
| Background Primary | Slate 900 | #0f172a | bg-slate-900 | Page backgrounds |
| Background Secondary | Slate 800 | #1e293b | bg-slate-800 | Cards, sections |
| Background Tertiary | Slate 700 | #334155 | bg-slate-700 | Hover states |
| Text Primary | White | #ffffff | text-white | Headlines, primary text |
| Text Secondary | Slate 300 | #cbd5e1 | text-slate-300 | Body text, secondary |
| Text Tertiary | Slate 400 | #94a3b8 | text-slate-400 | Hints, timestamps |
| Primary Action | Purple 600 | #9333ea | bg-purple-600 | Buttons, CTAs |
| Primary Hover | Purple 700 | #7e22ce | bg-purple-700 | Button hover states |
| Success | Green 400 | #4ade80 | text-green-400 | Correct answers, checkmarks |
| Error | Red 400 | #f87171 | text-red-400 | Wrong answers, errors |
| Warning | Amber 400 | #facc15 | text-amber-400 | Warnings, alerts |
| Border | Slate 600 | #475569 | border-slate-600 | Dividers, borders |

### Light Mode (Optional, Future)

```
Background: white → slate-50
Text: slate-900/800 (inverted)
Primary: purple-600 (same)
```

### Semantic Colors

| Semantic | Tailwind Classes | Usage |
|----------|-----------------|-------|
| Info | bg-blue-900/20, text-blue-400 | Information messages |
| Success | bg-green-900/20, text-green-400 | Success confirmations |
| Warning | bg-amber-900/20, text-amber-400 | Caution, rate limits |
| Error | bg-red-900/20, text-red-400 | Errors, failures |

---

## Typography

### Font Family

**Primary:** System fonts (best performance)
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
```

### Font Sizes & Weights

| Level | Size | Weight | Tailwind | Usage |
|-------|------|--------|----------|-------|
| H1 | 32px | Bold (700) | text-4xl font-bold | Page titles |
| H2 | 24px | Bold (700) | text-2xl font-bold | Section titles |
| H3 | 20px | Bold (700) | text-xl font-bold | Card titles |
| Body | 16px | Regular (400) | text-base | Body text |
| Small | 14px | Regular (400) | text-sm | Captions, hints |
| Tiny | 12px | Regular (400) | text-xs | Timestamps, labels |

### Line Height

- Headlines: 1.2x (tight)
- Body text: 1.6x (spacious for readability)
- Form inputs: 1.5x

### Chinese Text Special Handling

```css
/* For better rendering of Chinese characters */
font-variant-numeric: tabular-nums;
letter-spacing: 0.02em;  /* Slight spacing for clarity */
```

---

## Spacing & Layout

### Spacing Scale

```
2px, 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px, 128px
Tailwind: p-1, p-2, p-3, p-4, p-6, p-8, p-12, p-16, p-24, p-32
```

### Common Patterns

| Usage | Padding | Tailwind |
|-------|---------|----------|
| Card | 16px | p-4 |
| Section | 24px | p-6 |
| List item | 12px | p-3 |
| Button | 12px 16px | px-4 py-3 |
| Input | 12px | p-3 |

### Grid & Responsive

```
Mobile: single column (100% width)
Tablet: 2 columns (min 300px)
Desktop: 3-4 columns (min 300px)

Breakpoints:
- sm: 640px (tablet)
- md: 768px (small desktop)
- lg: 1024px (desktop)
- xl: 1280px (large desktop)
```

---

## Components

### Buttons

**Primary Button (Main CTA)**
```
Background: bg-purple-600 hover:bg-purple-700
Text: text-white font-semibold
Padding: px-4 py-3
Border: rounded-lg
Shadow: (none) or subtle shadow on hover
Size: 44px min height (mobile touch target)
```

**Secondary Button**
```
Background: bg-slate-800 hover:bg-slate-700 border border-slate-600
Text: text-white font-semibold
```

**Text Button (Link-style)**
```
Background: transparent
Text: text-purple-400 hover:text-purple-300
Underline: optional on hover
```

### Cards

```
Background: bg-slate-800/50 or bg-slate-800
Border: border border-slate-700
Padding: p-4 or p-6
Border-radius: rounded-lg
Shadow: (none) or subtle
Hover: border-slate-600, bg-slate-800
```

### Inputs & Forms

```
Background: bg-slate-800/50
Border: border border-slate-600 focus:border-purple-500
Text: text-white placeholder:text-slate-500
Padding: px-3 py-2
Border-radius: rounded-md
Focus: ring-2 ring-purple-500/50
Height: min 44px (mobile)
```

### Badges & Pills

```
Background: bg-purple-600/20
Text: text-purple-400 font-medium
Padding: px-2 py-1
Border-radius: rounded-full
Size: text-xs, text-sm
```

### Modals & Dialogs

```
Backdrop: bg-black/50 (semi-transparent)
Modal: bg-slate-900 rounded-2xl
Header: px-6 py-4 border-b border-slate-700
Body: px-6 py-4
Footer: px-6 py-4 border-t border-slate-700
Max-width: max-w-lg (mobile) to max-w-2xl (desktop)
```

---

## Micro-interactions & Animations

### Loading States

```
Skeleton loaders: bg-slate-700 animate-pulse
Spinners: purple rotating spinner (2s)
Progress bars: bg-purple-600/30 → bg-purple-600 animated
```

### Transitions

```
Fade: transition-opacity duration-200
Slide: transition-transform duration-300
Scale: transition-transform duration-200
Color: transition-colors duration-200
All: transition-all duration-300
```

### Button States

```
Rest: normal colors
Hover: darker bg, slight scale (scale-105)
Active: darker bg, scale-95 (pressed feel)
Disabled: opacity-50 cursor-not-allowed
```

### Page Transitions

```
Fade in: opacity-0 → opacity-100 (200ms)
Slide up: translate-y-4 → translate-y-0 (300ms)
Stagger children: delay-100, delay-200, delay-300
```

---

## Mobile-Specific Design

### Touch Targets

```
Minimum size: 44x44px
Spacing: 8px minimum between targets
Buttons: Full width or centered 44px minimum
```

### Safe Areas (Notch/Island)

```
Use Capacitor safe-inset for status bar
Padding: pt-safe (top safe inset padding)
Avoid placing controls in notch zone
```

### Mobile Navigation

```
Hamburger menu icon (top-right)
Navigation drawer slides from left
Expandable sections (Libraries, Settings)
Sticky bottom for quick actions (Capture, Quiz)
```

### Keyboard Management

```
Input focus: auto-scroll to keep visible
Keyboard push: CSS viewport-fit for notch
Dismiss: Tap outside or keyboard close button
```

---

## Accessibility (WCAG 2.1 AA)

### Color Contrast

```
Text on background: 4.5:1 minimum
Large text (18px+): 3:1 minimum
UI components (borders): 3:1 minimum

✓ White on slate-900: 21:1 (excellent)
✓ text-purple-400 on slate-900: 5.5:1 (good)
✗ text-slate-400 on slate-800: 2.8:1 (fail)
```

### Keyboard Navigation

```
Tab order: logical (left-to-right, top-to-bottom)
Focus visible: ring-2 ring-purple-500 or outline
Skip links: Skip to main content
Focus trap: Modals trap focus
Escape: Close modals & menus
```

### Screen Readers

```
Semantic HTML: nav, main, section, article
ARIA labels: aria-label for icon buttons
Images: alt text for all meaningful images
Skip text: aria-hidden for decorative elements
Form labels: <label htmlFor="id">
Headings: h1 → h6 hierarchy
Lists: <ul>, <ol> for list structure
```

### Motion & Vestibular

```
Animations: prefer-reduced-motion respected
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; }
}
```

---

## Native App (Capacitor) Specific

### Status Bar

```
Dark style: statusBarStyle='dark'
Overlay: statusBarOverlay=false
Background: matches app theme (slate-900)
```

### Safe Areas

```
Top: notch/island safe inset
Bottom: home indicator safe inset
Left/Right: rounded corners safe inset
CSS: padding-safe (custom CSS variable)
```

### Haptic Feedback Opportunities

```
Button press: light vibration
Success action: medium vibration
Error: strong vibration with sound
Switch toggle: light vibration
```

### App Icons & Splash

```
Icon: 1024x1024px (square, no rounded corners)
Splash: 2048x2048px (purple gradient + logo)
Safe zone: 20% margin for text
Avoid text in bottom 25% (notch zone)
```

---

## Dark Mode Implementation

### Always-Dark Approach

```
Default: Dark theme
Optional: Light mode via CSS class (future)
No light/dark toggle (not needed for MVP)
CSS variables for future flexibility
```

### CSS Variables (Future)

```css
:root {
  --bg-primary: #0f172a;   /* slate-900 */
  --bg-secondary: #1e293b;  /* slate-800 */
  --text-primary: #ffffff;
  --text-secondary: #cbd5e1;  /* slate-300 */
  --primary: #9333ea;  /* purple-600 */
}

.light {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --primary: #7e22ce;  /* darker purple */
}
```

---

## Image Guidelines

### Photo Analysis Results

```
Aspect ratio: Original maintained
Max width: 100% (responsive)
Border: rounded-lg
Shadow: subtle shadow
Detected objects: Overlaid with bounding boxes or highlights
```

### User Avatars

```
Size: 32px (small), 48px (medium), 64px (large)
Shape: Circle (rounded-full)
Fallback: Initials on purple background
Border: thin border-slate-600
```

### Icons

```
Source: Lucide React (22px default)
Color: text-slate-300, text-white
Hover: text-purple-400
Disabled: opacity-50
Size: 20px (small), 24px (normal), 32px (large)
```

---

## Form Design

### Input Fields

```
Background: bg-slate-800/50
Border: border border-slate-600
Focus: border-purple-500 ring-2 ring-purple-500/50
Placeholder: text-slate-500
Label: text-sm font-medium text-slate-300
Helper text: text-xs text-slate-400
Error: border-red-500 text-red-400
```

### Select Dropdown

```
Trigger: bg-slate-800 border-slate-600 text-white
Options: bg-slate-800 text-white
Hover: bg-slate-700
Selected: bg-purple-600/20 text-purple-400
Checkmark: lucide icon
```

### Textarea

```
Same as input
Min height: 120px
Resize: vertical only
```

### Checkbox & Radio

```
Unchecked: border border-slate-600 bg-slate-800
Checked: bg-purple-600 border-purple-600
Label: text-slate-300
Focus: ring-2 ring-purple-500/50
Disabled: opacity-50
```

---

## Loading & Empty States

### Loading Skeleton

```
Background: bg-slate-700 animate-pulse
Duration: 2s infinite
Use cases: Cards, lists, profiles
```

### Empty State

```
Icon: 64px Lucide icon (text-slate-500)
Title: text-lg font-semibold text-white
Description: text-slate-400
CTA Button: Primary button
Example: "No vocabulary yet. Capture a photo to start!"
```

### Error State

```
Icon: AlertCircle (text-red-400)
Title: text-lg font-semibold text-red-400
Description: text-slate-300 (explain error)
Action: Retry button
Example: "Oops! Photo analysis failed. Try again?"
```

---

## Testing Accessibility

### Tools

- axe DevTools (Chrome extension)
- WAVE (WebAIM)
- Lighthouse (Chrome DevTools)
- VoiceOver (macOS) / TalkBack (Android)
- Manual keyboard navigation

### Checklist

- [ ] Color contrast ≥ 4.5:1
- [ ] Keyboard navigation works
- [ ] Screen reader announces all content
- [ ] Focus visible on all interactive elements
- [ ] Reduced motion respected
- [ ] Touch targets ≥ 44x44px
- [ ] Image alt text present
- [ ] Form labels associated with inputs
- [ ] Error messages clear and actionable

---

## References

- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [shadcn/ui Component Library](https://ui.shadcn.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines)
- [Material Design 3](https://m3.material.io/)

---

**Last Reviewed:** 2026-02-16
**Next Review:** 2026-03-16
