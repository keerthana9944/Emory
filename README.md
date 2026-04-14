# Emory

Emory is a full-stack AI chat application with a React frontend and an Express/MongoDB backend that can use a hosted AI model API (recommended for deployment) or local Ollama.

## Tech Stack

- Frontend: React, Vite, React Router, Axios, Lucide icons, react-syntax-highlighter
- Backend: Node.js, Express, Mongoose, CORS, dotenv
- AI runtime: Hosted OpenAI-compatible API (deployment) or Ollama (local)
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
3. One of the following AI runtimes:
  - Hosted OpenAI-compatible API key (recommended for Render/Vercel)
  - Ollama running locally at `http://127.0.0.1:11434`

## Environment Variables

### Backend (`backend/.env`)

Create `backend/.env` with:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
MODEL=your_model_name

# Recommended for deployed backend (Render, etc.)
AI_API_KEY=your_hosted_ai_api_key
# Optional, defaults to OpenRouter OpenAI-compatible endpoint
AI_API_URL=https://openrouter.ai/api/v1/chat/completions

# Optional for local Ollama development (used when AI_API_KEY is not set)
OLLAMA_HOST=http://127.0.0.1:11434
```

Notes:

- If `AI_API_KEY` is set, backend uses hosted AI API.
- If `AI_API_KEY` is not set, backend falls back to Ollama.

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

1. `MODEL` is set correctly
2. For hosted mode: `AI_API_KEY` is set and valid
3. For Ollama mode: Ollama is running and backend can reach `OLLAMA_HOST`

## Scripts Summary

### backend/package.json

- `npm start` -> `node server.js`
- `npm run dev` -> `node server.js`

### frontend/package.json

- `npm run dev` -> start Vite dev server
- `npm run build` -> production build
- `npm run preview` -> preview built frontend
- `npm run lint` -> run ESLint
