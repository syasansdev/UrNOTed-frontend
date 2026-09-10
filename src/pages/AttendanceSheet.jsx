import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import toast from "react-hot-toast";
import { 
  Loader2, Lock, Save, Calendar, Check, X, ShieldAlert, 
  Link as LinkIcon, Copy, Share2, Power, RefreshCw, HelpCircle, 
  Mail, MessageCircle, Users, GraduationCap, ClipboardCheck,
  Eye, EyeOff
} from "lucide-react";

export default function AttendanceSheet() {
  const { batchId, dayIndex } = useParams();
  const navigate = useNavigate();

  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  
  // Tabs: "secure" | "manual"
  const [activeTab, setActiveTab] = useState("secure");

  // Sheet state (Manual Grid)
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sheet, setSheet] = useState(null); // { trainingDay, isRegistrationDay, isEditable, currentTrainingDayIndex, records }
  const [recordsState, setRecordsState] = useState([]); // local array of { studentId, status }

  // Secure daily link state
  const [activeSession, setActiveSession] = useState(null); // { token, session }
  const [sessionStudents, setSessionStudents] = useState([]);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [showLink, setShowLink] = useState(true);

  // Load all batches for selection dropdown
  const loadBatches = async () => {
    try {
      const res = await API.get("/batches");
      setBatches(res.data);
    } catch (err) {
      toast.error("Failed to load batches list");
    }
  };

  // Load attendance details for the selected batch and day (Manual tab)
  const fetchAttendanceSheet = async () => {
    if (!batchId || !dayIndex) return;
    setLoading(true);
    try {
      const res = await API.get(`/attendance/batch/${batchId}/day/${dayIndex}`);
      setSheet(res.data);
      setRecordsState(res.data.records.map((r) => ({
        studentId: r.studentId,
        status: r.status === "PENDING" ? "PRESENT" : r.status // Default pending to PRESENT when editing
      })));

      if (parseInt(dayIndex, 10) !== res.data.currentTrainingDayIndex) {
        setActiveTab("manual");
      } else {
        setActiveTab("secure");
      }
      
      // Load current batch metadata
      const bRes = await API.get(`/batches/${batchId}`);
      setSelectedBatch(bRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load attendance sheet");
    } finally {
      setLoading(false);
    }
  };

  // Fetch secure link session details
  const fetchSessionDetails = async () => {
    if (!batchId || !dayIndex) return;
    setSessionLoading(true);
    try {
      const res = await API.get(`/attendance/session/today?batchId=${batchId}&trainingDay=${dayIndex}`);
      setActiveSession(res.data);
      
      // Fetch session students
      const studRes = await API.get(`/attendance/session/${res.data.session.id}/students`);
      setSessionStudents(studRes.data);
    } catch (err) {
      setActiveSession(null);
      setSessionStudents([]);
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    fetchAttendanceSheet();
  }, [batchId, dayIndex]);

  useEffect(() => {
    fetchSessionDetails();
  }, [batchId, dayIndex]);

  const handleBatchChange = (e) => {
    const nextBatchId = e.target.value;
    if (nextBatchId) {
      const batch = batches.find((b) => b.id === nextBatchId);
      navigate(`/attendance/batch/${nextBatchId}/day/${batch.currentTrainingDayIndex || 2}`);
    }
  };

  const handleDayChange = (e) => {
    const nextDay = e.target.value;
    navigate(`/attendance/batch/${batchId}/day/${nextDay}`);
  };

  const setStudentStatus = (studentId, status) => {
    if (!sheet?.isEditable) return;
    setRecordsState((prev) =>
      prev.map((rec) =>
        rec.studentId === studentId
          ? { ...rec, status }
          : rec
      )
    );
  };

  const setBulkStatus = (status) => {
    if (!sheet?.isEditable) return;
    setRecordsState((prev) => prev.map((rec) => ({ ...rec, status })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sheet?.isEditable) return;
    setSaving(true);
    try {
      await API.patch("/attendance/manual-update", {
        batchId,
        trainingDay: parseInt(dayIndex, 10),
        records: recordsState
      });
      toast.success("Attendance sheet recorded successfully!");
      fetchAttendanceSheet(); // Reload and lock
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  // Generate today's secure attendance session
  const handleGenerateLink = async () => {
    if (!batchId) {
      toast.error("Please select a batch first.");
      return;
    }
    setSessionLoading(true);
    try {
      const res = await API.post("/attendance/session", {
        batchId,
        trainingDay: parseInt(dayIndex, 10)
      });
      setActiveSession(res.data);
      toast.success("Secure attendance link generated successfully!");
      
      // Fetch session students
      const studRes = await API.get(`/attendance/session/${res.data.session.id}/students`);
      setSessionStudents(studRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate link");
    } finally {
      setSessionLoading(false);
    }
  };

  // Close attendance link session
  const handleCloseSession = async () => {
    if (!activeSession) return;
    if (!window.confirm("Are you sure you want to close this attendance session? Students will no longer be able to mark attendance.")) {
      return;
    }
    try {
      await API.patch(`/attendance/session/${activeSession.session.id}/disable`);
      toast.success("Session closed.");
      fetchSessionDetails();
    } catch (err) {
      toast.error("Failed to close session.");
    }
  };

  // Regenerate session token (Admin only)
  const handleRegenerateLink = async () => {
    if (!activeSession) return;
    if (!window.confirm("Are you sure you want to regenerate the attendance link for today? The old link will immediately stop working.")) {
      return;
    }
    try {
      const res = await API.patch(`/attendance/session/${activeSession.session.id}/regenerate`);
      setActiveSession(res.data);
      toast.success("New secure link generated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to regenerate link");
    }
  };

  // Share helpers
  const getShareLink = () => {
    if (!activeSession) return "";
    return `${window.location.origin}/attendance/${activeSession.token}`;
  };

  const copyToClipboard = () => {
    const link = getShareLink();
    if (!link) return;
    navigator.clipboard.writeText(link);
    toast.success("Secure attendance link copied!");
  };

  const shareOnWhatsApp = () => {
    const link = getShareLink();
    const text = `Secure Daily Attendance Link (Day ${dayIndex}) for ${selectedBatch?.name || "your batch"}: ${link}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareOnEmail = () => {
    const link = getShareLink();
    const subject = `Secure Daily Attendance Link (Day ${dayIndex}) - ${selectedBatch?.name || ""}`;
    const body = `Hi Student,\n\nPlease click the link below to mark your attendance for Day ${dayIndex} of your training batch:\n${link}\n\nNote: This link is secure and valid for today only.\n\nThank you.`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
  };

  const shareOnTeams = () => {
    const link = getShareLink();
    const text = `Secure Daily Attendance Link (Day ${dayIndex}) for ${selectedBatch?.name || "your batch"}: ${link}`;
    window.open(`https://teams.microsoft.com/share?msgText=${encodeURIComponent(text)}`, "_blank");
  };

  const shareOnClassroom = () => {
    const link = getShareLink();
    window.open(`https://classroom.google.com/share?url=${encodeURIComponent(link)}`, "_blank");
  };

  const livePresentCount = sessionStudents.filter(s => s.status === "PRESENT").length;

  return (
    <div className="space-y-6">
      {/* Header Selector */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between glass-panel p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {/* Select Batch */}
          <div className="flex flex-col gap-1.5 w-full sm:w-64">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected Batch</label>
            <select
              value={batchId || ""}
              onChange={handleBatchChange}
              className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 outline-none text-slate-950 dark:text-slate-50"
            >
              <option value="">-- Choose Batch --</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id} className="text-slate-950">
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Select Training Day */}
          {selectedBatch && (
            <div className="flex flex-col gap-1.5 w-full sm:w-44">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Training Day</label>
              <select
                value={dayIndex || ""}
                onChange={handleDayChange}
                className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 outline-none text-slate-950 dark:text-slate-50"
              >
                <option value="1">Day 1 (Registration)</option>
                {Array.from({ length: selectedBatch.totalDays - 1 }, (_, i) => (
                  <option key={i + 2} value={i + 2} className="text-slate-950">
                    Day {i + 2} {sheet?.currentTrainingDayIndex === i + 2 ? "(Today)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {sheet && (
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            {sheet.isRegistrationDay && (
              <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                Registration Day (No Attendance)
              </span>
            )}
            {!sheet.isRegistrationDay && sheet.isEditable && (
              <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check size={14} /> Open for Marking
              </span>
            )}
            {!sheet.isRegistrationDay && !sheet.isEditable && (
              <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-1 border border-rose-500/20">
                <Lock size={12} /> Locked (Read-Only)
              </span>
            )}
          </div>
        )}
      </div>

      {!batchId ? (
        <div className="glass-panel p-16 text-center rounded-2xl">
          <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h2 className="text-lg font-bold">No Batch Selected</h2>
          <p className="text-slate-400 text-sm mt-1">Choose a cohort from the select dropdown above to track attendance.</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : sheet.isRegistrationDay ? (
        <div className="glass-panel p-16 text-center rounded-2xl space-y-3">
          <ShieldAlert className="w-12 h-12 text-blue-500 mx-auto" />
          <h2 className="text-xl font-bold">Registration Day (Day 1)</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm">
            Day 1 is dedicated entirely to onboarding and registrations. No attendance is captured for this day. 
            Select Day 2 to start tracking attendance.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Attendance Link Generator Section for Day 2+ */}
          {parseInt(dayIndex, 10) >= 2 && (
            <div className="glass-panel p-6 rounded-2xl border dark:border-slate-800 space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Daily Attendance Link</h3>
              {sessionLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : activeSession ? (
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                      <div className="flex-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                          Active Link Generated
                        </span>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 text-xs font-mono bg-white dark:bg-slate-900 px-3 py-1.5 rounded border text-slate-700 dark:text-slate-300 break-all select-all">
                            {showLink ? getShareLink() : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"}
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowLink(!showLink)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors border dark:border-slate-800 cursor-pointer"
                            title={showLink ? "Hide Link" : "Show Link"}
                          >
                            {showLink ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={copyToClipboard}
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border dark:border-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          <Copy size={13} /> Copy Link
                        </button>
                        <button
                          type="button"
                          onClick={shareOnWhatsApp}
                          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-500/10 transition-colors cursor-pointer"
                        >
                          <MessageCircle size={13} /> WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={shareOnEmail}
                          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 text-indigo-600 text-xs font-bold rounded-lg border border-indigo-500/10 transition-colors cursor-pointer"
                        >
                          <Mail size={13} /> Email
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 space-y-4">
                  <p className="text-xs text-slate-400">Generate a secure attendance link for this batch and day to enable student check-in.</p>
                  <button
                    type="button"
                    onClick={handleGenerateLink}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer mx-auto"
                  >
                    Generate Attendance Link
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200">
              
              {sheet.isEditable && (
                <div className="flex gap-2 justify-end items-center">
                  <button
                    type="button"
                    onClick={() => setBulkStatus("PRESENT")}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-300"
                  >
                    Mark All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkStatus("ABSENT")}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-300"
                  >
                    Mark All Absent
                  </button>
                </div>
              )}

              {sheet.records.length === 0 ? (
                <div className="glass-panel p-16 text-center rounded-2xl">
                  <p className="text-slate-400 font-medium">No students registered in this batch yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Student Grid Table */}
                  <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/40">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                          <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Student Details
                          </th>
                          <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Register Number
                          </th>
                          <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Department
                          </th>
                          <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                            Attendance Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {sheet.records.map((record) => {
                          const localRecord = recordsState.find((r) => r.studentId === record.studentId);
                          const isPresent = localRecord ? localRecord.status === "PRESENT" : record.status === "PRESENT";
                          const isAbsent = localRecord ? localRecord.status === "ABSENT" : record.status === "ABSENT";
                          const isPending = !localRecord && record.status === "PENDING";

                          return (
                            <tr
                              key={record.studentId}
                              className="transition-colors select-none"
                            >
                              <td className="px-6 py-4">
                                <p className="text-sm font-semibold">{record.student.name}</p>
                                <p className="text-xs text-slate-400">{record.student.email}</p>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                {record.student.registerNumber}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                {record.student.department}
                              </td>
                              <td className="px-6 py-4 flex justify-center items-center h-full">
                                {sheet.isEditable ? (
                                  <div className="flex gap-4">
                                    <button
                                      type="button"
                                      onClick={() => setStudentStatus(record.studentId, "PRESENT")}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                                        isPresent
                                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10"
                                          : "bg-slate-100 dark:bg-slate-900 text-slate-500 border dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800"
                                      }`}
                                    >
                                      Present
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setStudentStatus(record.studentId, "ABSENT")}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                                        isAbsent
                                          ? "bg-rose-500 text-white shadow-md shadow-rose-500/10"
                                          : "bg-slate-100 dark:bg-slate-900 text-slate-500 border dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800"
                                      }`}
                                    >
                                      Absent
                                    </button>
                                  </div>
                                ) : (
                                  <div>
                                    {isPresent && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                        <Check size={12} /> Present
                                      </span>
                                    )}
                                    {isAbsent && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                        <X size={12} /> Absent
                                      </span>
                                    )}
                                    {isPending && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-500/10 text-slate-500">
                                        Pending
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Submit Button */}
                  {sheet.isEditable && (
                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Saving attendance...</span>
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            <span>Save Daily Attendance</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </form>

        </div>
      )}
    </div>
  );
}
