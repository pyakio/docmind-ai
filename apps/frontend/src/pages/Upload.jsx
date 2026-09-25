import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUpload, FiFileText, FiCheck, FiArrowRight, FiAlertCircle } from "react-icons/fi";
import { toast } from "react-hot-toast";

import { documentService } from "../features/documents/services/documentService";

function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'uploading' | 'processing' | 'ready' | 'failed'
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const pollStatus = async (docId) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    const maxAttempts = 30;
    let attempts = 0;

    pollingRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await documentService.getDocumentStatus(docId);
        if (res.status === "ready") {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setUploadStatus("ready");
          setUploadResult((prev) => ({ ...prev, ...res }));
          toast.success("Document indexed");
        } else if (res.status === "failed") {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setUploadStatus("failed");
          toast.error(res.error_message || "Document processing failed");
        }
      } catch (err) {
        console.error("Status polling error:", err);
      }

      if (attempts >= maxAttempts) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setUploadStatus("ready");
      }
    }, 1500);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("processing");

    try {
      const data = await documentService.uploadDocument(file);
      setUploadResult(data.document);
      pollStatus(data.document.id);
    } catch (err) {
      setIsUploading(false);
      setUploadStatus(null);
      toast.error(err.response?.data?.detail || "Upload failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#212121] text-[#ECECEC] flex flex-col justify-between selection:bg-[#4E4E4E]">
      {/* Header */}
      <header className="w-full max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-[#ECECEC]">
          <span className="w-6 h-6 rounded-md bg-[#2F2F2F] flex items-center justify-center text-xs text-[#ECECEC] font-bold">
            D
          </span>
          <span>DocMind</span>
        </Link>

        <Link
          to="/chat"
          className="text-xs text-[#8E8EA0] hover:text-[#ECECEC] transition-colors flex items-center gap-1"
        >
          <span>Chat</span>
          <FiArrowRight />
        </Link>
      </header>

      {/* Main Container */}
      <main className="my-auto py-8 px-4 flex items-center justify-center">
        <div className="w-full max-w-md bg-[#171717] border border-[#2F2F2F] rounded-2xl p-6 sm:p-8 text-center">
          <h1 className="text-xl font-semibold text-[#ECECEC] tracking-tight">
            Upload Document
          </h1>
          <p className="text-xs text-[#8E8EA0] mt-1 mb-6">
            Add PDF, DOCX, or TXT files to perform vector indexing.
          </p>

          {!uploadStatus || uploadStatus === "uploading" ? (
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleFileDrop}
                className={`border border-dashed rounded-xl p-8 transition-colors flex flex-col items-center justify-center cursor-pointer ${
                  isDragOver
                    ? "border-[#8E8EA0] bg-[#212121]"
                    : "border-[#3E3E3E] hover:border-[#5E5E5E] bg-[#212121]"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  id="file-upload-input"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.docx,.doc,.txt,.md"
                  className="hidden"
                />
                <FiUpload className="text-2xl text-[#8E8EA0] mb-2" />
                {file ? (
                  <div className="flex items-center gap-2 text-xs text-[#ECECEC] font-medium">
                    <FiFileText />
                    <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-medium text-[#ECECEC]">
                      Click to upload or drag & drop
                    </p>
                    <p className="text-[11px] text-[#8E8EA0] mt-1">
                      PDF, DOCX, TXT, MD (up to 50MB)
                    </p>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={!file || isUploading}
                className="w-full bg-[#ECECEC] hover:bg-white text-[#171717] font-semibold py-2.5 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isUploading ? "Processing..." : "Upload & Index"}
              </button>
            </form>
          ) : uploadStatus === "processing" ? (
            <div className="space-y-3 py-6">
              <div className="w-6 h-6 border-2 border-[#ECECEC] border-t-transparent rounded-full animate-spin mx-auto" />
              <h2 className="text-sm font-semibold text-[#ECECEC]">Indexing Document</h2>
              <p className="text-xs text-[#8E8EA0]">
                Generating local embeddings and storing chunks in ChromaDB.
              </p>
            </div>
          ) : uploadStatus === "ready" ? (
            <div className="space-y-4 py-2">
              <div className="w-8 h-8 bg-[#2F2F2F] text-emerald-400 rounded-full flex items-center justify-center mx-auto text-sm">
                <FiCheck />
              </div>
              <h2 className="text-sm font-semibold text-[#ECECEC]">Indexing Complete</h2>
              <div className="bg-[#212121] border border-[#2F2F2F] p-3 rounded-lg text-left text-xs space-y-1.5">
                <p className="text-[#ECECEC] font-medium truncate">{uploadResult?.filename}</p>
                {uploadResult?.chunk_count ? (
                  <p className="text-[#8E8EA0]">Chunks: <strong className="text-[#ECECEC]">{uploadResult.chunk_count}</strong></p>
                ) : null}
                {uploadResult?.summary ? (
                  <div className="mt-2 p-2.5 bg-[#171717] rounded text-[#8E8EA0] border border-[#2F2F2F] text-[11px] leading-relaxed">
                    <p className="font-semibold text-[#ECECEC] mb-0.5">Summary:</p>
                    <p className="line-clamp-3">{uploadResult.summary}</p>
                  </div>
                ) : null}
              </div>

              <button
                onClick={() => navigate("/chat", { state: { selectedDocId: uploadResult?.id } })}
                className="w-full bg-[#ECECEC] hover:bg-white text-[#171717] font-semibold py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Start Conversation
              </button>
            </div>
          ) : (
            <div className="space-y-3 py-4">
              <div className="w-8 h-8 bg-[#2F2F2F] text-red-400 rounded-full flex items-center justify-center mx-auto text-sm">
                <FiAlertCircle />
              </div>
              <h2 className="text-sm font-semibold text-[#ECECEC]">Processing Failed</h2>
              <p className="text-xs text-[#8E8EA0]">
                {uploadResult?.error_message || "Could not process this file."}
              </p>
              <button
                onClick={() => {
                  setUploadStatus(null);
                  setIsUploading(false);
                }}
                className="px-4 py-2 bg-[#212121] hover:bg-[#2A2A2A] text-[#ECECEC] rounded-lg text-xs font-medium cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full max-w-5xl mx-auto px-6 py-4 text-center text-xs text-[#8E8EA0]">
        &copy; {new Date().getFullYear()} DocMind AI
      </footer>
    </div>
  );
}

export default Upload;