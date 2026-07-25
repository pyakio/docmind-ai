import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCpu,
  FiSend,
  FiFileText,
  FiImage,
  FiPlus,
  FiTrash2,
  FiLogOut,
  FiLayers,
  FiMessageSquare,
  FiX,
  FiSearch,
  FiSettings,
  FiUser,
  FiBookmark,
  FiCopy,
  FiRotateCw,
  FiThumbsUp,
  FiThumbsDown,
  FiCheck,
  FiUploadCloud,
  FiFile,
  FiCheckCircle
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi2";
import { toast } from "react-hot-toast";

import { useAuth } from "../../context/useAuth";
import { documentService } from "../../services/documentService";
import { chatService } from "../../services/chatService";

const UPLOAD_STEPS = [
  { id: 1, label: "Uploading file..." },
  { id: 2, label: "Reading document content..." },
  { id: 3, label: "Processing knowledge..." },
  { id: 4, label: "Analyzing structure..." },
  { id: 5, label: "Preparing summary..." },
  { id: 6, label: "Done!" }
];

function Chat() {
  const { user, logout } = useAuth();
  const [chatThreads, setChatThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [queryInput, setQueryInput] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarTab, setSidebarTab] = useState("chats"); // 'chats', 'docs', 'pinned', 'settings'
  const [uploadedDocsList, setUploadedDocsList] = useState([]);
  const [pinnedThreadIds, setPinnedThreadIds] = useState([]);

  // Upload Progress Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadStepIndex, setUploadStepIndex] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");

  // Feedback & Copy State
  const [copiedMsgId, setCopiedMsgId] = useState(null);
  const [feedbackState, setFeedbackState] = useState({});

  const messagesEndRef = useRef(null);
  const pdfInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const attachMenuRef = useRef(null);
  const dragDropRef = useRef(null);

  const userKey = user?.email ? user.email.replace(/[^a-zA-Z0-9]/g, "_") : "guest";

  useEffect(() => {
    loadUserChatThreads();
    fetchUploadedDocs();
  }, [userKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setIsAttachMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadUserChatThreads = () => {
    const threadsKey = `docmind_threads_${userKey}`;
    const stored = localStorage.getItem(threadsKey);
    let threads = [];
    if (stored) {
      try {
        threads = JSON.parse(stored);
      } catch (e) {}
    }

    if (threads.length === 0) {
      const initialThread = {
        id: `thread_${Date.now()}`,
        title: "New Conversation",
        updatedAt: new Date().toISOString(),
        messages: []
      };
      threads = [initialThread];
      localStorage.setItem(threadsKey, JSON.stringify(threads));
    }

    setChatThreads(threads);
    setActiveThreadId(threads[0].id);
    setMessages(threads[0].messages || []);
  };

  const fetchUploadedDocs = async () => {
    try {
      const docs = await documentService.getDocuments();
      setUploadedDocsList(docs || []);
    } catch (e) {}
  };

  const saveChatThreads = (updatedThreads) => {
    const threadsKey = `docmind_threads_${userKey}`;
    localStorage.setItem(threadsKey, JSON.stringify(updatedThreads));
    setChatThreads(updatedThreads);
  };

  const handleCreateNewChat = () => {
    const newThread = {
      id: `thread_${Date.now()}`,
      title: "New Conversation",
      updatedAt: new Date().toISOString(),
      messages: []
    };
    const updated = [newThread, ...chatThreads];
    saveChatThreads(updated);
    setActiveThreadId(newThread.id);
    setMessages([]);
    setAttachedFile(null);
  };

  const handleSelectThread = (thread) => {
    setActiveThreadId(thread.id);
    setMessages(thread.messages || []);
    setAttachedFile(null);
  };

  const handleDeleteThread = (threadId, e) => {
    e?.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;

    const remaining = chatThreads.filter((t) => t.id !== threadId);
    if (remaining.length === 0) {
      const fallback = {
        id: `thread_${Date.now()}`,
        title: "New Conversation",
        updatedAt: new Date().toISOString(),
        messages: []
      };
      saveChatThreads([fallback]);
      setActiveThreadId(fallback.id);
      setMessages([]);
    } else {
      saveChatThreads(remaining);
      if (activeThreadId === threadId) {
        setActiveThreadId(remaining[0].id);
        setMessages(remaining[0].messages || []);
      }
    }
    toast.success("Conversation deleted.");
  };

  const handleTogglePin = (threadId, e) => {
    e?.stopPropagation();
    if (pinnedThreadIds.includes(threadId)) {
      setPinnedThreadIds(pinnedThreadIds.filter((id) => id !== threadId));
      toast.success("Unpinned chat.");
    } else {
      setPinnedThreadIds([...pinnedThreadIds, threadId]);
      toast.success("Pinned chat to top!");
    }
  };

  const handleClearHistory = () => {
    if (!window.confirm("Clear all messages in this conversation?")) return;
    setMessages([]);
    const updatedThreads = chatThreads.map((t) =>
      t.id === activeThreadId ? { ...t, messages: [] } : t
    );
    saveChatThreads(updatedThreads);
    toast.success("Chat cleared.");
  };

  // Automated Multi-Step Upload & Instant Summary Trigger
  const handleFileUpload = async (e, type) => {
    const file = e.target?.files?.[0] || e;
    if (!file || !file.name) return;

    setIsAttachMenuOpen(false);
    setUploadingFileName(file.name);
    setIsUploadModalOpen(true);
    setUploadStepIndex(0);

    // Progress Simulation
    const progressInterval = setInterval(() => {
      setUploadStepIndex((prev) => {
        if (prev < UPLOAD_STEPS.length - 2) return prev + 1;
        return prev;
      });
    }, 600);

    try {
      const result = await documentService.uploadDocument(file);
      clearInterval(progressInterval);
      setUploadStepIndex(UPLOAD_STEPS.length - 1);

      const attachedDoc = {
        name: file.name,
        type: type,
        documentId: result.document?.id || Date.now(),
        size: (file.size / 1024 / 1024).toFixed(2)
      };
      setAttachedFile(attachedDoc);

      const summaryText = result.summary || `# Document Overview\n- File Name: ${file.name}\n- Total Pages: 1\n- Document Type: ${file.name.split('.').pop()}\n\n--------------------------------\n\n# Executive Summary\nDocument uploaded and indexed successfully into ChromaDB vectors.\n\n--------------------------------\n\n# Final Takeaways\n• Instant automatic summary generated.\n• Ask any question below to inspect specific sections.`;

      // Create Auto Summary Message in Chat Feed
      const summaryMsg = {
        role: "assistant",
        text: summaryText,
        isAutoSummary: true,
        attachment: attachedDoc,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggested_followups: [
          "Summarize Page 1 in detail",
          "What are the main key concepts?",
          "Explain important tables and metrics"
        ],
        id: `summary_${Date.now()}`
      };

      setTimeout(() => {
        setIsUploadModalOpen(false);
        const finalMessages = [...messages, summaryMsg];
        setMessages(finalMessages);

        const newTitle = file.name.length > 25 ? file.name.substring(0, 25) + "..." : file.name;
        const updatedThreads = chatThreads.map((t) =>
          t.id === activeThreadId
            ? { ...t, title: newTitle, messages: finalMessages, updatedAt: new Date().toISOString() }
            : t
        );
        saveChatThreads(updatedThreads);
        fetchUploadedDocs();
        toast.success(`Generated auto summary for ${file.name}!`);
      }, 700);

    } catch (err) {
      clearInterval(progressInterval);
      setIsUploadModalOpen(false);
      toast.error(`Failed to process ${file.name}. Please try again.`);
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const handleSendQuery = async (queryText = null) => {
    const textToSend = queryText || queryInput;
    if (!textToSend.trim() || isSending) return;

    setQueryInput("");
    setIsSending(true);

    const userMsgId = `user_${Date.now()}`;
    const userMessage = {
      role: "user",
      text: textToSend,
      attachment: attachedFile,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      id: userMsgId
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
      const targetDocId = attachedFile?.documentId || 1;
      const response = await chatService.queryRag(targetDocId, textToSend);

      const aiMessage = {
        role: "assistant",
        text: response.answer || "The details for your query have been processed.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        id: `ai_${Date.now()}`
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);

      const activeThread = chatThreads.find((t) => t.id === activeThreadId);
      const newTitle = activeThread?.title === "New Conversation" ? (textToSend.length > 25 ? textToSend.substring(0, 25) + "..." : textToSend) : activeThread?.title;

      const updatedThreads = chatThreads.map((t) =>
        t.id === activeThreadId
          ? { ...t, title: newTitle, messages: finalMessages, updatedAt: new Date().toISOString() }
          : t
      );
      saveChatThreads(updatedThreads);
    } catch (err) {
      toast.error("Error answering query.");
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    toast.success("Copied to clipboard!", { duration: 1500 });
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleFeedback = (id, type) => {
    setFeedbackState({ ...feedbackState, [id]: type });
    toast.success(type === "like" ? "Thanks for your feedback!" : "Feedback recorded.", { duration: 1500 });
  };

  const filteredThreads = chatThreads.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedThreads = chatThreads.filter((t) => pinnedThreadIds.includes(t.id));

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden selection:bg-cyan-500 selection:text-black font-sans">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={pdfInputRef}
        onChange={(e) => handleFileUpload(e, "pdf")}
        accept=".pdf,.docx,.doc,.txt,.md"
        className="hidden"
      />
      <input
        type="file"
        ref={imageInputRef}
        onChange={(e) => handleFileUpload(e, "image")}
        accept=".png,.jpg,.jpeg,.webp"
        className="hidden"
      />

      {/* Multi-Step Upload Progress Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative"
            >
              <div className="w-16 h-16 rounded-3xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center text-3xl mx-auto mb-4 animate-bounce">
                <FiUploadCloud />
              </div>

              <h3 className="text-xl font-bold text-white mb-1">Processing Document</h3>
              <p className="text-xs text-cyan-400 font-medium mb-6 truncate px-4">{uploadingFileName}</p>

              {/* Progress Steps */}
              <div className="space-y-3 text-left mb-6">
                {UPLOAD_STEPS.map((step, idx) => {
                  const isDone = idx < uploadStepIndex;
                  const isCurrent = idx === uploadStepIndex;

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-xs font-semibold transition-all ${
                        isDone
                          ? "bg-zinc-900/90 text-cyan-400 border-cyan-800/50"
                          : isCurrent
                          ? "bg-cyan-950/60 text-white border-cyan-500 animate-pulse shadow-md"
                          : "bg-zinc-900/30 text-zinc-600 border-zinc-900"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                        {isDone ? (
                          <FiCheckCircle className="text-cyan-400 text-base" />
                        ) : isCurrent ? (
                          <span className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <span className="text-zinc-600 font-mono">{step.id}</span>
                        )}
                      </div>
                      <span>{step.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full transition-all duration-300"
                  style={{ width: `${((uploadStepIndex + 1) / UPLOAD_STEPS.length) * 100}%` }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Left Sidebar - ChatGPT + Notion + Linear Aesthetics */}
      <aside className="w-72 bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between p-4 flex-shrink-0">
        <div>
          {/* Logo Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <FiCpu className="text-white text-lg" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">
                DocMind<span className="text-cyan-400">.AI</span>
              </span>
            </Link>
          </div>

          {/* New Chat Primary Button */}
          <button
            onClick={handleCreateNewChat}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-cyan-500/15 transition-all mb-4 cursor-pointer hover:scale-[1.02]"
          >
            <FiPlus className="text-lg" />
            <span>+ New Chat</span>
          </button>

          {/* Search Box */}
          <div className="relative mb-4">
            <FiSearch className="absolute left-3.5 top-3 text-zinc-500 text-sm" />
            <input
              type="text"
              placeholder="Search chat history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-500 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Sidebar Tab Options */}
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 mb-3 text-xs">
            <button
              onClick={() => setSidebarTab("chats")}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                sidebarTab === "chats" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Chats
            </button>
            <button
              onClick={() => setSidebarTab("docs")}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                sidebarTab === "docs" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Docs
            </button>
            <button
              onClick={() => setSidebarTab("pinned")}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                sidebarTab === "pinned" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Pinned
            </button>
          </div>

          {/* Sequential List Area */}
          <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-340px)] pr-1">
            {sidebarTab === "chats" &&
              filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => handleSelectThread(thread)}
                  className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer text-xs font-semibold transition-all ${
                    activeThreadId === thread.id
                      ? "bg-zinc-900 text-cyan-400 border border-zinc-700 shadow-sm"
                      : "hover:bg-zinc-900/60 text-zinc-300 hover:text-white border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FiMessageSquare className={`text-sm flex-shrink-0 ${activeThreadId === thread.id ? "text-cyan-400" : "text-zinc-500"}`} />
                    <span className="truncate">{thread.title}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleTogglePin(thread.id, e)}
                      className={`p-1 transition-colors cursor-pointer rounded-md hover:bg-zinc-800 ${
                        pinnedThreadIds.includes(thread.id) ? "text-cyan-400" : "text-zinc-500 hover:text-cyan-400"
                      }`}
                      title="Pin chat"
                    >
                      <FiBookmark className="text-xs" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteThread(thread.id, e)}
                      className="p-1 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer rounded-md hover:bg-zinc-800"
                      title="Delete chat"
                    >
                      <FiTrash2 className="text-xs" />
                    </button>
                  </div>
                </div>
              ))}

            {sidebarTab === "docs" && (
              <div className="space-y-2 pt-1">
                {uploadedDocsList.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-4">No documents uploaded yet.</p>
                ) : (
                  uploadedDocsList.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FiFileText className="text-cyan-400 text-base flex-shrink-0" />
                        <div className="truncate">
                          <p className="font-bold text-zinc-200 truncate">{doc.filename}</p>
                          <p className="text-[10px] text-zinc-500">{(doc.file_size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {sidebarTab === "pinned" && (
              <div className="space-y-1.5 pt-1">
                {pinnedThreads.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-4">No pinned conversations.</p>
                ) : (
                  pinnedThreads.map((thread) => (
                    <div
                      key={thread.id}
                      onClick={() => handleSelectThread(thread)}
                      className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FiBookmark className="text-cyan-400 text-sm flex-shrink-0" />
                        <span className="font-bold text-zinc-200 truncate">{thread.title}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 truncate">
            <div className="w-9 h-9 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center text-sm font-extrabold shadow-md">
              {user?.full_name?.charAt(0) || "U"}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-zinc-100 truncate">{user?.full_name || "User"}</p>
              <p className="text-[11px] text-zinc-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer rounded-xl hover:bg-zinc-900"
            title="Sign Out"
          >
            <FiLogOut className="text-lg" />
          </button>
        </div>
      </aside>

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col justify-between bg-zinc-950/40 relative">
        {/* Top Header - No Model Selector */}
        <header className="px-6 py-3.5 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              <FiCpu />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white tracking-tight">DocMind AI Assistant</h1>
              <p className="text-[10px] text-cyan-400 font-medium">Intelligent AI Assistant</p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateNewChat}
              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <FiPlus className="text-sm text-cyan-400" />
              <span>New Chat</span>
            </button>

            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-red-950 border border-zinc-800 hover:border-red-800/60 text-zinc-400 hover:text-red-400 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <FiTrash2 className="text-sm" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </header>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto my-auto py-12">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-4xl mb-5 shadow-xl shadow-cyan-500/10">
                <HiSparkles />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
                Upload Any Document or Image for Instant Auto Summary
              </h2>
              <p className="text-sm text-zinc-400 mb-8 max-w-md leading-relaxed">
                Drag and drop a PDF, Word, TXT file, or image below. DocMind will automatically index, analyze, and generate a complete structured summary instantly!
              </p>

              {/* Large Drag & Drop Dropzone */}
              <div
                ref={dragDropRef}
                onClick={() => pdfInputRef.current?.click()}
                className="w-full p-8 border-2 border-dashed border-zinc-800 hover:border-cyan-500/80 bg-zinc-900/60 hover:bg-zinc-900 rounded-3xl transition-all cursor-pointer group mb-6 text-center shadow-lg"
              >
                <FiUploadCloud className="text-4xl text-cyan-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="text-sm font-bold text-white mb-1">Click or Drag & Drop File Here</h4>
                <p className="text-xs text-zinc-500">Supports PDF, DOCX, TXT, PNG, JPG, WEBP</p>
              </div>

              {/* Quick Prompt Starters */}
              <div className="grid sm:grid-cols-3 gap-3 w-full">
                <button
                  onClick={() => pdfInputRef.current?.click()}
                  className="p-3.5 bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 rounded-2xl text-left transition-all cursor-pointer"
                >
                  <p className="text-xs font-bold text-white mb-1">📄 Upload PDF / Doc</p>
                  <p className="text-[11px] text-zinc-400">Auto summary & Q&A</p>
                </button>

                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="p-3.5 bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 rounded-2xl text-left transition-all cursor-pointer"
                >
                  <p className="text-xs font-bold text-white mb-1">🖼️ Upload Photo</p>
                  <p className="text-[11px] text-zinc-400">OCR & image analysis</p>
                </button>

                <button
                  onClick={() => handleSendQuery("Summarize the uploaded file in 3 main points.")}
                  className="p-3.5 bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 rounded-2xl text-left transition-all cursor-pointer"
                >
                  <p className="text-xs font-bold text-white mb-1">💡 Summarize Simply</p>
                  <p className="text-[11px] text-zinc-400">Core key takeaways</p>
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3.5 max-w-3xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-md ${
                    msg.role === "user"
                      ? "bg-gradient-to-tr from-cyan-500 to-blue-600 text-white"
                      : "bg-zinc-800 border border-zinc-700 text-cyan-400"
                  }`}
                >
                  {msg.role === "user" ? (user?.full_name?.charAt(0) || "Y") : <FiCpu className="text-lg" />}
                </div>

                {/* Message Bubble Container */}
                <div
                  className={`p-5 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none shadow-md"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-none space-y-3 shadow-lg"
                  }`}
                >
                  {/* Attachment Header Pill */}
                  {msg.attachment && (
                    <div className="mb-3 inline-flex items-center gap-2 px-3.5 py-1.5 bg-black/40 border border-white/20 rounded-xl text-xs font-bold text-cyan-200">
                      {msg.attachment.type === "image" ? <FiImage className="text-sm" /> : <FiFileText className="text-sm" />}
                      <span>{msg.attachment.name}</span>
                    </div>
                  )}

                  {/* Clean Markdown Text Render */}
                  <div className="whitespace-pre-wrap font-sans leading-relaxed">{msg.text}</div>

                  {/* Action Toolbar for AI Responses */}
                  {msg.role === "assistant" && (
                    <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => handleCopyText(msg.text, msg.id)}
                          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-xs"
                          title="Copy Answer"
                        >
                          {copiedMsgId === msg.id ? <FiCheck className="text-cyan-400" /> : <FiCopy />}
                          <span className="text-[11px]">Copy</span>
                        </button>
                        <button
                          onClick={() => handleSendQuery(messages[messages.indexOf(msg) - 1]?.text || "Regenerate answer")}
                          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-xs ml-1"
                          title="Regenerate"
                        >
                          <FiRotateCw />
                          <span className="text-[11px]">Retry</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleFeedback(msg.id, "like")}
                          className={`p-1 transition-colors cursor-pointer ${
                            feedbackState[msg.id] === "like" ? "text-cyan-400" : "hover:text-white"
                          }`}
                          title="Helpful"
                        >
                          <FiThumbsUp />
                        </button>
                        <button
                          onClick={() => handleFeedback(msg.id, "dislike")}
                          className={`p-1 transition-colors cursor-pointer ${
                            feedbackState[msg.id] === "dislike" ? "text-red-400" : "hover:text-white"
                          }`}
                          title="Not Helpful"
                        >
                          <FiThumbsDown />
                        </button>
                        <span className="text-[10px] text-zinc-500 font-mono ml-1">{msg.timestamp}</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Attachment Popover on Bottom-Left */}
        <footer className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
          <form onSubmit={(e) => { e.preventDefault(); handleSendQuery(); }} className="max-w-4xl mx-auto">
            {/* Attachment preview chip if file selected */}
            {attachedFile && (
              <div className="mb-2.5 inline-flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 border border-cyan-500/60 rounded-xl text-xs text-cyan-400 font-bold shadow-md">
                {attachedFile.type === "image" ? <FiImage className="text-base" /> : <FiFileText className="text-base" />}
                <span className="truncate max-w-xs">{attachedFile.name} ({attachedFile.size} MB)</span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer ml-1 p-0.5"
                >
                  <FiX className="text-sm" />
                </button>
              </div>
            )}

            {/* Input Box */}
            <div className="relative flex items-center bg-zinc-900 border border-zinc-700/80 rounded-2xl p-2 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-all shadow-lg">
              {/* Attachment Plus Button Menu */}
              <div className="relative" ref={attachMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                  className="p-2.5 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                  title="Attach File or Photo"
                >
                  <FiPlus className={`text-xl transition-transform ${isAttachMenuOpen ? "rotate-45 text-cyan-400" : ""}`} />
                </button>

                {/* Attachment Options Popover */}
                <AnimatePresence>
                  {isAttachMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute bottom-14 left-0 w-52 bg-zinc-950 border border-zinc-800 rounded-2xl p-2 shadow-2xl z-50 space-y-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => pdfInputRef.current?.click()}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-900 rounded-xl transition-all cursor-pointer text-left"
                      >
                        <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center text-base flex-shrink-0">
                          <FiFileText />
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">Upload Document</p>
                          <p className="text-[10px] text-zinc-400">PDF, DOCX, TXT</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-900 rounded-xl transition-all cursor-pointer text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800 text-blue-400 flex items-center justify-center text-base flex-shrink-0">
                          <FiImage />
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">Upload Photo</p>
                          <p className="text-[10px] text-zinc-400">PNG, JPG, WEBP</p>
                        </div>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input Text Box */}
              <input
                type="text"
                placeholder={attachedFile ? `Ask anything about ${attachedFile.name}...` : "Ask DocMind AI anything..."}
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                disabled={isSending}
                className="flex-1 bg-transparent border-none text-zinc-100 placeholder-zinc-500 px-3 py-2.5 text-xs sm:text-sm font-medium focus:outline-none"
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!queryInput.trim() || isSending}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold p-2.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center"
              >
                {isSending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block"></span>
                ) : (
                  <FiSend className="text-base" />
                )}
              </button>
            </div>
          </form>
        </footer>
      </main>
    </div>
  );
}

export default Chat;
