import React, { useEffect, useState } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Loader2, Settings as SettingsIcon, Save, Building2, ShieldCheck, Plus } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    allowLateRegistration: true,
    minAttendancePercentage: 75,
    allowTrainerEditPastDays: false,
    institutionName: "",
    institutionPermissions: {}
  });
  const [registeredInstitutions, setRegisteredInstitutions] = useState([]);
  const [selectedInstForAccess, setSelectedInstForAccess] = useState("");
  const [customInstInput, setCustomInstInput] = useState("");
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await API.get("/settings");
      const data = res.data;
      setSettings({
        allowLateRegistration: data.allowLateRegistration ?? true,
        minAttendancePercentage: data.minAttendancePercentage ?? 75,
        allowTrainerEditPastDays: data.allowTrainerEditPastDays ?? false,
        institutionName: data.institutionName || "",
        institutionPermissions: data.institutionPermissions || {}
      });
      const insts = data.registeredInstitutions || [];
      setRegisteredInstitutions(insts);

      // Select first institution if available
      if (insts.length > 0 && !selectedInstForAccess) {
        setSelectedInstForAccess(insts[0]);
      } else if (data.institutionName && !selectedInstForAccess) {
        setSelectedInstForAccess(data.institutionName);
      }
    } catch (err) {
      toast.error("Failed to load system settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggleGlobal = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key, val) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleToggleInstPermission = (instName) => {
    if (!instName) return;
    setSettings((prev) => {
      const currentMap = prev.institutionPermissions || {};
      const currentInstPerm = currentMap[instName] || { allowTrainerEditPastDays: false };
      return {
        ...prev,
        institutionPermissions: {
          ...currentMap,
          [instName]: {
            ...currentInstPerm,
            allowTrainerEditPastDays: !currentInstPerm.allowTrainerEditPastDays
          }
        }
      };
    });
  };

  const handleAddCustomInst = (e) => {
    e.preventDefault();
    const trimmed = customInstInput.trim();
    if (!trimmed) return;

    if (!registeredInstitutions.includes(trimmed)) {
      setRegisteredInstitutions((prev) => [...prev, trimmed].sort());
    }
    setSelectedInstForAccess(trimmed);
    setSettings((prev) => ({ ...prev, institutionName: trimmed }));
    setCustomInstInput("");
    setShowAddCustom(false);
    toast.success(`Added ${trimmed} to institution preferences`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user?.role !== "ADMIN") return;
    setSaving(true);
    try {
      const res = await API.put("/settings", settings);
      setSettings((prev) => ({
        ...prev,
        ...res.data.settings
      }));
      toast.success("Settings updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Active institution permission status for selected dropdown
  const currentInstPerm =
    selectedInstForAccess && settings.institutionPermissions
      ? settings.institutionPermissions[selectedInstForAccess]?.allowTrainerEditPastDays
      : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Configure default rules, registered institutions, and separate attendance correction access per institute.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 space-y-6">
          
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <SettingsIcon size={18} className="text-indigo-600" />
            <h3 className="font-bold">Preferences Configuration</h3>
          </div>

          {/* Primary Institution Dropdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Primary Registered Institution
              </label>
              {user?.role === "ADMIN" && (
                <button
                  type="button"
                  onClick={() => setShowAddCustom(!showAddCustom)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                >
                  <Plus size={14} />
                  <span>{showAddCustom ? "Cancel" : "Add Institution"}</span>
                </button>
              )}
            </div>

            {showAddCustom ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInstInput}
                  onChange={(e) => setCustomInstInput(e.target.value)}
                  placeholder="Enter registered institute name"
                  className="flex-1 px-4 py-2 border rounded-lg text-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomInst}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"
                >
                  Add
                </button>
              </div>
            ) : (
              <select
                value={settings.institutionName}
                onChange={(e) => handleChange("institutionName", e.target.value)}
                disabled={user?.role !== "ADMIN"}
                className="w-full px-4 py-2.5 border rounded-lg text-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none disabled:opacity-50"
              >
                <option value="">-- Select Registered Institution --</option>
                {registeredInstitutions.map((inst) => (
                  <option key={inst} value={inst}>
                    {inst}
                  </option>
                ))}
              </select>
            )}
            <p className="text-[11px] text-slate-400">
              Institutions dynamically populate from registered student profiles and admin preferences.
            </p>
          </div>

          {/* Minimum Attendance Threshold */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Minimum Attendance Threshold (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={settings.minAttendancePercentage}
              onChange={(e) => handleChange("minAttendancePercentage", e.target.value)}
              disabled={user?.role !== "ADMIN"}
              className="w-full px-4 py-2 border rounded-lg text-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none disabled:opacity-50"
            />
            <p className="text-[10px] text-slate-400 mt-1">Students below this percentage will be flagged on attendance reports.</p>
          </div>

          {/* Global Checklist */}
          <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold">Allow Late Registration</h4>
                <p className="text-xs text-slate-400">Enables students to register mid-way through a batch cohort.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.allowLateRegistration}
                onChange={() => handleToggleGlobal("allowLateRegistration")}
                disabled={user?.role !== "ADMIN"}
                className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>

            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold">Global Past Days Attendance Edit</h4>
                <p className="text-xs text-slate-400">Allow trainers to edit past days' attendance across ALL institutes by default.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.allowTrainerEditPastDays}
                onChange={() => handleToggleGlobal("allowTrainerEditPastDays")}
                disabled={user?.role !== "ADMIN"}
                className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Separate Institute Access Controls */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-indigo-600" />
              <h4 className="text-sm font-bold">Individual Institution Access Management</h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Grant or revoke past day attendance correction privileges for specific registered institutions individually under Admin supervision.
            </p>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Select Institute to Manage Access
                </label>
                <select
                  value={selectedInstForAccess}
                  onChange={(e) => setSelectedInstForAccess(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-indigo-500 outline-none"
                >
                  <option value="">-- Choose Institution --</option>
                  {registeredInstitutions.map((inst) => (
                    <option key={inst} value={inst}>
                      {inst}
                    </option>
                  ))}
                </select>
              </div>

              {selectedInstForAccess ? (
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={16} className="text-emerald-500" />
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Attendance Correction Privilege for "{selectedInstForAccess}"
                      </h5>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Allows assigned trainers to edit past day attendance records specifically for batches under {selectedInstForAccess}.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!currentInstPerm}
                    onChange={() => handleToggleInstPermission(selectedInstForAccess)}
                    disabled={user?.role !== "ADMIN"}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Select an institution from the dropdown above to configure individual correction access permissions.</p>
              )}
            </div>
          </div>

          {/* Save Button */}
          {user?.role === "ADMIN" && (
            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Settings...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

