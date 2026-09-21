import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  X,
  Copy,
  GraduationCap,
  ClipboardCheck,
  CheckCircle2,
  FileSpreadsheet,
  Sparkles,
  Grid,
  FolderKanban,
  UserPlus
} from "lucide-react";
import StudentExcelUploadModal from "../components/StudentExcelUploadModal";
import AddStudentManualModal from "../components/AddStudentManualModal";
import CreateTrainingModal from "./CreateTrainingModal";

const schema = z.object({
  name: z.string().min(1, "Year of study is required"),
  code: z.string().optional().or(z.literal("")),
  institution: z.string().min(2, "Institution is required"),
  department: z.string().min(2, "Department is required"),
  classroomNumber: z.string().optional().or(z.literal("")),
  blockName: z.string().optional().or(z.literal("")),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  totalDays: z.coerce.number().int().positive("Total days must be positive"),
  trainerId: z.string().optional().or(z.literal(""))
});

export default function BatchManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [uploadBatchId, setUploadBatchId] = useState(null);
  const [manualStudentBatch, setManualStudentBatch] = useState(null);
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema)
  });

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const url = selectedInstitution
        ? `/batches?institution=${encodeURIComponent(selectedInstitution)}`
        : "/batches";
      const res = await API.get(url);
      setBatches(res.data);
    } catch (err) {
      toast.error("Failed to load batches");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainers = async () => {
    if (user?.role !== "ADMIN") return;
    try {
      const res = await API.get("/trainers");
      setTrainers(res.data);
    } catch (err) {
      console.error("Failed to load trainers list", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await API.get("/settings");
      setInstitutions(res.data.registeredInstitutions || []);
    } catch (err) {
      console.error("Failed to load settings/institutions", err);
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchTrainers();
    fetchSettings();
  }, [user, selectedInstitution]);

  const openCreateModal = () => {
    setEditingBatch(null);
    reset({
      name: "",
      code: "",
      institution: "",
      department: "",
      classroomNumber: "",
      blockName: "",
      startDate: "",
      endDate: "",
      totalDays: 10,
      trainerId: ""
    });
    setModalOpen(true);
  };

  const openEditModal = (batch) => {
    setEditingBatch(batch);
    reset({
      name: batch.name,
      code: batch.code,
      institution: batch.institution || "",
      department: batch.department || "",
      classroomNumber: batch.classroomNumber || "",
      blockName: batch.blockName || "",
      startDate: new Date(batch.startDate).toISOString().split("T")[0],
      endDate: new Date(batch.endDate).toISOString().split("T")[0],
      totalDays: batch.totalDays,
      trainerId: batch.trainerId || ""
    });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editingBatch) {
        await API.put(`/batches/${editingBatch.id}`, data);
        toast.success("Batch updated successfully!");
      } else {
        await API.post("/batches", data);
        toast.success("Batch created successfully!");
      }
      setModalOpen(false);
      fetchBatches();
      fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this batch? All registered students and attendance records will be deleted forever!")) {
      return;
    }

    try {
      await API.delete(`/batches/${id}`);
      toast.success("Batch deleted successfully");
      fetchBatches();
    } catch (err) {
      toast.error("Failed to delete batch");
    }
  };

  const copyRegistrationLink = (token) => {
    const link = `${window.location.origin}/register/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Registration link copied to clipboard!");
  };

  const navigateToAttendance = async (batchId) => {
    try {
      // Fetch details to retrieve the current active training day
      const res = await API.get(`/batches/${batchId}`);
      const batch = res.data;
      navigate(`/attendance/batch/${batchId}/day/${batch.currentTrainingDayIndex || 2}`);
    } catch (err) {
      toast.error("Failed to route to attendance marking sheet");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Batch Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {user?.role === "ADMIN"
              ? "Create and oversee training cohorts and assign trainers."
              : "Review your assigned batches and track student attendance."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {/* Institution Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">Filter Institution:</span>
            <select
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Institutions</option>
              {institutions.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>
          {user?.role === "ADMIN" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTrainingModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-lg text-sm font-semibold shadow-md cursor-pointer transition-all duration-200"
              >
                <Sparkles size={16} />
                <span>Create Training Program</span>
              </button>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200"
              >
                <Plus size={16} />
                <span>Single Batch</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : batches.length === 0 ? (
        <div className="glass-panel p-10 text-center rounded-2xl">
          <p className="text-slate-400 font-medium">No training batches created yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch) => (
            <div key={batch.id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between border border-slate-200/50 dark:border-slate-800/40 relative group">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full">
                      {batch.code}
                    </span>
                    <h3 className="text-lg font-bold tracking-tight mt-2">{batch.name}</h3>
                  </div>
                  {user?.role === "ADMIN" && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => openEditModal(batch)}
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Batch"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(batch.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Delete Batch"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <p>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Year of study: </span>
                    {batch.name}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Trainer: </span>
                    {batch.trainer?.name || "All Trainers (Open Access)"}
                  </p>
                  {batch.institution && (
                    <p>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Institution: </span>
                      {batch.institution}
                    </p>
                  )}
                  {batch.department && (
                    <p>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Department: </span>
                      {batch.department}
                    </p>
                  )}
                  {(batch.blockName || batch.classroomNumber) && (
                    <p>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Location: </span>
                      {[batch.blockName, batch.classroomNumber ? `Room ${batch.classroomNumber}` : ""].filter(Boolean).join(" - ")}
                    </p>
                  )}
                  <p>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Timeline: </span>
                    {new Date(batch.startDate).toLocaleDateString()} - {new Date(batch.endDate).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Total Days: </span>
                    {batch.totalDays} Days
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Registered Students: </span>
                    {batch._count?.students ?? 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/40">
                <button
                  onClick={() => navigate(`/students?batchId=${batch.id}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                  title="View Student List"
                >
                  <GraduationCap size={14} />
                  <span>Students</span>
                </button>
                <button
                  onClick={() => navigate(`/attendance/matrix/${batch.id}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 cursor-pointer transition-colors"
                  title="View Attendance Sheet"
                >
                  <Grid size={14} />
                  <span>Attendance</span>
                </button>
                {batch.trainingProgramId && user?.role === "ADMIN" && (
                  <button
                    onClick={() => navigate(`/batches/configure/${batch.trainingProgramId}`)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                    title="Configure Training Program Batches"
                  >
                    <FolderKanban size={14} />
                  </button>
                )}
                <button
                  onClick={() => copyRegistrationLink(batch.registrationToken)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                  title="Copy Student Registration URL"
                >
                  <Copy size={14} />
                </button>
                {(user?.role === "ADMIN" || user?.role === "TRAINER") && (
                  <button
                    onClick={() => setManualStudentBatch(batch)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                    title="Add Student Manually"
                  >
                    <UserPlus size={14} />
                  </button>
                )}
                {user?.role === "ADMIN" && (
                  <button
                    onClick={() => setUploadBatchId(batch.id)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                    title="Upload Students via Excel"
                  >
                    <FileSpreadsheet size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE & EDIT MODAL OVERLAY */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm px-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl shadow-xl relative animate-in fade-in zoom-in duration-200 border">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-6">
              {editingBatch ? "Edit Batch Details" : "Create New Batch"}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Line 1: Batch Number / Code (Display only, no need of editable batch code) */}
              {editingBatch ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Batch Number / Code
                  </label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-xs font-bold font-mono">
                      {editingBatch.code?.split("-")[0] || "BATCH"}
                    </span>
                    <span className="text-sm font-semibold font-mono text-slate-800 dark:text-slate-200">
                      {editingBatch.code}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Batch Code
                  </label>
                  <input
                    type="text"
                    {...register("code")}
                    className="w-full px-4 py-2 border rounded-lg text-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                    placeholder="e.g. B1-7984-876"
                  />
                  {errors.code && (
                    <p className="mt-1 text-xs text-rose-500 font-medium">{errors.code.message}</p>
                  )}
                </div>
              )}

              {/* Line 2: Institution Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Institution Name
                </label>
                <input
                  type="text"
                  {...register("institution")}
                  className="w-full px-4 py-2 border rounded-lg text-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. ABC Institute of Technology"
                />
                {errors.institution && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{errors.institution.message}</p>
                )}
              </div>

              {/* Line 3: Department Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Department Name
                </label>
                <input
                  type="text"
                  {...register("department")}
                  className="w-full px-4 py-2 border rounded-lg text-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Computer Science & Engineering"
                />
                {errors.department && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{errors.department.message}</p>
                )}
              </div>

              {/* Line 4: Year of Study */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Year of Study
                </label>
                <input
                  type="text"
                  {...register("name")}
                  className="w-full px-4 py-2 border rounded-lg text-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. 1st Year, 2nd Year, 3rd Year, Final Year"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{errors.name.message}</p>
                )}
              </div>

              {/* Block and Classroom */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Block Name
                  </label>
                  <input
                    type="text"
                    {...register("blockName")}
                    className="w-full px-4 py-2 border rounded-lg text-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Main Block, AI Block"
                  />
                  {errors.blockName && (
                    <p className="mt-1 text-xs text-rose-500 font-medium">{errors.blockName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Classroom Number
                  </label>
                  <input
                    type="text"
                    {...register("classroomNumber")}
                    className="w-full px-4 py-2 border rounded-lg text-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. 101, A-204, LAB-3"
                  />
                  {errors.classroomNumber && (
                    <p className="mt-1 text-xs text-rose-500 font-medium">{errors.classroomNumber.message}</p>
                  )}
                </div>
              </div>

              {/* Total Days */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Total Days
                </label>
                <input
                  type="number"
                  {...register("totalDays")}
                  className="w-full px-4 py-2 border rounded-lg text-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="10"
                />
                {errors.totalDays && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{errors.totalDays.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    {...register("startDate")}
                    className="w-full px-4 py-2 border rounded-lg text-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-xs text-rose-500 font-medium">{errors.startDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    {...register("endDate")}
                    className="w-full px-4 py-2 border rounded-lg text-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
                  />
                  {errors.endDate && (
                    <p className="mt-1 text-xs text-rose-500 font-medium">{errors.endDate.message}</p>
                  )}
                </div>
              </div>



              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingBatch ? "Save Changes" : "Create Batch"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Upload Modal */}
      <StudentExcelUploadModal
        isOpen={Boolean(uploadBatchId)}
        onClose={() => setUploadBatchId(null)}
        batches={batches}
        defaultBatchId={uploadBatchId || ""}
        onSuccess={() => {
          fetchBatches();
        }}
      />

      {/* Initial Training Creation Modal */}
      <CreateTrainingModal
        isOpen={trainingModalOpen}
        onClose={() => setTrainingModalOpen(false)}
        institutions={institutions}
        onSuccess={(createdData) => {
          fetchBatches();
          if (createdData?.program?.id) {
            navigate(`/batches/configure/${createdData.program.id}`);
          }
        }}
      />

      {/* Manual Student Addition Modal */}
      <AddStudentManualModal
        isOpen={Boolean(manualStudentBatch)}
        onClose={() => setManualStudentBatch(null)}
        batch={manualStudentBatch}
        onSuccess={() => {
          fetchBatches();
        }}
      />
    </div>
  );
}
