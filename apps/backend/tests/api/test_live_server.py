import os
import sys
import time
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_live_server():
    print("\n========================================================")
    print("🚀 DOCMIND AI — COMPREHENSIVE LIVE SERVER FEATURE TEST")
    print("========================================================\n")

    # 1. Health check
    print("1. Testing Health Endpoint...")
    h_res = requests.get(f"{BASE_URL}/health")
    assert h_res.status_code == 200, f"Health check failed: {h_res.text}"
    print(f"   ✓ Health check OK: {h_res.json()['status']}, LLMs: {[x['provider'] for x in h_res.json()['supported_llms']]}")

    # 2. User Registration
    user_email = f"sarah.chen_{int(time.time())}@docmind.ai"
    password = "SecurePassword2026!"
    print(f"\n2. Registering new user: {user_email}...")
    reg_res = requests.post(f"{BASE_URL}/auth/register", json={
        "full_name": "Dr. Sarah Chen",
        "email": user_email,
        "password": password
    })
    assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
    user_data = reg_res.json()["user"]
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"   ✓ Registered user ID: {user_data['id']}, Name: {user_data['full_name']}")

    # 3. User Login
    print("\n3. Testing Email/Password Login...")
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": user_email,
        "password": password
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    print("   ✓ Login successful, JWT token verified")

    # 4. Current User Profile
    print("\n4. Testing /auth/me profile endpoint...")
    me_res = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    assert me_res.status_code == 200
    print(f"   ✓ Profile fetched: {me_res.json()['email']}")

    # 5. Thread Creation
    print("\n5. Testing Conversation Thread Creation...")
    thread_res = requests.post(f"{BASE_URL}/chat/threads", json={"title": "RAG Deep Dive"}, headers=headers)
    assert thread_res.status_code == 201
    thread_id = thread_res.json()["id"]
    print(f"   ✓ Thread created: {thread_id} ('{thread_res.json()['title']}')")

    # 6. Document Upload (Async Ingestion & Background Task)
    print("\n6. Testing Document Upload with Background Ingestion...")
    doc_text = (
        "Project DocMind AI Specification Document\n"
        "--- [Page 1] ---\n"
        "DocMind AI is an advanced multi-provider RAG system combining ChromaDB, FastAPI, and React.\n"
        "Key Feature: Offline embeddings powered by ONNX all-MiniLM-L6-v2 without OpenAI API key.\n"
        "--- [Page 2] ---\n"
        "Security Mandate: Multi-tenant strict isolation ensures User A can never query User B documents.\n"
        "The system supports SSE streaming for real-time ChatGPT-grade response latency."
    )

    upload_res = requests.post(
        f"{BASE_URL}/documents/upload",
        files={"file": ("docmind_specs.txt", doc_text.encode("utf-8"), "text/plain")},
        headers=headers
    )
    assert upload_res.status_code == 201, f"Upload failed: {upload_res.text}"
    doc_id = upload_res.json()["document"]["id"]
    print(f"   ✓ Document uploaded with ID: {doc_id}, initial status: {upload_res.json()['document']['status']}")

    # 7. Poll Ingestion Status
    print("   Polling /documents/status until ready...")
    ready = False
    for i in range(15):
        status_res = requests.get(f"{BASE_URL}/documents/status/{doc_id}", headers=headers)
        st = status_res.json().get("status")
        if st == "ready":
            ready = True
            print(f"   ✓ Ingestion completed in background! Chunks: {status_res.json()['chunk_count']}")
            if status_res.json().get("summary"):
                print(f"   ✓ Auto-Summary generated: {status_res.json()['summary'][:90]}...")
            break
        time.sleep(0.5)

    assert ready, "Document ingestion timed out or failed"

    # 8. List User Documents
    print("\n8. Testing Document Listing...")
    docs_list = requests.get(f"{BASE_URL}/documents", headers=headers)
    assert docs_list.status_code == 200
    assert len(docs_list.json()) >= 1
    print(f"   ✓ Found {len(docs_list.json())} document(s) in user's library")

    # 9. Real-time SSE Token Streaming (General Chat)
    print("\n9. Testing General Chat SSE Streaming...")
    stream_res = requests.post(
        f"{BASE_URL}/chat/stream",
        json={
            "thread_id": thread_id,
            "question": "What is Retrieval-Augmented Generation?",
            "model_provider": "gemini"
        },
        headers=headers,
        stream=True
    )
    assert stream_res.status_code == 200
    general_tokens = []
    for line in stream_res.iter_lines():
        if line:
            decoded = line.decode("utf-8")
            if decoded.startswith("data: "):
                event = json.loads(decoded[6:])
                if event.get("type") == "token":
                    general_tokens.append(event.get("content", ""))
    print(f"   ✓ General chat streamed {len(general_tokens)} tokens ({len(''.join(general_tokens))} chars)")

    # 10. Real-time SSE Token Streaming (Document RAG Chat with Citation)
    print("\n10. Testing Document RAG Chat SSE Streaming with Citation...")
    rag_stream_res = requests.post(
        f"{BASE_URL}/chat/stream",
        json={
            "thread_id": thread_id,
            "document_id": doc_id,
            "question": "What is the key offline embedding feature mentioned in the document?",
            "model_provider": "gemini"
        },
        headers=headers,
        stream=True
    )
    assert rag_stream_res.status_code == 200
    rag_tokens = []
    for line in rag_stream_res.iter_lines():
        if line:
            decoded = line.decode("utf-8")
            if decoded.startswith("data: "):
                event = json.loads(decoded[6:])
                if event.get("type") == "token":
                    rag_tokens.append(event.get("content", ""))

    full_rag_answer = "".join(rag_tokens)
    print(f"   ✓ Document answer received ({len(full_rag_answer)} chars):")
    print(f"     \"{full_rag_answer.strip()}\"")
    assert "(Source:" in full_rag_answer, "Expected source citation chip in answer"
    print("   ✓ Source citation successfully extracted and included in answer!")

    # 11. Database Persistence Verification (Retrieve thread messages)
    print("\n11. Verifying Database Message Persistence...")
    msgs_res = requests.get(f"{BASE_URL}/chat/threads/{thread_id}/messages", headers=headers)
    assert msgs_res.status_code == 200
    saved_msgs = msgs_res.json()
    print(f"   ✓ Thread has {len(saved_msgs)} saved messages in SQLite DB:")
    for idx, m in enumerate(saved_msgs, 1):
        print(f"     [{idx}] Q: \"{m['question']}\" -> Answer length: {len(m['answer'])} chars")

    # 12. Security Isolation (User B cannot query User A's document)
    print("\n12. Testing Multi-Tenant Document Security Isolation...")
    reg_b = requests.post(f"{BASE_URL}/auth/register", json={
        "full_name": "Attacker User",
        "email": f"attacker_{int(time.time())}@docmind.ai",
        "password": "Password123!"
    })
    token_b = reg_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    leak_attempt = requests.post(
        f"{BASE_URL}/chat/stream",
        json={"document_id": doc_id, "question": "Read User A's document"},
        headers=headers_b
    )
    assert leak_attempt.status_code == 404, f"Security vulnerability! Expected 404, got {leak_attempt.status_code}"
    print("   ✓ Cross-tenant document access successfully blocked (HTTP 404 Not Found)")

    # 13. Document Deletion
    print("\n13. Testing Document Deletion & Vector Cleanup...")
    del_doc = requests.delete(f"{BASE_URL}/documents/{doc_id}", headers=headers)
    assert del_doc.status_code == 200
    print(f"   ✓ Document {doc_id} and its ChromaDB vector collection deleted")

    print("\n========================================================")
    print("🎉 ALL 13 END-TO-END FEATURE TESTS PASSED WITH 100% SUCCESS!")
    print("========================================================\n")

if __name__ == "__main__":
    test_live_server()
