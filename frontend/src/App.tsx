import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { Dashboard } from "./pages/admin/Dashboard";
import { ProtectedRoute } from "./components/core/ProtectedRoute";
import { AdminLayout } from "./components/layout/AdminLayout";
import { DocumentRequests } from "./pages/services/DocumentRequests";
import { IssueReports } from "./pages/services/IssueReports";
import { Communications } from "./pages/services/Communications";
import { LiveQueue } from "./pages/services/LiveQueue";
import ResidentVerification from "./pages/community/ResidentVerification";
import { ResidentsManagement } from "./pages/community/ResidentsManagement";
import { AdminProfile } from "./pages/admin/AdminProfile";
import { Settings } from "./pages/admin/Settings";
import { Notifications } from "./pages/community/Notifications";
import { Faqs } from "./pages/community/Faqs";
import { DILGDashboard } from "./pages/admin/DILGDashboard";
import { BarangaySettings } from "./pages/admin/BarangaySettings";
import { ErrorBoundary } from "./components/core/ErrorBoundary";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { ResetPassword } from "./pages/auth/ResetPassword";

export function App() {
    return (
        <ErrorBoundary>
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />}/>
                    <Route path="/register" element={<Register />}/>
                    <Route path="/forgot-password" element={<ForgotPassword />}/>
                    <Route path="/reset-password" element={<ResetPassword />}/>
                    
                    {/* Protected Routes Wrapper */}
                    <Route element={<ProtectedRoute/>}>
                        {/* UI Layout Wrapper */}
                        <Route element={<AdminLayout />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/dilg-analytics" element={<DILGDashboard />} />
                            <Route path="/queue" element={<LiveQueue />} />
                            <Route path="/documents" element={<DocumentRequests />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/barangay-settings" element={<BarangaySettings/>} />
                            <Route path="/notifications" element={<Notifications />} />
                            <Route path="/faqs" element={<Faqs />} />
                            
                            {/* New Combined Route */}
                            <Route path="/communications" element={<Communications />} />
                            
                            {/* Resident Management Routes */}
                            <Route path="/residents" element={<ResidentsManagement />} />
                            <Route path="/verifications" element={<ResidentVerification />} />
                            
                            <Route path="/reports" element={<IssueReports />} />
                            
                            <Route path="/" element={<Navigate to="/dashboard" replace/>} />
                            <Route path="/profile" element={<AdminProfile />} />
                        </Route>
                    </Route>
                </Routes>
            </Router>
        </ErrorBoundary>
    );
}
