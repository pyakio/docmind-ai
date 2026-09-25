import os
import sys
import time

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_tests():
    print("=== DOCMIND AI END-TO-END VERIFICATION ===")

    # 1. Register User A
    user_a_email = f"tester_{int(time.time())}@docmind.ai"
    reg_resp = client.post("/api/v1/auth/register", json={
        "full_name": "Test User A",
        "email": user_a_email,
        "password": "Password123!"
    })
    assert reg_resp.status_code == 201, f"Reg failed: {reg_resp.text}"
    token_a = reg_resp.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}
    print("✓ User A registered and token obtained")

    # 2. Login User A
    login_resp = client.post("/api/v1/auth/login", json={
        "email": user_a_email,
        "password": "Password123!"
    })
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    print("✓ User A logged in with real password verification")

    # 3. Test Invalid Token
    bad_auth = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer mock_fake_token"})
    assert bad_auth.status_code == 401, f"Expected 401 on mock token, got {bad_auth.status_code}"
    print("✓ Mock token backdoor verified closed (returns 401)")

    # 4. Forgot Password endpoint
    forgot_resp = client.post("/api/v1/auth/forgot-password", json={"email": user_a_email})
    assert forgot_resp.status_code == 200
    print("✓ Forgot password endpoint works")

    # 5. Thread CRUD
    thread_resp = client.post("/api/v1/chat/threads", json={"title": "Test AI Discussion"}, headers=headers_a)
    assert thread_resp.status_code == 201
    thread_id = thread_resp.json()["id"]
    print(f"✓ Thread created: {thread_id}")

    threads_list = client.get("/api/v1/chat/threads", headers=headers_a)
    assert len(threads_list.json()) >= 1
    print("✓ User threads listed successfully")

    # 6. Document Upload & Async Ingestion
    sample_doc_content = (
        "DocMind AI Architecture Whitepaper\n"
        "--- [Page 1] ---\n"
        "DocMind AI is a modern document assistant using FastAPI, ChromaDB, and Multi-LLM RAG.\n"
        "The primary goal of DocMind is to deliver instant, accurate document synthesis with page citations.\n"
        "--- [Page 2] ---\n"
        "Key security requirement: Cross-tenant document isolation must always be strictly enforced.\n"
        "Vector embeddings are stored per user collection with cosine distance metric."
    )

    upload_resp = client.post(
        "/api/v1/documents/upload",
        files={"file": ("architecture_whitepaper.txt", sample_doc_content.encode("utf-8"), "text/plain")},
        headers=headers_a
    )
    assert upload_resp.status_code == 201, f"Upload failed: {upload_resp.text}"
    doc_id = upload_resp.json()["document"]["id"]
    print(f"✓ Document uploaded (id={doc_id}), status: {upload_resp.json()['document']['status']}")

    # Wait / poll for background task to finish
    for _ in range(10):
        status_resp = client.get(f"/api/v1/documents/status/{doc_id}", headers=headers_a)
        st = status_resp.json()["status"]
        if st == "ready":
            break
        time.sleep(1)

    assert status_resp.json()["status"] == "ready", f"Doc not ready: {status_resp.json()}"
    print(f"✓ Document ingestion completed! Chunks: {status_resp.json()['chunk_count']}")

    # 7. Test SSE Chat Streaming on Document
    stream_resp = client.post("/api/v1/chat/stream", json={
        "thread_id": thread_id,
        "document_id": doc_id,
        "question": "What is the key security requirement mentioned in this document?",
        "model_provider": "gemini"
    }, headers=headers_a)
    assert stream_resp.status_code == 200
    assert "text/event-stream" in stream_resp.headers.get("content-type", "")
    stream_text = stream_resp.text
    assert "data: " in stream_text
    print("✓ SSE Streaming responded with tokens and event stream")

    # 8. Test General Chat Streaming (no document attached)
    gen_stream_resp = client.post("/api/v1/chat/stream", json={
        "thread_id": thread_id,
        "question": "Hello DocMind AI, what are your capabilities?",
        "model_provider": "gemini"
    }, headers=headers_a)
    assert gen_stream_resp.status_code == 200
    print("✓ General chat SSE streaming works cleanly")

    # 9. Test Multi-Tenant Document Security Isolation
    user_b_email = f"user_b_{int(time.time())}@docmind.ai"
    reg_b = client.post("/api/v1/auth/register", json={
        "full_name": "User B",
        "email": user_b_email,
        "password": "Password123!"
    })
    token_b = reg_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User B attempts to access User A's document
    leak_test = client.post("/api/v1/chat/stream", json={
        "document_id": doc_id,  # Owned by User A
        "question": "Tell me User A's secrets",
    }, headers=headers_b)

    assert leak_test.status_code == 404, f"Security Breach! Expected 404, got {leak_test.status_code}"
    print("✓ Multi-tenant isolation verified: User B cannot access User A's document (HTTP 404 returned)")

    print("\n🎉 ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
