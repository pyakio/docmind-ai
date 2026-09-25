import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiFileText, FiArrowRight } from "react-icons/fi";

function ChatPreview() {
  const [activeTab, setActiveTab] = useState(0);

  const demoScenarios = [
    {
      docName: "System_Architecture.pdf",
      question: "How are vector embeddings indexed?",
      answer: "Text is chunked into 500-character segments with 50-character overlap. Each chunk is embedded using ChromaDB's ONNX dense vector model (all-MiniLM-L6-v2) and indexed into a dedicated tenant collection.\n\n(Source: System_Architecture.pdf, Page 1)"
    },
    {
      docName: "Financial_Report_Q4.pdf",
      question: "What was the operating margin for Q4?",
      answer: "The operating margin reached 24.8% for Q4, representing a 3.2% year-over-year expansion driven by infrastructure optimizations.\n\n(Source: Financial_Report_Q4.pdf, Page 3)"
    }
  ];

  const currentDemo = demoScenarios[activeTab];

  return (
    <section id="features" className="py-16 px-6 max-w-4xl mx-auto border-t border-[#2F2F2F]">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#ECECEC] tracking-tight">
            Preview
          </h2>
          <p className="text-xs text-[#8E8EA0] mt-0.5">
            Document Q&A with exact source page citations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {demoScenarios.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === idx
                  ? "bg-[#2F2F2F] text-[#ECECEC]"
                  : "text-[#8E8EA0] hover:text-[#ECECEC]"
              }`}
            >
              {item.docName.split("_")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Demo Mockup */}
      <div className="bg-[#171717] border border-[#2F2F2F] rounded-2xl p-5 sm:p-6 text-left space-y-4">
        <div className="flex items-center gap-2 text-xs text-[#8E8EA0] pb-3 border-b border-[#2F2F2F]">
          <FiFileText className="text-xs" />
          <span className="text-[#ECECEC] font-medium">{currentDemo.docName}</span>
        </div>

        {/* User bubble */}
        <div className="flex justify-end">
          <div className="bg-[#2F2F2F] text-[#ECECEC] px-3.5 py-2 rounded-2xl max-w-[85%] text-xs">
            {currentDemo.question}
          </div>
        </div>

        {/* Assistant response */}
        <div className="flex items-start gap-2.5">
          <div className="w-5 h-5 rounded-full bg-[#2F2F2F] flex items-center justify-center text-[10px] font-bold text-[#ECECEC] shrink-0 mt-0.5">
            D
          </div>
          <div className="text-xs text-[#ECECEC] leading-6 whitespace-pre-wrap">
            {currentDemo.answer}
          </div>
        </div>

        <div className="pt-3 border-t border-[#2F2F2F] flex items-center justify-between text-xs text-[#8E8EA0]">
          <span>Ready to test with your own files?</span>
          <Link
            to="/login"
            className="text-[#ECECEC] font-medium hover:underline flex items-center gap-1"
          >
            <span>Open workspace</span>
            <FiArrowRight className="text-xs" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ChatPreview;