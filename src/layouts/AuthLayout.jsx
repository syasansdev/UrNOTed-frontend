import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const AuthLayout = () => {
  const { user } = useAuth();

  // If user is already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors duration-300 relative overflow-hidden">
      
      {/* Background blobs for rich premium look */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center justify-center gap-2 mb-6">
          <img src="/logo.jpg?v=3" alt="UrNOTed Logo" className="h-32 object-contain" />
          <span className="text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 text-center uppercase tracking-wide">
            A Product of SYASAN’S CAREER ANALYTICS TECHNOLOGY SOLUTIONS PVT LTD.
          </span>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-slate-200/50 dark:border-slate-800/40">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
