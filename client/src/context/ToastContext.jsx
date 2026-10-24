import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export const useToast = () => {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = 'success', duration = 3500) => {
        const id = Math.random().toString(36).substring(2, 9)
        setToasts((prev) => [...prev, { id, message, type }])

        if (duration) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id))
            }, duration)
        }
    }, [])

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    const toast = {
        success: (msg, duration) => addToast(msg, 'success', duration),
        error: (msg, duration) => addToast(msg, 'error', duration),
        info: (msg, duration) => addToast(msg, 'info', duration)
    }

    return (
        <ToastContext.Provider value={toast}>
            {children}
            {/* Toast Container */}
            <div
                className="position-fixed top-0 end-0 p-3 p-sm-4 d-flex flex-column gap-2 pointer-events-none"
                style={{ zIndex: 999999, maxWidth: '420px', width: '100%' }}
            >
                <AnimatePresence>
                    {toasts.map((t) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -15, scale: 0.95 }}
                            transition={{ duration: 0.25 }}
                            className="pointer-events-auto p-3 rounded-4 shadow-2xl d-flex align-items-center justify-content-between gap-3 border"
                            style={{
                                background: 'var(--modal-bg)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                borderColor:
                                    t.type === 'success'
                                        ? 'rgba(16, 185, 129, 0.4)'
                                        : t.type === 'error'
                                        ? 'rgba(239, 68, 68, 0.4)'
                                        : 'var(--glass-border)',
                                boxShadow:
                                    t.type === 'success'
                                        ? '0 12px 30px -5px rgba(16, 185, 129, 0.25)'
                                        : t.type === 'error'
                                        ? '0 12px 30px -5px rgba(239, 68, 68, 0.25)'
                                        : '0 12px 30px -5px rgba(0, 0, 0, 0.3)'
                            }}
                        >
                            <div className="d-flex align-items-center gap-2.5">
                                <div
                                    className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                    style={{
                                        width: '28px',
                                        height: '28px',
                                        background:
                                            t.type === 'success'
                                                ? 'rgba(16, 185, 129, 0.15)'
                                                : t.type === 'error'
                                                ? 'rgba(239, 68, 68, 0.15)'
                                                : 'rgba(67, 130, 149, 0.15)',
                                        color:
                                            t.type === 'success'
                                                ? '#10b981'
                                                : t.type === 'error'
                                                ? '#ef4444'
                                                : 'var(--palette-slate-teal)'
                                    }}
                                >
                                    {t.type === 'success' ? (
                                        <CheckCircle2 size={16} />
                                    ) : t.type === 'error' ? (
                                        <AlertCircle size={16} />
                                    ) : (
                                        <Info size={16} />
                                    )}
                                </div>
                                <span className="small fw-semibold" style={{ color: 'var(--text-main)', fontSize: '0.86rem' }}>
                                    {t.message}
                                </span>
                            </div>
                            <button
                                onClick={() => removeToast(t.id)}
                                className="btn btn-link p-0 text-muted opacity-60 hover-opacity-100"
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                            >
                                <X size={15} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    )
}
