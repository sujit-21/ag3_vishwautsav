import React from 'react'
import './Skeleton.css'

export function Skeleton({ width = '100%', height = '20px', borderRadius = '8px', className = '', style = {} }) {
    return (
        <div
            className={`skeleton-shimmer ${className}`}
            style={{
                width,
                height,
                borderRadius,
                ...style
            }}
        />
    )
}

export function SkeletonCard() {
    return (
        <div className="skeleton-card d-flex flex-column gap-3">
            <div className="d-flex align-items-center gap-3">
                <Skeleton width="48px" height="48px" borderRadius="12px" />
                <div className="d-flex flex-column gap-2 flex-grow-1">
                    <Skeleton width="60%" height="18px" />
                    <Skeleton width="40%" height="12px" />
                </div>
            </div>
            <Skeleton width="100%" height="80px" borderRadius="12px" />
            <div className="d-flex justify-content-between align-items-center pt-2">
                <Skeleton width="30%" height="14px" />
                <Skeleton width="80px" height="28px" borderRadius="20px" />
            </div>
        </div>
    )
}

export default Skeleton
