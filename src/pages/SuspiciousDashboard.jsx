import React, { useState, useEffect } from "react";
import { ShieldAlert, AlertTriangle, Cpu, Globe, Users, RefreshCw, CheckCircle, Search } from "lucide-react";
import API from "../services/api";

const SuspiciousDashboard = () => {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("ALL");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, actRes] = await Promise.all([
        API.get("/anti-malpractice/stats"),
        API.get("/anti-malpractice/suspicious-activities")
      ]);
      setStats(statsRes.data);
      setActivities(actRes.data);
    } catch (err) {
      console.error("Failed to load suspicious dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredActivities = activities.filter((act) => {
    if (filterType === "ALL") return true;
    return act.activityType === filterType;
  });

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between glass-panel p-6 rounded-2xl gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Suspicious Activity & Malpractice Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time tracking of proxy attempts, multi-device logins, IP clusters, and out-of-bounds GPS check-ins.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Feed
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-indigo-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Students</p>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{stats?.totalStudents || 0}</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-blue-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Batches</p>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{stats?.totalBatches || 0}</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Attendance</p>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{stats?.todayAttendance || 0}</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-violet-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Attendance %</p>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{stats?.overallPercentage || 0}%</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-rose-500 bg-rose-500/5">
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Suspicious Count</p>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{stats?.suspiciousCount || 0}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        {["ALL", "MULTIPLE_STUDENTS_SAME_DEVICE", "MULTIPLE_STUDENTS_SAME_IP", "GPS_MISMATCH", "EXPIRED_QR_ATTEMPT"].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              filterType === type
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            {type === "ALL" ? "All Activity" : type.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Activity Stream Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/40">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Activity Type
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Register No / Student
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Day
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                IP / Device Hash
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            {filteredActivities.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  No suspicious activity logged matching your filter.
                </td>
              </tr>
            ) : (
              filteredActivities.map((act) => (
                <tr key={act.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[10px] uppercase ${
                      act.severity === "HIGH"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    }`}>
                      <AlertTriangle className="w-3 h-3" />
                      {act.activityType.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                    {act.registerNumber || "N/A"}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">
                    Day {act.trainingDay}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono">
                    <div>IP: {act.ipAddress || "127.0.0.1"}</div>
                    <div className="text-[10px] text-slate-400">{act.deviceFingerprint || "No Fingerprint"}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {new Date(act.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default SuspiciousDashboard;
