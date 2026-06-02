# Docwise

**Docwise** is a full-stack RAG (Retrieval-Augmented Generation) SaaS application. Users upload PDFs, ask questions in natural language, and receive grounded answers with **clickable source citations** — document name, page number, and excerpt.

Built as a production-style monorepo: **NestJS** API + **Next.js** frontend, **PostgreSQL + pgvector** for semantic search, and **Google Gemini** for embeddings and chat.

---

## Highlights

| Capability | Implementation |
|------------|----------------|
| Document Q&A | Top-5 cosine similarity over 1536-d embeddings |
| Grounded answers | Strict context-only prompt; refuses when evidence is missing |
| Streaming UX | Server-Sent Events (SSE) with live token + citation delivery |
| Citations | `[source-N]` in answers, expandable excerpts, document links |
| Multi-tenant isolation | All queries scoped by authenticated `userId` |
| Conversation history | Persisted threads with auto-titles from first question |

---

## Tech Stack

### Backend
| Layer | Choice | Version |
|-------|--------|---------|
| Runtime | Node.js | 20+ |
| Framework | NestJS | 11 |
| Language | TypeScript | 5.7 |
| ORM | Prisma | 7.8 |
| Database | PostgreSQL + **pgvector** | — |
| Auth | JWT (Passport) + bcrypt | 15m TTL |
| AI | Google Gemini API | `gemini-2.5-flash`, `gemini-embedding-001` |
| PDF | pdf-parse | Per-page text extraction |

### Frontend
| Layer | Choice | Version |
|-------|--------|---------|
| Framework | Next.js (App Router) | 16 |
| UI | React | 19 |
| Styling | Tailwind CSS 4 + shadcn-style components | — |
| Data | TanStack React Query | 5 |
| Icons | Lucide | — |

---

## System Architecture

High-level view of how the two applications interact:

```mermaid
flowchart TB
  subgraph Client["Frontend — Next.js :3001"]
    UI[App Router Pages]
    RQ[React Query Cache]
    SSE[SSE Stream Parser]
    UI --> RQ
    UI --> SSE
  end

  subgraph API["Backend — NestJS :3000"]
    Auth[Auth Module<br/>JWT Guard]
    Docs[Documents Module<br/>Upload · Chunk · Embed]
    Chat[Chat Module<br/>RAG · SSE · Citations]
    AI[AiService<br/>Gemini abstraction]
    Auth --> Docs
    Auth --> Chat
    Docs --> AI
    Chat --> AI
    Chat --> Docs
  end

  subgraph Data["Data Layer"]
    PG[(PostgreSQL)]
    Vec[pgvector<br/>cosine search]
    FS[Local PDF Storage]
    PG --> Vec
  end

  RQ -->|REST + Bearer JWT| Auth
  SSE -->|POST /ask/stream| Chat
  Docs --> PG
  Docs --> FS
  Chat --> PG
```

### Layered backend design

NestJS modules follow **Controller → Service → Repository**:

```mermaid
flowchart LR
  C[Controller<br/>HTTP + DTO validation]
  S[Service<br/>Business logic]
  R[Repository<br/>Prisma / raw SQL]
  C --> S --> R
```

| Module | Responsibility |
|--------|----------------|
| `AuthModule` | Register, login, JWT strategy, `/auth/me` |
| `DocumentsModule` | PDF upload, extraction, chunking, embedding, vector search |
| `ChatModule` | Conversations, messages, RAG orchestration, SSE streaming |
| `CommonModule` | Global config, Prisma, `AiService` |

---

## Architecture Decisions & Tradeoffs

### 1. RAG over fine-tuning

**Decision:** Retrieve relevant document chunks at query time and inject them into the prompt.

**Why:** No model training pipeline, instant updates when users upload new PDFs, answers traceable to source text.

**Tradeoff:** Quality depends on chunking and retrieval. Wrong chunks → wrong or incomplete answers. Mitigated by overlap, top-K retrieval, and a strict "no context → refuse" prompt.

---

### 2. pgvector in PostgreSQL (not a dedicated vector DB)

**Decision:** Store `vector(1536)` embeddings on `DocumentChunk` and query with cosine distance (`<=>`).

**Why:** Single database for users, documents, conversations, and vectors. Simpler ops, transactional consistency, no extra service.

**Tradeoff:** At very large scale (millions of chunks), dedicated vector stores (Pinecone, Qdrant) scale better. For a portfolio / SMB workload, pgvector is the pragmatic choice.

```mermaid
flowchart LR
  Q[User question] --> EQ[embedQuery]
  EQ --> VS["SELECT ... ORDER BY embedding <=> query LIMIT 5"]
  VS --> CTX[Top 5 chunks]
  CTX --> LLM[Gemini chat]
```

---

### 3. Fixed-size character chunking (800 / 150 overlap)

**Decision:** Split text into ~800-character windows with 150-character overlap, per PDF page.

**Why:** Simple, fast, no NLP dependencies. Overlap reduces boundary-splitting of sentences.

**Tradeoff:** Not semantic (paragraph/section aware). A table or list can span chunks awkwardly. Alternatives considered: recursive character splitters, sentence tokenizers, or LLM-based chunking — rejected for complexity and cost.

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Chunk size | 800 chars | Fits several sentences; stays under embedding context noise |
| Overlap | 150 chars | ~19% overlap preserves continuity at boundaries |
| Top K | 5 | Balance context window vs. noise |

---

### 4. Gemini embedding dimension truncation (3072 → 1536)

**Decision:** `gemini-embedding-001` returns up to 3072 dimensions; vectors are truncated to **1536** and L2-normalized before storage.

**Why:** Matches `vector(1536)` schema and keeps index size manageable.

**Tradeoff:** Some embedding quality may be lost vs. full dimensionality. Alternative: migrate schema to `vector(3072)` — rejected to keep pgvector index size and migration simple.

---

### 5. Separate embed tasks for documents vs. queries

**Decision:** `TaskType.RETRIEVAL_DOCUMENT` for chunks, `TaskType.RETRIEVAL_QUERY` for questions.

**Why:** Google's embedding models are trained for asymmetric retrieval — query and document vectors live in aligned but distinct spaces.

**Tradeoff:** Must always embed queries with the query task; mixing tasks hurts recall.

---

### 6. Temperature 0 for chat generation

**Decision:** `temperature: 0` on Gemini chat calls.

**Why:** Factual Q&A over fixed documents — minimize hallucination and answer variance.

**Tradeoff:** Less natural phrasing. Acceptable for a document assistant; creative writing would need higher temperature.

---

### 7. Strict grounding prompt + citation notation

**Decision:** System prompt forbids outside knowledge and requires `[source-N]` citations. If context is insufficient, return an exact fallback sentence.

**Why:** User trust and auditability. Citations map 1:1 to retrieved chunks.

**Tradeoff:** Model may still hallucinate occasionally; citations + stored chunk excerpts let users verify. No automated citation verification layer yet.

---

### 8. SSE streaming (not WebSockets)

**Decision:** RAG responses stream via **Server-Sent Events** on `POST /chat/conversations/:id/ask/stream`.

**Why:** One-way server→client fits token streaming. Works over HTTP, simpler than WebSockets, easy to parse in the browser.

**Tradeoff:** No bidirectional channel (cancel is client-side via `AbortController`). HTTP/1.1 connection limits can matter at extreme concurrency — HTTP/2 mitigates.

```mermaid
sequenceDiagram
  participant UI as Frontend
  participant API as NestJS
  participant VS as Vector Search
  participant AI as Gemini

  UI->>API: POST /ask/stream { question }
  API->>VS: embedQuery + top-5 search
  VS-->>API: chunks
  API->>API: save user message, build citations
  API-->>UI: SSE user_message
  API-->>UI: SSE citations
  loop tokens
    API->>AI: generateContentStream
    AI-->>API: token
    API-->>UI: SSE token
  end
  API->>API: save assistant message + citations JSON
  API-->>UI: SSE done
```

---

### 9. Citations persisted on assistant messages

**Decision:** `Message.citations` stored as JSON alongside assistant `content`.

**Why:** Conversation history shows sources without re-running retrieval. Streaming sends citations early; DB copy survives refresh.

**Tradeoff:** Citations are a snapshot at answer time. If documents are re-uploaded or re-embedded, old messages may reference stale chunk IDs. Re-retrieval on history view would be more accurate but costlier.

---

### 10. JWT in localStorage (no refresh token)

**Decision:** Short-lived access token (default **15m**) in `localStorage`, sent as `Authorization: Bearer`.

**Why:** Minimal auth complexity for a portfolio app. React Query refetches `/auth/me` when a token exists.

**Tradeoff:** XSS can exfiltrate tokens (mitigate with CSP in production). No silent refresh — users re-login after expiry. **HttpOnly cookies + refresh tokens** would be the production upgrade.

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Frontend
  participant API as Backend

  U->>FE: login(email, password)
  FE->>API: POST /auth/login
  API->>API: bcrypt verify
  API-->>FE: { accessToken, user }
  FE->>FE: localStorage.setItem
  FE->>API: GET /auth/me (Bearer)
  API-->>FE: { id, email }
```

---

### 11. Per-user data isolation at the repository layer

**Decision:** Every document and conversation query filters by `userId` from JWT. Vector search JOINs `Document` to enforce ownership.

**Why:** Defense in depth — even if a chunk UUID leaks, another user cannot retrieve it.

**Tradeoff:** No shared/org workspaces yet. Would need tenant model and RBAC.

---

### 12. Optional document-scoped conversations

**Decision:** `Conversation.documentId` optionally limits vector search to one PDF.

**Why:** Focused Q&A when a user knows which file matters.

**Tradeoff:** Global conversations search all user documents — broader but noisier. UI does not yet expose document picker on create (API supports it).

---

### 13. Monorepo without workspace tooling

**Decision:** `backend/` and `frontend/` as sibling folders, separate `package.json` files, no Turborepo/Nx.

**Why:** Clear separation, independent deploy targets, low ceremony.

**Tradeoff:** Shared types duplicated (`RagCitation`, etc.). A shared `packages/types` package would reduce drift.

---

### 14. React Query for server state

**Decision:** TanStack Query with keyed caches (`conversations`, `messages`, `documents`).

**Why:** Automatic caching, deduplication, optimistic updates during SSE (append user message before stream completes).

**Tradeoff:** SSE streaming state lives outside Query (`useRagStream` local state) — intentional split between ephemeral stream and persisted history.

---

### 15. NestJS global ValidationPipe

**Decision:** `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` on all DTOs.

**Why:** Strip unknown fields, reject over-posting, coerce types — reduces injection and bad payloads.

**Tradeoff:** Stricter than many tutorials; clients must match DTO shape exactly.

---

### 16. Local filesystem PDF storage

**Decision:** Uploaded PDFs are persisted on the API server under `UPLOAD_DIR` (default `uploads/{userId}/{uuid}.pdf`). Metadata and extracted text live in PostgreSQL; the binary file remains on disk for the lifetime of that server instance.

**Why:**

| Benefit | Explanation |
|---------|-------------|
| Simpler architecture | No object-storage SDK, bucket policies, presigned URLs, or cross-service IAM to configure for a portfolio deployment. |
| Lower operational complexity | One fewer external dependency in the critical path; uploads flow directly from Multer → disk → `pdf-parse`. |
| Easier local development | `npm run start:dev` works with a folder on disk; no cloud account or emulated S3 required. |
| Faster iteration | Upload, extraction, and embedding can be debugged end-to-end on a single machine without network hops to a blob store. |

**Drawbacks:**

| Limitation | Explanation |
|------------|-------------|
| Ephemeral disks on PaaS | Platforms such as Render (free tier) use **ephemeral filesystems**. Redeploys, restarts, or new instances can **delete** files under `uploads/` while database rows still reference missing paths. |
| Limited scalability | Disk I/O and capacity are bound to one host. Large libraries or concurrent uploads do not distribute across nodes. |
| Multi-instance deployments | Running multiple API replicas requires **shared storage** or object storage; otherwise each instance sees a different subset of files. |

**Tradeoff (explicit):** **Simplicity and faster development** versus **reliability and scalability**. Local storage is appropriate for demos, local development, and early portfolio hosting. A production deployment should treat cloud object storage (e.g. **AWS S3**, Google Cloud Storage, or equivalent) as the source of truth for PDF binaries, with the database storing object keys and metadata only.

```mermaid
flowchart LR
  subgraph Today["Current (portfolio)"]
    U[Upload] --> FS[Server filesystem<br/>uploads/]
    FS --> P[pdf-parse]
  end
  subgraph Production["Target production"]
    U2[Upload] --> S3[Object storage<br/>S3 / GCS]
    S3 --> P2[Worker / API<br/>pdf-parse]
  end
```

---

## Document Ingestion Pipeline

End-to-end flow from PDF upload to searchable vectors:

```mermaid
flowchart TD
  A[User uploads PDF] --> B[Multer memory buffer]
  B --> C[Save to disk<br/>uploads/userId/uuid.pdf]
  C --> D[Create Document<br/>status: UPLOADED]
  D --> E[pdf-parse<br/>per-page text]
  E --> F[chunkPagedText<br/>800 chars / 150 overlap]
  F --> G[Replace DocumentChunks in DB]
  G --> H[batchEmbedContents<br/>RETRIEVAL_DOCUMENT]
  H --> I[UPDATE embedding vector]
  I --> J{Success?}
  J -->|Yes| K[status: READY]
  J -->|No| L[status: FAILED<br/>clear chunks]
```

| Step | Detail |
|------|--------|
| Max file size | 10 MB (configurable via `MAX_FILE_SIZE_MB`) |
| MIME check | `application/pdf` only |
| Embedding batch | 100 texts per Gemini API call |
| Failure handling | Document marked `FAILED`; chunks cleared |

---

## RAG Query Pipeline

```mermaid
flowchart TD
  Q[User question] --> E1[Embed query<br/>RETRIEVAL_QUERY]
  E1 --> S[Cosine search top 5<br/>scoped by userId + optional documentId]
  S --> Z{Chunks found?}
  Z -->|No| NC[Return fixed no-context message<br/>no LLM call]
  Z -->|Yes| P[Build prompt with source-1..N<br/>filename + page + excerpt]
  P --> L[Gemini generateContentStream<br/>temperature 0]
  L --> A[Assistant message + citations JSON]
  C[Citations to client first via SSE] --> L
```

### Citation object shape

```json
{
  "sourceIndex": 1,
  "sourceRef": "source-1",
  "chunkId": "uuid",
  "documentId": "uuid",
  "documentFilename": "report.pdf",
  "chunkIndex": 0,
  "pageNumber": 3,
  "similarity": 0.87,
  "excerpt": "…chunk text…"
}
```

Frontend renders sources under each assistant message; `[source-N]` in the answer body is clickable and highlights the matching source.

---

## Database Schema

```mermaid
erDiagram
  User ||--o{ Document : owns
  User ||--o{ Conversation : owns
  Document ||--o{ DocumentChunk : contains
  Document ||--o{ Conversation : "scopes (optional)"
  Conversation ||--o{ Message : contains

  User {
    uuid id PK
    string email UK
    string passwordHash
  }

  Document {
    uuid id PK
    uuid userId FK
    string filename
    string path
    text content
    enum status
  }

  DocumentChunk {
    uuid id PK
    uuid documentId FK
    int index
    int pageNumber
    text content
    vector embedding
  }

  Conversation {
    uuid id PK
    uuid userId FK
    uuid documentId FK
    string title
  }

  Message {
    uuid id PK
    uuid conversationId FK
    enum role
    text content
    json citations
  }
```

**Enums:** `DocumentStatus` (`UPLOADED`, `READY`, `FAILED`), `MessageRole` (`USER`, `ASSISTANT`, `SYSTEM`).

**Indexes:** `userId` on documents/conversations; `documentId` on chunks; `conversationId` on messages; unique `(documentId, index)` on chunks.

---

## Frontend Architecture

```mermaid
flowchart TB
  subgraph Routes["App Router"]
    Auth["(auth)/login · register"]
    App["(app)/documents · chat"]
  end

  subgraph Guards
    AG[AuthGuard]
  end

  subgraph State
    RQ[React Query<br/>conversations · messages · documents]
    Stream[useRagStream<br/>SSE + optimistic user msg]
  end

  subgraph ChatUI
    CL[ConversationList]
    CV[ChatConversationView]
    ML[MessageList + MessageContent]
    MC[MessageCitations]
    MI[MessageInput]
  end

  App --> AG
  AG --> RQ
  CV --> Stream
  CV --> RQ
  CV --> ML
  ML --> MC
  CV --> MI
  App --> CL
```

| Route | Purpose |
|-------|---------|
| `/documents` | PDF upload + file list |
| `/chat` | New conversation empty state |
| `/chat/[id]` | Active thread with streaming |

**UX patterns:** loading skeletons, empty states, error banners (only when no cached data), dark mode, smooth scroll, citation expand/collapse.

---

## API Reference

Base URL: `http://localhost:3000`  
Auth: `Authorization: Bearer <accessToken>` (except register/login)

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Get JWT |
| GET | `/auth/me` | Current user |

### Documents
| Method | Path | Description |
|--------|------|-------------|
| POST | `/documents/upload` | Multipart PDF upload |
| GET | `/documents` | List user documents |
| POST | `/documents/search` | Debug vector search |

### Chat
| Method | Path | Description |
|--------|------|-------------|
| POST | `/chat/conversations` | Create thread |
| GET | `/chat/conversations` | List threads |
| GET | `/chat/conversations/:id` | Thread metadata |
| GET | `/chat/conversations/:id/messages` | Message history |
| POST | `/chat/conversations/:id/messages` | Add user message (non-RAG) |
| POST | `/chat/conversations/:id/ask` | RAG answer (JSON) |
| POST | `/chat/conversations/:id/ask/stream` | RAG answer (SSE) |

---

## Project Structure

```
Docwise/
├── backend/
│   ├── prisma/schema.prisma      # Models + pgvector extension
│   ├── src/
│   │   ├── main.ts               # Bootstrap, CORS, validation
│   │   ├── common/
│   │   │   ├── ai/ai.service.ts  # Gemini chat + embeddings
│   │   │   ├── database/         # PrismaService (global)
│   │   │   └── utils/chunk-text.ts
│   │   └── modules/
│   │       ├── auth/
│   │       ├── documents/        # PDF pipeline + vector search
│   │       └── chat/             # RAG, SSE, citations
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── app/                  # Next.js App Router
    │   ├── components/           # chat, documents, layout, ui
    │   ├── hooks/                # use-chat, use-rag-stream, …
    │   └── lib/api/              # REST + SSE client
    └── .env.local.example
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL with **pgvector** extension (e.g. [Neon](https://neon.tech))
- Google AI API key ([Google AI Studio](https://aistudio.google.com/apikey))

### 1. Database

Enable pgvector on your PostgreSQL instance, then configure `DATABASE_URL`.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, GEMINI_API_KEY

npm install
npx prisma db push --config prisma.config.ts
npm run start:dev
```

API runs at **http://localhost:3000**

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local

npm install
npm run dev
```

App runs at **http://localhost:3001**

### Environment variables

**Backend (`backend/.env`)**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Signing secret (change in production) |
| `JWT_EXPIRES_IN` | Token TTL (default `15m`) |
| `GEMINI_API_KEY` | Google Generative AI key |
| `GEMINI_EMBEDDING_MODEL` | Default `gemini-embedding-001` |
| `GEMINI_CHAT_MODEL` | Default `gemini-2.5-flash` |
| `FRONTEND_URL` | CORS origin (default `http://localhost:3001`) |
| `UPLOAD_DIR` | PDF storage directory |
| `MAX_FILE_SIZE_MB` | Upload limit (default `10`) |

**Frontend (`frontend/.env.local`)**

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend URL (default `http://localhost:3000`) |

---

## Future Improvements

The following items are intentional next steps beyond the current portfolio scope. Each subsection describes the capability, why it matters, expected benefits, and tradeoffs where relevant.

---

### Deep citation navigation

**What it is:** Today, citations link to the **Documents** page and highlight the source file in the list. A future enhancement would open the **PDF viewer directly at the cited page** (e.g. `report.pdf`, page 7) when the user clicks `[source-N]` or a row in the Sources panel.

**Why it matters:** Reviewers and end users can verify answers in one click instead of manually finding the file and scrolling to the page.

**Benefits:**

- Faster source verification and lower cognitive load during Q&A.
- Stronger perceived trust: the UI connects the AI’s claim to a concrete location in the original document.
- Better alignment with how legal, compliance, and research workflows expect citations to behave.

**Tradeoffs:** Requires a PDF rendering layer in the frontend (or signed URLs to a viewer service), page-accurate offsets from ingestion, and routing that survives document re-uploads. Storage must remain stable (see [§16 Local filesystem PDF storage](#16-local-filesystem-pdf-storage)) or citations must resolve via immutable object versions.

---

### In-PDF source highlighting

**What it is:** Beyond jumping to a page, the viewer would **highlight the exact sentence or text span** from the retrieved chunk—the same text sent to the model as context.

**Why it matters:** Page-level navigation alone does not show *which* sentence supported the answer, especially on dense pages.

**Benefits:**

- **Explainability:** Users see precisely what the model was allowed to use.
- **Transparency:** Reduces ambiguity when multiple facts appear on one page.
- Supports auditing and debugging retrieval quality (wrong highlight → wrong chunk).

**Tradeoffs:** Needs reliable character or bounding-box mapping from `pdf-parse` output to viewer coordinates; layout-heavy PDFs (scanned images, tables) are harder than plain text. Highlight state should be tied to `chunkId` at answer time to match persisted citations.

---

### Refresh token authentication

**What it is:** The API currently issues a **single short-lived JWT access token** (default 15 minutes) stored in `localStorage`. A production auth upgrade would add **long-lived refresh tokens** used only to obtain new access tokens, enabling **silent session renewal** without re-entering credentials.

**Why it matters:** Short access tokens limit exposure if leaked; refresh tokens allow longer sessions without keeping a long-lived bearer token in JavaScript-accessible storage.

**Benefits:**

| Area | Benefit |
|------|---------|
| UX | Users stay signed in across tab refreshes and work sessions; fewer disruptive logouts. |
| Security | Access tokens remain short-lived; refresh tokens can be rotated, revoked, and bound to device/session. |
| Production practice | HttpOnly, Secure, SameSite cookies for refresh tokens reduce XSS impact compared to `localStorage` access tokens. |

**Tradeoffs:** Requires refresh endpoint, token rotation/revocation storage, and CSRF considerations for cookie-based flows. More moving parts than the current minimal JWT implementation (see [§10 JWT in localStorage](#10-jwt-in-localstorage-no-refresh-token)).

---

### Manual retry for failed chat responses

**What it is:** When an SSE stream fails (network error, Gemini outage, timeout), the client shows an **error state** and offers **“Retry last question”**—not an automatic background retry of the full RAG pipeline.

**Why it matters:** Chat is stateful and streaming; blind retries are easy to get wrong.

**Why not automatic retry for streaming chat:**

| Risk | Description |
|------|-------------|
| Duplicated messages | `prepare()` may persist the user message again if the whole handler re-runs. |
| Duplicated writes | Partial assistant content or citation events may already have been processed. |
| Partial SSE delivery | The client may have rendered tokens before failure; a silent retry produces duplicate or conflicting UI. |

**Preferred approach:**

1. Surface a clear error with the last question still visible.
2. Let the user explicitly retry (re-invoke stream for the same question, or a dedicated “resend” that reuses the existing user message when safe).

**Benefits:** Predictable behavior, no hidden duplicate rows in `Message`, easier to reason about in support and tests.

**Tradeoffs:** Slightly more user friction than silent retry; requires careful API design if “retry” should skip re-inserting the user message.

---

### Embedding retry with exponential backoff

**What it is:** Add bounded retries inside `AiService` (or a thin wrapper) for **idempotent** embedding calls: `embedTexts` (document ingestion) and `embedQuery` (retrieval). Do **not** apply the same pattern to streaming chat generation without a dedicated design.

**Why it matters:** Transient Gemini or network failures during upload should not immediately mark a document `FAILED` or block a question when a short retry would succeed.

**Retry only transient failures:**

| Retry | Examples |
|-------|----------|
| Yes | HTTP 429 (rate limit), 502/503/504 (gateway/upstream), timeouts, connection resets |
| No | 400 (malformed request), 401/403 (API key / auth), validation errors, “no text in PDF” business failures |

**Exponential backoff:** Wait progressively longer between attempts (e.g. 1s → 2s → 4s, with jitter) so retries do not amplify load during outages.

**Benefits:**

- Higher ingestion success rate on flaky networks or quota spikes.
- Clear separation: embeddings are safe to repeat; identical vectors for the same text.

**Tradeoffs:** Longer tail latency on failure; must cap max attempts and log retries for observability. Chat streaming remains manual-retry (previous subsection).

---

### Hybrid retrieval and re-ranking

**What it is:** Extend pure vector search (cosine on pgvector) with **keyword retrieval (BM25)**, optional **cross-encoder re-ranking** of top candidates, and a **similarity threshold** below which the system refuses to answer.

**Why it matters:** Vector search alone can miss exact tokens (SKUs, clause numbers) or retrieve semantically related but wrong chunks.

**Benefits:**

- Better recall when users quote exact phrases from PDFs.
- Re-ranking improves precision before chunks enter the prompt.
- Thresholds reduce hallucination driven by weak matches.

**Tradeoffs:** Extra indexes (e.g. PostgreSQL full-text or OpenSearch), latency, and tuning complexity. Re-ranking adds cost per query if using a separate model.

---

### Background jobs and cloud object storage

**What it is:** Move long-running ingestion (extract → chunk → embed) to a **job queue** (e.g. BullMQ, SQS + worker) and store PDF binaries in **object storage** instead of local disk.

**Why it matters:** Complements [§16](#16-local-filesystem-pdf-storage): uploads return quickly, workers retry embeddings, and files survive deploys.

**Benefits:**

- API instances become stateless; horizontal scaling is feasible.
- Failed jobs can retry without blocking the HTTP request.
- Durable PDF storage for citation navigation and compliance.

**Tradeoffs:** Infrastructure cost, monitoring for queue depth and dead-letter queues, and idempotent job handlers.

---

### Multi-tenant organizations

**What it is:** Model **organizations** (or workspaces) with shared document libraries, roles (admin, member, viewer), and scoped vector search.

**Why it matters:** Current isolation is **per user** only ([§11](#11-per-user-data-isolation-at-the-repository-layer)); real teams need shared corpora without duplicating uploads.

**Benefits:** Team SaaS positioning, centralized billing, shared knowledge bases.

**Tradeoffs:** Schema migration (`Organization`, memberships), RBAC on every repository method, and data-export/deletion policies per tenant.

---

### Observability and cost controls

**What it is:** Structured logs (JSON), distributed tracing (OpenTelemetry), and metrics for **embedding token volume**, **chat token usage**, and error rates per endpoint.

**Why it matters:** RAG systems fail opaquely without visibility into retrieval vs generation vs external API limits.

**Benefits:**

- Faster incident response and capacity planning.
- Per-user or per-org cost attribution for Gemini billing.

**Tradeoffs:** Collector overhead, PII in logs (must redact prompts or hash user IDs), and storage cost for traces.

---

### E2E RAG evaluation (golden datasets)

**What it is:** Automated tests with fixed PDFs, questions, and expected behaviors (answer contains X, cites `source-2`, or refuses when context is insufficient).

**Why it matters:** Changes to chunk size, top-K, or prompts can regress quality without compile-time failures.

**Benefits:**

- CI signal on retrieval and grounding before release.
- Documented quality baseline for portfolio reviewers.

**Tradeoffs:** Golden sets require maintenance; LLM outputs may need fuzzy matching or human-reviewed baselines, not exact string equality.

---

## License

Private / portfolio project — adjust as needed for your use case.
