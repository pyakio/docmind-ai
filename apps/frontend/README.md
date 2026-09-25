# DocMind AI — Frontend Application

Modern React 19 single-page application built with Vite 8, Tailwind CSS, Framer Motion, and Axios.

---

## 🏗️ Architecture

```
src/
├── app/                  # Application root & providers
│   └── App.jsx
├── assets/               # Static assets & graphics
├── components/           # Shared UI components
│   ├── common/           # Navbar, Footer, Hero, Features, ChatPreview, ProtectedRoute, ErrorBoundary
│   ├── layout/           # App layout wrappers
│   └── ui/               # Reusable primitive UI elements
├── features/             # Feature-oriented domain modules
│   ├── auth/             # Authentication components, context, and services
│   ├── chat/             # Chat sidebar, message list, composer, and SSE streaming service
│   └── documents/        # Document upload and management services
├── pages/                # Route view components
│   ├── Landing/          # Marketing homepage
│   ├── Login/            # User authentication
│   ├── Register/         # User registration
│   ├── ForgotPassword/   # Password reset request
│   ├── Chat/             # Conversational RAG workspace
│   ├── Upload/           # Document ingestion workspace
│   └── NotFound/         # 404 handler
├── routes/               # Declarative React Router definitions
│   └── AppRoutes.jsx
├── services/             # Core HTTP client with JWT interceptors
│   └── api.js
├── index.css             # Tailwind base styles & design tokens
└── main.jsx              # React DOM bootstrap
```

---

## 🚀 Development Setup

```bash
# From apps/frontend directory
npm install
npm run dev

# Or from root directory
npm run dev
```

Build for production:
```bash
npm run build
```

Linting:
```bash
npm run lint
```
