import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, User, Lock, Eye, EyeOff } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const Signup = () => {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user'
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/role-selection')
        }
    }, [isAuthenticated, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await axios.post('/api/auth/signup', formData)
            alert('Account created successfully! Please login.')
            navigate('/login')
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '85vh' }}>
            <div className="w-100" style={{ maxWidth: '400px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="glass-card-premium p-4 shadow-premium border-opacity-10"
                >
                    <div className="text-center mb-4">
                        <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3" style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(192,132,252,0.15) 100%)', border: '1.5px solid rgba(192,132,252,0.2)' }}>
                            <UserPlus size={24} style={{ color: 'var(--accent-1)' }} />
                        </div>
                        <h3 className="fw-bold mb-1" style={{ color: 'var(--text-main)' }}>Create Account</h3>
                        <p className="text-muted small">Join Vishwa Utsav today</p>
                    </div>

                    {error && (
                        <div className="alert alert-danger mb-3 py-2 small border-0 text-center fw-bold" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3 text-start">
                            <label className="form-label text-muted text-uppercase fw-bold mb-1.5" style={{ fontSize: '0.68rem', letterSpacing: '1px' }}>Full Name</label>
                            <div className="input-group-premium align-items-center" style={{ height: '44px' }}>
                                <User size={16} className="text-muted ms-3" />
                                <input
                                    type="text"
                                    placeholder="Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="form-control-custom"
                                />
                            </div>
                        </div>

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

                        <button type="submit" className="btn btn-premium w-100 mb-3 py-2.5 rounded-pill fw-bold text-uppercase shadow-premium" style={{ letterSpacing: '1px', fontSize: '0.85rem' }} disabled={loading}>
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>

                        <div className="text-center">
                            <p className="small text-muted mb-0" style={{ fontSize: '0.8rem' }}>Already have an account? <Link to="/login" className="text-primary text-decoration-none fw-bold">Login</Link></p>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    )
}

export default Signup
