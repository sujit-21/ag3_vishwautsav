import { useState, useEffect } from 'react'
import './Dashboard.css'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Landmark, Calendar, MapPin, Users, LogOut, LayoutDashboard, Flag, X, TrendingUp, TrendingDown, Info, History, Search, Building, CreditCard, ChevronRight, MessageSquare, HelpCircle, User as UserIcon, BarChart3, FileDown, ShieldCheck, ExternalLink, Fingerprint, Clock, Wallet, CheckCircle2, Sparkles, Receipt } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import VIPCard from '../../components/VIPCard'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'

const Dashboard = () => {
    const { user, logout } = useAuth()
    const [searchParams] = useSearchParams()
    const [festivals, setFestivals] = useState([])
    const [events, setEvents] = useState([])
    const [allSubscriptions, setAllSubscriptions] = useState([])
    const [allExpenses, setAllExpenses] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedItem, setSelectedItem] = useState(null)

    // Admin Tab State — default to 'verify' if URL param present
    const [activeAdminTab, setActiveAdminTab] = useState(
        searchParams.get('tab') === 'verify' ? 'verify' : 'console'
    )

    // Verify / Search State (available to both admin & user)
    const [entities, setEntities] = useState([])
    const [searchEntity, setSearchEntity] = useState('')
    const [searchId, setSearchId] = useState('')
    const [searchResult, setSearchResult] = useState(null)
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchError, setSearchError] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                if (user?.role === 'admin') {
                    const [festRes, eventRes, festSubRes, festExpRes, eventSubRes, eventExpRes, entityRes] = await Promise.all([
                        axios.get('/api/festivals').catch(() => ({ data: [] })),
                        axios.get('/api/events').catch(() => ({ data: [] })),
                        axios.get('/api/subscriptions/festival').catch(() => ({ data: [] })),
                        axios.get('/api/expenses/festival').catch(() => ({ data: [] })),
                        axios.get('/api/subscriptions/event').catch(() => ({ data: [] })),
                        axios.get('/api/expenses/event').catch(() => ({ data: [] })),
                        axios.get('/api/entity/all').catch(() => ({ data: [] }))
                    ])
                    setFestivals(Array.isArray(festRes.data) ? festRes.data : [])
                    setEvents(Array.isArray(eventRes.data) ? eventRes.data : [])
                    setAllSubscriptions([...(Array.isArray(festSubRes.data) ? festSubRes.data : []), ...(Array.isArray(eventSubRes.data) ? eventSubRes.data : [])])
                    setAllExpenses([...(Array.isArray(festExpRes.data) ? festExpRes.data : []), ...(Array.isArray(eventExpRes.data) ? eventExpRes.data : [])])
                    setEntities(Array.isArray(entityRes.data) ? entityRes.data : [])
                } else if (user?.role === 'user') {
                    const entityRes = await axios.get('/api/entity/all')
                    setEntities(Array.isArray(entityRes.data) ? entityRes.data : [])
                }
            } catch (err) {
                console.error('Error fetching dashboard data:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [user])

    const handleUserSearch = async (e) => {
        e.preventDefault()
        if (!searchEntity || !searchId) return
        setSearchLoading(true)
        setSearchError('')
        setSearchResult(null)
        try {
            const trimmedEntity = searchEntity.trim()
            const trimmedId = searchId.trim()
            const res = await axios.get(`/api/subscriptions/search-all/${encodeURIComponent(trimmedEntity)}/${encodeURIComponent(trimmedId)}`)
            setSearchResult(res.data)
        } catch (err) {
            setSearchError(err.response?.data?.message || 'No record found matching these details.')
        } finally {
            setSearchLoading(false)
        }
    }

    const downloadCardPDF = async (sub) => {
        try {
            const jspdfModule = await import('jspdf');
            const jsPDF = jspdfModule.default || jspdfModule.jsPDF || jspdfModule;

            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [110, 75] });
            const cardW = 110;
            const cardH = 75;
            const x = 0;
            const y = 0;

            // BACKGROUND LOGIC
            let bgColor = [30, 64, 175]; // Regular (#1e40af)
            if (sub.membershipType === 'Admin') bgColor = [185, 28, 28]; // Admin (#b91c1c)
            else if (sub.membershipType === 'Prime Member' || sub.membershipType === 'Prime') bgColor = [245, 158, 11]; // Prime (#f59e0b)
            else if (sub.membershipType === 'VIP') bgColor = [88, 28, 135]; // VIP (#581c87)

            doc.setFillColor(...bgColor);
            doc.roundedRect(x, y, cardW, cardH, 6, 6, 'F');

            // --- Membership Identification ---
            doc.setFontSize(8);
            doc.setTextColor(235, 235, 235);
            doc.text('ID', x + 12, y + 16);

            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.setFont('courier', 'bold');
            const formattedId = String(sub.subId || sub.cardId || '').match(/.{1,4}/g)?.join(' ') || '---- ---- ----';
            doc.text(formattedId, x + 12, y + 23);

            doc.setFontSize(8);
            doc.setTextColor(235, 235, 235);
            doc.setFont('helvetica', 'bold');
            doc.text('FULL NAME', x + 12, y + 35);

            doc.setFontSize(14);
            doc.setTextColor(255, 255, 255);
            doc.text(String(sub.name).toUpperCase(), x + 12, y + 42);

            // FESTIVAL/EVENT & DATE
            doc.setFontSize(8);
            doc.setTextColor(235, 235, 235);
            doc.text('EVENT / FESTIVAL', x + 12, y + 54);

            doc.setFontSize(11);
            doc.setTextColor(255, 255, 255);
            doc.text(String(sub.festOrEventName || '—').toUpperCase(), x + 12, y + 60);

            doc.setFontSize(6.5);
            doc.setTextColor(220, 220, 220);
            let detailY = y + 65;
            if (sub.entityName) {
                doc.text(String(sub.entityName).toUpperCase(), x + 12, detailY);
                detailY += 3.5;
            }
            if (sub.address) {
                const addr = doc.splitTextToSize(String(sub.address).toUpperCase(), 60);
                doc.text(addr, x + 12, detailY);
            }

            // RIGHT ALIGNED
            doc.setFontSize(8);
            doc.setTextColor(235, 235, 235);
            doc.text('VALIDITY', x + 98, y + 16, { align: 'right' });

            doc.setFontSize(10);
            doc.setTextColor(255, 255, 255);
            const validText = (sub.fromDate && sub.toDate) ? `${new Date(sub.fromDate).toLocaleDateString()} - ${new Date(sub.toDate).toLocaleDateString()}` : 'FULL EVENT';
            doc.text(validText, x + 98, y + 23, { align: 'right' });

            doc.setFontSize(8);
            doc.setTextColor(235, 235, 235);
            doc.text('PASS STATUS', x + 98, y + 35, { align: 'right' });

            doc.setFontSize(13);
            doc.setTextColor(255, 255, 255);
            doc.text(String(sub.membershipType).toUpperCase(), x + 98, y + 42, { align: 'right' });

            doc.setFontSize(8);
            doc.setTextColor(235, 235, 235);
            doc.text('GROUP SIZE', x + 98, y + 54, { align: 'right' });

            doc.setFontSize(13);
            doc.setTextColor(255, 255, 255);
            doc.text(String(sub.familyMembers || 0), x + 98, y + 61, { align: 'right' });

            doc.save(`Elite_Pass_${sub.subId || sub.cardId}.pdf`);
        } catch (err) {
            console.error('PDF Error:', err);
            alert('Error generating Elite Pass');
        }
    }

    const getOrgData = () => {
        const orgMap = {}
        const nameToOrg = {}
        
        festivals.forEach(f => {
            const org = f.entityName || 'Not specified'
            nameToOrg[f.title] = org
            if (!orgMap[org]) orgMap[org] = { orgName: org, festivals: [], events: [], collection: 0, expenses: 0, due: 0, savings: 0 }
            orgMap[org].festivals.push(f)
        })

        events.forEach(e => {
            const org = e.entityName || 'Not specified'
            nameToOrg[e.title] = org
            if (!orgMap[org]) orgMap[org] = { orgName: org, festivals: [], events: [], collection: 0, expenses: 0, due: 0, savings: 0 }
            orgMap[org].events.push(e)
        })

        allSubscriptions.forEach(s => {
            const org = nameToOrg[s.festOrEventName] || 'Not specified'
            if (orgMap[org]) {
                const amount = Number(String(s.amount || 0).replace(/[^0-9.]/g, '')) || 0
                if (s.paymentType === 'Due') {
                    orgMap[org].due += amount
                } else {
                    orgMap[org].collection += amount
                }
            }
        })
        
        allExpenses.forEach(e => {
            const org = nameToOrg[e.festOrEventName] || 'Not specified'
            if (orgMap[org]) orgMap[org].expenses += (Number(String(e.amount || 0).replace(/[^0-9.]/g, '')) || 0)
        })

        Object.values(orgMap).forEach(org => {
            org.savings = org.collection - org.expenses
        })

        return Object.values(orgMap).sort((a, b) => b.collection - a.collection)
    }

    const orgDataList = getOrgData()

    // Helper to get Attendee trends (Clustering by Base Name ignoring years)
    const getAttendeeAttendance = () => {
        const stats = {}
        const getBaseName = (name) => name.replace(/\b(20\d{2})\b/g, '').trim().toLowerCase()

        // Cluster all subscriptions by THEIR own dates and base names
        allSubscriptions.forEach(sub => {
            const year = new Date(sub.date).getFullYear()
            const base = getBaseName(sub.festOrEventName)
            if (!stats[base]) stats[base] = {}
            if (!stats[base][year]) stats[base][year] = 0
            stats[base][year]++
        })
        return stats
    }
    const attendeeAttendance = getAttendeeAttendance()
    const getBaseName = (name) => name.replace(/\b(20\d{2})\b/g, '').trim().toLowerCase()

    if (loading) return (
        <div className="container py-5 text-center">
            <div className="spinner-border text-primary" role="status"></div>
        </div>
    )

    // ── Shared Verify Search Panel (used in both admin Verify tab & user role) ──
    const renderVerifyPanel = () => (
        <div className="row g-4 justify-content-center">
            <div className="col-lg-5">
                <div className="verify-terminal-card">
                    <div className="d-flex align-items-center gap-3 mb-4">
                        <div className="d-flex align-items-center justify-content-center rounded-3 shadow-sm flex-shrink-0" style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, var(--palette-terracotta), var(--palette-rust))', color: '#ffffff' }}>
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <h4 className="fw-extrabold mb-0 text-main" style={{ letterSpacing: '-0.02em' }}>Verify <span className="gradient-text">Record</span></h4>
                            <p className="text-muted extra-tiny mb-0">Search &amp; validate identity by Entity &amp; Pass ID</p>
                        </div>
                    </div>

                    <form onSubmit={handleUserSearch}>
                        <div className="mb-3">
                            <label className="luxury-label mb-1.5">
                                <Building size={13} /> Select Entity / Organization
                            </label>
                            <div className="luxury-input-wrapper">
                                <div className="luxury-icon-box">
                                    <Building size={16} />
                                </div>
                                <select 
                                    className="luxury-input-field fw-semibold" 
                                    style={{ cursor: 'pointer' }}
                                    value={searchEntity} 
                                    onChange={e => setSearchEntity(e.target.value)} 
                                    required
                                >
                                    <option value="">-- Choose Entity --</option>
                                    {entities.map(c => (
                                        <option key={c._id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="luxury-label mb-1.5">
                                <Fingerprint size={13} /> Enter 10-Digit Pass ID
                            </label>
                            <div className="luxury-input-wrapper">
                                <div className="luxury-icon-box">
                                    <CreditCard size={16} />
                                </div>
                                <input 
                                    type="text" 
                                    className="luxury-input-field fw-bold font-monospace" 
                                    style={{ letterSpacing: '2px', textTransform: 'uppercase' }}
                                    placeholder="e.g. 1SAXCVSQPK" 
                                    maxLength="10" 
                                    value={searchId} 
                                    onChange={e => setSearchId(e.target.value.toUpperCase())} 
                                    required 
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={searchLoading} className="btn-verify-action">
                            {searchLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                    <span>Authenticating Record...</span>
                                </>
                            ) : (
                                <>
                                    <Search size={18} />
                                    <span>Authenticate &amp; Verify</span>
                                    <ChevronRight size={16} />
                                </>
                            )}
                        </button>

                        {searchError && (
                            <div className="mt-3 p-3 rounded-3 bg-danger bg-opacity-10 text-danger extra-tiny fw-bold text-center border border-danger border-opacity-25 animate-in fade-in">
                                ⚠️ {searchError}
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* Results Column */}
            <div className="col-lg-7">
                {searchResult ? (
                    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="d-flex flex-column gap-3">
                        <VIPCard subscription={searchResult} />
                        <div className="verify-terminal-card p-4">
                            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 pb-3 border-bottom" style={{ borderColor: 'var(--glass-border)' }}>
                                <h6 className="fw-bold d-flex align-items-center gap-2 mb-0 text-main">
                                    <CheckCircle2 size={18} className="text-success" />
                                    <span>Verified Membership Record</span>
                                </h6>
                                <span className="badge bg-success bg-opacity-15 text-success border border-success border-opacity-25 px-2.5 py-1 rounded-pill extra-tiny fw-bold">
                                    ● Authenticated
                                </span>
                            </div>
                            <div className="row g-2.5">
                                <div className="col-12 col-sm-6">
                                    <div className="verify-info-tile">
                                        <p className="extra-tiny text-muted uppercase fw-bold mb-1 d-flex align-items-center gap-1.5">
                                            <Building size={12} /> Entity
                                        </p>
                                        <p className="small mb-0 fw-extrabold text-main">{searchResult.entityName}</p>
                                    </div>
                                </div>
                                <div className="col-12 col-sm-6">
                                    <div className="verify-info-tile">
                                        <p className="extra-tiny text-muted uppercase fw-bold mb-1 d-flex align-items-center gap-1.5">
                                            <Sparkles size={12} /> Event / Festival
                                        </p>
                                        <p className="small mb-0 fw-extrabold text-main">{searchResult.festOrEventName}</p>
                                    </div>
                                </div>
                                <div className="col-12 col-sm-6">
                                    <div className="verify-info-tile">
                                        <p className="extra-tiny text-muted uppercase fw-bold mb-1 d-flex align-items-center gap-1.5">
                                            <CreditCard size={12} /> Pass Tier
                                        </p>
                                        <p className="small mb-0 fw-extrabold text-primary">{searchResult.membershipType}</p>
                                    </div>
                                </div>
                                <div className="col-12 col-sm-6">
                                    <div className="verify-info-tile">
                                        <p className="extra-tiny text-muted uppercase fw-bold mb-1 d-flex align-items-center gap-1.5">
                                            <Calendar size={12} /> Purchase Date
                                        </p>
                                        <p className="small mb-0 fw-extrabold text-main">{new Date(searchResult.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="verify-info-tile d-flex justify-content-between align-items-center" style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                                        <div>
                                            <p className="extra-tiny text-success uppercase fw-bold mb-0.5">Authorized Contribution</p>
                                            <p className="fs-5 mb-0 fw-extrabold text-success">₹{(Number(String(searchResult.amount || 0).replace(/[^0-9.]/g, '')) || 0).toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="p-2 rounded-circle bg-success bg-opacity-20 text-success">
                                            <CheckCircle2 size={20} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => downloadCardPDF(searchResult)}
                                className="btn btn-luxury-submit w-100 mt-3.5 py-2.5 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                            >
                                <FileDown size={18} />
                                <span>Download Official Pass PDF</span>
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="verify-empty-state">
                        <div className="verify-empty-icon-box">
                            <ShieldCheck size={38} />
                        </div>
                        <h5 className="fw-bold text-main mb-1.5">Awaiting Pass Authentication</h5>
                        <p className="small text-muted mb-0" style={{ maxWidth: '340px' }}>
                            Select the host entity and enter the 10-digit unique pass ID to verify credentials and download the pass.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )

    const streamlitBase = import.meta.env.VITE_STREAMLIT_URL || 'https://ag3-vishwautsav-analytics.onrender.com'
    const fullStreamlitUrl = `${streamlitBase}/?embedded=true${user?.entityName ? `&entity=${encodeURIComponent(user.entityName)}` : ''}`
    const externalStreamlitUrl = `${streamlitBase}/${user?.entityName ? `?entity=${encodeURIComponent(user.entityName)}` : ''}`

    return (
        <div className="container py-4 mt-2">
            <Helmet>
                <title>Admin Dashboard — Vishwa Utsav Management Console</title>
                <meta name="description" content="Vishwa Utsav administration dashboard for managing festivals, events, subscriptions, and financial reports." />
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>
            <div className="row g-4 justify-content-center">
                <div className="col-12">
                    {user?.role === 'admin' ? (
                        <div className="animate-in">
                            {/* ── Admin Tab Navigation ── */}
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
                                <div className="d-flex align-items-center gap-2">
                                    <div className="p-2 bg-primary bg-opacity-10 rounded-3">
                                        <LayoutDashboard className="text-primary" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="fw-bold mb-0">Admin <span className="gradient-text">Dashboard</span></h3>
                                        <p className="text-muted tiny mb-0">Management &amp; Record Verification</p>
                                    </div>
                                </div>
                                <div className="d-flex gap-1.5 gap-sm-2 p-1 rounded-3 w-100 w-sm-auto justify-content-between justify-content-sm-start" style={{ background: 'rgba(99,102,241,0.08)', border: '1.5px solid rgba(99,102,241,0.18)' }}>
                                    <button
                                        onClick={() => setActiveAdminTab('console')}
                                        className="btn border-0 flex-grow-1 flex-sm-grow-0 px-2.5 px-sm-4 py-2 rounded-2 small fw-extrabold transition-all d-flex align-items-center justify-content-center gap-1.5"
                                        style={{
                                            background: activeAdminTab === 'console' ? '#6366f1' : 'transparent',
                                            color: activeAdminTab === 'console' ? '#ffffff' : '#64748b'
                                        }}
                                    >
                                        <LayoutDashboard size={15} /> Console
                                    </button>
                                    <button
                                        onClick={() => { setActiveAdminTab('verify'); setSearchResult(null); setSearchError(''); }}
                                        className="btn border-0 flex-grow-1 flex-sm-grow-0 px-2.5 px-sm-4 py-2 rounded-2 small fw-extrabold transition-all d-flex align-items-center justify-content-center gap-1.5"
                                        style={{
                                            background: activeAdminTab === 'verify' ? '#6366f1' : 'transparent',
                                            color: activeAdminTab === 'verify' ? '#ffffff' : '#64748b'
                                        }}
                                    >
                                        <ShieldCheck size={15} /> Verify
                                    </button>
                                    <button
                                        onClick={() => { setActiveAdminTab('analytics'); setSearchResult(null); setSearchError(''); }}
                                        className="btn border-0 flex-grow-1 flex-sm-grow-0 px-2.5 px-sm-4 py-2 rounded-2 small fw-extrabold transition-all d-flex align-items-center justify-content-center gap-1.5"
                                        style={{
                                            background: activeAdminTab === 'analytics' ? '#6366f1' : 'transparent',
                                            color: activeAdminTab === 'analytics' ? '#ffffff' : '#64748b'
                                        }}
                                    >
                                        <BarChart3 size={15} /> Analytics
                                    </button>
                                </div>
                            </div>

                            {/* ── Analytics Tab ── */}
                            {activeAdminTab === 'analytics' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="analytics-glass-card p-3 p-md-4 mb-4 shadow-sm w-100"
                                >
                                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 pb-3 border-bottom border-secondary border-opacity-10 gap-3">
                                        <div>
                                            <h5 className="fw-bold mb-1 text-main d-flex align-items-center gap-2" style={{ fontSize: '1.05rem' }}>
                                                <BarChart3 className="text-accent-1" size={20} />
                                                Streamlit Live Intelligence &amp; ML Predictions
                                            </h5>
                                            <small className="text-muted d-block" style={{ fontSize: '0.8rem' }}>
                                                Interactive machine learning predictions and financial analytics powered by Streamlit
                                            </small>
                                        </div>
                                        <a
                                            href={externalStreamlitUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-analytics-fullscreen"
                                            title="Open in full screen tab"
                                        >
                                            <ExternalLink size={14} /> <span>Open Fullscreen</span>
                                        </a>
                                    </div>

                                    <div className="analytics-iframe-container">
                                        <iframe 
                                            src={fullStreamlitUrl} 
                                            className="analytics-responsive-iframe"
                                            style={{ width: '100%', height: '100%', minHeight: '850px', border: 'none', display: 'block' }}
                                            title="Admin Analytics Dashboard"
                                            allow="clipboard-write"
                                            loading="lazy"
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* ── Console Tab ── */}
                            {activeAdminTab === 'console' && (
                            <>
                            {orgDataList.length > 0 ? orgDataList.map((org, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.08 }}
                                    className="console-entity-card"
                                >
                                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 pb-3 border-bottom gap-2" style={{ borderColor: 'var(--glass-border)' }}>
                                        <div className="d-flex align-items-center gap-2.5">
                                            <div className="d-flex align-items-center justify-content-center rounded-3 shadow-xs" style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(217,90,34,0.15))', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--palette-terracotta)' }}>
                                                <Building size={18} />
                                            </div>
                                            <div>
                                                <h4 className="fw-extrabold text-main mb-0" style={{ letterSpacing: '-0.02em', fontSize: '1.25rem' }}>
                                                    {org.orgName}
                                                </h4>
                                                <p className="extra-tiny text-muted mb-0 fw-semibold">
                                                    {org.festivals.length} Festivals • {org.events.length} Events
                                                </p>
                                            </div>
                                        </div>
                                        <span className="badge rounded-pill extra-tiny px-3 py-1 fw-bold" style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                            Active Operating Node
                                        </span>
                                    </div>
                                    
                                    {/* Festivals & Events List */}
                                    <div className="row g-2.5 mb-4">
                                        {org.festivals.map(fest => (
                                            <div key={fest._id} className="col-12">
                                                <div 
                                                    className="console-record-item"
                                                    style={{ '--record-accent': '#6366f1' }}
                                                    onClick={() => setSelectedItem({ ...fest, type: 'festival' })}
                                                    role="button"
                                                >
                                                    <div className="d-flex align-items-center gap-2.5">
                                                        <span className="console-record-pill-fest">
                                                            <Sparkles size={11} /> FESTIVAL
                                                        </span>
                                                        <h6 className="fw-bold mb-0 text-main" style={{ fontSize: '0.94rem' }}>{fest.title}</h6>
                                                    </div>
                                                    
                                                    <div className="d-flex align-items-center gap-2 justify-content-between justify-content-md-end">
                                                        {(() => {
                                                            const base = getBaseName(fest.title)
                                                            const history = attendeeAttendance[base]
                                                            if (history) {
                                                                return (
                                                                    <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                                                        <span className="extra-tiny text-muted fw-bold d-none d-sm-inline"><Users size={11} className="me-1" />Attendance:</span>
                                                                        {Object.entries(history).sort(([a], [b]) => b - a).map(([yr, count]) => (
                                                                            <span key={yr} className="console-history-chip">
                                                                                <span>{yr}:</span>
                                                                                <strong className="text-primary">{count}</strong>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )
                                                            }
                                                            return null
                                                        })()}
                                                        <div className="btn btn-sm btn-light rounded-circle p-1 ms-1 d-flex align-items-center justify-content-center shadow-xs" style={{ width: '28px', height: '28px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)' }}>
                                                            <ChevronRight size={14} className="text-primary" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {org.events.map(ev => (
                                            <div key={ev._id} className="col-12">
                                                <div 
                                                    className="console-record-item"
                                                    style={{ '--record-accent': 'var(--palette-terracotta, #ea580c)' }}
                                                    onClick={() => setSelectedItem({ ...ev, type: 'event' })}
                                                    role="button"
                                                >
                                                    <div className="d-flex align-items-center gap-2.5">
                                                        <span className="console-record-pill-event">
                                                            <Flag size={11} /> EVENT
                                                        </span>
                                                        <h6 className="fw-bold mb-0 text-main" style={{ fontSize: '0.94rem' }}>{ev.title}</h6>
                                                    </div>
                                                    
                                                    <div className="d-flex align-items-center gap-2 justify-content-between justify-content-md-end">
                                                        {(() => {
                                                            const base = getBaseName(ev.title)
                                                            const history = attendeeAttendance[base]
                                                            if (history) {
                                                                return (
                                                                    <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                                                        <span className="extra-tiny text-muted fw-bold d-none d-sm-inline"><Users size={11} className="me-1" />Attendance:</span>
                                                                        {Object.entries(history).sort(([a], [b]) => b - a).map(([yr, count]) => (
                                                                            <span key={yr} className="console-history-chip">
                                                                                <span>{yr}:</span>
                                                                                <strong style={{ color: 'var(--palette-terracotta)' }}>{count}</strong>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )
                                                            }
                                                            return null
                                                        })()}
                                                        <div className="btn btn-sm btn-light rounded-circle p-1 ms-1 d-flex align-items-center justify-content-center shadow-xs" style={{ width: '28px', height: '28px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)' }}>
                                                            <ChevronRight size={14} style={{ color: 'var(--palette-terracotta)' }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Financial Summary Cards - MODERN LUXURY KPI CARDS */}
                                    <div className="row g-3 pt-3 border-top" style={{ borderColor: 'var(--glass-border)' }}>
                                        <div className="col-6 col-lg-3">
                                            <div className="console-kpi-card console-kpi-collection">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <span className="extra-tiny text-uppercase fw-bold text-white text-opacity-85">Total Collection</span>
                                                    <div className="console-kpi-icon-circle">
                                                        <TrendingUp size={16} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="fw-extrabold text-white mb-0" style={{ fontSize: '1.45rem' }}>₹{org.collection.toLocaleString('en-IN')}</h3>
                                                    <span className="extra-tiny text-white text-opacity-75">Gross Subscriptions</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-6 col-lg-3">
                                            <div className="console-kpi-card console-kpi-expenses">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <span className="extra-tiny text-uppercase fw-bold text-white text-opacity-85">Total Expenses</span>
                                                    <div className="console-kpi-icon-circle">
                                                        <Receipt size={16} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="fw-extrabold text-white mb-0" style={{ fontSize: '1.45rem' }}>₹{org.expenses.toLocaleString('en-IN')}</h3>
                                                    <span className="extra-tiny text-white text-opacity-75">Outflow &amp; Operations</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-6 col-lg-3">
                                            <div className="console-kpi-card console-kpi-due">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <span className="extra-tiny text-uppercase fw-bold text-white text-opacity-85">Pending Due</span>
                                                    <div className="console-kpi-icon-circle">
                                                        <Clock size={16} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="fw-extrabold text-white mb-0" style={{ fontSize: '1.45rem' }}>₹{org.due.toLocaleString('en-IN')}</h3>
                                                    <span className="extra-tiny text-white text-opacity-75">Receivables</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-6 col-lg-3">
                                            <div className="console-kpi-card console-kpi-savings">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <span className="extra-tiny text-uppercase fw-bold text-white text-opacity-85">Net Reserve</span>
                                                    <div className="console-kpi-icon-circle">
                                                        <Wallet size={16} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="fw-extrabold text-white mb-0" style={{ fontSize: '1.45rem' }}>₹{org.savings.toLocaleString('en-IN')}</h3>
                                                    <span className="extra-tiny text-white text-opacity-75">Net Surplus</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="text-center py-5 console-entity-card">
                                    <Building size={40} className="text-muted opacity-30 mb-2" />
                                    <h5 className="fw-bold text-main">No Entity Records Found</h5>
                                    <p className="text-muted extra-tiny mb-0">Deploy a festival or event to initialize console metrics.</p>
                                </div>
                            )}
                            </>
                            )}

                            {/* ── Verify Tab ── */}
                            {activeAdminTab === 'verify' && (
                                <motion.div
                                    key="verify-tab"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    {renderVerifyPanel()}
                                </motion.div>
                            )}
                        </div>
                    ) : (
                        <div className="animate-in">
                            {/* User Role — shared Verify panel */}
                            <div className="d-flex align-items-center gap-2 mb-4">
                                <div className="p-2 bg-primary bg-opacity-10 rounded-3">
                                    <Search className="text-primary" size={24} />
                                </div>
                                <div>
                                    <h3 className="fw-bold mb-0">Record <span className="gradient-text">Search</span></h3>
                                    <p className="text-muted tiny mb-0">Find and verify your pass by Entity &amp; ID</p>
                                </div>
                            </div>
                            {renderVerifyPanel()}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Detail Overlay */}
            {user?.role === 'admin' && selectedItem && (
                <div className="modal-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(16px)', zIndex: 99999 }} onClick={() => setSelectedItem(null)}>
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="console-detail-modal-card shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="console-detail-header d-flex justify-content-between align-items-center">
                            <div>
                                <span className={selectedItem.type === 'festival' ? 'console-record-pill-fest mb-2' : 'console-record-pill-event mb-2'}>
                                    <Sparkles size={11} /> {selectedItem.type.toUpperCase()} SUMMARY
                                </span>
                                <h3 className="fw-extrabold mb-1 text-white" style={{ letterSpacing: '-0.02em' }}>{selectedItem.title}</h3>
                                <p className="text-white text-opacity-70 extra-tiny mb-0 d-flex align-items-center gap-1.5">
                                    <MapPin size={13} className="text-primary" /> {selectedItem.location || 'Location Not Set'}
                                </p>
                            </div>
                            <button className="btn btn-close btn-close-white p-2 rounded-circle hover-rotate" onClick={() => setSelectedItem(null)} aria-label="Close"></button>
                        </div>

                        <div className="p-3.5 p-md-4 overflow-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                            <div className="mb-4">
                                <h6 className="fw-extrabold mb-3 d-flex align-items-center gap-2 text-main" style={{ fontSize: '0.96rem' }}>
                                    <TrendingUp size={18} className="text-primary" /> Yearly Financial Performance
                                </h6>
                                <div className="row g-2.5">
                                    {Object.entries(
                                        [...allSubscriptions, ...allExpenses]
                                            .filter(x => x.festOrEventName === selectedItem.title)
                                            .reduce((acc, curr) => {
                                                const year = new Date(curr.date).getFullYear()
                                                if (!acc[year]) acc[year] = { collection: 0, expenses: 0 }
                                                if (curr.amount) {
                                                    const isSub = allSubscriptions.some(s => s._id === curr._id)
                                                    const cleanAmount = Number(String(curr.amount).replace(/[^0-9.]/g, '')) || 0
                                                    if (isSub) acc[year].collection += cleanAmount
                                                    else acc[year].expenses += cleanAmount
                                                }
                                                return acc
                                            }, {})
                                    ).sort(([a], [b]) => b - a).map(([year, data]) => {
                                        const net = data.collection - data.expenses;
                                        const isPositive = net >= 0;
                                        return (
                                            <div key={year} className="col-12 col-md-6 col-lg-4">
                                                <div className="console-yearly-badge h-100">
                                                    <div className="d-flex justify-content-between align-items-center mb-2 pb-1.5 border-bottom" style={{ borderColor: 'var(--glass-border)' }}>
                                                        <span className="fw-bold fs-5 text-primary">{year}</span>
                                                        <span className={`badge ${isPositive ? 'bg-success' : 'bg-danger'} bg-opacity-15 ${isPositive ? 'text-success' : 'text-danger'} border ${isPositive ? 'border-success' : 'border-danger'} border-opacity-25 px-2 py-0.5 rounded-pill extra-tiny fw-bold`}>
                                                            {isPositive ? '+' : '-'}₹{Math.abs(net).toLocaleString('en-IN')}
                                                        </span>
                                                    </div>
                                                    <div className="d-flex justify-content-between extra-tiny mb-1 text-muted">
                                                        <span>Collection:</span>
                                                        <span className="fw-bold text-main">₹{data.collection.toLocaleString('en-IN')}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between extra-tiny text-muted">
                                                        <span>Expenses:</span>
                                                        <span className="fw-bold text-main">₹{data.expenses.toLocaleString('en-IN')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="verify-terminal-card p-3 p-md-4 shadow-sm">
                                <h6 className="fw-extrabold mb-3 d-flex align-items-center gap-2 text-main" style={{ fontSize: '0.96rem' }}>
                                    <History size={18} className="text-primary" /> Transaction Ledger
                                </h6>
                                <div className="table-responsive rounded-3 border" style={{ borderColor: 'var(--glass-border)' }}>
                                    <table className="table table-hover mb-0 extra-tiny align-middle">
                                        <thead style={{ background: 'var(--input-bg)' }}>
                                            <tr className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.66rem' }}>
                                                <th className="py-2.5 px-3">Date</th>
                                                <th className="py-2.5">Payer / Particular</th>
                                                <th className="py-2.5">Ledger Type</th>
                                                <th className="py-2.5">Method</th>
                                                <th className="py-2.5 text-end px-3">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[...allSubscriptions, ...allExpenses]
                                                .filter(x => x.festOrEventName === selectedItem.title)
                                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                                .map((item, idx) => {
                                                    const isSub = allSubscriptions.some(s => s._id === item._id)
                                                    return (
                                                        <tr key={idx}>
                                                            <td className="py-2.5 px-3 text-muted">{new Date(item.date).toLocaleDateString()}</td>
                                                            <td className="py-2.5 fw-bold text-main">{item.particular || item.name}</td>
                                                            <td className="py-2.5">
                                                                <span className={`badge ${isSub ? 'bg-success' : 'bg-danger'} bg-opacity-15 ${isSub ? 'text-success' : 'text-danger'} border ${isSub ? 'border-success' : 'border-danger'} border-opacity-25 px-2 py-0.5 rounded-pill`}>
                                                                    {isSub ? 'Pass Subscription' : 'Outflow Expense'}
                                                                </span>
                                                            </td>
                                                            <td className="py-2.5">
                                                                <span className={`badge ${item.paymentType === 'Online' ? 'bg-info bg-opacity-15 text-info' : item.paymentType === 'Due' ? 'bg-danger bg-opacity-15 text-danger' : 'bg-success bg-opacity-15 text-success'} border border-opacity-25 px-2 py-0.5 rounded-pill`}>
                                                                    {item.paymentType === 'Online' && item.onlineParticulars ? `Online (${item.onlineParticulars})` : (item.paymentType || '—')}
                                                                </span>
                                                            </td>
                                                            <td className={`py-2.5 text-end px-3 fw-bold font-monospace ${isSub ? 'text-success' : 'text-danger'}`}>
                                                                {isSub ? '+' : '-'}₹{(Number(String(item.amount || 0).replace(/[^0-9.]/g, '')) || 0).toLocaleString('en-IN')}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}

export default Dashboard
