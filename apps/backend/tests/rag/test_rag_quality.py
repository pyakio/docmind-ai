import os
import sys
import time
import json
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.rag.embeddings.service import embedding_service
from app.rag.prompts.builder import prompt_builder_service
from app.rag.generation.router import llm_router_service, AVAILABLE_MODELS, DEFAULT_MODEL_ID
from app.rag.pipeline.engine import rag_engine
from app.rag.prompts.system import DOCMIND_SYSTEM_INSTRUCTION
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_embedding_backend():
    print("\n--- Testing Embedding Service ---")
    texts = ["This is an AI whitepaper about RAG systems.", "DocMind AI processes documents."]
    embs = embedding_service.embed_documents(texts)
    assert len(embs) == 2
    assert len(embs[0]) == 384, f"Expected 384 dim, got {len(embs[0])}"
    # Verify semantic similarity: query embedding matches document embedding closer than unrelated query
    q_rel = embedding_service.embed_query("whitepaper about AI RAG")
    q_unrel = embedding_service.embed_query("recipe for chocolate cake baking")
    
    import numpy as np
    dot_rel = np.dot(embs[0], q_rel) / (np.linalg.norm(embs[0]) * np.linalg.norm(q_rel))
    dot_unrel = np.dot(embs[0], q_unrel) / (np.linalg.norm(embs[0]) * np.linalg.norm(q_unrel))
    assert dot_rel > dot_unrel, f"Semantic embedding failed: rel={dot_rel} vs unrel={dot_unrel}"
    print(f"✓ Semantic ONNX embeddings verified (dim={len(embs[0])}, rel_sim={dot_rel:.3f} > unrel_sim={dot_unrel:.3f})")

def test_prompt_builder():
    print("\n--- Testing Prompt Templates & System Instructions ---")
    assert "You are DocMind, a direct and helpful assistant" in DOCMIND_SYSTEM_INSTRUCTION
    assert "When a claim comes from an attached document, name the source naturally" in DOCMIND_SYSTEM_INSTRUCTION
    assert "Don't open with \"Based on the provided context\"" in DOCMIND_SYSTEM_INSTRUCTION

    prompt = prompt_builder_service.build_qa_prompt(
        query="What is the payment term?",
        compressed_context="[Page 2]\nPayment is net 30 days.",
        filename="contract.pdf",
        conversation_history="User: What is the contract for?\nAssistant: It is a vendor agreement."
    )
    assert "Attached Document: contract.pdf" in prompt
    assert "Relevant Document Context:" in prompt
    assert "[Page 2]\nPayment is net 30 days." in prompt
    assert "Recent Conversation History:" in prompt
    assert "User Question: What is the payment term?" in prompt
    print("✓ Prompt templates correctly format natural context, history, and questions")

def test_llm_router_resolution_and_messages():
    print("\n--- Testing LLM Router Provider & Model Resolution ---")
    prov, mod = llm_router_service._resolve_provider_and_model(None, "claude-sonnet-5")
    assert prov == "anthropic" and mod == "claude-sonnet-5"

    prov, mod = llm_router_service._resolve_provider_and_model(None, "gpt-5.6-sol")
    assert prov == "openai" and mod == "gpt-5.6-sol"

    prov, mod = llm_router_service._resolve_provider_and_model(None, "gemini-3.6-flash")
    assert prov == "gemini" and mod == "gemini-3.6-flash"

    # Test multi-turn message packing
    history = [
        {"role": "user", "content": "What is the capital of France?"},
        {"role": "assistant", "content": "The capital of France is Paris."}
    ]
    packed = llm_router_service._build_messages_payload("What is its population?", history)
    assert len(packed) == 3
    assert packed[0] == {"role": "user", "content": "What is the capital of France?"}
    assert packed[1] == {"role": "assistant", "content": "The capital of France is Paris."}
    assert packed[2] == {"role": "user", "content": "What is its population?"}
    print("✓ LLM Router resolutions and multi-turn message bundling verified")

def test_anthropic_sdk_integration():
    print("\n--- Testing Anthropic Claude SDK Wiring ---")
    with patch("anthropic.Anthropic") as mock_anthropic:
        mock_instance = MagicMock()
        mock_anthropic.return_value = mock_instance
        
        # Test non-streaming
        mock_msg = MagicMock()
        mock_msg.content = [MagicMock(text="Paris has a population of around 2.1 million.")]
        mock_instance.messages.create.return_value = mock_msg

        llm_router_service.anthropic_client = mock_instance
        response = llm_router_service.generate_response(
            prompt="What is the population of Paris?",
            model_provider="anthropic",
            model_name="claude-sonnet-5"
        )
        assert response == "Paris has a population of around 2.1 million."
        mock_instance.messages.create.assert_called_once()
        call_kwargs = mock_instance.messages.create.call_args[1]
        assert call_kwargs["system"] == DOCMIND_SYSTEM_INSTRUCTION
        assert call_kwargs["model"] == "claude-3-7-sonnet-20250219"

        # Test streaming
        mock_stream_ctx = MagicMock()
        mock_stream = MagicMock()
        mock_stream.text_stream = ["Paris ", "has ", "2.1M ", "people."]
        mock_stream_ctx.__enter__.return_value = mock_stream
        mock_instance.messages.stream.return_value = mock_stream_ctx

        stream_tokens = list(llm_router_service.generate_response_stream(
            prompt="What is the population of Paris?",
            model_provider="anthropic",
            model_name="claude-sonnet-5"
        ))
        assert "".join(stream_tokens) == "Paris has 2.1M people."
        mock_instance.messages.stream.assert_called_once()
        print("✓ Anthropic Claude SDK correctly wired for both create() and stream()")

def test_context_token_compression():
    print("\n--- Testing Token-based Context Compression ---")
    chunks = [
        {"text": "--- [Page 1] ---\nDocMind AI is designed to give accurate answers.", "metadata": {"page_number": 1}},
        {"text": "--- [Page 2] ---\nIt uses token budgeting instead of rigid character limits. This ensures sentences are not sliced mid-word.", "metadata": {"page_number": 2}},
        {"text": "--- [Page 3] ---\nThird section covers additional guidelines.", "metadata": {"page_number": 3}},
    ]
    compressed = rag_engine._compress_context(chunks, max_tokens=100)
    assert "[Page 1]\nDocMind AI is designed to give accurate answers." in compressed
    assert "[Page 2]\nIt uses token budgeting" in compressed
    assert not compressed.endswith("...")
    print("✓ Context compression preserves sentence boundaries and page annotations")

def test_full_chat_endpoints():
    print("\n--- Testing Full Chat API Endpoints ---")
    # 1. Register user
    user_email = f"quality_test_{int(time.time())}@docmind.ai"
    reg_resp = client.post("/api/v1/auth/register", json={
        "full_name": "Quality Tester",
        "email": user_email,
        "password": "Password123!"
    })
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Check models endpoint
    models_resp = client.get("/api/v1/chat/models")
    assert models_resp.status_code == 200
    data = models_resp.json()
    assert "models" in data and len(data["models"]) >= 6
    assert data["default_model"] == "claude-sonnet-5"
    print("✓ /chat/models endpoint lists available models")

    # 3. Create thread
    thread_resp = client.post("/api/v1/chat/threads", json={"title": "Contract Review"}, headers=headers)
    thread_id = thread_resp.json()["id"]

    # 4. Upload document
    doc_text = (
        "EMPLOYMENT AGREEMENT\n"
        "--- [Page 1] ---\n"
        "This Employment Agreement is between Acme Corp and Jane Doe.\n"
        "Position: Lead AI Scientist. Base Salary: $250,000 per annum.\n"
        "--- [Page 2] ---\n"
        "Notice Period: 60 days written notice is required for termination.\n"
        "Vacation: 25 days of paid annual leave."
    )
    up_resp = client.post(
        "/api/v1/documents/upload",
        files={"file": ("employment_agreement.txt", doc_text.encode("utf-8"), "text/plain")},
        headers=headers
    )
    doc_id = up_resp.json()["document"]["id"]

    # Wait for document to be ready
    for _ in range(10):
        st = client.get(f"/api/v1/documents/status/{doc_id}", headers=headers).json()["status"]
        if st == "ready":
            break
        time.sleep(1)

    assert st == "ready"
    print(f"✓ Document indexed with vector embeddings")

    # 5. Test SSE Streaming with Mock LLM
    with patch("app.rag.pipeline.engine.llm_router_service.generate_response_stream") as mock_stream:
        mock_stream.return_value = iter(["According to the agreement (page 1), ", "the base salary is $250,000."])

        stream_resp = client.post("/api/v1/chat/stream", json={
            "thread_id": thread_id,
            "document_id": doc_id,
            "question": "What is Jane's base salary?",
            "model_provider": "anthropic",
            "model_name": "claude-sonnet-5"
        }, headers=headers)

        assert stream_resp.status_code == 200
        text = stream_resp.text
        assert "data: {\"type\": \"start\"" in text
        assert "data: {\"type\": \"token\", \"content\": \"According to the agreement (page 1), \"" in text
        assert "data: {\"type\": \"done\"" in text
        print("✓ SSE Streaming completed with real token chunks")

    # 6. Test Multi-Turn Follow Up
    # Check that the first message was persisted in the thread
    msgs = client.get(f"/api/v1/chat/threads/{thread_id}/messages", headers=headers).json()
    assert len(msgs) == 1
    assert msgs[0]["question"] == "What is Jane's base salary?"
    assert "$250,000" in msgs[0]["answer"]
    print("✓ First turn message persisted in DB")

    # Follow up turn
    with patch("app.rag.pipeline.engine.llm_router_service.generate_response_stream") as mock_stream:
        mock_stream.return_value = iter(["The notice period is 60 days (page 2)."])

        stream_resp2 = client.post("/api/v1/chat/stream", json={
            "thread_id": thread_id,
            "document_id": doc_id,
            "question": "And what is the notice period?",
            "model_provider": "anthropic",
            "model_name": "claude-sonnet-5"
        }, headers=headers)

        assert stream_resp2.status_code == 200
        # Verify that mock_stream was called with messages containing previous turn
        call_kwargs = mock_stream.call_args[1]
        assert "messages" in call_kwargs
        past_turns = call_kwargs["messages"]
        assert len(past_turns) == 2
        assert past_turns[0]["role"] == "user" and past_turns[0]["content"] == "What is Jane's base salary?"
        assert past_turns[1]["role"] == "assistant" and "$250,000" in past_turns[1]["content"]
        print("✓ Multi-turn memory verified: previous Q&A turn passed into prompt")

    # 7. Test Error Handling when API Key is missing / invalid
    with patch("app.rag.pipeline.engine.llm_router_service.generate_response_stream", side_effect=RuntimeError("Anthropic API error: Invalid API Key")):
        err_stream_resp = client.post("/api/v1/chat/stream", json={
            "thread_id": thread_id,
            "document_id": doc_id,
            "question": "What happens on error?",
            "model_provider": "anthropic",
            "model_name": "claude-sonnet-5"
        }, headers=headers)
        assert err_stream_resp.status_code == 200
        assert "Invalid API Key" in err_stream_resp.text
        assert "\"type\": \"error\"" in err_stream_resp.text
        print("✓ Error handling verified: API errors are cleanly surfaced via SSE error events")

if __name__ == "__main__":
    test_embedding_backend()
    test_prompt_builder()
    test_llm_router_resolution_and_messages()
    test_anthropic_sdk_integration()
    test_context_token_compression()
    test_full_chat_endpoints()
    print("\n=======================================================")
    print(" ALL QUALITY & FUNCTIONALITY VERIFICATION TESTS PASSED!")
    print("=======================================================")
