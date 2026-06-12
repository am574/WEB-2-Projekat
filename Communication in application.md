# Service Communication — TravelPlanner

## Overview

The application consists of four backend microservices and one React frontend. The frontend communicates directly with all four services over HTTP. Some services also communicate with each other over HTTP for specific operations. No service shares a database table with another — each service has its own schema.

---

## Frontend → AuthService (port 5001)

The frontend calls AuthService only for registration, login, and admin user management.

On **registration**, the frontend sends the user's name, email, and password. AuthService hashes the password using BCrypt and saves the user to the `auth.Users` table. It then generates a JWT token and returns it along with the user object.

On **login**, the frontend sends the email and password. AuthService verifies the password hash, generates a JWT token, and returns it. The frontend stores the token in `localStorage` and attaches it to every subsequent API call as an `Authorization: Bearer` header.

The JWT token contains the following data embedded inside it: the user's ID (GUID), email, role (User or Admin), first name, and last name. It expires after 7 days.

Admin users can also call AuthService to list all registered users (`GET /api/users`) and delete a user account (`DELETE /api/users/{id}`).

---

## Frontend → TravelPlanService (port 5002)

TravelPlanService is the central service. It manages all travel planning data: plans, destinations, activities, and checklist items.

Every request to TravelPlanService requires a valid JWT. The service reads the user's ID from the token and uses it to filter data — a user can only see and modify their own plans. If a request targets a plan that belongs to a different user, the service returns 404 (not 403) to avoid revealing that the plan exists.

The frontend calls TravelPlanService for the following operations:

- Creating, reading, updating, and deleting travel plans
- Adding, editing, and removing destinations within a plan
- Adding, editing, and removing activities (linked to a destination)
- Adding, editing, toggling, and removing checklist items

There is also a special public endpoint (`GET /api/travel-plans/{id}/public`) that requires no authentication. This endpoint is used when an anonymous visitor opens a shared plan link.

Admin users have two additional endpoints: listing all plans from all users (`GET /api/travel-plans/admin/all`) and deleting any plan regardless of ownership (`DELETE /api/travel-plans/admin/{id}`).

---

## Frontend → ExpenseService (port 5003)

ExpenseService manages expenses for travel plans. It stores expenses in its own `expense.Expenses` table, where each row has a `TravelPlanId` but no information about the user.

Because ExpenseService does not know which plans belong to which user, it must verify ownership on every request by calling TravelPlanService. Before processing any expense operation, it sends a `GET /api/travel-plans/{planId}` request to TravelPlanService, forwarding the same JWT token the user originally sent. If TravelPlanService returns 200, the plan belongs to the user and the operation proceeds. If it returns 404, ExpenseService rejects the request.

The frontend calls ExpenseService for:

- Listing all expenses for a plan
- Adding, editing, and deleting individual expenses
- Fetching the budget summary

The **budget summary** involves two data sources. ExpenseService calculates the total spent and the breakdown by category from its own database. It then calls TravelPlanService to get the plan's budget field (the planned budget set by the user). It combines both into a single response: planned budget, total spent, remaining amount, and a per-category breakdown.

---

## Frontend → SharingService (port 5004)

SharingService manages share tokens that allow plans to be viewed without logging in.

When the user creates a share token, the frontend sends the access type (VIEW or EDIT) and an optional expiry date. SharingService verifies plan ownership by calling TravelPlanService (same forwarded JWT pattern as ExpenseService). If ownership is confirmed, it generates a 64-character random token, saves it to `sharing.ShareTokens`, and builds the share URL pointing to the frontend (`http://localhost:5173/shared/{token}`). It then generates a QR code image (PNG) pointing to that URL using the QRCoder library, converts it to a Base64 string, and returns it to the frontend along with the token. The frontend displays the QR code as an image.

The user can also list all existing share tokens for a plan and revoke (delete) individual tokens.

When an **anonymous visitor** opens a shared link, the browser calls `GET /api/shared/{token}` on SharingService — no JWT is required. SharingService looks up the token, checks whether it has expired, and if valid, calls TravelPlanService at the public endpoint (`GET /api/travel-plans/{planId}/public`) without any authentication header. TravelPlanService returns the full plan data, and SharingService forwards it to the anonymous user together with the access type.

---

## TravelPlanService → ExpenseService and SharingService (cascade delete)

When a travel plan is deleted — either by its owner or by an admin — the related expenses and share tokens in the other two services must also be deleted. TravelPlanService handles this by sending HTTP DELETE requests to both services after removing the plan from its own database.

These calls are fire-and-forget: TravelPlanService does not wait for a response before returning 204 to the frontend. The cleanup endpoints (`DELETE /api/expenses/by-plan/{planId}` and `DELETE /api/sharing/by-plan/{planId}`) are marked as anonymous so they can be called without a token.

---

## How JWT validation works across all services

AuthService issues the JWT, but it does not participate in validating it on subsequent requests. Every service (TravelPlanService, ExpenseService, SharingService) validates incoming tokens independently using the same secret key configured in each service's `appsettings.json` under `Jwt:Key`. The key is identical in all four services.

This means after login, the user never contacts AuthService again for normal operations. Each service can read the user's ID and role directly from the token without making any network call.

---

## Database isolation

Each service only ever reads and writes its own tables. There are no SQL joins across schemas. The logical relationship between, for example, an expense and a travel plan is maintained purely at the application level through HTTP calls, not through database foreign keys. If a plan is deleted and the cascade HTTP calls fail (e.g. because a service is temporarily down), orphaned rows may remain in the expense or sharing tables — this is an accepted trade-off of the microservice design.

| Service | Schema | Tables |
|---|---|---|
| AuthService | auth | Users |
| TravelPlanService | planning | TravelPlans, Destinations, Activities, ChecklistItems |
| ExpenseService | expense | Expenses |
| SharingService | sharing | ShareTokens |
