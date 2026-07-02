---
name: career-ops
description: AI job search toolkit — scan jobs, evaluate offers, generate CVs and cover letters, interview prep, career analytics
arguments: mode
user_invocable: true
---

# CareerPilot + CareerOps Integration

> **Note:** For CareerPilot runtime agent development, use [career-pilot skill](../career-pilot/SKILL.md). This skill covers legacy CareerOps CLI file-sync only.

CareerPilot integrates with [CareerOps](https://github.com/santifer/career-ops) to provide AI-powered job search capabilities.

## Available Tools

| Tool | Description | Endpoint |
|------|-------------|----------|
| `careerops_sync` | Sync career profile to CareerOps workspace | `POST /api/careerops/sync` |
| `careerops_scan` | Scan job boards for matching positions | `POST /api/careerops/scan` |
| `careerops_evaluate` | Evaluate a job with A-F scoring | `POST /api/careerops/evaluate` |
| `careerops_pdf` | Generate PDF resume from profile | `POST /api/careerops/pdf` |
| `careerops_cover_letter` | Generate tailored cover letter | `POST /api/careerops/cover-letter` |

## Workflow

1. **Upload resume** → CareerPilot parses and creates career profile
2. **Sync to CareerOps** → `POST /api/careerops/sync` creates `cv.md` and `profile.yml`
3. **Scan for jobs** → `POST /api/careerops/scan` searches 45+ companies
4. **Evaluate matches** → `POST /api/careerops/evaluate` scores jobs A-F
5. **Generate materials** → PDF resume and cover letters from profile

## CareerOps Source

CareerOps CLI tools are available at `career-ops-src/` in the project root.
Key scripts: `scan.mjs`, `generate-pdf.mjs`, `generate-cover-letter.mjs`, `match-star.mjs`

## Data Flow

```
Resume Upload → Parse → CareerProfile → Sync → CareerOps Workspace
                                                    ├── cv.md
                                                    └── config/profile.yml
```
