import api from "../../../api/client";

export const documentService = {
  async uploadDocument(file, onUploadProgress) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });
    return response.data;
  },

  async getDocuments() {
    const response = await api.get("/documents");
    return response.data;
  },

  async listDocuments() {
    return this.getDocuments();
  },

  async getDocumentStatus(documentId) {
    const response = await api.get(`/documents/status/${documentId}`);
    return response.data;
  },

  async getAutoSummary(documentId) {
    const response = await api.get(`/documents/auto-summary/${documentId}`);
    return response.data;
  },

  async deleteDocument(documentId) {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  },
};

export default documentService;
