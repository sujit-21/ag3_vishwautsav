import { useState, useEffect } from 'react'
import './Settings.css'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Settings as SettingsIcon, Shield, ShieldCheck, User, Trash2, Edit3, Plus, 
    Building2, Mail, Phone, Lock, Calendar, Key, Copy, Check, Eye, EyeOff, 
    AlertCircle, Sparkles, X, ChevronRight 
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'

const Settings = () => {
    const { user } = useAuth()
    const [status, setStatus] = useState('')
    const [statusType, setStatusType] = useState('success') // 'success' | 'danger'
    const [users, setUsers] = useState([])
    const [isUserModalOpen, setIsUserModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', password: '', role: 'user' })

    const [entities, setEntities] = useState([])
    const [isEntityModalOpen, setIsEntityModalOpen] = useState(false)
    const [editingEntity, setEditingEntity] = useState(null)
    const [entityForm, setEntityForm] = useState({ name: '', securityKey: '' })

    // Security key reveal states
    const [revealedKeys, setRevealedKeys] = useState({})
    const [copiedKeyId, setCopiedKeyId] = useState(null)

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
            setUsers([res.data])
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

    // Helper: Safely separate email and phone for users where phone was stored in email field
    const parseUserContact = (u) => {
        const hasAt = u.email && u.email.includes('@');
        const email = hasAt ? u.email : '';
        const phone = u.phone || (!hasAt ? u.email : '');
        return { email, phone };
    }

    const handleOpenUserModal = (u = null) => {
        if (u) {
            setEditingUser(u)
            const { email, phone } = parseUserContact(u)
            setUserForm({
                name: u.name || '',
                email: email,
                phone: phone,
                password: '',
                role: u.role || 'user'
            })
        } else {
            setEditingUser(null)
            setUserForm({ name: '', email: '', phone: '', password: '', role: 'user' })
        }
        setIsUserModalOpen(true)
    }

    const handleUserSubmit = async (e) => {
        e.preventDefault()
        setStatus('')
        try {
            // If email is empty but phone is provided, use phone as identity fallback for backward compatibility
            const payload = {
                name: userForm.name,
                email: userForm.email || userForm.phone,
                phone: userForm.phone,
                password: userForm.password,
                role: userForm.role
            }

            if (user.role === 'user') {
                await axios.put('/api/credentials/profile', payload)
                setStatus('Profile updated successfully!')
                setStatusType('success')
                setTimeout(() => window.location.reload(), 1200)
            } else {
                if (editingUser) {
                    await axios.put(`/api/credentials/${editingUser._id}`, payload)
                } else {
                    await axios.post('/api/credentials', payload)
                }
                fetchUsers()
                setStatus('User credentials updated successfully!')
                setStatusType('success')
            }
            setIsUserModalOpen(false)
            setEditingUser(null)
            setTimeout(() => setStatus(''), 4000)
        } catch (err) {
            setStatus(err.response?.data?.message || 'Error updating credentials')
            setStatusType('danger')
            setTimeout(() => setStatus(''), 4000)
        }
    }

    const deleteUser = async (id, name) => {
        if (window.confirm(`Permanently remove credentials for "${name}"?`)) {
            try {
                await axios.delete(`/api/credentials/${id}`)
                fetchUsers()
                setStatus(`User "${name}" deleted`)
                setStatusType('success')
                setTimeout(() => setStatus(''), 4000)
            } catch (err) {
                setStatus('Error deleting user')
                setStatusType('danger')
            }
        }
    }

    const handleEntitySubmit = async (e) => {
        e.preventDefault()
        setStatus('')
        try {
            if (editingEntity) {
                await axios.put(`/api/entity/${editingEntity._id}`, entityForm)
            } else {
                await axios.post('/api/entity/register', entityForm)
            }
            fetchEntities()
            setIsEntityModalOpen(false)
            setEditingEntity(null)
            setStatus('Entity configurations updated successfully!')
            setStatusType('success')
            setTimeout(() => setStatus(''), 4000)
        } catch (err) {
            setStatus(err.response?.data?.message || 'Error updating entity')
            setStatusType('danger')
        }
    }

    const deleteEntity = async (id, name) => {
        if (window.confirm(`Permanently remove entity "${name}"?`)) {
            try {
                await axios.delete(`/api/entity/${id}`)
                fetchEntities()
                setStatus(`Entity "${name}" deleted`)
                setStatusType('success')
                setTimeout(() => setStatus(''), 4000)
            } catch (err) {
                setStatus('Error deleting entity')
                setStatusType('danger')
            }
        }
    }

    const toggleRevealKey = (id) => {
        setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text)
        setCopiedKeyId(id)
        setTimeout(() => setCopiedKeyId(null), 2000)
    }

    return (
        <div className="container py-4 my-2">
            <Helmet>
                <title>Account Settings — Vishwa Utsav</title>
                <meta name="description" content="Manage your Vishwa Utsav account settings, security preferences, and profile credentials." />
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            {/* Top Header Banner */}
            <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="settings-header-banner">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1.5">
                        <div className="settings-header-badge">
                            <Sparkles size={12} /> Security &amp; Access Controls
                        </div>
                    </div>
                    <h1 className="fw-extrabold text-main mb-1" style={{ letterSpacing: '-0.02em', fontSize: '1.85rem' }}>
                        Platform <span className="gradient-text">Settings</span>
                    </h1>
                    <p className="text-muted small mb-0">
                        Customize authorized administrator credentials, authentication emails, access tiers, and entity configurations.
                    </p>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <span className="badge rounded-pill px-3 py-1.5 fw-bold extra-tiny d-flex align-items-center gap-1.5" style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                        <span className="rounded-circle d-inline-block" style={{ width: '6px', height: '6px', backgroundColor: '#10b981' }}></span>
                        {user?.role === 'admin' ? 'ADMINISTRATOR CONSOLE' : 'OPERATOR PROFILE'}
                    </span>
                </div>
            </motion.div>

            {/* Notification Alert */}
            <AnimatePresence>
                {status && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-3 rounded-4 mb-4 fw-bold extra-tiny text-center border shadow-xs d-flex align-items-center justify-content-center gap-2 ${
                            statusType === 'success' 
                                ? 'bg-success bg-opacity-10 text-success border-success border-opacity-25' 
                                : 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-25'
                        }`}
                    >
                        {statusType === 'success' ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
                        <span>{status}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="row g-4">
                {/* ─── 1. Credential Management Card ─── */}
                <div className="col-12">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="settings-luxury-card">
                        <div className="settings-card-header">
                            <div className="d-flex align-items-center gap-3">
                                <div className="settings-emblem-box credentials">
                                    <Shield size={22} />
                                </div>
                                <div>
                                    <h5 className="fw-extrabold text-main mb-0" style={{ letterSpacing: '-0.01em', fontSize: '1.1rem' }}>
                                        Credential &amp; Access Management
                                    </h5>
                                    <p className="extra-tiny text-muted mb-0">Authorized administrators and operating members</p>
                                </div>
                            </div>

                            {user?.role === 'admin' && (
                                <button onClick={() => handleOpenUserModal(null)} className="btn-luxury-action">
                                    <Plus size={15} /> <span>NEW USER</span>
                                </button>
                            )}
                        </div>

                        <div className="settings-table-container">
                            <div className="d-flex d-md-none align-items-center gap-1 extra-tiny text-muted px-2 pb-2">
                                <ChevronRight size={13} className="text-primary flex-shrink-0" />
                                <span>Swipe horizontally to view all columns &amp; actions</span>
                            </div>
                            <div className="table-responsive">
                                <table className="settings-table">
                                    <thead>
                                        <tr>
                                            <th style={{ minWidth: '220px' }}>User Profile</th>
                                            <th style={{ minWidth: '240px' }}>Email Address</th>
                                            <th style={{ minWidth: '160px' }}>Phone / Contact</th>
                                            <th style={{ minWidth: '130px' }}>Access Role</th>
                                            <th className="text-end" style={{ minWidth: '100px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.length > 0 ? users.map(u => {
                                            const { email, phone } = parseUserContact(u)
                                            const initial = (u.name || 'U').charAt(0).toUpperCase()
                                            const isAdmin = u.role === 'admin' || u.role === 'superadmin'

                                            return (
                                                <tr key={u._id}>
                                                    {/* User Profile */}
                                                    <td>
                                                        <div className="d-flex align-items-center" style={{ gap: '14px' }}>
                                                            <div className={`settings-avatar-circle ${isAdmin ? 'admin' : ''}`}>
                                                                {initial}
                                                            </div>
                                                            <div style={{ minWidth: 0 }}>
                                                                <div className="fw-extrabold text-main text-nowrap" style={{ fontSize: '0.94rem', lineHeight: 1.25 }}>
                                                                    {u.name}
                                                                </div>
                                                                {u.entityName && (
                                                                    <span className="extra-tiny text-muted fw-semibold d-flex align-items-center gap-1 text-nowrap" style={{ marginTop: '3px' }}>
                                                                        <Building2 size={11} className="flex-shrink-0" /> {u.entityName}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Dedicated Email Section */}
                                                    <td>
                                                        {email ? (
                                                            <div className="settings-email-pill">
                                                                <Mail size={13} className="text-primary flex-shrink-0" />
                                                                <span>{email}</span>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleOpenUserModal(u)}
                                                                className="badge-email-empty border-0"
                                                                title="Click to link an official email address"
                                                            >
                                                                <AlertCircle size={12} />
                                                                <span>No Email Linked • Add Email</span>
                                                            </button>
                                                        )}
                                                    </td>

                                                    {/* Phone / Contact */}
                                                    <td>
                                                        {phone ? (
                                                            <div className="settings-phone-pill">
                                                                <Phone size={13} className="text-success flex-shrink-0" />
                                                                <span>{phone}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted extra-tiny font-monospace">—</span>
                                                        )}
                                                    </td>

                                                    {/* Access Role */}
                                                    <td>
                                                        <span className={isAdmin ? 'badge-role-admin' : 'badge-role-user'}>
                                                            {isAdmin ? <Shield size={11} /> : <User size={11} />}
                                                            <span>{u.role || 'User'}</span>
                                                        </span>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="text-end">
                                                        <button 
                                                            onClick={() => handleOpenUserModal(u)} 
                                                            className="settings-action-btn edit" 
                                                            title="Edit Credentials"
                                                        >
                                                            <Edit3 size={15} />
                                                        </button>
                                                        {user?.role === 'admin' && user.id !== u._id && (
                                                            <button 
                                                                onClick={() => deleteUser(u._id, u.name)} 
                                                                className="settings-action-btn delete" 
                                                                title="Delete User"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        }) : (
                                            <tr>
                                                <td colSpan="5" className="text-center py-4 text-muted extra-tiny">
                                                    No credential records located.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ─── 2. Entity Management Card (Admin Only) ─── */}
                {user?.role === 'admin' && (
                    <div className="col-12">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="settings-luxury-card">
                            <div className="settings-card-header">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="settings-emblem-box entities">
                                        <Building2 size={22} />
                                    </div>
                                    <div>
                                        <h5 className="fw-extrabold text-main mb-0" style={{ letterSpacing: '-0.01em', fontSize: '1.1rem' }}>
                                            Entity &amp; Organization Management
                                        </h5>
                                        <p className="extra-tiny text-muted mb-0">Operating festival and event nodes configured in the system</p>
                                    </div>
                                </div>

                                <button onClick={() => { setEditingEntity(null); setEntityForm({ name: '', securityKey: '' }); setIsEntityModalOpen(true); }} className="btn-luxury-action">
                                    <Plus size={15} /> <span>NEW ENTITY</span>
                                </button>
                            </div>

                            <div className="settings-table-container">
                                <div className="d-flex d-md-none align-items-center gap-1 extra-tiny text-muted px-2 pb-2">
                                    <ChevronRight size={13} className="text-primary flex-shrink-0" />
                                    <span>Swipe horizontally to view all columns &amp; actions</span>
                                </div>
                                <div className="table-responsive">
                                    <table className="settings-table entity-table">
                                        <thead>
                                            <tr>
                                                <th style={{ minWidth: '200px' }}>Entity Name</th>
                                                <th style={{ minWidth: '240px' }}>Security Key</th>
                                                <th style={{ minWidth: '140px' }}>Created On</th>
                                                <th className="text-end" style={{ minWidth: '100px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {entities.length > 0 ? entities.map(c => {
                                                const isRevealed = revealedKeys[c._id]
                                                const isCopied = copiedKeyId === c._id

                                                return (
                                                    <tr key={c._id}>
                                                        {/* Entity Name */}
                                                        <td>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
                                                                    <Building2 size={16} />
                                                                </div>
                                                                <div>
                                                                    <span className="fw-extrabold text-main" style={{ fontSize: '0.94rem' }}>{c.name}</span>
                                                                    <div className="extra-tiny text-muted fw-semibold">Active Operating Node</div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Security Key */}
                                                        <td>
                                                            <div className="d-inline-flex align-items-center gap-1.5 p-1 px-2.5 rounded-3 border" style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)' }}>
                                                                <Key size={13} className="text-primary flex-shrink-0" />
                                                                <span className="font-monospace fw-bold extra-tiny" style={{ letterSpacing: '1px' }}>
                                                                    {isRevealed ? c.securityKey : '••••••••••••••••'}
                                                                </span>
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => toggleRevealKey(c._id)}
                                                                    className="btn btn-sm btn-link p-0 text-muted hover-text-main ms-1"
                                                                    title={isRevealed ? "Hide Key" : "Reveal Key"}
                                                                >
                                                                    {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => copyToClipboard(c.securityKey, c._id)}
                                                                    className="btn btn-sm btn-link p-0 text-muted hover-text-main"
                                                                    title="Copy to Clipboard"
                                                                >
                                                                    {isCopied ? <Check size={14} className="text-success" /> : <Copy size={13} />}
                                                                </button>
                                                            </div>
                                                        </td>

                                                        {/* Created On */}
                                                        <td>
                                                            <span className="extra-tiny text-muted fw-semibold d-inline-flex align-items-center gap-1.5">
                                                                <Calendar size={13} className="text-primary" />
                                                                <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                                                            </span>
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="text-end">
                                                            <button 
                                                                onClick={() => { setEditingEntity(c); setEntityForm({ name: c.name, securityKey: c.securityKey }); setIsEntityModalOpen(true); }} 
                                                                className="settings-action-btn edit" 
                                                                title="Edit Entity"
                                                            >
                                                                <Edit3 size={15} />
                                                            </button>
                                                            <button 
                                                                onClick={() => deleteEntity(c._id, c.name)} 
                                                                className="settings-action-btn delete" 
                                                                title="Delete Entity"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            }) : (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-4 text-muted extra-tiny">
                                                        No operating entities found. Click "+ New Entity" to register one.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>

            {/* ─── Modern User Credential Modal ─── */}
            <AnimatePresence>
                {isUserModalOpen && (
                    <div className="modal-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', zIndex: 99999 }}>
                        <motion.div initial={{ scale: 0.94, opacity: 0, y: 15 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0, y: 15 }} className="settings-modal-card">
                            <div className="settings-modal-header">
                                <div className="d-flex align-items-center gap-2.5">
                                    <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h5 className="fw-extrabold text-main mb-0" style={{ letterSpacing: '-0.01em', fontSize: '1.1rem' }}>
                                            {editingUser ? 'Edit User Credentials' : 'Create New User Account'}
                                        </h5>
                                        <p className="extra-tiny text-muted mb-0">Platform access and contact identity configuration</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setIsUserModalOpen(false)} className="btn btn-close p-2 hover-rotate" aria-label="Close"></button>
                            </div>

                            <form onSubmit={handleUserSubmit} className="p-4">
                                {/* Name Field */}
                                <div className="settings-input-group">
                                    <label className="settings-input-label">
                                        <User size={13} className="text-primary" /> Full Display Name
                                    </label>
                                    <div className="settings-field-wrapper">
                                        <span className="settings-field-icon"><User size={16} /></span>
                                        <input 
                                            type="text" 
                                            className="settings-text-input" 
                                            placeholder="e.g. Sujit Kumar" 
                                            value={userForm.name} 
                                            onChange={e => setUserForm({ ...userForm, name: e.target.value })} 
                                            required 
                                        />
                                    </div>
                                </div>

                                {/* Dedicated Email Field */}
                                <div className="settings-input-group">
                                    <label className="settings-input-label">
                                        <Mail size={13} className="text-primary" /> Official Email Address
                                    </label>
                                    <div className="settings-field-wrapper">
                                        <span className="settings-field-icon"><Mail size={16} /></span>
                                        <input 
                                            type="email" 
                                            className="settings-text-input" 
                                            placeholder="e.g. sujit@example.com" 
                                            value={userForm.email} 
                                            onChange={e => setUserForm({ ...userForm, email: e.target.value })} 
                                        />
                                    </div>
                                    <small className="extra-tiny text-muted mt-1 d-block">Used for OTP verification codes and security notifications.</small>
                                </div>

                                {/* Dedicated Phone Field */}
                                <div className="settings-input-group">
                                    <label className="settings-input-label">
                                        <Phone size={13} className="text-success" /> Phone / Mobile Number
                                    </label>
                                    <div className="settings-field-wrapper">
                                        <span className="settings-field-icon"><Phone size={16} /></span>
                                        <input 
                                            type="text" 
                                            className="settings-text-input" 
                                            placeholder="e.g. +91 8013705451" 
                                            value={userForm.phone} 
                                            onChange={e => setUserForm({ ...userForm, phone: e.target.value })} 
                                        />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div className="settings-input-group">
                                    <label className="settings-input-label">
                                        <Lock size={13} className="text-warning" /> {editingUser ? 'Update Password (Leave empty to keep current)' : 'Account Password'}
                                    </label>
                                    <div className="settings-field-wrapper">
                                        <span className="settings-field-icon"><Lock size={16} /></span>
                                        <input 
                                            type="password" 
                                            className="settings-text-input" 
                                            placeholder={editingUser ? "••••••••" : "Minimum 6 characters"} 
                                            value={userForm.password} 
                                            onChange={e => setUserForm({ ...userForm, password: e.target.value })} 
                                            required={!editingUser} 
                                        />
                                    </div>
                                </div>

                                {/* Role Field (Admin only) */}
                                {user?.role === 'admin' && (
                                    <div className="settings-input-group mb-4">
                                        <label className="settings-input-label">
                                            <Shield size={13} className="text-primary" /> Access Authority Level
                                        </label>
                                        <div className="settings-field-wrapper">
                                            <span className="settings-field-icon"><Shield size={16} /></span>
                                            <select 
                                                className="settings-text-input" 
                                                value={userForm.role} 
                                                onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <option value="user">User - Operator Restricted Access</option>
                                                <option value="admin">Admin - Full System Control</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className="d-flex gap-2.5 pt-2">
                                    <button type="submit" className="btn-luxury-action flex-grow-1 justify-content-center py-2.5">
                                        <span>{editingUser ? 'SAVE CREDENTIALS' : 'CREATE USER'}</span>
                                        <ChevronRight size={16} />
                                    </button>
                                    <button type="button" onClick={() => setIsUserModalOpen(false)} className="btn btn-light border px-4 py-2.5 rounded-3 fw-bold extra-tiny">
                                        CANCEL
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ─── Modern Entity Modal ─── */}
            <AnimatePresence>
                {isEntityModalOpen && (
                    <div className="modal-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', zIndex: 99999 }}>
                        <motion.div initial={{ scale: 0.94, opacity: 0, y: 15 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0, y: 15 }} className="settings-modal-card">
                            <div className="settings-modal-header">
                                <div className="d-flex align-items-center gap-2.5">
                                    <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <h5 className="fw-extrabold text-main mb-0" style={{ letterSpacing: '-0.01em', fontSize: '1.1rem' }}>
                                            {editingEntity ? 'Update Operating Entity' : 'Register New Operating Entity'}
                                        </h5>
                                        <p className="extra-tiny text-muted mb-0">Entity naming and organizational security key</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setIsEntityModalOpen(false)} className="btn btn-close p-2 hover-rotate" aria-label="Close"></button>
                            </div>

                            <form onSubmit={handleEntitySubmit} className="p-4">
                                <div className="settings-input-group">
                                    <label className="settings-input-label">
                                        <Building2 size={13} className="text-primary" /> Entity Name
                                    </label>
                                    <div className="settings-field-wrapper">
                                        <span className="settings-field-icon"><Building2 size={16} /></span>
                                        <input 
                                            type="text" 
                                            className="settings-text-input" 
                                            placeholder="e.g. sakaripara" 
                                            value={entityForm.name} 
                                            onChange={e => setEntityForm({ ...entityForm, name: e.target.value })} 
                                            required 
                                        />
                                    </div>
                                </div>

                                <div className="settings-input-group mb-4">
                                    <label className="settings-input-label">
                                        <Key size={13} className="text-warning" /> Security Authorization Key
                                    </label>
                                    <div className="settings-field-wrapper">
                                        <span className="settings-field-icon"><Key size={16} /></span>
                                        <input 
                                            type="text" 
                                            className="settings-text-input font-monospace" 
                                            placeholder="e.g. sakaripara20252026" 
                                            value={entityForm.securityKey} 
                                            onChange={e => setEntityForm({ ...entityForm, securityKey: e.target.value })} 
                                            required 
                                        />
                                    </div>
                                </div>

                                <div className="d-flex gap-2.5 pt-2">
                                    <button type="submit" className="btn-luxury-action flex-grow-1 justify-content-center py-2.5">
                                        <span>{editingEntity ? 'UPDATE ENTITY' : 'REGISTER ENTITY'}</span>
                                        <ChevronRight size={16} />
                                    </button>
                                    <button type="button" onClick={() => setIsEntityModalOpen(false)} className="btn btn-light border px-4 py-2.5 rounded-3 fw-bold extra-tiny">
                                        CANCEL
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default Settings
