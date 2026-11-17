import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import {
    Link2, Copy, Check, ExternalLink, Share2, QrCode, Download,
    X, CheckCircle2, XCircle, Trash2, Edit3, Filter, Search,
    Users, Coins, Sparkles, Clock, Phone, MapPin, Mail, FileText,
    RefreshCw, AlertCircle, Calendar, Gift, ChevronRight, ChevronDown, Eye, EyeOff,
    CreditCard, Camera, ShieldCheck, Award
} from 'lucide-react'

const EnrollmentManagerModal = ({
    isOpen,
    onClose,
    type = 'festival',
    activePortalName = '',
    activeEntity = '',
    festivalsList = [],
    onRosterUpdated
}) => {
    const [activeTab, setActiveTab] = useState('link') // 'link' | 'submissions'
    const [loading, setLoading] = useState(true)
    const [enrollment, setEnrollment] = useState(null)
    const [submissions, setSubmissions] = useState([])
    const [copySuccess, setCopySuccess] = useState(false)
    const [submittingAction, setSubmittingAction] = useState(null)
    const [statusFilter, setStatusFilter] = useState('All')
    const [searchQuery, setSearchQuery] = useState('')
    const [errorMsg, setErrorMsg] = useState('')
    const [successMsg, setSuccessMsg] = useState('')
    const [viewingReceipt, setViewingReceipt] = useState(null)
    const [copiedRefId, setCopiedRefId] = useState(null)

    const getInitials = (name) => {
        if (!name) return 'VU'
        const parts = name.trim().split(/\s+/)
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }

    // Effective selected festival / event
    const initialPortalName = activePortalName || (festivalsList && festivalsList.length > 0 ? (festivalsList[0]?.title || festivalsList[0]) : '')
    const [selectedPortal, setSelectedPortal] = useState(initialPortalName)

    useEffect(() => {
        const bestName = activePortalName || (festivalsList && festivalsList.length > 0 ? (festivalsList[0]?.title || festivalsList[0]) : '')
        if (bestName) {
            setSelectedPortal(bestName)
        }
    }, [activePortalName, festivalsList])

    // Fetch or initialize enrollment link & submissions safely
    const fetchData = async (portalToFetch) => {
        const target = portalToFetch || selectedPortal || activePortalName || (festivalsList && festivalsList.length > 0 ? (festivalsList[0]?.title || festivalsList[0]) : '')
        if (!target) {
            setLoading(false)
            return
        }
        setLoading(true)
        setErrorMsg('')
        try {
            // 1. Fetch or initialize link for this festival / event
            try {
                const enrollRes = await axios.post('/api/enrollments', {
                    type,
                    festOrEventName: target,
                    entityName: activeEntity
                })
                setEnrollment(enrollRes.data)
            } catch (enrollErr) {
                console.warn('Link auto-creation notice:', enrollErr?.response?.data?.message || enrollErr.message)
                try {
                    const fallbackRes = await axios.get('/api/enrollments', {
                        params: { festOrEventName: target, type }
                    })
                    if (fallbackRes.data && fallbackRes.data.length > 0) {
                        setEnrollment(fallbackRes.data[0])
                    }
                } catch (_) {}
            }

            // 2. Fetch incoming submissions
            const subRes = await axios.get('/api/enrollments/submissions/all', {
                params: {
                    festOrEventName: target,
                    type
                }
            })
            setSubmissions(subRes.data || [])
            setErrorMsg('')
        } catch (err) {
            console.error('Failed to load submissions:', err)
            // Only set error message if both failed and no existing data is present
            if (!submissions || submissions.length === 0) {
                setErrorMsg(err.response?.data?.message || 'Could not load enrollment information.')
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen) {
            const target = selectedPortal || activePortalName || (festivalsList && festivalsList.length > 0 ? (festivalsList[0]?.title || festivalsList[0]) : '')
            if (target) {
                fetchData(target)
            } else {
                setLoading(false)
            }
        }
    }, [isOpen, selectedPortal])

    const handleSwitchPortal = (newName) => {
        setSelectedPortal(newName)
        fetchData(newName)
    }

    // Construct public share URL
    const publicUrl = useMemo(() => {
        if (!enrollment?.slug) return ''
        return `${window.location.origin}/enroll/${enrollment.slug}`
    }, [enrollment])

    // QR Code Image URL
    const qrCodeUrl = useMemo(() => {
        if (!publicUrl) return ''
        return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(publicUrl)}&margin=10`
    }, [publicUrl])

    // Copy to clipboard
    const handleCopyLink = async () => {
        if (!publicUrl) return
        try {
            await navigator.clipboard.writeText(publicUrl)
            setCopySuccess(true)
            setTimeout(() => setCopySuccess(false), 2400)
        } catch (_) {
            const input = document.createElement('input')
            input.value = publicUrl
            document.body.appendChild(input)
            input.select()
            document.execCommand('copy')
            document.body.removeChild(input)
            setCopySuccess(true)
            setTimeout(() => setCopySuccess(false), 2400)
        }
    }

    const currentPortalName = selectedPortal || activePortalName || (festivalsList && festivalsList.length > 0 ? (festivalsList[0]?.title || festivalsList[0]) : '')

    // Direct WhatsApp share
    const handleShareWhatsApp = () => {
        if (!publicUrl) return
        const text = `🎉 Join the Official Committee & Support *${currentPortalName}*!\n\nOrganized by *${activeEntity || 'our community'}*. You can enroll as a committee member, volunteer, or contribute donations/in-kind support.\n\n🔗 Click to register now:\n${publicUrl}`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }

    // Download QR Code image
    const handleDownloadQR = async () => {
        if (!qrCodeUrl) return
        try {
            const res = await fetch(qrCodeUrl)
            const blob = await res.blob()
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = `${(currentPortalName || 'enrollment').replace(/\s+/g, '_')}_QR_Code.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(link.href)
        } catch (err) {
            window.open(qrCodeUrl, '_blank')
        }
    }

    // Toggle link status (Active vs Paused)
    const handleToggleLinkActive = async () => {
        if (!enrollment?._id) return
        setSubmittingAction('toggle_link')
        try {
            const res = await axios.put(`/api/enrollments/${enrollment._id}`, {
                isActive: !enrollment.isActive
            })
            setEnrollment(res.data)
            setSuccessMsg(res.data.isActive ? 'Enrollment portal opened successfully!' : 'Enrollment portal paused.')
            setTimeout(() => setSuccessMsg(''), 3000)
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to update link status.')
        } finally {
            setSubmittingAction(null)
        }
    }

    // Approve & Sync submission into Member and Sponsor records
    const handleApproveSubmission = async (subId) => {
        setSubmittingAction(`approve_${subId}`)
        setErrorMsg('')
        try {
            const res = await axios.post(`/api/enrollments/submissions/${subId}/approve`)
            setSubmissions(prev => prev.map(s => s._id === subId ? res.data.submission : s))
            setSuccessMsg(res.data.message || 'Approved & synchronized to official records!')
            setTimeout(() => setSuccessMsg(''), 3500)
            if (onRosterUpdated) {
                onRosterUpdated()
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to approve application.')
        } finally {
            setSubmittingAction(null)
        }
    }

    // Reject submission
    const handleRejectSubmission = async (subId) => {
        if (!window.confirm('Mark this application as rejected?')) return
        setSubmittingAction(`reject_${subId}`)
        try {
            const res = await axios.post(`/api/enrollments/submissions/${subId}/reject`)
            setSubmissions(prev => prev.map(s => s._id === subId ? res.data.submission : s))
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to reject application.')
        } finally {
            setSubmittingAction(null)
        }
    }

    // Delete submission
    const handleDeleteSubmission = async (subId) => {
        if (!window.confirm('Are you sure you want to delete this submission record permanently?')) return
        setSubmittingAction(`delete_${subId}`)
        try {
            await axios.delete(`/api/enrollments/submissions/${subId}`)
            setSubmissions(prev => prev.filter(s => s._id !== subId))
            setSuccessMsg('Submission removed.')
            setTimeout(() => setSuccessMsg(''), 2500)
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to delete record.')
        } finally {
            setSubmittingAction(null)
        }
    }

    // Filter submissions
    const filteredSubmissions = useMemo(() => {
        return submissions.filter(sub => {
            if (statusFilter !== 'All' && sub.status !== statusFilter) return false
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase()
                const matchName = (sub.name || '').toLowerCase().includes(q)
                const matchContact = (sub.contact || '').includes(q)
                const matchRole = (sub.roleInterest || '').toLowerCase().includes(q)
                const matchItem = (sub.contributionItem || '').toLowerCase().includes(q)
                const matchRef = (sub.referenceId || '').toLowerCase().includes(q)
                if (!matchName && !matchContact && !matchRole && !matchItem && !matchRef) return false
            }
            return true
        })
    }, [submissions, statusFilter, searchQuery])

    // Counters
    const counts = useMemo(() => {
        const total = submissions.length
        const pending = submissions.filter(s => s.status === 'Pending').length
        const approved = submissions.filter(s => s.status === 'Approved').length
        const rejected = submissions.filter(s => s.status === 'Rejected').length
        return { total, pending, approved, rejected }
    }, [submissions])

    if (!isOpen) return null

    return (
        <div className="luxury-modal-overlay d-flex align-items-center justify-content-center p-2 p-sm-3" style={{ zIndex: 1100 }}>
            <div 
                className="luxury-modal-card position-relative bg-card d-flex flex-column shadow-2xl border"
                style={{
                    width: '100%',
                    maxWidth: '880px',
                    maxHeight: '92vh',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    borderColor: 'var(--glass-border)'
                }}
            >
                {/* Header */}
                <div className="p-3 p-sm-4 border-bottom d-flex align-items-center justify-content-between gap-3 bg-light bg-opacity-40">
                    <div className="d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
                        <div 
                            className="d-flex align-items-center justify-content-center rounded-4 flex-shrink-0 shadow-sm"
                            style={{
                                width: '46px',
                                height: '46px',
                                background: 'linear-gradient(135deg, rgba(224, 122, 67, 0.16), rgba(217, 90, 34, 0.28))',
                                color: '#D95A22',
                                border: '1.5px solid rgba(224, 122, 67, 0.35)'
                            }}
                        >
                            <Link2 size={22} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <h5 className="fw-extrabold text-main mb-1 text-truncate" style={{ fontSize: '1.12rem', letterSpacing: '-0.02em' }}>
                                Open Member &amp; Contributor Portal
                            </h5>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                {festivalsList && festivalsList.length > 1 ? (
                                    <div className="figma-portal-selector-wrapper" title="Switch festival/event">
                                        <select
                                            value={selectedPortal || currentPortalName}
                                            onChange={e => handleSwitchPortal(e.target.value)}
                                            className="figma-portal-selector-select"
                                        >
                                            {festivalsList.map(f => {
                                                const title = f.title || f
                                                return <option key={title} value={title}>{title}</option>
                                            })}
                                        </select>
                                        <ChevronDown size={11} className="figma-portal-selector-chevron" />
                                    </div>
                                ) : (
                                    <span className="figma-portal-name-badge">
                                        <Calendar size={11} className="text-terracotta" />
                                        <span>{currentPortalName || 'Vishwa Utsav'}</span>
                                    </span>
                                )}

                                <span className="figma-portal-type-pill">
                                    <Sparkles size={10} className="text-terracotta" />
                                    <span>{type === 'festival' ? 'Festival' : 'Event'}</span>
                                </span>

                                {enrollment?.isActive ? (
                                    <span className="figma-portal-status-live">
                                        <span className="figma-status-pulse-dot" />
                                        <span>Public Active</span>
                                    </span>
                                ) : (
                                    <span className="figma-portal-status-paused">
                                        <span className="figma-status-dot-amber" />
                                        <span>Paused</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-sm btn-light rounded-circle p-2 text-muted hover-text-main flex-shrink-0"
                        style={{ width: '36px', height: '36px' }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Notifications */}
                {errorMsg && (
                    <div className="mx-3 mt-3 alert alert-danger extra-tiny py-2 px-3 d-flex align-items-center gap-2 mb-0">
                        <AlertCircle size={14} className="flex-shrink-0" />
                        <span className="flex-grow-1">{errorMsg}</span>
                        <button type="button" onClick={() => setErrorMsg('')} className="btn-close p-1" style={{ fontSize: '0.6rem' }}></button>
                    </div>
                )}
                {successMsg && (
                    <div className="mx-3 mt-3 alert alert-success extra-tiny py-2 px-3 d-flex align-items-center gap-2 mb-0">
                        <CheckCircle2 size={14} className="flex-shrink-0" />
                        <span className="flex-grow-1">{successMsg}</span>
                    </div>
                )}

                {/* Modern Segmented Navigation Tabs */}
                <div className="px-3 px-sm-4 pt-3 pb-2.5 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2 bg-white">
                    <div className="enr-top-tab-switcher">
                        <button
                            type="button"
                            onClick={() => setActiveTab('link')}
                            className={`enr-tab-pill-btn ${activeTab === 'link' ? 'active' : ''}`}
                        >
                            <QrCode size={14} />
                            <span>Shareable Link &amp; QR Code</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('submissions')}
                            className={`enr-tab-pill-btn ${activeTab === 'submissions' ? 'active' : ''}`}
                        >
                            <Users size={14} />
                            <span>Incoming Applications</span>
                            {counts.pending > 0 ? (
                                <span className="enr-tab-pill-badge alert animate-pulse">
                                    {counts.pending} New
                                </span>
                            ) : (
                                <span className="enr-tab-pill-badge">
                                    {counts.total}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="extra-tiny text-muted d-none d-sm-flex align-items-center gap-1.5">
                        <ShieldCheck size={14} className="text-success" />
                        <span>Live Community Enrollment Cockpit</span>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-3 p-sm-4 overflow-y-auto flex-grow-1" style={{ maxHeight: 'calc(92vh - 165px)' }}>
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                            <div className="extra-tiny text-muted">Preparing official public registration portal...</div>
                        </div>
                    ) : activeTab === 'link' ? (
                        /* TAB 1: SHAREABLE LINK & QR CODE */
                        <div className="row g-4 align-items-center">
                            {/* Left: QR Code Preview Card */}
                            <div className="col-12 col-md-5 text-center">
                                <div 
                                    className="p-3.5 rounded-4 border shadow-sm mx-auto d-inline-block"
                                    style={{
                                        background: '#ffffff',
                                        maxWidth: '280px',
                                        borderColor: 'var(--glass-border)'
                                    }}
                                >
                                    <div className="extra-tiny fw-bold text-muted mb-2 uppercase tracking-wider">
                                        Scan to Enroll &amp; Donate
                                    </div>
                                    {qrCodeUrl ? (
                                        <img 
                                            src={qrCodeUrl} 
                                            alt="Enrollment QR Code" 
                                            className="img-fluid rounded-3 border"
                                            style={{ width: '220px', height: '220px', objectFit: 'contain' }}
                                        />
                                    ) : (
                                        <div className="d-flex align-items-center justify-content-center" style={{ width: '220px', height: '220px' }}>
                                            <QrCode size={48} className="text-muted" />
                                        </div>
                                    )}
                                    <div className="extra-tiny fw-extrabold text-main mt-2 text-truncate">
                                        {currentPortalName || 'Vishwa Utsav'}
                                    </div>
                                    <div className="extra-tiny text-muted opacity-75">
                                        Powered by Vishwa Utsav
                                    </div>
                                </div>

                                <div className="d-flex justify-content-center gap-2 mt-3">
                                    <button
                                        type="button"
                                        onClick={handleDownloadQR}
                                        className="btn btn-sm btn-outline-secondary rounded-pill extra-tiny fw-bold d-inline-flex align-items-center gap-1.5 px-3 py-1.5 shadow-2xs"
                                    >
                                        <Download size={13} />
                                        <span>Download QR</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => window.open(qrCodeUrl, '_blank')}
                                        className="btn btn-sm btn-light border rounded-pill extra-tiny fw-bold d-inline-flex align-items-center gap-1.5 px-3 py-1.5 text-muted hover-text-main shadow-2xs"
                                    >
                                        <ExternalLink size={13} />
                                        <span>Full Image</span>
                                    </button>
                                </div>
                            </div>

                            {/* Right: Public URL & Quick Actions */}
                            <div className="col-12 col-md-7">
                                <div className="mb-3">
                                    <label className="form-label extra-tiny fw-bold uppercase text-muted mb-1.5">
                                        Public Open URL (No Login Required)
                                    </label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border text-muted extra-tiny">
                                            <Link2 size={13} />
                                        </span>
                                        <input
                                            type="text"
                                            readOnly
                                            value={publicUrl}
                                            className="form-control form-control-sm bg-light border text-main fw-semibold extra-tiny"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleCopyLink}
                                            className={`btn btn-sm px-3 fw-bold extra-tiny d-inline-flex align-items-center gap-1 ${
                                                copySuccess ? 'btn-success text-white' : 'btn-primary text-white'
                                            }`}
                                        >
                                            {copySuccess ? <Check size={13} /> : <Copy size={13} />}
                                            <span>{copySuccess ? 'Copied!' : 'Copy Link'}</span>
                                        </button>
                                    </div>
                                    <div className="extra-tiny text-muted mt-1">
                                        Share this link in your WhatsApp groups, community notices, banners, and social posts.
                                    </div>
                                </div>

                                {/* Direct Action Buttons */}
                                <div className="d-flex flex-wrap gap-2 mb-4">
                                    <button
                                        type="button"
                                        onClick={handleShareWhatsApp}
                                        className="btn btn-sm rounded-pill fw-bold extra-tiny d-inline-flex align-items-center gap-1.5 px-3 py-2 text-white shadow-sm flex-fill flex-sm-grow-0"
                                        style={{ background: '#25D366' }}
                                    >
                                        <Share2 size={13} />
                                        <span>Share to WhatsApp</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => window.open(publicUrl, '_blank')}
                                        className="btn btn-sm btn-outline-primary rounded-pill fw-bold extra-tiny d-inline-flex align-items-center gap-1.5 px-3 py-2 shadow-2xs flex-fill flex-sm-grow-0"
                                    >
                                        <ExternalLink size={13} />
                                        <span>Preview Public Page</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleToggleLinkActive}
                                        disabled={submittingAction === 'toggle_link'}
                                        className={`btn btn-sm rounded-pill fw-bold extra-tiny d-inline-flex align-items-center gap-1.5 px-3 py-2 shadow-2xs border flex-fill flex-sm-grow-0 ${
                                            enrollment?.isActive 
                                                ? 'btn-light text-warning border-warning border-opacity-40' 
                                                : 'btn-success text-white'
                                        }`}
                                    >
                                        {enrollment?.isActive ? <EyeOff size={13} /> : <Eye size={13} />}
                                        <span>{enrollment?.isActive ? 'Pause Link' : 'Reactivate Link'}</span>
                                    </button>
                                </div>

                                {/* Feature Highlights Bento Card */}
                                <div 
                                    className="p-3.5 rounded-4 border shadow-xs"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(224, 122, 67, 0.05) 0%, rgba(217, 90, 34, 0.03) 100%)',
                                        borderColor: 'rgba(224, 122, 67, 0.18)'
                                    }}
                                >
                                    <div className="d-flex align-items-center gap-2 mb-2 text-terracotta fw-bold extra-tiny uppercase tracking-wider">
                                        <Sparkles size={13} />
                                        <span>How Public Enrollment Works</span>
                                    </div>
                                    <ul className="extra-tiny text-muted mb-0 ps-3" style={{ lineHeight: '1.7' }}>
                                        <li>Users enter their <strong>Full Name, Phone/WhatsApp, and Address</strong>.</li>
                                        <li>They select their <strong>Role &amp; Wing interest</strong> (e.g. Core Committee, Ground Volunteer).</li>
                                        <li>Optional: They can pledge an <strong>Amount (₹)</strong> or offer <strong>In-Kind Goods</strong> (Sound, Stage, Food, Sand, etc.).</li>
                                        <li>A unique <strong>Digital Reference Slip (#ENR-...)</strong> is instantly generated for each applicant.</li>
                                        <li>Admin clicks <strong>[ ✓ Approve &amp; Sync ]</strong> to automatically add them to the official Committee Roster and/or Sponsors list with zero manual typing!</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* TAB 2: INCOMING SUBMISSIONS (CRUD) */
                        <div>
                            {/* Responsive Toolbar: Search & Locked Filter Controls */}
                            <div className="enr-toolbar-wrapper mb-3">
                                <div className="input-group enr-search-container">
                                    <span className="input-group-text bg-transparent border-0 text-muted ps-3 pe-2 d-flex align-items-center">
                                        <Search size={14} />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Search by name, phone, UTR..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="form-control bg-transparent border-0 text-main extra-tiny p-0 shadow-none fw-semibold"
                                        style={{ fontSize: '0.8rem' }}
                                    />
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery('')} className="btn btn-sm btn-link text-muted p-0 pe-3">
                                            <X size={13} />
                                        </button>
                                    )}
                                </div>

                                {/* Segmented Filter Pills & Refresh Action Locked Together */}
                                <div className="enr-filters-actions-group">
                                    <div className="enr-filter-segmented-control">
                                        {[
                                            { id: 'All', label: 'All', count: counts.total },
                                            { id: 'Pending', label: 'Pending', count: counts.pending, alert: counts.pending > 0 },
                                            { id: 'Approved', label: 'Approved', count: counts.approved },
                                            { id: 'Rejected', label: 'Rejected', count: counts.rejected }
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setStatusFilter(tab.id)}
                                                className={`enr-filter-seg-btn ${statusFilter === tab.id ? 'active' : ''}`}
                                            >
                                                <span>{tab.label}</span>
                                                <span className={`enr-filter-count-badge ${tab.alert && statusFilter !== tab.id ? 'alert' : ''}`}>
                                                    {tab.count}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={fetchData}
                                        title="Refresh applications"
                                        className="enr-btn-refresh-circle"
                                    >
                                        <RefreshCw size={13} />
                                    </button>
                                </div>
                            </div>

                            {/* Submissions List */}
                            {filteredSubmissions.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <div className="figma-members-header-emblem mx-auto mb-2.5" style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(224, 122, 67, 0.1)', color: '#D95A22' }}>
                                        <FileText size={22} />
                                    </div>
                                    <h6 className="fw-bold text-main mb-1">
                                        {searchQuery || statusFilter !== 'All' ? 'No Matching Applications' : 'No Submissions Yet'}
                                    </h6>
                                    <p className="extra-tiny text-muted mb-3" style={{ maxWidth: '380px', margin: '0 auto' }}>
                                        {searchQuery || statusFilter !== 'All'
                                            ? 'Try adjusting your search query or switching to "All" filter.'
                                            : 'Share the public link with your community to start receiving member applications and donations.'}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('link')}
                                        className="btn btn-sm btn-primary rounded-pill px-3 py-1.5 fw-bold extra-tiny text-white shadow-sm"
                                    >
                                        <Copy size={12} className="me-1" />
                                        <span>Copy &amp; Share Link</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    {filteredSubmissions.map((sub) => {
                                        const isPending = sub.status === 'Pending'
                                        const isApproved = sub.status === 'Approved'
                                        const isRejected = sub.status === 'Rejected'
                                        const hasDonation = Boolean(sub.donate || sub.estimatedAmount > 0 || sub.contributionItem)

                                        return (
                                            <div 
                                                key={sub._id}
                                                className={`enr-sub-card ${isApproved ? 'card-approved' : isRejected ? 'card-rejected' : 'card-pending'}`}
                                            >
                                                {/* Top Row: User Avatar Monogram, Name, Ref ID & Explicit Status Pill */}
                                                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3.5 pb-2.5 border-bottom border-secondary border-opacity-10">
                                                    <div className="d-flex align-items-center gap-2.5">
                                                        <div className="enr-user-avatar">
                                                            <span>{getInitials(sub.name)}</span>
                                                            <span className={`enr-avatar-status-dot ${isApproved ? 'bg-success' : isRejected ? 'bg-danger' : 'bg-warning'}`} />
                                                        </div>
                                                        <div>
                                                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                                                <h6 className="fw-black text-main mb-0" style={{ fontSize: '0.98rem' }}>
                                                                    {sub.name}
                                                                </h6>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(sub.referenceId)
                                                                        setCopiedRefId(sub.referenceId)
                                                                        setTimeout(() => setCopiedRefId(null), 2000)
                                                                    }}
                                                                    className="badge rounded-pill bg-light text-muted border extra-tiny px-2.5 py-0.5 font-monospace d-inline-flex align-items-center gap-1 cursor-pointer"
                                                                    title="Click to copy Reference ID"
                                                                >
                                                                    <span>{sub.referenceId}</span>
                                                                    {copiedRefId === sub.referenceId ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                                                                </button>
                                                            </div>
                                                            <div className="extra-tiny text-muted d-flex align-items-center gap-2.5 mt-0.5 flex-wrap">
                                                                <span className="d-flex align-items-center gap-1">
                                                                    <Clock size={11} />
                                                                    {new Date(sub.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                {sub.address && (
                                                                    <span className="d-flex align-items-center gap-1">
                                                                        <MapPin size={11} className="text-terracotta" />
                                                                        <span className="text-truncate" style={{ maxWidth: '240px' }}>{sub.address}</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Explicit Status Pill (Resolves Yellow-on-Yellow Bug) */}
                                                    <span className={`enr-status-pill ${isApproved ? 'status-approved' : isRejected ? 'status-rejected' : 'status-pending'}`}>
                                                        {isApproved && <CheckCircle2 size={12} />}
                                                        {isRejected && <XCircle size={12} />}
                                                        {isPending && <span className="enr-pulse-dot-amber" />}
                                                        <span>{isApproved ? 'Approved & Synced' : isRejected ? 'Rejected' : 'Pending Review'}</span>
                                                    </span>
                                                </div>

                                                {/* Middle: Details Grid */}
                                                <div className="row g-2 mb-3">
                                                    {/* Contact & WhatsApp */}
                                                    <div className="col-12 col-sm-6">
                                                        <div className="p-2.5 rounded-3 border d-flex align-items-center justify-content-between gap-2" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                                                            <div className="d-flex align-items-center gap-2 overflow-hidden">
                                                                <div className="rounded-circle bg-primary bg-opacity-10 text-primary p-1.5 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '28px', height: '28px' }}>
                                                                    <Phone size={13} />
                                                                </div>
                                                                <div className="text-truncate">
                                                                    <span className="text-muted extra-tiny d-block" style={{ fontSize: '0.64rem' }}>CONTACT / WHATSAPP</span>
                                                                    <strong className="text-main extra-tiny">{sub.countryCode || '+91'} {sub.contact}</strong>
                                                                </div>
                                                            </div>
                                                            <a
                                                                href={`https://wa.me/${(sub.countryCode || '+91').replace(/\+/g, '')}${sub.contact.replace(/\D/g, '')}?text=${encodeURIComponent(`Namaste ${sub.name}, regarding your enrollment for ${currentPortalName}:`)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="enr-whatsapp-btn"
                                                                title="Message on WhatsApp"
                                                            >
                                                                <span>WhatsApp</span>
                                                            </a>
                                                        </div>
                                                    </div>

                                                    {/* Role Preference */}
                                                    <div className="col-12 col-sm-6">
                                                        <div className="p-2.5 rounded-3 border d-flex align-items-center gap-2" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                                                            <div className="rounded-circle bg-warning bg-opacity-15 text-warning p-1.5 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '28px', height: '28px' }}>
                                                                <Award size={14} className="text-amber" />
                                                            </div>
                                                            <div className="text-truncate">
                                                                <span className="text-muted extra-tiny d-block" style={{ fontSize: '0.64rem' }}>ROLE &amp; WING PREFERENCE</span>
                                                                <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                                                    <strong className="text-main extra-tiny">{sub.roleInterest}</strong>
                                                                    <span className="text-muted extra-tiny">•</span>
                                                                    <span className="badge rounded-pill bg-light text-muted border extra-tiny px-2 py-0.5">{sub.departmentInterest || 'Core Committee'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Donation Pledge if present */}
                                                    {hasDonation && (
                                                        <div className="col-12">
                                                            <div 
                                                                className="p-2.5 rounded-3 border d-flex flex-wrap align-items-center justify-content-between gap-2"
                                                                style={{
                                                                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(254, 243, 199, 0.25) 100%)',
                                                                    borderColor: 'rgba(245, 158, 11, 0.28)'
                                                                }}
                                                            >
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <div className="figma-finance-icon-box p-1" style={{ width: '28px', height: '28px', background: 'rgba(245, 158, 11, 0.15)', color: '#d97706' }}>
                                                                        <Gift size={14} />
                                                                    </div>
                                                                    <div>
                                                                        <div className="extra-tiny text-muted uppercase tracking-wider fw-bold">
                                                                            Donation / Contribution Pledge
                                                                        </div>
                                                                        <div className="extra-tiny fw-extrabold text-main">
                                                                            {sub.contributionItem ? (
                                                                                <span>{sub.contributionItem} {sub.estimatedAmount > 0 ? `(Est. ${sub.currency || '₹'}${sub.estimatedAmount.toLocaleString('en-IN')})` : ''}</span>
                                                                            ) : (
                                                                                <span>{sub.currency || '₹'}{sub.estimatedAmount.toLocaleString('en-IN')} ({sub.paymentMode || 'Cash/UPI Pledge'})</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <span className="badge rounded-pill bg-white text-dark border extra-tiny px-2 py-1 fw-semibold shadow-2xs">
                                                                    Category: {sub.category}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* UPI / Online Verification Info (Payee, Number, UTR & Compulsory Receipt) */}
                                                    {(sub.paymentMode === 'UPI / Online' || sub.receiptImage || sub.transactionRefId) && (
                                                        <div className="col-12">
                                                            <div className="p-2.5 rounded-3 border d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2" style={{ background: '#f0fdf4', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <div className="rounded-circle bg-success text-white p-1 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '26px', height: '26px' }}>
                                                                        <CreditCard size={13} />
                                                                    </div>
                                                                    <div className="extra-tiny">
                                                                        <div className="fw-bold text-main">
                                                                            Paid To: <span className="text-success">{sub.payeeName || 'N/A'}</span> {sub.payeeNumber && `(${sub.payeeNumber})`}
                                                                        </div>
                                                                        <div className="text-muted font-monospace">
                                                                            UTR / Ref ID: <span className="fw-bold text-dark">{sub.transactionRefId || 'N/A'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {sub.receiptImage ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setViewingReceipt(sub.receiptImage)}
                                                                        className="btn btn-sm btn-white border border-success border-opacity-40 text-success rounded-pill extra-tiny px-2.5 py-1 d-inline-flex align-items-center gap-1.5 shadow-2xs hover-glow flex-shrink-0"
                                                                    >
                                                                        <img src={sub.receiptImage} alt="Receipt thumb" className="rounded-1 border object-fit-cover" style={{ width: '22px', height: '22px' }} />
                                                                        <span className="fw-bold">View Receipt Slip</span>
                                                                        <ExternalLink size={11} />
                                                                    </button>
                                                                ) : (
                                                                    <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 extra-tiny px-2 py-0.5">
                                                                        No Receipt Attached
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Notes */}
                                                    {sub.notes && (
                                                        <div className="col-12">
                                                            <div className="p-2 rounded-3 bg-light border border-secondary border-opacity-10 extra-tiny text-muted">
                                                                <span className="fw-bold text-main">Note / Offer: </span>{sub.notes}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Bottom Actions Row (CRUD) */}
                                                <div className="d-flex align-items-center justify-content-between pt-2.5 border-top border-secondary border-opacity-10 flex-wrap gap-2">
                                                    <div className="extra-tiny text-muted d-flex align-items-center gap-1.5">
                                                        {isApproved && (
                                                            <span className="text-success fw-bold d-inline-flex align-items-center gap-1.5">
                                                                <CheckCircle2 size={13} />
                                                                <span>Synced to Committee &amp; Sponsor Records</span>
                                                            </span>
                                                        )}
                                                        {isRejected && (
                                                            <span className="text-danger fw-bold d-inline-flex align-items-center gap-1.5">
                                                                <XCircle size={13} />
                                                                <span>Application Marked as Rejected</span>
                                                            </span>
                                                        )}
                                                        {isPending && (
                                                            <span className="text-muted d-inline-flex align-items-center gap-1">
                                                                <Clock size={12} className="text-warning" />
                                                                <span>Awaiting review &amp; roster approval</span>
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="d-flex align-items-center gap-1.5">
                                                        {/* 1-Click Approve & Sync Button */}
                                                        {(!isApproved) && (
                                                            <button
                                                                type="button"
                                                                disabled={submittingAction === `approve_${sub._id}`}
                                                                onClick={() => handleApproveSubmission(sub._id)}
                                                                className="enr-btn-approve"
                                                            >
                                                                {submittingAction === `approve_${sub._id}` ? (
                                                                    <div className="spinner-border spinner-border-sm" style={{ width: '11px', height: '11px' }} />
                                                                ) : (
                                                                    <CheckCircle2 size={13} />
                                                                )}
                                                                <span>{isRejected ? 'Re-Approve & Sync' : 'Approve & Sync'}</span>
                                                            </button>
                                                        )}

                                                        {/* Reject Button */}
                                                        {(!isRejected) && (
                                                            <button
                                                                type="button"
                                                                disabled={submittingAction === `reject_${sub._id}`}
                                                                onClick={() => handleRejectSubmission(sub._id)}
                                                                className="enr-btn-reject"
                                                            >
                                                                <XCircle size={13} />
                                                                <span>Reject</span>
                                                            </button>
                                                        )}

                                                        {/* Delete Button */}
                                                        <button
                                                            type="button"
                                                            disabled={submittingAction === `delete_${sub._id}`}
                                                            onClick={() => handleDeleteSubmission(sub._id)}
                                                            className="enr-btn-delete"
                                                            title="Delete submission record"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 px-sm-4 border-top bg-light bg-opacity-30 d-flex align-items-center justify-content-between">
                    <span className="extra-tiny text-muted">
                        Total Submissions: <strong className="text-main">{counts.total}</strong> ({counts.pending} pending, {counts.approved} approved)
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-sm btn-secondary rounded-pill px-3 py-1 extra-tiny fw-bold"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Receipt Image Lightbox Modal */}
            {viewingReceipt && (
                <div 
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
                    style={{ zIndex: 1300, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)' }}
                    onClick={() => setViewingReceipt(null)}
                >
                    <div 
                        className="position-relative bg-white rounded-4 p-3 shadow-2xl d-flex flex-column"
                        style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                            <span className="fw-black text-main extra-tiny d-flex align-items-center gap-1.5 text-uppercase tracking-wider">
                                <CreditCard size={15} className="text-success" />
                                <span>Verified Payment Receipt Slip</span>
                            </span>
                            <button 
                                type="button" 
                                onClick={() => setViewingReceipt(null)}
                                className="btn btn-sm btn-light rounded-circle p-1 text-muted hover-text-main"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="overflow-auto text-center p-2 rounded-3 bg-light" style={{ maxHeight: '68vh' }}>
                            <img 
                                src={viewingReceipt} 
                                alt="Payment Receipt Slip" 
                                className="img-fluid rounded-3 shadow-xs"
                                style={{ maxHeight: '65vh', objectFit: 'contain' }}
                            />
                        </div>
                        <div className="d-flex align-items-center justify-content-between pt-2.5 border-top mt-2">
                            <a 
                                href={viewingReceipt} 
                                download="payment_receipt.png" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline-primary rounded-pill extra-tiny px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-1"
                            >
                                <ExternalLink size={12} />
                                <span>Open Full Resolution</span>
                            </a>
                            <button 
                                type="button" 
                                onClick={() => setViewingReceipt(null)}
                                className="btn btn-sm btn-secondary rounded-pill extra-tiny px-3 py-1.5"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default EnrollmentManagerModal
