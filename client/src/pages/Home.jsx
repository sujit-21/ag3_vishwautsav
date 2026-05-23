import { motion } from 'framer-motion'
import { Calendar, Music, Zap, Users, ChevronRight, LayoutDashboard, MessageSquare, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Home = () => {
    const { isAuthenticated, logout } = useAuth()

    const shortcuts = [
        {
            title: 'Festivals',
            desc: 'Initiate and manage global festivals.',
            icon: <Music size={24} />,
            path: '/festivals',
            color: 'var(--accent-1)',
            badge: 'Registry'
        },
        {
            title: 'Events',
            desc: 'Initiate and manage global events.',
            icon: <Calendar size={24} />,
            path: '/events',
            color: 'var(--accent-3)',
            badge: 'Operations'
        },
        {
            title: 'Dashboard',
            desc: 'Dashboard for Controls.',
            icon: <LayoutDashboard size={24} />,
            path: '/dashboard',
            color: 'var(--accent-2)',
            badge: 'Elite'
        },
        {
            title: 'Feedback',
            desc: 'Provide feedback to the developers.',
            icon: <MessageSquare size={24} />,
            path: '/feedback',
            color: '#10b981',
            badge: 'Social'
        }
    ]

    return (
        <div className="home-page min-vh-100 bg-primary-bg py-5">
            {/* Background Mesh */}
            <div className="position-fixed top-0 start-0 w-100 h-100 opacity-20 z-0 pointer-events-none" style={{
                backgroundImage: `radial-gradient(circle at 10% 20%, var(--accent-1), transparent 40%), radial-gradient(circle at 90% 80%, var(--accent-2), transparent 40%)`
            }}></div>

            <div className="container position-relative z-1 pt-5">
                <div className="text-center mb-5 pb-4">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill mb-3 border border-primary border-opacity-20 uppercase ls-2 tiny fw-bold">Vishwa Utsav Portal</span>
                        <h1 className="display-4 fw-extrabold text-white mb-3">
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
                        <p className="text-muted fs-5 max-w-2xl mx-auto">A Global Platform for Cultural Exchange and Celebration</p>
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
                                    <div className="glass-card-premium p-3 h-100 d-flex flex-column border-opacity-10 shadow-glow-hover">
                                        <div className="d-flex justify-content-end align-items-start mb-3">
                                            <span className="tiny uppercase fw-bold ls-2 opacity-40 text-white">{item.badge}</span>
                                        </div>
                                        <h5 className="fw-bold text-white mb-2 d-flex align-items-center gap-2">
                                            {item.title}
                                        </h5>
                                        <p className="tiny text-muted mb-3 flex-grow-1">
                                            {item.desc}
                                        </p>
                                        <div className="mt-auto d-flex align-items-center text-primary fw-bold small uppercase ls-1 gap-2">
                                            Access <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        </div>
                    ))}
                </div>

                {isAuthenticated && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-center mt-5 pt-4"
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
                        className="text-center mt-5 pt-5"
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
