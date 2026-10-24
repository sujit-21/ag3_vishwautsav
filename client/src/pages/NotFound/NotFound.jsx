import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Compass, ArrowLeft, Sparkles } from 'lucide-react'
import './NotFound.css'

export default function NotFound() {
    return (
        <div className="notfound-container">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="notfound-card w-100"
            >
                <span className="notfound-badge">
                    <Sparkles size={14} className="me-1" /> Celebration Interrupted
                </span>

                <div className="notfound-code">404</div>

                <h2 className="fw-extrabold mb-2" style={{ color: 'var(--text-main)', fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                    Lost in the Celebrations?
                </h2>
                
                <p className="text-muted small mb-4 mx-auto" style={{ maxWidth: '420px', lineHeight: '1.6' }}>
                    The page or festival stage you are looking for doesn't exist, has been rescheduled, or was moved to another pavilion.
                </p>

                <div className="d-flex flex-column flex-sm-row justify-content-center align-items-center gap-2 gap-sm-3">
                    <Link to="/" className="btn btn-premium px-4 py-2.5 rounded-pill text-nowrap d-flex align-items-center gap-2">
                        <Home size={16} /> Return to Main Stage
                    </Link>
                    <Link to="/festivals" className="btn btn-outline-secondary px-4 py-2.5 rounded-pill text-nowrap d-flex align-items-center gap-2 border-opacity-50">
                        <Compass size={16} /> Explore Festivals
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}
