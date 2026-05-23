import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Download, User, Users, Hash, Building2, CheckCircle, AlertCircle, Loader2, CreditCard, Calendar, MapPin, Phone, Tag, ArrowLeft, FileDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import VIPCard from '../components/VIPCard'

// Import card backgrounds
import adminBg from '../images/admin.jpg'
import primeBg from '../images/primemember.jpg'
import regularBg from '../images/regular.jpg'
import vipBg from '../images/vip elite.jpg'

const AttendeePortal = () => {
    const [entities, setEntities] = useState([])
    const [selectedEntity, setSelectedEntity] = useState('')
    const [passId, setPassId] = useState('')
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [entitySearch, setEntitySearch] = useState('')
    const [showEntityDropdown, setShowEntityDropdown] = useState(false)
    const [pdfLoading, setPdfLoading] = useState(false)
    const [receiptLoading, setReceiptLoading] = useState(false)
    const dropdownRef = useRef(null)

    useEffect(() => {
        fetchEntities()
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowEntityDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const fetchEntities = async () => {
        try {
            const res = await axios.get('/api/entity/all')
            setEntities(res.data || [])
        } catch {
            setEntities([])
        }
    }

    const filteredEntities = entities.filter(e =>
        e.name?.toLowerCase().includes(entitySearch.toLowerCase())
    )

    const handleLookup = async (e) => {
        e.preventDefault()
        if (!selectedEntity || !passId.trim()) {
            setError('Please select an entity and enter your Pass ID.')
            return
        }
        setLoading(true)
        setError('')
        setResult(null)
        try {
            const res = await axios.get(`/api/subscriptions/lookup/${encodeURIComponent(selectedEntity)}/${encodeURIComponent(passId.trim())}`)
            setResult(res.data)
        } catch (err) {
            const msg = err.response?.data?.message || 'No record found. Please verify your Pass ID and Entity.';
            setError(msg)
            setResult(null)
        } finally {
            setLoading(false)
        }
    }

    const handleReset = () => {
        setResult(null)
        setError('')
        setPassId('')
        setSelectedEntity('')
        setEntitySearch('')
    }

    const downloadCard = async () => {
        if (!result) return
        setPdfLoading(true)
        try {
            const jspdfModule = await import('jspdf')
            const jsPDF = jspdfModule.default || jspdfModule.jsPDF || jspdfModule

            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [110, 75] })
            const cardW = 110, cardH = 75

            let imgSrc = regularBg
            const tier = (result.membershipType || '').toLowerCase()
            if (tier.includes('admin')) imgSrc = adminBg
            else if (tier.includes('prime')) imgSrc = primeBg
            else if (tier.includes('vip')) imgSrc = vipBg

            const imgElement = await new Promise((resolve, reject) => {
                const img = new Image()
                img.src = imgSrc
                img.onload = () => resolve(img)
                img.onerror = () => reject(new Error('Image load failed'))
            })

            doc.addImage(imgElement, 'JPEG', 0, 0, cardW, cardH)

            // Pass ID
            doc.setFontSize(7); doc.setTextColor(220, 220, 220); doc.text('PASS ID', 12, 14)
            doc.setFontSize(12); doc.setTextColor(255, 255, 255); doc.setFont('courier', 'bold')
            const formatted = String(result.subId || '').match(/.{1,4}/g)?.join(' ') || result.subId
            doc.text(formatted, 12, 21)

            // Name
            doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(220, 220, 220)
            doc.text('FULL NAME', 12, 33)
            doc.setFontSize(13); doc.setTextColor(255, 255, 255)
            doc.text(String(result.name || '').toUpperCase(), 12, 40)

            // Event
            doc.setFontSize(7); doc.setTextColor(220, 220, 220); doc.text('FESTIVAL / EVENT', 12, 52)
            doc.setFontSize(10); doc.setTextColor(255, 255, 255)
            doc.text(String(result.festOrEventName || '—').toUpperCase(), 12, 58)

            // Entity & Address
            doc.setFontSize(6); doc.setTextColor(200, 200, 200)
            let detailY = 64;
            if (result.entityName) {
                doc.text(String(result.entityName || '').toUpperCase(), 12, detailY)
                detailY += 3.5;
            }
            if (result.address) {
                const addr = doc.splitTextToSize(String(result.address).toUpperCase(), 60);
                doc.text(addr, 12, detailY);
            }

            // Right side items
            // Validity
            doc.setFontSize(7); doc.setTextColor(220, 220, 220); doc.text('VALIDITY', 98, 14, { align: 'right' })
            doc.setFontSize(9); doc.setTextColor(255, 255, 255)
            doc.text('FULL EVENT', 98, 21, { align: 'right' })

            // Pass Status & Group Size
            doc.setFontSize(7); doc.setTextColor(220, 220, 220); doc.text('PASS STATUS', 98, 33, { align: 'right' })
            doc.setFontSize(11); doc.setTextColor(255, 255, 255)
            doc.text(String(result.membershipType || 'General').toUpperCase(), 98, 40, { align: 'right' })

            doc.setFontSize(7); doc.setTextColor(220, 220, 220); doc.text('GROUP SIZE', 98, 52, { align: 'right' })
            doc.setFontSize(11); doc.setTextColor(255, 255, 255)
            doc.text(String(result.familyMembers || 0), 98, 58, { align: 'right' })

            doc.save(`AttendeePass_${result.subId}.pdf`)
        } catch (err) {
            console.error('PDF error:', err)
            alert('Could not generate card PDF.')
        } finally {
            setPdfLoading(false)
        }
    }

    const downloadReceipt = async () => {
        if (!result) return
        setReceiptLoading(true)
        try {
            const jspdfModule = await import('jspdf')
            const jsPDF = jspdfModule.default || jspdfModule.jsPDF || jspdfModule
            const doc = new jsPDF()

            // Header Banner
            doc.setFillColor(30, 41, 59); doc.rect(0, 0, 210, 40, 'F')
            doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont('helvetica', 'bold')
            doc.text(String(result.entityName || 'Unified Sports Hub').toUpperCase(), 20, 20)
            doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150)
            doc.text('OFFICIAL REGISTRATION RECEIPT', 20, 28)

            // Details Box
            doc.setTextColor(30, 41, 59); doc.setFontSize(16); doc.text('Subscription Profile', 20, 60)
            doc.setDrawColor(200, 200, 200); doc.line(20, 65, 190, 65)

            const details = [
                ['Full Name', result.name],
                ['Pass ID', result.subId],
                ['Tier', result.membershipType],
                ['Event', result.festOrEventName],
                ['Payment Status', result.paymentType],
                ['Amount Paid', `${result.currency || '₹'}${result.amount}`],
                ['Contact', result.contact],
                ['Registration Date', new Date(result.date).toLocaleDateString()],
            ]

            let y = 80
            details.forEach(([label, value]) => {
                doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.text(label.toUpperCase(), 20, y)
                doc.setFontSize(12); doc.setTextColor(30, 41, 59); doc.setFont('helvetica', 'bold'); doc.text(String(value || '—'), 70, y)
                y += 12
            })

            // QR Placeholder or Footer
            doc.setFontSize(8); doc.setTextColor(150, 150, 150)
            doc.text('This is a computer generated document. No signature required.', 20, 280)
            
            doc.save(`Receipt_${result.subId}.pdf`)
        } catch (err) {
            console.error('Receipt error:', err)
            alert('Could not generate receipt.')
        } finally {
            setReceiptLoading(false)
        }
    }

    return (
        <div className="min-vh-100 py-5" style={{ backgroundColor: 'var(--primary-bg)' }}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-5">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center mb-4"
                        >
                            <div className="d-inline-flex align-items-center justify-content-center p-3 rounded-4 bg-primary bg-opacity-10 text-primary mb-3">
                                <CreditCard size={32} />
                            </div>
                            <h2 className="fw-extrabold text-main mb-1">Attendee Portal</h2>
                            <p className="text-muted small">Verify your membership status and download your pass</p>
                        </motion.div>

                        <AnimatePresence mode="wait">
                            {!result ? (
                                <motion.div
                                    key="lookup"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="card border-0 shadow-sm p-4 rounded-4"
                                    style={{ backgroundColor: 'var(--secondary-bg)', border: '1px solid var(--glass-border)' }}
                                >
                                    <form onSubmit={handleLookup}>
                                        <div className="mb-3 position-relative" ref={dropdownRef}>
                                            <label className="tiny fw-bold text-main uppercase ls-1 mb-2 d-block">Select Entity</label>
                                            <div
                                                className="form-control py-2 d-flex justify-content-between align-items-center cursor-pointer bg-secondary bg-opacity-10 border border-secondary border-opacity-10 text-main rounded-3 px-3"
                                                onClick={() => setShowEntityDropdown(!showEntityDropdown)}
                                            >
                                                <span className={selectedEntity ? 'text-main fw-bold' : 'text-muted'}>
                                                    {selectedEntity || 'Select...'}
                                                </span>
                                                <Building2 size={16} className="text-primary" />
                                            </div>

                                            {showEntityDropdown && (
                                                <div className="position-absolute top-100 left-0 right-0 w-100 mt-2 bg-secondary border-secondary shadow-lg border rounded-3 z-3 overflow-hidden" style={{ background: 'var(--secondary-bg)', borderColor: 'var(--glass-border)' }}>
                                                    <div className="p-2 border-bottom" style={{ borderColor: 'var(--glass-border)' }}>
                                                        <input
                                                            autoFocus
                                                            className="form-control form-control-sm border-0 bg-secondary bg-opacity-10 text-main"
                                                            placeholder="Type to search..."
                                                            value={entitySearch}
                                                            onChange={e => setEntitySearch(e.target.value)}
                                                            onClick={e => e.stopPropagation()}
                                                        />
                                                    </div>
                                                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                        {filteredEntities.map(e => (
                                                            <div
                                                                key={e._id}
                                                                className="px-3 py-2 cursor-pointer hover-bg-light text-main tiny fw-bold border-bottom"
                                                                style={{ borderColor: 'var(--glass-border)' }}
                                                                onClick={() => { setSelectedEntity(e.name); setShowEntityDropdown(false); setEntitySearch('') }}
                                                            >
                                                                {e.name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-4">
                                            <label className="tiny fw-bold text-main uppercase ls-1 mb-2 d-block">Pass ID</label>
                                            <div className="input-group rounded-3 overflow-hidden border" style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)' }}>
                                                <input
                                                    className="form-control border-0 bg-transparent py-2 fw-bold font-monospace text-main"
                                                    style={{ letterSpacing: '2px' }}
                                                    placeholder="Enter Pass ID"
                                                    value={passId}
                                                    onChange={e => setPassId(e.target.value.toUpperCase())}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="alert alert-danger border-0 tiny fw-bold text-center py-2 mb-3">
                                                {error}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={loading || !selectedEntity}
                                            className="btn btn-primary w-100 py-3 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
                                        >
                                            {loading ? <Loader2 size={18} className="spinner-border-sm" /> : <Search size={18} />}
                                            {loading ? 'Searching...' : 'FIND MY RECORD'}
                                        </button>
                                    </form>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-center"
                                >
                                    <div className="mb-4">
                                        {result.isGenerated ? (
                                            <VIPCard subscription={result} />
                                        ) : (
                                            <div className="p-4 rounded-4 border border-dashed text-center" style={{ background: 'var(--secondary-bg)', borderColor: 'var(--glass-border)' }}>
                                                <div className="p-3 d-inline-block rounded-circle shadow-sm mb-3" style={{ background: 'var(--primary-bg)' }}>
                                                    <Loader2 className="text-primary animate-spin" size={24} />
                                                </div>
                                                <h6 className="fw-black text-main mb-1">Digital Pass Pending</h6>
                                                <p className="tiny text-muted px-4 mb-0">Your official pass layout is being finalized by administrators. You can still download your receipt below.</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="card shadow-premium border-0 p-4 rounded-4 mb-4 text-start" style={{ background: 'var(--secondary-bg)', border: '1px solid var(--glass-border)' }}>
                                        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3" style={{ borderColor: 'var(--glass-border)' }}>
                                            <div>
                                                <h5 className="mb-1 fw-black text-main">Subscription Profile</h5>
                                                <p className="tiny text-muted uppercase fw-bold ls-1 mb-0">Record Details & Status</p>
                                            </div>
                                            <div className="text-end">
                                                <span className="badge p-3 rounded-3 uppercase tiny fw-black d-block mb-1" style={{ background: '#6366f1', color: 'white' }}>
                                                    {result.membershipType} TIER
                                                </span>
                                                <span className={`tiny fw-bold uppercase ${result.paymentType === 'Cash & Paid' ? 'text-success' : 'text-danger'}`}>
                                                    {result.paymentType}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="row g-4">
                                            {[
                                                { label: 'Name', value: result.name, icon: <User size={14} className="text-primary" /> },
                                                { label: 'Pass ID', value: result.subId, icon: <Tag size={14} className="text-primary" /> },
                                                { label: 'Organization', value: result.entityName, icon: <Building2 size={14} className="text-primary" /> },
                                                { label: 'Festival/Event', value: result.festOrEventName, icon: <Calendar size={14} className="text-primary" /> },
                                                { label: 'Group Size', value: `${result.familyMembers || 0} Member(s)`, icon: <Users size={14} className="text-primary" /> },
                                                { label: 'Payment', value: `${result.currency || '₹'}${result.amount}`, icon: <CreditCard size={14} className="text-primary" /> },
                                                { label: 'Contact', value: `${result.countryCode || '+91'} ${result.contact}`, icon: <Phone size={14} className="text-primary" /> },
                                                { label: 'Issued On', value: new Date(result.date).toLocaleDateString(), icon: <Calendar size={14} className="text-primary" /> },
                                                { label: 'AuthorizedBy', value: result.referenceName || 'Digital System', icon: <CheckCircle size={14} className="text-primary" /> },
                                            ].map(i => (
                                                <div key={i.label} className="col-6">
                                                    <div className="tiny uppercase text-muted fw-bold ls-1 mb-2 d-flex align-items-center gap-1">
                                                        {i.icon} {i.label}
                                                    </div>
                                                    <div className="small fw-black text-main">{i.value || '—'}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="d-flex flex-column gap-2 mt-4">
                                        <div className="d-flex gap-2">
                                            <button
                                                onClick={downloadCard}
                                                disabled={pdfLoading || !result.isGenerated}
                                                className={`btn flex-grow-1 py-3 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2 ${result.isGenerated ? 'btn-primary' : 'btn-secondary opacity-50'}`}
                                            >
                                                {pdfLoading ? <Loader2 size={18} /> : <Download size={18} />}
                                                {pdfLoading ? 'Preparing...' : 'Download Digital Pass'}
                                            </button>
                                            <button
                                                onClick={downloadReceipt}
                                                disabled={receiptLoading}
                                                className="btn btn-outline-primary flex-grow-1 py-3 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-2"
                                            >
                                                {receiptLoading ? <Loader2 size={18} /> : <FileDown size={18} />}
                                                {receiptLoading ? 'Working...' : 'Download Receipt'}
                                            </button>
                                        </div>
                                        <button onClick={handleReset} className="btn w-100 py-2 fw-bold rounded-3 border tiny text-muted" style={{ background: 'var(--secondary-bg)', borderColor: 'var(--glass-border)' }}>
                                            <ArrowLeft size={14} className="me-2" /> Back to Search
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <style>{`
                .hover-bg-light:hover { background-color: #f8fafc; }
                .cursor-pointer { cursor: pointer; }
            `}</style>
        </div>
    )
}

export default AttendeePortal
