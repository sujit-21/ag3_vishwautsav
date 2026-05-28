import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Key, Mail, ChevronLeft, CheckCircle, ShieldAlert } from 'lucide-react'
import axios from 'axios'

const ForgotPassword = () => {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState('idle') // idle, loading, success, error
    const [message, setMessage] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setStatus('loading')
        try {
            // Check if user exists on backend
            const res = await axios.post('/api/auth/forgot-password', { email })
            setStatus('success')
            setMessage(res.data.message)
        } catch (err) {
            setStatus('error')
            setMessage(err.response?.data?.message || 'Something went wrong. Please try again.')
        }
    }

    return (
        <div className="container py-5 mt-4">
            <div className="row justify-content-center">
                <div className="col-md-5">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card-premium p-4 shadow-premium border-opacity-10"
                    >
                        <Link to="/login" className="btn btn-link link-modern text-decoration-none d-inline-flex align-items-center gap-2 mb-4 p-0">
                            <ChevronLeft size={18} /> Back to Login
                        </Link>

                        <div className="text-center mb-4">
                            <div className="d-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle mx-auto mb-3" style={{ width: '64px', height: '64px' }}>
                                <Key size={32} className="text-primary" />
                            </div>
                            <h3 className="fw-bold mb-1">Security Recovery</h3>
                            <p className="text-muted small">Enter your account email to restore access.</p>
                        </div>

                        <AnimatePresence mode="wait">
                            {status === 'success' ? (
                                <motion.div
                                    key="success-message"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-4"
                                >
                                    <CheckCircle size={56} className="text-success mb-3" />
                                    <h5 className="fw-bold text-success mb-2">Request Processed!</h5>
                                    <p className="text-muted small">{message || 'If an account exists with this email, recovery instructions have been sent.'}</p>
                                    <div className="mt-4 p-3 bg-secondary bg-opacity-5 rounded-4 border border-secondary border-opacity-10 text-start">
                                        <p className="tiny mb-0 text-muted italic fw-bold">Note: This is a demo. In a live system, you would receive an email with a reset link. For now, please contact your Entity Admin to manually reset your password via the Dashboard.</p>
                                    </div>
                                    <Link to="/login" className="btn btn-premium w-100 mt-4 py-3 rounded-pill fw-bold">Return to Login</Link>
                                </motion.div>
                            ) : (
                                <motion.form
                                    key="reset-form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onSubmit={handleSubmit}
                                >
                                    {status === 'error' && (
                                        <div className="alert alert-danger border-0 small py-2 d-flex align-items-center gap-2 rounded-3 mb-4" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                                            <ShieldAlert size={16} /> {message}
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <label className="form-label text-muted text-uppercase tiny fw-bold mb-2 tracking-wider">Registered Email</label>
                                        <div className="input-group-premium align-items-center">
                                            <Mail size={18} className="text-muted ms-3" />
                                            <input
                                                type="email"
                                                className="form-control-custom"
                                                placeholder="e.g. user@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="btn btn-premium w-100 py-3 rounded-pill fw-bold text-uppercase shadow-premium"
                                        style={{ letterSpacing: '1px' }}
                                    >
                                        {status === 'loading' ? (
                                            <span className="spinner-border spinner-border-sm" role="status"></span>
                                        ) : (
                                            'Authenticate & Recover'
                                        )}
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

export default ForgotPassword
