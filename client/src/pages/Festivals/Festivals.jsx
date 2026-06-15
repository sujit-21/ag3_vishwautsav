import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, Calendar, Tag, Plus, Trash2, Edit3, X, Save, FileDown, MessageCircle, Zap, CheckCircle, History, Eye, Phone } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import VIPCard from '../../components/VIPCard'
import adminBg from '../../images/admin.jpg'
import primeBg from '../../images/primemember.jpg'
import regularBg from '../../images/regular.jpg'
import vipBg from '../../images/vip elite.jpg'

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
    if (paymentType === 'Cash & Paid') return 'Confirmed (Cash & Paid)';
    if (paymentType === 'Due') return 'Pending (Due Balance)';
    if (paymentType === 'Online') return 'Digital (Online Bank)';
    if (paymentType === 'Coupon or Token') return 'Coupon / Token Voucher';
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
    const [search, setSearch] = useState('')
    const [subSearch, setSubSearch] = useState('')
    const [expSearch, setExpSearch] = useState('')
    const [cardSearch, setCardSearch] = useState('')
    const [festivals, setFestivals] = useState([])
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
    const [activeTab, setActiveTab] = useState(activeFestival ? 'subscriptions' : 'festivals')
    const [subscriptionsList, setSubscriptionsList] = useState([])
    const [expensesList, setExpensesList] = useState([])
    const [isSubAdding, setIsSubAdding] = useState(false)
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
            const jspdfModule = await import('jspdf');
            const autoTableModule = await import('jspdf-autotable');
            const jsPDF = jspdfModule.default || jspdfModule.jsPDF || jspdfModule;
            const autoTable = autoTableModule.default || autoTableModule;

            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            const fest = festivals.find(f => f.title === sub.festOrEventName) || {};

            // === Branded Header Banner ===
            doc.setFillColor(15, 23, 42); // Private Slate
            doc.rect(0, 0, 210, 35, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('SUBSCRIPTION RECEIPT', 105, 18, { align: 'center' });

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(148, 163, 184); // Muted Slate
            doc.text(`PASS ID: ${sub.subId}`.toUpperCase(), 105, 26, { align: 'center' });
            doc.text(`ISSUED ON: ${sub.date ? new Date(sub.date).toLocaleDateString() : new Date().toLocaleDateString()}`, 105, 31, { align: 'center' });

            // === Section: Festival Data ===
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Festival Information', 14, 50);

            autoTable(doc, {
                startY: 55,
                body: [
                    ['Festival Name', sub.festOrEventName || '—'],
                    ['Location', fest.location || '—'],
                    ['Date', fest.startDate ? `${new Date(fest.startDate).toLocaleDateString()} - ${new Date(fest.endDate).toLocaleDateString()}` : '—'],
                    ['Entity', fest.entityName || '—'],
                    ['Category', fest.category || '—']
                ],
                theme: 'striped',
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
                styles: { fontSize: 9 }
            });

            // === Section: Attendee Data ===
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('ATTENDEE SUBSCRIPTION DETAILS', 14, (doc.lastAutoTable ? doc.lastAutoTable.finalY : 100) + 12);

            const attendeeBody = [
                ['Full Name', sub.name || '—'],
                ['Contact', `${sub.countryCode || ''} ${sub.contact || '—'}`],
                ['Address', sub.address || '—'],
                ['Tier / Class', getTierDisplayName(sub.membershipType)],
                ['Entity', sub.entityName || '—'],
                ['Status', getPaymentDisplayName(sub.paymentType)],
                ['Amount Net', `Rs. ${String(sub.amount || 0).replace(/[^0-9.]/g, '').trim()}`]
            ];

            if (sub.paymentType === 'Online') {
                if (sub.onlineParticulars) attendeeBody.push(['Bank / Particulars', sub.onlineParticulars]);
                if (sub.onlineReference) attendeeBody.push(['Reference No.', sub.onlineReference]);
            }

            autoTable(doc, {
                startY: (doc.lastAutoTable ? doc.lastAutoTable.finalY : 100) + 16,
                body: attendeeBody,
                theme: 'grid',
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40, fillColor: [248, 250, 252] } },
                styles: { fontSize: 9 },
                didParseCell: function(data) {
                    if (data.row.section === 'body' && data.column.index === 1) {
                        const rowKey = data.row.cells[0]?.text[0];
                        const cellVal = data.cell.text[0];
                        if (rowKey === 'Tier / Class') {
                            if (cellVal === 'Administrative') {
                                data.cell.styles.fillColor = [220, 252, 231];
                                data.cell.styles.textColor = [22, 101, 52];
                                data.cell.styles.fontStyle = 'bold';
                            } else if (cellVal === 'VIP Access') {
                                data.cell.styles.fillColor = [224, 242, 254];
                                data.cell.styles.textColor = [3, 105, 161];
                                data.cell.styles.fontStyle = 'bold';
                            } else if (cellVal === 'Prime Member') {
                                data.cell.styles.fillColor = [254, 243, 199];
                                data.cell.styles.textColor = [180, 83, 9];
                                data.cell.styles.fontStyle = 'bold';
                            } else {
                                data.cell.styles.fillColor = [241, 245, 249];
                                data.cell.styles.textColor = [71, 85, 105];
                            }
                        }
                        if (rowKey === 'Status') {
                            if (cellVal === 'Confirmed (Cash & Paid)') {
                                data.cell.styles.fillColor = [220, 252, 231];
                                data.cell.styles.textColor = [22, 101, 52];
                                data.cell.styles.fontStyle = 'bold';
                            } else if (cellVal === 'Pending (Due Balance)') {
                                data.cell.styles.fillColor = [254, 226, 226];
                                data.cell.styles.textColor = [153, 27, 27];
                                data.cell.styles.fontStyle = 'bold';
                            } else if (cellVal.startsWith('Digital') || cellVal.startsWith('Online')) {
                                data.cell.styles.fillColor = [224, 242, 254];
                                data.cell.styles.textColor = [3, 105, 161];
                                data.cell.styles.fontStyle = 'bold';
                            } else if (cellVal === 'Coupon / Token Voucher') {
                                data.cell.styles.fillColor = [254, 249, 195];
                                data.cell.styles.textColor = [133, 77, 14];
                                data.cell.styles.fontStyle = 'bold';
                            }
                        }
                    }
                }
            });

            // === Footer ===
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            const footerY = 285;
            doc.text('Thank you for your registration with Vishwa Utsav.', 105, footerY, { align: 'center' });
            doc.text('This is a computer-generated receipt.', 105, footerY + 5, { align: 'center' });

            doc.save(`Receipt_${sub.subId}_${(sub.name || 'attendee').replace(/\s+/g, '_')}.pdf`);
        } catch (err) {
            console.error('PDF Error:', err);
            alert('Error generating PDF report');
        }
    }

    const downloadExpensePDF = async (exp) => {
        try {
            const jspdfModule = await import('jspdf');
            const jsPDF = jspdfModule.default || jspdfModule.jsPDF || jspdfModule;
            const autoTableModule = await import('jspdf-autotable');
            const autoTable = autoTableModule.default || autoTableModule;

            const doc = new jsPDF()

            // === Modern Header ===
            doc.setFillColor(139, 92, 246) // Purple theme
            doc.rect(0, 0, 210, 35, 'F')

            doc.setFontSize(20)
            doc.setTextColor(255, 255, 255)
            doc.setFont('helvetica', 'bold')
            doc.text('EXPENSE VOUCHER', 105, 18, { align: 'center' })

            doc.setFontSize(9)
            doc.setTextColor(233, 213, 255)
            doc.text('Authorized Financial Record', 105, 25, { align: 'center' })

            const fest = festivals.find(f => f.title === exp.festOrEventName) || {};

            autoTable(doc, {
                startY: 40,
                head: [['DETAIL', 'DETAIL']],
                body: [
                    ['Voucher Ref', exp.expenseId],
                    ['Source', 'Festival Management'],
                    ['Festival Name', exp.festOrEventName || '—'],
                    ['Location', fest.location || '—'],
                    ['Entity', fest.entityName || '—'],
                    ['Expense Type', exp.expenseType],
                    ['Particulars', exp.particular],
                    ['Amount', `Rs. ${String(exp.amount).replace(/[^0-9.]/g, '')}`],
                    ['Date', new Date(exp.date).toLocaleDateString()]
                ],
                theme: 'striped',
                headStyles: { fillColor: [139, 92, 246], fontSize: 10, halign: 'center' },
                bodyStyles: { fontSize: 9 },
                alternateRowStyles: { fillColor: [245, 243, 255] }
            })

            doc.save(`Expense_${exp.expenseId}.pdf`)
        } catch (err) {
            console.error('PDF Error:', err)
            alert('Could not generate PDF')
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
            const jspdfModule = await import('jspdf');
            const autoTableModule = await import('jspdf-autotable');
            const jsPDF = jspdfModule.default || jspdfModule.jsPDF || jspdfModule;
            const autoTable = autoTableModule.default || autoTableModule;

            const doc = new jsPDF({ orientation: 'landscape' });
            doc.setFillColor(63, 81, 181); // Indigo
            doc.rect(0, 0, 297, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text(`ATTENDEE MASTER LIST: ${activeFestival?.title?.toUpperCase()}`, 148, 20, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`Generated on: ${new Date().toLocaleString()} | Entity: ${activeFestival?.entityName || 'Vishwa Utsav'}`, 148, 30, { align: 'center' });

            autoTable(doc, {
                startY: 45,
                head: [['Pass ID', 'Date', 'Name', 'Contact', 'Address', 'Amount', 'Payment', 'Tier']],
                body: subscriptionsList.map((s, i) => [
                    s.subId || s.cardId,
                    new Date(s.date).toLocaleDateString(),
                    s.name,
                    `${s.countryCode || ''} ${s.contact || ''}`,
                    s.address || '—',
                    `Rs. ${String(s.amount || 0).replace(/[^0-9.]/g, '')}`,
                    s.paymentType === 'Online' && s.onlineParticulars ? `Digital (Online Bank) (${s.onlineParticulars})` : getPaymentDisplayName(s.paymentType),
                    getTierDisplayName(s.membershipType)
                ]),
                theme: 'striped',
                headStyles: { fillColor: [63, 81, 181] },
                styles: { fontSize: 8 },
                didParseCell: function(data) {
                    if (data.row.section === 'body') {
                        if (data.column.index === 6) {
                            const val = data.cell.text[0];
                            if (val.startsWith('Confirmed') || val.startsWith('Cash & Paid')) {
                                data.cell.styles.fillColor = [220, 252, 231];
                                data.cell.styles.textColor = [22, 101, 52];
                                data.cell.styles.fontStyle = 'bold';
                            } else if (val.startsWith('Pending') || val.startsWith('Due')) {
                                data.cell.styles.fillColor = [254, 226, 226];
                                data.cell.styles.textColor = [153, 27, 27];
                                data.cell.styles.fontStyle = 'bold';
                            } else if (val.startsWith('Digital') || val.startsWith('Online')) {
                                data.cell.styles.fillColor = [224, 242, 254];
                                data.cell.styles.textColor = [3, 105, 161];
                                data.cell.styles.fontStyle = 'bold';
                            } else if (val.startsWith('Coupon') || val.startsWith('Token')) {
                                data.cell.styles.fillColor = [254, 249, 195];
                                data.cell.styles.textColor = [133, 77, 14];
                                data.cell.styles.fontStyle = 'bold';
                            }
                        }
                        if (data.column.index === 7) {
                            const val = data.cell.text[0];
                            if (val === 'Administrative') {
                                data.cell.styles.fillColor = [220, 252, 231];
                                data.cell.styles.textColor = [22, 101, 52];
                                data.cell.styles.fontStyle = 'bold';
                            } else if (val === 'VIP Access') {
                                data.cell.styles.fillColor = [224, 242, 254];
                                data.cell.styles.textColor = [3, 105, 161];
                                data.cell.styles.fontStyle = 'bold';
                            } else if (val === 'Prime Member') {
                                data.cell.styles.fillColor = [254, 243, 199];
                                data.cell.styles.textColor = [180, 83, 9];
                                data.cell.styles.fontStyle = 'bold';
                            } else {
                                data.cell.styles.fillColor = [241, 245, 249];
                                data.cell.styles.textColor = [71, 85, 105];
                            }
                        }
                    }
                }
            });

            doc.save(`Attendees_${activeFestival?.title?.replace(/\s+/g, '_')}.pdf`);
        } catch (err) { console.error(err); alert('PDF Failed'); }
    }

    const downloadAllExpensesPDF = async () => {
        try {
            const jspdfModule = await import('jspdf');
            const autoTableModule = await import('jspdf-autotable');
            const jsPDF = jspdfModule.default || jspdfModule.jsPDF || jspdfModule;
            const autoTable = autoTableModule.default || autoTableModule;

            const doc = new jsPDF();
            doc.setFillColor(225, 29, 72); // Rose
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text(`EXPENSE LEDGER: ${activeFestival?.title?.toUpperCase()}`, 105, 20, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`Generated on: ${new Date().toLocaleString()} | Audit Copy`, 105, 30, { align: 'center' });

            autoTable(doc, {
                startY: 45,
                head: [['Date', 'Voucher ID', 'Particulars', 'Type', 'Amount']],
                body: expensesList.map(e => [
                    new Date(e.date).toLocaleDateString(), e.expenseId, e.particular, e.expenseType, `Rs. ${String(e.amount || 0).replace(/[^0-9.]/g, '')}`
                ]),
                theme: 'grid',
                headStyles: { fillColor: [225, 29, 72] }
            });

            doc.save(`Expenses_${activeFestival?.title?.replace(/\s+/g, '_')}.pdf`);
        } catch (err) { console.error(err); alert('PDF Failed'); }
    }

    const downloadBalanceSheetPDF = async () => {
        try {
            const jspdfModule = await import('jspdf');
            const autoTableModule = await import('jspdf-autotable');
            const jsPDF = jspdfModule.default || jspdfModule.jsPDF || jspdfModule;
            const autoTable = autoTableModule.default || autoTableModule;

            const doc = new jsPDF();
            doc.setFillColor(16, 185, 129); // Emerald
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text(`BALANCE SHEET: ${activeFestival?.title?.toUpperCase()}`, 105, 20, { align: 'center' });

            const totalCollection = subscriptionsList.reduce((acc, s) => acc + (Number(String(s.amount || 0).replace(/[^0-9.]/g, '')) || 0), 0)
            const totalExpenses = expensesList.reduce((acc, e) => acc + (Number(String(e.amount || 0).replace(/[^0-9.]/g, '')) || 0), 0)
            const netBalance = totalCollection - totalExpenses

            autoTable(doc, {
                startY: 45,
                body: [
                    ['Total Income (Subscriptions)', `Rs. ${totalCollection.toLocaleString()}`],
                    ['Total Expenditure (Expenses)', `Rs. ${totalExpenses.toLocaleString()}`],
                    ['Net Profit / Savings', `Rs. ${netBalance.toLocaleString()}`]
                ],
                theme: 'striped',
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 100 }, 1: { halign: 'right' } }
            });

            doc.text('Detailed Financial Summary', 14, doc.lastAutoTable.finalY + 15);
            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 20,
                head: [['Category', 'Amount']],
                body: [
                    ['Income: Cash & Paid', `Rs. ${subscriptionsList.filter(s => s.paymentType === 'Cash & Paid').reduce((acc, s) => acc + (Number(String(s.amount || 0).replace(/[^0-9.]/g, '')) || 0), 0).toLocaleString()}`],
                    ['Income: Online', `Rs. ${subscriptionsList.filter(s => s.paymentType === 'Online').reduce((acc, s) => acc + (Number(String(s.amount || 0).replace(/[^0-9.]/g, '')) || 0), 0).toLocaleString()}`],
                    ...festivalExpenseTypes.map(t => [
                        `Expense: ${t}`, `Rs. ${expensesList.filter(e => e.expenseType === t).reduce((acc, e) => acc + (Number(String(e.amount || 0).replace(/[^0-9.]/g, '')) || 0), 0).toLocaleString()}`
                    ])
                ],
                theme: 'grid',
                headStyles: { fillColor: [16, 185, 129] }
            });

            doc.save(`BalanceSheet_${activeFestival?.title?.replace(/\s+/g, '_')}.pdf`);
        } catch (err) { console.error(err); alert('PDF Failed'); }
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
                description: fest.description || ''
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
                title: '', location: '', startDate: '', endDate: '', country: 'India', category: 'Cultural', entityName: activeEntityName, description: ''
            })
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingFest(null)
    }

    const filteredSubs = subscriptionsList.filter(sub => {
        const q = subSearch.toLowerCase()
        return (
            (sub.subId || '').toLowerCase().includes(q) ||
            (sub.name || '').toLowerCase().includes(q) ||
            (sub.address || '').toLowerCase().includes(q) ||
            (sub.contact || '').toLowerCase().includes(q) ||
            (sub.membershipType || '').toLowerCase().includes(q) ||
            (sub.paymentType || '').toLowerCase().includes(q)
        )
    })

    const filteredExpenses = expensesList.filter(exp => {
        const q = expSearch.toLowerCase()
        return (
            (exp.expenseId || '').toLowerCase().includes(q) ||
            (exp.particular || '').toLowerCase().includes(q) ||
            (exp.expenseType || '').toLowerCase().includes(q) ||
            (exp.paymentType || '').toLowerCase().includes(q)
        )
    })

    const filteredCards = cardsList.filter(sub => {
        if (!sub) return false;
        const q = cardSearch.toLowerCase()
        return (
            (sub.cardId || '').toLowerCase().includes(q) ||
            (sub.name || '').toLowerCase().includes(q) ||
            (sub.membershipType || '').toLowerCase().includes(q) ||
            (sub.address || '').toLowerCase().includes(q)
        )
    })

    return (
        <div className="container pt-3 pb-5 text-main">
            <div className="d-flex flex-column flex-xl-row align-items-xl-center justify-content-start mb-4 gap-3">

                <div className="d-inline-flex flex-wrap align-items-center bg-secondary bg-opacity-10 p-1 rounded-3 gap-1 shadow-sm border border-secondary border-opacity-10">
                    {activeTab === 'festivals' && (
                        <div className="d-flex align-items-center gap-2 me-2">
                            <div className="input-group bg-white rounded-2 overflow-hidden shadow-sm flex-nowrap" style={{ width: '220px', height: '34px' }}>
                                <span className="input-group-text bg-transparent border-0 text-muted px-2 py-0 d-flex align-items-center"><Search size={14} /></span>
                                <input
                                    type="text"
                                    className="form-control bg-transparent border-0 text-main shadow-none p-0 pe-2 h-100"
                                    placeholder="Search festivals..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ fontSize: '0.8rem' }}
                                />
                            </div>
                            {user?.role === 'admin' && (
                                <button onClick={() => openModal()} className="btn btn-primary d-flex align-items-center justify-content-center px-3 rounded-2 fw-bold text-white shadow-sm transition-all hover-glow" style={{ fontSize: '0.75rem', height: '34px', backgroundColor: '#5c6cff', borderColor: '#5c6cff' }}>
                                    <Plus size={14} className="me-1" /> CREATE
                                </button>
                            )}
                        </div>
                    )}

                    {['festivals', 'subscriptions', 'expenses', 'card', 'balanceSheet'].map(tab => {
                        const isDisabled = tab !== 'festivals' && !activeFestival
                        const labels = {
                            festivals: 'List',
                            subscriptions: 'Attendees',
                            expenses: 'Expenses',
                            card: 'Cards',
                            balanceSheet: 'Audit'
                        }
                        return (
                            <button
                                key={tab}
                                onClick={() => !isDisabled && setActiveTab(tab)}
                                className={`btn btn-sm px-3 py-1.5 rounded-2 text-capitalize fw-bold transition-all ${activeTab === tab ? 'btn-primary text-white shadow-sm' : 'text-muted border-0'} ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                style={{ fontSize: '0.75rem', height: '34px' }}
                                disabled={isDisabled}
                                title={isDisabled ? "Select a festival first" : ""}
                            >
                                {labels[tab] || tab}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Subscriptions Modal moved to end */}

            {activeTab === 'festivals' && (
                <>



                    <div className="d-flex flex-column gap-2">
                        {festivals.filter(f => (f.title || '').toLowerCase().includes((search || '').toLowerCase())).map((fest, idx) => {
                            const isActive = activeFestival?._id === fest._id;
                            return (
                                <motion.div
                                    key={fest._id || idx}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ y: -1, scale: 1.002 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-100"
                                >
                                    <div 
                                        className={`bg-white shadow-sm d-flex flex-column flex-lg-row align-items-lg-center justify-content-between py-2 px-3 transition-all ${isActive ? 'border-primary border-2' : 'border border-secondary border-opacity-10'}`}
                                        style={{ borderRadius: '8px', cursor: 'default' }}
                                    >
                                        {/* Left Side: Info */}
                                        <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-3 gap-lg-4 mb-2 mb-lg-0">
                                            <div className="d-flex flex-wrap align-items-center gap-2">
                                                <div className="badge bg-secondary bg-opacity-10 px-2 py-1 rounded-pill fw-bold" style={{ color: 'var(--accent-1)', fontSize: '0.7rem' }}>
                                                    {fest.category}
                                                </div>
                                                <div className="fw-extrabold mb-0 text-dark m-0" style={{ letterSpacing: '-0.3px', fontSize: '0.95rem' }}>{fest.title}</div>
                                            </div>

                                            <div className="d-flex flex-wrap align-items-center gap-3 text-muted" style={{ fontSize: '0.8rem' }}>
                                                <div className="d-flex align-items-center gap-1">
                                                    <MapPin size={14} className="text-info opacity-75" />
                                                    <span className="fw-medium text-secondary">{fest.location}</span>
                                                </div>
                                                <div className="d-flex align-items-center gap-1">
                                                    <Calendar size={14} className="text-warning opacity-75" />
                                                    <span className="fw-medium text-secondary">{new Date(fest.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                                <div className="d-flex align-items-center">
                                                    {isActive ? (
                                                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-0 rounded-pill"><CheckCircle size={10} className="me-1 d-inline"/> Active</span>
                                                    ) : (
                                                        <span className="badge bg-secondary bg-opacity-10 text-muted border border-secondary border-opacity-25 px-2 py-0 rounded-pill">Inactive</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Actions */}
                                        <div className="d-flex align-items-center gap-2 ms-lg-auto border-top border-lg-0 pt-2 pt-lg-0 border-secondary border-opacity-10 mt-2 mt-lg-0">
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
                                </motion.div>
                            );
                        })}
                    </div>
                </>
            )}

            {activeTab === 'subscriptions' && (
                <div className="glass-card py-3 px-4 shadow-sm">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <h5 className="fw-extrabold mb-0 text-main">Subscriptions</h5>
                            <p className="text-muted tiny mb-0">Attendee List and Payment tracking.</p>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            {/* Search Attendees */}
                            <div className="input-group glass-card bg-secondary bg-opacity-5 p-0 overflow-hidden" style={{ maxWidth: '240px', height: '32px' }}>
                                <span className="input-group-text bg-transparent border-0 text-muted px-2 py-0 d-flex align-items-center"><Search size={14} /></span>
                                <input
                                    type="text"
                                    className="form-control bg-transparent border-0 text-main shadow-none tiny p-0 pe-2 h-100"
                                    placeholder="Search attendees..."
                                    value={subSearch}
                                    onChange={(e) => setSubSearch(e.target.value)}
                                />
                            </div>
                            <button onClick={downloadAllAttendeesPDF} className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 px-2 text-nowrap" style={{ height: '32px' }}>
                                <FileDown size={14} /> <span className="extra-tiny fw-bold uppercase">Attendee PDF</span>
                            </button>
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
                                }} className="btn btn-premium btn-sm d-flex align-items-center gap-1 px-2 text-nowrap" style={{ height: '32px', padding: '0 12px' }}>
                                    <Plus size={14} /> <span className="extra-tiny fw-bold uppercase">Add New</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Component modal removed */}

                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead>
                                <tr className="small text-muted border-bottom">
                                    <th className="border-0 fw-semibold py-2">ID</th>
                                    <th className="border-0 fw-semibold py-2">Name</th>
                                    <th className="border-0 fw-semibold py-2">Contact</th>
                                    <th className="border-0 fw-semibold py-2">Address</th>
                                    <th className="border-0 fw-semibold py-2">Type</th>
                                    <th className="border-0 fw-semibold py-2">Payment</th>
                                    <th className="border-0 fw-semibold py-2 text-end">Amount</th>
                                    <th className="border-0 fw-semibold py-2 text-end">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-main">
                                {filteredSubs.length === 0 ? (
                                    <tr><td colSpan="8" className="text-center py-5 text-muted">{subscriptionsList.length === 0 ? "No subscriptions yet. Click 'Add New' to begin." : "No matching attendees found."}</td></tr>
                                ) : (
                                    filteredSubs.map((sub) => (
                                        <tr key={sub.subId}>
                                            <td className="border-0 py-2">
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="badge bg-secondary bg-opacity-10 text-dark font-monospace px-2 py-1">{sub.subId}</span>
                                                    {sub.date && (
                                                        <span className="text-muted extra-tiny"><Calendar size={12} className="me-1 opacity-75" />{new Date(sub.date).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="border-0 py-2 fw-bold small">{sub.name}</td>
                                            <td className="border-0 py-2 small text-muted text-nowrap"><Phone size={12} className="me-1 opacity-75" />{sub.countryCode} {sub.contact}</td>
                                            <td className="border-0 py-2 small text-muted text-nowrap text-truncate" style={{ maxWidth: '150px' }}><MapPin size={12} className="me-1 opacity-75" />{sub.address || 'N/A'}</td>
                                            <td className="border-0 py-2">
                                                <span style={getTierBadgeStyle(sub.membershipType)}>
                                                    {getTierDisplayName(sub.membershipType)}
                                                </span>
                                            </td>
                                            <td className="border-0 py-2">
                                                <div className="d-flex align-items-center gap-1 flex-wrap">
                                                    <span className="badge px-2 py-1 fw-medium" style={getPaymentBadgeStyle(sub.paymentType)}>
                                                        {getPaymentDisplayName(sub.paymentType)}
                                                    </span>
                                                    {sub.referenceName && <span className="text-muted extra-tiny">Ref: {sub.referenceName}</span>}
                                                </div>
                                            </td>
                                            <td className="border-0 py-2 text-end">
                                                <span className="badge bg-success text-white px-2 py-1 fw-bold shadow-sm" style={{ fontSize: '0.8rem' }}>
                                                    {sub.currency || '₹'}{String(sub.amount || 0).replace(/[^0-9.]/g, '')}
                                                </span>
                                            </td>
                                            <td className="border-0 py-2 text-end">
                                                <div className="d-flex justify-content-end gap-1">
                                                    <button onClick={() => {
                                                        const message = `Halo ${sub.name}, your subscription ID ${sub.subId} is confirmed.`
                                                        window.open(`https://wa.me/${sub.contact.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank')
                                                    }} className="btn btn-sm btn-light text-success p-1 rounded-2 shadow-sm border" title="WhatsApp"><MessageCircle size={14} /></button>
                                                    <button onClick={() => downloadPDF(sub)} className="btn btn-sm btn-light text-info p-1 rounded-2 shadow-sm border" title="Download PDF"><FileDown size={14} /></button>
                                                    <button onClick={() => {
                                                        setSubFormData({
                                                            ...sub,
                                                            date: sub.date ? new Date(sub.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                                                        })
                                                        setEditingSubId(sub.subId)
                                                        setIsSubAdding(true)
                                                    }} className="btn btn-sm btn-light text-primary p-1 rounded-2 shadow-sm border"><Edit3 size={14} /></button>
                                                    <button onClick={async () => {
                                                        if (window.confirm('Delete subscription?')) {
                                                            try {
                                                                await axios.delete(`/api/subscriptions/${sub.subId}`)
                                                                fetchSubscriptions()
                                                            } catch (err) {
                                                                alert('Error deleting')
                                                            }
                                                        }
                                                    }} className="btn btn-sm btn-light text-danger p-1 rounded-2 shadow-sm border"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}


            {activeTab === 'expenses' && (
                <div className="glass-card p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h4 className="fw-bold mb-0">Festival Expenses</h4>
                            <p className="text-muted tiny mb-0">Track and manage all festival-related spending.</p>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            {/* Search Expenses */}
                            <div className="input-group glass-card bg-secondary bg-opacity-5 p-1" style={{ maxWidth: '280px' }}>
                                <span className="input-group-text bg-transparent border-0 text-muted"><Search size={16} /></span>
                                <input
                                    type="text"
                                    className="form-control bg-transparent border-0 text-main shadow-none small"
                                    placeholder="Search expenses..."
                                    value={expSearch}
                                    onChange={(e) => setExpSearch(e.target.value)}
                                />
                            </div>
                            <button onClick={downloadAllExpensesPDF} className="btn btn-outline-danger d-flex align-items-center gap-2">
                                <FileDown size={18} /> All Expenses Details PDF
                            </button>
                            {!isExpAdding && (
                                <button onClick={() => setIsExpAdding(true)} className="btn btn-premium d-flex align-items-center gap-2">
                                    <Plus size={18} /> New Expense
                                </button>
                            )}
                        </div>
                    </div>

                    {isExpAdding && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card-premium festival-theme p-3 mb-4 border border-white border-opacity-10">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                    <h5 className="fw-extrabold mb-1 gradient-text">Add Expense Detail</h5>
                                    <p className="small text-muted mb-0 italic">Log financial outgoings for audit and tracking.</p>
                                </div>
                                <button onClick={() => setIsExpAdding(false)} className="btn btn-link text-white text-opacity-40 p-0 hover-rotate"><X size={20} /></button>
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
                            }} className="row g-3">
                                <div className="col-md-3">
                                    <label>Recording Date</label>
                                    <input 
                                        type="date" 
                                        className="form-input" 
                                        value={expenseFormData.date} 
                                        onChange={e => setExpenseFormData({ ...expenseFormData, date: e.target.value })} 
                                        required 
                                    />
                                </div>
                                <div className="col-md-3">
                                    <label>Voucher Ref#</label>
                                    <input type="text" className="form-input cursor-not-allowed opacity-75" value={expenseFormData.expenseId} readOnly />
                                </div>
                                <div className="col-md-6">
                                    <label>Expense Particulars</label>
                                    <input type="text" className="form-input" placeholder="e.g. Stage Decoration" value={expenseFormData.particular} onChange={e => setExpenseFormData({ ...expenseFormData, particular: e.target.value })} required />
                                </div>
                                <div className="col-md-6">
                                    <label>Category Type</label>
                                    <select className="form-input" value={expenseFormData.expenseType} onChange={e => setExpenseFormData({ ...expenseFormData, expenseType: e.target.value })}>
                                        {festivalExpenseTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label>Net Amount Outstanding</label>
                                    <div className="input-group-premium">
                                        <select className="form-select-prefix" value={expenseFormData.currency} onChange={e => setExpenseFormData({ ...expenseFormData, currency: e.target.value })}>
                                            {currencies.map(c => <option key={c.code} value={c.symbol}>{c.symbol} ({c.code})</option>)}
                                        </select>
                                        <input type="number" className="form-control-custom" placeholder="0.00" value={expenseFormData.amount} onChange={e => setExpenseFormData({ ...expenseFormData, amount: e.target.value })} required />
                                    </div>
                                </div>

                                <div className="col-md-12">
                                    <label className="tiny fw-bold text-muted uppercase ls-1 mb-2">Payment Status & Method</label>
                                    <div className="d-flex gap-2 p-1 bg-white bg-opacity-5 rounded-3 border border-white border-opacity-10">
                                        {['Cash & Paid', 'Due', 'Online'].map(mode => (
                                            <button 
                                                key={mode} 
                                                type="button" 
                                                onClick={() => setExpenseFormData({ ...expenseFormData, paymentType: mode })}
                                                className={`flex-grow-1 py-2 px-3 rounded-2 tiny fw-bold transition-all border-0 ${expenseFormData.paymentType === mode ? 'bg-primary text-white shadow-sm' : 'bg-transparent text-muted hover-glow'}`}
                                            >
                                                {mode.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {expenseFormData.paymentType === 'Online' && (
                                    <div className="col-12 p-3 rounded-4 border border-info border-opacity-25 bg-info bg-opacity-5 animate-in slide-in-from-top-2">
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="text-info extra-tiny uppercase ls-1 mb-1 fw-bold">Particulars / Bank Name</label>
                                                <input type="text" className="form-input border-info border-opacity-25 py-2 tiny" placeholder="e.g. GPay / HDFC" value={expenseFormData.onlineParticulars || ''} onChange={e => setExpenseFormData({ ...expenseFormData, onlineParticulars: e.target.value })} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="text-info extra-tiny uppercase ls-1 mb-1 fw-bold">Transaction Reference ID</label>
                                                <input type="text" className="form-input border-info border-opacity-25 py-2 tiny font-monospace" placeholder="e.g. TXN123456" value={expenseFormData.onlineReference || ''} onChange={e => setExpenseFormData({ ...expenseFormData, onlineReference: e.target.value })} required />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="col-12 mt-2 d-flex gap-2">
                                    <button type="submit" className="btn btn-premium px-5 py-3 shadow-lg">
                                        <Save size={18} /> {editingExpId ? 'Update Voucher' : 'Finalize & Post Expense'}
                                    </button>
                                    <button onClick={() => setIsExpAdding(false)} type="button" className="btn btn-cancel px-4">Close Form</button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr className="text-muted small">
                                    <th className="border-0 bg-transparent">DATE</th>
                                    <th className="border-0 bg-transparent">EXPENSE ID</th>
                                    <th className="border-0 bg-transparent">PARTICULAR</th>
                                    <th className="border-0 bg-transparent">TYPE</th>
                                    <th className="border-0 bg-transparent">PAYMENT</th>
                                    <th className="border-0 bg-transparent text-end">AMOUNT</th>
                                    <th className="border-0 bg-transparent text-end">ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center py-5 text-muted">{expensesList.length === 0 ? "No expenses logged yet." : "No matching expenses found."}</td></tr>
                                ) : (
                                    filteredExpenses.map((exp) => (
                                        <tr key={exp.expenseId}>
                                        <td className="border-0 py-1 small text-muted">{new Date(exp.date).toLocaleDateString()}</td>
                                        <td className="border-0 py-3"><span className="badge bg-secondary bg-opacity-10 text-muted font-monospace">{exp.expenseId}</span></td>
                                        <td className="border-0 py-3 fw-bold">{exp.particular}</td>
                                        <td className="border-0 py-1 small fw-bold">{exp.expenseType}</td>
                                        <td className="border-0 py-1 small">
                                            <span className={`badge rounded-pill px-2 py-1 extra-tiny ${exp.paymentType === 'Online' ? 'bg-info bg-opacity-10 text-info' : exp.paymentType === 'Due' ? 'bg-danger bg-opacity-10 text-danger' : 'bg-success bg-opacity-10 text-success'}`}>
                                                {exp.paymentType === 'Online' && exp.onlineParticulars ? `Online (${exp.onlineParticulars})` : exp.paymentType}
                                            </span>
                                        </td>
                                        <td className="border-0 py-1 small text-end fw-bold text-danger">-{exp.currency}{(Number(exp.amount) || 0).toLocaleString()}</td>
                                        <td className="border-0 py-3 text-end">
                                            <button onClick={() => downloadExpensePDF(exp)} className="btn btn-sm text-info p-1 me-2" title="Download PDF"><FileDown size={16} /></button>
                                            <button onClick={() => {
                                                setExpenseFormData({
                                                    ...exp,
                                                    date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                                                })
                                                setEditingExpId(exp.expenseId)
                                                setIsExpAdding(true)
                                            }} className="btn btn-sm text-primary p-1 me-2" title="Edit Expense"><Edit3 size={16} /></button>
                                            <button onClick={async () => {
                                                if (window.confirm('Delete this expense?')) {
                                                    await axios.delete(`/api/expenses/${exp.expenseId}`)
                                                    fetchExpenses()
                                                }
                                            }} className="btn btn-sm btn-light text-danger p-1 rounded-circle border-0"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'card' && (
                <div className="py-2">
                    <div className="mb-5 d-flex justify-content-between align-items-end">
                        <div>
                            <h3 className="fw-bold mb-1">Pass Preview</h3>
                            <p className="text-muted small">Visual representation of active member passes.</p>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                            <div className="input-group glass-card bg-secondary bg-opacity-5 p-1" style={{ maxWidth: '240px' }}>
                                <span className="input-group-text bg-transparent border-0 text-muted"><Search size={16} /></span>
                                <input
                                    type="text"
                                    className="form-control bg-transparent border-0 text-main shadow-none small py-1"
                                    placeholder="Search cards..."
                                    value={cardSearch}
                                    onChange={(e) => setCardSearch(e.target.value)}
                                />
                            </div>
                            <div className="d-flex align-items-center gap-2 px-2 py-1 bg-dark bg-opacity-20 border border-white border-opacity-5 rounded-pill shadow-sm">
                                <div className="p-1 bg-primary bg-opacity-10 rounded-circle">
                                    <History size={12} className="text-primary" />
                                </div>
                                <div className="small fw-bold text-white mb-0 me-1" style={{ fontSize: '0.75rem' }}>{cardsList?.length || 0} Issued</div>
                            </div>
                            <button onClick={() => {
                                setCardFormData({
                                    ...cardFormData,
                                    name: '',
                                    address: '',
                                    membershipType: 'Regular',
                                    cardId: generateSubID(),
                                    cardColor: '#1e293b',
                                    entityName: activeFestival?.entityName || '',
                                    festOrEventName: activeFestival?.title || ''
                                })
                                setIsCardAdding(true)
                            }} className="btn btn-premium px-4">
                                <Plus size={18} /> New Pass Card
                            </button>
                        </div>
                    </div>
                    <div className="row g-4">
                        {!selectedPreviewCard ? (
                            <div className="col-12 w-100 mt-2">
                                <div className="glass-card-premium overflow-hidden border border-white border-opacity-10 shadow-lg">
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead>
                                                <tr className="small text-muted border-bottom border-white border-opacity-10">
                                                    <th className="border-0 bg-transparent px-4 py-3">Card ID</th>
                                                    <th className="border-0 bg-transparent py-3">Issued To</th>
                                                    <th className="border-0 bg-transparent py-3">Category</th>
                                                    <th className="border-0 bg-transparent py-3 text-center">Group Size</th>
                                                    <th className="border-0 bg-transparent py-3 text-end px-4">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-main">
                                                {!Array.isArray(filteredCards) || filteredCards.length === 0 ? (
                                                    <tr><td colSpan="5" className="text-center py-5 text-muted">{cardsList.length === 0 ? "No cards issued yet. Click 'New Pass Card' to begin." : "No matching cards found."}</td></tr>
                                                ) : (
                                                    filteredCards.map((sub) => (
                                                        <tr key={sub.cardId} style={{ transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                            <td className="border-0 px-4 py-3"><span className="badge bg-secondary bg-opacity-10 text-muted font-monospace">{sub.cardId}</span></td>
                                                            <td className="border-0 py-3 fw-bold text-body">{sub.name}</td>
                                                            <td className="border-0 py-3"><span className={`badge ${sub.membershipType === 'Admin' ? 'bg-danger text-white' : sub.membershipType === 'VIP' ? 'bg-warning text-dark' : 'bg-success bg-opacity-25 text-success'}`}>{sub.membershipType === 'Regular' ? 'Volunteers' : sub.membershipType}</span></td>
                                                            <td className="border-0 py-3 text-center">{sub.familyMembers || 1}</td>
                                                            <td className="border-0 py-3 text-end px-4">
                                                                <button onClick={() => setSelectedPreviewCard(sub)} className="btn btn-sm text-primary p-1 me-2 hover-scale" title="CardPreview Button"><Eye size={18} /></button>
                                                                <button onClick={() => downloadCardPDF(sub)} className="btn btn-sm text-info p-1 me-2 hover-scale" title="Download PDF"><FileDown size={18} /></button>
                                                                <button onClick={() => { setCardFormData(sub); setEditingCardId(sub.cardId); setIsCardAdding(true); }} className="btn btn-sm text-warning p-1 me-2 hover-scale" title="Edit Pass"><Edit3 size={18} /></button>
                                                                <button onClick={async () => { if (window.confirm('Delete this card?')) { await axios.delete(`/api/cards/${sub.cardId}`); fetchCards(); } }} className="btn btn-sm text-danger p-1 hover-scale" title="Delete Pass"><Trash2 size={18} /></button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="col-md-8 col-lg-5">
                                <div className="card-container d-flex flex-column gap-4 align-items-center justify-content-center p-4 glass-card-premium position-relative" style={{ minHeight: '400px' }}>
                                    <button onClick={() => setSelectedPreviewCard(null)} className="btn btn-link position-absolute top-0 end-0 m-2 text-muted hover-text-white">
                                        <X size={20} />
                                    </button>
                                    
                                    <div className="text-center w-100 mb-2">
                                        <h5 className="fw-bold text-white mb-0">{selectedPreviewCard.name}'s ID Pass</h5>
                                        <span className="small text-success">{selectedPreviewCard.membershipType === 'Regular' ? 'Volunteers' : selectedPreviewCard.membershipType} Tier</span>
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

                                    {/* Card Actions Outside */}
                                    <div className="d-flex gap-2 justify-content-center w-100 bg-secondary bg-opacity-10 p-2 rounded-4 border border-secondary border-opacity-10 mt-3">
                                        <button onClick={() => downloadCardPDF(selectedPreviewCard)} className="btn btn-premium flex-grow-1 py-2 px-3 rounded-pill d-flex align-items-center justify-content-center gap-2" title="Download Card as PDF">
                                            <FileDown size={18} /> <span className="small fw-bold">Download PDF</span>
                                        </button>
                                        <button onClick={() => {
                                            setCardFormData(selectedPreviewCard)
                                            setEditingCardId(selectedPreviewCard.cardId)
                                            setIsCardAdding(true)
                                        }} className="btn btn-light text-primary p-2 rounded-circle shadow-sm" title="Edit Pass"><Edit3 size={18} /></button>
                                        <button onClick={async () => {
                                            if (window.confirm('Delete this card?')) {
                                                await axios.delete(`/api/cards/${selectedPreviewCard.cardId}`)
                                                setSelectedPreviewCard(null)
                                                fetchCards()
                                            }
                                        }} className="btn btn-light text-danger p-2 rounded-circle shadow-sm" title="Delete Pass"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
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

                return (
                    <div className="py-2 animate-in">
                        <div className="mb-4">
                            <h2 className="fw-extrabold mb-1">Financial Overview</h2>
                            <p className="text-muted small fw-bold uppercase tracking-wider">Comprehensive summary for <span className="text-accent-1 text-bold">{activeFestival?.title}</span></p>
                        </div>

                        <div className="row g-4">
                            <div className="col-md-3">
                                <div className="glass-card p-4 border-top border-success border-4 shadow-premium h-100">
                                    <h6 className="text-muted small text-uppercase mb-2 fw-extrabold">Total Collection</h6>
                                    <h2 className="fw-extrabold text-success mb-0">₹{totalCollection.toLocaleString()}</h2>
                                    <small className="text-muted fw-bold">Verified Revenue</small>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="glass-card p-4 border-top border-warning border-4 shadow-premium h-100">
                                    <h6 className="text-muted small text-uppercase mb-2 fw-extrabold">Total Dues</h6>
                                    <h2 className="fw-extrabold text-warning mb-0">₹{totalDues.toLocaleString()}</h2>
                                    <small className="text-muted fw-bold">Pending Clearance</small>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="glass-card p-4 border-top border-danger border-4 shadow-premium h-100">
                                    <h6 className="text-muted small text-uppercase mb-2 fw-extrabold">Total Expenses</h6>
                                    <h2 className="fw-extrabold text-danger mb-0">₹{totalExpenses.toLocaleString()}</h2>
                                    <small className="text-muted fw-bold">Resource Spending</small>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="glass-card p-4 border-top border-primary border-4 shadow-premium h-100">
                                    <h6 className="text-muted small text-uppercase mb-2 fw-extrabold">Net Balance</h6>
                                    <h2 className={`fw-extrabold mb-0 ${netBalance >= 0 ? 'text-primary' : 'text-danger'}`}>
                                        ₹{netBalance.toLocaleString()}
                                    </h2>
                                    <small className="text-muted fw-bold">Profit/Loss Margin</small>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-4 mt-5">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="fw-bold mb-0">Detailed Breakdown</h5>
                                <button onClick={downloadBalanceSheetPDF} className="btn btn-outline-success d-flex align-items-center gap-2">
                                    <FileDown size={18} /> BalanceSheet Pdf Download
                                </button>
                            </div>
                            <div className="row">
                                <div className="col-md-6 border-end border-secondary border-opacity-10">
                                    <h6 className="text-muted mb-3 small fw-bold">SUBSCRIPTION INCOME</h6>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Cash &amp; Paid:</span>
                                        <span className="fw-bold text-success">₹{subscriptionsList.filter(s => s.paymentType === 'Cash & Paid').reduce((a, b) => a + (Number(b.amount) || 0), 0).toLocaleString()}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Online Payments:</span>
                                        <span className="fw-bold text-info">₹{subscriptionsList.filter(s => s.paymentType === 'Online').reduce((a, b) => a + (Number(b.amount) || 0), 0).toLocaleString()}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Coupon/Token:</span>
                                        <span className="fw-bold text-muted">₹{subscriptionsList.filter(s => s.paymentType === 'Coupon or Token').reduce((a, b) => a + (Number(b.amount) || 0), 0).toLocaleString()}</span>
                                    </div>
                                    <div className="border-top border-secondary border-opacity-10 mt-3 pt-2 font-monospace">
                                        <div className="d-flex justify-content-between">
                                            <span>TOTAL INCOME:</span>
                                            <span className="fw-bold">₹{totalCollection.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6 ps-md-4">
                                    <h6 className="text-muted mb-3 small fw-bold">EXPENSE CATEGORIES</h6>
                                    {festivalExpenseTypes.map(type => {
                                        const amt = expensesList.filter(e => e.expenseType === type).reduce((a, b) => a + (Number(b.amount) || 0), 0)
                                        if (amt === 0) return null
                                        return (
                                            <div key={type} className="d-flex justify-content-between mb-2 italic text-capitalize">
                                                <span>{type}:</span>
                                                <span className="text-danger">₹{amt.toLocaleString()}</span>
                                            </div>
                                        )
                                    })}
                                    <div className="border-top border-secondary border-opacity-10 mt-3 pt-2 font-monospace">
                                        <div className="d-flex justify-content-between">
                                            <span>TOTAL EXPENSE:</span>
                                            <span className="fw-bold">₹{totalExpenses.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })()}

            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(12px)', zIndex: 2000 }}>
                        <motion.div initial={{ scale: 0.9, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 30, opacity: 0 }} className="modal-content-premium modal-festival w-100 mx-3 shadow-2xl" style={{ maxWidth: '800px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <h2 className="fw-extrabold mb-1 fs-3 gradient-text">
                                        {editingFest ? 'Configure' : 'Initiate'} Festival
                                    </h2>
                                    <p className="small text-muted mb-0 italic">Define core parameters for the upcoming grand celebration.</p>
                                </div>
                                <button onClick={closeModal} className="btn btn-link text-white text-opacity-40 p-0 hover-rotate"><X size={28} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="row g-3">
                                <div className="col-lg-7">
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label>Festival Title</label>
                                            <input type="text" placeholder="Festival Name" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="form-input" required />
                                        </div>
                                        <div className="col-12">
                                            <label>Entity</label>
                                            <input type="text" placeholder="Entity Name" value={formData.entityName} onChange={e => setFormData({ ...formData, entityName: e.target.value })} className="form-input" />
                                        </div>
                                        <div className="col-md-6">
                                            <label>Start Date</label>
                                            <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="form-input" required />
                                        </div>
                                        <div className="col-md-6">
                                            <label>End Date</label>
                                            <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="form-input" required />
                                        </div>
                                    </div>
                                </div>

                                <div className="col-lg-5">
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label>Country</label>
                                            <select
                                                value={formData.country}
                                                onChange={e => {
                                                    const newCountry = e.target.value;
                                                    setFormData({
                                                        ...formData,
                                                        country: newCountry,
                                                        category: countryData[newCountry][0]
                                                    });
                                                }}
                                                className="form-input"
                                            >
                                                {Object.keys(countryData).map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label>Location</label>
                                            <input type="text" placeholder="City" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="form-input" required />
                                        </div>
                                        <div className="col-md-6">
                                            <label>Category</label>
                                            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="form-input">
                                                {countryData[formData.country].map(cat => <option key={cat}>{cat}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-12">
                                            <label>Description</label>
                                            <textarea placeholder="Festival details..." rows="3" className="form-input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-12 mt-5">
                                    <div className="d-flex gap-3">
                                        <button type="submit" className="btn btn-premium flex-grow-1 py-3 px-5">
                                            <Save size={18} /> {editingFest ? 'Update Festival' : 'Deploy New Festival'}
                                        </button>
                                        <button type="button" onClick={closeModal} className="btn btn-cancel py-3 px-5">Cancel</button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isSubAdding && (
                    <div className="modal-overlay modal-overlay-light position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 2000 }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="modal-content-light w-100 mx-3" style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div className="d-flex justify-content-between align-items-start mb-4">
                                <div>
                                    <h2 className="fw-extrabold mb-2 title-gradient" style={{ fontSize: '1.75rem' }}>
                                        {editingSubId ? 'Modify Subscription' : 'New Subscription'}
                                    </h2>
                                    <p className="subtitle mb-0">Secure membership access protocol for active attendees.</p>
                                </div>
                                <button onClick={() => { setIsSubAdding(false); setEditingSubId(null); }} className="btn btn-link text-secondary p-0 hover-scale"><X size={24} /></button>
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
                                    alert(err.response?.data?.message || 'Error saving subscription')
                                }
                            }} className="row g-3">
                                <div className="col-md-5">
                                    <label>Pass ID (Auto-Generated)</label>
                                    <input type="text" className="form-input" style={{ letterSpacing: '3px', fontWeight: '800', color: '#1e293b' }} value={subFormData.subId} readOnly />
                                </div>
                                <div className="col-md-7">
                                    <label>Attendee Full Name</label>
                                    <input type="text" className="form-input" placeholder="Full Name" value={subFormData.name} onChange={e => setSubFormData({ ...subFormData, name: e.target.value })} required />
                                </div>
                                <div className="col-md-4">
                                    <label>Secure Contact Node</label>
                                    <div className="input-group-premium">
                                        <select className="form-select-prefix" value={subFormData.countryCode} onChange={e => setSubFormData({ ...subFormData, countryCode: e.target.value })}>
                                            {countryCodes.map(c => <option key={c.code} value={c.code}>{c.country} ({c.code})</option>)}
                                        </select>
                                        <input type="text" className="form-control-custom" placeholder="Mobile / Contact No" value={subFormData.contact} onChange={e => setSubFormData({ ...subFormData, contact: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <label>Transaction Amount</label>
                                    <div className="input-group-premium">
                                        <select className="form-select-prefix" value={subFormData.currency} onChange={e => setSubFormData({ ...subFormData, currency: e.target.value })}>
                                            {currencies.map(c => <option key={c.code} value={c.symbol}>{c.symbol} ({c.code})</option>)}
                                        </select>
                                        <input type="number" className="form-control-custom" placeholder="0.00" value={subFormData.amount} onChange={e => setSubFormData({ ...subFormData, amount: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <label>Subscription Date</label>
                                    <input 
                                        type="date" 
                                        className="form-input" 
                                        value={subFormData.date} 
                                        onChange={e => setSubFormData({ ...subFormData, date: e.target.value })} 
                                        required 
                                    />
                                </div>
                                <div className="col-12">
                                    <label>Attendee Residence / Address</label>
                                    <input type="text" className="form-input" placeholder="Street name, City, State, District..." value={subFormData.address} onChange={e => setSubFormData({ ...subFormData, address: e.target.value })} />
                                </div>
                                <div className="col-md-6">
                                    <label>Subscription Tier</label>
                                    <select 
                                        className="form-input" 
                                        value={subFormData.membershipType} 
                                        style={{ backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: '500' }} 
                                        onChange={e => setSubFormData({ ...subFormData, membershipType: e.target.value })}
                                    >
                                        <option value="Prime">Prime Member</option>
                                        <option value="None">None</option>
                                        <option value="VIP">VIP Access</option>
                                        <option value="Admin">Administrative</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label>Financial Status</label>
                                    <select 
                                        className="form-input" 
                                        value={subFormData.paymentType} 
                                        style={{ backgroundColor: subFormData.paymentType === 'Cash & Paid' ? '#dcfce7' : subFormData.paymentType === 'Due' ? '#fee2e2' : subFormData.paymentType === 'Online' ? '#e0f2fe' : '#f1f5f9', color: '#0f172a', fontWeight: '600' }} 
                                        onChange={e => setSubFormData({ ...subFormData, paymentType: e.target.value })}
                                    >
                                        <option value="Cash & Paid">Confirmed (Cash &amp; Paid)</option>
                                        <option value="Due">Pending (Due Balance)</option>
                                        <option value="Online">Digital (Online Bank)</option>
                                        <option value="Coupon or Token">Coupon / Token Voucher</option>
                                    </select>
                                </div>

                                {subFormData.paymentType === 'Online' && (
                                    <div className="col-12 p-3 mt-3 rounded-4 border border-info border-opacity-25 bg-info bg-opacity-10 shadow-sm animate-in zoom-in duration-300">
                                        <h6 className="fw-bold text-info mb-3 d-flex align-items-center gap-2"><Zap size={16} /> Digital Payment Details</h6>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="text-info text-opacity-75 small uppercase ls-1 mb-2 fw-bold">Particulars / Bank Name</label>
                                                <input type="text" className="form-input border-info border-opacity-25" placeholder="e.g. HDFC Bank Transfer" value={subFormData.onlineParticulars || ''} onChange={e => setSubFormData({ ...subFormData, onlineParticulars: e.target.value })} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="text-info text-opacity-75 small uppercase ls-1 mb-2 fw-bold">Transaction Reference No.</label>
                                                <input type="text" className="form-input border-info border-opacity-25 font-monospace" placeholder="e.g. UTR / Ref Number" value={subFormData.onlineReference || ''} onChange={e => setSubFormData({ ...subFormData, onlineReference: e.target.value })} required />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="col-12 mt-4 pt-2">
                                    <div className="d-flex gap-3">
                                        <button type="submit" className="btn btn-premium flex-grow-1 text-white text-uppercase d-flex justify-content-center align-items-center gap-2">
                                            <Save size={18} /> {editingSubId ? 'Confirm Updates' : 'Authorize & Save Membership'}
                                        </button>
                                        <button type="button" onClick={() => { setIsSubAdding(false); setEditingSubId(null); }} className="btn btn-cancel flex-grow-0 px-5">Cancel</button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isCardAdding && (
                    <div className="modal-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)', zIndex: 2000 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-content-premium modal-festival w-100 mx-3 shadow-2xl" style={{ maxWidth: '900px', maxHeight: '95vh', overflowY: 'auto' }}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <h2 className="fw-extrabold mb-1 fs-3 gradient-text">
                                        {editingCardId ? 'Configure' : 'Design'} Member Pass
                                    </h2>
                                    <p className="small text-muted mb-0 italic">Customize visual identity and access validity for elite members.</p>
                                </div>
                                <div onClick={() => { setIsCardAdding(false); setEditingCardId(null); }} className="btn btn-link text-white text-opacity-40 p-0 hover-rotate"><X size={28} /></div>
                            </div>

                            <div className="mb-4 d-flex justify-content-center bg-dark bg-opacity-30 p-4 rounded-4 border border-white border-opacity-5">
                                <VIPCard
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
                            }} className="row g-3">
                                <div className="col-md-6">
                                    <label>Smart Fetch Strategy</label>
                                    <div className="input-group-premium">
                                        <input
                                            type="text"
                                            className="form-control-custom py-1.5 tiny"
                                            placeholder="Scan / Enter Pass ID (e.g. XZBY...)"
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
                                        <button type="button" className="btn btn-premium btn-sm rounded-0 px-3 tiny fw-bold uppercase border-0" style={{ paddingTop: 0, paddingBottom: 0 }} onClick={async (e) => {
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
                                    <p className="extra-tiny text-white text-opacity-25 mt-1.5 mb-0 italic">Press Enter or click Sync to auto-fill.</p>
                                </div>

                                <div className="col-md-6">
                                    <label>Physical Address / Location</label>
                                    <input type="text" className="form-input py-1.5 tiny" placeholder="Complete address detail" value={cardFormData.address} onChange={e => setCardFormData({ ...cardFormData, address: e.target.value })} />
                                </div>

                                <div className="col-md-6">
                                    <label>Member Identity</label>
                                    <input type="text" className="form-input py-1.5 tiny" placeholder="Display name on card" value={cardFormData.name} onChange={e => setCardFormData({ ...cardFormData, name: e.target.value })} required />
                                </div>

                                <div className="col-md-6">
                                    <label>Festival Context</label>
                                    <input type="text" className="form-input py-1.5 tiny" placeholder="Primary event title" value={cardFormData.festOrEventName} onChange={e => setCardFormData({ ...cardFormData, festOrEventName: e.target.value })} />
                                </div>

                                <div className="col-md-6">
                                    <label>Entity Branding</label>
                                    <input type="text" className="form-input py-1.5 tiny" placeholder="e.g. Blue Lagoon Entity" value={cardFormData.entityName} onChange={e => setCardFormData({ ...cardFormData, entityName: e.target.value })} />
                                </div>

                                <div className="col-md-6">
                                    <label>Access Level</label>
                                    <select className="form-input py-1.5 tiny" value={cardFormData.membershipType} onChange={e => setCardFormData({ ...cardFormData, membershipType: e.target.value })}>
                                        <option value="Regular">Volunteers</option>
                                        <option value="Prime">Prime Member</option>
                                        <option value="VIP">VIP Elite</option>
                                        <option value="Admin">Administrator</option>
                                    </select>
                                </div>

                                <div className="col-md-4">
                                    <label>Group Size</label>
                                    <input type="number" className="form-input py-1.5 tiny" value={cardFormData.familyMembers} onChange={e => setCardFormData({ ...cardFormData, familyMembers: e.target.value })} />
                                </div>

                                <div className="col-md-4">
                                    <label>Effective From</label>
                                    <input type="date" className="form-input py-1.5 tiny" value={cardFormData.fromDate} onChange={e => setCardFormData({ ...cardFormData, fromDate: e.target.value })} />
                                </div>

                                <div className="col-md-4">
                                    <label>Expiry Date</label>
                                    <input type="date" className="form-input py-1.5 tiny" value={cardFormData.toDate} onChange={e => setCardFormData({ ...cardFormData, toDate: e.target.value })} />
                                </div>

                                <div className="col-12 mt-3 pt-3 border-top border-white border-opacity-10">
                                    <div className="d-flex gap-3">
                                        <button type="submit" className="btn btn-premium flex-grow-1 py-2.5 px-5 shadow-lg fw-bold text-uppercase" style={{ fontSize: '0.85rem' }}>
                                            <Zap size={16} /> {editingCardId ? 'Authorize Card Updates' : 'Generate Digital Pass Identity'}
                                        </button>
                                        <button type="button" onClick={() => { setIsCardAdding(false); setEditingCardId(null); }} className="btn btn-cancel py-2.5 px-5 fw-bold text-uppercase" style={{ fontSize: '0.85rem' }}>Abort Design</button>
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
