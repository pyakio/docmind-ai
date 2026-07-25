import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FiCpu, FiArrowRight } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi2";
import { toast } from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import SocialLoginButtons from "../../components/auth/SocialLoginButtons";
import GoogleAccountModal from "../../components/auth/GoogleAccountModal";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithSocialSimulated } = useAuth();

  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const from = location.state?.from?.pathname || "/chat";

  const handleGoogleClick = () => {
    setIsGoogleModalOpen(true);
  };

  const handleSelectGoogleAccount = (account) => {
    setIsGoogleModalOpen(false);
    toast.loading(`Signing in as ${account.name}...`, { id: "google-auth" });

    setTimeout(() => {
      loginWithSocialSimulated("Google", account.name, account.email);
      toast.success(`Welcome, ${account.name}!`, { id: "google-auth" });
      navigate(from, { replace: true });
    }, 800);
  };

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col justify-between overflow-hidden selection:bg-cyan-500 selection:text-black">
      {/* Google Account Selector Modal */}
      <GoogleAccountModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSelectAccount={handleSelectGoogleAccount}
      />

      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-600/20 via-blue-600/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[450px] h-[450px] bg-purple-600/15 blur-[140px] pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
            <FiCpu className="text-xl text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            DocMind<span className="text-cyan-400">.AI</span>
          </span>
        </Link>

        <Link
          to="/"
          className="text-xs text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800 rounded-full px-4 py-2 font-medium"
        >
          <span>Back to Home</span>
          <FiArrowRight />
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-10 my-auto py-8 px-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-zinc-950/90 backdrop-blur-2xl border border-zinc-800 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-cyan-950/20 relative text-center"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-semibold mb-6">
            <HiSparkles className="text-cyan-400 animate-pulse text-sm" />
            <span>Easy & Simple Document Reader</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            Welcome to DocMind
          </h1>
          <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
            Click below to sign in with Google and start asking questions about any document or photo!
          </p>

          {/* Primary Google Login Button ONLY */}
          <div className="py-2">
            <SocialLoginButtons onGoogleLogin={handleGoogleClick} />
          </div>

          {/* Safe & Private Badge */}
          <div className="mt-8 pt-6 border-t border-zinc-900 flex items-center justify-center gap-2 text-xs text-zinc-500">
            <span>🔒 Safe, secure & private authentication</span>
          </div>
        </motion.div>
      </main>

      {/* Page Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 text-center text-xs text-zinc-500">
        &copy; {new Date().getFullYear()} DocMind AI. Simple document assistant for everyone.
      </footer>
    </div>
  );
}

export default Login;