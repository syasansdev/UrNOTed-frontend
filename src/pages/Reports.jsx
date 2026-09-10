import React, { useEffect, useState } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FileDown, FileSpreadsheet, Loader2, History, Database } from "lucide-react";

const rawBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : "");
const BASE_URL = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

export default function Reports() {
  const { user } = useAuth();

  // Selection state
  const [reportType, setReportType] = useState("BATCH"); // BATCH, STUDENT, DEPARTMENT, INSTITUTION, ATTENDANCE_PERCENTAGE
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedDay, setSelectedDay] = useState("2");

  // Lists
  const [reportsList, setReportsList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const fetchOptions = async () => {
    setLoadingOptions(true);
    try {
      const [batchRes, studentRes] = await Promise.all([
        API.get("/batches"),
        API.get("/students")
      ]);
      setBatches(batchRes.data);
      setStudents(studentRes.data);

      if (batchRes.data.length > 0) {
        setSelectedBatchId(batchRes.data[0].id);
      }
      if (studentRes.data.length > 0) {
        setSelectedStudentId(studentRes.data[0].id);
      }
    } catch (err) {
      toast.error("Failed to load options");
    } finally {
      setLoadingOptions(false);
    }
  };

  const fetchHistory = async () => {
    if (user?.role !== "ADMIN") return;
    setLoadingHistory(true);
    try {
      const res = await API.get("/reports");
      setReportsList(res.data);
    } catch (err) {
      console.error("Failed to load export logs history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchOptions();
    fetchHistory();
  }, [user]);

  const handleExport = async (format) => {
    const targetId = reportType === "STUDENT" ? selectedStudentId : selectedBatchId;
    if (!targetId) {
      toast.error("Please select a target parameter first.");
      return;
    }

    const toastId = toast.loading(`Generating ${format.toUpperCase()} report...`);
    try {
      const response = await API.get(`/reports/export/${format}`, {
        params: {
          type: reportType,
          id: targetId,
          day: reportType === "DAY" ? selectedDay : undefined
        },
        responseType: "blob"
      });

      // Extract filename from response headers
      const contentDisposition = response.headers["content-disposition"];
      let filename = `${reportType.toLowerCase()}_report_${Date.now()}.${format === "excel" ? "xlsx" : "pdf"}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Create local URL for download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${format.toUpperCase()} downloaded successfully!`, { id: toastId });
      fetchHistory();
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to generate or download report.", { id: toastId });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports & Exports</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Generate professional print-ready PDF summaries or detailed Excel tables.
        </p>
      </div>

      {/* Control Panel */}
      {loadingOptions ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="glass-panel p-8 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">

          <div className="space-y-4">
            {/* Report Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Report Category</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 outline-none text-slate-950 dark:text-slate-50"
              >
                <option value="BATCH">Batch Attendance Sheet</option>
                <option value="DAY">Day-wise Batch Attendance</option>
                <option value="STUDENT">Single Student Summary</option>
                <option value="DEPARTMENT">Department Performance Summary</option>
                <option value="INSTITUTION">Institution Performance Summary</option>
                <option value="ATTENDANCE_PERCENTAGE">Attendance Percentage List</option>
              </select>
            </div>

            {/* Target Select Conditional */}
            {reportType === "STUDENT" ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 outline-none text-slate-950 dark:text-slate-50"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id} className="text-slate-950">
                      {s.name} ({s.registerNumber})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Cohort (Batch)</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 outline-none text-slate-950 dark:text-slate-50"
                >
                  <option value="">-- Choose Batch --</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id} className="text-slate-950">
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Day Select Conditional */}
            {reportType === "DAY" && selectedBatchId && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Training Day</label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 outline-none text-slate-950 dark:text-slate-50"
                >
                  {(() => {
                    const batch = batches.find((b) => b.id === selectedBatchId);
                    if (!batch) return null;
                    return Array.from({ length: batch.totalDays }, (_, i) => (
                      <option key={i + 1} value={i + 1} className="text-slate-950">
                        Day {i + 1} {i === 0 ? "(Registration)" : ""}
                      </option>
                    ));
                  })()}
                </select>
              </div>
            )}
          </div>

          {/* Export triggers */}
          <div className="flex gap-4">
            <button
              onClick={() => handleExport("pdf")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md cursor-pointer transition-all active:scale-[0.98]"
            >
              <FileDown size={16} />
              <span>Export PDF</span>
            </button>
            <button
              onClick={() => handleExport("excel")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-md cursor-pointer transition-all active:scale-[0.98]"
            >
              <FileSpreadsheet size={16} />
              <span>Export Excel</span>
            </button>
          </div>

        </div>
      )}

      {/* History Log List (Admin only) */}
      {user?.role === "ADMIN" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <History size={18} className="text-slate-400" />
            <h2 className="text-lg font-bold tracking-tight">Generation Log History</h2>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : reportsList.length === 0 ? (
            <div className="glass-panel p-6 text-center rounded-2xl">
              <p className="text-slate-400 font-medium">No files exported in session history yet.</p>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Document Title
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Report Type
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Generated By
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Generated At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {reportsList.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                        <td className="px-6 py-4 text-sm font-semibold">{report.title}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          <span className="inline-block text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-full">
                            {report.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {report.generatedBy}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                          {new Date(report.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
