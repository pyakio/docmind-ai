import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FiX, FiUserPlus, FiArrowRight } from "react-icons/fi";

const DEFAULT_GOOGLE_ACCOUNTS = [
  {
    name: "Abhay Singh",
    email: "abhay.singh@gmail.com",
    initial: "A",
  },
  {
    name: "Dr. Sarah Chen",
    email: "sarah.chen@gmail.com",
    initial: "S",
  },
  {
    name: "Alex Turner",
    email: "alex.turner@gmail.com",
    initial: "A",
  },
];

export default function GoogleAccountModal({ isOpen, onClose, onSelectAccount, isLoading }) {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");

  if (!isOpen) return null;

  const handleSelectPredefined = (acc) => {
    if (isLoading) return;
    onSelectAccount(acc.email, acc.name);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail.trim() || isLoading) return;
    const name = customName.trim() || customEmail.split("@")[0] || "Google User";
    onSelectAccount(customEmail.trim(), name);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#171717] border border-[#2F2F2F] rounded-2xl p-6 relative text-[#ECECEC]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 p-1 text-[#8E8EA0] hover:text-[#ECECEC] rounded-md hover:bg-[#212121] transition-colors cursor-pointer"
        >
          <FiX className="text-base" />
        </button>

        {/* Google Header */}
        <div className="text-center mb-5">
          <FcGoogle className="text-2xl mx-auto mb-2" />
          <h3 className="text-base font-semibold text-[#ECECEC]">
            Sign in with Google
          </h3>
          <p className="text-xs text-[#8E8EA0] mt-0.5">
            Choose an account for DocMind
          </p>
        </div>

        {!isCustomMode ? (
          <div className="space-y-2">
            {DEFAULT_GOOGLE_ACCOUNTS.map((acc, index) => (
              <button
                key={index}
                type="button"
                disabled={isLoading}
                onClick={() => handleSelectPredefined(acc)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[#212121] hover:bg-[#2A2A2A] border border-[#2F2F2F] transition-colors text-left cursor-pointer group disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-full bg-[#2F2F2F] flex items-center justify-center text-[#ECECEC] font-semibold text-xs shrink-0">
                  {acc.initial}
                </div>
                <div className="truncate flex-1">
                  <p className="text-xs font-medium text-[#ECECEC] truncate">
                    {acc.name}
                  </p>
                  <p className="text-[11px] text-[#8E8EA0] truncate">{acc.email}</p>
                </div>
              </button>
            ))}

            <button
              type="button"
              disabled={isLoading}
              onClick={() => setIsCustomMode(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-transparent hover:bg-[#212121] border border-dashed border-[#3E3E3E] text-[#8E8EA0] hover:text-[#ECECEC] text-xs font-medium transition-colors cursor-pointer mt-2"
            >
              <FiUserPlus className="text-xs" />
              <span>Use another account</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#8E8EA0] mb-1">
                Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-[#212121] border border-[#2F2F2F] text-[#ECECEC] placeholder-[#8E8EA0] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5E5E5E]"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8E8EA0] mb-1">
                Google Email
              </label>
              <input
                type="email"
                placeholder="name@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full bg-[#212121] border border-[#2F2F2F] text-[#ECECEC] placeholder-[#8E8EA0] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5E5E5E]"
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCustomMode(false)}
                className="flex-1 py-2 bg-[#212121] hover:bg-[#2A2A2A] text-[#8E8EA0] hover:text-[#ECECEC] rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading || !customEmail.trim()}
                className="flex-1 py-2 bg-[#ECECEC] hover:bg-white text-[#171717] rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-30 flex items-center justify-center gap-1"
              >
                <span>Continue</span>
                <FiArrowRight />
              </button>
            </div>
          </form>
        )}

        {isLoading && (
          <div className="mt-3 text-center text-xs text-[#8E8EA0]">
            Connecting...
          </div>
        )}
      </div>
    </div>
  );
}
