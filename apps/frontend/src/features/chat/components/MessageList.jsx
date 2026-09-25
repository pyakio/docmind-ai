import React, { useState } from "react";
import {
  FiCopy,
  FiCheck,
  FiRotateCw,
  FiThumbsUp,
  FiThumbsDown,
  FiFileText,
} from "react-icons/fi";
import { toast } from "react-hot-toast";

const SUGGESTIONS = [
  "Summarize a PDF document",
  "Explain a clause in a contract",
  "Compare findings across research",
  "Extract key takeaways from notes",
];

function renderInlineText(text) {
  if (!text) return null;
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\(Source:\s*[^)]+\))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-[#2A2A2A] text-[#E0E0E0] font-mono text-xs border border-[#383838]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("(Source:") && part.endsWith(")")) {
      return (
        <span
          key={i}
          className="inline-flex items-center gap-1 px-2 py-0.5 my-0.5 mx-1 rounded-md bg-[#2F2F2F] text-[#8E8EA0] text-xs font-mono"
        >
          <FiFileText className="text-[10px]" />
          <span>{part.replace(/[()]/g, "")}</span>
        </span>
      );
    }
    return part;
  });
}

function FormattedContent({ content }) {
  const [copiedCodeIdx, setCopiedCodeIdx] = useState(null);

  if (!content) return null;

  // Split code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 leading-7 text-[15px] text-[#ECECEC]">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const lines = part.slice(3, -3).trim().split("\n");
          const firstLine = lines[0].trim();
          const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
          const lang = hasLang ? firstLine : "";
          const codeBody = hasLang ? lines.slice(1).join("\n") : lines.join("\n");

          const handleCopyCode = () => {
            navigator.clipboard.writeText(codeBody);
            setCopiedCodeIdx(index);
            toast.success("Code copied");
            setTimeout(() => setCopiedCodeIdx(null), 2000);
          };

          return (
            <div key={index} className="my-3 rounded-lg overflow-hidden border border-[#2F2F2F] bg-[#171717] font-mono text-xs">
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#1F1F1F] border-b border-[#2F2F2F] text-[#8E8EA0]">
                <span className="text-[11px] font-mono lowercase">{lang || "code"}</span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 hover:text-[#ECECEC] transition-colors cursor-pointer text-[11px]"
                >
                  {copiedCodeIdx === index ? <FiCheck className="text-emerald-400" /> : <FiCopy />}
                  <span>{copiedCodeIdx === index ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <pre className="p-3.5 overflow-x-auto text-[#ECECEC] font-mono text-xs leading-5">
                <code>{codeBody}</code>
              </pre>
            </div>
          );
        }

        // Process text paragraphs and markdown lines
        const paragraphs = part.split("\n\n");
        return (
          <React.Fragment key={index}>
            {paragraphs.map((para, pIdx) => {
              const trimmed = para.trim();
              if (!trimmed) return null;

              // Headings
              if (trimmed.startsWith("### ")) {
                return (
                  <h3 key={pIdx} className="text-base font-semibold text-white mt-3 mb-1">
                    {renderInlineText(trimmed.slice(4))}
                  </h3>
                );
              }
              if (trimmed.startsWith("## ")) {
                return (
                  <h2 key={pIdx} className="text-lg font-semibold text-white mt-4 mb-1">
                    {renderInlineText(trimmed.slice(3))}
                  </h2>
                );
              }
              if (trimmed.startsWith("# ")) {
                return (
                  <h1 key={pIdx} className="text-xl font-bold text-white mt-4 mb-1">
                    {renderInlineText(trimmed.slice(2))}
                  </h1>
                );
              }

              // Bullet points
              const lines = trimmed.split("\n");
              const isList = lines.every((l) => /^\s*[-*•]\s+/.test(l) || /^\s*\d+\.\s+/.test(l));
              if (isList) {
                return (
                  <ul key={pIdx} className="space-y-1 my-2 pl-4 list-disc text-[15px] leading-6 text-[#ECECEC]">
                    {lines.map((l, lIdx) => {
                      const cleanLine = l.replace(/^\s*[-*•\d.]+\s+/, "");
                      return <li key={lIdx}>{renderInlineText(cleanLine)}</li>;
                    })}
                  </ul>
                );
              }

              return (
                <p key={pIdx} className="whitespace-pre-wrap leading-7">
                  {renderInlineText(trimmed)}
                </p>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function MessageList({
  messages,
  isStreaming,
  streamingContent,
  onRegenerate,
  activeDocument,
  onSelectSuggestion,
}) {
  const [copiedMsgId, setCopiedMsgId] = useState(null);
  const [feedback, setFeedback] = useState({});

  const handleCopyMessage = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleFeedback = (id, type) => {
    setFeedback((prev) => ({ ...prev, [id]: type }));
    toast.success(type === "up" ? "Feedback recorded" : "Feedback recorded");
  };

  // Empty State with Quiet Suggestion Chips
  if (!messages || (messages.length === 0 && !isStreaming)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-[700px] mx-auto w-full">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#ECECEC] tracking-tight mb-2">
          What can I help with?
        </h1>
        {activeDocument && (
          <div className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2A2A2A] border border-[#383838] text-xs text-[#8E8EA0]">
            <FiFileText className="text-xs" />
            <span>Active context: <strong className="text-[#ECECEC]">{activeDocument.filename}</strong></span>
          </div>
        )}

        {/* Suggestion Chips */}
        <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-lg">
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSuggestion && onSelectSuggestion(s)}
              className="px-3 py-1.5 rounded-full bg-[#2A2A2A] hover:bg-[#333333] border border-[#383838] text-xs text-[#8E8EA0] hover:text-[#ECECEC] transition-colors cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-[720px] w-full mx-auto">
      {messages.map((msg, index) => {
        const msgKey = msg.id || index;

        return (
          <div key={msgKey} className="space-y-4">
            {/* User Message: The ONLY bubble in the UI */}
            <div className="flex justify-end">
              <div className="bg-[#2F2F2F] text-[#ECECEC] px-4 py-2.5 rounded-2xl max-w-[80%] text-[15px] leading-6">
                <p className="whitespace-pre-wrap">{msg.question}</p>
                {msg.document_name && (
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-[#8E8EA0]">
                    <FiFileText className="text-[10px]" />
                    <span className="truncate">{msg.document_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Assistant Message: Plain text column, no card, no bubble */}
            <div className="flex items-start gap-3 group">
              <div className="w-5 h-5 rounded-md bg-[#2F2F2F] flex items-center justify-center text-[10px] font-semibold text-[#ECECEC] shrink-0 mt-1">
                <svg
                  className="w-3 h-3 text-[#ECECEC]"
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
              </div>

              <div className="flex-1 space-y-2 min-w-0">
                <FormattedContent content={msg.answer} />

                {/* Quiet Action Toolbar */}
                <div className="flex items-center gap-3 text-[#8E8EA0] text-xs pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleCopyMessage(msgKey, msg.answer)}
                    className="hover:text-[#ECECEC] transition-colors flex items-center gap-1 cursor-pointer"
                    title="Copy response"
                  >
                    {copiedMsgId === msgKey ? <FiCheck className="text-emerald-400" /> : <FiCopy />}
                    <span className="text-[11px]">{copiedMsgId === msgKey ? "Copied" : "Copy"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRegenerate(msg.question)}
                    className="hover:text-[#ECECEC] transition-colors flex items-center gap-1 cursor-pointer"
                    title="Retry"
                  >
                    <FiRotateCw />
                    <span className="text-[11px]">Retry</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFeedback(msgKey, "up")}
                    className={`hover:text-[#ECECEC] transition-colors cursor-pointer ${
                      feedback[msgKey] === "up" ? "text-[#ECECEC]" : ""
                    }`}
                    title="Helpful"
                  >
                    <FiThumbsUp />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFeedback(msgKey, "down")}
                    className={`hover:text-[#ECECEC] transition-colors cursor-pointer ${
                      feedback[msgKey] === "down" ? "text-[#ECECEC]" : ""
                    }`}
                    title="Not helpful"
                  >
                    <FiThumbsDown />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Streaming Ongoing Assistant Message */}
      {isStreaming && (
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-md bg-[#2F2F2F] flex items-center justify-center text-[10px] font-semibold text-[#ECECEC] shrink-0 mt-1">
            <svg
              className="w-3 h-3 text-[#ECECEC]"
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
          </div>

          <div className="flex-1 min-w-0">
            {streamingContent ? (
              <div>
                <FormattedContent content={streamingContent} />
                <span className="inline-block w-2 h-4 bg-[#ECECEC] animate-pulse ml-0.5 align-middle" />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[#8E8EA0] text-sm py-1">
                <span className="inline-block w-2 h-4 bg-[#8E8EA0] animate-pulse" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
