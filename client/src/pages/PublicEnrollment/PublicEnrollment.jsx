import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
    Users, User, Heart, Phone, Mail, MapPin, Tag, Gift, DollarSign, 
    Sparkles, CheckCircle2, ShieldCheck, Share2, Copy, Check, 
    Printer, ArrowRight, AlertCircle, Building2, Calendar, ChevronDown,
    Award, Layers, HelpCircle, MessageSquare, Upload, X, CreditCard, Camera
} from 'lucide-react'
import axios from 'axios'
import logoImage from '../../images/logo-emblem.png'
import './PublicEnrollment.css'

export default function PublicEnrollment() {
    const { slug } = useParams()
    const [loading, setLoading] = useState(true)
    const [portal, setPortal] = useState(null)
    const [error, setError] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [submittedData, setSubmittedData] = useState(null)
    const [copied, setCopied] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        countryCode: '+91',
        email: '',
        address: '',
        roleInterest: 'Committee Member',
        departmentInterest: 'Core Committee',
        notes: '',
        donate: false,
        estimatedAmount: '',
        contributionItem: '',
        category: 'Cash',
        paymentMode: 'Pledged',
        payeeName: '',
        payeeNumber: '',
        transactionRefId: '',
        receiptImage: ''
    })

    useEffect(() => {
        const fetchPortal = async () => {
            try {
                setLoading(true)
                setError(null)
                const endpoint = slug && slug !== 'latest' 
                    ? `/api/enrollments/public/${slug}` 
                    : '/api/enrollments/public-latest'
                const res = await axios.get(endpoint)
                setPortal(res.data)
                if (res.data.suggestedRoles && res.data.suggestedRoles.length > 0) {
                    setFormData(prev => ({ 
                        ...prev, 
                        roleInterest: res.data.suggestedRoles[0],
                        departmentInterest: (res.data.suggestedDepts && res.data.suggestedDepts[0]) || 'Core Committee'
                    }))
                }
                if (res.data.defaultPayeeName || res.data.defaultPayeeNumber) {
                    setFormData(prev => ({
                        ...prev,
                        payeeName: prev.payeeName || res.data.defaultPayeeName || '',
                        payeeNumber: prev.payeeNumber || res.data.defaultPayeeNumber || ''
                    }))
                }
            } catch (err) {
                console.error('Error loading enrollment portal:', err)
                setError(err.response?.data?.message || 'Enrollment link is currently unavailable or has expired.')
            } finally {
                setLoading(false)
            }
        }
        fetchPortal()
    }, [slug])

    const currencySymbol = portal?.currency || '₹'

    const handleReceiptUpload = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 8 * 1024 * 1024) {
            alert('Receipt image size exceeds 8MB. Please select a smaller photo or screenshot.')
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            const base64Data = reader.result
            setFormData(prev => ({ ...prev, receiptImage: base64Data }))

            // Optional background upload
            const uploadData = new FormData()
            uploadData.append('file', file)
            axios.post('/api/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            }).then(res => {
                if (res.data?.url) {
                    setFormData(prev => ({ ...prev, receiptImage: res.data.url }))
                }
            }).catch(err => {
                console.log('Background upload note (using base64):', err?.message)
            })
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            alert('Please enter your full legal name.')
            return
        }
        if (!formData.contact.trim()) {
            alert('Please enter your mobile or WhatsApp number.')
            return
        }

        // Validate UPI / Online Transfer compulsory fields
        if (formData.donate && formData.paymentMode === 'UPI / Online') {
            if (!formData.payeeName.trim()) {
                alert('Please enter "To Whom Paid (Name)" for UPI transfer verification.')
                return
            }
            if (!formData.payeeNumber.trim()) {
                alert('Please enter "Paid To (Phone / UPI ID)" for UPI transfer verification.')
                return
            }
            if (!formData.transactionRefId.trim()) {
                alert('Please enter Transaction Reference ID / UTR Number.')
                return
            }
            if (!formData.receiptImage) {
                alert('Image of payment receipt is COMPULSORY for UPI / Online Transfer. Please upload your payment receipt screenshot before submitting.')
                return
            }
        }

        try {
            setSubmitting(true)
            const res = await axios.post(`/api/enrollments/public/${slug}/submit`, {
                ...formData,
                currency: currencySymbol,
                estimatedAmount: Number(formData.estimatedAmount) || 0
            })
            setSubmittedData(res.data)
        } catch (err) {
            console.error('Submission failed:', err)
            alert(err.response?.data?.message || 'Failed to submit enrollment. Please check your connection and try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleCopyRef = () => {
        if (submittedData?.referenceId) {
            navigator.clipboard.writeText(submittedData.referenceId)
            setCopied(true)
            setTimeout(() => setCopied(false), 2500)
        }
    }

    const shareWhatsAppConfirmation = () => {
        if (!submittedData) return
        const cur = submittedData.currency || currencySymbol
        const text = `🎉 I have registered for ${submittedData.festOrEventName}!%0A` +
            `👤 Name: ${submittedData.name}%0A` +
            `🔖 Role: ${submittedData.roleInterest}%0A` +
            (submittedData.estimatedAmount ? `💰 Pledged Contribution: ${cur}${Number(submittedData.estimatedAmount).toLocaleString('en-IN')}%0A` : '') +
            (submittedData.contributionItem ? `🎁 Contribution Item: ${submittedData.contributionItem}%0A` : '') +
            `🆔 Reference Code: ${submittedData.referenceId}%0A` +
            `Register your participation here: ${window.location.href}`
        window.open(`https://wa.me/?text=${text}`, '_blank')
    }

    // Quick role presets for 1-click chip selection
    const rolePresets = portal?.suggestedRoles?.length 
        ? portal.suggestedRoles 
        : ['Committee Member', 'Ground Volunteer', 'Cultural Coordinator', 'Logistics & Security', 'Executive Wing', 'Other Supporter']

    const deptPresets = portal?.suggestedDepts?.length
        ? portal.suggestedDepts
        : ['Core Committee', 'Executive Wing', 'Cultural & Events', 'Logistics & Security', 'Finance & Donations']

    if (loading) {
        return (
            <div className="pe-page-wrapper d-flex flex-column align-items-center justify-content-center p-3">
                <div className="pe-emblem-badge mb-3 shadow-md">
                    <img src={logoImage} alt="VishwaUtsav" style={{ height: '38px', width: 'auto' }} />
                </div>
                <div className="spinner-border text-terracotta mb-3" role="status" style={{ width: '2.5rem', height: '2.5rem', borderWidth: '3px' }}></div>
                <h6 className="fw-extrabold text-main mb-1" style={{ letterSpacing: '-0.01em' }}>Loading Official Enrollment Portal...</h6>
                <p className="extra-tiny text-muted">Preparing registration details and festival configuration</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="pe-page-wrapper d-flex flex-column align-items-center justify-content-center p-3">
                <div className="pe-luxury-card p-4 p-sm-5 text-center shadow-2xl" style={{ maxWidth: '480px' }}>
                    <div className="d-flex align-items-center justify-content-center mx-auto mb-3 rounded-circle" style={{ width: '64px', height: '64px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}>
                        <AlertCircle size={32} />
                    </div>
                    <h5 className="fw-extrabold text-main mb-2">Enrollment Link Inactive</h5>
                    <p className="text-muted extra-tiny mb-4" style={{ lineHeight: '1.6' }}>{error}</p>
                    <Link to="/" className="pe-btn-submit text-decoration-none d-inline-flex px-4" style={{ height: '46px', fontSize: '0.88rem' }}>
                        Return to VishwaUtsav Home
                    </Link>
                </div>
            </div>
        )
    }

    // Success Screen (Apple Wallet / Digital Pass style)
    if (submittedData) {
        return (
            <div className="pe-page-wrapper py-4 py-sm-5 px-3 d-flex align-items-center justify-content-center">
                <div className="pe-container">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="pe-slip-card"
                    >
                        {/* Notch Circles */}
                        <div className="pe-slip-notch-left"></div>
                        <div className="pe-slip-notch-right"></div>

                        {/* Slip Header */}
                        <div className="pe-slip-header">
                            <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-white shadow-sm mb-3" style={{ width: '60px', height: '60px', color: '#16a34a' }}>
                                <CheckCircle2 size={34} />
                            </div>
                            <span className="badge rounded-pill bg-white text-dark fw-extrabold px-3 py-1 extra-tiny mb-2 shadow-2xs">
                                OFFICIAL REGISTRATION PASS
                            </span>
                            <h3 className="fw-black text-white mb-1" style={{ letterSpacing: '-0.02em' }}>
                                Registration Confirmed!
                            </h3>
                            <p className="text-white text-opacity-90 extra-tiny mb-0" style={{ maxWidth: '420px', margin: '0 auto' }}>
                                Thank you, <span className="fw-bold">{submittedData.name}</span>. Your enrollment for <strong>{submittedData.festOrEventName}</strong> has been successfully recorded.
                            </p>
                        </div>

                        {/* Slip Body */}
                        <div className="pe-slip-body">
                            {/* Reference ID Card */}
                            <div className="p-3.5 rounded-3 mb-4 text-start border shadow-2xs" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
                                <div className="d-flex align-items-center justify-content-between mb-1.5">
                                    <span className="extra-tiny text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.6px' }}>
                                        Enrollment Reference Code
                                    </span>
                                    <button 
                                        type="button"
                                        onClick={handleCopyRef} 
                                        className="btn btn-sm btn-link p-0 extra-tiny text-decoration-none fw-bold text-terracotta d-flex align-items-center gap-1"
                                    >
                                        {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                                        <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
                                    </button>
                                </div>
                                <div className="fw-black font-monospace text-main" style={{ fontSize: '1.4rem', letterSpacing: '2px', color: '#b45309' }}>
                                    {submittedData.referenceId}
                                </div>
                                <div className="extra-tiny text-muted mt-1.5" style={{ fontSize: '0.72rem' }}>
                                    Keep or screenshot this reference ID for official check-in, identity badge, and pass collection.
                                </div>
                            </div>

                            {/* Summary Details */}
                            <div className="p-3.5 rounded-3 mb-4 text-start border bg-light extra-tiny">
                                <div className="d-flex justify-content-between py-2 border-bottom">
                                    <span className="text-muted fw-semibold">Festival / Event:</span>
                                    <span className="fw-bold text-main">{submittedData.festOrEventName}</span>
                                </div>
                                <div className="d-flex justify-content-between py-2 border-bottom">
                                    <span className="text-muted fw-semibold">Participant Name:</span>
                                    <span className="fw-bold text-main">{submittedData.name}</span>
                                </div>
                                <div className="d-flex justify-content-between py-2 border-bottom">
                                    <span className="text-muted fw-semibold">Role Interest:</span>
                                    <span className="fw-bold text-primary">{submittedData.roleInterest}</span>
                                </div>
                                <div className="d-flex justify-content-between py-2 border-bottom">
                                    <span className="text-muted fw-semibold">Department / Wing:</span>
                                    <span className="fw-bold text-main">{submittedData.departmentInterest || 'Core Committee'}</span>
                                </div>
                                {Number(submittedData.estimatedAmount) > 0 && (
                                    <div className="d-flex justify-content-between py-2 border-bottom">
                                        <span className="text-muted fw-semibold">Pledged Support:</span>
                                        <span className="fw-black text-success" style={{ fontSize: '0.85rem' }}>
                                            {submittedData.currency || currencySymbol}{Number(submittedData.estimatedAmount).toLocaleString('en-IN')} ({submittedData.paymentMode || 'Pledged'})
                                        </span>
                                    </div>
                                )}
                                {submittedData.paymentMode === 'UPI / Online' && (
                                    <>
                                        {submittedData.payeeName && (
                                            <div className="d-flex justify-content-between py-2 border-bottom">
                                                <span className="text-muted fw-semibold">Paid To (Payee):</span>
                                                <span className="fw-bold text-main">{submittedData.payeeName} {submittedData.payeeNumber ? `(${submittedData.payeeNumber})` : ''}</span>
                                            </div>
                                        )}
                                        {submittedData.transactionRefId && (
                                            <div className="d-flex justify-content-between py-2 border-bottom">
                                                <span className="text-muted fw-semibold">UTR / Bank Ref:</span>
                                                <span className="fw-bold text-main font-monospace">{submittedData.transactionRefId}</span>
                                            </div>
                                        )}
                                        {submittedData.receiptImage && (
                                            <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                                                <span className="text-muted fw-semibold">Payment Receipt:</span>
                                                <span className="badge bg-success bg-opacity-15 text-success border border-success border-opacity-30 extra-tiny px-2 py-1">
                                                    ✓ Receipt Photo Uploaded
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}
                                {submittedData.contributionItem && (
                                    <div className="d-flex justify-content-between py-2">
                                        <span className="text-muted fw-semibold">Material / In-Kind Item:</span>
                                        <span className="fw-bold text-main">{submittedData.contributionItem}</span>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="d-flex align-items-center justify-content-center gap-2.5 flex-wrap">
                                <button 
                                    onClick={shareWhatsAppConfirmation} 
                                    className="btn btn-success rounded-pill px-4 py-2.5 fw-bold extra-tiny shadow-sm d-inline-flex align-items-center gap-2"
                                    style={{ height: '44px' }}
                                >
                                    <Share2 size={15} />
                                    <span>Share Slip on WhatsApp</span>
                                </button>
                                <button 
                                    onClick={() => window.print()} 
                                    className="btn btn-light border rounded-pill px-4 py-2.5 fw-bold extra-tiny shadow-2xs d-inline-flex align-items-center gap-2"
                                    style={{ height: '44px' }}
                                >
                                    <Printer size={15} />
                                    <span>Print Registration Pass</span>
                                </button>
                            </div>

                            <div className="mt-4 pt-3 border-top text-center">
                                <Link to="/" className="text-muted extra-tiny text-decoration-none hover-text-main fw-bold d-inline-flex align-items-center gap-1">
                                    ← Return to VishwaUtsav Home
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        )
    }

    return (
        <div className="pe-page-wrapper">
            <div className="container pe-container">
                {/* Brand Hero Header */}
                <div className="pe-brand-hero">
                    <div className="pe-emblem-badge">
                        <img src={logoImage} alt="VishwaUtsav" style={{ height: '42px', width: 'auto' }} />
                    </div>

                    <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap mb-2">
                        <span className="pe-tag-celebration">
                            <Calendar size={13} />
                            <span>{portal?.festOrEventName}</span>
                        </span>
                        {portal?.entityName && (
                            <span className="pe-tag-entity">
                                <Building2 size={12} className="text-primary" />
                                <span>{portal.entityName}</span>
                            </span>
                        )}
                    </div>

                    <h1 className="pe-hero-title">
                        {portal?.title || `${portal?.festOrEventName} — Official Committee & Donor Enrollment`}
                    </h1>

                    <p 
                        className="pe-hero-subtitle"
                        title={portal?.description || `Open public registration for committee members, volunteers, and patrons for ${portal?.festOrEventName}.`}
                    >
                        {portal?.description || `Open public registration for committee members, volunteers, and patrons for ${portal?.festOrEventName}.`}
                    </p>

                    <div className="text-center">
                        <div className="pe-trust-strip">
                            <ShieldCheck size={14} className="text-success" />
                            <span>Verified VishwaUtsav Public Enrollment Portal • Safe &amp; Secure</span>
                        </div>
                    </div>
                </div>

                {/* Main Luxury Enrollment Card */}
                <div className="pe-luxury-card">
                    <form onSubmit={handleSubmit}>
                        {/* =========================================================================
                            SECTION 1: PERSONAL & CONTACT DETAILS
                            ========================================================================= */}
                        <div className="mb-4 pb-2">
                            <div className="pe-section-header">
                                <div className="pe-section-icon-box">
                                    <Users size={18} />
                                </div>
                                <div>
                                    <span className="pe-section-step-chip">Step 1 of 3</span>
                                    <h2 className="pe-section-title">Personal &amp; Contact Details</h2>
                                </div>
                            </div>

                            <div className="row g-3">
                                {/* Full Legal Name */}
                                <div className="col-12">
                                    <label className="pe-label">
                                        <span>Full Legal Name <span className="pe-label-required">*</span></span>
                                    </label>
                                    <div className="pe-input-box">
                                        <User size={16} className="pe-field-icon" />
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Ramesh Kumar Verma"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="pe-field-control"
                                        />
                                    </div>
                                </div>

                                {/* WhatsApp / Mobile Number */}
                                <div className="col-12 col-md-6">
                                    <label className="pe-label">
                                        <span>WhatsApp / Mobile Number <span className="pe-label-required">*</span></span>
                                    </label>
                                    <div className="pe-input-box">
                                        <Phone size={16} className="pe-field-icon" />
                                        <span className="pe-phone-country-pill">🇮🇳 +91</span>
                                        <input
                                            type="tel"
                                            required
                                            placeholder="10-digit mobile number"
                                            value={formData.contact}
                                            onChange={e => setFormData({ ...formData, contact: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                                            className="pe-field-control"
                                        />
                                    </div>
                                </div>

                                {/* Email Address (Optional) */}
                                <div className="col-12 col-md-6">
                                    <label className="pe-label">
                                        <span>Email Address</span>
                                        <span className="pe-label-optional">(optional)</span>
                                    </label>
                                    <div className="pe-input-box">
                                        <Mail size={16} className="pe-field-icon" />
                                        <input
                                            type="email"
                                            placeholder="e.g. member@gmail.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="pe-field-control"
                                        />
                                    </div>
                                </div>

                                {/* Locality / Residential Address */}
                                <div className="col-12">
                                    <label className="pe-label">
                                        <span>Locality / Residential Address</span>
                                        <span className="pe-label-optional">(optional)</span>
                                    </label>
                                    <div className="pe-input-box">
                                        <MapPin size={16} className="pe-field-icon" />
                                        <input
                                            type="text"
                                            placeholder="e.g. Sakaripara Main Road, Ward No. 4"
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            className="pe-field-control"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* =========================================================================
                            SECTION 2: COMMITTEE & VOLUNTEER PREFERENCE
                            ========================================================================= */}
                        <div className="mb-4 pb-2">
                            <div className="pe-section-header">
                                <div className="pe-section-icon-box">
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <span className="pe-section-step-chip">Step 2 of 3</span>
                                    <h2 className="pe-section-title">Committee &amp; Volunteer Preference</h2>
                                </div>
                            </div>

                            {/* Desired Role 1-Tap Chips */}
                            <div className="mb-3">
                                <label className="pe-label">
                                    <span>Desired Role / Contribution Area <span className="pe-label-required">*</span></span>
                                    <span className="pe-label-optional">Tap to select</span>
                                </label>
                                <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                                    {rolePresets.map(role => (
                                        <button
                                            type="button"
                                            key={role}
                                            onClick={() => setFormData({ ...formData, roleInterest: role })}
                                            className={`pe-role-chip ${formData.roleInterest === role ? 'active' : ''}`}
                                        >
                                            {formData.roleInterest === role && <Check size={12} />}
                                            <span>{role}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="pe-select-wrapper">
                                    <select
                                        value={formData.roleInterest}
                                        onChange={e => setFormData({ ...formData, roleInterest: e.target.value })}
                                        className="pe-select-box"
                                    >
                                        {rolePresets.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="pe-select-chevron" />
                                </div>
                            </div>

                            {/* Department / Wing Preference */}
                            <div className="mb-3">
                                <label className="pe-label">
                                    <span>Department / Wing Preference</span>
                                    <span className="pe-label-optional">Optional choice</span>
                                </label>
                                <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                                    {deptPresets.map(dept => (
                                        <button
                                            type="button"
                                            key={dept}
                                            onClick={() => setFormData({ ...formData, departmentInterest: dept })}
                                            className={`pe-role-chip ${formData.departmentInterest === dept ? 'active' : ''}`}
                                        >
                                            {formData.departmentInterest === dept && <Check size={12} />}
                                            <span>{dept}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="pe-select-wrapper">
                                    <select
                                        value={formData.departmentInterest}
                                        onChange={e => setFormData({ ...formData, departmentInterest: e.target.value })}
                                        className="pe-select-box"
                                    >
                                        {deptPresets.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="pe-select-chevron" />
                                </div>
                            </div>
                        </div>

                        {/* =========================================================================
                            SECTION 3: OPTIONAL DONATION / PLEDGE SUPPORT (BENTO CAPSULE)
                            ========================================================================= */}
                        {portal?.acceptDonations && (
                            <div className="pe-donation-bento">
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="pe-section-icon-box icon-amber" style={{ width: '34px', height: '34px' }}>
                                            <Gift size={16} />
                                        </div>
                                        <div>
                                            <span className="pe-section-step-chip" style={{ color: '#b45309' }}>Step 3 (Optional)</span>
                                            <h3 className="pe-section-title" style={{ fontSize: '0.98rem' }}>Optional Donation / Pledge Support</h3>
                                        </div>
                                    </div>
                                    <div className="form-check form-switch mb-0">
                                        <input
                                            type="checkbox"
                                            id="donateToggle"
                                            checked={formData.donate}
                                            onChange={e => setFormData({ ...formData, donate: e.target.checked })}
                                            className="form-check-input pe-donation-toggle-switch"
                                        />
                                    </div>
                                </div>

                                <p className="extra-tiny text-muted mb-0" style={{ lineHeight: '1.5' }}>
                                    Would you also like to pledge a donation or sponsor an item for <strong>{portal?.festOrEventName}</strong>? (Completely optional)
                                </p>

                                {formData.donate && (
                                    <div className="pe-donation-expandable pt-3 mt-3 border-top border-warning border-opacity-30">
                                        {/* Suggested Amount Chips */}
                                        <div className="mb-3">
                                            <label className="pe-label">
                                                <span>Suggested Contribution Amount ({currencySymbol})</span>
                                                <span className="pe-label-optional">Tap to choose</span>
                                            </label>
                                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                                {(portal?.suggestedAmounts || [501, 1001, 2100, 5001]).map(amt => (
                                                    <button
                                                        key={amt}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, estimatedAmount: amt })}
                                                        className={`pe-amount-chip ${Number(formData.estimatedAmount) === amt ? 'active' : ''}`}
                                                    >
                                                        {currencySymbol}{amt.toLocaleString('en-IN')}
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, estimatedAmount: '' })}
                                                    className={`pe-amount-chip ${!portal?.suggestedAmounts?.includes(Number(formData.estimatedAmount)) && formData.estimatedAmount ? 'active' : ''}`}
                                                >
                                                    Custom Amount
                                                </button>
                                            </div>
                                        </div>

                                        <div className="row g-3">
                                            {/* Estimated Cash Amount */}
                                            <div className="col-12 col-md-6">
                                                <label className="pe-label">
                                                    <span>Estimated Cash Amount ({currencySymbol})</span>
                                                </label>
                                                <div className="pe-input-box">
                                                    <span className="fw-black text-success fs-5 px-1 d-inline-flex align-items-center justify-content-center" style={{ minWidth: '22px' }}>
                                                        {currencySymbol}
                                                    </span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        placeholder="e.g. 1000"
                                                        value={formData.estimatedAmount}
                                                        onChange={e => setFormData({ ...formData, estimatedAmount: e.target.value })}
                                                        className="pe-field-control"
                                                    />
                                                </div>
                                            </div>

                                            {/* In-Kind / Material Item */}
                                            <div className="col-12 col-md-6">
                                                <label className="pe-label">
                                                    <span>In-Kind / Material Item</span>
                                                    <span className="pe-label-optional">(optional)</span>
                                                </label>
                                                <div className="pe-input-box">
                                                    <Gift size={16} className="pe-field-icon text-warning" />
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Prasad, 500 Water Bottles, Flowers"
                                                        value={formData.contributionItem}
                                                        onChange={e => setFormData({ ...formData, contributionItem: e.target.value })}
                                                        className="pe-field-control"
                                                    />
                                                </div>
                                            </div>

                                            {/* Preferred Payment Mode */}
                                            <div className="col-12 col-md-6">
                                                <label className="pe-label">
                                                    <span>Payment / Contribution Mode</span>
                                                </label>
                                                <div className="pe-select-wrapper">
                                                    <select
                                                        value={formData.paymentMode}
                                                        onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}
                                                        className="pe-select-box"
                                                    >
                                                        <option value="Pledged">Pledged (Will contribute during event/festival)</option>
                                                        <option value="Cash">Cash in hand</option>
                                                        <option value="UPI / Online">UPI / Online Transfer</option>
                                                        <option value="In-Kind / Material">In-Kind Goods / Materials</option>
                                                    </select>
                                                    <ChevronDown size={16} className="pe-select-chevron" />
                                                </div>
                                            </div>

                                            {/* Category */}
                                            <div className="col-12 col-md-6">
                                                <label className="pe-label">
                                                    <span>Donation Category</span>
                                                </label>
                                                <div className="pe-select-wrapper">
                                                    <select
                                                        value={formData.category}
                                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                        className="pe-select-box"
                                                    >
                                                        <option value="Cash">Cash Donation</option>
                                                        <option value="Food / Prasad">Food / Prasad Seva</option>
                                                        <option value="Stage & Sound">Stage &amp; Sound</option>
                                                        <option value="In-Kind Services">In-Kind Services</option>
                                                        <option value="Logistics & Security">Logistics &amp; Security</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                    <ChevronDown size={16} className="pe-select-chevron" />
                                                </div>
                                            </div>

                                            {/* UPI / ONLINE TRANSFER DEDICATED VERIFICATION CARD */}
                                            {formData.paymentMode === 'UPI / Online' && (
                                                <div className="col-12">
                                                    <div className="pe-upi-card">
                                                        {/* Luxury Card Header */}
                                                        <div className="pe-upi-header">
                                                            <div className="d-flex align-items-center gap-2.5">
                                                                <div className="pe-upi-icon-badge">
                                                                    <CreditCard size={18} />
                                                                </div>
                                                                <div>
                                                                    <h4 className="pe-upi-title">
                                                                        UPI &amp; Online Transfer Verification
                                                                    </h4>
                                                                    <p className="pe-upi-subtitle mb-0">
                                                                        Direct community contribution via UPI, GPay, PhonePe, Paytm, or NetBanking
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <span className="pe-compulsory-badge">
                                                                <ShieldCheck size={13} />
                                                                <span>Receipt Photo Compulsory *</span>
                                                            </span>
                                                        </div>

                                                        <div className="row g-3">
                                                            {/* To Whom Paid Name */}
                                                            <div className="col-12 col-sm-6">
                                                                <label className="pe-label mb-1.5">
                                                                    <span>To Whom to Pay Name</span>
                                                                    <span className="text-danger fw-bold ms-1">*</span>
                                                                </label>
                                                                <div className="pe-input-box">
                                                                    <User size={15} className="pe-field-icon text-muted" />
                                                                    <input
                                                                        type="text"
                                                                        required
                                                                        placeholder="e.g. Ramesh Kumar (Treasurer)"
                                                                        value={formData.payeeName}
                                                                        onChange={e => setFormData({ ...formData, payeeName: e.target.value })}
                                                                        className="pe-field-control"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* To Whom Paid Number / UPI ID */}
                                                            <div className="col-12 col-sm-6">
                                                                <label className="pe-label mb-1.5">
                                                                    <span>To Whom to Pay Number / UPI ID</span>
                                                                    <span className="text-danger fw-bold ms-1">*</span>
                                                                </label>
                                                                <div className="pe-input-box">
                                                                    <Phone size={15} className="pe-field-icon text-muted" />
                                                                    <input
                                                                        type="text"
                                                                        required
                                                                        placeholder="e.g. 9876543210 or utsav@upi"
                                                                        value={formData.payeeNumber}
                                                                        onChange={e => setFormData({ ...formData, payeeNumber: e.target.value })}
                                                                        className="pe-field-control"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Reference ID / UTR */}
                                                            <div className="col-12">
                                                                <label className="pe-label mb-1.5">
                                                                    <span>Transaction Reference ID / UTR Number</span>
                                                                    <span className="text-danger fw-bold ms-1">*</span>
                                                                </label>
                                                                <div className="pe-input-box">
                                                                    <CreditCard size={15} className="pe-field-icon text-muted" />
                                                                    <input
                                                                        type="text"
                                                                        required
                                                                        placeholder="e.g. 12-digit UTR No. (429182740192) or Bank Ref ID"
                                                                        value={formData.transactionRefId}
                                                                        onChange={e => setFormData({ ...formData, transactionRefId: e.target.value })}
                                                                        className="pe-field-control font-monospace"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Image of Receipt (COMPULSORY) */}
                                                            <div className="col-12">
                                                                <label className="pe-label mb-1.5 d-flex align-items-center justify-content-between flex-wrap gap-1">
                                                                    <span className="d-flex align-items-center gap-1.5">
                                                                        <Camera size={14} className="text-terracotta" />
                                                                        <span>Image of Payment Receipt</span>
                                                                        <span className="text-danger fw-bold ms-1">* (Compulsory)</span>
                                                                    </span>
                                                                    {formData.receiptImage && (
                                                                        <span className="text-success fw-bold extra-tiny d-inline-flex align-items-center gap-1">
                                                                            <CheckCircle2 size={13} />
                                                                            <span>Receipt Attached &amp; Ready</span>
                                                                        </span>
                                                                    )}
                                                                </label>

                                                                {!formData.receiptImage ? (
                                                                    <label className="pe-receipt-dropzone">
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            onChange={handleReceiptUpload}
                                                                            className="position-absolute opacity-0 w-100 h-100 start-0 top-0 cursor-pointer"
                                                                            style={{ zIndex: 2 }}
                                                                        />
                                                                        <div className="pe-dropzone-icon-circle">
                                                                            <Upload size={22} />
                                                                        </div>
                                                                        <div className="pe-dropzone-title">
                                                                            Tap or Click to Upload Payment Receipt
                                                                        </div>
                                                                        <div className="pe-dropzone-subtitle">
                                                                            Screenshot from GPay, PhonePe, Paytm, BHIM, or NetBanking (JPEG, PNG, WebP up to 8MB)
                                                                        </div>
                                                                        <div className="pe-browse-btn-pill">
                                                                            <Upload size={13} />
                                                                            <span>Choose Receipt Screenshot</span>
                                                                        </div>
                                                                    </label>
                                                                ) : (
                                                                    <div className="pe-receipt-preview-card">
                                                                        <div className="d-flex align-items-center gap-3 overflow-hidden">
                                                                            <img
                                                                                src={formData.receiptImage}
                                                                                alt="Payment Receipt"
                                                                                className="pe-receipt-preview-thumb"
                                                                            />
                                                                            <div className="text-truncate">
                                                                                <div className="pe-receipt-verified-chip">
                                                                                    <CheckCircle2 size={14} />
                                                                                    <span>Payment Receipt Attached</span>
                                                                                </div>
                                                                                <div className="text-muted extra-tiny text-truncate mt-0.5">
                                                                                    {formData.transactionRefId ? `UTR: ${formData.transactionRefId}` : 'Pending admin verification'}
                                                                                </div>
                                                                                <span className="badge rounded-pill bg-success bg-opacity-10 text-success border border-success border-opacity-25 extra-tiny px-2 py-0.5 mt-1 font-monospace">
                                                                                    ✓ Image Verified
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setFormData({ ...formData, receiptImage: '' })}
                                                                            className="btn btn-sm btn-outline-danger rounded-pill extra-tiny px-3 py-1.5 d-inline-flex align-items-center gap-1.5 flex-shrink-0 fw-bold shadow-2xs"
                                                                            title="Change receipt image"
                                                                        >
                                                                            <X size={13} />
                                                                            <span>Change</span>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* =========================================================================
                            SECTION 4: NOTES / SUGGESTIONS
                            ========================================================================= */}
                        <div className="mb-4">
                            <label className="pe-label">
                                <span>Message or Special Skill Offering</span>
                                <span className="pe-label-optional">(optional)</span>
                            </label>
                            <div className="pe-textarea-box">
                                <MessageSquare size={16} className="pe-field-icon align-self-start mt-1" />
                                <textarea
                                    rows="2"
                                    placeholder="Share your availability, skills, musical talents, or festive greetings..."
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="pe-textarea-control"
                                />
                            </div>
                        </div>

                        {/* =========================================================================
                            SUBMIT CTA BUTTON
                            ========================================================================= */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="pe-btn-submit"
                        >
                            {submitting ? (
                                <>
                                    <div className="spinner-border spinner-border-sm text-white" role="status"></div>
                                    <span>Submitting Registration...</span>
                                </>
                            ) : (
                                <>
                                    <span>Complete Enrollment &amp; Register</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>

                        <div className="text-center mt-3">
                            <span className="extra-tiny text-muted d-inline-flex align-items-center gap-1.5 fw-semibold">
                                <ShieldCheck size={14} className="text-success" />
                                Official VishwaUtsav Secure Community Form • Instant Confirmation
                            </span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
