import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, ShieldCheck, Heart, ArrowUp, Calendar, Ticket, MessageSquare, HelpCircle, Image as ImageIcon } from 'lucide-react'
import logoImage from '../images/VISHWA UTSAV.png'
import './Footer.css'

export default function Footer() {
    const [showScrollTop, setShowScrollTop] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 350) {
                setShowScrollTop(true)
            } else {
                setShowScrollTop(false)
            }
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <>
            <footer className="footer-luxury py-5 px-3 px-sm-4 px-lg-5">
                <div className="footer-top-accent" />
                <div className="container-fluid px-xl-5">
                    <div className="row g-4 g-lg-5">
                        {/* Brand Column */}
                        <div className="col-12 col-lg-4">
                            <Link to="/" className="d-flex align-items-center gap-2 mb-3 text-decoration-none">
                                <div className="d-flex align-items-center justify-content-center p-1 rounded-3 shadow-glow" style={{ width: '38px', height: '38px', background: 'rgba(67, 130, 149, 0.2)', border: '1px solid rgba(163, 217, 201, 0.3)' }}>
                                    <img src={logoImage} alt="Vishwa Utsav Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                                <span className="fs-4 fw-extrabold mb-0 tracking-tight" style={{ color: '#D9480F', fontFamily: 'var(--font-heading)' }}>
                                    VishwaUtsav
                                </span>
                            </Link>
                            <p className="text-muted small mb-3" style={{ lineHeight: '1.65', maxWidth: '340px' }}>
                                The modern digital ecosystem for cultural festivals and public celebrations. Enabling paperless registrations, instant digital passes, and transparent event management.
                            </p>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className="footer-badge-pill">
                                    <span className="footer-status-dot" /> Live Platform
                                </span>
                                <span className="footer-badge-pill">
                                    <ShieldCheck size={13} /> 256-bit Encrypted
                                </span>
                            </div>
                        </div>

                        {/* Navigation: Explore */}
                        <div className="col-6 col-sm-4 col-lg-2">
                            <h6 className="footer-heading">Platform Hub</h6>
                            <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                                <li>
                                    <Link to="/" className="footer-link">Home Overview</Link>
                                </li>
                                <li>
                                    <Link to="/festivals" className="footer-link d-flex align-items-center gap-1.5">
                                        <Calendar size={14} className="text-muted" /> Festivals
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/events" className="footer-link d-flex align-items-center gap-1.5">
                                        <Sparkles size={14} className="text-muted" /> Events
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/gallery" className="footer-link d-flex align-items-center gap-1.5">
                                        <ImageIcon size={14} className="text-muted" /> Photo Gallery
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/feedback" className="footer-link d-flex align-items-center gap-1.5">
                                        <MessageSquare size={14} className="text-muted" /> Community Feed
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Navigation: Attendee Services */}
                        <div className="col-6 col-sm-4 col-lg-3">
                            <h6 className="footer-heading">Attendee Services</h6>
                            <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                                <li>
                                    <Link to="/my-pass" className="footer-link d-flex align-items-center gap-1.5">
                                        <Ticket size={14} className="text-muted" /> Pass Retrieval
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/verify-entity" className="footer-link">Organization Access</Link>
                                </li>
                                <li>
                                    <Link to="/support" className="footer-link d-flex align-items-center gap-1.5">
                                        <HelpCircle size={14} className="text-muted" /> Help &amp; Support
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/settings" className="footer-link">Account Settings</Link>
                                </li>
                            </ul>
                        </div>

                        {/* Mission & Trust Statement */}
                        <div className="col-12 col-sm-4 col-lg-3">
                            <h6 className="footer-heading">Our Promise</h6>
                            <div className="p-3 rounded-3" style={{ background: 'rgba(224, 122, 67, 0.08)', border: '1px solid rgba(224, 122, 67, 0.2)' }}>
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <ShieldCheck size={18} style={{ color: 'var(--palette-terracotta)' }} />
                                    <span className="fw-bold small" style={{ color: 'var(--text-main)' }}>Paperless &amp; Secure</span>
                                </div>
                                <p className="extra-tiny text-muted mb-0" style={{ lineHeight: '1.5' }}>
                                    Dedicated to sustainable zero-paper event coordination, instant cryptographic passes, and community celebrations worldwide.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Copyright Strip */}
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 mt-4 pt-4 border-top border-secondary border-opacity-10">
                        <p className="extra-tiny text-muted mb-0 text-center text-sm-start">
                            &copy; {new Date().getFullYear()} Vishwa Utsav. All rights reserved. One World, Many Celebrations.
                        </p>
                        <p className="extra-tiny text-muted mb-0 d-flex align-items-center gap-1">
                            Engineered with <Heart size={12} className="text-danger fill-danger" /> for global festivals
                        </p>
                    </div>
                </div>
            </footer>

            {/* Floating Back to Top Button */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="scroll-top-btn animate-in fade-in"
                    aria-label="Scroll to top"
                    title="Back to top"
                >
                    <ArrowUp size={18} />
                </button>
            )}
        </>
    )
}
