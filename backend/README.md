# AI SaaS Backend

NestJS backend for an AI SaaS platform. This is a structural scaffold only — no business logic or AI integrations yet.

## Folder Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema (empty, ready for models)
├── src/
│   ├── main.ts                # App bootstrap + global validation pipe
│   ├── app.module.ts          # Root module wiring all feature modules
│   ├── common/                # Shared infrastructure
│   │   ├── common.module.ts
│   │   ├── config/
│   │   │   ├── config.module.ts
│   │   │   └── configuration.ts
│   │   ├── database/
│   │   │   ├── database.module.ts
│   │   │   └── prisma.service.ts
│   │   └── utils/
│   │       └── index.ts
│   └── modules/               # Feature modules
│       ├── auth/
│       ├── users/
│       ├── documents/
│       └── chat/
├── test/                      # E2E tests
├── .env.example
└── package.json
```

Each feature module follows the same internal layout:

```
modules/<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts    # HTTP layer
├── <feature>.service.ts       # Business logic (empty for now)
└── <feature>.repository.ts    # Data access via Prisma
```

## Architecture Decisions

### Modular by domain

Feature code lives under `src/modules/` — one NestJS module per domain (`auth`, `users`, `documents`, `chat`). Each module owns its controller, service, and repository. This keeps boundaries clear as the product grows.

### Controller → Service → Repository

- **Controller** — HTTP routing and request/response handling
- **Service** — business rules and orchestration (to be implemented)
- **Repository** — Prisma queries, isolated from business logic

Repositories inject `PrismaService` so services stay free of raw database calls.

### Shared infrastructure in `common/`

Cross-cutting concerns are grouped under `src/common/`:

| Folder     | Purpose                                      |
|------------|----------------------------------------------|
| `config/`  | Environment-based configuration via `@nestjs/config` |
| `database/`| Global Prisma client lifecycle management    |
| `utils/`   | Shared helpers (empty, ready for extraction) |

`CommonModule` imports and re-exports config and database modules so feature modules stay lean.

### Global Prisma module

`DatabaseModule` is marked `@Global()` so `PrismaService` is available in every module without repeated imports. Feature modules only declare their own repository providers.

### Global validation pipe

`main.ts` registers a `ValidationPipe` with:

- `whitelist` — strips unknown properties from DTOs
- `forbidNonWhitelisted` — rejects requests with extra fields
- `transform` — auto-converts payloads to DTO class instances

This is ready for `class-validator` DTOs when endpoints are implemented.

### Prisma with PostgreSQL

Prisma is configured for PostgreSQL. The schema is intentionally empty — models will be added as each feature is built. This avoids premature schema design before requirements are clear.

### No AI logic yet

The `chat` and `documents` modules exist as structural placeholders. AI provider integrations, embeddings, and RAG pipelines will be added in a later phase, likely as dedicated services within or alongside these modules.

## Getting Started

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run start:dev
```

The server starts on `http://localhost:3000` by default.

## Scripts

| Script              | Description                    |
|---------------------|--------------------------------|
| `npm run start:dev` | Development with hot reload    |
| `npm run build`     | Compile TypeScript             |
| `npm run start:prod`| Run compiled output            |
| `npm run prisma:generate` | Generate Prisma client   |
| `npm run prisma:migrate`  | Run database migrations  |
| `npm run prisma:studio`   | Open Prisma Studio       |
| `npm run test`      | Unit tests                     |
| `npm run test:e2e`  | End-to-end tests               |

## Environment Variables

| Variable       | Description                          | Default     |
|----------------|--------------------------------------|-------------|
| `NODE_ENV`     | Runtime environment                  | development |
| `PORT`         | HTTP port                            | 3000        |
| `DATABASE_URL` | PostgreSQL connection string         | —           |

## Next Steps

1. Define Prisma models in `prisma/schema.prisma`
2. Run `npm run prisma:migrate` to apply schema
3. Implement DTOs with `class-validator` decorators
4. Add endpoints to controllers
5. Fill in service and repository logic per module
6. Add authentication guards in the `auth` module
