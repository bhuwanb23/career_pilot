---
# CareerPilot AI — Promo Video Design System
# Adapted from frontend/DESIGN.md (Figma-inspired brand)
# For 1920x1080 video composition
---

## Palette

### Core (monochrome)
- **ink**: "#000000" — All headline and body type on light surfaces
- **canvas**: "#FFFFFF" — Default background, scene backgrounds, card surfaces
- **inverse-canvas**: "#000000" — Dark scene backgrounds (S1: Chaos)
- **inverse-ink**: "#FFFFFF" — Type on dark surfaces

### Surfaces
- **surface-soft**: "#F7F7F5" — Subtle card backgrounds on white canvas
- **hairline**: "#E6E6E6" — 1px borders, dividers
- **hairline-soft**: "#F1F1F1" — Softer dividers

### Color Blocks (pastel palette — use as scene accent panels)
- **block-lime**: "#DCEEB1" — Feature highlight, success states, CareerPilot Score
- **block-lilac**: "#C5B0F4" — AI action scenes, magic/wonder moments
- **block-cream**: "#F4ECD6" — Warm backgrounds, narration scenes
- **block-mint**: "#C8E6CD" — Interview Kit, Personas
- **block-pink**: "#EFD4D4" — Kanban board, application tracking
- **block-coral**: "#F3C9B6" — Outreach, networking
- **block-navy**: "#1F1D3D" — Deep background for logo reveal, dark CTAs

### Accent
- **accent-magenta**: "#FF3D8B" — Primary CTA color, CareerPilot Score highlights, key metrics
- **semantic-success**: "#1EA64A" — Checkmarks, completion indicators

## Typography

### Font Family
- **Primary**: Montserrat
  - Use weights: 300, 400, 500, 600, 700
  - Fallback: system-ui, sans-serif
- **Mono**: JetBrains Mono — substitute for figmaMono
  - Weights: 400, 500
  - Fallback: SF Mono, menlo, monospace

### Video Hierarchy (for 1920x1080)
- **Title XL**: 86px, weight 300, leading 1.00, tracking -1.72px — Hero headlines
- **Title LG**: 64px, weight 300, leading 1.10, tracking -0.96px — Scene openers
- **Headline**: 48px, weight 500, leading 1.20, tracking -0.5px — Story-block titles
- **Subhead**: 36px, weight 400, leading 1.30, tracking -0.3px — Feature callouts
- **Body LG**: 28px, weight 300, leading 1.35, tracking -0.14px — Narrator text
- **Body**: 24px, weight 300, leading 1.40, tracking -0.1px — Supporting text
- **Label**: 18px, weight 400, leading 1.30 — UI labels, scores
- **Caption (mono)**: 16px, weight 400, leading 1.20, tracking 0.5px — Eyebrow labels

### Principles
- Weight, not opacity, carries hierarchy
- Negative tracking scales with size (large = tighter)
- Mono reserved for labels, scores, data — never body
- Tight leading on display (1.00-1.20), generous on body (1.35-1.45)

## Shapes

| Token | Value | Use |
|-------|-------|-----|
| pill | 50px | CTAs, score badges |
| lg | 24px | Scene panels, color blocks |
| md | 12px | Cards, feature tiles |
| sm | 6px | Small chips |
| full | 9999px | Circular icons |

## Spacing (for 1920x1080 layout)
- **Section padding**: 96px top/bottom, 120px sides
- **Card padding**: 32px
- **Element gap**: 16px (small), 24px (medium), 48px (large)
- **Scene padding**: 80px 120px (default for content scenes)

## Depth
- **Flat**: Scene backgrounds — no shadows
- **Soft**: 0 4px 16px rgba(0,0,0,0.08) — Elevated cards on color blocks
- **Glow**: 0 0 30px rgba(255,61,139,0.3) — CTA buttons, score highlights

## Animation

### GSAP Eases (signature palette)
- **Entrance (confident)**: "power3.out" — Most content entrances
- **Entrance (springy)**: "back.out(1.5)" — Logo, score reveal, badges
- **Entrance (smooth)**: "expo.out" — UI panels, dashboard reveals
- **Exit**: "power2.in" — Exit animations (final scene only)
- **Stagger**: 0.08-0.12s between elements

### Choreography
- First animation offset: 0.3s from scene start
- Typical entrance duration: 0.5-0.7s
- Micro-beats: 0.3-0.4s for action sequences
- Scene transitions: 0.5s crossfade
- Use at least 3 different eases per scene

## Avoidance Rules (from Figma brand)
- No mid-gray text — hierarchy from weight, not opacity
- No drop shadows on color-block sections — color is the depth device
- No accent colors outside the documented palette
- No square CTAs — always pill or full
- Mono for labels only, never body copy
- Weight hierarchy, not opacity hierarchy
