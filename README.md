# Weekly Report Generator & Team Dashboard

A full-stack web app where team members submit structured weekly reports and managers view consolidated dashboards with AI-powered insights.

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18 + TypeScript + Vite      |
| Backend  | NestJS + TypeScript               |
| Database | PostgreSQL                        |
| AI       | Google Gemini 1.5 Flash (free)    |
| Styling  | Tailwind CSS                      |
| Charts   | Recharts                          |

## Project Structure

```
weekly-report-app/
├── backend/     # NestJS REST API
├── frontend/    # React + TypeScript UI
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 16+
- A free Google Gemini API key from https://aistudio.google.com

### 1. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment variables

```bash
# In /backend, copy the example env file and fill in your values
cp .env.example .env
```

Required variables in `backend/.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=yourpassword
DB_NAME=weekly_reports
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_free_gemini_key_here
```

### 3. Set up the database

```bash
# Create the PostgreSQL database
psql -U postgres -c "CREATE DATABASE weekly_reports;"
```

### 4. Run the backend

```bash
cd backend
npm run start:dev
# API available at http://localhost:3000
```

### 5. Run the frontend

```bash
cd frontend
npm run dev
# App available at http://localhost:5173
```

## User Roles

- **Team Member** — create and manage their own weekly reports
- **Manager** — view all team reports, access dashboard, use AI assistant

## Key Features

- JWT-based authentication with role-based access control
- Fixed weekly report structure (consistent across all team members)
- Manager dashboard with charts and metrics
- AI chat assistant powered by Google Gemini (free tier)
- Project/category management
- Submission status tracking (Draft / Submitted / Late)
