import React, { useState } from "react";
import { X, Calendar, Sparkles, AlertCircle, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";
import API from "../services/api";

export default function CreateTrainingModal({ isOpen, onClose, onSuccess, institutions = [] }) {
  const [batchCount, setBatchCount] = useState(7);
  const [institution, setInstitution] = useState("");
  const [totalDays, setTotalDays] = useState(30);
  const [selectedDates, setSelectedDates] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Month navigation for date picker
  const [currentMonth, setCurrentMonth] = useState(new Date());

  if (!isOpen) return null;

  // Toggle date selection
  const handleDateClick = (dateStr) => {
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter((d) => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr].sort());
    }
  };

  const handleSelectConsecutive = () => {
    // Quick helper to pre-fill N weekdays starting tomorrow or today
    const count = parseInt(totalDays, 10) || 1;
    const dates = [];
    const cur = new Date();
    while (dates.length < count) {
      cur.setDate(cur.getDate() + 1);
      // Skip Sundays (0) if desired, or include all days
      const dateStr = cur.toISOString().split("T")[0];
      dates.push(dateStr);
    }
    setSelectedDates(dates);
  };

  // Calendar rendering helpers
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!institution.trim()) {
      toast.error("Institution is required");
      return;
    }

    if (batchCount <= 0) {
      toast.error("Number of batches must be greater than 0");
      return;
    }

    if (totalDays <= 0) {
      toast.error("Training duration must be greater than 0");
      return;
    }

    if (selectedDates.length !== parseInt(totalDays, 10)) {
      toast.error(`Please select exactly ${totalDays} training dates. (Currently selected: ${selectedDates.length})`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.post("/training-programs", {
        institution: institution.trim(),
        totalDays: parseInt(totalDays, 10),
        batchCount: parseInt(batchCount, 10),
        dates: selectedDates
      });

      toast.success(res.data?.message || "Training program and batches created!");
      onSuccess(res.data?.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create training program");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Create Training Program
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Set program parameters and select official training dates.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Number of Batches */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Number of Batches <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={batchCount}
                onChange={(e) => setBatchCount(e.target.value)}
                onBlur={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (isNaN(val) || val < 1) setBatchCount(1);
                  else if (val > 50) setBatchCount(50);
                  else setBatchCount(val);
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-semibold text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                required
              />
            </div>

            {/* Institution */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Institution <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                list="institutions-list"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. St. Joseph's College"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                required
              />
              <datalist id="institutions-list">
                {institutions.map((inst, i) => (
                  <option key={i} value={inst} />
                ))}
              </datalist>
            </div>

            {/* Training Duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Training Duration (Days) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={totalDays}
                onChange={(e) => setTotalDays(e.target.value)}
                onBlur={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (isNaN(val) || val < 1) setTotalDays(1);
                  else if (val > 120) setTotalDays(120);
                  else setTotalDays(val);
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-semibold text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Calendar Picker for Exact Non-Consecutive Dates */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Select Official Training Dates ({selectedDates.length} / {totalDays})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectConsecutive}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                >
                  Quick Fill Next {totalDays} Days
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDates([])}
                  className="text-xs text-slate-500 hover:text-rose-600 font-medium px-2 py-1 rounded cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Month Header Navigation */}
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {monthNames[month]} {year}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  &larr; Prev
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Next &rarr;
                </button>
              </div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className="py-1 font-semibold text-slate-400 uppercase text-[10px]">
                  {day}
                </div>
              ))}

              {/* Blank leading slots */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`blank-${i}`} className="p-1" />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const mStr = String(month + 1).padStart(2, "0");
                const dStr = String(dayNum).padStart(2, "0");
                const dateStr = `${year}-${mStr}-${dStr}`;
                const isSelected = selectedDates.includes(dateStr);

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => handleDateClick(dateStr)}
                    className={`py-2 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white font-bold shadow-sm scale-105"
                        : "hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Validation feedback banner */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Selected: <strong className="text-slate-900 dark:text-slate-100">{selectedDates.length}</strong> / {totalDays} required dates
              </span>
              {selectedDates.length !== parseInt(totalDays, 10) ? (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Select {Math.abs(parseInt(totalDays, 10) - selectedDates.length)} {selectedDates.length < parseInt(totalDays, 10) ? "more" : "fewer"} dates
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <Check className="w-3.5 h-3.5" />
                  Exact date count fulfilled!
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || selectedDates.length !== parseInt(totalDays, 10)}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating {batchCount} Batches...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Batches</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
