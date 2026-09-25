import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiMail, FiArrowLeft, FiCheck } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { authService } from "../features/auth/services/authService";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      await authService.forgotPassword(email.trim());
      setIsLoading(false);
      setIsSubmitted(true);
    } catch (err) {
      setIsLoading(false);
      toast.error(err.response?.data?.detail || "Failed to process request.");
    }
  };

  return (
    <div className="min-h-screen bg-[#212121] text-[#ECECEC] flex flex-col justify-between selection:bg-[#4E4E4E]">
      {/* Header */}
      <header className="w-full max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-[#ECECEC]">
          <span className="w-6 h-6 rounded-md bg-[#2F2F2F] flex items-center justify-center text-xs text-[#ECECEC] font-bold">
            D
          </span>
          <span>DocMind</span>
        </Link>

        <Link
          to="/login"
          className="text-xs text-[#8E8EA0] hover:text-[#ECECEC] transition-colors flex items-center gap-1"
        >
          <FiArrowLeft />
          <span>Back to log in</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="my-auto py-8 px-4 flex items-center justify-center">
        <div className="w-full max-w-[380px] bg-[#171717] border border-[#2F2F2F] rounded-2xl p-6 sm:p-8">
          {!isSubmitted ? (
            <>
              <h1 className="text-xl font-semibold text-[#ECECEC] tracking-tight">
                Reset your password
              </h1>
              <p className="text-xs text-[#8E8EA0] mt-1 mb-6">
                Enter your email address to receive reset instructions.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#8E8EA0] mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-3 text-[#8E8EA0] text-sm" />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#212121] border border-[#2F2F2F] text-[#ECECEC] placeholder-[#8E8EA0] rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#5E5E5E]"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full bg-[#ECECEC] hover:bg-white text-[#171717] font-semibold py-2.5 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed mt-2"
                >
                  {isLoading ? "Sending..." : "Send instructions"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-3 space-y-3">
              <div className="w-8 h-8 bg-[#2F2F2F] text-emerald-400 rounded-full flex items-center justify-center mx-auto text-sm">
                <FiCheck />
              </div>
              <h2 className="text-base font-semibold text-[#ECECEC]">Check your inbox</h2>
              <p className="text-xs text-[#8E8EA0]">
                If an account exists for <strong className="text-[#ECECEC]">{email}</strong>, instructions have been generated.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-xs text-[#8E8EA0] hover:text-[#ECECEC] underline cursor-pointer pt-2"
              >
                Try another email
              </button>
            </div>
          )}

          <div className="mt-6 text-center text-xs text-[#8E8EA0]">
            Remember your password?{" "}
            <Link to="/login" className="text-[#ECECEC] font-medium hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-5xl mx-auto px-6 py-4 text-center text-xs text-[#8E8EA0]">
        &copy; {new Date().getFullYear()} DocMind AI
      </footer>
    </div>
  );
}

export default ForgotPassword;