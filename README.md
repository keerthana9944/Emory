# Emory

Emory is a full-stack AI chat application with a React frontend and an Express/MongoDB backend that talks to a local Ollama model.

## Tech Stack

- Frontend: React, Vite, React Router, Axios, Lucide icons, react-syntax-highlighter
- Backend: Node.js, Express, Mongoose, CORS, dotenv
- AI runtime: Ollama (local)
- Database: MongoDB

## Project Structure

```
Emory/
  backend/
    config/
    controllers/
    middleware/
    models/
    routes/
    server.js
    package.json
  frontend/
    src/
    public/
    index.html
    package.json
```

## Features

- Separate landing, login, signup, and chat pages
- Protected chat flow (frontend session check)
- Conversation history with recent/history grouping
- Search in saved conversations
- Code snippet rendering with syntax highlighting and copy button
- Responsive sidebar behavior for desktop and mobile
- Persistent conversations stored in MongoDB

## Prerequisites

Install and run these before starting the app:

1. Node.js 18+ (recommended)
2. MongoDB (local or hosted)
3. Ollama running locally at `http://127.0.0.1:11434`
4. An Ollama model pulled locally (example: `llama3`)

## Environment Variables

### Backend (`backend/.env`)

Create `backend/.env` with:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
MODEL=your_model_name
OLLAMA_HOST=http://127.0.0.1:11434
```

### Frontend (`frontend/.env`, optional)

Only needed if you want to override the default API URL:

```env
VITE_API_BASE_URL=http://localhost:5000/api/chat
```

If omitted, frontend already defaults to `http://localhost:5000/api/chat`.

## Install Dependencies

From the project root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Run the Project (Development)

Use two terminals.

### Terminal 1: Backend

```bash
cd backend
npm start
```

Expected logs include:

- `Server running on port 5000`
- `MongoDB connected`

### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

Vite will print a local URL (usually `http://localhost:5173`).

## Build

### Frontend build

```bash
cd frontend
npm run build
```

### Backend

The backend has no separate build step (it runs directly with Node). Use:

```bash
cd backend
npm start
```

## API Endpoints

Base URL: `http://localhost:5000/api/chat`

- `POST /` - Send a message and get model reply
- `GET /` - List all conversations
- `GET /:id` - Get one conversation by id

### POST / request body

```json
{
  "message": "Hello",
  "conversationId": "optional_existing_conversation_id"
}
```

### POST / response

```json
{
  "conversationId": "...",
  "reply": "..."
}
```

## Important Notes

- Login/signup currently uses localStorage on frontend (not backend auth/JWT).
- The backend requires a valid `MODEL` in `.env` and a running Ollama service.
- Conversation documents store message arrays with `user` and `assistant` roles.

## Troubleshooting

### PowerShell says script execution is disabled for npm

Use:

```powershell
npm.cmd install
npm.cmd run build
npm.cmd start
```

Or set policy once for your user:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### `npm run build` fails at project root

This repo has separate apps. Run build inside `frontend`:

```bash
cd frontend
npm run build
```

### Backend starts but no AI response

Check:

1. Ollama is running
2. Model from `MODEL` env var is installed locally
3. Backend can reach `OLLAMA_HOST`

## Scripts Summary

### backend/package.json

- `npm start` -> `node server.js`
- `npm run dev` -> `node server.js`

### frontend/package.json

- `npm run dev` -> start Vite dev server
- `npm run build` -> production build
- `npm run preview` -> preview built frontend
- `npm run lint` -> run ESLint
