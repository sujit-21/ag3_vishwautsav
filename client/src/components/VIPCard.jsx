import React from 'react'
import { motion } from 'framer-motion'
import adminBg from '../images/admin.jpg'
import primeBg from '../images/primemember.jpg'
import regularBg from '../images/regular.jpg'
import vipBg from '../images/vip elite.jpg'

const VIPCard = ({
    subscription,
    eventName = "MIDNIGHT SUN",
    accessLevel = "VIP ACCESS ONLY",
    userName = "ALEXANDER RIVERA",
    uid = "2026-X99-PLATINUM",
    validDate = "DEC 2026",
    tier = "Executive",
    entityName = "",
    address = "",
    familyMembers = 0,
    className = "",
    compact = false
}) => {
    // If subscription prop is passed, override defaults
    const displayData = subscription ? {
        eventName: subscription.festOrEventName || eventName,
        userName: subscription.name || userName,
        uid: subscription.subId || subscription.cardId || uid,
        tier: subscription.membershipType || tier,
        entityName: subscription.entityName || entityName,
        address: subscription.address || address,
        familyMembers: subscription.familyMembers,
        validDate: subscription.date ? new Date(subscription.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase() : validDate,
        cardColor: subscription.cardColor || null
    } : {
        eventName, userName, uid, tier, entityName, address, familyMembers, validDate, cardColor: null
    };

    let bgImage = regularBg;
    const tierLowerCase = (displayData.tier || '').toLowerCase();
    if (tierLowerCase.includes('admin')) bgImage = adminBg;
    else if (tierLowerCase.includes('prime')) bgImage = primeBg;
    else if (tierLowerCase.includes('vip')) bgImage = vipBg;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
            className={`vip-card position-relative overflow-hidden ${className}`}
            style={{
                backgroundImage: `url(${bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                borderRadius: compact ? '12px' : '18px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: compact ? '0.65rem 0.85rem' : '1.25rem 1.5rem',
                color: '#ffffff',
                width: '100%',
                maxWidth: compact ? '290px' : '420px',
                aspectRatio: '1.586 / 1',
                boxShadow: '0 16px 32px -8px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.15)',
                fontFamily: "'Outfit', sans-serif"
            }}
        >
            <div className="d-flex flex-column justify-content-between h-100 position-relative z-1">
                {/* Top Section */}
                <div>
                    <h3 style={{
                        margin: 0,
                        fontSize: compact ? '0.82rem' : '1.05rem',
                        fontWeight: 800,
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        color: '#ffffff',
                        textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                        lineHeight: 1.15
                    }}>
                        {displayData.eventName}
                    </h3>
                    {(displayData.entityName || displayData.address) && (
                        <div style={{ marginTop: compact ? '0.1rem' : '0.2rem' }}>
                            {displayData.entityName && <div style={{ fontSize: compact ? '0.6rem' : '0.72rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.85)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{displayData.entityName}</div>}
                            {displayData.address && <div style={{ fontSize: compact ? '0.55rem' : '0.65rem', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '0.2px' }}>{displayData.address}</div>}
                        </div>
                    )}
                    <p style={{
                        margin: compact ? '0.15rem 0 0 0' : '0.3rem 0 0 0',
                        fontSize: compact ? '0.52rem' : '0.62rem',
                        fontWeight: 600,
                        letterSpacing: '1.5px',
                        color: 'rgba(255, 255, 255, 0.65)',
                        textTransform: 'uppercase'
                    }}>
                        {accessLevel}
                    </p>
                </div>

                {/* Bottom Section */}
                <div className="mt-auto">
                    <h2 style={{
                        margin: compact ? '0 0 0.2rem 0' : '0 0 0.4rem 0',
                        fontSize: compact ? '0.95rem' : '1.25rem',
                        fontWeight: 800,
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        color: '#ffffff',
                        textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                        lineHeight: 1.15
                    }}>
                        {displayData.userName}
                    </h2>

                    <div className="d-flex justify-content-between align-items-end w-100 pt-1 border-top border-white border-opacity-15">
                        <div style={{ maxWidth: '50%' }}>
                            <p className="d-flex align-items-center gap-1 mb-0" style={{
                                fontSize: compact ? '0.48rem' : '0.58rem',
                                fontFamily: "'Courier New', Courier, monospace",
                                color: 'rgba(255, 255, 255, 0.7)',
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase',
                                lineHeight: 1.1
                            }}>
                                <span>UID:</span> <span>{String(displayData.uid || '').match(/.{1,4}/g)?.join(' ') || displayData.uid}</span>
                            </p>
                            <p style={{
                                margin: '0.05rem 0 0 0',
                                fontSize: compact ? '0.58rem' : '0.72rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                color: '#ffffff',
                                lineHeight: 1.1
                            }}>
                                {displayData.validDate}
                            </p>
                        </div>

                        <div className="d-flex gap-3 justify-content-end align-items-end">
                            <div className="text-center" style={{ minWidth: compact ? '32px' : '45px' }}>
                                <p style={{
                                    margin: 0,
                                    fontSize: compact ? '0.46rem' : '0.55rem',
                                    fontWeight: 700,
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    letterSpacing: '1px',
                                    textTransform: 'uppercase'
                                }}>
                                    GROUP
                                </p>
                                <p style={{
                                    margin: 0,
                                    fontSize: compact ? '0.72rem' : '0.88rem',
                                    fontWeight: 800,
                                    color: '#ffffff',
                                    lineHeight: 1.1
                                }}>
                                    {displayData.familyMembers ?? 0}
                                </p>
                            </div>
                            <div className="text-end" style={{ minWidth: compact ? '50px' : '65px' }}>
                                <p style={{
                                    margin: 0,
                                    fontSize: compact ? '0.46rem' : '0.55rem',
                                    fontWeight: 700,
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    letterSpacing: '1px',
                                    textTransform: 'uppercase'
                                }}>
                                    TIER
                                </p>
                                <p style={{
                                    margin: 0,
                                    fontSize: compact ? '0.62rem' : '0.78rem',
                                    fontWeight: 800,
                                    color: '#ffffff',
                                    lineHeight: 1.1,
                                    whiteSpace: 'nowrap'
                                }}>
                                    {displayData.tier === 'Regular' ? 'Volunteers' : (displayData.tier || 'Standard')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

export default VIPCard
