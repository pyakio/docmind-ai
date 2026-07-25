import React from "react";
import { Link } from "react-router-dom";
import { FiCpu, FiArrowRight } from "react-icons/fi";

function Navbar() {
  return (
    <nav className="flex justify-between items-center px-6 sm:px-10 py-4 border-b border-zinc-800/80 bg-black/80 backdrop-blur-xl sticky top-0 z-50">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
          <FiCpu className="text-xl text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">
          DocMind<span className="text-cyan-400">.AI</span>
        </span>
      </Link>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center gap-8 text-sm font-medium">
        <Link to="/" className="text-zinc-300 hover:text-cyan-400 transition-colors">
          Home
        </Link>
        <a href="#features" className="text-zinc-300 hover:text-cyan-400 transition-colors">
          Features
        </a>
        <a href="#how-it-works" className="text-zinc-300 hover:text-cyan-400 transition-colors">
          How It Works
        </a>
      </div>

      {/* Primary Action Button */}
      <div className="flex items-center gap-3">
        <Link
          to="/login"
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <span>Start Free</span>
          <FiArrowRight className="text-base" />
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;