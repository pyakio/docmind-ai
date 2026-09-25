import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "react-hot-toast";

import { useAuth } from "../features/auth/context/useAuth";
import SocialLoginButtons from "../features/auth/components/SocialLoginButtons";
import GoogleAccountModal from "../features/auth/components/GoogleAccountModal";

function Register() {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.name.trim(), formData.email.trim(), formData.password);
      navigate("/chat");
    } catch (err) {
      toast.error(err.message || "Failed to register account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSelect = async (googleEmail, googleName) => {
    setIsLoading(true);

    try {
      await loginWithGoogle(googleEmail, googleName);
      setIsGoogleModalOpen(false);
      navigate("/chat");
    } catch (err) {
      toast.error(err.message || "Google registration failed");
    } finally {
      setIsLoading(false);
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
          className="text-xs text-[#8E8EA0] hover:text-[#ECECEC] transition-colors"
        >
          Sign in
        </Link>
      </header>

      {/* Main Container */}
      <main className="my-auto py-8 px-4 flex items-center justify-center">
        <div className="w-full max-w-[380px] bg-[#171717] border border-[#2F2F2F] rounded-2xl p-6 sm:p-8">
          <h1 className="text-xl font-semibold text-[#ECECEC] tracking-tight">
            Create an account
          </h1>
          <p className="text-xs text-[#8E8EA0] mt-1 mb-6">
            Get started with document search and chat.
          </p>

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-[#8E8EA0] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-3 text-[#8E8EA0] text-sm" />
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-[#212121] border border-[#2F2F2F] text-[#ECECEC] placeholder-[#8E8EA0] rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#5E5E5E]"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-[#8E8EA0] mb-1.5">
                Email
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 text-[#8E8EA0] text-sm" />
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-[#212121] border border-[#2F2F2F] text-[#ECECEC] placeholder-[#8E8EA0] rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#5E5E5E]"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-[#8E8EA0] mb-1.5">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3 text-[#8E8EA0] text-sm" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-[#212121] border border-[#2F2F2F] text-[#ECECEC] placeholder-[#8E8EA0] rounded-lg pl-9 pr-9 py-2 text-xs focus:outline-none focus:border-[#5E5E5E]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#8E8EA0] hover:text-[#ECECEC] cursor-pointer"
                >
                  {showPassword ? <FiEyeOff className="text-sm" /> : <FiEye className="text-sm" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim() || !formData.email.trim() || !formData.password}
              className="w-full bg-[#ECECEC] hover:bg-white text-[#171717] font-semibold py-2.5 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? "Creating account..." : "Continue"}
            </button>
          </form>

          <div className="relative my-5 flex items-center justify-center">
            <div className="w-full border-t border-[#2F2F2F]" />
            <span className="absolute bg-[#171717] px-2 text-[11px] text-[#8E8EA0]">
              OR
            </span>
          </div>

          <SocialLoginButtons onGoogleClick={() => setIsGoogleModalOpen(true)} />

          <div className="mt-6 text-center text-xs text-[#8E8EA0]">
            Already have an account?{" "}
            <Link to="/login" className="text-[#ECECEC] font-medium hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </main>

      {/* Google Modal */}
      <GoogleAccountModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSelectAccount={handleGoogleSelect}
        isLoading={isLoading}
      />

      <footer className="w-full max-w-5xl mx-auto px-6 py-4 text-center text-xs text-[#8E8EA0]">
        &copy; {new Date().getFullYear()} DocMind AI
      </footer>
    </div>
  );
}

export default Register;