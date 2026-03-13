# AUTURNO

AUTURNO is a mobile-first workshop operations platform for mechanical service businesses.

This repository is scaffolded as an API-first monorepo:
- `apps/api`: NestJS backend, source of truth for security, tenancy, workflows, and business rules
- `apps/web`: Angular frontend, mobile-first UX for workshop and customer-facing flows

## Monorepo Structure

```text
apps/
  api/
    src/
      common/
      config/
      modules/
        auth/
        users/
        workshops/
        services/
        appointments/
        work-orders/
        diagnostics/
        quotes/
        notifications/
        loyalty/
        audit/
  web/
    src/
      app/
        core/
        shared/
        auth/
        client-portal/
        workshop-portal/
          agenda/
          work-orders/
          diagnostics/
          quotes/
          customers/
          vehicles/
          metrics/
```

## Scope Guardrails (V1)

Included:
- appointments, work orders, diagnostics, quotes, delivery promises, customer communication, loyalty basics

Excluded:
- marketplace features
- public workshop search
- public ratings/reputation
- workshop comparison logic

## Architecture Rules

- API-first: backend owns core business logic and transitions
- strict workshop-based multi-tenancy
- backend-driven RBAC and auditability for critical actions
- diagnosis and operation remain separate workflow concepts

## Workspace Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm test
```

See `AGENTS.md` for the complete product and architecture source of truth.
