# Community Hero: Hyperlocal Civic Issue Reporting & Resolution Platform

Welcome to the **Community Hero** repository. This project is a hyperlocal, community-driven civic issue reporting and resolution platform powered by **Google AI Studio (Gemini API)**, built on **Next.js 14 (App Router)** and **Firebase**.

For the comprehensive technical blueprint, design architecture, database schema, AI configurations, and deployment strategies, see the [Technical Blueprint](file:///home/manvi/.gemini/antigravity/brain/27caca2a-c6e4-46a4-a4e4-1ff2e4c6dc0f/artifacts/technical_blueprint.md).

---

## Technical Overview

### 1. Requirements Analysis
*   **User Personas:** Citizens (reporters), Community Validators, Municipal Authorities/Admins.
*   **Core Flows:** Report → Validate → Assign → Track → Resolve → Archive.
*   **PWA Support:** Serves as a Progressive Web App (PWA) with client-side image compression (<500KB WebP) and offline report queues for low-bandwidth environments.

### 2. Tech Stack Decisions
*   **Frontend:** Next.js 14 (App Router) + Tailwind CSS + shadcn/ui + Google Maps JavaScript SDK
*   **Backend:** Next.js Serverless API Routes
*   **Database & Storage:** Firebase Firestore (real-time listeners) + Firebase Storage
*   **Auth:** Firebase Auth (Google OAuth + Phone OTP for identity verification)
*   **AI Engine:** Google AI Studio (Gemini 1.5 Pro) for multimodal categorization, summarization, and predictive analytics, plus Gemini Text Embeddings (`text-embedding-004`) for geospatial duplicate detection.

### 3. Database Schema (Firestore)
*   `issues` — Real-time tracking of civic issues (severity, status, geo-location, validations, and Gemini metadata).
*   `users` — Citizen and Validator records, points tracking, and unlocked achievement badges.
*   `authorities` — Municipal jurisdiction polygons (GeoJSON) and contact directories.
*   `comments` — Incident discussion and citizen feedback.
*   `analytics` — Rolling performance and volume rollups per ward/zone.

### 4. AI Feature Architecture (Gemini API)
*   **Issue Categorization (Gemini Vision):** Multimodal analysis of report photos to extract categories, severities, and hazards.
*   **Duplicate Detection (Gemini Embeddings):** Prevents multiple reports for the same issue by calculating cosine similarity over nearby incidents (<500m).
*   **Auto-Summary (Gemini Text):** Generates 2-sentence actionable briefs from verbose citizen reports.
*   **Predictive Insights:** Analyzes 90 days of issue aggregates to forecast hotspot zones and preventive maintenance schedules.
*   **Sentiment & Moderation:** Calculates a community "Frustration Index" and flags abusive comments.

---

## Folder Structure
```text
/
├── app/                           # Next.js App Router Pages & APIs
│   ├── api/                       # API Route Handlers
│   ├── (citizen)/                 # Report, tracking, and leaderboard UI
│   ├── (authority)/               # Incident queues and resolution UI
│   └── (admin)/                   # Ward dashboards & predictive insights
├── components/                    # Reusable UI (shadcn, Maps components)
├── lib/                           # Clients (Firebase, Gemini, Maps)
├── hooks/                         # React Hooks (useIssues, useLocation)
├── types/                         # Typescript Interfaces (Issue, User)
└── public/                        # PWA Assets & Service Worker
```

For full implementation schedules and API payloads, refer to the [Technical Blueprint](file:///home/manvi/.gemini/antigravity/brain/27caca2a-c6e4-46a4-a4e4-1ff2e4c6dc0f/artifacts/technical_blueprint.md).
