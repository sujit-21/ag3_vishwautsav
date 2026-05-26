import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Key, Download, RefreshCcw, ArrowRight, ShieldCheck, LogOut, Search, Info } from 'lucide-react'
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
        <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center py-4 px-3" style={{ background: 'var(--primary-bg)' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-100"
                style={{ maxWidth: '400px' }}
            >
                {/* Header Branding */}
                <div className="text-center mb-3">
                    <h2 className="fs-2 fw-extrabold mb-1" style={{ color: 'var(--text-main)', letterSpacing: '-0.03em' }}>Entity <span style={{ color: '#6366f1' }}>Access</span></h2>
                    <p className="tiny mb-0 fw-extrabold uppercase ls-2" style={{ color: 'var(--text-muted)' }}>Account: <span style={{ color: '#6366f1' }}>{user?.name}</span></p>
                </div>

                <div className="shadow-premium position-relative overflow-hidden"
                    style={{
                        borderRadius: '24px',
                        background: 'var(--secondary-bg)',
                        border: '2px solid var(--glass-border)'
                    }}>
                    <div className="w-100 py-2.5 d-flex align-items-center justify-content-center mb-3" style={{ background: '#6366f1' }}>
                        {/* <Building2 style={{ color: '#FFFFFF', opacity: 0.3 }} className="position-absolute start-0 ms-4" size={32} /> */}
                        <h5 style={{ color: '#FFFFFF', fontWeight: '900', letterSpacing: '2px', textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }} className="mb-0 uppercase fs-6">Select Entity</h5>
                    </div>
                    <div className="px-3 pb-3">

                        {/* Mode Toggle */}
                        {(user?.role === 'admin' || user?.role === 'superadmin') ? (
                            <div className="d-flex gap-1 mb-3 p-1 rounded-3 border" style={{ background: 'var(--primary-bg)', borderColor: 'var(--glass-border)' }}>
                                <button
                                    onClick={() => { setMode('select'); setError(''); }}
                                    className={`btn flex-grow-1 border-0 py-1.5 rounded-2 small fw-extrabold transition-all`}
                                    style={{
                                        background: mode === 'select' ? '#6366f1' : 'transparent',
                                        color: mode === 'select' ? '#FFFFFF' : '#64748B'
                                    }}
                                >
                                    ENTER ENTITY
                                </button>
                                <button
                                    onClick={() => { setMode('register'); setError(''); }}
                                    className={`btn flex-grow-1 border-0 py-1.5 rounded-2 small fw-extrabold transition-all`}
                                    style={{
                                        background: mode === 'register' ? '#6366f1' : 'transparent',
                                        color: mode === 'register' ? '#FFFFFF' : '#64748B'
                                    }}
                                >
                                    CREATE ENTITY
                                </button>
                            </div>
                        ) : (
                            <div className="border tiny p-3 rounded-3 mb-4 d-flex align-items-center gap-2" style={{ background: 'rgba(99, 102, 241, 0.1)', borderColor: 'var(--accent-2)', color: 'var(--accent-1)' }}>
                                <Info size={20} />
                                <span className="fw-black">Join using your Entity Security Key.</span>
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="alert alert-danger border-0 tiny text-center mb-3 py-2 fw-bold"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {mode === 'select' ? (
                            <form onSubmit={handleVerify}>
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <label className="small fw-extrabold mb-0 uppercase ls-1 d-flex align-items-center gap-2" style={{ color: 'var(--text-main)' }}>
                                            {/* <Building2 size={18} style={{ color: '#6366f1' }} /> */} Entity Name
                                        </label>
                                        <button type="button" onClick={fetchEntities} className="btn btn-link p-0 small no-underline fw-extrabold uppercase ls-1" style={{ color: '#6366f1' }}>
                                            REFRESH LIST
                                        </button>
                                    </div>
                                    <div className="position-relative">
                                        <div className="input-group rounded-3 border z-1 overflow-hidden"
                                            style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                                            onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(true); }}>
                                            <div className="px-3 d-flex align-items-center border-end" style={{ background: 'var(--secondary-bg)', borderColor: 'var(--input-border)' }}>
                                                <Search size={18} style={{ color: '#6366f1' }} />
                                            </div>
                                            <input
                                                type="text"
                                                className="form-control border-0 bg-transparent py-2 fs-6 fw-extrabold"
                                                style={{ boxShadow: 'none', color: 'var(--text-main)' }}
                                                placeholder="Search..."
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
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 5 }}
                                                    className="position-absolute w-100 mt-1 shadow-lg rounded-3 border z-3 overflow-hidden shadow-premium"
                                                    style={{ maxHeight: '200px', overflowY: 'auto', background: 'var(--secondary-bg)', borderColor: 'var(--input-border)' }}
                                                >
                                                    {Array.isArray(entities) && entities.length > 0 ? (
                                                        entities.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                                                            entities.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
                                                                <div
                                                                    key={c._id}
                                                                    className="px-3 py-2 border-bottom hover-bg-light cursor-pointer fw-extrabold transition-all"
                                                                    style={{ color: 'var(--text-main)', borderColor: 'var(--glass-border)' }}
                                                                    onMouseDown={(e) => {
                                                                        e.preventDefault();
                                                                        setSelectedEntityName(c.name);
                                                                        setSearchQuery('');
                                                                        setIsDropdownOpen(false);
                                                                    }}
                                                                >
                                                                    {c.name}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="px-3 py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                                                                 <Info size={24} className="mb-2 opacity-50" />
                                                                 <div className="small fw-bold">No matches found.</div>
                                                            </div>
                                                        )
                                                    ) : (
                                                        <div className="px-3 py-4 text-center">
                                                            <div className="small fw-extrabold mb-3" style={{ color: 'var(--text-muted)' }}>No results found.</div>
                                                            {(user?.role === 'admin' || user?.role === 'superadmin') && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setMode('register')}
                                                                    className="btn rounded-pill px-4 fw-black shadow-sm"
                                                                    style={{ background: '#6366f1', color: 'white', border: 'none' }}
                                                                >
                                                                    Register New Entity
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <label className="small fw-extrabold mb-0 uppercase ls-1 d-flex align-items-center gap-2" style={{ color: 'var(--text-main)' }}>
                                            {/* <Key size={18} style={{ color: '#6366f1' }} /> */} Security Key
                                        </label>
                                        <button type="button" onClick={handleForgotKey} className="btn btn-link p-0 small no-underline fw-extrabold text-uppercase ls-1" style={{ color: '#6366f1' }}>CONTACT SUPPORT?</button>
                                    </div>
                                    <div className="input-group rounded-3 border overflow-hidden" style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)' }}>
                                        <div className="px-3 d-flex align-items-center border-end" style={{ background: 'var(--secondary-bg)', borderColor: 'var(--input-border)' }}>
                                            <Key size={18} style={{ color: '#6366f1' }} />
                                        </div>
                                        <input
                                            type="password"
                                            className="form-control border-0 bg-transparent py-2 fs-6 fw-extrabold font-monospace"
                                            style={{ letterSpacing: '6px', color: 'var(--text-main)' }}
                                            placeholder="••••••••"
                                            value={formData.securityKey}
                                            onChange={(e) => setFormData({ ...formData, securityKey: e.target.value })}
                                            required
                                            autoComplete="current-password"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !selectedEntityName}
                                    className={`btn w-100 py-2.5 mt-3 fw-black rounded-pill d-flex align-items-center justify-content-center gap-3 transition-all`}
                                    style={{
                                        background: (!selectedEntityName || loading) ? '#CBD5E1' : '#6366f1',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        letterSpacing: '3px',
                                        fontSize: '0.95rem',
                                        boxShadow: '0 6px 12px -3px rgba(99, 102, 241, 0.4)'
                                    }}
                                >
                                    {loading ? 'PLEASE WAIT...' : 'CONFIRM ACCESS'} <ArrowRight size={20} />
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleRegister}>
                                <div className="mb-3">
                                    <label className="small fw-extrabold mb-2 uppercase ls-1 d-flex align-items-center gap-2" style={{ color: 'var(--text-main)' }}>
                                        {/*<Building2 size={18} style={{ color: '#6366f1' }} />*/} Create Entity
                                    </label>
                                    <div className="input-group rounded-3 border overflow-hidden" style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)' }}>
                                        <div className="px-3 d-flex align-items-center border-end" style={{ background: 'var(--secondary-bg)', borderColor: 'var(--input-border)' }}>
                                            <Building2 size={18} style={{ color: '#6366f1' }} />
                                        </div>
                                        <input
                                            type="text"
                                            className="form-control border-0 bg-transparent py-2 fs-6 fw-extrabold"
                                            style={{ color: 'var(--text-main)' }}
                                            placeholder="Enter your Entity Name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="small fw-extrabold mb-2 uppercase ls-1 d-flex align-items-center gap-2" style={{ color: 'var(--text-main)' }}>
                                        {/*<Key size={18} style={{ color: '#6366f1' }} />*/} Security Key
                                    </label>
                                    <div className="input-group rounded-3 border overflow-hidden" style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)' }}>
                                        <div className="px-3 d-flex align-items-center border-end" style={{ background: 'var(--secondary-bg)', borderColor: 'var(--input-border)' }}>
                                            <Key size={18} style={{ color: '#6366f1' }} />
                                        </div>
                                        <input
                                            type="password"
                                            className="form-control border-0 bg-transparent py-2 fs-6 fw-extrabold font-monospace"
                                            style={{ letterSpacing: '6px', color: 'var(--text-main)' }}
                                            placeholder="Enter Security Key"
                                            value={formData.securityKey}
                                            onChange={(e) => setFormData({ ...formData, securityKey: e.target.value })}
                                            required
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`btn w-100 py-2.5 mt-3 fw-black rounded-pill transition-all`}
                                    style={{
                                        background: loading ? '#CBD5E1' : '#6366f1',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        letterSpacing: '3px',
                                        fontSize: '0.95rem',
                                        boxShadow: '0 6px 12px -3px rgba(99, 102, 241, 0.4)'
                                    }}
                                >
                                    {loading ? 'CREATING...' : 'CREATE & ACCESS'}
                                </button>
                                <div className="mt-3 text-center">
                                    <span className="small text-muted d-flex align-items-center justify-content-center gap-1 fw-medium">
                                        <Download size={14} /> Key will auto-download
                                    </span>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

            <div className="mt-2 text-center d-flex flex-column gap-2">
                <button
                    onClick={() => navigate('/my-pass')}
                    className="btn d-inline-flex align-items-center justify-content-center gap-2 transition-all fw-black py-2 px-4 rounded-pill mx-auto shadow-lg border-0"
                    style={{
                        minWidth: '280px',
                        background: '#0ea5e9',
                        color: '#FFFFFF',
                        fontSize: '0.85rem',
                        letterSpacing: '2px'
                    }}
                >
                    <Search size={16} /> ATTENDEE / CHECK PASS
                </button>
                    <button onClick={logout} className="btn btn-link no-underline small d-inline-flex align-items-center justify-content-center gap-2 transition-all fw-extrabold mt-1" style={{ color: '#ef4444' }}>
                        <LogOut size={16} /> NOT YOUR ACCOUNT? LOG OUT
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

export default Entity
