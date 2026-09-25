import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  FiFileText,
  FiUpload,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiChevronDown,
} from "react-icons/fi";

import { useAuth } from "../features/auth/context/useAuth";
import { chatService, AVAILABLE_MODELS, DEFAULT_MODEL_ID } from "../features/chat/services/chatService";
import { documentService } from "../features/documents/services/documentService";

import ChatSidebar from "../features/chat/components/ChatSidebar";
import MessageList from "../features/chat/components/MessageList";
import Composer from "../features/chat/components/Composer";

export default function Chat() {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Layout State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Threads & Messages
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);

  // Documents
  const [documents, setDocuments] = useState([]);
  const [activeDocumentId, setActiveDocumentId] = useState(null);

  // Model Selection
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL_ID);
  const [inputQuery, setInputQuery] = useState("");

  // Streaming State
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Upload Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'uploading' | 'processing' | 'ready' | 'failed'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, isStreaming]);

  // Clean up polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Initial Load
  useEffect(() => {
    const initData = async () => {
      try {
        const [threadData, docData] = await Promise.all([
          chatService.listThreads(),
          documentService.getDocuments(),
        ]);
        setThreads(threadData || []);
        setDocuments(docData || []);
        if (threadData && threadData.length > 0) {
          selectThread(threadData[0].id);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };
    initData();
  }, []);

  // Handle document pre-selection
  useEffect(() => {
    if (location.state?.selectedDocId) {
      setActiveDocumentId(location.state.selectedDocId);
    }
  }, [location.state]);

  const loadThreads = async () => {
    try {
      const data = await chatService.listThreads();
      setThreads(data || []);
    } catch (err) {
      console.error("Failed to load threads:", err);
    }
  };

  const loadDocuments = async () => {
    try {
      const data = await documentService.getDocuments();
      setDocuments(data || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  };

  const selectThread = async (threadId) => {
    setActiveThreadId(threadId);
    setStreamingContent("");
    setIsStreaming(false);

    try {
      const msgs = await chatService.getThreadMessages(threadId);
      setMessages(msgs || []);
    } catch (err) {
      console.error("Failed to load thread messages:", err);
      toast.error("Failed to load conversation.");
    }
  };

  const handleNewChat = () => {
    setActiveThreadId(null);
    setMessages([]);
    setStreamingContent("");
    setIsStreaming(false);
  };

  const handleDeleteThread = async (threadId) => {
    try {
      await chatService.deleteThread(threadId);
      const updated = threads.filter((t) => t.id !== threadId);
      setThreads(updated);
      if (activeThreadId === threadId) {
        if (updated.length > 0) {
          selectThread(updated[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error("Delete thread error:", err);
      toast.error("Failed to delete conversation.");
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await documentService.deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      if (activeDocumentId === docId) {
        setActiveDocumentId(null);
      }
    } catch (err) {
      console.error("Delete document error:", err);
      toast.error("Failed to delete document.");
    }
  };

  // Chat Execution with SSE Streaming
  const handleSendMessage = async (customQuery = null) => {
    const queryToSend = (customQuery || inputQuery).trim();
    if (!queryToSend || isStreaming) return;

    setInputQuery("");

    const activeDocObj = documents.find((d) => d.id === activeDocumentId);
    const selectedModelObj = AVAILABLE_MODELS.find((m) => m.id === selectedModelId) || AVAILABLE_MODELS[0];

    const tempUserMsg = {
      id: `temp_${Date.now()}`,
      question: queryToSend,
      answer: "",
      document_id: activeDocumentId,
      document_name: activeDocObj ? activeDocObj.filename : null,
      model_used: selectedModelObj.label,
      created_at: new Date().toISOString(),
    };

    setIsStreaming(true);
    setStreamingContent("");

    abortControllerRef.current = new AbortController();
    let accumulatedAnswer = "";

    await chatService.streamChat({
      threadId: activeThreadId,
      documentId: activeDocumentId,
      question: queryToSend,
      modelProvider: selectedModelObj.provider.toLowerCase(),
      modelName: selectedModelObj.id,
      signal: abortControllerRef.current.signal,
      onToken: (token) => {
        accumulatedAnswer += token;
        setStreamingContent((prev) => prev + token);
      },
      onDone: (data) => {
        setIsStreaming(false);
        setStreamingContent("");
        const newMsg = {
          ...tempUserMsg,
          id: data.message_id || Date.now(),
          answer: accumulatedAnswer,
          thread_id: data.thread_id,
        };
        setMessages((prev) => [...prev, newMsg]);

        if (!activeThreadId && data.thread_id) {
          setActiveThreadId(data.thread_id);
          loadThreads();
        }
      },
      onError: (err) => {
        setIsStreaming(false);
        setStreamingContent("");
        toast.error(err.message || "Failed to generate answer.");
      },
    });
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      if (streamingContent) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            question: inputQuery || "Question",
            answer: streamingContent,
            created_at: new Date().toISOString(),
          },
        ]);
      }
      setStreamingContent("");
    }
  };

  // Upload Polling
  const pollUploadStatus = async (docId) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    const maxAttempts = 30;
    let attempts = 0;

    pollingIntervalRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await documentService.getDocumentStatus(docId);
        if (res.status === "ready") {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          setUploadStatus("ready");
          setIsUploading(false);
          loadDocuments();
          setActiveDocumentId(docId);
        } else if (res.status === "failed") {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          setUploadStatus("failed");
          setIsUploading(false);
          toast.error(res.error_message || "Document processing failed");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }

      if (attempts >= maxAttempts) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsUploading(false);
        setUploadStatus("ready");
        loadDocuments();
      }
    }, 1500);
  };

  const handleUploadFileSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadStatus("processing");

    try {
      const data = await documentService.uploadDocument(uploadFile);
      pollUploadStatus(data.document.id);
    } catch (err) {
      setIsUploading(false);
      setUploadStatus("failed");
      toast.error(err.response?.data?.detail || "Upload failed");
    }
  };

  const activeDocObj = documents.find((d) => d.id === activeDocumentId);
  const activeThread = threads.find((t) => t.id === activeThreadId);

  return (
    <div className="flex h-screen bg-[#212121] text-[#ECECEC] overflow-hidden selection:bg-[#4E4E4E]">
      {/* Sidebar */}
      <ChatSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={selectThread}
        onNewChat={handleNewChat}
        onDeleteThread={handleDeleteThread}
        documents={documents}
        activeDocumentId={activeDocumentId}
        onSelectDocument={(id) => setActiveDocumentId(id)}
        onDeleteDocument={handleDeleteDocument}
        onOpenUploadModal={() => {
          setUploadFile(null);
          setUploadStatus(null);
          setIsUploadModalOpen(true);
        }}
        user={user}
        onLogout={logout}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative bg-[#212121]">
        {/* Header */}
        <header className="h-14 border-b border-[#2F2F2F] px-4 flex items-center justify-between shrink-0 bg-[#212121]">
          <div className="flex items-center gap-3">
            {/* Show title only when thread has a generated title */}
            {activeThread?.title && (
              <span className="text-xs sm:text-sm font-medium text-[#ECECEC] truncate max-w-xs sm:max-w-md">
                {activeThread.title}
              </span>
            )}
          </div>

          {/* Model Selector & Context Pill */}
          <div className="flex items-center gap-2">
            {activeDocObj && (
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-[#2A2A2A] border border-[#383838] rounded-md text-xs text-[#8E8EA0]">
                <FiFileText className="text-[11px]" />
                <span className="truncate max-w-[120px] text-[#ECECEC]">{activeDocObj.filename}</span>
              </div>
            )}

            {/* Clean Model Selector Dropdown */}
            <div className="relative">
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="bg-[#2A2A2A] hover:bg-[#333333] border border-[#383838] text-[#ECECEC] rounded-lg px-2.5 py-1 text-xs font-medium appearance-none pr-6 focus:outline-none focus:border-[#4E4E4E] cursor-pointer"
              >
                <optgroup label="Anthropic Claude">
                  {AVAILABLE_MODELS.filter((m) => m.provider === "Anthropic").map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="OpenAI">
                  {AVAILABLE_MODELS.filter((m) => m.provider === "OpenAI").map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Google Gemini">
                  {AVAILABLE_MODELS.filter((m) => m.provider === "Google").map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </optgroup>
              </select>
              <FiChevronDown className="absolute right-2 top-2 text-[#8E8EA0] pointer-events-none text-xs" />
            </div>
          </div>
        </header>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <MessageList
            messages={messages}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
            onRegenerate={(question) => handleSendMessage(question)}
            activeDocument={activeDocObj}
            onSelectSuggestion={(suggestion) => handleSendMessage(suggestion)}
          />
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Composer */}
        <Composer
          inputQuery={inputQuery}
          setInputQuery={setInputQuery}
          onSend={() => handleSendMessage()}
          onStop={handleStopGeneration}
          isStreaming={isStreaming}
          activeDocument={activeDocObj}
          onDetachDocument={() => setActiveDocumentId(null)}
          onOpenUploadModal={() => {
            setUploadFile(null);
            setUploadStatus(null);
            setIsUploadModalOpen(true);
          }}
        />
      </main>

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-none z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#171717] border border-[#2F2F2F] rounded-2xl p-6 relative text-[#ECECEC]">
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute right-4 top-4 p-1 text-[#8E8EA0] hover:text-[#ECECEC] rounded-md hover:bg-[#212121] transition-colors cursor-pointer"
            >
              <FiX className="text-base" />
            </button>

            <h3 className="text-base font-semibold text-[#ECECEC] mb-1">
              Upload Document
            </h3>
            <p className="text-xs text-[#8E8EA0] mb-4">
              Add a PDF, DOCX, or TXT file to chat with its contents.
            </p>

            {!uploadStatus || uploadStatus === "uploading" ? (
              <form onSubmit={handleUploadFileSubmit} className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-[#383838] hover:border-[#4E4E4E] bg-[#212121] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    id="modal-file-picker"
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,.md"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  {uploadFile ? (
                    <div className="flex items-center gap-2 text-xs font-medium text-[#ECECEC]">
                      <FiFileText className="text-sm text-[#8E8EA0]" />
                      <span>{uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  ) : (
                    <>
                      <FiUpload className="text-xl text-[#8E8EA0] mb-2" />
                      <p className="text-xs text-[#ECECEC] font-medium">Choose a file to upload</p>
                      <p className="text-[11px] text-[#8E8EA0] mt-0.5">PDF, DOCX, TXT (up to 50MB)</p>
                    </>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!uploadFile || isUploading}
                  className="w-full bg-[#ECECEC] hover:bg-white text-[#171717] font-semibold py-2 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {isUploading ? "Uploading..." : "Upload & Process"}
                </button>
              </form>
            ) : uploadStatus === "processing" ? (
              <div className="text-center py-6 space-y-2">
                <div className="w-6 h-6 border-2 border-[#ECECEC] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-medium text-[#ECECEC]">Processing document...</p>
                <p className="text-[11px] text-[#8E8EA0]">Extracting text and building vector indexes.</p>
              </div>
            ) : uploadStatus === "ready" ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-8 h-8 rounded-full bg-[#2A2A2A] text-emerald-400 flex items-center justify-center mx-auto text-sm">
                  <FiCheck />
                </div>
                <p className="text-xs font-medium text-[#ECECEC]">Document ready for questions</p>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-1.5 bg-[#ECECEC] hover:bg-white text-[#171717] rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Start Asking
                </button>
              </div>
            ) : (
              <div className="text-center py-4 space-y-3">
                <div className="w-8 h-8 rounded-full bg-[#2A2A2A] text-red-400 flex items-center justify-center mx-auto text-sm">
                  <FiAlertCircle />
                </div>
                <p className="text-xs font-medium text-[#ECECEC]">Processing failed</p>
                <button
                  onClick={() => {
                    setUploadStatus(null);
                    setUploadFile(null);
                  }}
                  className="px-4 py-1.5 bg-[#2A2A2A] hover:bg-[#333333] text-[#ECECEC] rounded-lg text-xs font-medium cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
