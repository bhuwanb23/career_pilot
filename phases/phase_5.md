This is the **core of CareerPilot**. If judges remember one thing, it should be this workflow.

---

# Phase 5 – Smart Application Engine ⭐

## Goal

Turn a job description into a **complete, AI-assisted application package** with insights, tailored documents, and tracking.

---

# Phase 5.1 – Job Discovery

### Tasks

* Paste Job Description
* Paste Job URL
* Upload JD PDF (optional)
* Save job draft

**Output**

* Job ready for analysis.

---

# Phase 5.2 – JD Intelligence

### Tasks

* Parse JD
* Extract:

  * Company
  * Role
  * Location
  * Skills
  * Experience
  * Responsibilities
  * Preferred Qualifications
  * Keywords

**Output**

* Structured Job Profile.

---

# Phase 5.3 – Resume Matching

### Tasks

Compare Career Profile with JD.

Generate:

* Match %
* Matching skills
* Missing skills
* ATS keyword analysis
* Strengths
* Weaknesses

**Output**

* Resume Match Report.

---

# Phase 5.4 – Resume Tailoring

### Tasks

* Select best Persona
* Tailor resume
* Highlight missing keywords
* Improve bullet points
* Generate optimized resume version

**Output**

* Role-specific resume.

---

# Phase 5.5 – Application Assets

### Tasks

Generate:

* Cover Letter
* Recruiter LinkedIn Message
* Recruiter Email
* Referral Request

**Output**

* Ready-to-send application package.

---

# Phase 5.6 – CareerPilot Score ⭐

This is your hero feature.

### Calculate

#### 🎯 Fit Score

* Resume ↔ JD match
* Skills
* Experience
* ATS keywords

#### ⏰ Timing Score

* Job posting age
* Application deadline
* Early vs late applicant

#### 📈 Competition Score

* Company popularity
* Role demand
* Applicant estimate

#### 🚀 Readiness Score

* Resume quality
* Tailored resume
* Cover letter
* Recruiter outreach prepared

---

### Final Score

```text
CareerPilot Score

87 / 100

Fit          91

Timing       82

Competition  70

Readiness    95
```

---

# Phase 5.7 – AI Recommendations ⭐

Based on the score.

Examples:

* Add Docker project before applying
* Apply today (high timing score)
* Reach out to recruiter
* Use Backend Persona
* This company is highly competitive

**Output**

* Actionable recommendations.

---

# Phase 5.8 – Save Application

### Tasks

Store:

* Job
* Resume version
* Cover letter
* Recruiter messages
* CareerPilot Score
* Current status (Applied/Draft)

**Output**

* Application appears in Kanban.

---

# Complete Flow

```text
Paste JD / URL
        │
        ▼
JD Parsing
        │
        ▼
Resume Matching
        │
        ▼
CareerPilot Score
        │
        ▼
Resume Tailoring
        │
        ▼
Generate Application Assets
        │
        ▼
AI Recommendations
        │
        ▼
Save Application
        │
        ▼
Applications Dashboard Updated
```

---

# Backend Integrations

| Tool          | Purpose                                               |
| ------------- | ----------------------------------------------------- |
| **CareerOps** | JD evaluation, resume tailoring, application workflow |
| **MinerU**    | Parse uploaded JD PDFs (if provided)                  |
| **Gemini**    | Recommendations, cover letters, recruiter messages    |
| **OpenCode**  | Orchestrates the complete workflow                    |

---

# Final Output

At the end of Phase 5, the student has:

* ✅ Parsed Job Profile
* ✅ Resume Match Report
* ✅ Tailored Resume
* ✅ Cover Letter
* ✅ Recruiter Message(s)
* ✅ **CareerPilot Score**
* ✅ AI Recommendations
* ✅ Saved Application in the tracker

This phase is the **heart of CareerPilot**. Everything before it prepares the student, and everything after it (tracking, interview prep, outreach, analytics) builds on the application created here.
