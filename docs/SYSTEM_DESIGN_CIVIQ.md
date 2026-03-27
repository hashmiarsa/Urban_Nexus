# Urban Nexus — Final Product Definition
> Complete record of every decision made from North Star to MCDM simulation.
> This is the single source of truth for all design and development decisions.
> Last updated: After full MCDM input discussion and simulation.

---

## 1. NORTH STAR

> **Urban Nexus exists because city departments plan in silos, causing the same roads to be dug up multiple times — wasting public money and making citizens suffer for months.**

This sentence is the judge of every feature.
If a feature does not serve this sentence — it does not belong in this product.

---

## 2. THE REAL WORLD PROBLEM

In Indian cities like Ghaziabad:

- PWD (roads), Jal Nigam (water), PVVNL (electricity), Parks Department, Municipal Corporation all operate independently
- Each department has its own annual budget — already approved by the state
- Each department plans and executes projects without informing other departments
- Result: PWD lays fresh asphalt. Two months later Jal Nigam digs it up for pipeline work. Brand new road destroyed. Citizens suffer for months or years waiting for repairs.

**The problem is NOT budget approval.**
Each department already has their budget allocated annually.

**The problem is missing communication and coordination BEFORE ground work begins.**

Urban Nexus is NOT a budget management tool.
Urban Nexus is a clash detection and forced coordination platform.

---

## 3. REAL INDIAN GOVERNMENT HIERARCHY

Understanding how Indian municipal government actually works:

```
MUNICIPAL COMMISSIONER (IAS Officer)
Appointed by state government
Final authority over entire city
Signs off on large budgets
Coordinates between departments

        ↓

EXECUTIVE ENGINEERS / DEPARTMENT HEADS
One per department (PWD, Jal Nigam, PVVNL, Parks)
Plans and submits projects for their department
Has own annual budget allocation
Does NOT need approval for every project from commissioner
Needs approval only above certain budget threshold

        ↓

JUNIOR ENGINEERS / SITE SUPERVISORS
Work under department head
Assigned to specific project sites
Update daily progress
No decision-making authority

        ↓

CITIZENS
No role in planning
File complaints
See public notices
```

**Key insight:** Every department already has annual budget. They can spend within their allocation independently. The clash happens not because of missing approval — it happens because of missing communication between departments.

---

## 4. FOUR USERS — COMPLETE ROLES AND AUTHORITY

---

### ADMIN
**Real world equivalent:** Municipal Coordinator / City-level authority above all departments

**Single job in one sentence:**
Detect clashes between departments and coordinate them before ground work begins.

**Authority:**
- See ALL projects from ALL departments
- Approve or reject any submitted project
- See all MCDM scores and clash alerts
- Resolve clashes — approve both with coordination note OR reject lower priority
- Override MCDM recommendation (4 categories only, always logged)
- Manage all users — create, deactivate
- See complete audit log of every action in the system
- See department performance analytics

**Cannot do:**
- Assign supervisors to projects (Officer's job only)
- Submit projects on behalf of any department
- See internal department staffing or resource details

---

### OFFICER
**Real world equivalent:** Executive Engineer / Department Head

**Single job in one sentence:**
Submit department projects and track their approval and execution status.

**Authority:**
- Submit projects for their own department only
- See all their department's projects and current status
- Get notified automatically when their project has a clash
- Respond to clash rejections — accept Admin's suggested date OR propose a custom date (must be equal or later than suggestion)
- Assign supervisors from their own department only
- See their department's conflict notifications and resolution status

**Cannot do:**
- Approve projects (Admin only)
- Resolve clashes between departments (Admin only)
- See other departments' internal project details
- Assign supervisors from other departments

---

### SUPERVISOR
**Real world equivalent:** Junior Engineer / Site Supervisor / Field Staff

**Single job in one sentence:**
Update progress on projects assigned to them.

**Authority:**
- See only projects assigned to them
- Update progress percentage on assigned projects
- View full project details — location, dates, scope, documents
- See project location on public map

**Cannot do:**
- Submit projects
- Approve or reject anything
- Assign anyone to any project
- Resolve clashes
- See projects not assigned to them

**Important note:**
Everything below supervisor level — laborers, contractors, daily workers — is outside the app. Supervisor manages their ground team through their own means. The app only tracks project-level progress, not labor management.

---

### CITIZEN
**Real world equivalent:** General public, residents of Ghaziabad

**Single job in one sentence:**
See what infrastructure work is happening near them and report problems.

**Authority:**
- View all approved and ongoing projects on public map — no login needed
- Filter projects by area or location
- See project details: name, department, type, expected completion, disruption warnings
- File a complaint — issue type, location pin, description, optional photo
- Receive a CNR tracking ID (format: CNR-XXXXXX) on submission
- Track complaint status using CNR ID through 4 stages

**Cannot do:**
- Login to the system
- See pending or rejected projects
- See internal department data — cost, MCDM scores, documents
- Approve, modify, or influence any decision directly

**Indirect influence:**
Citizen complaints feed into MCDM Criteria 1 (Condition Severity). High complaint volume about a location increases that area's priority score. Citizens indirectly influence which projects get prioritized.

---

## 5. COMPLETE CORE FLOW

```
OFFICER submits project
        ↓
System auto-runs MCDM scoring (7 criteria)
        ↓
System auto-checks geographic + time + work type clashes
        ↓
ADMIN sees pending project + MCDM score + clash alerts
        ↓
ADMIN decides:

┌──────────────────┬─────────────────┬──────────────────────┐
│  APPROVE BOTH    │  APPROVE ONE    │  REJECT ONE          │
│                  │                 │                      │
│ Timeline overlap │ No clash at all │ Deep clash,          │
│ is small, both   │ Straightforward │ lower MCDM score     │
│ projects valid   │ approval        │ project rejected     │
│                  │                 │                      │
│ Admin adds       │ Project becomes │ System suggests      │
│ coordination     │ ACTIVE          │ next safe date:      │
│ note + adjusts   │                 │ higher priority      │
│ one project's    │                 │ end date + buffer    │
│ dates            │                 │          ↓           │
│                  │                 │ Officer notified     │
│ Both ACTIVE      │                 │ with two options:    │
│ Sequential       │                 │                      │
│ execution        │                 │ ACCEPT DATE          │
│                  │                 │ or                   │
│                  │                 │ CUSTOM DATE          │
│                  │                 │ (must be equal       │
│                  │                 │  or later than       │
│                  │                 │  suggestion)         │
│                  │                 │          ↓           │
│                  │                 │ System rechecks      │
│                  │                 │ all 3 clash criteria │
│                  │                 │          ↓           │
│                  │                 │ If clean →           │
│                  │                 │ Admin final approval │
│                  │                 │          ↓           │
│                  │                 │ If new clash →       │
│                  │                 │ loop repeats         │
│                  │                 │ Natural end when     │
│                  │                 │ clean date found     │
└──────────────────┴─────────────────┴──────────────────────┘
        ↓
OFFICER assigns SUPERVISOR from own department
        ↓
SUPERVISOR updates progress percentage
        ↓
If project completes BEFORE buffer period ends:
System notifies next waiting project in queue
They can start from actual completion date
        ↓
CITIZEN sees all approved/ongoing projects on public map
```

---

## 6. PROJECT PHASE SYSTEM

### First Question On Form (Before Everything Else)
```
What type of submission is this?

○ New standalone project
○ New phased project (this is Phase 1 of a larger plan)
○ Continue existing project (Phase 2, 3, 4...)
```

### If Officer Selects "Continue Existing Project":
Dropdown shows their department's existing projects.
Officer selects the parent project.

**System AUTO-FILLS these fields (carry forward from Phase 1):**
- Project Title — editable, officer can add "Phase 2" suffix
- Project Type — locked, cannot change type between phases
- Department — locked, auto from login
- Contractor Name and Firm — editable, contractor may change
- Budget Source — editable
- Location polygon — editable, may expand area for new phase

**System BLANKS these fields (must fill fresh for new phase):**
- Start Date
- End Date
- Estimated Cost
- Assigned Supervisor
- All documents — new phase needs new documentation

### Visual Treatment Throughout System:
- Every Phase 2, 3 etc. is clearly labeled everywhere
- Linked to parent project on all views
- Admin dashboard, project detail, conflict detail all show:
  "Phase 2 of MG Road Reconstruction"
- Never treated as a new independent project anywhere

---

## 7. BUFFER SYSTEM

### Purpose
Gap between one project completing and the next beginning on the same location. Prevents new work starting before previous work has settled, cured, or been inspected.

### Rules
- Buffer is system-defined — Officer cannot change or see it
- Based on physical reality of how long each work type needs to settle
- Invisible to Officer — system rule only

### Buffer Values By Project Type
```
Road reconstruction:     14 days
Road resurfacing:         7 days
Water pipeline:          10 days
Sewage pipeline:         10 days
Electrical overhead:      5 days
Electrical underground:   7 days
Parks and plantation:     3 days
Other:                    7 days
```

### Suggested Next Date Formula
```
Suggested start for next project =
    Higher priority project END DATE + BUFFER DAYS
```

### Early Completion Notification
When Supervisor marks project as 100% complete before planned end date:
- System detects early completion
- System notifies next project in queue:
  "Project X completed early. You can now begin from
   [actual completion date] or any date up to [end date + buffer]."
- Next project Officer decides whether to start earlier based on their readiness

---

## 8. CLASH RESOLUTION — COMPLETE RULES

### The 3 Dimensions Of A Clash
ALL THREE must be true simultaneously. If even one is absent — no clash.

```
DIMENSION 1 — Geographic Overlap
Two project buffered zones intersect on the map

DIMENSION 2 — Time Overlap
Two project date ranges overlap on the calendar

DIMENSION 3 — Work Type Conflict
Two project types are incompatible per conflict matrix
```

### Clash Resolution Flow (Identical For All Clash Sizes)
No distinction between small and large clashes. Same flow always.

```
Any clash detected
        ↓
Admin sees both projects with MCDM scores side by side
        ↓
Admin has two choices:

CHOICE 1 — Approve Both With Coordination
Admin writes coordination note
Admin adjusts dates — projects run sequentially
Both become ACTIVE
Officer of adjusted project notified
Officer can accept adjusted date or propose later custom date
System rechecks — if clean, Admin final approval

CHOICE 2 — Reject Lower Priority Project
System auto-suggests next safe date
Formula: higher priority end date + buffer
Officer of rejected project notified
Officer sees rejection reason + suggested date
Officer chooses: ACCEPT or CUSTOM DATE
Custom date rule: must be equal or later than suggestion
System rechecks for new clashes
If clean → Admin final approval
If new clash → loop repeats
Loop ends naturally when officer finds a clean date
```

### The Custom Date Rule — Critical
```
Suggested date = MINIMUM allowed start date
Custom date: equal to or later — ALLOWED
Custom date: earlier than suggestion — BLOCKED by system

Reason: Higher priority project's timeline is sacred.
        Lower priority can only move forward in time.
        This is non-negotiable. System enforces it automatically.
```

### Why Officer Gets Custom Date Option
System only knows projects in Urban Nexus. Officer knows their ground reality — team availability, equipment schedule, internal department commitments not visible to the system. Custom date respects this knowledge while maintaining the safety constraint.

### No Project Dies Permanently
Every rejected project gets a suggested future date. The work will still happen — just in the right sequence. Urban Nexus sequences projects intelligently, it does not kill them.

---

## 9. ADMIN OVERRIDE SYSTEM

### Philosophy
MCDM is the expert advisor. Admin is the judge. Admin can override MCDM recommendation but must justify with a logged reason under one of 4 legitimate categories. This prevents corruption while respecting genuine human judgment for situations the system cannot quantify.

### The 4 Legitimate Override Categories

**Category 1 — Declared Emergency**
Natural disaster, sudden infrastructure collapse, public health crisis, flood damage.
Reference required: Official disaster declaration number or emergency notice reference.

**Category 2 — Legal Mandate**
Court order, tribunal direction, statutory deadline, regulatory compliance requirement.
Reference required: Case number or official order reference number.

**Category 3 — State or Central Government Directive**
Government scheme deadline, CM or PM publicly announced project, national or state event preparation mandate.
Reference required: Official communication reference number or government order number.

**Category 4 — Safety Escalation**
New safety data received AFTER project submission — new accident reports, structural engineering survey results, hazard assessment findings.
Reference required: Report reference number or incident report number.

### If None Of The 4 Categories Apply
- Admin must write minimum 100 character explanation
- Override flagged as "Unclassified Override" in system
- Higher authority notification sent automatically
- Permanently logged in audit trail with flag visible to all

### Acknowledgment Required
Every override requires Admin to confirm:
> "I understand this override is permanently logged and visible in the complete audit trail."

### Pattern Detection
If Admin overrides MCDM decisions above a threshold percentage, system flags this pattern for higher authority review. Prevents systematic circumvention.

---

## 10. COMPLETE PROJECT FORM — ALL SECTIONS

---

### SECTION 0 — Phase Selection (Very First Question)
```
What type of submission is this?
○ New standalone project
○ New phased project (Phase 1)
○ Continue existing project (Phase 2, 3...)
```
Auto-fill logic as described in Section 6.

---

### SECTION 1 — Basic Identity
```
Project Title          Text field, required
Project ID             Auto-generated by system, not editable
Department             Auto-filled from Officer login, locked
Project Type           Dropdown:
                         Road / Water Pipeline / Sewage /
                         Electrical / Parks / Other
Project Description    Free text — scope of work, required
```

---

### SECTION 2 — Location
Full detail in Section 12.

---

### SECTION 3 — Timeline
```
Planned Start Date     Date picker, required
Planned End Date       Date picker, required
Estimated Duration     Auto-calculated from dates, display only
Buffer                 System-defined, not shown to Officer
```

---

### SECTION 4 — Budget (Informational Only — Not Approval Workflow)
```
Estimated Cost         Number field in Rupees
Budget Source          Dropdown:
                         Municipal Fund / State Grant /
                         Central Scheme / PPP / Other
Tender Number          Text, optional
Contractor Name        Text
Contractor Firm Name   Text
                       (both fields together distinguish
                        same-name individuals)
```

---

### SECTION 5 — MCDM Priority Assessment
Full detail in Section 11.

---

### SECTION 6 — Team Assignment
```
Assigned Supervisor    Dropdown — shows ONLY supervisors
                       from Officer's own department
                       Officer cannot assign from other depts
```

---

### SECTION 7 — Documents
```
Project Document PDF   Upload, required — cannot submit without
Site Photos            Upload, optional, multiple files allowed
Approval Letter        Upload, optional
                       Verified personally by Admin visually
                       Not system-validated
```

---

## 11. MCDM PRIORITY ASSESSMENT — COMPLETE DETAIL

---

### The 7 Criteria (Final — After Removing Dependency)

```
CRITERIA                         WEIGHT    INPUT SOURCE
──────────────────────────────────────────────────────────
1. Condition Severity             26%      Officer + DB (complaints)
2. Population & Facility Impact   21%      System (map auto)
3. Seasonal Compatibility         16%      System (auto calculated)
4. Execution Readiness            16%      Officer + DB (history)
5. Citizen Disruption During Work 10%      Officer
6. Infrastructure Age              8%      Officer (one year field)
7. Economic Value                  3%      System (map auto)
──────────────────────────────────────────────────────────
TOTAL                            100%
```

**Note:** Dependency was removed as a criteria. Reason: Officers cannot reliably know about other departments' projects — that is the core problem Urban Nexus solves. Manual dependency declaration is unreliable. The clash detection system plus Admin resolution handles sequencing naturally and more reliably.

**Note:** Urgency reason free text was removed from MCDM inputs. Free text cannot be quantified or scored by a machine. Moved to Admin notes field — human readable context only, not a scoring factor.

---

### Officer Control vs System Control

```
Officer directly influences:    26 + 16 + 10 + 8 = 60%
System calculates objectively:  21 + 16 + 3      = 40%
```

The 40% system-calculated portion cannot be manipulated by any officer.
This is the integrity layer of the scoring system.

---

### MCDM Input — 3 Categories Of Data

---

#### CATEGORY 1 — Directly Asked From Officer (8 Questions)

These are fields officer manually fills in Section 5 of the form.
No automation. Pure human input.

```
Q1 — Infrastructure Condition
What is the current condition of this infrastructure?
○ Critical — immediate risk, unsafe for use
○ Poor     — heavily deteriorated, causes daily problems
○ Fair     — visible damage, functional but degrading
○ Good     — minor issues, preventive work needed

Feeds: Criteria 1 — Condition Severity
Why: Most direct evidence of how bad the situation is.
     Officer on the ground knows better than any database.

────────────────────────────────────────────────

Q2 — Incidents
Have there been any reported incidents at this location?
(Select all that apply)
□ Accidents or injuries
□ Infrastructure collapse or failure
□ Flooding or waterlogging
□ No incidents reported

Feeds: Criteria 1 — Condition Severity
Why: Incidents are hard evidence of danger.
     An officer declaring known incidents
     that may not be formally recorded yet.
     Accidents prove urgency objectively.

────────────────────────────────────────────────

Q3 — Infrastructure Age
When was the last major work done on this infrastructure?
[ Y Y Y Y ]  year only
If never repaired since construction, enter year built.

Feeds: Criteria 6 — Infrastructure Age
Why: System calculates years since last work vs
     expected lifecycle for that project type.
     Overdue infrastructure gets higher priority.
     Prevents neglect of aging assets.

────────────────────────────────────────────────

Q4 — Tender Status
What is the current execution status?
○ Tender complete — procurement finished
○ Tender in process — procurement underway
○ Planning stage — tender not yet started

Feeds: Criteria 4 — Execution Readiness
Why: Prevents approving projects that look good on
     paper but cannot actually start.
     A high-scoring project that stalls blocks
     the queue and delays everything behind it.

────────────────────────────────────────────────

Q5 — Contractor Assignment
Has a contractor been assigned to this project?
○ Yes — contractor identified and assigned
○ No  — contractor not yet assigned

Feeds: Criteria 4 — Execution Readiness
Why: Tender complete + contractor assigned = fully ready
     Tender complete + no contractor = still not ready
     These are meaningfully different readiness levels.

────────────────────────────────────────────────

Q6 — Road Closure
Will the road be closed during this work?
○ Full closure — road completely blocked
○ Partial closure — one lane or side remains open
○ No closure — traffic completely unaffected

Feeds: Criteria 5 — Citizen Disruption
Why: Road closure is the most visible daily impact
     on citizens during construction.
     Full closure of a busy road = massive disruption.
     Should reduce priority unless urgency is critical.

────────────────────────────────────────────────

Q7 — Utility Disruption
Which utilities will be disrupted during work?
(Select all that apply)
□ Water supply
□ Electricity
□ Drainage and sewage flow
□ Gas supply (PNG)
□ No utility disruption

Feeds: Criteria 5 — Citizen Disruption
Why: Cutting water or electricity to thousands of
     homes is a serious quality-of-life impact.
     More utilities disrupted = lower disruption score
     = pulls down overall project priority unless
     urgency justifies it.

────────────────────────────────────────────────

Q8 — Disruption Duration
How many days will citizens face disruption?
[ _ _ ]  days
Total days of disruption to daily life,
not the full project duration.

Feeds: Criteria 5 — Citizen Disruption
Why: 2 days of disruption vs 45 days is very different.
     Duration combined with type of disruption gives
     a complete picture of citizen suffering during work.
```

---

#### CATEGORY 2 — Taken From Map Automatically

Calculated by system the moment officer sets project location.
Officer inputs nothing for these. System detects everything.

```
FACTOR 1 — Population Estimate
What: Estimated number of residents in project area
How: Census of India ward-level population data
     imported into MongoDB database (one-time import)
     System identifies ward from project coordinates
     Calculates: population density × project area
Data source: censusindia.gov.in or data.gov.in
             Free, public government data
             Downloaded once, imported into own database
             Dynamic lookup at runtime — not hardcoded

Feeds: Criteria 2 — Population & Facility Impact
Why: More people benefiting from fixed infrastructure
     = higher real world justification for priority.
     Fully objective — officer cannot manipulate.

────────────────────────────────────────────────

FACTOR 2 — Critical Facilities Within Project Area
What: Hospitals, schools, fire stations, bus depots,
      markets and commercial zones near project
How: Live Overpass API query (free, no API key needed)
     Runs at runtime when officer confirms location
     Query: find all amenity=hospital, school,
            fire_station within buffer distance
Data source: OpenStreetMap via Overpass API
             Completely free, no cost, no key
             Real data for Ghaziabad

Scoring:
Hospital or clinic:          +3 points
School or college:           +2 points
Fire station:                +2 points
Railway station / bus depot: +2 points
Market / commercial zone:    +1 point

Feeds: Criteria 2 — Population & Facility Impact
Why: Infrastructure near a hospital is more critical
     than infrastructure in an isolated area.
     A broken road to a hospital can cost lives.
     System detects this objectively from map.

────────────────────────────────────────────────

FACTOR 3 — Economic Zone Type
What: What type of economic activity surrounds the project
How: OpenStreetMap land use tags via Overpass API
     Query land use type at project center coordinates

Scoring:
Connects to industrial area:       10
Near market / commercial zone:      8
Mixed residential and commercial:   5
Pure residential area:              3
Remote or low activity area:        1

Feeds: Criteria 7 — Economic Value
Why: Infrastructure serving economic activity has
     multiplier effect on the city.
     But weight is only 3% — economic value should
     NOT override human suffering.
     A poor residential area with broken roads
     deserves repair even if economic value is low.

────────────────────────────────────────────────

FACTOR 4 — Project Area In Square Meters
What: Total area covered by project shape
How: Turf.js calculates automatically from shape
     Already in project codebase

Formula by shape:
Corridor:  length × width = area
Circle:    π × radius² = area
Rectangle: length × width = area
Custom:    Turf.js area() function

Feeds: Buffer size calculation
Why: Larger projects need larger buffers.
     Bigger work = more variables = more
     human placement inaccuracy to absorb.

────────────────────────────────────────────────

FACTOR 5 — Ward Number And Zone
What: Which municipal ward and city zone
How: Reverse geocoding via Nominatim (free)
     Ward boundary GeoJSON stored in database
     $geoIntersects query finds correct ward

Feeds: Clash detection pre-filter
Why: Same city + same ward = check deeper for clash
     Different ward = skip, cannot be a clash
     Makes clash detection faster at scale
```

---

#### CATEGORY 3A — Location-Specific Data From Database

Data stored in Urban Nexus database tied to specific locations.

```
FACTOR 1 — Citizen Complaint Count For This Location
What: Number of complaints filed about this specific
      road or area in last 6 months
How: Query own complaints collection by coordinates
     within project buffer distance

db.complaints.countDocuments({
  location: { $near: { $geometry: center, $maxDistance: buffer } },
  createdAt: { $gte: sixMonthsAgo }
})

For prototype: Seed database with 40-50 realistic
fake complaints at various Ghaziabad locations.
Some areas with many complaints (bad infrastructure).
Some with few (good areas). Makes MCDM demo realistic.

Feeds: Criteria 1 — Condition Severity
Why: Citizens reporting problems IS the evidence
     that infrastructure is failing.
     23 complaints about a road = clear signal of
     deterioration that officer's rating alone might miss.
     Makes condition severity more objective.

────────────────────────────────────────────────

FACTOR 2 — Incident Reports For This Location
What: Accidents, pipe bursts, outages, collapses
      reported at this specific location
How: Same complaint collection, filter by incident types
     pothole accidents, flooding, pipe burst reports

For prototype: Include incident type field in seeded
complaint data. Mark some as incident category.

Feeds: Criteria 1 — Condition Severity
Why: Incidents are harder evidence than complaints.
     A road with 3 accidents = objectively dangerous.
     Supports or validates officer's condition rating.

────────────────────────────────────────────────

FACTOR 3 — Recently Completed Projects Nearby
What: Were similar project types done near this
      location recently?
How: Query completed projects collection by
     location proximity and project type

For prototype: Seed with 5-10 completed past projects
at Ghaziabad locations to demonstrate the check.

Feeds: Clash detection and condition context
Why: Alerts system to potential duplicate effort.
     Also contextualizes condition — if road was
     repaired 1 year ago and is already poor,
     that is more urgent than one never repaired.
```

---

#### CATEGORY 3B — Non-Location Data From Database

Data about people, departments, and configuration. Not tied to specific locations.

```
FACTOR 1 — Contractor Track Record
What: History of whether this contractor has stalled
      or abandoned projects before in the system
How: Query past projects filtered by contractor firm name
     Count stalls, abandonments, delays

Scoring:
No past stalls:    10
1 stall:            6
2 or more stalls:   2

For prototype: Include contractor name in seeded
past project data with varied performance history.

Feeds: Criteria 4 — Execution Readiness
Why: A project with an unreliable contractor deserves
     lower execution readiness score.
     Prevents approving work to a contractor who will stall
     and block the queue for months.

────────────────────────────────────────────────

FACTOR 2 — Department Completion Rate
What: Percentage of this department's past projects
      completed on time
How: Query all past projects for this department
     Calculate: completed on time / total projects

Scoring:
Above 80% on time:    10
60 to 80% on time:     6
Below 60% on time:     2

For prototype: Seed past project records with
varied completion rates per department.

Feeds: Criteria 4 — Execution Readiness
Why: A department that consistently delivers on time
     deserves higher confidence score.
     Prevents approving projects for departments that
     historically cannot execute — wastes the approval slot.

────────────────────────────────────────────────

FACTOR 3 — Seasonal Calendar
What: Which months are monsoon, dry season, pre-monsoon
      for Ghaziabad specifically
How: Static configuration stored in database once at setup

Configuration:
{
  city: "Ghaziabad",
  monsoon:    [6, 7, 8, 9],      // June to September
  drySeason:  [10, 11, 12, 1, 2, 3], // October to March
  preMonsoon: [4, 5]             // April and May
}

Scoring for road and surface work:
Dry season (Oct-Mar):   10
Pre-monsoon (Apr-May):   6
Monsoon (Jun-Sep):       1  ← strongly discourages approval

For underground work (pipeline, electrical):
Any season:  8  (less affected by rain)

For parks and plantation:
Monsoon (Jun-Sep):   10  (best for planting)
Winter (Dec-Feb):     4

Feeds: Criteria 3 — Seasonal Compatibility
Why: Road work in monsoon = washed away, wasted money.
     Parks planted in dry season = low survival rate.
     System automatically discourages wrong-season approvals.
     Officer cannot override this — it is system calculated.

────────────────────────────────────────────────

FACTOR 4 — Project Type Lifecycle Values
What: Expected lifespan of each infrastructure type
      before it needs major work again
How: Static configuration stored in database

Values:
Road:              10 years
Water pipeline:    20 years
Sewage pipeline:   15 years
Electrical lines:  15 years
Parks:              8 years

Calculation:
Infrastructure age = current year - last work year
Urgency ratio = infrastructure age / lifecycle years

Scoring:
Overdue by 5+ years:     10
At lifecycle end:         7
Mid lifecycle:            4
Recently done (< 30%):    1

Feeds: Criteria 6 — Infrastructure Age
Why: A road due for replacement 5 years ago is more
     urgent than one halfway through its lifecycle.
     Rewards departments that plan ahead and maintain
     infrastructure rather than letting it fail.

────────────────────────────────────────────────

FACTOR 5 — Work Type Conflict Matrix
What: Lookup table defining which project types are
      compatible, conditional, or incompatible when
      running simultaneously in same location
How: Static configuration in database

Matrix:
              ROAD    WATER   ELECTRIC  SEWAGE  PARKS
ROAD           ✗       ✗        ~         ✗       ~
WATER          ✗       ✗        ✓         ✗       ✓
ELECTRIC       ~       ✓        ✗         ✓       ✓
SEWAGE         ✗       ✗        ✓         ✗       ✓
PARKS          ~       ✓        ✓         ✓       ✗

✗ = Always clash — physically incompatible simultaneously
~ = Conditional clash — needs coordination, Admin reviews
✓ = Compatible — can run simultaneously, no problem

Feeds: Clash Detection Criteria 3 — Work Type Conflict
Why: Without this matrix system cannot determine if two
     overlapping projects are actually a clash.
     Road + Water = always clash (both require digging road)
     Water + Parks = no clash (underground vs surface)
     This is the intelligence layer of clash detection.

────────────────────────────────────────────────

FACTOR 6 — Buffer Values By Project Type
What: Days each work type needs after completion before
      next project can begin on same location
How: Static configuration in database (same as Section 7)

Values:
Road reconstruction:     14 days
Road resurfacing:         7 days
Water pipeline:          10 days
Sewage pipeline:         10 days
Electrical overhead:      5 days
Electrical underground:   7 days
Parks and plantation:     3 days
Other:                    7 days

Feeds: Clash resolution suggested date calculation
Why: Fresh asphalt needs days to cure and harden.
     New pipeline needs pressure testing time.
     Starting next project too soon destroys previous work.
     Buffer is the minimum safety gap between projects.
```

---

### MCDM Score Calculation Example

```
PROJECT: Vijay Nagar Main Road Reconstruction
OFFICER: PWD Department, Ghaziabad

OFFICER INPUTS (Category 1):
Q1 Condition:         Poor                    → 6/10
Q2 Incidents:         Accidents reported      → +2 boost
Q3 Last work year:    2011 (14 years ago)     → 8/10
Q4 Tender status:     Tender in process       → 6/10
Q5 Contractor:        Yes, assigned           → +2 bonus
Q6 Road closure:      Partial                 → 7/10
Q7 Utility:           Water supply affected   → 6/10
Q8 Duration:          8 days                  → moderate

MAP AUTO DETECTION (Category 2):
Population:           38,000 people           → 8/10
Facilities:           Hospital 180m,
                      School 95m,
                      Bus depot 210m          → 9/10
Season:               October start, dry      → 10/10
Economic zone:        Mixed commercial        → 6/10
Project area:         900m × 12m = 10,800sqm

DATABASE (Category 3):
Complaints nearby:    23 in 6 months          → 8/10
Contractor record:    0 stalls, clean         → 10/10
Dept completion rate: 78% on time             → 7/10

FINAL SCORE CALCULATION:
─────────────────────────────────────────────────────
Criteria 1 Condition Severity
  Officer condition: 6, Incidents boost: +2 = 8
  Complaints: 23 = 8
  Combined: 8/10                  × 26% = 2.08

Criteria 2 Population & Facilities
  Population 38k + Hospital +
  School + Bus depot = 9/10       × 21% = 1.89

Criteria 3 Seasonal Compatibility
  October, dry season = 10/10     × 16% = 1.60

Criteria 4 Execution Readiness
  Tender in process: 6
  Contractor assigned bonus: +2 = 8
  Dept rate 78%: 7
  Contractor clean: 10
  Combined: 8/10                  × 16% = 1.28

Criteria 5 Citizen Disruption
  Partial closure: 7
  Water disruption: 6
  8 days: moderate = 6/10         × 10% = 0.60

Criteria 6 Infrastructure Age
  14 years, overdue by 4 = 8/10   ×  8% = 0.64

Criteria 7 Economic Value
  Mixed commercial = 6/10         ×  3% = 0.18
─────────────────────────────────────────────────────
TOTAL:  8.27 / 10
SHOWN AS: 82.7 / 100
```

---

### What Officer Sees After Submitting

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓ Project submitted successfully

  Your project priority score: 82.7 / 100

  Status: Pending Admin Review

  ⚠️  1 potential clash detected with:
      "Jal Nigam — Vijay Nagar Pipeline Upgrade"
      Admin will review both projects together.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 12. LOCATION SECTION — COMPLETE DETAIL

### Entry Point — Work Area Type
```
What type of work area is this project?

○ Along a road or street
  (road repair, pipeline along road,
   electrical work along road)

○ A specific location or area
  (park, open ground, building,
   water tank, substation, local works)
```

---

### Core UX Principle — Always Split Screen

**The most important UX rule for the location section:**

Form and map are ALWAYS shown together simultaneously.
Left panel: input fields. Right panel: live map.
They are always in sync — changing one updates the other instantly.
Officer never has to choose between typing or clicking map.
Both are always available at the same time.

---

### Three Ways To Input Location — Always Available Simultaneously

```
WAY 1 — Type the address
Officer types in text field
Autocomplete shows suggestions
Officer selects → map pans and pin drops automatically

WAY 2 — Click directly on map
Officer clicks any point on map
Address auto-fills in left panel
System detects road name or locality automatically

WAY 3 — Use current GPS location
Officer clicks "Use my location" button
Browser GPS drops pin at officer's actual location
Address auto-fills in left panel
Useful when officer is standing at the project site
```

All three available simultaneously. Officer uses whatever is natural.

---

### PATH A — Along A Road Or Street

```
STEP 1 — Find the road
[Search road name... 🔍]  ← autocomplete from OSM
OR click directly on road on map
OR use GPS if standing at site

STEP 2 — Mark the work stretch
[📍 Mark start point] — click on map or type address
[📍 Mark end point]   — click on map or type address

System draws corridor automatically between points
following actual road centerline from OSM data

Corridor width: system default by project type
Officer can adjust width if needed

STEP 3 — Auto detection fills automatically:
Start landmark name (nearest junction or place)
End landmark name
Corridor length in meters
Critical facilities within corridor
Population estimate in corridor
Ward number and zone
Full address string:
"MG Road from Vijay Chowk to Gandhi Nagar Crossing,
 Vijay Nagar, Ghaziabad, UP — 1.2 km"
```

---

### PATH B — Specific Location Or Area

```
STEP 1 — Drop your pin
[Drop pin on map]
OR [Type address → map finds it]
OR [Use my location 📱]

STEP 2 — Select work area shape
○ Circle     — for parks, substations, open ground
○ Corridor   — for linear work on unnamed road
○ Rectangle  — for construction sites, market areas
○ Custom     — officer clicks points to draw any shape

STEP 3 — Adjust size
Circle:    Radius — 50m / 100m / 200m / 500m / Custom
Corridor:  Length — 100m / 250m / 500m / 1km / Custom
           Width  — 5m / 10m / 15m / 20m / Custom
Rectangle: Length — Custom
           Width  — Custom
Custom:    Click points on map, close shape when done

Shape suggestion: System pre-selects most likely shape
based on project type. Officer can always change it.

Size warning: If unusually large area set, system warns:
"This is a very large project area. Please confirm."

STEP 4 — Auto detection fills automatically:
Nearest road or locality name (reverse geocode)
Neighbourhood name
Ward number and zone
Critical facilities within shape
Population estimate
Full address string
Economic zone type
```

---

### Both Paths — Common Final Steps

```
STEP — Officer Verifies Auto-Detected Data
System shows:
"We detected the following. Please verify:"

Ward: Ward 14, Vijay Nagar         [✓ or edit]
Zone: East Zone                     [✓ or edit]
Address: MG Road, Vijay Nagar...   [✓ or edit]
Nearby facilities:
    City Hospital — 180m            [✓ or edit]
    Govt School — 95m              [✓ or edit]
Population estimate: 38,000        [✓ or edit]

Officer confirms or corrects.
Corrected values override auto-detected values.

STEP — Live Clash Preview
"🔍 Checking existing projects in this area..."

If overlaps found:
"⚠️ 1 existing project overlaps this area and time.
 Admin will review these clashes on approval."
Map highlights overlapping projects.
Officer cannot stop submission — they are informed.

If clean:
"✓ No existing project overlaps detected."

STEP — Confirm Location
[Confirm Location] button
Locks all location data
Officer moves to next section
```

---

## 13. CLASH DETECTION ENGINE — TECHNICAL DETAIL

### What Is Saved Per Project

```javascript
{
  locationIdentity: {
    roadOrLocalityName: "MG Road",       // auto detected
    neighbourhood:      "Vijay Nagar",   // auto detected
    city:               "Ghaziabad",     // auto detected
    state:              "Uttar Pradesh", // auto detected
    ward:               "Ward 14",       // auto detected
    pincode:            "201001",        // auto detected
  },
  centerCoordinates: {
    lat: 28.6692,
    lng: 77.4538
  },
  dimensions: {
    shape:  "corridor",  // circle / corridor / rectangle / polygon
    length: 1200,        // meters
    width:  15,          // meters
    area:   18000        // sqm — system calculated by Turf.js
  },
  buffer:  30,           // meters — system calculated
  geoJSON: { ... }       // FOR VISUALIZATION ONLY — not used in detection
}
```

### Why Shape Is Not Used For Detection

Human-drawn shapes are inaccurate and inconsistent.
Two officers drawing the same road will never draw identical polygons.
Center coordinates + buffer absorbs human inaccuracy reliably.
Shape (geoJSON) is for human visualization only — on map for officer, admin, citizen.
Clash detection uses only: center coordinates + buffer radius.

### Buffer Calculation Formula

```
TOTAL BUFFER = BASE BUFFER + SIZE BUFFER

BASE BUFFER by project type:
Road reconstruction:     30m
Road resurfacing:        20m
Water pipeline:          15m
Sewage pipeline:         20m
Electrical overhead:     10m
Electrical underground:  15m
Parks and plantation:    10m
Other:                   15m

SIZE BUFFER by project area:
0 to 5,000 sqm:          +0m  (base only)
5,000 to 20,000 sqm:    +10m
20,000 to 50,000 sqm:   +20m
50,000 to 100,000 sqm:  +30m
Above 100,000 sqm:      +40m

EXAMPLE:
Road resurfacing, area = 18,000 sqm
Base: 20m + Size: 10m = Total buffer: 30m

EXAMPLE 2:
Large park, area = 282,000 sqm
Base: 10m + Size: 40m = Total buffer: 50m
```

### 4-Step Clash Detection Process

```
STEP 1 — Fast Pre-Filter (performance optimization)
Same city + same ward?
NO → skip immediately, cannot be a clash
YES → proceed to Step 2

STEP 2 — Geographic Overlap
Expand Project A center by buffer A
Expand Project B center by buffer B
Do expanded zones intersect? (Turf.js circle intersection)
NO → no geographic overlap, not a clash
YES → proceed to Step 3

STEP 3 — Time Overlap
Do date ranges overlap?
Formula: max(startA, startB) < min(endA, endB)
NO → different time periods, not a clash
YES → proceed to Step 4

STEP 4 — Work Type Conflict
Check conflict matrix: typeA vs typeB
COMPATIBLE → no clash raised
CONDITIONAL → flagged for Admin review
INCOMPATIBLE → CLASH RAISED TO ADMIN

ALL 4 STEPS TRUE → CLASH RAISED
```

---

## 14. CITIZEN INFORMATION SYSTEM

### Public Map Display

```
Shows: All APPROVED and ONGOING projects only
       Pending and rejected projects never shown publicly

Color coding by project type:
Road:        Orange
Water:       Blue
Electricity: Yellow
Sewage:      Purple
Parks:       Green
Other:       Grey

Each project popup shows:
  Project name
  Department responsible
  Project type
  Expected completion date
  ⚠️ Road closure warning (if applicable)
  ⚠️ Utility disruption warning (if applicable)
  Current status: Approved or Ongoing

Does NOT show:
  Estimated cost
  MCDM scores
  Internal documents
  Officer or supervisor names
  Budget source or tender details
```

### Citizen Complaint System

```
Step 1: Select issue type
  Pothole / Streetlight / Water Leak /
  Garbage / Drainage / Other

Step 2: Set location
  Drop pin on map
  OR type address
  OR use GPS

Step 3: Write description
  Free text

Step 4: Upload photo
  Optional

Step 5: Submit
  System generates: CNR-XXXXXX tracking ID
  Relevant department Officer notified

Step 6: Track by CNR ID
  4 progress stages:
  Submitted → Acknowledged → In Progress → Resolved
```

### Complaint Integration With MCDM
Complaint volume about a specific location feeds into Criteria 1 (Condition Severity). This means citizen feedback directly influences project priority. Citizens indirectly shape which infrastructure gets fixed first.

---

## 15. CONTRACTOR FIELDS

```
Two fields only:
Contractor Name      text field
Contractor Firm Name text field

Purpose:
1. Distinguish same-name individuals by firm
2. System tracks contractor history for MCDM Execution Readiness
3. Admin can see if same contractor is doing two clashing projects

Not included: License number, contact details, financial info
Reason: Urban Nexus is not a procurement platform
```

---

## 16. WHAT IS DELIBERATELY NOT IN THIS PLATFORM

These were considered and explicitly excluded:

```
✗ Budget approval workflow
  Reason: Departments already have annual budget.
          Urban Nexus is not a finance platform.
          Estimated cost is informational only.

✗ Project dependency as officer input
  Reason: Officers cannot know other departments' plans.
          That is the core problem being solved.
          Manual dependency is unreliable.
          Clash detection + Admin resolution handles
          sequencing naturally and more reliably.

✗ Urgency reason as MCDM scoring input
  Reason: Free text cannot be quantified or scored.
          Moved to Admin notes — human readable only.

✗ Contractor management beyond name and firm
  Reason: Procurement belongs in a separate system.

✗ Team size and equipment tracking
  Reason: Internal department concern.
          Not a coordination problem.

✗ Traffic diversion plans
  Reason: Operational detail, not coordination concern.

✗ Post-completion maintenance and warranty tracking
  Reason: Different platform, different workflow entirely.

✗ Worker accounts below Supervisor level
  Reason: Supervisor manages ground team outside the app.
          App tracks project-level progress only.

✗ Merging two projects into one
  Reason: Too complex. Different workflow entirely.
          Reject and reschedule achieves the same goal.

✗ Internet and telecom as utility disruption options
  Reason: Private operators, not government infrastructure.
          Not relevant to municipal coordination platform.
```

---

## 17. KEY DESIGN PRINCIPLES

```
1. SHAPE IS FOR HUMANS — COORDINATES ARE FOR MACHINES
   GeoJSON polygon = visualization on map only
   Center coordinates + buffer = clash detection math
   Never mix these two purposes

2. AUTO DETECT — OFFICER ONLY VERIFIES
   System detects: ward, zone, address, facilities, population
   Officer confirms or corrects detected values
   Never ask officer to manually type what system can detect

3. SPLIT SCREEN ALWAYS
   Form fields and map always shown simultaneously
   Typing updates map. Clicking map updates form.
   GPS always available.
   Officer uses whatever input method is natural for them.

4. THREE INPUT WAYS ALWAYS AVAILABLE
   Type address / Click map / Use GPS
   All three visible and usable at the same time
   Never force officer to choose one method

5. MCDM IS ADVISOR — ADMIN IS JUDGE
   MCDM gives recommendation and score
   Admin can follow (easy path) or override (logged path)
   Override always requires category + reason + reference
   Override is always permanently logged

6. NO PROJECT DIES PERMANENTLY
   Every rejected project gets a suggested future date
   Work will happen — just in the correct sequence
   Urban Nexus sequences projects, it does not kill them

7. BUFFER IS SYSTEM DEFINED
   Officer cannot manipulate buffer values
   Cannot artificially extend buffer to block competing projects
   Buffer based on physical reality of each work type

8. CITIZEN COMPLAINTS FEED MCDM
   Complaint volume affects condition severity score
   Citizens indirectly influence project priority
   Closes the feedback loop between citizens and the system

9. 40% OF MCDM CANNOT BE MANIPULATED
   Population, facilities, season, economic zone
   are system-calculated from map and calendar
   Officer cannot inflate or deflate these values
   Integrity layer of the scoring system
```

---

## 18. DATA SOURCES SUMMARY — FOR PROTOTYPE BUILD

```
SOURCE                    WHAT IT PROVIDES           COST
──────────────────────────────────────────────────────────
OpenStreetMap / Nominatim Road names, reverse geocode  Free
Overpass API              Hospitals, schools, POIs     Free
                          Land use zones
Census India / data.gov.in Ward population data        Free
                           (one-time download + import)
Ghaziabad ward boundaries  GeoJSON ward polygons       Free
                           (data.gov.in or OSM)
Turf.js                   Area calculation             Free
                           Buffer generation           (in project)
                           Intersection check
Own MongoDB database      Complaints, projects,        Own
                          department history,
                          contractor history,
                          static config values

SEEDED DATA FOR PROTOTYPE:
40-50 citizen complaints at realistic Ghaziabad locations
5-10 completed past projects with varied contractor history
Department completion rates for each department
Seasonal calendar config for Ghaziabad
Project type lifecycle values
Work type conflict matrix
Buffer values by project type
```

---

*This document represents every decision made from first principles.*
*North Star → User Roles → Core Flow → Clash Detection → MCDM Brain → Form Design → Location System.*
*Every decision was reasoned through, questioned, argued, and locked.*
*Use this as the single source of truth for all screen design and development.*
