import React, { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Award, Plus, Search, FileDown, Edit3, Trash2, Phone, Mail, 
    ShieldCheck, Sparkles, Filter, X, Save, MessageCircle, 
    ChevronDown, MapPin, Tag, Crown, BadgeCheck, SlidersHorizontal, 
    Eye, EyeOff, Coins, Gift, DollarSign, Building2, CheckCircle2
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { exportSponsorsDirectoryPDF } from '../utils/pdfGenerator'

const SPONSORSHIP_TIERS = [
    'Title Sponsor',
    'Platinum',
    'Gold',
    'Silver',
    'Bronze',
    'Associate Sponsor',
    'Community Donor',
    'In-Kind Donor'
]

const DONATION_CATEGORIES = [
    'All',
    'Cash',
    'In-Kind Services',
    'Food / Prasad',
    'Stage & Sound',
    'Media & Marketing',
    'Logistics & Security',
    'Other'
]

const getTierStyle = (tier = '') => {
    const t = (tier || '').toLowerCase()
    if (t.includes('title')) {
        return {
            bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(217, 119, 6, 0.28))',
            border: '#f59e0b',
            text: '#b45309',
            accentColor: '#f59e0b',
            icon: Crown
        }
    }
    if (t.includes('platinum')) {
        return {
            bg: 'linear-gradient(135deg, rgba(139, 92, 246, 0.14), rgba(124, 58, 237, 0.24))',
            border: '#8b5cf6',
            text: '#6d28d9',
            accentColor: '#8b5cf6',
            icon: Sparkles
        }
    }
    if (t.includes('gold')) {
        return {
            bg: 'linear-gradient(135deg, rgba(234, 179, 8, 0.14), rgba(202, 138, 4, 0.22))',
            border: '#eab308',
            text: '#a16207',
            accentColor: '#eab308',
            icon: Award
        }
    }
    if (t.includes('silver')) {
        return {
            bg: 'linear-gradient(135deg, rgba(148, 163, 184, 0.16), rgba(100, 116, 139, 0.24))',
            border: '#94a3b8',
            text: '#475569',
            accentColor: '#94a3b8',
            icon: BadgeCheck
        }
    }
    if (t.includes('bronze')) {
        return {
            bg: 'linear-gradient(135deg, rgba(205, 127, 50, 0.15), rgba(180, 83, 9, 0.22))',
            border: '#cd7f32',
            text: '#92400e',
            accentColor: '#cd7f32',
            icon: Award
        }
    }
    if (t.includes('in-kind') || t.includes('food')) {
        return {
            bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14), rgba(5, 150, 105, 0.22))',
            border: '#10b981',
            text: '#047857',
            accentColor: '#10b981',
            icon: Gift
        }
    }
    return {
        bg: 'linear-gradient(135deg, rgba(224, 122, 67, 0.14), rgba(217, 90, 34, 0.22))',
        border: '#E07A43',
        text: '#D95A22',
        accentColor: '#E07A43',
        icon: Coins
    }
}

const SponsorsSection = ({ type = 'festival', activeEntity, festivalName = '', eventName = '' }) => {
    const { user } = useAuth()
    const isAdmin = Boolean(
        user && (
            ['admin', 'superadmin'].includes(user.role) ||
            ['admin', 'superadmin'].includes(user.baseRole)
        )
    )

    const activePortalName = festivalName || eventName || ''
    const [sponsors, setSponsors] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedTier, setSelectedTier] = useState('All')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [sortBy, setSortBy] = useState('amount_desc') // amount_desc, entry_asc, entry_desc, name_asc

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSponsor, setEditingSponsor] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    // Global PDF Columns Visibility Config
    const [showPdfColMenu, setShowPdfColMenu] = useState(false)
    const pdfColMenuRef = useRef(null)
    const [pdfColumns, setPdfColumns] = useState(() => {
        try {
            const saved = localStorage.getItem('vishwautsav_sponsor_pdf_cols')
            if (saved) return JSON.parse(saved)
        } catch (_) {}
        return {
            tier: true,
            contribution: true,
            category: true,
            amount: true,
            contact: false,
            paymentStatus: true
        }
    })

    const handleTogglePdfColumn = (colKey) => {
        setPdfColumns(prev => {
            const updated = { ...prev, [colKey]: !prev[colKey] }
            try {
                localStorage.setItem('vishwautsav_sponsor_pdf_cols', JSON.stringify(updated))
            } catch (_) {}
            return updated
        })
    }

    // Close PDF Columns menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (pdfColMenuRef.current && !pdfColMenuRef.current.contains(e.target)) {
                setShowPdfColMenu(false)
            }
        }
        if (showPdfColMenu) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showPdfColMenu])

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        tier: 'Community Donor',
        contribution: '',
        amount: '',
        category: 'Cash',
        contact: '',
        countryCode: '+91',
        email: '',
        address: '',
        paymentMode: 'Cash',
        paymentStatus: 'Received',
        status: 'Active',
        isHidden: false,
        hideAmount: false,
        hideContact: false,
        notes: ''
    })

    const fetchSponsors = async () => {
        try {
            setLoading(true)
            const queryParams = new URLSearchParams()
            if (type) queryParams.set('type', type)
            if (activePortalName) queryParams.set('festOrEventName', activePortalName)

            const res = await axios.get(`/api/sponsors?${queryParams.toString()}`)
            setSponsors(Array.isArray(res.data) ? res.data : [])
        } catch (err) {
            console.error('Failed to load sponsors:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSponsors()
    }, [type, activeEntity, activePortalName])

    // Keyboard ESC listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isModalOpen) {
                setIsModalOpen(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isModalOpen])

    // Filtered Sponsors
    const filteredSponsors = useMemo(() => {
        return sponsors.filter(sp => {
            const q = search.trim().toLowerCase()
            const matchesSearch = 
                !q ||
                sp.name?.toLowerCase().includes(q) ||
                sp.company?.toLowerCase().includes(q) ||
                sp.contribution?.toLowerCase().includes(q) ||
                sp.contact?.includes(q) ||
                sp.email?.toLowerCase().includes(q)

            const matchesTier = selectedTier === 'All' || sp.tier === selectedTier
            const matchesCategory = selectedCategory === 'All' || sp.category === selectedCategory
            const matchesAdminVisibility = isAdmin ? true : !sp.isHidden

            return matchesSearch && matchesTier && matchesCategory && matchesAdminVisibility
        })
    }, [sponsors, search, selectedTier, selectedCategory, isAdmin])

    // Sorted Sponsors
    const sortedSponsors = useMemo(() => {
        let list = [...filteredSponsors]
        if (sortBy === 'amount_desc') {
            list.sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
        } else if (sortBy === 'entry_asc') {
            list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
        } else if (sortBy === 'entry_desc') {
            list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        } else if (sortBy === 'name_asc') {
            list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        }
        return list
    }, [filteredSponsors, sortBy])

    // Visible count for PDF
    const visiblePDFCount = useMemo(() => {
        return sortedSponsors.filter(sp => !sp.isHidden).length
    }, [sortedSponsors])

    // KPI Metrics
    const metrics = useMemo(() => {
        const total = sponsors.length
        const totalAmount = sponsors.reduce((acc, sp) => acc + (Number(sp.amount) || 0), 0)
        const leadCount = sponsors.filter(sp => /title|platinum|gold/i.test(sp.tier || '')).length
        const inKindCount = sponsors.filter(sp => sp.category !== 'Cash').length
        return { total, totalAmount, leadCount, inKindCount }
    }, [sponsors])

    // Modal Handlers
    const handleOpenModal = (sponsor = null) => {
        if (sponsor) {
            setEditingSponsor(sponsor)
            setFormData({
                name: sponsor.name || '',
                company: sponsor.company || '',
                tier: sponsor.tier || 'Community Donor',
                contribution: sponsor.contribution || '',
                amount: sponsor.amount !== undefined ? sponsor.amount : '',
                category: sponsor.category || 'Cash',
                contact: sponsor.contact || '',
                countryCode: sponsor.countryCode || '+91',
                email: sponsor.email || '',
                address: sponsor.address || '',
                paymentMode: sponsor.paymentMode || 'Cash',
                paymentStatus: sponsor.paymentStatus || 'Received',
                status: sponsor.status || 'Active',
                isHidden: Boolean(sponsor.isHidden),
                hideAmount: Boolean(sponsor.hideAmount),
                hideContact: Boolean(sponsor.hideContact),
                notes: sponsor.notes || ''
            })
        } else {
            setEditingSponsor(null)
            setFormData({
                name: '',
                company: '',
                tier: 'Community Donor',
                contribution: '',
                amount: '',
                category: 'Cash',
                contact: '',
                countryCode: '+91',
                email: '',
                address: '',
                paymentMode: 'Cash',
                paymentStatus: 'Received',
                status: 'Active',
                isHidden: false,
                hideAmount: false,
                hideContact: false,
                notes: ''
            })
        }
        setIsModalOpen(true)
    }

    // Toggle Visibility
    const handleToggleVisibility = async (id) => {
        try {
            const res = await axios.patch(`/api/sponsors/${id}/toggle-visibility`)
            setSponsors(prev => prev.map(s => s._id === id ? res.data : s))
        } catch (err) {
            console.error('Error toggling sponsor visibility:', err)
            alert(err.response?.data?.message || 'Failed to toggle visibility.')
        }
    }

    // Submit
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            alert('Please enter sponsor or donor name.')
            return
        }
        if (!formData.contribution.trim()) {
            alert('Please describe what was donated or contributed (e.g., Sound System, Stage Lights, Food Packets, Cash).')
            return
        }

        const payload = {
            ...formData,
            amount: Number(formData.amount) || 0,
            type,
            festOrEventName: activePortalName,
            entityName: activeEntity || user?.entityName || 'Vishwa Utsav'
        }

        setSubmitting(true)
        try {
            if (editingSponsor) {
                const res = await axios.put(`/api/sponsors/${editingSponsor._id}`, payload)
                setSponsors(prev => prev.map(s => s._id === editingSponsor._id ? res.data : s))
            } else {
                const res = await axios.post('/api/sponsors', payload)
                setSponsors(prev => [res.data, ...prev])
            }
            setIsModalOpen(false)
        } catch (err) {
            console.error('Error saving sponsor:', err)
            alert(err.response?.data?.message || 'Failed to save sponsor.')
        } finally {
            setSubmitting(false)
        }
    }

    // Delete
    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to remove sponsor "${name}"?`)) return
        try {
            await axios.delete(`/api/sponsors/${id}`)
            setSponsors(prev => prev.filter(s => s._id !== id))
        } catch (err) {
            console.error('Error deleting sponsor:', err)
            alert(err.response?.data?.message || 'Failed to delete sponsor.')
        }
    }

    // PDF Download
    const handleDownloadPDF = () => {
        const visibleSponsors = sortedSponsors.filter(s => !s.isHidden)
        if (visibleSponsors.length === 0) {
            alert('No visible sponsors found to export.')
            return
        }
        exportSponsorsDirectoryPDF({
            sponsorsList: visibleSponsors,
            entityName: activeEntity || user?.entityName || 'Vishwa Utsav',
            portalType: type === 'festival' ? 'Festival' : 'Event',
            festivalName: activePortalName,
            eventName: activePortalName,
            columnVisibility: pdfColumns
        })
    }

    return (
        <div className="figma-members-container mx-auto w-100 mb-4">
            {/* Top Bar Header */}
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
                <div className="d-flex align-items-center gap-3">
                    <div className="figma-members-header-emblem shadow-sm" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#ffffff' }}>
                        <Coins size={22} />
                    </div>
                    <div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <h4 className="fw-extrabold mb-0 text-main" style={{ letterSpacing: '-0.02em', fontSize: '1.25rem' }}>
                                {activePortalName ? `${activePortalName} — ` : ''}{type === 'festival' ? 'Festival' : 'Event'} Sponsors &amp; Donors
                            </h4>
                            <span className="figma-pass-count-pill shadow-xs" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#b45309', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                                <Crown size={11} /> {metrics.total} Patrons
                            </span>
                        </div>
                        <p className="text-muted extra-tiny mb-0 mt-0.5">
                            Official corporate sponsors, philanthropic donors, and in-kind contributors for{' '}
                            <span className="text-primary fw-bold">{activePortalName || activeEntity || 'your celebration'}</span>
                            {activePortalName && activeEntity ? <span className="text-muted"> ({activeEntity})</span> : null}.
                        </p>
                    </div>
                </div>

                {/* Right Top Actions (Mobile Horizontal Grid) */}
                <div className="d-flex align-items-center gap-2 flex-nowrap w-100 w-sm-auto mt-2 mt-lg-0">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={visiblePDFCount === 0}
                        title="Download Official Sponsors Directory as A4 PDF"
                        className="figma-btn-download-sheet shadow-sm flex-fill flex-sm-grow-0 justify-content-center text-nowrap px-3 px-sm-3.5"
                        style={{ height: '38px', minWidth: '0' }}
                    >
                        <FileDown size={14} className="flex-shrink-0" />
                        <span className="text-truncate">Download PDF</span>
                        <span className="badge bg-white bg-opacity-25 rounded-pill ms-1 text-white flex-shrink-0" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                            {visiblePDFCount}
                        </span>
                    </button>

                    {/* PDF Columns Dropdown */}
                    <div className="position-relative flex-shrink-0" ref={pdfColMenuRef}>
                        <button
                            type="button"
                            onClick={() => setShowPdfColMenu(prev => !prev)}
                            title="Configure PDF Columns"
                            className={`btn btn-sm rounded-pill d-inline-flex align-items-center gap-1 shadow-xs border ${showPdfColMenu ? 'btn-primary text-white' : 'btn-light text-muted hover-text-main'}`}
                            style={{ height: '38px', padding: '0 10px', fontSize: '0.74rem', fontWeight: 600 }}
                        >
                            <SlidersHorizontal size={13} />
                            <span className="d-none d-sm-inline">PDF Columns</span>
                            <ChevronDown size={11} style={{ transform: showPdfColMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>

                        {showPdfColMenu && (
                            <div 
                                className="position-absolute end-0 mt-2 p-3 rounded-4 shadow-lg border"
                                style={{ 
                                    top: '100%', 
                                    zIndex: 1050, 
                                    minWidth: '240px', 
                                    background: 'var(--card-bg, #ffffff)', 
                                    borderColor: 'var(--glass-border)' 
                                }}
                            >
                                <div className="d-flex align-items-center justify-content-between pb-2 border-bottom mb-2">
                                    <span className="extra-tiny fw-bold text-main d-flex align-items-center gap-1">
                                        <SlidersHorizontal size={12} className="text-primary" />
                                        <span>PDF Columns</span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setShowPdfColMenu(false)}
                                        className="btn btn-sm btn-light rounded-circle p-1 extra-tiny text-muted"
                                    >
                                        <X size={11} />
                                    </button>
                                </div>
                                <div className="d-flex flex-column gap-2 mb-2">
                                    {[
                                        { key: 'tier', label: 'Sponsorship Tier' },
                                        { key: 'contribution', label: 'What They Donated' },
                                        { key: 'category', label: 'Donation Category' },
                                        { key: 'amount', label: 'Contribution Amount (₹)' },
                                        { key: 'contact', label: 'Contact Phone Number' },
                                        { key: 'paymentStatus', label: 'Payment / Delivery Status' }
                                    ].map(col => (
                                        <label key={col.key} className="d-flex align-items-center gap-2 extra-tiny text-main cursor-pointer user-select-none mb-0">
                                            <input
                                                type="checkbox"
                                                checked={Boolean(pdfColumns[col.key])}
                                                onChange={() => handleTogglePdfColumn(col.key)}
                                                className="form-check-input mt-0"
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <span>{col.label}</span>
                                        </label>
                                    ))}
                                </div>
                                <div className="pt-2 border-top d-flex justify-content-between align-items-center">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const reset = { tier: true, contribution: true, category: true, amount: true, contact: false, paymentStatus: true }
                                            setPdfColumns(reset)
                                            try { localStorage.setItem('vishwautsav_sponsor_pdf_cols', JSON.stringify(reset)) } catch (_) {}
                                        }}
                                        className="btn btn-link p-0 text-muted extra-tiny text-decoration-none hover-text-main"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowPdfColMenu(false)}
                                        className="btn btn-sm btn-primary rounded-pill px-2.5 py-0.5 extra-tiny text-white fw-bold"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {isAdmin && (
                        <button
                            onClick={() => handleOpenModal(null)}
                            className="btn btn-premium d-inline-flex align-items-center justify-content-center gap-1.5 px-3 px-sm-3.5 py-1.5 rounded-pill fw-bold shadow-sm transition-all hover-glow flex-fill flex-sm-grow-0 text-nowrap"
                            style={{ height: '38px', fontSize: '0.78rem', minWidth: '0' }}
                        >
                            <Plus size={15} className="flex-shrink-0" />
                            <span>Add Sponsor</span>
                        </button>
                    )}
                </div>
            </div>

            {/* 3 Bento KPI Metric Cards */}
            <div className="row g-3 mb-4">
                {/* Card 1: Total Sponsors */}
                <div className="col-12 col-md-4">
                    <div className="figma-member-bento-card bento-total">
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="extra-tiny text-muted fw-bold uppercase tracking-wider">Total Sponsors</span>
                            <div className="figma-finance-icon-box" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                                <Building2 size={17} />
                            </div>
                        </div>
                        <div className="figma-finance-value text-main my-2">
                            {metrics.total}
                        </div>
                        <div className="d-flex align-items-center justify-content-between extra-tiny text-muted">
                            <span className="badge rounded-pill px-2 py-0.5 fw-bold" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>
                                Confirmed &amp; Pledged
                            </span>
                            <span>All Categories</span>
                        </div>
                    </div>
                </div>

                {/* Card 2: Total Funds Raised */}
                <div className="col-12 col-md-4">
                    <div className="figma-member-bento-card bento-active">
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="extra-tiny text-muted fw-bold uppercase tracking-wider">Total Value Raised</span>
                            <div className="figma-finance-icon-box" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                                <DollarSign size={17} />
                            </div>
                        </div>
                        <div className="figma-finance-value my-2" style={{ color: '#059669' }}>
                            ₹{metrics.totalAmount.toLocaleString('en-IN')}
                        </div>
                        <div className="d-flex align-items-center justify-content-between extra-tiny text-muted">
                            <span className="badge rounded-pill px-2 py-0.5 fw-bold" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#047857' }}>
                                Inflow Value
                            </span>
                            <span>Cash &amp; Materials</span>
                        </div>
                    </div>
                </div>

                {/* Card 3: Lead Patrons */}
                <div className="col-12 col-md-4">
                    <div className="figma-member-bento-card bento-execs">
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="extra-tiny text-muted fw-bold uppercase tracking-wider">Key &amp; Lead Patrons</span>
                            <div className="figma-finance-icon-box" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                                <Crown size={17} />
                            </div>
                        </div>
                        <div className="figma-finance-value my-2" style={{ color: '#d97706' }}>
                            {metrics.leadCount}
                        </div>
                        <div className="d-flex align-items-center justify-content-between extra-tiny text-muted">
                            <span className="badge rounded-pill px-2 py-0.5 fw-bold" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#b45309' }}>
                                Title, Platinum &amp; Gold
                            </span>
                            <span>Prime Donors</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Department Filters Toolbar */}
            <div className="figma-members-toolbar mb-4 shadow-xs">
                {/* Row 1: Search Bar + Symmetrical Filters */}
                <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center justify-content-between gap-2.5 mb-2.5">
                    {/* Search Bar */}
                    <div className="input-group action-item-pill search-pill-container px-3 flex-nowrap shadow-xs w-100 flex-lg-grow-1" style={{ height: '38px', maxWidth: '100%' }}>
                        <span className="input-group-text bg-transparent border-0 text-muted ps-1 pe-2 d-flex align-items-center">
                            <Search size={14} />
                        </span>
                        <input
                            type="text"
                            placeholder="Search by sponsor, company, item donated..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="form-control bg-transparent border-0 text-main extra-tiny p-0 shadow-none fw-semibold"
                            style={{ fontSize: '0.78rem' }}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="btn btn-sm btn-link text-muted p-0 pe-1" title="Clear Search">
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* Dual Symmetrical Selectors: 50% / 50% on Mobile */}
                    <div className="d-flex align-items-center gap-2 w-100 w-lg-auto flex-nowrap">
                        <div className="flex-fill" style={{ minWidth: 0 }}>
                            <select
                                value={selectedTier}
                                onChange={e => setSelectedTier(e.target.value)}
                                className="figma-toolbar-select form-select form-select-sm w-100"
                                title="Filter by Tier"
                            >
                                <option value="All">All Tiers ({metrics.total})</option>
                                {SPONSORSHIP_TIERS.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-fill" style={{ minWidth: 0 }}>
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="figma-toolbar-select form-select form-select-sm w-100"
                                title="Sort Sponsors"
                            >
                                <option value="amount_desc">Amount: Highest First</option>
                                <option value="entry_asc">Order: First Added</option>
                                <option value="entry_desc">Order: Newest First</option>
                                <option value="name_asc">Name: A to Z</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Row 2: Category Chips */}
                <div className="d-flex align-items-center gap-1.5 w-100 pt-2 border-top border-secondary border-opacity-10">
                    <span className="extra-tiny text-muted me-1 fw-bold d-none d-sm-inline-flex align-items-center flex-shrink-0">
                        <Filter size={11} className="me-1" />Category:
                    </span>
                    <div className="figma-dept-scroll flex-grow-1 pe-2 py-0.5">
                        {DONATION_CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={`figma-dept-pill flex-shrink-0 ${selectedCategory === cat ? 'active' : ''}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sponsors Grid Content */}
            {loading ? (
                <div className="text-center py-5 text-muted extra-tiny">
                    <div className="spinner-border spinner-border-sm text-warning mb-2" role="status"></div>
                    <div>Loading verified sponsors and donors...</div>
                </div>
            ) : sortedSponsors.length === 0 ? (
                <div className="figma-member-empty-hero my-3 shadow-xs">
                    <div className="figma-members-header-emblem mx-auto mb-3" style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(245, 158, 11, 0.15)', color: '#d97706' }}>
                        <Coins size={28} />
                    </div>
                    <h5 className="fw-extrabold text-main mb-1" style={{ fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
                        {search || selectedTier !== 'All' || selectedCategory !== 'All' ? 'No Matching Sponsors Found' : 'Record Your First Sponsor & Donor'}
                    </h5>
                    <p className="text-muted extra-tiny mb-4" style={{ maxWidth: '440px', margin: '0 auto', lineHeight: '1.5' }}>
                        {search || selectedTier !== 'All' || selectedCategory !== 'All'
                            ? 'No sponsor records matched your search query or filter. Try clearing filters.'
                            : `Recognize your festival and event patrons, track what they donated (sound, stage, food, cash), and feature them on official attendee PDFs.`}
                    </p>
                    {isAdmin && (
                        <button
                            onClick={() => handleOpenModal(null)}
                            className="btn btn-premium px-4 py-2 rounded-pill fw-bold extra-tiny shadow-sm hover-glow"
                        >
                            <Plus size={14} className="me-1.5" />
                            <span>Add First Sponsor / Donor</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="row g-3 g-xl-4">
                    {sortedSponsors.map((sponsor) => {
                        const style = getTierStyle(sponsor.tier)
                        const TierIcon = style.icon

                        return (
                            <div key={sponsor._id} className="col-12 col-md-6 col-xl-4">
                                <div 
                                    className={`figma-luxury-sponsor-card ${sponsor.isHidden ? 'sponsor-card-hidden' : ''}`}
                                    style={{ borderTop: `3.5px solid ${style.accentColor}` }}
                                >
                                    <div>
                                        {/* Card Top: Avatar, Name & Status with Generous Separation */}
                                        <div className="d-flex align-items-center justify-content-between gap-3 pb-3 mb-3 border-bottom border-secondary border-opacity-10">
                                            <div className="d-flex align-items-center gap-2.5" style={{ minWidth: 0 }}>
                                                {/* Circular Luxury Avatar */}
                                                <div 
                                                    className="figma-sponsor-avatar shadow-xs"
                                                    style={{
                                                        background: style.bg,
                                                        color: style.text,
                                                        border: `2px solid ${style.border}`
                                                    }}
                                                >
                                                    {sponsor.name ? sponsor.name.charAt(0).toUpperCase() : 'S'}
                                                </div>

                                                <div className="text-truncate">
                                                    <h6 className="fw-extrabold text-main mb-0.5 text-truncate" style={{ fontSize: '1rem', letterSpacing: '-0.01em' }}>
                                                        {sponsor.name}
                                                    </h6>
                                                    {sponsor.company ? (
                                                        <div className="extra-tiny text-muted d-flex align-items-center gap-1 mt-0.5 text-truncate">
                                                            <Building2 size={11} className="text-terracotta flex-shrink-0" />
                                                            <span className="fw-semibold text-truncate">{sponsor.company}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="extra-tiny text-muted mt-0.5 opacity-75">
                                                            Individual Patron
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status Badges */}
                                            <div className="d-flex align-items-center gap-1.5 flex-wrap justify-content-end flex-shrink-0">
                                                {sponsor.isHidden && (
                                                    <span 
                                                        className="badge rounded-pill px-2 py-0.5 fw-bold bg-warning bg-opacity-15 text-warning border border-warning border-opacity-35 d-inline-flex align-items-center gap-1"
                                                        style={{ fontSize: '0.62rem' }}
                                                        title="Hidden from public & PDF"
                                                    >
                                                        <EyeOff size={10} />
                                                        <span>No PDF</span>
                                                    </span>
                                                )}
                                                <span 
                                                    className={`badge rounded-pill px-2.5 py-1 fw-bold d-inline-flex align-items-center gap-1 shadow-2xs ${
                                                        sponsor.paymentStatus === 'Received' 
                                                            ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25' 
                                                            : sponsor.paymentStatus === 'Pledged'
                                                            ? 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25'
                                                            : 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25'
                                                    }`}
                                                    style={{ fontSize: '0.64rem' }}
                                                >
                                                    {sponsor.paymentStatus === 'Received' ? <CheckCircle2 size={10} /> : <span style={{ fontSize: '0.55rem' }}>●</span>}
                                                    <span>{sponsor.paymentStatus || 'Received'}</span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Distinct Tier & Category Badges Row */}
                                        <div className="d-flex align-items-center justify-content-between gap-2 mb-3 flex-wrap">
                                            <span 
                                                className="badge rounded-pill px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-1.5 shadow-xs"
                                                style={{
                                                    background: style.bg,
                                                    color: style.text,
                                                    border: `1.5px solid ${style.border}`,
                                                    fontSize: '0.74rem',
                                                    letterSpacing: '0.2px'
                                                }}
                                            >
                                                <TierIcon size={13} />
                                                <span>{sponsor.tier || 'Community Donor'}</span>
                                            </span>
                                            <span 
                                                className="badge rounded-pill px-2.5 py-1 fw-semibold d-inline-flex align-items-center gap-1 extra-tiny"
                                                style={{
                                                    background: 'rgba(0, 0, 0, 0.04)',
                                                    color: 'var(--text-muted, #64748b)',
                                                    border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.08))',
                                                    fontSize: '0.68rem'
                                                }}
                                            >
                                                <Tag size={10} />
                                                <span>{sponsor.category || 'Cash'}</span>
                                            </span>
                                        </div>

                                        {/* Redesigned Bento Donation Capsule */}
                                        <div className="figma-sponsor-donation-hero mb-3">
                                            <div className="d-flex align-items-start justify-content-between gap-2 mb-1.5">
                                                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                                    <span className="figma-donation-hero-label d-inline-flex align-items-center gap-1 mb-1">
                                                        <Gift size={11} style={{ color: style.accentColor }} />
                                                        <span>Donated / Contributed:</span>
                                                    </span>
                                                    <div className="figma-donation-hero-item text-truncate" title={sponsor.contribution}>
                                                        {sponsor.contribution || 'Undisclosed Contribution'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="figma-donation-hero-footer d-flex align-items-center justify-content-between pt-2 mt-1">
                                                <span className="figma-donation-hero-label mb-0">Value / Amount:</span>
                                                <div className="d-flex align-items-baseline gap-1">
                                                    <span className="figma-donation-hero-amount">
                                                        {sponsor.hideAmount && !isAdmin ? '••••••' : `₹${(Number(sponsor.amount) || 0).toLocaleString('en-IN')}`}
                                                    </span>
                                                    {sponsor.hideAmount && (
                                                        <span className="badge rounded-pill bg-warning bg-opacity-20 text-dark extra-tiny px-1.5 py-0" style={{ fontSize: '0.55rem' }}>
                                                            Protected
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contact & WhatsApp Bar */}
                                        <div className="figma-sponsor-contact-box mb-3">
                                            {sponsor.contact ? (
                                                <div className="d-flex align-items-center justify-content-between gap-2 p-1.5 px-2.5 rounded-3 contact-row">
                                                    <div className="d-flex align-items-center gap-2 text-truncate" style={{ minWidth: 0 }}>
                                                        <div className="contact-icon-pill">
                                                            <Phone size={12} />
                                                        </div>
                                                        <a href={`tel:${sponsor.contact}`} className="contact-phone-link text-truncate">
                                                            {sponsor.countryCode || '+91'} {sponsor.contact}
                                                        </a>
                                                    </div>
                                                    <a 
                                                        href={`https://wa.me/${(sponsor.countryCode || '+91').replace(/[^0-9]/g, '')}${sponsor.contact.replace(/[^0-9]/g, '')}`}
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        title="Direct WhatsApp Message"
                                                        className="whatsapp-action-pill"
                                                    >
                                                        <MessageCircle size={13} />
                                                        <span className="d-none d-sm-inline">WhatsApp</span>
                                                    </a>
                                                </div>
                                            ) : null}

                                            {(sponsor.address || sponsor.email) && (
                                                <div className="d-flex align-items-center gap-3 px-1 mt-1.5 flex-wrap extra-tiny text-muted">
                                                    {sponsor.address && (
                                                        <div className="d-flex align-items-center gap-1 text-truncate" title={sponsor.address} style={{ maxWidth: '100%' }}>
                                                            <MapPin size={11} className="text-terracotta flex-shrink-0" />
                                                            <span className="text-truncate">{sponsor.address}</span>
                                                        </div>
                                                    )}
                                                    {sponsor.email && (
                                                        <div className="d-flex align-items-center gap-1 text-truncate" title={sponsor.email} style={{ maxWidth: '100%' }}>
                                                            <Mail size={11} className="text-primary flex-shrink-0" />
                                                            <a href={`mailto:${sponsor.email}`} className="text-muted text-decoration-none text-truncate">
                                                                {sponsor.email}
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Bottom: Admin Controls */}
                                    {isAdmin && (
                                        <div className="d-flex align-items-center justify-content-between pt-2.5 border-top border-secondary border-opacity-10 mt-2">
                                            <span className="figma-sponsor-id-badge">
                                                ID: {sponsor._id ? sponsor._id.slice(-6).toUpperCase() : 'SPON'}
                                            </span>

                                            <div className="d-flex align-items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleVisibility(sponsor._id)}
                                                    className={`figma-action-pill-btn ${sponsor.isHidden ? 'active-hidden' : ''}`}
                                                    title={sponsor.isHidden ? 'Click to unhide from directory & PDF' : 'Click to hide from directory & PDF'}
                                                >
                                                    {sponsor.isHidden ? <Eye size={12} /> : <EyeOff size={12} />}
                                                    <span>{sponsor.isHidden ? 'Unhide' : 'Hide'}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenModal(sponsor)}
                                                    className="figma-action-pill-btn edit-btn"
                                                    title="Edit Sponsor Details"
                                                >
                                                    <Edit3 size={12} />
                                                    <span>Edit</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(sponsor._id, sponsor.name)}
                                                    className="figma-action-pill-btn delete-btn"
                                                    title="Remove Sponsor Record"
                                                >
                                                    <Trash2 size={12} />
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ADD / EDIT SPONSOR MODAL (PORTAL MOUNTED FOR ALL SCREENS) */}
            {isModalOpen && createPortal(
                <div 
                    className="d-flex align-items-center justify-content-center p-2.5 p-sm-4"
                    style={{ 
                        position: 'fixed', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0, 
                        width: '100vw', 
                        height: '100dvh', 
                        zIndex: 99999, 
                        backgroundColor: 'rgba(0, 0, 0, 0.45)', 
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                        overflowY: 'auto'
                    }}
                    onClick={() => setIsModalOpen(false)}
                >
                    <div 
                        className="luxury-modal-card w-100 shadow-2xl rounded-4 overflow-hidden d-flex flex-column"
                        style={{ 
                            maxWidth: '620px', 
                            maxHeight: 'min(88dvh, 740px)', 
                            height: 'auto',
                            margin: 'auto',
                            background: 'var(--card-bg, #ffffff)', 
                            border: '1.5px solid var(--glass-border)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' 
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div 
                            className="d-flex align-items-center justify-content-between px-3 px-sm-4 py-3 border-bottom flex-shrink-0"
                            style={{ 
                                borderColor: 'var(--glass-border)', 
                                background: 'linear-gradient(to right, rgba(245, 158, 11, 0.08), transparent)' 
                            }}
                        >
                            <div className="d-flex align-items-center gap-2.5">
                                <div 
                                    className="d-flex align-items-center justify-content-center rounded-circle shadow-xs"
                                    style={{ width: '38px', height: '38px', background: 'rgba(245, 158, 11, 0.16)', color: '#d97706' }}
                                >
                                    <Coins size={20} />
                                </div>
                                <div>
                                    <h5 className="fw-extrabold mb-0 text-main" style={{ fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
                                        {editingSponsor ? 'Edit Sponsor & Donor' : 'Add New Sponsor / Donor'}
                                    </h5>
                                    <p className="extra-tiny text-muted mb-0">
                                        Record patronage and contributions for {activePortalName || activeEntity || 'your celebration'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="btn btn-sm btn-light rounded-circle p-1.5 text-muted hover-text-main flex-shrink-0"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Scrollable Form Body */}
                        <form onSubmit={handleSubmit} className="d-flex flex-column flex-grow-1 overflow-hidden">
                            <div className="modal-body-scrollable px-3 px-sm-4 py-3 flex-grow-1 overflow-y-auto">
                                <div className="row g-3">
                                    {/* Full Legal Name */}
                                    <div className="col-12 col-sm-7">
                                        <label className="luxury-label mb-1">
                                            <Award size={12} className="text-warning" />
                                            <span>Sponsor / Donor Full Name</span>
                                            <span className="text-danger">*</span>
                                        </label>
                                        <div className="luxury-input-wrapper">
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Rajesh Kumar Sharma"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="luxury-input-field ps-3"
                                            />
                                        </div>
                                    </div>

                                    {/* Company / Brand */}
                                    <div className="col-12 col-sm-5">
                                        <label className="luxury-label mb-1">
                                            <Building2 size={12} className="text-warning" />
                                            <span>Company / Brand</span>
                                            <span className="text-muted text-lowercase" style={{ fontSize: '0.65rem' }}>(Optional)</span>
                                        </label>
                                        <div className="luxury-input-wrapper">
                                            <input
                                                type="text"
                                                placeholder="e.g. Shree Balaji Traders"
                                                value={formData.company}
                                                onChange={e => setFormData({ ...formData, company: e.target.value })}
                                                className="luxury-input-field ps-3"
                                            />
                                        </div>
                                    </div>

                                    {/* Tier */}
                                    <div className="col-12 col-sm-6">
                                        <label className="luxury-label mb-1">
                                            <Crown size={12} className="text-warning" />
                                            <span>Sponsorship Tier</span>
                                        </label>
                                        <div className="luxury-input-wrapper">
                                            <select
                                                value={formData.tier}
                                                onChange={e => setFormData({ ...formData, tier: e.target.value })}
                                                className="luxury-input-field ps-3 fw-semibold"
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {SPONSORSHIP_TIERS.map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Category */}
                                    <div className="col-12 col-sm-6">
                                        <label className="luxury-label mb-1">
                                            <Tag size={12} className="text-warning" />
                                            <span>Contribution Category</span>
                                        </label>
                                        <div className="luxury-input-wrapper">
                                            <select
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                className="luxury-input-field ps-3 fw-semibold"
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {DONATION_CATEGORIES.filter(c => c !== 'All').map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* What they Donated */}
                                    <div className="col-12">
                                        <label className="luxury-label mb-1">
                                            <Gift size={12} className="text-warning" />
                                            <span>What Was Donated / Contributed</span>
                                            <span className="text-danger">*</span>
                                        </label>
                                        <div className="luxury-input-wrapper">
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Stage Sound & Lighting Setup, 500 Bhog Packets, ₹51,000 Cash"
                                                value={formData.contribution}
                                                onChange={e => setFormData({ ...formData, contribution: e.target.value })}
                                                className="luxury-input-field ps-3"
                                            />
                                        </div>
                                    </div>

                                    {/* Contribution Amount in INR */}
                                    <div className="col-12 col-sm-6">
                                        <div className="d-flex align-items-center justify-content-between mb-1">
                                            <label className="luxury-label mb-0">
                                                <DollarSign size={12} className="text-warning" />
                                                <span>Amount / Value (₹)</span>
                                                <span className="text-danger">*</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, hideAmount: !prev.hideAmount }))}
                                                className={`btn btn-link p-0 text-decoration-none extra-tiny d-inline-flex align-items-center gap-1 ${formData.hideAmount ? 'text-warning fw-bold' : 'text-muted'}`}
                                                title={formData.hideAmount ? "Amount hidden from PDF" : "Amount visible in PDF"}
                                            >
                                                {formData.hideAmount ? <EyeOff size={11} className="text-warning" /> : <Eye size={11} />}
                                                <span>{formData.hideAmount ? 'Hidden' : 'Visible'}</span>
                                            </button>
                                        </div>
                                        <div className="luxury-input-wrapper">
                                            <span className="extra-tiny fw-bold text-muted ps-3 pe-1">₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                required
                                                placeholder="e.g. 51000"
                                                value={formData.amount}
                                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                                className="luxury-input-field ps-1"
                                            />
                                        </div>
                                    </div>

                                    {/* Payment Status */}
                                    <div className="col-12 col-sm-6">
                                        <label className="luxury-label mb-1">
                                            <ShieldCheck size={12} className="text-warning" />
                                            <span>Delivery / Payment Status</span>
                                        </label>
                                        <div className="luxury-input-wrapper">
                                            <select
                                                value={formData.paymentStatus}
                                                onChange={e => setFormData({ ...formData, paymentStatus: e.target.value })}
                                                className="luxury-input-field ps-3 fw-semibold"
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <option value="Received">Received &amp; Verified</option>
                                                <option value="Pledged">Pledged / Promised</option>
                                                <option value="Partial">Partial Received</option>
                                                <option value="Pending">Pending</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Contact Phone Number */}
                                    <div className="col-12 col-sm-6">
                                        <div className="d-flex align-items-center justify-content-between mb-1">
                                            <label className="luxury-label mb-0">
                                                <Phone size={12} className="text-warning" />
                                                <span>Phone Number</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, hideContact: !prev.hideContact }))}
                                                className={`btn btn-link p-0 text-decoration-none extra-tiny d-inline-flex align-items-center gap-1 ${formData.hideContact ? 'text-warning fw-bold' : 'text-muted'}`}
                                            >
                                                {formData.hideContact ? <EyeOff size={11} className="text-warning" /> : <Eye size={11} />}
                                                <span>{formData.hideContact ? 'Hidden' : 'Visible'}</span>
                                            </button>
                                        </div>
                                        <div className="luxury-input-wrapper">
                                            <span className="extra-tiny fw-bold text-muted ps-3 pe-2" style={{ borderRight: '1px solid var(--glass-border)' }}>+91</span>
                                            <input
                                                type="tel"
                                                placeholder="Mobile / WhatsApp"
                                                value={formData.contact}
                                                onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                                className="luxury-input-field ps-2"
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="col-12 col-sm-6">
                                        <label className="luxury-label mb-1">
                                            <Mail size={12} className="text-warning" />
                                            <span>Email Address</span>
                                            <span className="text-muted text-lowercase" style={{ fontSize: '0.65rem' }}>(Optional)</span>
                                        </label>
                                        <div className="luxury-input-wrapper">
                                            <input
                                                type="email"
                                                placeholder="sponsor@organization.com"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                className="luxury-input-field ps-3"
                                            />
                                        </div>
                                    </div>

                                    {/* Address / Notes */}
                                    <div className="col-12">
                                        <label className="luxury-label mb-1">
                                            <MapPin size={12} className="text-warning" />
                                            <span>Address / Locality / Notes</span>
                                            <span className="text-muted text-lowercase" style={{ fontSize: '0.65rem' }}>(Optional)</span>
                                        </label>
                                        <div className="luxury-input-wrapper">
                                            <input
                                                type="text"
                                                placeholder="e.g. City Plaza, Main Road, Ward 2"
                                                value={formData.address}
                                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                                className="luxury-input-field ps-3"
                                            />
                                        </div>
                                    </div>

                                    {/* Hide Sponsor from PDF Switch */}
                                    <div className="col-12">
                                        <div 
                                            className="d-flex align-items-center justify-content-between p-2.5 px-3 rounded-3 border"
                                            style={{ 
                                                borderColor: formData.isHidden ? 'rgba(245, 158, 11, 0.45)' : 'var(--glass-border)', 
                                                background: formData.isHidden ? 'rgba(245, 158, 11, 0.08)' : 'var(--input-bg)' 
                                            }}
                                        >
                                            <div className="d-flex align-items-center gap-2.5">
                                                <div 
                                                    className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                                    style={{ 
                                                        width: '32px', 
                                                        height: '32px', 
                                                        background: formData.isHidden ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.12)',
                                                        color: formData.isHidden ? '#d97706' : '#10b981'
                                                    }}
                                                >
                                                    {formData.isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </div>
                                                <div>
                                                    <div className="extra-tiny fw-bold text-main d-flex align-items-center gap-1.5">
                                                        <span>Hide Sponsor from Public Directory &amp; PDFs</span>
                                                        {formData.isHidden && (
                                                            <span className="badge rounded-pill bg-warning text-dark px-1.5" style={{ fontSize: '0.6rem' }}>
                                                                Hidden
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="extra-tiny text-muted mb-0" style={{ fontSize: '0.67rem' }}>
                                                        {formData.isHidden 
                                                            ? 'Sponsor is hidden and will NOT be included in any attendee receipts, master PDFs, or exported directories.'
                                                            : 'Sponsor is visible and will be honored in attendee receipts and PDFs.'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="form-check form-switch m-0 ps-0">
                                                <input
                                                    type="checkbox"
                                                    role="switch"
                                                    className="form-check-input ms-0"
                                                    id="sponsorIsHiddenToggle"
                                                    checked={formData.isHidden}
                                                    onChange={e => setFormData({ ...formData, isHidden: e.target.checked })}
                                                    style={{ cursor: 'pointer', width: '2.4em', height: '1.25em' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pinned Modal Footer */}
                            <div 
                                className="d-flex justify-content-end align-items-center gap-2.5 px-3 px-sm-4 py-3 border-top flex-shrink-0" 
                                style={{ 
                                    borderColor: 'var(--glass-border)', 
                                    background: 'var(--card-bg, #ffffff)' 
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="btn btn-sm btn-light rounded-pill px-3.5 py-1.5 extra-tiny text-muted fw-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn btn-premium d-inline-flex align-items-center gap-1.5 px-4 py-1.5 rounded-pill extra-tiny fw-bold shadow-sm"
                                >
                                    <Save size={13} />
                                    <span>{submitting ? 'Saving...' : editingSponsor ? 'Update Sponsor' : 'Save Sponsor'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}

export default SponsorsSection
