import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { FolderKanban, Users, GraduationCap, Percent, Loader2, ArrowUpRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get("/dashboard/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load dashboard metrics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  const cards = [
    {
      title: "Active Batches",
      value: stats?.totalBatches || 0,
      icon: FolderKanban,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
    },
    ...(user?.role === "ADMIN"
      ? [
          {
            title: "Total Trainers",
            value: stats?.totalTrainers || 0,
            icon: Users,
            color: "bg-teal-500/10 text-teal-600 dark:text-teal-400"
          }
        ]
      : []),
    {
      title: "Students Enrolled",
      value: stats?.totalStudents || 0,
      icon: GraduationCap,
      color: "bg-violet-500/10 text-violet-600 dark:text-violet-400"
    },
    {
      title: "Average Attendance",
      value: `${stats?.averageAttendance || 100}%`,
      icon: Percent,
      color: stats?.averageAttendance < 75
        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Block */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Welcome back, {user?.name}. Here is an analysis of your cohorts.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <div key={i} className="glass-panel p-6 rounded-2xl flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {card.title}
              </span>
              <h3 className="text-3xl font-bold tracking-tight">{card.value}</h3>
            </div>
            <div className={`p-4 rounded-xl ${card.color}`}>
              <card.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Rates Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Attendance Performance</h2>
            <p className="text-xs text-slate-400 mt-0.5">Average attendance percentages by batch</p>
          </div>
          <div className="h-80 w-full">
            {stats?.batchDistribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.batchDistribution} margin={{ left: -20, right: 10, top: 10 }}>
                  <defs>
                    <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" fontSize={11} stroke="#94A3B8" tickLine={false} />
                  <YAxis fontSize={11} stroke="#94A3B8" tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.9)",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="avgAttendance"
                    name="Avg Attendance (%)"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAttendance)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                No cohort data available for mapping.
              </div>
            )}
          </div>
        </div>

        {/* Student Count Chart */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Student Enrollment</h2>
            <p className="text-xs text-slate-400 mt-0.5">Student headcount distribution</p>
          </div>
          <div className="h-80 w-full">
            {stats?.batchDistribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.batchDistribution} margin={{ left: -20, right: 10, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" fontSize={11} stroke="#94A3B8" tickLine={false} />
                  <YAxis fontSize={11} stroke="#94A3B8" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.9)",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff"
                    }}
                  />
                  <Bar dataKey="studentsCount" name="Students Enrolled" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                No cohort data available for mapping.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
