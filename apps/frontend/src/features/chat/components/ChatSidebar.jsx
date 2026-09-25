import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiPlus,
  FiMessageSquare,
  FiFileText,
  FiTrash2,
  FiSearch,
  FiLogOut,
  FiSidebar,
  FiUpload,
  FiClock,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";

function groupThreadsByDate(threads) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const last7Days = today - 86400000 * 7;

  const groups = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    Older: [],
  };

  threads.forEach((t) => {
    const tDate = t.created_at ? new Date(t.created_at).getTime() : Date.now();
    if (tDate >= today) {
      groups.Today.push(t);
    } else if (tDate >= yesterday) {
      groups.Yesterday.push(t);
    } else if (tDate >= last7Days) {
      groups["Previous 7 Days"].push(t);
    } else {
      groups.Older.push(t);
    }
  });

  return groups;
}

export default function ChatSidebar({
  isOpen,
  onToggle,
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
  onDeleteThread,
  documents,
  activeDocumentId,
  onSelectDocument,
  onDeleteDocument,
  onOpenUploadModal,
  user,
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState("chats"); // "chats" | "docs"
  const [searchQuery, setSearchQuery] = useState("");

  const filteredThreads = (threads || []).filter((t) =>
    (t.title || "New Conversation").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = groupThreadsByDate(filteredThreads);

  const filteredDocs = (documents || []).filter((d) =>
    (d.filename || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const threadCount = threads?.length || 0;
  const docCount = documents?.length || 0;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col bg-[#171717] border-r border-[#2F2F2F] transition-all duration-200 ${
          isOpen ? "w-64" : "w-0 md:w-14 overflow-hidden"
        }`}
      >
        {/* Top Header with Wordmark */}
        <div className="h-14 px-3 flex items-center justify-between border-b border-[#2F2F2F] shrink-0">
          {isOpen ? (
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-[#ECECEC] hover:text-white transition-colors">
              <svg
                className="w-4 h-4 text-[#ECECEC]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>DocMind</span>
            </Link>
          ) : (
            <svg
              className="w-4 h-4 text-[#ECECEC] mx-auto"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          )}

          <button
            onClick={onToggle}
            className="p-1.5 text-[#8E8EA0] hover:text-[#ECECEC] hover:bg-[#212121] rounded-md transition-colors cursor-pointer"
            title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <FiSidebar className="text-base" />
          </button>
        </div>

        {isOpen && (
          <div className="p-3 space-y-2 shrink-0">
            {/* New Chat Button */}
            <button
              onClick={onNewChat}
              className="w-full flex items-center justify-between px-3 py-2 bg-[#212121] hover:bg-[#2A2A2A] border border-[#2F2F2F] rounded-lg text-xs font-medium text-[#ECECEC] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <FiPlus className="text-sm text-[#8E8EA0]" />
                <span>New chat</span>
              </span>
              <span className="text-[10px] text-[#8E8EA0] font-mono">⌘K</span>
            </button>

            {/* Switcher Tab: Chats vs Docs without placeholder 0 counters */}
            <div className="flex bg-[#212121] p-0.5 rounded-lg border border-[#2F2F2F] text-xs">
              <button
                onClick={() => setActiveTab("chats")}
                className={`flex-1 py-1 px-2 rounded-md font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "chats"
                    ? "bg-[#2F2F2F] text-[#ECECEC]"
                    : "text-[#8E8EA0] hover:text-[#ECECEC]"
                }`}
              >
                <FiMessageSquare className="text-xs" />
                <span>Chats</span>
                {threadCount > 0 && (
                  <span className="text-[10px] text-[#8E8EA0]">({threadCount})</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("docs")}
                className={`flex-1 py-1 px-2 rounded-md font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "docs"
                    ? "bg-[#2F2F2F] text-[#ECECEC]"
                    : "text-[#8E8EA0] hover:text-[#ECECEC]"
                }`}
              >
                <FiFileText className="text-xs" />
                <span>Docs</span>
                {docCount > 0 && (
                  <span className="text-[10px] text-[#8E8EA0]">({docCount})</span>
                )}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <FiSearch className="absolute left-2.5 top-2 text-[#8E8EA0] text-xs" />
              <input
                type="text"
                placeholder={activeTab === "chats" ? "Search chats..." : "Search docs..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#212121] border border-[#2F2F2F] rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-[#ECECEC] placeholder-[#8E8EA0] focus:outline-none focus:border-[#4E4E4E]"
              />
            </div>
          </div>
        )}

        {/* Middle Content */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-2">
          {isOpen ? (
            activeTab === "chats" ? (
              /* Grouped Chats */
              Object.keys(grouped).every((k) => grouped[k].length === 0) ? (
                <div className="text-left px-2.5 py-2 text-[#8E8EA0] text-xs">
                  {searchQuery ? "No matching chats." : "No conversations yet."}
                </div>
              ) : (
                Object.entries(grouped).map(([groupName, groupItems]) => {
                  if (groupItems.length === 0) return null;
                  return (
                    <div key={groupName} className="space-y-0.5">
                      <div className="px-2.5 py-1 text-[11px] font-semibold text-[#8E8EA0] uppercase tracking-wider">
                        {groupName}
                      </div>
                      {groupItems.map((thread) => {
                        const isActive = thread.id === activeThreadId;
                        return (
                          <div
                            key={thread.id}
                            onClick={() => onSelectThread(thread.id)}
                            className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                              isActive
                                ? "bg-[#212121] text-[#ECECEC] font-medium"
                                : "text-[#8E8EA0] hover:bg-[#212121] hover:text-[#ECECEC]"
                            }`}
                          >
                            <span className="truncate pr-2">{thread.title || "New Conversation"}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteThread(thread.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-[#8E8EA0] hover:text-[#ECECEC] transition-opacity cursor-pointer"
                              title="Delete conversation"
                            >
                              <FiTrash2 className="text-xs" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )
            ) : (
              /* Documents Tab */
              <div className="space-y-1">
                {/* Subtle nav row for upload library */}
                <button
                  type="button"
                  onClick={onOpenUploadModal}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#8E8EA0] hover:text-[#ECECEC] hover:bg-[#212121] transition-colors cursor-pointer text-left"
                >
                  <FiUpload className="text-xs shrink-0" />
                  <span>Upload document</span>
                </button>

                {filteredDocs.length === 0 ? (
                  <div className="text-left px-2.5 py-2 text-[#8E8EA0] text-xs">
                    {searchQuery ? "No matching documents." : "No documents indexed yet."}
                  </div>
                ) : (
                  filteredDocs.map((doc) => {
                    const isSelected = doc.id === activeDocumentId;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => onSelectDocument(isSelected ? null : doc.id)}
                        className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-[#212121] border border-[#3E3E3E] text-[#ECECEC]"
                            : "text-[#8E8EA0] hover:bg-[#212121] hover:text-[#ECECEC]"
                        }`}
                      >
                        <div className="truncate pr-2 text-left">
                          <p className="truncate text-[#ECECEC] font-medium">{doc.filename}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-[#8E8EA0] mt-0.5">
                            {doc.status === "processing" ? (
                              <span className="flex items-center gap-1 text-amber-400">
                                <FiClock className="animate-spin text-[10px]" /> Indexing
                              </span>
                            ) : doc.status === "failed" ? (
                              <span className="flex items-center gap-1 text-red-400">
                                <FiAlertCircle className="text-[10px]" /> Failed
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <FiCheck className="text-[10px] text-emerald-400" /> {doc.chunk_count || 0} chunks
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDocument(doc.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#8E8EA0] hover:text-[#ECECEC] transition-opacity cursor-pointer"
                          title="Delete document"
                        >
                          <FiTrash2 className="text-xs" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )
          ) : (
            /* Collapsed view icons */
            <div className="flex flex-col items-center py-2 space-y-2">
              <button
                onClick={onNewChat}
                className="w-8 h-8 rounded-lg bg-[#212121] hover:bg-[#2A2A2A] text-[#ECECEC] flex items-center justify-center cursor-pointer"
                title="New chat"
              >
                <FiPlus className="text-sm" />
              </button>
              <button
                onClick={() => {
                  onToggle();
                  setActiveTab("docs");
                }}
                className="w-8 h-8 rounded-lg hover:bg-[#212121] text-[#8E8EA0] hover:text-[#ECECEC] flex items-center justify-center cursor-pointer"
                title="Documents"
              >
                <FiFileText className="text-sm" />
              </button>
            </div>
          )}
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-[#2F2F2F] shrink-0">
          {isOpen ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <div className="w-6 h-6 rounded-full bg-[#2F2F2F] flex items-center justify-center text-[11px] font-medium text-[#ECECEC] uppercase shrink-0">
                  {user?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                </div>
                <div className="truncate text-left">
                  <p className="text-xs font-medium text-[#ECECEC] truncate">
                    {user?.full_name || "User"}
                  </p>
                  <p className="text-[10px] text-[#8E8EA0] truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-[#8E8EA0] hover:text-[#ECECEC] hover:bg-[#212121] rounded-md transition-colors cursor-pointer"
                title="Log out"
              >
                <FiLogOut className="text-sm" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogout}
              className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center text-[#8E8EA0] hover:text-[#ECECEC] hover:bg-[#212121] transition-colors cursor-pointer"
              title="Log out"
            >
              <FiLogOut className="text-sm" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
