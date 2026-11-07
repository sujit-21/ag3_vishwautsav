import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    History, Search, RefreshCw, PlusCircle, Edit3, Trash2, 
    Calendar, ArrowRight, Shield, Filter, AlertCircle, X,
    Activity, UserCheck, Layers, Sparkles, Check
} from 'lucide-react';

// Generates a deterministic, vibrant gradient for admin avatars
const getAvatarGradient = (name = 'Admin') => {
    const gradients = [
        'linear-gradient(135deg, #4f46e5, #7c3aed)',
        'linear-gradient(135deg, #0ea5e9, #2563eb)',
        'linear-gradient(135deg, #059669, #10b981)',
        'linear-gradient(135deg, #d97706, #f59e0b)',
        'linear-gradient(135deg, #dc2626, #f43f5e)',
        'linear-gradient(135deg, #8b5cf6, #ec4899)'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
};

const ActivityLogsView = ({ sectionType = 'festival', festOrEventName = '', activeTitle = '' }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterAction, setFilterAction] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedId, setCopiedId] = useState(null);

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams();
            if (sectionType) params.append('sectionType', sectionType);
            if (festOrEventName) params.append('festOrEventName', festOrEventName);
            if (filterAction !== 'ALL') params.append('action', filterAction);

            const res = await axios.get(`/api/activity-logs?${params.toString()}`);
            setLogs(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error fetching activity logs:', err);
            setError(err.response?.data?.message || 'Failed to load action history');
        } finally {
            setLoading(false);
        }
    }, [sectionType, festOrEventName, filterAction]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Client-side search filtering
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase().trim();
            return (
                (log.adminName && log.adminName.toLowerCase().includes(q)) ||
                (log.targetName && log.targetName.toLowerCase().includes(q)) ||
                (log.targetId && log.targetId.toLowerCase().includes(q)) ||
                (log.details && log.details.toLowerCase().includes(q))
            );
        });
    }, [logs, searchQuery]);

    const getActionMeta = (action) => {
        switch (action) {
            case 'CREATE':
                return {
                    label: 'Added',
                    badgeClass: 'audit-badge-create',
                    borderClass: 'audit-border-create',
                    icon: PlusCircle
                };
            case 'UPDATE':
                return {
                    label: 'Updated',
                    badgeClass: 'audit-badge-update',
                    borderClass: 'audit-border-update',
                    icon: Edit3
                };
            case 'DELETE':
                return {
                    label: 'Deleted',
                    badgeClass: 'audit-badge-delete',
                    borderClass: 'audit-border-delete',
                    icon: Trash2
                };
            default:
                return {
                    label: action,
                    badgeClass: 'audit-badge-default',
                    borderClass: '',
                    icon: History
                };
        }
    };

    const getSectionInfo = (log) => {
        const rawType = log.sectionType || sectionType || 'festival';
        const isEvent = String(rawType).toLowerCase() === 'event';
        const typeLabel = isEvent ? 'Event' : 'Festival';
        const name = log.festOrEventName || log.entityName || festOrEventName || activeTitle || 'General';
        return { isEvent, typeLabel, name };
    };

    const formatTimestamp = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return d.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatFieldLabel = (fieldName) => {
        if (fieldName === 'paymentType') return 'Payment';
        if (fieldName === 'membershipType') return 'Tier';
        if (fieldName === 'referenceName') return 'Reference';
        if (fieldName === 'festOrEventName') return 'Festival/Event';
        return fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    };

    const formatFieldValue = (field, val) => {
        if (val === null || val === undefined || val === '') return 'None';
        if (field === 'date') {
            try {
                const d = new Date(val);
                if (!isNaN(d.getTime())) {
                    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                }
            } catch {
                return String(val);
            }
        }
        if (field === 'amount') {
            return `₹${String(val).replace(/[^0-9.]/g, '')}`;
        }
        return String(val);
    };

    const handleCopyId = (id) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1800);
    };

    // Quick counts
    const totalCount = logs.length;
    const addCount = logs.filter(l => l.action === 'CREATE').length;
    const updateCount = logs.filter(l => l.action === 'UPDATE').length;
    const deleteCount = logs.filter(l => l.action === 'DELETE').length;

    return (
        <div className="audit-section-wrapper mx-auto w-100">
            {/* Header Card */}
            <div className="audit-header-card glass-card p-3 p-sm-4 mb-3 shadow-sm">
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
                    <div className="d-flex align-items-center gap-3">
                        <div className="audit-header-icon-box">
                            <History size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <h4 className="fw-extrabold mb-0 text-main" style={{ letterSpacing: '-0.02em' }}>
                                    Action History & Audit Log
                                </h4>
                                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-20 rounded-pill px-2.5 py-0.5 fw-bold extra-tiny">
                                    LIVE AUDIT
                                </span>
                            </div>
                            <p className="text-muted tiny mb-0 mt-1">
                                Complete tracking of all attendee creations, edits, and deletions {activeTitle ? (
                                    <>for <span className="fw-bold text-main">"{activeTitle}"</span></>
                                ) : ''}.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={fetchLogs}
                        disabled={loading}
                        className="btn btn-sm audit-refresh-btn d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill fw-semibold shadow-xs flex-shrink-0"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                        <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                </div>
            </div>

            {/* KPI Metric Cards */}
            <div className="audit-kpi-grid mb-3">
                {/* Total */}
                <div className="audit-kpi-card" onClick={() => setFilterAction('ALL')} style={{ cursor: 'pointer' }}>
                    <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="audit-kpi-label text-muted">Total Operations</span>
                        <div className="audit-kpi-icon-box bg-secondary bg-opacity-10 text-secondary">
                            <Layers size={14} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div className="audit-kpi-value text-main">{totalCount}</div>
                    <span className="extra-tiny text-muted">All historical actions</span>
                </div>

                {/* Added */}
                <div className="audit-kpi-card" onClick={() => setFilterAction('CREATE')} style={{ cursor: 'pointer' }}>
                    <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="audit-kpi-label text-success">Created / Added</span>
                        <div className="audit-kpi-icon-box bg-success bg-opacity-10 text-success">
                            <PlusCircle size={14} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div className="audit-kpi-value text-success">+{addCount}</div>
                    <span className="extra-tiny text-muted">New attendee passes</span>
                </div>

                {/* Updated */}
                <div className="audit-kpi-card" onClick={() => setFilterAction('UPDATE')} style={{ cursor: 'pointer' }}>
                    <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="audit-kpi-label text-primary">Edited / Updated</span>
                        <div className="audit-kpi-icon-box bg-primary bg-opacity-10 text-primary">
                            <Edit3 size={14} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div className="audit-kpi-value text-primary">{updateCount}</div>
                    <span className="extra-tiny text-muted">Record modifications</span>
                </div>

                {/* Deleted */}
                <div className="audit-kpi-card" onClick={() => setFilterAction('DELETE')} style={{ cursor: 'pointer' }}>
                    <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="audit-kpi-label text-danger">Deleted</span>
                        <div className="audit-kpi-icon-box bg-danger bg-opacity-10 text-danger">
                            <Trash2 size={14} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div className="audit-kpi-value text-danger">{deleteCount}</div>
                    <span className="extra-tiny text-muted">Removed attendees</span>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="glass-card p-3 mb-3 shadow-sm">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center gap-2.5">
                    {/* Search Input */}
                    <div className="audit-search-wrapper flex-grow-1">
                        <Search size={15} className="audit-search-icon text-muted" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by admin name, attendee, or pass ID..."
                            className="form-control audit-search-input"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="audit-search-clear-btn"
                                title="Clear search"
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* Filter Segmented Buttons */}
                    <div className="audit-filter-segmented d-flex align-items-center gap-1 overflow-x-auto py-1">
                        {[
                            { id: 'ALL', label: 'All', count: totalCount },
                            { id: 'CREATE', label: 'Added', count: addCount },
                            { id: 'UPDATE', label: 'Updated', count: updateCount },
                            { id: 'DELETE', label: 'Deleted', count: deleteCount },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setFilterAction(tab.id)}
                                className={`audit-filter-pill ${filterAction === tab.id ? 'active' : ''}`}
                            >
                                <span>{tab.label}</span>
                                <span className="audit-filter-count">{tab.count}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 py-2.5 px-3 rounded-3 small mb-3 shadow-xs">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Content List */}
            {loading ? (
                <div className="glass-card text-center py-5 shadow-sm">
                    <RefreshCw size={28} className="animate-spin text-primary opacity-75 mb-2.5" />
                    <p className="text-muted small fw-medium mb-0">Fetching administrative audit trail...</p>
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="glass-card text-center py-5 shadow-sm border border-dashed rounded-4 p-4">
                    <div className="audit-empty-icon-box mb-2 text-muted">
                        <History size={32} />
                    </div>
                    <h6 className="fw-bold text-main mb-1">No Activity Logs Found</h6>
                    <p className="text-muted small mb-0" style={{ maxWidth: '420px', margin: '0 auto' }}>
                        {searchQuery || filterAction !== 'ALL' 
                            ? 'No actions match your current search or filter criteria. Try clearing filters.'
                            : 'Whenever any admin creates, modifies, or deletes an attendee pass, the complete timestamped record will appear here.'
                        }
                    </p>
                    {(searchQuery || filterAction !== 'ALL') && (
                        <button
                            type="button"
                            onClick={() => { setSearchQuery(''); setFilterAction('ALL'); }}
                            className="btn btn-sm btn-primary rounded-pill mt-3 px-3.5 py-1"
                        >
                            Reset Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="d-flex flex-column gap-2.5">
                    <AnimatePresence>
                        {filteredLogs.map((log, index) => {
                            const meta = getActionMeta(log.action);
                            const ActionIcon = meta.icon;
                            const isCreate = log.action === 'CREATE';
                            const isDelete = log.action === 'DELETE';
                            const isUpdate = log.action === 'UPDATE';

                            return (
                                <motion.div
                                    key={log._id || index}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.18 }}
                                    className={`audit-log-card glass-card ${meta.borderClass}`}
                                >
                                    {/* Top Line: Action Badge + Admin Info + Pass ID + Timestamp */}
                                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-2">
                                        <div className="d-flex align-items-center gap-2 flex-wrap">
                                            {/* Action Badge */}
                                            <span className={`audit-action-badge ${meta.badgeClass}`}>
                                                <ActionIcon size={12} strokeWidth={2.6} />
                                                <span>{meta.label}</span>
                                            </span>

                                            {/* Admin Avatar & Name */}
                                            <div className="d-flex align-items-center gap-1.5">
                                                <div 
                                                    className="audit-avatar"
                                                    style={{ background: getAvatarGradient(log.adminName) }}
                                                    title={log.adminEmail || log.adminName}
                                                >
                                                    {log.adminName ? log.adminName.charAt(0).toUpperCase() : 'A'}
                                                </div>
                                                <div className="d-flex flex-column">
                                                    <div className="d-flex align-items-center gap-1.5">
                                                        <span className="fw-bold text-main small" style={{ lineHeight: 1.2 }}>
                                                            {log.adminName || 'Admin'}
                                                        </span>
                                                        <span className="badge bg-secondary bg-opacity-15 text-muted px-1.5 py-0.5 rounded-pill extra-tiny fw-bold">
                                                            {log.adminRole || 'admin'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Target Pass ID with one-click copy */}
                                            <button
                                                type="button"
                                                onClick={() => handleCopyId(log.targetId)}
                                                className="btn btn-sm p-0 border-0 bg-transparent"
                                                title="Click to copy pass ID"
                                            >
                                                <span className="badge bg-secondary bg-opacity-10 text-muted font-monospace px-2 py-1 rounded-pill d-inline-flex align-items-center gap-1 hover-scale" style={{ fontSize: '0.7rem' }}>
                                                    <span>ID: {log.targetId}</span>
                                                    {copiedId === log.targetId ? (
                                                        <Check size={11} className="text-success" />
                                                    ) : null}
                                                </span>
                                            </button>

                                            {/* Dedicated Section Indicator */}
                                            {(() => {
                                                const sectionInfo = getSectionInfo(log);
                                                return (
                                                    <span 
                                                        className={`audit-section-badge ${sectionInfo.isEvent ? 'audit-badge-event' : 'audit-badge-fest'}`}
                                                        title={`Section: ${sectionInfo.typeLabel} - ${sectionInfo.name}`}
                                                    >
                                                        <span className="audit-section-type">{sectionInfo.typeLabel}:</span>
                                                        <span className="audit-section-name">{sectionInfo.name}</span>
                                                    </span>
                                                );
                                            })()}
                                        </div>

                                        {/* Timestamp */}
                                        <div className="d-flex align-items-center gap-1.5 text-muted extra-tiny">
                                            <Calendar size={12} className="opacity-75" />
                                            <span>{formatTimestamp(log.createdAt)}</span>
                                        </div>
                                    </div>

                                    {/* Action Description */}
                                    <div className="audit-log-body">
                                        {(() => {
                                            const sectionInfo = getSectionInfo(log);
                                            // Filter out false-positive identical changes (e.g. 24 Oct 2025 -> 24 Oct 2025)
                                            const meaningfulChanges = Array.isArray(log.changes) ? log.changes.filter(c => {
                                                const fromStr = formatFieldValue(c.field, c.from);
                                                const toStr = formatFieldValue(c.field, c.to);
                                                return fromStr !== toStr;
                                            }) : [];

                                            return (
                                                <>
                                                    <div className="d-flex align-items-baseline gap-1.5 flex-wrap">
                                                        <span className="fw-bold text-main" style={{ fontSize: '0.9rem' }}>
                                                            {log.targetName}
                                                        </span>
                                                        {isCreate && (
                                                            <span className="text-muted small">
                                                                {' '}was registered as an attendee in the{' '}
                                                                <strong className="text-primary">{sectionInfo.typeLabel} Section ({sectionInfo.name})</strong>
                                                                {' '}with <strong className="text-success">₹{log.amount || 0}</strong> ({log.paymentType || 'Cash & Paid'}).
                                                            </span>
                                                        )}
                                                        {isDelete && (
                                                             <span className="text-danger small fw-medium">
                                                                {' '}was deleted by admin from the{' '}
                                                                <strong className="text-danger">{sectionInfo.typeLabel} Section ({sectionInfo.name})</strong>
                                                                {' '}attendee records.
                                                            </span>
                                                        )}
                                                        {isUpdate && (
                                                            <span className="text-muted small">
                                                                {' '}was updated by admin in the{' '}
                                                                <strong className="text-primary">{sectionInfo.typeLabel} Section ({sectionInfo.name})</strong>.
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Detailed Changes Chips */}
                                                    {meaningfulChanges.length > 0 && (
                                                        <div className="d-flex align-items-center gap-1.5 flex-wrap mt-2 pt-2 border-top border-secondary border-opacity-10">
                                                            <span className="extra-tiny text-muted uppercase fw-extrabold letter-spacing-1">Modified:</span>
                                                            {meaningfulChanges.map((change, cIdx) => (
                                                                <span key={cIdx} className="audit-change-chip">
                                                                    <span className="audit-change-field">{formatFieldLabel(change.field)}:</span>
                                                                    <span className="audit-change-from">{formatFieldValue(change.field, change.from)}</span>
                                                                    <ArrowRight size={10} className="audit-change-arrow" />
                                                                    <span className="audit-change-to">{formatFieldValue(change.field, change.to)}</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default ActivityLogsView;
