import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { FiX, FiPlus, FiArrowRight } from "react-icons/fi";

const defaultAccounts = [
  { name: "Abhay Singh", email: "abhay.singh@gmail.com", avatar: "A" },
  { name: "Alex Smith", email: "alex.smith@company.com", avatar: "A" },
];

const GoogleAccountModal = ({ isOpen, onClose, onSelectAccount }) => {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");

  if (!isOpen) return null;

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail) return;

    const derivedName = customName || customEmail.split("@")[0].replace(".", " ");
    onSelectAccount({
      name: derivedName,
      email: customEmail,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-white"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <FiX className="text-xl" />
          </button>

          {/* Google Modal Header */}
          <div className="text-center pb-5 border-b border-zinc-800/80 mb-5">
            <FcGoogle className="text-5xl mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white">Choose a Google Account</h3>
            <p className="text-sm text-zinc-400 mt-1">
              Select an account to start using <strong className="text-zinc-200">DocMind AI</strong>
            </p>
          </div>

          {!isCustomMode ? (
            <div className="space-y-3">
              {/* Account List */}
              {defaultAccounts.map((acc, index) => (
                <button
                  key={index}
                  onClick={() => onSelectAccount(acc)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all text-left group cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-white text-base shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
                    {acc.avatar}
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-sm font-bold text-zinc-100 group-hover:text-cyan-400 transition-colors">
                      {acc.name}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">{acc.email}</p>
                  </div>
                  <FiArrowRight className="text-zinc-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all text-base flex-shrink-0" />
                </button>
              ))}

              {/* Add Custom Account Option */}
              <button
                onClick={() => setIsCustomMode(true)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-dashed border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all text-sm font-semibold cursor-pointer"
              >
                <div className="w-11 h-11 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 flex-shrink-0">
                  <FiPlus className="text-xl" />
                </div>
                <span>Use another email address</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Enter Your Email Address
                </label>
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="flex-1 py-3 px-4 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-2xl text-xs font-semibold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl text-xs font-bold shadow-lg cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GoogleAccountModal;
