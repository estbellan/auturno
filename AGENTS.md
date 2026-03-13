# AUTURNO - Project Instructions

## Project Identity

AUTURNO is a mobile-first workshop operations platform for mechanical service businesses.

This is NOT just an appointment scheduler.

Correct framing:
- workshop operating system
- delivery promise engine
- diagnosis-to-operation workflow platform
- operational data capture layer from day one

Core goals:
- reduce friction
- reduce customer calls
- professionalize communication
- measure real operational times
- improve delivery promise accuracy
- separate diagnosis from repair
- build operational intelligence from historical data

---

## Scope Rules

Current model:
- closed B2B2C
- each workshop has its own workspace and customer-facing portal
- customers interact only with their workshop

Explicitly OUT of V1:
- marketplace
- public workshop search
- public ratings
- public reputation
- vehicle health score
- workshop comparison
- public reliability badges

Do not introduce out-of-scope features unless explicitly requested.

---

## Product Principles

### 1. Real capacity
Capacity is measured in work hours, not in number of cars.

Each mechanic may have:
- daily available hours
- efficiency factor
- optional specialties (future)

### 2. Healthy promise model
The system should not be too rigid or too vague.

Rules:
- promise the most probable outcome
- show a clear expected date or estimate
- allow rescheduling
- require a reason when rescheduling
- track whether customer was informed
- preserve full change history

### 3. Strict diagnosis / operation separation
Do not merge diagnosis and repair in data model or core workflow.

Phases may include:
- reception
- diagnosis
- quote
- approval
- operation
- ready
- pickup / close

### 4. Diagnosis as an asset
Diagnosis may not end in repair, but must still create value.

If repair is declined:
- findings stay stored
- recommendations stay stored
- unresolved issues remain available for follow-up
- customer may later see pending recommendations

Important:
- history must not bias technician judgement
- history is contextual only
- never auto-suggest conclusions as truth

### 5. Silent metrics from V1
Capture automatically:
- estimated times
- actual times
- phase timestamps
- promise changes
- delay reasons
- ready-to-pickup lag
- estimated vs actual variance

Do not overbuild dashboards at first.

---

## Core Workflows

### A. Direct Service
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
- closed / picked_up

### B. Diagnosis Flow
Examples:
- brake noise
- electrical issue
- vibration
- check engine
- undetermined issue

Phases:
- reception
- in_diagnosis
- quote_sent
- awaiting_approval
- in_operation
- ready
- closed / picked_up

Rules:
- promise diagnosis first, not final delivery
- approved quote -> move to operation
- rejected quote -> close without repair but preserve diagnosis

---

## V1 Functional Scope

### Appointments
- service catalog
- estimated duration
- requiresDiagnostic boolean
- workshop calendar
- capacity-based scheduling
- over-capacity warning/blocking

### Work Orders
- create from appointment or manually
- type: direct | diagnostic
- phase management
- automatic timestamps
- phase transitions
- closing

### Delivery Promise
- ETA calculated by system
- workshop may adjust expected date
- adjustment requires:
  - reason
  - customer informed flag
  - optional notification trigger
- preserve change history

### Diagnosis
Each diagnosis may contain:
- finding description
- severity: low | medium | high
- recommendation
- requiresImmediateRepair boolean
- repaired boolean
- optional followUpSuggestedAt

### Quotes
- itemized quote
- total
- status: draft | sent | approved | rejected
- approved quote moves work order to operation
- rejected quote may close work order without repair

### Customer Experience
Customer can:
- request appointment
- view work order / vehicle status
- view expected delivery
- approve or reject quote
- access service history
- see pending recommendations
- see basic loyalty points

### Loyalty
- simple points system
- points per completed order
- configurable rules
- no complex gamification

### Silent Metrics
Track:
- createdAt
- diagnosticStartAt
- diagnosticEndAt
- operationStartAt
- readyAt
- pickedUpAt
- estimatedDiagnosticHours
- estimatedOperationHours
- reschedules
- delay reasons
- clientNotified
- lag periods

---

## Security and Authorization

Security is a top priority.

Requirements:
- robust auth from day one
- workshop-based multi-tenancy
- strict roles and permissions
- auditability for critical actions

Roles:
- owner
- admin
- operator
- mechanic
- client

Base permissions:
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

Principles:
- Auth0 authenticates
- backend authorizes
- backend resolves roles and permissions from database
- every tenant-owned document must include workshopId
- no cross-tenant access
- critical actions must be auditable

Audit examples:
- ETA changes
- status transitions
- diagnosis changes
- quote changes
- customer informed flag changes

---

## Final Stack

Use this stack unless explicitly told otherwise:
- Frontend: Angular
- Format: mobile-first responsive web app
- Backend: NestJS
- Database: MongoDB Atlas
- Auth: Auth0 for SPA / web
- Architecture: API-first

Important:
- product does not change
- domain model does not change
- business rules do not change
- only the frontend delivery mechanism changed from native to web

---

## Architecture Rules

### Backend owns:
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

### Frontend owns:
- presentation
- forms
- navigation
- API consumption
- UI state

Do not put critical business rules in frontend code.

---

## Domain Model

Main entities:
- Workshop
- User
- Client
- Vehicle
- Mechanic
- Service
- Appointment
- WorkOrder
- Diagnostic
- Quote
- Notification
- LoyaltyPoints / CustomerPoints
- AuditEvent

Key fields:

### Workshop
- id
- name
- plan
- settings

### User
- authProvider
- authSubject
- email
- name
- workshopId
- roles[]
- permissions[]
- status

### Service
- name
- estimatedDurationHours
- requiresDiagnostic

### WorkOrder
- type: direct | diagnostic
- phase
- clientId
- vehicleId
- serviceId or services
- estimatedDiagnosticHours
- estimatedOperationHours
- promisedDiagnosticAt
- promisedDeliveryAt
- adjustedDeliveryDate
- deliveryChangeReason
- clientNotified
- createdAt
- diagnosticStartAt
- diagnosticEndAt
- operationStartAt
- readyAt
- pickedUpAt

### Diagnostic
- workOrderId
- findings
- severity
- recommendation
- requiresImmediateRepair
- repaired
- followUpSuggestedAt

### Quote
- workOrderId
- items
- total
- status: draft | sent | approved | rejected

### AuditEvent
- workshopId
- actorUserId
- action
- entityType
- entityId
- payloadDiff
- createdAt

---

## Expected Repository Structure

Use a clear separation between frontend and backend.

Preferred structure:
- apps/api
- apps/web

Angular structure:
- auth
- core
- shared
- client-portal
- workshop-portal

Workshop portal areas:
- agenda
- work-orders
- diagnostics
- quotes
- customers
- vehicles
- metrics

NestJS modules:
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

## Execution Rules

Always:
- prioritize V1 over future ideas
- preserve diagnosis vs operation separation
- preserve multi-tenancy and RBAC
- preserve backend-driven rules
- prefer the simplest implementation consistent with the architecture
- optimize for incremental delivery
- assume mobile-first UX
- do not redesign the product unless explicitly asked

Priority order:
1. security and tenancy
2. domain model correctness
3. workflow correctness
4. backend architecture
5. frontend structure
6. mobile-first UX
7. future extensibility

---

## Output Rules

When generating code:
- return complete files ready to copy/paste
- do not return partial diffs unless explicitly requested
- keep names consistent with this project brief

When generating architecture:
- return folder tree first
- then a concise explanation
- then implementation order

When generating backend design:
- include modules
- DTOs
- schemas/entities
- guards
- services
- permissions

When generating frontend design:
- include routes
- layouts
- feature modules
- component responsibilities
- mobile-first notes

When generating endpoints:
- include method
- route
- purpose
- request shape
- response shape
- required permissions
- tenancy rules