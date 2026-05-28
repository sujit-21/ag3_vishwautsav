import { useState, useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { User, Menu, Zap, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import logoImage from '../images/VISHWA UTSAV.png'

const Navbar = () => {
    const { user, logout, isAuthenticated, verifiedEntity, setVerifiedEntity, switchRole } = useAuth()
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
            <nav className="navbar navbar-expand-lg navbar-floating px-3 px-lg-4 py-0">
                <div className="container-fluid p-0">
                    <Link className="navbar-brand d-flex align-items-center gap-3 no-underline" to="/">
                        <div className="d-flex align-items-center justify-content-center p-1 rounded-3 shadow-glow bg-white bg-opacity-10 border border-white border-opacity-20" style={{ width: '40px', height: '40px' }}>
                            <img src={logoImage} alt="Vishwa Utsav Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                    <div>
                        <h1 className="fs-4 fw-extrabold mb-0 tracking-tight m-0" style={{ color: 'var(--text-main)' }}>
                            Vishwa<span className="text-primary">Utsav</span>
                        </h1>
                        <p className="tiny mb-0 d-none d-md-block ls-1 uppercase" style={{ color: 'var(--text-muted)' }}>One World , Many Celebrations</p>
                    </div>
                </Link>

                <button className="navbar-toggler border-0 shadow-none p-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <div className="p-2 rounded-3 glass-card d-flex align-items-center justify-content-center">
                        <Menu size={24} style={{ color: 'var(--text-main)' }} />
                    </div>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav mx-auto align-items-center gap-1 mt-4 mt-lg-0">
                        <li className="nav-item">
                            <NavLink onClick={closeNavbar} className={({ isActive }) => `nav-link-modern py-2 px-2 small ${isActive ? 'active' : ''}`} to="/">Home</NavLink>
                        </li>

                        {/* These tabs are visible to everyone, but lead to login if not authenticated */}
                        <li className="nav-item">
                            <NavLink onClick={closeNavbar} className={({ isActive }) => `nav-link-modern py-2 px-2 small ${isActive ? 'active' : ''}`} to={isAuthenticated ? "/feedback" : "/login"}>Feed</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink onClick={closeNavbar} className={({ isActive }) => `nav-link-modern py-2 px-2 small ${isActive ? 'active' : ''}`} to={isAuthenticated ? "/my-pass" : "/login"}>Attendee Portal</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink onClick={closeNavbar} className={({ isActive }) => `nav-link-modern py-2 px-2 small ${isActive ? 'active' : ''}`} to={isAuthenticated ? "/support" : "/login"}>Support</NavLink>
                        </li>

                        {/* Admin Specific Tabs - Only show when logged in as admin with a verified entity */}
                        {isAuthenticated && isAdmin && hasEntity && (
                            <>
                                <li className="nav-item">
                                    <NavLink onClick={closeNavbar} className={({ isActive }) => `nav-link-modern py-2 px-2 small ${isActive ? 'active' : ''}`} to="/festivals">Festivals</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink onClick={closeNavbar} className={({ isActive }) => `nav-link-modern py-2 px-2 small ${isActive ? 'active' : ''}`} to="/events">Events</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink onClick={closeNavbar} className={({ isActive }) => `nav-link-modern py-2 px-2 small ${isActive ? 'active' : ''}`} to="/dashboard">Dash</NavLink>
                                </li>
                            </>
                        )}
                    </ul>

                    <div className="d-flex align-items-center gap-2 mt-3 mt-lg-0">

                        {/* Manual Role Selector Tabs (Smaller) */}
                        {isAuthenticated && (
                            <div className="d-flex align-items-center bg-white bg-opacity-10 p-1 rounded-pill border border-white border-opacity-20 shadow-sm">
                                <span className={`px-4 py-1 rounded-pill text-uppercase fw-black ls-1 transition-all ${user?.role === 'admin' ? 'bg-primary text-white shadow-glow' : 'bg-secondary bg-opacity-25 text-muted'}`} style={{ fontSize: '0.65rem' }}>
                                    {user?.role === 'admin' ? 'ADMIN' : 'USER'}
                                </span>
                            </div>
                        )}

                        {isAuthenticated ? (
                            <div className="dropdown ms-2 ps-2 border-start border-secondary border-opacity-25">
                                <button className="btn btn-link dropdown-toggle d-flex align-items-center gap-2 p-0 border-0 no-caret text-decoration-none" style={{ color: 'var(--text-main)' }} type="button" id="userMenu" data-bs-toggle="dropdown" aria-expanded="false">
                                    <div className="d-flex align-items-center justify-content-center text-white rounded-circle" style={{ width: '36px', height: '36px', backgroundColor: '#0d6efd' }}>
                                        <User size={18} />
                                    </div>
                                    <div className="d-none d-xxl-flex flex-column align-items-start">
                                        <span className="fw-extrabold m-0 text-primary text-uppercase" style={{ fontSize: '0.65rem' }}>
                                            {user?.name && user.name.toLowerCase() !== 'user' ? user.name : (user?.email?.split('@')[0] || 'Account')}
                                        </span>
                                    </div>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end p-2 border-white border-opacity-10 mt-2 shadow" aria-labelledby="userMenu" style={{ background: '#0f172a', backdropFilter: 'blur(16px)' }}>
                                    <li><Link onClick={closeNavbar} className="dropdown-item rounded mb-1 small text-white fw-semibold hover-glow" to="/settings">Profile Settings</Link></li>
                                    <li><hr className="dropdown-divider bg-white opacity-25" /></li>
                                    <li><button onClick={handleLogout} className="dropdown-item text-danger rounded d-flex align-items-center gap-2 small fw-semibold hover-glow">
                                        <LogOut size={14} /> Logout
                                    </button></li>
                                </ul>
                            </div>
                        ) : (
                            <Link onClick={closeNavbar} className="btn btn-primary px-3 py-2 rounded-pill shadow-sm d-flex align-items-center tiny fw-bold" to="/login">
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
