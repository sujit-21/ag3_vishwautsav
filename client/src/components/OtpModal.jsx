import React, { useState, useEffect, useRef } from 'react';
import './OtpModal.css';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, Phone, ArrowRight, RotateCw, X, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { auth } from '../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const OtpModal = ({
    isOpen,
    onClose,
    email = '',
    phone = '',
    initialMode = 'email', // 'email' | 'phone'
    purpose = 'signup',
    userName = '',
    title = 'Security Verification',
    description = '',
    onSuccess
}) => {
    // Active verification mode
    const [mode, setMode] = useState(phone && !email ? 'phone' : initialMode);
    const [fallbackEmail, setFallbackEmail] = useState(email || '');
    const [showEmailInput, setShowEmailInput] = useState(false);

    useEffect(() => {
        if (email) setFallbackEmail(email);
    }, [email]);

    useEffect(() => {
        if (phone && !email && !fallbackEmail) {
            setMode('phone');
        } else if ((email || fallbackEmail) && !phone) {
            setMode('email');
        } else if (initialMode) {
            setMode(initialMode);
        }
    }, [isOpen, initialMode, email, phone, fallbackEmail]);
    
    // 6-digit code array
    const [digits, setDigits] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    // Firebase Phone Auth confirmation object
    const [confirmationResult, setConfirmationResult] = useState(null);
    const recaptchaVerifierRef = useRef(null);
    const inputRefs = useRef([]);

    // Mask display
    const maskEmail = (str) => {
        if (!str || !str.includes('@')) return str || 'your email';
        const [name, domain] = str.split('@');
        if (name.length <= 2) return `${name[0]}*@${domain}`;
        return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}@${domain}`;
    };

    const maskPhone = (str) => {
        if (!str) return 'your phone';
        const clean = str.replace(/\s+/g, '');
        if (clean.length < 6) return clean;
        return `${clean.slice(0, 3)} **** ${clean.slice(-4)}`;
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

    // Cleanup Recaptcha on unmount or close
    useEffect(() => {
        return () => {
            if (recaptchaVerifierRef.current) {
                try {
                    recaptchaVerifierRef.current.clear();
                } catch (e) {
                    // Ignore cleanup error
                }
                recaptchaVerifierRef.current = null;
            }
        };
    }, []);

    // Send Phone SMS via Firebase
    const sendPhoneSms = async (targetPhone) => {
        const fullPhone = targetPhone.startsWith('+') ? targetPhone : `+91${targetPhone.replace(/^0+/, '')}`;
        setError('');
        setResendLoading(true);

        try {
            // Setup reCAPTCHA
            const container = document.getElementById('recaptcha-container');
            if (container) container.innerHTML = '';

            if (!recaptchaVerifierRef.current) {
                recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    size: 'invisible',
                    callback: () => {}
                });
            }

            const confirmation = await signInWithPhoneNumber(auth, fullPhone, recaptchaVerifierRef.current);
            setConfirmationResult(confirmation);
            setTimer(60);
            setCanResend(false);
            setSuccessMessage(`SMS OTP sent to ${maskPhone(fullPhone)}`);
            setTimeout(() => setSuccessMessage(''), 3500);
        } catch (err) {
            console.error('Firebase Phone Auth Error:', err);
            let rawMsg = err.message || '';
            let formattedError = rawMsg.replace('Firebase: ', '');

            if (rawMsg.includes('api-key-not-valid') || rawMsg.includes('auth/invalid-api-key')) {
                formattedError = 'Phone Auth is not yet enabled in Firebase Console (Click "Get Started" in Firebase -> Authentication). You can verify with Gmail OTP below!';
                setShowEmailInput(true);
            } else if (rawMsg.includes('captcha-check-failed') || rawMsg.includes('app-not-authorized')) {
                formattedError = 'SMS domain not whitelisted. Add your URL to Firebase Authorized Domains, or verify with Gmail OTP below.';
                setShowEmailInput(true);
            } else if (rawMsg.includes('quota-exceeded')) {
                formattedError = 'SMS quota reached. Please use Gmail verification below.';
                setShowEmailInput(true);
            }

            setError(formattedError);
            if (recaptchaVerifierRef.current) {
                try { recaptchaVerifierRef.current.clear(); } catch (e) {}
                recaptchaVerifierRef.current = null;
            }
        } finally {
            setResendLoading(false);
        }
    };

    // Send Email OTP via Resend
    const sendEmailOtp = async (targetEmail) => {
        const dest = (targetEmail || fallbackEmail || email || '').trim();
        if (!dest || !dest.includes('@')) {
            setError('Please enter a valid Gmail / email address.');
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
                setSuccessMessage(`Email code sent to ${maskEmail(dest)}`);
                setTimeout(() => setSuccessMessage(''), 3500);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to deliver email OTP');
        } finally {
            setResendLoading(false);
        }
    };

    // Initialize when modal opens or mode changes
    useEffect(() => {
        if (isOpen) {
            setDigits(['', '', '', '', '', '']);
            setError('');
            setSuccessMessage('');
            setTimer(60);
            setCanResend(false);

            if (mode === 'email' && email) {
                sendEmailOtp(email);
            } else if (mode === 'phone' && phone) {
                sendPhoneSms(phone);
            }

            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 150);
        }
    }, [isOpen, mode]);

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
            if (mode === 'phone') {
                if (!confirmationResult) {
                    throw new Error('No active SMS confirmation found. Please request a new code.');
                }
                const result = await confirmationResult.confirm(code);
                setSuccessMessage('Phone identity verified successfully!');
                setTimeout(() => {
                    if (onSuccess) onSuccess({ method: 'phone', user: result.user });
                    onClose();
                }, 800);
            } else {
                // Email verification via Resend
                const dest = (fallbackEmail || email || '').trim();
                const res = await axios.post('/api/otp/verify', {
                    email: dest,
                    otp: code,
                    purpose
                });

                if (res.data.success) {
                    setSuccessMessage('Email identity verified successfully!');
                    setTimeout(() => {
                        if (onSuccess) onSuccess({ method: 'email', ...res.data, verifiedTarget: dest });
                        onClose();
                    }, 800);
                }
            }
        } catch (err) {
            console.error('Verification error:', err);
            setError(
                err.response?.data?.message || 
                err.message?.replace('Firebase: ', '') || 
                'Invalid code. Please check and try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResend = () => {
        if (!canResend || resendLoading) return;
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        if (mode === 'email' && email) {
            sendEmailOtp(email);
        } else if (mode === 'phone' && phone) {
            sendPhoneSms(phone);
        }
    };

    if (!isOpen) return null;

    const isComplete = digits.every(d => d !== '');

    return (
        <AnimatePresence>
            <div className="otp-modal-backdrop" onClick={onClose}>
                {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
                <div id="recaptcha-container"></div>

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

                    <div className="otp-modal-header">
                        <div className="otp-emblem-circle">
                            <ShieldCheck size={30} />
                        </div>
                        <h4 className="fw-extrabold text-main mb-1" style={{ letterSpacing: '-0.02em', fontSize: '1.25rem' }}>
                            {title}
                        </h4>

                        {/* Dual Mode Switcher (if both email & phone are available) */}
                        {email && phone && (
                            <div className="d-flex justify-content-center gap-2 mt-2.5">
                                <button
                                    type="button"
                                    onClick={() => { setMode('email'); }}
                                    className={`btn btn-sm rounded-pill px-3 py-1 fw-bold extra-tiny d-flex align-items-center gap-1.5 transition-all ${mode === 'email' ? 'btn-primary' : 'btn-light border'}`}
                                >
                                    <Mail size={12} /> Email Code
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setMode('phone'); }}
                                    className={`btn btn-sm rounded-pill px-3 py-1 fw-bold extra-tiny d-flex align-items-center gap-1.5 transition-all ${mode === 'phone' ? 'btn-primary' : 'btn-light border'}`}
                                >
                                    <Phone size={12} /> Phone SMS
                                </button>
                            </div>
                        )}

                        <p className="extra-tiny text-muted mb-0 mt-2 d-flex align-items-center justify-content-center gap-1.5">
                            {mode === 'phone' ? <Phone size={13} className="text-primary" /> : <Mail size={13} className="text-primary" />}
                            <span>Sent to: <strong className="text-main">{mode === 'phone' ? maskPhone(phone) : maskEmail(email)}</strong></span>
                        </p>
                    </div>

                    <div className="p-4">
                        <p className="small text-muted text-center mb-1" style={{ fontSize: '0.85rem' }}>
                            {description || `Enter the 6-digit code dispatched to ${mode === 'phone' ? 'your mobile phone' : 'your email address'}.`}
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
                            <span className="extra-tiny text-muted me-1">Didn't receive the {mode === 'phone' ? 'SMS' : 'email'}?</span>
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

                        {/* Direct switch to Gmail OTP fallback */}
                        {mode === 'phone' && (
                            <div className="mt-3 pt-2 text-center border-top" style={{ borderColor: 'var(--glass-border)' }}>
                                {!showEmailInput ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowEmailInput(true)}
                                        className="btn btn-link extra-tiny text-decoration-none fw-bold p-0 text-primary d-inline-flex align-items-center gap-1"
                                    >
                                        <Mail size={12} /> Switch to Gmail OTP verification
                                    </button>
                                ) : (
                                    <div className="p-2.5 rounded-3 border mt-1 text-start" style={{ background: 'var(--input-bg)' }}>
                                        <label className="extra-tiny fw-bold text-muted text-uppercase mb-1 d-block">
                                            Receive 6-Digit OTP via Gmail:
                                        </label>
                                        <div className="d-flex gap-1.5">
                                            <input
                                                type="email"
                                                placeholder="Enter your Gmail address"
                                                value={fallbackEmail}
                                                onChange={(e) => setFallbackEmail(e.target.value)}
                                                className="form-control form-control-sm extra-tiny rounded-3"
                                                style={{ fontSize: '0.8rem' }}
                                            />
                                            <button
                                                type="button"
                                                disabled={resendLoading || !fallbackEmail || !fallbackEmail.includes('@')}
                                                onClick={() => {
                                                    setMode('email');
                                                    sendEmailOtp(fallbackEmail);
                                                }}
                                                className="btn btn-primary btn-sm extra-tiny fw-bold px-3 rounded-3 text-nowrap"
                                            >
                                                {resendLoading ? 'Sending...' : 'Send to Gmail'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default OtpModal;
