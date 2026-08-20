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

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
    <h1 className="text-3xl font-extrabold text-slate-800 mb-2">{title}</h1>
    <p className="text-slate-500">This module is currently under development. Check back soon!</p>
  </div>
);

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
                        <Route path="/profile" element={<PlaceholderPage title="Admin Profile" />} />
                        <Route path="/notifications" element={<PlaceholderPage title="Notifications" />} />
                        <Route path="/faqs" element={<PlaceholderPage title="Help & FAQs" />} />

                        
                        {/* New Combined Route */}
                        <Route path="/communications" element={<Communications />} />
                        
                        {/* Resident Management Routes */}
                        <Route path="/directory" element {<ResidentsManagement />} />
                        <Route path="/residents" element={<ResidentVerification />} />
                        
                        <Route path="/reports" element={<IssueReports />} />
                        
                        <Route path="/" element={<Navigate to="/dashboard" replace/>} />
                    </Route>
                </Route>
            </Routes>
        </Router>
    );
}
