# TravelPlanner — Full-Stack Travel Planning Application

A full-stack web application for planning trips, managing destinations, activities, expenses, and sharing travel plans via QR codes. Built with React (frontend) and Microsoft Service Fabric microservices (backend).

---

## Architecture Overview

The application consists of a React SPA communicating with four independently deployed ASP.NET Core microservices hosted on Microsoft Service Fabric. All services share a single SQL Server instance using separate schemas to maintain logical isolation.

| Service | Type | Port | Schema |
|---|---|---|---|
| AuthService | Stateless | 5001 | `auth` |
| TravelPlanService | **Stateful** | 5002 | `planning` |
| ExpenseService | Stateless | 5003 | `expense` |
| SharingService | Stateless | 5004 | `sharing` |

See [docs/architecture-diagram.md](docs/architecture-diagram.md) and [docs/usecase-diagram.md](docs/usecase-diagram.md) for visual diagrams.

---

## Tech Stack

**Frontend**
- React 19 + Vite
- React Router DOM v7
- Axios
- Bootstrap 5
- Context API (AuthContext, TravelPlanContext)

**Backend**
- .NET 8 / ASP.NET Core Web API
- Microsoft Service Fabric SDK
- Entity Framework Core 8 (SQL Server)
- JWT Bearer Authentication (`Microsoft.AspNetCore.Authentication.JwtBearer`)
- BCrypt.Net-Next (password hashing)
- QRCoder (QR code generation)

**Infrastructure**
- Microsoft Service Fabric (local cluster or Azure)
- SQL Server 2019+

---

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/)
- [SQL Server](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) (Express or Developer edition)
- [Microsoft Service Fabric SDK](https://learn.microsoft.com/en-us/azure/service-fabric/service-fabric-get-started) (for local cluster deployment)

---

## Database Setup

Connect to your SQL Server instance and run the migration scripts in order:

```sql
-- 1. Create auth schema and Users table
-- File: backend/Database/Migrations/001_CreateAuthSchema.sql

-- 2. Create planning schema (TravelPlans, Destinations, Activities, ChecklistItems)
-- File: backend/Database/Migrations/002_CreatePlanningSchema.sql

-- 3. Create expense schema
-- File: backend/Database/Migrations/003_CreateExpenseSchema.sql

-- 4. Create sharing schema
-- File: backend/Database/Migrations/004_CreateSharingSchema.sql
```

Run all four scripts against a database named `TravelApp`:

```bash
sqlcmd -S localhost -d TravelApp -i backend/Database/Migrations/001_CreateAuthSchema.sql
sqlcmd -S localhost -d TravelApp -i backend/Database/Migrations/002_CreatePlanningSchema.sql
sqlcmd -S localhost -d TravelApp -i backend/Database/Migrations/003_CreateExpenseSchema.sql
sqlcmd -S localhost -d TravelApp -i backend/Database/Migrations/004_CreateSharingSchema.sql
```

---

## Configuration

Each service has its own `appsettings.json`. Update the connection string and JWT key before deployment.

**Connection string** (all four services):
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=TravelApp;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

**JWT settings** (AuthService only — other services read the same key for token validation):
```json
"Jwt": {
  "Key": "TravelAppSuperSecretKey_ChangeInProduction_2024!",
  "Issuer": "TravelApp",
  "Audience": "TravelAppClient"
}
```

**Cross-service URLs** (update if ports differ):

`TravelPlanService/appsettings.json`:
```json
"ExpenseServiceUrl": "http://localhost:5003",
"SharingServiceUrl": "http://localhost:5004"
```

`ExpenseService/appsettings.json`:
```json
"TravelPlanServiceUrl": "http://localhost:5002"
```

`SharingService/appsettings.json`:
```json
"TravelPlanServiceUrl": "http://localhost:5002",
"FrontendUrl": "http://localhost:3000"
```

---

## Running the Application

### Option A — Standalone mode (development, no Service Fabric)

Each service can be run directly as a standard ASP.NET Core app:

```bash
# Terminal 1
cd backend/AuthService
dotnet run --urls "http://localhost:5001"

# Terminal 2
cd backend/TravelPlanService
dotnet run --urls "http://localhost:5002"

# Terminal 3
cd backend/ExpenseService
dotnet run --urls "http://localhost:5003"

# Terminal 4
cd backend/SharingService
dotnet run --urls "http://localhost:5004"
```

### Option B — Service Fabric local cluster

1. Start the local Service Fabric cluster (Service Fabric Local Cluster Manager in the system tray)
2. Open the solution in Visual Studio
3. Right-click the Service Fabric Application project → **Deploy**
4. The cluster manager at `http://localhost:19080` shows all deployed services

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000` (or whichever port Vite assigns).

---

## User Roles

| Role | Permissions |
|---|---|
| **User** | Full CRUD on own travel plans, destinations, activities, expenses, checklist; generate and manage share links |
| **Admin** | All User permissions + view all registered users + delete any user account |

The first registered user with `"role": "Admin"` in the database must be set manually via SQL (all self-registrations default to `User`).

---

## API Endpoints

### AuthService (`http://localhost:5001`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/users` | Admin | List all users |
| DELETE | `/api/users/{id}` | Admin | Delete a user |

### TravelPlanService (`http://localhost:5002`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/travel-plans` | User | List own plans |
| POST | `/api/travel-plans` | User | Create plan |
| GET | `/api/travel-plans/{id}` | User | Get plan by ID |
| PUT | `/api/travel-plans/{id}` | User | Update plan |
| DELETE | `/api/travel-plans/{id}` | User | Delete plan (cascades) |
| GET | `/api/travel-plans/{id}/public` | — | Public plan view (for sharing) |
| GET/POST | `/api/travel-plans/{id}/destinations` | User | List / create destinations |
| PUT/DELETE | `/api/destinations/{id}` | User | Update / delete destination |
| GET/POST | `/api/travel-plans/{id}/activities` | User | List / create activities |
| PUT/DELETE | `/api/activities/{id}` | User | Update / delete activity |
| GET/POST | `/api/travel-plans/{id}/checklist` | User | List / create checklist items |
| PUT/PATCH/DELETE | `/api/checklist/{id}` | User | Update / toggle / delete item |

### ExpenseService (`http://localhost:5003`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/travel-plans/{id}/expenses` | User | List expenses |
| POST | `/api/travel-plans/{id}/expenses` | User | Create expense |
| GET | `/api/travel-plans/{id}/budget-summary` | User | Budget vs spent summary |
| PUT/DELETE | `/api/expenses/{id}` | User | Update / delete expense |
| DELETE | `/api/expenses/by-plan/{planId}` | — | Cascade delete (internal) |

### SharingService (`http://localhost:5004`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/travel-plans/{id}/share` | User | List share tokens for plan |
| POST | `/api/travel-plans/{id}/share` | User | Generate share link + QR code |
| GET | `/api/shared/{token}` | — | Get plan via share token |
| DELETE | `/api/sharing/{id}` | User | Revoke share token |
| DELETE | `/api/sharing/by-plan/{planId}` | — | Cascade delete (internal) |

---

## Project Structure

```
WEB 2 Projekat/
├── backend/
│   ├── AuthService/
│   ├── TravelPlanService/
│   ├── ExpenseService/
│   ├── SharingService/
│   └── Database/
│       └── Migrations/
│           ├── 001_CreateAuthSchema.sql
│           ├── 002_CreatePlanningSchema.sql
│           ├── 003_CreateExpenseSchema.sql
│           └── 004_CreateSharingSchema.sql
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── models/
│       ├── pages/
│       └── services/
└── docs/
    ├── architecture-diagram.md
    └── usecase-diagram.md
```

---

## License

University project — Faculty of Technical Sciences, Novi Sad.
