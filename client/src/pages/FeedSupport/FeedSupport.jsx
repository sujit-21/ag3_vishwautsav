import { useState, useEffect } from 'react'
import './FeedSupport.css'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useLocation } from 'react-router-dom'
import {
    Plus,
    Trash2,
    Edit3,
    Save,
    Star,
    User,
    Image as ImageIcon,
    MessageSquare,
    HelpCircle,
    Mail,
    Phone,
    ShieldCheck,
    X,
    LifeBuoy,
    CheckCircle2,
    Clock,
    Sparkles
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import axios from 'axios'

const StarRating = ({ rating, interactive = false, onRatingChange }) => {
    return (
        <div className="d-flex gap-1 justify-content-center align-items-center">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    size={20}
                    className={interactive ? 'cursor-pointer transition-transform' : ''}
                    style={{ transition: 'transform 0.15s ease' }}
                    fill={s <= rating ? '#fbbf24' : 'transparent'}
                    color={s <= rating ? '#fbbf24' : '#94a3b8'}
                    onClick={() => interactive && onRatingChange && onRatingChange(s)}
                />
            ))}
        </div>
    )
}

const FeedSupport = () => {
    const { user } = useAuth()
    const toast = useToast()
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'

    const [searchParams, setSearchParams] = useSearchParams()
    const location = useLocation()
    const initialTab = searchParams.get('tab') === 'support' || location.pathname === '/support' ? 'support' : 'feed'
    const [activeTab, setActiveTab] = useState(initialTab)

    // Sync tab with URL search parameter or route if changed
    useEffect(() => {
        const tab = searchParams.get('tab')
        if (tab === 'support' || location.pathname === '/support') {
            setActiveTab('support')
        } else if (tab === 'feed' || tab === 'feedback' || location.pathname === '/feedback') {
            setActiveTab('feed')
        }
    }, [searchParams, location.pathname])

    const handleTabChange = (newTab) => {
        setActiveTab(newTab)
        setSearchParams({ tab: newTab })
    }

    // ==========================================
    // 1. FEEDBACK / REVIEWS STATE & HANDLERS
    // ==========================================
    const [feedbackData, setFeedbackData] = useState([])
    const [isAddingFeedback, setIsAddingFeedback] = useState(false)
    const [editingFeedbackId, setEditingFeedbackId] = useState(null)
    const [loadingFeedback, setLoadingFeedback] = useState(true)
    const [feedbackForm, setFeedbackForm] = useState({
        userName: user?.name || '',
        rating: 5,
        review: '',
        image: ''
    })

    const fetchFeedback = async () => {
        try {
            setLoadingFeedback(true)
            const res = await axios.get('/api/feedback')
            setFeedbackData(Array.isArray(res.data) ? res.data : [])
        } catch (err) {
            console.error('Error fetching feedback:', err)
        } finally {
            setLoadingFeedback(false)
        }
    }

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingFeedbackId) {
                await axios.put(`/api/feedback/${editingFeedbackId}`, feedbackForm)
                toast.success('Review updated successfully!')
            } else {
                await axios.post('/api/feedback', feedbackForm)
                toast.success('Thank you! Your review has been posted.')
            }
            fetchFeedback()
            resetFeedbackForm()
        } catch (err) {
            console.error(err)
            toast.error(err.response?.data?.message || 'Error saving review')
        }
    }

    const resetFeedbackForm = () => {
        setFeedbackForm({
            userName: user?.name || '',
            rating: 5,
            review: '',
            image: ''
        })
        setEditingFeedbackId(null)
        setIsAddingFeedback(false)
    }

    const handleFeedbackEdit = (item) => {
        setFeedbackForm({
            userName: item.userName || '',
            rating: item.rating || 5,
            review: item.review || '',
            image: item.image || ''
        })
        setEditingFeedbackId(item._id)
        setIsAddingFeedback(true)
        window.scrollTo({ top: 180, behavior: 'smooth' })
    }

    const handleFeedbackDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this review?')) return
        try {
            await axios.delete(`/api/feedback/${id}`)
            toast.success('Review deleted')
            fetchFeedback()
        } catch (err) {
            console.error(err)
            toast.error('Error deleting review')
        }
    }

    const handleFeedbackImageUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setFeedbackForm(prev => ({ ...prev, image: reader.result }))
            }
            reader.readAsDataURL(file)
        }
    }

    // ==========================================
    // 2. SUPPORT STATE & HANDLERS
    // ==========================================
    const [supportData, setSupportData] = useState([])
    const [isAddingSupport, setIsAddingSupport] = useState(false)
    const [editingSupportId, setEditingSupportId] = useState(null)
    const [loadingSupport, setLoadingSupport] = useState(true)
    const [supportForm, setSupportForm] = useState({
        role: 'Developer',
        name: '',
        contact: '',
        email: '',
        image: ''
    })

    const fetchSupport = async () => {
        try {
            setLoadingSupport(true)
            const res = await axios.get('/api/support')
            setSupportData(Array.isArray(res.data) ? res.data : [])
        } catch (err) {
            console.error('Error fetching support:', err)
        } finally {
            setLoadingSupport(false)
        }
    }

    const handleSupportSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingSupportId) {
                await axios.put(`/api/support/${editingSupportId}`, supportForm)
                toast.success('Support contact updated successfully!')
            } else {
                await axios.post('/api/support', supportForm)
                toast.success('Support contact added successfully!')
            }
            fetchSupport()
            resetSupportForm()
        } catch (err) {
            console.error(err)
            toast.error(err.response?.data?.message || 'Error saving support contact')
        }
    }

    const resetSupportForm = () => {
        setSupportForm({
            role: 'Developer',
            name: '',
            contact: '',
            email: '',
            image: ''
        })
        setEditingSupportId(null)
        setIsAddingSupport(false)
    }

    const handleSupportEdit = (item) => {
        setSupportForm({
            role: item.role || 'Developer',
            name: item.name || '',
            contact: item.contact || '',
            email: item.email || '',
            image: item.image || ''
        })
        setEditingSupportId(item._id)
        setIsAddingSupport(true)
        window.scrollTo({ top: 180, behavior: 'smooth' })
    }

    const handleSupportDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this support entry?')) return
        try {
            await axios.delete(`/api/support/${id}`)
            toast.success('Support contact deleted')
            fetchSupport()
        } catch (err) {
            console.error(err)
            toast.error('Error deleting contact')
        }
    }

    const handleSupportImageUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setSupportForm(prev => ({ ...prev, image: reader.result }))
            }
            reader.readAsDataURL(file)
        }
    }

    // Initial data fetch
    useEffect(() => {
        fetchFeedback()
        fetchSupport()
    }, [])

    return (
        <div className="container pt-3 pb-5 feed-support-container">
            <Helmet>
                <title>Feed & Support — Vishwa Utsav Community & Help</title>
                <meta
                    name="description"
                    content="Vishwa Utsav unified Feed & Support portal. Share authentic festival reviews, view community stories, and connect with event administrators, developers, and coordinators."
                />
                <meta property="og:title" content="Feed & Support — Vishwa Utsav" />
                <meta
                    property="og:description"
                    content="Share community reviews and connect directly with the Vishwa Utsav festival support team."
                />
                <meta property="og:url" content="https://vishwautsav.com/feed-support" />
                <link rel="canonical" href="https://vishwautsav.com/feed-support" />
            </Helmet>

            {/* Header Title & Tab Controls */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h1 className="fw-bold fs-2 mb-1">
                        Feed & <span className="gradient-text">Support</span>
                    </h1>
                    <p className="text-muted small mb-0">
                        Share festival experiences, read community reviews, and get assistance from our coordinators.
                    </p>
                </div>

                {/* Primary Segment Switcher */}
                <div className="feed-support-nav-pill-group align-self-start align-self-md-center">
                    <button
                        type="button"
                        className={`feed-support-tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
                        onClick={() => handleTabChange('feed')}
                        aria-selected={activeTab === 'feed'}
                    >
                        <MessageSquare size={17} />
                        <span>Community Feed</span>
                        <span className="feed-support-badge-count">{feedbackData.length}</span>
                    </button>

                    <button
                        type="button"
                        className={`feed-support-tab-btn ${activeTab === 'support' ? 'active' : ''}`}
                        onClick={() => handleTabChange('support')}
                        aria-selected={activeTab === 'support'}
                    >
                        <LifeBuoy size={17} />
                        <span>Help &amp; Support</span>
                        <span className="feed-support-badge-count">{supportData.length}</span>
                    </button>
                </div>
            </div>

            {/* Action Bar per Tab */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    {activeTab === 'feed' ? (
                        <span className="text-muted small fw-medium">
                            Displaying <strong>{feedbackData.length}</strong> community experiences
                        </span>
                    ) : (
                        <span className="text-muted small fw-medium">
                            Displaying <strong>{supportData.length}</strong> verified support contacts
                        </span>
                    )}
                </div>

                {/* Action button: Write Review vs Add Contact */}
                {activeTab === 'feed' ? (
                    !isAddingFeedback && (
                        <button
                            onClick={() => {
                                setIsAddingFeedback(true)
                                setEditingFeedbackId(null)
                                setFeedbackForm({
                                    userName: user?.name || '',
                                    rating: 5,
                                    review: '',
                                    image: ''
                                })
                            }}
                            className="btn btn-premium px-4 py-2 small fw-semibold d-inline-flex align-items-center gap-2"
                        >
                            <MessageSquare size={16} />
                            <span>Share Review</span>
                        </button>
                    )
                ) : (
                    isAdmin && !isAddingSupport && (
                        <button
                            onClick={() => {
                                setIsAddingSupport(true)
                                setEditingSupportId(null)
                                setSupportForm({
                                    role: 'Developer',
                                    name: '',
                                    contact: '',
                                    email: '',
                                    image: ''
                                })
                            }}
                            className="btn btn-premium px-4 py-2 small fw-semibold d-inline-flex align-items-center gap-2"
                        >
                            <Plus size={16} />
                            <span>Add Support Contact</span>
                        </button>
                    )
                )}
            </div>

            {/* ============================================================== */}
            {/* TAB 1: COMMUNITY FEED & REVIEWS                               */}
            {/* ============================================================== */}
            {activeTab === 'feed' && (
                <motion.div
                    key="tab-feed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                >
                    {/* Add / Edit Review Modal/Form */}
                    <AnimatePresence>
                        {isAddingFeedback && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.96 }}
                                className="glass-card p-4 mb-4 shadow-sm border border-primary border-opacity-10 mx-auto"
                                style={{ maxWidth: '800px' }}
                            >
                                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary border-opacity-10">
                                    <h5 className="fw-bold mb-0 fs-5 d-flex align-items-center gap-2">
                                        <Sparkles size={18} className="text-warning" />
                                        {editingFeedbackId ? 'Update Your Review' : 'Write a New Festival Review'}
                                    </h5>
                                    <button
                                        type="button"
                                        onClick={resetFeedbackForm}
                                        className="btn btn-sm btn-link text-muted p-1"
                                        aria-label="Close form"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <form onSubmit={handleFeedbackSubmit} className="row g-3">
                                    <div className="col-md-6">
                                        <label className="small text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                                            Your Name
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input form-control-sm"
                                            value={feedbackForm.userName}
                                            onChange={e => setFeedbackForm({ ...feedbackForm, userName: e.target.value })}
                                            required
                                            placeholder="Enter your name"
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="small text-muted mb-1 text-uppercase fw-bold text-center d-block" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                                            Rating ({feedbackForm.rating}/5)
                                        </label>
                                        <div className="py-1">
                                            <StarRating
                                                rating={feedbackForm.rating}
                                                interactive={true}
                                                onRatingChange={(r) => setFeedbackForm({ ...feedbackForm, rating: r })}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-12">
                                        <label className="small text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                                            Your Review / Feedback
                                        </label>
                                        <textarea
                                            className="form-input form-control-sm"
                                            rows="3"
                                            value={feedbackForm.review}
                                            onChange={e => setFeedbackForm({ ...feedbackForm, review: e.target.value })}
                                            required
                                            placeholder="Tell the community about your festival experience, atmosphere, pass process, and tips..."
                                        />
                                    </div>

                                    <div className="col-md-12">
                                        <label className="small text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                                            Festival Photo / Memory (Optional)
                                        </label>
                                        <div className="d-flex align-items-center gap-3">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="form-input form-control-sm"
                                                onChange={handleFeedbackImageUpload}
                                            />
                                            {feedbackForm.image && (
                                                <div className="d-flex align-items-center gap-2">
                                                    <img
                                                        src={feedbackForm.image}
                                                        alt="Preview"
                                                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setFeedbackForm(prev => ({ ...prev, image: '' }))}
                                                        className="btn btn-sm btn-outline-danger py-0 px-2 small"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-12 d-flex gap-2 justify-content-end mt-3 pt-2 border-top border-secondary border-opacity-10">
                                        <button
                                            type="button"
                                            onClick={resetFeedbackForm}
                                            className="btn btn-cancel px-4 py-2 rounded-pill small fw-bold"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-premium px-4 py-2 rounded-pill small fw-bold d-inline-flex align-items-center gap-2"
                                        >
                                            <Save size={16} />
                                            <span>{editingFeedbackId ? 'Update Review' : 'Post Review'}</span>
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Feedback Reviews Grid */}
                    {loadingFeedback ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading reviews...</span>
                            </div>
                            <p className="text-muted small mt-2">Loading community stories...</p>
                        </div>
                    ) : feedbackData.length === 0 ? (
                        <div className="glass-card p-5 text-center my-4">
                            <MessageSquare size={48} className="text-muted mb-3 opacity-50" />
                            <h4 className="fw-bold mb-2">No Reviews Yet</h4>
                            <p className="text-muted small mb-4" style={{ maxWidth: '440px', margin: '0 auto' }}>
                                Be the first one to share feedback and experiences with the Vishwa Utsav festival community!
                            </p>
                            <button
                                onClick={() => setIsAddingFeedback(true)}
                                className="btn btn-premium px-4 py-2 small fw-semibold"
                            >
                                Share Your Review
                            </button>
                        </div>
                    ) : (
                        <div className="row g-4">
                            {feedbackData.map((item) => (
                                <div key={item._id} className="col-md-6">
                                    <motion.div
                                        whileHover={{ y: -4 }}
                                        className="glass-card feed-card p-4 h-100 position-relative shadow-sm overflow-hidden d-flex flex-column justify-content-between"
                                    >
                                        {isAdmin && (
                                            <div className="position-absolute top-0 end-0 m-3 d-flex gap-2" style={{ zIndex: 5 }}>
                                                <button
                                                    onClick={() => handleFeedbackEdit(item)}
                                                    className="btn btn-sm btn-white border-0 shadow-sm rounded-circle p-2"
                                                    title="Edit review"
                                                >
                                                    <Edit3 size={14} className="text-primary" />
                                                </button>
                                                <button
                                                    onClick={() => handleFeedbackDelete(item._id)}
                                                    className="btn btn-sm btn-white border-0 shadow-sm rounded-circle p-2"
                                                    title="Delete review"
                                                >
                                                    <Trash2 size={14} className="text-danger" />
                                                </button>
                                            </div>
                                        )}

                                        <div>
                                            {/* User Info Header */}
                                            <div className="d-flex align-items-center gap-3 mb-3">
                                                <div
                                                    className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center border border-2 border-primary border-opacity-25"
                                                    style={{ width: '54px', height: '54px', minWidth: '54px' }}
                                                >
                                                    <User size={26} className="text-primary" />
                                                </div>
                                                <div>
                                                    <h5 className="fw-bold mb-1 fs-6">{item.userName}</h5>
                                                    <StarRating rating={item.rating} />
                                                </div>
                                            </div>

                                            {/* Review Body */}
                                            <p
                                                className="text-muted mb-3 italic"
                                                style={{
                                                    borderLeft: '3px solid var(--accent-1, #e07a5f)',
                                                    paddingLeft: '0.85rem',
                                                    fontSize: '0.95rem',
                                                    lineHeight: '1.6'
                                                }}
                                            >
                                                "{item.review}"
                                            </p>

                                            {/* Attached Image */}
                                            {item.image && (
                                                <div className="rounded-3 overflow-hidden mt-3 mb-2 shadow-sm" style={{ maxHeight: '260px' }}>
                                                    <img
                                                        src={item.image}
                                                        alt="Festival Memory"
                                                        className="img-fluid w-100"
                                                        style={{ height: '260px', objectFit: 'cover' }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Date Footer */}
                                        <div className="mt-3 pt-3 border-top border-secondary border-opacity-10 d-flex justify-content-between align-items-center">
                                            <span className="badge bg-secondary bg-opacity-10 text-muted px-2 py-1 small">
                                                Verified Attendee
                                            </span>
                                            <small className="text-muted smaller fw-bold text-uppercase d-flex align-items-center gap-1">
                                                <Clock size={12} />
                                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                                            </small>
                                        </div>
                                    </motion.div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* ============================================================== */}
            {/* TAB 2: HELP & SUPPORT CONTACTS                                */}
            {/* ============================================================== */}
            {activeTab === 'support' && (
                <motion.div
                    key="tab-support"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                >
                    {/* Quick Assistance Banner */}
                    <div className="quick-assist-box mb-4">
                        <div className="row align-items-center gy-3">
                            <div className="col-lg-8">
                                <div className="d-flex align-items-center gap-3">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center"
                                        style={{ width: '48px', height: '48px', minWidth: '48px', background: 'rgba(224, 122, 95, 0.2)' }}
                                    >
                                        <ShieldCheck size={24} style={{ color: 'var(--palette-terracotta, #e07a5f)' }} />
                                    </div>
                                    <div>
                                        <h6 className="fw-bold mb-1" style={{ color: 'var(--text-main, #f8fafc)' }}>
                                            Need Immediate Event or Pass Assistance?
                                        </h6>
                                        <p className="text-muted small mb-0">
                                            Our designated festival coordinators and tech staff are available for attendee pass inquiries, entity verification, and festival logistics.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-4 text-lg-end">
                                <span className="badge bg-success bg-opacity-20 text-success border border-success border-opacity-25 px-3 py-2">
                                    <CheckCircle2 size={14} className="me-1" /> Active Support Desk
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Add / Edit Support Contact Form (Admin) */}
                    <AnimatePresence>
                        {isAddingSupport && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="glass-card p-4 mb-4 shadow-sm border border-secondary border-opacity-10"
                            >
                                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary border-opacity-10">
                                    <h5 className="fw-bold mb-0 fs-5">
                                        {editingSupportId ? 'Edit Support Contact' : 'Add New Support Contact'}
                                    </h5>
                                    <button
                                        type="button"
                                        onClick={resetSupportForm}
                                        className="btn btn-sm btn-link text-muted p-1"
                                        aria-label="Close form"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <form onSubmit={handleSupportSubmit} className="row g-3">
                                    <div className="col-md-4">
                                        <label className="small text-muted mb-1 fw-bold" style={{ fontSize: '0.72rem' }}>Role</label>
                                        <select
                                            className="form-input form-control-sm"
                                            value={supportForm.role}
                                            onChange={e => setSupportForm({ ...supportForm, role: e.target.value })}
                                        >
                                            <option>Developer</option>
                                            <option>Admin</option>
                                            <option>Coordinator</option>
                                            <option>Support Staff</option>
                                        </select>
                                    </div>

                                    <div className="col-md-8">
                                        <label className="small text-muted mb-1 fw-bold" style={{ fontSize: '0.72rem' }}>Full Name</label>
                                        <input
                                            type="text"
                                            className="form-input form-control-sm"
                                            value={supportForm.name}
                                            onChange={e => setSupportForm({ ...supportForm, name: e.target.value })}
                                            required
                                            placeholder="e.g. Rahul Sharma"
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="small text-muted mb-1 fw-bold" style={{ fontSize: '0.72rem' }}>Email Address</label>
                                        <input
                                            type="email"
                                            className="form-input form-control-sm"
                                            value={supportForm.email}
                                            onChange={e => setSupportForm({ ...supportForm, email: e.target.value })}
                                            placeholder="support@vishwautsav.com"
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="small text-muted mb-1 fw-bold" style={{ fontSize: '0.72rem' }}>Contact Phone</label>
                                        <input
                                            type="text"
                                            className="form-input form-control-sm"
                                            value={supportForm.contact}
                                            onChange={e => setSupportForm({ ...supportForm, contact: e.target.value })}
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>

                                    <div className="col-12">
                                        <label className="small text-muted mb-1 fw-bold" style={{ fontSize: '0.72rem' }}>Avatar / Photograph</label>
                                        <div className="d-flex align-items-center gap-3">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="form-input form-control-sm"
                                                onChange={handleSupportImageUpload}
                                            />
                                            {supportForm.image && (
                                                <div className="d-flex align-items-center gap-2">
                                                    <img
                                                        src={supportForm.image}
                                                        alt="Avatar preview"
                                                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%' }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setSupportForm(prev => ({ ...prev, image: '' }))}
                                                        className="btn btn-sm btn-outline-danger py-0 px-2 small"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-12 d-flex gap-2 justify-content-end mt-3 pt-2 border-top border-secondary border-opacity-10">
                                        <button
                                            type="button"
                                            onClick={resetSupportForm}
                                            className="btn btn-cancel px-4 py-2 rounded-pill small fw-bold"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-premium px-4 py-2 rounded-pill small fw-bold d-inline-flex align-items-center gap-2"
                                        >
                                            <Save size={16} />
                                            <span>Save Contact</span>
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Support Contacts Grid */}
                    {loadingSupport ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading support team...</span>
                            </div>
                            <p className="text-muted small mt-2">Loading support contacts...</p>
                        </div>
                    ) : supportData.length === 0 ? (
                        <div className="glass-card p-5 text-center my-4">
                            <HelpCircle size={48} className="text-muted mb-3 opacity-50" />
                            <h4 className="fw-bold mb-2">No Support Contacts Configured</h4>
                            <p className="text-muted small mb-4" style={{ maxWidth: '440px', margin: '0 auto' }}>
                                The team hasn't listed contact personnel yet. Check back shortly or contact the organization administrator.
                            </p>
                            {isAdmin && (
                                <button
                                    onClick={() => setIsAddingSupport(true)}
                                    className="btn btn-premium px-4 py-2 small fw-semibold"
                                >
                                    Add First Support Contact
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="row g-4">
                            {supportData.map((item) => (
                                <div key={item._id} className="col-md-6 col-lg-4">
                                    <div className="glass-card support-contact-card p-4 h-100 text-center position-relative d-flex flex-column justify-content-between">
                                        {isAdmin && (
                                            <div className="position-absolute top-0 end-0 m-3 d-flex gap-2" style={{ zIndex: 5 }}>
                                                <button
                                                    onClick={() => handleSupportEdit(item)}
                                                    className="btn btn-sm btn-white bg-opacity-100 border-0 shadow-sm rounded-circle p-2"
                                                    title="Edit contact"
                                                >
                                                    <Edit3 size={14} className="text-primary" />
                                                </button>
                                                <button
                                                    onClick={() => handleSupportDelete(item._id)}
                                                    className="btn btn-sm btn-white bg-opacity-100 border-0 shadow-sm rounded-circle p-2"
                                                    title="Delete contact"
                                                >
                                                    <Trash2 size={14} className="text-danger" />
                                                </button>
                                            </div>
                                        )}

                                        <div>
                                            {/* Contact Avatar */}
                                            <div className="mb-3 d-inline-block">
                                                <div className="support-avatar-wrap shadow-sm">
                                                    {item.image ? (
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="support-avatar-img"
                                                        />
                                                    ) : (
                                                        <User size={46} className="text-muted" />
                                                    )}
                                                </div>
                                            </div>

                                            <h4 className="fw-bold mb-1 fs-5">{item.name}</h4>

                                            {/* Role Badge */}
                                            <div className="d-inline-flex align-items-center badge bg-primary bg-opacity-10 text-primary mb-3 px-3 py-1.5 fw-semibold">
                                                <ShieldCheck size={14} className="me-1.5" />
                                                <span>{item.role || 'Coordinator'}</span>
                                            </div>

                                            {/* Contacts List */}
                                            <div className="d-flex flex-column gap-2 text-muted small mt-2">
                                                {item.email && (
                                                    <a
                                                        href={`mailto:${item.email}`}
                                                        className="d-flex align-items-center justify-content-center gap-2 text-decoration-none text-muted hover-accent"
                                                    >
                                                        <Mail size={15} className="text-primary" />
                                                        <span className="text-truncate" style={{ maxWidth: '220px' }}>{item.email}</span>
                                                    </a>
                                                )}
                                                {item.contact && (
                                                    <a
                                                        href={`tel:${item.contact}`}
                                                        className="d-flex align-items-center justify-content-center gap-2 text-decoration-none text-muted hover-accent"
                                                    >
                                                        <Phone size={15} className="text-success" />
                                                        <span>{item.contact}</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-top border-secondary border-opacity-10">
                                            <span className="text-muted extra-tiny text-uppercase tracking-wider">
                                                Vishwa Utsav Official Support
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    )
}

export default FeedSupport
