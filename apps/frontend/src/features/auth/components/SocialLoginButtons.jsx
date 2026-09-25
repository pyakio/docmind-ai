import React from "react";
import { FcGoogle } from "react-icons/fc";

const SocialLoginButtons = ({ onGoogleClick }) => {
  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onGoogleClick}
        className="w-full flex items-center justify-center gap-2.5 px-3 py-2 bg-[#212121] hover:bg-[#2A2A2A] border border-[#2F2F2F] rounded-lg font-medium text-[#ECECEC] transition-colors cursor-pointer text-xs"
      >
        <FcGoogle className="text-base shrink-0" />
        <span>Continue with Google</span>
      </button>
    </div>
  );
};

export default SocialLoginButtons;
