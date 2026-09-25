import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

function Hero() {
  return (
    <section className="pt-16 pb-20 md:pt-24 md:pb-28 px-6 max-w-4xl mx-auto text-center">
      {/* Main Headline */}
      <h1 className="text-3xl sm:text-5xl font-semibold text-[#ECECEC] tracking-tight max-w-3xl mx-auto leading-tight">
        Document intelligence with Claude, GPT, and Gemini.
      </h1>

      {/* Subtitle */}
      <p className="mt-4 text-sm sm:text-base text-[#8E8EA0] max-w-xl mx-auto leading-relaxed">
        Upload PDF, DOCX, or text files. Ask questions, extract citations, and synthesize answers across modern language models.
      </p>

      {/* CTA Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/register"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#ECECEC] hover:bg-white text-[#171717] font-semibold text-xs rounded-lg transition-colors cursor-pointer"
        >
          <span>Start free</span>
          <FiArrowRight className="text-xs" />
        </Link>

        <Link
          to="/login"
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#212121] hover:bg-[#2A2A2A] border border-[#2F2F2F] text-[#ECECEC] font-medium text-xs rounded-lg transition-colors cursor-pointer"
        >
          <span>Sign in</span>
        </Link>
      </div>

      {/* Quiet stats/notes */}
      <div className="mt-12 pt-8 border-t border-[#2F2F2F] flex flex-wrap items-center justify-center gap-8 text-xs text-[#8E8EA0]">
        <div>Local ONNX Dense Embeddings</div>
        <div>ChromaDB Vector Store</div>
        <div>Multi-Tenant Document Isolation</div>
      </div>
    </section>
  );
}

export default Hero;