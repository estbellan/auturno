# AUTURNO

AUTURNO is a mobile-first workshop operations platform for mechanical service businesses.

It is designed to connect:
- appointments
- diagnostics
- quotes
- operations / repairs
- delivery promises
- customer communication
- real workshop capacity

This repository uses:
- Angular for the web frontend
- NestJS for the backend API
- MongoDB Atlas as database
- Auth0 for authentication
- backend-driven RBAC and workshop-based multi-tenancy

## Product Scope

Current scope is a closed B2B2C model:
- each workshop has its own workspace
- customers interact with their own workshop only

Out of V1:
- marketplace
- public workshop search
- public reputation
- vehicle health score
- workshop comparisons

## Core Product Principles

- capacity is measured in hours, not car count
- diagnosis and operation are separate workflows
- delivery promises must be realistic and traceable
- diagnosis remains valuable even if no repair is approved
- metrics are captured silently from day one

## Repository Structure

```text
apps/
  api/   # NestJS backend
  web/   # Angular frontend
```
## Architecture Principles

* API-first architecture
* backend owns business rules
* frontend owns presentation and interaction
* every tenant-owned record must be scoped by workshopId
* no cross-tenant access
* roles and permissions are resolved server-side

## Initial Functional Scope

V1 includes:
* appointment scheduling
* service catalog
* work orders
* diagnosis flow
* quotes and approvals
* customer status tracking
* delivery promise management
* loyalty basics
* audit trail for critical actions

## Development Priorities

1. security and tenancy
2. domain model correctness
3. workflow correctness
4. backend architecture
5. frontend structure
6. mobile-first UX

## Notes for Contributors

Before making product or architecture decisions, read `AGENTS.md`.
`AGENTS.md` is the source of truth for:
* product rules
* V1 scope boundaries
* architecture rules
* output expectations