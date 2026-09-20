import React, { useEffect, useState } from "react";
import API from "../services/api";
import toast from "react-hot-toast";
import { 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Trash2, 
  Plus, 
  Mail, 
  Building2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

export default function AuthorizationManagement() {
  const [users, setUsers] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [emailInput, setEmailInput] = useState("");
  const [institutionInput, setInstitutionInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchInstitutions = async () => {
    try {
      const res = await API.get("/batches");
      const batchInstitutions = res.data
        .map((b) => b.institution)
        .filter((inst) => inst && inst.trim() !== "");
      const unique = Array.from(new Set(batchInstitutions)).sort();
      setInstitutions(unique);
    } catch (err) {
      console.error("Failed to load batch institutions", err);
    }
  };

  const fetchAuthorizedUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get("/authorizations?role=PLACEMENT_OFFICER");
      setUsers(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load authorized placement officers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthorizedUsers();
    fetchInstitutions();
  }, []);

  const handleAuthorize = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      toast.error("Please enter a valid company email");
      return;
    }

    if (!institutionInput.trim()) {
      toast.error("Institution is required so the Placement Officer can access their institution batches");
      return;
    }

    setSubmitting(true);
    try {
      await API.post("/authorizations", {
        email: emailInput.trim(),
        role: "PLACEMENT_OFFICER",
        institution: institutionInput.trim()
      });
      toast.success("Placement Officer authorized successfully!");
      setEmailInput("");
      setInstitutionInput("");
      fetchAuthorizedUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to authorize user");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "AUTHORIZED" ? "REVOKED" : "AUTHORIZED";
    try {
      await API.patch(`/authorizations/${id}/status`, { status: newStatus });
      toast.success(`User marked as ${newStatus}`);
      fetchAuthorizedUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (id, email) => {
    if (!window.confirm(`Are you sure you want to remove authorization for ${email}?`)) {
      return;
    }
    try {
      await API.delete(`/authorizations/${id}`);
      toast.success("Authorization removed");
      fetchAuthorizedUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete authorization");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-indigo-600" />
          Placement Officer Authorization
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Authorize organizational emails for passwordless Placement Officer logins with institution-restricted batch access.
        </p>
      </div>

      {/* Authorize Form Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-indigo-600" />
          Authorize New Placement Officer
        </h2>
        <form onSubmit={handleAuthorize} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Company Email ID <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="officer@company.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Assigned Institution <span className="text-rose-500">*</span>
            </label>
            {institutions.length > 0 ? (
              <select
                value={institutionInput}
                onChange={(e) => setInstitutionInput(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                required
              >
                <option value="">-- Select Registered Institution --</option>
                {institutions.map((inst, i) => (
                  <option key={i} value={inst}>
                    {inst}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={institutionInput}
                onChange={(e) => setInstitutionInput(e.target.value)}
                placeholder="e.g. St. Joseph's College"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                required
              />
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-4 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authorizing...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Authorize</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Authorized Users List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Authorized Placement Officers ({users.length})
          </h3>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No authorized Placement Officers found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Email ID</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Authorized On</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {users.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                      {item.email}
                    </td>
                    <td className="py-3 px-4">
                      {item.institution || "—"}
                    </td>
                    <td className="py-3 px-4">
                      {item.status === "AUTHORIZED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          AUTHORIZED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                          <AlertCircle className="w-3 h-3" />
                          REVOKED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => toggleStatus(item.id, item.status)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors ${
                          item.status === "AUTHORIZED"
                            ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                            : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        }`}
                      >
                        {item.status === "AUTHORIZED" ? "Revoke" : "Re-authorize"}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.email)}
                        className="text-xs font-semibold px-2 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
