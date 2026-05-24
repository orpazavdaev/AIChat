# AI SaaS Backend

NestJS backend for an AI SaaS platform with JWT authentication and a PostgreSQL data layer.

## Folder Structure

```
backend/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   ├── common.module.ts
│   │   ├── config/
│   │   ├── database/
│   │   └── utils/
│   └── modules/
│       ├── auth/
│       │   ├── dto/
│       │   ├── guards/
│       │   ├── strategies/
│       │   ├── decorators/
│       │   └── types/
│       ├── users/
│       ├── documents/
│       │   └── storage/
│       └── chat/
│       │   └── dto/
├── test/
├── .env.example
└── package.json
```

Each feature module follows the same internal layout:

```
modules/<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts
└── <feature>.repository.ts
```

## Architecture Decisions

### Modular by domain

Feature code lives under `src/modules/` — one NestJS module per domain (`auth`, `users`, `documents`, `chat`). Each module owns its controller, service, and repository.

### Controller → Service → Repository

- **Controller** — HTTP routing and request/response handling
- **Service** — business rules and orchestration
- **Repository** — Prisma queries, isolated from business logic

### Shared infrastructure in `common/`

| Folder      | Purpose                                              |
|-------------|------------------------------------------------------|
| `config/`   | Environment-based configuration via `@nestjs/config` |
| `database/` | Global Prisma client lifecycle management            |
| `utils/`    | Shared helpers                                       |

### Global Prisma module

`DatabaseModule` is marked `@Global()` so `PrismaService` is available in every module without repeated imports.

### Global validation pipe

`main.ts` registers a `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, and `transform` enabled. All auth DTOs use `class-validator` decorators.

## Authentication

### Endpoints

| Method | Path             | Auth     | Description              |
|--------|------------------|----------|--------------------------|
| POST   | `/auth/register` | Public   | Create account           |
| POST   | `/auth/login`    | Public   | Sign in                  |
| GET    | `/auth/me`       | Required | Return current user      |

### Request / response examples

**Register / Login** — request body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Register / Login** — response:

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "<uuid>",
    "email": "user@example.com"
  }
}
```

**Protected routes** — send the token as a Bearer header:

```
Authorization: Bearer <accessToken>
```

### Auth flow

```
Client                    AuthController              AuthService              AuthRepository
  |  POST /auth/register        |                          |                         |
  |---------------------------->|  validate RegisterDto    |                         |
  |                             |------------------------->|  findByEmail            |
  |                             |                          |------------------------>|
  |                             |                          |  hash password (bcrypt) |
  |                             |                          |  create user            |
  |                             |                          |------------------------>|
  |                             |                          |  sign JWT               |
  |<----------------------------|<-------------------------|                         |

Client                    AuthController              JwtAuthGuard + JwtStrategy
  |  GET /auth/me               |                          |
  |  Authorization: Bearer ...  |                          |
  |---------------------------->|-------------------------->|
  |                             |  verify JWT signature    |
  |                             |  attach user to request  |
  |<----------------------------|                          |
```

### Components

| File | Role |
|------|------|
| `dto/register.dto.ts` | Validates email + password (min 8 chars) |
| `dto/login.dto.ts` | Validates login payload |
| `auth.service.ts` | Register, login, token issuance |
| `auth.repository.ts` | User lookup and creation via Prisma |
| `strategies/jwt.strategy.ts` | Extracts and validates Bearer tokens |
| `guards/jwt-auth.guard.ts` | Protects routes; attach to any controller |
| `decorators/current-user.decorator.ts` | Reads authenticated user from request |

### Design decisions and trade-offs

**Access token only (no refresh tokens yet)**

Refresh tokens are intentionally omitted for now. This keeps the first implementation simple — one token type, one expiry, no token rotation or revocation store. The trade-off is that clients must re-authenticate when the access token expires (default 15 minutes). Refresh tokens with opaque random strings will be added later for longer sessions without widening the JWT exposure window.

**bcrypt for password hashing**

Passwords are hashed with bcrypt (10 salt rounds) before storage. bcrypt is slow by design, which mitigates brute-force attacks. Argon2 is stronger on paper, but bcrypt has broader ecosystem support and is sufficient for this stage.

**JWT as a stateless access token**

The JWT payload carries `sub` (user ID) and `email`. The server does not store sessions — every protected request is validated by signature and expiry alone. This scales horizontally without a shared session store. The trade-off is no server-side revocation until a blocklist or refresh-token rotation is introduced.

**Passport JWT strategy**

NestJS integrates with Passport via `@nestjs/passport`. The `JwtStrategy` validates incoming Bearer tokens; the `JwtAuthGuard` activates it on protected routes. Other modules import `AuthModule` and apply `@UseGuards(JwtAuthGuard)` on their endpoints.

**Generic error messages on login**

Login failures return `"Invalid credentials"` whether the email or password is wrong. This prevents user enumeration via distinct error messages.

**Auth owns user creation for registration**

Registration writes users through `AuthRepository` rather than coupling to `UsersModule`. User profile management stays in the users module; auth owns the signup path.

### Protecting other modules

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Get()
findAll(@CurrentUser() user: AuthenticatedUser) {
  return this.documentsService.findAll(user.userId);
}
```

Import `AuthModule` in any module that needs the guard.

## Documents

### Endpoints

| Method | Path                | Auth     | Description        |
|--------|---------------------|----------|--------------------|
| POST   | `/documents/upload` | Required | Upload a PDF file  |
| GET    | `/documents`        | Required | List user documents |

### Upload request

Send `multipart/form-data` with a single field named `file`:

```
POST /documents/upload
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

file: <pdf file>
```

### Upload response

```json
{
  "id": "<uuid>",
  "filename": "report.pdf",
  "path": "<userId>/<uuid>.pdf",
  "status": "UPLOADED",
  "createdAt": "2026-05-24T12:00:00.000Z",
  "updatedAt": "2026-05-24T12:00:00.000Z"
}
```

### File storage

PDFs are stored on the local filesystem under `UPLOAD_DIR` (default `uploads/`). Each file is saved as `uploads/{userId}/{uuid}.pdf`. The database stores the original filename, relative path, owner, and status.

| Layer | Responsibility |
|-------|----------------|
| `DocumentsController` | Accepts multipart upload, enforces auth |
| `DocumentsService` | Orchestrates storage + database write |
| `DocumentsRepository` | Persists and queries document metadata |
| `FileStorageService` | Validates PDF type/size, writes file to disk |

### Validation and errors

- Only `application/pdf` files with a `.pdf` extension are accepted
- Max file size defaults to 10MB (`MAX_FILE_SIZE_MB`)
- Missing file → `400 Bad Request`
- Invalid type → `400 Bad Request`
- File too large → `413 Payload Too Large`

Text extraction, chunking, and AI processing are not implemented yet. The `UPLOADED` status is a placeholder for future processing stages.

### Design decisions

**Local filesystem first**

Files land on disk under `uploads/{userId}/` before any cloud storage integration. This keeps the first iteration simple and makes debugging easy. S3 or object storage can replace `FileStorageService` later without changing the controller contract.

**Memory storage for Multer**

Uploads are buffered in memory via `memoryStorage()` then written by `FileStorageService`. For the 10MB limit this is acceptable. Streaming directly to disk can be added if file sizes grow.

**Metadata separate from file content**

The database stores filename, path, owner, and status — not file bytes. The path is relative (`userId/uuid.pdf`) so storage backend can change without breaking records.

**Per-user isolation**

Files are stored in user-scoped directories. List and upload endpoints always filter by the authenticated user's ID from the JWT.

## Chat

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/chat/conversations` | Required | Create a conversation |
| GET | `/chat/conversations` | Required | List user conversations |
| GET | `/chat/conversations/:id/messages` | Required | Fetch messages |
| POST | `/chat/conversations/:id/messages` | Required | Add a user message |

### Create conversation

```json
POST /chat/conversations
{ "title": "Optional title", "documentId": "optional-uuid" }
```

### Add message

```json
POST /chat/conversations/:id/messages
{ "content": "Hello" }
```

New messages are stored with role `USER`. `ASSISTANT` and `SYSTEM` roles exist in the schema for future AI integration.

### Layer responsibilities

| Layer | Responsibility |
|-------|----------------|
| `ChatController` | HTTP routes, auth guard |
| `ChatService` | Access checks, response mapping |
| `ChatRepository` | Prisma queries for conversations and messages |

### Design decisions and trade-offs

**Conversation-centric API**

Messages are nested under `/conversations/:id/messages` rather than a flat `/messages` resource. This matches the data model and keeps authorization scoped to a single conversation.

**USER role only from API**

The API only accepts user-authored messages today. Assistant replies will be added when the AI layer is implemented, without schema changes.

**No streaming or websockets**

Messages are request/response CRUD. Real-time delivery can be added later with SSE or WebSockets without changing the persistence model.

**Last message preview on list**

Listing conversations includes the latest message snippet via a single query with `take: 1` on messages. This avoids N+1 queries for the sidebar.

**Optional document link**

`documentId` on create validates ownership but does not trigger RAG or context injection yet.

## Getting Started

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

The server starts on `http://localhost:3000` by default.

## Scripts

| Script                    | Description                 |
|---------------------------|-----------------------------|
| `npm run start:dev`       | Development with hot reload |
| `npm run build`           | Compile TypeScript          |
| `npm run start:prod`      | Run compiled output         |
| `npm run prisma:generate` | Generate Prisma client      |
| `npm run prisma:migrate`  | Run database migrations     |
| `npm run prisma:studio`   | Open Prisma Studio          |
| `npm run test`            | Unit tests                  |
| `npm run test:e2e`        | End-to-end tests            |

## Environment Variables

| Variable         | Description                  | Default     |
|------------------|------------------------------|-------------|
| `NODE_ENV`       | Runtime environment          | development |
| `PORT`           | HTTP port                    | 3000        |
| `FRONTEND_URL`   | CORS origin for frontend     | http://localhost:3001 |
| `DATABASE_URL`   | PostgreSQL connection string | —           |
| `JWT_SECRET`     | Secret for signing JWTs      | —           |
| `JWT_EXPIRES_IN` | Access token lifetime        | 15m         |
| `UPLOAD_DIR`     | Local directory for PDF files | uploads    |
| `MAX_FILE_SIZE_MB` | Max upload size in MB      | 10          |

## Next Steps

1. Add refresh tokens with opaque random strings stored in the database
2. Implement user profile endpoints in the users module
3. Add text extraction and processing pipeline for uploaded PDFs
4. Add AI assistant replies and RAG over document context
5. Add role-based access control if needed

