import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Loader2, Search, User, FolderKanban, GraduationCap, ChevronLeft, ChevronRight } from "lucide-react";

export default function SearchResults() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all"); // all, students, batches, trainers

  const fetchResults = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await API.get(`/search?q=${encodeURIComponent(query)}&page=${page}&limit=10`);
      setResults(res.data);
    } catch (err) {
      toast.error("Search query execution failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    fetchResults();
  }, [query, page]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const hasStudents = results?.students?.length > 0;
  const hasBatches = results?.batches?.length > 0;
  const hasTrainers = results?.trainers?.length > 0;

  const totalResults = results?.pagination?.total || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Search Results</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Found {totalResults} matches for query:{" "}
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">"{query}"</span>
        </p>
      </div>

      {totalResults === 0 ? (
        <div className="glass-panel p-16 text-center rounded-2xl">
          <Search className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h2 className="text-lg font-bold">No results found</h2>
          <p className="text-slate-400 text-sm mt-1">Check spelling or try searching with different parameters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Tabs Filter */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "all"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              All ({totalResults})
            </button>
            <button
              onClick={() => setActiveTab("students")}
              disabled={!hasStudents}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "students"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
            >
              Students ({results.students.length})
            </button>
            <button
              onClick={() => setActiveTab("batches")}
              disabled={!hasBatches}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "batches"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
            >
              Batches ({results.batches.length})
            </button>
            {user?.role === "ADMIN" && (
              <button
                onClick={() => setActiveTab("trainers")}
                disabled={!hasTrainers}
                className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === "trainers"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                Trainers ({results.trainers.length})
              </button>
            )}
          </div>

          {/* Results Lists */}
          <div className="space-y-6">
            
            {/* STUDENTS */}
            {(activeTab === "all" || activeTab === "students") && hasStudents && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <GraduationCap size={16} />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Students Matches</h3>
                </div>
                <div className="glass-panel rounded-2xl overflow-hidden border">
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {results.students.map((student) => (
                        <tr
                          key={student.id}
                          onClick={() => navigate(`/students?batchId=${student.batchId}`)}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4">
                            <p className="font-semibold text-sm">{student.name}</p>
                            <p className="text-xs text-slate-400">Reg: {student.registerNumber} | Email: {student.email}</p>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                            Dept: {student.department} | Inst: {student.institution}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-block text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full">
                              {student.batch.code}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BATCHES */}
            {(activeTab === "all" || activeTab === "batches") && hasBatches && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <FolderKanban size={16} />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Batches Matches</h3>
                </div>
                <div className="glass-panel rounded-2xl overflow-hidden border">
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {results.batches.map((batch) => (
                        <tr
                          key={batch.id}
                          onClick={() => navigate("/batches")}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4">
                            <p className="font-semibold text-sm">{batch.name}</p>
                            <p className="text-xs text-slate-400">Code: {batch.code}</p>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                            Trainer: {batch.trainer?.name || "Unassigned"}
                          </td>
                          <td className="px-6 py-4 text-right text-xs text-slate-400">
                            {batch.totalDays} Days
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TRAINERS */}
            {user?.role === "ADMIN" && (activeTab === "all" || activeTab === "trainers") && hasTrainers && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <User size={16} />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Trainers Matches</h3>
                </div>
                <div className="glass-panel rounded-2xl overflow-hidden border">
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {results.trainers.map((trainer) => (
                        <tr
                          key={trainer.id}
                          onClick={() => navigate("/trainers")}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4">
                            <p className="font-semibold text-sm">{trainer.name}</p>
                            <p className="text-xs text-slate-400">{trainer.email}</p>
                          </td>
                          <td className="px-6 py-4 text-right text-xs text-slate-400">
                            Joined: {new Date(trainer.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* Pagination Footer */}
          {results.pagination.total > 10 && (
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>
              <span className="text-xs text-slate-500 font-semibold">Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 10 >= results.pagination.total}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
