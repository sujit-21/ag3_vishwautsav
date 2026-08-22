import { useState, useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { User, Menu, Zap, LogOut, ChevronRight, Sun, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import axios from 'axios'
import logoImage from '../images/VISHWA UTSAV.png'

const Navbar = () => {
    const { user, logout, isAuthenticated, verifiedEntity, setVerifiedEntity, switchRole } = useAuth()
    const { isDarkMode, toggleDarkMode } = useTheme()
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
    const hasEntity = isAdmin ? verifiedEntity : (user?.entityName || verifiedEntity)
    const navigate = useNavigate()
    const [entities, setEntities] = useState([])
    const [selectedEntity, setSelectedEntity] = useState('')
    const [securityKey, setSecurityKey] = useState('')
    const [verifying, setVerifying] = useState(false)

    useEffect(() => {
        if (isAuthenticated && !verifiedEntity) {
            axios.get('/api/entity')
                .then(res => {
                    if (Array.isArray(res.data)) {
                        setEntities(res.data)
                    }
                })
                .catch(err => console.error('Navbar entity fetch error:', err))
        }
    }, [isAuthenticated, verifiedEntity])

    const handleVerify = async (e) => {
        e.preventDefault()
        if (!selectedEntity || !securityKey) return
        setVerifying(true)
        try {
            const res = await axios.post('/api/entity/verify', { name: selectedEntity, securityKey })
            if (res.data && res.data.entity) {
                setVerifiedEntity(res.data.entity)
                setSecurityKey('')
                navigate('/')
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Verification failed')
        } finally {
            setVerifying(false)
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    const closeNavbar = () => {
        const navbarCollapse = document.getElementById('navbarNav')
        if (navbarCollapse && navbarCollapse.classList.contains('show')) {
            const toggler = document.querySelector('.navbar-toggler')
            if (toggler) toggler.click()
        }
    }

    return (
        <div className="container-fluid px-3 px-xl-5 px-xxl-5 pt-3 position-sticky top-0" style={{ zIndex: 1050 }}>
            <nav className="navbar navbar-expand-lg navbar-floating px-3 px-lg-4 py-1">
                <div className="container-fluid p-0">
                    <Link className="navbar-brand d-flex align-items-center gap-3 no-underline" to="/">
                        <div className="d-flex align-items-center justify-content-center p-1 rounded-3 shadow-glow" style={{ width: '40px', height: '40px', background: 'rgba(67, 130, 149, 0.2)', border: '1px solid rgba(163, 217, 201, 0.3)' }}>
                            <img src={logoImage} alt="Vishwa Utsav Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                    <div>
                        <h1 className="fs-4 fw-extrabold mb-0 tracking-tight m-0" style={{ color: '#D9480F' }}>
                            VishwaUtsav
                        </h1>
                    </div>
                </Link>

                <button className="navbar-toggler border-0 shadow-none p-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <div className="p-2 rounded-3 glass-card d-flex align-items-center justify-content-center">
                        <Menu size={24} style={{ color: 'var(--text-main)' }} />
                    </div>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav flex-row flex-wrap justify-content-center mx-auto align-items-center gap-2 mt-4 mt-lg-0">
                        <li className="nav-item">
                            <NavLink onClick={closeNavbar} className={({ isActive }) => `nav-link-modern py-2 px-3 small ${isActive ? 'active' : ''}`} to="/">Home</NavLink>
                        </li>

                        {/* These tabs are visible to everyone, but lead to login if not authenticated */}
                        <li className="nav-item">
                            <NavLink onClick={closeNavbar} className={({ isActive }) => `nav-link-modern py-2 px-3 small ${isActive ? 'active' : ''}`} to={isAuthenticated ? "/feedback" : "/login"}>Feed</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink onClick={closeNavbar} className={({ isActive }) => `nav-link-modern py-2 px-3 small ${isActive ? 'active' : ''}`} to={isAuthenticated ? "/my-pass" : "/login"}>Attendee Portal</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink onClick={closeNavbar} className={({ isActive }) => `nav-link-modern py-2 px-3 small ${isActive ? 'active' : ''}`} to={isAuthenticated ? "/support" : "/login"}>Support</NavLink>
                        </li>

                        {/* Admin Specific Tabs - Only show when logged in as admin with a verified entity */}
                        {isAuthenticated && isAdmin && hasEntity && (
                            <>
                                <li className="nav-item">
                                    <NavLink onClick={closeNavbar} className={({ isActive }) => `nav-link-modern py-2 px-3 small ${isActive ? 'active' : ''}`} to="/festivals">Festivals</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink onClick={closeNavbar} className={({ isActive }) => `nav-link-modern py-2 px-3 small ${isActive ? 'active' : ''}`} to="/events">Events</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink onClick={closeNavbar} className={({ isActive }) => `nav-link-modern py-2 px-3 small ${isActive ? 'active' : ''}`} to="/dashboard">Dashboard</NavLink>
                                </li>
                            </>
                        )}
                    </ul>

                    <div className="d-flex align-items-center gap-3 mt-3 mt-lg-0">
                        {/* Dark Mode Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="btn btn-link p-0 rounded-circle d-flex align-items-center justify-content-center border-0 shadow-sm transition-all"
                            style={{ 
                                color: 'var(--text-main)', 
                                background: isDarkMode ? 'rgba(163, 217, 201, 0.15)' : 'rgba(67, 130, 149, 0.15)', 
                                border: '1.5px solid var(--glass-border)',
                                width: '38px',
                                height: '38px',
                                cursor: 'pointer' 
                            }}
                            aria-label="Toggle Dark Mode"
                            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {isDarkMode ? (
                                <Sun size={18} style={{ color: 'var(--palette-amber)', filter: 'drop-shadow(0 0 5px rgba(249, 179, 98, 0.7))' }} />
                            ) : (
                                <Moon size={18} style={{ color: 'var(--palette-slate-teal)', filter: 'drop-shadow(0 0 5px rgba(67, 130, 149, 0.5))' }} />
                            )}
                        </button>

                        {/* Manual Role Selector Tabs */}
                        {isAuthenticated && (
                            <div className="d-flex align-items-center p-1 rounded-pill shadow-sm" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                                <span className="px-3 py-1 rounded-pill text-uppercase fw-extrabold ls-1 text-white shadow-sm" style={{ fontSize: '0.65rem', background: 'linear-gradient(135deg, var(--palette-terracotta), var(--palette-rust))' }}>
                                    {user?.role === 'admin' ? 'ADMIN' : 'USER'}
                                </span>
                            </div>
                        )}

                        {isAuthenticated ? (
                            <div className="dropdown ms-2 ps-2 border-start border-secondary border-opacity-25">
                                <button className="btn btn-link dropdown-toggle d-flex align-items-center gap-2 p-0 border-0 no-caret text-decoration-none" style={{ color: 'var(--text-main)' }} type="button" id="userMenu" data-bs-toggle="dropdown" aria-expanded="false">
                                    <div className="d-flex align-items-center justify-content-center text-white rounded-circle shadow-sm" style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, var(--palette-terracotta), var(--palette-rust))' }}>
                                        <User size={18} />
                                    </div>
                                    <div className="d-none d-xxl-flex flex-column align-items-start">
                                        <span className="fw-extrabold m-0 text-uppercase" style={{ fontSize: '0.65rem', color: 'var(--palette-terracotta)' }}>
                                            {user?.name && user.name.toLowerCase() !== 'user' ? user.name : (user?.email?.split('@')[0] || 'Account')}
                                        </span>
                                    </div>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end p-2 mt-2 shadow-lg rounded-3 border" aria-labelledby="userMenu" style={{ background: 'var(--secondary-bg)', borderColor: 'var(--glass-border)', backdropFilter: 'blur(16px)' }}>
                                    <li><Link onClick={closeNavbar} className="dropdown-item rounded mb-1 small text-main fw-semibold hover-glow" to="/settings">Profile Settings</Link></li>
                                    <li><hr className="dropdown-divider bg-secondary opacity-25 my-1" /></li>
                                    <li><button onClick={handleLogout} className="dropdown-item text-danger rounded d-flex align-items-center gap-2 small fw-semibold hover-glow">
                                        <LogOut size={14} /> Logout
                                    </button></li>
                                </ul>
                            </div>
                        ) : (
                            <Link onClick={closeNavbar} className="btn btn-premium px-3 py-2 rounded-pill shadow-sm d-flex align-items-center tiny fw-bold" to="/login">
                                Login <ChevronRight size={14} className="ms-1" />
                            </Link>
                        )}
                    </div>
                </div>
                </div>
            </nav>
        </div>
    )
}

export default Navbar
