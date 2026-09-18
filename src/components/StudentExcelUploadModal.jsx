import React, { useState, useRef } from "react";
import API from "../services/api";
import toast from "react-hot-toast";
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle
} from "lucide-react";

export default function StudentExcelUploadModal({
  isOpen,
  onClose,
  batches = [],
  defaultBatchId = "",
  onSuccess
}) {
  const [selectedBatchId, setSelectedBatchId] = useState(defaultBatchId || "");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Sync selectedBatchId when defaultBatchId changes
  React.useEffect(() => {
    if (defaultBatchId) {
      setSelectedBatchId(defaultBatchId);
    } else if (batches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(batches[0].id);
    }
  }, [defaultBatchId, batches]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      validateAndSetFile(selected);
    }
  };

  const validateAndSetFile = (f) => {
    const name = f.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      toast.error("Please upload an Excel spreadsheet (.xlsx or .xls)");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("File size cannot exceed 5MB");
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      validateAndSetFile(dropped);
    }
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const response = await API.get("/students/template", {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "students_import_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Template downloaded successfully");
    } catch (err) {
      toast.error("Failed to download template");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedBatchId) {
      toast.error("Please select a target batch");
      return;
    }
    if (!file) {
      toast.error("Please select an Excel file to upload");
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await API.post(`/students/upload-excel/${selectedBatchId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setResult(res.data);
      if (res.data.importedCount > 0) {
        toast.success(`Successfully imported ${res.data.importedCount} student(s)!`);
        if (onSuccess) onSuccess();
      } else {
        toast.error("No new students were imported. Check report below.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload and process Excel file");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm px-4">
      <div className="glass-panel w-full max-w-xl p-6 rounded-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200 border border-slate-200/50 dark:border-slate-800/40 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Import Students via Excel
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bulk register students into a cohort. Student email is optional.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Target Batch Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Select Cohort / Batch *
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3.5 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 outline-none text-slate-900 dark:text-slate-100 focus:border-indigo-500"
            >
              <option value="">-- Choose Target Batch --</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Download Template Banner */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <HelpCircle size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Use standard template: <b>Register Number</b> &amp; <b>Name</b> required; <b>Email</b> is optional.</span>
            </div>
            <button
              onClick={handleDownloadTemplate}
              disabled={downloadingTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              {downloadingTemplate ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              <span>Sample Template</span>
            </button>
          </div>

          {/* Dropzone */}
          {!result && (
            <div>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                    : file
                    ? "border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/10"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/40 dark:bg-slate-900/40"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className={`p-3 rounded-full ${file ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                    {file ? <FileSpreadsheet size={26} /> : <Upload size={26} />}
                  </div>
                  {file ? (
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{file.name}</p>
                      <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB — Click or drop to replace</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Click to browse or drag and drop Excel file
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">Supports .xlsx and .xls (Max 5MB)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Result Feedback Summary */}
          {result && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {result.importedCount}
                  </p>
                  <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mt-0.5">
                    Imported
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {result.duplicateCount}
                  </p>
                  <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider mt-0.5">
                    Duplicates Skipped
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                  <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
                    {result.invalidCount}
                  </p>
                  <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider mt-0.5">
                    Invalid Rows
                  </p>
                </div>
              </div>

              {/* Error Details Log */}
              {result.errors && result.errors.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-slate-100/70 dark:bg-slate-900/70 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <span>Skipped / Error Rows ({result.errors.length})</span>
                    <span className="text-[10px] text-slate-400">Row Numbers Match Spreadsheet</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 text-xs">
                    {result.errors.map((err, idx) => (
                      <div key={idx} className="py-1.5 px-2 flex items-start gap-2">
                        <span className="font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0">
                          Row {err.row}:
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">{err.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            {result ? (
              <>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Upload Another File
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md cursor-pointer"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={uploading || !file || !selectedBatchId}
                  onClick={handleUpload}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{uploading ? "Processing Excel..." : "Upload & Import"}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
