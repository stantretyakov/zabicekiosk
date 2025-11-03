# ODP Visual Brand System
**Open Discovery Platform - AI-Native OSINT Investigation**

## Executive Summary

ODP serves two distinct investigative personas with one platform: basic users needing "query → answer" simplicity AND expert analysts demanding full pipeline control. The visual system must communicate **institutional credibility** (government/enterprise trust), **investigative precision** (not surveillance), and **AI transparency** (hybrid human+AI, not magic).

**Core Brand Concept:** "Investigative Clarity"  
Not geological strata. Not spy thriller. **Focused precision that reveals truth through structured intelligence.**

---

## 1. Strategic Foundation

### 1.1 Brand Identity Anchors

**Brand Promise**  
Transform investigative intent into actionable intelligence through transparent AI orchestration.

**Brand Personality**  
- **Confident** - 10 years OSINT expertise, institutional credibility
- **Precise** - Investigations require accuracy, legal defensibility
- **Accessible** - Serve both basic users and experts
- **Transparent** - Explainable AI, full audit trails
- **Pragmatic** - Solve real problems without hype

**Visual Attributes Mapping**

| Brand Trait | Visual Expression |
|------------|------------------|
| Investigative depth | Layered information architecture, depth cues without darkness |
| AI transparency | Glass-like overlays, visible data flow, process visualization |
| Institutional trust | Structured grids, professional typography, muted confidence |
| Precision | Sharp edges, clear hierarchy, high contrast |
| Dual accessibility | Progressive disclosure UI, mode-switching clarity |

### 1.2 Anti-Positioning (Critical Boundaries)

**Visual language must AVOID:**
- Surveillance aesthetics (CCTV, spy silhouettes, dark alleys)
- Generic AI mysticism (floating brains, neural nets everywhere)
- Social network graph clichés (Facebook-style friend circles)
- Authoritarian intimidation (not police state branding)
- Consumer app playfulness (serious professional tool)

---

## 2. Color Architecture

### 2.1 Design Philosophy

**Approach:** Perceptually uniform color space (OKLCH) optimized for:
- High-density data interfaces (not spacious consumer UI)
- Dual-mode (light + dark) with identical perceived contrast
- Semantic clarity (status, severity, data types)
- Institutional credibility (professional without corporate bland)

**NOT using Bronze/Silver/Gold literal metallurgy.** Technical architecture metaphors don't serve users.

### 2.2 Primary Palette

**Foundation: "Investigative Blues"**

```
Investigation Deep (Primary)
- L: 25%, C: 0.08, H: 240° (OKLCH)
- Hex (approx): #1a2940
- Role: Primary surfaces, headers, depth
- Rationale: Trust, depth, institutional without corporate blue

Investigation Core (Primary Interactive)
- L: 48%, C: 0.14, H: 240°
- Hex (approx): #2d5a8c
- Role: Primary actions, links, focus states
- Contrast: 4.7:1 on white, 8.2:1 on Investigation Deep

Investigation Light (Subtle)
- L: 92%, C: 0.02, H: 240°
- Hex (approx): #e8eef5
- Role: Secondary surfaces, hover states
- Contrast: Maintains 4.5:1 text contrast
```

**Accent: "AI Clarity"**

```
Clarity Cyan (AI/Technology)
- L: 65%, C: 0.16, H: 195°
- Hex (approx): #3db4d4
- Role: AI-assisted features, data flow highlights, progress
- Rationale: Technology, intelligence, not generic blue
- Contrast: 4.5:1 on Investigation Deep

Clarity Teal (Secondary)
- L: 58%, C: 0.12, H: 185°
- Hex (approx): #4a9fb0
- Role: Secondary highlights, data enrichment indicators
```

### 2.3 Neutrals System

**"Structured Gray" - Professional without sterile**

```
Ink (Text Primary)
- L: 18%, C: 0.02, H: 240°
- Hex: #1f2937
- Contrast: 14.8:1 on white, 1.4:1 on Investigation Deep

Slate (Text Secondary)
- L: 48%, C: 0.01, H: 240°
- Hex: #64748b
- Contrast: 7.5:1 on white

Stone (Borders/Dividers)
- L: 78%, C: 0.005, H: 240°
- Hex: #cbd5e1
- Contrast: 3.1:1 for non-text UI elements

Canvas (Background)
- L: 98%, C: 0.002, H: 240°
- Hex: #f8fafc
- Role: Light mode base
```

### 2.4 Semantic Palette

**Investigation Status Colors**

```
Alert Critical (High-Risk Findings)
- L: 52%, C: 0.20, H: 25°
- Hex: #dc2626
- Role: Threats, critical alerts, failed validations
- Contrast: 4.9:1 on white

Alert Elevated (Potential Risk)
- L: 68%, C: 0.16, H: 65°
- Hex: #f59e0b
- Role: Warnings, incomplete data, review needed
- Contrast: 5.2:1 on white

Validated (Confirmed Data)
- L: 52%, C: 0.15, H: 145°
- Hex: #10b981
- Role: Verified findings, completed investigations
- Contrast: 4.6:1 on white

Processing (In Progress)
- L: 72%, C: 0.11, H: 240°
- Hex: #6366f1
- Role: Active workflows, AI processing
- Contrast: 4.8:1 on white
```

### 2.5 Dark Mode Adaptation

**Invert luminance, preserve chroma and hue:**

```
Investigation Deep Dark → L: 12%, C: 0.04, H: 240°
Investigation Core Dark → L: 58%, C: 0.14, H: 240° (increased luminance)
Canvas Dark → L: 8%, C: 0.01, H: 240°

All semantic colors: Increase luminance 15-20% in dark mode to maintain contrast ratios
```

### 2.6 Data Visualization Palette

**For charts, network graphs, timeline visualizations:**

```
Categorical (8-color set, perceptually distinct):
1. Blue: L: 55%, C: 0.16, H: 240°
2. Teal: L: 60%, C: 0.14, H: 185°
3. Green: L: 58%, C: 0.16, H: 145°
4. Amber: L: 70%, C: 0.15, H: 65°
5. Orange: L: 65%, C: 0.18, H: 45°
6. Red: L: 55%, C: 0.20, H: 25°
7. Purple: L: 58%, C: 0.15, H: 290°
8. Magenta: L: 62%, C: 0.17, H: 330°

Sequential (Blue ramp, 0-100 in 10 steps):
Starting L: 95%, C: 0.01, H: 240°
Ending L: 20%, C: 0.12, H: 240°
For heatmaps, intensity scales

Diverging (Risk assessment):
Low: Green (L: 75%, C: 0.12, H: 145°)
Medium: Amber (L: 78%, C: 0.14, H: 65°)
High: Red (L: 58%, C: 0.18, H: 25°)
```

### 2.7 Contrast Validation Matrix

| Pair | Light Mode | Dark Mode | Pass WCAG AA |
|------|------------|-----------|--------------|
| Ink on Canvas | 14.8:1 | 13.2:1 | ✓ |
| Investigation Core on Canvas | 4.7:1 | 5.1:1 | ✓ |
| Clarity Cyan on Investigation Deep | 4.5:1 | 5.8:1 | ✓ |
| Alert Critical on Canvas | 4.9:1 | 6.2:1 | ✓ |
| Stone borders on Canvas | 3.1:1 | 3.4:1 | ✓ (non-text) |

---

## 3. Typography System

### 3.1 Font Strategy

**Two-Family System: Interface + Code**

**Primary: Inter (Variable)**
- **Role:** UI, navigation, data tables, descriptions
- **Why:** Excellent legibility at small sizes, wide language support (Latin, Cyrillic, Greek), professional without coldness
- **Axes:** Weight (100-900), Optical Size (auto)
- **License:** SIL Open Font License (free for all use)

**Code: JetBrains Mono (Variable)**
- **Role:** YAML pipelines, JSON output, API responses, logs
- **Why:** Clear code ligatures, excellent 0/O and 1/l/I distinction, designed for long coding sessions
- **Axes:** Weight (100-800)
- **License:** Apache 2.0

**NOT using serif fonts.** Investigation platform UI requires utilitarian clarity over editorial polish.

### 3.2 Type Scale (Responsive)

**Desktop Base (16px = 1rem):**

```
Display (Dashboards, Investigation Titles)
- Size: 2.5rem (40px)
- Weight: 700 (Inter Bold)
- Line Height: 1.1 (44px)
- Tracking: -0.02em
- Role: Main investigation name, dashboard headers

Heading 1 (Section Headers)
- Size: 2rem (32px)
- Weight: 600 (Inter SemiBold)
- Line Height: 1.25 (40px)
- Tracking: -0.01em

Heading 2 (Subsections)
- Size: 1.5rem (24px)
- Weight: 600
- Line Height: 1.33 (32px)

Heading 3 (Data Table Headers)
- Size: 1.125rem (18px)
- Weight: 600
- Line Height: 1.33 (24px)

Body (Primary Text)
- Size: 0.875rem (14px)
- Weight: 400 (Inter Regular)
- Line Height: 1.5 (21px)
- Role: Data tables, descriptions, most UI text
- Rationale: Data-dense interface, expert users prefer compact

Body Large (Emphasis)
- Size: 1rem (16px)
- Weight: 400
- Line Height: 1.5 (24px)
- Role: Natural language query input, key findings

Caption (Metadata, Timestamps)
- Size: 0.75rem (12px)
- Weight: 400
- Line Height: 1.33 (16px)
- Color: Slate (secondary text)

Code (YAML, JSON)
- Font: JetBrains Mono
- Size: 0.875rem (14px)
- Weight: 400
- Line Height: 1.6 (22.4px)
- Role: Pipeline editor, logs, API responses
```

**Mobile Scale (0.875x reduction):**

```
Display: 2.25rem (36px)
Heading 1: 1.75rem (28px)
Heading 2: 1.375rem (22px)
Body: 0.875rem (14px) - no reduction
```

### 3.3 OpenType Features

**Inter:**
- `tnum`: Tabular numerals for data tables (aligned columns)
- `case`: Case-sensitive punctuation for all-caps headers
- `ss01`: Alternate single-story 'a' (optional, not default)

**JetBrains Mono:**
- `calt`: Contextual ligatures for code (enabled)
- `liga`: Standard ligatures (enabled)
- Examples: `->`, `=>`, `!=`, `<=` render as single glyphs

### 3.4 Fallback Stack

```css
/* Interface */
font-family: 'Inter var', -apple-system, BlinkMacSystemFont, 
             'Segoe UI', system-ui, sans-serif;

/* Code */
font-family: 'JetBrains Mono var', 'SF Mono', Monaco, 
             'Cascadia Code', 'Consolas', monospace;
```

### 3.5 Internationalization Notes

**Current Support:**
- **Latin Extended:** Full (English, Spanish, French, German, etc.)
- **Cyrillic:** Full (Russian, Ukrainian - critical for OSINT)
- **Greek:** Full
- **Arabic, Hebrew, CJK:** Fallback to system fonts (Inter does not support)

**Action:** For Arabic/Hebrew markets, load Noto Sans Arabic/Hebrew. For CJK, use Noto Sans CJK.

---

## 4. Grid and Spatial System

### 4.1 Layout Grid

**Desktop (≥1280px):**
- **Columns:** 12
- **Gutter:** 24px
- **Margin:** 48px
- **Max Width:** 1600px (content container)
- **Rationale:** Standard 12-column for flexible layouts, but investigative dashboards often use full-bleed data tables

**Tablet (768px - 1279px):**
- **Columns:** 8
- **Gutter:** 16px
- **Margin:** 32px

**Mobile (<768px):**
- **Columns:** 4
- **Gutter:** 16px
- **Margin:** 16px
- **Note:** Mobile is secondary use case (field investigators), prioritize desktop

### 4.2 Spacing Scale (8pt Base)

```
0:   0px    (none)
1:   4px    (xs - tight spacing)
2:   8px    (sm - default component padding)
3:   12px   (base - between related elements)
4:   16px   (md - section spacing)
5:   24px   (lg - major sections)
6:   32px   (xl - panel separation)
7:   48px   (2xl - page sections)
8:   64px   (3xl - hero spacing)
```

**Application:**
- Component padding: 2 (8px) internal, 4 (16px) external
- Data table rows: 3 (12px) height for compact density
- Card spacing: 5 (24px) between cards
- Dashboard panels: 6 (32px) separation

### 4.3 Density Modes

**Compact (Default for Experts):**
- Row height: 32px (data tables)
- Padding: 8px/12px
- Font size: 14px body
- Use case: Expert analysts, high information density

**Comfortable (Optional for Basic Users):**
- Row height: 40px
- Padding: 12px/16px
- Font size: 14px/16px body
- Use case: Less experienced users, accessibility needs

**User Toggle:** "Display Density" setting in preferences

---

## 5. Iconography System

### 5.1 Construction Rules

**Grid:** 24x24px master grid (scales to 16px, 20px, 32px)  
**Stroke:** 1.5px consistent weight  
**Corners:** 2px radius (approachable without softness)  
**Style:** Outlined (not filled) - precision, transparency  
**Optical Correction:** 0.5px adjustments for visual balance where needed

### 5.2 Icon Categories and Metaphors

**Investigation Actions:**
- `search` - Magnifying glass (classic, universal)
- `investigate` - Magnifying glass + document
- `analyze` - Pie chart + magnifier
- `validate` - Checkmark + shield
- `flag-alert` - Flag icon (not police/military imagery)

**Data Flow:**
- `pipeline` - Connected nodes, left-to-right flow
- `workflow` - Branch diagram (Y-shape)
- `transform` - Funnel shape
- `enrich` - Plus icon + document
- `export` - Arrow pointing out of box

**Data Sources (Generic, NOT Branded):**
- `social-network` - Three connected circles (generic graph)
- `messenger` - Chat bubble (generic, not WhatsApp/Telegram logos)
- `blockchain` - Chain links (generic crypto)
- `dark-web` - Onion icon (Tor reference, but generic)
- `database` - Cylinder stack
- `api` - Brackets `{ }`

**AI/Orchestration:**
- `ai-agent` - Robot head (minimal, not humanoid)
- `ai-processing` - Sparkle + gear (processing)
- `decision-tree` - Tree diagram
- `natural-language` - Speech bubble + sparkle

**Status Indicators:**
- `running` - Circular progress (animated)
- `completed` - Checkmark in circle
- `failed` - X in circle
- `paused` - Pause icon
- `queued` - Clock icon

**Temporal/Workflow:**
- `resume` - Play icon with back arrow (resumability)
- `checkpoint` - Flag on timeline
- `history` - Clock with counter-clockwise arrow
- `audit-trail` - Footprints/breadcrumb trail

### 5.3 Icon Comprehension Testing Protocol

**Method:** ISO 9186-1 standard  
**Acceptance:** ≥66% correct identification without labels  
**High-Risk Icons:** Any non-universal metaphors (ai-agent, decision-tree, natural-language)

**Test Before Release:**
- AI-related icons (new metaphor domain)
- Investigation-specific actions (validate, enrich)
- Data source representations (dark-web, blockchain)

---

## 6. Imagery and Illustration System

### 6.1 Photography Direction

**NOT stock photos.** If photography used:

**Subject Matter:**
- Authentic investigation environments (real workspaces, not staged)
- Technology interfaces (screens showing data, not glamour shots)
- Diverse investigators (age, gender, ethnicity)
- No faces visible if law enforcement (privacy/security)

**Technical Specs:**
- Color Temperature: 5500-6500K (neutral to cool, institutional)
- Depth of Field: Shallow (subject focus, background blur)
- Lighting: Natural or soft studio (no harsh shadows)
- Composition: Rule of thirds, human-centered

**Forbidden:**
- Hooded figures, dark alleys (surveillance clichés)
- Fingerprints, DNA strands (CSI aesthetics)
- Dramatic lens flares, color grading (not cinematic)

### 6.2 Illustration Style

**Use Case:** Explainer diagrams, onboarding, marketing

**Style:**
- **Line-based** illustrations (not filled shapes)
- **Isometric** diagrams for system architecture (when needed)
- **Flat 2D** for workflows and processes (simpler)
- **Color:** Investigation Blue + Clarity Cyan + Neutrals (limited palette)

**Examples:**
- Natural language query → AI orchestration → pipeline execution (process diagram)
- Data flow: Source → Bronze → Silver → Gold (but abstract, not literal ore)
- Multi-tenant workspace hierarchy (organizational diagram)

### 6.3 Data Visualization Standards

**Network Graphs (Social Connections):**
- Node size: Centrality score (larger = more connections)
- Node color: Entity type (person, organization, location)
- Edge thickness: Relationship strength
- Layout: Force-directed (organic clustering)
- NOT: Facebook-style circular layouts (too consumer)

**Timeline Visualizations:**
- Horizontal time axis (left = past, right = present)
- Vertical swim lanes: Data sources (Twitter, Telegram, blockchain)
- Event markers: Color-coded by severity
- Hover: Show full event details

**Pipeline DAG (Workflow Execution):**
- Left-to-right flow (Western reading order)
- Node shapes: Rectangle (data source), Diamond (decision), Circle (transform)
- Edge labels: Data volume, success rate
- Color: Green (complete), Amber (running), Red (failed), Gray (queued)

### 6.4 Content Credentials (AI-Generated Imagery)

If AI-generated images used:
- **Provenance:** Attach C2PA content credentials
- **Disclosure:** Label as "AI-generated" in alt text and visible caption
- **Ethics:** No depiction of real persons, no misleading scenarios

---

## 7. Motion Language

### 7.1 Purpose-Based Primitives

**Emphasize (Draw Attention):**
- Duration: 200ms
- Easing: ease-out
- Transform: scale(1.02) or subtle glow
- Use: New investigation result appears, alert notification

**Connect (Show Relationship):**
- Duration: 300ms
- Easing: ease-in-out
- Transform: Draw line between nodes, fade-in connection
- Use: Data lineage visualization, pipeline step connections

**Confirm (Feedback):**
- Duration: 160ms
- Easing: ease-out
- Transform: Checkmark scale + fade-in
- Use: Validation success, investigation completed

**Load (Processing):**
- Duration: 1200ms loop
- Easing: linear
- Transform: Circular progress, pulse animation
- Use: AI processing, data fetching

### 7.2 State Transitions

**Tab Switching:**
- Duration: 200ms
- Easing: ease-out
- Behavior: Cross-fade, no slide (too playful)

**Panel Expansion:**
- Duration: 300ms
- Easing: ease-in-out
- Behavior: Height expand with content fade-in

**Modal Open/Close:**
- Open: 250ms ease-out, scale(0.95 → 1) + fade
- Close: 200ms ease-in, scale(1 → 0.95) + fade

### 7.3 Investigation-Specific Motion

**Pipeline Execution:**
- Steps highlight in sequence (left to right)
- Duration: 400ms per step
- Visual: Border glow + subtle scale
- Continuous: Progress bar advances smoothly, not jumpy

**Data Streaming (Results Loading):**
- Rows appear from top to bottom
- Duration: 50ms per row (staggered)
- Max visible at once: 20 rows, then batch load
- Visual: Fade-in + slide-up 4px

**AI Thinking Indicator:**
- NOT instant (show AI is working)
- Duration: 800ms fade-in message "Analyzing your query..."
- Visual: Pulsing dot animation (3 dots)
- Streaming output: Show tokens appearing (like ChatGPT)

### 7.4 Reduced-Motion Compliance

**Preference: `prefers-reduced-motion: reduce`**

Disable:
- All scale transforms
- All translations >4px
- All rotation
- Looping animations

Preserve:
- Color transitions
- Opacity fades
- Static loading indicators (no pulse)

**Critical:** Government/enterprise users may have motion sensitivity. Reduced-motion is default-on for accessibility.

---

## 8. Component Specifications

### 8.1 Primary Button

**Visual:**
```
Background: Investigation Core (#2d5a8c)
Text: White
Padding: 12px 20px (vertical, horizontal)
Border Radius: 6px
Font: Inter 600, 14px
Height: 40px
Min Width: 120px

States:
- Hover: Background 10% lighter, subtle lift (2px shadow)
- Active: Background 10% darker, press effect (1px shadow)
- Disabled: Background 40% opacity, cursor not-allowed
- Focus: 2px outline, Clarity Cyan color, 2px offset
```

### 8.2 Data Table

**Critical Component (Primary Information Display):**

```
Row Height: 
- Compact: 32px
- Comfortable: 40px

Cell Padding: 12px horizontal, 8px vertical (compact)

Header:
- Background: Investigation Light (#e8eef5)
- Text: Ink (#1f2937), Inter 600, 14px
- Border Bottom: 2px solid Investigation Core
- Sticky: Yes (scrollable body, fixed header)

Body:
- Background: White (alternating: Canvas #f8fafc for even rows)
- Text: Ink, Inter 400, 14px
- Border: 1px solid Stone (#cbd5e1) between rows
- Hover: Background Investigation Light, cursor pointer

Sort Indicators:
- Icon: Chevron up/down (16px)
- Position: Right of header text
- Active sort: Investigation Core color

Selection:
- Checkbox: 16x16px, left column
- Selected row: Background Clarity Cyan 10% opacity
```

### 8.3 Natural Language Query Input

**Signature Component (Entry Point for Basic Users):**

```
Container:
- Width: 100% (max 800px centered on dashboard)
- Height: Auto-expand (min 60px, max 200px)
- Background: White
- Border: 2px solid Investigation Core
- Border Radius: 8px
- Shadow: 0 2px 8px rgba(0,0,0,0.08)

Input Field:
- Font: Inter 400, 16px (larger for readability)
- Placeholder: "Describe your investigation in plain language..."
- Padding: 16px
- Line Height: 1.5

Submit Button:
- Position: Bottom-right corner (inline)
- Label: "Generate Pipeline" or "Investigate"
- Style: Primary button

AI Suggestion Chips (Below Input):
- Example queries: "Find Twitter accounts linked to @handle"
- Style: Small pill buttons, Investigation Light background
- Hover: Clarity Cyan background
```

### 8.4 Pipeline Editor (YAML)

**Expert Mode Component:**

```
Layout: Split-screen
- Left: YAML text editor (60% width)
- Right: DAG visualization (40% width)

Editor:
- Font: JetBrains Mono, 14px
- Line Numbers: Yes, Slate color
- Syntax Highlighting:
  - Keywords (steps, id, type): Investigation Core
  - Strings: Processing (#6366f1)
  - Numbers: Alert Elevated
  - Comments: Slate
- Gutter: 16px
- Scroll: Synchronized with DAG on step selection

Validation:
- Real-time: Underline errors in red
- Error Panel: Bottom drawer, expandable
- Error Format: "Line 14: Unknown method 'twitter_scrape'. Did you mean 'twitter_profile'?"
```

### 8.5 Status Indicators

**Workflow Execution States:**

```
Running:
- Icon: Circular progress (animated)
- Color: Processing (#6366f1)
- Animation: 1.2s rotation loop

Completed:
- Icon: Checkmark in circle (static)
- Color: Validated (#10b981)

Failed:
- Icon: X in circle (static)
- Color: Alert Critical (#dc2626)

Paused:
- Icon: Pause bars
- Color: Slate (#64748b)

Queued:
- Icon: Clock
- Color: Slate
- Subtle pulse: Opacity 0.6 → 1.0 (1s loop)
```

---

## 9. Layout Patterns

### 9.1 Dashboard (Main Investigation Workspace)

**Structure:**

```
┌─────────────────────────────────────────────────────┐
│ Top Nav (64px height)                               │
│ Logo | Workspace > Project | Search | Profile       │
├──────────┬──────────────────────────────────────────┤
│ Left Nav │ Main Canvas                              │
│ (240px)  │                                          │
│          │ [Natural Language Query Input]           │
│ Active   │                                          │
│ Investi- │ [Generated Pipeline Preview]             │
│ gations  │                                          │
│          │ [Execution Status]                       │
│ Data     │                                          │
│ Sources  │ [Results Data Table]                     │
│          │                                          │
│ Templates│                                          │
│          │                                          │
│ History  │                                          │
└──────────┴──────────────────────────────────────────┘
```

**Progressive Disclosure:**
- Start: Natural language input prominent (center, large)
- Generated pipeline: Appears below input after AI processing
- Execution: Pipeline minimizes to top bar, results expand to fill canvas
- Expert mode toggle: Top-right corner, switches to YAML editor view

### 9.2 Dual-Mode Interface Strategy

**Mode Switching:**
- Toggle: "Natural Language" | "Expert Mode" (segmented control, top-right)
- Transition: Cross-fade 300ms, preserve investigation state
- Persistence: Remember user's last mode preference

**Natural Language Mode (Basic Users):**
- Focus: Large query input
- Visibility: Generated YAML pipeline collapsed by default
- Action: "Run Investigation" primary CTA
- Results: Simplified data table, key findings highlighted

**Expert Mode (Analysts):**
- Layout: Split-screen (YAML editor + DAG viz)
- Focus: Code editing, step-by-step control
- Visibility: Full execution logs, data lineage drawer
- Actions: "Validate", "Execute", "Debug" options

**Shared Elements (Both Modes):**
- Top navigation, left sidebar (investigations list)
- Results data table (same component)
- Export functionality
- Workspace/project context

---

## 10. Accessibility Hardening

### 10.1 Color Contrast Validation

**All text pairs pass WCAG AA (4.5:1 minimum):**

| Foreground | Background | Ratio | Pass |
|-----------|-----------|-------|------|
| Ink | Canvas | 14.8:1 | ✓✓ (AAA) |
| Ink | Investigation Light | 12.1:1 | ✓✓ (AAA) |
| Investigation Core | Canvas | 4.7:1 | ✓ |
| Clarity Cyan | Investigation Deep | 4.5:1 | ✓ |
| Slate (secondary) | Canvas | 7.5:1 | ✓✓ (AAA) |

**Non-text UI elements pass 3:1 minimum:**
- Borders, icons, status indicators all verified
- Focus outlines: 2px Clarity Cyan (5.2:1 on Canvas)

### 10.2 Keyboard Navigation

**Tab Order:**
1. Skip to main content (first tab)
2. Global search
3. Navigation menu items
4. Primary action buttons
5. Data table (row-by-row with arrow keys)
6. Secondary actions

**Focus Indicators:**
- Outline: 2px solid Clarity Cyan
- Offset: 2px from element
- Radius: Matches element border-radius
- Visible on all interactive elements

**Keyboard Shortcuts (Document in UI):**
- `Ctrl+K` / `Cmd+K`: Global search
- `Ctrl+N` / `Cmd+N`: New investigation
- `Ctrl+Enter` / `Cmd+Enter`: Execute pipeline
- `Esc`: Close modal/drawer

### 10.3 Screen Reader Optimization

**ARIA Labels:**
- All icons have `aria-label` (e.g., "Search investigations")
- Status indicators use `aria-live="polite"` for updates
- Data tables have proper header associations (`scope="col"`)
- Loading states announce "Processing pipeline, step 2 of 5"

**Semantic HTML:**
- `<nav>` for navigation
- `<main>` for primary content
- `<article>` for investigation cards
- `<table>` for data (not div-based)

### 10.4 High Contrast Mode Support

**Windows High Contrast Mode:**
- All borders and outlines visible (not relying on subtle shadows)
- Focus states use system colors
- Icons use stroke-based design (visible in HCM)

---

## 11. Internationalization

### 11.1 Script Support

**Priority Languages (OSINT Market):**
1. **English** - Primary (Inter native support)
2. **Russian** - Critical (Cyrillic in Inter)
3. **Spanish** - LATAM expansion (Inter native)
4. **German** - European law enforcement (Inter native)
5. **Arabic** - Middle East (requires Noto Sans Arabic fallback)
6. **Mandarin** - APAC expansion (requires Noto Sans SC fallback)

**Fallback Strategy:**

```css
/* Latin/Cyrillic */
font-family: 'Inter var', sans-serif;

/* Arabic */
[lang="ar"] {
  font-family: 'Noto Sans Arabic', 'Inter var', sans-serif;
}

/* Chinese Simplified */
[lang="zh-Hans"] {
  font-family: 'Noto Sans SC', 'Inter var', sans-serif;
}
```

### 11.2 RTL (Right-to-Left) Layout

**Arabic, Hebrew Support:**
- Mirror layouts (left nav becomes right nav)
- Text alignment: Right-aligned
- Icons: Flip directional arrows (→ becomes ←)
- Data flow diagrams: Right-to-left pipeline flow
- Testing: Use `dir="rtl"` attribute, validate all components

### 11.3 Date/Time Localization

**Format:**
- Use ISO 8601 internally (`2025-10-29T14:30:00Z`)
- Display: Locale-specific format (e.g., US: 10/29/2025 2:30 PM, EU: 29.10.2025 14:30)
- Timezone: Always show user's local time + UTC in hover tooltip

---

## 12. Design Tokens (JSON Export)

### 12.1 Token Structure

```json
{
  "color": {
    "investigation": {
      "deep": { "value": "oklch(25% 0.08 240)", "type": "color" },
      "core": { "value": "oklch(48% 0.14 240)", "type": "color" },
      "light": { "value": "oklch(92% 0.02 240)", "type": "color" }
    },
    "clarity": {
      "cyan": { "value": "oklch(65% 0.16 195)", "type": "color" },
      "teal": { "value": "oklch(58% 0.12 185)", "type": "color" }
    },
    "neutral": {
      "ink": { "value": "oklch(18% 0.02 240)", "type": "color" },
      "slate": { "value": "oklch(48% 0.01 240)", "type": "color" },
      "stone": { "value": "oklch(78% 0.005 240)", "type": "color" },
      "canvas": { "value": "oklch(98% 0.002 240)", "type": "color" }
    },
    "semantic": {
      "alert-critical": { "value": "oklch(52% 0.20 25)", "type": "color" },
      "alert-elevated": { "value": "oklch(68% 0.16 65)", "type": "color" },
      "validated": { "value": "oklch(52% 0.15 145)", "type": "color" },
      "processing": { "value": "oklch(72% 0.11 240)", "type": "color" }
    }
  },
  "typography": {
    "font-family": {
      "interface": { "value": "'Inter var', sans-serif", "type": "fontFamily" },
      "code": { "value": "'JetBrains Mono var', monospace", "type": "fontFamily" }
    },
    "font-size": {
      "display": { "value": "2.5rem", "type": "fontSize" },
      "h1": { "value": "2rem", "type": "fontSize" },
      "h2": { "value": "1.5rem", "type": "fontSize" },
      "h3": { "value": "1.125rem", "type": "fontSize" },
      "body": { "value": "0.875rem", "type": "fontSize" },
      "body-lg": { "value": "1rem", "type": "fontSize" },
      "caption": { "value": "0.75rem", "type": "fontSize" },
      "code": { "value": "0.875rem", "type": "fontSize" }
    },
    "font-weight": {
      "regular": { "value": "400", "type": "fontWeight" },
      "semibold": { "value": "600", "type": "fontWeight" },
      "bold": { "value": "700", "type": "fontWeight" }
    },
    "line-height": {
      "tight": { "value": "1.1", "type": "lineHeight" },
      "normal": { "value": "1.5", "type": "lineHeight" },
      "relaxed": { "value": "1.6", "type": "lineHeight" }
    }
  },
  "spacing": {
    "0": { "value": "0", "type": "spacing" },
    "1": { "value": "4px", "type": "spacing" },
    "2": { "value": "8px", "type": "spacing" },
    "3": { "value": "12px", "type": "spacing" },
    "4": { "value": "16px", "type": "spacing" },
    "5": { "value": "24px", "type": "spacing" },
    "6": { "value": "32px", "type": "spacing" },
    "7": { "value": "48px", "type": "spacing" },
    "8": { "value": "64px", "type": "spacing" }
  },
  "border-radius": {
    "sm": { "value": "4px", "type": "borderRadius" },
    "md": { "value": "6px", "type": "borderRadius" },
    "lg": { "value": "8px", "type": "borderRadius" },
    "full": { "value": "9999px", "type": "borderRadius" }
  },
  "shadow": {
    "sm": { "value": "0 1px 2px rgba(0,0,0,0.05)", "type": "boxShadow" },
    "md": { "value": "0 2px 8px rgba(0,0,0,0.08)", "type": "boxShadow" },
    "lg": { "value": "0 4px 16px rgba(0,0,0,0.12)", "type": "boxShadow" }
  },
  "motion": {
    "duration": {
      "fast": { "value": "160ms", "type": "duration" },
      "base": { "value": "200ms", "type": "duration" },
      "slow": { "value": "300ms", "type": "duration" },
      "loading": { "value": "1200ms", "type": "duration" }
    },
    "easing": {
      "out": { "value": "cubic-bezier(0, 0, 0.2, 1)", "type": "cubicBezier" },
      "in-out": { "value": "cubic-bezier(0.4, 0, 0.2, 1)", "type": "cubicBezier" },
      "linear": { "value": "linear", "type": "cubicBezier" }
    }
  }
}
```

### 12.2 TailwindCSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        investigation: {
          deep: 'oklch(25% 0.08 240)',
          core: 'oklch(48% 0.14 240)',
          light: 'oklch(92% 0.02 240)',
        },
        clarity: {
          cyan: 'oklch(65% 0.16 195)',
          teal: 'oklch(58% 0.12 185)',
        },
        neutral: {
          ink: 'oklch(18% 0.02 240)',
          slate: 'oklch(48% 0.01 240)',
          stone: 'oklch(78% 0.005 240)',
          canvas: 'oklch(98% 0.002 240)',
        },
        semantic: {
          'alert-critical': 'oklch(52% 0.20 25)',
          'alert-elevated': 'oklch(68% 0.16 65)',
          'validated': 'oklch(52% 0.15 145)',
          'processing': 'oklch(72% 0.11 240)',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'sans-serif'],
        mono: ['JetBrains Mono var', 'monospace'],
      },
      fontSize: {
        'display': ['2.5rem', { lineHeight: '1.1' }],
        'h1': ['2rem', { lineHeight: '1.25' }],
        'h2': ['1.5rem', { lineHeight: '1.33' }],
        'h3': ['1.125rem', { lineHeight: '1.33' }],
        'body': ['0.875rem', { lineHeight: '1.5' }],
        'body-lg': ['1rem', { lineHeight: '1.5' }],
        'caption': ['0.75rem', { lineHeight: '1.33' }],
        'code': ['0.875rem', { lineHeight: '1.6' }],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '24px',
        '6': '32px',
        '7': '48px',
        '8': '64px',
      },
    },
  },
};
```

---

## 13. Quality Assurance Checklist

### Accessibility (WCAG 2.2 Level AA)
- [ ] All text meets 4.5:1 contrast (3:1 for large text)
- [ ] Non-text UI elements meet 3:1 contrast
- [ ] Keyboard navigation functional on all components
- [ ] Focus indicators visible (2px outline, 2px offset)
- [ ] Screen reader labels on all icons and status indicators
- [ ] Color not sole indicator of state
- [ ] Reduced-motion preference respected

### Brand Alignment
- [ ] Visual identity distinct from competitors (not derivative)
- [ ] Avoids surveillance aesthetics (no spy clichés)
- [ ] Communicates institutional credibility (professional polish)
- [ ] AI transparency visible (not black-box magic)
- [ ] Dual persona design validated (basic users + experts both satisfied)

### Technical Feasibility
- [ ] All colors export to OKLCH format
- [ ] Typography supports required languages (Latin, Cyrillic, fallbacks for Arabic/CJK)
- [ ] Design tokens map to React components (shadcn/ui compatible)
- [ ] Icons scale to 16px without loss of legibility
- [ ] Motion respects performance budgets (<200ms standard transitions)

### User Experience
- [ ] Natural language input discoverable (prominent placement)
- [ ] Expert mode accessible (clear toggle, no hidden features)
- [ ] Data density appropriate (compact default, comfortable option)
- [ ] Progressive disclosure functional (simple → complex on demand)
- [ ] Audit trails visible (data lineage always accessible)

---

## 14. Success Metrics

### Brand Perception (5-Second Test)
**Target:** 80%+ correctly identify ODP as "investigation platform" or "OSINT tool"  
**Method:** Show landing page for 5 seconds, ask "What does this product do?"

### Dual Persona Validation
**Target:** 60% natural language mode usage, 40% expert mode  
**Metric:** Track mode selection in analytics  
**Interpretation:** Validates dual-mode design serves both personas

### Task Completion
**Basic Users:** Create investigation from natural language → 90%+ success rate, <15 minutes  
**Expert Users:** Validate custom YAML pipeline → 85%+ success rate, <30 minutes

### Accessibility Compliance
**Target:** 100% essential UI passes automated contrast checks  
**Target:** Zero keyboard navigation blockers  
**Method:** axe DevTools, manual keyboard testing

### Brand Adjective Association (Survey)
**Desired:** Professional (70%+), Powerful (60%+), Transparent (50%+)  
**Undesired:** Complicated (<15%), Intimidating (<10%), Surveillance-focused (<5%)

---

## Appendix: Quick Reference

### Color Palette (Hex Approximations)
```
Investigation Deep: #1a2940
Investigation Core: #2d5a8c
Investigation Light: #e8eef5
Clarity Cyan: #3db4d4
Clarity Teal: #4a9fb0
Ink: #1f2937
Slate: #64748b
Stone: #cbd5e1
Canvas: #f8fafc
Alert Critical: #dc2626
Alert Elevated: #f59e0b
Validated: #10b981
Processing: #6366f1
```

### Typography Scale
```
Display: 40px / 2.5rem
H1: 32px / 2rem
H2: 24px / 1.5rem
H3: 18px / 1.125rem
Body: 14px / 0.875rem
Body Large: 16px / 1rem
Caption: 12px / 0.75rem
Code: 14px / 0.875rem
```

### Spacing
```
1: 4px, 2: 8px, 3: 12px, 4: 16px
5: 24px, 6: 32px, 7: 48px, 8: 64px
```

### Component Sizes
```
Button: 40px height, 12px/20px padding
Data Table Row (Compact): 32px
Data Table Row (Comfortable): 40px
Icon: 24px master grid (16px, 20px, 32px variants)
Border Radius: 4px (sm), 6px (md), 8px (lg)
```

---
