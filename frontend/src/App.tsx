import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { Dashboard } from "./pages/admin/Dashboard";
import { ProtectedRoute } from "./components/core/ProtectedRoute";
import { AdminLayout } from "./components/layout/AdminLayout";
import { CitizenLayout } from "./components/layout/CitizenLayout";
import { CitizenDocuments } from "./pages/citizen/CitizenDocuments";
import { CitizenQueue } from "./pages/citizen/CitizenQueue";
import { CitizenBulletin } from "./pages/citizen/CitizenBulletin";
import { DocumentRequests } from "./pages/services/DocumentRequests";
import { IssueReports } from "./pages/services/IssueReports";
import { Communications } from "./pages/services/Communications";
import { LiveQueue } from "./pages/services/LiveQueue";
import { AdminProfile } from "./pages/admin/AdminProfile";
import { Settings } from "./pages/admin/Settings";
import { Notifications } from "./pages/community/Notifications";
import { Faqs } from "./pages/community/Faqs";
import { DILGDashboard } from "./pages/admin/DILGDashboard";
import { BarangaySettings } from "./pages/admin/BarangaySettings";
import { ErrorBoundary } from "./components/core/ErrorBoundary";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { ResetPassword } from "./pages/auth/ResetPassword";
import { ResidentsHub } from "./pages/community/ResidentsHub";

function RootRedirect() {
    const { isAuthenticated, user } = useAuth();
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    if (user?.role === 'RESIDENT') {
        return <Navigate to="/portal/documents" replace />;
    }
    return <Navigate to="/dashboard" replace />;
}

export function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <Router>
                    <Routes>
                        {/* Root Intelligent Redirection */}
                        <Route path="/" element={<RootRedirect />} />

                        {/* Public Auth Routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />

                        {/* Admin & Official Workstation (Tier 1 & Tier 2) */}
                        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'DILG_ADMIN']} />}>
                            <Route element={<AdminLayout />}>
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/dilg-analytics" element={<DILGDashboard />} />
                                <Route path="/queue" element={<LiveQueue />} />
                                <Route path="/documents" element={<DocumentRequests />} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="/barangay-settings" element={<BarangaySettings />} />
                                <Route path="/notifications" element={<Notifications />} />
                                <Route path="/faqs" element={<Faqs />} />
                                <Route path="/communications" element={<Communications />} />
                                <Route path="/residents" element={<ResidentsHub />} />
                                <Route path="/verifications" element={<Navigate to="/residents?tab=verifications" replace />} />    
                                <Route path="/reports" element={<IssueReports />} />
                                <Route path="/profile" element={<AdminProfile />} />
                            </Route>
                        </Route>

                        {/* Citizen Desktop Portal (Tier 4: Residents & Self-Service Kiosks) */}
                        <Route element={<ProtectedRoute allowedRoles={['RESIDENT']} />}>
                            <Route element={<CitizenLayout />}>
                                <Route path="/portal" element={<Navigate to="/portal/documents" replace />} />
                                <Route path="/portal/documents" element={<CitizenDocuments />} />
                                <Route path="/portal/queue" element={<CitizenQueue />} />
                                <Route path="/portal/bulletin" element={<CitizenBulletin />} />
                            </Route>
                        </Route>

                        {/* Fallback wildcard */}
                        <Route path="*" element={<RootRedirect />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </ErrorBoundary>
    );
}