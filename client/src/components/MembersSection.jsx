import React, { useState, useEffect, useMemo } from 'react'
import { 
    Users, Plus, Search, FileDown, Edit3, Trash2, Phone, Mail, 
    ShieldCheck, CheckCircle2, Sparkles, Filter, X, Save, 
    MessageCircle, Award, UserCheck, ChevronDown
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { exportMembersDirectoryPDF } from '../utils/pdfGenerator'

const DEPARTMENTS = [
    'All',
    'Core Committee',
    'Executive Wing',
    'Cultural & Events',
    'Treasury & Accounts',
    'Youth & Volunteers',
    'Logistics & Security',
    'Advisory Board'
]

const ROLE_PRESETS = [
    'President',
    'Vice President',
    'General Secretary',
    'Joint Secretary',
    'Treasurer',
    'Assistant Treasurer',
    'Cultural Incharge',
    'Security / Gate Lead',
    'Logistics Coordinator',
    'Volunteer Head',
    'Committee Member',
    'Youth Wing Lead',
    'Advisory Member',
    'Other / Custom'
]

const getRoleBadgeStyle = (role = '') => {
    const r = role.toLowerCase()
    if (r.includes('president') || r.includes('secretary')) {
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#d97706', border: 'rgba(245, 158, 11, 0.3)' } // Amber Gold
    }
    if (r.includes('treasurer') || r.includes('account')) {
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#059669', border: 'rgba(16, 185, 129, 0.3)' } // Emerald
    }
    if (r.includes('cultural') || r.includes('lead') || r.includes('head')) {
        return { bg: 'rgba(139, 92, 246, 0.15)', text: '#7c3aed', border: 'rgba(139, 92, 246, 0.3)' } // Purple
    }
    return { bg: 'rgba(37, 99, 235, 0.12)', text: '#2563eb', border: 'rgba(37, 99, 235, 0.25)' }     // Blue
}

export default function MembersSection({ type = 'festival', activeEntity = '' }) {
    const { user } = useAuth()
    const isAdmin = ['admin', 'superadmin'].includes(user?.role) || ['admin', 'superadmin'].includes(user?.baseRole)

    const [members, setMembers] = useState([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [selectedDept, setSelectedDept] = useState('All')
    const [selectedStatus, setSelectedStatus] = useState('All')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingMember, setEditingMember] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        role: 'Committee Member',
        customRole: '',
        department: 'Core Committee',
        contact: '',
        countryCode: '+91',
        email: '',
        address: '',
        status: 'Active',
        notes: ''
    })

    const fetchMembers = async () => {
        try {
            setLoading(true)
            const res = await axios.get(`/api/members?type=${type}`)
            setMembers(Array.isArray(res.data) ? res.data : [])
        } catch (err) {
            console.error('Failed to load members:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMembers()
    }, [type, activeEntity])

    // Filtered Members
    const filteredMembers = useMemo(() => {
        return members.filter(m => {
            const matchesSearch = 
                !search.trim() ||
                m.name?.toLowerCase().includes(search.toLowerCase()) ||
                m.role?.toLowerCase().includes(search.toLowerCase()) ||
                m.contact?.includes(search) ||
                m.email?.toLowerCase().includes(search.toLowerCase())

            const matchesDept = selectedDept === 'All' || m.department === selectedDept
            const matchesStatus = selectedStatus === 'All' || m.status === selectedStatus

            return matchesSearch && matchesDept && matchesStatus
        })
    }, [members, search, selectedDept, selectedStatus])

    // KPI Metrics
    const metrics = useMemo(() => {
        const total = members.length
        const execs = members.filter(m => /president|secretary|treasurer|lead|head/i.test(m.role || '')).length
        const active = members.filter(m => m.status === 'Active').length
        return { total, execs, active }
    }, [members])

    // Open Modal
    const handleOpenModal = (member = null) => {
        if (member) {
            setEditingMember(member)
            const isPreset = ROLE_PRESETS.includes(member.role)
            setFormData({
                name: member.name || '',
                role: isPreset ? member.role : 'Other / Custom',
                customRole: isPreset ? '' : member.role,
                department: member.department || 'Core Committee',
                contact: member.contact || '',
                countryCode: member.countryCode || '+91',
                email: member.email || '',
                address: member.address || '',
                status: member.status || 'Active',
                notes: member.notes || ''
            })
        } else {
            setEditingMember(null)
            setFormData({
                name: '',
                role: 'Committee Member',
                customRole: '',
                department: 'Core Committee',
                contact: '',
                countryCode: '+91',
                email: '',
                address: '',
                status: 'Active',
                notes: ''
            })
        }
        setIsModalOpen(true)
    }

    // Submit
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            alert('Please enter member full name.')
            return
        }

        const finalRole = formData.role === 'Other / Custom' 
            ? (formData.customRole.trim() || 'Committee Member')
            : formData.role

        const payload = {
            ...formData,
            role: finalRole,
            type,
            entityName: activeEntity || user?.entityName || 'Vishwa Utsav'
        }

        setSubmitting(true)
        try {
            if (editingMember) {
                const res = await axios.put(`/api/members/${editingMember._id}`, payload)
                setMembers(prev => prev.map(m => m._id === editingMember._id ? res.data : m))
            } else {
                const res = await axios.post('/api/members', payload)
                setMembers(prev => [res.data, ...prev])
            }
            setIsModalOpen(false)
        } catch (err) {
            console.error('Error saving member:', err)
            alert(err.response?.data?.message || 'Failed to save member.')
        } finally {
            setSubmitting(false)
        }
    }

    // Delete
    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to remove "${name}" from the committee roster?`)) return
        try {
            await axios.delete(`/api/members/${id}`)
            setMembers(prev => prev.filter(m => m._id !== id))
        } catch (err) {
            console.error('Error deleting member:', err)
            alert(err.response?.data?.message || 'Failed to delete member.')
        }
    }

    // Download PDF
    const handleDownloadPDF = () => {
        exportMembersDirectoryPDF({
            membersList: filteredMembers,
            entityName: activeEntity || user?.entityName || 'Vishwa Utsav',
            portalType: type === 'festival' ? 'Festival' : 'Event'
        })
    }

    return (
        <div className="members-section-wrapper mb-4">
            {/* Top Bar Header */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                <div>
                    <div className="d-flex align-items-center gap-2">
                        <div className="p-1.5 rounded-2 d-inline-flex" style={{ background: 'rgba(224, 122, 67, 0.15)', color: 'var(--palette-terracotta)' }}>
                            <Users size={18} />
                        </div>
                        <h5 className="fw-extrabold mb-0 text-main" style={{ letterSpacing: '-0.3px' }}>
                            {type === 'festival' ? 'Festival' : 'Event'} Committee &amp; Members
                        </h5>
                    </div>
                    <p className="text-muted extra-tiny mb-0 mt-1">
                        Official executive council, department heads, and festival volunteers for {activeEntity || 'your entity'}.
                    </p>
                </div>

                {/* Right Top Actions: Download PDF & Add Member */}
                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={filteredMembers.length === 0}
                        title="Export Official Committee Members Directory as A4 PDF"
                        className="btn btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill fw-bold shadow-sm transition-all"
                        style={{
                            background: 'var(--input-bg)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-main)',
                            fontSize: '0.78rem'
                        }}
                    >
                        <FileDown size={14} className="text-primary" />
                        <span>Download PDF</span>
                        <span className="badge bg-secondary bg-opacity-25 text-main rounded-pill ms-1" style={{ fontSize: '0.65rem' }}>
                            {filteredMembers.length}
                        </span>
                    </button>

                    {isAdmin && (
                        <button
                            onClick={() => handleOpenModal(null)}
                            className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill fw-bold shadow-sm transition-all hover-glow"
                            style={{ fontSize: '0.78rem' }}
                        >
                            <Plus size={14} />
                            <span>Add Member</span>
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Metric Cards */}
            <div className="row g-2 mb-3">
                <div className="col-12 col-sm-4">
                    <div className="p-2.5 rounded-3 border d-flex align-items-center justify-content-between shadow-xs" style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)' }}>
                        <div>
                            <div className="extra-tiny text-muted fw-bold uppercase">Total Members</div>
                            <div className="fw-extrabold fs-6 text-main mt-0.5">{metrics.total}</div>
                        </div>
                        <div className="p-2 rounded-circle" style={{ background: 'rgba(30, 41, 59, 0.08)', color: 'var(--text-main)' }}>
                            <Users size={16} />
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-4">
                    <div className="p-2.5 rounded-3 border d-flex align-items-center justify-content-between shadow-xs" style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)' }}>
                        <div>
                            <div className="extra-tiny text-muted fw-bold uppercase">Executive Leaders</div>
                            <div className="fw-extrabold fs-6 mt-0.5" style={{ color: '#d97706' }}>{metrics.execs}</div>
                        </div>
                        <div className="p-2 rounded-circle" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
                            <Award size={16} />
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-4">
                    <div className="p-2.5 rounded-3 border d-flex align-items-center justify-content-between shadow-xs" style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)' }}>
                        <div>
                            <div className="extra-tiny text-muted fw-bold uppercase">Active on Roster</div>
                            <div className="fw-extrabold fs-6 text-success mt-0.5">{metrics.active}</div>
                        </div>
                        <div className="p-2 rounded-circle" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
                            <UserCheck size={16} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Department Filters Bar */}
            <div className="p-2.5 rounded-3 border mb-3 d-flex flex-column flex-md-row gap-2 justify-content-between align-items-md-center shadow-xs" style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)' }}>
                {/* Search */}
                <div className="input-group input-group-sm flex-grow-1" style={{ maxWidth: '320px' }}>
                    <span className="input-group-text bg-transparent border-0 text-muted ps-2"><Search size={13} /></span>
                    <input
                        type="text"
                        placeholder="Search by name, role, phone..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="form-control bg-transparent border-0 text-main extra-tiny outline-none shadow-none"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="btn btn-sm btn-link text-muted p-0 pe-2">
                            <X size={13} />
                        </button>
                    )}
                </div>

                {/* Filter Pills */}
                <div className="d-flex align-items-center gap-1.5 overflow-x-auto pb-1 pb-md-0" style={{ scrollbarWidth: 'none' }}>
                    <span className="extra-tiny text-muted me-1 d-none d-lg-inline"><Filter size={11} /> Dept:</span>
                    {DEPARTMENTS.slice(0, 5).map(dept => (
                        <button
                            key={dept}
                            type="button"
                            onClick={() => setSelectedDept(dept)}
                            className={`btn btn-sm py-0.5 px-2.5 rounded-pill transition-all ${selectedDept === dept ? 'btn-primary shadow-xs' : 'btn-outline-secondary text-muted'}`}
                            style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                        >
                            {dept}
                        </button>
                    ))}
                    {DEPARTMENTS.length > 5 && (
                        <select
                            value={DEPARTMENTS.slice(5).includes(selectedDept) ? selectedDept : ''}
                            onChange={e => e.target.value && setSelectedDept(e.target.value)}
                            className="btn btn-sm py-0.5 px-2 rounded-pill btn-outline-secondary text-muted extra-tiny border"
                            style={{ fontSize: '0.7rem', cursor: 'pointer' }}
                        >
                            <option value="">More...</option>
                            {DEPARTMENTS.slice(5).map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Members Directory Grid */}
            {loading ? (
                <div className="text-center py-5 text-muted extra-tiny">
                    <div className="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                    <div>Loading committee roster...</div>
                </div>
            ) : filteredMembers.length === 0 ? (
                <div className="text-center py-5 p-4 rounded-3 border" style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)' }}>
                    <div className="p-3 rounded-circle d-inline-flex mb-2" style={{ background: 'rgba(224, 122, 67, 0.1)', color: 'var(--palette-terracotta)' }}>
                        <Users size={24} />
                    </div>
                    <h6 className="fw-extrabold text-main mb-1" style={{ fontSize: '0.92rem' }}>No Members Found</h6>
                    <p className="text-muted extra-tiny mb-3" style={{ maxWidth: '340px', margin: '0 auto' }}>
                        {search || selectedDept !== 'All' 
                            ? 'No committee member matches your search or department filter.' 
                            : 'No committee or volunteer records added yet. Add your leadership team and volunteers below.'}
                    </p>
                    {isAdmin && (
                        <button
                            onClick={() => handleOpenModal(null)}
                            className="btn btn-sm btn-primary rounded-pill px-3 py-1.5 extra-tiny fw-bold"
                        >
                            <Plus size={13} className="me-1" /> Add First Member
                        </button>
                    )}
                </div>
            ) : (
                <div className="row g-2.5">
                    {filteredMembers.map((member) => {
                        const badgeStyle = getRoleBadgeStyle(member.role)
                        return (
                            <div key={member._id} className="col-12 col-md-6 col-xl-4">
                                <div 
                                    className="p-3 rounded-3 border h-100 d-flex flex-column justify-content-between transition-all shadow-xs hover-glow"
                                    style={{
                                        background: 'var(--input-bg)',
                                        borderColor: 'var(--glass-border)',
                                        cursor: 'default'
                                    }}
                                >
                                    <div>
                                        {/* Card Top: Initials/Avatar + Name + Role Badge */}
                                        <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                                            <div className="d-flex align-items-center gap-2">
                                                {/* Avatar */}
                                                <div 
                                                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-xs"
                                                    style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        minWidth: '36px',
                                                        background: badgeStyle.bg,
                                                        color: badgeStyle.text,
                                                        border: `1.5px solid ${badgeStyle.border}`,
                                                        fontSize: '0.85rem'
                                                    }}
                                                >
                                                    {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
                                                </div>

                                                <div>
                                                    <div className="fw-extrabold text-main mb-0" style={{ fontSize: '0.9rem', lineHeight: '1.2' }}>
                                                        {member.name}
                                                    </div>
                                                    <div className="extra-tiny text-muted">
                                                        {member.department || 'Core Committee'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Dot */}
                                            <span 
                                                className={`badge rounded-pill px-2 py-0.5 fw-bold ${
                                                    member.status === 'Active' 
                                                        ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25' 
                                                        : member.status === 'Honorary'
                                                        ? 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25'
                                                        : 'bg-secondary bg-opacity-10 text-muted border border-secondary border-opacity-25'
                                                }`}
                                                style={{ fontSize: '0.62rem' }}
                                            >
                                                {member.status || 'Active'}
                                            </span>
                                        </div>

                                        {/* Designation Pill */}
                                        <div className="mb-2">
                                            <span 
                                                className="badge rounded-pill px-2.5 py-1 fw-bold"
                                                style={{
                                                    background: badgeStyle.bg,
                                                    color: badgeStyle.text,
                                                    border: `1px solid ${badgeStyle.border}`,
                                                    fontSize: '0.72rem'
                                                }}
                                            >
                                                ★ {member.role}
                                            </span>
                                        </div>

                                        {/* Contact Details */}
                                        <div className="extra-tiny text-muted d-flex flex-column gap-1 mb-2">
                                            {member.contact && (
                                                <div className="d-flex align-items-center gap-1.5">
                                                    <Phone size={11} className="text-muted" />
                                                    <a href={`tel:${member.contact}`} className="text-decoration-none text-main fw-semibold">
                                                        {member.countryCode || '+91'} {member.contact}
                                                    </a>
                                                    <a 
                                                        href={`https://wa.me/${(member.countryCode || '+91').replace(/[^0-9]/g, '')}${member.contact.replace(/[^0-9]/g, '')}`}
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        title="Message on WhatsApp"
                                                        className="text-success ms-1 hover-scale"
                                                    >
                                                        <MessageCircle size={12} />
                                                    </a>
                                                </div>
                                            )}

                                            {member.email && (
                                                <div className="d-flex align-items-center gap-1.5 text-truncate">
                                                    <Mail size={11} className="text-muted" />
                                                    <a href={`mailto:${member.email}`} className="text-decoration-none text-muted text-truncate">
                                                        {member.email}
                                                    </a>
                                                </div>
                                            )}

                                            {member.address && (
                                                <div className="extra-tiny text-muted text-truncate opacity-75">
                                                    📍 {member.address}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Bottom: Admin Actions */}
                                    {isAdmin && (
                                        <div className="d-flex align-items-center justify-content-end gap-1.5 pt-2 border-top border-secondary border-opacity-10 mt-2">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenModal(member)}
                                                className="btn btn-sm btn-light p-1 px-2 rounded extra-tiny text-secondary hover-bg-secondary hover-text-white transition-all"
                                                title="Edit Member"
                                            >
                                                <Edit3 size={12} className="me-1" /> Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(member._id, member.name)}
                                                className="btn btn-sm btn-light p-1 px-2 rounded extra-tiny text-danger hover-bg-danger hover-text-white transition-all"
                                                title="Delete Member"
                                            >
                                                <Trash2 size={12} className="me-1" /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Modal for Add / Edit Member */}
            {isModalOpen && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1060 }}
                >
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '520px' }}>
                        <div 
                            className="modal-content rounded-4 border shadow-lg overflow-hidden"
                            style={{
                                background: 'var(--card-bg, #ffffff)',
                                borderColor: 'var(--glass-border)',
                                color: 'var(--text-main)'
                            }}
                        >
                            {/* Modal Header */}
                            <div className="modal-header border-bottom px-4 py-3" style={{ borderColor: 'var(--glass-border)' }}>
                                <div className="d-flex align-items-center gap-2">
                                    <div className="p-1.5 rounded-2" style={{ background: 'rgba(224, 122, 67, 0.15)', color: 'var(--palette-terracotta)' }}>
                                        <Users size={18} />
                                    </div>
                                    <div>
                                        <h6 className="modal-title fw-extrabold mb-0 text-main" style={{ fontSize: '0.96rem' }}>
                                            {editingMember ? 'Edit Committee Member' : 'Add Committee Member'}
                                        </h6>
                                        <p className="extra-tiny text-muted mb-0">Record executive details for {activeEntity || 'your entity'}</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-close" aria-label="Close"></button>
                            </div>

                            {/* Modal Body Form */}
                            <form onSubmit={handleSubmit} className="p-4">
                                <div className="row g-3">
                                    {/* Full Name */}
                                    <div className="col-12">
                                        <label className="form-label extra-tiny fw-bold text-muted mb-1">
                                            Full Legal Name <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Rajesh Kumar Sharma"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="form-control form-control-sm rounded-3 text-main"
                                            style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)' }}
                                        />
                                    </div>

                                    {/* Designation Preset */}
                                    <div className="col-12 col-sm-6">
                                        <label className="form-label extra-tiny fw-bold text-muted mb-1">
                                            Role / Designation <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                                            className="form-select form-select-sm rounded-3 text-main"
                                            style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)' }}
                                        >
                                            {ROLE_PRESETS.map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Department / Wing */}
                                    <div className="col-12 col-sm-6">
                                        <label className="form-label extra-tiny fw-bold text-muted mb-1">
                                            Department / Wing
                                        </label>
                                        <select
                                            value={formData.department}
                                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                                            className="form-select form-select-sm rounded-3 text-main"
                                            style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)' }}
                                        >
                                            {DEPARTMENTS.filter(d => d !== 'All').map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Custom Role Input if 'Other / Custom' chosen */}
                                    {formData.role === 'Other / Custom' && (
                                        <div className="col-12">
                                            <label className="form-label extra-tiny fw-bold text-muted mb-1">
                                                Custom Designation Title <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Chief Patron, Head of Media, Stage Manager"
                                                value={formData.customRole}
                                                onChange={e => setFormData({ ...formData, customRole: e.target.value })}
                                                className="form-control form-control-sm rounded-3 text-main"
                                                style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)' }}
                                            />
                                        </div>
                                    )}

                                    {/* Phone / Contact */}
                                    <div className="col-12 col-sm-7">
                                        <label className="form-label extra-tiny fw-bold text-muted mb-1">
                                            Contact Phone Number
                                        </label>
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text extra-tiny" style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-muted)' }}>
                                                +91
                                            </span>
                                            <input
                                                type="tel"
                                                placeholder="Mobile / WhatsApp number"
                                                value={formData.contact}
                                                onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                                className="form-control form-control-sm text-main"
                                                style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="col-12 col-sm-5">
                                        <label className="form-label extra-tiny fw-bold text-muted mb-1">
                                            Roster Status
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            className="form-select form-select-sm rounded-3 text-main"
                                            style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)' }}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Honorary">Honorary</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>

                                    {/* Email */}
                                    <div className="col-12">
                                        <label className="form-label extra-tiny fw-bold text-muted mb-1">
                                            Email Address <span className="text-muted">(Optional)</span>
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="e.g. member@vishwautsav.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="form-control form-control-sm rounded-3 text-main"
                                            style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)' }}
                                        />
                                    </div>

                                    {/* Address / Notes */}
                                    <div className="col-12">
                                        <label className="form-label extra-tiny fw-bold text-muted mb-1">
                                            Locality / Residential Address / Notes <span className="text-muted">(Optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Sakaripara Main Road, Ward 4"
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            className="form-control form-control-sm rounded-3 text-main"
                                            style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)' }}
                                        />
                                    </div>
                                </div>

                                {/* Modal Actions */}
                                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top" style={{ borderColor: 'var(--glass-border)' }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="btn btn-sm btn-light px-3 py-1.5 rounded-pill extra-tiny fw-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="btn btn-sm btn-primary px-4 py-1.5 rounded-pill extra-tiny fw-bold d-inline-flex align-items-center gap-1.5 shadow-sm"
                                    >
                                        <Save size={13} />
                                        <span>{submitting ? 'Saving...' : editingMember ? 'Update Member' : 'Save Member'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
