# CIVIQ Color System — Final Locked Version
*Updated after full component build session*

---

## Philosophy
```
90% neutral (grays + whites + blacks)
 7% brand accent (#5E6AD2)
 3% semantic (red for danger only)

Rule: Color = Information
  If removing color loses meaning → keep it
  If removing color loses nothing → remove it
```

---

## Core Brand Color

```
Brand Accent:     #5E6AD2   — buttons, active nav, links, progress bars
                              stat card top borders, logo dots, focus rings
                              ONE color that says "CIVIQ"

Brand Navy:       #0D2145   — logo icon roads (light mode only)
                              never used in UI elements
```

---

## Semantic Colors
*Used ONLY when communicating urgency or status — never decoratively*

```
Danger:    #DC2626   — clash detected, rejected, error states
                       ONLY when something is wrong

Success:   #16A34A   — approved, completed
                       ONLY when something is confirmed good

Warning:   #D97706   — (reserved, use sparingly)

Info:      #2563EB   — (reserved, use sparingly)
```

---

## Light Mode — Full Palette

### Backgrounds
```
Page bg:          #F7F7F7   — sidebar + page (identical — Linear approach)
Content card:     #FFFFFF   — white card floats on page bg
Stat card bg:     #F8FAFC   — slightly off-white
Input bg:         #FFFFFF
Hover bg:         #EBEBEB   — nav item hover + active pill
```

### Borders
```
Default border:   #E2E8F0   — cards, inputs, dividers
Content card:     #E5E5E5   — outer white card border
Subtle border:    #E4E4E7   — very subtle separators
```

### Text
```
Primary:          #0F172A   — headings, bold text, max contrast
Secondary:        #6B7280   — body text, meta info (TRUE GRAY — no blue tint)
Muted:            #9CA3AF   — dates, placeholders, secondary labels
Disabled:         #D1D5DB
```

### Navigation (Sidebar)
```
Active pill bg:   #EBEBEB
Active text:      #0F172A   font-semibold
Inactive text:    #6B7280   font-normal
Hover:            #EBEBEB bg + #0F172A text
```

---

## Dark Mode — Full Palette

### Backgrounds
```
Page bg:          #0F0F0F   — sidebar + page (identical — Linear approach)
Content card:     #171717   — slightly lighter than page
Stat card bg:     #18181B
Card surfaces:    #1C1C1F
Elevated surface: #252529
Input bg:         #1C1C1F
```

### Borders
```
Default border:   #1E293B   — cards, inputs (dark slate)
Subtle border:    #27272A
```

### Text
```
Primary:          #F8FAFC   — headings, bold text, pure white
Secondary:        #9CA3AF   — body text (TRUE GRAY — no blue tint)
Muted:            #6B7280   — dates, placeholders
```

### Navigation (Sidebar)
```
Active pill bg:   #1E293B
Active text:      #F8FAFC   font-semibold
Inactive text:    #9CA3AF   font-normal
Hover:            #1E293B bg + #F8FAFC text
```

---

## Badge Colors

### Light Mode
```
Approved:    bg #F0FDF4   text #15803D   dot #16A34A
Ongoing:     bg #EEF2FF   text #4338CA   dot #5E6AD2
Pending:     bg #F8FAFC   text #475569   dot #94A3B8
Rejected:    bg #FEF2F2   text #B91C1C   dot #DC2626
Completed:   bg #F1F5F9   text #475569   dot #64748B
Clash:       bg #FEF2F2   text #B91C1C   dot #DC2626 (pulse)
Road:        bg #FFF7ED   text #C2410C   dot #EA580C
Water:       bg #EFF6FF   text #1D4ED8   dot #2563EB
Electricity: bg #FEFCE8   text #A16207   dot #CA8A04
Sewage:      bg #F5F3FF   text #6D28D9   dot #7C3AED
Parks:       bg #F0FDF4   text #15803D   dot #16A34A
Other:       bg #F8FAFC   text #475569   dot #94A3B8
```

### Dark Mode — Muted, Never Saturated
```
Approved:    bg #0D1F14   text #4ADE80
Ongoing:     bg #131629   text #818CF8
Pending:     bg #1A1F2B   text #64748B
Rejected:    bg #1F0A0A   text #F87171
Completed:   bg #1A1F2B   text #64748B
Clash:       bg #1F0A0A   text #F87171
Road:        bg #1A0E05   text #FB923C
Water:       bg #0A1220   text #60A5FA
Electricity: bg #181305   text #FACC15
Sewage:      bg #130C22   text #A78BFA
Parks:       bg #0D1F14   text #4ADE80
Other:       bg #1A1F2B   text #64748B
```

---

## Stat Card
```
Top border:   #5E6AD2   — ALL 4 cards same accent color
              NEVER different colors per card

Number color:
  Default →   #0F172A light / #F8FAFC dark
  Danger  →   #DC2626 light / #FCA5A5 dark
              ONLY for Active Clashes — not decorative

Label:        #6B7280 / #9CA3AF   uppercase tracking-wide
Sub label:    #9CA3AF / #6B7280   muted gray only
```

---

## ProjectCard
```
Border:       #E2E8F0 light / #1E293B dark
              NO left colored border (removed — was too loud)
Hover:        #F8FAFC light / #252529 dark
Progress bar: #5E6AD2 — always accent, single color
              #5E6AD2 at 100% too (not green)
```

---

## Interactive Elements

### Buttons
```
Primary:      bg #5E6AD2   hover #4A56C1   text white
Secondary:    bg #F1F5F9   hover #E2E8F0   text #0F172A
Danger:       bg #DC2626   hover #B91C1C   text white
```

### Inputs
```
Border:       #E2E8F0   focus #5E6AD2
Height:       40px (h-10)
Border radius: 10px
```

### Focus ring
```
Color:        #5E6AD2
```

---

## Typography (Inter only)

```
Font:         Inter — 400, 500, 600, 700, 800

Page title (navbar):    18px   font-bold    #0F172A / #F8FAFC
Section labels:         13px   font-bold    uppercase tracking-[0.06em]
Card titles:            14-15px font-semibold
Body text:              13-14px font-normal
Meta / secondary:       11-12px font-normal  #6B7280 / #9CA3AF
Stat card value:        32px   font-bold
Stat card label:        12px   font-medium  uppercase tracking-wide
Nav items:              14px   font-normal (inactive) / font-semibold (active)
Badge text:             11-13px font-medium
```

---

## Logo

```
Icon:         Road intersection cross — #0D2145 roads light / #FFFFFF dark
              Lane dividers — 35% opacity
              Center circle — #5E6AD2 always (brand)
              Inner dot — white always

Wordmark:     "CiViQ" — Inter 800
              Color: #0D2145 light / #FFFFFF dark
              i dots: #5E6AD2 always (brand accent)
              Q: same as text color (no special color)

Size:         LOGO_SIZE = 34 (single source controls both)
```

---

## Spacing System

```
Content padding:    px-8 py-8 (inside white card)
Section gap:        gap-9
Card grid gap:      gap-4 to gap-5
Sidebar width:      260px expanded / 56px collapsed
Navbar height:      h-24 (logo area) matches sidebar
Content card:       h-[calc(100vh-32px)] fixed height
Card border radius: 8px (cards) / 10px (content card)
```

---

## What We DON'T Use

```
✗ Gradients anywhere
✗ Card shadows (borders only)
✗ Multiple accent colors simultaneously
✗ Green numbers on stat cards (decorative)
✗ Amber/orange on stat cards
✗ Colored top borders per stat card
✗ Left colored border on project cards
✗ Bright saturated badge colors in dark mode
✗ Blue-tinted slate grays (#64748B, #94A3B8 slate)
  → Use TRUE gray instead (#6B7280, #9CA3AF)
```