# AUTURNO V1 Backend Domain Structure (NestJS)

## 1. Backend Module Tree

```text
src
├── app.controller.ts
├── app.module.ts
├── main.ts
├── common
│   ├── constants
│   │   ├── permissions.constants.ts
│   │   └── roles.constants.ts
│   ├── decorators
│   │   ├── current-user.decorator.ts
│   │   ├── permissions.decorator.ts
│   │   ├── roles.decorator.ts
│   │   └── workshop-id.decorator.ts
│   ├── guards
│   │   ├── authenticated.guard.ts
│   │   ├── permissions.guard.ts
│   │   ├── roles.guard.ts
│   │   └── tenant.guard.ts
│   ├── interfaces
│   │   └── request-user.interface.ts
│   └── schemas
│       └── base.schema.ts
└── modules
    ├── auth
    ├── users
    ├── workshops
    ├── services
    ├── appointments
    ├── work-orders
    ├── diagnostics
    ├── quotes
    ├── loyalty
    └── audit
```

## 2. Concise Explanation

- **Security + tenancy first:** all tenant-owned collections include `workshopId`, and guard/decorator placeholders define where Auth0 auth, RBAC, and tenancy checks are enforced.
- **Backend-driven RBAC:** roles/permissions constants and metadata decorators are centralized in `common`, so controllers can declare access requirements declaratively.
- **Diagnosis vs operation separation:** `work-orders` models phased workflow/state and ETA/promises, while `diagnostics` and `quotes` are separate modules with their own schemas and services.
- **Simple but extensible:** each domain owns its module, DTOs, schema, and service boundary; cross-domain orchestration can be added later in application services without breaking aggregate ownership.

## 3. Service Boundaries (V1)

- **auth:** validates tokens and builds authenticated user context.
- **users:** manages workshop-scoped users, roles, permissions, and status.
- **workshops:** manages workshop identity and operational settings.
- **services:** manages service catalog entries and diagnostic requirement flag.
- **appointments:** handles workshop calendar booking and capacity-oriented schedule records.
- **work-orders:** owns state transitions, ETA fields, promise history, and timeline timestamps.
- **diagnostics:** stores findings/recommendations independently from operation execution.
- **quotes:** stores itemized quote drafts/sent/decision states tied to work orders.
- **loyalty:** tracks client point balances and point transaction history.
- **audit:** captures critical action trails and payload diffs for traceability.

## 4. Implementation Order (First Vertical Slice)

1. **Auth + tenancy skeleton:** wire Auth0 strategy, `AuthenticatedGuard`, `TenantGuard`, request user hydration.
2. **Users + workshops:** enable workshop bootstrap and staff provisioning with RBAC data.
3. **Services + appointments:** create workshop service catalog and appointment intake with capacity checks.
4. **Work-orders:** create work order from appointment and enforce phase transition rules.
5. **Diagnostics + quotes:** support diagnostic findings, quote lifecycle, and operation transition after approval.
6. **Audit hooks:** emit audit events for ETA changes, phase transitions, diagnostics, and quote updates.
7. **Loyalty completion flow:** award points when work order closes/picked up.
