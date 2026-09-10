import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "react-hot-toast";

// Layout Imports
import { AuthLayout } from "./layouts/AuthLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";

// Route Guard Imports
import { ProtectedRoute, PublicRoute } from "./components/RouteGuards";

// Page Imports
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TrainerManagement from "./pages/TrainerManagement";
import BatchManagement from "./pages/BatchManagement";
import StudentRegistration from "./pages/StudentRegistration";
import StudentDirectory from "./pages/StudentDirectory";
import AttendanceSheet from "./pages/AttendanceSheet";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import SearchResults from "./pages/SearchResults";
import SuspiciousDashboard from "./pages/SuspiciousDashboard";
import AuditLogs from "./pages/AuditLogs";
import AttendanceMarking from "./pages/AttendanceMarking";
import { NotFound, Forbidden } from "./pages/ErrorPages";


export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          {/* Toast Notification Container */}
          <Toaster
            position="top-right"
            toastOptions={{
              className: "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800",
              duration: 4000
            }}
          />

          <Routes>
            {/* PUBLIC GUEST ONLY ROUTES */}
            <Route element={<PublicRoute />}>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
              </Route>
            </Route>

            {/* PUBLIC STANDALONE ROUTES */}
            <Route path="/register/:token" element={<StudentRegistration />} />
            <Route path="/attendance/:token" element={<AttendanceMarking />} />

            {/* PROTECTED AUTHENTICATED ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={["ADMIN", "TRAINER"]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Batches and Students accessible by both, with role-specific filters */}
                <Route path="/batches" element={<BatchManagement />} />
                <Route path="/students" element={<StudentDirectory />} />
                <Route path="/attendance/batch/:batchId/day/:dayIndex" element={<AttendanceSheet />} />
                <Route path="/suspicious-activity" element={<SuspiciousDashboard />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/search" element={<SearchResults />} />
                
                <Route path="/403" element={<Forbidden />} />
              </Route>
            </Route>

            {/* SHARED AUTHENTICATED ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={["ADMIN", "TRAINER", "STUDENT"]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Route>


            {/* ADMIN ONLY ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/trainers" element={<TrainerManagement />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            {/* 404 ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
