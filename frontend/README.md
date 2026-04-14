# Emory Frontend

This app is the client for your Emory AI assistant project.

It is fully connected to backend routes:

- `POST /api/chat` to send user messages and receive model replies.
- `GET /api/chat` to fetch all saved conversations.
- `GET /api/chat/:id` to open a selected conversation.

## Features

- Functional landing page tied to the real project flow.
- Chat UI with loading and error states.
- Conversation history sidebar.
- Resume/continue any previous conversation.
- Responsive layout for desktop and mobile.

## Environment

Create a `.env` file in `frontend` if you want a custom API base URL.

```env
VITE_API_BASE_URL=https://emory-1nu0.onrender.com/api/chat
```

If `.env` is not provided, the app defaults to `https://emory-1nu0.onrender.com/api/chat`.

## Run

1. Start backend first from `backend` folder.
2. Start frontend from `frontend` folder.

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
