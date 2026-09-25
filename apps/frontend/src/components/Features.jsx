import React from "react";
import { FiUpload, FiCpu, FiMessageSquare } from "react-icons/fi";

function Features() {
  const steps = [
    {
      num: "01",
      icon: <FiUpload className="text-[#8E8EA0] text-lg" />,
      title: "Upload & Ingest",
      desc: "Fast background chunking and dense ONNX vector embedding into ChromaDB."
    },
    {
      num: "02",
      icon: <FiCpu className="text-[#8E8EA0] text-lg" />,
      title: "Model Dispatching",
      desc: "Route queries dynamically across Anthropic Claude, OpenAI, or Google Gemini."
    },
    {
      num: "03",
      icon: <FiMessageSquare className="text-[#8E8EA0] text-lg" />,
      title: "Cited Answers",
      desc: "Real-time SSE token streaming with page-level citations for every response."
    }
  ];

  return (
    <section id="how-it-works" className="py-16 px-6 max-w-4xl mx-auto border-t border-[#2F2F2F]">
      <div className="mb-10 text-left">
        <h2 className="text-xl font-semibold text-[#ECECEC] tracking-tight">
          How it works
        </h2>
        <p className="text-xs text-[#8E8EA0] mt-1">
          Simple three-stage retrieval-augmented generation pipeline.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="bg-[#171717] border border-[#2F2F2F] rounded-xl p-5 text-left space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-[#212121] flex items-center justify-center">
                {step.icon}
              </div>
              <span className="text-[11px] font-mono text-[#8E8EA0]">{step.num}</span>
            </div>
            <h3 className="text-sm font-semibold text-[#ECECEC]">{step.title}</h3>
            <p className="text-xs text-[#8E8EA0] leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Features;