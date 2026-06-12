# TravelPlanner — Setup & Testing Guide

## 1. Prerequisites — Install before anything else

### 1.1 .NET 8 Runtime
Required to run the backend services.
- Download: https://dotnet.microsoft.com/download/dotnet/8.0
- Install the **.NET 8 Runtime** (or SDK)
- Verify: open PowerShell and run `dotnet --list-runtimes` — you should see `Microsoft.NETCore.App 8.x.x`

### 1.2 Visual Studio 2022
Required to open and run the backend solution.
- Download: https://visualstudio.microsoft.com/
- During installation, select the workload: **ASP.NET and web development**
- Edition: Community (free) is sufficient

### 1.3 Node.js
Required to run the React frontend.
- Download: https://nodejs.org/ — install the **LTS** version (20 or newer)
- Verify: `node --version` and `npm --version`

### 1.4 SQL Server
Required for the database.
- Download: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
- Install **SQL Server 2022 Developer** edition (free)
- During setup, choose **Default instance** (MSSQLSERVER)
- Verify: the Windows service `SQL Server (MSSQLSERVER)` should be running

### 1.5 SQL Server Management Studio (SSMS)
Required to run SQL migration scripts and manage the database.
- Download: https://aka.ms/ssmsfullsetup
- Install SSMS (version 20 or newer)

### 1.6 Git
Required to clone the repository.
- Download: https://git-scm.com/
- Verify: `git --version`

### 1.7 (Optional) Mermaid diagram viewer
Required only to view architecture and use case diagrams.
- In VS Code: install extension **Markdown Preview Mermaid Support**
  - Open VS Code → `Ctrl+Shift+X` → search "Markdown Preview Mermaid Support" → Install
  - Open a diagram file → press `Ctrl+Shift+V`
- Or online (no install): open https://mermaid.live and paste the diagram code

---

## 2. Clone the Repository

```bash
git clone <repository-url>
cd "WEB 2 Projekat"
```

---

## 3. Database Setup

### 3.1 Start SQL Server
Open PowerShell as Administrator and verify SQL Server is running:
```powershell
Get-Service -Name "MSSQLSERVER"
```
If the status is `Stopped`, start it:
```powershell
Start-Service MSSQLSERVER
```

### 3.2 Open SSMS
1. Open **SQL Server Management Studio** from the Start menu
2. In the connection dialog:
   - **Server name:** `localhost`
   - **Authentication:** `Windows Authentication`
3. Click **Connect**

### 3.3 Create the database
1. Click **New Query** (top left toolbar)
2. Paste the following and press **F5**:
```sql
CREATE DATABASE TravelApp;
```
3. You should see: `Commands completed successfully.`

### 3.4 Run migration scripts
The migrations must be run **in this exact order**. Each one creates tables for one service.

**How to run each script:**
1. In SSMS, go to **File → Open → File**
2. Navigate to `backend\Database\Migrations\`
3. Select the file
4. In the toolbar dropdown, change the database from `master` to **TravelApp**
5. Press **F5** to execute
6. Verify: `Commands completed successfully.`

**Run in this order:**

| Order | File | What it creates |
|---|---|---|
| 1 | `001_CreateAuthSchema.sql` | `auth.Users` table |
| 2 | `002_CreatePlanningSchema.sql` | `planning.TravelPlans`, `Destinations`, `Activities`, `ChecklistItems` |
| 3 | `003_CreateExpenseSchema.sql` | `expense.Expenses` table |
| 4 | `004_CreateSharingSchema.sql` | `sharing.ShareTokens` table |

**Verify all tables were created:**
In SSMS Object Explorer, expand:
```
localhost → Databases → TravelApp → Tables
```
You should see 7 tables: `auth.Users`, `expense.Expenses`, `planning.Activities`, `planning.ChecklistItems`, `planning.Destinations`, `planning.TravelPlans`, `sharing.ShareTokens`

---

## 4. Configure the Backend

Open each `appsettings.json` file and verify the connection string matches your SQL Server instance.

**If you installed SQL Server as a default instance (MSSQLSERVER):**
```json
"DefaultConnection": "Server=localhost;Database=TravelApp;Trusted_Connection=True;TrustServerCertificate=True;"
```

**If you installed SQL Server as a named instance (e.g. SQLEXPRESS):**
```json
"DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=TravelApp;Trusted_Connection=True;TrustServerCertificate=True;"
```

Files to check:
- `backend\AuthService\appsettings.json`
- `backend\TravelPlanService\appsettings.json`
- `backend\ExpenseService\appsettings.json`
- `backend\SharingService\appsettings.json`

---

## 5. Run the Backend (Visual Studio)

> **Important:** Visual Studio must be opened as Administrator, otherwise the services may not be able to bind to their ports.

### How to open Visual Studio as Administrator:
1. Find **Visual Studio 2022** in the Start menu
2. Right-click → **Run as administrator**
3. Click **Yes** on the UAC prompt

### Open the solution:
1. In Visual Studio: **File → Open → Project/Solution**
2. Navigate to `backend\` and open `TravelApp.sln`

### Configure multiple startup projects:
1. In Solution Explorer, right-click the **Solution** (top item) → **Properties**
2. Go to **Common Properties → Startup Project**
3. Select **Multiple startup projects**
4. Set the **Action** to **Start** for all four projects:
   - `AuthService`
   - `TravelPlanService`
   - `ExpenseService`
   - `SharingService`
5. Click **OK**

### Start the services:
Press **F5** or click the green **Start** button.

Four console windows will open. Each service should print:
```
Now listening on: http://localhost:500x
Application started. Press Ctrl+C to shut down.
```

| Service | Port |
|---|---|
| AuthService | http://localhost:5001 |
| TravelPlanService | http://localhost:5002 |
| ExpenseService | http://localhost:5003 |
| SharingService | http://localhost:5004 |

### Verify services are running:
Open a browser and visit each URL — you should get a JSON error response (401 or 405), **not** `ERR_CONNECTION_REFUSED`:
- http://localhost:5001/api/auth/login
- http://localhost:5002/api/travel-plans
- http://localhost:5003/api/travel-plans/00000000-0000-0000-0000-000000000000/expenses
- http://localhost:5004/api/travel-plans/00000000-0000-0000-0000-000000000000/share

---

## 6. Run the Frontend

Open a terminal (PowerShell or the terminal inside Visual Studio: **View → Terminal**):

```powershell
cd frontend
npm install
npm run dev
```

Vite will print:
```
VITE ready in xxx ms
➜  Local: http://localhost:5173/
```

Open http://localhost:5173 in your browser.

---

## 7. Testing the Application

### 7.1 Register and login
1. Open http://localhost:5173
2. Click **Register** and create an account
3. After registration you will be redirected to the Dashboard

### 7.2 Create a travel plan
1. Click **+ New Plan**
2. Fill in: name, description, start/end dates, budget
3. Click **Save** — the plan card appears on the Dashboard

### 7.3 Test all features
Click on the plan card to open it. Test each tab:

| Tab | What to test |
|---|---|
| **Destinations** | Add a destination, edit it, delete it |
| **Activities** | Add an activity, switch to Calendar view |
| **Expenses** | Add an expense, check Budget Summary updates |
| **Checklist** | Add items, check/uncheck them |
| **Sharing** | Generate a share link, copy and open in incognito window |

### 7.4 Test the shared plan view
1. Go to the **Sharing** tab and click **+ Create Share Link**
2. Copy the generated URL
3. Open a new **incognito/private browser window** (`Ctrl+Shift+N`)
4. Paste the URL — the plan should be visible without logging in

### 7.5 Test the Admin panel
First, create an admin account:
1. Register a new user (e.g. `admin@travelapp.com`)
2. Open SSMS and run:
```sql
USE TravelApp;
UPDATE auth.Users SET Role = 'Admin' WHERE Email = 'admin@travelapp.com';
```
3. Log out of the application
4. Log in with the admin account
5. The **Admin** link appears in the navbar
6. Admin panel shows: all registered users (with delete option) and all travel plans from all users (with delete option)

---

## 8. Viewing the Diagrams

The diagrams are written in **Mermaid** format inside Markdown files located in the `docs/` folder.

### Option A — VS Code (recommended)
1. Open VS Code
2. Press `Ctrl+Shift+X` to open Extensions
3. Search for: `Markdown Preview Mermaid Support`
4. Click **Install**
5. Open `docs/architecture-diagram.md` or `docs/usecase-diagram.md`
6. Press `Ctrl+Shift+V` to open the preview
7. The diagrams will render as visual graphs

### Option B — Online (no install required)
1. Open `docs/architecture-diagram.md` in any text editor
2. Copy the content between the ` ```mermaid ` and ` ``` ` markers
3. Go to https://mermaid.live
4. Paste the code in the left panel
5. The diagram renders on the right
6. Use scroll to zoom, click+drag to pan
7. Click **Export → PNG** to save as an image

---

## 9. Common Issues

| Problem | Cause | Solution |
|---|---|---|
| `ERR_CONNECTION_REFUSED` on ports 5001-5004 | Services not running | Check Visual Studio, press F5 |
| `Registration failed` | CORS mismatch or service not running | Make sure all 4 services are started |
| `Login failed for user` in VS output | Wrong connection string | Check `appsettings.json`, verify SQL Server instance name |
| Destination not showing in Activities dropdown | Page not refreshed | Switch away from Activities tab and back |
| Services show wrong port in VS | launchSettings.json not saved | Stop and restart from Visual Studio |
| `npm install` fails | Old Node.js version | Update to Node.js 20 LTS |
| Diagrams not rendering in VS Code | Extension not installed | Install `Markdown Preview Mermaid Support` |
