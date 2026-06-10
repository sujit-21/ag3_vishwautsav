import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Landmark, Calendar, MapPin, Users, LogOut, LayoutDashboard, Flag, X, TrendingUp, TrendingDown, Info, History, Search, Building, CreditCard, ChevronRight, MessageSquare, HelpCircle, User as UserIcon, BarChart3, FileDown, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import VIPCard from '../components/VIPCard'
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
            if (!orgMap[org]) orgMap[org] = { orgName: org, festivals: [], events: [], collection: 0, expenses: 0, savings: 0 }
            orgMap[org].festivals.push(f)
        })

        events.forEach(e => {
            const org = e.entityName || 'Not specified'
            nameToOrg[e.title] = org
            if (!orgMap[org]) orgMap[org] = { orgName: org, festivals: [], events: [], collection: 0, expenses: 0, savings: 0 }
            orgMap[org].events.push(e)
        })

        allSubscriptions.forEach(s => {
            const org = nameToOrg[s.festOrEventName] || 'Not specified'
            if (orgMap[org]) orgMap[org].collection += (Number(String(s.amount || 0).replace(/[^0-9.]/g, '')) || 0)
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
                <div className="glass-card p-4 h-100 border border-white border-opacity-10">
                    <div className="d-flex align-items-center gap-3 mb-4">
                        <div className="p-2 bg-primary bg-opacity-10 rounded-3">
                            <ShieldCheck className="text-primary" size={24} />
                        </div>
                        <div>
                            <h4 className="fw-bold mb-0">Verify <span className="gradient-text">Record</span></h4>
                            <p className="text-muted tiny mb-0">Search by Entity &amp; Subscription ID</p>
                        </div>
                    </div>

                    <form onSubmit={handleUserSearch}>
                        <div className="mb-3">
                            <label className="tiny fw-bold text-muted mb-2 uppercase ls-1 d-flex align-items-center gap-2">
                                <Building size={14} /> Select Entity
                            </label>
                            <select className="form-select bg-secondary bg-opacity-10 border-0 text-main py-2 shadow-sm" value={searchEntity} onChange={e => setSearchEntity(e.target.value)} required>
                                <option value="">-- Choose Entity --</option>
                                {entities.map(c => (
                                    <option key={c._id} value={c.name} className="bg-dark text-white">{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="tiny fw-bold text-muted mb-2 uppercase ls-1 d-flex align-items-center gap-2">
                                <CreditCard size={14} /> Enter 10-Digit ID
                            </label>
                            <input type="text" className="form-control bg-secondary bg-opacity-10 border-0 text-main py-2 shadow-sm" placeholder="e.g. 1SAXCVSQPK" maxLength="10" value={searchId} onChange={e => setSearchId(e.target.value)} required />
                        </div>

                        <button type="submit" disabled={searchLoading} className="btn btn-premium w-100 py-3 d-flex align-items-center justify-content-center gap-2">
                            {searchLoading ? <span className="spinner-border spinner-border-sm" role="status"></span> : <>Search &amp; Verify <ChevronRight size={18} /></>}
                        </button>

                        {searchError && <div className="mt-3 p-2 bg-danger bg-opacity-10 text-danger tiny rounded-3 text-center border border-danger border-opacity-20">{searchError}</div>}
                    </form>
                </div>
            </div>

            {/* Results Column */}
            <div className="col-lg-7">
                {searchResult ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <VIPCard subscription={searchResult} />
                        <div className="mt-4 glass-card p-4">
                            <h6 className="fw-bold d-flex align-items-center gap-2 mb-3">
                                <Info size={18} className="text-primary" /> Verified Record Details
                            </h6>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <div className="p-3 dashboard-item-card rounded-3">
                                        <p className="tiny text-muted uppercase fw-bold mb-1">Entity</p>
                                        <p className="small mb-0 fw-bold">{searchResult.entityName}</p>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="p-3 dashboard-item-card rounded-3">
                                        <p className="tiny text-muted uppercase fw-bold mb-1">Event / Festival</p>
                                        <p className="small mb-0 fw-bold">{searchResult.festOrEventName}</p>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="p-3 dashboard-item-card rounded-3">
                                        <p className="tiny text-muted uppercase fw-bold mb-1">Pass Tier</p>
                                        <p className="small mb-0 fw-bold text-primary">{searchResult.membershipType}</p>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="p-3 dashboard-item-card rounded-3">
                                        <p className="tiny text-muted uppercase fw-bold mb-1">Purchase Date</p>
                                        <p className="small mb-0 fw-bold">{new Date(searchResult.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="p-3 bg-success bg-opacity-5 rounded-3 border border-success border-opacity-10">
                                        <p className="tiny text-success uppercase fw-bold mb-1">Amount Paid</p>
                                        <p className="small mb-0 fw-bold text-success fs-5">₹{(Number(String(searchResult.amount || 0).replace(/[^0-9.]/g, '')) || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => downloadCardPDF(searchResult)}
                                className="btn btn-premium w-100 mt-4 py-3 d-flex align-items-center justify-content-center gap-2 shadow-lg"
                            >
                                <FileDown size={20} /> Download Card PDF
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="glass-card h-100 p-5 d-flex flex-column align-items-center justify-content-center text-center text-muted border border-dashed border-white border-opacity-20 rounded-4">
                        <ShieldCheck size={48} className="mb-3 opacity-20" />
                        <h5 className="fw-bold text-main opacity-50">Awaiting Verification</h5>
                        <p className="small mb-0">Enter an entity and 10-digit ID to verify the record.</p>
                    </div>
                )}
            </div>
        </div>
    )

    return (
        <div className="container py-4 mt-2">
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
                                <div className="d-flex gap-2 p-1 rounded-3" style={{ background: 'rgba(99,102,241,0.08)', border: '1.5px solid rgba(99,102,241,0.18)' }}>
                                    <button
                                        onClick={() => setActiveAdminTab('console')}
                                        className="btn border-0 px-4 py-2 rounded-2 small fw-extrabold transition-all d-flex align-items-center gap-2"
                                        style={{
                                            background: activeAdminTab === 'console' ? '#6366f1' : 'transparent',
                                            color: activeAdminTab === 'console' ? '#ffffff' : '#64748b'
                                        }}
                                    >
                                        <LayoutDashboard size={16} /> Console
                                    </button>
                                    <button
                                        onClick={() => { setActiveAdminTab('verify'); setSearchResult(null); setSearchError(''); }}
                                        className="btn border-0 px-4 py-2 rounded-2 small fw-extrabold transition-all d-flex align-items-center gap-2"
                                        style={{
                                            background: activeAdminTab === 'verify' ? '#6366f1' : 'transparent',
                                            color: activeAdminTab === 'verify' ? '#ffffff' : '#64748b'
                                        }}
                                    >
                                        <ShieldCheck size={16} /> Verify
                                    </button>
                                </div>
                            </div>

                            {/* ── Console Tab ── */}
                            {activeAdminTab === 'console' && (
                            <>
                            {orgDataList.length > 0 ? orgDataList.map((org, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="glass-card p-4 border border-secondary border-opacity-10 mb-4 shadow-sm position-relative overflow-hidden"
                                >
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h4 className="fw-extrabold text-main mb-0 d-flex align-items-center gap-2">
                                            <Flag className="text-accent-1" size={22} />
                                            {org.orgName}
                                        </h4>
                                    </div>
                                    
                                    <div className="row g-2 mb-3">
                                        {org.festivals.map(fest => (
                                            <div key={fest._id} className="col-12">
                                                <div 
                                                    className="py-2 px-3 dashboard-item-card border-start border-primary border-3 rounded-3 cursor-pointer d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 bg-white shadow-sm transition-all hover-glow"
                                                    onClick={() => setSelectedItem({ ...fest, type: 'festival' })}
                                                    role="button"
                                                >
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="badge bg-primary text-white px-2 py-1 tiny fw-bold shadow-sm" style={{ width: '75px', textAlign: 'center', fontSize: '0.65rem' }}>FESTIVAL</div>
                                                        <h6 className="fw-extrabold mb-0 text-main fs-6">{fest.title}</h6>
                                                    </div>
                                                    
                                                    <div className="d-flex align-items-center gap-2">
                                                        {(() => {
                                                            const base = getBaseName(fest.title)
                                                            const history = attendeeAttendance[base]
                                                            if (history) {
                                                                return (
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <span className="text-primary tiny fw-bold d-none d-md-block"><Users size={12} className="me-1"/>History:</span>
                                                                        <div className="d-flex flex-wrap gap-1">
                                                                            {Object.entries(history).sort(([a], [b]) => b - a).map(([yr, count]) => (
                                                                                <div key={yr} className="bg-primary bg-opacity-10 text-primary px-2 py-0 rounded-2 tiny font-monospace fw-bold" style={{ fontSize: '0.65rem' }}>
                                                                                    {yr}: <span className="text-dark">{count}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            }
                                                            return null
                                                        })()}
                                                        <div className="btn btn-sm btn-light rounded-circle p-1 ms-1 shadow-sm d-none d-md-flex">
                                                            <Info size={14} className="text-primary" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {org.events.map(ev => (
                                            <div key={ev._id} className="col-12">
                                                <div 
                                                    className="py-2 px-3 dashboard-item-card border-start border-warning border-3 rounded-3 cursor-pointer d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 bg-white shadow-sm transition-all hover-glow"
                                                    onClick={() => setSelectedItem({ ...ev, type: 'event' })}
                                                    role="button"
                                                >
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="badge bg-warning text-dark px-2 py-1 tiny fw-bold shadow-sm" style={{ width: '75px', textAlign: 'center', fontSize: '0.65rem' }}>EVENT</div>
                                                        <h6 className="fw-extrabold mb-0 text-main fs-6">{ev.title}</h6>
                                                    </div>
                                                    
                                                    <div className="d-flex align-items-center gap-2">
                                                        {(() => {
                                                            const base = getBaseName(ev.title)
                                                            const history = attendeeAttendance[base]
                                                            if (history) {
                                                                return (
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <span className="text-warning tiny fw-bold d-none d-md-block"><Users size={12} className="me-1"/>History:</span>
                                                                        <div className="d-flex flex-wrap gap-1">
                                                                            {Object.entries(history).sort(([a], [b]) => b - a).map(([yr, count]) => (
                                                                                <div key={yr} className="bg-warning bg-opacity-10 text-dark px-2 py-0 rounded-2 tiny font-monospace fw-bold" style={{ fontSize: '0.65rem' }}>
                                                                                    {yr}: <span className="text-dark">{count}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            }
                                                            return null
                                                        })()}
                                                        <div className="btn btn-sm btn-light rounded-circle p-1 ms-1 shadow-sm d-none d-md-flex">
                                                            <Info size={14} className="text-warning" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Financial Summary Cards - PREMIUM GRADIENTS FOR MAX VISIBILITY */}
                                    <div className="row g-3 border-top border-secondary border-opacity-10 pt-4">
                                        <div className="col-md-4">
                                            <div className="p-3 bg-gradient-success rounded-3 d-flex flex-column justify-content-center shadow-lg border-0">
                                                <h6 className="text-white text-opacity-80 tiny text-uppercase mb-1 fw-bold">Total Collection</h6>
                                                <h3 className="fw-extrabold text-white mb-0 fs-3">₹{org.collection.toLocaleString()}</h3>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="p-3 bg-gradient-danger rounded-3 d-flex flex-column justify-content-center shadow-lg border-0">
                                                <h6 className="text-white text-opacity-80 tiny text-uppercase mb-1 fw-bold">Total Expenses</h6>
                                                <h3 className="fw-extrabold text-white mb-0 fs-3">₹{org.expenses.toLocaleString()}</h3>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="p-3 bg-gradient-primary rounded-3 d-flex flex-column justify-content-center shadow-lg border-0">
                                                <h6 className="text-white text-opacity-80 tiny text-uppercase mb-1 fw-bold">Total Savings</h6>
                                                <h3 className="fw-extrabold text-white mb-0 fs-3">₹{org.savings.toLocaleString()}</h3>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="text-center py-5 glass-card">
                                    <p className="text-muted mb-0">No entity data found.</p>
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
                <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="modal-container glass-card p-0 overflow-hidden" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                        <div className="p-4 border-bottom border-white border-opacity-10 d-flex justify-content-between align-items-center bg-dark text-white shadow-2xl">
                            <div>
                                <div className="badge bg-primary text-white px-2 py-1 tiny fw-bold mb-2 uppercase">MISSION: {selectedItem.type.toUpperCase()}</div>
                                <h4 className="fw-extrabold mb-0">{selectedItem.title}</h4>
                                <p className="text-white text-opacity-50 tiny mb-0 d-flex align-items-center gap-2 mt-1">
                                    <MapPin size={12} className="text-primary" /> {selectedItem.location || 'Location Not Set'}
                                </p>
                            </div>
                            <button className="btn btn-close btn-close-white" onClick={() => setSelectedItem(null)}></button>
                        </div>

                        <div className="p-4 bg-light bg-opacity-5">
                            <div className="mb-4">
                                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2 text-main">
                                    <TrendingUp size={18} className="text-primary" /> Yearly Performance Summary
                                </h6>
                                <div className="row g-3">
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
                                    ).sort(([a], [b]) => b - a).map(([year, data]) => (
                                        <div key={year} className="col-md-6 col-lg-4">
                                            <div className="p-3 dashboard-item-card rounded-3">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <span className="fw-bold fs-5 text-primary">{year}</span>
                                                    <span className={`badge ${data.collection - data.expenses >= 0 ? 'bg-success' : 'bg-danger'} bg-opacity-20 ${data.collection - data.expenses >= 0 ? 'text-success' : 'text-danger'} fw-bold`}>
                                                        {data.collection - data.expenses >= 0 ? '+' : '-'}₹{Math.abs(data.collection - data.expenses).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="d-flex justify-content-between tiny mb-1 text-muted">
                                                    <span>Collection:</span>
                                                    <span className="fw-bold text-dark">₹{data.collection.toLocaleString()}</span>
                                                </div>
                                                <div className="d-flex justify-content-between tiny text-muted">
                                                    <span>Expenses:</span>
                                                    <span className="fw-bold text-dark">₹{data.expenses.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white p-3 rounded-4 shadow-inner">
                                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2 text-dark">
                                    <History size={18} className="text-primary" /> Transaction Database
                                </h6>
                                <div className="table-responsive rounded-3 border border-secondary border-opacity-10">
                                    <table className="table table-hover mb-0 tiny">
                                        <thead className="bg-secondary bg-opacity-5">
                                            <tr>
                                                <th className="py-3 px-3">Date</th>
                                                <th className="py-3">Particular/Payer</th>
                                                <th className="py-3">Type</th>
                                                <th className="py-3">Payment</th>
                                                <th className="py-3 text-end px-3">Amount</th>
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
                                                            <td className="py-3 px-3 text-muted">{new Date(item.date).toLocaleDateString()}</td>
                                                            <td className="py-3 fw-bold text-dark">{item.particular || item.name}</td>
                                                            <td className="py-3">
                                                                <span className={`badge ${isSub ? 'bg-success' : 'bg-danger'} bg-opacity-10 ${isSub ? 'text-success' : 'text-danger'}`}>
                                                                    {isSub ? 'Subscription' : 'Expense'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3">
                                                                 <span className={`badge ${item.paymentType === 'Online' ? 'bg-info bg-opacity-10 text-info' : item.paymentType === 'Due' ? 'bg-danger bg-opacity-10 text-danger' : 'bg-success bg-opacity-10 text-success'}`}>
                                                                     {item.paymentType === 'Online' && item.onlineParticulars ? `Online (${item.onlineParticulars})` : (item.paymentType || '—')}
                                                                 </span>
                                                             </td>
                                                             <td className={`py-3 text-end px-3 fw-bold ${isSub ? 'text-success' : 'text-danger'}`}>
                                                                {isSub ? '+' : '-'}₹{(Number(String(item.amount || 0).replace(/[^0-9.]/g, '')) || 0).toLocaleString()}
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
