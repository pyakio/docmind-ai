import React from "react";
import { FiUploadCloud, FiCpu, FiMessageCircle, FiShield, FiZap, FiSmile } from "react-icons/fi";

function Features() {
  const steps = [
    {
      num: "1",
      icon: <FiUploadCloud className="text-cyan-400 text-3xl" />,
      title: "1. Upload File or Photo",
      desc: "Drag and drop any PDF document, homework notes, or photo. Supports files from your phone or computer."
    },
    {
      num: "2",
      icon: <FiCpu className="text-blue-400 text-3xl" />,
      title: "2. AI Reads It Instantly",
      desc: "DocMind reads through all pages, diagrams, and text in seconds without you needing to skim."
    },
    {
      num: "3",
      icon: <FiMessageCircle className="text-purple-400 text-3xl" />,
      title: "3. Get Simple Answers",
      desc: "Ask any question in plain English. Get simple explanations, bullet point summaries, or translations."
    }
  ];

  const highlights = [
    {
      icon: <FiSmile className="text-emerald-400 text-2xl" />,
      title: "Super Simple to Use",
      desc: "Designed so kids, parents, and grandparents can get answers without any technical confusion."
    },
    {
      icon: <FiZap className="text-yellow-400 text-2xl" />,
      title: "Lightning Fast Results",
      desc: "Get summaries and answers in under 2 seconds powered by ChatGPT, Gemini, and Llama."
    },
    {
      icon: <FiShield className="text-cyan-400 text-2xl" />,
      title: "Private & Confidential",
      desc: "Your files stay strictly private to your account and can be permanently deleted anytime."
    }
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 px-6 max-w-7xl mx-auto">
      {/* 3 Step Workflow */}
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          How Simple Is It?
        </h2>
        <p className="text-sm sm:text-base text-zinc-400 mt-2 max-w-xl mx-auto">
          3 easy steps to read and understand any file in seconds.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-20">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="bg-zinc-950/80 border border-zinc-800 rounded-3xl p-8 text-left hover:border-zinc-700 transition-all hover:scale-[1.02] shadow-xl relative"
          >
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
              {step.icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Why People Love DocMind */}
      <div id="features" className="text-center mb-12 pt-8 border-t border-zinc-900">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Why Everyone Loves DocMind
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2">
          Built with clarity, speed, and security at its core.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        {highlights.map((item, idx) => (
          <div
            key={idx}
            className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 text-left hover:border-zinc-700 transition-all"
          >
            <div className="mb-4">{item.icon}</div>
            <h4 className="text-base font-bold text-white mb-1.5">{item.title}</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Features;