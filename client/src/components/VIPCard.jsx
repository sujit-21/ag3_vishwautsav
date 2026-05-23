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
    className = ""
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
            whileHover={{ scale: 1.02, rotateY: 2, rotateX: 2 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
            className={`vip-card position-relative overflow-hidden ${className}`}
            style={{
                backgroundImage: `url(${bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: 'var(--vip-card-padding, 2.5rem)',
                color: '#ffffff',
                width: '100%',
                maxWidth: '460px',
                aspectRatio: '1.586 / 1', // standard credit card ratio approx
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)',
                fontFamily: "'Outfit', sans-serif"
            }}
        >

            <div className="d-flex flex-column justify-content-between h-100 position-relative z-1">
                {/* Top Section */}
                <div>
                    <h3 style={{
                        margin: 0,
                        fontSize: 'var(--vip-card-h3-size, 1.5rem)',
                        fontWeight: 800,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        color: '#f8fafc',
                        textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                    }}>
                        {displayData.eventName}
                    </h3>
                    {(displayData.entityName || displayData.address) && (
                        <div style={{ marginTop: '0.3rem' }}>
                            {displayData.entityName && <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '1px' }}>{displayData.entityName}</div>}
                            {displayData.address && <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '0.1rem' }}>{displayData.address}</div>}
                        </div>
                    )}
                    <p style={{
                        margin: '0.6rem 0 0 0',
                        fontSize: 'var(--vip-card-p-size, 0.75rem)',
                        fontWeight: 500,
                        letterSpacing: '4px',
                        color: 'rgba(255, 255, 255, 0.4)',
                        textTransform: 'uppercase'
                    }}>
                        {accessLevel}
                    </p>
                </div>

                {/* Bottom Section */}
                <div className="mt-auto">
                    <h2 style={{
                        margin: '0 0 0.8rem 0',
                        fontSize: 'var(--vip-card-h2-size, 1.8rem)',
                        fontWeight: 800,
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        color: '#ffffff',
                        textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                    }}>
                        {displayData.userName}
                    </h2>

                    <div className="d-flex justify-content-between align-items-end w-100 position-relative">
                        {/* Faint watermark text */}
                        <div style={{
                            position: 'absolute',
                            top: '-15px',
                            left: '0',
                            fontSize: '0.65rem',
                            fontFamily: "'Courier New', Courier, monospace",
                            color: 'rgba(255, 255, 255, 0.1)',
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            pointerEvents: 'none',
                            zIndex: 0
                        }}>
                            VALID THROUGH
                        </div>

                        <div className="position-relative z-1" style={{ maxWidth: '60%' }}>
                            <p className="d-flex align-items-center gap-2" style={{
                                margin: '0 0 0.4rem 0',
                                fontSize: 'var(--vip-card-p-size, 0.7rem)',
                                fontFamily: "'Courier New', Courier, monospace",
                                color: 'rgba(255, 255, 255, 0.5)',
                                letterSpacing: '2px',
                                textTransform: 'uppercase'
                            }}>
                                <span>U I D</span> <span style={{ opacity: 0.5 }}>//</span> <span>{String(displayData.uid || '').match(/.{1,4}/g)?.join(' ') || displayData.uid}</span>
                            </p>
                            <p style={{
                                margin: 0,
                                fontSize: 'var(--vip-card-valid-size, 0.95rem)',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                color: '#f8fafc'
                            }}>
                                {displayData.validDate}
                            </p>
                        </div>

                        <div className="d-flex gap-4 text-end position-relative z-1">
                            <div>
                                <p style={{
                                    margin: '0 0 0.4rem 0',
                                    fontSize: 'var(--vip-card-p-size, 0.65rem)',
                                    fontWeight: 700,
                                    color: 'rgba(255, 255, 255, 0.4)',
                                    letterSpacing: '3px',
                                    textTransform: 'uppercase'
                                }}>
                                    GROUP
                                </p>
                                <p style={{
                                    margin: 0,
                                    fontSize: 'var(--vip-card-group-size, 1.1rem)',
                                    fontWeight: 800,
                                    color: '#f8fafc',
                                    backgroundColor: 'transparent'
                                }}>
                                    {displayData.familyMembers ?? 0}
                                </p>
                            </div>
                            <div>
                                <p style={{
                                    margin: '0 0 0.4rem 0',
                                    fontSize: 'var(--vip-card-p-size, 0.65rem)',
                                    fontWeight: 700,
                                    color: 'rgba(255, 255, 255, 0.4)',
                                    letterSpacing: '3px',
                                    textTransform: 'uppercase'
                                }}>
                                    TIER
                                </p>
                                <p style={{
                                    margin: 0,
                                    fontSize: 'var(--vip-card-tier-size, 1.1rem)',
                                    fontWeight: 800,
                                    color: '#f8fafc'
                                }}>
                                    {displayData.tier}
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
