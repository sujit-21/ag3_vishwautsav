import React, { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Users, Plus, Search, FileDown, Edit3, Trash2, Phone, Mail, 
    ShieldCheck, CheckCircle2, Sparkles, Filter, X, Save, 
    MessageCircle, Award, UserCheck, ChevronDown, MapPin, Tag, Crown,
    BadgeCheck, ExternalLink, Settings, Check, Edit2, Eye, EyeOff, SlidersHorizontal
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { exportMembersDirectoryPDF } from '../utils/pdfGenerator'

const DEFAULT_DEPARTMENTS = [
    'Core Committee',
    'Executive Wing',
    'Cultural & Events',
    'Treasury & Accounts',
    'Youth & Volunteers',
    'Logistics & Security',
    'Advisory Board'
]

const DEFAULT_ROLE_PRESETS = [
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
    'Advisory Member'
]

const getRoleStyle = (role = '') => {
    const r = role.toLowerCase()
    if (r.includes('president') || r.includes('secretary')) {
        return { 
            bg: 'rgba(245, 158, 11, 0.12)', 
            text: '#b45309', 
            border: 'rgba(245, 158, 11, 0.35)',
            accent: '#f59e0b',
            icon: Crown
        }
    }
    if (r.includes('treasurer') || r.includes('account')) {
        return { 
            bg: 'rgba(16, 185, 129, 0.12)', 
            text: '#047857', 
            border: 'rgba(16, 185, 129, 0.35)',
            accent: '#10b981',
            icon: ShieldCheck
        }
    }
    if (r.includes('cultural') || r.includes('lead') || r.includes('head')) {
        return { 
            bg: 'rgba(139, 92, 246, 0.12)', 
            text: '#6d28d9', 
            border: 'rgba(139, 92, 246, 0.35)',
            accent: '#8b5cf6',
            icon: Sparkles
        }
    }
    return { 
        bg: 'rgba(37, 99, 235, 0.1)', 
        text: '#1d4ed8', 
        border: 'rgba(37, 99, 235, 0.3)',
        accent: '#3b82f6',
        icon: Users
    }
}

export default function MembersSection({ 
    type = 'festival', 
    activeEntity = '', 
    festivalName = '', 
    eventName = '' 
}) {
    const { user } = useAuth()
    const isAdmin = ['admin', 'superadmin'].includes(user?.role) || ['admin', 'superadmin'].includes(user?.baseRole)
    const activePortalName = String(festivalName || eventName || '').trim()

    const [members, setMembers] = useState([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [selectedDept, setSelectedDept] = useState('All')
    const [selectedStatus, setSelectedStatus] = useState('All')
    const [sortBy, setSortBy] = useState('entry_asc') // Default: First Entered First
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingMember, setEditingMember] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    // CRUD State for Roles and Departments
    const [customRoles, setCustomRoles] = useState(() => {
        try {
            const saved = localStorage.getItem('vishwautsav_custom_roles')
            return saved ? JSON.parse(saved) : []
        } catch (e) {
            return []
        }
    })

    const [customDepts, setCustomDepts] = useState(() => {
        try {
            const saved = localStorage.getItem('vishwautsav_custom_depts')
            return saved ? JSON.parse(saved) : []
        } catch (e) {
            return []
        }
    })

    // Inline quick-add state for form dropdowns
    const [isAddingInlineRole, setIsAddingInlineRole] = useState(false)
    const [inlineRoleName, setInlineRoleName] = useState('')
    const [isAddingInlineDept, setIsAddingInlineDept] = useState(false)
    const [inlineDeptName, setInlineDeptName] = useState('')

    // Dedicated CRUD Manager Modal state
    const [isManagerOpen, setIsManagerOpen] = useState(false)
    const [managerTab, setManagerTab] = useState('roles') // 'roles' | 'departments'
    const [managerNewName, setManagerNewName] = useState('')
    const [editingItemName, setEditingItemName] = useState(null) // { type: 'roles'|'departments', oldName: string, currentVal: string }

    // Sync custom roles & depts to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('vishwautsav_custom_roles', JSON.stringify(customRoles))
        } catch (e) {}
    }, [customRoles])

    useEffect(() => {
        try {
            localStorage.setItem('vishwautsav_custom_depts', JSON.stringify(customDepts))
        } catch (e) {}
    }, [customDepts])

    // Dynamic aggregated roles and departments
    const allRoles = useMemo(() => {
        const set = new Set([...DEFAULT_ROLE_PRESETS, ...customRoles])
        members.forEach(m => {
            if (m.role && m.role.trim() && m.role !== 'Other / Custom') set.add(m.role.trim())
        })
        return Array.from(set)
    }, [customRoles, members])

    const allDepartments = useMemo(() => {
        const set = new Set([...DEFAULT_DEPARTMENTS, ...customDepts])
        members.forEach(m => {
            if (m.department && m.department.trim() && m.department !== 'All') set.add(m.department.trim())
        })
        return Array.from(set)
    }, [customDepts, members])

    // CRUD Handlers for Roles
    const handleAddCustomRole = (name) => {
        const trimmed = String(name || '').trim()
        if (!trimmed) return
        if (!allRoles.includes(trimmed)) {
            setCustomRoles(prev => [...prev, trimmed])
        }
        setFormData(prev => ({ ...prev, role: trimmed }))
        setIsAddingInlineRole(false)
        setInlineRoleName('')
    }

    const handleRenameRole = (oldName, newName) => {
        const trimmed = String(newName || '').trim()
        if (!trimmed || trimmed === oldName) {
            setEditingItemName(null)
            return
        }
        setCustomRoles(prev => prev.map(r => r === oldName ? trimmed : r))
        if (formData.role === oldName) {
            setFormData(prev => ({ ...prev, role: trimmed }))
        }
        setEditingItemName(null)
    }

    const handleDeleteRole = (nameToDelete) => {
        if (!window.confirm(`Delete custom role "${nameToDelete}"?`)) return
        setCustomRoles(prev => prev.filter(r => r !== nameToDelete))
        if (formData.role === nameToDelete) {
            setFormData(prev => ({ ...prev, role: 'Committee Member' }))
        }
    }

    // CRUD Handlers for Departments
    const handleAddCustomDept = (name) => {
        const trimmed = String(name || '').trim()
        if (!trimmed) return
        if (!allDepartments.includes(trimmed)) {
            setCustomDepts(prev => [...prev, trimmed])
        }
        setFormData(prev => ({ ...prev, department: trimmed }))
        setIsAddingInlineDept(false)
        setInlineDeptName('')
    }

    const handleRenameDept = (oldName, newName) => {
        const trimmed = String(newName || '').trim()
        if (!trimmed || trimmed === oldName) {
            setEditingItemName(null)
            return
        }
        setCustomDepts(prev => prev.map(d => d === oldName ? trimmed : d))
        if (formData.department === oldName) {
            setFormData(prev => ({ ...prev, department: trimmed }))
        }
        setEditingItemName(null)
    }

    const handleDeleteDept = (nameToDelete) => {
        if (!window.confirm(`Delete custom department / wing "${nameToDelete}"?`)) return
        setCustomDepts(prev => prev.filter(d => d !== nameToDelete))
        if (formData.department === nameToDelete) {
            setFormData(prev => ({ ...prev, department: 'Core Committee' }))
        }
    }

    // Global PDF Columns Visibility Config (Option B)
    const [showPdfColMenu, setShowPdfColMenu] = useState(false)
    const pdfColMenuRef = useRef(null)
    const [pdfColumns, setPdfColumns] = useState(() => {
        try {
            const saved = localStorage.getItem('vishwautsav_member_pdf_cols')
            if (saved) return JSON.parse(saved)
        } catch (_) {}
        return {
            role: true,
            department: true,
            contact: true,
            email: true,
            address: false,
            status: true
        }
    })

    const handleTogglePdfColumn = (colKey) => {
        setPdfColumns(prev => {
            const updated = { ...prev, [colKey]: !prev[colKey] }
            try {
                localStorage.setItem('vishwautsav_member_pdf_cols', JSON.stringify(updated))
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

    // Form State (Option A: per-field privacy)
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
        isHidden: false,
        hidePhone: false,
        hideEmail: false,
        hideAddress: false,
        hideRole: false,
        hideDepartment: false,
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

    // Keyboard ESC listener to safely close modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isModalOpen) {
                setIsModalOpen(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isModalOpen])

    // Filtered Members (With full Hide / Visibility support)
    const filteredMembers = useMemo(() => {
        return members.filter(m => {
            const matchesSearch = 
                !search.trim() ||
                m.name?.toLowerCase().includes(search.toLowerCase()) ||
                m.role?.toLowerCase().includes(search.toLowerCase()) ||
                m.contact?.includes(search) ||
                m.email?.toLowerCase().includes(search.toLowerCase()) ||
                m.address?.toLowerCase().includes(search.toLowerCase())

            const matchesDept = selectedDept === 'All' || m.department === selectedDept

            // Status & Visibility filter:
            let matchesStatus = true
            if (selectedStatus === 'Hidden') {
                matchesStatus = Boolean(m.isHidden)
            } else if (selectedStatus === 'Visible') {
                matchesStatus = !m.isHidden
            } else if (selectedStatus !== 'All') {
                matchesStatus = m.status === selectedStatus && (!m.isHidden || isAdmin)
            } else if (!isAdmin) {
                // Non-admin viewers can never see hidden members
                matchesStatus = !m.isHidden
            }

            return matchesSearch && matchesDept && matchesStatus
        })
    }, [members, search, selectedDept, selectedStatus, isAdmin])

    // Sorted Members (Default: Entry order — whichever name is entered first is #1)
    const sortedMembers = useMemo(() => {
        let list = [...filteredMembers]
        if (sortBy === 'entry_asc') {
            list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
        } else if (sortBy === 'entry_desc') {
            list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        } else if (sortBy === 'name_asc') {
            list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        } else if (sortBy === 'hierarchy') {
            const getRank = (role = '') => {
                const r = (role || '').toLowerCase()
                if (r.includes('president') && !r.includes('vice')) return 1
                if (r.includes('vice-president') || r.includes('vice president')) return 2
                if (r.includes('secretary') && !r.includes('joint') && !r.includes('assistant')) return 3
                if (r.includes('joint secretary') || r.includes('assistant secretary')) return 4
                if (r.includes('treasurer') && !r.includes('assistant')) return 5
                if (r.includes('assistant treasurer') || r.includes('cashier')) return 6
                if (r.includes('head') || r.includes('lead') || r.includes('incharge')) return 7
                if (r.includes('advisory')) return 8
                return 9
            }
            list.sort((a, b) => getRank(a.role) - getRank(b.role))
        }
        return list
    }, [filteredMembers, sortBy])

    // Visible Members count specifically for PDF Generation (never includes hidden members)
    const visiblePDFCount = useMemo(() => {
        return sortedMembers.filter(m => !m.isHidden).length
    }, [sortedMembers])

    // KPI Metrics
    const metrics = useMemo(() => {
        const total = members.length
        const hidden = members.filter(m => m.isHidden).length
        const visible = total - hidden
        const execs = members.filter(m => !m.isHidden && /president|secretary|treasurer|lead|head/i.test(m.role || '')).length
        const active = members.filter(m => !m.isHidden && m.status === 'Active').length
        return { total, visible, hidden, execs, active }
    }, [members])

    // Open Modal
    const handleOpenModal = (member = null) => {
        setIsAddingInlineRole(false)
        setIsAddingInlineDept(false)
        setInlineRoleName('')
        setInlineDeptName('')
        if (member) {
            setEditingMember(member)
            setFormData({
                name: member.name || '',
                role: member.role || 'Committee Member',
                customRole: '',
                department: member.department || 'Core Committee',
                contact: member.contact || '',
                countryCode: member.countryCode || '+91',
                email: member.email || '',
                address: member.address || '',
                status: member.status || 'Active',
                isHidden: Boolean(member.isHidden || false),
                hidePhone: Boolean(member.hidePhone || false),
                hideEmail: Boolean(member.hideEmail || false),
                hideAddress: Boolean(member.hideAddress || false),
                hideRole: Boolean(member.hideRole || false),
                hideDepartment: Boolean(member.hideDepartment || false),
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
                isHidden: false,
                hidePhone: false,
                hideEmail: false,
                hideAddress: false,
                hideRole: false,
                hideDepartment: false,
                notes: ''
            })
        }
        setIsModalOpen(true)
    }

    // Fast Toggle Visibility (Hide / Unhide Member)
    const handleToggleVisibility = async (id, currentHidden) => {
        try {
            const res = await axios.patch(`/api/members/${id}/toggle-visibility`)
            setMembers(prev => prev.map(m => m._id === id ? res.data : m))
        } catch (err) {
            console.error('Error toggling member visibility:', err)
            // Fallback to PUT
            try {
                const targetMember = members.find(m => m._id === id)
                if (targetMember) {
                    const res = await axios.put(`/api/members/${id}`, {
                        ...targetMember,
                        isHidden: !currentHidden
                    })
                    setMembers(prev => prev.map(m => m._id === id ? res.data : m))
                }
            } catch (err2) {
                alert(err2.response?.data?.message || 'Failed to toggle visibility.')
            }
        }
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

        // Auto-persist custom role or department if it's new
        if (finalRole && !DEFAULT_ROLE_PRESETS.includes(finalRole) && !customRoles.includes(finalRole)) {
            setCustomRoles(prev => [...prev, finalRole])
        }
        if (formData.department && !DEFAULT_DEPARTMENTS.includes(formData.department) && !customDepts.includes(formData.department)) {
            setCustomDepts(prev => [...prev, formData.department])
        }

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
                setMembers(prev => [...prev, res.data])
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

    // Download PDF (Strictly excludes hidden members, respects global column visibility & per-member privacy)
    const handleDownloadPDF = () => {
        const visibleMembers = sortedMembers.filter(m => !m.isHidden)
        if (visibleMembers.length === 0) {
            alert('No visible members found to export. All currently selected members are marked as Hidden.')
            return
        }
        exportMembersDirectoryPDF({
            membersList: visibleMembers,
            entityName: activeEntity || user?.entityName || 'Vishwa Utsav',
            portalType: type === 'festival' ? 'Festival' : 'Event',
            festivalName: activePortalName,
            columnVisibility: pdfColumns
        })
    }

    return (
        <div className="figma-members-container mx-auto w-100 mb-4">
            {/* Top Bar Header */}
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
                <div className="d-flex align-items-center gap-3">
                    <div className="figma-members-header-emblem shadow-sm">
                        <Users size={22} />
                    </div>
                    <div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <h4 className="fw-extrabold mb-0 text-main" style={{ letterSpacing: '-0.02em', fontSize: '1.25rem' }}>
                                {activePortalName ? `${activePortalName} — ` : ''}{type === 'festival' ? 'Festival' : 'Event'} Committee &amp; Members
                            </h4>
                            <span className="figma-pass-count-pill shadow-xs">
                                <Sparkles size={11} /> {metrics.total} Registered
                            </span>
                        </div>
                        <p className="text-muted extra-tiny mb-0 mt-0.5">
                            Official executive council, department coordinators, and volunteers for{' '}
                            <span className="text-primary fw-bold">{activePortalName || activeEntity || 'your entity'}</span>
                            {activePortalName && activeEntity ? <span className="text-muted"> ({activeEntity})</span> : null}.
                        </p>
                    </div>
                </div>

                {/* Right Top Actions: Download PDF, PDF Columns Selector & Add Member (Horizontally side-by-side on Smartphones & Desktops) */}
                <div className="d-flex align-items-center gap-2 flex-nowrap w-100 w-sm-auto mt-2 mt-lg-0">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={visiblePDFCount === 0}
                        title="Download Official Committee Members Directory as A4 PDF (Excludes Hidden Members)"
                        className="figma-btn-download-sheet shadow-sm flex-fill flex-sm-grow-0 justify-content-center text-nowrap px-3 px-sm-3.5"
                        style={{ height: '38px', minWidth: '0' }}
                    >
                        <FileDown size={14} className="flex-shrink-0" />
                        <span className="text-truncate">Download PDF</span>
                        <span className="badge bg-white bg-opacity-25 rounded-pill ms-1 text-white flex-shrink-0" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                            {visiblePDFCount}
                        </span>
                    </button>

                    {/* PDF Columns Visibility Dropdown (Option B) */}
                    <div className="position-relative flex-shrink-0" ref={pdfColMenuRef}>
                        <button
                            type="button"
                            onClick={() => setShowPdfColMenu(prev => !prev)}
                            title="Configure PDF Columns: choose which fields to include/exclude from generated PDF"
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
                                        { key: 'role', label: 'Role / Designation' },
                                        { key: 'department', label: 'Department / Wing' },
                                        { key: 'contact', label: 'Contact Phone Number' },
                                        { key: 'email', label: 'Email Address' },
                                        { key: 'address', label: 'Locality / Address' },
                                        { key: 'status', label: 'Roster Status' }
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
                                            const reset = { role: true, department: true, contact: true, email: true, address: false, status: true }
                                            setPdfColumns(reset)
                                            try { localStorage.setItem('vishwautsav_member_pdf_cols', JSON.stringify(reset)) } catch (_) {}
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
                            <span>Add Member</span>
                        </button>
                    )}
                </div>
            </div>

            {/* 3 Bento KPI Metric Cards (Responsive Grid) */}
            <div className="row g-3 mb-4">
                {/* Card 1: Total Members */}
                <div className="col-12 col-md-4">
                    <div className="figma-member-bento-card bento-total">
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="extra-tiny text-muted fw-bold uppercase tracking-wider">Total Committee</span>
                            <div className="figma-finance-icon-box" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                                <Users size={17} />
                            </div>
                        </div>
                        <div className="figma-finance-value text-main my-2">
                            {metrics.total}
                        </div>
                        <div className="d-flex align-items-center justify-content-between extra-tiny text-muted">
                            <span className="badge rounded-pill px-2 py-0.5 fw-bold" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>
                                Full Roster
                            </span>
                            <span>All Wings</span>
                        </div>
                    </div>
                </div>

                {/* Card 2: Executive Leaders */}
                <div className="col-12 col-md-4">
                    <div className="figma-member-bento-card bento-execs">
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="extra-tiny text-muted fw-bold uppercase tracking-wider">Executive Leaders</span>
                            <div className="figma-finance-icon-box" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                                <Award size={17} />
                            </div>
                        </div>
                        <div className="figma-finance-value my-2" style={{ color: '#d97706' }}>
                            {metrics.execs}
                        </div>
                        <div className="d-flex align-items-center justify-content-between extra-tiny text-muted">
                            <span className="badge rounded-pill px-2 py-0.5 fw-bold" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#b45309' }}>
                                Board &amp; Leads
                            </span>
                            <span>Core Authority</span>
                        </div>
                    </div>
                </div>

                {/* Card 3: Active Volunteers */}
                <div className="col-12 col-md-4">
                    <div className="figma-member-bento-card bento-active">
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="extra-tiny text-muted fw-bold uppercase tracking-wider">Active on Roster</span>
                            <div className="figma-finance-icon-box" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                                <UserCheck size={17} />
                            </div>
                        </div>
                        <div className="figma-finance-value my-2" style={{ color: '#059669' }}>
                            {metrics.active}
                        </div>
                        <div className="d-flex align-items-center justify-content-between extra-tiny text-muted">
                            <span className="badge rounded-pill px-2 py-0.5 fw-bold" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#047857' }}>
                                Active Duty
                            </span>
                            <span>Ground Coordinators</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Department Filters Toolbar (Optimized for Smartphones & Desktops) */}
            <div className="figma-members-toolbar mb-4 shadow-xs">
                {/* Row 1: Search Bar + Symmetrical Filters */}
                <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center justify-content-between gap-2.5 mb-2.5">
                    {/* Search Bar (100% full-width on mobile, auto-expanding on desktop) */}
                    <div className="input-group action-item-pill search-pill-container px-3 flex-nowrap shadow-xs w-100 flex-lg-grow-1" style={{ height: '38px', maxWidth: '100%' }}>
                        <span className="input-group-text bg-transparent border-0 text-muted ps-1 pe-2 d-flex align-items-center">
                            <Search size={14} />
                        </span>
                        <input
                            type="text"
                            placeholder="Search by name, role, phone, locality..."
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

                    {/* Dual Symmetrical Dropdown Selectors: 50% / 50% on Mobile, auto-width on Desktop */}
                    <div className="d-flex align-items-center gap-2 w-100 w-lg-auto flex-nowrap">
                        {/* Status & Visibility Selector */}
                        <div className="flex-fill" style={{ minWidth: 0 }}>
                            <select
                                value={selectedStatus}
                                onChange={e => setSelectedStatus(e.target.value)}
                                className="figma-toolbar-select form-select form-select-sm w-100"
                                title="Filter by Visibility or Status"
                            >
                                <option value="All">All ({metrics.total})</option>
                                <option value="Visible">Visible ({metrics.visible})</option>
                                <option value="Hidden">Hidden ({metrics.hidden})</option>
                                <option value="Active">Active ({metrics.active})</option>
                                <option value="Honorary">Honorary</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>

                        {/* Sort Order Selector */}
                        <div className="flex-fill" style={{ minWidth: 0 }}>
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="figma-toolbar-select form-select form-select-sm w-100"
                                title="Arrange Members"
                            >
                                <option value="entry_asc">Order: First Added</option>
                                <option value="entry_desc">Order: Newest First</option>
                                <option value="hierarchy">Hierarchy: Execs First</option>
                                <option value="name_asc">Name: A to Z</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Row 2: Department / Wing Horizontal Touch-Scroll Chips */}
                <div className="d-flex align-items-center gap-1.5 w-100 pt-2 border-top border-secondary border-opacity-10">
                    <span className="extra-tiny text-muted me-1 fw-bold d-none d-sm-inline-flex align-items-center flex-shrink-0">
                        <Filter size={11} className="me-1" />Wing:
                    </span>
                    <div className="figma-dept-scroll flex-grow-1 pe-2 py-0.5">
                        {['All', ...allDepartments].slice(0, 6).map(dept => (
                            <button
                                key={dept}
                                type="button"
                                onClick={() => setSelectedDept(dept)}
                                className={`figma-dept-pill flex-shrink-0 ${selectedDept === dept ? 'active' : ''}`}
                            >
                                {dept}
                            </button>
                        ))}
                        {['All', ...allDepartments].length > 6 && (
                            <select
                                value={['All', ...allDepartments].slice(6).includes(selectedDept) ? selectedDept : ''}
                                onChange={e => e.target.value && setSelectedDept(e.target.value)}
                                className="form-select form-select-sm rounded-pill extra-tiny text-main fw-bold border flex-shrink-0"
                                style={{ 
                                    width: 'auto', 
                                    height: '30px', 
                                    background: 'var(--input-bg)', 
                                    borderColor: 'var(--glass-border)',
                                    fontSize: '0.72rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="">More Wings...</option>
                                {['All', ...allDepartments].slice(6).map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
            </div>

            {/* Members Directory Content */}
            {loading ? (
                <div className="text-center py-5 text-muted extra-tiny">
                    <div className="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                    <div>Loading verified committee roster...</div>
                </div>
            ) : sortedMembers.length === 0 ? (
                <div className="figma-member-empty-hero my-3 shadow-xs">
                    <div className="figma-members-header-emblem mx-auto mb-3" style={{ width: '56px', height: '56px', borderRadius: '18px' }}>
                        <Users size={28} />
                    </div>
                    <h5 className="fw-extrabold text-main mb-1" style={{ fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
                        {search || selectedDept !== 'All' ? 'No Matching Members Found' : 'Assemble Your Committee Roster'}
                    </h5>
                    <p className="text-muted extra-tiny mb-4" style={{ maxWidth: '420px', margin: '0 auto', lineHeight: '1.5' }}>
                        {search || selectedDept !== 'All' 
                            ? 'No committee records matched your search query or department filter. Try clearing filters.'
                            : `Add your festival executive committee, department leads, and ground volunteers for ${activePortalName ? `${activePortalName} (${activeEntity || 'your entity'})` : (activeEntity || 'your entity')}.`}
                    </p>
                    {isAdmin && (
                        <button
                            onClick={() => handleOpenModal(null)}
                            className="btn btn-premium px-4 py-2 rounded-pill fw-bold extra-tiny shadow-sm hover-glow"
                        >
                            <Plus size={14} className="me-1.5" />
                            <span>Add First Committee Member</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="row g-3 g-xl-4">
                    {sortedMembers.map((member, idx) => {
                        const style = getRoleStyle(member.role)
                        const RoleIcon = style.icon

                        return (
                            <div key={member._id} className="col-12 col-md-6 col-xl-4">
                                <div className={`figma-luxury-member-card ${member.isHidden ? 'opacity-75 border-warning border-opacity-40' : ''}`}>
                                    <div>
                                        {/* Card Top: Avatar, Name, Status */}
                                        <div className="d-flex align-items-start justify-content-between gap-2.5 mb-3">
                                            <div className="d-flex align-items-center gap-2.5">
                                                {/* Luxury Avatar Box */}
                                                <div 
                                                    className="figma-member-avatar-ring"
                                                    style={{
                                                        background: style.bg,
                                                        color: style.text,
                                                        border: `1.5px solid ${style.border}`
                                                    }}
                                                >
                                                    {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
                                                </div>

                                                <div>
                                                    <h6 className="fw-extrabold text-main mb-0" style={{ fontSize: '0.94rem', lineHeight: '1.2' }}>
                                                        {member.name}
                                                    </h6>
                                                    <div className="extra-tiny text-muted d-flex align-items-center gap-1 mt-0.5">
                                                        <Tag size={10} className="text-primary" />
                                                        <span>{member.department || 'Core Committee'}</span>
                                                        {member.hideDepartment && (
                                                            <span className="badge rounded-pill bg-warning bg-opacity-20 text-dark extra-tiny px-1 py-0 ms-1" style={{ fontSize: '0.55rem' }} title="Department excluded from PDF directory">
                                                                <EyeOff size={8} className="text-warning" /> No PDF
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status & Hidden Badges */}
                                            <div className="d-flex align-items-center gap-1.5 flex-wrap justify-content-end">
                                                {member.isHidden && (
                                                    <span 
                                                        className="badge rounded-pill px-2 py-0.5 fw-bold bg-warning bg-opacity-15 text-warning border border-warning border-opacity-35 d-inline-flex align-items-center gap-1"
                                                        style={{ fontSize: '0.62rem' }}
                                                        title="This member is hidden and excluded from PDF export"
                                                    >
                                                        <EyeOff size={10} />
                                                        <span>Hidden (No PDF)</span>
                                                    </span>
                                                )}
                                                <span 
                                                    className={`badge rounded-pill px-2.5 py-1 fw-bold ${
                                                        member.status === 'Active' 
                                                            ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25' 
                                                            : member.status === 'Honorary'
                                                            ? 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25'
                                                            : 'bg-secondary bg-opacity-10 text-muted border border-secondary border-opacity-25'
                                                    }`}
                                                    style={{ fontSize: '0.62rem' }}
                                                >
                                                    {member.status === 'Active' && '● '}
                                                    {member.status || 'Active'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Role / Designation Pill */}
                                        <div className="mb-3">
                                            <span 
                                                className="badge rounded-pill px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-1.5 shadow-xs"
                                                style={{
                                                    background: style.bg,
                                                    color: style.text,
                                                    border: `1px solid ${style.border}`,
                                                    fontSize: '0.74rem'
                                                }}
                                            >
                                                <RoleIcon size={12} />
                                                <span>{member.role}</span>
                                                {member.hideRole && (
                                                    <span className="badge rounded-pill bg-warning bg-opacity-25 text-dark extra-tiny px-1.5 py-0.5 ms-1" style={{ fontSize: '0.58rem' }} title="Role excluded from PDF directory">
                                                        <EyeOff size={9} className="me-0.5 text-warning" /> No PDF
                                                    </span>
                                                )}
                                            </span>
                                        </div>

                                        {/* Contact & Locality Details */}
                                        <div className="extra-tiny text-muted d-flex flex-column gap-1.5 mb-2">
                                            {member.contact ? (
                                                <div 
                                                    className="d-flex align-items-center justify-content-between p-1.5 px-2 rounded-2" 
                                                    style={{ 
                                                        background: member.hidePhone ? 'rgba(245, 158, 11, 0.06)' : 'rgba(0, 0, 0, 0.02)', 
                                                        border: member.hidePhone ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(0, 0, 0, 0.05)' 
                                                    }}
                                                >
                                                    <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                                        <Phone size={12} className={member.hidePhone ? "text-warning" : "text-muted"} />
                                                        <a href={`tel:${member.contact}`} className="text-decoration-none text-main fw-bold">
                                                            {member.countryCode || '+91'} {member.contact}
                                                        </a>
                                                        {member.hidePhone && (
                                                            <span className="badge rounded-pill bg-warning bg-opacity-20 text-dark extra-tiny px-1.5 py-0.5" style={{ fontSize: '0.58rem' }} title="Phone excluded from PDF directory">
                                                                <EyeOff size={9} className="me-0.5 text-warning" /> No PDF
                                                            </span>
                                                        )}
                                                    </div>
                                                    <a 
                                                        href={`https://wa.me/${(member.countryCode || '+91').replace(/[^0-9]/g, '')}${member.contact.replace(/[^0-9]/g, '')}`}
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        title="Message on WhatsApp"
                                                        className="text-success hover-scale p-1 rounded d-inline-flex"
                                                    >
                                                        <MessageCircle size={14} />
                                                    </a>
                                                </div>
                                            ) : (
                                                <div className="text-muted extra-tiny fst-italic">No direct phone added</div>
                                            )}

                                            {member.email && (
                                                <div className="d-flex align-items-center gap-1.5 text-truncate px-1">
                                                    <Mail size={12} className={member.hideEmail ? "text-warning flex-shrink-0" : "text-muted flex-shrink-0"} />
                                                    <a href={`mailto:${member.email}`} className="text-decoration-none text-muted text-truncate">
                                                        {member.email}
                                                    </a>
                                                    {member.hideEmail && (
                                                        <span className="badge rounded-pill bg-warning bg-opacity-20 text-dark extra-tiny px-1 py-0 ms-1 flex-shrink-0" style={{ fontSize: '0.55rem' }} title="Email excluded from PDF directory">
                                                            <EyeOff size={8} className="text-warning" /> No PDF
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {member.address && (
                                                <div className="d-flex align-items-center gap-1.5 extra-tiny text-muted text-truncate px-1 opacity-80">
                                                    <MapPin size={12} className={member.hideAddress ? "text-warning flex-shrink-0" : "text-muted flex-shrink-0"} />
                                                    <span className="text-truncate">{member.address}</span>
                                                    {member.hideAddress && (
                                                        <span className="badge rounded-pill bg-warning bg-opacity-20 text-dark extra-tiny px-1 py-0 ms-1 flex-shrink-0" style={{ fontSize: '0.55rem' }} title="Address excluded from PDF directory">
                                                            <EyeOff size={8} className="text-warning" /> No PDF
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Bottom: Admin Controls */}
                                    {isAdmin && (
                                        <div className="d-flex align-items-center justify-content-between pt-2.5 border-top border-secondary border-opacity-10 mt-3">
                                            <span className="extra-tiny text-muted font-monospace opacity-75">
                                                ID: {member._id ? member._id.slice(-6).toUpperCase() : 'MEM'}
                                            </span>

                                            <div className="d-flex align-items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleVisibility(member._id, member.isHidden)}
                                                    className={`btn btn-sm p-1 px-2.5 rounded-pill extra-tiny fw-semibold transition-all ${
                                                        member.isHidden
                                                            ? 'btn-warning text-dark shadow-xs'
                                                            : 'btn-light text-muted hover-text-main'
                                                    }`}
                                                    title={member.isHidden ? 'Click to unhide (include in roster & PDF)' : 'Click to hide (exclude from roster & PDF)'}
                                                >
                                                    {member.isHidden ? <Eye size={12} className="me-1 text-dark" /> : <EyeOff size={12} className="me-1" />}
                                                    <span>{member.isHidden ? 'Unhide' : 'Hide'}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenModal(member)}
                                                    className="btn btn-sm btn-light p-1 px-2.5 rounded-pill extra-tiny text-secondary hover-bg-secondary hover-text-white transition-all fw-semibold"
                                                    title="Edit Member Details"
                                                >
                                                    <Edit3 size={12} className="me-1" /> Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(member._id, member.name)}
                                                    className="btn btn-sm btn-light p-1 px-2.5 rounded-pill extra-tiny text-danger hover-bg-danger hover-text-white transition-all fw-semibold"
                                                    title="Remove Member"
                                                >
                                                    <Trash2 size={12} className="me-1" /> Delete
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

            {/* Modal Dialog for Add / Edit Member (Figma Luxury, Fully Responsive with Sticky Header & Footer, rendered in React Portal) */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isModalOpen && (
                        <div 
                            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-2 p-sm-3" 
                            style={{ 
                                backgroundColor: 'rgba(0, 0, 0, 0.20)', 
                                backdropFilter: 'blur(3px)',
                                WebkitBackdropFilter: 'blur(3px)',
                                zIndex: 99999,
                                inset: 0
                            }}
                            onClick={(e) => {
                                if (e.target === e.currentTarget) setIsModalOpen(false)
                            }}
                        >
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                transition={{ duration: 0.22, ease: 'easeOut' }}
                                className="luxury-modal-card w-100 shadow-2xl d-flex flex-column overflow-hidden my-auto"
                                style={{
                                    maxWidth: '640px',
                                    maxHeight: 'min(90vh, 760px)',
                                    background: '#ffffff',
                                    border: '1.5px solid var(--glass-border)',
                                    borderRadius: '20px'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                            {/* Pinned / Sticky Modal Header */}
                            <div 
                                className="d-flex align-items-center justify-content-between px-3 px-sm-4 py-3 border-bottom flex-shrink-0" 
                                style={{ 
                                    borderColor: 'var(--glass-border)',
                                    background: 'var(--card-bg, #ffffff)'
                                }}
                            >
                                <div className="d-flex align-items-center gap-2.5">
                                    <div 
                                        className="figma-members-header-emblem d-flex align-items-center justify-content-center shadow-sm flex-shrink-0" 
                                        style={{ width: '40px', height: '40px', borderRadius: '12px' }}
                                    >
                                        <Users size={19} />
                                    </div>
                                    <div>
                                        <h6 className="fw-extrabold mb-0 text-main" style={{ fontSize: '1.02rem', letterSpacing: '-0.01em' }}>
                                            {editingMember ? 'Edit Committee Member' : 'Add Committee Member'}
                                        </h6>
                                        <p className="extra-tiny text-muted mb-0">
                                            Record executive details for {activePortalName ? `${activePortalName} (${activeEntity || 'your entity'})` : (activeEntity || 'your entity')}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)} 
                                    className="btn btn-close-custom rounded-circle p-2 border shadow-sm hover-scale d-flex align-items-center justify-content-center" 
                                    style={{ 
                                        backgroundColor: 'var(--input-bg)', 
                                        borderColor: 'var(--glass-border)',
                                        width: '34px',
                                        height: '34px'
                                    }} 
                                    aria-label="Close"
                                >
                                    <X size={16} style={{ color: 'var(--text-main)' }} />
                                </button>
                            </div>

                            {/* Modal Form Wrapper with Scrollable Body and Sticky Footer */}
                            <form onSubmit={handleSubmit} className="d-flex flex-column flex-grow-1 overflow-hidden" style={{ minHeight: 0 }}>
                                {/* Scrollable Form Content */}
                                <div className="px-3 px-sm-4 py-3 overflow-y-auto flex-grow-1" style={{ minHeight: 0 }}>
                                    <div className="row g-3">
                                        {/* Full Legal Name */}
                                        <div className="col-12">
                                            <label className="luxury-label">
                                                <UserCheck size={12} className="text-terracotta" />
                                                <span>Full Legal Name</span>
                                                <span className="text-danger">*</span>
                                            </label>
                                            <div className="luxury-input-wrapper">
                                                <div className="luxury-icon-box">
                                                    <UserCheck size={16} />
                                                </div>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. Rajesh Kumar Sharma"
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    className="luxury-input-field"
                                                />
                                            </div>
                                        </div>

                                        {/* Role / Designation with Full CRUD */}
                                        <div className="col-12 col-sm-6">
                                            <div className="d-flex align-items-center justify-content-between mb-1">
                                                <label className="luxury-label mb-0">
                                                    <Award size={12} className="text-terracotta" />
                                                    <span>Role / Designation</span>
                                                    <span className="text-danger">*</span>
                                                </label>
                                                <div className="d-flex align-items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsAddingInlineRole(true)
                                                            setInlineRoleName('')
                                                        }}
                                                        className="btn btn-link p-0 text-decoration-none extra-tiny fw-bold text-terracotta hover-underline"
                                                        title="Quick Add Custom Role"
                                                    >
                                                        + New
                                                    </button>
                                                    <span className="text-muted opacity-50" style={{ fontSize: '0.65rem' }}>•</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setManagerTab('roles')
                                                            setIsManagerOpen(true)
                                                        }}
                                                        className="btn btn-link p-0 text-decoration-none extra-tiny text-muted hover-text-main d-inline-flex align-items-center gap-0.5"
                                                        title="Manage Custom Roles (CRUD)"
                                                    >
                                                        <Settings size={10} />
                                                        <span>Manage</span>
                                                    </button>
                                                    <span className="text-muted opacity-50" style={{ fontSize: '0.65rem' }}>•</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, hideRole: !prev.hideRole }))}
                                                        className={`btn btn-link p-0 text-decoration-none extra-tiny d-inline-flex align-items-center gap-1 ${formData.hideRole ? 'text-warning fw-bold' : 'text-muted hover-text-main'}`}
                                                        title={formData.hideRole ? "Role Hidden from PDF: click to make visible" : "Role Visible in PDF: click to hide"}
                                                    >
                                                        {formData.hideRole ? <EyeOff size={11} className="text-warning" /> : <Eye size={11} />}
                                                        <span>{formData.hideRole ? 'Hidden' : 'Visible'}</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {isAddingInlineRole ? (
                                                <div className="luxury-input-wrapper">
                                                    <div className="luxury-icon-box">
                                                        <Award size={16} />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        autoFocus
                                                        placeholder="Type new role title..."
                                                        value={inlineRoleName}
                                                        onChange={e => setInlineRoleName(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault()
                                                                handleAddCustomRole(inlineRoleName)
                                                            } else if (e.key === 'Escape') {
                                                                setIsAddingInlineRole(false)
                                                            }
                                                        }}
                                                        className="luxury-input-field"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddCustomRole(inlineRoleName)}
                                                        disabled={!inlineRoleName.trim()}
                                                        className="btn btn-sm btn-success rounded-pill px-2.5 py-0.5 extra-tiny fw-bold text-white flex-shrink-0"
                                                    >
                                                        Add
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsAddingInlineRole(false)}
                                                        className="btn btn-sm btn-light rounded-circle p-1 extra-tiny text-muted flex-shrink-0"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="luxury-input-wrapper">
                                                    <div className="luxury-icon-box">
                                                        <Award size={16} />
                                                    </div>
                                                    <select
                                                        value={formData.role}
                                                        onChange={e => {
                                                            if (e.target.value === '__ADD_NEW_ROLE__') {
                                                                setIsAddingInlineRole(true)
                                                                setInlineRoleName('')
                                                            } else {
                                                                setFormData({ ...formData, role: e.target.value })
                                                            }
                                                        }}
                                                        className="luxury-input-field fw-semibold"
                                                        style={{ cursor: 'pointer', background: 'var(--card-bg, #ffffff)', color: 'var(--text-main, #0f172a)' }}
                                                    >
                                                        <optgroup label="Standard Roles">
                                                            {DEFAULT_ROLE_PRESETS.map(r => (
                                                                <option key={r} value={r} style={{ background: 'var(--card-bg, #ffffff)', color: 'var(--text-main, #0f172a)' }}>
                                                                    {r}
                                                                </option>
                                                            ))}
                                                        </optgroup>
                                                        {customRoles.length > 0 && (
                                                            <optgroup label="Custom Roles">
                                                                {customRoles.map(r => (
                                                                    <option key={r} value={r} style={{ background: 'var(--card-bg, #ffffff)', color: 'var(--text-main, #0f172a)' }}>
                                                                        {r}
                                                                    </option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                        <option value="__ADD_NEW_ROLE__" style={{ fontWeight: 'bold', color: 'var(--accent-1)' }}>
                                                            ➕ + Add Custom Role...
                                                        </option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        {/* Department / Wing with Full CRUD */}
                                        <div className="col-12 col-sm-6">
                                            <div className="d-flex align-items-center justify-content-between mb-1">
                                                <label className="luxury-label mb-0">
                                                    <Tag size={12} className="text-terracotta" />
                                                    <span>Department / Wing</span>
                                                </label>
                                                <div className="d-flex align-items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsAddingInlineDept(true)
                                                            setInlineDeptName('')
                                                        }}
                                                        className="btn btn-link p-0 text-decoration-none extra-tiny fw-bold text-terracotta hover-underline"
                                                        title="Quick Add Custom Wing"
                                                    >
                                                        + New
                                                    </button>
                                                    <span className="text-muted opacity-50" style={{ fontSize: '0.65rem' }}>•</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setManagerTab('departments')
                                                            setIsManagerOpen(true)
                                                        }}
                                                        className="btn btn-link p-0 text-decoration-none extra-tiny text-muted hover-text-main d-inline-flex align-items-center gap-0.5"
                                                        title="Manage Custom Wings (CRUD)"
                                                    >
                                                        <Settings size={10} />
                                                        <span>Manage</span>
                                                    </button>
                                                    <span className="text-muted opacity-50" style={{ fontSize: '0.65rem' }}>•</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, hideDepartment: !prev.hideDepartment }))}
                                                        className={`btn btn-link p-0 text-decoration-none extra-tiny d-inline-flex align-items-center gap-1 ${formData.hideDepartment ? 'text-warning fw-bold' : 'text-muted hover-text-main'}`}
                                                        title={formData.hideDepartment ? "Department Hidden from PDF: click to make visible" : "Department Visible in PDF: click to hide"}
                                                    >
                                                        {formData.hideDepartment ? <EyeOff size={11} className="text-warning" /> : <Eye size={11} />}
                                                        <span>{formData.hideDepartment ? 'Hidden' : 'Visible'}</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {isAddingInlineDept ? (
                                                <div className="luxury-input-wrapper">
                                                    <div className="luxury-icon-box">
                                                        <Tag size={16} />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        autoFocus
                                                        placeholder="Type new department name..."
                                                        value={inlineDeptName}
                                                        onChange={e => setInlineDeptName(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault()
                                                                handleAddCustomDept(inlineDeptName)
                                                            } else if (e.key === 'Escape') {
                                                                setIsAddingInlineDept(false)
                                                            }
                                                        }}
                                                        className="luxury-input-field"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddCustomDept(inlineDeptName)}
                                                        disabled={!inlineDeptName.trim()}
                                                        className="btn btn-sm btn-success rounded-pill px-2.5 py-0.5 extra-tiny fw-bold text-white flex-shrink-0"
                                                    >
                                                        Add
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsAddingInlineDept(false)}
                                                        className="btn btn-sm btn-light rounded-circle p-1 extra-tiny text-muted flex-shrink-0"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="luxury-input-wrapper">
                                                    <div className="luxury-icon-box">
                                                        <Tag size={16} />
                                                    </div>
                                                    <select
                                                        value={formData.department}
                                                        onChange={e => {
                                                            if (e.target.value === '__ADD_NEW_DEPT__') {
                                                                setIsAddingInlineDept(true)
                                                                setInlineDeptName('')
                                                            } else {
                                                                setFormData({ ...formData, department: e.target.value })
                                                            }
                                                        }}
                                                        className="luxury-input-field fw-semibold"
                                                        style={{ cursor: 'pointer', background: 'var(--card-bg, #ffffff)', color: 'var(--text-main, #0f172a)' }}
                                                    >
                                                        <optgroup label="Standard Wings">
                                                            {DEFAULT_DEPARTMENTS.map(d => (
                                                                <option key={d} value={d} style={{ background: 'var(--card-bg, #ffffff)', color: 'var(--text-main, #0f172a)' }}>
                                                                    {d}
                                                                </option>
                                                            ))}
                                                        </optgroup>
                                                        {customDepts.length > 0 && (
                                                            <optgroup label="Custom Wings">
                                                                {customDepts.map(d => (
                                                                    <option key={d} value={d} style={{ background: 'var(--card-bg, #ffffff)', color: 'var(--text-main, #0f172a)' }}>
                                                                        {d}
                                                                    </option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                        <option value="__ADD_NEW_DEPT__" style={{ fontWeight: 'bold', color: 'var(--accent-1)' }}>
                                                            ➕ + Add Custom Wing...
                                                        </option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        {/* Contact Phone Number */}
                                        <div className="col-12 col-sm-7">
                                            <div className="d-flex align-items-center justify-content-between mb-1">
                                                <label className="luxury-label mb-0">
                                                    <Phone size={12} className="text-terracotta" />
                                                    <span>Contact Phone Number</span>
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, hidePhone: !prev.hidePhone }))}
                                                    className={`btn btn-link p-0 text-decoration-none extra-tiny d-inline-flex align-items-center gap-1 ${formData.hidePhone ? 'text-warning fw-bold' : 'text-muted hover-text-main'}`}
                                                    title={formData.hidePhone ? "Phone Hidden from PDF: click to make visible" : "Phone Visible in PDF: click to hide"}
                                                >
                                                    {formData.hidePhone ? <EyeOff size={11} className="text-warning" /> : <Eye size={11} />}
                                                    <span>{formData.hidePhone ? 'Hidden' : 'Visible'}</span>
                                                </button>
                                            </div>
                                            <div className="luxury-input-wrapper">
                                                <div className="luxury-icon-box">
                                                    <Phone size={16} />
                                                </div>
                                                <span 
                                                    className="extra-tiny fw-bold text-muted ps-1 pe-2" 
                                                    style={{ borderRight: '1.5px solid var(--glass-border)', lineHeight: 1 }}
                                                >
                                                    +91
                                                </span>
                                                <input
                                                    type="tel"
                                                    placeholder="Mobile / WhatsApp number"
                                                    value={formData.contact}
                                                    onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                                    className="luxury-input-field ps-2"
                                                />
                                            </div>
                                        </div>

                                        {/* Roster Status */}
                                        <div className="col-12 col-sm-5">
                                            <label className="luxury-label">
                                                <ShieldCheck size={12} className="text-terracotta" />
                                                <span>Roster Status</span>
                                            </label>
                                            <div className="luxury-input-wrapper">
                                                <div className="luxury-icon-box">
                                                    <ShieldCheck size={16} />
                                                </div>
                                                <select
                                                    value={formData.status}
                                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                                    className="luxury-input-field fw-semibold"
                                                    style={{ cursor: 'pointer', background: 'var(--card-bg, #ffffff)', color: 'var(--text-main, #0f172a)' }}
                                                >
                                                    <option value="Active" style={{ background: 'var(--card-bg, #ffffff)', color: 'var(--text-main, #0f172a)' }}>Active</option>
                                                    <option value="Honorary" style={{ background: 'var(--card-bg, #ffffff)', color: 'var(--text-main, #0f172a)' }}>Honorary</option>
                                                    <option value="Inactive" style={{ background: 'var(--card-bg, #ffffff)', color: 'var(--text-main, #0f172a)' }}>Inactive</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Email Address */}
                                        <div className="col-12">
                                            <div className="d-flex align-items-center justify-content-between mb-1">
                                                <label className="luxury-label mb-0">
                                                    <Mail size={12} className="text-terracotta" />
                                                    <span>Email Address</span>
                                                    <span className="text-muted text-lowercase ms-1" style={{ fontSize: '0.65rem', fontWeight: 500 }}>(Optional)</span>
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, hideEmail: !prev.hideEmail }))}
                                                    className={`btn btn-link p-0 text-decoration-none extra-tiny d-inline-flex align-items-center gap-1 ${formData.hideEmail ? 'text-warning fw-bold' : 'text-muted hover-text-main'}`}
                                                    title={formData.hideEmail ? "Email Hidden in PDF: click to make visible" : "Email Visible in PDF: click to hide"}
                                                >
                                                    {formData.hideEmail ? <EyeOff size={11} className="text-warning" /> : <Eye size={11} />}
                                                    <span>{formData.hideEmail ? 'Hidden' : 'Visible'}</span>
                                                </button>
                                            </div>
                                            <div className="luxury-input-wrapper">
                                                <div className="luxury-icon-box">
                                                    <Mail size={16} />
                                                </div>
                                                <input
                                                    type="email"
                                                    placeholder="e.g. member@vishwautsav.com"
                                                    value={formData.email}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                    className="luxury-input-field"
                                                />
                                            </div>
                                        </div>

                                        {/* Locality / Residential Address / Notes */}
                                        <div className="col-12">
                                            <div className="d-flex align-items-center justify-content-between mb-1">
                                                <label className="luxury-label mb-0">
                                                    <MapPin size={12} className="text-terracotta" />
                                                    <span>Locality / Residential Address / Notes</span>
                                                    <span className="text-muted text-lowercase ms-1" style={{ fontSize: '0.65rem', fontWeight: 500 }}>(Optional)</span>
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, hideAddress: !prev.hideAddress }))}
                                                    className={`btn btn-link p-0 text-decoration-none extra-tiny d-inline-flex align-items-center gap-1 ${formData.hideAddress ? 'text-warning fw-bold' : 'text-muted hover-text-main'}`}
                                                    title={formData.hideAddress ? "Address Hidden in PDF: click to make visible" : "Address Visible in PDF: click to hide"}
                                                >
                                                    {formData.hideAddress ? <EyeOff size={11} className="text-warning" /> : <Eye size={11} />}
                                                    <span>{formData.hideAddress ? 'Hidden' : 'Visible'}</span>
                                                </button>
                                            </div>
                                            <div className="luxury-input-wrapper">
                                                <div className="luxury-icon-box">
                                                    <MapPin size={16} />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Sakaripara Main Road, Ward 4"
                                                    value={formData.address}
                                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                                    className="luxury-input-field"
                                                />
                                            </div>
                                        </div>

                                        {/* Hide Member Switch (Option 1) */}
                                        <div className="col-12">
                                            <div 
                                                className="d-flex align-items-center justify-content-between p-2.5 px-3 rounded-3 border transition-all"
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
                                                            <span>Hide Member from Roster &amp; PDF</span>
                                                            {formData.isHidden && (
                                                                <span className="badge rounded-pill bg-warning text-dark px-1.5" style={{ fontSize: '0.6rem' }}>
                                                                    Hidden
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="extra-tiny text-muted mb-0" style={{ fontSize: '0.67rem' }}>
                                                            {formData.isHidden 
                                                                ? 'This member is hidden and will NOT be included in any downloaded PDF directory or public roster.'
                                                                : 'Member is visible and will be included in the downloaded PDF directory.'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="form-check form-switch m-0 ps-0">
                                                    <input
                                                        type="checkbox"
                                                        role="switch"
                                                        className="form-check-input ms-0"
                                                        id="memberIsHiddenToggle"
                                                        checked={formData.isHidden}
                                                        onChange={e => setFormData({ ...formData, isHidden: e.target.checked })}
                                                        style={{ cursor: 'pointer', width: '2.4em', height: '1.25em' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sticky / Pinned Modal Footer Actions */}
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
                                        className="btn-luxury-cancel"
                                        style={{ minHeight: '38px', padding: '0.45rem 1.25rem', fontSize: '0.82rem', borderRadius: '10px' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="btn-luxury-submit"
                                        style={{ minHeight: '38px', padding: '0.45rem 1.5rem', fontSize: '0.82rem', borderRadius: '10px' }}
                                    >
                                        <Save size={15} />
                                        <span>{submitting ? 'Saving...' : editingMember ? 'Update Member' : 'Save Member'}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>,
            document.body
        )}

            {/* Manage Roles & Departments Modal (Full CRUD Manager) */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isManagerOpen && (
                        <div 
                            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-2 p-sm-3" 
                            style={{ 
                                backgroundColor: 'rgba(0, 0, 0, 0.35)', 
                                backdropFilter: 'blur(4px)',
                                WebkitBackdropFilter: 'blur(4px)',
                                zIndex: 100000,
                                inset: 0
                            }}
                            onClick={(e) => {
                                if (e.target === e.currentTarget) setIsManagerOpen(false)
                            }}
                        >
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                transition={{ duration: 0.22, ease: 'easeOut' }}
                                className="luxury-modal-card w-100 shadow-2xl d-flex flex-column overflow-hidden my-auto"
                                style={{
                                    maxWidth: '560px',
                                    maxHeight: 'min(88vh, 680px)',
                                    background: '#ffffff',
                                    border: '1.5px solid var(--glass-border)',
                                    borderRadius: '20px'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="d-flex align-items-center justify-content-between px-3 px-sm-4 py-3 border-bottom flex-shrink-0" style={{ borderColor: 'var(--glass-border)', background: '#ffffff' }}>
                                    <div className="d-flex align-items-center gap-2.5">
                                        <div className="figma-members-header-emblem d-flex align-items-center justify-content-center shadow-sm flex-shrink-0" style={{ width: '38px', height: '38px', borderRadius: '12px' }}>
                                            <Settings size={18} />
                                        </div>
                                        <div>
                                            <h6 className="fw-extrabold mb-0 text-main" style={{ fontSize: '1.02rem', letterSpacing: '-0.01em' }}>
                                                Manage Roles &amp; Wings
                                            </h6>
                                            <p className="extra-tiny text-muted mb-0">
                                                Create, edit, or delete custom committee designations &amp; departments
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsManagerOpen(false)} 
                                        className="btn btn-close-custom rounded-circle p-2 border shadow-sm hover-scale d-flex align-items-center justify-content-center" 
                                        style={{ 
                                            backgroundColor: 'var(--input-bg)', 
                                            borderColor: 'var(--glass-border)',
                                            width: '32px',
                                            height: '32px'
                                        }} 
                                        aria-label="Close"
                                    >
                                        <X size={15} style={{ color: 'var(--text-main)' }} />
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="d-flex border-bottom px-3 px-sm-4 pt-2 bg-light bg-opacity-50 flex-shrink-0" style={{ borderColor: 'var(--glass-border)' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setManagerTab('roles')
                                            setManagerNewName('')
                                            setEditingItemName(null)
                                        }}
                                        className={`btn btn-link text-decoration-none px-3 py-2 extra-tiny fw-bold border-bottom border-2 ${managerTab === 'roles' ? 'border-primary text-primary' : 'border-transparent text-muted'}`}
                                    >
                                        Roles / Designations ({allRoles.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setManagerTab('departments')
                                            setManagerNewName('')
                                            setEditingItemName(null)
                                        }}
                                        className={`btn btn-link text-decoration-none px-3 py-2 extra-tiny fw-bold border-bottom border-2 ${managerTab === 'departments' ? 'border-primary text-primary' : 'border-transparent text-muted'}`}
                                    >
                                        Departments / Wings ({allDepartments.length})
                                    </button>
                                </div>

                                {/* Manager Body */}
                                <div className="p-3 p-sm-4 overflow-y-auto flex-grow-1" style={{ minHeight: 0 }}>
                                    {/* Top Quick Add Bar */}
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                        <input
                                            type="text"
                                            placeholder={managerTab === 'roles' ? 'Enter new role title (e.g. Stage Lead)...' : 'Enter new department name (e.g. Media Wing)...'}
                                            value={managerNewName}
                                            onChange={e => setManagerNewName(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault()
                                                    if (managerTab === 'roles') {
                                                        handleAddCustomRole(managerNewName)
                                                    } else {
                                                        handleAddCustomDept(managerNewName)
                                                    }
                                                    setManagerNewName('')
                                                }
                                            }}
                                            className="form-control form-control-sm rounded-3 text-main fw-semibold"
                                            style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)', fontSize: '0.82rem' }}
                                        />
                                        <button
                                            type="button"
                                            disabled={!managerNewName.trim()}
                                            onClick={() => {
                                                if (managerTab === 'roles') {
                                                    handleAddCustomRole(managerNewName)
                                                } else {
                                                    handleAddCustomDept(managerNewName)
                                                }
                                                setManagerNewName('')
                                            }}
                                            className="btn btn-sm btn-premium rounded-pill px-3 py-1.5 extra-tiny fw-bold text-nowrap flex-shrink-0"
                                        >
                                            <Plus size={13} className="me-1" /> Add
                                        </button>
                                    </div>

                                    {/* Items List */}
                                    <div className="d-flex flex-column gap-1.5">
                                        {(managerTab === 'roles' ? allRoles : allDepartments).map(item => {
                                            const isDefault = managerTab === 'roles' 
                                                ? DEFAULT_ROLE_PRESETS.includes(item)
                                                : DEFAULT_DEPARTMENTS.includes(item)

                                            const isEditing = editingItemName && editingItemName.type === managerTab && editingItemName.oldName === item

                                            if (isEditing) {
                                                return (
                                                    <div key={item} className="d-flex align-items-center gap-2 p-2 rounded-3 border bg-light">
                                                        <input
                                                            type="text"
                                                            autoFocus
                                                            value={editingItemName.currentVal}
                                                            onChange={e => setEditingItemName({ ...editingItemName, currentVal: e.target.value })}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault()
                                                                    if (managerTab === 'roles') {
                                                                        handleRenameRole(item, editingItemName.currentVal)
                                                                    } else {
                                                                        handleRenameDept(item, editingItemName.currentVal)
                                                                    }
                                                                } else if (e.key === 'Escape') {
                                                                    setEditingItemName(null)
                                                                }
                                                            }}
                                                            className="form-control form-control-sm text-main fw-bold"
                                                            style={{ fontSize: '0.82rem' }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (managerTab === 'roles') {
                                                                    handleRenameRole(item, editingItemName.currentVal)
                                                                } else {
                                                                    handleRenameDept(item, editingItemName.currentVal)
                                                                }
                                                            }}
                                                            className="btn btn-sm btn-success rounded-pill px-2.5 py-1 extra-tiny fw-bold text-white flex-shrink-0"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingItemName(null)}
                                                            className="btn btn-sm btn-light rounded-circle p-1 extra-tiny text-muted flex-shrink-0"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                )
                                            }

                                            return (
                                                <div 
                                                    key={item} 
                                                    className="d-flex align-items-center justify-content-between p-2 px-3 rounded-3 border border-opacity-50 hover-bg-light transition-all"
                                                    style={{ borderColor: 'var(--glass-border)', background: 'var(--card-bg, #ffffff)' }}
                                                >
                                                    <div className="d-flex align-items-center gap-2 text-truncate">
                                                        <span className="extra-tiny fw-bold text-main text-truncate" style={{ fontSize: '0.82rem' }}>
                                                            {item}
                                                        </span>
                                                        {isDefault ? (
                                                            <span className="badge bg-secondary bg-opacity-10 text-muted rounded-pill px-2 py-0.5" style={{ fontSize: '0.62rem' }}>
                                                                Preset
                                                            </span>
                                                        ) : (
                                                            <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2 py-0.5" style={{ fontSize: '0.62rem' }}>
                                                                Custom
                                                            </span>
                                                        )}
                                                    </div>

                                                    {!isDefault && (
                                                        <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingItemName({ type: managerTab, oldName: item, currentVal: item })}
                                                                className="btn btn-sm btn-light p-1 px-2 rounded extra-tiny text-muted hover-text-main"
                                                                title="Rename"
                                                            >
                                                                <Edit3 size={12} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (managerTab === 'roles') {
                                                                        handleDeleteRole(item)
                                                                    } else {
                                                                        handleDeleteDept(item)
                                                                    }
                                                                }}
                                                                className="btn btn-sm btn-light p-1 px-2 rounded extra-tiny text-danger hover-bg-danger hover-text-white"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="d-flex justify-content-end p-3 border-top flex-shrink-0" style={{ borderColor: 'var(--glass-border)', background: '#ffffff' }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsManagerOpen(false)}
                                        className="btn btn-sm btn-light rounded-pill px-4 py-1.5 extra-tiny fw-bold"
                                    >
                                        Done
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    )
}
