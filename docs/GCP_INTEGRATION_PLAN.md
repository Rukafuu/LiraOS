# ☁️ LiraOS Google Cloud Integration Plan

Based on the available resources (Vertex AI, Cloud SQL, Cloud Storage, etc.), we can upgrade LiraOS from a local/hybrid backend to a fully cloud-native agentic platform.

## 🎯 Architecture Upgrades

### 1. Database & Persistence (The "Memory" Fix)

**Current:** Local SQLite / Railway Postgres (Unstable migrations).
**Upgrade:** **Google Firestore (NoSQL)** or **Cloud SQL**.

**Why Firestore?**

- **Schema-less:** Storing JSON objects (like user sessions, `githubToken`, complex agent memories) is native. No more "Column not found" errors.
- **Real-time:** Perfect for instant chat updates and multi-device sync (Web <-> Discord).
- **Scalable:** Handles millions of users/messages effortlessly.

**Why Cloud SQL?**

- If we strictly prefer Relational Data (SQL).
- Integrating with tools like Prisma is straightforward.

### 2. File Storage (Artifacts & Media)

**Current:** Local disk (lost on restart) or messy S3.
**Upgrade:** **Google Cloud Storage (GCS)**.

- Store generated images, videos, and agent logs reliably.
- Signed URLs for secure sharing in Discord/Web.

### 3. AI & reasoning (The "Brain")

**Current:** OpenAI/Gemini API keys.
**Upgrade:** **Vertex AI Platform**.

- **Foundational Models:** Access to Gemini Ultra/Pro via high-throughput endpoints.
- **Vision:** Use Vertex AI Vision for analyzing user screenshots/streams with higher precision than standard multimodal prompts.
- **Fine-tuning:** Ability to train Lira on specific codebases or docs.

## 🚀 Implementation Roadmap

### Phase 1: Database Migration (Immediate Priority)

- [ ] Create `FirestoreService` to replace `authStore.js` and `chatStore.js`.
- [ ] Migrate user credentials and history to Firestore.
- [ ] Remove complex SQL migration scripts.

### Phase 2: Agent Memory Expansion

- [ ] Store long-term vector embeddings in **Vertex AI Vector Search** (or Firestore Vector) allows Lira to remember conversations from months ago.

### Phase 3: Infrastructure

- [ ] Deploy backend to **Cloud Run** (Serverless containers) for auto-scaling and zero-maintenance.

## 🔑 Requirements

To start, we need:

1. A **Service Account Key** (JSON) with permissions for Firestore/Cloud SQL and Vertex AI.
2. The `GOOGLE_APPLICATION_CREDENTIALS` env var set to this key path.
