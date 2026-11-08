import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import './Navbar.css'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import {
    User, Menu, X, LogOut, ChevronRight, Sun, Moon, ChevronDown,
    Calendar, Ticket, CreditCard, FileSpreadsheet,
    Sparkles, Home as HomeIcon, MessageSquare, LayoutDashboard, Settings,
    Image as ImageIcon, Building2, ShieldCheck, UserCheck, RefreshCw, LogIn,
    UserPlus, Download, History
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import axios from 'axios'
import logoImage from '../images/logo-emblem.png'

const ReceiptSymbolIcon = ({ size = 15, className = '' }) => (
    <span
        style={{
            fontSize: `${Math.max(size, 14)}px`,
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            verticalAlign: 'middle',
            userSelect: 'none'
        }}
        className={className}
        role="img"
        aria-label="Receipt"
    >
        🧾
    </span>
)

const festivalSubTabs = [
    { id: 'festivals', label: 'All Festivals', sub: 'Directory & management', icon: Calendar, path: '/festivals?tab=festivals' },
    { id: 'new_attendee', label: '+ New Attendee', sub: 'Quick register attendee', icon: UserPlus, path: '/festivals?tab=new_attendee', isAction: true },
    { id: 'subscriptions', label: 'Attendees & Passes', sub: 'Registration roster', icon: Ticket, path: '/festivals?tab=subscriptions' },
    { id: 'expenses', label: 'Expense Tracker', sub: 'Budget & vendor bills', icon: ReceiptSymbolIcon, path: '/festivals?tab=expenses' },
    { id: 'card', label: 'VIP & ID Cards', sub: 'Print passes & badges', icon: CreditCard, path: '/festivals?tab=card' },
    { id: 'balanceSheet', label: 'Audit & Balance', sub: 'Ledger & financial sheet', icon: FileSpreadsheet, path: '/festivals?tab=balanceSheet' },
    { id: 'activity_logs', label: 'Action History', sub: 'Admin attendee audit log', icon: History, path: '/festivals?tab=activity_logs' },
    { id: 'data', label: 'DATA Reports', sub: 'PDF exports & download', icon: Download, path: '/festivals?tab=data', isData: true },
]

const eventSubTabs = [
    { id: 'events', label: 'All Events', sub: 'Shows & workshops list', icon: Sparkles, path: '/events?tab=events' },
    { id: 'new_attendee', label: '+ New Attendee', sub: 'Quick register attendee', icon: UserPlus, path: '/events?tab=new_attendee', isAction: true },
    { id: 'subscriptions', label: 'Attendees & Passes', sub: 'Attendee booking list', icon: Ticket, path: '/events?tab=subscriptions' },
    { id: 'expenses', label: 'Expense Tracker', sub: 'Cost tracking & ledger', icon: ReceiptSymbolIcon, path: '/events?tab=expenses' },
    { id: 'card', label: 'VIP & ID Cards', sub: 'Pass generation & badges', icon: CreditCard, path: '/events?tab=card' },
    { id: 'balanceSheet', label: 'Audit & Balance', sub: 'Event audit & sheet', icon: FileSpreadsheet, path: '/events?tab=balanceSheet' },
    { id: 'activity_logs', label: 'Action History', sub: 'Admin attendee audit log', icon: History, path: '/events?tab=activity_logs' },
    { id: 'data', label: 'DATA Reports', sub: 'PDF exports & download', icon: Download, path: '/events?tab=data', isData: true },
]

const Navbar = () => {
    const { user, logout, isAuthenticated, verifiedEntity, setVerifiedEntity } = useAuth()
    const { isDarkMode, toggleDarkMode } = useTheme()
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
    const hasEntity = isAdmin ? verifiedEntity : (user?.entityName || verifiedEntity)
    const entityNameDisplay = typeof verifiedEntity === 'object' ? verifiedEntity?.name : (verifiedEntity || user?.entityName)
    const navigate = useNavigate()
    const location = useLocation()

    const [mobileOpen, setMobileOpen] = useState(false)
    const [entities, setEntities] = useState([])
    const [festivalsOpen, setFestivalsOpen] = useState(false)
    const [eventsOpen, setEventsOpen] = useState(false)
    const [mobileFestivalsOpen, setMobileFestivalsOpen] = useState(false)
    const [mobileEventsOpen, setMobileEventsOpen] = useState(false)

    // Touch gesture ref for mobile swipe-to-close
    const touchStartXRef = useRef(null)

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

    // Lock body scrolling when mobile sidebar is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden'
            // Auto open accordion for current route if relevant
            if (location.pathname.startsWith('/festivals')) setMobileFestivalsOpen(true)
            if (location.pathname.startsWith('/events')) setMobileEventsOpen(true)
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [mobileOpen, location.pathname])

    // Close on Escape key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && mobileOpen) {
                closeMobile()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [mobileOpen])

    // Close menus on route or query change
    useEffect(() => {
        setFestivalsOpen(false)
        setEventsOpen(false)
        setMobileOpen(false)
    }, [location.pathname, location.search])

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

    // Touch handlers for mobile swipe-to-close drawer
    const handleTouchStart = (e) => {
        touchStartXRef.current = e.touches[0].clientX
    }

    const handleTouchMove = (e) => {
        if (touchStartXRef.current === null) return
        const currentX = e.touches[0].clientX
        const diff = currentX - touchStartXRef.current
        if (diff < -50) { // Swiped left by > 50px
            closeMobile()
            touchStartXRef.current = null
        }
    }

    const handleTouchEnd = () => {
        touchStartXRef.current = null
    }

    return (
        <>
            <div className="nav-wrapper">
                {/* ================= NAVBAR ================= */}
                <nav className="nav" id="nav" aria-label="Primary">
                    {/* Brand / Logo */}
                    <Link to="/" className="nav__brand" onClick={closeMobile}>
                        <div className="nav__logo-badge">
                            <img src={logoImage} alt="Vishwa Utsav" className="nav__logo-img" />
                        </div>
                        <span className="nav__brand-title">VishwaUtsav</span>
                    </Link>

                    {/* Desktop Liquid Pill Track */}
                    <div
                        className="nav__track"
                        ref={trackRef}
                        onPointerLeave={() => syncActive(true)}
                    >

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
                            to={isAuthenticated ? "/feed-support" : "/login"}
                            className={({ isActive }) => `nav__link ${isActive || location.pathname === '/feedback' || location.pathname === '/support' || location.pathname === '/feed-support' ? 'is-active' : ''}`}
                            onPointerEnter={(e) => place(e.currentTarget, true)}
                            onFocus={(e) => place(e.currentTarget, true)}
                        >
                            Feed & Support
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
                            to="/gallery"
                            className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}
                            onPointerEnter={(e) => place(e.currentTarget, true)}
                            onFocus={(e) => place(e.currentTarget, true)}
                        >
                            Gallery
                        </NavLink>

                        {isAuthenticated && isAdmin && hasEntity && (
                            <>
                                {/* Festivals Dropdown */}
                                <div
                                    className="nav__dropdown-wrap"
                                    onMouseEnter={() => setFestivalsOpen(true)}
                                    onMouseLeave={() => setFestivalsOpen(false)}
                                >
                                    <NavLink
                                        to="/festivals"
                                        className={({ isActive }) => `nav__link nav__link-dropdown ${isActive || location.pathname.startsWith('/festivals') ? 'is-active' : ''}`}
                                        onPointerEnter={(e) => place(e.currentTarget, true)}
                                        onFocus={(e) => place(e.currentTarget, true)}
                                        onClick={() => setFestivalsOpen(false)}
                                    >
                                        <span>Festivals</span>
                                        <ChevronDown size={13} className={`nav__chevron ms-1 ${festivalsOpen ? 'rotate-180' : ''}`} />
                                    </NavLink>

                                    <div className={`nav__desktop-dropdown-menu ${festivalsOpen ? 'open' : ''}`}>
                                        <div className="nav__desktop-dropdown-header">
                                            <span className="nav__dropdown-tag">Festivals Portal</span>
                                        </div>
                                        {festivalSubTabs.map(item => (
                                            <Link
                                                key={item.id}
                                                to={item.path}
                                                className={`nav__desktop-dropdown-item ${item.isAction ? 'is-action-item' : ''} ${item.isData ? 'is-data-item' : ''} ${location.pathname.startsWith('/festivals') && (location.search.includes(`tab=${item.id}`) || (item.id === 'festivals' && !location.search.includes('tab='))) ? 'active-item' : ''}`}
                                                onClick={() => {
                                                    setFestivalsOpen(false);
                                                    if (item.isData) {
                                                        window.dispatchEvent(new CustomEvent('open-data-reports', { detail: { target: 'festival' } }));
                                                    }
                                                }}
                                            >
                                                <div className={`nav__item-icon-wrap ${item.isAction ? 'action-icon-wrap' : ''} ${item.isData ? 'data-icon-wrap' : ''}`}>
                                                    <item.icon size={15} />
                                                </div>
                                                <div className="nav__item-text">
                                                    <span className="nav__item-title">{item.label}</span>
                                                    <span className="nav__item-sub">{item.sub}</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                {/* Events Dropdown */}
                                <div
                                    className="nav__dropdown-wrap"
                                    onMouseEnter={() => setEventsOpen(true)}
                                    onMouseLeave={() => setEventsOpen(false)}
                                >
                                    <NavLink
                                        to="/events"
                                        className={({ isActive }) => `nav__link nav__link-dropdown ${isActive || location.pathname.startsWith('/events') ? 'is-active' : ''}`}
                                        onPointerEnter={(e) => place(e.currentTarget, true)}
                                        onFocus={(e) => place(e.currentTarget, true)}
                                        onClick={() => setEventsOpen(false)}
                                    >
                                        <span>Events</span>
                                        <ChevronDown size={13} className={`nav__chevron ms-1 ${eventsOpen ? 'rotate-180' : ''}`} />
                                    </NavLink>

                                    <div className={`nav__desktop-dropdown-menu ${eventsOpen ? 'open' : ''}`}>
                                        <div className="nav__desktop-dropdown-header">
                                            <span className="nav__dropdown-tag">Events Portal</span>
                                        </div>
                                        {eventSubTabs.map(item => (
                                            <Link
                                                key={item.id}
                                                to={item.path}
                                                className={`nav__desktop-dropdown-item ${item.isAction ? 'is-action-item' : ''} ${item.isData ? 'is-data-item' : ''} ${location.pathname.startsWith('/events') && (location.search.includes(`tab=${item.id}`) || (item.id === 'events' && !location.search.includes('tab='))) ? 'active-item' : ''}`}
                                                onClick={() => {
                                                    setEventsOpen(false);
                                                    if (item.isData) {
                                                        window.dispatchEvent(new CustomEvent('open-data-reports', { detail: { target: 'event' } }));
                                                    }
                                                }}
                                            >
                                                <div className={`nav__item-icon-wrap ${item.isAction ? 'action-icon-wrap' : ''} ${item.isData ? 'data-icon-wrap' : ''}`}>
                                                    <item.icon size={15} />
                                                </div>
                                                <div className="nav__item-text">
                                                    <span className="nav__item-title">{item.label}</span>
                                                    <span className="nav__item-sub">{item.sub}</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>

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
                            <span className="nav__role-badge d-none d-sm-inline-flex">
                                {user?.role === 'admin' ? 'ADMIN' : 'USER'}
                            </span>
                        )}

                        {/* User Dropdown or Login Button */}
                        {isAuthenticated ? (
                            <div className="dropdown d-flex align-items-center">
                                <button
                                    className="btn btn-link dropdown-toggle d-flex align-items-center p-0 border-0 no-caret text-decoration-none"
                                    type="button"
                                    id="userMenu"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <div className="nav__user-avatar text-white">
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
                                    <li>
                                        <Link onClick={closeMobile} className="dropdown-item rounded mb-1 small text-main fw-semibold" to="/role-selection">
                                            Switch Profile Role
                                        </Link>
                                    </li>
                                    {isAdmin && (
                                        <li>
                                            <Link onClick={closeMobile} className="dropdown-item rounded mb-1 small text-main fw-semibold" to="/verify-entity">
                                                Entity Management
                                            </Link>
                                        </li>
                                    )}
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

            {/* ================= SMARTPHONE SIDEBAR & BACKDROP (PORTAL TO ROOT BODY) ================= */}
            {typeof document !== 'undefined' && createPortal(
                <>
                    {/* Dark frosted glass backdrop */}
                    <div
                        className={`nav__sidebar-backdrop ${mobileOpen ? 'open' : ''}`}
                        onClick={closeMobile}
                        aria-hidden={!mobileOpen}
                    />

                    {/* Dedicated Smartphone Sidebar */}
                    <aside
                        className={`nav__sidebar ${mobileOpen ? 'open' : ''}`}
                        aria-label="Mobile Navigation Sidebar"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* Header */}
                        <div className="nav__sidebar-header">
                            <Link to="/" className="nav__brand m-0" onClick={closeMobile}>
                                <div className="nav__logo-badge">
                                    <img src={logoImage} alt="Vishwa Utsav" className="nav__logo-img" />
                                </div>
                                <span className="nav__brand-title">VishwaUtsav</span>
                            </Link>
                            <button
                                className="nav__sidebar-close"
                                onClick={closeMobile}
                                aria-label="Close navigation sidebar"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* User Profile or Guest Banner */}
                        <div className="nav__sidebar-auth-section">
                            {isAuthenticated ? (
                                <div className="nav__sidebar-user-card">
                                    <div className="d-flex align-items-center gap-2.5 w-100">
                                        <div className="nav__user-avatar text-white flex-shrink-0">
                                            <User size={18} />
                                        </div>
                                        <div className="nav__sidebar-user-details flex-grow-1 overflow-hidden">
                                            <span className="nav__sidebar-user-name">
                                                {user?.name || user?.email?.split('@')[0]}
                                            </span>
                                            <span className="tiny text-muted text-truncate d-block">
                                                {user?.email}
                                            </span>
                                        </div>
                                        <span className="nav__role-badge py-0 px-2 flex-shrink-0" style={{ fontSize: '0.62rem', height: '19px' }}>
                                            {user?.role === 'admin' ? 'ADMIN' : 'USER'}
                                        </span>
                                    </div>

                                    {/* Entity Context for Admin */}
                                    {isAdmin && (
                                        <div className="nav__sidebar-entity-box mt-2.5">
                                            <div className="d-flex align-items-center justify-content-between gap-1">
                                                <div className="d-flex align-items-center gap-1.5 overflow-hidden">
                                                    <Building2 size={13} className="text-warning flex-shrink-0" />
                                                    <span className="tiny fw-bold text-main text-truncate">
                                                        {entityNameDisplay || 'No Entity Selected'}
                                                    </span>
                                                </div>
                                                <Link to="/verify-entity" onClick={closeMobile} className="nav__sidebar-entity-action">
                                                    {entityNameDisplay ? 'Change' : 'Select'}
                                                </Link>
                                            </div>
                                        </div>
                                    )}

                                    {/* Quick Profile Actions Bar */}
                                    <div className="d-flex align-items-center gap-1.5 mt-2.5 pt-2 border-top border-secondary border-opacity-10">
                                        <Link to="/settings" onClick={closeMobile} className="nav__sidebar-action-pill flex-grow-1 text-center">
                                            <Settings size={12} className="me-1 d-inline" /> Settings
                                        </Link>
                                        <Link to="/role-selection" onClick={closeMobile} className="nav__sidebar-action-pill flex-grow-1 text-center">
                                            <RefreshCw size={11} className="me-1 d-inline" /> Switch Role
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="nav__sidebar-guest-card">
                                    <div className="fw-bold small text-main mb-0.5">Welcome to VishwaUtsav</div>
                                    <div className="tiny text-muted mb-2.5">Explore vibrant cultural festivals & events worldwide.</div>
                                    <div className="d-flex align-items-center gap-2">
                                        <Link
                                            to="/login"
                                            onClick={closeMobile}
                                            className="btn btn-premium btn-sm rounded-pill flex-grow-1 d-flex align-items-center justify-content-center shadow-sm"
                                        >
                                            <LogIn size={13} className="me-1" /> Sign In
                                        </Link>
                                        <Link
                                            to="/signup"
                                            onClick={closeMobile}
                                            className="btn btn-outline-secondary btn-sm rounded-pill flex-grow-1 d-flex align-items-center justify-content-center"
                                        >
                                            Join Free
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Body */}
                        <div className="nav__sidebar-nav">
                            <div className="nav__sidebar-section-title">Main Portal</div>

                            <NavLink to="/" end className={({ isActive }) => `nav__sidebar-link ${isActive ? 'is-active' : ''}`} onClick={closeMobile}>
                                <HomeIcon size={18} className="nav__sidebar-link-icon" />
                                <span>Home</span>
                            </NavLink>

                            <NavLink
                                to={isAuthenticated ? "/feed-support" : "/login"}
                                className={({ isActive }) => `nav__sidebar-link ${isActive || location.pathname === '/feedback' || location.pathname === '/support' || location.pathname === '/feed-support' ? 'is-active' : ''}`}
                                onClick={closeMobile}
                            >
                                <MessageSquare size={18} className="nav__sidebar-link-icon" />
                                <span>Feed & Support</span>
                            </NavLink>

                            <NavLink to={isAuthenticated ? "/my-pass" : "/login"} className={({ isActive }) => `nav__sidebar-link ${isActive ? 'is-active' : ''}`} onClick={closeMobile}>
                                <Ticket size={18} className="nav__sidebar-link-icon" />
                                <span>Attendee Portal</span>
                            </NavLink>

                            <NavLink to="/gallery" className={({ isActive }) => `nav__sidebar-link ${isActive ? 'is-active' : ''}`} onClick={closeMobile}>
                                <ImageIcon size={18} className="nav__sidebar-link-icon text-info" />
                                <span>Festival Gallery</span>
                            </NavLink>

                            {/* Management Section (Admin Only) */}
                            {isAuthenticated && isAdmin && (
                                <>
                                    <div className="nav__sidebar-section-title mt-3">Administration & Management</div>

                                    {!hasEntity ? (
                                        <div className="nav__sidebar-alert-card mb-2">
                                            <div className="d-flex align-items-center gap-1.5 mb-1 text-warning">
                                                <Building2 size={15} />
                                                <span className="small fw-bold">Select Active Entity</span>
                                            </div>
                                            <p className="tiny text-muted mb-2">Please select your managing entity to access festivals and events management.</p>
                                            <Link to="/verify-entity" onClick={closeMobile} className="btn btn-sm btn-primary rounded-pill w-100 py-1">
                                                Select Entity
                                            </Link>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Festivals Accordion with its Subtabs */}
                                            <div className="nav__sidebar-accordion">
                                                <div className={`nav__sidebar-accordion-header ${location.pathname.startsWith('/festivals') ? 'is-active-parent' : ''}`}>
                                                    <NavLink
                                                        to="/festivals"
                                                        className="nav__sidebar-accordion-title-link"
                                                        onClick={closeMobile}
                                                    >
                                                        <Calendar size={18} className="nav__sidebar-link-icon text-warning" />
                                                        <span className="fw-semibold">Festivals</span>
                                                    </NavLink>
                                                    <button
                                                        type="button"
                                                        className="nav__sidebar-accordion-toggle-btn"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            setMobileFestivalsOpen(prev => !prev)
                                                        }}
                                                        aria-label="Toggle Festivals Submenu"
                                                    >
                                                        <ChevronDown size={16} className={`nav__chevron ${mobileFestivalsOpen ? 'rotate-180' : ''}`} />
                                                    </button>
                                                </div>

                                                {mobileFestivalsOpen && (
                                                    <div className="nav__sidebar-subtabs">
                                                        {festivalSubTabs.map(tab => {
                                                            const currentTab = new URLSearchParams(location.search).get('tab') || 'festivals'
                                                            const isSubActive = location.pathname.startsWith('/festivals') && currentTab === tab.id
                                                            return (
                                                                <NavLink
                                                                    key={tab.id}
                                                                    to={tab.path}
                                                                    className={`nav__sidebar-sublink ${tab.isAction ? 'is-action-sublink' : ''} ${tab.isData ? 'is-data-sublink' : ''} ${isSubActive ? 'is-active' : ''}`}
                                                                    onClick={() => {
                                                                        closeMobile();
                                                                        if (tab.isData) {
                                                                            window.dispatchEvent(new CustomEvent('open-data-reports', { detail: { target: 'festival' } }));
                                                                        }
                                                                    }}
                                                                >
                                                                    <tab.icon size={15} className={`flex-shrink-0 ${tab.isAction ? 'text-warning' : tab.isData ? 'text-info' : 'opacity-75'}`} />
                                                                    <span>{tab.label}</span>
                                                                </NavLink>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Events Accordion with its Subtabs */}
                                            <div className="nav__sidebar-accordion">
                                                <div className={`nav__sidebar-accordion-header ${location.pathname.startsWith('/events') ? 'is-active-parent' : ''}`}>
                                                    <NavLink
                                                        to="/events"
                                                        className="nav__sidebar-accordion-title-link"
                                                        onClick={closeMobile}
                                                    >
                                                        <Sparkles size={18} className="nav__sidebar-link-icon text-info" />
                                                        <span className="fw-semibold">Events</span>
                                                    </NavLink>
                                                    <button
                                                        type="button"
                                                        className="nav__sidebar-accordion-toggle-btn"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            setMobileEventsOpen(prev => !prev)
                                                        }}
                                                        aria-label="Toggle Events Submenu"
                                                    >
                                                        <ChevronDown size={16} className={`nav__chevron ${mobileEventsOpen ? 'rotate-180' : ''}`} />
                                                    </button>
                                                </div>

                                                {mobileEventsOpen && (
                                                    <div className="nav__sidebar-subtabs">
                                                        {eventSubTabs.map(tab => {
                                                            const currentTab = new URLSearchParams(location.search).get('tab') || 'events'
                                                            const isSubActive = location.pathname.startsWith('/events') && currentTab === tab.id
                                                            return (
                                                                <NavLink
                                                                    key={tab.id}
                                                                    to={tab.path}
                                                                    className={`nav__sidebar-sublink ${tab.isAction ? 'is-action-sublink' : ''} ${tab.isData ? 'is-data-sublink' : ''} ${isSubActive ? 'is-active' : ''}`}
                                                                    onClick={() => {
                                                                        closeMobile();
                                                                        if (tab.isData) {
                                                                            window.dispatchEvent(new CustomEvent('open-data-reports', { detail: { target: 'event' } }));
                                                                        }
                                                                    }}
                                                                >
                                                                    <tab.icon size={15} className={`flex-shrink-0 ${tab.isAction ? 'text-warning' : tab.isData ? 'text-info' : 'opacity-75'}`} />
                                                                    <span>{tab.label}</span>
                                                                </NavLink>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            <NavLink to="/dashboard" className={({ isActive }) => `nav__sidebar-link ${isActive ? 'is-active' : ''}`} onClick={closeMobile}>
                                                <LayoutDashboard size={18} className="nav__sidebar-link-icon text-success" />
                                                <span>Dashboard</span>
                                            </NavLink>

                                            <NavLink to="/verify-entity" className={({ isActive }) => `nav__sidebar-link ${isActive ? 'is-active' : ''}`} onClick={closeMobile}>
                                                <Building2 size={18} className="nav__sidebar-link-icon text-warning" />
                                                <span>Entity Settings</span>
                                            </NavLink>
                                        </>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Sidebar Footer Controls */}
                        <div className="nav__sidebar-footer">
                            <button
                                onClick={toggleDarkMode}
                                className="nav__sidebar-theme-toggle"
                                type="button"
                            >
                                <div className="d-flex align-items-center gap-2">
                                    {isDarkMode ? (
                                        <Sun size={17} style={{ color: 'var(--palette-amber)' }} />
                                    ) : (
                                        <Moon size={17} style={{ color: 'var(--palette-slate-teal)' }} />
                                    )}
                                    <span className="small fw-semibold">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                                </div>
                                <span className="nav__sidebar-theme-pill">{isDarkMode ? 'Dark' : 'Light'}</span>
                            </button>

                            {isAuthenticated && (
                                <button
                                    onClick={handleLogout}
                                    className="nav__sidebar-logout"
                                    type="button"
                                >
                                    <LogOut size={16} />
                                    <span>Sign Out</span>
                                </button>
                            )}
                        </div>
                    </aside>
                </>,
                document.body
            )}
        </>
    )
}

export default Navbar
