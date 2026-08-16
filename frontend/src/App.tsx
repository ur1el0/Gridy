import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminLayout } from "./components/layout/AdminLayout";
import { DocumentRequests } from "./pages/DocumentRequests";
import { IssueReports } from "./pages/IssueReports";
import { Announcements } from "./pages/Announcements";
import { Activities } from "./pages/Activities";
import { LiveQueue } from "./pages/LiveQueue";
import ResidentVerification from "./pages/ResidentVerification";

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
                        <Route path="/reports" element={<IssueReports />} />
                        <Route path="/announcements" element={<Announcements />} />
                        <Route path="/activities" element={<Activities />} />
                        <Route path="/residents" element={<ResidentVerification />} />
                        
                        <Route path="/" element={<Navigate to="/dashboard" replace/>} />
                    </Route>
                </Route>
            </Routes>
        </Router>
    );
}
