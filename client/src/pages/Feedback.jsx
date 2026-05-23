import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Edit3, Save, Star, User, Image as ImageIcon, MessageSquare } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const Feedback = () => {
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
    const [feedbackData, setFeedbackData] = useState([])
    const [isAdding, setIsAdding] = useState(true)
    const [editingId, setEditingId] = useState(null)
    const [formData, setFormData] = useState({
        userName: '',
        rating: 5,
        review: '',
        image: ''
    })

    useEffect(() => { fetchFeedback() }, [])

    const fetchFeedback = async () => {
        try {
            const res = await axios.get('/api/feedback')
            setFeedbackData(res.data)
        } catch (err) { console.error(err) }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingId) {
                await axios.put(`/api/feedback/${editingId}`, formData)
            } else {
                await axios.post('/api/feedback', formData)
            }
            fetchFeedback()
            resetForm()
        } catch (err) { alert('Error saving feedback') }
    }

    const resetForm = () => {
        setFormData({ userName: '', rating: 5, review: '', image: '' })
        setEditingId(null)
        setIsAdding(false)
    }

    const handleEdit = (item) => {
        setFormData(item)
        setEditingId(item._id)
        setIsAdding(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this feedback?')) return
        try {
            await axios.delete(`/api/feedback/${id}`)
            fetchFeedback()
        } catch (err) { alert('Error deleting') }
    }

    const handleImageUpload = (e, field) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData({ ...formData, [field]: reader.result })
            }
            reader.readAsDataURL(file)
        }
    }

    const StarRating = ({ rating, interactive = false, onRatingChange }) => {
        return (
            <div className="d-flex gap-1 justify-content-center">
                {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                        key={s}
                        size={20}
                        className={interactive ? 'cursor-pointer' : ''}
                        fill={s <= rating ? '#fbbf24' : 'transparent'}
                        color={s <= rating ? '#fbbf24' : '#94a3b8'}
                        onClick={() => interactive && onRatingChange(s)}
                    />
                ))}
            </div>
        )
    }

    return (
        <div className="container pt-3 pb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h1 className="fw-bold fs-2 mb-1">User <span className="gradient-text">Feedback</span></h1>
                    <p className="text-muted small mb-0">Stories and experiences from our festival community.</p>
                </div>
                {!isAdding && (
                    <button onClick={() => setIsAdding(true)} className="btn btn-premium px-4 py-2 small">
                        <MessageSquare size={16} className="me-2" /> Share Review
                    </button>
                )}
            </div>

            {isAdding && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-3 mb-4 shadow-sm border border-primary border-opacity-10 mx-auto" style={{maxWidth: '800px'}}>
                    <h5 className="fw-bold mb-3 text-center fs-5">{editingId ? 'Update Your' : 'Write a New'} Review</h5>
                    <form onSubmit={handleSubmit} className="row g-2 justify-content-center">
                        <div className="col-md-6">
                            <label className="small text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Your Name</label>
                            <input type="text" className="form-input form-control-sm" value={formData.userName} onChange={e => setFormData({ ...formData, userName: e.target.value })} required placeholder="Enter your name" />
                        </div>
                        <div className="col-md-6">
                            <label className="small text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Rating</label>
                            <div className="py-1">
                                <StarRating rating={formData.rating} interactive={true} onRatingChange={(r) => setFormData({ ...formData, rating: r })} />
                            </div>
                        </div>
                        <div className="col-12">
                            <label className="small text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Your Review</label>
                            <textarea className="form-input form-control-sm" rows="3" value={formData.review} onChange={e => setFormData({ ...formData, review: e.target.value })} required placeholder="Tell us about your experience..." />
                        </div>

                        <div className="col-md-6">
                            <label className="small text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Attachment (Optional)</label>
                            <div className="d-flex flex-column gap-2">
                                <input type="file" accept="image/*" className="form-input form-control-sm" onChange={e => handleImageUpload(e, 'image')} />
                                {formData.image && <small className="text-success"><ImageIcon size={12} className="me-1"/> Uploaded</small>}
                            </div>
                        </div>
                        <div className="col-12 d-flex gap-2 justify-content-center mt-3 pt-2 border-top border-secondary border-opacity-10">
                            <button type="submit" className="btn btn-premium px-4 py-2 rounded-pill small fw-bold"><Save size={16} className="me-2" /> {editingId ? 'Update Review' : 'Post Review'}</button>
                            <button type="button" onClick={resetForm} className="btn btn-cancel px-4 py-2 rounded-pill small fw-bold">Cancel</button>
                        </div>
                    </form>
                </motion.div>
            )}

            <div className="row g-4">
                {feedbackData.map((item) => (
                    <div key={item._id} className="col-md-6">
                        <motion.div whileHover={{ y: -5 }} className="glass-card p-4 h-100 position-relative shadow-sm overflow-hidden">
                            {isAdmin && (
                                <div className="position-absolute top-0 end-0 m-3 d-flex gap-2" style={{ zIndex: 5 }}>
                                    <button onClick={() => handleEdit(item)} className="btn btn-sm btn-white border-0 shadow-sm rounded-circle p-2">
                                        <Edit3 size={14} className="text-primary" />
                                    </button>
                                    <button onClick={() => handleDelete(item._id)} className="btn btn-sm btn-white border-0 shadow-sm rounded-circle p-2">
                                        <Trash2 size={14} className="text-danger" />
                                    </button>
                                </div>
                            )}

                            <div className="d-flex align-items-center gap-3 mb-4">
                                <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center border border-2 border-primary border-opacity-25" style={{ width: '60px', height: '60px' }}>
                                    <User size={30} className="text-primary" />
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-1">{item.userName}</h5>
                                    <StarRating rating={item.rating} />
                                </div>
                            </div>

                            <p className="text-muted fs-5 mb-4 italic" style={{ borderLeft: '4px solid var(--accent-1)', paddingLeft: '1rem' }}>
                                "{item.review}"
                            </p>

                            {item.image && (
                                <div className="rounded-4 overflow-hidden mt-3 shadow-sm" style={{ maxHeight: '300px' }}>
                                    <img src={item.image} alt="Feedback" className="img-fluid w-100" style={{ height: '300px', objectFit: 'cover' }} />
                                </div>
                            )}

                            <div className="mt-4 pt-3 border-top border-secondary border-opacity-10 text-end">
                                <small className="text-muted smaller fw-bold text-uppercase">{new Date(item.createdAt).toLocaleDateString()}</small>
                            </div>
                        </motion.div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Feedback
