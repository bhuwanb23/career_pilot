# Phase 6 – Application Management

## Goal

Provide a centralized workspace where students can manage, track, and monitor all their job applications.

---

# Phase 6.1 – Applications Dashboard

### Tasks

* List all applications
* Quick statistics
* Search bar
* Filter & sort options

**Output**

* Central application overview.

---

# Phase 6.2 – Kanban Board

### Columns

```text
Draft

↓

Applied

↓

Assessment

↓

Interview

↓

Offer

↓

Rejected

↓

Archived
```

### Tasks

* Drag & drop cards
* Status indicators
* Priority badges

**Output**

* Visual application pipeline.

---

# Phase 6.3 – Application Details

Clicking an application opens a detailed view.

### Sections

* Company
* Role
* Job Description
* Resume Used
* Cover Letter
* Recruiter Messages
* CareerPilot Score
* Timeline

**Output**

* Complete application information.

---

# Phase 6.4 – Status Management

### Tasks

* Move between stages
* Update manually
* Record important dates
* Track current progress

**Output**

* Up-to-date application lifecycle.

---

# Phase 6.5 – Notes & Activity

### Tasks

* Personal notes
* Interview feedback
* Recruiter interactions
* Follow-up reminders

**Output**

* Personal application journal.

---

# Phase 6.6 – Search & Filters

### Search

* Company
* Role
* Skills

### Filters

* Status
* Date
* CareerPilot Score
* Company
* Persona Used

### Sorting

* Newest
* Oldest
* Highest Score
* Upcoming Deadlines

**Output**

* Quickly find any application.

---

# Phase 6.7 – Analytics Snapshot

Display lightweight insights.

### Metrics

* Total Applications
* Active Applications
* Interviews
* Offers
* Rejections
* Average CareerPilot Score

**Output**

* Quick progress overview.

---

# Phase 6.8 – CareerOps Synchronization

### Tasks

* Sync application status
* Update CareerOps records
* Refresh workflow data

**Output**

* CareerPilot and CareerOps remain synchronized.

---

# Complete Flow

```text
Application Created
        │
        ▼
Saved to Database
        │
        ▼
Displayed in Kanban
        │
        ▼
Status Updated
        │
        ▼
Notes & Timeline Updated
        │
        ▼
CareerOps Synced
        │
        ▼
Dashboard Analytics Updated
```

---

# Backend Integrations

| Tool           | Purpose                                              |
| -------------- | ---------------------------------------------------- |
| **CareerOps**  | Application lifecycle management                     |
| **PostgreSQL** | Store applications, notes, status history            |
| **OpenCode**   | Execute status-related workflows (future automation) |

---

# Final Output

By the end of Phase 6, the student has:

* ✅ Interactive Kanban board
* ✅ Detailed application view
* ✅ Status management
* ✅ Notes & timeline
* ✅ Search & filters
* ✅ Progress analytics
* ✅ CareerOps synchronization

This phase becomes the student's **career command center**, where every application is tracked from **Draft → Offer/Rejected** in one place.
