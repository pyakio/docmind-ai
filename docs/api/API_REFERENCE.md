# DocMind AI — API Reference

Base URL: `http://localhost:8000/api/v1`  
Interactive OpenAPI Swagger Docs: `http://localhost:8000/docs`  
ReDoc Documentation: `http://localhost:8000/redoc`  

---

## 1. Authentication Endpoints (`/auth`)

### `POST /auth/register`
Create a new user account with bcrypt password hashing.

**Request:**
```json
{
  "full_name": "Dr. Sarah Chen",
  "email": "sarah.chen@docmind.ai",
  "password": "SecurePassword2026!",
  "phone_number": "+1234567890" // optional
}
```

**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "full_name": "Dr. Sarah Chen",
    "email": "sarah.chen@docmind.ai",
    "phone_number": "+1234567890"
  }
}
```

### `POST /auth/login`
Authenticate user with email and password.

### `GET /auth/me`
Retrieve currently authenticated user profile. Requires `Authorization: Bearer <token>`.

### `POST /auth/forgot-password`
Request password reset instructions.

### `POST /auth/google`
Authenticate or auto-register via Google OAuth account payload.

---

## 2. Document Endpoints (`/documents`)

### `POST /documents/upload`
Upload a document or image (`multipart/form-data`) and initiate background indexing.

### `GET /documents`
List all documents uploaded by the authenticated user.

### `GET /documents/status/{document_id}`
Poll ingestion status (`processing`, `ready`, or `failed`), chunk count, and auto-generated summary.

### `GET /documents/auto-summary/{document_id}`
Retrieve the executive summary generated for the document.

### `DELETE /documents/{document_id}`
Delete a document, its physical file from disk, and its ChromaDB vector collection.

---

## 3. Chat & Conversation Endpoints (`/chat`)

### `GET /chat/models`
List available LLM providers, model IDs, badges, and default selection.

### `GET /chat/threads`
List all conversation threads belonging to the authenticated user.

### `POST /chat/threads`
Create a new conversation thread.

### `PATCH /chat/threads/{thread_id}`
Rename a conversation thread.

### `DELETE /chat/threads/{thread_id}`
Delete a thread and all associated message history.

### `GET /chat/threads/{thread_id}/messages`
Retrieve message history for a specific thread.

### `POST /chat/stream`
Server-Sent Events (SSE) streaming endpoint for real-time document Q&A and general conversation.

**Request Payload:**
```json
{
  "thread_id": "thread_1710000000000_a1b2c3",
  "document_id": 1,
  "question": "What is the primary conclusion of the document?",
  "model_provider": "anthropic",
  "model_name": "claude-sonnet-5"
}
```

### `POST /chat/query`
Synchronous alternative to `/chat/stream` returning complete JSON response.

### `DELETE /chat/messages/{message_id}`
Permanently delete an individual message turn.

---

## 4. Health Endpoint (`/health`)

### `GET /health`
Verify system status, embedding models, vector database, and active LLM matrix.
