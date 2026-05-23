import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Edit3, Save, Mail, User, ShieldCheck, Image as ImageIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const Support = () => {
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
    const [supportData, setSupportData] = useState([])
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [formData, setFormData] = useState({ role: 'Developer', name: '', contact: '', email: '', image: '' })

    useEffect(() => { fetchSupport() }, [])

    const fetchSupport = async () => {
        try {
            const res = await axios.get('/api/support')
            setSupportData(res.data)
        } catch (err) { console.error(err) }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingId) {
                await axios.put(`/api/support/${editingId}`, formData)
            } else {
                await axios.post('/api/support', formData)
            }
            fetchSupport()
            resetForm()
        } catch (err) { alert('Error saving') }
    }

    const resetForm = () => {
        setFormData({ role: 'Developer', name: '', contact: '', email: '', image: '' })
        setEditingId(null)
        setIsAdding(false)
    }

    const handleEdit = (item) => {
        setFormData(item)
        setEditingId(item._id)
        setIsAdding(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this support entry?')) return
        try {
            await axios.delete(`/api/support/${id}`)
            fetchSupport()
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
                    <h1 className="fw-bold fs-2 mb-1">Help & <span className="gradient-text">Support</span></h1>
                    <p className="text-muted small mb-0">Connect with our admins and developers.</p>
                </div>
                {!isAdding && (
                    <button onClick={() => setIsAdding(true)} className="btn btn-premium px-4 py-2 small">
                        <Plus size={18} /> Add Contact
                    </button>
                )}
            </div>

            {isAdding && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-3 mb-4 shadow-sm border border-secondary border-opacity-10">
                    <h5 className="fw-bold mb-3">{editingId ? 'Edit' : 'New'} Support Contact</h5>
                    <form onSubmit={handleSubmit} className="row g-2">
                        <div className="col-md-4">
                            <label className="small text-muted mb-1">Role</label>
                            <select className="form-input form-control-sm" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                <option>Developer</option>
                                <option>Admin</option>
                                <option>Coordinator</option>
                                <option>Support Staff</option>
                            </select>
                        </div>
                        <div className="col-md-8">
                            <label className="small text-muted mb-1">Full Name</label>
                            <input type="text" className="form-input form-control-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div className="col-md-6">
                            <label className="small text-muted mb-1">Email</label>
                            <input type="email" className="form-input form-control-sm" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="col-md-6">
                            <label className="small text-muted mb-1">Contact Number</label>
                            <input type="text" className="form-input form-control-sm" value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} />
                        </div>
                        <div className="col-12">
                            <label className="small text-muted mb-1">Avatar/Photo</label>
                            <input type="file" accept="image/*" className="form-input form-control-sm" onChange={handleImageUpload} />
                            {formData.image && <small className="text-success mt-1 d-block"><ImageIcon size={12} className="me-1"/>Photo selected</small>}
                        </div>
                        <div className="col-12 d-flex gap-2 mt-2 pt-2 border-top border-secondary border-opacity-10">
                            <button type="submit" className="btn btn-premium px-4 py-2 small"><Save size={16} className="me-1"/> Save</button>
                            <button type="button" onClick={resetForm} className="btn btn-cancel px-4 py-2 small">Cancel</button>
                        </div>
                    </form>
                </motion.div>
            )}

            <div className="row g-4">
                {supportData.map((item) => (
                    <div key={item._id} className="col-md-6 col-lg-4">
                        <div className="glass-card p-4 h-100 text-center position-relative">
                            <div className="position-absolute top-0 end-0 m-3 d-flex gap-2">
                                <button onClick={() => handleEdit(item)} className="btn btn-sm btn-white bg-opacity-100 border-0 shadow-sm rounded-circle p-2">
                                    <Edit3 size={14} className="text-primary" />
                                </button>
                                <button onClick={() => handleDelete(item._id)} className="btn btn-sm btn-white bg-opacity-100 border-0 shadow-sm rounded-circle p-2">
                                    <Trash2 size={14} className="text-danger" />
                                </button>
                            </div>
                            <div className="mb-4 d-inline-block">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="rounded-circle shadow-sm" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
                                ) : (
                                    <div className="rounded-circle bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '100px', height: '100px' }}>
                                        <User size={50} className="text-muted" />
                                    </div>
                                )}
                            </div>
                            <h4 className="fw-bold mb-1">{item.name}</h4>
                            <div className="badge bg-primary bg-opacity-10 text-primary mb-3 px-3 py-2">
                                <ShieldCheck size={14} className="me-1" /> {item.role}
                            </div>
                            <div className="d-flex flex-column gap-2 text-muted small">
                                {item.email && <div className="d-flex align-items-center justify-content-center gap-2"><Mail size={14} /> {item.email}</div>}
                                {item.contact && <div className="d-flex align-items-center justify-content-center gap-2">📱 {item.contact}</div>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Support
