import React from 'react'

export const SkeletonBox = ({ width = '100%', height = '20px', borderRadius = '6px', className = '', style = {} }) => (
    <div 
        className={`skeleton-shimmer ${className}`} 
        style={{ width, height, borderRadius, ...style }} 
    />
)

export const CardSkeleton = ({ count = 3 }) => {
    return (
        <div className="d-flex flex-column gap-2.5 w-100 py-1">
            {Array.from({ length: count }).map((_, idx) => (
                <div 
                    key={idx} 
                    className="p-3 bg-white rounded-3 border border-secondary border-opacity-10 shadow-xs d-flex flex-column gap-2.5"
                    style={{ background: 'var(--card-bg)' }}
                >
                    <div className="d-flex justify-content-between align-items-center">
                        <SkeletonBox width="45%" height="20px" borderRadius="6px" />
                        <SkeletonBox width="80px" height="24px" borderRadius="999px" />
                    </div>
                    <div className="d-flex gap-2">
                        <SkeletonBox width="30%" height="14px" />
                        <SkeletonBox width="25%" height="14px" />
                    </div>
                    <div className="d-flex justify-content-between align-items-center pt-1 border-top border-secondary border-opacity-10">
                        <SkeletonBox width="20%" height="14px" />
                        <div className="d-flex gap-1.5">
                            <SkeletonBox width="60px" height="26px" borderRadius="999px" />
                            <SkeletonBox width="26px" height="26px" borderRadius="50%" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export const TableSkeleton = ({ rows = 5, cols = 5 }) => {
    return (
        <div className="w-100 py-2 d-flex flex-column gap-2">
            {/* Table Header placeholder */}
            <div className="d-flex gap-3 px-3 py-2 border-bottom border-secondary border-opacity-10">
                {Array.from({ length: cols }).map((_, idx) => (
                    <SkeletonBox key={idx} width={`${100 / cols}%`} height="18px" borderRadius="4px" />
                ))}
            </div>
            {/* Table Rows placeholder */}
            {Array.from({ length: rows }).map((_, rIdx) => (
                <div 
                    key={rIdx} 
                    className="d-flex align-items-center gap-3 px-3 py-2.5 rounded-2"
                    style={{ background: rIdx % 2 === 0 ? 'var(--card-bg-subtle, rgba(255,247,237,0.5))' : 'transparent' }}
                >
                    {Array.from({ length: cols }).map((_, cIdx) => (
                        <SkeletonBox 
                            key={cIdx} 
                            width={`${Math.max(30, 100 / cols - (cIdx * 5 % 20))}%`} 
                            height="16px" 
                            borderRadius="4px" 
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}

export const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.04,
            delayChildren: 0.02
        }
    }
}

export const staggerItem = {
    hidden: { opacity: 0, y: 8 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.22,
            ease: [0.16, 1, 0.3, 1]
        }
    }
}

export default { SkeletonBox, CardSkeleton, TableSkeleton, staggerContainer, staggerItem }

