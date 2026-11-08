import { useState, useEffect } from 'react'
import './Home.css'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Calendar, Music, Zap, Users, ChevronRight, LayoutDashboard, MessageSquare, LogOut, Sparkles, Ticket, MapPin, Building2, ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import musicConcertImg from '../../homepage_images/Music Concert.jpg'
import consertImg from '../../homepage_images/consert.jpg'
import holiImg from '../../homepage_images/holi.jpg'
import southFestivalsImg from '../../homepage_images/south festivals.jpg'

const bgImages = [musicConcertImg, consertImg, holiImg, southFestivalsImg]
const Home = () => {
    const { isAuthenticated, logout } = useAuth()
    const navigate = useNavigate()
    const [currentBgIndex, setCurrentBgIndex] = useState(0)
    const [liveCelebrations, setLiveCelebrations] = useState([])
    const [loadingLive, setLoadingLive] = useState(true)

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBgIndex((prev) => (prev + 1) % bgImages.length)
        }, 6000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const fetchLive = async () => {
            try {
                setLoadingLive(true)
                const res = await axios.get('/api/public/live-celebrations')
                setLiveCelebrations(Array.isArray(res.data) ? res.data : [])
            } catch (err) {
                console.error('Failed to fetch live celebrations:', err)
            } finally {
                setLoadingLive(false)
            }
        }
        fetchLive()
    }, [])

    const formatDateText = (item) => {
        if (item.type === 'festival') {
            const s = item.startDate ? new Date(item.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
            const e = item.endDate ? new Date(item.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
            if (s && e) {
                return s === e ? s : `From ${s} to ${e}`
            }
            return s || e || 'Ongoing celebration'
        } else {
            const d = item.date ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
            const time = (item.startTime && item.endTime) ? ` • ${item.startTime} - ${item.endTime}` : ''
            return `${d}${time}`
        }
    }

    const shortcuts = [
        {
            title: 'Festivals',
            desc: 'Initiate and manage global festivals.',
            icon: <Sparkles size={24} />,
            path: '/festivals',
            color: '#c084fc',
            badge: 'Culture'
        },
        {
            title: 'Events',
            desc: 'Initiate and manage global events.',
            icon: <Ticket size={24} />,
            path: '/events',
            color: '#22d3ee',
            badge: 'Activities'
        },
        {
            title: 'Dashboard',
            desc: 'Dashboard for Controls.',
            icon: <LayoutDashboard size={24} />,
            path: '/dashboard',
            color: '#6366f1',
            badge: 'Analytics'
        },
        {
            title: 'Feed & Support',
            desc: 'Community reviews & help desk.',
            icon: <MessageSquare size={24} />,
            path: '/feed-support',
            color: '#10b981',
            badge: 'Community'
        }
    ]

    return (
        <div className="home-page min-vh-100 bg-transparent py-4">
            <Helmet>
                <title>Vishwa Utsav — One World, Many Celebrations</title>
                <meta name="description" content="Vishwa Utsav is a digital platform for festivals, cultural events, and community programs. Manage festivals, events, passes, and registrations all in one place." />
                <meta property="og:title" content="Vishwa Utsav — One World, Many Celebrations" />
                <meta property="og:description" content="Vishwa Utsav is a digital platform for festivals, cultural events, and community programs." />
                <meta property="og:url" content="https://vishwautsav.com/" />
                <link rel="canonical" href="https://vishwautsav.com/" />
            </Helmet>

            <div className="container position-relative z-1 pt-2 pt-sm-3 px-3 px-sm-4">
                <div className="text-center mb-4 pb-1 pb-sm-2">
                    <motion.div
                        className="hero-badge-pill glass-card px-3 px-sm-4 py-2 d-inline-block shadow-sm mw-100"
                        style={{ backdropFilter: 'blur(10px)' }}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="hero-heading fw-extrabold mb-1" style={{ color: '#D9480F' }}>
                            <span className="d-inline-block me-2">
                                {"Welcome to".split('').map((char, index) => (
                                    <motion.span
                                        key={`w-${index}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                            duration: 0.5,
                                            delay: index * 0.1,
                                            repeat: Infinity,
                                            repeatDelay: 5
                                        }}
                                        style={{ display: "inline-block", whiteSpace: "pre" }}
                                    >
                                        {char}
                                    </motion.span>
                                ))}
                            </span>
                            <span className="d-inline-block">
                                {"Vishwa Utsav".split('').map((char, index) => (
                                    <motion.span
                                        key={`v-${index}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                            duration: 0.5,
                                            delay: ("Welcome to ".length + index) * 0.1,
                                            repeat: Infinity,
                                            repeatDelay: 5
                                        }}
                                        style={{ display: "inline-block", whiteSpace: "pre", color: "#D9480F" }}
                                    >
                                        {char}
                                    </motion.span>
                                ))}
                            </span>
                        </h1>
                        <motion.p 
                            className="hero-subheading text-uppercase fw-semibold mb-0" 
                            style={{ color: 'var(--text-muted)' }}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                        >
                            ONE WORLD , MANY CELEBRATIONS
                        </motion.p>
                    </motion.div>
                </div>

                {/* ================= LIVE CELEBRATIONS BROADCAST SECTION ================= */}
                {liveCelebrations.length > 0 && (
                    <motion.div 
                        className="live-celebrations-wrapper mb-4"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="d-flex align-items-center justify-content-between mb-2.5 flex-wrap gap-2">
                            <div className="live-celebrations-header">
                                <span className="live-dot live-dot-active"></span>
                                <span>Ongoing Live Celebrations</span>
                            </div>
                            <span className="extra-tiny text-muted fw-semibold">
                                Broadcast live across all registered entities
                            </span>
                        </div>

                        <div className="row g-3">
                            {liveCelebrations.map((item, idx) => {
                                const isFest = item.type === 'festival'
                                const targetLink = isAuthenticated 
                                    ? (isFest ? '/festivals?tab=subscriptions' : '/events?tab=subscriptions')
                                    : '/gallery'

                                return (
                                    <div key={item._id || idx} className={liveCelebrations.length === 1 ? 'col-12' : 'col-12 col-md-6'}>
                                        <div className="live-celebration-card h-100 d-flex flex-column justify-content-between">
                                            <div>
                                                {/* Top badges row */}
                                                <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-2">
                                                    <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                                        <span className="badge bg-danger text-white rounded-pill extra-tiny px-2.5 py-1 fw-bold d-inline-flex align-items-center gap-1">
                                                            <span className="live-dot live-dot-active" style={{ width: '6px', height: '6px' }}></span>
                                                            LIVE NOW
                                                        </span>
                                                        <span className="badge bg-secondary bg-opacity-10 text-main rounded-pill extra-tiny px-2 py-1 fw-bold uppercase">
                                                            {isFest ? 'Festival' : 'Event'}
                                                        </span>
                                                        {item.category && (
                                                            <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill extra-tiny px-2 py-1 fw-bold">
                                                                {item.category}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Entity Name Pill */}
                                                    <span className="live-entity-pill" title={`Organized by ${item.entityName || 'Vishwa Utsav'}`}>
                                                        <Building2 size={12} />
                                                        <span>Under: {item.entityName || 'Vishwa Utsav'}</span>
                                                    </span>
                                                </div>

                                                {/* Title */}
                                                <h4 className="fw-extrabold text-main mb-2" style={{ letterSpacing: '-0.02em' }}>
                                                    {item.title}
                                                </h4>

                                                {/* Meta pills: Dates & Location */}
                                                <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
                                                    <span className="live-dates-pill">
                                                        <Calendar size={13} />
                                                        <span>{formatDateText(item)}</span>
                                                    </span>
                                                    {item.location && (
                                                        <span className="live-location-pill">
                                                            <MapPin size={13} />
                                                            <span>{item.location}</span>
                                                        </span>
                                                    )}
                                                </div>

                                                {item.description && (
                                                    <p className="text-muted small mb-3 line-clamp-2" style={{ fontSize: '0.84rem' }}>
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Card Footer Action */}
                                            <div className="pt-2 border-top border-secondary border-opacity-10 d-flex align-items-center justify-content-between flex-wrap gap-2">
                                                <span className="extra-tiny text-muted fw-semibold">
                                                    Currently in progress • Public celebration
                                                </span>
                                                <Link 
                                                    to={targetLink}
                                                    className="btn btn-sm btn-primary rounded-pill px-3 py-1 fw-bold d-inline-flex align-items-center gap-1.5 shadow-xs hover-glow"
                                                    style={{ fontSize: '0.76rem' }}
                                                >
                                                    <span>{isAuthenticated ? 'View Passes & Details' : 'Explore Celebration'}</span>
                                                    <ArrowRight size={13} />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}

                <div className="row g-3 g-sm-4 justify-content-center">
                    {shortcuts.map((item, idx) => (
                        <div key={idx} className="col-12 col-sm-6 col-lg-3">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className="h-100"
                            >
                                <Link to={isAuthenticated ? item.path : '/login'} className="text-decoration-none h-100 d-block">
                                    <div 
                                        className="shortcut-card p-3 p-sm-4 h-100 d-flex flex-column"
                                        style={{
                                            '--card-accent': item.color,
                                            '--card-accent-glow': `${item.color}25`,
                                            '--card-bg-dark': `${item.color}10`,
                                            '--card-border-dark': `${item.color}25`,
                                            '--card-bg-light': `${item.color}08`,
                                            '--card-border-light': `${item.color}18`
                                        }}
                                    >
                                        <div className="d-flex justify-content-between align-items-center mb-3 mb-sm-4">
                                            <div 
                                                className="d-flex align-items-center justify-content-center rounded-3" 
                                                style={{ 
                                                    width: '44px', 
                                                    height: '44px', 
                                                    backgroundColor: `${item.color}15`,
                                                    color: item.color,
                                                    border: `1.5px solid ${item.color}30`
                                                }}
                                            >
                                                {item.icon}
                                            </div>
                                            <span 
                                                className="badge px-3 py-1.5 rounded-pill border uppercase ls-1 extra-tiny fw-bold"
                                                style={{ 
                                                    color: item.color, 
                                                    borderColor: `${item.color}30`, 
                                                    backgroundColor: `${item.color}10` 
                                                }}
                                            >
                                                {item.badge}
                                            </span>
                                        </div>
                                        <h5 className="fw-bold mb-2 d-flex align-items-center gap-2 fs-6 fs-sm-5" style={{ color: '#D9480F' }}>
                                            {item.title}
                                        </h5>
                                        <p className="tiny mb-3 mb-sm-4 flex-grow-1" style={{ color: 'var(--text-muted)' }}>
                                            {item.desc}
                                        </p>
                                        <div 
                                            className="mt-auto d-flex align-items-center fw-bold small uppercase ls-1 gap-2"
                                            style={{ color: item.color }}
                                        >
                                            Access <ChevronRight size={14} className="arrow-icon" />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        </div>
                    ))}
                </div>

                <div className="row mt-3 mt-sm-4 g-3 g-sm-4 align-items-stretch">
                    {/* Gallery Section */}
                    <div className="col-12 col-lg-6 d-flex">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => navigate('/gallery')}
                            className="about-card gallery-preview-card w-100 h-100 position-relative overflow-hidden shadow-sm"
                            style={{ cursor: 'pointer' }}
                        >
                            {/* Full bleed images */}
                            {bgImages.map((img, idx) => (
                                <div
                                    key={idx}
                                    className={`slideshow-image ${idx === currentBgIndex ? 'active' : ''}`}
                                    style={{ 
                                        position: 'absolute',
                                        top: 0, left: 0, right: 0, bottom: 0,
                                        backgroundImage: `url("${img}")`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        opacity: idx === currentBgIndex ? 1 : 0,
                                        transition: 'opacity 1s ease-in-out',
                                        zIndex: 0
                                    }}
                                />
                            ))}
                            {/* Floating Badge */}
                            <div className="position-absolute top-0 start-0 w-100 p-3 p-sm-4 text-center" style={{ zIndex: 1 }}>
                                <span className="badge bg-white bg-opacity-75 text-dark px-4 py-2 rounded-pill shadow-sm border border-white border-opacity-50 uppercase ls-2 tiny fw-bold d-inline-flex align-items-center justify-content-center" style={{ backdropFilter: 'blur(5px)', lineHeight: 1 }}>Gallery</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* About Section */}
                    <div className="col-12 col-lg-6 d-flex">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="w-100 d-flex"
                        >
                            <div className="about-card p-3 p-sm-4 w-100 d-flex flex-column justify-content-center">
                                <div className="text-center">
                                    <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill mb-3 border border-primary border-opacity-20 uppercase ls-2 tiny fw-bold d-inline-flex align-items-center justify-content-center" style={{ lineHeight: 1 }}>About</span>
                                </div>
                                <div className="text-muted mb-0" style={{ fontSize: '0.92rem', lineHeight: '1.6' }}>
                                    <p className="fw-bold mb-2 text-center text-sm-start" style={{ color: 'var(--text-main)', fontSize: '1rem' }}>
                                        Celebrating Culture. Connecting Communities.
                                    </p>
                                    <p className="mb-2 text-start">
                                        Vishwa Utsav is a digital platform for festivals, cultural events, and community programs that enables paperless registrations, digital passes, subscriptions, donations, and seamless event management.
                                    </p>
                                    <p className="mb-2 text-start">
                                        Our platform connects organizers, participants, volunteers, sponsors, and communities through one unified digital ecosystem.
                                    </p>
                                    <p className="mb-0 text-start">
                                        Our vision is to create a smart, connected, and eco-friendly event ecosystem that brings people, culture, and celebrations together through technology.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {isAuthenticated && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-center mt-4 pt-1"
                    >
                        <button
                            onClick={logout}
                            className="btn btn-outline-danger px-4 py-2 rounded-pill small fw-bold d-inline-flex align-items-center gap-2 border-opacity-25"
                        >
                            <LogOut size={16} /> Logout Session
                        </button>
                    </motion.div>
                )}

                {!isAuthenticated && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="text-center mt-4 pt-2"
                    >
                        <Link to="/login" className="btn btn-premium px-4 px-sm-5 py-2.5 py-sm-3 rounded-pill text-nowrap">
                            Unlock Full Portal <Zap size={18} className="ms-2" />
                        </Link>
                    </motion.div>
                )}
            </div>
        </div>
    )
}

export default Home
