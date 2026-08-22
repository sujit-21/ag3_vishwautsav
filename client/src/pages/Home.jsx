import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Music, Zap, Users, ChevronRight, LayoutDashboard, MessageSquare, LogOut, Sparkles, Ticket } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import musicConcertImg from '../homepage_images/Music Concert.jpg'
import consertImg from '../homepage_images/consert.jpg'
import holiImg from '../homepage_images/holi.jpg'
import southFestivalsImg from '../homepage_images/south festivals.jpg'

const bgImages = [musicConcertImg, consertImg, holiImg, southFestivalsImg]
const Home = () => {
    const { isAuthenticated, logout } = useAuth()
    const navigate = useNavigate()
    const [currentBgIndex, setCurrentBgIndex] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBgIndex((prev) => (prev + 1) % bgImages.length)
        }, 6000)
        return () => clearInterval(interval)
    }, [])

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
            title: 'Feedback',
            desc: 'Provide feedback to the developers.',
            icon: <MessageSquare size={24} />,
            path: '/feedback',
            color: '#10b981',
            badge: 'Community'
        }
    ]

    return (
        <div className="home-page min-vh-100 bg-transparent py-4">

            <div className="container position-relative z-1 pt-3">
                <div className="text-center mb-4 pb-2">
                    <motion.div
                        className="bg-white bg-opacity-50 rounded-pill px-3 py-1 d-inline-block shadow-sm border border-white border-opacity-50"
                        style={{ backdropFilter: 'blur(10px)' }}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="display-6 fw-extrabold mb-1" style={{ color: '#D9480F' }}>
                            {"Welcome to ".split('').map((char, index) => (
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
                        </h1>
                        <motion.p 
                            className="small ls-2 text-uppercase fw-semibold mb-0" 
                            style={{ color: 'var(--text-muted)' }}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                        >
                            ONE WORLD , MANY CELEBRATIONS
                        </motion.p>
                    </motion.div>
                </div>

                <div className="row g-4 justify-content-center">
                    {shortcuts.map((item, idx) => (
                        <div key={idx} className="col-lg-3 col-md-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                                whileHover={{ y: -8, scale: 1.02 }}
                            >
                                <Link to={isAuthenticated ? item.path : '/login'} className="text-decoration-none h-100 d-block">
                                    <div 
                                        className="shortcut-card p-4 h-100 d-flex flex-column"
                                        style={{
                                            '--card-accent': item.color,
                                            '--card-accent-glow': `${item.color}25`,
                                            '--card-bg-dark': `${item.color}10`,
                                            '--card-border-dark': `${item.color}25`,
                                            '--card-bg-light': `${item.color}08`,
                                            '--card-border-light': `${item.color}18`
                                        }}
                                    >
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <div 
                                                className="d-flex align-items-center justify-content-center rounded-3" 
                                                style={{ 
                                                    width: '48px', 
                                                    height: '48px', 
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
                                        <h5 className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ color: '#D9480F' }}>
                                            {item.title}
                                        </h5>
                                        <p className="tiny mb-4 flex-grow-1" style={{ color: 'var(--text-muted)' }}>
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

                <div className="row mt-4 g-4 align-items-stretch">
                    {/* Gallery Section */}
                    <div className="col-lg-6 d-flex">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => navigate('/gallery')}
                            className="about-card w-100 h-100 position-relative overflow-hidden shadow-sm"
                            style={{ minHeight: '350px', cursor: 'pointer' }}
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
                            <div className="position-absolute top-0 start-0 w-100 p-4 text-center" style={{ zIndex: 1 }}>
                                <span className="badge bg-white bg-opacity-75 text-dark px-4 py-2 rounded-pill shadow-sm border border-white border-opacity-50 uppercase ls-2 tiny fw-bold d-inline-flex align-items-center justify-content-center" style={{ backdropFilter: 'blur(5px)', lineHeight: 1 }}>Gallery</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* About Section */}
                    <div className="col-lg-6 d-flex">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="w-100 d-flex"
                        >
                            <div className="about-card p-4 w-100 d-flex flex-column justify-content-center">
                                <div className="text-center">
                                    <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill mb-3 border border-primary border-opacity-20 uppercase ls-2 tiny fw-bold d-inline-flex align-items-center justify-content-center" style={{ lineHeight: 1 }}>About</span>
                                </div>
                                <p className="text-muted mb-0" style={{ fontSize: '0.95rem', lineHeight: '1.6', textAlign: 'justify' }}>
                                    Celebrating Culture. Connecting Communities.

Vishwa Utsav is a digital platform for festivals, cultural events, and community programs that enables paperless registrations, digital passes, subscriptions, donations, and seamless event management.

Our platform connects organizers, participants, volunteers, sponsors, and communities through one unified digital ecosystem.

Our vision is to create a smart, connected, and eco-friendly event ecosystem that brings people, culture, and celebrations together through technology.
                                </p>
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
                        <Link to="/login" className="btn btn-premium px-5 py-3 rounded-pill">
                            Unlock Full Portal <Zap size={18} className="ms-2" />
                        </Link>
                    </motion.div>
                )}
            </div>
        </div>
    )
}

export default Home
