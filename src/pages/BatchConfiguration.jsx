import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import toast from "react-hot-toast";
import { 
  Building2, 
  DoorOpen, 
  MapPin, 
  Save, 
  Upload, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ChevronLeft,
  Calendar,
  Grid,
  GraduationCap
} from "lucide-react";
import StudentExcelUploadModal from "../components/StudentExcelUploadModal";

export default function BatchConfiguration() {
  const { programId } = useParams();
  const navigate = useNavigate();

  const [program, setProgram] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingBatchId, setSavingBatchId] = useState(null);
  const [uploadBatchId, setUploadBatchId] = useState(null);

  // Form states per batch (indexed by batch.id)
  const [batchForms, setBatchForms] = useState({});

  const fetchProgram = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/training-programs/${programId}`);
      setProgram(res.data);

      // Initialize batch forms
      const forms = {};
      for (const b of res.data.batches) {
        forms[b.id] = {
          name: b.name,
          yearOfStudy: b.yearOfStudy || "",
          department: b.department || "",
          blockName: b.blockName || "",
          classroomNumber: b.classroomNumber || "",
          trainerId: b.trainerId || ""
        };
      }
      setBatchForms(forms);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load training program");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainers = async () => {
    try {
      const res = await API.get("/trainers");
      setTrainers(res.data);
    } catch (err) {
      console.error("Failed to load trainers", err);
    }
  };

  useEffect(() => {
    if (programId) {
      fetchProgram();
      fetchTrainers();
    }
  }, [programId]);

  const handleFieldChange = (batchId, field, value) => {
    setBatchForms((prev) => ({
      ...prev,
      [batchId]: {
        ...prev[batchId],
        [field]: value
      }
    }));
  };

  const handleSaveBatch = async (batchId) => {
    const formData = batchForms[batchId];
    if (!formData) return;

    setSavingBatchId(batchId);
    try {
      const payload = {
        department: formData.department,
        blockName: formData.blockName,
        classroomNumber: formData.classroomNumber,
        yearOfStudy: formData.yearOfStudy || ""
      };
      await API.patch(`/training-programs/batches/${batchId}/configure`, payload);
      toast.success("Batch configuration saved!");
      fetchProgram();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save batch configuration");
    } finally {
      setSavingBatchId(null);
    }
  };

  const getStatusBadge = (batch) => {
    const status = batch.configurationStatus;
    const studentCount = batch._count?.students || 0;

    if (status === "READY" || (batch.department && batch.classroomNumber && studentCount > 0)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5" />
          READY ({studentCount} Students)
        </span>
      );
    }

    if (studentCount > 0 || batch.department || batch.blockName || batch.classroomNumber) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          <AlertCircle className="w-3.5 h-3.5" />
          PARTIALLY CONFIGURED ({studentCount} Students)
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
        <AlertCircle className="w-3.5 h-3.5" />
        NOT CONFIGURED
      </span>
    );
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col justify-center items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500">Loading batch configurations...</p>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="py-24 text-center">
        <p className="text-slate-500">Training Program not found.</p>
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
      {/* Top Navigation & Program Overview */}
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
            {program.name}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Institution: <strong className="text-slate-800 dark:text-slate-200">{program.institution}</strong> &bull; Total Batches: <strong className="text-slate-800 dark:text-slate-200">{program.batches?.length || 0}</strong> &bull; Training Duration: <strong className="text-slate-800 dark:text-slate-200">{program.totalDays} Days</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {program.trainingDates?.length || 0} Scheduled Dates
          </span>
        </div>
      </div>

      {/* Batch Configuration List */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Grid className="w-5 h-5 text-indigo-600" />
          Batch Configuration ({program.batches?.length || 0} Batches)
        </h2>

        {program.batches?.map((batch, index) => {
          const form = batchForms[batch.id] || {};
          const isSaving = savingBatchId === batch.id;

          return (
            <div
              key={batch.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-black text-sm tracking-wide shadow-sm">
                    B{index + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Batch {index + 1} {program.institution}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(batch)}
                  <button
                    onClick={() => navigate(`/attendance/matrix/${batch.id}`)}
                    className="px-3 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Grid size={13} /> View Attendance
                  </button>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    value={form.department || ""}
                    onChange={(e) => handleFieldChange(batch.id, "department", e.target.value)}
                    placeholder="e.g. AI & DS, CSE, Mech"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Block */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Block
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={form.blockName || ""}
                      onChange={(e) => handleFieldChange(batch.id, "blockName", e.target.value)}
                      placeholder="e.g. Block A, Main Block"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* Classroom Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Classroom Number
                  </label>
                  <div className="relative">
                    <DoorOpen className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={form.classroomNumber || ""}
                      onChange={(e) => handleFieldChange(batch.id, "classroomNumber", e.target.value)}
                      placeholder="e.g. A-101, Lab 3"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* Year of Study */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Year of Study
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={form.yearOfStudy || ""}
                      onChange={(e) => handleFieldChange(batch.id, "yearOfStudy", e.target.value)}
                      placeholder="e.g. 1st Year, 2nd Year, 3rd Year"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setUploadBatchId(batch.id)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload size={14} className="text-indigo-600" />
                    Upload Student Excel ({batch._count?.students || 0})
                  </button>
                  <span className="text-xs text-slate-400">
                    Registration Link Token: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">{batch.registrationToken?.slice(0, 8)}...</code>
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveBatch(batch.id)}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Save Batch</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Excel Upload Modal */}
      {uploadBatchId && (
        <StudentExcelUploadModal
          isOpen={!!uploadBatchId}
          batchId={uploadBatchId}
          onClose={() => setUploadBatchId(null)}
          onSuccess={() => {
            fetchProgram();
            setUploadBatchId(null);
          }}
        />
      )}
    </div>
  );
}
