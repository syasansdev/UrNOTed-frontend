import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, Lock, Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import API from "../services/api";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export default function Login() {
  const { login, emailLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const [submitting, setSubmitting] = useState(false);
  const [loginType, setLoginType] = useState("trainer_placement"); // "trainer_placement" | "admin"
  const [emailOnly, setEmailOnly] = useState("");
  const [emailOnlyError, setEmailOnlyError] = useState("");
  const [mode, setMode] = useState("login"); // "login" | "forgot" | "reset"
  const [emailForReset, setEmailForReset] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot password states
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  // Reset password states
  const [resetLoading, setResetLoading] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" }
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await login(data.email, data.password);
      toast.success("Welcome back!");
      if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        if (res?.user?.role === "STUDENT") {
          navigate("/profile");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  const onEmailOnlySubmit = async (e) => {
    e.preventDefault();
    setEmailOnlyError("");
    if (!emailOnly || !emailOnly.trim()) {
      setEmailOnlyError("Please enter your authorized email ID");
      return;
    }

    setSubmitting(true);
    try {
      const res = await emailLogin(emailOnly.trim());
      toast.success("Welcome to URNOted!");
      if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        if (res?.user?.role === "STUDENT") {
          navigate("/profile");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Your email ID has not been authorized. Please contact the administrator.";
      setEmailOnlyError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error("Please enter your email address");
      return;
    }
    setForgotLoading(true);
    try {
      await API.post("/auth/forgot-password", { email: forgotEmail });
      setEmailForReset(forgotEmail);
      toast.success("Verification code sent to your email!");
      setMode("reset");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send verification code");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetCode || !newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setResetLoading(true);
    try {
      await API.post("/auth/reset-password", {
        email: emailForReset,
        code: resetCode,
        newPassword
      });
      toast.success("Password reset successfully! Please log in.");
      setMode("login");
      setLoginType("admin");
      setResetCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  if (mode === "forgot") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Forgot Password
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Enter your admin email address to receive a verification code
          </p>
        </div>

        <form onSubmit={handleForgotSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                placeholder="admin@example.com"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={forgotLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all duration-150 cursor-pointer"
          >
            {forgotLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending Code...</span>
              </>
            ) : (
              <span>Send Verification Code</span>
            )}
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setMode("login")}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (mode === "reset") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Reset Password
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            We sent a verification code to <strong>{emailForReset}</strong>. Enter the code and your new password below.
          </p>
        </div>

        <form onSubmit={handleResetSubmit} className="space-y-4">
          {/* Verification Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Verification Code
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
                <KeyRound size={16} />
              </span>
              <input
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                placeholder="Enter 6-digit code"
                required
              />
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              New Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
                <Lock size={16} />
              </span>
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border rounded-lg text-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                placeholder="Min 6 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none transition-colors duration-150 cursor-pointer"
              >
                {showNewPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
                <Lock size={16} />
              </span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border rounded-lg text-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                placeholder="Confirm password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none transition-colors duration-150 cursor-pointer"
              >
                {showConfirmPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={resetLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all duration-150 cursor-pointer"
          >
            {resetLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Resetting...</span>
              </>
            ) : (
              <span>Reset Password</span>
            )}
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setMode("login")}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Sign In
        </h2>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Select role and sign in to URNOted
        </p>
      </div>

      {/* Role Selection Tabs */}
      <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => {
            setLoginType("passwordless");
            setEmailOnlyError("");
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
            loginType === "passwordless"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Trainer / Placement Officer
        </button>
        <button
          type="button"
          onClick={() => {
            setLoginType("admin");
            setEmailOnlyError("");
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
            loginType === "admin"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Administrator
        </button>
      </div>

      {loginType === "passwordless" ? (
        /* PASSWORDLESS EMAIL-ONLY LOGIN FOR TRAINER & PLACEMENT OFFICER */
        <form onSubmit={onEmailOnlySubmit} className="space-y-4">
          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg border border-indigo-100 dark:border-indigo-900/40 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">Passwordless Direct Access:</span> No password required. Enter your authorized company email address to log in.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={emailOnly}
                onChange={(e) => setEmailOnly(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-200"
                required
              />
            </div>
            {emailOnlyError && (
              <p className="mt-2 text-xs text-rose-500 font-medium">{emailOnlyError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all duration-150 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Access...</span>
              </>
            ) : (
              <span>Log In</span>
            )}
          </button>
        </form>
      ) : (
        /* STANDARD ADMIN LOGIN WITH PASSWORD */
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
                <Mail size={16} />
              </span>
              <input
                type="email"
                {...register("email")}
                placeholder="admin@example.com"
                className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-white/50 dark:bg-slate-900/50 outline-none transition-all duration-200 ${errors.email
                    ? "border-rose-500 focus:ring-1 focus:ring-rose-500"
                    : "border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className={`w-full pl-10 pr-10 py-2 border rounded-lg text-sm bg-white/50 dark:bg-slate-900/50 outline-none transition-all duration-200 ${errors.password
                    ? "border-rose-500 focus:ring-1 focus:ring-rose-500"
                    : "border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none transition-colors duration-150 cursor-pointer"
              >
                {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{errors.password.message}</p>
            )}
            <div className="flex justify-end mt-1.5">
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all duration-150 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Sign In as Admin</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
