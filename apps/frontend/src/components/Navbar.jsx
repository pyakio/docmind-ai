import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

function Navbar() {
  return (
    <nav className="flex justify-between items-center px-6 sm:px-10 py-4 border-b border-[#2F2F2F] bg-[#171717] sticky top-0 z-50">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2.5">
        <span className="w-6 h-6 rounded-md bg-[#2F2F2F] flex items-center justify-center text-xs text-[#ECECEC] font-bold">
          D
        </span>
        <span className="text-sm font-semibold tracking-tight text-[#ECECEC]">
          DocMind
        </span>
      </Link>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center gap-6 text-xs text-[#8E8EA0] font-medium">
        <a href="#how-it-works" className="hover:text-[#ECECEC] transition-colors">
          How it works
        </a>
        <a href="#features" className="hover:text-[#ECECEC] transition-colors">
          Features
        </a>
      </div>

      {/* Primary Action Button */}
      <div className="flex items-center gap-3">
        <Link
          to="/login"
          className="text-xs text-[#8E8EA0] hover:text-[#ECECEC] font-medium px-2 py-1 transition-colors"
        >
          Sign in
        </Link>
        <Link
          to="/register"
          className="flex items-center gap-1.5 bg-[#ECECEC] hover:bg-white text-[#171717] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          <span>Get started</span>
          <FiArrowRight className="text-xs" />
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;