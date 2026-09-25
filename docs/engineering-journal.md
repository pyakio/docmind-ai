today on 25th july we did this

We decided to introduce a Document Intelligence service because repeated LLM calls for summaries and topic extraction were wasteful. By generating a Knowledge Profile once during document ingestion, we improve response quality, reduce latency for future queries, and lay the foundation for future reasoning capabilities. We intentionally avoided creating multiple new services because the current project does not yet need that complexity.

## Decision #6 – Designing Before Coding

### Problem

It is tempting to immediately implement new AI features once an idea appears.

### Options Considered

1. Build features immediately.
2. Design the system first, then implement only what is necessary.

### Decision

We chose to design the architecture before writing code.

### Why

Understanding the problem first reduces unnecessary complexity, avoids premature abstractions, and leads to cleaner software.

### Trade-offs

Initial development is slightly slower, but implementation becomes more reliable and maintainable.

### Interview Explanation

"Before implementing new AI capabilities, I designed the architecture and defined clear responsibilities. This helped avoid overengineering and ensured every component solved a real problem."

## Decision #7 – Conversation Intelligence Before Memory

### Problem

Traditional RAG systems treat every user query independently, causing follow-up questions like "Explain it further" or "Compare it" to fail because they lack context.

### Options Considered

1. Send the entire chat history to the LLM every time.
2. Store lightweight conversational context and resolve ambiguous queries before retrieval.

### Decision

We chose to design a Conversation Intelligence layer that resolves follow-up questions into standalone queries before performing retrieval.

### Why

This improves retrieval quality, reduces unnecessary token usage, and allows the assistant to behave more naturally without relying on the LLM to infer context.

### Trade-offs

The system must maintain lightweight session state and correctly detect topic changes, but avoids sending long conversation histories to the LLM.

### Interview Explanation

"We introduced a Conversation Intelligence layer that resolves follow-up questions before retrieval. Instead of relying on the LLM to understand ambiguous references like 'it' or 'that', the backend rewrites them into standalone queries using session context, improving both retrieval accuracy and efficiency."

## Decision #8 – Intelligence Before Generation

### Problem

Many AI applications send every user query directly to an LLM, making the model responsible for understanding documents, remembering conversations, and generating answers.

### Options Considered

1. Send every request directly to the LLM.
2. Build an intelligence layer that understands, remembers, and reasons before calling the LLM.

### Decision

We decided that DocMind AI should perform understanding, memory management, and reasoning before using an LLM.

### Why

This reduces unnecessary LLM calls, improves answer quality, enables better follow-up conversations, and allows the assistant to behave more like an intelligent system than a simple chatbot.

### Trade-offs

The backend becomes more sophisticated, but responsibilities are clearly separated, making the system easier to extend and reason about.

### Interview Explanation

"We treated the LLM as a language generation component rather than the application's intelligence. The intelligence lives inside DocMind AI through document understanding, conversation memory, and decision-making, while the LLM focuses on producing natural language responses."

## Decision #12 – Consistent Import Strategy

### Problem

The backend mixed two import styles (`backend.app...` and `app...`), causing Python to fail when starting the application.

### Investigation

By understanding the project's execution root (`backend/`), it became clear that `app` is the top-level package when running the backend with Uvicorn.

### Decision

Use a single, consistent import strategy throughout the backend.

### Why

Consistent imports reduce confusion, prevent `ModuleNotFoundError` exceptions, and make the project easier to maintain.

### Key Takeaway

Choose one project root and build all imports relative to it. Mixing import styles creates fragile applications.

## Decision #13 – Standard Development Startup Workflow

### Goal

Establish a consistent process for starting the application during development.

### Workflow

1. Open Terminal 1.
2. Navigate to the `backend/` directory.
3. Activate the virtual environment.
4. Start FastAPI using `uvicorn app.main:app --reload`.
5. Open Terminal 2.
6. Navigate to the project root.
7. Start the frontend using `npm run dev`.

### Why

Keeping the frontend and backend running in separate terminals makes debugging easier and mirrors how professional development environments are typically organised.

### Key Takeaway

A predictable startup workflow reduces setup mistakes and makes it easier to identify whether an issue originates in the frontend or the backend.
## Decision #14 – One Error at a Time

### Learning

After fixing one import issue, a new import error appeared.

This does not mean the previous fix failed.

It means the application progressed further through startup and encountered the next issue.

### Key Takeaway

A successful fix often reveals the next problem. During startup debugging, resolving errors sequentially is expected and indicates progress.
## Decision #15 – Fix Patterns, Not Individual Errors

### Problem

The backend startup exposed multiple import errors one after another.

### Learning

Each new error represented progress in the startup sequence rather than a regression.

### Engineering Principle

Instead of treating every error as an isolated problem, identify the architectural pattern causing the entire class of failures.

### Key Takeaway

Professional debugging focuses on eliminating the root pattern rather than repeatedly fixing individual symptoms.

## Decision #16 – Follow the Import Chain

### What happened?

The application did not fail in every file at once.

Python stopped at the first invalid import.

After fixing that import, startup continued until the next invalid import was encountered.

### Engineering Lesson

Startup debugging is iterative.

Each fixed import allows Python to load more of the application.

The next error is often progress, not a regression.

### Key Takeaway

Never assume a project has only one import problem.
Fix the first error, rerun the application, and continue until the application starts successfully.

## Import Paths Matter

Today I learned that moving a file into another folder changes every import that references it.

Python imports are absolute.

Changing

app/api/auth.py

to

app/api/routes/auth.py

requires updating every import across the project.

Refactoring folders without updating imports causes startup failures.

This is why IDE refactoring tools are valuable—they update imports automatically.

## Today I Successfully Started My First FastAPI Backend

Today I learned how a FastAPI project starts.

I learned how to:

- activate a virtual environment
- run Uvicorn
- understand Python tracebacks
- debug import errors
- fix ModuleNotFoundError
- fix ImportError
- verify that the backend is running

I also learned that a traceback usually reports only the first problem. After fixing it, Python continues loading and may reveal the next issue. Debugging is often a step-by-step process rather than fixing everything at once.
