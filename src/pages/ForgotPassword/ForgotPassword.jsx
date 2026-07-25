import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiMail, FiCpu, FiArrowLeft, FiSend, FiCheckCircle } from "react-icons/fi";
import { toast } from "react-hot-toast";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    toast.loading("Sending password reset link...", { id: "reset-toast" });

    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      toast.success("Password reset link sent to your email!", { id: "reset-toast" });
    }, 1200);
  };

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col justify-between overflow-hidden selection:bg-cyan-500 selection:text-black">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-600/20 via-blue-600/10 to-transparent blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
            <FiCpu className="text-xl text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            DocMind<span className="text-cyan-400">.AI</span>
          </span>
        </Link>

        <Link
          to="/login"
          className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-full px-4 py-2"
        >
          <FiArrowLeft />
          <span>Back to Sign In</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-10 my-auto py-8 px-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-zinc-950/80 backdrop-blur-2xl border border-zinc-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/20"
        >
          {!isSubmitted ? (
            <>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Reset Password
              </h1>
              <p className="text-sm text-zinc-400 mt-1 mb-6">
                Enter your registered email address and we'll send you instructions to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <FiMail className="text-lg" />
                    </div>
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <FiSend />
                      <span>Send Reset Link</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-cyan-950/80 border border-cyan-800 text-cyan-400 rounded-full flex items-center justify-center mx-auto text-2xl">
                <FiCheckCircle />
              </div>
              <h2 className="text-2xl font-bold text-white">Check Your Inbox</h2>
              <p className="text-sm text-zinc-400">
                We've sent a password reset link to <strong className="text-zinc-200">{email}</strong>.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-xs text-cyan-400 hover:underline cursor-pointer pt-2"
              >
                Didn't get the email? Try again
              </button>
            </div>
          )}

          <div className="mt-8 text-center text-xs text-zinc-400">
            Remember your password?{" "}
            <Link
              to="/login"
              className="text-cyan-400 font-semibold hover:text-cyan-300 hover:underline transition-colors"
            >
              Sign In
            </Link>
          </div>
        </motion.div>
      </main>

      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 text-center text-xs text-zinc-500">
        &copy; {new Date().getFullYear()} DocMind AI. All rights reserved.
      </footer>
    </div>
  );
}

export default ForgotPassword;