import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Festivals from './pages/Festivals'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Events from './pages/Events'
import Settings from './pages/Settings'
import FeedSupport from './pages/FeedSupport'
import Gallery from './pages/Gallery'
import Entity from './pages/Entity'
import AttendeePortal from './pages/AttendeePortal'
import ProtectedRoute from './components/ProtectedRoute'
import ForgotPassword from './pages/ForgotPassword'
import RoleSelection from './pages/RoleSelection'
import NotFound from './pages/NotFound'
import PublicEnrollment from './pages/PublicEnrollment/PublicEnrollment'

const AuthBackground = () => {
    const location = useLocation()
    const showBg = ['/login', '/signup', '/forgot-password', '/role-selection'].includes(location.pathname)

    if (!showBg) return null

    return <div className="auth-page-ambient" aria-hidden="true" />
}

function AnimatedRoutes() {
    return (
        <div className="route-transition-wrapper">
            <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/role-selection" element={<ProtectedRoute skipClubCheck><RoleSelection /></ProtectedRoute>} />
                    <Route path="/verify-entity" element={<ProtectedRoute adminOnly skipClubCheck><Entity /></ProtectedRoute>} />
                    
                    {/* Merged Feed & Support Route + Backwards Compatible Aliases */}
                    <Route path="/feed-support" element={<FeedSupport />} />
                    <Route path="/support" element={<FeedSupport />} />
                    <Route path="/feedback" element={<FeedSupport />} />
                    
                    <Route path="/gallery" element={<Gallery />} />

                    {/* Public Open Link for Member Enrollment & Donation/Contribution */}
                    <Route path="/enroll/:slug" element={<PublicEnrollment />} />
                    <Route path="/enroll" element={<PublicEnrollment />} />

                    {/* Protected Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/festivals" element={<ProtectedRoute adminOnly><Festivals /></ProtectedRoute>} />
                    <Route path="/events" element={<ProtectedRoute adminOnly><Events /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute skipEntityCheck><Settings /></ProtectedRoute>} />
                    <Route path="/my-pass" element={<ProtectedRoute skipEntityCheck><AttendeePortal /></ProtectedRoute>} />

                    {/* Catch All */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
        </div>
    )
}

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="app-container">
                <AuthBackground />
                <Navbar />
                <AnimatedRoutes />
                <Footer />
            </div>
        </Router>
    )
}

export default App
