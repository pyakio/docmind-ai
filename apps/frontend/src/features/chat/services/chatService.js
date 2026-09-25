import api from "../../../api/client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export const AVAILABLE_MODELS = [
  // Anthropic Claude
  {
    id: "claude-sonnet-5",
    label: "Claude Sonnet 5",
    provider: "Anthropic",
    badge: "Default",
    description: "Best all-rounder",
  },
  {
    id: "claude-opus-5",
    label: "Claude Opus 5",
    provider: "Anthropic",
    badge: "Reasoning",
    description: "Hardest reasoning & long documents",
  },
  {
    id: "claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    provider: "Anthropic",
    badge: "Fast",
    description: "Fastest, cheapest",
  },
  // OpenAI
  {
    id: "gpt-5.6-terra",
    label: "GPT-5.6 Terra",
    provider: "OpenAI",
    badge: "Everyday",
    description: "Balanced everyday use",
  },
  {
    id: "gpt-5.6-sol",
    label: "GPT-5.6 Sol",
    provider: "OpenAI",
    badge: "Flagship",
    description: "Flagship reasoning & coding",
  },
  {
    id: "gpt-5.6-luna",
    label: "GPT-5.6 Luna",
    provider: "OpenAI",
    badge: "Fast",
    description: "Fast, cheap, high-volume",
  },
  // Google Gemini
  {
    id: "gemini-3.6-flash",
    label: "Gemini 3.6 Flash",
    provider: "Google",
    badge: "Price/Perf",
    description: "Latest, best price/performance",
  },
  {
    id: "gemini-3.1-pro-preview",
    label: "Gemini 3.1 Pro",
    provider: "Google",
    badge: "Deep",
    description: "Deeper reasoning",
  },
  {
    id: "gemini-3.5-flash-lite",
    label: "Gemini 3.5 Flash-Lite",
    provider: "Google",
    badge: "High-Volume",
    description: "Cheapest, high-throughput",
  },
];

export const DEFAULT_MODEL_ID = "claude-sonnet-5";

export const chatService = {
  async listThreads() {
    const response = await api.get("/chat/threads");
    return response.data;
  },

  async createThread(title = "New Conversation") {
    const response = await api.post("/chat/threads", { title });
    return response.data;
  },

  async updateThreadTitle(threadId, title) {
    const response = await api.patch(`/chat/threads/${threadId}`, { title });
    return response.data;
  },

  async deleteThread(threadId) {
    const response = await api.delete(`/chat/threads/${threadId}`);
    return response.data;
  },

  async getThreadMessages(threadId) {
    const response = await api.get(`/chat/threads/${threadId}/messages`);
    return response.data;
  },

  async queryRag(documentId, question, modelProvider = "gemini", modelName = null, threadId = null) {
    const response = await api.post("/chat/query", {
      thread_id: threadId,
      document_id: documentId,
      question,
      model_provider: modelProvider,
      model_name: modelName,
    });
    return response.data;
  },

  async streamChat({ threadId, documentId, question, modelProvider, modelName, onToken, onDone, onError, signal }) {
    const token = localStorage.getItem("docmind_token");
    try {
      const response = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          thread_id: threadId,
          document_id: documentId,
          question,
          model_provider: modelProvider,
          model_name: modelName,
        }),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === "token" && onToken) {
                  onToken(data.content);
                } else if (data.type === "done" && onDone) {
                  onDone(data);
                } else if (data.type === "error" && onError) {
                  onError(new Error(data.error));
                }
              } catch (e) {
                console.error("Error parsing SSE line:", e, line);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        if (onError) onError(err);
      }
    }
  },

  async deleteMessage(messageId) {
    const response = await api.delete(`/chat/messages/${messageId}`);
    return response.data;
  },
};

export default chatService;
