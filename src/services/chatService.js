import api from "./api";

export const chatService = {
  async queryRag(documentId, question, modelProvider = "chatgpt", modelName = "gpt-4o") {
    const response = await api.post("/chat/query", {
      document_id: documentId,
      question,
      model_provider: modelProvider,
      model_name: modelName,
    });
    return response.data;
  },

  async getHistory(documentId = null) {
    const params = documentId ? { document_id: documentId } : {};
    const response = await api.get("/chat/history", { params });
    return response.data;
  },

  async clearHistory(documentId = null) {
    const params = documentId ? { document_id: documentId } : {};
    const response = await api.delete("/chat/history", { params });
    return response.data;
  },

  async deleteMessage(messageId) {
    const response = await api.delete(`/chat/messages/${messageId}`);
    return response.data;
  },
};
