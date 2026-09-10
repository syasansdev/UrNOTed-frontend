import React from "react";
import { Link } from "react-router-dom";
import { HelpCircle, ShieldAlert } from "lucide-react";

export function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-4 px-4">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 mx-auto">
        <HelpCircle size={32} />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight">404 - Page Not Found</h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm">
        Oops! The page you are looking for does not exist or has been relocated.
      </p>
      <div className="pt-4">
        <Link
          to="/dashboard"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md inline-block cursor-pointer transition-all duration-200"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}

export function Forbidden() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-4 px-4">
      <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 mx-auto">
        <ShieldAlert size={32} />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-rose-600 dark:text-rose-500">403 - Forbidden</h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm">
        Access Denied. You do not possess the required security permissions to view this resource.
      </p>
      <div className="pt-4">
        <Link
          to="/dashboard"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md inline-block cursor-pointer transition-all duration-200"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
