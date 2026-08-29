# Design — Project Identity

> This document is project-long-lived. Tokens are not changed without
> the Architect's approval. Developers MUST use these tokens
> instead of improvising their own colors/spacings.

## Style Direction

Warmes Schwarz-Anthrazit mit Champagner-Gold als sparsamem Akzent und klassischer Serifentypografie — ruhiger Red-Carpet-Glamour, der die Garderobenfotos in den Mittelpunkt stellt.

## Colors

- `--color-bg`: **#12100D**
- `--color-fg`: **#F4EEE3**
- `--color-accent`: **#D4AF37**
- `--color-border`: **#3B342B**
- `--color-muted`: **#9C9284**

## Typography

- `font_family`: Georgia, 'Palatino Linotype', 'Book Antiqua', 'Times New Roman', serif
- `heading_weight`: 600
- `body_weight`: 400

## Spacing Scale

- `--space-0`: 4px
- `--space-1`: 8px
- `--space-2`: 12px
- `--space-3`: 16px
- `--space-4`: 24px
- `--space-5`: 32px
- `--space-6`: 48px

## Border-Radii

- `--radius-sm`: 4px
- `--radius-md`: 8px
- `--radius-lg`: 16px
- `--radius-pill`: 999px

## Components

### Button

Primary: bg=#D4AF37, color=#12100D, padding 12px 24px, radius md(8px), min-height 48px, font-weight 600, letter-spacing 0.02em, border none, transition 180ms ease; hover: bg=#E2C25C, translateY(-1px), shadow 0 6px 16px rgba(212,175,55,0.25); active: bg=#B8942E, translateY(0); disabled: opacity 0.45, cursor not-allowed, kein Hover-Effekt. Secondary: bg transparent, border 1px solid #3B342B, color #F4EEE3; hover: bg #1B1712, border #9C9284. Danger: bg #C04A3A, color #F4EEE3; hover: bg #D15B4A; active: bg #A63B2D. Mobile: in Formularen volle Breite, min-height 48px.

### Card

Kleidungsstück-/Outfit-Karte: bg=#1B1712, border 1px solid #3B342B, radius lg(16px), padding 16px, overflow hidden, transition 200ms ease. Bildbereich: aspect-ratio 4:5, object-fit cover, radius md(8px), Hintergrund #0F0D0A. Hover: border #D4AF37, translateY(-2px), shadow 0 10px 24px rgba(0,0,0,0.45). Titel: 16px, weight 600, #F4EEE3; Kategorie-Badge unten links, Meta-Text 13px #9C9284.

### Input

Label: 14px #9C9284, margin-bottom 6px. Feld: bg=#12100D, border 1px solid #3B342B, radius md(8px), padding 12px 16px, min-height 48px, color #F4EEE3, placeholder #9C9284, transition 160ms ease. Focus: border #D4AF37, box-shadow 0 0 0 3px rgba(212,175,55,0.2). Invalid: border #C04A3A; Fehlertext 13px #C04A3A unter dem Feld.

### Select

Wie Input: bg=#12100D, border 1px #3B342B, radius md(8px), padding 12px 16px, min-height 48px, eigener Pfeil statt Browser-Default, padding-right 40px. Optionen: bg #1B1712, color #F4EEE3. Focus identisch mit Input (Gold-Border + weicher Ring).

### Badge

Kategorie-Pill: padding 4px 12px, radius pill(999px), border 1px solid #3B342B, color #9C9284, bg transparent, font-size 13px, min-height 28px. Ausgewählt: bg #D4AF37, color #12100D, border #D4AF37, font-weight 600. Hover (nicht ausgewählt): border #D4AF37, color #D4AF37.

### Modal

Overlay: bg rgba(10,8,6,0.7), backdrop-filter blur(6px). Dialog: bg #1B1712, border 1px solid #3B342B, radius lg(16px), padding 24px, max-width 480px, width calc(100% - 32px), shadow 0 24px 64px rgba(0,0,0,0.6). Titel: 20px, weight 600, #F4EEE3. Schließen-Button: Ghost-Icon-Button, 44x44px, oben rechts.

### Navbar

Sticky top, z-index 50, bg rgba(18,16,13,0.88), backdrop-filter blur(12px), border-bottom 1px solid #3B342B, height 64px. Inhalt: max-width 1200px, padding 0 16px mobil / 0 24px ab 640px. Logo: 20px, weight 600, #F4EEE3 mit Gold-Punkt/Akzent. Links: 15px #9C9284, hover #F4EEE3, active #D4AF37. Mobil: Hamburger-Button 44x44px, Dropdown-Panel bg #1B1712 mit 1px Border.

### EmptyState

Zentriert, padding 48px 24px, border 1px dashed #3B342B, radius lg(16px), bg transparent. Icon: 48px, #9C9284. Titel: 18px, weight 600, #F4EEE3. Text: 15px #9C9284, max-width 420px. Primärer CTA-Button darunter.

### UploadDropzone

Border 1.5px dashed rgba(212,175,55,0.45), radius lg(16px), padding 32px 24px, bg #1B1712, text-align center, transition 180ms ease. Idle: Icon + Text #9C9284. Hover/Drag-over: border #D4AF37, bg rgba(212,175,55,0.07). Vorschau: Bild max-height 240px, radius md(8px), Entfernen-Button 44x44px daneben.

### Toast

Feedback unten rechts: bg #1B1712, border 1px solid #3B342B, radius md(8px), padding 12px 16px, shadow 0 12px 32px rgba(0,0,0,0.4). Linke Kante 3px: success #D4AF37, error #C04A3A. Text 14px #F4EEE3. Auto-hide nach 4s, sanftes Ein-/Ausblenden 200ms.

## Layout Principles

- Container: max-width 1200px, zentriert, Seiten-Padding 16px mobil / 24px ab 640px.
- Breakpoints: mobil <640px, Tablet 640–1024px, Desktop ≥1024px.
- Garderobe-Grid: 2 Spalten mobil (min 160px), 3 Spalten ab 640px, 4 Spalten ab 1024px; Gap 16px mobil / 24px Desktop.
- Sektionsabstand: 32px mobil / 48px Desktop; Innenabstand in Karten 16px.
- Outfit-Creator: Desktop zweispaltig (Vorschau 1/3 + Auswahl 2/3), mobil einspaltig mit sticky Auswahl-Leiste unten.
- Typo-Hierarchie: H1 32px/weight 600 Serif, H2 24px/weight 600, Body 16px/weight 400, Meta 13px; Zeilenhöhe 1.5.
- Übergänge: 160–220ms ease; Hover-Effekte nur auf Geräten mit Pointer (hover:hover).
