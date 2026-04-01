# task-list

A full-stack task list webapp built for personal use and testing. It includes account-based authentication, private per-user task data, task filtering, priorities, categories, due dates, notes, and subtasks.

## Features

- Username/password authentication with server-side sessions
- Private task lists per user
- Create, edit, complete, and delete tasks
- Filter tasks by status and priority
- Sort tasks by created date, due date, or priority
- Categories for organizing tasks
- Subtasks for checklist-style task breakdown
- Clean desktop-oriented React interface

## Tech Stack

- Frontend: React, TypeScript, Vite, React Router, TanStack Query
- Backend: Node.js, Express, TypeScript
- Data store: local JSON file via `lowdb`
- Testing: Vitest, Testing Library, Supertest

## Project Structure

```text
client/   React frontend
server/   Express API and local data layer
```

## Requirements

- Node.js 23+
- npm 11+

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development servers:

```bash
npm run dev
```

App URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

## Demo Account

The server includes a seed script and a demo account:

- Username: `demo`
- Password: `password123`

To seed local data manually:

```bash
npm run seed --workspace server
```

## Available Scripts

From the repo root:

```bash
npm run dev
npm run lint
npm run test
npm run build
```

## Validation

The project has been validated with:

- workspace type-checking
- backend API tests
- frontend component tests
- production build for both server and client

## Notes

- Data is stored locally in `server/data/*.json` and ignored by git.
- The app is optimized for desktop layout first.
- The repository uses a single workspace with separate `client` and `server` packages.
