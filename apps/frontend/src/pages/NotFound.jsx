import React from "react";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="min-h-screen bg-[#181818] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="bg-[#212121] border border-white/10 rounded-2xl p-10 max-w-md w-full shadow-2xl">
        <h1 className="text-7xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent mb-4">
          404
        </h1>
        <h2 className="text-xl font-semibold text-white mb-2">
          Page Not Found
        </h2>
        <p className="text-sm text-neutral-400 mb-8 leading-relaxed">
          The page or workspace view you requested does not exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors shadow-lg shadow-blue-500/20"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default NotFound;