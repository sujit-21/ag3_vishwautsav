import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Users, Heart, Phone, Mail, MapPin, Tag, Gift, DollarSign, 
    Sparkles, CheckCircle2, ShieldCheck, Share2, Copy, Check, 
    Printer, ArrowRight, AlertCircle, Building2, Calendar
} from 'lucide-react'
import axios from 'axios'
import logoImage from '../../images/logo-emblem.png'

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
        paymentMode: 'Pledged'
    })

    useEffect(() => {
        const fetchPortal = async () => {
            if (!slug) {
                setError('Enrollment link is missing or invalid.')
                setLoading(false)
                return
            }
            try {
                setLoading(true)
                const res = await axios.get(`/api/enrollments/public/${slug}`)
                setPortal(res.data)
                if (res.data.suggestedRoles && res.data.suggestedRoles.length > 0) {
                    setFormData(prev => ({ 
                        ...prev, 
                        roleInterest: res.data.suggestedRoles[0],
                        departmentInterest: (res.data.suggestedDepts && res.data.suggestedDepts[0]) || 'Core Committee'
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

        try {
            setSubmitting(true)
            const res = await axios.post(`/api/enrollments/public/${slug}/submit`, {
                ...formData,
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
        const text = `🎉 I have registered for ${submittedData.festOrEventName}!%0A` +
            `👤 Name: ${submittedData.name}%0A` +
            `🔖 Role Interest: ${submittedData.roleInterest}%0A` +
            (submittedData.estimatedAmount ? `💰 Pledged Contribution: ₹${submittedData.estimatedAmount.toLocaleString('en-IN')}%0A` : '') +
            (submittedData.contributionItem ? `🎁 Contribution Item: ${submittedData.contributionItem}%0A` : '') +
            `🆔 Reference Code: ${submittedData.referenceId}%0A` +
            `Register your participation here: ${window.location.href}`
        window.open(`https://wa.me/?text=${text}`, '_blank')
    }

    if (loading) {
        return (
            <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-3" style={{ background: 'var(--bg-main, #f8fafc)' }}>
                <div className="spinner-border text-primary mb-3" role="status" style={{ width: '2.5rem', height: '2.5rem' }}></div>
                <h6 className="fw-bold text-main">Loading Enrollment Portal...</h6>
                <p className="extra-tiny text-muted">Preparing official registration form</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-3" style={{ background: 'var(--bg-main, #f8fafc)' }}>
                <div className="luxury-modal-card p-4 p-sm-5 text-center shadow-lg" style={{ maxWidth: '480px', borderRadius: '24px', background: '#ffffff' }}>
                    <div className="d-flex align-items-center justify-content-center mx-auto mb-3 rounded-circle" style={{ width: '60px', height: '60px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}>
                        <AlertCircle size={30} />
                    </div>
                    <h5 className="fw-extrabold text-main mb-2">Enrollment Unavailable</h5>
                    <p className="text-muted extra-tiny mb-4" style={{ lineHeight: '1.6' }}>{error}</p>
                    <Link to="/" className="btn btn-premium rounded-pill px-4 py-2 fw-bold extra-tiny shadow-sm text-decoration-none">
                        Return to VishwaUtsav Home
                    </Link>
                </div>
            </div>
        )
    }

    // Success Screen
    if (submittedData) {
        return (
            <div className="min-vh-100 py-4 py-sm-5 px-3 d-flex align-items-center justify-content-center" style={{ background: 'radial-gradient(120% 120% at 50% 10%, rgba(224, 122, 67, 0.08) 0%, #f8fafc 100%)' }}>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="luxury-modal-card w-100 p-4 p-sm-5 shadow-2xl text-center" 
                    style={{ maxWidth: '540px', borderRadius: '24px', background: '#ffffff', border: '1.5px solid var(--glass-border)' }}
                >
                    <div className="d-flex align-items-center justify-content-center mx-auto mb-3 rounded-circle shadow-sm" style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff' }}>
                        <CheckCircle2 size={32} />
                    </div>

                    <span className="badge rounded-pill bg-success bg-opacity-10 text-success fw-bold px-3 py-1 extra-tiny mb-2">
                        Registration Acknowledged
                    </span>

                    <h4 className="fw-extrabold text-main mb-1" style={{ letterSpacing: '-0.02em' }}>
                        Thank You, {submittedData.name}!
                    </h4>
                    <p className="text-muted extra-tiny mb-4">
                        Your application for <strong>{submittedData.festOrEventName}</strong> has been received. The executive committee will review and confirm your participation.
                    </p>

                    {/* Reference ID Card */}
                    <div className="p-3 rounded-3 mb-4 text-start border shadow-2xs" style={{ background: 'rgba(245, 158, 11, 0.06)', borderColor: 'rgba(245, 158, 11, 0.25)' }}>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="extra-tiny text-muted fw-bold uppercase">Enrollment Reference ID</span>
                            <button onClick={handleCopyRef} className="btn btn-sm btn-link p-0 extra-tiny text-decoration-none fw-bold text-terracotta d-flex align-items-center gap-1">
                                {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                            </button>
                        </div>
                        <div className="fw-black font-monospace text-main" style={{ fontSize: '1.25rem', letterSpacing: '1px' }}>
                            {submittedData.referenceId}
                        </div>
                        <div className="extra-tiny text-muted mt-1">
                            Save or screenshot this reference ID for official check-in and pass collection.
                        </div>
                    </div>

                    {/* Summary Details */}
                    <div className="p-3 rounded-3 mb-4 text-start border bg-light extra-tiny">
                        <div className="d-flex justify-content-between py-1 border-bottom">
                            <span className="text-muted">Celebration:</span>
                            <span className="fw-bold text-main">{submittedData.festOrEventName}</span>
                        </div>
                        <div className="d-flex justify-content-between py-1 border-bottom">
                            <span className="text-muted">Role Interest:</span>
                            <span className="fw-bold text-main">{submittedData.roleInterest}</span>
                        </div>
                        {submittedData.estimatedAmount > 0 && (
                            <div className="d-flex justify-content-between py-1 border-bottom">
                                <span className="text-muted">Pledged Amount:</span>
                                <span className="fw-bold text-success">₹{submittedData.estimatedAmount.toLocaleString('en-IN')}</span>
                            </div>
                        )}
                        {submittedData.contributionItem && (
                            <div className="d-flex justify-content-between py-1">
                                <span className="text-muted">Contribution:</span>
                                <span className="fw-bold text-main">{submittedData.contributionItem}</span>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
                        <button onClick={shareWhatsAppConfirmation} className="btn btn-success rounded-pill px-4 py-2 fw-bold extra-tiny shadow-sm d-inline-flex align-items-center gap-1.5">
                            <Share2 size={13} />
                            <span>Share on WhatsApp</span>
                        </button>
                        <button onClick={() => window.print()} className="btn btn-light border rounded-pill px-3.5 py-2 fw-bold extra-tiny shadow-2xs d-inline-flex align-items-center gap-1.5">
                            <Printer size={13} />
                            <span>Print Slip</span>
                        </button>
                    </div>

                    <div className="mt-4 pt-3 border-top">
                        <Link to="/" className="text-muted extra-tiny text-decoration-none hover-text-main fw-bold">
                            ← Return to VishwaUtsav
                        </Link>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-vh-100 py-4 py-sm-5 px-3" style={{ background: 'radial-gradient(140% 140% at 50% 5%, rgba(224, 122, 67, 0.08) 0%, #f8fafc 100%)' }}>
            <div className="container" style={{ maxWidth: '680px' }}>
                {/* Brand Header */}
                <div className="text-center mb-4">
                    <img src={logoImage} alt="VishwaUtsav" style={{ height: '48px' }} className="mb-2" />
                    <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
                        <span className="badge rounded-pill px-3 py-1 fw-bold extra-tiny" style={{ background: 'rgba(224, 122, 67, 0.12)', color: '#D95A22', border: '1px solid rgba(224, 122, 67, 0.25)' }}>
                            <Calendar size={11} className="me-1" />
                            {portal?.festOrEventName}
                        </span>
                        <span className="badge rounded-pill bg-light text-muted border px-2.5 py-1 extra-tiny">
                            <Building2 size={10} className="me-1 text-primary" />
                            {portal?.entityName}
                        </span>
                    </div>
                    <h3 className="fw-extrabold text-main mt-2 mb-1" style={{ letterSpacing: '-0.02em', fontSize: '1.45rem' }}>
                        {portal?.title || `${portal?.festOrEventName} — Member & Donor Registration`}
                    </h3>
                    <p className="text-muted extra-tiny mb-0" style={{ maxWidth: '480px', margin: '0 auto', lineHeight: '1.5' }}>
                        {portal?.description || `Join the official organizing committee, volunteer teams, or pledge your support for ${portal?.festOrEventName}.`}
                    </p>
                </div>

                {/* Main Enrollment Card */}
                <div className="luxury-modal-card p-3.5 p-sm-4 shadow-xl" style={{ borderRadius: '24px', background: '#ffffff', border: '1.5px solid var(--glass-border)' }}>
                    <form onSubmit={handleSubmit}>
                        {/* Section 1: Personal Details */}
                        <div className="mb-4">
                            <div className="d-flex align-items-center gap-2 pb-2 mb-3 border-bottom">
                                <Users size={16} className="text-terracotta" />
                                <h6 className="fw-extrabold text-main mb-0" style={{ fontSize: '0.94rem' }}>
                                    1. Personal &amp; Contact Details
                                </h6>
                            </div>

                            <div className="row g-3">
                                <div className="col-12">
                                    <label className="luxury-label">
                                        <span>Full Legal Name</span>
                                        <span className="text-danger">*</span>
                                    </label>
                                    <div className="luxury-input-wrapper">
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Ramesh Kumar Verma"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="luxury-input-field"
                                        />
                                    </div>
                                </div>

                                <div className="col-12 col-sm-6">
                                    <label className="luxury-label">
                                        <Phone size={11} className="text-terracotta" />
                                        <span>WhatsApp / Mobile Number</span>
                                        <span className="text-danger">*</span>
                                    </label>
                                    <div className="luxury-input-wrapper">
                                        <span className="extra-tiny fw-bold text-muted ps-1 pe-2 border-end">{formData.countryCode}</span>
                                        <input
                                            type="tel"
                                            required
                                            placeholder="10-digit mobile number"
                                            value={formData.contact}
                                            onChange={e => setFormData({ ...formData, contact: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                                            className="luxury-input-field ps-2"
                                        />
                                    </div>
                                </div>

                                <div className="col-12 col-sm-6">
                                    <label className="luxury-label">
                                        <Mail size={11} className="text-terracotta" />
                                        <span>Email Address (optional)</span>
                                    </label>
                                    <div className="luxury-input-wrapper">
                                        <input
                                            type="email"
                                            placeholder="e.g. member@gmail.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="luxury-input-field"
                                        />
                                    </div>
                                </div>

                                <div className="col-12">
                                    <label className="luxury-label">
                                        <MapPin size={11} className="text-terracotta" />
                                        <span>Locality / Residential Address (optional)</span>
                                    </label>
                                    <div className="luxury-input-wrapper">
                                        <input
                                            type="text"
                                            placeholder="e.g. Sakaripara Main Road, Ward No. 4"
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            className="luxury-input-field"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Role & Committee Interest */}
                        <div className="mb-4">
                            <div className="d-flex align-items-center gap-2 pb-2 mb-3 border-bottom">
                                <Sparkles size={16} className="text-primary" />
                                <h6 className="fw-extrabold text-main mb-0" style={{ fontSize: '0.94rem' }}>
                                    2. Committee &amp; Volunteer Preference
                                </h6>
                            </div>

                            <div className="row g-3">
                                <div className="col-12 col-sm-6">
                                    <label className="luxury-label">Desired Role / Contribution Area</label>
                                    <select
                                        value={formData.roleInterest}
                                        onChange={e => setFormData({ ...formData, roleInterest: e.target.value })}
                                        className="form-select text-main fw-bold"
                                        style={{ borderRadius: '12px', padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
                                    >
                                        {(portal?.suggestedRoles || ['Committee Member', 'Ground Volunteer', 'Cultural Coordinator', 'Logistics & Security']).map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                        <option value="Executive Wing">Executive Wing</option>
                                        <option value="Volunteer Seva">Volunteer Seva</option>
                                        <option value="Other Supporter">Other Supporter</option>
                                    </select>
                                </div>

                                <div className="col-12 col-sm-6">
                                    <label className="luxury-label">Department / Wing Preference</label>
                                    <select
                                        value={formData.departmentInterest}
                                        onChange={e => setFormData({ ...formData, departmentInterest: e.target.value })}
                                        className="form-select text-main fw-bold"
                                        style={{ borderRadius: '12px', padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
                                    >
                                        {(portal?.suggestedDepts || ['Core Committee', 'Executive Wing', 'Cultural & Events', 'Logistics & Security']).map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Optional Pledge / Donation */}
                        {portal?.acceptDonations && (
                            <div className="mb-4 p-3 rounded-4" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(224, 122, 67, 0.05))', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <Gift size={16} className="text-warning" />
                                        <span className="fw-extrabold text-main" style={{ fontSize: '0.92rem' }}>
                                            Optional Donation / Pledge Support
                                        </span>
                                    </div>
                                    <div className="form-check form-switch mb-0">
                                        <input
                                            type="checkbox"
                                            id="donateToggle"
                                            checked={formData.donate}
                                            onChange={e => setFormData({ ...formData, donate: e.target.checked })}
                                            className="form-check-input"
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </div>
                                </div>
                                <p className="extra-tiny text-muted mb-3">
                                    Would you also like to pledge a donation or sponsor an item for {portal?.festOrEventName}? (Optional)
                                </p>

                                {formData.donate && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="pt-2 border-top border-warning border-opacity-25"
                                    >
                                        {/* Suggested Amount Chips */}
                                        <div className="mb-3">
                                            <label className="luxury-label mb-1.5">Suggested Contribution Amount (₹)</label>
                                            <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                                {(portal?.suggestedAmounts || [501, 1001, 2100, 5001]).map(amt => (
                                                    <button
                                                        key={amt}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, estimatedAmount: amt })}
                                                        className={`btn btn-sm rounded-pill px-3 py-1 extra-tiny fw-bold transition-all ${
                                                            Number(formData.estimatedAmount) === amt
                                                                ? 'btn-warning text-dark shadow-xs'
                                                                : 'btn-light border text-main hover-bg-light'
                                                        }`}
                                                    >
                                                        ₹{amt.toLocaleString('en-IN')}
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, estimatedAmount: '' })}
                                                    className={`btn btn-sm rounded-pill px-3 py-1 extra-tiny fw-bold transition-all ${
                                                        !portal?.suggestedAmounts?.includes(Number(formData.estimatedAmount)) && formData.estimatedAmount
                                                            ? 'btn-warning text-dark shadow-xs'
                                                            : 'btn-light border text-muted hover-bg-light'
                                                    }`}
                                                >
                                                    Custom Amount
                                                </button>
                                            </div>
                                        </div>

                                        <div className="row g-3">
                                            <div className="col-12 col-sm-6">
                                                <label className="luxury-label">
                                                    <DollarSign size={11} className="text-success" />
                                                    <span>Estimated Cash Amount (₹)</span>
                                                </label>
                                                <div className="luxury-input-wrapper">
                                                    <span className="fw-bold text-success ps-1 pe-1">₹</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        placeholder="e.g. 1000"
                                                        value={formData.estimatedAmount}
                                                        onChange={e => setFormData({ ...formData, estimatedAmount: e.target.value })}
                                                        className="luxury-input-field"
                                                    />
                                                </div>
                                            </div>

                                            <div className="col-12 col-sm-6">
                                                <label className="luxury-label">
                                                    <Gift size={11} className="text-warning" />
                                                    <span>In-Kind / Material Item (optional)</span>
                                                </label>
                                                <div className="luxury-input-wrapper">
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Prasad, 500 Water Bottles, Flowers"
                                                        value={formData.contributionItem}
                                                        onChange={e => setFormData({ ...formData, contributionItem: e.target.value })}
                                                        className="luxury-input-field"
                                                    />
                                                </div>
                                            </div>

                                            <div className="col-12 col-sm-6">
                                                <label className="luxury-label">Preferred Payment Mode</label>
                                                <select
                                                    value={formData.paymentMode}
                                                    onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}
                                                    className="form-select text-main fw-bold"
                                                    style={{ borderRadius: '12px', padding: '0.55rem 0.75rem', fontSize: '0.82rem' }}
                                                >
                                                    <option value="Pledged">Pledged (Will contribute during event/festival)</option>
                                                    <option value="Cash">Cash in hand</option>
                                                    <option value="UPI / Online">UPI / Online Transfer</option>
                                                    <option value="In-Kind / Material">In-Kind Goods / Materials</option>
                                                </select>
                                            </div>

                                            <div className="col-12 col-sm-6">
                                                <label className="luxury-label">Category</label>
                                                <select
                                                    value={formData.category}
                                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                    className="form-select text-main fw-bold"
                                                    style={{ borderRadius: '12px', padding: '0.55rem 0.75rem', fontSize: '0.82rem' }}
                                                >
                                                    <option value="Cash">Cash Donation</option>
                                                    <option value="Food / Prasad">Food / Prasad Seva</option>
                                                    <option value="Stage & Sound">Stage &amp; Sound</option>
                                                    <option value="In-Kind Services">In-Kind Services</option>
                                                    <option value="Logistics & Security">Logistics &amp; Security</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {/* Section 4: Notes / Messages */}
                        <div className="mb-4">
                            <label className="luxury-label">Any message or suggestion for the organizers (optional)</label>
                            <div className="luxury-input-wrapper" style={{ padding: '0.5rem 0.75rem' }}>
                                <textarea
                                    rows="2"
                                    placeholder="Share your availability, skills, or festive greetings..."
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="luxury-input-field w-100"
                                    style={{ resize: 'none' }}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn btn-premium w-100 py-3 rounded-pill fw-extrabold shadow-md d-flex align-items-center justify-content-center gap-2"
                            style={{ fontSize: '0.98rem' }}
                        >
                            {submitting ? (
                                <>
                                    <div className="spinner-border spinner-border-sm text-white" role="status"></div>
                                    <span>Submitting Registration...</span>
                                </>
                            ) : (
                                <>
                                    <span>Submit Enrollment &amp; Register</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>

                        <div className="text-center mt-3">
                            <span className="extra-tiny text-muted d-inline-flex align-items-center gap-1">
                                <ShieldCheck size={12} className="text-success" />
                                Protected by VishwaUtsav Community Governance
                            </span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
