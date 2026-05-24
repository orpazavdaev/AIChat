# AIChat Frontend

Next.js App Router frontend for an AI document chat platform. Includes authentication, a documents upload experience, and a dashboard shell.

## Folder Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout + QueryProvider
│   │   ├── (auth)/                 # Login / register
│   │   └── (app)/                  # Authenticated routes
│   │       ├── dashboard/
│   │       └── documents/
│   ├── components/
│   │   ├── auth/
│   │   ├── brand/
│   │   ├── documents/
│   │   ├── layout/
│   │   ├── providers/
│   │   └── ui/                     # shadcn components
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   └── use-documents.ts
│   ├── lib/
│   │   ├── api/
│   │   └── auth/
│   └── types/
├── .env.local.example
└── package.json
```

## Architecture Decisions

### Route groups

| Group | Routes | Layout |
|-------|--------|--------|
| `(auth)` | `/login`, `/register` | Split-panel auth shell, no sidebar |
| `(app)` | `/dashboard`, `/documents` | Sidebar + main content, `AuthGuard` |

Unauthenticated users hitting `(app)` routes are redirected to `/login`.

### API layer

| File | Purpose |
|------|---------|
| `lib/api/client.ts` | JSON fetch wrapper with Bearer token injection |
| `lib/api/auth.ts` | Register, login, me |
| `lib/api/documents.ts` | List documents, upload with progress |

JSON endpoints use `apiClient`. File uploads use `XMLHttpRequest` in `documentsApi.upload` so upload progress can be tracked (with a mock fallback when the browser cannot compute byte progress).

### Auth handling

| File | Purpose |
|------|---------|
| `lib/auth/token-storage.ts` | Persists access token + user in `localStorage` |
| `hooks/use-auth.ts` | Login/register mutations, `me` query, logout |

After login or register, the token is stored and the user is redirected to `/dashboard`. Protected API calls read the token from storage and send `Authorization: Bearer <token>`.

### React Query

`QueryProvider` wraps the app in the root layout. Feature hooks encapsulate queries and mutations:

- `useAuth` — auth state and actions
- `useDocuments` — document list query + upload mutation (invalidates list on success)

### UI stack

- **Tailwind CSS v4** — styling
- **shadcn/ui** — Button, Card, Input, Progress, Badge, Avatar, etc.
- **lucide-react** — icons

## Documents Upload

### Page

`/documents` — upload zone + list of uploaded files.

### Components

| Component | Role |
|-----------|------|
| `PdfUpload` | Drag & drop zone, file picker, validation, progress bar |
| `DocumentsList` | Renders uploaded documents with loading/empty states |
| `DocumentsPageContent` | Composes upload + list under page header |

### Upload flow

```
User selects PDF
  → client validates type + size (10MB)
  → upload mutation calls documentsApi.upload
  → XHR POST /documents/upload (multipart/form-data, field: file)
  → progress updates via xhr.upload.onprogress (or mock timer)
  → on success, React Query invalidates ['documents']
  → list refetches automatically
```

### Client-side validation

Matches backend rules:

- MIME type / extension must be PDF
- Max size 10MB
- Errors shown inline before and after upload

No text extraction, chunking, or chat UI yet.

## Getting Started

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Frontend runs on `http://localhost:3001`. Backend API defaults to `http://localhost:3000`.

Ensure the backend is running with CORS enabled for `http://localhost:3001` (`FRONTEND_URL` in backend `.env`).

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3000` |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server on port 3001 |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |

## Next Steps

1. Wire chat UI to conversations API
2. Add document detail view and delete
3. Show processing status when backend adds extraction pipeline
4. Replace localStorage auth with httpOnly cookies if needed
