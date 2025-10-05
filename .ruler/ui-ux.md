You are a senior product designer and UX architect.

## 🎯 Goal
Generate a full `UXUI.md` file for **VMC_LMS (Visual Media Creator LMS)**, aligned with the previously implemented database schema and core user flow.

The document should serve as a **design specification** bridging UX → UI → Frontend.

---

## 🧩 1. Context
- System: VMC_LMS
- Core user types: `instructor`, `learner`
- Tech stack: Next.js + Supabase + Tailwind + Shadcn/UI
- Database spec: Profiles, Courses, Enrollments, Assignments, Submissions, Grades
- Flow coverage: Sign-up → Onboarding → Course → Assignment → Submission → Grading

---

## 🧭 2. Deliverables
Produce a **single structured markdown file** titled `UXUI.md`, including:

### Section A: UX Architecture
1. **User Personas** (instructor, learner)
2. **Primary Journeys**
   - Instructor: Create → Publish → Manage → Grade
   - Learner: Browse → Enroll → Submit → View Feedback
3. **Information Hierarchy**
   - Key screens, primary vs secondary actions
   - State-driven transitions (`draft → published`, `submitted → graded`)
4. **Accessibility & Responsiveness**
   - Mobile-first flow
   - Keyboard and screen-reader compliance notes

### Section B: UI Component Map
- Each screen described as:
  ```
  ## Page: /courses/[id]/assignments/[id]
  **Purpose:** Submit assignment  
  **Components:** [AssignmentHeader, SubmissionForm, FileUpload, FeedbackBox]  
  **States:** { empty, submitted, resubmit_requested, graded }
  **Interactions:**
  - Submit triggers POST /submissions
  - Feedback auto-refresh on grading
  ```
- Use concise but consistent component naming (PascalCase)
- Mark Shadcn components with 💠 emoji

### Section C: Visual System
- Typography scale (Heading / Body / Caption)
- Color palette (Neutral / Primary / Accent)
- Iconography convention (Lucide icons mapping)
- Motion: Framer Motion usage examples (transitions, hover effects)

### Section D: UX Rationale
- Justify main layout decisions (dashboard structure, button placements)
- Trade-offs (simplicity vs flexibility)
- Future extensibility notes (Phase 2: Notifications, Analytics, History)

---

## 🧠 3. Output Requirements
- Format strictly in valid **Markdown**
- Use **code fences** for component pseudo-structure and routes
- Maintain **consistent heading hierarchy** (## / ### / ####)
- Avoid Figma markup or image placeholders
- Keep the tone concise but professional

---

## 🪄 Example Output Style

````markdown
# UXUI.md - VMC_LMS

## 1. UX Architecture
### Persona: Instructor
- Goal: Publish creative media courses
- Pain points: managing submissions, feedback loops

### User Flow: Course Creation
1. Dashboard → “New Course”
2. Fill course info → Save as Draft
3. Publish → Triggers visibility for learners
...