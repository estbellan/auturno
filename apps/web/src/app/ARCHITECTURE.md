# AUTURNO Web Starter Architecture (V1)

## 1. Angular Feature / Module Tree

```text
src/app
├── app.component.ts
├── app.routes.ts
├── auth
│   ├── auth.routes.ts
│   └── pages
│       └── login-page.component.ts
├── core
│   ├── api
│   │   └── api-client.service.ts
│   ├── guards
│   │   └── portal-access.guard.ts
│   ├── layouts
│   │   ├── public-layout
│   │   │   └── public-layout.component.ts
│   │   ├── client-layout
│   │   │   └── client-layout.component.ts
│   │   └── workshop-layout
│   │       └── workshop-layout.component.ts
│   └── state
│       └── session.store.ts
├── shared
│   ├── components
│   │   └── page-shell
│   │       └── page-shell.component.ts
│   ├── models
│   │   └── portal-nav-item.model.ts
│   └── ui
├── client-portal
│   ├── client-portal.routes.ts
│   └── pages
│       ├── appointment-request
│       ├── work-order-status
│       ├── quote-decision
│       ├── service-history
│       ├── pending-recommendations
│       └── loyalty-points
└── workshop-portal
    ├── workshop-portal.routes.ts
    └── pages
        ├── agenda
        ├── work-orders
        ├── diagnostics
        ├── quotes
        ├── customers
        ├── vehicles
        └── metrics
```

## 2. Route Structure

- `/auth/login`
- `/client/appointments/request`
- `/client/work-orders/status`
- `/client/quotes/review`
- `/client/history/services`
- `/client/recommendations/pending`
- `/client/loyalty/points`
- `/workshop/agenda`
- `/workshop/work-orders`
- `/workshop/diagnostics`
- `/workshop/quotes`
- `/workshop/customers`
- `/workshop/vehicles`
- `/workshop/metrics`

Routing principles:
- API-first integration points only.
- No workflow transitions computed in UI.
- No marketplace/public discovery routes.

## 3. Layout Structure

- `PublicLayoutComponent`
  - used by `auth` area
  - entry links to client/workshop shells
- `ClientLayoutComponent`
  - wraps customer portal routes
  - mobile-first nav chips for V1 capabilities
- `WorkshopLayoutComponent`
  - wraps operational workshop routes
  - metrics included as placeholder only

## 4. Starter Scope Notes

- All feature pages are standalone starter components wired to route shells.
- Page copy explicitly reinforces backend ownership of business rules, RBAC, tenancy, ETA, and state transitions.
- Structure is intentionally V1-scoped and excludes marketplace/public-reputation functionality.
