import React, { useState, useEffect, Fragment } from 'react'
import { useSearchParams } from 'react-router-dom'
import './Festivals.css'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, Calendar, Tag, Plus, Trash2, Edit3, X, Save, FileDown, MessageCircle, Zap, CheckCircle, Check, History, Eye, Phone, Lock, User, CreditCard, Crown, ShieldCheck, Fingerprint, Copy, ArrowUpDown, Filter, Download, ChevronDown, Sparkles, Info, Globe, Radio, Banknote, Clock, Hash, FileText, Layers, Smartphone, QrCode, Building2, Wallet, TrendingUp, Receipt, ArrowDownRight, ArrowUpRight, Scale, ChevronRight, Users, Ticket } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import VIPCard from '../../components/VIPCard'
import adminBg from '../../images/admin.jpg'
import primeBg from '../../images/primemember.jpg'
import regularBg from '../../images/regular.jpg'
import vipBg from '../../images/vip elite.jpg'
import ActivityLogsView from '../../components/ActivityLogsView'
import {
    exportSingleAttendeeReceiptPDF,
    exportSingleExpenseVoucherPDF,
    exportAttendeeMasterPDF,
    exportExpenseLedgerPDF,
    exportBalanceSheetPDF,
    exportMasterDataPackagePDF
} from '../../utils/pdfGenerator'

const countryCodes = [
    { code: '+91', country: 'IN' },
    { code: '+1', country: 'US' },
    { code: '+44', country: 'UK' },
    { code: '+971', country: 'AE' },
    { code: '+61', country: 'AU' },
    { code: '+81', country: 'JP' },
    { code: '+49', country: 'DE' },
    { code: '+33', country: 'FR' },
    { code: '+7', country: 'RU' },
    { code: '+86', country: 'CN' }
]

const currencies = [
    { symbol: '₹', code: 'INR' },
    { symbol: '$', code: 'USD' },
    { symbol: '£', code: 'GBP' },
    { symbol: '€', code: 'EUR' },
    { symbol: '¥', code: 'JPY' },
    { symbol: 'AED', code: 'AED' },
    { symbol: 'A$', code: 'AUD' }
]

const festivalExpenseTypes = ['Decoration', 'Sound', 'Catering', 'Lighting', 'Marketing', 'Guest Fees', 'Miscellaneous']
const eventExpenseTypes = ['Venue Hire', 'Equipment', 'Staffing', 'Permits', 'Security', 'Promotion', 'Miscellaneous']

const countryData = {
    'India': ['Religious', 'Harvest', 'Cultural', 'National', 'Music', 'Food'],
    'USA': ['Music', 'Food', 'Art', 'Holiday', 'Film'],
    'UK': ['Literature', 'Royal', 'Music', 'Arts'],
    'UAE': ['Shopping', 'Light', 'Cultural', 'Food'],
    'Australia': ['Coastal', 'Music', 'Sports', 'Cultural'],
    'Japan': ['Matsuri', 'Cherry Blossom', 'Anime', 'Tech'],
    'France': ['Wine', 'Fashion', 'Film', 'Art'],
    'Germany': ['Beer', 'Music', 'Carnival', 'Winter']
};

const getTierBadgeStyle = (tier) => {
    const baseStyle = {
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '12px',
        fontWeight: '600',
        padding: '3px 10px',
        borderRadius: '9999px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        letterSpacing: '0.01em',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
    };
    if (tier === 'Prime') return { ...baseStyle, backgroundColor: '#EEF2FF', color: '#4338CA', border: '1px solid #E0E7FF' };
    if (tier === 'VIP') return { ...baseStyle, backgroundColor: '#1F2937', color: '#F9FAFB', border: '1px solid #374151' };
    if (tier === 'Admin') return { ...baseStyle, backgroundColor: '#111827', color: '#34D399', border: '1px solid #374151' };
    return { ...baseStyle, backgroundColor: '#F3F4F6', color: '#4B5563', border: '1px solid #E5E7EB' };
};

const getTierDisplayName = (tier) => {
    if (tier === 'Prime') return 'Prime Member';
    if (tier === 'VIP') return 'VIP Access';
    if (tier === 'Admin') return 'Administrative';
    return 'None';
};

const getPaymentBadgeStyle = (paymentType) => {
    if (paymentType === 'Cash & Paid') return { backgroundColor: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' };
    if (paymentType === 'Due') return { backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#fecaca' };
    if (paymentType === 'Online') return { backgroundColor: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' };
    if (paymentType === 'Coupon or Token') return { backgroundColor: '#fef9c7', color: '#854d0e', borderColor: '#fef08a' };
    return { backgroundColor: '#f1f5f9', color: '#475569', borderColor: '#e2e8f0' };
};

const getPaymentDisplayName = (paymentType) => {
    if (paymentType === 'Cash & Paid') return 'Cash & Paid';
    if (paymentType === 'Due') return 'Due';
    if (paymentType === 'Online') return 'Online';
    if (paymentType === 'Coupon or Token') return 'Coupon or Token';
    return paymentType;
};

const getTierPdfStyle = (tier) => {
    const label = getTierDisplayName(tier);
    if (tier === 'Prime') {
        return { content: label, styles: { fillColor: [254, 243, 199], textColor: [180, 83, 9], fontStyle: 'bold' } };
    }
    if (tier === 'VIP') {
        return { content: label, styles: { fillColor: [224, 242, 254], textColor: [3, 105, 161], fontStyle: 'bold' } };
    }
    if (tier === 'Admin') {
        return { content: label, styles: { fillColor: [220, 252, 231], textColor: [22, 101, 52], fontStyle: 'bold' } };
    }
    return { content: label, styles: { fillColor: [241, 245, 249], textColor: [71, 85, 105] } };
};

const getPaymentPdfStyle = (paymentType, onlineDetails = '') => {
    let label = getPaymentDisplayName(paymentType);
    let fill = [241, 245, 249];
    let text = [71, 85, 105];

    if (paymentType === 'Cash & Paid') {
        fill = [220, 252, 231];
        text = [22, 101, 52];
    } else if (paymentType === 'Due') {
        fill = [254, 226, 226];
        text = [153, 27, 27];
    } else if (paymentType === 'Online') {
        label = label + (onlineDetails ? `\n${onlineDetails}` : '');
        fill = [224, 242, 254];
        text = [3, 105, 161];
    } else if (paymentType === 'Coupon or Token') {
        fill = [254, 249, 195];
        text = [133, 77, 14];
    }

    return { content: label, styles: { fillColor: fill, textColor: text, fontStyle: 'bold' } };
};

const getTierColorStyle = (tier) => {
    if (tier === 'Admin') return { backgroundColor: '#dcfce7', color: '#166534', fontWeight: 'bold' };
    if (tier === 'VIP') return { backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 'bold' };
    if (tier === 'Prime') return { backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 'bold' };
    return { backgroundColor: '#f1f5f9', color: '#475569' };
};

const getPaymentColorStyle = (paymentType) => {
    if (paymentType === 'Cash & Paid') return { backgroundColor: '#dcfce7', color: '#166534', fontWeight: 'bold' };
    if (paymentType === 'Due') return { backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: 'bold' };
    if (paymentType === 'Online') return { backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 'bold' };
    if (paymentType === 'Coupon or Token') return { backgroundColor: '#fef9c7', color: '#854d0e', fontWeight: 'bold' };
    return { backgroundColor: '#f1f5f9', color: '#475569' };
};


const Festivals = () => {
    const { activeFestival, setActiveFestival, user } = useAuth()
    const toast = useToast()
    const [search, setSearch] = useState('')
    const [subSearch, setSubSearch] = useState('')
    const [expSearch, setExpSearch] = useState('')
    const [cardSearch, setCardSearch] = useState('')

    // Sort and Filter States for Festivals Main Tab
    const [festSort, setFestSort] = useState('newest')
    const [festCategoryFilter, setFestCategoryFilter] = useState('all')

    // Sort and Filter States for Attendees (Subscriptions)
    const [subSort, setSubSort] = useState('newest')
    const [subMembershipFilter, setSubMembershipFilter] = useState('all')
    const [subPaymentFilter, setSubPaymentFilter] = useState('all')

    // Sort and Filter States for Expenses
    const [expSort, setExpSort] = useState('newest')
    const [expTypeFilter, setExpTypeFilter] = useState('all')
    const [expPaymentFilter, setExpPaymentFilter] = useState('all')

    // Sort and Filter States for Cards
    const [cardSort, setCardSort] = useState('name-asc')
    const [cardMembershipFilter, setCardMembershipFilter] = useState('all')

    const [festivals, setFestivals] = useState([])
    const [openInfoIds, setOpenInfoIds] = useState({})
    const [openExpInfoIds, setOpenExpInfoIds] = useState({})
    const [openActionSubId, setOpenActionSubId] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingFest, setEditingFest] = useState(null)
    const [formData, setFormData] = useState({
        title: '',
        location: '',
        startDate: '',
        endDate: '',
        country: 'India',
        category: 'Cultural',
        entityName: '',
        description: ''
    })
    const [searchParams, setSearchParams] = useSearchParams()
    const validTabs = ['festivals', 'new_attendee', 'subscriptions', 'expenses', 'card', 'balanceSheet', 'activity_logs', 'data']
    const urlTab = searchParams.get('tab')
    const [isDataOpen, setIsDataOpen] = useState(urlTab === 'data')
    const [activeTab, setActiveTab] = useState(
        urlTab && validTabs.includes(urlTab)
            ? (urlTab === 'new_attendee' || urlTab === 'data' ? (activeFestival ? 'subscriptions' : 'festivals') : urlTab)
            : (activeFestival ? 'subscriptions' : 'festivals')
    )

    // Synchronize activeTab and actions (new_attendee, data) if URL query param changes
    useEffect(() => {
        const tab = searchParams.get('tab')
        if (!tab) return

        if (tab === 'new_attendee') {
            setActiveTab('subscriptions')
            setIsSubAdding(true)
            if (activeFestival) {
                setSubFormData(prev => ({
                    ...prev,
                    subId: generateSubID(),
                    date: new Date().toISOString().split('T')[0],
                    festOrEventName: activeFestival.title || '',
                    entityName: activeFestival.entityName || ''
                }))
            }
        } else if (tab === 'data') {
            setIsDataOpen(true)
        } else if (validTabs.includes(tab) && tab !== activeTab) {
            setActiveTab(tab)
        }
    }, [searchParams, activeFestival])

    // Global event listener to reliably open Data Reports modal on demand from navbar
    useEffect(() => {
        const handleOpenData = () => {
            setIsDataOpen(true)
        }
        window.addEventListener('open-data-reports', handleOpenData)
        return () => window.removeEventListener('open-data-reports', handleOpenData)
    }, [])

    // Ensure activeFestival is populated whenever festivals load
    useEffect(() => {
        if (!activeFestival && festivals.length > 0) {
            setActiveFestival(festivals[0])
        }
    }, [festivals, activeFestival])

    const closeDataModal = () => {
        setIsDataOpen(false)
        setSearchParams(prev => {
            const next = new URLSearchParams(prev)
            if (next.get('tab') === 'data') {
                next.delete('tab')
            }
            return next
        }, { replace: true })
    }

    const handleTabChange = (newTab) => {
        if (newTab === 'new_attendee') {
            setActiveTab('subscriptions')
            setIsSubAdding(true)
            if (activeFestival) {
                setSubFormData(prev => ({
                    ...prev,
                    subId: generateSubID(),
                    date: new Date().toISOString().split('T')[0],
                    festOrEventName: activeFestival.title || '',
                    entityName: activeFestival.entityName || ''
                }))
            }
        } else if (newTab === 'data') {
            setIsDataOpen(true)
        } else {
            setActiveTab(newTab)
        }
        setSearchParams(prev => {
            const next = new URLSearchParams(prev)
            next.set('tab', newTab)
            return next
        }, { replace: true })
    }
    const [subscriptionsList, setSubscriptionsList] = useState([])
    const [expensesList, setExpensesList] = useState([])
    const [isSubAdding, setIsSubAdding] = useState(false)
    const [copiedSubId, setCopiedSubId] = useState(false)
    const [isExpAdding, setIsExpAdding] = useState(false)
    const [editingSubId, setEditingSubId] = useState(null)
    const [editingExpId, setEditingExpId] = useState(null)
    const [cardsList, setCardsList] = useState([])
    const [isCardAdding, setIsCardAdding] = useState(false)
    const [editingCardId, setEditingCardId] = useState(null)

    const generateSubID = () => Math.random().toString(36).substring(2, 12).toUpperCase()

    const [subFormData, setSubFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        subId: generateSubID(),
        name: '',
        address: '',
        contact: '',
        countryCode: '+91',
        amount: '',
        currency: '₹',
        paymentType: 'Cash & Paid',
        referenceName: '',
        membershipType: 'Non-Prime',
        cardColor: '#1e293b',
        entityName: '',
        festOrEventName: '',
        onlineParticulars: '',
        onlineReference: ''
    })

    const cardColors = [
        // Standard Modern Colors
        { name: 'Dark Slate', value: '#1e293b' },
        { name: 'Indigo', value: '#4338ca' },
        { name: 'Deep Blue', value: '#1e3a8a' },
        { name: 'Ocean', value: '#0369a1' },
        { name: 'Forest', value: '#065f46' },
        { name: 'Wine', value: '#991b1b' },
        { name: 'Golden', value: '#b45309' },
        // Premium Mixed/Vibrant (Simulated gradients)
        { name: 'Sunset Mix', value: '#f43f5e' },
        { name: 'Electric Mix', value: '#8b5cf6' },
        { name: 'Cyan Mix', value: '#06b6d4' },
        { name: 'Amber Glow', value: '#f59e0b' }
    ]

    const [expenseFormData, setExpenseFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        expenseId: generateSubID(),
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

    const [cardFormData, setCardFormData] = useState({
        cardId: generateSubID(),
        name: '',
        address: '',
        membershipType: 'Regular',
        cardColor: '#1e293b',
        backgroundImage: 'none',
        familyMembers: 0,
        fromDate: '',
        toDate: '',
        entityName: '',
        festOrEventName: ''
    })

    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const [selectedPreviewCard, setSelectedPreviewCard] = useState(null)

    const cardBackgrounds = [
        { id: 'none', name: 'Solid Color', path: '' },
        { id: 'geometric', name: 'Vanguard Geometric', path: '/images/cards/geometric.png' },
        { id: 'luxury', name: 'Abstract Luxury', path: '/images/cards/luxury.png' },
        { id: 'marble', name: 'Minimalist Marble', path: '/images/cards/marble.png' },
        { id: 'royal', name: 'Royal Red & Gold', path: '/images/cards/royal.png' },
        { id: 'carbon', name: 'Tech Carbon', path: '/images/cards/carbon.png' },
        { id: 'emerald', name: 'Organic Emerald', path: '/images/cards/emerald.png' },
        { id: 'sunset', name: 'Vibrant Sunset', path: '/images/cards/sunset.png' },
    ]

    const downloadPDF = async (sub) => {
        try {
            const fest = festivals.find(f => f.title === sub.festOrEventName) || activeFestival || {};
            await exportSingleAttendeeReceiptPDF({
                sub,
                festOrEvent: fest,
                entityName: fest.entityName || activeFestival?.entityName,
                getTierDisplayName,
                getPaymentDisplayName
            });
        } catch (err) {
            console.error('PDF Error:', err);
            alert('Error generating PDF receipt');
        }
    }

    const downloadExpensePDF = async (exp) => {
        try {
            const fest = festivals.find(f => f.title === exp.festOrEventName) || activeFestival || {};
            await exportSingleExpenseVoucherPDF({
                exp,
                festOrEvent: fest,
                entityName: fest.entityName || activeFestival?.entityName
            });
        } catch (err) {
            console.error('PDF Error:', err);
            alert('Could not generate Expense PDF');
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

            // 1. Determine local image asset based on membership tier
            let imgSrc = regularBg;
            if (sub.membershipType === 'Admin') imgSrc = adminBg;
            else if (sub.membershipType === 'Prime Member' || sub.membershipType === 'Prime') imgSrc = primeBg;
            else if (sub.membershipType === 'VIP Elite' || sub.membershipType === 'VIP') imgSrc = vipBg;

            // 2. Pre-load image as HTML element so jsPDF can embed native JPEG properly
            const imgElement = await new Promise((resolve, reject) => {
                const img = new Image();
                img.src = imgSrc;
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to load image for PDF'));
            });

            // 3. Inject precisely sized background
            try {
                doc.saveGraphicsState();
                doc.roundedRect(x, y, cardW, cardH, 6, 6, 'S'); // Clipping path mask
                doc.clip();
                doc.addImage(imgElement, 'JPEG', x, y, cardW, cardH);
                doc.restoreGraphicsState();
            } catch (e) {
                console.warn('Clipping failed, falling back to straight print', e);
                doc.addImage(imgElement, 'JPEG', x, y, cardW, cardH);
            }

            // --- Membership Identification ---
            doc.setFontSize(8);
            doc.setTextColor(235, 235, 235);
            doc.text('ID', x + 12, y + 16);

            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.setFont('courier', 'bold');
            const formattedId = String(sub.cardId || '').match(/.{1,4}/g)?.join(' ') || '---- ---- ----';
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

            // Group Size
            doc.setFontSize(8);
            doc.setTextColor(235, 235, 235);
            doc.text('GROUP SIZE', x + 98, y + 54, { align: 'right' });

            doc.setFontSize(13);
            doc.setTextColor(255, 255, 255);
            doc.text(String(sub.familyMembers || 0), x + 98, y + 61, { align: 'right' });

            doc.save(`Elite_Pass_${sub.cardId}.pdf`);
        } catch (err) {
            console.error('PDF Error:', err);
            alert('Error generating Elite Pass');
        }
    }

    const downloadAllAttendeesPDF = async () => {
        try {
            exportAttendeeMasterPDF({
                subscriptionsList,
                activeTitle: activeFestival?.title,
                entityName: activeFestival?.entityName,
                getTierDisplayName,
                getPaymentDisplayName
            });
        } catch (err) {
            console.error('PDF Error:', err);
            alert('PDF Generation Failed');
        }
    }

    const downloadAllExpensesPDF = async () => {
        try {
            exportExpenseLedgerPDF({
                expensesList,
                activeTitle: activeFestival?.title,
                entityName: activeFestival?.entityName,
                expenseTypes: festivalExpenseTypes
            });
        } catch (err) {
            console.error('PDF Error:', err);
            alert('PDF Generation Failed');
        }
    }

    const downloadBalanceSheetPDF = async () => {
        try {
            exportBalanceSheetPDF({
                subscriptionsList,
                expensesList,
                activeTitle: activeFestival?.title,
                entityName: activeFestival?.entityName,
                expenseTypes: festivalExpenseTypes
            });
        } catch (err) {
            console.error('PDF Error:', err);
            alert('PDF Generation Failed');
        }
    }

    const downloadMasterDataPDF = async () => {
        try {
            exportMasterDataPackagePDF({
                subscriptionsList,
                expensesList,
                activeTitle: activeFestival?.title,
                entityName: activeFestival?.entityName,
                expenseTypes: festivalExpenseTypes,
                getTierDisplayName,
                getPaymentDisplayName
            });
        } catch (err) {
            console.error('PDF Error:', err);
            alert('Master Data PDF generation failed');
        }
    }

    useEffect(() => {
        fetchFestivals()
    }, [])

    useEffect(() => {
        if (activeFestival) {
            fetchSubscriptions()
            fetchExpenses()
            fetchCards()
        }
    }, [activeFestival])

    const fetchCards = async () => {
        try {
            const res = await axios.get('/api/cards/festival')
            const filtered = res.data.filter(s => 
                s && s.festOrEventName && activeFestival?.title &&
                s.festOrEventName.trim().toLowerCase() === activeFestival.title.trim().toLowerCase()
            )
            setCardsList(filtered)
        } catch (err) {
            console.error('Fetch cards error:', err)
        }
    }

    const fetchSubscriptions = async () => {
        try {
            const res = await axios.get('/api/subscriptions/festival')
            const filtered = res.data.filter(s => s.festOrEventName === activeFestival?.title)
            setSubscriptionsList(filtered)
        } catch (err) {
            console.error('Fetch subs error:', err)
        }
    }

    const fetchExpenses = async () => {
        try {
            const res = await axios.get('/api/expenses/festival')
            const filtered = res.data.filter(s => s.category === 'festival' && s.festOrEventName === activeFestival?.title)
            setExpensesList(filtered)
        } catch (err) {
            console.error('Fetch expenses error:', err)
        }
    }

    const fetchFestivals = async () => {
        try {
            const res = await axios.get('/api/festivals')
            setFestivals(res.data)
        } catch (err) {
            console.error('Fetch error:', err)
        }
    }

    const generateFestivalPDF = async (festData) => {
        try {
            const jspdfModule = await import('jspdf')
            const autoTableModule = await import('jspdf-autotable')
            const jsPDF = jspdfModule.default || jspdfModule.jsPDF || jspdfModule
            const autoTable = autoTableModule.default || autoTableModule

            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

            // === Header Banner ===
            doc.setFillColor(30, 41, 59)
            doc.rect(0, 0, 210, 38, 'F')

            doc.setTextColor(255, 255, 255)
            doc.setFontSize(20)
            doc.setFont('helvetica', 'bold')
            doc.text(festData.title?.toUpperCase() || 'FESTIVAL REPORT', 14, 16)

            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            if (festData.entityName) doc.text(`Entity: ${festData.entityName}`, 14, 24)
            doc.text(`Category: ${festData.category || '—'}   |   Location: ${festData.location || '—'}   |   Country: ${festData.country || '—'}`, 14, 30)
            const sDate = festData.startDate ? new Date(festData.startDate).toLocaleDateString() : '—'
            const eDate = festData.endDate ? new Date(festData.endDate).toLocaleDateString() : '—'
            doc.text(`From: ${sDate}   To: ${eDate}`, 14, 36)

            // === Section: Festival Info ===
            doc.setTextColor(30, 41, 59)
            doc.setFontSize(11)
            doc.setFont('helvetica', 'bold')
            doc.text('Festival Details', 14, 48)

            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(80, 80, 80)
            if (festData.description) {
                const descLines = doc.splitTextToSize(`Description: ${festData.description}`, 182)
                doc.text(descLines, 14, 55)
            }

            // === Section: Attendees Table ===
            doc.setTextColor(30, 41, 59)
            doc.setFontSize(11)
            doc.setFont('helvetica', 'bold')
            doc.text('Attendees / Subscription List', 14, 70)

            // Filter attendees for this specific festival
            const filteredSubs = subscriptionsList.filter(s => s.festOrEventName === festData.title);

            doc.setFontSize(8)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(120, 120, 120)
            doc.text(`Total Attendees: ${filteredSubs.length}`, 14, 76)

            if (filteredSubs.length === 0) {
                doc.setTextColor(180, 180, 180)
                doc.setFontSize(10)
                doc.text('No attendees registered for this festival yet.', 14, 86)
            } else {
                const tableRows = filteredSubs.map((s, i) => [
                    s.subId || '—',
                    s.name || '—',
                    `${s.countryCode || ''} ${s.contact || '—'}`,
                    s.address || '—',
                    `Rs. ${String(s.amount || 0).replace(/[^0-9.]/g, '')}`,
                    s.paymentType || '—',
                    s.membershipType || '—',
                    s.date ? new Date(s.date).toLocaleDateString() : '—'
                ])

                autoTable(doc, {
                    startY: 80,
                    head: [['Pass ID', 'Name', 'Contact', 'Address', 'Amount', 'Payment', 'Tier', 'Date']],
                    body: tableRows,
                    styles: { fontSize: 7, cellPadding: 2 },
                    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
                    alternateRowStyles: { fillColor: [245, 248, 255] },
                    columnStyles: {
                        0: { cellWidth: 26 },
                        1: { cellWidth: 32 },
                        2: { cellWidth: 24 },
                        3: { cellWidth: 34 },
                        4: { cellWidth: 18 },
                        5: { cellWidth: 20 },
                        6: { cellWidth: 16 },
                        7: { cellWidth: 18 }
                    }
                })
            }

            // === Footer ===
            const pageCount = doc.internal.getNumberOfPages()
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i)
                doc.setFontSize(7)
                doc.setTextColor(160, 160, 160)
                doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 292)
                doc.text('Vishwa Utsav Festival Management System', 140, 292)
            }

            doc.save(`Festival_Report_${(festData.title || 'report').replace(/\s+/g, '_')}.pdf`)
        } catch (err) {
            console.error('PDF generation error:', err)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingFest) {
                const putRes = await axios.put(`/api/festivals/${editingFest._id}`, formData)
                if (putRes.data) {
                    setFestivals(prev => prev.map(f => f._id === putRes.data._id ? putRes.data : f));
                    if (activeFestival?._id === putRes.data._id) {
                        setActiveFestival(putRes.data);
                    }
                }
            } else {
                const postRes = await axios.post('/api/festivals', { ...formData, adminId: user?._id || user?.id })
                // Instantly select the newly created festival to unlock sub-tabs
                if (postRes.data) {
                    // Preemptively add it to the state so the Card displays instantly
                    setFestivals(prev => {
                        const exists = prev.find(p => p._id === postRes.data._id);
                        if (exists) return prev;
                        return [postRes.data, ...prev];
                    });
                    setActiveFestival(postRes.data)
                    setActiveTab('subscriptions')
                }
                // Auto-generate Festival + Attendee PDF on creation
                await generateFestivalPDF(formData)
            }
            closeModal()
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving festival')
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this festival?')) return
        try {
            await axios.delete(`/api/festivals/${id}`)
            fetchFestivals()
        } catch (err) {
            alert('Error deleting festival')
        }
    }

    const handleToggleLive = async (fest) => {
        try {
            const nextLive = !fest.isLive;
            const res = await axios.patch(`/api/festivals/${fest._id}/toggle-live`, { isLive: nextLive });
            setFestivals(prev => prev.map(f => f._id === fest._id ? { ...f, isLive: res.data.isLive } : f));
            if (activeFestival?._id === fest._id) {
                setActiveFestival(prev => ({ ...prev, isLive: res.data.isLive }));
            }
        } catch (err) {
            console.error('Failed to toggle festival live state:', err);
            alert(err.response?.data?.message || 'Failed to toggle live state');
        }
    };

    const openModal = (fest = null) => {
        if (fest) {
            setEditingFest(fest)
            setFormData({
                title: fest.title,
                location: fest.location,
                startDate: fest.startDate.split('T')[0],
                endDate: fest.endDate.split('T')[0],
                country: fest.country || 'India',
                category: fest.category,
                entityName: fest.entityName || '',
                description: fest.description || '',
                isLive: Boolean(fest.isLive)
            })
        } else {
            let activeEntityName = '';
            try {
                const storedEntity = localStorage.getItem('verifiedEntity');
                if (storedEntity && storedEntity !== 'undefined' && storedEntity !== 'null') {
                    activeEntityName = JSON.parse(storedEntity).name || '';
                }
            } catch (e) {}

            setEditingFest(null)
            setFormData({
                title: '', location: '', startDate: '', endDate: '', country: 'India', category: 'Cultural', entityName: activeEntityName, description: '', isLive: false
            })
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingFest(null)
    }

    const filteredFestivals = festivals
        .filter(f => {
            if (!f) return false;
            const q = search.toLowerCase()
            const matchesSearch = !q || (
                (f.title || '').toLowerCase().includes(q) ||
                (f.location && f.location.toLowerCase().includes(q)) ||
                (f.country && f.country.toLowerCase().includes(q))
            )
            const matchesCategory = festCategoryFilter === 'all' || f.category === festCategoryFilter
            return matchesSearch && matchesCategory
        })
        .sort((a, b) => {
            if (festSort === 'newest') return new Date(b.startDate || b.createdAt || 0) - new Date(a.startDate || a.createdAt || 0)
            if (festSort === 'oldest') return new Date(a.startDate || a.createdAt || 0) - new Date(b.startDate || b.createdAt || 0)
            if (festSort === 'title-asc') return (a.title || '').localeCompare(b.title || '')
            if (festSort === 'title-desc') return (b.title || '').localeCompare(a.title || '')
            return 0
        })

    const filteredSubs = subscriptionsList
        .filter(sub => {
            if (!sub) return false;
            const q = subSearch.toLowerCase()
            const matchesSearch = !q || (
                (sub.subId || '').toLowerCase().includes(q) ||
                (sub.name || '').toLowerCase().includes(q) ||
                (sub.address || '').toLowerCase().includes(q) ||
                (sub.contact || '').toLowerCase().includes(q) ||
                (sub.membershipType || '').toLowerCase().includes(q) ||
                (sub.paymentType || '').toLowerCase().includes(q)
            )
            const matchesMembership = subMembershipFilter === 'all' || 
                sub.membershipType === subMembershipFilter || 
                (subMembershipFilter === 'Administrative' && (sub.membershipType === 'Administrative' || sub.membershipType === 'Admin'))
            const matchesPayment = subPaymentFilter === 'all' || sub.paymentType === subPaymentFilter
            return matchesSearch && matchesMembership && matchesPayment
        })
        .sort((a, b) => {
            if (subSort === 'newest') return new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0)
            if (subSort === 'oldest') return new Date(a.date || a.createdAt || 0) - new Date(b.date || b.createdAt || 0)
            if (subSort === 'name-asc') return (a.name || '').localeCompare(b.name || '')
            if (subSort === 'name-desc') return (b.name || '').localeCompare(a.name || '')
            if (subSort === 'amount-high') return (Number(b.amount) || 0) - (Number(a.amount) || 0)
            if (subSort === 'amount-low') return (Number(a.amount) || 0) - (Number(b.amount) || 0)
            return 0
        })

    const filteredExpenses = expensesList
        .filter(exp => {
            if (!exp) return false;
            const q = expSearch.toLowerCase()
            const matchesSearch = !q || (
                (exp.expenseId || '').toLowerCase().includes(q) ||
                (exp.particular || '').toLowerCase().includes(q) ||
                (exp.expenseType || '').toLowerCase().includes(q) ||
                (exp.paymentType || '').toLowerCase().includes(q)
            )
            const matchesType = expTypeFilter === 'all' || exp.expenseType === expTypeFilter
            const matchesPayment = expPaymentFilter === 'all' || exp.paymentType === expPaymentFilter
            return matchesSearch && matchesType && matchesPayment
        })
        .sort((a, b) => {
            if (expSort === 'newest') return new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0)
            if (expSort === 'oldest') return new Date(a.date || a.createdAt || 0) - new Date(b.date || b.createdAt || 0)
            if (expSort === 'amount-high') return (Number(b.amount) || 0) - (Number(a.amount) || 0)
            if (expSort === 'amount-low') return (Number(a.amount) || 0) - (Number(b.amount) || 0)
            if (expSort === 'name-asc') return (a.particular || '').localeCompare(b.particular || '')
            return 0
        })

    const filteredCards = cardsList
        .filter(sub => {
            if (!sub) return false;
            const q = cardSearch.toLowerCase()
            const matchesSearch = !q || (
                (sub.cardId || '').toLowerCase().includes(q) ||
                (sub.name || '').toLowerCase().includes(q) ||
                (sub.membershipType || '').toLowerCase().includes(q) ||
                (sub.address || '').toLowerCase().includes(q)
            )
            const matchesMembership = cardMembershipFilter === 'all' || 
                sub.membershipType === cardMembershipFilter || 
                (cardMembershipFilter === 'Administrative' && (sub.membershipType === 'Administrative' || sub.membershipType === 'Admin'))
            return matchesSearch && matchesMembership
        })
        .sort((a, b) => {
            if (cardSort === 'name-asc') return (a.name || '').localeCompare(b.name || '')
            if (cardSort === 'name-desc') return (b.name || '').localeCompare(a.name || '')
            if (cardSort === 'newest') return new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0)
            return 0
        })

    return (
        <div className="container pt-3 pb-5 text-main">
            {/* DATA Reports Download Modal (Triggered via Navbar / Sidebar / URL ?tab=data) */}
            {isDataOpen && (
                <div 
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" 
                    style={{ zIndex: 100000, background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
                    onClick={closeDataModal}
                >
                    <div 
                        className="figma-reports-modal p-3 p-sm-4 shadow-2xl" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom border-secondary border-opacity-15 flex-wrap gap-2">
                            <div className="d-flex align-items-center gap-2.5">
                                <div className="figma-report-icon" style={{ background: 'linear-gradient(135deg, #E07A43, #D95A22)', color: '#ffffff', width: '38px', height: '38px', borderRadius: '12px' }}>
                                    <Download size={19} />
                                </div>
                                <div>
                                    <h6 className="fw-extrabold mb-0 text-main" style={{ letterSpacing: '-0.02em', fontSize: '1rem' }}>Data Reports</h6>
                                    <p className="text-muted extra-tiny mb-0">Audit-grade export hub</p>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-2 flex-grow-1 justify-content-end">
                                {festivals && festivals.length > 0 ? (
                                    <select
                                        className="form-select form-select-sm border border-secondary border-opacity-25 rounded-pill px-3 py-1.5 text-main fw-bold cursor-pointer"
                                        style={{ fontSize: '0.78rem', background: 'var(--input-bg)', minWidth: '170px', maxWidth: '240px' }}
                                        value={activeFestival?._id || festivals[0]?._id}
                                        onChange={(e) => {
                                            const found = festivals.find(f => f._id === e.target.value)
                                            if (found) setActiveFestival(found)
                                        }}
                                        title="Select Festival for Reports"
                                    >
                                        {festivals.map(f => (
                                            <option key={f._id} value={f._id} style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>
                                                {f.title}
                                            </option>
                                        ))}
                                    </select>
                                ) : activeFestival ? (
                                    <span className="badge bg-warning bg-opacity-15 text-warning border border-warning border-opacity-25 rounded-pill px-3 py-1.5 extra-tiny fw-bold text-truncate" style={{ maxWidth: "200px" }}>
                                        {activeFestival.title}
                                    </span>
                                ) : null}
                                <button 
                                    type="button" 
                                    className="btn btn-sm p-1.5 rounded-circle bg-secondary bg-opacity-10 text-muted hover-text-main border-0 d-flex align-items-center justify-content-center" 
                                    onClick={closeDataModal}
                                    aria-label="Close"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {(activeFestival || (festivals && festivals.length > 0)) ? (
                            <div className="d-flex flex-column gap-2.5">
                                {/* Attendee PDF Tile */}
                                <button
                                    className="figma-report-tile"
                                    onClick={() => { downloadAllAttendeesPDF(); closeDataModal(); }}
                                    title="Download Attendee PDF Roster"
                                >
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="figma-report-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                                            <FileText size={19} />
                                        </div>
                                        <div>
                                            <div className="fw-extrabold text-main" style={{ fontSize: '0.9rem' }}>
                                                Attendee PDF
                                            </div>
                                            <div className="text-muted extra-tiny">Complete guest &amp; volunteer roster</div>
                                        </div>
                                    </div>
                                    <div className="figma-report-pill-btn figma-report-pill-blue">
                                        <Download size={13} />
                                        <span>Download PDF</span>
                                    </div>
                                </button>

                                {/* All Expenses PDF Tile */}
                                <button
                                    className="figma-report-tile"
                                    onClick={() => { downloadAllExpensesPDF(); closeDataModal(); }}
                                    title="Download All Expenses PDF Ledger"
                                >
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="figma-report-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                                            <Receipt size={19} />
                                        </div>
                                        <div>
                                            <div className="fw-extrabold text-main" style={{ fontSize: '0.9rem' }}>
                                                All Expenses PDF
                                            </div>
                                            <div className="text-muted extra-tiny">Itemized receipts &amp; payments</div>
                                        </div>
                                    </div>
                                    <div className="figma-report-pill-btn figma-report-pill-red">
                                        <Download size={13} />
                                        <span>Download PDF</span>
                                    </div>
                                </button>

                                {/* BalanceSheet PDF Tile */}
                                <button
                                    className="figma-report-tile"
                                    onClick={() => { downloadBalanceSheetPDF(); closeDataModal(); }}
                                    title="Download BalanceSheet PDF Audit"
                                >
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="figma-report-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                                            <Scale size={19} />
                                        </div>
                                        <div>
                                            <div className="fw-extrabold text-main" style={{ fontSize: '0.9rem' }}>
                                                BalanceSheet PDF
                                            </div>
                                            <div className="text-muted extra-tiny">Consolidated financial overview</div>
                                        </div>
                                    </div>
                                    <div className="figma-report-pill-btn figma-report-pill-green">
                                        <Download size={13} />
                                        <span>Download PDF</span>
                                    </div>
                                </button>

                                <div className="d-flex align-items-center my-2">
                                    <div className="border-top border-secondary border-opacity-15 flex-grow-1"></div>
                                    <span className="extra-tiny text-muted px-2 fw-extrabold uppercase tracking-wider" style={{ fontSize: '0.64rem', letterSpacing: '0.08em' }}>
                                        ✦ Master Export Bundle
                                    </span>
                                    <div className="border-top border-secondary border-opacity-15 flex-grow-1"></div>
                                </div>

                                {/* Master Data PDF CTA Button */}
                                <button
                                    className="figma-btn-master-pdf"
                                    onClick={() => { downloadMasterDataPDF(); closeDataModal(); }}
                                    title="Download Complete Master Data Package PDF"
                                >
                                    <span className="d-flex align-items-center gap-2.5">
                                        <Sparkles size={17} className="text-warning" />
                                        <span className="fw-black tracking-wide" style={{ fontSize: '0.86rem' }}>MASTER DATA PDF</span>
                                    </span>
                                    <div className="figma-report-pill-btn figma-report-pill-white">
                                        <Download size={13} />
                                        <span>Download All</span>
                                    </div>
                                </button>
                            </div>
                        ) : (
                            <div className="py-4 px-2 text-center">
                                <div className="p-3 rounded-circle bg-warning bg-opacity-10 text-warning d-inline-flex mb-3">
                                    <Info size={24} />
                                </div>
                                <h6 className="fw-extrabold text-main mb-1" style={{ fontSize: '0.92rem' }}>No Festivals Available</h6>
                                <p className="text-muted extra-tiny mb-3">
                                    Create or add a festival first to export audit reports.
                                </p>
                                <button
                                    className="btn btn-sm btn-outline-primary py-2 px-3 rounded-pill w-100 extra-tiny fw-bold"
                                    onClick={() => { setActiveTab("festivals"); closeDataModal(); }}
                                >
                                    Open Directory
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Subscriptions Modal moved to end */}

            {activeTab === 'festivals' && (
                <>
                    {/* Header & Controls for Festivals */}
                    <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3 mb-3">
                        <div>
                            <h5 className="fw-extrabold mb-0 text-main">Festivals</h5>
                            <p className="text-muted tiny mb-0">Manage and explore all upcoming festivals.</p>
                        </div>
                        <div className="d-flex align-items-center gap-2 flex-wrap py-1">
                            {/* SORT */}
                            <div className="input-group action-item-pill px-2 align-items-center flex-nowrap shadow-sm" style={{ height: '26px' }}>
                                <span className="input-group-text bg-transparent border-0 text-primary px-1 py-0 d-flex align-items-center"><ArrowUpDown size={11} /></span>
                                <select
                                    className="form-select select-sort bg-transparent border-0 text-main shadow-none tiny p-0 pe-2 h-100 fw-bold"
                                    style={{ fontSize: '0.67rem' }}
                                    value={festSort}
                                    onChange={(e) => setFestSort(e.target.value)}
                                    title="Sort Festivals"
                                >
                                    <option value="newest" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>SORT: Newest</option>
                                    <option value="oldest" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>SORT: Oldest</option>
                                    <option value="title-asc" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>SORT: Title (A-Z)</option>
                                    <option value="title-desc" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>SORT: Title (Z-A)</option>
                                </select>
                            </div>

                            {/* FILTER */}
                            <div className={`input-group action-item-pill px-2 align-items-center flex-nowrap shadow-sm ${festCategoryFilter !== 'all' ? 'border-primary bg-primary bg-opacity-15' : ''}`} style={{ height: '26px' }}>
                                <span className="input-group-text bg-transparent border-0 text-muted px-1 py-0 d-flex align-items-center"><Filter size={11} className={festCategoryFilter !== 'all' ? 'text-primary' : ''} /></span>
                                <select
                                    className="form-select select-cat bg-transparent border-0 text-main shadow-none tiny p-0 pe-2 h-100 fw-bold"
                                    style={{ fontSize: '0.67rem' }}
                                    value={festCategoryFilter}
                                    onChange={(e) => setFestCategoryFilter(e.target.value)}
                                    title="Filter Category"
                                >
                                    <option value="all" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Category: All</option>
                                    <option value="Cultural" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Cultural</option>
                                    <option value="Music" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Music</option>
                                    <option value="Arts" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Arts</option>
                                    <option value="Food & Culinary" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Food & Culinary</option>
                                    <option value="Religious" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Religious</option>
                                    <option value="Film & Media" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Film & Media</option>
                                </select>
                            </div>

                            {/* SEARCH */}
                            <div className="input-group action-item-pill search-pill-container px-2 flex-nowrap shadow-sm" style={{ height: '26px' }}>
                                <span className="input-group-text bg-transparent border-0 text-muted px-1 py-0 d-flex align-items-center"><Search size={11} /></span>
                                <input
                                    type="text"
                                    className="form-control bg-transparent border-0 text-main shadow-none p-0 pe-1 h-100"
                                    placeholder="Search festivals..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ fontSize: '0.67rem' }}
                                />
                            </div>

                            {/* DATA REPORTS */}
                            <button onClick={() => setIsDataOpen(true)} className="btn btn-outline-warning d-flex align-items-center justify-content-center px-2.5 rounded-pill fw-bold shadow-sm transition-all text-nowrap ms-1" style={{ fontSize: '0.66rem', height: '26px' }} title="Open DATA Reports Hub">
                                <Download size={11} className="me-1" /> REPORTS
                            </button>

                            {/* CREATE */}
                            {user?.role === 'admin' && (
                                <button onClick={() => openModal()} className="btn btn-primary d-flex align-items-center justify-content-center px-2.5 rounded-pill fw-bold text-white shadow-sm transition-all hover-glow text-nowrap ms-1" style={{ fontSize: '0.66rem', height: '26px', backgroundColor: '#5c6cff', borderColor: '#5c6cff' }}>
                                    <Plus size={11} className="me-1" /> CREATE
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="d-flex flex-column gap-2">
                        {filteredFestivals.map((fest, idx) => {
                            const isActive = activeFestival?._id === fest._id;
                            return (
                                <motion.div
                                    key={fest._id || idx}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ scale: 1.002 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-100"
                                >
                                    <div 
                                        className={`bg-white shadow-sm d-flex flex-column py-2 px-3 transition-all ${isActive ? 'border-primary border-2' : 'border border-secondary border-opacity-10'}`}
                                        style={{ borderRadius: '8px', cursor: 'default' }}
                                    >
                                        {/* Main Row */}
                                        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-2">
                                            {/* Left Side: Title and Small rounded 'i' Info Button */}
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="fw-extrabold mb-0 text-dark m-0" style={{ letterSpacing: '-0.3px', fontSize: '0.95rem' }}>{fest.title}</div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenInfoIds(prev => ({ ...prev, [fest._id]: !prev[fest._id] }));
                                                    }}
                                                    className={`btn btn-sm p-0 rounded-circle d-inline-flex align-items-center justify-content-center transition-all ${
                                                        openInfoIds[fest._id]
                                                            ? 'bg-primary text-white shadow-sm'
                                                            : 'bg-secondary bg-opacity-10 text-primary border-0 hover-bg-primary hover-text-white'
                                                    }`}
                                                    style={{ width: '22px', height: '22px', minWidth: '22px', cursor: 'pointer' }}
                                                    title={openInfoIds[fest._id] ? "Hide festival details" : "Show Category, Address, Date details"}
                                                >
                                                    <Info size={12} strokeWidth={2.5} />
                                                </button>
                                            </div>

                                            {/* Right Side: Actions */}
                                            <div className="d-flex align-items-center gap-2 ms-lg-auto border-top border-lg-0 pt-2 pt-lg-0 border-secondary border-opacity-10 mt-2 mt-lg-0 flex-wrap">
                                                {/* Spotlight Festival Button */}
                                                {user?.role === 'admin' && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleToggleLive(fest); }}
                                                        className={`btn btn-sm d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill fw-bold transition-all shadow-xs ${
                                                            fest.isLive 
                                                                ? 'btn-warning text-dark border-warning' 
                                                                : 'btn-outline-secondary text-muted'
                                                        }`}
                                                        style={{ fontSize: '0.72rem' }}
                                                        title={fest.isLive ? 'Spotlighted in Grand Celebrations on Home Tab. Click to remove.' : 'Click to feature this festival in Grand Celebrations on Home Tab.'}
                                                    >
                                                        <Sparkles size={11} className={fest.isLive ? 'text-dark' : 'text-warning'} />
                                                        <span>{fest.isLive ? 'FEATURED UTSAV' : 'Spotlight on Home'}</span>
                                                    </button>
                                                )}

                                                {user?.role === 'admin' ? (
                                                    isActive ? (
                                                        <button onClick={() => setActiveFestival(null)} className="btn btn-success btn-sm d-flex align-items-center justify-content-center gap-1 px-3 py-1 shadow-sm rounded-pill fw-bold transition-all" style={{ fontSize: '0.75rem' }}>
                                                            <CheckCircle size={14} /> Selected
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => {
                                                            setActiveFestival(fest)
                                                            setActiveTab('subscriptions')
                                                        }} className="btn btn-primary btn-sm d-flex align-items-center justify-content-center gap-1 px-3 py-1 shadow-sm rounded-pill fw-bold transition-all hover-glow" style={{ fontSize: '0.75rem' }}>
                                                            Select & Manage
                                                        </button>
                                                    )
                                                ) : (
                                                    <div className="btn btn-light btn-sm px-3 py-1 rounded-pill fw-bold text-muted cursor-default border" style={{ fontSize: '0.75rem' }}>View Only</div>
                                                )}
                                                
                                                <div className="d-flex align-items-center gap-1 ms-1 ps-2 border-start border-secondary border-opacity-25">
                                                    <button onClick={() => generateFestivalPDF(fest)} title="Download Report" className="btn btn-light btn-sm text-info p-1 rounded hover-bg-info hover-text-white transition-all">
                                                        <FileDown size={14} />
                                                    </button>
                                                    {user?.role === 'admin' && (
                                                        <>
                                                            <button onClick={() => openModal(fest)} title="Edit Festival" className="btn btn-light btn-sm text-secondary p-1 rounded hover-bg-secondary hover-text-white transition-all">
                                                                <Edit3 size={14} />
                                                            </button>
                                                            <button onClick={() => handleDelete(fest._id)} className="btn btn-light btn-sm text-danger p-1 rounded hover-bg-danger hover-text-white transition-all" title="Delete Festival">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expandable Details shown on 'i' click */}
                                        <AnimatePresence>
                                            {openInfoIds[fest._id] && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                                    animate={{ opacity: 1, height: 'auto', marginTop: '8px' }}
                                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="d-flex flex-wrap align-items-center gap-3 pt-2 border-top border-secondary border-opacity-10 text-muted" style={{ fontSize: '0.8rem' }}>
                                                        {fest.category && (
                                                            <div className="badge bg-secondary bg-opacity-10 px-2 py-1 rounded-pill fw-bold" style={{ color: 'var(--accent-1)', fontSize: '0.7rem' }}>
                                                                {fest.category}
                                                            </div>
                                                        )}

                                                        <div className="d-flex align-items-center gap-1">
                                                            <MapPin size={14} className="text-info opacity-75" />
                                                            <span className="fw-medium text-secondary">{fest.location || 'No address provided'}</span>
                                                        </div>

                                                        <div className="d-flex align-items-center gap-1">
                                                            <Calendar size={14} className="text-warning opacity-75" />
                                                            <span className="fw-medium text-secondary">
                                                                {fest.startDate ? new Date(fest.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                                                {fest.endDate && ` - ${new Date(fest.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                                                            </span>
                                                        </div>

                                                        <div className="d-flex align-items-center">
                                                            {isActive ? (
                                                                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-0 rounded-pill"><CheckCircle size={10} className="me-1 d-inline"/> Active</span>
                                                            ) : (
                                                                <span className="badge bg-secondary bg-opacity-10 text-muted border border-secondary border-opacity-25 px-2 py-0 rounded-pill">Inactive</span>
                                                            )}
                                                        </div>

                                                        {fest.description && (
                                                            <div className="w-100 text-muted tiny pt-1" style={{ fontSize: '0.75rem' }}>
                                                                {fest.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </>
            )}

            {activeTab === 'subscriptions' && (
                <div className="glass-card py-3 px-3 px-sm-4 shadow-sm mx-auto w-100 subscriptions-wrapper-card">
                    {/* Subscriptions Title, Subtitle, and Badge */}
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <h5 className="fw-extrabold mb-0 text-main">Subscriptions</h5>
                            <p className="text-muted tiny mb-0">Attendee List and Payment tracking.</p>
                        </div>
                        <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-2.5 py-1 rounded-pill" style={{ fontSize: '0.72rem' }}>
                            {filteredSubs.length} Attendees
                        </span>
                    </div>

                    {/* Toolbar below Title inside the Card */}
                    <div className="d-flex flex-column py-1 mb-3" style={{ gap: '10px' }}>
                        {/* Row 1: Add New, Search, Attendee PDF */}
                        <div className="d-flex align-items-center gap-2 flex-wrap flex-sm-nowrap">
                            {/* ADD NEW */}
                            {!isSubAdding && (
                                <button onClick={() => {
                                    setIsSubAdding(true)
                                    setSubFormData({
                                        ...subFormData,
                                        subId: generateSubID(),
                                        date: new Date().toISOString().split('T')[0],
                                        festOrEventName: activeFestival?.title || '',
                                        entityName: activeFestival?.entityName || ''
                                    })
                                }} className="btn btn-premium btn-sm d-flex align-items-center gap-1.5 px-3 rounded-pill fw-bold text-nowrap transition-all hover-glow shadow-sm" style={{ height: '32px', fontSize: '0.74rem' }}>
                                    <Plus size={13} /> <span className="uppercase">Add New</span>
                                </button>
                            )}

                            {/* SEARCH */}
                            <div className="input-group action-item-pill search-pill-container px-2.5 flex-nowrap shadow-sm flex-grow-1 flex-sm-grow-0" style={{ height: '32px' }}>
                                <span className="input-group-text bg-transparent border-0 text-muted px-1 py-0 d-flex align-items-center"><Search size={13} /></span>
                                <input
                                    type="text"
                                    className="form-control bg-transparent border-0 text-main shadow-none tiny p-0 pe-1 h-100 fw-bold"
                                    placeholder="Search attendees..."
                                    value={subSearch}
                                    onChange={(e) => setSubSearch(e.target.value)}
                                    style={{ fontSize: '0.75rem' }}
                                />
                            </div>

                            {/* ATTENDEE PDF */}
                            <button onClick={downloadAllAttendeesPDF} className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1.5 px-3 rounded-pill fw-bold text-nowrap transition-all hover-glow shadow-sm" style={{ height: '32px', fontSize: '0.74rem' }}>
                                <FileDown size={13} /> <span className="uppercase">Attendee PDF</span>
                            </button>

                            {/* DATA REPORTS */}
                            <button 
                                onClick={() => setIsDataOpen(true)} 
                                className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1.5 px-3 rounded-pill fw-bold text-nowrap transition-all shadow-sm" 
                                style={{ height: '32px', fontSize: '0.74rem' }}
                                title="Open DATA Reports Hub"
                            >
                                <Download size={13} /> <span className="uppercase">DATA Reports</span>
                            </button>

                            {/* ACTION LOGS */}
                            <button 
                                onClick={() => handleTabChange('activity_logs')} 
                                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 px-3 rounded-pill fw-bold text-nowrap transition-all shadow-sm" 
                                style={{ height: '32px', fontSize: '0.74rem' }}
                                title="View who created, updated, or deleted attendee records"
                            >
                                <History size={13} className="text-primary" /> <span className="uppercase">Action Log</span>
                            </button>
                        </div>

                        {/* Row 2: Sort, Tier All, Pay All (Just below - clean horizontal swipe on mobile) */}
                        <div className="d-flex align-items-center gap-2 overflow-x-auto py-1 flex-nowrap">
                            {/* SORT */}
                            <div className="input-group action-item-pill px-2.5 align-items-center flex-nowrap shadow-sm" style={{ height: '32px' }}>
                                <span className="input-group-text bg-transparent border-0 text-primary px-1 py-0 d-flex align-items-center"><ArrowUpDown size={13} /></span>
                                <select
                                    className="form-select select-sort bg-transparent border-0 text-main shadow-none tiny py-0 ps-0 pe-2 h-100 fw-bold"
                                    style={{ fontSize: '0.75rem' }}
                                    value={subSort}
                                    onChange={(e) => setSubSort(e.target.value)}
                                    title="Sort Attendees"
                                >
                                    <option value="newest" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>SORT: Newest</option>
                                    <option value="oldest" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>SORT: Oldest</option>
                                    <option value="name-asc" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>SORT: Name (A-Z)</option>
                                    <option value="name-desc" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>SORT: Name (Z-A)</option>
                                    <option value="amount-high" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>SORT: Amount (High-Low)</option>
                                    <option value="amount-low" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>SORT: Amount (Low-High)</option>
                                </select>
                            </div>

                            {/* TIER FILTER */}
                            <div className={`input-group action-item-pill px-2.5 align-items-center flex-nowrap shadow-sm ${subMembershipFilter !== 'all' ? 'border-primary bg-primary bg-opacity-15' : ''}`} style={{ height: '32px' }}>
                                <span className="input-group-text bg-transparent border-0 text-muted px-1 py-0 d-flex align-items-center"><Filter size={13} className={subMembershipFilter !== 'all' ? 'text-primary' : ''} /></span>
                                <select
                                    className="form-select select-tier bg-transparent border-0 text-main shadow-none tiny py-0 ps-0 pe-2 h-100 fw-bold"
                                    style={{ fontSize: '0.75rem' }}
                                    value={subMembershipFilter}
                                    onChange={(e) => setSubMembershipFilter(e.target.value)}
                                    title="Filter Tier"
                                >
                                    <option value="all" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Tier: All</option>
                                    <option value="VIP" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>VIP</option>
                                    <option value="Prime" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Prime</option>
                                    <option value="Non-Prime" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Non-Prime</option>
                                    <option value="Administrative" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Administrative</option>
                                </select>
                            </div>

                            {/* PAYMENT FILTER */}
                            <div className={`input-group action-item-pill px-2.5 align-items-center flex-nowrap shadow-sm ${subPaymentFilter !== 'all' ? 'border-primary bg-primary bg-opacity-15' : ''}`} style={{ height: '32px' }}>
                                <span className="input-group-text bg-transparent border-0 text-muted px-1 py-0 d-flex align-items-center"><CreditCard size={13} className={subPaymentFilter !== 'all' ? 'text-primary' : ''} /></span>
                                <select
                                    className="form-select select-pay bg-transparent border-0 text-main shadow-none tiny py-0 ps-0 pe-2 h-100 fw-bold"
                                    style={{ fontSize: '0.75rem' }}
                                    value={subPaymentFilter}
                                    onChange={(e) => setSubPaymentFilter(e.target.value)}
                                    title="Filter Payment"
                                >
                                    <option value="all" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Pay: All</option>
                                    <option value="Cash & Paid" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Paid</option>
                                    <option value="Online" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Online</option>
                                    <option value="Due" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Due</option>
                                    <option value="Coupon or Token" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Coupon</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Desktop & Laptop Table View (Screens >= 768px) */}
                    <div className="table-responsive rounded-2 d-none d-md-block" style={{ WebkitOverflowScrolling: 'touch' }}>
                        <table className="table table-hover align-middle mb-0" style={{ tableLayout: 'fixed', width: '100%', minWidth: '540px' }}>
                            <colgroup>
                                <col style={{ width: '85px' }} />
                                <col style={{ width: '175px' }} />
                                <col style={{ width: '100px' }} />
                                <col style={{ width: '75px' }} />
                                <col style={{ width: '85px' }} />
                            </colgroup>
                            <thead>
                                <tr className="small text-muted border-bottom">
                                    <th className="border-0 fw-semibold py-2 ps-2 pe-1">ID</th>
                                    <th className="border-0 fw-semibold py-2 px-1">Attendee Name</th>
                                    <th className="border-0 fw-semibold py-2 px-1">Payment</th>
                                    <th className="border-0 fw-semibold py-2 px-1">Amount</th>
                                    <th className="border-0 fw-semibold py-2 ps-1 pe-2">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-main">
                                {filteredSubs.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-5 text-muted">{subscriptionsList.length === 0 ? "No subscriptions yet. Click 'Add New' to begin." : "No matching attendees found."}</td></tr>
                                ) : (
                                    filteredSubs.map((sub, index) => {
                                        const isInfoOpen = !!openInfoIds[sub.subId];
                                        const isActionOpen = openActionSubId === sub.subId;
                                        const isEven = index % 2 === 0;
                                        const rowBg = isInfoOpen
                                            ? 'rgba(67, 130, 149, 0.14)'
                                            : isEven
                                                ? 'rgba(67, 130, 149, 0.07)'
                                                : 'rgba(224, 122, 67, 0.07)';
                                        return (
                                            <Fragment key={sub.subId}>
                                                <tr className="align-middle transition-all sub-table-row" style={{ backgroundColor: rowBg }}>
                                                    <td className="border-0 py-2 ps-2 pe-1">
                                                        <span className="badge bg-secondary bg-opacity-10 text-dark font-monospace px-2 py-1">{sub.subId}</span>
                                                    </td>
                                                    <td className="border-0 py-2 px-1 pe-2">
                                                        <div className="d-flex align-items-center justify-content-between gap-1.5 w-100">
                                                            <span className="fw-bold small" style={{ wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: '1.25' }}>
                                                                {sub.name}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenInfoIds(prev => ({ ...prev, [sub.subId]: !prev[sub.subId] }));
                                                                }}
                                                                className={`btn btn-sm p-0 rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0 transition-all sub-info-btn ${
                                                                    isInfoOpen
                                                                        ? 'bg-primary text-white shadow-sm'
                                                                        : 'bg-secondary bg-opacity-10 text-primary border-0 hover-bg-primary hover-text-white'
                                                                }`}
                                                                style={{ width: '20px', height: '20px', minWidth: '20px', cursor: 'pointer' }}
                                                                title={isInfoOpen ? "Hide attendee details" : "Show Date, Contact, Address, Type"}
                                                              >
                                                                <Info size={11} strokeWidth={2.5} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="border-0 py-2 px-1">
                                                        <div className="d-flex align-items-center gap-1 flex-wrap">
                                                            <span className="badge px-2 py-1 fw-medium" style={getPaymentBadgeStyle(sub.paymentType)}>
                                                                {getPaymentDisplayName(sub.paymentType)}
                                                            </span>
                                                            {sub.referenceName && <span className="text-muted extra-tiny">Ref: {sub.referenceName}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="border-0 py-2 px-1">
                                                        <span className="badge bg-success text-white px-2 py-1 fw-bold shadow-sm sub-card-amount" style={{ fontSize: '0.8rem' }}>
                                                            {sub.currency || '₹'}{String(sub.amount || 0).replace(/[^0-9.]/g, '')}
                                                        </span>
                                                    </td>
                                                    <td className="border-0 py-2 ps-1 pe-2 position-relative">
                                                        <div className="position-relative d-inline-block" style={{ zIndex: isActionOpen ? 1045 : 'auto' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => setOpenActionSubId(isActionOpen ? null : sub.subId)}
                                                                className={`btn btn-sm d-flex align-items-center gap-1.5 px-2.5 rounded-pill fw-bold text-nowrap transition-all shadow-sm sub-action-btn ${
                                                                    isActionOpen
                                                                        ? 'btn-primary text-white'
                                                                        : 'btn-outline-secondary'
                                                                }`}
                                                                style={{ height: '28px', fontSize: '0.73rem' }}
                                                            >
                                                                <span>Action</span>
                                                                <ChevronDown size={12} className={`transition-all ${isActionOpen ? 'rotate-180' : ''}`} style={{ transform: isActionOpen ? 'rotate(180deg)' : 'none' }} />
                                                            </button>

                                                            {isActionOpen && (
                                                                <>
                                                                    <div
                                                                        className="position-fixed top-0 start-0 w-100 h-100"
                                                                        style={{ zIndex: 1040 }}
                                                                        onClick={() => setOpenActionSubId(null)}
                                                                    />
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                                        transition={{ duration: 0.15 }}
                                                                        className="sub-action-menu"
                                                                    >
                                                                        {/* WhatsApp */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setOpenActionSubId(null)
                                                                                const message = `Halo ${sub.name}, your subscription ID ${sub.subId} is confirmed.`
                                                                                window.open(`https://wa.me/${sub.contact.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank')
                                                                            }}
                                                                            className="sub-action-item"
                                                                        >
                                                                            <MessageCircle size={15} className="text-success" />
                                                                            <span>WhatsApp</span>
                                                                        </button>

                                                                        {/* Download PDF */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setOpenActionSubId(null)
                                                                                downloadPDF(sub)
                                                                            }}
                                                                            className="sub-action-item"
                                                                        >
                                                                            <FileDown size={15} className="text-info" />
                                                                            <span>PDF Pass</span>
                                                                        </button>

                                                                        {/* Edit */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setOpenActionSubId(null)
                                                                                setSubFormData({
                                                                                    ...sub,
                                                                                    date: sub.date ? new Date(sub.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                                                                                })
                                                                                setEditingSubId(sub.subId)
                                                                                setIsSubAdding(true)
                                                                            }}
                                                                            className="sub-action-item"
                                                                        >
                                                                            <Edit3 size={15} className="text-primary" />
                                                                            <span>Edit</span>
                                                                        </button>

                                                                        <div className="sub-action-divider" />

                                                                        {/* Delete */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={async () => {
                                                                                setOpenActionSubId(null)
                                                                                if (window.confirm('Delete subscription?')) {
                                                                                    try {
                                                                                        await axios.delete(`/api/subscriptions/${sub.subId}`)
                                                                                        fetchSubscriptions()
                                                                                    } catch (err) {
                                                                                        alert('Error deleting')
                                                                                    }
                                                                                }
                                                                            }}
                                                                            className="sub-action-item delete-item"
                                                                        >
                                                                            <Trash2 size={15} />
                                                                            <span>Delete</span>
                                                                        </button>
                                                                    </motion.div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                                {isInfoOpen && (
                                                    <tr style={{ backgroundColor: 'rgba(67, 130, 149, 0.14)' }} className="border-top-0">
                                                        <td colSpan="5" className="border-0 pt-0 pb-2 px-3">
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="p-2.5 rounded-3 shadow-sm sub-desktop-info-drawer d-flex flex-wrap align-items-center gap-3 text-muted"
                                                                style={{ fontSize: '0.78rem' }}
                                                            >
                                                                {/* Date */}
                                                                <div className="d-flex align-items-center gap-1.5">
                                                                    <Calendar size={13} className="text-warning" />
                                                                    <span><strong className="text-main">Date:</strong> {sub.date ? new Date(sub.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                                                                </div>

                                                                {/* Contact */}
                                                                <div className="d-flex align-items-center gap-1.5">
                                                                    <Phone size={13} className="text-info" />
                                                                    <span><strong className="text-main">Contact:</strong> {sub.countryCode || ''} {sub.contact || 'N/A'}</span>
                                                                </div>

                                                                {/* Address */}
                                                                <div className="d-flex align-items-center gap-1.5">
                                                                    <MapPin size={13} className="text-danger" />
                                                                    <span><strong className="text-main">Address:</strong> {sub.address || 'N/A'}</span>
                                                                </div>

                                                                {/* Reference */}
                                                                {sub.referenceName && (
                                                                    <div className="d-flex align-items-center gap-1.5">
                                                                        <Tag size={13} className="text-primary" />
                                                                        <span><strong className="text-main">Ref:</strong> {sub.referenceName}</span>
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Attendee Cards (Smartphones < 768px) */}
                    <div className="d-block d-md-none">
                        {filteredSubs.length === 0 ? (
                            <div className="text-center py-5 text-muted small">
                                {subscriptionsList.length === 0 ? "No subscriptions yet. Click 'Add New' to begin." : "No matching attendees found."}
                            </div>
                        ) : (
                            filteredSubs.map((sub) => {
                                const isInfoOpen = !!openInfoIds[sub.subId];
                                const isActionOpen = openActionSubId === sub.subId;
                                return (
                                    <div key={sub.subId} className="sub-mobile-card" style={{ zIndex: isActionOpen ? 1045 : 1 }}>
                                        {/* Top Row: Attendee Name + Pass ID + Amount */}
                                        <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
                                            <div className="d-flex flex-column">
                                                <span className="fw-bold text-main sub-card-name" style={{ fontSize: '0.96rem', lineHeight: 1.3 }}>
                                                    {sub.name}
                                                </span>
                                                <span className="badge bg-secondary bg-opacity-10 text-muted font-monospace mt-1 align-self-start" style={{ fontSize: '0.68rem' }}>
                                                    {sub.subId}
                                                </span>
                                            </div>
                                            <span className="badge bg-success text-white px-2.5 py-1 fw-bold shadow-sm flex-shrink-0 sub-card-amount" style={{ fontSize: '0.85rem' }}>
                                                {sub.currency || '₹'}{String(sub.amount || 0).replace(/[^0-9.]/g, '')}
                                            </span>
                                        </div>

                                        {/* Middle Row: Payment Badge, Tier & Actions */}
                                        <div className="d-flex justify-content-between align-items-center pt-1.5 gap-2">
                                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                                <span className="badge px-2.5 py-1 rounded-pill fw-semibold border" style={{ ...getPaymentBadgeStyle(sub.paymentType), fontSize: '0.72rem' }}>
                                                    {getPaymentDisplayName(sub.paymentType)}
                                                </span>
                                                {sub.membershipType && (
                                                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-20 px-2.5 py-1 rounded-pill fw-semibold" style={{ fontSize: '0.72rem' }}>
                                                        {getTierDisplayName(sub.membershipType)}
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenInfoIds(prev => ({ ...prev, [sub.subId]: !prev[sub.subId] }))}
                                                    className={`btn btn-sm p-0 rounded-circle d-inline-flex align-items-center justify-content-center transition-all sub-info-btn ms-1 ${
                                                        isInfoOpen ? 'bg-primary text-white shadow-sm' : 'bg-secondary bg-opacity-10 text-primary border-0'
                                                    }`}
                                                    style={{ width: '24px', height: '24px', minWidth: '24px' }}
                                                    title={isInfoOpen ? "Hide info" : "Show info"}
                                                >
                                                    <Info size={13} strokeWidth={2.4} />
                                                </button>
                                            </div>

                                            {/* Action Dropdown on Mobile */}
                                            <div className="position-relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenActionSubId(isActionOpen ? null : sub.subId)}
                                                    className={`btn btn-sm d-flex align-items-center gap-1 px-2.5 py-1 rounded-pill fw-bold shadow-sm sub-action-btn ${
                                                        isActionOpen ? 'btn-primary text-white' : 'btn-outline-secondary'
                                                    }`}
                                                    style={{ fontSize: '0.75rem', height: '28px' }}
                                                >
                                                    <span>Action</span>
                                                    <ChevronDown size={12} style={{ transform: isActionOpen ? 'rotate(180deg)' : 'none' }} />
                                                </button>

                                                {isActionOpen && (
                                                    <>
                                                        <div
                                                            className="position-fixed top-0 start-0 w-100 h-100"
                                                            style={{ zIndex: 1040 }}
                                                            onClick={() => setOpenActionSubId(null)}
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
                                                                    setOpenActionSubId(null);
                                                                    const message = `Halo ${sub.name}, your subscription ID ${sub.subId} is confirmed.`;
                                                                    window.open(`https://wa.me/${sub.contact.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                                                                }}
                                                                className="sub-action-item"
                                                            >
                                                                <MessageCircle size={15} className="text-success" />
                                                                <span>WhatsApp</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setOpenActionSubId(null);
                                                                    downloadPDF(sub);
                                                                }}
                                                                className="sub-action-item"
                                                            >
                                                                <FileDown size={15} className="text-info" />
                                                                <span>PDF Pass</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setOpenActionSubId(null);
                                                                    setSubFormData({
                                                                        ...sub,
                                                                        date: sub.date ? new Date(sub.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                                                                    });
                                                                    setEditingSubId(sub.subId);
                                                                    setIsSubAdding(true);
                                                                }}
                                                                className="sub-action-item"
                                                            >
                                                                <Edit3 size={15} className="text-primary" />
                                                                <span>Edit</span>
                                                            </button>
                                                            <div className="sub-action-divider" />
                                                            <button
                                                                type="button"
                                                                onClick={async () => {
                                                                    setOpenActionSubId(null);
                                                                    if (window.confirm('Delete subscription?')) {
                                                                        try {
                                                                            await axios.delete(`/api/subscriptions/${sub.subId}`);
                                                                            fetchSubscriptions();
                                                                        } catch (err) {
                                                                            alert('Error deleting');
                                                                        }
                                                                    }
                                                                }}
                                                                className="sub-action-item delete-item"
                                                            >
                                                                <Trash2 size={15} />
                                                                <span>Delete</span>
                                                            </button>
                                                        </motion.div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Expandable Modern Info Drawer on Mobile */}
                                        {isInfoOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2, ease: "easeOut" }}
                                                className="sub-mobile-info-drawer overflow-hidden"
                                            >
                                                <div className="sub-info-grid">
                                                    {/* Date */}
                                                    <div className="sub-info-chip">
                                                        <div className="sub-info-icon-box bg-warning bg-opacity-15 text-warning">
                                                            <Calendar size={14} strokeWidth={2.4} />
                                                        </div>
                                                        <div className="d-flex flex-column min-w-0">
                                                            <span className="sub-info-label">Date</span>
                                                            <span className="sub-info-value text-truncate">
                                                                {sub.date ? new Date(sub.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Contact */}
                                                    <div className="sub-info-chip">
                                                        <div className="sub-info-icon-box bg-info bg-opacity-15 text-info">
                                                            <Phone size={14} strokeWidth={2.4} />
                                                        </div>
                                                        <div className="d-flex flex-column min-w-0">
                                                            <span className="sub-info-label">Contact</span>
                                                            {sub.contact ? (
                                                                <a href={`tel:${sub.contact}`} className="sub-info-value text-truncate text-decoration-none" title={sub.contact}>
                                                                    {sub.countryCode || ''} {sub.contact}
                                                                </a>
                                                            ) : (
                                                                <span className="sub-info-value text-muted">N/A</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Address */}
                                                    <div className={`sub-info-chip ${sub.referenceName ? '' : 'full-width'}`}>
                                                        <div className="sub-info-icon-box bg-danger bg-opacity-15 text-danger">
                                                            <MapPin size={14} strokeWidth={2.4} />
                                                        </div>
                                                        <div className="d-flex flex-column min-w-0">
                                                            <span className="sub-info-label">Address</span>
                                                            <span className="sub-info-value text-truncate" title={sub.address || 'Not provided'}>
                                                                {sub.address || 'Not provided'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Reference (if available) */}
                                                    {sub.referenceName ? (
                                                        <div className="sub-info-chip">
                                                            <div className="sub-info-icon-box bg-primary bg-opacity-15 text-primary">
                                                                <Tag size={14} strokeWidth={2.4} />
                                                            </div>
                                                            <div className="d-flex flex-column min-w-0">
                                                                <span className="sub-info-label">Reference</span>
                                                                <span className="sub-info-value text-truncate" title={sub.referenceName}>
                                                                    {sub.referenceName}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}


            {activeTab === 'expenses' && (
                <div className="figma-expense-section py-3 px-3 px-sm-4 shadow-sm mx-auto w-100" style={{ maxWidth: '760px' }}>
                    {/* Expenses Header */}
                    <div className="figma-expense-header">
                        <div className="figma-expense-title-group">
                            <div className="figma-expense-icon-badge shadow-sm">
                                <span className="figma-expense-emoji" role="img" aria-label="Receipt">🧾</span>
                            </div>
                            <div>
                                <div className="d-flex align-items-center gap-2">
                                    <h4 className="mb-0 fw-bold text-main" style={{ fontSize: '1.18rem', letterSpacing: '-0.3px' }}>Expenses</h4>
                                    <span className="badge rounded-pill px-2 py-0.5 extra-tiny fw-bold" style={{ background: 'rgba(234, 88, 12, 0.12)', color: '#ea580c', border: '1px solid rgba(234, 88, 12, 0.25)' }}>
                                        {filteredExpenses.length} Records
                                    </span>
                                </div>
                                <p className="text-muted tiny mb-0">Track and manage financial disbursements, invoices and audit trails.</p>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar below Title inside the Card */}
                    <div className="d-flex flex-column gap-2 mb-3">
                        {/* Row 1: New Expense, Search, All Expenses PDF */}
                        <div className="d-flex align-items-center gap-2 flex-wrap flex-sm-nowrap">
                            {!isExpAdding && (
                                <button onClick={() => {
                                    setEditingExpId(null);
                                    setExpenseFormData({
                                        date: new Date().toISOString().split('T')[0],
                                        expenseId: generateSubID(),
                                        particular: '',
                                        paidTo: '',
                                        contact: '',
                                        expenseType: 'Decoration',
                                        amount: '',
                                        currency: '₹',
                                        paymentType: 'Cash & Paid',
                                        onlineParticulars: '',
                                        onlineReference: ''
                                    });
                                    setIsExpAdding(true);
                                }} className="figma-btn-submit py-1 px-3 rounded-pill fw-bold text-nowrap transition-all shadow-sm" style={{ height: '30px', fontSize: '0.72rem' }}>
                                    <Plus size={13} /> <span>New Expense</span>
                                </button>
                            )}
                            {/* Search Expenses */}
                            <div className="input-group action-item-pill search-pill-container px-2 flex-nowrap shadow-sm" style={{ height: '30px' }}>
                                <span className="input-group-text bg-transparent border-0 text-muted px-1 py-0 d-flex align-items-center"><Search size={12} /></span>
                                <input
                                    type="text"
                                    className="form-control bg-transparent border-0 text-main shadow-none tiny p-0 pe-1 h-100"
                                    placeholder="Search expenses by particular, ref..."
                                    value={expSearch}
                                    onChange={(e) => setExpSearch(e.target.value)}
                                    style={{ fontSize: '0.75rem' }}
                                />
                            </div>
                            <button onClick={downloadAllExpensesPDF} className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1.5 px-3 rounded-pill fw-bold text-nowrap transition-all hover-glow shadow-sm" style={{ height: '30px', fontSize: '0.72rem' }}>
                                <FileDown size={13} /> <span className="uppercase">All Expenses PDF</span>
                            </button>
                            <button onClick={() => setIsDataOpen(true)} className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1.5 px-3 rounded-pill fw-bold text-nowrap transition-all shadow-sm" style={{ height: '30px', fontSize: '0.72rem' }} title="Open DATA Reports Hub">
                                <Download size={13} /> <span className="uppercase">DATA Reports</span>
                            </button>
                        </div>

                        {/* Row 2: Sort, Category Filter, Pay Filter */}
                        <div className="d-flex align-items-center gap-2 flex-wrap flex-sm-nowrap">
                            {/* SORT */}
                            <div className="input-group action-item-pill px-2 align-items-center flex-nowrap shadow-sm" style={{ height: '28px' }}>
                                <span className="input-group-text bg-transparent border-0 text-primary px-1 py-0 d-flex align-items-center"><ArrowUpDown size={11} /></span>
                                <select
                                    className="form-select select-sort bg-transparent border-0 text-main shadow-none tiny py-0 ps-0 pe-2 h-100 fw-bold"
                                    style={{ fontSize: '0.68rem' }}
                                    value={expSort}
                                    onChange={(e) => setExpSort(e.target.value)}
                                    title="Sort Expenses"
                                >
                                    <option value="newest" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>SORT: Newest</option>
                                    <option value="oldest" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>SORT: Oldest</option>
                                    <option value="amount-high" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>SORT: Amount (High-Low)</option>
                                    <option value="amount-low" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>SORT: Amount (Low-High)</option>
                                    <option value="name-asc" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>SORT: Particular (A-Z)</option>
                                </select>
                            </div>

                            {/* FILTER */}
                            <div className={`input-group action-item-pill px-2 align-items-center flex-nowrap shadow-sm ${expTypeFilter !== 'all' || expPaymentFilter !== 'all' ? 'border-primary bg-primary bg-opacity-15' : ''}`} style={{ height: '28px' }}>
                                <span className="input-group-text bg-transparent border-0 text-muted px-1 py-0 d-flex align-items-center"><Filter size={11} className={expTypeFilter !== 'all' || expPaymentFilter !== 'all' ? 'text-primary' : ''} /></span>
                                <select
                                    className="form-select select-cat bg-transparent border-0 text-main shadow-none tiny py-0 ps-0 pe-1.5 h-100 fw-bold"
                                    style={{ fontSize: '0.68rem' }}
                                    value={expTypeFilter}
                                    onChange={(e) => setExpTypeFilter(e.target.value)}
                                    title="Filter Category"
                                >
                                    <option value="all" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Category: All</option>
                                    <option value="Venue & Location" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Venue & Location</option>
                                    <option value="Sound & Lighting" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Sound & Lighting</option>
                                    <option value="Catering & Food" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Catering & Food</option>
                                    <option value="Marketing & PR" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Marketing & PR</option>
                                    <option value="Artist & Talent" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Artist & Talent</option>
                                    <option value="Security & Logistics" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Security & Logistics</option>
                                    <option value="Miscellaneous" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Miscellaneous</option>
                                </select>
                                <select
                                    className="form-select select-pay bg-transparent border-0 text-main shadow-none tiny py-0 ps-0 pe-1.5 h-100 fw-bold border-start border-secondary border-opacity-25"
                                    style={{ fontSize: '0.68rem' }}
                                    value={expPaymentFilter}
                                    onChange={(e) => setExpPaymentFilter(e.target.value)}
                                    title="Filter Payment Mode"
                                >
                                    <option value="all" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Pay: All</option>
                                    <option value="Cash" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Cash</option>
                                    <option value="Online" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Online</option>
                                    <option value="Bank Transfer" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Bank Transfer</option>
                                    <option value="Cheque" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Cheque</option>
                                    <option value="UPI / QR" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>UPI / QR</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {isExpAdding && (
                        <motion.div initial={{ opacity: 0, y: -8, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} className="figma-expense-form-card">
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
                                <button type="button" onClick={() => { setIsExpAdding(false); setEditingExpId(null); }} className="figma-expense-close-btn" title="Close">
                                    <X size={15} />
                                </button>
                            </div>
                            <form onSubmit={async (e) => {
                                e.preventDefault()
                                try {
                                    if (editingExpId) {
                                        await axios.put(`/api/expenses/${editingExpId}`, { ...expenseFormData, category: 'festival', festOrEventName: activeFestival?.title })
                                    } else {
                                        const { _id, __v, createdAt, ...postData } = expenseFormData;
                                        await axios.post('/api/expenses', { ...postData, category: 'festival', festOrEventName: activeFestival?.title })
                                    }
                                    setIsExpAdding(false)
                                    setEditingExpId(null)
                                    fetchExpenses()
                                    setExpenseFormData({
                                        date: new Date().toISOString().split('T')[0],
                                        expenseId: generateSubID(),
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
                                } catch (err) {
                                    alert('Error saving expense')
                                }
                            }} className="row g-2 g-md-3">
                                <div className="col-12 col-sm-6 col-lg-3">
                                    <label className="figma-expense-label"><Calendar size={11} /> Date</label>
                                    <div className="figma-input-wrapper">
                                        <input type="date" className="figma-input-field" value={expenseFormData.date} onChange={e => setExpenseFormData({ ...expenseFormData, date: e.target.value })} required />
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
                                        <input type="text" className="figma-input-field" placeholder="e.g. Stage Decoration" value={expenseFormData.particular} onChange={e => setExpenseFormData({ ...expenseFormData, particular: e.target.value })} required />
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
                                        <select className="figma-select-field" value={expenseFormData.expenseType} onChange={e => setExpenseFormData({ ...expenseFormData, expenseType: e.target.value })}>
                                            {festivalExpenseTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="col-12 col-sm-6 col-lg-4">
                                    <label className="figma-expense-label">Amount</label>
                                    <div className="figma-amount-group">
                                        <select className="figma-currency-prefix" value={expenseFormData.currency} onChange={e => setExpenseFormData({ ...expenseFormData, currency: e.target.value })}>
                                            {currencies.map(c => <option key={c.code} value={c.symbol}>{c.symbol}</option>)}
                                        </select>
                                        <input type="number" step="any" className="figma-amount-input" placeholder="0.00" value={expenseFormData.amount} onChange={e => setExpenseFormData({ ...expenseFormData, amount: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="col-12 col-lg-4">
                                    <label className="figma-expense-label">Payment Mode</label>
                                    <div className="figma-segmented-mode">
                                        {['Cash & Paid', 'Due', 'Online'].map(mode => {
                                            const isSelected = expenseFormData.paymentType === mode;
                                            const activeClass = mode === 'Cash & Paid' ? 'active-cash' : mode === 'Due' ? 'active-due' : 'active-online';
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
                                            );
                                        })}
                                    </div>
                                </div>
                                {expenseFormData.paymentType === 'Online' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="col-12 figma-online-drawer">
                                        <div className="row g-2">
                                            <div className="col-12 col-sm-6">
                                                <label className="figma-expense-label text-info"><Smartphone size={11} /> Bank / Platform</label>
                                                <div className="figma-input-wrapper">
                                                    <input type="text" className="figma-input-field" placeholder="e.g. GPay / HDFC / UPI" value={expenseFormData.onlineParticulars || ''} onChange={e => setExpenseFormData({ ...expenseFormData, onlineParticulars: e.target.value })} required />
                                                </div>
                                            </div>
                                            <div className="col-12 col-sm-6">
                                                <label className="figma-expense-label text-info"><QrCode size={11} /> Transaction Ref ID</label>
                                                <div className="figma-input-wrapper">
                                                    <input type="text" className="figma-input-field font-monospace" placeholder="e.g. TXN123456 / UTR" value={expenseFormData.onlineReference || ''} onChange={e => setExpenseFormData({ ...expenseFormData, onlineReference: e.target.value })} required />
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

                    <div className="table-responsive rounded-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                        <table className="table table-hover align-middle mb-0" style={{ width: '100%', minWidth: '560px' }}>
                            <colgroup>
                                <col style={{ width: '110px' }} />
                                <col style={{ width: '200px' }} />
                                <col style={{ width: '110px' }} />
                                <col style={{ width: '85px' }} />
                                <col style={{ width: '85px' }} />
                                <col />
                            </colgroup>
                            <thead>
                                <tr className="text-muted" style={{ fontSize: '0.72rem' }}>
                                    <th className="border-0 bg-transparent py-2 ps-2">EXPENSE ID</th>
                                    <th className="border-0 bg-transparent py-2 px-1">PARTICULAR</th>
                                    <th className="border-0 bg-transparent py-2 px-1">PAYMENT</th>
                                    <th className="border-0 bg-transparent py-2 px-1">AMOUNT</th>
                                    <th className="border-0 bg-transparent py-2 px-1">ACTION</th>
                                    <th className="border-0 bg-transparent py-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-5 text-muted">{expensesList.length === 0 ? "No expenses logged yet." : "No matching expenses found."}</td></tr>
                                ) : (
                                    filteredExpenses.map((exp, index) => {
                                        const isExpInfoOpen = !!openExpInfoIds[exp.expenseId];
                                        const isEven = index % 2 === 0;
                                        const rowBg = isExpInfoOpen ? 'rgba(67,130,149,0.14)' : isEven ? 'rgba(67,130,149,0.07)' : 'rgba(224,122,67,0.07)';
                                        return (
                                            <Fragment key={exp.expenseId}>
                                                <tr className="align-middle transition-all" style={{ backgroundColor: rowBg }}>
                                                    <td className="border-0 py-2 ps-2 pe-1">
                                                        <span className="badge bg-secondary bg-opacity-10 text-muted font-monospace" style={{ fontSize: '0.7rem' }}>{exp.expenseId}</span>
                                                    </td>
                                                    <td className="border-0 py-2 px-1 pe-2">
                                                        <div className="d-flex align-items-center justify-content-between gap-1.5 w-100">
                                                            <div>
                                                                <span className="fw-bold small" style={{ wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: '1.25' }}>{exp.particular}</span>
                                                                {exp.paidTo && (
                                                                    <div className="extra-tiny text-muted d-flex align-items-center gap-1 mt-0.5" style={{ fontSize: '0.68rem' }}>
                                                                        <span className="opacity-75">Paid To:</span> <strong className="text-main">{exp.paidTo}</strong>
                                                                        {exp.contact && <span className="text-muted ms-1">({exp.contact})</span>}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenExpInfoIds(prev => ({ ...prev, [exp.expenseId]: !prev[exp.expenseId] }));
                                                                }}
                                                                className={`btn btn-sm p-0 rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0 transition-all ${
                                                                    isExpInfoOpen
                                                                        ? 'bg-primary text-white shadow-sm'
                                                                        : 'bg-secondary bg-opacity-10 text-primary border-0 hover-bg-primary hover-text-white'
                                                                }`}
                                                                style={{ width: '20px', height: '20px', minWidth: '20px', cursor: 'pointer' }}
                                                                title={isExpInfoOpen ? 'Hide details' : 'Show Date & Type'}
                                                            >
                                                                <Info size={11} strokeWidth={2.5} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="border-0 py-2 px-1">
                                                        <span className={`figma-payment-badge ${
                                                            exp.paymentType === 'Online'
                                                                ? 'badge-online'
                                                                : exp.paymentType === 'Due'
                                                                ? 'badge-due'
                                                                : 'badge-cash'
                                                        }`}>
                                                            {exp.paymentType === 'Online' ? (
                                                                <CreditCard size={11} className="flex-shrink-0" />
                                                            ) : exp.paymentType === 'Due' ? (
                                                                <Clock size={11} className="flex-shrink-0" />
                                                            ) : (
                                                                <Banknote size={11} className="flex-shrink-0" />
                                                            )}
                                                            <span>{exp.paymentType === 'Online' && exp.onlineParticulars ? `Online (${exp.onlineParticulars})` : (exp.paymentType === 'Cash & Paid' ? 'Cash' : exp.paymentType)}</span>
                                                        </span>
                                                    </td>
                                                    <td className="border-0 py-2 px-1 fw-bold text-danger" style={{ fontSize: '0.82rem' }}>-{exp.currency}{(Number(exp.amount) || 0).toLocaleString()}</td>
                                                    <td className="border-0 py-2 px-1">
                                                        <div className="d-flex align-items-center gap-1">
                                                            <button onClick={() => downloadExpensePDF(exp)} className="btn btn-sm text-info p-0" title="Download PDF"><FileDown size={14} /></button>
                                                            <button onClick={() => {
                                                                setExpenseFormData({
                                                                    ...exp,
                                                                    paidTo: exp.paidTo || '',
                                                                    contact: exp.contact || '',
                                                                    date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                                                                })
                                                                setEditingExpId(exp.expenseId)
                                                                setIsExpAdding(true)
                                                            }} className="btn btn-sm text-primary p-0" title="Edit"><Edit3 size={14} /></button>
                                                            <button onClick={async () => {
                                                                if (window.confirm('Delete this expense?')) {
                                                                    await axios.delete(`/api/expenses/${exp.expenseId}`)
                                                                    fetchExpenses()
                                                                }
                                                            }} className="btn btn-sm text-danger p-0"><Trash2 size={14} /></button>
                                                        </div>
                                                    </td>
                                                    <td className="border-0 py-2"></td>
                                                </tr>
                                                {isExpInfoOpen && (
                                                    <tr style={{ backgroundColor: 'rgba(67,130,149,0.14)' }} className="border-top-0">
                                                        <td colSpan="6" className="border-0 pt-0 pb-2 px-3">
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                transition={{ duration: 0.18 }}
                                                                className="figma-exp-detail-card d-flex flex-wrap align-items-center gap-3 text-muted"
                                                                style={{ fontSize: '0.78rem' }}
                                                            >
                                                                <div className="d-flex align-items-center gap-1">
                                                                    <Calendar size={13} className="text-warning opacity-75" />
                                                                    <span><strong className="text-dark">Date:</strong> {exp.date ? new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                                                                </div>
                                                                <div className="d-flex align-items-center gap-1">
                                                                    <Tag size={13} className="text-primary opacity-75" />
                                                                    <span><strong className="text-dark">Type:</strong> {exp.expenseType || 'N/A'}</span>
                                                                </div>
                                                                {exp.paidTo && (
                                                                    <div className="d-flex align-items-center gap-1">
                                                                        <User size={13} className="text-success opacity-75" />
                                                                        <span><strong className="text-dark">Paid To:</strong> {exp.paidTo}</span>
                                                                    </div>
                                                                )}
                                                                {exp.contact && (
                                                                    <div className="d-flex align-items-center gap-1">
                                                                        <Phone size={13} className="text-info opacity-75" />
                                                                        <span><strong className="text-dark">Contact:</strong> {exp.contact}</span>
                                                                    </div>
                                                                )}
                                                                {exp.onlineReference && (
                                                                    <div className="d-flex align-items-center gap-1">
                                                                        <CreditCard size={13} className="text-info opacity-75" />
                                                                        <span><strong className="text-dark">Ref:</strong> {exp.onlineReference}</span>
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'card' && (
                <div className="figma-pass-preview-card">
                    {/* Pass Preview Title, Subtitle, and Badge */}
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-3">
                            <div className="figma-pass-emblem me-1">
                                <CreditCard size={22} />
                            </div>
                            <div>
                                <h5 className="fw-extrabold mb-0 text-main" style={{ letterSpacing: '-0.02em' }}>Pass Preview</h5>
                                <p className="text-muted extra-tiny mb-0">Visual identity and access privileges for active passes.</p>
                            </div>
                        </div>
                        <span className="figma-pass-count-pill shadow-xs">
                            <Sparkles size={12} />
                            {filteredCards?.length || 0} Passes Issued
                        </span>
                    </div>

                    {/* Toolbar below Title inside the Card */}
                    <div className="d-flex flex-column gap-2 mb-3">
                        {/* Row 1: Create Pass, Search */}
                        <div className="d-flex align-items-center gap-2 flex-wrap flex-sm-nowrap">
                            <button onClick={() => {
                                setCardFormData({
                                    ...cardFormData,
                                    name: '',
                                    address: '',
                                    membershipType: 'Regular',
                                    cardColor: '#1e293b',
                                    backgroundImage: 'none',
                                    familyMembers: 0,
                                    fromDate: activeFestival?.startDate ? new Date(activeFestival.startDate).toISOString().split('T')[0] : '',
                                    toDate: activeFestival?.endDate ? new Date(activeFestival.endDate).toISOString().split('T')[0] : '',
                                    festOrEventName: activeFestival?.title || '',
                                    entityName: activeFestival?.entityName || ''
                                })
                                setEditingCardId(null)
                                setIsCardAdding(true)
                            }} className="figma-btn-create-pass">
                                <Plus size={14} /> <span>Create Pass</span>
                            </button>

                            <button onClick={() => setIsDataOpen(true)} className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1.5 px-3 rounded-pill fw-bold text-nowrap transition-all shadow-sm" style={{ height: '36px', fontSize: '0.74rem' }} title="Open DATA Reports Hub">
                                <Download size={13} /> <span className="uppercase">DATA Reports</span>
                            </button>

                            {/* SEARCH */}
                            <div className="figma-pass-control-pill flex-grow-1 px-2.5 shadow-sm">
                                <Search size={13} className="text-muted me-1.5 flex-shrink-0" />
                                <input
                                    type="text"
                                    className="bg-transparent border-0 text-main shadow-none w-100 p-0"
                                    placeholder="Search passes by name, ID or tier..."
                                    value={cardSearch}
                                    onChange={(e) => setCardSearch(e.target.value)}
                                    style={{ fontSize: '0.74rem', outline: 'none' }}
                                />
                                {cardSearch && (
                                    <button type="button" onClick={() => setCardSearch('')} className="btn btn-sm p-0 border-0 bg-transparent text-muted hover-text-main">
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Row 2: Sort, Tier Filter */}
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            {/* SORT */}
                            <div className="figma-pass-control-pill px-2.5 shadow-sm" style={{ minWidth: '150px' }}>
                                <ArrowUpDown size={12} className="text-primary me-1.5 flex-shrink-0" />
                                <select
                                    className="bg-transparent border-0 text-main shadow-none w-100 p-0 fw-bold cursor-pointer"
                                    style={{ fontSize: '0.72rem', outline: 'none' }}
                                    value={cardSort}
                                    onChange={(e) => setCardSort(e.target.value)}
                                    title="Sort Cards"
                                >
                                    <option value="name-asc" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>SORT: Name (A-Z)</option>
                                    <option value="name-desc" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>SORT: Name (Z-A)</option>
                                    <option value="newest" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>SORT: Newest</option>
                                </select>
                            </div>

                            {/* FILTER */}
                            <div className={`figma-pass-control-pill px-2.5 shadow-sm ${cardMembershipFilter !== 'all' ? 'border-primary' : ''}`} style={{ minWidth: '140px' }}>
                                <Filter size={12} className={`me-1.5 flex-shrink-0 ${cardMembershipFilter !== 'all' ? 'text-primary' : 'text-muted'}`} />
                                <select
                                    className="bg-transparent border-0 text-main shadow-none w-100 p-0 fw-bold cursor-pointer"
                                    style={{ fontSize: '0.72rem', outline: 'none' }}
                                    value={cardMembershipFilter}
                                    onChange={(e) => setCardMembershipFilter(e.target.value)}
                                    title="Filter by Tier"
                                >
                                    <option value="all" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Tier: All Tiers</option>
                                    <option value="VIP" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>VIP Elite</option>
                                    <option value="Prime" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Prime Member</option>
                                    <option value="Regular" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Volunteers</option>
                                    <option value="Administrative" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Administrative</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {!selectedPreviewCard ? (
                        <div className="table-responsive rounded-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                            <table className="table table-hover align-middle mb-0" style={{ width: '100%', minWidth: '560px' }}>
                                <colgroup>
                                    <col style={{ width: '110px' }} />
                                    <col style={{ width: '180px' }} />
                                    <col style={{ width: '110px' }} />
                                    <col style={{ width: '80px' }} />
                                    <col style={{ width: '100px' }} />
                                    <col />
                                </colgroup>
                                <thead>
                                    <tr className="text-muted" style={{ fontSize: '0.72rem' }}>
                                        <th className="border-0 bg-transparent py-2 ps-2">CARD ID</th>
                                        <th className="border-0 bg-transparent py-2 px-1">ISSUED TO</th>
                                        <th className="border-0 bg-transparent py-2 px-1">CATEGORY</th>
                                        <th className="border-0 bg-transparent py-2 px-1 text-center">GROUP</th>
                                        <th className="border-0 bg-transparent py-2 px-1">ACTION</th>
                                        <th className="border-0 bg-transparent py-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="text-main">
                                    {!Array.isArray(filteredCards) || filteredCards.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="border-0 p-0">
                                                <div className="figma-pass-empty-state">
                                                    <div className="figma-pass-empty-icon">
                                                        <CreditCard size={28} />
                                                    </div>
                                                    <h6 className="fw-extrabold text-main mb-1" style={{ fontSize: '0.95rem' }}>No Member Passes Issued Yet</h6>
                                                    <p className="text-muted extra-tiny mb-3" style={{ maxWidth: '340px' }}>
                                                        Design personalized VIP, Prime, or Volunteer passes with high-security visual authentication.
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setCardFormData({
                                                                ...cardFormData,
                                                                name: '',
                                                                address: '',
                                                                membershipType: 'Regular',
                                                                cardColor: '#1e293b',
                                                                backgroundImage: 'none',
                                                                familyMembers: 0,
                                                                fromDate: activeFestival?.startDate ? new Date(activeFestival.startDate).toISOString().split('T')[0] : '',
                                                                toDate: activeFestival?.endDate ? new Date(activeFestival.endDate).toISOString().split('T')[0] : '',
                                                                festOrEventName: activeFestival?.title || '',
                                                                entityName: activeFestival?.entityName || ''
                                                            })
                                                            setEditingCardId(null)
                                                            setIsCardAdding(true)
                                                        }}
                                                        className="figma-btn-create-pass"
                                                    >
                                                        <Plus size={14} /> Create First Pass
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCards.map((sub, index) => {
                                            const isEven = index % 2 === 0;
                                            const rowBg = isEven ? 'rgba(67,130,149,0.07)' : 'rgba(224,122,67,0.07)';
                                            const tierClass = sub.membershipType === 'Admin' || sub.membershipType === 'Administrative'
                                                ? 'tier-admin'
                                                : sub.membershipType === 'VIP'
                                                ? 'tier-vip'
                                                : sub.membershipType === 'Prime'
                                                ? 'tier-prime'
                                                : 'tier-volunteers';
                                            return (
                                                <tr key={sub.cardId} className="align-middle transition-all" style={{ backgroundColor: rowBg }}>
                                                    <td className="border-0 py-2 ps-2 pe-1">
                                                        <span className="badge bg-secondary bg-opacity-10 text-muted font-monospace" style={{ fontSize: '0.7rem' }}>{sub.cardId}</span>
                                                    </td>
                                                    <td className="border-0 py-2 px-1 pe-2 fw-bold small" style={{ wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: '1.25' }}>
                                                        {sub.name}
                                                    </td>
                                                    <td className="border-0 py-2 px-1">
                                                        <span className={`figma-tier-badge ${tierClass}`}>
                                                            {sub.membershipType === 'Regular' ? 'Volunteers' : sub.membershipType}
                                                        </span>
                                                    </td>
                                                    <td className="border-0 py-2 px-1 text-center small fw-bold text-muted">{sub.familyMembers || 1}</td>
                                                    <td className="border-0 py-2 px-1">
                                                        <div className="d-flex align-items-center gap-1">
                                                            <button onClick={() => setSelectedPreviewCard(sub)} className="btn btn-sm text-primary p-0" title="Preview Pass"><Eye size={14} /></button>
                                                            <button onClick={() => downloadCardPDF(sub)} className="btn btn-sm text-info p-0" title="Download PDF"><FileDown size={14} /></button>
                                                            <button onClick={() => { setCardFormData(sub); setEditingCardId(sub.cardId); setIsCardAdding(true); }} className="btn btn-sm text-warning p-0" title="Edit Pass"><Edit3 size={14} /></button>
                                                            <button onClick={async () => { if (window.confirm('Delete this card?')) { await axios.delete(`/api/cards/${sub.cardId}`); fetchCards(); } }} className="btn btn-sm text-danger p-0" title="Delete Pass"><Trash2 size={14} /></button>
                                                        </div>
                                                    </td>
                                                    <td className="border-0 py-2"></td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-3 align-items-center justify-content-center p-3 glass-card-premium position-relative mx-auto" style={{ maxWidth: '420px' }}>
                            <button onClick={() => setSelectedPreviewCard(null)} className="btn btn-link position-absolute top-0 end-0 m-2 text-muted hover-text-white p-1">
                                <X size={18} />
                            </button>
                            <div className="text-center w-100 mb-1">
                                <h6 className="fw-bold text-main mb-0">{selectedPreviewCard.name}'s ID Pass</h6>
                                <span className="extra-tiny text-success">{selectedPreviewCard.membershipType === 'Regular' ? 'Volunteers' : selectedPreviewCard.membershipType} Tier</span>
                            </div>
                            <VIPCard
                                eventName={selectedPreviewCard.festOrEventName || "MIDNIGHT SUN"}
                                entityName={selectedPreviewCard.entityName || ""}
                                address={selectedPreviewCard.address || ""}
                                accessLevel={selectedPreviewCard.membershipType === 'Admin' ? 'ALL ACCESS' : 'VIP ACCESS ONLY'}
                                userName={selectedPreviewCard.name || "MEMBER"}
                                uid={selectedPreviewCard.cardId}
                                validDate={(selectedPreviewCard.fromDate && selectedPreviewCard.toDate) ? `${new Date(selectedPreviewCard.fromDate).toLocaleDateString()} - ${new Date(selectedPreviewCard.toDate).toLocaleDateString()}` : "FULL EVENT"}
                                tier={selectedPreviewCard.membershipType === 'Regular' ? 'Volunteers' : (selectedPreviewCard.membershipType || "Executive")}
                                familyMembers={selectedPreviewCard.familyMembers}
                            />
                            <div className="d-flex gap-2 justify-content-center w-100 bg-secondary bg-opacity-10 p-2 rounded-3 border border-secondary border-opacity-10 mt-1">
                                <button onClick={() => downloadCardPDF(selectedPreviewCard)} className="btn btn-premium flex-grow-1 py-1.5 px-3 rounded-pill d-flex align-items-center justify-content-center gap-1.5 shadow-sm" style={{ fontSize: '0.78rem' }} title="Download Card as PDF">
                                    <FileDown size={14} /> <span className="fw-bold">Download PDF</span>
                                </button>
                                <button onClick={() => {
                                    setCardFormData(selectedPreviewCard)
                                    setEditingCardId(selectedPreviewCard.cardId)
                                    setIsCardAdding(true)
                                }} className="btn btn-light text-primary p-1.5 rounded-circle shadow-sm" title="Edit Pass"><Edit3 size={14} /></button>
                                <button onClick={async () => {
                                    if (window.confirm('Delete this card?')) {
                                        await axios.delete(`/api/cards/${selectedPreviewCard.cardId}`)
                                        setSelectedPreviewCard(null)
                                        fetchCards()
                                    }
                                }} className="btn btn-light text-danger p-1.5 rounded-circle shadow-sm" title="Delete Pass"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'balanceSheet' && (() => {
                const totalCollection = (subscriptionsList || [])
                    .filter(s => ['Cash & Paid', 'Coupon or Token', 'Online'].includes(s.paymentType))
                    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)

                const totalDues = (subscriptionsList || [])
                    .filter(s => s.paymentType === 'Due')
                    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)

                const totalExpenses = (expensesList || [])
                    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)

                const netBalance = totalCollection - totalExpenses
                const cashPaidAmt = subscriptionsList.filter(s => s.paymentType === 'Cash & Paid').reduce((a, b) => a + (Number(b.amount) || 0), 0)
                const onlineAmt = subscriptionsList.filter(s => s.paymentType === 'Online').reduce((a, b) => a + (Number(b.amount) || 0), 0)
                const couponAmt = subscriptionsList.filter(s => s.paymentType === 'Coupon or Token').reduce((a, b) => a + (Number(b.amount) || 0), 0)

                return (
                    <div className="py-2 animate-in">
                        {/* Figma Modern Financial Header */}
                        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                            <div className="d-flex align-items-center gap-3">
                                <div className="figma-finance-header-emblem">
                                    <TrendingUp size={22} />
                                </div>
                                <div>
                                    <h4 className="fw-extrabold mb-0 text-main" style={{ letterSpacing: '-0.02em' }}>Financial Overview</h4>
                                    <p className="text-muted extra-tiny mb-0">
                                        Comprehensive audit ledger for <span className="text-primary fw-bold">{activeFestival?.title}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className="figma-pass-count-pill shadow-xs">
                                    <Sparkles size={11} /> Real-Time Ledger
                                </span>
                                <button onClick={downloadBalanceSheetPDF} className="figma-btn-download-sheet" title="Download BalanceSheet PDF">
                                    <FileDown size={15} /> BalanceSheet Pdf Download
                                </button>
                                <button onClick={() => setIsDataOpen(true)} className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1.5 px-3 rounded-pill fw-bold shadow-sm" style={{ height: '38px', fontSize: '0.74rem' }} title="Open DATA Reports Hub">
                                    <Download size={14} /> DATA Reports
                                </button>
                            </div>
                        </div>

                        {/* 4 Bento KPI Metric Cards */}
                        <div className="row g-3 g-xl-4">
                            {/* Card 1: Total Collection */}
                            <div className="col-12 col-sm-6 col-xl-3">
                                <div className="figma-finance-card card-collection">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="figma-pass-label mb-0">Total Collection</span>
                                        <div className="figma-finance-icon-box icon-collection">
                                            <Wallet size={18} />
                                        </div>
                                    </div>
                                    <div className="figma-finance-value text-success">
                                        ₹{totalCollection.toLocaleString()}
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between mt-auto pt-2 border-top border-secondary border-opacity-10">
                                        <span className="extra-tiny text-muted fw-bold">Verified Revenue</span>
                                        <span className="figma-finance-tag" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                                            <CheckCircle size={10} /> Inflow
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Total Dues */}
                            <div className="col-12 col-sm-6 col-xl-3">
                                <div className="figma-finance-card card-dues">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="figma-pass-label mb-0">Total Dues</span>
                                        <div className="figma-finance-icon-box icon-dues">
                                            <Clock size={18} />
                                        </div>
                                    </div>
                                    <div className="figma-finance-value text-warning">
                                        ₹{totalDues.toLocaleString()}
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between mt-auto pt-2 border-top border-secondary border-opacity-10">
                                        <span className="extra-tiny text-muted fw-bold">Pending Clearance</span>
                                        <span className="figma-finance-tag" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
                                            Pending
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Total Expenses */}
                            <div className="col-12 col-sm-6 col-xl-3">
                                <div className="figma-finance-card card-expenses">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="figma-pass-label mb-0">Total Expenses</span>
                                        <div className="figma-finance-icon-box icon-expenses">
                                            <Receipt size={18} />
                                        </div>
                                    </div>
                                    <div className="figma-finance-value text-danger">
                                        ₹{totalExpenses.toLocaleString()}
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between mt-auto pt-2 border-top border-secondary border-opacity-10">
                                        <span className="extra-tiny text-muted fw-bold">Resource Spending</span>
                                        <span className="figma-finance-tag" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                                            <ArrowUpRight size={10} /> Outflow
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 4: Net Balance */}
                            <div className="col-12 col-sm-6 col-xl-3">
                                <div className="figma-finance-card card-balance">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="figma-pass-label mb-0">Net Balance</span>
                                        <div className="figma-finance-icon-box icon-balance">
                                            <Scale size={18} />
                                        </div>
                                    </div>
                                    <div className={`figma-finance-value ${netBalance >= 0 ? 'text-primary' : 'text-danger'}`}>
                                        ₹{netBalance.toLocaleString()}
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between mt-auto pt-2 border-top border-secondary border-opacity-10">
                                        <span className="extra-tiny text-muted fw-bold">Profit/Loss Margin</span>
                                        <span className="figma-finance-tag" style={{ background: netBalance >= 0 ? 'rgba(59, 130, 246, 0.12)' : 'rgba(239, 68, 68, 0.12)', color: netBalance >= 0 ? '#3b82f6' : '#ef4444' }}>
                                            {netBalance >= 0 ? 'Surplus' : 'Deficit'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Figma Detailed Breakdown Canvas */}
                        <div className="figma-breakdown-card">
                            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                                <div>
                                    <h5 className="fw-extrabold mb-1 text-main" style={{ letterSpacing: '-0.02em' }}>Detailed Breakdown</h5>
                                    <p className="text-muted extra-tiny mb-0">Itemized comparative audit between inflow sources and expense allocations.</p>
                                </div>
                                <button onClick={downloadBalanceSheetPDF} className="figma-btn-download-sheet" title="Download BalanceSheet PDF">
                                    <FileDown size={14} /> BalanceSheet Pdf Download
                                </button>
                            </div>
                            <div className="row g-4">
                                {/* Left Column: Subscription Income */}
                                <div className="col-12 col-lg-6">
                                    <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-secondary border-opacity-15">
                                        <span className="figma-pass-label mb-0 text-success">
                                            <ArrowDownRight size={13} className="text-success" /> SUBSCRIPTION INCOME
                                        </span>
                                        <span className="extra-tiny text-muted fw-bold">3 Inflow Channels</span>
                                    </div>
                                    <div className="figma-ledger-row">
                                        <span className="d-flex align-items-center gap-2 extra-tiny fw-bold">
                                            <Banknote size={14} className="text-success" /> Cash &amp; Paid:
                                        </span>
                                        <span className="fw-extrabold text-success font-monospace" style={{ fontSize: '0.86rem' }}>
                                            ₹{cashPaidAmt.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="figma-ledger-row">
                                        <span className="d-flex align-items-center gap-2 extra-tiny fw-bold">
                                            <CreditCard size={14} className="text-info" /> Online Payments:
                                        </span>
                                        <span className="fw-extrabold text-info font-monospace" style={{ fontSize: '0.86rem' }}>
                                            ₹{onlineAmt.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="figma-ledger-row">
                                        <span className="d-flex align-items-center gap-2 extra-tiny fw-bold">
                                            <Tag size={14} className="text-warning" /> Coupon / Token:
                                        </span>
                                        <span className="fw-extrabold text-muted font-monospace" style={{ fontSize: '0.86rem' }}>
                                            ₹{couponAmt.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="figma-ledger-total-box mt-3">
                                        <span className="fw-extrabold text-main extra-tiny uppercase tracking-wider">TOTAL INCOME</span>
                                        <span className="fw-extrabold text-success font-monospace" style={{ fontSize: '1.05rem' }}>
                                            ₹{totalCollection.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Right Column: Expense Categories */}
                                <div className="col-12 col-lg-6">
                                    <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-secondary border-opacity-15">
                                        <span className="figma-pass-label mb-0 text-danger">
                                            <Receipt size={13} className="text-danger" /> EXPENSE CATEGORIES
                                        </span>
                                        <span className="extra-tiny text-muted fw-bold">Categorized Outflows</span>
                                    </div>
                                    {festivalExpenseTypes.map(type => {
                                        const amt = expensesList.filter(e => e.expenseType === type).reduce((a, b) => a + (Number(b.amount) || 0), 0)
                                        if (amt === 0) return null
                                        return (
                                            <div key={type} className="figma-ledger-row">
                                                <span className="d-flex align-items-center gap-2 extra-tiny fw-bold text-capitalize">
                                                    <span className="p-1 rounded-circle bg-danger bg-opacity-10 d-inline-block" style={{ width: '6px', height: '6px' }}></span>
                                                    {type}:
                                                </span>
                                                <span className="fw-extrabold text-danger font-monospace" style={{ fontSize: '0.86rem' }}>
                                                    ₹{amt.toLocaleString()}
                                                </span>
                                            </div>
                                        )
                                    })}
                                    <div className="figma-ledger-total-box mt-3">
                                        <span className="fw-extrabold text-main extra-tiny uppercase tracking-wider">TOTAL EXPENSE</span>
                                        <span className="fw-extrabold text-danger font-monospace" style={{ fontSize: '1.05rem' }}>
                                            ₹{totalExpenses.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })()}

            {activeTab === 'activity_logs' && (
                <ActivityLogsView
                    sectionType="festival"
                    festOrEventName={activeFestival?.title || ''}
                    activeTitle={activeFestival?.title || ''}
                />
            )}

            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-overlay modal-overlay-light position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 99999 }}>
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.95, opacity: 0 }} 
                            className="luxury-modal-card w-100 p-3 p-sm-4 shadow-2xl" 
                            style={{ maxWidth: '820px', maxHeight: '92vh', overflowY: 'auto' }}
                        >
                            {/* Modal Header */}
                            <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom" style={{ borderColor: 'var(--glass-border)' }}>
                                <div className="d-flex align-items-center gap-3">
                                    <div className="d-flex align-items-center justify-content-center rounded-3 shadow-sm flex-shrink-0" style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, var(--palette-terracotta), var(--palette-rust))', color: '#ffffff' }}>
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <h2 className="fw-bold mb-0" style={{ fontSize: '1.25rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                                            {editingFest ? 'Configure Festival' : 'Initiate New Festival'}
                                        </h2>
                                        <p className="mb-0 text-muted extra-tiny">Define core parameters for the upcoming grand celebration.</p>
                                    </div>
                                </div>
                                <button 
                                    type="button"
                                    onClick={closeModal} 
                                    className="btn btn-close-custom rounded-circle p-2 border shadow-sm hover-scale" 
                                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--glass-border)' }} 
                                    aria-label="Close"
                                >
                                    <X size={18} style={{ color: 'var(--text-main)' }} />
                                </button>
                            </div>

                            {/* Responsive 12-Column Unified Form Grid */}
                            <form onSubmit={handleSubmit}>
                                <div className="row g-3 mb-3">
                                    {/* Festival Title */}
                                    <div className="col-12 col-md-8">
                                        <label className="luxury-label mb-1">
                                            <Tag size={12} className="text-muted" /> Festival Title
                                        </label>
                                        <div className="luxury-input-wrapper">
                                            <div className="luxury-icon-box">
                                                <Sparkles size={16} />
                                            </div>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Chhath Puja, Durga Puja, Tomorrowland" 
                                                value={formData.title} 
                                                onChange={e => setFormData({ ...formData, title: e.target.value })} 
                                                className="luxury-input-field fw-bold" 
                                                required 
                                            />
                                        </div>
                                    </div>

                                    {/* Country */}
                                    <div className="col-12 col-md-4">
                                        <label className="luxury-label mb-1">
                                            <Globe size={12} className="text-muted" /> Country
                                        </label>
                                        <div className="luxury-input-wrapper">
                                            <div className="luxury-icon-box">
                                                <Globe size={16} />
                                            </div>
                                            <select
                                                value={formData.country}
                                                onChange={e => {
                                                    const newCountry = e.target.value;
                                                    setFormData({
                                                        ...formData,
                                                        country: newCountry,
                                                        category: countryData[newCountry] ? countryData[newCountry][0] : 'Cultural'
                                                    });
                                                }}
                                                className="luxury-input-field fw-semibold"
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {Object.keys(countryData).map(c => (
                                                    <option key={c} value={c} style={{ backgroundColor: 'var(--secondary-bg)', color: 'var(--text-main)' }}>
                                                        {c}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Entity */}
                                    <div className="col-12 col-md-6">
                                        <label className="luxury-label mb-1">
                                            <ShieldCheck size={12} className="text-muted" /> Entity / Organization
                                        </label>
                                        <div className="luxury-input-wrapper">
                                            <div className="luxury-icon-box">
                                                <ShieldCheck size={16} />
                                            </div>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Sakaripara Committee, Trust, Club" 
                                                value={formData.entityName} 
                                                onChange={e => setFormData({ ...formData, entityName: e.target.value })} 
                                                className="luxury-input-field" 
                                            />
                                        </div>
                                    </div>

                                    {/* Category */}
                                    <div className="col-12 col-md-6">
                                        <label className="luxury-label mb-1">
                                            <Tag size={12} className="text-muted" /> Category
                                        </label>
                                        <div className="luxury-input-wrapper">
                                            <div className="luxury-icon-box">
                                                <Tag size={16} />
                                            </div>
                                            <select 
                                                value={formData.category} 
                                                onChange={e => setFormData({ ...formData, category: e.target.value })} 
                                                className="luxury-input-field fw-semibold"
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {(countryData[formData.country] || ['Cultural', 'Music', 'Arts', 'Religious']).map(cat => (
                                                    <option key={cat} value={cat} style={{ backgroundColor: 'var(--secondary-bg)', color: 'var(--text-main)' }}>
                                                        {cat}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Location / Venue */}
                                    <div className="col-12 col-md-6">
                                        <label className="luxury-label mb-1">
                                            <MapPin size={12} className="text-muted" /> Location / Venue
                                        </label>
                                        <div className="luxury-input-wrapper">
                                            <div className="luxury-icon-box">
                                                <MapPin size={16} />
                                            </div>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. 1 No. Sakaripara, City, Ground" 
                                                value={formData.location} 
                                                onChange={e => setFormData({ ...formData, location: e.target.value })} 
                                                className="luxury-input-field" 
                                                required 
                                            />
                                        </div>
                                    </div>

                                    {/* Start Date */}
                                    <div className="col-6 col-md-3">
                                        <label className="luxury-label mb-1">
                                            <Calendar size={12} className="text-muted" /> Start Date
                                        </label>
                                        <div className="luxury-input-wrapper">
                                            <div className="luxury-icon-box">
                                                <Calendar size={16} />
                                            </div>
                                            <input 
                                                type="date" 
                                                value={formData.startDate} 
                                                onChange={e => setFormData({ ...formData, startDate: e.target.value })} 
                                                className="luxury-input-field" 
                                                required 
                                            />
                                        </div>
                                    </div>

                                    {/* End Date */}
                                    <div className="col-6 col-md-3">
                                        <label className="luxury-label mb-1">
                                            <Calendar size={12} className="text-muted" /> End Date
                                        </label>
                                        <div className="luxury-input-wrapper">
                                            <div className="luxury-icon-box">
                                                <Calendar size={16} />
                                            </div>
                                            <input 
                                                type="date" 
                                                value={formData.endDate} 
                                                onChange={e => setFormData({ ...formData, endDate: e.target.value })} 
                                                className="luxury-input-field" 
                                                required 
                                            />
                                        </div>
                                    </div>

                                    {/* Spotlight on Home Switch */}
                                    <div className="col-12">
                                        <div className="d-flex align-items-center justify-content-between p-3 rounded-3 border" style={{ background: formData.isLive ? 'rgba(245, 158, 11, 0.08)' : 'var(--input-bg)', borderColor: formData.isLive ? '#f59e0b' : 'var(--glass-border)' }}>
                                            <div className="d-flex align-items-center gap-2.5">
                                                <div className={`p-2 rounded-circle ${formData.isLive ? 'bg-warning text-dark shadow-sm' : 'bg-secondary bg-opacity-10 text-muted'}`}>
                                                    <Sparkles size={16} />
                                                </div>
                                                <div>
                                                    <div className="fw-bold text-main d-flex align-items-center gap-2" style={{ fontSize: '0.88rem' }}>
                                                        <span>Spotlight Celebration on Home Tab</span>
                                                        {formData.isLive && (
                                                            <span className="badge bg-warning text-dark rounded-pill extra-tiny px-2 py-0.5 fw-bold">
                                                                ✨ CELEBRATING NOW
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-muted extra-tiny">
                                                        When active, visitors on the Home page will see this grand festival highlighted under "{formData.entityName || 'your entity'}" from {formData.startDate || 'start'} to {formData.endDate || 'end'}.
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="form-check form-switch m-0 fs-5">
                                                <input 
                                                    className="form-check-input cursor-pointer" 
                                                    type="checkbox" 
                                                    role="switch"
                                                    id="festIsLiveSwitch"
                                                    checked={Boolean(formData.isLive)} 
                                                    onChange={e => setFormData({ ...formData, isLive: e.target.checked })} 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="col-12">
                                        <label className="luxury-label mb-1">
                                            <Sparkles size={12} className="text-muted" /> Description &amp; Highlights
                                        </label>
                                        <div className="luxury-input-wrapper align-items-start py-2">
                                            <div className="luxury-icon-box mt-1">
                                                <Sparkles size={16} />
                                            </div>
                                            <textarea 
                                                placeholder="Enter celebration details, rituals, schedules, highlights..." 
                                                rows="3" 
                                                className="luxury-input-field" 
                                                style={{ resize: 'vertical', minHeight: '75px' }}
                                                value={formData.description} 
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Actions */}
                                <div className="col-12 mt-4 pt-3 border-top" style={{ borderColor: 'var(--glass-border)' }}>
                                    <div className="d-flex flex-column-reverse flex-sm-row justify-content-end align-items-stretch align-items-sm-center gap-3">
                                        <button 
                                            type="button" 
                                            onClick={closeModal} 
                                            className="btn-luxury-cancel"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="btn-luxury-submit"
                                        >
                                            <Save size={18} />
                                            <span>{editingFest ? 'Update Festival' : 'Deploy New Festival'}</span>
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isSubAdding && (
                    <div className="modal-overlay modal-overlay-light position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 99999 }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="luxury-modal-card w-100 p-3 p-sm-4 shadow-2xl" style={{ maxWidth: '780px', maxHeight: '92vh', overflowY: 'auto' }}>
                            <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom" style={{ borderColor: 'var(--glass-border)' }}>
                                <div className="d-flex align-items-center gap-3">
                                    <div className="d-flex align-items-center justify-content-center rounded-3 shadow-sm flex-shrink-0" style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, var(--palette-terracotta), var(--palette-rust))', color: '#ffffff' }}>
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <h2 className="fw-bold mb-0" style={{ fontSize: '1.25rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                                            {editingSubId ? 'Modify Subscription' : 'New Subscription'}
                                        </h2>
                                        <p className="mb-0 text-muted extra-tiny">Secure membership protocol • Instant pass issuance</p>
                                    </div>
                                </div>
                                <button onClick={() => { setIsSubAdding(false); setEditingSubId(null); }} className="btn btn-close-custom rounded-circle p-2 border shadow-sm hover-scale" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--glass-border)' }} aria-label="Close">
                                    <X size={18} style={{ color: 'var(--text-main)' }} />
                                </button>
                            </div>
                            
                            <form onSubmit={async (e) => {
                                e.preventDefault()
                                try {
                                    if (editingSubId) {
                                        await axios.put(`/api/subscriptions/${editingSubId}`, { ...subFormData, type: 'festival' })
                                    } else {
                                        const { _id, __v, createdAt, ...postData } = subFormData;
                                        await axios.post('/api/subscriptions', { ...postData, type: 'festival' })
                                    }
                                    toast.success(editingSubId ? 'Subscription updated successfully!' : 'Membership pass authorized!')
                                    fetchSubscriptions()
                                    setIsSubAdding(false)
                                    setEditingSubId(null)
                                    setSubFormData({
                                        date: new Date().toISOString().split('T')[0],
                                        subId: generateSubID(),
                                        name: '', address: '', contact: '', countryCode: '+91', amount: '', currency: '₹',
                                        paymentType: 'Cash & Paid', referenceName: '', membershipType: 'Non-Prime', cardColor: '#1e293b', clubOrOrg: '', festOrEventName: '', onlineParticulars: '', onlineReference: ''
                                    })
                                } catch (err) {
                                    toast.error(err.response?.data?.message || 'Error saving subscription')
                                }
                            }}>
                                <div className="row g-3 mb-3">
                                    {/* ID Field */}
                                    <div className="col-12 col-md-6">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <label className="luxury-label mb-0">ID (Auto-Generated)</label>
                                            {copiedSubId && <span className="extra-tiny fw-bold text-success animate-in fade-in">✓ Copied</span>}
                                        </div>
                                        <div className="luxury-input-wrapper">
                                            <div className="luxury-icon-box">
                                                <Fingerprint size={16} />
                                            </div>
                                            <input type="text" className="luxury-input-field fw-bold font-monospace" style={{ letterSpacing: '1.5px' }} value={subFormData.subId} readOnly />
                                            <button
                                                type="button"
                                                className="btn btn-link p-0 pe-1 text-decoration-none d-flex align-items-center gap-1"
                                                style={{ color: copiedSubId ? '#10b981' : 'var(--palette-terracotta)' }}
                                                onClick={() => {
                                                    navigator.clipboard.writeText(subFormData.subId);
                                                    setCopiedSubId(true);
                                                    setTimeout(() => setCopiedSubId(false), 2000);
                                                }}
                                                title="Copy ID"
                                            >
                                                {copiedSubId ? <Check size={15} className="text-success" /> : <Copy size={15} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Date Field */}
                                    <div className="col-12 col-md-6">
                                        <label className="luxury-label mb-1">Subscription Date</label>
                                        <div className="luxury-input-wrapper">
                                            <div className="luxury-icon-box">
                                                <Calendar size={16} />
                                            </div>
                                            <input type="date" className="luxury-input-field" value={subFormData.date} onChange={e => setSubFormData({ ...subFormData, date: e.target.value })} required />
                                        </div>
                                    </div>

                                    {/* Full Name */}
                                    <div className="col-12 col-md-6">
                                        <label className="luxury-label mb-1">Attendee Full Name</label>
                                        <div className="luxury-input-wrapper">
                                            <div className="luxury-icon-box">
                                                <User size={16} />
                                            </div>
                                            <input type="text" className="luxury-input-field" placeholder="Full legal name" value={subFormData.name} onChange={e => setSubFormData({ ...subFormData, name: e.target.value })} required />
                                        </div>
                                    </div>

                                    {/* Contact */}
                                    <div className="col-12 col-md-6">
                                        <label className="luxury-label mb-1">Secure Contact Node</label>
                                        <div className="luxury-input-wrapper">
                                            <div className="luxury-icon-box">
                                                <Phone size={16} />
                                            </div>
                                            <div className="d-flex align-items-center border-end pe-2 me-1" style={{ borderColor: 'var(--glass-border)' }}>
                                                <span className="me-1 extra-tiny">{subFormData.countryCode === '+91' ? '🇮🇳' : subFormData.countryCode === '+1' ? '🇺🇸' : subFormData.countryCode === '+44' ? '🇬🇧' : '🌐'}</span>
                                                <select className="border-0 bg-transparent fw-bold p-0 text-main extra-tiny outline-none" style={{ cursor: 'pointer' }} value={subFormData.countryCode} onChange={e => setSubFormData({ ...subFormData, countryCode: e.target.value })}>
                                                    {countryCodes.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                                </select>
                                            </div>
                                            <input type="tel" className="luxury-input-field" placeholder="Mobile / Phone number" value={subFormData.contact} onChange={e => setSubFormData({ ...subFormData, contact: e.target.value })} required />
                                        </div>
                                    </div>

                                    {/* Residence / Address */}
                                    <div className="col-12">
                                        <label className="luxury-label mb-1">Attendee Residence / Address</label>
                                        <div className="luxury-input-wrapper">
                                            <div className="luxury-icon-box">
                                                <MapPin size={16} />
                                            </div>
                                            <input type="text" className="luxury-input-field" placeholder="Street address, city, district, state..." value={subFormData.address} onChange={e => setSubFormData({ ...subFormData, address: e.target.value })} />
                                        </div>
                                    </div>

                                    {/* Subscription Tier */}
                                    <div className="col-12 col-md-6">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <label className="luxury-label mb-0">Subscription Tier</label>
                                            <span className="badge rounded-pill extra-tiny px-2 py-0.5" style={{
                                                fontSize: '0.65rem',
                                                background: subFormData.membershipType === 'VIP' ? 'rgba(245, 158, 11, 0.15)' : subFormData.membershipType === 'Prime' ? 'rgba(168, 85, 247, 0.15)' : subFormData.membershipType === 'Admin' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                                                color: subFormData.membershipType === 'VIP' ? '#d97706' : subFormData.membershipType === 'Prime' ? '#9333ea' : subFormData.membershipType === 'Admin' ? '#059669' : '#64748b',
                                                border: '1px solid currentColor'
                                            }}>
                                                {subFormData.membershipType === 'VIP' ? '★ VIP Privileges' : subFormData.membershipType === 'Prime' ? '✦ Prime Pass' : subFormData.membershipType === 'Admin' ? '🛡 Admin Protocol' : 'Standard'}
                                            </span>
                                        </div>
                                        <div className="luxury-input-wrapper">
                                            <div className="luxury-icon-box" style={{
                                                color: subFormData.membershipType === 'VIP' ? '#d97706' : subFormData.membershipType === 'Prime' ? '#9333ea' : subFormData.membershipType === 'Admin' ? '#059669' : 'var(--palette-terracotta)'
                                            }}>
                                                <Crown size={16} />
                                            </div>
                                            <select className="luxury-input-field fw-semibold" style={{ cursor: 'pointer' }} value={subFormData.membershipType} onChange={e => setSubFormData({ ...subFormData, membershipType: e.target.value })}>
                                                <option value="Prime">Prime Member</option>
                                                <option value="None">None</option>
                                                <option value="VIP">VIP Access</option>
                                                <option value="Admin">Administrative</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Financial Status */}
                                    <div className="col-12 col-md-6">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <label className="luxury-label mb-0">Financial Status</label>
                                            <span className="d-flex align-items-center gap-1 extra-tiny fw-bold" style={{
                                                fontSize: '0.65rem',
                                                color: subFormData.paymentType === 'Cash & Paid' ? '#10b981' : subFormData.paymentType === 'Due' ? '#ef4444' : subFormData.paymentType === 'Online' ? '#0ea5e9' : '#f59e0b'
                                            }}>
                                                <span className="rounded-circle d-inline-block" style={{ width: '6px', height: '6px', backgroundColor: 'currentColor' }}></span>
                                                {subFormData.paymentType}
                                            </span>
                                        </div>
                                        <div className="luxury-input-wrapper">
                                            <div className="luxury-icon-box" style={{ color: subFormData.paymentType === 'Cash & Paid' ? '#10b981' : subFormData.paymentType === 'Due' ? '#ef4444' : '#0ea5e9' }}>
                                                <ShieldCheck size={16} />
                                            </div>
                                            <select className="luxury-input-field fw-semibold" style={{ cursor: 'pointer' }} value={subFormData.paymentType} onChange={e => setSubFormData({ ...subFormData, paymentType: e.target.value })}>
                                                <option value="Cash & Paid">Cash &amp; Paid</option>
                                                <option value="Due">Due</option>
                                                <option value="Online">Online</option>
                                                <option value="Coupon or Token">Coupon or Token</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Transaction Amount with Full-Width Quick Presets */}
                                    <div className="col-12">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <label className="luxury-label mb-0">Transaction Amount</label>
                                            <span className="extra-tiny text-muted fw-semibold" style={{ fontSize: '0.66rem' }}>Select Preset or Enter Amount</span>
                                        </div>
                                        <div className="luxury-input-wrapper mb-2">
                                            <div className="luxury-icon-box">
                                                <CreditCard size={16} />
                                            </div>
                                            <div className="d-flex align-items-center border-end pe-2 me-1" style={{ borderColor: 'var(--glass-border)' }}>
                                                <select className="border-0 bg-transparent fw-bold p-0 text-main extra-tiny outline-none" style={{ cursor: 'pointer' }} value={subFormData.currency} onChange={e => setSubFormData({ ...subFormData, currency: e.target.value })}>
                                                    {currencies.map(c => <option key={c.code} value={c.symbol}>{c.symbol} ({c.code})</option>)}
                                                </select>
                                            </div>
                                            <input type="number" step="any" className="luxury-input-field fw-bold" placeholder="0.00" value={subFormData.amount} onChange={e => setSubFormData({ ...subFormData, amount: e.target.value })} required />
                                        </div>
                                        <div className="d-flex flex-wrap align-items-center pt-1" style={{ gap: '6px' }}>
                                            {[101, 201, 251, 301, 501, 1100, 2100, 5100, 11000].map(amt => {
                                                const curr = subFormData.currency || '₹';
                                                const isSelected = subFormData.amount == amt;
                                                return (
                                                    <button
                                                        key={amt}
                                                        type="button"
                                                        onClick={() => setSubFormData({ ...subFormData, amount: amt.toString() })}
                                                        className={`luxury-preset-chip ${isSelected ? 'active' : ''}`}
                                                    >
                                                        {curr}{amt.toLocaleString('en-IN')}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {subFormData.paymentType === 'Online' && (
                                    <div className="col-12 p-3 mb-3 rounded-3 border border-info border-opacity-25 bg-info bg-opacity-10 shadow-sm animate-in zoom-in duration-300">
                                        <h6 className="fw-bold text-info mb-2 d-flex align-items-center gap-2" style={{ fontSize: '0.78rem' }}><Zap size={14} /> Digital Payment Details</h6>
                                        <div className="row g-2">
                                            <div className="col-md-6">
                                                <label className="luxury-label text-info">Particulars / Bank Name</label>
                                                <input type="text" className="luxury-input-wrapper w-100 luxury-input-field px-3 py-1.5 border-info border-opacity-25" placeholder="e.g. HDFC Bank Transfer" value={subFormData.onlineParticulars || ''} onChange={e => setSubFormData({ ...subFormData, onlineParticulars: e.target.value })} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="luxury-label text-info">Transaction Reference No.</label>
                                                <input type="text" className="luxury-input-wrapper w-100 luxury-input-field px-3 py-1.5 border-info border-opacity-25 font-monospace" placeholder="e.g. UTR / Ref Number" value={subFormData.onlineReference || ''} onChange={e => setSubFormData({ ...subFormData, onlineReference: e.target.value })} required />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="col-12 mt-4 pt-3 border-top" style={{ borderColor: 'var(--glass-border)' }}>
                                    <div className="d-flex flex-column-reverse flex-sm-row justify-content-end align-items-stretch align-items-sm-center gap-3">
                                        <button 
                                            type="button" 
                                            onClick={() => { setIsSubAdding(false); setEditingSubId(null); }} 
                                            className="btn-luxury-cancel"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="btn-luxury-submit"
                                        >
                                            <Lock size={17} />
                                            <span>{editingSubId ? 'Confirm & Update' : 'Authorize & Save Membership'}</span>
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isCardAdding && (
                    <div className="modal-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center py-3 px-2 px-sm-3" style={{ background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(16px)', zIndex: 99999 }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="figma-pass-modal-card w-100 mx-auto p-3 p-sm-4 my-auto">
                            {/* Header */}
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="figma-pass-emblem me-1" style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px', borderRadius: '10px' }}>
                                        <Sparkles size={18} />
                                    </div>
                                    <div>
                                        <h5 className="fw-extrabold mb-0 text-main" style={{ letterSpacing: '-0.02em', fontSize: '1.15rem' }}>
                                            {editingCardId ? 'Configure' : 'Design'} Member Pass
                                        </h5>
                                        <p className="extra-tiny text-muted mb-0">Customize visual identity, tier permissions, and validity.</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => { setIsCardAdding(false); setEditingCardId(null); }} className="btn btn-sm p-1.5 rounded-circle bg-secondary bg-opacity-10 text-muted hover-text-main border-0">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Responsive 2-Column Body on Laptop/Desktop (No Scroll), Single-Column on Mobile */}
                            <form onSubmit={async (e) => {
                                e.preventDefault()
                                try {
                                    if (editingCardId) {
                                        await axios.put(`/api/cards/${editingCardId}`, { ...cardFormData, type: 'festival' })
                                    } else {
                                        const { _id, __v, createdAt, ...postData } = cardFormData;
                                        await axios.post('/api/cards', { ...postData, type: 'festival' })
                                    }
                                    await fetchCards()
                                    setIsCardAdding(false)
                                    setEditingCardId(null)
                                    setActiveTab('card')
                                } catch (err) {
                                    const errMsg = err.response?.data?.message || err.message || 'Unknown error';
                                    alert('Error saving card: ' + errMsg)
                                }
                            }}>
                                <div className="row g-3 g-lg-4 align-items-center">
                                    {/* Left Column: Live Pass Preview Pedestal */}
                                    <div className="col-12 col-lg-5">
                                        <div className="figma-pass-stage h-100 p-3 mb-2 mb-lg-0">
                                            <span className="figma-pass-stage-tag shadow-xs mb-2">
                                                <Sparkles size={10} /> LIVE PASS IDENTITY PREVIEW
                                            </span>
                                            <div className="w-100 d-flex justify-content-center py-1">
                                                <VIPCard
                                                    compact={true}
                                                    eventName={cardFormData.festOrEventName || "PREVIEW MODE"}
                                                    entityName={cardFormData.entityName || "ENTITY BRANDING"}
                                                    address={cardFormData.address || "LOCATION DETAILS"}
                                                    accessLevel={cardFormData.membershipType === 'Admin' ? 'ALL ACCESS' : 'VIP ACCESS ONLY'}
                                                    userName={cardFormData.name || "MEMBER NAME"}
                                                    uid={cardFormData.cardId || "DESIGN-ID"}
                                                    validDate={(cardFormData.fromDate && cardFormData.toDate) ? `${new Date(cardFormData.fromDate).toLocaleDateString()} - ${new Date(cardFormData.toDate).toLocaleDateString()}` : "VALIDITY PERIOD"}
                                                    tier={cardFormData.membershipType || "Executive"}
                                                    familyMembers={cardFormData.familyMembers}
                                                />
                                            </div>
                                            <div className="text-center mt-2 px-2">
                                                <span className="extra-tiny text-white-50" style={{ fontSize: '0.67rem', letterSpacing: '0.2px' }}>
                                                    ✦ Synchronized canvas renders credentials in real-time
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Form Inputs & Action Buttons */}
                                    <div className="col-12 col-lg-7">
                                        <div className="row g-2">
                                            {/* Smart Fetch Strategy */}
                                            <div className="col-12 col-sm-6">
                                                <label className="figma-pass-label"><Search size={11} /> Smart Fetch Strategy</label>
                                                <div className="figma-pass-input-box">
                                                    <input
                                                        type="text"
                                                        placeholder="Scan / Enter Pass ID..."
                                                        onKeyDown={async (e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault()
                                                                try {
                                                                    const res = await axios.get(`/api/subscriptions/search/${e.target.value}`)
                                                                    if (res.data) {
                                                                        const fest = festivals.find(f => f.title === res.data.festOrEventName)
                                                                        setCardFormData({
                                                                            ...cardFormData,
                                                                            cardId: res.data.subId || cardFormData.cardId,
                                                                            name: res.data.name,
                                                                            address: fest?.location || res.data.address || '',
                                                                            entityName: res.data.entityName || '',
                                                                            festOrEventName: res.data.festOrEventName || ''
                                                                        })
                                                                    }
                                                                } catch (err) {
                                                                    alert('Subscription ID not recognized')
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    <button type="button" className="figma-btn-sync" onClick={async (e) => {
                                                        const subId = e.target.parentElement.querySelector('input').value
                                                        try {
                                                            const res = await axios.get(`/api/subscriptions/search/${subId}`)
                                                            if (res.data) {
                                                                const fest = festivals.find(f => f.title === res.data.festOrEventName)
                                                                setCardFormData({
                                                                    ...cardFormData,
                                                                    cardId: res.data.subId || cardFormData.cardId,
                                                                    name: res.data.name,
                                                                    address: fest?.location || res.data.address || '',
                                                                    entityName: res.data.entityName || '',
                                                                    festOrEventName: res.data.festOrEventName || ''
                                                                })
                                                            }
                                                        } catch (err) {
                                                            alert('Record not found')
                                                        }
                                                    }}>Sync</button>
                                                </div>
                                            </div>

                                            {/* Physical Address / Location */}
                                            <div className="col-12 col-sm-6">
                                                <label className="figma-pass-label"><MapPin size={11} /> Physical Address / Location</label>
                                                <div className="figma-pass-input-box">
                                                    <input type="text" placeholder="Complete address detail" value={cardFormData.address} onChange={e => setCardFormData({ ...cardFormData, address: e.target.value })} />
                                                </div>
                                            </div>

                                            {/* Member Identity */}
                                            <div className="col-12 col-sm-6">
                                                <label className="figma-pass-label"><User size={11} /> Member Identity</label>
                                                <div className="figma-pass-input-box">
                                                    <input type="text" placeholder="Display name on card" value={cardFormData.name} onChange={e => setCardFormData({ ...cardFormData, name: e.target.value })} required />
                                                </div>
                                            </div>

                                            {/* Festival Context */}
                                            <div className="col-12 col-sm-6">
                                                <label className="figma-pass-label"><Sparkles size={11} /> Festival Context</label>
                                                <div className="figma-pass-input-box">
                                                    <input type="text" placeholder="Primary festival title" value={cardFormData.festOrEventName} onChange={e => setCardFormData({ ...cardFormData, festOrEventName: e.target.value })} />
                                                </div>
                                            </div>

                                            {/* Entity Branding */}
                                            <div className="col-12 col-sm-6">
                                                <label className="figma-pass-label"><Building2 size={11} /> Entity Branding</label>
                                                <div className="figma-pass-input-box">
                                                    <input type="text" placeholder="e.g. Sakaripara Entity" value={cardFormData.entityName} onChange={e => setCardFormData({ ...cardFormData, entityName: e.target.value })} />
                                                </div>
                                            </div>

                                            {/* Access Level */}
                                            <div className="col-12 col-sm-6">
                                                <label className="figma-pass-label"><Crown size={11} /> Access Level</label>
                                                <div className="figma-pass-input-box">
                                                    <select value={cardFormData.membershipType} onChange={e => setCardFormData({ ...cardFormData, membershipType: e.target.value })}>
                                                        <option value="Regular" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Volunteers</option>
                                                        <option value="Prime" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Prime Member</option>
                                                        <option value="VIP" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>VIP Elite</option>
                                                        <option value="Admin" style={{ backgroundColor: '#1e4755', color: '#f0f9f8' }}>Administrator</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Group Size */}
                                            <div className="col-12 col-sm-4">
                                                <label className="figma-pass-label"><Layers size={11} /> Group Size</label>
                                                <div className="figma-pass-input-box">
                                                    <input type="number" min="0" value={cardFormData.familyMembers} onChange={e => setCardFormData({ ...cardFormData, familyMembers: e.target.value })} />
                                                </div>
                                            </div>

                                            {/* Effective From */}
                                            <div className="col-6 col-sm-4">
                                                <label className="figma-pass-label"><Calendar size={11} /> Effective From</label>
                                                <div className="figma-pass-input-box">
                                                    <input type="date" value={cardFormData.fromDate} onChange={e => setCardFormData({ ...cardFormData, fromDate: e.target.value })} />
                                                </div>
                                            </div>

                                            {/* Expiry Date */}
                                            <div className="col-6 col-sm-4">
                                                <label className="figma-pass-label"><Calendar size={11} /> Expiry Date</label>
                                                <div className="figma-pass-input-box">
                                                    <input type="date" value={cardFormData.toDate} onChange={e => setCardFormData({ ...cardFormData, toDate: e.target.value })} />
                                                </div>
                                            </div>

                                            {/* Submit & Cancel Buttons */}
                                            <div className="col-12 mt-2 pt-2 border-top border-secondary border-opacity-15 d-flex gap-2">
                                                <button type="submit" className="figma-btn-generate-pass">
                                                    <Zap size={14} /> {editingCardId ? 'Authorize Card Updates' : 'Generate Digital Pass Identity'}
                                                </button>
                                                <button type="button" onClick={() => { setIsCardAdding(false); setEditingCardId(null); }} className="figma-btn-abort-pass">
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    )
}

export default Festivals
