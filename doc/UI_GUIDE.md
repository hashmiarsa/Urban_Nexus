# URBAN NEXUS — Complete UI Design Guide
# This file is the visual bible for all frontend developers.
# Every color, component, page layout, and animation is defined here.
# Do not make visual decisions not covered in this file without updating it first.

---

# 1. Design Philosophy

## Product Personality
Urban Nexus is a civic infrastructure tool.
It must feel like this:

```
Authoritative    → city officers trust the data they see
Clear            → information is never hidden or confusing
Efficient        → tasks are completed in minimum clicks
Professional     → serious work deserves serious design
Approachable     → not cold government, not playful startup
```

## The Four Inspirations
Every design decision references these four products:

```
MongoDB Atlas     → sidebar layout, card hierarchy, data display
Linear.app        → smooth transitions, minimal chrome, status system
Vercel Dashboard  → typography scale, spacing rhythm, action buttons
Mapbox Studio     → professional map integration, layer controls
```

## Core Design Rule
```
If a design element does not help the user
complete a task faster or understand data better,
it does not belong in this product.
```

---

# 2. Color System

## Brand Colors

```
Primary Navy     #0F2744    → sidebar, primary buttons, headings
Primary Blue     #1A56DB    → active states, links, focus rings
Accent Teal      #0E9F6E    → success states, completed, positive
Accent Amber     #E3A008    → warnings, pending, caution
Danger Red       #E02424    → clashes, errors, critical alerts
Info Blue        #1C64F2    → information, ongoing, informational
```

## Light Mode Palette

```
Background       #F8FAFC    → main page background (not pure white)
Surface          #FFFFFF    → cards, modals, sidepanel
Surface Hover    #F1F5F9    → card hover state background
Border           #E2E8F0    → dividers, card borders, input borders
Border Strong    #CBD5E1    → stronger dividers, table borders
Text Primary     #0F172A    → headings, important labels
Text Secondary   #475569    → body text, descriptions
Text Muted       #94A3B8    → timestamps, placeholders, helper text
Sidebar BG       #0F2744    → dark navy sidebar
Sidebar Text     #94A3B8    → inactive nav items
Sidebar Active   #FFFFFF    → active nav item text
Sidebar Hover    #1E3A5F    → nav item hover background
```

## Dark Mode Palette

```
Background       #0A0F1E    → main dark background
Surface          #111827    → cards, modals in dark mode
Surface Hover    #1F2937    → card hover in dark mode
Border           #1F2937    → dividers in dark mode
Border Strong    #374151    → stronger borders in dark mode
Text Primary     #F9FAFB    → headings in dark mode
Text Secondary   #D1D5DB    → body text in dark mode
Text Muted       #6B7280    → muted text in dark mode
Sidebar BG       #080D1A    → deeper navy in dark mode
Sidebar Text     #6B7280    → inactive items in dark mode
Sidebar Active   #FFFFFF    → active items
Sidebar Hover    #111827    → hover in dark mode
```

## Status Color System
Used consistently across badges, map polygons, and indicators.

```
Status: pending     → Background #FEF9C3  Text #854D0E  Border #FDE047
Status: approved    → Background #DBEAFE  Text #1E40AF  Border #93C5FD
Status: ongoing     → Background #D1FAE5  Text #065F46  Border #6EE7B7
Status: completed   → Background #F0FDF4  Text #166534  Border #86EFAC
Status: rejected    → Background #FEE2E2  Text #991B1B  Border #FCA5A5
Status: clashed     → Background #FEE2E2  Text #991B1B  Border #FCA5A5
                      + pulsing red dot animation
```

## Project Type Color System
Used on map polygons and type badges.

```
Type: road          → #F97316  (orange)
Type: water         → #3B82F6  (blue)
Type: electricity   → #EAB308  (yellow)
Type: sewage        → #8B5CF6  (purple)
Type: parks         → #22C55E  (green)
Type: other         → #6B7280  (grey)
```

## Color Usage Rules

```
RULE 1: Never use more than 3 colors on one page section
RULE 2: Status colors are ONLY for status — never for decoration
RULE 3: Primary Navy is for navigation and primary CTAs only
RULE 4: Red is reserved for errors and clash alerts — nothing else
RULE 5: 60% neutral, 30% primary, 10% accent — always
```

---

# 3. Typography

## Font Family

```
Primary Font:  Inter
Import:        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap')
Fallback:      -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

Monospace:     JetBrains Mono (for IDs, tracking codes, coordinates)
Import:        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap')
```

## Type Scale

```
xs    12px / line-height 16px / tracking 0.02em   → labels, timestamps, badges
sm    13px / line-height 20px / tracking 0em       → table rows, helper text
base  14px / line-height 20px / tracking 0em       → body text, descriptions
md    16px / line-height 24px / tracking -0.01em   → card titles, subtitles
lg    18px / line-height 28px / tracking -0.01em   → section headings
xl    20px / line-height 28px / tracking -0.02em   → page titles
2xl   24px / line-height 32px / tracking -0.02em   → dashboard hero labels
3xl   30px / line-height 36px / tracking -0.03em   → hero numbers (142 projects)
4xl   36px / line-height 40px / tracking -0.03em   → landing page hero
```

## Font Weight Usage

```
300  Light      → never use in UI (only landing page decorative)
400  Regular    → body text, descriptions, table data
500  Medium     → nav items, card titles, button labels
600  Semibold   → page headings, important labels, stat numbers
700  Bold       → hero numbers on dashboard, critical alerts
```

## Typography Rules

```
RULE 1: Never use font-size below 12px
RULE 2: Body text is always 14px/400 weight
RULE 3: Dashboard numbers (stats) are always 30px/700 weight
RULE 4: Tracking codes use JetBrains Mono — example: CNR-A3X7P2
RULE 5: Never use more than 2 font weights in one card
```

---

# 4. Spacing & Layout System

## Spacing Scale (Tailwind compatible)

```
4px   (1)   → tight internal padding, icon gaps
8px   (2)   → badge padding, small gaps
12px  (3)   → input padding, compact list items
16px  (4)   → card padding (mobile), standard gaps
20px  (5)   → standard spacing
24px  (6)   → card padding (desktop), section gaps
32px  (8)   → section padding, large gaps
40px  (10)  → page section separation
48px  (12)  → major section breaks
64px  (16)  → landing page section gaps
```

## Layout Structure — Desktop

```
┌─────────────────────────────────────────────────────┐
│  NAVBAR  48px height  full width  sticky top         │
├───────────────┬─────────────────────────────────────┤
│               │                                     │
│   SIDEBAR     │         MAIN CONTENT                │
│   240px       │         flex-1                      │
│   fixed       │         padding: 24px               │
│   full height │         scrollable                  │
│               │         max-width: 1400px            │
│               │         margin: 0 auto               │
│               │                                     │
└───────────────┴─────────────────────────────────────┘
```

## Layout Structure — Tablet (768px - 1024px)

```
┌─────────────────────────────────────────────────────┐
│  NAVBAR  48px  with hamburger menu icon              │
├─────────────────────────────────────────────────────┤
│                                                     │
│         MAIN CONTENT (full width)                   │
│         padding: 16px                               │
│         sidebar becomes overlay drawer              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Layout Structure — Mobile (below 768px)

```
┌──────────────────────────┐
│  NAVBAR  48px            │
│  Logo + hamburger        │
├──────────────────────────┤
│                          │
│  MAIN CONTENT            │
│  padding: 16px           │
│  single column always    │
│                          │
├──────────────────────────┤
│  BOTTOM NAV BAR  56px    │
│  5 icons max             │
│  (mobile only)           │
└──────────────────────────┘
```

## Grid System

```
Desktop:  12-column grid, gap 24px
Tablet:   8-column grid, gap 16px
Mobile:   4-column grid, gap 12px

Dashboard stat cards:  4 columns desktop / 2 tablet / 1 mobile
Project cards:         3 columns desktop / 2 tablet / 1 mobile
Form fields:           2 columns desktop / 1 mobile
```

---

# 5. Logo & Brand Identity

## Logo Concept

```
Shape:    A city grid of 3x3 dots connected by lines
          Center dot is larger — represents the nexus point
          Think: simplified circuit board meets city map grid

Style:    Geometric, minimal, vector
Colors:   Primary Navy #0F2744 + Accent Teal #0E9F6E
          In dark mode: white dots + teal connections
```

## Logo Sizes

```
Favicon:        16x16px  → just the center nexus dot in teal
Sidebar logo:   32x32px icon + "Urban Nexus" text (Inter 600)
Email/docs:     120x40px full lockup
Landing hero:   64x64px icon + large text
```

## Logo Text Treatment

```
"Urban"  → Inter 700, Primary Navy (light) / White (dark)
"Nexus"  → Inter 700, Accent Teal #0E9F6E always
Combined → never change the two-color treatment
```

## Implementation as SVG (give this to ID 3)

```svg
<!-- Simplified nexus grid icon -->
<svg width="32" height="32" viewBox="0 0 32 32">
  <!-- Grid dots -->
  <circle cx="8"  cy="8"  r="2" fill="#0E9F6E"/>
  <circle cx="16" cy="8"  r="2" fill="#0E9F6E"/>
  <circle cx="24" cy="8"  r="2" fill="#0E9F6E"/>
  <circle cx="8"  cy="16" r="2" fill="#0E9F6E"/>
  <circle cx="16" cy="16" r="4" fill="#0F2744"/>  <!-- center nexus -->
  <circle cx="24" cy="16" r="2" fill="#0E9F6E"/>
  <circle cx="8"  cy="24" r="2" fill="#0E9F6E"/>
  <circle cx="16" cy="24" r="2" fill="#0E9F6E"/>
  <circle cx="24" cy="24" r="2" fill="#0E9F6E"/>
  <!-- Connection lines -->
  <line x1="8"  y1="8"  x2="16" y2="16" stroke="#0E9F6E" stroke-width="1" opacity="0.5"/>
  <line x1="24" y1="8"  x2="16" y2="16" stroke="#0E9F6E" stroke-width="1" opacity="0.5"/>
  <line x1="8"  y1="24" x2="16" y2="16" stroke="#0E9F6E" stroke-width="1" opacity="0.5"/>
  <line x1="24" y1="24" x2="16" y2="16" stroke="#0E9F6E" stroke-width="1" opacity="0.5"/>
  <line x1="8"  y1="16" x2="16" y2="16" stroke="#0E9F6E" stroke-width="1" opacity="0.5"/>
  <line x1="24" y1="16" x2="16" y2="16" stroke="#0E9F6E" stroke-width="1" opacity="0.5"/>
  <line x1="16" y1="8"  x2="16" y2="16" stroke="#0E9F6E" stroke-width="1" opacity="0.5"/>
  <line x1="16" y1="24" x2="16" y2="16" stroke="#0E9F6E" stroke-width="1" opacity="0.5"/>
</svg>
```

---

# 6. Component Library

## 6.1 Buttons

```
PRIMARY BUTTON
Background:  #1A56DB
Text:        white, 14px, Inter 500
Padding:     10px 20px
Border:      none
Radius:      8px
Hover:       background #1E429F, translateY(-1px), shadow-md
Active:      background #1E3A8A, translateY(0)
Disabled:    opacity 0.5, cursor not-allowed
Animation:   transition all 150ms ease

SECONDARY BUTTON
Background:  transparent
Text:        #1A56DB, 14px, Inter 500
Border:      1px solid #1A56DB
Radius:      8px
Padding:     10px 20px
Hover:       background #EFF6FF

DANGER BUTTON
Background:  #E02424
Text:        white
Same sizing as primary
Hover:       background #C81E1E

GHOST BUTTON
Background:  transparent
Text:        #475569, 14px
Border:      none
Padding:     8px 12px
Hover:       background #F1F5F9

ICON BUTTON
Size:        36x36px
Background:  transparent
Border:      1px solid #E2E8F0
Radius:      8px
Hover:       background #F1F5F9
```

## 6.2 Cards

```
STANDARD CARD
Background:  white (light) / #111827 (dark)
Border:      1px solid #E2E8F0 (light) / #1F2937 (dark)
Radius:      12px
Padding:     24px
Shadow:      0 1px 3px rgba(0,0,0,0.08)
Hover:       shadow 0 4px 12px rgba(0,0,0,0.12), translateY(-2px)
Animation:   transition all 150ms ease

STAT CARD (dashboard numbers)
Same as standard card
Contains:
  → Icon (24px, colored by type) top-left
  → Large number (30px/700) center
  → Label (13px/400, muted) below number
  → Trend indicator (small arrow + percentage) bottom

ALERT CARD (for clashes)
Border-left: 4px solid #E02424
Background:  #FEF2F2 (light) / #1F1010 (dark)
Same padding as standard card
Pulsing left border animation for unresolved clashes
```

## 6.3 Badges & Status Indicators

```
STATUS BADGE
Height:      24px
Padding:     0 8px
Radius:      full (9999px)
Font:        12px Inter 500
Colors:      from Status Color System (section 2)
Example:     <span class="badge badge-pending">Pending</span>

TYPE BADGE
Same sizing
Colors:      from Project Type Color System (section 2)

CLASH INDICATOR
Red dot 8px diameter
Position:    absolute top-right of project card
Animation:   pulse 2s infinite
             0% { opacity: 1; transform: scale(1) }
             50% { opacity: 0.5; transform: scale(1.4) }
             100% { opacity: 1; transform: scale(1) }
```

## 6.4 Tables

```
TABLE CONTAINER
Background:  white / #111827
Border:      1px solid #E2E8F0 / #1F2937
Radius:      12px
Overflow:    hidden

TABLE HEADER
Background:  #F8FAFC / #0A0F1E
Text:        12px Inter 600 uppercase, #64748B
Padding:     12px 16px
Border-bottom: 1px solid #E2E8F0

TABLE ROW
Padding:     14px 16px
Border-bottom: 1px solid #F1F5F9 / #1F2937
Hover:       background #F8FAFC / #1F2937
Animation:   transition background 100ms

MOBILE TABLE
Collapses to card view on mobile
Each row becomes a card with label: value pairs
```

## 6.5 Form Elements

```
INPUT FIELD
Height:      40px
Background:  white / #1F2937
Border:      1px solid #E2E8F0 / #374151
Radius:      8px
Padding:     0 12px
Font:        14px Inter 400
Focus:       border #1A56DB, ring 3px #BFDBFE
Error:       border #E02424, ring 3px #FEE2E2
Placeholder: #94A3B8

SELECT
Same as input field
Custom chevron icon right side

TEXTAREA
Same as input, min-height 80px, resize vertical only

FORM LABEL
Font:        13px Inter 500
Color:       #374151 / #D1D5DB
Margin-bottom: 6px

ERROR MESSAGE
Font:        12px Inter 400
Color:       #E02424
Margin-top:  4px
Icon:        small warning circle left of text

FORM SECTION GROUPING
Each logical group of fields in a card
Card title 16px/600 at top
Fields below with 16px gap between
```

## 6.6 Navigation — Sidebar

```
SIDEBAR CONTAINER
Width:       240px fixed desktop
Background:  #0F2744 light / #080D1A dark
Padding:     16px 12px

LOGO AREA
Height:      64px
Padding:     16px
Logo icon + "Urban Nexus" text
Border-bottom: 1px solid #1E3A5F

NAV SECTION LABEL
Font:        11px Inter 600 uppercase
Color:       #475569
Padding:     16px 12px 8px
Letter-spacing: 0.08em

NAV ITEM
Height:      40px
Padding:     0 12px
Radius:      8px
Display:     flex, align-center, gap 10px
Icon:        20px, color #6B7280
Text:        14px Inter 500, color #94A3B8
Hover:       background #1E3A5F, icon+text color #E2E8F0
Active:      background #1A56DB, icon+text color white
Animation:   transition all 100ms ease

NAV BADGE (notification count)
Height:      20px, min-width 20px
Background:  #E02424
Text:        11px white Inter 600
Radius:      full
Position:    right side of nav item

SIDEBAR FOOTER
Position:    absolute bottom 0
Padding:     16px
Border-top:  1px solid #1E3A5F
User avatar + name + role
Settings icon right side
```

## 6.7 Top Navbar

```
NAVBAR CONTAINER
Height:      48px
Background:  white / #111827
Border-bottom: 1px solid #E2E8F0 / #1F2937
Padding:     0 24px
Position:    sticky top 0
Z-index:     50

LEFT SIDE
Page title (current page name) 18px/600
Breadcrumb on some pages (Dashboard > Projects)

RIGHT SIDE
Search icon button
Notification bell with red badge
Dark/light mode toggle
User avatar with dropdown
  → Profile
  → Settings
  → Logout

MOBILE NAVBAR
Left:  Hamburger icon + Logo
Right: Notification bell + Avatar
```

## 6.8 Mobile Bottom Navigation

```
Visible only on screens below 768px

CONTAINER
Height:      56px
Background:  white / #111827
Border-top:  1px solid #E2E8F0 / #1F2937
Position:    fixed bottom 0
Display:     flex, justify space-around, align-center
Z-index:     50

BOTTOM NAV ITEMS (5 max)
For Admin:    Map, Projects, Conflicts, Reports, Menu
For Officer:  Map, Projects, Conflicts, Tasks, Menu
For Citizen:  Map, Report, Track, (empty), (empty)

Each item:
Icon:        24px
Label:       10px Inter 500
Active:      teal color #0E9F6E
Inactive:    #94A3B8
```

## 6.9 Modals

```
OVERLAY
Background:  rgba(0,0,0,0.5)
Backdrop-blur: 4px
Animation:   fade in 150ms

MODAL CONTAINER
Background:  white / #111827
Border:      1px solid #E2E8F0 / #1F2937
Radius:      16px
Padding:     24px
Width:       90vw max-width 560px (standard)
             90vw max-width 800px (large, e.g. project form)
Shadow:      0 20px 60px rgba(0,0,0,0.3)
Animation:   scale 0.95→1.0, opacity 0→1, 150ms ease

MODAL HEADER
Title:       18px Inter 600
Close button: top-right X icon button
Border-bottom: 1px solid #E2E8F0

MODAL FOOTER
Border-top:  1px solid #E2E8F0
Padding-top: 16px
Buttons:     right-aligned, Cancel (ghost) + Confirm (primary)
```

## 6.10 Toast Notifications

```
CONTAINER POSITION
Desktop:     top-right, 16px from edge
Mobile:      top-center, 16px from top
Z-index:     9999

TOAST
Width:       360px desktop / 90vw mobile
Background:  white / #1F2937
Border-left: 4px solid (color by type)
Radius:      10px
Padding:     14px 16px
Shadow:      0 4px 16px rgba(0,0,0,0.15)

Animation in:  translateX(100%)→0, opacity 0→1, 300ms spring
Animation out: translateX(100%), opacity 0, 200ms ease
Auto-dismiss:  5 seconds (error: 8 seconds, stays until closed)

TOAST TYPES
Success:  border #0E9F6E, icon green checkmark
Error:    border #E02424, icon red X
Warning:  border #E3A008, icon amber warning
Info:     border #1A56DB, icon blue info
Clash:    border #E02424, background #FEF2F2
          icon: red alert triangle
          title: "Clash Detected"
          stays until manually dismissed

TOAST CONTENT
Icon:        24px left side
Title:       14px Inter 600
Description: 13px Inter 400, muted color
Close icon:  top-right, 16px
```

## 6.11 Skeleton Loaders

```
Used whenever data is being fetched from API

SKELETON BASE
Background:  linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)
Dark mode:   linear-gradient(90deg, #1F2937 25%, #374151 50%, #1F2937 75%)
Background-size: 400% 100%
Animation:   shimmer 1.5s infinite linear
             @keyframes shimmer { 0% { background-position: 100% 0 } 100% { background-position: -100% 0 } }

SKELETON SHAPES
Line:   height 12-16px, radius 4px, various widths
Circle: exact dimensions of avatar/icon being replaced
Card:   full card dimensions with skeleton lines inside
Table:  skeleton rows matching expected row count
```

---

# 7. Page-by-Page Design

## 7.1 Landing Page (Public — no login required)

### Desktop Layout
```
SECTION 1 — HERO
Full width, min-height 100vh
Background: gradient from #0F2744 to #0A1628
Split layout: 55% text left / 45% graphic right

Left content:
  Small label: "Smart Urban Governance" (teal badge)
  H1: "One Platform for" (white, 48px/700)
        "Every City Project" (teal, 48px/700)
  Body: 18px/400 white/70% opacity, 2-3 lines about problem
  Two CTA buttons:
    → "Get Started" (primary large button)
    → "View Live Map" (ghost button, white border)
  Trust line: "Used by city departments across India"

Right graphic:
  Animated dashboard preview (screenshot or illustration)
  Floating cards showing: "Clash Detected" alert, MCDM score
  Subtle floating animation: translateY(-8px) loop 3s ease

SECTION 2 — PROBLEM STATEMENT
Background: white / #111827
Padding: 80px 0
Center-aligned heading: "The Problem With How Cities Work Today"
3 problem cards side by side:
  Card 1: Icon (silos) + "Departments Work in Silos"
  Card 2: Icon (conflict) + "Projects Clash and Waste Budget"
  Card 3: Icon (chaos) + "Citizens See Zero Transparency"

SECTION 3 — HOW IT WORKS
Background: #F8FAFC / #0A0F1E
Padding: 80px 0
Heading: "How Urban Nexus Solves It"
3-step horizontal flow with connecting arrows:
  Step 1: Submit Project (icon + description)
  Step 2: Auto Clash Detection (icon + description)
  Step 3: Smart Execution Order (icon + description)

SECTION 4 — FEATURES
Background: white / #111827
Padding: 80px 0
Heading: "Everything a City Needs"
6 feature cards in 3x2 grid:
  → Conflict Detection
  → MCDM Priority Scoring
  → Dependency Graph
  → Real-time Alerts
  → Citizen Reporting
  → Role Based Access

SECTION 5 — MAP PREVIEW
Full width, height 500px
Live Leaflet map showing demo project polygons
Overlay card: "See every project in your city, in real time"
Button: "View Full Map"

SECTION 6 — CTA FOOTER
Background: #0F2744
Padding: 80px
Center-aligned:
  Heading: "Ready to coordinate smarter?"
  Button: "Login to Dashboard"
  Link: "Report a City Issue →"

FOOTER
Dark background
Logo left
Links: About, Features, Report Issue, Login
Copyright right
```

### Mobile Landing Page
```
All sections stack vertically single column
Hero: text only, no graphic (below 768px)
Problem cards: vertical stack
Feature cards: 2x3 grid
Map preview: height 300px
CTA: full width button
Bottom sticky bar: "Login" + "Report Issue" buttons
```

---

## 7.2 Login Page

```
Layout: centered card on subtle background
Background: #F8FAFC with subtle grid pattern / dark: #0A0F1E

CARD
Width:     440px / 90vw mobile
Padding:   40px
Radius:    16px
Shadow:    0 8px 32px rgba(0,0,0,0.12)

CONTENT TOP TO BOTTOM:
1. Logo (48px icon + brand name)
2. Heading: "Welcome back" (24px/600)
3. Subtext: "Sign in to your Urban Nexus account" (14px muted)
4. Email input (full width)
5. Password input with show/hide toggle
6. "Sign in" primary button (full width, height 44px)
7. Divider line
8. Link: "Report a city issue without login →" (teal color)

NO register link (accounts created by admin only)
NO forgot password for MVP
```

---

## 7.3 Admin Dashboard

### Desktop Layout
```
HEADER ROW
Page title: "Dashboard" (20px/600)
Right: Date range selector + Refresh button

STATS ROW (4 cards, full width)
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Total       │ Active      │ Open        │ Citizen     │
│ Projects    │ Clashes     │ Approvals   │ Reports     │
│             │             │             │             │
│ 142         │ 3           │ 8           │ 89          │
│ (30px/700)  │ (red color) │ (amber)     │             │
│ +12 this mo │ needs action│ pending     │ 12 open     │
└─────────────┴─────────────┴─────────────┴─────────────┘

ROW 2: Two columns 65% / 35%
Left: Projects by Status (bar chart, Recharts)
      X-axis: departments
      Y-axis: project count
      Bars colored by status
Right: Active Clashes list
       Each clash: two dept names + red badge + "Resolve" button
       Max 5 shown, "View all" link

ROW 3: Two columns 50% / 50%
Left: Recent Activity feed
      Timeline list of last 10 actions
      Icon + action text + timestamp
      "Rahul submitted MG Road Repair — 2 hours ago"
Right: Department Performance
       Table: Dept | Projects | On Time | Clashes
       Small bar indicator for on-time rate

ROW 4: Full width
Zone Activity Map (mini Leaflet map, height 300px)
Shows project density as colored polygons
"View Full Map" button top-right
```

### Mobile Admin Dashboard
```
Stats: 2x2 grid
Charts: single column, full width
Activity feed: full width
Map: full width, 250px height
Department table: horizontal scroll
```

---

## 7.4 Department Officer Dashboard

```
HEADER
"Good morning, Rahul" (personalized)
Department badge: "PWD — Public Works Department"

STATS ROW (3 cards)
My Projects | Pending Approval | Active Clashes (mine)

MAIN CONTENT: Two columns 60/40
Left:
  "My Projects" table
  Columns: Title | Type | Status | Dates | Progress
  Progress shown as thin progress bar in cell
  Row click → project detail
  "Submit New Project" button top-right of table

Right:
  "My Clash Alerts" card
  Each clash with recommendation preview
  "View Full Details" per clash
  
  Below: "Quick Submit" mini form
  Just title + type + dates
  "Full Form" link for complete submission
```

---

## 7.5 Project Submission Form

```
Full page form (not modal — too much content)
or Large modal on desktop (800px wide)

FORM SECTIONS:

SECTION 1: Basic Info
  Project Title (full width)
  Project Type (select with colored icons)
  Description (textarea)
  Priority (radio cards: Low / Medium / High / Critical)
  Each radio card has icon + label + description

SECTION 2: Location
  Heading: "Draw project area on map"
  Full width Leaflet map, height 400px
  Toolbar above map: Draw Polygon | Clear | Undo
  Instruction text: "Click to place points, double-click to finish"
  Below map: Address text input (manual fallback)

SECTION 3: Timeline & Budget
  Two columns:
  Start Date | End Date  (date pickers)
  Estimated Cost (number input with ₹ prefix)

SECTION 4: Priority Criteria (MCDM inputs)
  Heading: "Rate this project on 5 criteria (1-10)"
  Subtext: "These scores help resolve conflicts fairly"
  5 slider inputs:
    Urgency           (1-10 slider)
    Social Impact     (1-10 slider)
    Cost Efficiency   (1-10 slider)
    Feasibility       (1-10 slider)
    Environment       (1-10 slider)
  Each slider shows number value on right

SECTION 5: Dependencies
  Heading: "Does this project depend on another?"
  Searchable multi-select of existing projects
  Selected items show as removable chips below

FORM FOOTER (sticky bottom)
  Left: "Cancel" ghost button
  Right: "Submit Project" primary button
  On submit: loading spinner in button
  On success: redirect to project detail
  On clash: modal showing clash details
```

---

## 7.6 Projects List Page

```
HEADER
Title: "Projects"
Right side: Search input + Filter button + "New Project" button

FILTER BAR (collapsible)
Status filter chips: All | Pending | Approved | Ongoing | Completed
Type filter: All | Road | Water | Electricity | Sewage | Parks
Department: dropdown (admin only)
Date range: from/to date inputs

CONTENT: Toggle between Table and Card view (icon buttons)

TABLE VIEW (desktop default)
Columns: Title | Dept | Type | Status | Start | End | Progress | Actions
Sortable columns (click header)
Actions: View (eye icon) | Edit (pencil) | Delete (trash, admin only)
Clash indicator: red dot on row if project has open clash

CARD VIEW (mobile default)
Each project card:
  Top: type color bar (6px left border)
  Title (16px/600)
  Department badge + Status badge
  Dates row: "Jun 1 → Jun 15" with calendar icon
  Progress bar (thin, full width)
  Bottom: "View Details" button
  Clash badge top-right if clashed

EMPTY STATE
Illustration of empty city (simple SVG)
Text: "No projects found"
Button: "Submit First Project"

PAGINATION
Bottom of list
Page numbers + prev/next arrows
"Showing 1-20 of 142 projects"
```

---

## 7.7 Project Detail Page

```
HEADER
Back button ← "Projects"
Project title (24px/700)
Right: Status badge + Edit button (if own project) + Approve/Reject (admin)

TOP SECTION: Two columns 60/40

Left Column:
  Details card:
    Type badge + Priority badge
    Department: PWD
    Submitted by: Rahul Sharma
    Submitted: May 20, 2025
    Start: Jun 1, 2025 → End: Jun 15, 2025
    Estimated Cost: ₹5,00,000
    Progress: [===-------] 30%
    Description paragraph

  MCDM Scores card (shows if conflict exists):
    Heading: "Priority Score: 0.84"
    5 criteria bars showing individual scores
    Explanation text: "This project ranked 1st among 2 conflicting projects"

Right Column:
  Mini map (height 250px)
  Project polygon highlighted in type color
  "View on Full Map" link

  Dependencies card (if any):
    "Must complete before this project:"
    Chip list of dependent project names

BOTTOM SECTION: Full width
  MCDM Execution Recommendation card (if clashed):
    Background: light blue tinted
    "Recommended Execution Order:"
    Numbered list: 1. Water Pipeline  2. Road Repair
    "Admin approved this order" or "Pending Admin Resolution"

  Activity Timeline:
    Vertical timeline of all actions on this project
    Each entry: colored dot + action + user + timestamp
```

---

## 7.8 Conflicts Page

```
HEADER
Title: "Conflicts"
Stats row: Open (red) | Resolved (green) | Total

CONFLICT LIST
Each conflict is a card:

┌────────────────────────────────────────────────┐
│ 🔴 CLASH DETECTED         Jun 5 – Jun 15 overlap│
├──────────────────┬─────────────────────────────┤
│ PWD              │ Water Board                 │
│ MG Road Repair   │ MG Pipeline Install         │
│ Score: 0.84 ★1   │ Score: 0.91 ★2             │
├──────────────────┴─────────────────────────────┤
│ Recommendation: Execute Pipeline first         │
│ [View Details]              [Resolve] (admin)  │
└────────────────────────────────────────────────┘

Open conflicts at top, resolved below (greyed)
```

---

## 7.9 Map View Page

```
LAYOUT: Full screen map with floating panels

MAP AREA: Full width and height (viewport - navbar)
  Leaflet map with CartoDB Positron tiles (light mode)
  Leaflet map with CartoDB DarkMatter tiles (dark mode)

FLOATING FILTER PANEL (top-left)
  White/dark card, width 220px
  Radius: 12px, shadow
  Filter by:
    Type (colored checkboxes)
    Status (toggle chips)
    Department (dropdown)
    Date range (compact)
  Collapse toggle button

FLOATING LEGEND (bottom-left)
  Small card showing color → type mapping
  Collapsible

PROJECT POLYGON ON MAP
  Fill: type color at 30% opacity
  Border: type color at 80% opacity, 2px
  Hover: fill opacity 60%, tooltip appears
  Clashed: red dashed border + pulsing effect

POLYGON TOOLTIP (on hover)
  Project name
  Department
  Status badge
  Dates
  "Click for details" hint

PROJECT DETAIL SIDEBAR (on polygon click)
  Slides in from right, width 320px
  Full project summary
  View Full Details button
  Close X button

CITIZEN REPORT PINS
  Small colored pins by issue type
  Clustered when zoomed out
  Click: shows report summary

ZOOM CONTROLS: top-right (default Leaflet)
FULLSCREEN BUTTON: top-right
```

---

## 7.10 Citizen Report Page (Public)

```
HEADER: Navbar with logo only (no sidebar)
No login required

TWO SECTION LAYOUT desktop / Single column mobile

LEFT: Form (40% width)
  Heading: "Report a City Issue"
  Subtext: "No account needed. Takes 30 seconds."
  
  FORM FIELDS:
    Issue Type (icon cards: Pothole | Streetlight | Water Leak | Garbage | Other)
    Each card: icon + label, selected state has teal border
    
    Description (textarea, optional)
    "Describe the issue briefly"
    
    Photo upload (drag-drop zone or click to upload)
    Preview of uploaded image
    
    SUBMIT BUTTON (full width, large, 48px height)
    "Submit Report"

RIGHT: Map (60% width)
  Leaflet map, full height
  Heading above: "Drop a pin on the location"
  Click on map → places pin
  Pin is draggable
  Coordinates shown below map (small, monospace)
  Current location button (GPS icon)

SUCCESS STATE (after submit):
  Replace form with success card:
  Green checkmark animation
  "Report Submitted!"
  "Your tracking ID:" CNR-A3X7P2 (large monospace, copyable)
  "Save this ID to track your report status"
  Button: "Track My Report"
  Button: "Submit Another"

TRACK REPORT PAGE:
  Simple centered card
  Input: Enter tracking ID
  Button: Track
  Result card below showing status timeline
```

---

## 7.11 Supervisor Task View (My Tasks)

```
Simple focused layout — mobile first

HEADER
"My Tasks"
Filter: All | In Progress | Completed

TASK CARDS (single column, full width)
Each task card:
  Project title (large)
  Department badge
  Location: address text
  Dates: Start → End
  Progress: large progress bar with percentage text
  Status badge
  
  PROGRESS UPDATE SECTION:
    Slider: 0% to 100%
    Current value shown large
    "Update Progress" button
    
  MAP BUTTON: "View Location on Map" → opens map modal

MOBILE OPTIMIZED:
  Cards are thumb-friendly, min height 140px
  Large touch targets on all interactive elements
  Progress slider is tall (40px height) for easy touch
```

---

## 7.12 Audit Log Page (Admin Only)

```
HEADER
Title: "Audit Log"
Filter: By user | By action type | By date range
Export button: "Export CSV"

TABLE
Columns: Timestamp | User | Role | Action | Resource | Details
Timestamp: monospace, 12px
Action: colored badge (created=blue, approved=green, rejected=red, resolved=teal)
Details: expandable row on click showing before/after JSON diff

Row color coding:
  Admin actions: neutral
  Conflict resolutions: subtle teal left border
  Rejections: subtle red left border
```

---

# 8. Map Design System

## Tile Layers

```
Light mode: CartoDB Positron
URL: https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png
Attribution: CartoDB

Dark mode: CartoDB DarkMatter
URL: https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png
```

## Map Interaction Rules

```
Default zoom:     13 (city ward level)
Min zoom:         10 (city overview)
Max zoom:         18 (street level)
Default center:   Set from user's department area or city center

On project card click → map flies to project polygon
                        flyTo animation, duration 800ms

On map polygon click → detail sidebar slides in (300ms)
On map polygon hover → tooltip appears (no delay)
```

## Polygon Styling Per Status

```
pending:    fill typeColor 20% opacity, border typeColor 60% 2px dashed
approved:   fill typeColor 25% opacity, border typeColor 80% 2px solid
ongoing:    fill typeColor 35% opacity, border typeColor 100% 3px solid
completed:  fill #94A3B8 20% opacity, border #94A3B8 60% 1px solid
clashed:    fill #E02424 25% opacity, border #E02424 100% 2px dashed
            + pulsing animation on border
rejected:   fill #94A3B8 10% opacity, border #94A3B8 40% 1px solid
```

---

# 9. Animation System

## Library: Framer Motion

```
Installation: npm install framer-motion
```

## Animation Constants (define in src/utils/animations.js)

```javascript
export const animations = {
  // Page transitions
  pageEnter: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.15, ease: 'easeOut' }
  },

  // Modal
  modalOverlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.15 }
  },
  modalContent: {
    initial: { opacity: 0, scale: 0.95, y: -8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.15, ease: 'easeOut' }
  },

  // Sidebar slide (mobile)
  sidebarSlide: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
    transition: { duration: 0.25, ease: 'easeInOut' }
  },

  // Detail panel slide (map)
  panelSlide: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },

  // Toast
  toastEnter: {
    initial: { opacity: 0, x: 48, scale: 0.95 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: 48 },
    transition: { duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }
  },

  // Card hover (use CSS, not Framer)
  // transition: all 150ms ease
  // hover: translateY(-2px), shadow increase

  // Skeleton pulse (use CSS)
  // animation: shimmer 1.5s infinite linear

  // Stats counter (number count up on load)
  // Use: react-countup library
  counterConfig: { duration: 1.5, separator: ',', useEasing: true }
}
```

## Animation Rules

```
RULE 1: Page transitions max 150ms — users should not wait for animations
RULE 2: Never animate layout-affecting properties (width, height)
        Only animate opacity, transform, scale
RULE 3: Modals always have exit animations (AnimatePresence in Framer)
RULE 4: Skeleton loaders replace spinners everywhere possible
RULE 5: Mobile animations are 20% faster than desktop (less powerful devices)
RULE 6: Respect prefers-reduced-motion media query
        If user has reduced motion preference → disable all animations
```

---

# 10. Dark Mode Implementation

## Strategy: Tailwind CSS dark mode with class strategy

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',  // toggle by adding 'dark' class to <html>
  ...
}
```

## Toggle Logic

```javascript
// store/themeStore.js (Zustand)
const useThemeStore = create((set) => ({
  theme: localStorage.getItem('theme') || 'light',
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light'
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    return { theme: newTheme }
  })
}))
```

## Dark Mode Toggle Component

```
In navbar right side:
Sun icon (light mode) / Moon icon (dark mode)
Icon button, 36x36px
On click: smooth transition via CSS
  html { transition: background-color 200ms, color 200ms }
```

---

# 11. Responsive Breakpoints

```
Mobile:   < 768px     → sm in Tailwind
Tablet:   768-1024px  → md in Tailwind
Desktop:  > 1024px    → lg in Tailwind
Wide:     > 1280px    → xl in Tailwind
```

## Feature Visibility by Device

```
Feature                    Mobile    Tablet    Desktop
─────────────────────────────────────────────────────
Sidebar (permanent)        ✗         ✗         ✓
Bottom nav bar             ✓         ✗         ✗
Sidebar (overlay drawer)   ✓         ✓         ✗
Dashboard charts           minimal   full      full
Table view (projects)      cards     cards     table
Full map page              ✓         ✓         ✓
Map sidebar panel          full page overlay   panel
MCDM criteria sliders      ✓         ✓         ✓
Audit log                  ✓ (basic) ✓         ✓ (full)
```

---

# 12. Loading & Empty States

## Loading States

```
Initial page load:      Full page skeleton (not spinner)
Table loading:          5 skeleton rows
Card grid loading:      Ghost cards (same size as real cards)
Map loading:            Map tiles load naturally (Leaflet handles)
Button loading:         Spinner replaces button icon, text stays
                        Button disabled during load
Form submit loading:    Button spinner + all inputs disabled
Stats loading:          Skeleton in stat card number area
```

## Empty States

```
Every list and table needs an empty state.

Empty projects list:
  SVG illustration: empty city buildings
  Heading: "No projects yet"
  Subtext: "Submit your department's first project"
  Button: "Submit Project" (for officers/admin)

Empty conflicts:
  SVG: green checkmark city
  Heading: "No active conflicts"
  Subtext: "All projects are running smoothly"

Empty audit log:
  Simple: "No activity recorded yet"

Empty citizen reports:
  "No reports in this area"
```

## Error States

```
API error (network/server):
  Error card replacing content
  Icon: warning triangle
  Heading: "Something went wrong"
  Subtext: error message (dev) or generic (prod)
  Button: "Try Again" (retriggers the query)

404 Page:
  Large "404" in primary color
  "Page not found"
  Button: "Go to Dashboard"

403 Page:
  "You don't have access to this page"
  Button: "Go Back"
```

---

# 13. Additional Libraries Required

```
npm install framer-motion          → animations
npm install react-countup          → stat number count-up on dashboard
npm install react-hook-form        → form handling
npm install @hookform/resolvers yup → form validation
npm install react-query @tanstack/react-query → server state
npm install zustand                → global state
npm install react-router-dom       → routing
npm install leaflet react-leaflet  → maps
npm install @react-leaflet/core    → map core
npm install leaflet-draw           → polygon drawing
npm install recharts               → charts
npm install react-hot-toast        → toast notifications (simpler than custom)
npm install lucide-react           → icons
npm install clsx                   → conditional classnames
npm install date-fns               → date formatting
```

---

# 14. Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0A0F1E',
          800: '#0F2744',
          700: '#1E3A5F',
          600: '#1A56DB',
        },
        teal: {
          500: '#0E9F6E',
        },
        surface: {
          light: '#F8FAFC',
          dark: '#0A0F1E',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'card': '12px',
        'modal': '16px',
        'button': '8px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.12)',
        'modal': '0 20px 60px rgba(0,0,0,0.3)',
        'toast': '0 4px 16px rgba(0,0,0,0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 2s infinite',
        'shimmer': 'shimmer 1.5s infinite linear',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '100% 0' },
          '100%': { backgroundPosition: '-100% 0' },
        }
      }
    }
  },
  plugins: []
}
```

---

*This file defines every visual decision for Urban Nexus.*
*ID 3 and ID 4 build from this file exclusively.*
*Never make a visual decision not covered here without updating this file first.*