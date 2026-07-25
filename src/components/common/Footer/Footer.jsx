import React from "react";
import { Link } from "react-router-dom";
import { FiCpu } from "react-icons/fi";

function Footer() {
  return (
    <footer id="about" className="border-t border-zinc-900 bg-black py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-base">
            <FiCpu />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            DocMind<span className="text-cyan-400">.AI</span>
          </span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-6 text-xs text-zinc-400 font-medium">
          <Link to="/" className="hover:text-cyan-400 transition-colors">Home</Link>
          <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">How It Works</a>
          <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
          <Link to="/login" className="hover:text-cyan-400 transition-colors">Sign In</Link>
        </div>

        {/* Copyright */}
        <div className="text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} DocMind AI. Built for everyone.
        </div>
      </div>
    </footer>
  );
}

export default Footer;