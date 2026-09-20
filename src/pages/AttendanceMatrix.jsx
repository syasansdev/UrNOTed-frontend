import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { 
  Calendar, 
  Users, 
  Building2, 
  ChevronLeft, 
  Save, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Loader2, 
  Search, 
  Check, 
  X,
  AlertTriangle,
  Lock,
  Download
} from "lucide-react";

export default function AttendanceMatrix() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState(null); // { batch, officialDates, activeTrainingDate, todayString, students }
  const [searchTerm, setSearchTerm] = useState("");

  // Local grid edits for the active training date: { [studentId]: "PRESENT" | "ABSENT" }
  const [activeEdits, setActiveEdits] = useState({});

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/attendance/matrix/${batchId}`);
      setData(res.data);

      // Pre-fill activeEdits from today's existing records or default to PRESENT
      const initialEdits = {};
      const activeDateStr = res.data.activeTrainingDate?.dateString || res.data.todayString;

      for (const s of res.data.students) {
        const existingStatus = s.statusByDate[activeDateStr];
        initialEdits[s.id] = existingStatus && existingStatus !== "PENDING" ? existingStatus : "PRESENT";
      }
      setActiveEdits(initialEdits);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load attendance matrix");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (batchId) {
      fetchMatrix();
    }
  }, [batchId]);

  const activeDateString = data?.activeTrainingDate?.dateString || data?.todayString;
  const isActiveDateScheduled = !!data?.activeTrainingDate;

  // Toggle student status for active day
  const toggleStudentStatus = (studentId) => {
    setActiveEdits((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "PRESENT" ? "ABSENT" : "PRESENT"
    }));
  };

  const markAll = (status) => {
    if (!data?.students) return;
    const newEdits = {};
    for (const s of data.students) {
      newEdits[s.id] = status;
    }
    setActiveEdits(newEdits);
  };

  const handleSaveAttendance = async () => {
    if (!isActiveDateScheduled && user?.role !== "ADMIN") {
      toast.error(`Today (${data?.todayString}) is not a scheduled training date for this program.`);
      return;
    }

    setSubmitting(true);
    try {
      const records = Object.entries(activeEdits).map(([studentId, status]) => ({
        studentId,
        status
      }));

      await API.post(`/attendance/matrix/${batchId}`, {
        dateString: activeDateString,
        records
      });

      toast.success(`Attendance saved for ${activeDateString}!`);
      fetchMatrix();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save attendance");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter students by search term
  const filteredStudents = useMemo(() => {
    if (!data?.students) return [];
    if (!searchTerm.trim()) return data.students;
    const term = searchTerm.toLowerCase();
    return data.students.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.registerNumber.toLowerCase().includes(term) ||
        (s.department && s.department.toLowerCase().includes(term))
    );
  }, [data?.students, searchTerm]);

  // Format short date (e.g. "01 Oct")
  const formatShortDate = (dateStr) => {
    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col justify-center items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500">Loading Attendance Table...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-24 text-center">
        <p className="text-slate-500">Batch not found or failed to load.</p>
        <button
          onClick={() => navigate("/batches")}
          className="mt-4 text-sm text-indigo-600 font-semibold"
        >
          &larr; Back to Batches
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <button
            onClick={() => navigate("/batches")}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 mb-1.5"
          >
            <ChevronLeft size={14} /> Back to Batches
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            {data.batch.name} &bull; Attendance
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Institution: <strong>{data.batch.institution || "—"}</strong> &bull; Dept: <strong>{data.batch.department || "—"}</strong> &bull; Block: <strong>{data.batch.blockName || "—"}</strong> &bull; Room: <strong>{data.batch.classroomNumber || "—"}</strong>
          </p>
        </div>

        {/* Date status indicator & Save button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Today: {formatShortDate(data.todayString)}</span>
            {isActiveDateScheduled ? (
              <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">ACTIVE DAY</span>
            ) : (
              <span className="bg-slate-400 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">NON-SCHEDULED</span>
            )}
          </div>

          <button
            onClick={handleSaveAttendance}
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Today's Attendance</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student by name, reg number..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold mr-1">Quick Actions (Today):</span>
          <button
            type="button"
            onClick={() => markAll("PRESENT")}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
          >
            Mark All Present
          </button>
          <button
            type="button"
            onClick={() => markAll("ABSENT")}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors"
          >
            Mark All Absent
          </button>
        </div>
      </div>

      {/* Matrix Table Container with Sticky Columns & Headers */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[650px] relative">
          <table className="w-full text-center border-collapse text-xs">
            {/* Header Row */}
            <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-30 shadow-sm">
              <tr>
                {/* Sticky Student Name & Reg */}
                <th className="py-3.5 px-4 text-left font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 sticky left-0 z-40 bg-slate-100 dark:bg-slate-800 min-w-[200px] border-r border-slate-200 dark:border-slate-700">
                  Student Name
                </th>
                <th className="py-3.5 px-3 text-left font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 sticky left-[200px] z-40 bg-slate-100 dark:bg-slate-800 min-w-[120px] border-r border-slate-200 dark:border-slate-700">
                  Reg Number
                </th>

                {/* Training Dates Columns */}
                {data.officialDates?.map((d) => {
                  const isToday = d.dateString === activeDateString;

                  return (
                    <th
                      key={d.dateString}
                      className={`py-3 px-3 font-semibold uppercase text-center min-w-[70px] border-r border-slate-200 dark:border-slate-700 transition-colors ${
                        isToday
                          ? "bg-indigo-600 text-white font-bold ring-2 ring-indigo-500 shadow-md"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] opacity-80">Day {d.dayNumber}</span>
                        <span className="text-xs font-bold">{formatShortDate(d.dateString)}</span>
                        {isToday && (
                          <span className="text-[9px] bg-white text-indigo-700 px-1 rounded font-extrabold mt-0.5">
                            EDITABLE
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Student Rows */}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={(data.officialDates?.length || 0) + 2} className="py-12 text-center text-slate-400">
                    No students found in this batch.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, sIdx) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Sticky Student Name */}
                    <td className="py-2.5 px-4 text-left font-semibold text-slate-900 dark:text-slate-100 sticky left-0 z-20 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 truncate max-w-[200px]">
                      {student.name}
                    </td>

                    {/* Sticky Register Number */}
                    <td className="py-2.5 px-3 text-left text-slate-500 dark:text-slate-400 font-mono text-[11px] sticky left-[200px] z-20 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
                      {student.registerNumber}
                    </td>

                    {/* Date Attendance Cells */}
                    {data.officialDates?.map((d) => {
                      const isToday = d.dateString === activeDateString;

                      if (isToday) {
                        // EDITABLE CELL FOR ACTIVE TRAINING DATE
                        const currentStatus = activeEdits[student.id] || "PRESENT";
                        const isPresent = currentStatus === "PRESENT";

                        return (
                          <td
                            key={d.dateString}
                            className="p-1 border-r border-slate-200 dark:border-slate-800 bg-indigo-50/40 dark:bg-indigo-950/20"
                          >
                            <button
                              type="button"
                              onClick={() => toggleStudentStatus(student.id)}
                              className={`w-full py-1.5 rounded text-xs font-bold transition-all cursor-pointer shadow-sm ${
                                isPresent
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                  : "bg-rose-600 hover:bg-rose-700 text-white"
                              }`}
                            >
                              {isPresent ? "P" : "A"}
                            </button>
                          </td>
                        );
                      }

                      // READ-ONLY CELL FOR HISTORICAL OR FUTURE DATES
                      const cellStatus = student.statusByDate[d.dateString];
                      let badge = (
                        <span className="text-slate-300 dark:text-slate-700 text-[11px]">—</span>
                      );

                      if (cellStatus === "PRESENT") {
                        badge = (
                          <span className="inline-block w-6 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            P
                          </span>
                        );
                      } else if (cellStatus === "ABSENT") {
                        badge = (
                          <span className="inline-block w-6 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                            A
                          </span>
                        );
                      }

                      return (
                        <td
                          key={d.dateString}
                          className="py-2 px-2 border-r border-slate-200 dark:border-slate-800 text-center opacity-85"
                        >
                          {badge}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend & Instructions */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> P = Present
          </span>
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" /> A = Absent
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <Lock size={12} /> Historical & Future Dates are Read-Only
          </span>
        </div>

        <p>
          Showing {filteredStudents.length} of {data.students.length} students across {data.officialDates?.length} dates.
        </p>
      </div>
    </div>
  );
}
