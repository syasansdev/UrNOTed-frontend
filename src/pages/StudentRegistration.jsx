import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import API from "../services/api";
import toast from "react-hot-toast";
import { Loader2, CheckCircle2, AlertOctagon, Mail, User, School, Calendar, BookOpen, Fingerprint } from "lucide-react";

const schema = z.object({
  registerNumber: z.string().min(2, "Register number is required"),
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  department: z.string().min(2, "Department is required"),
  institution: z.string().min(2, "Institution is required")
});

export default function StudentRegistration() {
  const { token } = useParams();
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [registered, setRegistered] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema)
  });

  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await API.get(`/students/register/validate/${token}`);
        setBatch(res.data);
        reset({
          registerNumber: "",
          name: "",
          email: "",
          department: res.data.department || "",
          institution: res.data.institution || ""
        });
      } catch (err) {
        setErrorMsg(err.response?.data?.message || "Registration link is invalid or expired.");
      } finally {
        setLoading(false);
      }
    };
    validateToken();
  }, [token, reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await API.post(`/students/register/${token}`, data);
      setRegistered(true);
      toast.success("Successfully registered!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit registration");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="glass-panel w-full max-w-md p-8 rounded-2xl text-center border space-y-4">
          <div className="w-12 h-12 bg-rose-500/10 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertOctagon size={28} />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Access Denied</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="glass-panel w-full max-w-md p-8 rounded-2xl text-center border space-y-4 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} className="animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Registration Complete</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Thank you! You have been successfully registered for the cohort:
          </p>
          <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-xl text-left border dark:border-slate-800">
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">{batch.code}</p>
            <p className="text-sm font-semibold mt-1">{batch.name}</p>
            <p className="text-xs text-slate-400 mt-2">
              Timeline: {new Date(batch.startDate).toLocaleDateString()} - {new Date(batch.endDate).toLocaleDateString()}
            </p>
          </div>
          <p className="text-xs text-slate-400 pt-4">You may close this page now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 relative overflow-hidden transition-colors duration-300">
      
      {/* Visual background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-lg relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="h-12 flex items-center justify-center gap-2">
            <img src="/favicon.svg?v=3" alt="UrNOTed Logo" className="h-8 w-8 rounded-lg object-contain shadow-sm border border-slate-200 bg-white p-0.5" />
            <span className="font-extrabold text-xl tracking-wide bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
              UrNOTed Portal
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Student Registration</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Join Batch: <span className="font-bold text-slate-700 dark:text-slate-300">{batch.name} ({batch.code})</span>
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  {...register("name")}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.name.message}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  {...register("email")}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.email.message}</p>
              )}
            </div>


            {/* Register Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Register Number / ID
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Fingerprint size={16} />
                </span>
                <input
                  type="text"
                  {...register("registerNumber")}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. 21CSE089"
                />
              </div>
              {errors.registerNumber && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.registerNumber.message}</p>
              )}
            </div>

            {/* Department & Institution */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Department
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <BookOpen size={16} />
                  </span>
                  <input
                    type="text"
                    {...register("department")}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. CSE"
                  />
                </div>
                {errors.department && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{errors.department.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Institution
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <School size={16} />
                  </span>
                  <input
                    type="text"
                    {...register("institution")}
                    readOnly
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-slate-100/50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 outline-none cursor-not-allowed text-slate-500 dark:text-slate-400"
                  />
                </div>
                {errors.institution && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{errors.institution.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-150 active:scale-[0.98] shadow-md shadow-indigo-600/10"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Details...</span>
                </>
              ) : (
                <span>Complete Registration</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
