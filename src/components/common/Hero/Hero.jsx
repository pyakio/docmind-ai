import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiUploadCloud, FiCheckCircle } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi2";
import { FcGoogle } from "react-icons/fc";

function Hero() {
  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-6 max-w-7xl mx-auto text-center overflow-hidden">
      {/* Ambient Decorative Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-cyan-500/20 via-blue-600/10 to-transparent blur-[120px] pointer-events-none" />

      {/* Main Pill Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-semibold mb-6">
        <HiSparkles className="text-cyan-400 animate-pulse text-sm" />
        <span>Designed for Students, Professionals & Families</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-[1.15]">
        Read & Understand Any <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">Document in Seconds</span>
      </h1>

      {/* Friendly Subtitle */}
      <p className="mt-6 text-base sm:text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed font-normal">
        Drop any PDF, homework note, or photo. Ask questions in simple words and get clear, easy-to-understand answers instantly.
      </p>

      {/* Large CTA Buttons */}
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          to="/login"
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base rounded-2xl shadow-xl shadow-cyan-500/25 transition-all hover:scale-[1.03] cursor-pointer"
        >
          <FcGoogle className="text-2xl" />
          <span>Try Free with Google</span>
          <FiArrowRight className="text-lg" />
        </Link>

        <a
          href="#how-it-works"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-semibold text-base rounded-2xl transition-all hover:scale-[1.02] cursor-pointer"
        >
          <span>See How It Works</span>
        </a>
      </div>

      {/* Trust Badges */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400 font-medium">
        <div className="flex items-center gap-1.5">
          <FiCheckCircle className="text-cyan-400 text-sm" />
          <span>No credit card required</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FiCheckCircle className="text-cyan-400 text-sm" />
          <span>100% Private & Secure</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FiCheckCircle className="text-cyan-400 text-sm" />
          <span>Works on Phones, Tablets & Computers</span>
        </div>
      </div>
    </section>
  );
}

export default Hero;