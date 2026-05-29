import { motion } from 'framer-motion'
import { Calendar, Music, Zap, Users, ChevronRight, LayoutDashboard, MessageSquare, LogOut, Sparkles, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Home = () => {
    const { isAuthenticated, logout } = useAuth()

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
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill mb-3 border border-primary border-opacity-20 uppercase ls-2 tiny fw-bold">Vishwa Utsav Portal</span>
                        <h1 className="display-4 fw-extrabold mb-2" style={{ color: 'var(--text-main)' }}>
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
                                    className="gradient-text"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                        duration: 0.5,
                                        delay: ("Welcome to ".length + index) * 0.1,
                                        repeat: Infinity,
                                        repeatDelay: 5
                                    }}
                                    style={{ display: "inline-block", whiteSpace: "pre" }}
                                >
                                    {char}
                                </motion.span>
                            ))}
                        </h1>
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
                                        <h5 className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ color: 'var(--text-main)' }}>
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

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="text-center mt-4 mx-auto"
                    style={{ maxWidth: '700px' }}
                >
                    <div className="about-card p-4">
                        <div className="text-center">
                            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill mb-3 border border-primary border-opacity-20 uppercase ls-2 tiny fw-bold">About</span>
                        </div>
                        <p className="text-muted mb-0" style={{ fontSize: '0.95rem', lineHeight: '1.6', textAlign: 'justify' }}>
                            Celebrating Culture. Connecting Communities.

Vishwa Utsav is a digital platform for festivals, cultural events, and community programs that enables paperless registrations, digital passes, subscriptions, donations, and seamless event management.

Our platform connects organizers, participants, volunteers, sponsors, and communities through one unified digital ecosystem.

Our vision is to create a smart, connected, and eco-friendly event ecosystem that brings people, culture, and celebrations together through technology.

                        </p>
                    </div>
                </motion.div>

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
