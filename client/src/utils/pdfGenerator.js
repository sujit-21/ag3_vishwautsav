import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import logoImage from '../images/logo-emblem.png'

// Cached base64 logo data URL
let cachedLogoDataUrl = null

/**
 * Helper to get the VU logo emblem as a Base64 data URL for jsPDF embedding
 */
const getLogoImage = () => {
    if (cachedLogoDataUrl) return Promise.resolve(cachedLogoDataUrl)
    if (typeof window === 'undefined') return Promise.resolve(null)

    if (typeof logoImage === 'string' && logoImage.startsWith('data:image')) {
        cachedLogoDataUrl = logoImage
        return Promise.resolve(cachedLogoDataUrl)
    }

    return new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = 'Anonymous'
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas')
                canvas.width = img.naturalWidth || img.width || 200
                canvas.height = img.naturalHeight || img.height || 200
                const ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0)
                cachedLogoDataUrl = canvas.toDataURL('image/png')
                resolve(cachedLogoDataUrl)
            } catch (err) {
                resolve(img)
            }
        }
        img.onerror = () => {
            resolve(null)
        }
        img.src = logoImage
    })
}

/**
 * Website URL information for PDF Footers
 */
const getWebsiteInfo = () => {
    if (typeof window !== 'undefined' && window.location) {
        const origin = window.location.origin || 'https://vishwautsav.com'
        const host = window.location.host || 'vishwautsav.com'
        return { url: origin, display: host }
    }
    return { url: 'https://vishwautsav.com', display: 'vishwautsav.com' }
}

// Figma Luxury Design Palette (RGB arrays for jsPDF)
export const FIGMA_COLORS = {
    navyDark: [15, 23, 42],        // #0F172A - Header Slate
    slateNavy: [30, 41, 59],       // #1E293B - Table Headers / Cards
    saffron: [224, 122, 67],       // #E07A43 - Primary Brand Accent
    terracotta: [217, 90, 34],     // #D95A22
    amber: [249, 179, 98],         // #F9B362 - Eyebrow Gold
    emerald: [16, 185, 129],       // #10B981 - Revenue / Positive
    emeraldDark: [6, 95, 70],      // #065F46
    emeraldBg: [236, 253, 245],    // #ECFDF5
    crimson: [239, 68, 68],        // #EF4444 - Expense / Negative
    crimsonDark: [153, 27, 27],    // #991B1B
    crimsonBg: [254, 242, 242],    // #FEF2F2
    blue: [37, 99, 235],           // #2563EB - Digital / Online
    blueDark: [29, 78, 216],       // #1D4ED8
    blueBg: [239, 246, 255],       // #EFF6FF
    purple: [139, 92, 246],        // #8B5CF6 - Master / High-Tier
    purpleDark: [109, 40, 217],    // #6D28D9
    purpleBg: [245, 243, 255],     // #F5F3FF
    lightBg: [248, 250, 252],      // #F8FAFC - Soft Neutral Slate for 2-color alternate rows
    white: [255, 255, 255],        // #FFFFFF - Pure White for 2-color alternate rows
    border: [226, 232, 240],       // #E2E8F0
    muted: [148, 163, 184],        // #94A3B8
    textDark: [15, 23, 42]
}

/**
 * Robust Amount Parser that strips currency symbols ('Rs.', 'Rs', 'INR', '₹') safely
 * without turning leading 'Rs.' into a decimal point (.1000)
 */
export const parseAmount = (val) => {
    if (typeof val === 'number') return val
    const clean = String(val || 0)
        .replace(/Rs\.?/gi, '')
        .replace(/INR/gi, '')
        .replace(/[₹$,]/g, '')
        .trim()
    return parseFloat(clean) || 0
}

/**
 * Format Currency String
 */
export const fmtCurrency = (val) => {
    const num = parseAmount(val)
    return `Rs. ${num.toLocaleString('en-IN')}`
}

/**
 * Mint-Light Amount Badges based on specific user-requested tiers:
 * - <= 101           : Soft Mint Slate (#F1F5F9) / Deep Slate (#475569)
 * - Above 101 - 251  : Mint-Light Blue (#DBEAFE) / Deep Sky Blue (#1D4ED8)
 * - Above 251 - 501  : Mint-Light Green (#D1FAE5) / Forest Emerald (#047857)
 * - Above 501 - 1001 : Mint-Light Yellow (#FEF08A) / Rich Amber (#A16207)
 * - Above 1001 - 2001: Mint-Light Orange (#FFEDD5) / Vivid Terracotta (#C2410C)
 * - Above 2001 (High): Mint-Light Purple (#F3E8FF) / Royal Purple (#6D28D9)
 */
export const getAmountBadge = (val) => {
    const num = parseAmount(val)
    if (num <= 101) {
        return {
            fillColor: [241, 245, 249],  // #F1F5F9 Soft Mint Slate
            textColor: [71, 85, 105],    // #475569 Deep Slate
            label: '<= 101'
        }
    } else if (num <= 251) {
        return {
            fillColor: [219, 234, 254],  // #DBEAFE Mint-Light Blue
            textColor: [29, 78, 216],    // #1D4ED8 Deep Sky Blue
            label: '101 - 251'
        }
    } else if (num <= 501) {
        return {
            fillColor: [209, 250, 229],  // #D1FAE5 Mint-Light Green
            textColor: [4, 120, 87],     // #047857 Forest Emerald
            label: '251 - 501'
        }
    } else if (num <= 1001) {
        return {
            fillColor: [254, 240, 138],  // #FEF08A Mint-Light Yellow
            textColor: [161, 98, 7],     // #A16207 Rich Amber
            label: '501 - 1001'
        }
    } else if (num <= 2001) {
        return {
            fillColor: [255, 237, 213],  // #FFEDD5 Mint-Light Orange
            textColor: [194, 65, 12],    // #C2410C Vivid Terracotta
            label: '1001 - 2001'
        }
    } else {
        // Higher amounts > 2001
        return {
            fillColor: [243, 232, 255],  // #F3E8FF Mint-Light Purple / Violet
            textColor: [109, 40, 217],   // #6D28D9 Royal Purple
            label: '> 2001'
        }
    }
}

/**
 * Common Header Drawer for A4 PDF (Centered in Page, Clean Text, No right badge)
 */
const drawHeader = (doc, { title, subtitle, accentColor = FIGMA_COLORS.saffron, isLandscape = false }) => {
    const pageW = isLandscape ? 297 : 210
    const centerX = pageW / 2

    // 1. Dark Slate Banner (26mm height)
    doc.setFillColor(...FIGMA_COLORS.navyDark)
    doc.rect(0, 0, pageW, 26, 'F')

    // 2. Accent Bottom Stripe (1.8mm accent line)
    doc.setFillColor(...accentColor)
    doc.rect(0, 26, pageW, 1.8, 'F')

    // 3. Eyebrow Tag (Centered, clean text without unrenderable Unicode glyphs)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...FIGMA_COLORS.amber)
    doc.text('Vishwa Utsav Portal', centerX, 7.8, { align: 'center' })

    // 4. Main Document Title & Subtitle
    const hasSubtitle = Boolean(subtitle && String(subtitle).trim())
    if (hasSubtitle) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(13.5)
        doc.setTextColor(255, 255, 255)
        doc.text(String(title || 'AUDIT REPORT').toUpperCase(), centerX, 15.2, { align: 'center' })

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.6)
        doc.setTextColor(203, 213, 225)
        doc.text(String(subtitle).trim(), centerX, 21.2, { align: 'center' })
    } else {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(14)
        doc.setTextColor(255, 255, 255)
        doc.text(String(title || 'AUDIT REPORT').toUpperCase(), centerX, 17.5, { align: 'center' })
    }
}

/**
 * Common Running Footer Drawer for A4 PDF (anchored at bottom of each page)
 * Includes active clickable website link centered between audit note and page numbers
 */
const drawFooter = (doc, isLandscape = false) => {
    const totalPages = doc.internal.getNumberOfPages()
    const pageW = isLandscape ? 297 : 210
    const pageH = isLandscape ? 210 : 297
    const { url: websiteUrl, display: websiteDisplay } = getWebsiteInfo()

    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        // Hairline divider
        doc.setDrawColor(...FIGMA_COLORS.border)
        doc.setLineWidth(0.3)
        doc.line(14, pageH - 11, pageW - 14, pageH - 11)

        // Left text: Confidential Audit Document
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(...FIGMA_COLORS.muted)
        doc.text('Certified Confidential Audit Document | Vishwa Utsav', 14, pageH - 6.5)

        // Center text: Website Link (Active Clickable Hyperlink)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.2)
        doc.setTextColor(...FIGMA_COLORS.blue)
        const linkText = `Website: ${websiteDisplay}`
        const textW = doc.getTextWidth(linkText)
        const linkX = (pageW - textW) / 2
        doc.text(linkText, linkX, pageH - 6.5)
        if (typeof doc.link === 'function') {
            doc.link(linkX, pageH - 10, textW, 5, { url: websiteUrl })
        }

        // Right text: Page count
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(...FIGMA_COLORS.muted)
        doc.text(`Page ${i} of ${totalPages}`, pageW - 14, pageH - 6.5, { align: 'right' })
    }
}

/**
 * Parse cell styles to inject luxury badges for Amount, Name, Status, and Tier:
 * 1. Rows alternate between 2 clean colors: Pure White (#FFFFFF) and Soft Neutral Slate (#F8FAFC)
 * 2. Mint-Light Tier colors (background and text) are applied specifically to:
 *    - The Amount Column
 *    - The Name Column (Full Name in attendees, Particulars / Vendor in expenses)
 */
const applyBadgeStyles = (data, { nameColIndices = [], paymentColIndex = -1, tierColIndex = -1, amountColIndex = -1 }) => {
    if (data.row.section !== 'body') return

    // 1. Two-color alternating row background (White / Soft Neutral Slate)
    const isEvenRow = data.row.index % 2 === 0
    data.cell.styles.fillColor = isEvenRow ? FIGMA_COLORS.white : FIGMA_COLORS.lightBg
    data.cell.styles.textColor = FIGMA_COLORS.textDark

    // 2. Extract Row Amount & Get Mint Tier Badge
    let badge = null
    if (amountColIndex >= 0) {
        const rawAmount = Array.isArray(data.row.raw) 
            ? data.row.raw[amountColIndex] 
            : (data.row.cells?.[amountColIndex]?.text?.[0] || '')
        badge = getAmountBadge(rawAmount)
    }

    const cellText = String(data.cell.text?.[0] || '')

    // 3. Name Column(s): Styled with Mint-Light background & matching text color as per Amount!
    const isNameCol = Array.isArray(nameColIndices) 
        ? nameColIndices.includes(data.column.index) 
        : (data.column.index === nameColIndices)

    if (isNameCol && cellText && cellText !== '—' && badge) {
        data.cell.styles.fillColor = badge.fillColor
        data.cell.styles.textColor = badge.textColor
        data.cell.styles.fontStyle = 'bold'
    }

    // 4. Amount Column: Styled with Mint-Light background & matching text color as per Amount!
    if (data.column.index === amountColIndex && cellText && cellText !== '—') {
        const amtBadge = badge || getAmountBadge(cellText)
        data.cell.styles.fillColor = amtBadge.fillColor
        data.cell.styles.textColor = amtBadge.textColor
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.halign = 'right'
    }

    // 5. Payment Status Badge
    if (data.column.index === paymentColIndex) {
        if (cellText.includes('Cash & Paid') || cellText.includes('Confirmed')) {
            data.cell.styles.fillColor = FIGMA_COLORS.emeraldBg
            data.cell.styles.textColor = FIGMA_COLORS.emeraldDark
            data.cell.styles.fontStyle = 'bold'
        } else if (cellText.includes('Due') || cellText.includes('Pending')) {
            data.cell.styles.fillColor = FIGMA_COLORS.crimsonBg
            data.cell.styles.textColor = FIGMA_COLORS.crimsonDark
            data.cell.styles.fontStyle = 'bold'
        } else if (cellText.includes('Online') || cellText.includes('Digital')) {
            data.cell.styles.fillColor = FIGMA_COLORS.blueBg
            data.cell.styles.textColor = FIGMA_COLORS.blueDark
            data.cell.styles.fontStyle = 'bold'
        } else if (cellText.includes('Coupon') || cellText.includes('Token')) {
            data.cell.styles.fillColor = [254, 243, 199]
            data.cell.styles.textColor = [180, 83, 9]
            data.cell.styles.fontStyle = 'bold'
        }
    }

    // 6. Access Tier Badge
    if (data.column.index === tierColIndex) {
        if (cellText.includes('VIP') || cellText.includes('Elite')) {
            data.cell.styles.fillColor = [238, 242, 255]
            data.cell.styles.textColor = [67, 56, 202]
            data.cell.styles.fontStyle = 'bold'
        } else if (cellText.includes('Prime')) {
            data.cell.styles.fillColor = FIGMA_COLORS.purpleBg
            data.cell.styles.textColor = FIGMA_COLORS.purpleDark
            data.cell.styles.fontStyle = 'bold'
        } else if (cellText.includes('Admin')) {
            data.cell.styles.fillColor = FIGMA_COLORS.emeraldBg
            data.cell.styles.textColor = FIGMA_COLORS.emeraldDark
            data.cell.styles.fontStyle = 'bold'
        }
    }
}

// ============================================================================
// 1. ATTENDEE MASTER DIRECTORY (A4 LANDSCAPE: 297mm x 210mm)
// ============================================================================
export const exportAttendeeMasterPDF = ({ subscriptionsList, activeTitle, entityName, getTierDisplayName, getPaymentDisplayName }) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const list = subscriptionsList || []

    const totalRevenue = list.reduce((acc, s) => acc + (Number(String(s.amount || 0).replace(/[^0-9.]/g, '')) || 0), 0)
    const cashTotal = list.filter(s => s.paymentType === 'Cash & Paid').reduce((acc, s) => acc + (Number(String(s.amount || 0).replace(/[^0-9.]/g, '')) || 0), 0)
    const onlineTotal = list.filter(s => s.paymentType === 'Online').reduce((acc, s) => acc + (Number(String(s.amount || 0).replace(/[^0-9.]/g, '')) || 0), 0)
    const duesTotal = list.filter(s => s.paymentType === 'Due').reduce((acc, s) => acc + (Number(String(s.amount || 0).replace(/[^0-9.]/g, '')) || 0), 0)

    // Centered Header
    drawHeader(doc, {
        title: `Attendee Master Directory: ${activeTitle || 'All Attendees'}`,
        subtitle: `Entity: ${entityName || 'Vishwa Utsav'}  |  Total Registered: ${list.length} Attendees  |  Generated: ${new Date().toLocaleString()}`,
        accentColor: FIGMA_COLORS.saffron,
        isLandscape: true
    })

    // 5 Bento KPI Mini-Cards across 269mm (Y = 31mm, height = 12.5mm)
    const cardY = 31
    const cardH = 12.5
    const cardW = 50.5
    const gap = 4.1
    const kpis = [
        { label: 'TOTAL ATTENDEES', value: `${list.length} Members`, color: FIGMA_COLORS.slateNavy },
        { label: 'TOTAL REVENUE', value: fmtCurrency(totalRevenue), color: FIGMA_COLORS.emerald },
        { label: 'CASH COLLECTED', value: fmtCurrency(cashTotal), color: FIGMA_COLORS.emeraldDark },
        { label: 'ONLINE / DIGITAL', value: fmtCurrency(onlineTotal), color: FIGMA_COLORS.blue },
        { label: 'OUTSTANDING DUES', value: fmtCurrency(duesTotal), color: FIGMA_COLORS.crimson }
    ]

    kpis.forEach((kpi, idx) => {
        const x = 14 + idx * (cardW + gap)
        doc.setFillColor(...FIGMA_COLORS.lightBg)
        doc.roundedRect(x, cardY, cardW, cardH, 2, 2, 'F')
        doc.setDrawColor(...FIGMA_COLORS.border)
        doc.setLineWidth(0.3)
        doc.roundedRect(x, cardY, cardW, cardH, 2, 2, 'S')

        // Top accent line
        doc.setFillColor(...kpi.color)
        doc.rect(x + 2, cardY, cardW - 4, 1.2, 'F')

        // Label
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.2)
        doc.setTextColor(...FIGMA_COLORS.muted)
        doc.text(kpi.label, x + 3.5, cardY + 5.2)

        // Value
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(...kpi.color)
        doc.text(kpi.value, x + 3.5, cardY + 10)
    })

    // Table starts directly below KPIs with zero wasted whitespace
    autoTable(doc, {
        startY: 47,
        margin: { left: 14, right: 14 },
        head: [['#', 'Pass ID', 'Date', 'Full Name', 'Contact Number', 'Address / City', 'Payment Mode', 'Access Tier', 'Amount']],
        body: list.map((s, idx) => [
            String(idx + 1),
            String(s.subId || s.cardId || '—'),
            s.date ? new Date(s.date).toLocaleDateString() : '—',
            String(s.name || '—'),
            `${s.countryCode || ''} ${s.contact || '—'}`.trim(),
            String(s.address || '—'),
            s.paymentType === 'Online' && s.onlineParticulars ? `Online (${s.onlineParticulars})` : (getPaymentDisplayName ? getPaymentDisplayName(s.paymentType) : (s.paymentType || '—')),
            getTierDisplayName ? getTierDisplayName(s.membershipType) : (s.membershipType || 'Regular'),
            fmtCurrency(s.amount)
        ]),
        theme: 'grid',
        headStyles: {
            fillColor: FIGMA_COLORS.slateNavy,
            textColor: [255, 255, 255],
            fontSize: 7.8,
            fontStyle: 'bold',
            halign: 'left',
            cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 }
        },
        bodyStyles: {
            fontSize: 7.2,
            textColor: FIGMA_COLORS.textDark,
            cellPadding: { top: 2.2, bottom: 2.2, left: 2.5, right: 2.5 },
            lineColor: FIGMA_COLORS.border,
            lineWidth: 0.15
        },
        columnStyles: {
            0: { cellWidth: 9, halign: 'center', fontStyle: 'bold' },
            1: { cellWidth: 26, fontStyle: 'bold', textColor: FIGMA_COLORS.slateNavy },
            2: { cellWidth: 20 },
            3: { cellWidth: 46, fontStyle: 'bold' }, // Full Name (styled with Mint Tier as per Amount)
            4: { cellWidth: 28 },
            5: { cellWidth: 47 },
            6: { cellWidth: 36 },
            7: { cellWidth: 33 },
            8: { cellWidth: 24, halign: 'right', fontStyle: 'bold' } // Amount (styled with Mint Tier as per Amount)
        },
        didParseCell: (data) => applyBadgeStyles(data, { 
            nameColIndices: [3], 
            paymentColIndex: 6, 
            tierColIndex: 7, 
            amountColIndex: 8 
        })
    })

    drawFooter(doc, true)
    doc.save(`Attendees_${String(activeTitle || 'Roster').replace(/\s+/g, '_')}.pdf`)
}

// ============================================================================
// 2. ALL EXPENSES LEDGER (A4 PORTRAIT: 210mm x 297mm)
// ============================================================================
export const exportExpenseLedgerPDF = ({ expensesList, activeTitle, entityName, expenseTypes = [] }) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const list = expensesList || []
    const totalExpenses = list.reduce((acc, e) => acc + (Number(String(e.amount || 0).replace(/[^0-9.]/g, '')) || 0), 0)

    drawHeader(doc, {
        title: `Expenditure Ledger: ${activeTitle || 'All Expenses'}`,
        subtitle: `Entity: ${entityName || 'Vishwa Utsav'}  |  Vouchers: ${list.length}  |  Generated: ${new Date().toLocaleString()}`,
        accentColor: FIGMA_COLORS.crimson,
        isLandscape: false
    })

    // 3 Bento KPI Mini-Cards across 182mm (Y = 31mm, height = 13mm)
    const cardY = 31
    const cardH = 13
    const cardW = 58
    const gap = 4
    const kpis = [
        { label: 'TOTAL RESOURCE SPENDING', value: fmtCurrency(totalExpenses), color: FIGMA_COLORS.crimson },
        { label: 'RECORDED VOUCHERS', value: `${list.length} Records`, color: FIGMA_COLORS.slateNavy },
        { label: 'ACTIVE EXPENSE TYPES', value: `${expenseTypes.length || 7} Categories`, color: FIGMA_COLORS.saffron }
    ]

    kpis.forEach((kpi, idx) => {
        const x = 14 + idx * (cardW + gap)
        doc.setFillColor(...FIGMA_COLORS.lightBg)
        doc.roundedRect(x, cardY, cardW, cardH, 2, 2, 'F')
        doc.setDrawColor(...FIGMA_COLORS.border)
        doc.setLineWidth(0.3)
        doc.roundedRect(x, cardY, cardW, cardH, 2, 2, 'S')

        doc.setFillColor(...kpi.color)
        doc.rect(x + 2, cardY, cardW - 4, 1.2, 'F')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.2)
        doc.setTextColor(...FIGMA_COLORS.muted)
        doc.text(kpi.label, x + 3.5, cardY + 5.2)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9.5)
        doc.setTextColor(...kpi.color)
        doc.text(kpi.value, x + 3.5, cardY + 10.2)
    })

    // Table starts directly below KPIs
    autoTable(doc, {
        startY: 47,
        margin: { left: 14, right: 14 },
        head: [['Date', 'Voucher ID', 'Particulars / Item', 'Paid To / Vendor', 'Contact', 'Category', 'Amount']],
        body: list.map(e => [
            e.date ? new Date(e.date).toLocaleDateString() : '—',
            String(e.expenseId || '—'),
            String(e.particular || '—'),
            String(e.paidTo || '—'),
            String(e.contact || '—'),
            String(e.expenseType || 'General'),
            fmtCurrency(e.amount)
        ]),
        theme: 'grid',
        headStyles: {
            fillColor: FIGMA_COLORS.crimson,
            textColor: [255, 255, 255],
            fontSize: 7.8,
            fontStyle: 'bold',
            halign: 'left',
            cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 }
        },
        bodyStyles: {
            fontSize: 7.2,
            textColor: FIGMA_COLORS.textDark,
            cellPadding: { top: 2.2, bottom: 2.2, left: 2.5, right: 2.5 },
            lineColor: FIGMA_COLORS.border,
            lineWidth: 0.15
        },
        columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 25, fontStyle: 'bold', textColor: FIGMA_COLORS.slateNavy },
            2: { cellWidth: 43, fontStyle: 'bold' }, // Particulars / Item Name
            3: { cellWidth: 32, fontStyle: 'bold' }, // Paid To / Vendor Name
            4: { cellWidth: 22 },
            5: { cellWidth: 21 },
            6: { cellWidth: 19, halign: 'right', fontStyle: 'bold' } // Amount
        },
        didParseCell: (data) => applyBadgeStyles(data, { 
            nameColIndices: [2, 3], 
            amountColIndex: 6 
        })
    })

    drawFooter(doc, false)
    doc.save(`Expenses_${String(activeTitle || 'Ledger').replace(/\s+/g, '_')}.pdf`)
}

// ============================================================================
// 3. BALANCE SHEET & FINANCIAL AUDIT (A4 PORTRAIT: 210mm x 297mm)
// ============================================================================
export const exportBalanceSheetPDF = ({ subscriptionsList, expensesList, activeTitle, entityName, expenseTypes = [] }) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const totalCollection = (subscriptionsList || []).reduce((acc, s) => acc + (Number(String(s.amount || 0).replace(/[^0-9.]/g, '')) || 0), 0)
    const totalExpenses = (expensesList || []).reduce((acc, e) => acc + (Number(String(e.amount || 0).replace(/[^0-9.]/g, '')) || 0), 0)
    const totalDues = (subscriptionsList || []).filter(s => s.paymentType === 'Due').reduce((acc, s) => acc + (Number(String(s.amount || 0).replace(/[^0-9.]/g, '')) || 0), 0)
    const netBalance = totalCollection - totalExpenses

    drawHeader(doc, {
        title: `Balance Sheet & Financial Audit: ${activeTitle || 'General'}`,
        subtitle: `Entity: ${entityName || 'Vishwa Utsav'}  |  Consolidated Financial Ledger  |  Generated: ${new Date().toLocaleString()}`,
        accentColor: FIGMA_COLORS.emerald,
        isLandscape: false
    })

    // 4 Bento KPI Metric Cards across 182mm (Y = 31mm, height = 15mm)
    const cardY = 31
    const cardH = 15
    const cardW = 43
    const gap = 3.3
    const kpis = [
        { label: 'TOTAL COLLECTION', value: fmtCurrency(totalCollection), color: FIGMA_COLORS.emerald, sub: 'Verified Inflow' },
        { label: 'PENDING DUES', value: fmtCurrency(totalDues), color: [217, 119, 6], sub: 'Pending Clearance' },
        { label: 'TOTAL EXPENSES', value: fmtCurrency(totalExpenses), color: FIGMA_COLORS.crimson, sub: 'Resource Outflows' },
        { label: 'NET BALANCE', value: fmtCurrency(netBalance), color: netBalance >= 0 ? FIGMA_COLORS.blue : FIGMA_COLORS.crimson, sub: netBalance >= 0 ? 'Operating Surplus' : 'Operating Deficit' }
    ]

    kpis.forEach((kpi, idx) => {
        const x = 14 + idx * (cardW + gap)
        doc.setFillColor(...FIGMA_COLORS.lightBg)
        doc.roundedRect(x, cardY, cardW, cardH, 2, 2, 'F')
        doc.setDrawColor(...FIGMA_COLORS.border)
        doc.setLineWidth(0.3)
        doc.roundedRect(x, cardY, cardW, cardH, 2, 2, 'S')

        doc.setFillColor(...kpi.color)
        doc.rect(x + 2, cardY, cardW - 4, 1.2, 'F')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(5.8)
        doc.setTextColor(...FIGMA_COLORS.muted)
        doc.text(kpi.label, x + 3, cardY + 5)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.8)
        doc.setTextColor(...kpi.color)
        doc.text(kpi.value, x + 3, cardY + 9.8)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(5.5)
        doc.setTextColor(...FIGMA_COLORS.muted)
        doc.text(kpi.sub, x + 3, cardY + 13.5)
    })

    // Section 1: Executive Audit Summary Table
    autoTable(doc, {
        startY: 49,
        margin: { left: 14, right: 14 },
        head: [['EXECUTIVE FINANCIAL METRIC', 'AUDIT STATUS', 'CONSOLIDATED AMOUNT']],
        body: [
            ['Gross Revenue & Registrations', 'Verified Inflow', fmtCurrency(totalCollection)],
            ['Outstanding Attendee Dues', 'Receivable', fmtCurrency(totalDues)],
            ['Total Operational Disbursements', 'Audited Outflow', fmtCurrency(totalExpenses)],
            ['Net Financial Position', netBalance >= 0 ? 'Net Surplus' : 'Net Deficit', fmtCurrency(netBalance)]
        ],
        theme: 'striped',
        headStyles: {
            fillColor: FIGMA_COLORS.slateNavy,
            textColor: [255, 255, 255],
            fontSize: 7.8,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 7.5,
            cellPadding: { top: 2.4, bottom: 2.4, left: 3, right: 3 }
        },
        columnStyles: {
            0: { cellWidth: 92, fontStyle: 'bold' },
            1: { cellWidth: 45, fontStyle: 'bold' },
            2: { cellWidth: 45, halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: (data) => {
            if (data.row.section === 'body') {
                const isEvenRow = data.row.index % 2 === 0
                data.cell.styles.fillColor = isEvenRow ? FIGMA_COLORS.white : FIGMA_COLORS.lightBg

                if (data.row.index === 3) {
                    data.cell.styles.fillColor = netBalance >= 0 ? FIGMA_COLORS.emeraldBg : FIGMA_COLORS.crimsonBg
                    data.cell.styles.textColor = netBalance >= 0 ? FIGMA_COLORS.emeraldDark : FIGMA_COLORS.crimsonDark
                    data.cell.styles.fontStyle = 'bold'
                }
            }
        }
    })

    // Section 2: Detailed Comparative Breakdown Table
    const incomeRows = [
        ['Income: Cash & Paid', fmtCurrency((subscriptionsList || []).filter(s => s.paymentType === 'Cash & Paid').reduce((a, b) => a + (Number(b.amount) || 0), 0))],
        ['Income: Online / Digital', fmtCurrency((subscriptionsList || []).filter(s => s.paymentType === 'Online').reduce((a, b) => a + (Number(b.amount) || 0), 0))],
        ['Income: Coupon / Token', fmtCurrency((subscriptionsList || []).filter(s => s.paymentType === 'Coupon / Token').reduce((a, b) => a + (Number(b.amount) || 0), 0))]
    ]

    const expenseRows = (expenseTypes || []).map(type => {
        const amt = (expensesList || []).filter(e => e.expenseType === type).reduce((a, b) => a + (Number(b.amount) || 0), 0)
        return [`Expense: ${type}`, fmtCurrency(amt)]
    }).filter(r => r[1] !== 'Rs. 0')

    const table2Body = []
    const maxLen = Math.max(incomeRows.length, expenseRows.length)
    for (let i = 0; i < maxLen; i++) {
        const inc = incomeRows[i] || ['—', '—']
        const exp = expenseRows[i] || ['—', '—']
        table2Body.push([inc[0], inc[1], exp[0], exp[1]])
    }
    table2Body.push(['TOTAL INFLOW', fmtCurrency(totalCollection), 'TOTAL OUTFLOW', fmtCurrency(totalExpenses)])

    const nextY = (doc.lastAutoTable?.finalY || 100) + 7
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...FIGMA_COLORS.slateNavy)
    doc.text('DETAILED INFLOW SOURCES & EXPENSE ALLOCATIONS', 14, nextY)

    autoTable(doc, {
        startY: nextY + 3,
        margin: { left: 14, right: 14 },
        head: [['INFLOW CHANNEL', 'INCOME (RS)', 'EXPENSE CATEGORY', 'EXPENSE (RS)']],
        body: table2Body,
        theme: 'grid',
        headStyles: {
            fillColor: FIGMA_COLORS.emerald,
            textColor: [255, 255, 255],
            fontSize: 7.5,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 7.2,
            cellPadding: { top: 2.2, bottom: 2.2, left: 2.5, right: 2.5 }
        },
        columnStyles: {
            0: { cellWidth: 50, fontStyle: 'bold' },
            1: { cellWidth: 41, halign: 'right', fontStyle: 'bold' },
            2: { cellWidth: 50, fontStyle: 'bold' },
            3: { cellWidth: 41, halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: (data) => {
            if (data.row.section === 'body') {
                if (data.row.index === table2Body.length - 1) {
                    // Final Totals Row
                    data.cell.styles.fillColor = FIGMA_COLORS.slateNavy
                    data.cell.styles.textColor = [255, 255, 255]
                    data.cell.styles.fontStyle = 'bold'
                } else {
                    // 2-color alternate row background by default
                    const isEvenRow = data.row.index % 2 === 0
                    data.cell.styles.fillColor = isEvenRow ? FIGMA_COLORS.white : FIGMA_COLORS.lightBg

                    // Dynamic Mint Tier Styling on Name (Col 0) & Amount (Col 1)
                    const incomeVal = data.row.raw?.[1] || data.row.cells?.[1]?.text?.[0]
                    if (incomeVal && incomeVal !== '—') {
                        const incBadge = getAmountBadge(incomeVal)
                        if (data.column.index === 0 || data.column.index === 1) {
                            data.cell.styles.fillColor = incBadge.fillColor
                            data.cell.styles.textColor = incBadge.textColor
                            data.cell.styles.fontStyle = 'bold'
                        }
                    }

                    // Dynamic Mint Tier Styling on Name (Col 2) & Amount (Col 3)
                    const expVal = data.row.raw?.[3] || data.row.cells?.[3]?.text?.[0]
                    if (expVal && expVal !== '—') {
                        const expBadge = getAmountBadge(expVal)
                        if (data.column.index === 2 || data.column.index === 3) {
                            data.cell.styles.fillColor = expBadge.fillColor
                            data.cell.styles.textColor = expBadge.textColor
                            data.cell.styles.fontStyle = 'bold'
                        }
                    }
                }
            }
        }
    })

    // Certification Box
    const certY = (doc.lastAutoTable?.finalY || 180) + 8
    if (certY < 250) {
        doc.setFillColor(...FIGMA_COLORS.lightBg)
        doc.roundedRect(14, certY, 182, 18, 2, 2, 'F')
        doc.setDrawColor(...FIGMA_COLORS.border)
        doc.setLineWidth(0.3)
        doc.roundedRect(14, certY, 182, 18, 2, 2, 'S')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.5)
        doc.setTextColor(...FIGMA_COLORS.slateNavy)
        doc.text('TREASURY AUDIT CERTIFICATION', 18, certY + 6)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6.8)
        doc.setTextColor(...FIGMA_COLORS.muted)
        doc.text('This statement has been electronically reconciled against all registered receipts and verified disbursements.', 18, certY + 11)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(...FIGMA_COLORS.emeraldDark)
        doc.text('STATUS: VERIFIED & BALANCED', 140, certY + 11)
    }

    drawFooter(doc, false)
    doc.save(`BalanceSheet_${String(activeTitle || 'Audit').replace(/\s+/g, '_')}.pdf`)
}

// ============================================================================
// 4. MASTER DATA AUDIT PACKAGE (A4 LANDSCAPE: 297mm x 210mm)
// ============================================================================
export const exportMasterDataPackagePDF = ({ subscriptionsList, expensesList, activeTitle, entityName, expenseTypes = [], getTierDisplayName, getPaymentDisplayName }) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    const totalCollection = (subscriptionsList || []).reduce((acc, s) => acc + (Number(String(s.amount || 0).replace(/[^0-9.]/g, '')) || 0), 0)
    const totalExpenses = (expensesList || []).reduce((acc, e) => acc + (Number(String(e.amount || 0).replace(/[^0-9.]/g, '')) || 0), 0)
    const netBalance = totalCollection - totalExpenses

    drawHeader(doc, {
        title: `Master Audit Package: ${activeTitle || 'Complete Data Bundle'}`,
        subtitle: `Entity: ${entityName || 'Vishwa Utsav'}  |  Complete Unified Master Records  |  Generated: ${new Date().toLocaleString()}`,
        accentColor: FIGMA_COLORS.purple,
        isLandscape: true
    })

    // Section 1: Attendees
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...FIGMA_COLORS.slateNavy)
    doc.text('1. ATTENDEES & PASSES REGISTER', 14, 33)

    autoTable(doc, {
        startY: 36,
        margin: { left: 14, right: 14 },
        head: [['#', 'Pass ID', 'Date', 'Full Name', 'Contact', 'Address', 'Payment', 'Tier', 'Amount']],
        body: (subscriptionsList || []).map((s, idx) => [
            String(idx + 1),
            String(s.subId || s.cardId || '—'),
            s.date ? new Date(s.date).toLocaleDateString() : '—',
            String(s.name || '—'),
            `${s.countryCode || ''} ${s.contact || '—'}`.trim(),
            String(s.address || '—'),
            s.paymentType === 'Online' && s.onlineParticulars ? `Online (${s.onlineParticulars})` : (getPaymentDisplayName ? getPaymentDisplayName(s.paymentType) : (s.paymentType || '—')),
            getTierDisplayName ? getTierDisplayName(s.membershipType) : (s.membershipType || 'Regular'),
            fmtCurrency(s.amount)
        ]),
        theme: 'grid',
        headStyles: { fillColor: FIGMA_COLORS.slateNavy, fontSize: 7.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7, cellPadding: { top: 2, bottom: 2, left: 2.2, right: 2.2 } },
        columnStyles: {
            0: { cellWidth: 9, halign: 'center' },
            1: { cellWidth: 26, fontStyle: 'bold' },
            2: { cellWidth: 20 },
            3: { cellWidth: 46, fontStyle: 'bold' }, // Name
            4: { cellWidth: 28 },
            5: { cellWidth: 47 },
            6: { cellWidth: 36 },
            7: { cellWidth: 33 },
            8: { cellWidth: 24, halign: 'right', fontStyle: 'bold' } // Amount
        },
        didParseCell: (data) => applyBadgeStyles(data, { 
            nameColIndices: [3], 
            paymentColIndex: 6, 
            tierColIndex: 7, 
            amountColIndex: 8 
        })
    })

    // Section 2: Expenses
    let nextY = (doc.lastAutoTable?.finalY || 40) + 8
    if (nextY > 165) {
        doc.addPage()
        nextY = 20
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...FIGMA_COLORS.crimson)
    doc.text('2. EXPENDITURE LEDGER', 14, nextY)

    autoTable(doc, {
        startY: nextY + 3,
        margin: { left: 14, right: 14 },
        head: [['Date', 'Voucher ID', 'Particulars', 'Paid To / Vendor', 'Contact', 'Category', 'Amount']],
        body: (expensesList || []).map(e => [
            e.date ? new Date(e.date).toLocaleDateString() : '—',
            String(e.expenseId || '—'),
            String(e.particular || '—'),
            String(e.paidTo || '—'),
            String(e.contact || '—'),
            String(e.expenseType || 'General'),
            fmtCurrency(e.amount)
        ]),
        theme: 'grid',
        headStyles: { fillColor: FIGMA_COLORS.crimson, fontSize: 7.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7, cellPadding: { top: 2, bottom: 2, left: 2.2, right: 2.2 } },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 32, fontStyle: 'bold' },
            2: { cellWidth: 65, fontStyle: 'bold' }, // Particulars / Item Name
            3: { cellWidth: 45, fontStyle: 'bold' }, // Paid To / Vendor Name
            4: { cellWidth: 35 },
            5: { cellWidth: 35 },
            6: { cellWidth: 32, halign: 'right', fontStyle: 'bold' } // Amount
        },
        didParseCell: (data) => applyBadgeStyles(data, { 
            nameColIndices: [2, 3], 
            amountColIndex: 6 
        })
    })

    // Section 3: Financial Summary
    nextY = (doc.lastAutoTable?.finalY || nextY) + 8
    if (nextY > 165) {
        doc.addPage()
        nextY = 20
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...FIGMA_COLORS.emerald)
    doc.text('3. CONSOLIDATED AUDIT SUMMARY', 14, nextY)

    autoTable(doc, {
        startY: nextY + 3,
        margin: { left: 14, right: 14 },
        head: [['METRIC', 'STATUS', 'NET VALUE']],
        body: [
            ['Total Verified Revenue Inflows', 'Verified', fmtCurrency(totalCollection)],
            ['Total Operational Outflows', 'Audited', fmtCurrency(totalExpenses)],
            ['Net Financial Position', netBalance >= 0 ? 'Surplus' : 'Deficit', fmtCurrency(netBalance)]
        ],
        theme: 'striped',
        headStyles: { fillColor: FIGMA_COLORS.emerald, fontSize: 7.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7.2, fontStyle: 'bold', cellPadding: { top: 2.2, bottom: 2.2, left: 3, right: 3 } },
        columnStyles: {
            0: { cellWidth: 120 },
            1: { cellWidth: 60 },
            2: { cellWidth: 89, halign: 'right' }
        },
        didParseCell: (data) => {
            if (data.row.section === 'body') {
                const isEvenRow = data.row.index % 2 === 0
                data.cell.styles.fillColor = isEvenRow ? FIGMA_COLORS.white : FIGMA_COLORS.lightBg

                if (data.column.index === 0 || data.column.index === 2) {
                    const badge = getAmountBadge(data.cell.text?.[0])
                    data.cell.styles.fillColor = badge.fillColor
                    data.cell.styles.textColor = badge.textColor
                    data.cell.styles.fontStyle = 'bold'
                }
            }
        }
    })

    drawFooter(doc, true)
    doc.save(`MASTER_DATA_${String(activeTitle || 'Bundle').replace(/\s+/g, '_')}.pdf`)
}

// ============================================================================
// 5. INDIVIDUAL ATTENDEE OFFICIAL RECEIPT (A4 PORTRAIT: 210mm x 297mm)
// ============================================================================
export const exportSingleAttendeeReceiptPDF = async ({ sub, festOrEvent = {}, entityName = '', getTierDisplayName, getPaymentDisplayName }) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const logoImg = await getLogoImage()

    // Centered Header (Official Subscription Receipt without subtitle)
    drawHeader(doc, {
        title: 'Official Subscription Receipt',
        subtitle: '',
        accentColor: FIGMA_COLORS.saffron,
        isLandscape: false
    })

    // Bento Summary Box (Y = 31mm, height = 20mm, width = 182mm)
    const boxY = 31
    doc.setFillColor(...FIGMA_COLORS.lightBg)
    doc.roundedRect(14, boxY, 182, 20, 3, 3, 'F')
    doc.setDrawColor(...FIGMA_COLORS.border)
    doc.setLineWidth(0.35)
    doc.roundedRect(14, boxY, 182, 20, 3, 3, 'S')

    // Left: Name & Pass ID
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...FIGMA_COLORS.textDark)
    doc.text(String(sub.name || 'ATTENDEE').toUpperCase(), 18, boxY + 7.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...FIGMA_COLORS.muted)
    doc.text(`Pass ID: ${sub.subId || sub.cardId || '—'}  |  Issued: ${sub.date ? new Date(sub.date).toLocaleDateString() : new Date().toLocaleDateString()}`, 18, boxY + 14)

    // Right: Net Amount Paid with Mint Tier Badge
    const amtBadge = getAmountBadge(sub.amount)
    const amtText = fmtCurrency(sub.amount)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    const badgeW = doc.getTextWidth(amtText) + 8
    const badgeH = 7.5
    const badgeX = 192 - badgeW
    const badgeY = boxY + 4.5

    doc.setFillColor(...amtBadge.fillColor)
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.8, 1.8, 'F')
    doc.setTextColor(...amtBadge.textColor)
    doc.text(amtText, badgeX + 4, badgeY + 5.2)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.2)
    doc.setTextColor(...FIGMA_COLORS.muted)
    doc.text(getPaymentDisplayName ? getPaymentDisplayName(sub.paymentType) : String(sub.paymentType || 'Paid'), 192, boxY + 16, { align: 'right' })

    // Table 1: Festival / Event Details
    autoTable(doc, {
        startY: 55,
        margin: { left: 14, right: 14 },
        head: [['EVENT / FESTIVAL CONTEXT', 'DETAILS']],
        body: [
            ['Event / Festival Name', String(sub.festOrEventName || festOrEvent.title || '—')],
            ['Venue / Location', String(festOrEvent.location || '—')],
            ['Schedule / Dates', festOrEvent.startDate ? `${new Date(festOrEvent.startDate).toLocaleDateString()} - ${new Date(festOrEvent.endDate).toLocaleDateString()}` : (festOrEvent.date ? new Date(festOrEvent.date).toLocaleDateString() : 'Full Event')],
            ['Managing Entity', String(festOrEvent.entityName || entityName || 'Vishwa Utsav')],
            ['Category', String(festOrEvent.category || 'Cultural')]
        ],
        theme: 'striped',
        headStyles: { fillColor: FIGMA_COLORS.slateNavy, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7.5, cellPadding: { top: 2.2, bottom: 2.2, left: 3, right: 3 } },
        columnStyles: {
            0: { cellWidth: 50, fontStyle: 'bold' },
            1: { cellWidth: 132 }
        }
    })

    // Table 2: Attendee Particulars
    const attendeeBody = [
        ['Full Name', String(sub.name || '—')],
        ['Contact Number', `${sub.countryCode || ''} ${sub.contact || '—'}`.trim()],
        ['Address', String(sub.address || '—')],
        ['Access Tier', getTierDisplayName ? getTierDisplayName(sub.membershipType) : String(sub.membershipType || 'Regular')],
        ['Payment Method', getPaymentDisplayName ? getPaymentDisplayName(sub.paymentType) : String(sub.paymentType || 'Cash & Paid')],
        ['Total Net Amount', fmtCurrency(sub.amount)]
    ]
    if (sub.paymentType === 'Online') {
        if (sub.onlineParticulars) attendeeBody.push(['Bank / Particulars', String(sub.onlineParticulars)])
        if (sub.onlineReference) attendeeBody.push(['Reference No. / UTR', String(sub.onlineReference)])
    }

    const nextY = (doc.lastAutoTable?.finalY || 100) + 7
    autoTable(doc, {
        startY: nextY,
        margin: { left: 14, right: 14 },
        head: [['ATTENDEE REGISTRATION PARTICULAR', 'REGISTERED VALUE']],
        body: attendeeBody,
        theme: 'grid',
        headStyles: { fillColor: FIGMA_COLORS.saffron, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7.5, cellPadding: { top: 2.2, bottom: 2.2, left: 3, right: 3 } },
        columnStyles: {
            0: { cellWidth: 50, fontStyle: 'bold' },
            1: { cellWidth: 132 }
        },
        didParseCell: (data) => {
            if (data.row.section === 'body') {
                const isEvenRow = data.row.index % 2 === 0
                data.cell.styles.fillColor = isEvenRow ? FIGMA_COLORS.white : FIGMA_COLORS.lightBg

                // Name Row and Amount Row matching Mint Tier
                const rowTitle = data.row.cells[0]?.text?.[0]
                if (rowTitle === 'Full Name' || rowTitle === 'Total Net Amount') {
                    const badge = getAmountBadge(sub.amount)
                    data.cell.styles.fillColor = badge.fillColor
                    data.cell.styles.textColor = badge.textColor
                    data.cell.styles.fontStyle = 'bold'
                }
            }
        }
    })

    // Verification & Signatures Block
    const signY = (doc.lastAutoTable?.finalY || 180) + 12
    if (signY < 240) {
        // VU Verification Box (Width 86mm, Height 24mm)
        const boxW = 86
        const boxH = 24
        doc.setFillColor(...FIGMA_COLORS.lightBg)
        doc.roundedRect(14, signY, boxW, boxH, 2.5, 2.5, 'F')
        doc.setDrawColor(...FIGMA_COLORS.border)
        doc.setLineWidth(0.35)
        doc.roundedRect(14, signY, boxW, boxH, 2.5, 2.5, 'S')

        // VU Logo Emblem inside box
        if (logoImg) {
            try {
                doc.addImage(logoImg, 'PNG', 17, signY + 3.5, 17, 17)
            } catch (err) {
                doc.setFillColor(...FIGMA_COLORS.navyDark)
                doc.roundedRect(17, signY + 3.5, 17, 17, 2, 2, 'F')
                doc.setFont('helvetica', 'bold')
                doc.setFontSize(8)
                doc.setTextColor(...FIGMA_COLORS.amber)
                doc.text('VU', 25.5, signY + 14, { align: 'center' })
            }
        } else {
            doc.setFillColor(...FIGMA_COLORS.navyDark)
            doc.roundedRect(17, signY + 3.5, 17, 17, 2, 2, 'F')
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(8)
            doc.setTextColor(...FIGMA_COLORS.amber)
            doc.text('VU', 25.5, signY + 14, { align: 'center' })
        }

        // Vertical divider line between logo and text
        doc.setDrawColor(...FIGMA_COLORS.border)
        doc.setLineWidth(0.3)
        doc.line(37, signY + 3.5, 37, signY + 20.5)

        // Verification Details
        const textX = 40
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.8)
        doc.setTextColor(...FIGMA_COLORS.emeraldDark)
        doc.text('DIGITAL RECEIPT VERIFIED', textX, signY + 7.5)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.2)
        doc.setTextColor(...FIGMA_COLORS.slateNavy)
        doc.text(`SecHash: ${String(sub.subId || sub.cardId || 'PASS').slice(0, 12)}`, textX, signY + 12.2)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(5.8)
        doc.setTextColor(...FIGMA_COLORS.muted)
        doc.text('Scannable for Venue Access', textX, signY + 16.5)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(5.6)
        doc.setTextColor(...FIGMA_COLORS.saffron)
        doc.text('Official Certified Copy', textX, signY + 20.5)

        // Signature Line
        doc.setDrawColor(...FIGMA_COLORS.border)
        doc.setLineWidth(0.35)
        doc.line(140, signY + 16, 196, signY + 16)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.2)
        doc.setTextColor(...FIGMA_COLORS.slateNavy)
        doc.text('Authorized Signatory', 168, signY + 20.5, { align: 'center' })

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(5.8)
        doc.setTextColor(...FIGMA_COLORS.muted)
        doc.text(String(festOrEvent.entityName || entityName || 'Vishwa Utsav Entity'), 168, signY + 23.5, { align: 'center' })
    }

    drawFooter(doc, false)
    doc.save(`Receipt_${sub.subId || 'Pass'}_${String(sub.name || 'Attendee').replace(/\s+/g, '_')}.pdf`)
}

// ============================================================================
// 6. INDIVIDUAL EXPENSE VOUCHER (A4 PORTRAIT: 210mm x 297mm)
// ============================================================================
export const exportSingleExpenseVoucherPDF = async ({ exp, festOrEvent = {}, entityName = '' }) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    // Centered Header
    drawHeader(doc, {
        title: 'Disbursement Expense Voucher',
        subtitle: `Authorized Financial Record  |  Ref: ${exp.expenseId || 'VOUCHER'}  |  Vishwa Utsav Treasury`,
        accentColor: FIGMA_COLORS.crimson,
        isLandscape: false
    })

    // Bento Summary Box
    const boxY = 31
    doc.setFillColor(...FIGMA_COLORS.lightBg)
    doc.roundedRect(14, boxY, 182, 20, 3, 3, 'F')
    doc.setDrawColor(...FIGMA_COLORS.border)
    doc.setLineWidth(0.35)
    doc.roundedRect(14, boxY, 182, 20, 3, 3, 'S')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...FIGMA_COLORS.textDark)
    doc.text(String(exp.particular || 'EXPENSE DISBURSEMENT').toUpperCase(), 18, boxY + 7.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...FIGMA_COLORS.muted)
    doc.text(`Ref: ${exp.expenseId || '—'}  |  Date: ${exp.date ? new Date(exp.date).toLocaleDateString() : new Date().toLocaleDateString()}  |  Type: ${exp.expenseType || 'General'}`, 18, boxY + 14)

    // Right: Net Amount Paid with Mint Tier Badge
    const amtBadge = getAmountBadge(exp.amount)
    const amtText = fmtCurrency(exp.amount)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    const badgeW = doc.getTextWidth(amtText) + 8
    const badgeH = 7.5
    const badgeX = 192 - badgeW
    const badgeY = boxY + 6

    doc.setFillColor(...amtBadge.fillColor)
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.8, 1.8, 'F')
    doc.setTextColor(...amtBadge.textColor)
    doc.text(amtText, badgeX + 4, badgeY + 5.2)

    // Table
    autoTable(doc, {
        startY: 55,
        margin: { left: 14, right: 14 },
        head: [['VOUCHER DETAIL ITEM', 'SPECIFICATION / RECORD']],
        body: [
            ['Voucher Reference', String(exp.expenseId || '—')],
            ['Event / Festival', String(exp.festOrEventName || festOrEvent.title || '—')],
            ['Venue / Location', String(festOrEvent.location || '—')],
            ['Managing Entity', String(festOrEvent.entityName || entityName || 'Vishwa Utsav')],
            ['Expense Category', String(exp.expenseType || '—')],
            ['Particulars / Purpose', String(exp.particular || '—')],
            ['Paid To / Vendor Name', String(exp.paidTo || '—')],
            ['Vendor Contact Number', String(exp.contact || '—')],
            ['Transaction Date', exp.date ? new Date(exp.date).toLocaleDateString() : '—'],
            ['Disbursement Amount', fmtCurrency(exp.amount)]
        ],
        theme: 'grid',
        headStyles: { fillColor: FIGMA_COLORS.crimson, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7.5, cellPadding: { top: 2.3, bottom: 2.3, left: 3, right: 3 } },
        columnStyles: {
            0: { cellWidth: 50, fontStyle: 'bold' },
            1: { cellWidth: 132 }
        },
        didParseCell: (data) => {
            if (data.row.section === 'body') {
                const isEvenRow = data.row.index % 2 === 0
                data.cell.styles.fillColor = isEvenRow ? FIGMA_COLORS.white : FIGMA_COLORS.lightBg

                const rowTitle = data.row.cells[0]?.text?.[0]
                if (rowTitle === 'Particulars / Purpose' || rowTitle === 'Paid To / Vendor Name' || rowTitle === 'Disbursement Amount') {
                    const badge = getAmountBadge(exp.amount)
                    data.cell.styles.fillColor = badge.fillColor
                    data.cell.styles.textColor = badge.textColor
                    data.cell.styles.fontStyle = 'bold'
                }
            }
        }
    })

    // Signatures
    const signY = (doc.lastAutoTable?.finalY || 160) + 14
    if (signY < 240) {
        const sigs = ['Prepared By', 'Verified By (Auditor)', 'Payee / Vendor Signature']
        sigs.forEach((sig, idx) => {
            const x = 14 + idx * 62
            doc.setDrawColor(...FIGMA_COLORS.border)
            doc.setLineWidth(0.35)
            doc.line(x, signY + 16, x + 55, signY + 16)

            doc.setFont('helvetica', 'bold')
            doc.setFontSize(7)
            doc.setTextColor(...FIGMA_COLORS.slateNavy)
            doc.text(sig, x + 27.5, signY + 21, { align: 'center' })
        })
    }

    drawFooter(doc, false)
    doc.save(`Expense_${exp.expenseId || 'Voucher'}.pdf`)
}

// ============================================================================
// 7. COMMITTEE & MEMBERS DIRECTORY (A4 PORTRAIT: 210mm x 297mm)
// ============================================================================
export const exportMembersDirectoryPDF = ({ 
    membersList = [], 
    entityName = '', 
    portalType = 'Festival',
    festivalName = '',
    eventName = ''
}) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const list = membersList || []
    const resolvedFestivalName = String(festivalName || eventName || '').trim()

    const execCount = list.filter(m => /president|secretary|treasurer|lead|head|director/i.test(m.role || '')).length
    const activeCount = list.filter(m => m.status === 'Active').length

    // Centered Header with Festival Name prominence
    const headerTitle = resolvedFestivalName 
        ? `${resolvedFestivalName.toUpperCase()} — ${portalType.toUpperCase()} COMMITTEE`
        : `${portalType.toUpperCase()} COMMITTEE & MEMBERS DIRECTORY`

    const headerSubtitle = [
        resolvedFestivalName ? `${portalType}: ${resolvedFestivalName}` : null,
        `Entity: ${entityName || 'Vishwa Utsav'}`,
        `Roster: ${list.length} Members`,
        `Generated: ${new Date().toLocaleString('en-IN')}`
    ].filter(Boolean).join('  |  ')

    drawHeader(doc, {
        title: headerTitle,
        subtitle: headerSubtitle,
        accentColor: FIGMA_COLORS.saffron,
        isLandscape: false
    })

    // 3 Bento KPI Mini-Cards across full 194mm width (margins: left 8mm, right 8mm)
    const cardY = 31
    const cardH = 13
    const cardW = 62
    const gap = 4
    const kpis = [
        { label: 'TOTAL COMMITTEE MEMBERS', value: `${list.length} Members`, color: FIGMA_COLORS.slateNavy },
        { label: 'EXECUTIVE LEADERSHIP', value: `${execCount} Leaders`, color: FIGMA_COLORS.saffron },
        { label: 'ACTIVE ON ROSTER', value: `${activeCount} Active`, color: FIGMA_COLORS.emerald }
    ]

    kpis.forEach((kpi, idx) => {
        const x = 8 + idx * (cardW + gap)
        doc.setFillColor(...FIGMA_COLORS.lightBg)
        doc.roundedRect(x, cardY, cardW, cardH, 2, 2, 'F')
        doc.setDrawColor(...FIGMA_COLORS.border)
        doc.setLineWidth(0.3)
        doc.roundedRect(x, cardY, cardW, cardH, 2, 2, 'S')

        doc.setFillColor(...kpi.color)
        doc.rect(x + 2, cardY, cardW - 4, 1.2, 'F')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.2)
        doc.setTextColor(...FIGMA_COLORS.muted)
        doc.text(kpi.label, x + 3.5, cardY + 5.2)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9.5)
        doc.setTextColor(...kpi.color)
        doc.text(kpi.value, x + 3.5, cardY + 10.2)
    })

    // Table starts directly below KPIs
    // Total printable width = 194mm (210mm A4 - 16mm margins: left 8mm, right 8mm)
    // Column widths: 6 + 38 + 54 + 24 + 26 + 31 + 15 = 194.0mm
    // Font sizes and paddings tightened to eliminate unnecessary line breaks and vertical spaces
    autoTable(doc, {
        startY: 47,
        margin: { left: 8, right: 8 },
        head: [['#', 'Full Name', 'Role / Designation', 'Department', 'Contact', 'Email Address', 'Status']],
        body: list.map((m, idx) => [
            String(idx + 1),
            String(m.name || '—'),
            String(m.role || 'Member'),
            String(m.department || 'General Committee'),
            m.contact ? `${m.countryCode || '+91'} ${m.contact}` : '—',
            String(m.email || '—'),
            String(m.status || 'Active')
        ]),
        theme: 'grid',
        headStyles: {
            fillColor: FIGMA_COLORS.navyDark,
            textColor: [255, 255, 255],
            fontSize: 7.0,
            fontStyle: 'bold',
            halign: 'left',
            cellPadding: { top: 2.2, bottom: 2.2, left: 1.5, right: 1.5 }
        },
        bodyStyles: {
            fontSize: 6.8,
            textColor: FIGMA_COLORS.textDark,
            cellPadding: { top: 2.0, bottom: 2.0, left: 1.5, right: 1.5 },
            lineColor: FIGMA_COLORS.border,
            lineWidth: 0.15
        },
        columnStyles: {
            0: { cellWidth: 6, halign: 'center' },
            1: { cellWidth: 38, fontStyle: 'bold' },
            2: { cellWidth: 54, fontStyle: 'bold' },
            3: { cellWidth: 24 },
            4: { cellWidth: 26 }, // 26mm guarantees phone numbers like +91 9875557320 fit on 1 line
            5: { cellWidth: 31 },
            6: { cellWidth: 15, halign: 'center', fontStyle: 'bold' } // 15mm guarantees "Status" fits on 1 line without wrapping
        },
        didParseCell: (data) => {
            if (data.row.section === 'body') {
                const isEvenRow = data.row.index % 2 === 0
                data.cell.styles.fillColor = isEvenRow ? FIGMA_COLORS.white : FIGMA_COLORS.lightBg

                // Highlight Executives
                const roleText = String(data.row.cells?.[2]?.text?.[0] || '')
                if (/president|secretary|treasurer/i.test(roleText)) {
                    if (data.column.index === 1 || data.column.index === 2) {
                        data.cell.styles.fillColor = [254, 243, 199] // Soft gold
                        data.cell.styles.textColor = [180, 83, 9]     // Amber
                    }
                }

                // Auto-scale Full Name so it NEVER wraps
                if (data.column.index === 1) {
                    const text = String(data.cell.raw || data.cell.text?.[0] || '')
                    const usableW = 35
                    let fs = 7.0
                    doc.setFont('helvetica', 'bold')
                    doc.setFontSize(fs)
                    while (doc.getTextWidth(text) > usableW && fs > 5.5) {
                        fs -= 0.2
                        doc.setFontSize(fs)
                    }
                    data.cell.styles.fontSize = fs
                }

                // Auto-scale Role / Designation so it NEVER wraps
                if (data.column.index === 2) {
                    const text = String(data.cell.raw || data.cell.text?.[0] || '')
                    const usableW = 51
                    let fs = 6.8
                    doc.setFont('helvetica', 'bold')
                    doc.setFontSize(fs)
                    while (doc.getTextWidth(text) > usableW && fs > 5.2) {
                        fs -= 0.2
                        doc.setFontSize(fs)
                    }
                    data.cell.styles.fontSize = fs
                }

                // Ensure single line Contact
                if (data.column.index === 4) {
                    data.cell.styles.fontSize = 6.8
                }

                // Auto-scale Email Address so it NEVER wraps
                if (data.column.index === 5) {
                    const text = String(data.cell.raw || data.cell.text?.[0] || '')
                    const usableW = 28
                    let fs = 6.5
                    doc.setFont('helvetica', 'normal')
                    doc.setFontSize(fs)
                    while (doc.getTextWidth(text) > usableW && fs > 5.0) {
                        fs -= 0.2
                        doc.setFontSize(fs)
                    }
                    data.cell.styles.fontSize = fs
                }

                // Highlight Status
                if (data.column.index === 6) {
                    data.cell.styles.fontSize = 6.8
                    const statusVal = data.cell.text?.[0]
                    if (statusVal === 'Active') {
                        data.cell.styles.textColor = [4, 120, 87] // Green
                    } else if (statusVal === 'Honorary') {
                        data.cell.styles.textColor = [30, 64, 175] // Blue
                    } else {
                        data.cell.styles.textColor = [156, 163, 175] // Gray
                    }
                }
            }
        }
    })

    // Utilize the remaining space of the page with Official Endorsement & Verification Box
    const finalTableY = doc.lastAutoTable?.finalY || 160
    const pageH = 297
    const footerTop = pageH - 14

    if (finalTableY + 40 < footerTop) {
        const boxY = finalTableY + 5
        const boxH = Math.min(32, footerTop - boxY - 4)

        // Attestation Container Box across full 194mm width
        doc.setFillColor(...FIGMA_COLORS.lightBg)
        doc.roundedRect(8, boxY, 194, boxH, 2, 2, 'F')
        doc.setDrawColor(...FIGMA_COLORS.border)
        doc.setLineWidth(0.3)
        doc.roundedRect(8, boxY, 194, boxH, 2, 2, 'S')

        // Top Accent Strip
        doc.setFillColor(...FIGMA_COLORS.saffron)
        doc.rect(10, boxY, 190, 1.0, 'F')

        // Left Section: Certification Statement
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.8)
        doc.setTextColor(...FIGMA_COLORS.slateNavy)
        doc.text('OFFICIAL ROSTER CERTIFICATION & GOVERNANCE ATTESTATION', 12, boxY + 5.5)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6.2)
        doc.setTextColor(...FIGMA_COLORS.textDark)
        const certDesc = `This official document certifies the active executive council, departmental coordinators, and volunteer members appointed for ${resolvedFestivalName || portalType} under the administrative governance of ${entityName || 'Vishwa Utsav'}. All designated members are verified for committee operations and representation.`
        const wrappedDesc = doc.splitTextToSize(certDesc, 115)
        doc.text(wrappedDesc, 12, boxY + 10.2)

        // Metadata Pills
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(5.8)
        doc.setTextColor(...FIGMA_COLORS.emeraldDark)
        doc.text(`[VERIFIED STRENGTH: ${list.length} MEMBERS]    [STATUS: ACTIVE ROSTER]    [SECURITY: ENTITY AUDITED]`, 12, boxY + boxH - 3.8)

        // Right Section: Dual Authorized Signatures
        const sigLineY = boxY + boxH - 8

        // 1. President / Convener Signature
        doc.setDrawColor(...FIGMA_COLORS.muted)
        doc.setLineWidth(0.3)
        doc.line(134, sigLineY, 160, sigLineY)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.0)
        doc.setTextColor(...FIGMA_COLORS.slateNavy)
        doc.text('President / Convener', 134, sigLineY + 3.2)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(5.2)
        doc.setTextColor(...FIGMA_COLORS.muted)
        doc.text('Executive Authority', 134, sigLineY + 5.8)

        // 2. General Secretary / Treasurer Signature
        doc.line(166, sigLineY, 196, sigLineY)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.0)
        doc.setTextColor(...FIGMA_COLORS.slateNavy)
        doc.text('General Secretary / Cashier', 166, sigLineY + 3.2)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(5.2)
        doc.setTextColor(...FIGMA_COLORS.muted)
        doc.text('Official Entity Stamp & Seal', 166, sigLineY + 5.8)
    }

    drawFooter(doc, false)
    const filePrefix = resolvedFestivalName ? resolvedFestivalName.replace(/[^a-zA-Z0-9_-]/g, '_') : portalType
    doc.save(`${filePrefix}_Members_${String(entityName || 'Directory').replace(/\s+/g, '_')}.pdf`)
}
