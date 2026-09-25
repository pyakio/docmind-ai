# DocMind AI — Code Quality & Architecture Audit

**Author:** Senior Software Architect & Staff-Level Reviewer  
**Date:** 2026-09-25  
**Scope:** `apps/backend/` and `apps/frontend/`  
**Baseline Test Status:** Smoke (Passed), Flow Test (Passed), RAG Quality (Passed), Frontend Build (Passed), Frontend Lint (2 Warnings, 0 Errors)

---

## Executive Summary

DocMind AI has an established, clean high-level architecture with clear separation between API routes, database models, RAG pipelines (parsing, chunking, embeddings, vectorstore, retrieval, generation), background workers, and a modern React frontend. 

However, a granular audit of the codebase reveals several critical and high-priority code quality issues:
1. **Security Vulnerabilities:** Path traversal vulnerability in document file storage; predictable fallback password generation for Google OAuth users; missing file upload size limits; deprecated datetime functions.
2. **Resource Management:** Missing file descriptor closure in image OCR processing; missing lock release on SSE readable streams; uncleaned `setInterval` timers in React components upon unmount.
3. **Database Performance & N+1 Queries:** Missing database indexes on foreign keys (`user_id`, `thread_id`, `document_id`) causing full table scans; N+1 query pattern in conversation thread listing (`len(t.messages)` inside loop).
4. **Data Integrity & ChromaDB Bug:** Mismatched lengths between `chunks` and `texts` in vector store ingestion when blank chunks occur, which will cause ChromaDB `add()` to throw runtime `ValueError`.
5. **Code Duplication & Abstraction Hygiene:** Repeated chat query resolution and conversation history formatting in both streaming and sync endpoints; repeated token response generation in auth routes; redundant chunk deduplication across retriever and RAG engine.
6. **Dead Code & Unused Elements:** Unused imports across 11 files; dead stub methods in query analyzer; unused parameters and variables in ingestion workers; unused route and unstyled 404 page.
7. **Frontend Lint & React Warnings:** Co-located context export in `AuthContext.jsx` breaking Vite Fast Refresh; missing hook dependencies in `Chat.jsx`; direct DOM queries (`getElementById`) instead of `useRef`.

Below is the complete catalog of findings across all 30 audit criteria.

---

## Catalog of Audit Findings

### 1. Security Risks

#### Finding SEC-01: Path Traversal Vulnerability in Uploaded Document Filename
- **FILE:** `apps/backend/app/api/v1/documents.py`
- **LINE / FUNCTION:** Line 46-47 (`upload_document`)
- **PROBLEM:** The uploaded filename is directly concatenated into the server storage path: `safe_filename = f"{int(time.time())}_{file.filename}"` and `file_path = os.path.join(user_upload_dir, safe_filename)`. If `file.filename` contains directory traversal sequences like `../../etc/passwd` or null bytes, the file could be written outside the intended user directory.
- **WHY IT MATTERS:** Path traversal is a serious security vulnerability allowing arbitrary file writes on the host file system.
- **RECOMMENDED FIX:** Sanitize `file.filename` using `os.path.basename` and regex stripping (or `pathlib.Path(file.filename).name`), stripping non-alphanumeric/dot characters.
- **SEVERITY:** CRITICAL

#### Finding SEC-02: Predictable Password Generation for Google OAuth Accounts
- **FILE:** `apps/backend/app/api/v1/auth.py`
- **LINE / FUNCTION:** Line 128 (`google_login`)
- **PROBLEM:** When a new user logs in via Google, an account is created with `hashed_pwd = get_password_hash(f"google_oauth_{data.email}_pwd_2026")`.
- **WHY IT MATTERS:** Any attacker knowing an existing user's email address can compute this deterministic password and log into `/api/v1/auth/login` directly via standard email/password authentication, completely bypassing Google OAuth!
- **RECOMMENDED FIX:** Generate a cryptographically random, unguessable password using `secrets.token_urlsafe(32)` for OAuth users.
- **SEVERITY:** CRITICAL

#### Finding SEC-03: Missing Upload File Size Validation
- **FILE:** `apps/backend/app/api/v1/documents.py`
- **LINE / FUNCTION:** Lines 49-51 (`upload_document`)
- **PROBLEM:** The endpoint copies the incoming stream to disk via `shutil.copyfileobj(file.file, buffer)` without verifying the byte size beforehand or streaming with a maximum limit.
- **WHY IT MATTERS:** Denial of Service (DoS) attack where an attacker uploads an arbitrarily large file (e.g. 50GB) to exhaust host disk space.
- **RECOMMENDED FIX:** Add `MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024` (50MB) to `Settings` and enforce maximum upload size checking before saving to disk.
- **SEVERITY:** HIGH

#### Finding SEC-04: Non-Integer `user_id` in JWT Triggers Unhandled 500
- **FILE:** `apps/backend/app/api/v1/auth.py`
- **LINE / FUNCTION:** Line 41 (`get_current_user`)
- **PROBLEM:** `user = db.query(User).filter(User.id == int(user_id)).first()`. If `user_id` in the decoded token payload is not numeric, `int(user_id)` raises an uncaught `ValueError`, producing an unhandled HTTP 500 error instead of HTTP 401 Unauthorized.
- **WHY IT MATTERS:** Malformed tokens should result in HTTP 401 Unauthorized, not internal server errors that pollute error telemetry.
- **RECOMMENDED FIX:** Wrap `int(user_id)` conversion in a `try...except ValueError` block and raise `credentials_exception`.
- **SEVERITY:** MEDIUM

#### Finding SEC-05: Deprecated `datetime.utcnow()` Usage
- **FILE:** `apps/backend/app/core/security.py`, `apps/backend/app/db/models.py`, `apps/backend/app/api/v1/chat.py`
- **LINE / FUNCTION:** Lines 28, 30 in `security.py`; Lines 15, 27, 28, 47, 62 in `models.py`; Lines 96, 254, 362 in `chat.py`
- **PROBLEM:** `datetime.utcnow()` is deprecated starting in Python 3.12 and will be removed in future Python versions, raising runtime `DeprecationWarning`.
- **WHY IT MATTERS:** Future Python releases will break this authentication timestamp calculation and database default timestamps.
- **RECOMMENDED FIX:** Replace with `datetime.now(timezone.utc)` across all modules or a standardized `utc_now()` helper.
- **SEVERITY:** MEDIUM

---

### 2. Resource Management & Leaks

#### Finding RES-01: Unclosed Image File Stream in OCR Parser
- **FILE:** `apps/backend/app/rag/parsing/parser.py`
- **LINE / FUNCTION:** Line 48 (`DocumentParser.extract_text`)
- **PROBLEM:** `img = Image.open(file_path)` opens the file stream but is never closed explicitly or via context manager.
- **WHY IT MATTERS:** Resource leak. Under high upload volume on Unix/Linux systems, open file descriptors accumulate, eventually causing `OSError: [Errno 24] Too many open files`.
- **RECOMMENDED FIX:** Use `with Image.open(file_path) as img:` so the file descriptor is guaranteed to close.
- **SEVERITY:** HIGH

#### Finding RES-02: Missing Stream Lock Release in Frontend SSE Reader
- **FILE:** `apps/frontend/src/features/chat/services/chatService.js`
- **LINE / FUNCTION:** Lines 137-165 (`chatService.streamChat`)
- **PROBLEM:** `const reader = response.body.getReader();` is acquired, but `reader.releaseLock()` is never called in a `finally` block when streaming completes or aborts.
- **WHY IT MATTERS:** When requests are cancelled or aborted (e.g., user clicks "Stop"), unreleased stream readers prevent proper garbage collection and stream cancellation.
- **RECOMMENDED FIX:** Wrap reader loop in a `try...finally` block that calls `reader.releaseLock()`.
- **SEVERITY:** MEDIUM

#### Finding RES-03: Uncleaned `setInterval` Timers on Component Unmount
- **FILE:** `apps/frontend/src/pages/Chat.jsx`, `apps/frontend/src/pages/Upload.jsx`
- **LINE / FUNCTION:** Line 244 in `Chat.jsx`, Line 34 in `Upload.jsx`
- **PROBLEM:** `const interval = setInterval(...)` polls document status every 1.5s for up to 45s. If the user navigates away before polling completes, the interval continues running in background and attempts to update unmounted component state.
- **WHY IT MATTERS:** React memory leak and state update warnings on unmounted components.
- **RECOMMENDED FIX:** Store the interval ID in a `useRef` and clean it up in `useEffect` return function or unmount handler.
- **SEVERITY:** MEDIUM

#### Finding RES-04: Unbounded In-Memory Caches in RAG Engine
- **FILE:** `apps/backend/app/rag/embeddings/service.py`, `apps/backend/app/rag/retrieval/retriever.py`
- **LINE / FUNCTION:** Line 52 in `service.py` (`self._embedding_cache`), Line 23 in `retriever.py` (`self._search_cache`)
- **PROBLEM:** Both dictionaries grow indefinitely without eviction or maximum capacity limits.
- **WHY IT MATTERS:** In long-running production processes, unbounded caches cause steady memory growth (memory leak).
- **RECOMMENDED FIX:** Add a maximum size cap (e.g. 2,000 items for embeddings, 500 items for queries) with simple FIFO/LRU eviction.
- **SEVERITY:** MEDIUM

---

### 3. Database Performance & Schema Optimization

#### Finding DB-01: Missing Database Indexes on Frequently Queried Foreign Keys
- **FILE:** `apps/backend/app/db/models.py`
- **LINE / FUNCTION:** Lines 25, 37, 56, 57, 58 (`user_id`, `thread_id`, `document_id`)
- **PROBLEM:** The foreign keys `ConversationThread.user_id`, `Document.user_id`, `ChatMessage.user_id`, `ChatMessage.thread_id`, and `ChatMessage.document_id` lack `index=True`.
- **WHY IT MATTERS:** Every single API call in `chat.py` and `documents.py` queries by `user_id` or `thread_id`. Without indexes, the database must execute full table scans for every conversation, message list, or document list request.
- **RECOMMENDED FIX:** Add `index=True` to these columns in `models.py`.
- **SEVERITY:** HIGH

#### Finding DB-02: N+1 Database Query in `list_threads` Endpoint
- **FILE:** `apps/backend/app/api/v1/chat.py`
- **LINE / FUNCTION:** Line 52 (`list_threads`)
- **PROBLEM:** In `list_threads`, the response comprehension evaluates `"message_count": len(t.messages)`. Because `t.messages` is lazily loaded, SQLite executes an additional `SELECT` query for *every* thread in the list.
- **WHY IT MATTERS:** If a user has 40 threads, listing threads executes 41 SQL queries (1 to list threads + 40 to fetch messages).
- **RECOMMENDED FIX:** Use `selectinload(ConversationThread.messages)` or an efficient SQL count subquery to fetch thread counts in a single query.
- **SEVERITY:** MEDIUM

---

### 4. RAG Pipeline & Vector Database Integrity

#### Finding RAG-01: Index Mismatch Bug in ChromaDB Chunk Insertion
- **FILE:** `apps/backend/app/rag/vectorstore/chroma.py`
- **LINE / FUNCTION:** Lines 60, 66, 68 (`add_document_chunks`)
- **PROBLEM:** `texts` is filtered: `texts = [chunk.page_content for chunk in chunks if getattr(chunk, "page_content", "").strip()]`. Then `ids = [f"doc_{document_id}_chunk_{i}" for i in range(len(texts))]`. But `metadatas` is created by iterating over the original unfiltered `chunks`: `for i, chunk in enumerate(chunks): metadatas.append(...)`.
- **WHY IT MATTERS:** If any chunk has empty content, `len(metadatas)` will NOT equal `len(texts)` or `len(ids)`. ChromaDB's `collection.add()` strictly validates that `len(ids) == len(embeddings) == len(documents) == len(metadatas)`. Mismatched lengths will throw a fatal `ValueError` and crash ingestion.
- **RECOMMENDED FIX:** Filter valid chunks once into `valid_chunks = [c for c in chunks if getattr(c, "page_content", "").strip()]`, and build `texts`, `ids`, `embeddings`, and `metadatas` from `valid_chunks`.
- **SEVERITY:** HIGH

#### Finding RAG-02: Redundant Tiktoken Tokenizer Re-initialization
- **FILE:** `apps/backend/app/rag/pipeline/engine.py`
- **LINE / FUNCTION:** Line 277 (`_compress_context`)
- **PROBLEM:** `enc = tiktoken.get_encoding("cl100k_base")` is executed on *every single* call to `_compress_context` during summaries and Q&A turns.
- **WHY IT MATTERS:** Instantiating tiktoken encodings repeatedly incurs file I/O and dictionary parsing overhead, increasing RAG latency.
- **RECOMMENDED FIX:** Cache `enc` once on module initialization or class `__init__`.
- **SEVERITY:** MEDIUM

#### Finding RAG-03: Redundant Duplicate Filtering Between Retriever and Pipeline
- **FILE:** `apps/backend/app/rag/pipeline/engine.py`, `apps/backend/app/rag/retrieval/retriever.py`
- **LINE / FUNCTION:** Line 252 in `engine.py` (`_deduplicate_and_merge_chunks`), Line 82 in `retriever.py` (`filter_and_rank_results`)
- **PROBLEM:** Both methods implement the exact same 120-character regex snippet signature deduplication (`re.sub(r"\s+", " ", text[:120].lower())`). The retriever already deduplicates candidates before returning them; the engine then runs the same deduplication again.
- **WHY IT MATTERS:** Unnecessary CPU cycles and code duplication.
- **RECOMMENDED FIX:** Rely on the retriever's canonical deduplication and remove redundant passes.
- **SEVERITY:** LOW

---

### 5. Code Duplication & Abstraction Hygiene

#### Finding DUP-01: Duplicated Chat Context Resolution in `stream_rag_chat` and `query_rag_chat`
- **FILE:** `apps/backend/app/api/v1/chat.py`
- **LINE / FUNCTION:** Lines 165–215 and Lines 284–330
- **PROBLEM:** 50 lines of code are duplicated verbatim between the streaming and synchronous chat endpoints:
  - Document lookup with user ownership validation
  - Conversation thread lookup or auto-creation
  - Multi-turn past message retrieval (last 10 messages)
  - Mapping database messages to `[{"role": "user"|"assistant", "content": ...}]`
- **WHY IT MATTERS:** Violates DRY (Don't Repeat Yourself). Any change to conversation history limits, document filtering, or thread creation logic must be copied across both endpoints, risking divergent behavior.
- **RECOMMENDED FIX:** Extract into a shared helper function: `_resolve_chat_context(db, user_id, document_id, thread_id, question_text)`.
- **SEVERITY:** MEDIUM

#### Finding DUP-02: Duplicated Auth Token Response Construction
- **FILE:** `apps/backend/app/api/v1/auth.py`
- **LINE / FUNCTION:** Lines 72-81, Lines 96-105, Lines 141-150
- **PROBLEM:** The exact same dictionary payload structure `{"access_token": access_token, "token_type": "bearer", "user": {"id": user.id, "full_name": user.full_name, "email": user.email, "phone_number": user.phone_number}}` is written out 3 times in `register`, `login`, and `google_login`.
- **WHY IT MATTERS:** Inconsistency risk if user fields change; code bloat.
- **RECOMMENDED FIX:** Extract into a helper function `_build_token_response(user: User, access_token: str) -> dict`.
- **SEVERITY:** LOW

#### Finding DUP-03: Duplicated Document Status Polling in Frontend Pages
- **FILE:** `apps/frontend/src/pages/Chat.jsx`, `apps/frontend/src/pages/Upload.jsx`
- **LINE / FUNCTION:** Line 239 in `Chat.jsx`, Line 30 in `Upload.jsx`
- **PROBLEM:** Both pages implement identical 1500ms status polling logic with 30 max attempts.
- **WHY IT MATTERS:** Redundant code that will diverge when polling intervals or timeouts are updated.
- **RECOMMENDED FIX:** Clean up intervals, use a shared polling helper or standardized hook.
- **SEVERITY:** LOW

---

### 6. Dead Code, Unused Variables & Unimplemented Stubs

#### Finding DEAD-01: Dead Skeleton Methods in Query Analyzer
- **FILE:** `apps/backend/app/rag/query/analyzer.py`
- **LINE / FUNCTION:** Lines 80-94 (`_extract_entities`, `_rewrite_query`, `_choose_strategy`, `_needs_llm`)
- **PROBLEM:** Methods contain only `pass` statements, returning `None` implicitly. They are never called anywhere in the codebase.
- **WHY IT MATTERS:** Clutters code and creates false impressions that query rewriting or entity extraction are functioning.
- **RECOMMENDED FIX:** Either implement simple keyword/regex implementations or remove empty placeholder stubs.
- **SEVERITY:** MEDIUM

#### Finding DEAD-02: Unused Imports Across Backend Modules
- **FILE:** Multiple files
- **PROBLEM:** 
  - `apps/backend/app/main.py`: `os`
  - `apps/backend/app/rag/pipeline/engine.py`: `logging`
  - `apps/backend/app/rag/embeddings/service.py`: `Any`
  - `apps/backend/app/rag/chunking/chunker.py`: `os`, `Dict`, `Any`
  - `apps/backend/app/rag/prompts/builder.py`: `build_qa_prompt`, `Dict`, `List`, `Any`, `Optional`
  - `apps/backend/app/rag/parsing/parser.py`: `Optional`
  - `apps/backend/app/rag/generation/router.py`: `Any`
  - `apps/backend/app/schemas/chat.py`: `List`, `Any`, `Dict`
  - `apps/backend/app/api/v1/auth.py`: `timedelta`, `Optional`
  - `apps/backend/app/api/v1/documents.py`: `List`, `Optional`
  - `apps/backend/app/api/v1/chat.py`: `Any`, `Optional`
- **WHY IT MATTERS:** Pollutes namespace, increases linter noise, and slows down module inspection.
- **RECOMMENDED FIX:** Remove all unused imports.
- **SEVERITY:** LOW

#### Finding DEAD-03: Unused Parameters and Variables in Ingestion Worker
- **FILE:** `apps/backend/app/workers/ingestion_worker.py`
- **LINE / FUNCTION:** Line 15 (`user_id`), Line 33 (`indexed_count`)
- **PROBLEM:** `user_id` is accepted by `ingest_document_task` but never used; `indexed_count` stores the return value of `add_document_chunks` but is never referenced.
- **WHY IT MATTERS:** Dead parameters and variables confuse developers maintaining the code.
- **RECOMMENDED FIX:** Utilize or clean up unused parameters and variables.
- **SEVERITY:** LOW

#### Finding DEAD-04: Unrouted & Unstyled 404 Page Component
- **FILE:** `apps/frontend/src/pages/NotFound.jsx`, `apps/frontend/src/routes/AppRoutes.jsx`
- **LINE / FUNCTION:** `AppRoutes.jsx` line 38; `NotFound.jsx`
- **PROBLEM:** `AppRoutes.jsx` routes `*` directly to `<Navigate to="/" replace />`, so `NotFound.jsx` is dead code. Furthermore, `NotFound.jsx` has jarring light-mode blue styling (`bg-blue-600`) completely inconsistent with the dark DocMind theme.
- **WHY IT MATTERS:** Dead component file and broken design system styling.
- **RECOMMENDED FIX:** Style `NotFound.jsx` to match DocMind's `#212121` dark palette, and wire it up to `*` in `AppRoutes.jsx` (or provide a clean back-to-home button).
- **SEVERITY:** LOW

---

### 7. Error Handling & Broad Exceptions

#### Finding ERR-01: Silent Exception Swallowing
- **FILE:** Multiple files
- **PROBLEM:** 
  - `apps/backend/app/rag/parsing/parser.py:52`: `except Exception: pass` silently ignores Tesseract OCR failures.
  - `apps/backend/app/api/v1/documents.py:179`: `except Exception: pass` silently ignores file system deletion errors.
  - `apps/backend/app/rag/chunking/chunker.py:72`: `except Exception: pass` on page number parsing.
- **WHY IT MATTERS:** Silently swallowing errors with bare `pass` hides critical production bugs (such as permission errors or missing binaries).
- **RECOMMENDED FIX:** Catch specific exception classes (`OSError`, `ValueError`) and log at `DEBUG` or `WARNING` level.
- **SEVERITY:** MEDIUM

#### Finding ERR-02: Missing Rollback on Worker Database Failure
- **FILE:** `apps/backend/app/workers/ingestion_worker.py`
- **LINE / FUNCTION:** Lines 60–67 (`except Exception as e`)
- **PROBLEM:** If an error occurs inside `ingest_document_task` while the session is dirty, calling `db.commit()` in the `except` block without calling `db.rollback()` first can raise another database exception, leaving the document stuck in `"processing"` forever.
- **WHY IT MATTERS:** Stuck documents degrade user experience because the UI will poll indefinitely.
- **RECOMMENDED FIX:** Call `db.rollback()` before setting `doc.status = "failed"` and committing the failure state.
- **SEVERITY:** HIGH

---

### 8. Frontend React & Lint Issues

#### Finding FE-01: Fast Refresh Warning in AuthContext
- **FILE:** `apps/frontend/src/features/auth/context/AuthContext.jsx`
- **LINE / FUNCTION:** Line 5 (`export const AuthContext = createContext(null);`)
- **PROBLEM:** `AuthContext.jsx` exports both `AuthContext` (non-component object) and `AuthProvider` (component). This triggers oxlint warning: `react(only-export-components): Fast refresh only works when a file only exports components`.
- **WHY IT MATTERS:** Breaks Vite HMR (Hot Module Replacement) during frontend development and triggers linter warnings.
- **RECOMMENDED FIX:** Isolate context definition in `AuthContext.js` and keep component in `AuthProvider.jsx` (or export hook cleanly).
- **SEVERITY:** MEDIUM

#### Finding FE-02: Missing Hook Dependency in Chat Component
- **FILE:** `apps/frontend/src/pages/Chat.jsx`
- **LINE / FUNCTION:** Line 79 (`useEffect(..., [])`)
- **PROBLEM:** `initData` references `activeThreadId` inside the effect: `if (threadData && threadData.length > 0 && !activeThreadId)`. But `activeThreadId` is omitted from the dependency array, triggering `react-hooks(exhaustive-deps)` warning.
- **WHY IT MATTERS:** Stale closures and linter errors.
- **RECOMMENDED FIX:** Check `threadData` directly or use functional state updater to eliminate the stale closure.
- **SEVERITY:** MEDIUM

#### Finding FE-03: Direct DOM Queries (`document.getElementById`) in React Components
- **FILE:** `apps/frontend/src/pages/Chat.jsx`, `apps/frontend/src/pages/Upload.jsx`
- **LINE / FUNCTION:** Line 427 in `Chat.jsx`, Line 121 in `Upload.jsx`
- **PROBLEM:** Uses `document.getElementById("modal-file-picker").click()` and `document.getElementById("file-upload-input").click()`.
- **WHY IT MATTERS:** Direct DOM access bypasses React's synthetic event model and breaks if multiple component instances exist.
- **RECOMMENDED FIX:** Use React `useRef` hooks (`fileInputRef.current.click()`).
- **SEVERITY:** LOW

#### Finding FE-04: Destructive `localStorage.clear()` in ErrorBoundary
- **FILE:** `apps/frontend/src/components/ErrorBoundary.jsx`
- **LINE / FUNCTION:** Line 32 (`localStorage.clear()`)
- **PROBLEM:** On error reset, `localStorage.clear()` wipes all browser storage, potentially destroying unrelated keys from other applications running on the same domain/port.
- **WHY IT MATTERS:** Collateral data loss in shared environments.
- **RECOMMENDED FIX:** Specifically remove `docmind_token` and `docmind_user`.
- **SEVERITY:** LOW

---

### 9. Configuration & Hardcoded Magic Values

#### Finding CFG-01: Hardcoded File Extensions and Missing Size Limits
- **FILE:** `apps/backend/app/api/v1/documents.py`, `apps/backend/app/core/config.py`
- **LINE / FUNCTION:** Line 33 in `documents.py`
- **PROBLEM:** `allowed_extensions = [".pdf", ".docx", ".doc", ".txt", ".md", ".png", ".jpg", ".jpeg", ".webp"]` is hardcoded inline inside the route handler instead of centralized in `Settings`.
- **WHY IT MATTERS:** Settings cannot be adjusted via environment variables or tested centrally.
- **RECOMMENDED FIX:** Move `ALLOWED_EXTENSIONS` and `MAX_UPLOAD_SIZE_BYTES` into `app.core.config.Settings`.
- **SEVERITY:** LOW

---

## Prioritized Remediation Plan

| Phase | Severity | Scope | Targeted Fixes |
|-------|----------|-------|----------------|
| **Phase 1** | **CRITICAL** | Security & File Integrity | Path traversal sanitization in uploads; cryptographic random passwords for OAuth; secure file upload size enforcement. |
| **Phase 2** | **HIGH** | Reliability & DB Performance | Add missing database indexes on foreign keys; fix ChromaDB chunk/text index mismatch bug; add `db.rollback()` on worker failure; close Image stream in parser. |
| **Phase 3** | **MEDIUM** | DRY, React & Async Hygiene | Fix N+1 queries in `list_threads`; unify chat context resolution helper; fix Fast Refresh & exhaustive-deps warnings in frontend; add stream reader `finally` lock release; add unmount timer cleanup. |
| **Phase 4** | **LOW & STYLE**| Dead Code & Polish | Remove unused imports across all backend files; clean dead skeleton methods in query analyzer; replace direct DOM access with `useRef`; style 404 page; centralize configuration values. |

---

## Baseline Test Execution Record

- **Smoke Import Test:** `apps/backend/venv/bin/python apps/backend/tests/smoke/test_smoke.py` → **PASSED** (0 errors)
- **RAG Quality Test:** `PYTHONPATH=apps/backend apps/backend/venv/bin/python apps/backend/tests/rag/test_rag_quality.py` → **PASSED** (all assertions met)
- **End-to-End Flow Test:** `PYTHONPATH=apps/backend apps/backend/venv/bin/python apps/backend/tests/verify_flow.py` → **PASSED** (all assertions met)
- **Frontend Linter:** `cd apps/frontend && npm run lint` → **2 Warnings, 0 Errors**
- **Frontend Build:** `cd apps/frontend && npm run build` → **PASSED** (102ms, 0 errors)
