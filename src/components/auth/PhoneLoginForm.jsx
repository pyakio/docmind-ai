import React, { useState, useEffect, useRef } from "react";
import { FiSmartphone, FiArrowLeft, FiRefreshCw, FiCheckCircle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

const countryCodes = [
  { code: "+1", label: "🇺🇸 US (+1)" },
  { code: "+91", label: "🇮🇳 IN (+91)" },
  { code: "+44", label: "🇬🇧 UK (+44)" },
  { code: "+61", label: "🇦🇺 AU (+61)" },
  { code: "+49", label: "🇩🇪 DE (+49)" },
  { code: "+81", label: "🇯🇵 JP (+81)" },
  { code: "+86", label: "🇨🇳 CN (+86)" },
  { code: "+971", label: "🇦🇪 UAE (+971)" },
];

const PhoneLoginForm = ({ onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Phone Entry, 2: OTP Entry
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const otpInputs = useRef([]);

  // Timer Countdown Effect
  useEffect(() => {
    let interval = null;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  const handleSendOtp = (e) => {
    e?.preventDefault();
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 8) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    toast.loading("Sending Verification Code...", { id: "phone-otp" });

    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
      setTimer(30);
      setIsTimerActive(true);
      toast.success(`OTP code sent to ${countryCode} ${phoneNumber}`, { id: "phone-otp" });
      
      // Auto focus first OTP input box
      setTimeout(() => {
        otpInputs.current[0]?.focus();
      }, 100);
    }, 1200);
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto move to next input
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      otpInputs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = (e) => {
    e?.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter complete 6-digit OTP code");
      return;
    }

    setIsLoading(true);
    toast.loading("Verifying OTP Code...", { id: "phone-otp" });

    setTimeout(() => {
      setIsLoading(false);
      toast.success("Phone verification successful! Welcome back.", { id: "phone-otp" });
      if (onSuccess) onSuccess({ phone: `${countryCode} ${phoneNumber}` });
    }, 1500);
  };

  const handleResendOtp = () => {
    if (isTimerActive) return;
    setOtp(["", "", "", "", "", ""]);
    setTimer(30);
    setIsTimerActive(true);
    toast.loading("Resending OTP...", { id: "phone-otp" });
    setTimeout(() => {
      toast.success("New verification code sent!", { id: "phone-otp" });
      otpInputs.current[0]?.focus();
    }, 1000);
  };

  return (
    <AnimatePresence mode="wait">
      {step === 1 ? (
        <motion.form
          key="step1"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.2 }}
          onSubmit={handleSendOtp}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Phone Number
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
              >
                {countryCodes.map((c) => (
                  <option key={c.code} value={c.code} className="bg-zinc-900 text-white">
                    {c.label}
                  </option>
                ))}
              </select>

              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <FiSmartphone className="text-lg" />
                </div>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  required
                />
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              We'll send a 6-digit verification code via SMS to this number.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !phoneNumber.trim()}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              "Send Verification Code"
            )}
          </button>
        </motion.form>
      ) : (
        <motion.form
          key="step2"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          onSubmit={handleVerifyOtp}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <FiArrowLeft /> Change number
            </button>
            <span className="text-xs text-zinc-400">
              Sent to: <strong className="text-zinc-200">{countryCode} {phoneNumber}</strong>
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Enter 6-Digit Security Code
            </label>
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputs.current[idx] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-11 h-12 text-center text-xl font-bold bg-zinc-900 border border-zinc-700 text-cyan-400 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
            <span>Didn't receive code?</span>
            {isTimerActive ? (
              <span className="text-zinc-500">Resend in {timer}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <FiRefreshCw /> Resend Code
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.join("").length !== 6}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <FiCheckCircle className="text-lg" />
                <span>Verify & Login</span>
              </>
            )}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
};

export default PhoneLoginForm;
