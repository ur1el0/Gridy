import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminLayout } from "./components/layout/AdminLayout";
import { DocumentRequests } from "./pages/DocumentRequests";
import { IssueReports } from "./pages/IssueReports";
import { Communications } from "./pages/Communications";
import { LiveQueue } from "./pages/LiveQueue";
import ResidentVerification from "./pages/ResidentVerification";
import { ResidentsManagement } from "./pages/ResidentsManagement";
import { AdminProfile } from "./pages/AdminProfile";
import { Settings } from "./pages/Settings";
import { Notifications } from "./pages/Notifications";
import { Faqs } from "./pages/Faqs";

export function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />}/>
                
                {/* Protected Routes Wrapper */}
                <Route element={<ProtectedRoute/>}>
                    {/* UI Layout Wrapper */}
                    <Route element={<AdminLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/queue" element={<LiveQueue />} />
                        <Route path="/documents" element={<DocumentRequests />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/faqs" element={<Faqs />} />
                        
                        {/* New Combined Route */}
                        <Route path="/communications" element={<Communications />} />
                        
                        {/* Resident Management Routes */}
                        <Route path="/directory" element={<ResidentsManagement />} />
                        <Route path="/verifications" element={<ResidentVerification />} />
                        
                        <Route path="/reports" element={<IssueReports />} />
                        
                        <Route path="/" element={<Navigate to="/dashboard" replace/>} />
                        <Route path="/profile" element={<AdminProfile />} />
                    </Route>
                </Route>
            </Routes>
        </Router>
    );
}
