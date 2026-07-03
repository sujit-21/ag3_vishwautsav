import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, User, Lock, Eye, EyeOff } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const Login = () => {
    const navigate = useNavigate()
    const { login, isAuthenticated } = useAuth()
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)

    useEffect(() => {
        const savedEmail = localStorage.getItem('rememberedEmail')
        if (savedEmail) {
            setFormData(prev => ({ ...prev, email: savedEmail }))
            setRememberMe(true)
        }
        
        if (isAuthenticated) {
            navigate('/role-selection')
        }
    }, [isAuthenticated, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', formData.email)
            } else {
                localStorage.removeItem('rememberedEmail')
            }
            
            const res = await axios.post('/api/auth/login', formData)
            login(res.data.user, res.data.token, rememberMe) // Updated global auth state with rememberMe
            navigate('/role-selection')
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
            <div className="w-100" style={{ maxWidth: '400px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="glass-card-premium p-4 shadow-premium border-opacity-10"
                >
                    <div className="text-center mb-4">
                        <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3" style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(192,132,252,0.15) 100%)', border: '1.5px solid rgba(192,132,252,0.2)' }}>
                            <LogIn size={24} style={{ color: 'var(--accent-1)' }} />
                        </div>
                        <h3 className="fw-bold mb-1" style={{ color: 'var(--text-main)' }}>Welcome Back</h3>
                        <p className="text-muted small">Login to access your account</p>
                    </div>

                    {error && (
                        <div className="alert alert-danger mb-3 py-2 small border-0 text-center fw-bold" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3 text-start">
                            <label className="form-label text-muted text-uppercase fw-bold mb-1.5" style={{ fontSize: '0.68rem', letterSpacing: '1px' }}>Email or Phone Number</label>
                            <div className="input-group-premium align-items-center" style={{ height: '44px' }}>
                                <User size={16} className="text-muted ms-3" />
                                <input
                                    type="text"
                                    placeholder="Email or Phone Number"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    className="form-control-custom"
                                />
                            </div>
                        </div>

                        <div className="mb-4 text-start">
                            <label className="form-label text-muted text-uppercase fw-bold mb-1.5" style={{ fontSize: '0.68rem', letterSpacing: '1px' }}>Password</label>
                            <div className="input-group-premium align-items-center position-relative overflow-hidden" style={{ height: '44px' }}>
                                <Lock size={16} className="text-muted ms-3" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    className="form-control-custom pe-5"
                                />
                                <button
                                    type="button"
                                    className="btn border-0 position-absolute end-0 top-50 translate-middle-y px-3 text-muted"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ zIndex: 10, background: 'transparent' }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div className="d-flex align-items-center">
                                <input 
                                    className="form-check-input mt-0 me-2" 
                                    type="checkbox" 
                                    id="rememberMe" 
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    style={{ cursor: 'pointer' }}
                                />
                                <label className="text-muted text-uppercase fw-bold mb-0" htmlFor="rememberMe" style={{ cursor: 'pointer', fontSize: '0.68rem', letterSpacing: '1px' }}>
                                    Remember me
                                </label>
                            </div>
                            <Link to="/forgot-password" className="small text-primary text-decoration-none fw-bold" style={{ fontSize: '0.75rem' }}>
                                Forgot Password?
                            </Link>
                        </div>

                        <button type="submit" className="btn btn-premium w-100 mb-3 py-2.5 rounded-pill fw-bold text-uppercase shadow-premium" style={{ letterSpacing: '1px', fontSize: '0.85rem' }} disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>

                        <div className="text-center">
                            <p className="small text-muted mb-0" style={{ fontSize: '0.8rem' }}>Don't have an account? <Link to="/signup" className="text-primary text-decoration-none fw-bold">Sign Up</Link></p>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    )
}

export default Login
