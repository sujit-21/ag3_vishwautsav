import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Festivals from './pages/Festivals/Festivals'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Events from './pages/Events/Events'
import Settings from './pages/Settings'
import Support from './pages/Support'
import Feedback from './pages/Feedback'
import Entity from './pages/Entity'
import AttendeePortal from './pages/AttendeePortal'
import ProtectedRoute from './components/ProtectedRoute'
import ForgotPassword from './pages/ForgotPassword'
import RoleSelection from './pages/RoleSelection'

function App() {
    return (
        <Router>
            <div className="app-container">
                <Navbar />
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/role-selection" element={<ProtectedRoute skipClubCheck><RoleSelection /></ProtectedRoute>} />
                    <Route path="/verify-entity" element={<ProtectedRoute adminOnly skipClubCheck><Entity /></ProtectedRoute>} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/feedback" element={<Feedback />} />

                    {/* Protected Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/festivals" element={<ProtectedRoute adminOnly><Festivals /></ProtectedRoute>} />
                    <Route path="/events" element={<ProtectedRoute adminOnly><Events /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute skipEntityCheck><Settings /></ProtectedRoute>} />
                    <Route path="/my-pass" element={<ProtectedRoute skipEntityCheck><AttendeePortal /></ProtectedRoute>} />

                    {/* Catch All */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </Router>
    )
}

export default App
