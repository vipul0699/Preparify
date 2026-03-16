# Preparify — UI/UX Design Brief

> **AI-powered quiz platform** — Users study any topic, take AI-generated quizzes, get instant feedback, and track their progress over time.

---

## 1. Product Overview

Preparify helps users prepare for exams or learn new topics through AI-generated quizzes. The platform:

- Lets users **sign up / log in** via Google or email+password
- **Generates quizzes** on any topic at 3 difficulty levels
- **Evaluates answers** with AI scoring and detailed feedback
- **Tracks scores** so users can see their learning progress

---

## 2. Target Users

- Students preparing for exams
- Self-learners exploring new topics
- Educators who want quick quiz generation

---

## 3. User Flows

### Flow 1 — Onboarding (First-Time User)

```
Landing Page → Sign Up (Google / Email+Password) → Dashboard
```

### Flow 2 — Returning User Login

```
Landing Page → Login (Google / Email+Password) → Dashboard
```

### Flow 3 — Take a Quiz

```
Dashboard → Select Topic + Difficulty → Quiz Screen (3 questions) → Submit Answers → Results Screen (scores + feedback per question) → Dashboard
```

### Flow 4 — Review Score History

```
Dashboard → Score History → View past quiz results (topic, score, date)
```

### Flow 5 — Ingest Study Material (Optional / Power User)

```
Dashboard → Upload Material → Enter topic name + paste text → Confirmation
```

> When material is ingested for a topic, future quizzes on that topic will use the material as context for more relevant questions.

---

## 4. Screens & Pages

### 4.1 Landing Page
- **Purpose:** Introduce Preparify and drive sign-ups
- **Elements:** Hero section, feature highlights, CTA buttons (Sign Up / Log In)

---

### 4.2 Auth Screens

#### Sign Up
- **Fields:** Username, Email, Password, Confirm Password
- **CTA:** "Create Account" button
- **Alt:** "Sign up with Google" button (primary/prominent)
- **Link:** "Already have an account? Log in"

#### Log In
- **Fields:** Username, Password
- **CTA:** "Log In" button
- **Alt:** "Sign in with Google" button (primary/prominent)
- **Link:** "Don't have an account? Sign up"

---

### 4.3 Dashboard (Home)
- **Purpose:** Central hub after login
- **Elements:**
  - Welcome message with user's name
  - **"Start Quiz" card** — topic input + difficulty selector (Easy / Medium / Hard) + "Generate Quiz" button
  - **Recent Scores widget** — last 3–5 quiz results (topic, score, date)
  - **Navigation** to Score History, Profile, Upload Material

---

### 4.4 Quiz Screen
- **Purpose:** Display generated questions one-by-one or all at once
- **Data available per question:**
  - Question text
  - Difficulty badge (Easy / Medium / Hard)
  - Text input for user's answer
- **Quiz has 3 questions** per session
- **CTA:** "Submit Answer" per question, or "Submit All" if showing all at once
- **UX Notes:**
  - Show a loading/generating state while the AI creates questions
  - Consider a progress indicator (e.g., "Question 1 of 3")

---

### 4.5 Results Screen
- **Purpose:** Show evaluation after submitting answers
- **Data available per answer:**
  - The question text
  - User's answer
  - **Score** (0–100)
  - **Is Correct** (✅ / ❌)
  - **Detailed AI feedback** (text explaining why the answer is right/wrong)
- **Summary section:**
  - Total score for the quiz
  - Number of correct answers out of total
  - Topic name
- **CTAs:** "Take Another Quiz", "View Score History", "Back to Dashboard"

---

### 4.6 Score History
- **Purpose:** View all past quiz results
- **Data available per record:**

| Field             | Description                    |
|-------------------|--------------------------------|
| Topic             | What the quiz was about        |
| Total Questions   | Number of questions (always 3) |
| Correct Answers   | How many were correct          |
| Score             | Overall score (0–100)          |
| Date              | When the quiz was completed    |

- **UX Notes:**
  - Sorted newest first
  - Consider filters by topic or date range
  - Visual elements: score charts, streaks, progress over time

---

### 4.7 Profile
- **Purpose:** View/edit user info
- **Data:** Username, Email, Date Joined
- **Actions:** Log out

---

### 4.8 Upload Material (Optional)
- **Purpose:** Let users paste study notes to improve quiz quality
- **Fields:** Topic name (text input), Content (large textarea)
- **CTA:** "Upload Material"
- **Success state:** Confirmation message

---

## 5. API Reference (for Frontend Integration)

**Base URL:** `http://127.0.0.1:8000`  
**Auth:** JWT Bearer token in `Authorization` header for protected endpoints.

---

### Auth Endpoints

#### `POST /api/auth/register/`
Register with email + password. Returns JWT tokens.

**Request:**
```json
{
  "username": "vipul",
  "email": "vipul@example.com",
  "password": "securepass123",
  "password_confirm": "securepass123"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully.",
  "user": {
    "id": "a1b2c3d4-...",
    "username": "vipul",
    "email": "vipul@example.com",
    "date_joined": "2026-03-13T00:00:00Z"
  },
  "tokens": {
    "access": "eyJ...",
    "refresh": "eyJ..."
  }
}
```

---

#### `POST /api/auth/login/`
Login with username + password. Returns JWT tokens.

**Request:**
```json
{
  "username": "vipul",
  "password": "securepass123"
}
```

**Response (200):**
```json
{
  "access": "eyJ...",
  "refresh": "eyJ..."
}
```

---

#### `POST /api/auth/token/refresh/`
Refresh an expired access token.

**Request:**
```json
{
  "refresh": "eyJ..."
}
```

**Response (200):**
```json
{
  "access": "eyJ..."
}
```

---

#### `POST /api/auth/google/`
Login/register via Google. Accepts a Google OAuth ID token.

**Request:**
```json
{
  "token": "google-id-token-string"
}
```

**Response (200):**
```json
{
  "message": "Login successful.",
  "is_new_user": true,
  "user": {
    "id": "a1b2c3d4-...",
    "username": "vipul",
    "email": "vipul@gmail.com",
    "date_joined": "2026-03-13T00:00:00Z"
  },
  "tokens": {
    "access": "eyJ...",
    "refresh": "eyJ..."
  }
}
```

---

#### `GET /api/auth/profile/` 🔒
Get the current user's profile.

**Response (200):**
```json
{
  "id": "a1b2c3d4-...",
  "username": "vipul",
  "email": "vipul@example.com",
  "date_joined": "2026-03-13T00:00:00Z"
}
```

---

#### `GET /api/auth/scores/` 🔒
Get the user's quiz score history (newest first).

**Response (200):**
```json
[
  {
    "id": "e5f6g7h8-...",
    "quiz_session": "b2c3d4e5-...",
    "topic": "Python Basics",
    "total_questions": 3,
    "correct_answers": 2,
    "score": 78,
    "completed_at": "2026-03-13T01:00:00Z"
  }
]
```

---

### Quiz Endpoints

> These work with or without auth. When authenticated, quizzes are linked to the user.

#### `POST /api/quiz/generate/`
Generate a quiz with 3 questions.

**Request:**
```json
{
  "topic": "Python Basics",
  "difficulty": "Easy"
}
```
`difficulty` options: `"Easy"`, `"Medium"`, `"Hard"` (default: `"Medium"`)

**Response (201):**
```json
{
  "quiz_id": "a1b2c3d4-...",
  "questions": [
    {
      "id": "f7g8h9i0-...",
      "text": "What year was Python first released?",
      "difficulty": "Easy"
    },
    {
      "id": "j1k2l3m4-...",
      "text": "Who created Python?",
      "difficulty": "Easy"
    },
    {
      "id": "n5o6p7q8-...",
      "text": "What paradigm does Python emphasize?",
      "difficulty": "Easy"
    }
  ],
  "context_used": true
}
```

> ⏳ **Note for UI:** This call may take 3–8 seconds (AI generation). Show a loading state.

---

#### `POST /api/quiz/submit/`
Submit an answer for evaluation. Call once per question.

**Request:**
```json
{
  "question_id": "f7g8h9i0-...",
  "user_answer": "Guido van Rossum"
}
```

**Response (201):**
```json
{
  "question": "f7g8h9i0-...",
  "user_answer": "Guido van Rossum",
  "score": 95,
  "feedback": "Correct! Guido van Rossum is indeed the creator of Python.",
  "is_correct": true
}
```

> When all 3 answers for a quiz session are submitted, a **ScoreRecord** is automatically created for the authenticated user.

---

#### `POST /api/quiz/ingest/`
Upload study material for better quiz generation.

**Request:**
```json
{
  "topic": "Python Basics",
  "content": "Python is a high-level, interpreted programming language created by Guido van Rossum..."
}
```

**Response (201):**
```json
{
  "message": "Material ingested successfully"
}
```

---

## 6. Design Considerations

### Authentication UX
- **Google login should be the primary/prominent option** (one-tap sign in)
- Email+password is the secondary fallback
- Store JWT tokens in localStorage or httpOnly cookies
- Auto-redirect to dashboard if already logged in

### Quiz UX
- Show a **loading animation** during quiz generation (3–8 seconds)
- Consider **step-by-step** question display (1 at a time) for better engagement
- Submit each answer individually — the API evaluates one at a time
- After the final answer, show the **full results screen** with all feedback

### Score History UX
- Show scores in a **list or card layout**
- Consider **charts/graphs** to visualize progress over time
- Highlight best scores or streaks

### Responsive Design
- Must work on **mobile and desktop**
- Quiz-taking should be comfortable on mobile (large touch targets, readable text)

### Error States to Handle
- Invalid login credentials → show error message
- Quiz generation fails → show fallback/retry option
- Network errors → show retry button
- Empty score history → show "No quizzes taken yet" empty state

---

## 7. Tech Notes for Frontend Team

| Item | Detail |
|------|--------|
| Backend | Django REST API (JSON only) |
| Auth | JWT Bearer tokens (`Authorization: Bearer <token>`) |
| Token lifetime | Access: 60 min, Refresh: 7 days |
| IDs | All IDs are UUIDs |
| Difficulty values | Exactly `"Easy"`, `"Medium"`, or `"Hard"` |
| Score range | 0–100 (integer) |
| Questions per quiz | Always 3 |
| 🔒 | Endpoints marked with 🔒 require auth |
