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
│       └── chat/
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
| `DATABASE_URL`   | PostgreSQL connection string | —           |
| `JWT_SECRET`     | Secret for signing JWTs      | —           |
| `JWT_EXPIRES_IN` | Access token lifetime        | 15m         |

## Next Steps

1. Add refresh tokens with opaque random strings stored in the database
2. Implement user profile endpoints in the users module
3. Protect documents and chat routes with `JwtAuthGuard`
4. Add role-based access control if needed

