import { useState, useEffect } from 'react'
import './Settings.css'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Settings as SettingsIcon, Shield, ShieldCheck, User, Trash2, Edit3, Plus, 
    Building2, Mail, Phone, Lock, Calendar, Key, Copy, Check, Eye, EyeOff, 
    AlertCircle, Sparkles, X, ChevronRight, Camera, UploadCloud, Image as ImageIcon,
    Maximize2
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'

const Settings = () => {
    const { user, verifiedEntity, setVerifiedEntity } = useAuth()
    const [status, setStatus] = useState('')
    const [statusType, setStatusType] = useState('success') // 'success' | 'danger'
    const [users, setUsers] = useState([])
    const [isUserModalOpen, setIsUserModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', password: '', role: 'user' })

    const [entities, setEntities] = useState([])
    const [isEntityModalOpen, setIsEntityModalOpen] = useState(false)
    const [editingEntity, setEditingEntity] = useState(null)
    const [entityForm, setEntityForm] = useState({ 
        name: '', 
        securityKey: '', 
        profilePicture: '', 
        profileShape: 'rounded' 
    })
    const [uploadingImage, setUploadingImage] = useState(false)
    const [previewImageModal, setPreviewImageModal] = useState(null)

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

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            alert('File size exceeds 5MB. Please choose a smaller image.')
            return
        }

        setUploadingImage(true)
        const reader = new FileReader()
        reader.onload = async () => {
            const base64Data = reader.result
            try {
                const formData = new FormData()
                formData.append('image', file)
                const uploadRes = await axios.post('/api/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                if (uploadRes.data?.imageUrl) {
                    setEntityForm(prev => ({ ...prev, profilePicture: uploadRes.data.imageUrl }))
                } else {
                    setEntityForm(prev => ({ ...prev, profilePicture: base64Data }))
                }
            } catch (err) {
                // Seamless fallback to base64 data URL
                setEntityForm(prev => ({ ...prev, profilePicture: base64Data }))
            } finally {
                setUploadingImage(false)
            }
        }
        reader.readAsDataURL(file)
    }

    const handleRemoveImage = () => {
        setEntityForm(prev => ({ ...prev, profilePicture: '' }))
    }

    const handleEntitySubmit = async (e) => {
        e.preventDefault()
        setStatus('')
        try {
            let savedEntity = null
            if (editingEntity) {
                const res = await axios.put(`/api/entity/${editingEntity._id}`, entityForm)
                savedEntity = res.data
            } else {
                const res = await axios.post('/api/entity/register', entityForm)
                savedEntity = res.data?.entity || res.data
            }
            fetchEntities()
            if (verifiedEntity && savedEntity && (verifiedEntity.name === savedEntity.name || verifiedEntity._id === savedEntity._id)) {
                setVerifiedEntity(savedEntity)
            }
            setIsEntityModalOpen(false)
            setEditingEntity(null)
            setStatus('Entity configuration saved successfully!')
            setStatusType('success')
            setTimeout(() => setStatus(''), 4000)
        } catch (err) {
            setStatus(err.response?.data?.message || 'Error updating entity')
            setStatusType('danger')
            setTimeout(() => setStatus(''), 4000)
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
                            {/* Desktop & Tablet Table (Screens >= 768px) */}
                            <div className="table-responsive d-none d-md-block">
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

                            {/* Mobile Cards (Screens < 768px) */}
                            <div className="d-block d-md-none">
                                {users.length > 0 ? users.map(u => {
                                    const { email, phone } = parseUserContact(u)
                                    const initial = (u.name || 'U').charAt(0).toUpperCase()
                                    const isAdmin = u.role === 'admin' || u.role === 'superadmin'

                                    return (
                                        <div key={u._id} className="settings-mobile-card">
                                            {/* Top Row: User Avatar, Name, Entity & Actions */}
                                            <div className="d-flex justify-content-between align-items-start gap-2 mb-2.5">
                                                <div className="d-flex align-items-center gap-2.5" style={{ minWidth: 0, flex: 1 }}>
                                                    <div className={`settings-avatar-circle ${isAdmin ? 'admin' : ''}`}>
                                                        {initial}
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div className="fw-extrabold text-main" style={{ fontSize: '0.94rem', lineHeight: 1.25, wordBreak: 'break-word' }}>
                                                            {u.name}
                                                        </div>
                                                        {u.entityName && (
                                                            <span className="extra-tiny text-muted fw-semibold d-flex align-items-center gap-1 mt-0.5">
                                                                <Building2 size={11} className="flex-shrink-0 text-primary" />
                                                                <span className="text-truncate">{u.entityName}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="d-flex align-items-center gap-1 flex-shrink-0">
                                                    <span className={isAdmin ? 'badge-role-admin' : 'badge-role-user'} style={{ fontSize: '0.66rem', padding: '0.2rem 0.55rem' }}>
                                                        {isAdmin ? <Shield size={10} /> : <User size={10} />}
                                                        <span>{u.role || 'User'}</span>
                                                    </span>
                                                    <button 
                                                        onClick={() => handleOpenUserModal(u)} 
                                                        className="settings-action-btn edit" 
                                                        title="Edit Credentials"
                                                        style={{ width: '28px', height: '28px', margin: 0 }}
                                                    >
                                                        <Edit3 size={13} />
                                                    </button>
                                                    {user?.role === 'admin' && user.id !== u._id && (
                                                        <button 
                                                            onClick={() => deleteUser(u._id, u.name)} 
                                                            className="settings-action-btn delete" 
                                                            title="Delete User"
                                                            style={{ width: '28px', height: '28px', margin: 0 }}
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bottom Details: Email & Phone */}
                                            <div className="d-flex flex-column gap-2 pt-2 border-top border-secondary border-opacity-10">
                                                {email ? (
                                                    <div className="settings-email-pill w-100 justify-content-start" style={{ fontSize: '0.76rem' }}>
                                                        <Mail size={12} className="text-primary flex-shrink-0" />
                                                        <span className="text-truncate">{email}</span>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleOpenUserModal(u)}
                                                        className="badge-email-empty border-0 w-100 justify-content-start"
                                                        title="Click to link an official email address"
                                                        style={{ fontSize: '0.72rem' }}
                                                    >
                                                        <AlertCircle size={12} />
                                                        <span>No Email Linked • Add Email</span>
                                                    </button>
                                                )}

                                                {phone && (
                                                    <div className="settings-phone-pill w-100 justify-content-start" style={{ fontSize: '0.76rem' }}>
                                                        <Phone size={12} className="text-success flex-shrink-0" />
                                                        <span>{phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                }) : (
                                    <div className="text-center py-4 text-muted extra-tiny">
                                        No credential records located.
                                    </div>
                                )}
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

                                <button onClick={() => { setEditingEntity(null); setEntityForm({ name: '', securityKey: '', profilePicture: '', profileShape: 'rounded' }); setIsEntityModalOpen(true); }} className="btn-luxury-action">
                                    <Plus size={15} /> <span>NEW ENTITY</span>
                                </button>
                            </div>

                            <div className="settings-table-container">
                                {/* Desktop & Tablet Table (Screens >= 768px) */}
                                <div className="table-responsive d-none d-md-block">
                                    <table className="settings-table entity-table">
                                        <thead>
                                            <tr>
                                                <th style={{ minWidth: '220px' }}>Entity &amp; Profile Picture</th>
                                                <th style={{ minWidth: '150px' }}>Profile Shape</th>
                                                <th style={{ minWidth: '230px' }}>Security Key</th>
                                                <th style={{ minWidth: '140px' }}>Created On</th>
                                                <th className="text-end" style={{ minWidth: '110px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {entities.length > 0 ? entities.map(c => {
                                                const isRevealed = revealedKeys[c._id]
                                                const isCopied = copiedKeyId === c._id
                                                const shape = c.profileShape || 'rounded'
                                                const hasPhoto = Boolean(c.profilePicture)

                                                return (
                                                    <tr key={c._id}>
                                                        {/* Entity Profile Picture & Name */}
                                                        <td>
                                                            <div className="d-flex align-items-center gap-3">
                                                                <div 
                                                                    className={`entity-avatar-wrapper shape-${shape}`}
                                                                    title={hasPhoto ? "Click to preview full image" : `${c.name} (${shape})`}
                                                                    onClick={() => hasPhoto && setPreviewImageModal({ img: c.profilePicture, name: c.name, shape: shape })}
                                                                >
                                                                    {hasPhoto ? (
                                                                        <img src={c.profilePicture} alt={c.name} className="entity-avatar-img" />
                                                                    ) : (
                                                                        <span className="fw-black text-primary extra-tiny" style={{ letterSpacing: '0.5px' }}>
                                                                            {c.name ? c.name.slice(0, 2).toUpperCase() : 'EN'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="d-flex align-items-center gap-1.5">
                                                                        <span className="fw-extrabold text-main" style={{ fontSize: '0.94rem' }}>{c.name}</span>
                                                                    </div>
                                                                    <div className="extra-tiny text-muted fw-semibold">Active Operating Node</div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Profile Shape Type */}
                                                        <td>
                                                            <div className="d-flex flex-column gap-1">
                                                                <span className={`shape-badge-pill ${shape}`}>
                                                                    {shape === 'rounded' && '⚪ Rounded'}
                                                                    {shape === 'square' && '⬛ Square'}
                                                                    {shape === 'rectangle' && '▬ Rectangle'}
                                                                </span>
                                                                <span className="extra-tiny text-muted" style={{ fontSize: '0.66rem' }}>
                                                                    {hasPhoto ? '✓ Photo Active' : 'Default Icon'}
                                                                </span>
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
                                                                <span>{new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                            </span>
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="text-end">
                                                            <div className="d-inline-flex align-items-center gap-1">
                                                                {hasPhoto && (
                                                                    <button 
                                                                        onClick={() => setPreviewImageModal({ img: c.profilePicture, name: c.name, shape: shape })}
                                                                        className="settings-action-btn"
                                                                        title="Preview Profile Picture"
                                                                        style={{ color: 'var(--palette-terracotta, #ea580c)' }}
                                                                    >
                                                                        <Eye size={15} />
                                                                    </button>
                                                                )}
                                                                <button 
                                                                    onClick={() => { 
                                                                        setEditingEntity(c); 
                                                                        setEntityForm({ 
                                                                            name: c.name, 
                                                                            securityKey: c.securityKey,
                                                                            profilePicture: c.profilePicture || '',
                                                                            profileShape: c.profileShape || 'rounded'
                                                                        }); 
                                                                        setIsEntityModalOpen(true); 
                                                                    }} 
                                                                    className="settings-action-btn edit" 
                                                                    title="Edit Entity & Profile Picture"
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
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            }) : (
                                                <tr>
                                                    <td colSpan="5" className="text-center py-4 text-muted extra-tiny">
                                                        No operating entities found. Click "+ New Entity" to register one.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Cards (Screens < 768px) */}
                                <div className="d-block d-md-none">
                                    {entities.length > 0 ? entities.map(c => {
                                        const isRevealed = revealedKeys[c._id]
                                        const isCopied = copiedKeyId === c._id
                                        const shape = c.profileShape || 'rounded'
                                        const hasPhoto = Boolean(c.profilePicture)

                                        return (
                                            <div key={c._id} className="settings-mobile-card">
                                                {/* Top Row: Entity Icon, Name & Actions */}
                                                <div className="d-flex justify-content-between align-items-start gap-2 mb-2.5">
                                                    <div className="d-flex align-items-center gap-2.5" style={{ minWidth: 0, flex: 1 }}>
                                                        <div 
                                                            className={`entity-avatar-wrapper shape-${shape}`}
                                                            onClick={() => hasPhoto && setPreviewImageModal({ img: c.profilePicture, name: c.name, shape: shape })}
                                                            style={{ width: shape === 'rectangle' ? '54px' : '42px', height: shape === 'rectangle' ? '34px' : '42px' }}
                                                        >
                                                            {hasPhoto ? (
                                                                <img src={c.profilePicture} alt={c.name} className="entity-avatar-img" />
                                                            ) : (
                                                                <span className="fw-black text-primary extra-tiny">
                                                                    {c.name ? c.name.slice(0, 2).toUpperCase() : 'EN'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <span className="fw-extrabold text-main d-block text-truncate" style={{ fontSize: '0.96rem' }}>
                                                                {c.name}
                                                            </span>
                                                            <div className="d-flex align-items-center gap-1.5 mt-0.5">
                                                                <span className={`shape-badge-pill ${shape}`} style={{ fontSize: '0.64rem', padding: '0.1rem 0.45rem' }}>
                                                                    {shape.charAt(0).toUpperCase() + shape.slice(1)}
                                                                </span>
                                                                <span className="extra-tiny text-muted">{hasPhoto ? '• Photo set' : ''}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="d-flex align-items-center gap-1 flex-shrink-0">
                                                        {hasPhoto && (
                                                            <button 
                                                                onClick={() => setPreviewImageModal({ img: c.profilePicture, name: c.name, shape: shape })}
                                                                className="settings-action-btn"
                                                                title="Preview Photo"
                                                                style={{ width: '28px', height: '28px', margin: 0, color: 'var(--palette-terracotta, #ea580c)' }}
                                                            >
                                                                <Eye size={13} />
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => { 
                                                                setEditingEntity(c); 
                                                                setEntityForm({ 
                                                                    name: c.name, 
                                                                    securityKey: c.securityKey,
                                                                    profilePicture: c.profilePicture || '',
                                                                    profileShape: c.profileShape || 'rounded'
                                                                }); 
                                                                setIsEntityModalOpen(true); 
                                                            }} 
                                                            className="settings-action-btn edit" 
                                                            title="Edit Entity"
                                                            style={{ width: '28px', height: '28px', margin: 0 }}
                                                        >
                                                            <Edit3 size={13} />
                                                        </button>
                                                        <button 
                                                            onClick={() => deleteEntity(c._id, c.name)} 
                                                            className="settings-action-btn delete" 
                                                            title="Delete Entity"
                                                            style={{ width: '28px', height: '28px', margin: 0 }}
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Bottom Row: Security Key & Created Date */}
                                                <div className="d-flex flex-column gap-2 pt-2 border-top border-secondary border-opacity-10">
                                                    {/* Key Bar */}
                                                    <div className="d-flex align-items-center justify-content-between p-1.5 px-2.5 rounded-3 border w-100" style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)' }}>
                                                        <div className="d-flex align-items-center gap-1.5" style={{ minWidth: 0 }}>
                                                            <Key size={13} className="text-primary flex-shrink-0" />
                                                            <span className="font-monospace fw-bold extra-tiny text-truncate" style={{ letterSpacing: '1px' }}>
                                                                {isRevealed ? c.securityKey : '••••••••••••••••'}
                                                            </span>
                                                        </div>
                                                        <div className="d-flex align-items-center gap-1 flex-shrink-0">
                                                            <button 
                                                                type="button"
                                                                onClick={() => toggleRevealKey(c._id)}
                                                                className="btn btn-sm btn-link p-1 text-muted hover-text-main"
                                                                title={isRevealed ? "Hide Key" : "Reveal Key"}
                                                            >
                                                                {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                                                            </button>
                                                            <button 
                                                                type="button"
                                                                onClick={() => copyToClipboard(c.securityKey, c._id)}
                                                                className="btn btn-sm btn-link p-1 text-muted hover-text-main"
                                                                title="Copy to Clipboard"
                                                            >
                                                                {isCopied ? <Check size={14} className="text-success" /> : <Copy size={13} />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Created Date */}
                                                    <div className="d-flex align-items-center justify-content-between extra-tiny text-muted">
                                                        <span className="opacity-75">Configured Date:</span>
                                                        <span className="fw-semibold d-inline-flex align-items-center gap-1">
                                                            <Calendar size={11} className="text-primary opacity-75" />
                                                            <span>{new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }) : (
                                        <div className="text-center py-4 text-muted extra-tiny">
                                            No operating entities found. Click "+ New Entity" to register one.
                                        </div>
                                    )}
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
                                <div className="settings-input-group mb-3">
                                    <label className="settings-input-label">
                                        <Building2 size={13} className="text-primary" /> Entity / Organization Name
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

                                <div className="settings-input-group mb-3">
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

                                {/* ─── Entity Profile Picture Section (Rounded, Rectangle, Square) ─── */}
                                <div className="p-3 rounded-4 mb-3" style={{ background: 'var(--input-bg, rgba(15, 23, 42, 0.02))', border: '1.5px solid var(--glass-border)' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <label className="settings-input-label mb-0">
                                            <Camera size={14} className="text-primary" /> Entity Profile Picture &amp; Geometry
                                        </label>
                                        <span className="extra-tiny text-muted fw-semibold">
                                            Shape: <strong className="text-capitalize text-main">{entityForm.profileShape}</strong>
                                        </span>
                                    </div>

                                    {/* Shape Selector: Rounded, Rectangle, Square */}
                                    <div className="mb-3">
                                        <div className="extra-tiny fw-bold text-muted mb-1.5" style={{ letterSpacing: '0.5px' }}>
                                            SELECT SHAPE GEOMETRY
                                        </div>
                                        <div className="entity-shape-selector">
                                            {/* 1. Rounded */}
                                            <button
                                                type="button"
                                                className={`shape-option-btn ${entityForm.profileShape === 'rounded' ? 'active' : ''}`}
                                                onClick={() => setEntityForm({ ...entityForm, profileShape: 'rounded' })}
                                            >
                                                <div className="shape-glyph-preview rounded" />
                                                <span>Rounded</span>
                                                <span className="extra-tiny opacity-75" style={{ fontSize: '0.62rem' }}>Circle / 1:1</span>
                                            </button>

                                            {/* 2. Rectangle */}
                                            <button
                                                type="button"
                                                className={`shape-option-btn ${entityForm.profileShape === 'rectangle' ? 'active' : ''}`}
                                                onClick={() => setEntityForm({ ...entityForm, profileShape: 'rectangle' })}
                                            >
                                                <div className="shape-glyph-preview rectangle" />
                                                <span>Rectangle</span>
                                                <span className="extra-tiny opacity-75" style={{ fontSize: '0.62rem' }}>Wide / 16:9</span>
                                            </button>

                                            {/* 3. Square */}
                                            <button
                                                type="button"
                                                className={`shape-option-btn ${entityForm.profileShape === 'square' ? 'active' : ''}`}
                                                onClick={() => setEntityForm({ ...entityForm, profileShape: 'square' })}
                                            >
                                                <div className="shape-glyph-preview square" />
                                                <span>Square</span>
                                                <span className="extra-tiny opacity-75" style={{ fontSize: '0.62rem' }}>Box / 1:1</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Live Interactive Shape Preview Card */}
                                    <div className="entity-profile-preview-card mb-3">
                                        <div className="d-flex flex-column align-items-center justify-content-center w-100 py-1">
                                            <div 
                                                className={`entity-avatar-wrapper shape-${entityForm.profileShape} mb-2`}
                                                style={{
                                                    width: entityForm.profileShape === 'rectangle' ? '120px' : '84px',
                                                    height: entityForm.profileShape === 'rectangle' ? '70px' : '84px',
                                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                                                    border: '2px solid var(--glass-border)'
                                                }}
                                            >
                                                {entityForm.profilePicture ? (
                                                    <img src={entityForm.profilePicture} alt="Profile Preview" className="entity-avatar-img" />
                                                ) : (
                                                    <div className="d-flex flex-column align-items-center justify-content-center text-primary">
                                                        <Building2 size={entityForm.profileShape === 'rectangle' ? 24 : 30} />
                                                        <span className="extra-tiny fw-bold mt-1 text-muted" style={{ fontSize: '0.65rem' }}>
                                                            {entityForm.name ? entityForm.name.slice(0, 3).toUpperCase() : 'NO PHOTO'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="d-flex align-items-center gap-2">
                                                <span className={`shape-badge-pill ${entityForm.profileShape}`}>
                                                    {entityForm.profileShape.toUpperCase()} GEOMETRY
                                                </span>
                                                {entityForm.profilePicture && (
                                                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill extra-tiny">
                                                        ✓ Photo Loaded
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons: Upload, Remove */}
                                    <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between mb-2">
                                        <div className="d-flex align-items-center gap-2">
                                            <label className="btn btn-sm btn-primary rounded-3 d-inline-flex align-items-center gap-1.5 px-3 py-1.5 fw-bold extra-tiny mb-0 shadow-sm" style={{ cursor: 'pointer' }}>
                                                <UploadCloud size={14} />
                                                <span>{uploadingImage ? 'Uploading...' : (entityForm.profilePicture ? 'Change Photo' : 'Upload Photo')}</span>
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    className="d-none" 
                                                    onChange={handleImageUpload} 
                                                    disabled={uploadingImage}
                                                />
                                            </label>

                                            {entityForm.profilePicture && (
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveImage}
                                                    className="btn btn-sm btn-outline-danger rounded-3 d-inline-flex align-items-center gap-1 px-2.5 py-1.5 fw-bold extra-tiny"
                                                    title="Remove Profile Picture"
                                                >
                                                    <Trash2 size={13} />
                                                    <span>Delete Photo</span>
                                                </button>
                                            )}
                                        </div>

                                        <span className="extra-tiny text-muted">Supports PNG, JPG, WebP, SVG</span>
                                    </div>

                                    {/* Optional Direct URL input */}
                                    <div className="pt-2 border-top border-secondary border-opacity-10">
                                        <input 
                                            type="url" 
                                            className="settings-text-input py-1.5 px-3 extra-tiny" 
                                            placeholder="Or paste direct image URL (https://...)" 
                                            value={entityForm.profilePicture} 
                                            onChange={e => setEntityForm({ ...entityForm, profilePicture: e.target.value })} 
                                            style={{ fontSize: '0.78rem' }}
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

            {/* ─── Profile Picture Lightbox Preview Modal ─── */}
            <AnimatePresence>
                {previewImageModal && (
                    <div 
                        className="modal-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" 
                        style={{ background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(16px)', zIndex: 999999 }}
                        onClick={() => setPreviewImageModal(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="p-4 rounded-4 shadow-2xl border text-center position-relative"
                            style={{ 
                                maxWidth: '480px', 
                                width: '100%', 
                                background: 'var(--card-bg, #ffffff)', 
                                borderColor: 'var(--glass-border)' 
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className="text-start">
                                    <h6 className="fw-extrabold text-main mb-0">{previewImageModal.name}</h6>
                                    <span className={`shape-badge-pill ${previewImageModal.shape} mt-1`}>
                                        {previewImageModal.shape.toUpperCase()} GEOMETRY
                                    </span>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setPreviewImageModal(null)} 
                                    className="btn btn-close p-2"
                                    aria-label="Close"
                                />
                            </div>

                            <div className="d-flex align-items-center justify-content-center p-3 my-2 rounded-3 bg-dark bg-opacity-25 overflow-hidden">
                                <div 
                                    className={`entity-avatar-wrapper shape-${previewImageModal.shape}`}
                                    style={{
                                        width: previewImageModal.shape === 'rectangle' ? '280px' : '200px',
                                        height: previewImageModal.shape === 'rectangle' ? '160px' : '200px',
                                        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
                                        cursor: 'default'
                                    }}
                                >
                                    <img 
                                        src={previewImageModal.img} 
                                        alt={previewImageModal.name} 
                                        className="entity-avatar-img"
                                    />
                                </div>
                            </div>

                            <div className="d-flex justify-content-end gap-2 mt-3 pt-2 border-top border-secondary border-opacity-10">
                                <button 
                                    type="button" 
                                    onClick={() => setPreviewImageModal(null)} 
                                    className="btn btn-sm btn-light border fw-bold px-3 py-1.5 extra-tiny rounded-3"
                                >
                                    CLOSE
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default Settings
