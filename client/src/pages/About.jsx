import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Edit3, Save, X, Image as ImageIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const About = () => {
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
    const [aboutData, setAboutData] = useState([])
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [formData, setFormData] = useState({ title: '', content: '', image: '', order: 0 })

    useEffect(() => { fetchAbout() }, [])

    const fetchAbout = async () => {
        try {
            const res = await axios.get('/api/about')
            setAboutData(res.data)
        } catch (err) { console.error(err) }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingId) {
                await axios.put(`/api/about/${editingId}`, formData)
            } else {
                await axios.post('/api/about', formData)
            }
            fetchAbout()
            resetForm()
        } catch (err) { alert('Error saving') }
    }

    const resetForm = () => {
        setFormData({ title: '', content: '', image: '', order: 0 })
        setEditingId(null)
        setIsAdding(false)
    }

    const handleEdit = (item) => {
        setFormData(item)
        setEditingId(item._id)
        setIsAdding(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this entry?')) return
        try {
            await axios.delete(`/api/about/${id}`)
            fetchAbout()
        } catch (err) { alert('Error deleting') }
    }

    const handleImageUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => setFormData(prev => ({ ...prev, image: reader.result }))
            reader.readAsDataURL(file)
        }
    }

    return (
        <div className="container pt-3 pb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h1 className="fw-bold fs-2 mb-1">About <span className="gradient-text">Vishwa Utsav</span></h1>
                    <p className="text-muted small mb-0">Manage the information about our platform.</p>
                </div>
                {isAdmin && !isAdding && (
                    <button onClick={() => setIsAdding(true)} className="btn btn-premium px-4 py-2 small">
                        <Plus size={18} /> Add Section
                    </button>
                )}
            </div>

            {isAdding && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-3 mb-4 shadow-sm border border-secondary border-opacity-10">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="fw-bold mb-0">{editingId ? 'Edit' : 'New'} About Section</h5>
                        <button onClick={resetForm} className="btn btn-link text-muted p-0"><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="row g-2">
                        <div className="col-md-8">
                            <label className="small text-muted mb-1">Title</label>
                            <input type="text" className="form-input form-control-sm" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                        </div>
                        <div className="col-md-4">
                            <label className="small text-muted mb-1">Display Order</label>
                            <input type="number" className="form-input form-control-sm" value={formData.order} onChange={e => setFormData({ ...formData, order: e.target.value })} />
                        </div>
                        <div className="col-12">
                            <label className="small text-muted mb-1">Content</label>
                            <textarea className="form-input form-control-sm" rows="3" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} required />
                        </div>
                        <div className="col-12">
                            <label className="small text-muted mb-1">Image (Optional)</label>
                            <input type="file" accept="image/*" className="form-input form-control-sm" onChange={handleImageUpload} />
                            {formData.image && <small className="text-success mt-1 d-block"><ImageIcon size={12} className="me-1"/>Image selected</small>}
                        </div>
                        <div className="col-12 d-flex gap-2 mt-2 pt-2 border-top border-secondary border-opacity-10">
                            <button type="submit" className="btn btn-premium px-4 py-2 small"><Save size={16} className="me-1" /> {editingId ? 'Update' : 'Save'}</button>
                            <button type="button" onClick={resetForm} className="btn btn-cancel px-4 py-2 small">Cancel</button>
                        </div>
                    </form>
                </motion.div>
            )}

            <div className="row g-4">
                {aboutData.map((item) => (
                    <motion.div key={item._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-12">
                        <div className="glass-card p-4 position-relative">
                            {isAdmin && (
                                <div className="position-absolute top-0 end-0 m-3 d-flex gap-2">
                                    <button onClick={() => handleEdit(item)} className="btn btn-sm btn-white bg-opacity-100 border-0 shadow-sm rounded-circle p-2">
                                        <Edit3 size={14} className="text-primary" />
                                    </button>
                                    <button onClick={() => handleDelete(item._id)} className="btn btn-sm btn-white bg-opacity-100 border-0 shadow-sm rounded-circle p-2">
                                        <Trash2 size={14} className="text-danger" />
                                    </button>
                                </div>
                            )}
                            <div className="row align-items-center">
                                {item.image && (
                                    <div className="col-md-4 mb-3 mb-md-0">
                                        <img src={item.image} alt={item.title} className="img-fluid rounded-4 shadow-sm" style={{ maxHeight: '200px', width: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                                <div className={item.image ? 'col-md-8' : 'col-12'}>
                                    <h3 className="fw-bold mb-3">{item.title}</h3>
                                    <p className="text-muted mb-0" style={{ whiteSpace: 'pre-wrap' }}>{item.content}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

export default About
