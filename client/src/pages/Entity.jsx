import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Key, Download, RefreshCcw, ArrowRight, ShieldCheck, LogOut, Search, Info, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const Entity = () => {
    const { user, setVerifiedEntity, logout } = useAuth()
    const navigate = useNavigate()
    const [mode, setMode] = useState('select') // 'select' or 'register'
    const [entities, setEntities] = useState([])
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        securityKey: ''
    })
    const [selectedEntityName, setSelectedEntityName] = useState('')
    const [error, setError] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        fetchEntities()
    }, [])

    const fetchEntities = async () => {
        try {
            const res = await axios.get('/api/entity/all')
            if (Array.isArray(res.data)) {
                setEntities(res.data)
            } else {
                setEntities([])
            }
        } catch (err) {
            console.error('Error fetching entities:', err)
            setEntities([])
        }
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        if (user?.role !== 'admin' && user?.role !== 'superadmin') {
            setError('Only administrators can register new entities.')
            return
        }
        setLoading(true)
        setError('')
        try {
            const res = await axios.post('/api/entity/register', {
                name: formData.name,
                securityKey: formData.securityKey
            })

            // Auto download credentials
            downloadCredentials(formData.name, formData.securityKey)

            // Set verified entity and navigate to dashboard
            if (res.data) {
                setVerifiedEntity(res.data)
                navigate('/dashboard')
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error registering entity')
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = async (e) => {
        e.preventDefault()
        const targetName = mode === 'select' ? selectedEntityName : formData.name
        if (!targetName) {
            setError('Please provide an entity name')
            return
        }

        setLoading(true)
        setError('')
        try {
            const res = await axios.post('/api/entity/verify', {
                name: targetName,
                securityKey: formData.securityKey
            })
            if (res.data && res.data.entity) {
                setVerifiedEntity(res.data.entity)
                navigate('/dashboard')
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid security key')
        } finally {
            setLoading(false)
        }
    }

    const downloadCredentials = (name, key) => {
        try {
            const element = document.createElement('a')
            const file = new Blob([`Entity Name: ${name}\nSecurity Key: ${key}\n\nPlease keep this safe.`], { type: 'text/plain' })
            element.href = URL.createObjectURL(file)
            element.download = `${name}_Credentials.txt`
            document.body.appendChild(element)
            element.click()
            document.body.removeChild(element)
        } catch (err) {
            console.error('Download failed:', err)
        }
    }

    const handleForgotKey = async () => {
        const name = mode === 'select' ? selectedEntityName : formData.name
        if (!name) {
            alert('Please select or enter an entity name first')
            return
        }

        try {
            const res = await axios.post('/api/entity/forgot-key', { name })
            alert(`Your Security Key is: ${res.data.securityKey}`)
        } catch (err) {
            alert(err.response?.data?.message || 'Error retrieving key. You must be the entity owner to retrieve it.')
        }
    }

    return (
        <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center py-5 px-3 position-relative" style={{ background: 'var(--primary-bg)' }}>
            {/* Ambient Background Glows */}
            <div className="position-absolute rounded-circle" style={{ width: '400px', height: '400px', background: 'var(--accent-1)', filter: 'blur(100px)', opacity: 0.1, top: '10%', left: '10%' }}></div>
            <div className="position-absolute rounded-circle" style={{ width: '300px', height: '300px', background: 'var(--accent-2)', filter: 'blur(100px)', opacity: 0.1, bottom: '20%', right: '10%' }}></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-100 z-1"
                style={{ maxWidth: '440px' }}
            >
                {/* Header Branding */}
                <div className="text-center mb-4">
                    <h2 className="fs-1 fw-extrabold mb-1" style={{ color: 'var(--text-main)', letterSpacing: '-0.03em' }}>Entity <span className="gradient-text">Access</span></h2>
                    <p className="small mb-0 fw-bold uppercase ls-2 d-flex align-items-center justify-content-center gap-2" style={{ color: 'var(--text-muted)' }}>
                        Account <ArrowRight size={14} className="opacity-50" /> <span style={{ color: 'var(--text-main)' }}>{user?.name}</span>
                    </p>
                </div>

                <div className="glass-card-premium p-4 p-md-5 mb-4 position-relative">
                    {/* Mode Toggle */}
                    {(user?.role === 'admin' || user?.role === 'superadmin') ? (
                        <div className="d-flex gap-2 mb-4 p-1 rounded-pill" style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid var(--glass-border)' }}>
                            <button
                                onClick={() => { setMode('select'); setError(''); }}
                                className={`btn flex-grow-1 border-0 py-2 rounded-pill small fw-extrabold transition-all`}
                                style={{
                                    background: mode === 'select' ? 'var(--secondary-bg)' : 'transparent',
                                    color: mode === 'select' ? 'var(--text-main)' : 'var(--text-muted)',
                                    boxShadow: mode === 'select' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                ENTER ENTITY
                            </button>
                            <button
                                onClick={() => { setMode('register'); setError(''); }}
                                className={`btn flex-grow-1 border-0 py-2 rounded-pill small fw-extrabold transition-all`}
                                style={{
                                    background: mode === 'register' ? 'var(--secondary-bg)' : 'transparent',
                                    color: mode === 'register' ? 'var(--text-main)' : 'var(--text-muted)',
                                    boxShadow: mode === 'register' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                CREATE NEW
                            </button>
                        </div>
                    ) : (
                        <div className="border tiny p-3 rounded-4 mb-4 d-flex align-items-center gap-3" style={{ background: 'var(--premium-glow)', borderColor: 'var(--accent-1)', color: 'var(--text-main)' }}>
                            <ShieldCheck size={24} style={{ color: 'var(--accent-1)' }} />
                            <span className="fw-bold">Join using your Entity Security Key.</span>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="alert alert-danger border-0 tiny text-center mb-4 py-2 fw-bold rounded-3"
                                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {mode === 'select' ? (
                        <form onSubmit={handleVerify}>
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="small fw-extrabold mb-0 uppercase ls-1 text-muted">
                                        Entity Name
                                    </label>
                                    <button type="button" onClick={fetchEntities} className="btn btn-link p-0 extra-tiny no-underline fw-bold uppercase ls-1 d-flex align-items-center gap-1 transition-all hover-glow" style={{ color: 'var(--text-muted)' }}>
                                        <RefreshCcw size={12} /> REFRESH
                                    </button>
                                </div>
                                <div className="position-relative">
                                    <div className="input-group-premium" onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(true); }}>
                                        <div className="px-3 d-flex align-items-center" style={{ color: 'var(--accent-2)' }}>
                                            <Search size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            className="form-control-custom fs-6"
                                            placeholder="Search entities..."
                                            value={isDropdownOpen ? searchQuery : (selectedEntityName || '')}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                if (!isDropdownOpen) setIsDropdownOpen(true);
                                            }}
                                            onClick={() => setIsDropdownOpen(true)}
                                            onFocus={() => setIsDropdownOpen(true)}
                                            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                                            autoComplete="off"
                                        />
                                    </div>

                                    <AnimatePresence>
                                        {isDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="position-absolute w-100 mt-2 shadow-premium rounded-4 border z-3 overflow-hidden glass-card-premium"
                                                style={{ maxHeight: '220px', overflowY: 'auto' }}
                                            >
                                                {Array.isArray(entities) && entities.length > 0 ? (
                                                    entities.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                                                        entities.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
                                                            <div
                                                                key={c._id}
                                                                className="px-4 py-3 border-bottom cursor-pointer fw-bold transition-all"
                                                                style={{ color: 'var(--text-main)', borderColor: 'var(--glass-border)' }}
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    setSelectedEntityName(c.name);
                                                                    setSearchQuery('');
                                                                    setIsDropdownOpen(false);
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-bg)'}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                            >
                                                                {c.name}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-4 text-center opacity-75">
                                                             <Info size={24} className="mb-2" style={{ color: 'var(--text-muted)' }} />
                                                             <div className="small fw-bold text-muted">No matches found.</div>
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="px-4 py-4 text-center">
                                                        <div className="small fw-bold mb-3 text-muted">No entities available.</div>
                                                        {(user?.role === 'admin' || user?.role === 'superadmin') && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setMode('register')}
                                                                className="btn-premium py-2 px-4 rounded-pill small w-100 mx-auto shadow-sm"
                                                            >
                                                                REGISTER NEW
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="mb-5">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="small fw-extrabold mb-0 uppercase ls-1 text-muted">
                                        Security Key
                                    </label>
                                    <button type="button" onClick={handleForgotKey} className="btn btn-link p-0 extra-tiny no-underline fw-bold uppercase ls-1 transition-all" style={{ color: 'var(--accent-1)' }}>
                                        LOST KEY?
                                    </button>
                                </div>
                                <div className="input-group-premium">
                                    <div className="px-3 d-flex align-items-center" style={{ color: 'var(--accent-2)' }}>
                                        <Key size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="form-control-custom fs-6 font-monospace"
                                        style={{ letterSpacing: showPassword ? 'normal' : '4px' }}
                                        placeholder={showPassword ? "Enter security key" : "••••••••"}
                                        value={formData.securityKey}
                                        onChange={(e) => setFormData({ ...formData, securityKey: e.target.value })}
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="btn px-3 border-0 d-flex align-items-center shadow-none hover-glow" style={{ color: 'var(--text-muted)' }}>
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !selectedEntityName || !formData.securityKey}
                                className={`${(!selectedEntityName || !formData.securityKey || loading) ? 'btn' : 'btn-premium'} w-100 py-3 rounded-pill d-flex align-items-center justify-content-center gap-3 fs-6 fw-bold transition-all`}
                                style={{ 
                                    cursor: (!selectedEntityName || !formData.securityKey || loading) ? 'not-allowed' : 'pointer',
                                    background: (!selectedEntityName || !formData.securityKey || loading) ? '#CBD5E1' : undefined,
                                    color: '#FFFFFF'
                                }}
                            >
                                {loading ? 'VERIFYING...' : 'CONFIRM ACCESS'} <ArrowRight size={20} />
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister}>
                            <div className="mb-4">
                                <label className="small fw-extrabold mb-2 uppercase ls-1 text-muted">
                                    Create Entity Name
                                </label>
                                <div className="input-group-premium">
                                    <div className="px-3 d-flex align-items-center" style={{ color: 'var(--accent-2)' }}>
                                        <Building2 size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        className="form-control-custom fs-6"
                                        placeholder="e.g. Vishwa Utsav 2024"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="small fw-extrabold mb-2 uppercase ls-1 text-muted">
                                    Master Security Key
                                </label>
                                <div className="input-group-premium">
                                    <div className="px-3 d-flex align-items-center" style={{ color: 'var(--accent-2)' }}>
                                        <Key size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="form-control-custom fs-6 font-monospace"
                                        style={{ letterSpacing: showPassword ? 'normal' : '4px' }}
                                        placeholder={showPassword ? "Enter security key" : "Set a strong key"}
                                        value={formData.securityKey}
                                        onChange={(e) => setFormData({ ...formData, securityKey: e.target.value })}
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="btn px-3 border-0 d-flex align-items-center shadow-none hover-glow" style={{ color: 'var(--text-muted)' }}>
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !formData.name || !formData.securityKey}
                                className={`${(!formData.name || !formData.securityKey || loading) ? 'btn' : 'btn-premium'} w-100 py-3 rounded-pill d-flex align-items-center justify-content-center gap-3 fs-6 fw-bold transition-all`}
                                style={{ 
                                    cursor: (!formData.name || !formData.securityKey || loading) ? 'not-allowed' : 'pointer',
                                    background: (!formData.name || !formData.securityKey || loading) ? '#CBD5E1' : undefined,
                                    color: '#FFFFFF'
                                }}
                            >
                                {loading ? 'CREATING...' : 'CREATE & ACCESS'} <ArrowRight size={20} />
                            </button>
                            <div className="mt-4 text-center">
                                <div className="d-inline-flex align-items-center justify-content-center gap-2 px-3 py-2 rounded-pill" style={{ background: 'var(--glass-bg)', color: 'var(--text-muted)' }}>
                                    <Download size={14} /> <span className="extra-tiny fw-bold uppercase ls-1">Key will auto-download</span>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                <div className="text-center d-flex flex-column align-items-center gap-3 mt-4">
                    <button
                        onClick={() => navigate('/my-pass')}
                        className="btn-premium py-2 px-4 rounded-pill shadow-glow transition-all d-inline-flex align-items-center justify-content-center gap-2"
                        style={{ minWidth: '280px' }}
                    >
                        <Search size={16} /> <span className="small fw-bold ls-1">CHECK ATTENDEE PASS</span>
                    </button>
                    
                    <button onClick={logout} className="btn btn-link no-underline extra-tiny text-muted d-inline-flex align-items-center justify-content-center gap-2 transition-all fw-bold mt-2 hover-text-danger">
                        <LogOut size={14} /> NOT YOUR ACCOUNT? LOG OUT
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

export default Entity
