import { useState, useEffect } from 'react'
import './Auth.css'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { 
    LogIn, UserPlus, User, Lock, Eye, EyeOff, ShieldCheck, 
    Building2, Key, CheckCircle2, ChevronRight, Download, Users 
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'

const Auth = ({ defaultTab = 'login' }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const { login, isAuthenticated, setVerifiedEntity, user } = useAuth()

    // Determine active tab from prop or route
    const [activeTab, setActiveTab] = useState(
        location.pathname === '/signup' ? 'signup' : (defaultTab || 'login')
    )

    // Login Form State
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    })
    const [rememberMe, setRememberMe] = useState(false)

    // Signup Form State
    const [signupData, setSignupData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user', // 'user' or 'admin'
        entityMode: 'create', // 'create' or 'join'
        entityName: '',
        securityKey: ''
    })

    // UI Feedback & Entities
    const [error, setError] = useState('')
    const [successMsg, setSuccessMsg] = useState('')
    const [loading, setLoading] = useState(false)
    const [showLoginPassword, setShowLoginPassword] = useState(false)
    const [showSignupPassword, setShowSignupPassword] = useState(false)
    const [showSecurityKey, setShowSecurityKey] = useState(false)
    const [availableEntities, setAvailableEntities] = useState([])
    const [entitySearch, setEntitySearch] = useState('')
    const [isEntityDropdownOpen, setIsEntityDropdownOpen] = useState(false)

    // Load remembered email and check redirect
    useEffect(() => {
        const savedEmail = localStorage.getItem('rememberedEmail')
        if (savedEmail) {
            setLoginData(prev => ({ ...prev, email: savedEmail }))
            setRememberMe(true)
        }

        if (isAuthenticated && user) {
            if (user.role === 'admin' || user.role === 'superadmin') {
                navigate('/dashboard', { replace: true })
            } else {
                navigate('/my-pass', { replace: true })
            }
        }
    }, [isAuthenticated, user, navigate])

    // Sync tab with pathname changes
    useEffect(() => {
        if (location.pathname === '/signup') {
            setActiveTab('signup')
        } else if (location.pathname === '/login') {
            setActiveTab('login')
        }
        setError('')
        setSuccessMsg('')
    }, [location.pathname])

    // Fetch existing entities when Organizer / Admin role is selected
    useEffect(() => {
        if (activeTab === 'signup' && signupData.role === 'admin') {
            fetchEntities()
        }
    }, [activeTab, signupData.role])

    const fetchEntities = async () => {
        try {
            const res = await axios.get('/api/entity/all')
            if (Array.isArray(res.data)) {
                setAvailableEntities(res.data)
            }
        } catch (err) {
            console.warn('Error fetching entities for dropdown:', err)
        }
    }

    const switchTab = (tab) => {
        setActiveTab(tab)
        setError('')
        setSuccessMsg('')
        if (tab === 'signup' && location.pathname !== '/signup') {
            navigate('/signup', { replace: true })
        } else if (tab === 'login' && location.pathname !== '/login') {
            navigate('/login', { replace: true })
        }
    }

    const downloadCredentialsBackup = (entityName, securityKey, adminName) => {
        try {
            const element = document.createElement('a')
            const text = `====================================================
VISHWA UTSAV - ENTITY & ADMIN CREDENTIALS BACKUP
====================================================
Entity / Organization: ${entityName}
Entity Security Key:   ${securityKey}
Admin Account Name:    ${adminName}
Created Date:          ${new Date().toLocaleString()}

IMPORTANT:
- Keep this file safe.
- Share this Security Key with trusted co-admins so they can join and manage ${entityName} with you!
====================================================`
            const file = new Blob([text], { type: 'text/plain' })
            element.href = URL.createObjectURL(file)
            element.download = `${entityName.replace(/\s+/g, '_')}_Credentials.txt`
            document.body.appendChild(element)
            element.click()
            document.body.removeChild(element)
        } catch (err) {
            console.error('Download backup error:', err)
        }
    }

    // Handle Login Submit
    const handleLoginSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', loginData.email)
            } else {
                localStorage.removeItem('rememberedEmail')
            }

            const res = await axios.post('/api/auth/login', loginData)
            const { user: userData, token, entity } = res.data

            login(userData, token, rememberMe)

            if (entity) {
                setVerifiedEntity(entity)
            }

            // Direct friction-free routing
            if (userData.role === 'admin' || userData.role === 'superadmin') {
                if (entity || userData.entityName) {
                    navigate('/dashboard')
                } else {
                    navigate('/verify-entity')
                }
            } else {
                navigate('/my-pass')
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials. Please check your email and password.')
        } finally {
            setLoading(false)
        }
    }

    // Handle Signup Submit
    const handleSignupSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccessMsg('')
        setLoading(true)

        try {
            const payload = {
                name: signupData.name,
                email: signupData.email,
                password: signupData.password,
                role: signupData.role,
                entityMode: signupData.entityMode,
                entityName: signupData.role === 'admin' ? signupData.entityName : undefined,
                securityKey: signupData.role === 'admin' ? signupData.securityKey : undefined
            }

            const res = await axios.post('/api/auth/signup', payload)
            const { user: userData, token, entity, isNewEntity } = res.data

            // Auto download backup credentials file if newly created
            if (isNewEntity && signupData.entityName && signupData.securityKey) {
                downloadCredentialsBackup(signupData.entityName, signupData.securityKey, signupData.name)
            }

            // Immediately log in user without forcing them to retype
            login(userData, token, true)

            if (entity) {
                setVerifiedEntity(entity)
            }

            // Direct friction-free routing
            if (userData.role === 'admin') {
                navigate('/dashboard')
            } else {
                navigate('/my-pass')
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error creating account. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    // Filtered entities for dropdown
    const filteredEntities = availableEntities.filter(ent => 
        ent.name?.toLowerCase().includes(entitySearch.toLowerCase())
    )

    return (
        <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '82vh' }}>
            <Helmet>
                <title>{activeTab === 'login' ? 'Login' : 'Create Account'} — Vishwa Utsav</title>
                <meta name="description" content="Access festival management, event passes, and the Vishwa Utsav cultural portal." />
            </Helmet>

            <div className="auth-card-container">
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="glass-card-premium p-4 p-sm-4 shadow-premium border-opacity-10"
                >
                    {/* Brand Heading */}
                    <div className="text-center mb-3">
                        <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-2" style={{ width: '52px', height: '52px', background: 'linear-gradient(135deg, rgba(224, 122, 67, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)', border: '1.5px solid rgba(224, 122, 67, 0.25)' }}>
                            {activeTab === 'login' ? (
                                <LogIn size={24} style={{ color: 'var(--palette-terracotta)' }} />
                            ) : (
                                <UserPlus size={24} style={{ color: 'var(--palette-terracotta)' }} />
                            )}
                        </div>
                        <h3 className="fw-bold mb-1" style={{ color: 'var(--text-main)', fontSize: '1.35rem' }}>
                            {activeTab === 'login' ? 'Welcome Back' : 'Join Vishwa Utsav'}
                        </h3>
                        <p className="text-muted small mb-0">
                            {activeTab === 'login' 
                                ? 'Sign in to access your pass and dashboard' 
                                : 'Create your account in seconds'}
                        </p>
                    </div>

                    {/* Sliding Tab Switcher */}
                    <div className="auth-nav-tabs mb-4">
                        <button
                            type="button"
                            className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                            onClick={() => switchTab('login')}
                        >
                            <LogIn size={15} /> Sign In
                        </button>
                        <button
                            type="button"
                            className={`auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
                            onClick={() => switchTab('signup')}
                        >
                            <UserPlus size={15} /> Create Account
                        </button>
                    </div>

                    {/* Alert Message */}
                    {error && (
                        <div className="alert alert-danger mb-3 py-2 px-3 small border-0 text-center fw-semibold rounded-3" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                            {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="alert alert-success mb-3 py-2 px-3 small border-0 text-center fw-semibold rounded-3" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                            {successMsg}
                        </div>
                    )}

                    {/* ================= SIGN IN TAB ================= */}
                    {activeTab === 'login' && (
                        <form onSubmit={handleLoginSubmit}>
                            <div className="mb-3 text-start">
                                <label className="form-label text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.68rem', letterSpacing: '1px' }}>
                                    Email or Phone Number
                                </label>
                                <div className="input-group-premium align-items-center" style={{ height: '44px' }}>
                                    <User size={16} className="text-muted ms-3" />
                                    <input
                                        type="text"
                                        placeholder="Email or Phone Number"
                                        value={loginData.email}
                                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                        required
                                        className="form-control-custom"
                                    />
                                </div>
                            </div>

                            <div className="mb-3 text-start">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <label className="form-label text-muted text-uppercase fw-bold mb-0" style={{ fontSize: '0.68rem', letterSpacing: '1px' }}>
                                        Password
                                    </label>
                                    <Link to="/forgot-password" className="text-decoration-none small" style={{ fontSize: '0.75rem', color: 'var(--palette-terracotta)' }}>
                                        Forgot Password?
                                    </Link>
                                </div>
                                <div className="input-group-premium align-items-center position-relative" style={{ height: '44px' }}>
                                    <Lock size={16} className="text-muted ms-3" />
                                    <input
                                        type={showLoginPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={loginData.password}
                                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                        required
                                        className="form-control-custom pe-5"
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted p-0 me-3 border-0"
                                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                                        aria-label={showLoginPassword ? "Hide password" : "Show password"}
                                    >
                                        {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="d-flex align-items-center justify-content-between mb-4">
                                <label className="d-flex align-items-center gap-2 cursor-pointer small text-muted m-0 user-select-none">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="form-check-input mt-0"
                                    />
                                    <span>Remember email</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-premium w-100 py-2.5 rounded-pill shadow-sm d-flex align-items-center justify-content-center fw-bold"
                            >
                                {loading ? (
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                ) : (
                                    <>Sign In <ChevronRight size={16} className="ms-1" /></>
                                )}
                            </button>

                            <div className="text-center mt-3">
                                <span className="small text-muted">Don't have an account? </span>
                                <button
                                    type="button"
                                    onClick={() => switchTab('signup')}
                                    className="btn btn-link p-0 small fw-bold text-decoration-none"
                                    style={{ color: 'var(--palette-terracotta)', fontSize: '0.85rem' }}
                                >
                                    Create Account
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ================= CREATE ACCOUNT TAB ================= */}
                    {activeTab === 'signup' && (
                        <form onSubmit={handleSignupSubmit}>
                            {/* Role Selection Grid */}
                            <div className="mb-3 text-start">
                                <label className="form-label text-muted text-uppercase fw-bold mb-1.5" style={{ fontSize: '0.68rem', letterSpacing: '1px' }}>
                                    I Am Joining As
                                </label>
                                <div className="role-choice-grid">
                                    <div 
                                        className={`role-choice-card ${signupData.role === 'user' ? 'selected' : ''}`}
                                        onClick={() => setSignupData({ ...signupData, role: 'user' })}
                                    >
                                        <div className="role-title">
                                            <User size={15} style={{ color: signupData.role === 'user' ? 'var(--palette-terracotta)' : 'inherit' }} />
                                            Participant
                                        </div>
                                        <div className="role-subtitle">
                                            Browse festivals & access digital pass
                                        </div>
                                    </div>

                                    <div 
                                        className={`role-choice-card ${signupData.role === 'admin' ? 'selected' : ''}`}
                                        onClick={() => setSignupData({ ...signupData, role: 'admin' })}
                                    >
                                        <div className="role-title">
                                            <ShieldCheck size={15} style={{ color: signupData.role === 'admin' ? 'var(--palette-terracotta)' : 'inherit' }} />
                                            Admin
                                        </div>
                                        <div className="role-subtitle">
                                            Manage festivals, events & passes
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Full Name */}
                            <div className="mb-3 text-start">
                                <label className="form-label text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.68rem', letterSpacing: '1px' }}>
                                    Full Name
                                </label>
                                <div className="input-group-premium align-items-center" style={{ height: '44px' }}>
                                    <User size={16} className="text-muted ms-3" />
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={signupData.name}
                                        onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                                        required
                                        className="form-control-custom"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="mb-3 text-start">
                                <label className="form-label text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.68rem', letterSpacing: '1px' }}>
                                    Email or Phone Number
                                </label>
                                <div className="input-group-premium align-items-center" style={{ height: '44px' }}>
                                    <User size={16} className="text-muted ms-3" />
                                    <input
                                        type="text"
                                        placeholder="Email or Phone Number"
                                        value={signupData.email}
                                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                                        required
                                        className="form-control-custom"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="mb-3 text-start">
                                <label className="form-label text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.68rem', letterSpacing: '1px' }}>
                                    Create Password
                                </label>
                                <div className="input-group-premium align-items-center position-relative" style={{ height: '44px' }}>
                                    <Lock size={16} className="text-muted ms-3" />
                                    <input
                                        type={showSignupPassword ? "text" : "password"}
                                        placeholder="Min 6 characters"
                                        value={signupData.password}
                                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                                        required
                                        minLength={6}
                                        className="form-control-custom pe-5"
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted p-0 me-3 border-0"
                                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                                        aria-label={showSignupPassword ? "Hide password" : "Show password"}
                                    >
                                        {showSignupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* ================= ORGANIZER ENTITY SECTION ================= */}
                            {signupData.role === 'admin' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-3 rounded-3 mb-3 text-start"
                                    style={{ background: 'rgba(224, 122, 67, 0.05)', border: '1px dashed rgba(224, 122, 67, 0.3)' }}
                                >
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <span className="small fw-bold d-flex align-items-center gap-1.5" style={{ color: 'var(--palette-terracotta)' }}>
                                            <Building2 size={15} /> Entity / Club Assignment
                                        </span>
                                    </div>

                                    {/* Sub-mode pills: Create New vs Join Existing */}
                                    <div className="submode-pill-group mb-3">
                                        <button
                                            type="button"
                                            className={`submode-pill-btn ${signupData.entityMode === 'create' ? 'active' : ''}`}
                                            onClick={() => setSignupData({ ...signupData, entityMode: 'create' })}
                                        >
                                            <Building2 size={13} /> Create New Entity
                                        </button>
                                        <button
                                            type="button"
                                            className={`submode-pill-btn ${signupData.entityMode === 'join' ? 'active' : ''}`}
                                            onClick={() => setSignupData({ ...signupData, entityMode: 'join' })}
                                        >
                                            <Users size={13} /> Join Existing Entity
                                        </button>
                                    </div>

                                    {/* Entity Name Input or Selector */}
                                    {signupData.entityMode === 'create' ? (
                                        <div className="mb-2.5">
                                            <label className="form-label text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.65rem' }}>
                                                New Entity / Festival Name
                                            </label>
                                            <div className="input-group-premium align-items-center" style={{ height: '40px' }}>
                                                <Building2 size={15} className="text-muted ms-3" />
                                                <input
                                                    type="text"
                                                    placeholder="e.g., IIT Bombay Cultural Club"
                                                    value={signupData.entityName}
                                                    onChange={(e) => setSignupData({ ...signupData, entityName: e.target.value })}
                                                    required={signupData.role === 'admin'}
                                                    className="form-control-custom"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-2.5 position-relative">
                                            <label className="form-label text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.65rem' }}>
                                                Select Existing Entity
                                            </label>
                                            <div className="input-group-premium align-items-center" style={{ height: '40px' }}>
                                                <Building2 size={15} className="text-muted ms-3" />
                                                <input
                                                    type="text"
                                                    placeholder="Search or type entity name..."
                                                    value={signupData.entityName}
                                                    onChange={(e) => {
                                                        setSignupData({ ...signupData, entityName: e.target.value })
                                                        setEntitySearch(e.target.value)
                                                        setIsEntityDropdownOpen(true)
                                                    }}
                                                    onFocus={() => setIsEntityDropdownOpen(true)}
                                                    required={signupData.role === 'admin'}
                                                    className="form-control-custom"
                                                />
                                            </div>

                                            {/* Dropdown suggestions */}
                                            {isEntityDropdownOpen && filteredEntities.length > 0 && (
                                                <div 
                                                    className="entity-select-dropdown position-absolute w-100 mt-1 z-3"
                                                    onMouseLeave={() => setIsEntityDropdownOpen(false)}
                                                >
                                                    {filteredEntities.map((ent, idx) => (
                                                        <div
                                                            key={ent._id || idx}
                                                            className="entity-select-item"
                                                            onClick={() => {
                                                                setSignupData({ ...signupData, entityName: ent.name })
                                                                setIsEntityDropdownOpen(false)
                                                            }}
                                                        >
                                                            <span>{ent.name}</span>
                                                            <CheckCircle2 size={13} className="text-muted" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Security Key Input */}
                                    <div className="mb-1">
                                        <label className="form-label text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.65rem' }}>
                                            {signupData.entityMode === 'create' ? 'Set Entity Security Passcode' : 'Entity Security Passcode'}
                                        </label>
                                        <div className="input-group-premium align-items-center position-relative" style={{ height: '40px' }}>
                                            <Key size={15} className="text-muted ms-3" />
                                            <input
                                                type={showSecurityKey ? "text" : "password"}
                                                placeholder={signupData.entityMode === 'create' ? "Create secret key (e.g. FEST@2026)" : "Enter entity security key"}
                                                value={signupData.securityKey}
                                                onChange={(e) => setSignupData({ ...signupData, securityKey: e.target.value })}
                                                required={signupData.role === 'admin'}
                                                className="form-control-custom pe-5"
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted p-0 me-3 border-0"
                                                onClick={() => setShowSecurityKey(!showSecurityKey)}
                                                aria-label={showSecurityKey ? "Hide key" : "Show key"}
                                            >
                                                {showSecurityKey ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                        <p className="text-muted mt-1 mb-0" style={{ fontSize: '0.68rem', lineHeight: '1.3' }}>
                                            {signupData.entityMode === 'create' 
                                                ? 'Share this key with co-admins so they can join this entity. A backup credentials file will be automatically downloaded.'
                                                : 'Enter the key provided by the entity creator to join as an equal Admin.'}
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-premium w-100 py-2.5 rounded-pill shadow-sm d-flex align-items-center justify-content-center fw-bold"
                            >
                                {loading ? (
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                ) : (
                                    <>
                                        {signupData.role === 'admin' 
                                            ? (signupData.entityMode === 'create' ? 'Register Entity & Open Dashboard' : 'Join Entity as Admin')
                                            : 'Create Account & Continue'}
                                        <ChevronRight size={16} className="ms-1" />
                                    </>
                                )}
                            </button>

                            <div className="text-center mt-3">
                                <span className="small text-muted">Already have an account? </span>
                                <button
                                    type="button"
                                    onClick={() => switchTab('login')}
                                    className="btn btn-link p-0 small fw-bold text-decoration-none"
                                    style={{ color: 'var(--palette-terracotta)', fontSize: '0.85rem' }}
                                >
                                    Sign In
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </div>
    )
}

export default Auth
