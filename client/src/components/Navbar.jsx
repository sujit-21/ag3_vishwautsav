import { useState, useEffect, useRef, useCallback } from 'react'
import './Navbar.css'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { User, Menu, X, LogOut, ChevronRight, Sun, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import axios from 'axios'
import logoImage from '../images/VISHWA UTSAV.png'

const Navbar = () => {
    const { user, logout, isAuthenticated, verifiedEntity, setVerifiedEntity } = useAuth()
    const { isDarkMode, toggleDarkMode } = useTheme()
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
    const hasEntity = isAdmin ? verifiedEntity : (user?.entityName || verifiedEntity)
    const navigate = useNavigate()
    const location = useLocation()

    const [mobileOpen, setMobileOpen] = useState(false)
    const [entities, setEntities] = useState([])

    // Liquid navbar DOM refs
    const trackRef = useRef(null)
    const gooRef = useRef(null)
    const indicatorRef = useRef(null)
    const glowRef = useRef(null)

    // Position the liquid pill & glow under the given target element
    const place = useCallback((link, animate = true) => {
        const goo = gooRef.current
        const indicator = indicatorRef.current
        const glow = glowRef.current
        if (!goo || !indicator || !glow || !link) return

        const g = goo.getBoundingClientRect()
        const r = link.getBoundingClientRect()

        const x = r.left - g.left
        const y = r.top - g.top
        const w = r.width
        const h = r.height

        if (!animate) {
            indicator.style.transition = 'none'
            glow.style.transition = 'none'
        }

        indicator.style.width = `${w}px`
        indicator.style.height = `${h}px`
        indicator.style.transform = `translate3d(${x}px, ${y}px, 0)`

        glow.style.width = `${w}px`
        glow.style.height = `${h}px`
        glow.style.transform = `translate3d(${x}px, ${y}px, 0)`

        if (!animate) {
            void indicator.offsetWidth // Flush layout
            indicator.style.transition = ''
            glow.style.transition = ''
        }
    }, [])

    // Synchronize liquid pill with currently active route link
    const syncActive = useCallback((animate = true) => {
        if (!trackRef.current) return
        const activeLink = trackRef.current.querySelector('.nav__link.is-active') || trackRef.current.querySelector('.nav__link')
        if (activeLink) {
            place(activeLink, animate)
        }
    }, [place])

    useEffect(() => {
        // Allow DOM to settle before placing indicator
        const timer = setTimeout(() => syncActive(false), 60)

        let resizeTimer
        const handleResize = () => {
            clearTimeout(resizeTimer)
            resizeTimer = setTimeout(() => syncActive(false), 100)
        }

        window.addEventListener('resize', handleResize)
        if (document.fonts?.ready) {
            document.fonts.ready.then(() => syncActive(false))
        }

        return () => {
            clearTimeout(timer)
            clearTimeout(resizeTimer)
            window.removeEventListener('resize', handleResize)
        }
    }, [location.pathname, isAuthenticated, isAdmin, hasEntity, syncActive])

    // Load entities if authenticated admin without verified entity
    useEffect(() => {
        if (isAuthenticated && !verifiedEntity) {
            axios.get('/api/entity')
                .then(res => {
                    if (Array.isArray(res.data)) setEntities(res.data)
                })
                .catch(err => console.error('Navbar entity fetch error:', err))
        }
    }, [isAuthenticated, verifiedEntity])

    const handleLogout = () => {
        logout()
        navigate('/')
        setMobileOpen(false)
    }

    const closeMobile = () => {
        setMobileOpen(false)
    }

    return (
        <div className="nav-wrapper">
            {/* ================= NAVBAR ================= */}
            <nav className="nav" id="nav" aria-label="Primary">
                {/* Brand / Logo */}
                <Link to="/" className="nav__brand d-flex align-items-center gap-2 gap-sm-3" onClick={closeMobile}>
                    <div className="nav__logo-badge">
                        <img src={logoImage} alt="Vishwa Utsav" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                    </div>
                    <span className="nav__brand-title">VishwaUtsav</span>
                </Link>

                {/* Desktop Liquid Pill Track */}
                <div
                    className="nav__track"
                    ref={trackRef}
                    onPointerLeave={() => syncActive(true)}
                >
                    {/* Layer 1: slowly drifting liquid colour */}
                    <div className="nav__aura" aria-hidden="true">
                        <span className="aura a1" />
                        <span className="aura a2" />
                        <span className="aura a3" />
                        <span className="aura a4" />
                    </div>

                    {/* Layer 2: gooey liquid pill */}
                    <div className="nav__goo" id="goo" ref={gooRef} aria-hidden="true">
                        <div className="indicator" id="indicator" ref={indicatorRef}>
                            <span className="drop drop-a" />
                            <span className="drop drop-b" />
                        </div>
                    </div>

                    {/* Layer 3: glow that follows the pill */}
                    <div className="nav__glow" aria-hidden="true">
                        <div className="glow" id="glow" ref={glowRef} />
                    </div>

                    {/* Navigation Links */}
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}
                        onPointerEnter={(e) => place(e.currentTarget, true)}
                        onFocus={(e) => place(e.currentTarget, true)}
                    >
                        Home
                    </NavLink>

                    <NavLink
                        to={isAuthenticated ? "/feedback" : "/login"}
                        className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}
                        onPointerEnter={(e) => place(e.currentTarget, true)}
                        onFocus={(e) => place(e.currentTarget, true)}
                    >
                        Feed
                    </NavLink>

                    <NavLink
                        to={isAuthenticated ? "/my-pass" : "/login"}
                        className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}
                        onPointerEnter={(e) => place(e.currentTarget, true)}
                        onFocus={(e) => place(e.currentTarget, true)}
                    >
                        Attendee Portal
                    </NavLink>

                    <NavLink
                        to={isAuthenticated ? "/support" : "/login"}
                        className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}
                        onPointerEnter={(e) => place(e.currentTarget, true)}
                        onFocus={(e) => place(e.currentTarget, true)}
                    >
                        Support
                    </NavLink>

                    {isAuthenticated && isAdmin && hasEntity && (
                        <>
                            <NavLink
                                to="/festivals"
                                className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}
                                onPointerEnter={(e) => place(e.currentTarget, true)}
                                onFocus={(e) => place(e.currentTarget, true)}
                            >
                                Festivals
                            </NavLink>
                            <NavLink
                                to="/events"
                                className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}
                                onPointerEnter={(e) => place(e.currentTarget, true)}
                                onFocus={(e) => place(e.currentTarget, true)}
                            >
                                Events
                            </NavLink>
                            <NavLink
                                to="/dashboard"
                                className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}
                                onPointerEnter={(e) => place(e.currentTarget, true)}
                                onFocus={(e) => place(e.currentTarget, true)}
                            >
                                Dashboard
                            </NavLink>
                        </>
                    )}
                </div>

                {/* Right Controls: Theme Toggle, Role Badge, User / Login */}
                <div className="nav__controls">
                    {/* Dark Mode Toggle */}
                    <button
                        onClick={toggleDarkMode}
                        className="nav__btn-theme"
                        aria-label="Toggle Dark Mode"
                        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {isDarkMode ? (
                            <Sun size={18} style={{ color: 'var(--palette-amber)', filter: 'drop-shadow(0 0 5px rgba(249, 179, 98, 0.7))' }} />
                        ) : (
                            <Moon size={18} style={{ color: 'var(--palette-slate-teal)', filter: 'drop-shadow(0 0 5px rgba(67, 130, 149, 0.5))' }} />
                        )}
                    </button>

                    {/* Role Indicator */}
                    {isAuthenticated && (
                        <span className="nav__role-badge d-none d-sm-inline-block">
                            {user?.role === 'admin' ? 'ADMIN' : 'USER'}
                        </span>
                    )}

                    {/* User Dropdown or Login Button */}
                    {isAuthenticated ? (
                        <div className="dropdown">
                            <button
                                className="btn btn-link dropdown-toggle d-flex align-items-center gap-2 p-0 border-0 no-caret text-decoration-none"
                                type="button"
                                id="userMenu"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                <div
                                    className="d-flex align-items-center justify-content-center text-white rounded-circle shadow-sm"
                                    style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, var(--violet), var(--indigo))' }}
                                >
                                    <User size={18} />
                                </div>
                            </button>
                            <ul
                                className="dropdown-menu dropdown-menu-end p-2 mt-2 shadow-lg rounded-3 border"
                                aria-labelledby="userMenu"
                                style={{ background: 'var(--secondary-bg)', borderColor: 'var(--glass-border)', backdropFilter: 'blur(16px)' }}
                            >
                                <li className="px-3 py-1 small fw-bold text-muted border-bottom border-secondary border-opacity-10 mb-1">
                                    {user?.name || user?.email?.split('@')[0]}
                                </li>
                                <li>
                                    <Link onClick={closeMobile} className="dropdown-item rounded mb-1 small text-main fw-semibold" to="/settings">
                                        Profile Settings
                                    </Link>
                                </li>
                                <li><hr className="dropdown-divider my-1" /></li>
                                <li>
                                    <button onClick={handleLogout} className="dropdown-item text-danger rounded d-flex align-items-center gap-2 small fw-semibold">
                                        <LogOut size={14} /> Logout
                                    </button>
                                </li>
                            </ul>
                        </div>
                    ) : (
                        <Link
                            onClick={closeMobile}
                            to="/login"
                            className="btn btn-premium px-3 py-1.5 rounded-pill shadow-sm d-flex align-items-center small fw-bold text-nowrap"
                        >
                            Login <ChevronRight size={14} className="ms-1" />
                        </Link>
                    )}

                    {/* Mobile Hamburger Toggle */}
                    <button
                        className="nav__mobile-toggle"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle navigation menu"
                    >
                        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Collapsible Drawer */}
            <div className={`nav__mobile-drawer ${mobileOpen ? 'open' : ''}`}>
                <NavLink to="/" end className={({ isActive }) => `nav__mobile-link ${isActive ? 'is-active' : ''}`} onClick={closeMobile}>
                    Home
                </NavLink>
                <NavLink to={isAuthenticated ? "/feedback" : "/login"} className={({ isActive }) => `nav__mobile-link ${isActive ? 'is-active' : ''}`} onClick={closeMobile}>
                    Feed
                </NavLink>
                <NavLink to={isAuthenticated ? "/my-pass" : "/login"} className={({ isActive }) => `nav__mobile-link ${isActive ? 'is-active' : ''}`} onClick={closeMobile}>
                    Attendee Portal
                </NavLink>
                <NavLink to={isAuthenticated ? "/support" : "/login"} className={({ isActive }) => `nav__mobile-link ${isActive ? 'is-active' : ''}`} onClick={closeMobile}>
                    Support
                </NavLink>
                {isAuthenticated && isAdmin && hasEntity && (
                    <>
                        <NavLink to="/festivals" className={({ isActive }) => `nav__mobile-link ${isActive ? 'is-active' : ''}`} onClick={closeMobile}>
                            Festivals
                        </NavLink>
                        <NavLink to="/events" className={({ isActive }) => `nav__mobile-link ${isActive ? 'is-active' : ''}`} onClick={closeMobile}>
                            Events
                        </NavLink>
                        <NavLink to="/dashboard" className={({ isActive }) => `nav__mobile-link ${isActive ? 'is-active' : ''}`} onClick={closeMobile}>
                            Dashboard
                        </NavLink>
                    </>
                )}
            </div>

            {/* ================= GOO FILTER ================= */}
            <svg
                width="0"
                height="0"
                aria-hidden="true"
                focusable="false"
                style={{ position: 'absolute', overflow: 'hidden' }}
            >
                <defs>
                    <filter
                        id="liquid"
                        x="-40%"
                        y="-40%"
                        width="180%"
                        height="180%"
                        colorInterpolationFilters="sRGB"
                    >
                        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
                        <feColorMatrix
                            in="blur"
                            mode="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
                        />
                    </filter>
                </defs>
            </svg>
        </div>
    )
}

export default Navbar
