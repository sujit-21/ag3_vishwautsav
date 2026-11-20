import React, { useState, useMemo, Fragment, useDeferredValue } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus, Search, FileDown, Edit3, Trash2, Calendar, Hash, FileText,
    User, Phone, Layers, Banknote, Clock, CreditCard, Smartphone,
    QrCode, Save, X, ArrowUpDown, Filter, Download, ChevronDown,
    Info, Tag, Receipt
} from 'lucide-react'
import axios from 'axios'
import { exportSingleExpenseVoucherPDF, exportExpenseLedgerPDF } from '../utils/pdfGenerator'
import { CardSkeleton, TableSkeleton, staggerContainer, staggerItem } from './SkeletonLoader'

const DEFAULT_EXPENSE_TYPES = [
    'Decoration',
    'Electricity & Sound',
    'Prasad & Bhog',
    'Tent & Stage',
    'Artist & Cultural',
    'Security & Police',
    'Publicity & Banners',
    'Cleaning & Sanitation',
    'Transportation',
    'Miscellaneous'
]

const DEFAULT_CURRENCIES = [
    { code: 'INR', symbol: '₹' },
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
    { code: 'AED', symbol: 'AED' }
]

const generateExpenseID = () => Math.random().toString(36).substring(2, 12).toUpperCase()

const ExpensesSection = ({
    type = 'festival', // 'festival' | 'event'
    activeItem = {},
    activeEntity = '',
    festOrEventName = '',
    expenseTypes = DEFAULT_EXPENSE_TYPES,
    currencies = DEFAULT_CURRENCIES,
    expensesList = [],
    setExpensesList,
    fetchExpenses,
    downloadAllExpensesPDF,
    onOpenDataReports
}) => {
    // Toolbar, Search, Filter & Sort States
    const [expSearch, setExpSearch] = useState('')
    const deferredExpSearch = useDeferredValue(expSearch)
    const [expSort, setExpSort] = useState('newest')
    const [expTypeFilter, setExpTypeFilter] = useState('all')
    const [expPaymentFilter, setExpPaymentFilter] = useState('all')

    // Add / Edit Form States
    const [isExpAdding, setIsExpAdding] = useState(false)
    const [editingExpId, setEditingExpId] = useState(null)
    const [expenseFormData, setExpenseFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        expenseId: generateExpenseID(),
        particular: '',
        paidTo: '',
        contact: '',
        expenseType: 'Decoration',
        amount: '',
        currency: '₹',
        paymentType: 'Cash & Paid',
        onlineParticulars: '',
        onlineReference: ''
    })

    // Action Dropdown & Details Drawer States
    const [openActionExpId, setOpenActionExpId] = useState(null)
    const [openExpInfoIds, setOpenExpInfoIds] = useState({})

    // Filtered and Sorted Expenses
    const filteredExpenses = useMemo(() => {
        let list = [...(expensesList || [])]

        if (expSearch.trim()) {
            const q = deferredExpSearch.toLowerCase()
            list = list.filter(e =>
                (e.particular && e.particular.toLowerCase().includes(q)) ||
                (e.paidTo && e.paidTo.toLowerCase().includes(q)) ||
                (e.expenseId && e.expenseId.toLowerCase().includes(q)) ||
                (e.onlineReference && e.onlineReference.toLowerCase().includes(q)) ||
                (e.contact && e.contact.toLowerCase().includes(q))
            )
        }

        if (expTypeFilter !== 'all') {
            list = list.filter(e => (e.expenseType || '').toLowerCase() === expTypeFilter.toLowerCase())
        }

        if (expPaymentFilter !== 'all') {
            list = list.filter(e => {
                const mode = (e.paymentType || '').toLowerCase()
                if (expPaymentFilter === 'Cash') return mode.includes('cash')
                if (expPaymentFilter === 'Online') return mode.includes('online') || mode.includes('upi')
                if (expPaymentFilter === 'Due') return mode.includes('due')
                return mode.includes(expPaymentFilter.toLowerCase())
            })
        }

        if (expSort === 'newest') {
            list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        } else if (expSort === 'oldest') {
            list.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
        } else if (expSort === 'amount-high') {
            list.sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
        } else if (expSort === 'amount-low') {
            list.sort((a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0))
        } else if (expSort === 'name-asc') {
            list.sort((a, b) => (a.particular || '').localeCompare(b.particular || ''))
        }

        return list
    }, [expensesList, expSearch, expTypeFilter, expPaymentFilter, expSort])

    // Total Disbursed calculation
    const totalDisbursed = useMemo(() => {
        return filteredExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
    }, [filteredExpenses])

    // Download Single Voucher PDF
    const handleDownloadSinglePDF = async (exp) => {
        try {
            await exportSingleExpenseVoucherPDF({
                exp,
                festOrEvent: activeItem,
                entityName: activeEntity || activeItem?.entityName
            })
        } catch (err) {
            console.error('PDF Error:', err)
            alert('Could not generate Expense PDF')
        }
    }

    // Download All Expenses PDF (falls back to direct call if prop not passed)
    const handleDownloadAllPDF = async () => {
        if (typeof downloadAllExpensesPDF === 'function') {
            return downloadAllExpensesPDF()
        }
        try {
            exportExpenseLedgerPDF({
                expensesList,
                activeTitle: festOrEventName || activeItem?.title,
                entityName: activeEntity || activeItem?.entityName,
                expenseTypes
            })
        } catch (err) {
            console.error('PDF Error:', err)
            alert('PDF Generation Failed')
        }
    }

    // Form Submit (Create or Update)
    const handleFormSubmit = async (e) => {
        e.preventDefault()
        try {
            const categoryType = type === 'event' ? 'event' : 'festival'
            const targetName = festOrEventName || activeItem?.title || ''

            if (editingExpId) {
                await axios.put(`/api/expenses/${editingExpId}`, {
                    ...expenseFormData,
                    category: categoryType,
                    festOrEventName: targetName
                })
            } else {
                const { _id, __v, createdAt, ...postData } = expenseFormData
                await axios.post('/api/expenses', {
                    ...postData,
                    category: categoryType,
                    festOrEventName: targetName
                })
            }

            setIsExpAdding(false)
            setEditingExpId(null)
            if (typeof fetchExpenses === 'function') fetchExpenses()

            setExpenseFormData({
                date: new Date().toISOString().split('T')[0],
                expenseId: generateExpenseID(),
                particular: '',
                paidTo: '',
                contact: '',
                expenseType: expenseTypes[0] || 'Decoration',
                amount: '',
                currency: '₹',
                paymentType: 'Cash & Paid',
                onlineParticulars: '',
                onlineReference: ''
            })
        } catch (err) {
            console.error('Error saving expense:', err)
            alert('Error saving expense')
        }
    }

    // Delete Expense
    const handleDeleteExpense = async (expenseId) => {
        setOpenActionExpId(null)
        if (window.confirm('Delete this expense?')) {
            if (typeof setExpensesList === 'function') {
                setExpensesList(prev => prev.filter(e => e.expenseId !== expenseId))
            }
            try {
                await axios.delete(`/api/expenses/${expenseId}`)
                if (typeof fetchExpenses === 'function') fetchExpenses()
            } catch (err) {
                console.error('Error deleting expense:', err)
                alert('Could not delete expense')
                if (typeof fetchExpenses === 'function') fetchExpenses()
            }
        }
    }

    return (
        <div className="figma-expense-section py-3 px-3 px-sm-4 shadow-sm mx-auto w-100 mb-4">
            {/* Header */}
            <div className="figma-expense-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                <div className="figma-expense-title-group">
                    <div className="figma-expense-icon-badge shadow-sm">
                        <span className="figma-expense-emoji" role="img" aria-label="Receipt">🧾</span>
                    </div>
                    <div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <h4 className="mb-0 fw-bold text-main" style={{ fontSize: '1.2rem', letterSpacing: '-0.3px' }}>
                                {festOrEventName ? `${festOrEventName} — ` : ''}Expenses
                            </h4>
                            <span className="badge rounded-pill px-2.5 py-0.5 extra-tiny fw-bold" style={{ background: 'rgba(234, 88, 12, 0.12)', color: '#ea580c', border: '1px solid rgba(234, 88, 12, 0.25)' }}>
                                {filteredExpenses.length} Records
                            </span>
                        </div>
                        <p className="text-muted tiny mb-0 mt-0.5">Track and manage financial disbursements, invoices and audit trails.</p>
                    </div>
                </div>

                {/* Total Disbursed KPI Chip */}
                <div className="d-flex align-items-center gap-2">
                    <div className="figma-expense-kpi-chip">
                        <span className="kpi-label">TOTAL DISBURSED</span>
                        <span className="kpi-value text-danger">
                            -₹{totalDisbursed.toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Responsive Toolbar */}
            <div className="d-flex flex-column gap-2.5 mb-3">
                {/* Row 1: New Expense, Search, Action Buttons */}
                <div className="figma-expense-toolbar-row1 d-flex align-items-center gap-2.5 flex-wrap">
                    {!isExpAdding && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingExpId(null)
                                setExpenseFormData({
                                    date: new Date().toISOString().split('T')[0],
                                    expenseId: generateExpenseID(),
                                    particular: '',
                                    paidTo: '',
                                    contact: '',
                                    expenseType: expenseTypes[0] || 'Decoration',
                                    amount: '',
                                    currency: '₹',
                                    paymentType: 'Cash & Paid',
                                    onlineParticulars: '',
                                    onlineReference: ''
                                })
                                setIsExpAdding(true)
                            }}
                            className="figma-btn-submit py-1.5 px-3.5 rounded-pill fw-bold text-nowrap transition-all shadow-sm d-inline-flex align-items-center gap-1.5"
                            style={{ height: '34px', fontSize: '0.74rem' }}
                        >
                            <Plus size={14} /> <span>New Expense</span>
                        </button>
                    )}

                    {/* Flexible Search Bar */}
                    <div className="figma-expense-search-bar px-3 flex-grow-1 shadow-xs">
                        <Search size={13} className="text-muted flex-shrink-0" />
                        <input
                            type="text"
                            className="form-control bg-transparent border-0 text-main shadow-none p-0 ps-2"
                            placeholder="Search expenses by particular, vendor, ref..."
                            value={expSearch}
                            onChange={(e) => setExpSearch(e.target.value)}
                            style={{ fontSize: '0.76rem' }}
                        />
                        {expSearch && (
                            <button type="button" onClick={() => setExpSearch('')} className="btn btn-sm btn-link text-muted p-0 pe-1">
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* Action Buttons Group */}
                    <div className="figma-expense-btn-group d-flex align-items-center gap-2">
                        <button
                            type="button"
                            onClick={handleDownloadAllPDF}
                            className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1.5 px-3 rounded-pill fw-bold text-nowrap transition-all hover-glow shadow-xs"
                            style={{ height: '34px', fontSize: '0.74rem' }}
                        >
                            <FileDown size={14} /> <span>All Expenses PDF</span>
                        </button>
                        {onOpenDataReports && (
                            <button
                                type="button"
                                onClick={onOpenDataReports}
                                className="btn btn-outline-warning btn-sm d-inline-flex align-items-center gap-1.5 px-3 rounded-pill fw-bold text-nowrap transition-all shadow-xs"
                                style={{ height: '34px', fontSize: '0.74rem' }}
                                title="Open DATA Reports Hub"
                            >
                                <Download size={14} /> <span>DATA Reports</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Row 2: Sort, Category Filter, Pay Filter */}
                <div className="figma-expense-toolbar-row2 d-flex align-items-center gap-2 flex-wrap">
                    {/* SORT */}
                    <div className="figma-expense-select-pill">
                        <ArrowUpDown size={12} className="text-primary flex-shrink-0 ms-2" />
                        <select
                            className="form-select border-0 bg-transparent text-main shadow-none fw-bold"
                            value={expSort}
                            onChange={(e) => setExpSort(e.target.value)}
                            title="Sort Expenses"
                        >
                            <option value="newest">SORT: Newest</option>
                            <option value="oldest">SORT: Oldest</option>
                            <option value="amount-high">SORT: Amount (High-Low)</option>
                            <option value="amount-low">SORT: Amount (Low-High)</option>
                            <option value="name-asc">SORT: Particular (A-Z)</option>
                        </select>
                    </div>

                    {/* CATEGORY FILTER */}
                    <div className="figma-expense-select-pill">
                        <Filter size={12} className={`flex-shrink-0 ms-2 ${expTypeFilter !== 'all' ? 'text-primary' : 'text-muted'}`} />
                        <select
                            className="form-select border-0 bg-transparent text-main shadow-none fw-bold"
                            value={expTypeFilter}
                            onChange={(e) => setExpTypeFilter(e.target.value)}
                            title="Filter Category"
                        >
                            <option value="all">Category: All</option>
                            {expenseTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    {/* PAYMENT MODE FILTER */}
                    <div className="figma-expense-select-pill">
                        <CreditCard size={12} className={`flex-shrink-0 ms-2 ${expPaymentFilter !== 'all' ? 'text-primary' : 'text-muted'}`} />
                        <select
                            className="form-select border-0 bg-transparent text-main shadow-none fw-bold"
                            value={expPaymentFilter}
                            onChange={(e) => setExpPaymentFilter(e.target.value)}
                            title="Filter Payment Mode"
                        >
                            <option value="all">Pay: All</option>
                            <option value="Cash">Cash</option>
                            <option value="Online">Online</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                            <option value="UPI / QR">UPI / QR</option>
                        </select>
                    </div>

                    {(expTypeFilter !== 'all' || expPaymentFilter !== 'all' || expSearch) && (
                        <button
                            type="button"
                            onClick={() => {
                                setExpTypeFilter('all')
                                setExpPaymentFilter('all')
                                setExpSearch('')
                            }}
                            className="btn btn-sm btn-link text-muted extra-tiny text-decoration-none d-inline-flex align-items-center gap-1 p-1 ms-auto"
                        >
                            <X size={12} /> Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Add / Edit Expense Drawer Form */}
            <AnimatePresence>
                {isExpAdding && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="figma-expense-form-card"
                    >
                        <div className="figma-expense-form-header">
                            <div className="d-flex align-items-center" style={{ gap: '12px' }}>
                                <div className="figma-expense-icon-badge" style={{ width: '34px', height: '34px', minWidth: '34px', borderRadius: '10px' }}>
                                    {editingExpId ? <Edit3 size={15} /> : <span style={{ fontSize: '1.15rem', lineHeight: 1, userSelect: 'none' }} role="img" aria-label="Receipt">🧾</span>}
                                </div>
                                <div>
                                    <h6 className="fw-bold mb-0 text-main" style={{ fontSize: '0.92rem' }}>
                                        {editingExpId ? 'Update Expense Detail' : 'Add Expense Detail'}
                                    </h6>
                                    <p className="extra-tiny text-muted mb-0">Log financial outgoings for audit and tracking.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setIsExpAdding(false); setEditingExpId(null); }}
                                className="figma-expense-close-btn"
                                title="Close"
                            >
                                <X size={15} />
                            </button>
                        </div>
                        <form onSubmit={handleFormSubmit} className="row g-2 g-md-3">
                            <div className="col-12 col-sm-6 col-lg-3">
                                <label className="figma-expense-label"><Calendar size={11} /> Date</label>
                                <div className="figma-input-wrapper">
                                    <input
                                        type="date"
                                        className="figma-input-field"
                                        value={expenseFormData.date}
                                        onChange={e => setExpenseFormData({ ...expenseFormData, date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="col-12 col-sm-6 col-lg-3">
                                <label className="figma-expense-label"><Hash size={11} /> Voucher Ref#</label>
                                <div className="figma-input-wrapper">
                                    <input type="text" className="figma-input-field font-monospace fw-bold" value={expenseFormData.expenseId} readOnly />
                                </div>
                            </div>
                            <div className="col-12 col-lg-6">
                                <label className="figma-expense-label"><FileText size={11} /> Particulars</label>
                                <div className="figma-input-wrapper">
                                    <input
                                        type="text"
                                        className="figma-input-field"
                                        placeholder="e.g. Stage Decoration"
                                        value={expenseFormData.particular}
                                        onChange={e => setExpenseFormData({ ...expenseFormData, particular: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="figma-expense-label"><User size={11} /> Paid To (Whom / Vendor Name)</label>
                                <div className="figma-input-wrapper">
                                    <input
                                        type="text"
                                        className="figma-input-field"
                                        placeholder="e.g. Ramesh Kumar / Stage Decorators"
                                        value={expenseFormData.paidTo || ''}
                                        onChange={e => setExpenseFormData({ ...expenseFormData, paidTo: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="figma-expense-label"><Phone size={11} /> Contact (Phone / Mobile)</label>
                                <div className="figma-input-wrapper">
                                    <input
                                        type="tel"
                                        className="figma-input-field"
                                        placeholder="e.g. +91 9876543210"
                                        value={expenseFormData.contact || ''}
                                        onChange={e => setExpenseFormData({ ...expenseFormData, contact: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="col-12 col-sm-6 col-lg-4">
                                <label className="figma-expense-label"><Layers size={11} /> Category Type</label>
                                <div className="figma-input-wrapper">
                                    <select
                                        className="figma-select-field"
                                        value={expenseFormData.expenseType}
                                        onChange={e => setExpenseFormData({ ...expenseFormData, expenseType: e.target.value })}
                                    >
                                        {expenseTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="col-12 col-sm-6 col-lg-4">
                                <label className="figma-expense-label">Amount</label>
                                <div className="figma-amount-group">
                                    <select
                                        className="figma-currency-prefix"
                                        value={expenseFormData.currency}
                                        onChange={e => setExpenseFormData({ ...expenseFormData, currency: e.target.value })}
                                    >
                                        {currencies.map(c => (
                                            <option key={c.code} value={c.symbol}>{c.symbol}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        step="any"
                                        className="figma-amount-input"
                                        placeholder="0.00"
                                        value={expenseFormData.amount}
                                        onChange={e => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="col-12 col-lg-4">
                                <label className="figma-expense-label">Payment Mode</label>
                                <div className="figma-segmented-mode">
                                    {['Cash & Paid', 'Due', 'Online'].map(mode => {
                                        const isSelected = expenseFormData.paymentType === mode
                                        const activeClass = mode === 'Cash & Paid' ? 'active-cash' : mode === 'Due' ? 'active-due' : 'active-online'
                                        return (
                                            <button
                                                key={mode}
                                                type="button"
                                                onClick={() => setExpenseFormData({ ...expenseFormData, paymentType: mode })}
                                                className={`figma-mode-btn ${isSelected ? activeClass : ''}`}
                                            >
                                                {mode === 'Cash & Paid' && <Banknote size={12} />}
                                                {mode === 'Due' && <Clock size={12} />}
                                                {mode === 'Online' && <CreditCard size={12} />}
                                                <span>{mode === 'Cash & Paid' ? 'Cash' : mode}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            {expenseFormData.paymentType === 'Online' && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="col-12 figma-online-drawer">
                                    <div className="row g-2">
                                        <div className="col-12 col-sm-6">
                                            <label className="figma-expense-label text-info"><Smartphone size={11} /> Bank / Platform</label>
                                            <div className="figma-input-wrapper">
                                                <input
                                                    type="text"
                                                    className="figma-input-field"
                                                    placeholder="e.g. GPay / HDFC / UPI"
                                                    value={expenseFormData.onlineParticulars || ''}
                                                    onChange={e => setExpenseFormData({ ...expenseFormData, onlineParticulars: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <label className="figma-expense-label text-info"><QrCode size={11} /> Transaction Ref ID</label>
                                            <div className="figma-input-wrapper">
                                                <input
                                                    type="text"
                                                    className="figma-input-field font-monospace"
                                                    placeholder="e.g. TXN123456 / UTR"
                                                    value={expenseFormData.onlineReference || ''}
                                                    onChange={e => setExpenseFormData({ ...expenseFormData, onlineReference: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div className="col-12 mt-2 d-flex flex-wrap align-items-center gap-2 figma-expense-actions-row">
                                <button type="submit" className="figma-btn-submit">
                                    <Save size={13} /> {editingExpId ? 'Update Expense' : 'Post Expense'}
                                </button>
                                <button onClick={() => { setIsExpAdding(false); setEditingExpId(null); }} type="button" className="figma-btn-cancel">
                                    <X size={13} /> Cancel
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop & Tablet Table View (Screens >= 768px) */}
            <div className="table-responsive rounded-3 border border-secondary border-opacity-10 shadow-xs d-none d-md-block" style={{ WebkitOverflowScrolling: 'touch' }}>
                <table className="table table-hover align-middle mb-0 w-100">
                    <thead>
                        <tr className="text-muted border-bottom border-secondary border-opacity-15" style={{ fontSize: '0.72rem', background: 'rgba(0, 0, 0, 0.02)' }}>
                            <th className="border-0 py-2.5 ps-3" style={{ width: '120px' }}>EXPENSE ID</th>
                            <th className="border-0 py-2.5 px-2 d-none d-md-table-cell" style={{ width: '120px' }}>DATE</th>
                            <th className="border-0 py-2.5 px-2">PARTICULAR &amp; BENEFICIARY</th>
                            <th className="border-0 py-2.5 px-2 d-none d-lg-table-cell" style={{ width: '150px' }}>CATEGORY</th>
                            <th className="border-0 py-2.5 px-2" style={{ width: '130px' }}>PAYMENT</th>
                            <th className="border-0 py-2.5 px-2 text-end" style={{ width: '120px' }}>AMOUNT</th>
                            <th className="border-0 py-2.5 pe-3 text-center" style={{ width: '100px' }}>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredExpenses.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center py-5 text-muted">
                                    <div className="figma-expense-icon-badge mx-auto mb-2" style={{ width: '40px', height: '40px' }}>
                                        <Receipt size={20} className="text-muted" />
                                    </div>
                                    <p className="fw-semibold mb-0 small">
                                        {expensesList.length === 0 ? "No expenses logged yet." : "No matching expenses found."}
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            filteredExpenses.map((exp, index) => {
                                const isExpInfoOpen = !!openExpInfoIds[exp.expenseId]
                                const isExpActionOpen = openActionExpId === exp.expenseId
                                const isEven = index % 2 === 0
                                const rowBg = isExpInfoOpen ? 'rgba(67,130,149,0.12)' : isEven ? 'rgba(67,130,149,0.04)' : 'transparent'
                                return (
                                    <Fragment key={exp.expenseId}>
                                        <tr className="align-middle transition-all" style={{ backgroundColor: rowBg }}>
                                            {/* EXPENSE ID */}
                                            <td className="border-0 py-2.5 ps-3 pe-2">
                                                <span className="badge bg-secondary bg-opacity-10 text-muted font-monospace" style={{ fontSize: '0.72rem' }}>
                                                    {exp.expenseId}
                                                </span>
                                            </td>

                                            {/* DATE */}
                                            <td className="border-0 py-2.5 px-2 d-none d-md-table-cell text-muted font-monospace" style={{ fontSize: '0.72rem' }}>
                                                <span className="d-inline-flex align-items-center gap-1.5">
                                                    <Calendar size={11} className="text-secondary opacity-75" />
                                                    {exp.date ? new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                </span>
                                            </td>

                                            {/* PARTICULAR & BENEFICIARY */}
                                            <td className="border-0 py-2.5 px-2">
                                                <div className="d-flex align-items-center justify-content-between gap-2 w-100">
                                                    <div>
                                                        <span className="fw-bold text-main" style={{ fontSize: '0.88rem', wordBreak: 'normal', overflowWrap: 'break-word', lineHeight: '1.3' }}>
                                                            {exp.particular}
                                                        </span>
                                                        {exp.paidTo && (
                                                            <div className="extra-tiny text-muted d-flex align-items-center gap-1 mt-0.5 flex-wrap">
                                                                <span className="opacity-75">Paid To:</span> 
                                                                <strong className="text-main">{exp.paidTo}</strong>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setOpenExpInfoIds(prev => ({ ...prev, [exp.expenseId]: !prev[exp.expenseId] }))
                                                        }}
                                                        className={`btn btn-sm p-0 rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0 transition-all ${
                                                            isExpInfoOpen
                                                                ? 'bg-primary text-white shadow-sm'
                                                                : 'bg-secondary bg-opacity-10 text-primary border-0 hover-bg-primary hover-text-white'
                                                        }`}
                                                        style={{ width: '22px', height: '22px', minWidth: '22px', cursor: 'pointer' }}
                                                        title={isExpInfoOpen ? 'Hide details' : 'Show details'}
                                                    >
                                                        <Info size={11} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            </td>

                                            {/* CATEGORY */}
                                            <td className="border-0 py-2.5 px-2 d-none d-lg-table-cell">
                                                <span className="badge rounded-pill px-2.5 py-1 extra-tiny fw-bold" style={{ background: 'rgba(67, 130, 149, 0.1)', color: 'var(--palette-slate-teal, #438295)', border: '1px solid rgba(67, 130, 149, 0.25)' }}>
                                                    <Tag size={10} className="me-1 inline" />
                                                    {exp.expenseType || 'General'}
                                                </span>
                                            </td>

                                            {/* PAYMENT MODE */}
                                            <td className="border-0 py-2.5 px-2">
                                                <span className={`figma-payment-badge ${
                                                    exp.paymentType === 'Online'
                                                        ? 'badge-online'
                                                        : exp.paymentType === 'Due'
                                                        ? 'badge-due'
                                                        : 'badge-cash'
                                                }`}>
                                                    <span>{exp.paymentType === 'Online' && exp.onlineParticulars ? `Online (${exp.onlineParticulars})` : (exp.paymentType === 'Cash & Paid' ? 'Cash' : exp.paymentType)}</span>
                                                </span>
                                            </td>

                                            {/* AMOUNT */}
                                            <td className="border-0 py-2.5 px-2 text-end fw-black text-danger text-nowrap" style={{ fontSize: '0.88rem' }}>
                                                -{exp.currency}{(Number(exp.amount) || 0).toLocaleString('en-IN')}
                                            </td>

                                            {/* ACTION PILL DROPDOWN */}
                                            <td className="border-0 py-2.5 pe-3 text-center position-relative">
                                                <div className="position-relative d-inline-block" style={{ zIndex: isExpActionOpen ? 1045 : 'auto' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpenActionExpId(isExpActionOpen ? null : exp.expenseId)}
                                                        className={`btn btn-sm d-flex align-items-center gap-1.5 px-2.5 rounded-pill fw-bold text-nowrap transition-all shadow-sm sub-action-btn ${
                                                            isExpActionOpen ? 'btn-primary text-white' : 'btn-outline-secondary'
                                                        }`}
                                                        style={{ height: '28px', fontSize: '0.73rem' }}
                                                    >
                                                        <span>Action</span>
                                                        <ChevronDown size={12} className={`transition-all ${isExpActionOpen ? 'rotate-180' : ''}`} style={{ transform: isExpActionOpen ? 'rotate(180deg)' : 'none' }} />
                                                    </button>

                                                    {isExpActionOpen && (
                                                        <>
                                                            <div
                                                                className="position-fixed top-0 start-0 w-100 h-100"
                                                                style={{ zIndex: 1040 }}
                                                                onClick={() => setOpenActionExpId(null)}
                                                            />
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.95 }}
                                                                transition={{ duration: 0.15 }}
                                                                className="sub-action-menu"
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setOpenActionExpId(null)
                                                                        handleDownloadSinglePDF(exp)
                                                                    }}
                                                                    className="sub-action-item"
                                                                >
                                                                    <FileDown size={14} className="text-info" />
                                                                    <span>Download PDF</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setOpenActionExpId(null)
                                                                        setExpenseFormData({
                                                                            ...exp,
                                                                            paidTo: exp.paidTo || '',
                                                                            contact: exp.contact || '',
                                                                            date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                                                                        })
                                                                        setEditingExpId(exp.expenseId)
                                                                        setIsExpAdding(true)
                                                                    }}
                                                                    className="sub-action-item"
                                                                >
                                                                    <Edit3 size={14} className="text-primary" />
                                                                    <span>Edit Expense</span>
                                                                </button>
                                                                <div className="sub-action-divider" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteExpense(exp.expenseId)}
                                                                    className="sub-action-item delete-item"
                                                                >
                                                                    <Trash2 size={14} className="text-danger" />
                                                                    <span>Delete</span>
                                                                </button>
                                                            </motion.div>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded Detail Row */}
                                        {isExpInfoOpen && (
                                            <tr style={{ backgroundColor: 'rgba(67,130,149,0.12)' }} className="border-top-0">
                                                <td colSpan="7" className="border-0 pt-0 pb-3 px-3">
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.18 }}
                                                        className="figma-exp-detail-card d-flex flex-wrap align-items-center gap-3 text-muted"
                                                        style={{ fontSize: '0.78rem' }}
                                                    >
                                                        <div className="d-flex align-items-center gap-1.5">
                                                            <Calendar size={13} className="text-warning opacity-75" />
                                                            <span><strong className="text-dark">Date:</strong> {exp.date ? new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                                                        </div>
                                                        <div className="d-flex align-items-center gap-1.5">
                                                            <Tag size={13} className="text-primary opacity-75" />
                                                            <span><strong className="text-dark">Type:</strong> {exp.expenseType || 'N/A'}</span>
                                                        </div>
                                                        {exp.paidTo && (
                                                            <div className="d-flex align-items-center gap-1.5">
                                                                <User size={13} className="text-success opacity-75" />
                                                                <span><strong className="text-dark">Paid To:</strong> {exp.paidTo}</span>
                                                            </div>
                                                        )}
                                                        {exp.contact && (
                                                            <div className="d-flex align-items-center gap-1.5">
                                                                <Phone size={13} className="text-info opacity-75" />
                                                                <span><strong className="text-dark">Contact:</strong> {exp.contact}</span>
                                                            </div>
                                                        )}
                                                        {exp.onlineReference && (
                                                            <div className="d-flex align-items-center gap-1.5">
                                                                <CreditCard size={13} className="text-info opacity-75" />
                                                                <span><strong className="text-dark">Ref:</strong> {exp.onlineReference}</span>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View (Screens < 768px) */}
            <div className="d-block d-md-none">
                {filteredExpenses.length === 0 ? (
                    <div className="text-center py-5 text-muted small">
                        {expensesList.length === 0 ? "No expenses logged yet." : "No matching expenses found."}
                    </div>
                ) : (
                    <motion.div variants={staggerContainer} initial="hidden" animate="show">
                        {filteredExpenses.map((exp) => {
                            const isExpInfoOpen = !!openExpInfoIds[exp.expenseId]
                            const isExpActionOpen = openActionExpId === exp.expenseId
                            return (
                                <motion.div key={exp.expenseId} variants={staggerItem} className="sub-mobile-card" style={{ zIndex: isExpActionOpen ? 1045 : 1 }}>
                                {/* Top Row: Particular & Amount */}
                                <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
                                    <div className="d-flex flex-column" style={{ minWidth: 0, flex: 1 }}>
                                        <span className="fw-bold text-main" style={{ fontSize: '0.96rem', lineHeight: 1.3, wordBreak: 'normal', overflowWrap: 'break-word' }}>
                                            {exp.particular}
                                        </span>
                                        <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                                            <span className="badge bg-secondary bg-opacity-10 text-muted font-monospace" style={{ fontSize: '0.68rem' }}>
                                                {exp.expenseId}
                                            </span>
                                            {exp.date && (
                                                <span className="extra-tiny text-muted d-inline-flex align-items-center gap-1 font-monospace">
                                                    <Calendar size={11} className="text-secondary opacity-75" />
                                                    {new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            )}
                                        </div>
                                        {exp.paidTo && (
                                            <div className="extra-tiny text-muted mt-1">
                                                <span className="opacity-75">Paid To:</span> <strong className="text-main">{exp.paidTo}</strong>
                                            </div>
                                        )}
                                    </div>
                                    <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1 fw-bold shadow-xs flex-shrink-0" style={{ fontSize: '0.88rem' }}>
                                        -{exp.currency}{(Number(exp.amount) || 0).toLocaleString('en-IN')}
                                    </span>
                                </div>

                                {/* Bottom Row: Payment Badge, Category & Action Dropdown */}
                                <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-10 gap-2">
                                    <div className="d-flex align-items-center gap-2 flex-wrap" style={{ gap: '7px' }}>
                                        <span className={`figma-payment-badge ${
                                            exp.paymentType === 'Online'
                                                ? 'badge-online'
                                                : exp.paymentType === 'Due'
                                                ? 'badge-due'
                                                : 'badge-cash'
                                        }`} style={{ fontSize: '0.68rem' }}>
                                            <span>{exp.paymentType === 'Online' && exp.onlineParticulars ? `Online (${exp.onlineParticulars})` : (exp.paymentType === 'Cash & Paid' ? 'Cash' : exp.paymentType)}</span>
                                        </span>
                                        {exp.expenseType && (
                                            <span className="badge rounded-pill px-2 py-0.5 extra-tiny fw-bold" style={{ background: 'rgba(67, 130, 149, 0.1)', color: 'var(--palette-slate-teal, #438295)', border: '1px solid rgba(67, 130, 149, 0.25)' }}>
                                                {exp.expenseType}
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setOpenExpInfoIds(prev => ({ ...prev, [exp.expenseId]: !prev[exp.expenseId] }))}
                                            className={`btn btn-sm p-0 rounded-circle d-inline-flex align-items-center justify-content-center transition-all ${
                                                isExpInfoOpen ? 'bg-primary text-white shadow-sm' : 'bg-secondary bg-opacity-10 text-primary border-0'
                                            }`}
                                            style={{ width: '22px', height: '22px', minWidth: '22px' }}
                                            title={isExpInfoOpen ? "Hide info" : "Show info"}
                                        >
                                            <Info size={12} strokeWidth={2.4} />
                                        </button>
                                    </div>

                                    {/* Action Dropdown on Mobile */}
                                    <div className="position-relative">
                                        <button
                                            type="button"
                                            onClick={() => setOpenActionExpId(isExpActionOpen ? null : exp.expenseId)}
                                            className={`btn btn-sm d-flex align-items-center gap-1 px-2.5 py-1 rounded-pill fw-bold shadow-sm sub-action-btn ${
                                                isExpActionOpen ? 'btn-primary text-white' : 'btn-outline-secondary'
                                            }`}
                                            style={{ fontSize: '0.73rem', height: '28px' }}
                                        >
                                            <span>Action</span>
                                            <ChevronDown size={12} style={{ transform: isExpActionOpen ? 'rotate(180deg)' : 'none' }} />
                                        </button>

                                        {isExpActionOpen && (
                                            <>
                                                <div
                                                    className="position-fixed top-0 start-0 w-100 h-100"
                                                    style={{ zIndex: 1040 }}
                                                    onClick={() => setOpenActionExpId(null)}
                                                />
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="sub-action-menu"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setOpenActionExpId(null)
                                                            handleDownloadSinglePDF(exp)
                                                        }}
                                                        className="sub-action-item"
                                                    >
                                                        <FileDown size={14} className="text-info" />
                                                        <span>Download PDF</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setOpenActionExpId(null)
                                                            setExpenseFormData({
                                                                ...exp,
                                                                paidTo: exp.paidTo || '',
                                                                contact: exp.contact || '',
                                                                date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                                                            })
                                                            setEditingExpId(exp.expenseId)
                                                            setIsExpAdding(true)
                                                        }}
                                                        className="sub-action-item"
                                                    >
                                                        <Edit3 size={14} className="text-primary" />
                                                        <span>Edit Expense</span>
                                                    </button>
                                                    <div className="sub-action-divider" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteExpense(exp.expenseId)}
                                                        className="sub-action-item delete-item"
                                                    >
                                                        <Trash2 size={14} className="text-danger" />
                                                        <span>Delete</span>
                                                    </button>
                                                </motion.div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Expandable Details Drawer */}
                                {isExpInfoOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.18 }}
                                        className="figma-exp-detail-card d-flex flex-wrap align-items-center gap-2 mt-2 pt-2 border-top text-muted"
                                        style={{ fontSize: '0.74rem' }}
                                    >
                                        {exp.date && (
                                            <div className="d-flex align-items-center gap-1">
                                                <Calendar size={12} className="text-warning opacity-75" />
                                                <span><strong>Date:</strong> {new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                        )}
                                        {exp.expenseType && (
                                            <div className="d-flex align-items-center gap-1">
                                                <Tag size={12} className="text-primary opacity-75" />
                                                <span><strong>Type:</strong> {exp.expenseType}</span>
                                            </div>
                                        )}
                                        {exp.contact && (
                                            <div className="d-flex align-items-center gap-1">
                                                <Phone size={12} className="text-info opacity-75" />
                                                <span><strong>Contact:</strong> {exp.contact}</span>
                                            </div>
                                        )}
                                        {exp.onlineReference && (
                                            <div className="d-flex align-items-center gap-1">
                                                <CreditCard size={12} className="text-info opacity-75" />
                                                <span><strong>Ref:</strong> {exp.onlineReference}</span>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </motion.div>
                        )
                    })}
                    </motion.div>
                )}
            </div>
        </div>
    )
}

export default ExpensesSection
