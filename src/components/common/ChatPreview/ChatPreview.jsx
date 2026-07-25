import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiFileText, FiSend, FiCpu, FiCheck, FiArrowRight } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi2";

function ChatPreview() {
  const [activeTab, setActiveTab] = useState(0);

  const demoScenarios = [
    {
      docName: "Science_Homework_Grade7.pdf",
      question: "Can you explain photosynthesis in 3 simple points?",
      answer: "1. Plants take in sunlight, water, and air (carbon dioxide).\n2. They use sunlight to make food (sugar) to grow.\n3. In return, plants release clean oxygen for us to breathe!"
    },
    {
      docName: "Blood_Test_Report.pdf",
      question: "Summarize this medical report simply.",
      answer: "1. Vitamin D & Thyroid: Normal reference ranges.\n2. Hemoglobin: 14.2 g/dL (Healthy level).\n3. Recommendation: Stay hydrated and maintain your current balanced diet!"
    },
    {
      docName: "User_Manual.pdf",
      question: "How do I turn on night mode?",
      answer: "Press and hold the top power button for 3 seconds until the blue light blinks twice. Night mode is now activated!"
    }
  ];

  const currentDemo = demoScenarios[activeTab];

  return (
    <section id="chat" className="py-16 md:py-24 px-6 max-w-5xl mx-auto text-center">
      <div className="mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-semibold mb-3">
          <HiSparkles />
          <span>Interactive Preview</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          See It in Action
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2">
          Click any example below to see how DocMind explains complex files simply.
        </p>
      </div>

      {/* Demo Tab Buttons */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {demoScenarios.map((item, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === idx
                ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
                : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
            }`}
          >
            <FiFileText />
            <span>{item.docName.split("_")[0]} Demo</span>
          </button>
        ))}
      </div>

      {/* Demo Card Mockup */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-left max-w-3xl mx-auto relative overflow-hidden">
        {/* Document Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
            <FiFileText className="text-cyan-400 text-base" />
            <span>{currentDemo.docName}</span>
          </div>
          <span className="text-[10px] px-2.5 py-1 bg-cyan-950 border border-cyan-800 text-cyan-400 rounded-full font-bold">
            ChromaDB RAG Ready
          </span>
        </div>

        {/* Message Feed */}
        <div className="space-y-4 mb-6">
          {/* User Message */}
          <div className="flex items-start gap-3 justify-end">
            <div className="bg-cyan-600 text-white p-3.5 rounded-2xl rounded-tr-none text-xs sm:text-sm max-w-lg leading-relaxed shadow-md font-medium">
              {currentDemo.question}
            </div>
            <div className="w-8 h-8 rounded-xl bg-cyan-600 flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
              You
            </div>
          </div>

          {/* AI Response */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 text-cyan-400 flex items-center justify-center text-sm flex-shrink-0 font-bold">
              <FiCpu />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 p-4 rounded-2xl rounded-tl-none text-xs sm:text-sm leading-relaxed max-w-lg whitespace-pre-wrap">
              {currentDemo.answer}
            </div>
          </div>
        </div>

        {/* Bottom CTA Bar */}
        <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-zinc-400">Want to test with your own PDF or photo?</span>
          <Link
            to="/login"
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer"
          >
            <span>Try With Your Files</span>
            <FiArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ChatPreview;