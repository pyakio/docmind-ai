import React from "react";
import { FcGoogle } from "react-icons/fc";

const SocialLoginButtons = ({ onGoogleLogin }) => {
  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onGoogleLogin}
        className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-500 rounded-2xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-cyan-500/10 group cursor-pointer text-sm"
      >
        <FcGoogle className="text-2xl group-hover:scale-110 transition-transform duration-200" />
        <span>Continue with Google</span>
      </button>
    </div>
  );
};

export default SocialLoginButtons;
