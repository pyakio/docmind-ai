import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="border-t border-[#2F2F2F] bg-[#171717] py-8 px-6">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8E8EA0]">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-[#2F2F2F] flex items-center justify-center text-[10px] text-[#ECECEC] font-bold">
            D
          </span>
          <span className="text-[#ECECEC] font-medium">DocMind AI</span>
        </div>

        <div className="flex items-center gap-6">
          <Link to="/" className="hover:text-[#ECECEC] transition-colors">Home</Link>
          <Link to="/login" className="hover:text-[#ECECEC] transition-colors">Sign in</Link>
          <Link to="/register" className="hover:text-[#ECECEC] transition-colors">Sign up</Link>
        </div>

        <div>
          &copy; {new Date().getFullYear()} DocMind AI
        </div>
      </div>
    </footer>
  );
}

export default Footer;