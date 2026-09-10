import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, AlertTriangle, Loader2, ShieldCheck, UserCheck, Calendar, BookOpen, GraduationCap, LogOut } from "lucide-react";
import API from "../services/api";
import { getDeviceFingerprint } from "../utils/fingerprint";
import { useAuth } from "../context/AuthContext";

export default function AttendanceMarking() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();

  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");

  // 1. Fetch session details (no login redirect)
  useEffect(() => {
    const fetchSessionMeta = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await API.get(`/attendance/${token}`);
        setSessionInfo(res.data);
        
        // Check if student already marked in this browser
        const savedData = localStorage.getItem(`marked_attendance_${token}`);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setSuccessMessage("Attendance marked successfully (cached).");
          setSuccessData(parsed);
        } else if (res.data.alreadyMarked) {
          setSuccessMessage("Attendance already marked for this training day.");
          setSuccessData({
            studentName: "Verified Student",
            trainingDay: res.data.session.trainingDay,
            batchName: res.data.session.batchName,
            status: "PRESENT",
            verifiedAt: new Date(res.data.session.attendanceDate)
          });
        }
      } catch (err) {
        setError(err.response?.data?.message || "Invalid or expired attendance link");
      } finally {
        setLoading(false);
      }
    };

    fetchSessionMeta();
  }, [token]);

  const handleMarkAttendance = async () => {
    if (!registerNumber.trim()) {
      setError("Please enter your Register Number.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await API.post(`/attendance/${token}/mark`, {
        registerNumber: registerNumber.trim()
      });
      setSuccessMessage("Attendance marked successfully.");
      setSuccessData(res.data.data);
      localStorage.setItem(`marked_attendance_${token}`, JSON.stringify(res.data.data));
      setSessionInfo((prev) => prev ? { ...prev, alreadyMarked: true } : prev);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark attendance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isAlreadyMarked = sessionInfo?.alreadyMarked || !!successData;

  if (authLoading || (loading && !error)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading session metadata...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="max-w-md w-full glass-panel bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative z-10">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white text-center">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md border border-white/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-extrabold">Student Attendance Page</h2>
          <p className="text-xs text-indigo-100 mt-1">Cryptographic Token & Device Protection</p>
        </div>

        {/* Body */}
        <div className="p-6">

          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 rounded-2xl text-sm flex items-start gap-2.5 border border-rose-200 dark:border-rose-800/60 mb-6 animate-in fade-in duration-200">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isAlreadyMarked && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-2xl text-sm flex items-start gap-2.5 border border-emerald-200 dark:border-emerald-800/60 mb-6 animate-in fade-in duration-200">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMessage || "Attendance already marked for this training day."}</span>
            </div>
          )}

          {sessionInfo ? (
            <div className="space-y-6">
              <div className="space-y-4">
                {/* Batch Field */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Batch
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={sessionInfo.session.batchName}
                    className="w-full px-4 py-3 border rounded-xl text-sm bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 outline-none text-slate-800 dark:text-slate-200 font-semibold cursor-not-allowed"
                  />
                </div>

                {/* Training Day Field */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Training Day
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`Day ${sessionInfo.session.trainingDay}`}
                    className="w-full px-4 py-3 border rounded-xl text-sm bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 outline-none text-slate-800 dark:text-slate-200 font-semibold cursor-not-allowed"
                  />
                </div>

                {/* Register Number Input Field */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Register Number
                  </label>
                  <input
                    type="text"
                    value={registerNumber}
                    disabled={isAlreadyMarked}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    placeholder="Enter your Register Number / Roll No"
                    className="w-full px-4 py-3 border rounded-xl text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 outline-none text-slate-950 dark:text-slate-50 focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {sessionInfo.isExpired || !sessionInfo.session.isActive ? (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 rounded-2xl text-sm flex items-start gap-2.5 border border-rose-200 dark:border-rose-800/60">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>This attendance link has expired or has been disabled. Yesterday's links are invalid.</span>
                </div>
              ) : (
                <button
                  onClick={handleMarkAttendance}
                  disabled={submitting || isAlreadyMarked}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-bold rounded-2xl text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Submitting Attendance...</span>
                    </>
                  ) : isAlreadyMarked ? (
                    <span>Attendance Submitted</span>
                  ) : (
                    <span>Submit Attendance</span>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-sm">
              No session info loaded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
