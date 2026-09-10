import React, { useState } from "react";
import { Link, NavLink, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  GraduationCap,
  FileSpreadsheet,
  Settings,
  User,
  LogOut,
  Sun,
  Moon,
  Search,
  Menu,
  X,
  ClipboardCheck
} from "lucide-react";

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const adminMenu = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Trainers", path: "/trainers", icon: Users },
    { label: "Batches", path: "/batches", icon: FolderKanban },
    { label: "Students", path: "/students", icon: GraduationCap },
    { label: "Reports", path: "/reports", icon: FileSpreadsheet },
    { label: "Settings", path: "/settings", icon: Settings },
    { label: "Profile", path: "/profile", icon: User }
  ];

  const trainerMenu = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "My Batches", path: "/batches", icon: FolderKanban },
    { label: "Students", path: "/students", icon: GraduationCap },
    { label: "Reports", path: "/reports", icon: FileSpreadsheet },
    { label: "Profile", path: "/profile", icon: User }
  ];

  const studentMenu = [
    { label: "Profile", path: "/profile", icon: User }
  ];

  const menuItems =
    user?.role === "ADMIN"
      ? adminMenu
      : user?.role === "TRAINER"
      ? trainerMenu
      : studentMenu;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR PANEL */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 glass-panel border-r flex flex-col transform transition-transform duration-300 md:translate-x-0 md:static md:h-screen ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* LOGO */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200/50 dark:border-slate-800/40">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg?v=3" alt="UrNOTed Logo" className="h-9 w-9 rounded-lg object-contain shadow-sm p-0.5 border border-slate-200 dark:border-slate-800 bg-white" />
            <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
              UrNOTed
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-indigo-600 dark:hover:text-indigo-400"
                }`
              }
            >
              <item.icon size={18} className="shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* LOGOUT FOOTER */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/40">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-200"
          >
            <LogOut size={18} className="shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* CORE WORKSPACE PANEL */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER NAVBAR */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200/40 dark:border-slate-800/30 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
            >
              <Menu size={20} />
            </button>

            {/* GLOBAL SEARCH FORM */}
            <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search everything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-1.5 text-sm rounded-lg glass-input border outline-none"
              />
            </form>
          </div>

          <div className="flex items-center gap-4">
            {/* THEME TOGGLE BUTTON */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
              title={theme === "dark" ? "Toggle Light Mode" : "Toggle Dark Mode"}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* USER META */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden text-right md:block">
                <p className="text-xs font-semibold">{user?.name}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  {user?.role}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200/50 dark:border-indigo-800/30">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT CONTAINER */}
        <main className="flex-1 overflow-y-auto p-6 focus:outline-none">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
