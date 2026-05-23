import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Download, Upload, Moon, Sun, Palette, Save, Key, User, Shield, Trash2, Edit3, Plus, Building, UserCircle, LogOut } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const Settings = () => {
    const { isDarkMode, toggleDarkMode } = useTheme()
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [status, setStatus] = useState('')
    const [users, setUsers] = useState([])
    const [isUserModalOpen, setIsUserModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'user' })

    const [entities, setEntities] = useState([])
    const [isEntityModalOpen, setIsEntityModalOpen] = useState(false)
    const [editingEntity, setEditingEntity] = useState(null)
    const [entityForm, setEntityForm] = useState({ name: '', securityKey: '' })

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        if (user?.role === 'admin') {
            fetchUsers()
            fetchEntities()
        } else if (user?.role === 'user') {
            fetchUserProfile()
        }
    }

    const fetchUserProfile = async () => {
        try {
            const res = await axios.get('/api/credentials/profile')
            setUsers([res.data]) // Just show the current user's credential
        } catch (err) {
            console.error('Error fetching user profile:', err)
        }
    }

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/credentials')
            setUsers(Array.isArray(res.data) ? res.data : [])
        } catch (err) {
            console.error('Error fetching users:', err)
        }
    }

    const fetchEntities = async () => {
        try {
            const res = await axios.get('/api/entity/manage')
            setEntities(Array.isArray(res.data) ? res.data : [])
        } catch (err) {
            console.error('Error fetching entities:', err)
        }
    }

    const handleUserSubmit = async (e) => {
        e.preventDefault()
        try {
            if (user.role === 'user') {
                // Regular user updating their own profile
                const res = await axios.put('/api/credentials/profile', userForm)
                setStatus('Profile updated successfully!')
                // Optionally update the context name if it changed
                setTimeout(() => window.location.reload(), 1500)
            } else {
                // Admin managing credentials
                if (editingUser) {
                    await axios.put(`/api/credentials/${editingUser._id}`, userForm)
                } else {
                    await axios.post('/api/credentials', userForm)
                }
                fetchUsers()
                setStatus('Credentials updated successfully!')
            }
            setIsUserModalOpen(false)
            setEditingUser(null)
        } catch (err) {
            setStatus('Error updating credentials')
        }
    }

    const deleteUser = async (id) => {
        if (window.confirm('Delete this user?')) {
            try {
                await axios.delete(`/api/credentials/${id}`)
                fetchUsers()
                setStatus('User deleted')
            } catch (err) {
                setStatus('Error deleting user')
            }
        }
    }

    const handleEntitySubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingEntity) {
                await axios.put(`/api/entity/${editingEntity._id}`, entityForm)
            } else {
                await axios.post('/api/entity/register', entityForm)
            }
            fetchEntities()
            setIsEntityModalOpen(false)
            setEditingEntity(null)
            setStatus('Entity updated successfully!')
        } catch (err) {
            setStatus('Error updating entity')
        }
    }

    const deleteEntity = async (id) => {
        if (window.confirm('Delete this entity?')) {
            try {
                await axios.delete(`/api/entity/${id}`)
                fetchEntities()
                setStatus('Entity deleted')
            } catch (err) {
                setStatus('Error deleting entity')
            }
        }
    }



    return (
        <div className="container pt-3 pb-4 mt-2">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-3">
                <h1 className="fw-bold fs-2 mb-1 d-flex align-items-center gap-2">
                    <SettingsIcon size={32} className="text-primary" /> Settings
                </h1>
                <p className="text-muted small mb-0">Customize your account, security, and appearance preferences.</p>
            </motion.div>

            <div className="row g-4">
                {/* Theme Settings */}
                <div className="col-lg-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-2 h-100 shadow-sm border-opacity-10 d-flex flex-column">
                        <h6 className="fw-bold mb-2 d-flex align-items-center gap-2 small px-1">
                            <Palette size={16} className="text-primary" /> Appearance
                        </h6>
                        <div className="flex-grow-1 d-flex flex-column justify-content-center px-1">
                            <div className="py-1 d-flex align-items-center justify-content-between">
                                <div>
                                    <h6 className="mb-0 fw-bold tiny">Dark Theme</h6>
                                    <p className="text-muted extra-tiny mb-0">Toggle between Light and Dark interface.</p>
                                </div>
                                <div className="form-check form-switch">
                                    <input className="form-check-input" type="checkbox" checked={isDarkMode} onChange={toggleDarkMode} style={{ cursor: 'pointer', transform: 'scale(0.8)' }} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Credentials Management */}
                <div className="col-12">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-2 shadow-sm border-opacity-10 d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom border-secondary border-opacity-10 px-1">
                            <h6 className="fw-bold mb-0 d-flex align-items-center gap-2 small">
                                <Shield size={16} className="text-primary" /> Credential Management
                            </h6>
                            {user?.role === 'admin' && (
                                <button onClick={() => { setEditingUser(null); setUserForm({ name: '', email: '', password: '', role: 'user' }); setIsUserModalOpen(true); }} className="btn btn-premium btn-sm px-2 py-1 rounded-pill fw-bold extra-tiny">
                                    <Plus size={12} className="me-1" /> NEW USER
                                </button>
                            )}
                        </div>

                        <div className="table-responsive px-1">
                            <table className="table table-hover align-middle mb-0">
                                <thead>
                                    <tr className="text-muted extra-tiny uppercase ls-1">
                                        <th className="py-1 border-0 bg-transparent">IDENTIFIER</th>
                                        <th className="py-1 border-0 bg-transparent">ROLE</th>
                                        <th className="py-1 border-0 bg-transparent text-end">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u._id} className="border-bottom border-secondary border-opacity-5">
                                            <td className="py-2 border-0 bg-transparent">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className={`p-1.5 rounded-circle ${u.role === 'admin' ? 'bg-primary text-white' : 'bg-secondary bg-opacity-20 text-muted'}`}>
                                                        {u.role === 'admin' ? <Shield size={14} /> : <User size={14} />}
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold tiny">{u.name}</div>
                                                        <div className="text-muted extra-tiny">{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2 border-0 bg-transparent">
                                                <span className={`badge rounded-pill ${u.role === 'admin' ? 'bg-primary text-white shadow-sm' : 'bg-secondary bg-opacity-30 text-main'} uppercase extra-tiny fw-bold px-2 py-1`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="py-2 border-0 bg-transparent text-end">
                                                <button onClick={() => { setEditingUser(u); setUserForm({ ...u, password: '' }); setIsUserModalOpen(true); }} className="btn btn-sm btn-outline-primary border-0 p-1 me-1"><Edit3 size={14} /></button>
                                                {user?.role === 'admin' && user.id !== u._id && (
                                                    <button onClick={() => deleteUser(u._id)} className="btn btn-sm btn-outline-danger border-0 p-1"><Trash2 size={14} /></button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>

                {/* Entity Management (Admin only) */}
                {user?.role === 'admin' && (
                    <div className="col-12">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-2 shadow-sm border-opacity-10 d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom border-secondary border-opacity-10 px-1">
                                <h6 className="fw-bold mb-0 d-flex align-items-center gap-2 small">
                                    <Building size={16} className="text-secondary" /> Entity Management
                                </h6>
                                <button onClick={() => { setEditingEntity(null); setEntityForm({ name: '', securityKey: '' }); setIsEntityModalOpen(true); }} className="btn btn-premium btn-sm px-2 py-1 rounded-pill fw-bold extra-tiny">
                                    <Plus size={12} className="me-1" /> NEW ENTITY
                                </button>
                            </div>
                            <div className="table-responsive px-1">
                                <table className="table table-hover align-middle mb-0">
                                    <thead>
                                        <tr className="text-muted extra-tiny uppercase ls-1">
                                            <th className="py-1 border-0 bg-transparent">ENTITY NAME</th>
                                            <th className="py-1 border-0 bg-transparent">SECURITY KEY</th>
                                            <th className="py-1 border-0 bg-transparent">CREATED ON</th>
                                            <th className="py-1 border-0 bg-transparent text-end">ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {entities.map(c => (
                                            <tr key={c._id} className="border-bottom border-secondary border-opacity-5">
                                                <td className="py-2 border-0 bg-transparent tiny fw-bold">{c.name}</td>
                                                <td className="py-2 border-0 bg-transparent text-muted"><code className="bg-secondary bg-opacity-10 px-1.5 py-0.5 rounded extra-tiny">{c.securityKey}</code></td>
                                                <td className="py-2 border-0 bg-transparent text-muted extra-tiny">{new Date(c.createdAt).toLocaleDateString()}</td>
                                                <td className="py-2 border-0 bg-transparent text-end">
                                                    <button onClick={() => { setEditingEntity(c); setEntityForm({ name: c.name, securityKey: c.securityKey }); setIsEntityModalOpen(true); }} className="btn btn-sm btn-outline-primary border-0 p-1 me-1"><Edit3 size={14} /></button>
                                                    <button onClick={() => deleteEntity(c._id)} className="btn btn-sm btn-outline-danger border-0 p-1"><Trash2 size={14} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    </div>
                )}


            </div>

            {/* Modals same as before but updated context */}
            {isEntityModalOpen && (
                <div className="modal-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center z-3" style={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)' }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-4 w-100 mx-3 shadow-2xl border-opacity-20" style={{ maxWidth: '400px' }}>
                        <h4 className="fw-bold mb-4">{editingEntity ? 'Update' : 'Register'} Entity</h4>
                        <form onSubmit={handleEntitySubmit}>
                            <div className="mb-3">
                                <label className="text-muted tiny fw-bold uppercase ls-1 mb-2">Entity Name</label>
                                <input type="text" className="form-input" value={entityForm.name} onChange={e => setEntityForm({ ...entityForm, name: e.target.value })} required />
                            </div>
                            <div className="mb-4">
                                <label className="text-muted tiny fw-bold uppercase ls-1 mb-2">Security Key</label>
                                <input type="text" className="form-input" value={entityForm.securityKey} onChange={e => setEntityForm({ ...entityForm, securityKey: e.target.value })} required />
                            </div>
                            <div className="d-flex gap-2">
                                <button type="submit" className="btn btn-premium flex-grow-1 py-2 fw-bold">SAVE</button>
                                <button type="button" onClick={() => setIsEntityModalOpen(false)} className="btn btn-cancel px-4 py-2">CANCEL</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {isUserModalOpen && (
                <div className="modal-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center z-3" style={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)' }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-4 w-100 mx-3 shadow-2xl border-opacity-20" style={{ maxWidth: '400px' }}>
                        <h4 className="fw-bold mb-4">{editingUser ? 'Update Profile' : 'New User Account'}</h4>
                        <form onSubmit={handleUserSubmit}>
                            <div className="mb-3">
                                <label className="text-muted tiny fw-bold uppercase ls-1 mb-2">Full Display Name</label>
                                <input type="text" className="form-input" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} required />
                            </div>
                            <div className="mb-3">
                                <label className="text-muted tiny fw-bold uppercase ls-1 mb-2">Auth Email / Identity</label>
                                <input type="email" className="form-input" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required />
                            </div>
                            <div className="mb-3">
                                <label className="text-muted tiny fw-bold uppercase ls-1 mb-2">{editingUser ? 'Update Password (optional)' : 'Account Password'}</label>
                                <input type="password" className="form-input" placeholder={editingUser ? "••••••••" : ""} value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required={!editingUser} />
                            </div>
                            {user?.role === 'admin' && (
                                <div className="mb-4">
                                    <label className="text-muted tiny fw-bold uppercase ls-1 mb-2">Access Authority</label>
                                    <select className="form-input" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                                        <option value="user">User - Restricted Access</option>
                                        <option value="admin">Admin - Full Control</option>
                                    </select>
                                </div>
                            )}
                            <div className="d-flex gap-2">
                                <button type="submit" className="btn btn-premium flex-grow-1 py-2 fw-bold">UPDATE ACCOUNT</button>
                                <button type="button" onClick={() => setIsUserModalOpen(false)} className="btn btn-cancel px-4 py-2">CANCEL</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    )
}

export default Settings
