import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCpu, FiArrowRight } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi2";
import { toast } from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import SocialLoginButtons from "../../components/auth/SocialLoginButtons";

function Register() {
  const navigate = useNavigate();
  const { register, loginWithSocialSimulated } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    agreeTerms: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (!formData.agreeTerms) {
      toast.error("You must agree to the Terms of Service.");
      return;
    }

    setIsLoading(true);
    toast.loading("Creating your DocMind AI account...", { id: "register-toast" });

    try {
      await register(formData.name, formData.email, formData.password);
      toast.success("Account created successfully! Welcome to DocMind AI.", { id: "register-toast" });
      navigate("/chat");
    } catch (err) {
      toast.error(err.message || "Failed to register account", { id: "register-toast" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSocialLogin = () => {
    toast.loading("Connecting to Google OAuth...", { id: "social-auth" });
    setTimeout(() => {
      loginWithSocialSimulated("Google", "Google User", "google.user@docmind.ai");
      toast.success("Google Account Linked! Redirecting...", { id: "social-auth" });
      navigate("/chat", { replace: true });
    }, 1000);
  };

  const handleGithubSocialLogin = () => {
    toast.loading("Connecting to GitHub...", { id: "social-auth" });
    setTimeout(() => {
      loginWithSocialSimulated("GitHub", "GitHub Developer", "github.user@docmind.ai");
      toast.success("GitHub Account Linked! Redirecting...", { id: "social-auth" });
      navigate("/chat", { replace: true });
    }, 1000);
  };

  const handleAppleSocialLogin = () => {
    toast.loading("Connecting to Apple ID...", { id: "social-auth" });
    setTimeout(() => {
      loginWithSocialSimulated("Apple", "Apple User", "apple.user@docmind.ai");
      toast.success("Apple ID Linked! Redirecting...", { id: "social-auth" });
      navigate("/chat", { replace: true });
    }, 1000);
  };

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col justify-between overflow-hidden selection:bg-cyan-500 selection:text-black">
      {/* Ambient Glows */}
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
          <span>Sign In</span>
          <FiArrowRight />
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-cyan-400 text-xs font-medium mb-4">
            <HiSparkles className="text-cyan-400 animate-pulse" />
            <span>Get Started in Seconds</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Create Your Account
          </h1>
          <p className="text-sm text-zinc-400 mt-1 mb-6">
            Join thousands using AI to analyze documents effortlessly.
          </p>

          <SocialLoginButtons
            onGoogleLogin={handleGoogleSocialLogin}
            onGithubLogin={handleGithubSocialLogin}
            onAppleLogin={handleAppleSocialLogin}
          />

          <div className="relative my-6 flex items-center justify-center">
            <div className="w-full border-t border-zinc-800" />
            <span className="absolute bg-zinc-950 px-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
              Or Sign Up With Email
            </span>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <FiUser className="text-lg" />
                </div>
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Email */}
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
                  name="email"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Create Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <FiLock className="text-lg" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  {showPassword ? <FiEyeOff className="text-lg" /> : <FiEye className="text-lg" />}
                </button>
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="flex items-center text-xs pt-1">
              <label className="flex items-center gap-2 text-zinc-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-black cursor-pointer"
                />
                <span>
                  I agree to the{" "}
                  <a href="#" className="text-cyan-400 hover:underline">
                    Terms of Service
                  </a>
                </span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Create Account</span>
                  <FiArrowRight />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-zinc-400">
            Already have an account?{" "}
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

export default Register;