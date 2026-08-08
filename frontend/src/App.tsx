import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminLayout } from "./components/layout/AdminLayout";
import { DocumentRequests } from "./pages/DocumentRequests";
import { IssueReports } from "./pages/IssueReports";
// 1. Import the new pages
import { Announcements } from "./pages/Announcements";
import { Activities } from "./pages/Activities";

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
                        <Route path="/queue" element={<IssueReports />} />
                        <Route path="/documents" element={<DocumentRequests />} />
                        <Route path="/reports" element={<IssueReports />} />
                        {/* 2. Register the new routes */}
                        <Route path="/announcements" element={<Announcements />} />
                        <Route path="/activities" element={<Activities />} />
                        
                        <Route path="/" element={<Navigate to="/dashboard" replace/>} />
                    </Route>
                </Route>
            </Routes>
        </Router>
    );
}
