import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiUploadCloud, FiFileText, FiCheckCircle, FiArrowRight, FiCpu } from "react-icons/fi";
import { toast } from "react-hot-toast";

import { documentService } from "../../services/documentService";

function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

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

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    toast.loading("Uploading and indexing document in ChromaDB...", { id: "upload-page" });

    try {
      const data = await documentService.uploadDocument(file);
      setUploadResult(data.document);
      toast.success("Document successfully indexed in ChromaDB!", { id: "upload-page" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed", { id: "upload-page" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between relative selection:bg-cyan-500 selection:text-black">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-600/20 via-blue-600/10 to-transparent blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <FiCpu className="text-xl text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            DocMind<span className="text-cyan-400">.AI</span>
          </span>
        </Link>

        <Link
          to="/chat"
          className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 bg-zinc-900/60 border border-zinc-800 rounded-full px-4 py-2"
        >
          <span>Go to RAG Chat</span>
          <FiArrowRight />
        </Link>
      </header>

      {/* Main Upload Workspace */}
      <main className="relative z-10 my-auto py-8 px-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl bg-zinc-950/80 backdrop-blur-2xl border border-zinc-800 rounded-3xl p-8 shadow-2xl shadow-cyan-950/20 text-center"
        >
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Upload & Index Document
          </h1>
          <p className="text-xs text-zinc-400 mt-1 mb-6">
            Upload PDF, DOCX, or TXT files to perform LangChain chunking and store embeddings in ChromaDB.
          </p>

          {!uploadResult ? (
            <form onSubmit={handleUploadSubmit} className="space-y-6">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center cursor-pointer ${
                  isDragOver
                    ? "border-cyan-500 bg-cyan-950/30"
                    : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
                }`}
                onClick={() => document.getElementById("file-upload-input").click()}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.docx,.doc,.txt,.md"
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-800 text-cyan-400 flex items-center justify-center text-2xl mb-3 shadow-md">
                  <FiUploadCloud />
                </div>
                {file ? (
                  <div className="flex items-center gap-2 text-sm text-cyan-400 font-medium">
                    <FiFileText />
                    <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-zinc-200">
                      Click to upload or drag & drop file
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Supports PDF, DOCX, TXT, MD (Max 50MB)
                    </p>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={!file || isUploading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Index Document in ChromaDB</span>
                    <FiArrowRight />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4 py-4">
              <div className="w-14 h-14 bg-cyan-950 border border-cyan-800 text-cyan-400 rounded-full flex items-center justify-center mx-auto text-2xl">
                <FiCheckCircle />
              </div>
              <h2 className="text-xl font-bold text-white">Indexing Complete!</h2>
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-left text-xs space-y-2">
                <p className="text-zinc-300 font-medium">📄 {uploadResult.filename}</p>
                <p className="text-zinc-500">Vector Collection: <code className="text-cyan-400">{uploadResult.vector_collection}</code></p>
                <p className="text-zinc-500">LangChain Chunks Indexed: <strong className="text-white">{uploadResult.chunk_count}</strong></p>
              </div>

              <button
                onClick={() => navigate("/chat")}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Start Multi-LLM Chat</span>
                <FiArrowRight />
              </button>
            </div>
          )}
        </motion.div>
      </main>

      <footer className="relative z-10 py-4 text-center text-xs text-zinc-500">
        &copy; {new Date().getFullYear()} DocMind AI. Powered by ChromaDB & OpenAI.
      </footer>
    </div>
  );
}

export default Upload;