# Architecture Diagram

## System Architecture — TravelPlanner

```mermaid
graph TB
    subgraph Client["Client Layer"]
        FE["React SPA<br/>(Vite + Bootstrap)<br/>localhost:3000"]
    end

    subgraph SF["Microsoft Service Fabric Cluster"]
        direction TB

        subgraph AS["AuthService  —  Stateless"]
            AC["AuthController<br/>/api/auth/register<br/>/api/auth/login"]
            UC["UsersController<br/>/api/users  [Admin]"]
        end

        subgraph TPS["TravelPlanService  —  Stateful"]
            TPC["TravelPlansController"]
            DC["DestinationsController"]
            AcC["ActivitiesController"]
            CC["ChecklistController"]
            RD[("IReliableDictionary&lt;Guid,string&gt;<br/>activePlanCache")]
        end

        subgraph ES["ExpenseService  —  Stateless"]
            EC["ExpensesController<br/>/api/expenses<br/>/api/budget-summary"]
        end

        subgraph SS["SharingService  —  Stateless"]
            SC["SharingController<br/>/api/sharing<br/>/api/shared/:token"]
            QR["QRCoder<br/>(PNG → Base64)"]
        end
    end

    subgraph DB["SQL Server  —  Database: TravelApp"]
        AuthDB[("auth.Users")]
        PlanDB[("planning.TravelPlans<br/>planning.Destinations<br/>planning.Activities<br/>planning.ChecklistItems")]
        ExpDB[("expense.Expenses")]
        ShareDB[("sharing.ShareTokens")]
    end

    FE -->|"JWT Bearer / HTTPS"| AS
    FE -->|"JWT Bearer / HTTPS"| TPS
    FE -->|"JWT Bearer / HTTPS"| ES
    FE -->|"JWT Bearer / HTTPS"| SS

    AS --- AuthDB
    TPS --- PlanDB
    ES --- ExpDB
    SS --- ShareDB

    TPS -->|"DELETE by-plan (cascade)"| ES
    TPS -->|"DELETE by-plan (cascade)"| SS
    ES -->|"GET plan (ownership check)"| TPS
    SS -->|"GET plan (public view)"| TPS
    SS --> QR
```

## Component Breakdown

### AuthService (Stateless)
- Issues and validates JWT tokens (7-day expiry)
- Passwords hashed with BCrypt
- Admin-only user management endpoints

### TravelPlanService (Stateful)
- Owns all travel planning data
- Uses `IReliableDictionary` as an in-memory plan cache (Service Fabric Reliable Collections)
- On plan deletion, fires HTTP DELETE calls to ExpenseService and SharingService to cascade-delete related data
- Exposes a public `/public` endpoint used by the shared plan view (no auth required)

### ExpenseService (Stateless)
- Tracks expenses per travel plan with categories
- Computes budget summary (planned vs. spent, breakdown by category)
- Verifies plan ownership by calling TravelPlanService with the user's JWT

### SharingService (Stateless)
- Generates unique share tokens (64-char hex GUID)
- Produces QR codes (PNG, returned as Base64) pointing to the frontend share URL
- Supports VIEW and EDIT access types with optional expiry
- Reads plan data from TravelPlanService for the public share page

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FE as React SPA
    participant Auth as AuthService
    participant API as Any Microservice

    U->>FE: Enter credentials
    FE->>Auth: POST /api/auth/login
    Auth-->>FE: JWT token + user info
    FE->>FE: Store token in localStorage
    FE->>API: Request with Authorization: Bearer <token>
    API->>API: Validate JWT (shared secret key)
    API-->>FE: Protected resource
```

## Data Schema Relationships

```mermaid
erDiagram
    USERS {
        uniqueidentifier Id PK
        nvarchar FirstName
        nvarchar LastName
        nvarchar Email UK
        nvarchar PasswordHash
        nvarchar Role
        datetime2 CreatedAt
    }

    TRAVEL_PLANS {
        uniqueidentifier Id PK
        uniqueidentifier UserId
        nvarchar Name
        nvarchar Description
        date StartDate
        date EndDate
        decimal Budget
        nvarchar Notes
        datetime2 CreatedAt
    }

    DESTINATIONS {
        uniqueidentifier Id PK
        uniqueidentifier TravelPlanId FK
        nvarchar Name
        nvarchar Location
        date ArrivalDate
        date DepartureDate
    }

    ACTIVITIES {
        uniqueidentifier Id PK
        uniqueidentifier TravelPlanId FK
        uniqueidentifier DestinationId FK
        nvarchar Name
        date Date
        time Time
        nvarchar Status
    }

    CHECKLIST_ITEMS {
        uniqueidentifier Id PK
        uniqueidentifier TravelPlanId FK
        nvarchar Text
        bit IsCompleted
    }

    EXPENSES {
        uniqueidentifier Id PK
        uniqueidentifier TravelPlanId
        nvarchar Name
        nvarchar Category
        decimal Amount
        date Date
    }

    SHARE_TOKENS {
        uniqueidentifier Id PK
        uniqueidentifier TravelPlanId
        nvarchar Token UK
        nvarchar AccessType
        datetime2 ExpiresAt
        datetime2 CreatedAt
    }

    TRAVEL_PLANS ||--o{ DESTINATIONS : "has"
    TRAVEL_PLANS ||--o{ ACTIVITIES : "has"
    TRAVEL_PLANS ||--o{ CHECKLIST_ITEMS : "has"
    DESTINATIONS ||--o{ ACTIVITIES : "linked to"
```

> **Note:** `EXPENSES` and `SHARE_TOKENS` reference `TravelPlanId` logically but live in separate database schemas with no physical foreign key constraints. Cross-schema data integrity is enforced at the service layer via HTTP.
