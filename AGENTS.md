# AUTURNO - AGENTS.md

## Mission

Work on AUTURNO as a mobile-first workshop operations platform for mechanical service businesses.

AUTURNO is NOT a generic appointment app.

Correct framing:

- workshop operating system
- delivery promise engine
- diagnosis-to-operation workflow platform
- operational data capture layer from day one

Your job is to help implement V1 safely, incrementally, and with minimal unnecessary change.

---

## Non-Negotiable Product Rules

### Business model

Current model is closed B2B2C:

- each workshop has its own workspace
- each workshop has its own customer-facing experience
- customers interact only with their workshop

### Explicitly out of V1

Do NOT introduce any of these unless explicitly requested:

- marketplace
- public workshop search
- public ratings or reputation
- workshop comparison
- vehicle health score
- public reliability badges
- multi-workshop discovery

### Core product principles

- Capacity is measured in work hours, not number of cars.
- Diagnosis and operation are separate concepts and must remain separate in model and workflow.
- Delivery promises must be realistic, editable, and traceable.
- Diagnosis remains valuable even if repair is rejected.
- Silent metrics must be captured from V1.

---

## Core Workflows

### Direct service flow

Examples:

- oil change
- wheel alignment
- balancing
- battery replacement
- simple service

Phases:

- scheduled
- in_operation
- ready
- closed
- picked_up

### Diagnosis flow

Examples:

- brake noise
- electrical issue
- vibration
- check engine
- unknown issue

Phases:

- reception
- in_diagnosis
- quote_sent
- awaiting_approval
- in_operation
- ready
- closed
- picked_up

Rules:

- diagnosis promise comes before final delivery promise
- approved quote moves to operation
- rejected quote closes repair path but preserves diagnosis

---

## V1 Functional Scope

Implement only V1 unless explicitly told otherwise.

### Included in V1

- service catalog
- appointments
- work orders
- diagnosis flow
- quotes and approvals
- delivery promise management
- workshop/customer portals
- loyalty basics
- audit trail for critical actions
- backend-driven RBAC
- workshop-based tenancy

### Excluded from V1

- marketplace flows
- public discovery
- public ratings
- public reputation
- health score
- advanced analytics dashboards
- advanced gamification
- voice-first intake

---

## Security and Authorization

Security is a top priority.

### Required

- Auth0 authenticates
- backend authorizes
- backend resolves roles and permissions from database
- every tenant-owned record must include workshopId
- no cross-tenant access
- critical actions must be auditable

### Roles

- owner
- admin
- operator
- mechanic
- client

### Base permissions

- workshop.manage
- users.manage
- services.manage
- appointments.manage
- workorders.read
- workorders.write
- diagnostics.write
- quotes.write
- payments.write
- clients.read
- clients.write
- metrics.read

### Audit examples

- ETA changes
- status transitions
- diagnosis changes
- quote changes
- customer informed flag changes

---

## Final Stack

Use this stack unless explicitly told otherwise:

- Frontend: Angular
- Delivery: mobile-first responsive web app
- Backend: NestJS
- Database: MongoDB Atlas
- Auth: Auth0 for SPA/web
- Architecture: API-first

Important:

- product does not change
- domain model does not change
- business rules do not change
- only the frontend delivery mechanism changed from native to web

---

## Architecture Rules

### Backend owns

- auth integration
- RBAC
- tenancy enforcement
- state transitions
- ETA calculation
- diagnosis handling
- quote handling
- loyalty
- history
- auditing

### Frontend owns

- presentation
- forms
- navigation
- API consumption
- UI state

Never put critical business rules in frontend code.

---

## Repository Rules

### Active structure

Treat the current working repository structure as the source of truth.

Preferred repo layout:

- apps/api
- apps/web

### Important

- Do not create parallel architectures.
- Do not duplicate modules in alternate trees.
- Do not scaffold a second version of an already existing area.
- Reuse and extend the currently active code layout instead of inventing a new one.

### Angular structure

- auth
- core
- shared
- client-portal
- workshop-portal

### Workshop portal areas

- agenda
- work-orders
- diagnostics
- quotes
- customers
- vehicles
- metrics

### NestJS areas

- auth
- users
- workshops
- services
- appointments
- work-orders
- diagnostics
- quotes
- notifications
- loyalty
- audit

---

## Module Wiring Rules

When working in NestJS:

- if a service depends on another service, import the module that exports that dependency
- if a controller or route uses a guard, ensure the containing module imports the module that exports that guard and its dependencies
- prefer explicit module imports/exports over implicit assumptions
- do not leave dependency wiring half-finished

When working in Angular:

- prefer standalone components if that is what the current app uses
- keep route structure aligned with the existing app
- do not invent a second app shell

---

## Environment and Secret Rules

### Frontend

Only public client configuration may exist in Angular environment files:

- apiBaseUrl
- auth0Domain
- auth0ClientId
- auth0Audience

Do not place secrets in frontend code.

### Backend

Sensitive values must stay in backend env files only:

- Mongo connection strings
- Auth0 secrets
- tokens
- passwords
- private credentials

### Secret handling

- Never print, copy, or move secret values into generated code, docs, prompts, or commits.
- Treat .env, .env.local, credentials, tokens, passwords, and connection strings as sensitive.
- Use placeholders in examples and committed files.
- Prefer `.env.example` for documented config.
- Do not move backend secrets into frontend files.

---

## Package and Tooling Rules

- Do not leave fake TODO scripts in package.json.
- Only add scripts that are real and runnable in the current repo.
- If lint/test/format are not configured, omit those scripts instead of faking them.
- Do not add dependencies unless they are necessary for the requested task.
- Do not upgrade major versions unless explicitly requested.
- Do not mix incompatible framework majors.
- Minimize tooling churn.

---

## Execution Rules

Always:

- prioritize V1 over future ideas
- preserve diagnosis vs operation separation
- preserve multi-tenancy and backend-driven RBAC
- prefer the smallest correct change
- optimize for incremental delivery
- preserve working code
- avoid broad refactors unless explicitly requested
- avoid speculative abstractions
- avoid replacing existing working patterns without reason
- do not redesign the product unless explicitly asked

### Priority order

1. security and tenancy
2. domain model correctness
3. workflow correctness
4. backend architecture
5. frontend structure
6. mobile-first UX
7. future extensibility

---

## Output Rules

### When generating code

- return complete files, not partial diffs, unless explicitly requested
- keep names and paths consistent with the current repo
- prefer minimal changes over rewrites
- do not invent missing files unless they are truly required
- do not silently rename core concepts

### When generating architecture

Return in this order:

1. folder tree
2. concise explanation
3. implementation order

### When generating backend design

Include:

- modules
- DTOs
- schemas/entities
- guards
- services
- permissions
- import/export wiring when relevant

### When generating frontend design

Include:

- routes
- layouts
- feature areas
- component responsibilities
- mobile-first notes

### When generating endpoints

Include:

- method
- route
- purpose
- request shape
- response shape
- required permissions
- tenancy rules

---

## Working Style

- Be practical.
- Be conservative with changes.
- Respect existing working code.
- Prefer vertical slices over broad platform refactors.
- Surface risky assumptions clearly.
- Keep explanations short and implementation-focused.

When uncertain:

- inspect the current repo structure first
- prefer adapting to what already exists
- do not assume a clean scaffold if the repo is already partially implemented

## Validation Commands

When working in apps/api:

- run TypeScript compilation after backend changes
- prefer existing project scripts if available
- if a module is changed, verify Nest wiring and imports
- verify Mongo schemas compile correctly with nullable fields typed explicitly

When working in apps/web:

- verify Angular build or TypeScript compilation after relevant changes

Do not claim success without running a real validation command if one is available.

## Angular Template and Control Flow Rules

When working in Angular templates:

- Prefer Angular built-in control flow syntax:
  - `@if (...) { ... }`
  - `@else { ... }`
  - `@for (...; track ...) { ... }`
  - `@switch / @case / @default`
- Do not introduce new `*ngIf`, `*ngFor`, or `*ngSwitch` usage unless explicitly required for compatibility.
- If touching an existing template area that still uses legacy structural directives, prefer migrating that local area to the modern built-in control flow syntax as part of the change, as long as the change stays safe and scoped.
- When rendering collections with `@for`, always provide an explicit `track` expression when there is a stable identifier.
- Keep template conditions readable; if the condition becomes too complex, move decision logic to the component class through computed/view-model helpers instead of nesting too much logic in HTML.
- Do not keep dead inline structural syntax or half-migrated template branches.
- Preserve the existing app structure and do not refactor unrelated templates just for style.

Notes:

- Modern Angular control flow is the preferred template syntax for this repo.
- Migrations should be incremental and scoped to the files touched by the task.
