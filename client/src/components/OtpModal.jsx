import React, { useState, useEffect, useRef } from 'react';
import './OtpModal.css';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, ArrowRight, RotateCw, X, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const OtpModal = ({
    isOpen,
    onClose,
    email = '',
    purpose = 'signup',
    userName = '',
    title = 'Security Verification',
    description = '',
    onSuccess
}) => {
    // 6-digit code array
    const [digits, setDigits] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef([]);

    // Mask display for privacy
    const maskEmail = (str) => {
        if (!str || !str.includes('@')) return str || 'your email';
        const [name, domain] = str.split('@');
        if (name.length <= 2) return `${name[0]}*@${domain}`;
        return `${name[0]}${'*'.repeat(Math.max(name.length - 2, 1))}${name[name.length - 1]}@${domain}`;
    };

    // Countdown Timer
    useEffect(() => {
        let interval = null;
        if (isOpen && timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isOpen, timer]);

    // Send Email OTP via Gmail SMTP
    const sendEmailOtp = async (targetEmail) => {
        const dest = (targetEmail || email || '').trim();
        if (!dest || !dest.includes('@')) {
            setError('Please provide a valid Gmail or email address');
            return;
        }

        setError('');
        setResendLoading(true);
        try {
            const res = await axios.post('/api/otp/send', {
                email: dest,
                purpose,
                userName
            });

            if (res.data.success) {
                setTimer(60);
                setCanResend(false);
                setSuccessMessage(`Verification code sent to ${maskEmail(dest)}`);
                setTimeout(() => setSuccessMessage(''), 3500);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to deliver verification email. Please check the address.');
        } finally {
            setResendLoading(false);
        }
    };

    // Auto-dispatch on open
    useEffect(() => {
        if (isOpen && email) {
            setDigits(['', '', '', '', '', '']);
            setError('');
            setSuccessMessage('');
            setTimer(60);
            setCanResend(false);
            sendEmailOtp(email);

            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 150);
        }
    }, [isOpen, email]);

    const handleDigitChange = (index, value) => {
        const clean = value.replace(/[^0-9]/g, '');
        if (!clean) {
            const next = [...digits];
            next[index] = '';
            setDigits(next);
            return;
        }

        const next = [...digits];
        next[index] = clean[clean.length - 1];
        setDigits(next);
        setError('');

        if (index < 5 && clean) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
        if (!pasted) return;

        const next = [...digits];
        for (let i = 0; i < pasted.length; i++) {
            next[i] = pasted[i];
        }
        setDigits(next);
        setError('');

        const focusIndex = Math.min(pasted.length, 5);
        inputRefs.current[focusIndex]?.focus();
    };

    const handleVerify = async (e) => {
        if (e) e.preventDefault();
        const code = digits.join('');
        if (code.length !== 6) {
            setError('Please enter all 6 digits of your verification code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await axios.post('/api/otp/verify', {
                email: email.trim().toLowerCase(),
                otp: code,
                purpose
            });

            if (res.data.success) {
                setSuccessMessage('Email verified successfully!');
                setTimeout(() => {
                    if (onSuccess) onSuccess({ method: 'email', ...res.data, verifiedTarget: email.trim().toLowerCase() });
                    onClose();
                }, 700);
            }
        } catch (err) {
            console.error('Verification error:', err);
            setError(err.response?.data?.message || 'Invalid or expired code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = () => {
        if (!canResend || resendLoading) return;
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        sendEmailOtp(email);
    };

    if (!isOpen) return null;

    const isComplete = digits.every(d => d !== '');

    return (
        <AnimatePresence>
            <div className="otp-modal-backdrop" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 20 }}
                    transition={{ duration: 0.25 }}
                    className="otp-modal-card"
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="btn btn-link position-absolute top-0 end-0 m-3 text-muted p-1 hover-rotate"
                        style={{ zIndex: 10 }}
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>

                    <div className="otp-modal-header text-center pb-2">
                        <div className="otp-icon-emblem mx-auto mb-2">
                            <ShieldCheck size={28} />
                        </div>
                        <h4 className="fw-extrabold text-main mb-1" style={{ letterSpacing: '-0.02em', fontSize: '1.25rem' }}>
                            {title}
                        </h4>

                        <p className="extra-tiny text-muted mb-0 mt-2 d-flex align-items-center justify-content-center gap-1.5">
                            <Mail size={13} className="text-primary" />
                            <span>Verification code sent to: <strong className="text-main">{maskEmail(email)}</strong></span>
                        </p>
                    </div>

                    <div className="p-4">
                        <p className="small text-muted text-center mb-1" style={{ fontSize: '0.85rem' }}>
                            {description || 'Enter the 6-digit code dispatched to your Gmail / Email inbox.'}
                        </p>

                        <div className="otp-input-container" onPaste={handlePaste}>
                            {digits.map((digit, idx) => (
                                <input
                                    key={idx}
                                    ref={el => inputRefs.current[idx] = el}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength="1"
                                    value={digit}
                                    onChange={e => handleDigitChange(idx, e.target.value)}
                                    onKeyDown={e => handleKeyDown(idx, e)}
                                    className={`otp-digit-box ${digit ? 'filled' : ''}`}
                                    autoComplete="one-time-code"
                                />
                            ))}
                        </div>

                        {error && (
                            <div className="p-2.5 rounded-3 bg-danger bg-opacity-10 text-danger extra-tiny fw-bold text-center border border-danger border-opacity-25 mb-3 d-flex align-items-center justify-content-center gap-1.5 animate-in">
                                <AlertCircle size={14} className="flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {successMessage && (
                            <div className="p-2.5 rounded-3 bg-success bg-opacity-10 text-success extra-tiny fw-bold text-center border border-success border-opacity-25 mb-3 d-flex align-items-center justify-content-center gap-1.5 animate-in">
                                <CheckCircle2 size={14} className="flex-shrink-0" />
                                <span>{successMessage}</span>
                            </div>
                        )}

                        <button
                            onClick={handleVerify}
                            disabled={loading || !isComplete}
                            className="btn-otp-verify mb-3"
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                    <span>Verifying Identity...</span>
                                </>
                            ) : (
                                <>
                                    <span>Authorize &amp; Proceed</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>

                        <div className="text-center pt-1 border-top" style={{ borderColor: 'var(--glass-border)' }}>
                            <span className="extra-tiny text-muted me-1">Didn't receive the email?</span>
                            {canResend ? (
                                <button
                                    onClick={handleResend}
                                    disabled={resendLoading}
                                    className="btn-otp-resend d-inline-flex align-items-center gap-1"
                                >
                                    <RotateCw size={12} className={resendLoading ? 'animate-spin' : ''} />
                                    <span>Resend Code</span>
                                </button>
                            ) : (
                                <span className="extra-tiny text-muted fw-bold">
                                    Resend in <span className="text-primary font-monospace">0:{timer < 10 ? `0${timer}` : timer}</span>
                                </span>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default OtpModal;
