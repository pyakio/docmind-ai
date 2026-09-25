import React, { useRef, useEffect } from "react";
import {
  FiArrowUp,
  FiSquare,
  FiPlus,
  FiX,
  FiFileText,
} from "react-icons/fi";

export default function Composer({
  inputQuery,
  setInputQuery,
  onSend,
  onStop,
  isStreaming,
  activeDocument,
  onDetachDocument,
  onOpenUploadModal,
}) {
  const textareaRef = useRef(null);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputQuery]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && inputQuery.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="w-full max-w-[760px] mx-auto px-4 pb-3 shrink-0">
      {/* Attached Document Context Badge */}
      {activeDocument && (
        <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#2A2A2A] border border-[#383838] text-[#ECECEC] rounded-lg text-xs">
          <FiFileText className="text-[#8E8EA0] text-xs" />
          <span className="truncate max-w-xs font-medium">{activeDocument.filename}</span>
          <button
            type="button"
            onClick={onDetachDocument}
            className="text-[#8E8EA0] hover:text-[#ECECEC] transition-colors cursor-pointer p-0.5"
            title="Remove document context"
          >
            <FiX className="text-xs" />
          </button>
        </div>
      )}

      {/* Single Compact Inline Row Composer */}
      <div className="relative flex items-end gap-1.5 bg-[#2A2A2A] border border-[#383838] focus-within:border-[#4E4E4E] rounded-2xl px-2.5 py-1.5 transition-colors shadow-sm">
        {/* Attach File (+) Inline on Left */}
        <button
          type="button"
          onClick={onOpenUploadModal}
          className="p-1 rounded-lg text-[#8E8EA0] hover:text-[#ECECEC] hover:bg-[#333333] transition-colors cursor-pointer shrink-0 mb-0.5"
          title="Attach document (PDF, TXT, DOCX)"
        >
          <FiPlus className="text-lg" />
        </button>

        {/* Auto-growing Textarea in Middle */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            activeDocument
              ? `Ask about ${activeDocument.filename}...`
              : "Message DocMind..."
          }
          className="flex-1 bg-transparent text-[#ECECEC] placeholder-[#8E8EA0] text-sm resize-none focus:outline-none max-h-48 py-1 px-1 leading-5 min-h-[22px]"
        />

        {/* Send / Stop Button Inline on Right */}
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="w-7 h-7 rounded-full bg-[#ECECEC] text-[#171717] hover:bg-white transition-colors flex items-center justify-center cursor-pointer shrink-0 mb-0.5"
            title="Stop generating"
          >
            <FiSquare className="text-[10px] fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSend}
            disabled={!inputQuery.trim()}
            className="w-7 h-7 rounded-full bg-[#ECECEC] text-[#171717] hover:bg-white disabled:opacity-20 disabled:hover:bg-[#ECECEC] disabled:cursor-not-allowed transition-all flex items-center justify-center cursor-pointer shrink-0 mb-0.5"
            title="Send prompt"
          >
            <FiArrowUp className="text-sm" />
          </button>
        )}
      </div>

      <p className="text-center text-[11px] text-[#8E8EA0] mt-1.5">
        DocMind can make mistakes. Verify important info.
      </p>
    </div>
  );
}
