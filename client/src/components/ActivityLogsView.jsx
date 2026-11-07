import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    History, Search, RefreshCw, User, PlusCircle, Edit3, Trash2, 
    Calendar, ArrowRight, Shield, Filter, CheckCircle2, AlertCircle
} from 'lucide-react';

const ActivityLogsView = ({ sectionType = 'festival', festOrEventName = '', activeTitle = '' }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterAction, setFilterAction] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

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
    const filteredLogs = logs.filter(log => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (log.adminName && log.adminName.toLowerCase().includes(q)) ||
            (log.targetName && log.targetName.toLowerCase().includes(q)) ||
            (log.targetId && log.targetId.toLowerCase().includes(q)) ||
            (log.details && log.details.toLowerCase().includes(q))
        );
    });

    const getActionBadge = (action) => {
        switch (action) {
            case 'CREATE':
                return {
                    label: 'Added',
                    bg: 'bg-success bg-opacity-10 text-success border border-success border-opacity-25',
                    icon: PlusCircle
                };
            case 'UPDATE':
                return {
                    label: 'Updated',
                    bg: 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25',
                    icon: Edit3
                };
            case 'DELETE':
                return {
                    label: 'Deleted',
                    bg: 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25',
                    icon: Trash2
                };
            default:
                return {
                    label: action,
                    bg: 'bg-secondary bg-opacity-10 text-muted border border-secondary border-opacity-25',
                    icon: History
                };
        }
    };

    const formatDate = (dateStr) => {
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

    // Quick counts
    const totalCount = logs.length;
    const addCount = logs.filter(l => l.action === 'CREATE').length;
    const updateCount = logs.filter(l => l.action === 'UPDATE').length;
    const deleteCount = logs.filter(l => l.action === 'DELETE').length;

    return (
        <div className="glass-card py-3.5 px-3 px-sm-4 shadow-sm mx-auto w-100" style={{ maxWidth: '980px' }}>
            {/* Header */}
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center pb-3 mb-3 border-bottom border-secondary border-opacity-15 gap-2">
                <div>
                    <div className="d-flex align-items-center gap-2">
                        <div className="p-1.5 rounded-3 bg-primary bg-opacity-10 text-primary d-inline-flex">
                            <History size={18} strokeWidth={2.4} />
                        </div>
                        <h5 className="fw-extrabold mb-0 text-main">Action Section / Audit Trail</h5>
                    </div>
                    <p className="text-muted tiny mb-0 mt-0.5">
                        Real-time audit log of admin operations (add, edit, delete) on attendees {activeTitle ? `for "${activeTitle}"` : ''}.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={fetchLogs}
                    disabled={loading}
                    className="btn btn-sm btn-outline-secondary rounded-pill d-inline-flex align-items-center gap-1.5 px-3 py-1 shadow-xs fw-semibold"
                    style={{ fontSize: '0.78rem' }}
                >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="row g-2 mb-3">
                <div className="col-6 col-sm-3">
                    <div className="p-2.5 rounded-3 bg-secondary bg-opacity-10 text-center">
                        <span className="d-block extra-tiny text-muted uppercase fw-bold">Total Operations</span>
                        <span className="fw-extrabold fs-6 text-main">{totalCount}</span>
                    </div>
                </div>
                <div className="col-6 col-sm-3">
                    <div className="p-2.5 rounded-3 bg-success bg-opacity-10 text-center">
                        <span className="d-block extra-tiny text-success uppercase fw-bold">Created / Added</span>
                        <span className="fw-extrabold fs-6 text-success">+{addCount}</span>
                    </div>
                </div>
                <div className="col-6 col-sm-3">
                    <div className="p-2.5 rounded-3 bg-primary bg-opacity-10 text-center">
                        <span className="d-block extra-tiny text-primary uppercase fw-bold">Edited / Updated</span>
                        <span className="fw-extrabold fs-6 text-primary">{updateCount}</span>
                    </div>
                </div>
                <div className="col-6 col-sm-3">
                    <div className="p-2.5 rounded-3 bg-danger bg-opacity-10 text-center">
                        <span className="d-block extra-tiny text-danger uppercase fw-bold">Deleted</span>
                        <span className="fw-extrabold fs-6 text-danger">{deleteCount}</span>
                    </div>
                </div>
            </div>

            {/* Filters Row: Search Box + Action Filter Chips */}
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-3 pb-1">
                {/* Search */}
                <div className="position-relative flex-grow-1" style={{ maxWidth: '320px' }}>
                    <Search size={14} className="position-absolute text-muted" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter by admin, attendee, ID..."
                        className="form-control form-control-sm ps-4 pe-3 rounded-pill bg-body"
                        style={{ fontSize: '0.78rem', height: '32px' }}
                    />
                </div>

                {/* Filter Chips */}
                <div className="d-flex align-items-center gap-1.5 overflow-x-auto py-1">
                    {[
                        { id: 'ALL', label: 'All' },
                        { id: 'CREATE', label: 'Added', count: addCount },
                        { id: 'UPDATE', label: 'Updated', count: updateCount },
                        { id: 'DELETE', label: 'Deleted', count: deleteCount },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setFilterAction(tab.id)}
                            className={`btn btn-sm rounded-pill px-2.5 py-0.5 fw-semibold text-nowrap transition-all ${
                                filterAction === tab.id
                                    ? 'btn-primary text-white shadow-xs'
                                    : 'btn-outline-secondary'
                            }`}
                            style={{ fontSize: '0.74rem', height: '28px' }}
                        >
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className="badge bg-secondary bg-opacity-25 ms-1.5 px-1.5 py-0.2" style={{ fontSize: '0.65rem' }}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 rounded-3 small">
                    <AlertCircle size={15} />
                    <span>{error}</span>
                </div>
            )}

            {/* Content: Logs List */}
            {loading ? (
                <div className="text-center py-5">
                    <RefreshCw size={24} className="animate-spin text-primary opacity-75 mb-2" />
                    <p className="text-muted small mb-0">Loading admin action history...</p>
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="text-center py-5 border border-dashed rounded-4 p-4 my-2">
                    <div className="p-3 rounded-circle bg-secondary bg-opacity-10 d-inline-flex mb-2 text-muted">
                        <History size={26} />
                    </div>
                    <h6 className="fw-bold text-main mb-1">No Actions Logged Yet</h6>
                    <p className="text-muted small mb-0" style={{ maxWidth: '380px', margin: '0 auto' }}>
                        Whenever an admin creates, updates, or deletes an attendee pass, the exact details and timestamp will be saved and displayed here.
                    </p>
                </div>
            ) : (
                <div className="d-flex flex-column gap-2.5">
                    <AnimatePresence>
                        {filteredLogs.map((log, index) => {
                            const badge = getActionBadge(log.action);
                            const IconComponent = badge.icon;
                            return (
                                <motion.div
                                    key={log._id || index}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.18 }}
                                    className="p-3 rounded-3 border bg-body shadow-xs transition-all hover-lift"
                                    style={{ borderColor: 'var(--glass-border)' }}
                                >
                                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-1.5">
                                        {/* Admin & Action Badge */}
                                        <div className="d-flex align-items-center gap-2 flex-wrap">
                                            {/* Action Badge */}
                                            <span className={`badge px-2.5 py-1 rounded-pill fw-bold d-inline-flex align-items-center gap-1 ${badge.bg}`} style={{ fontSize: '0.72rem' }}>
                                                <IconComponent size={12} strokeWidth={2.5} />
                                                <span>{badge.label}</span>
                                            </span>

                                            {/* Admin Name & Role */}
                                            <div className="d-flex align-items-center gap-1.5">
                                                <div className="rounded-circle bg-primary bg-opacity-15 text-primary d-inline-flex align-items-center justify-content-center" style={{ width: '22px', height: '22px', fontSize: '0.68rem', fontWeight: 700 }}>
                                                    {log.adminName ? log.adminName.charAt(0).toUpperCase() : 'A'}
                                                </div>
                                                <span className="fw-bold text-main small">{log.adminName || 'Admin'}</span>
                                                <span className="badge bg-secondary bg-opacity-15 text-muted px-1.5 py-0.5 rounded" style={{ fontSize: '0.65rem' }}>
                                                    {log.adminRole || 'admin'}
                                                </span>
                                            </div>

                                            {/* Target Pass ID */}
                                            <span className="badge bg-secondary bg-opacity-10 text-muted font-monospace" style={{ fontSize: '0.7rem' }}>
                                                ID: {log.targetId}
                                            </span>
                                        </div>

                                        {/* Timestamp */}
                                        <div className="d-flex align-items-center gap-1 text-muted extra-tiny">
                                            <Calendar size={12} className="opacity-75" />
                                            <span>{formatDate(log.createdAt)}</span>
                                        </div>
                                    </div>

                                    {/* Action Summary Details */}
                                    <div className="ps-sm-1">
                                        <p className="mb-0 text-main small fw-medium" style={{ lineHeight: 1.4 }}>
                                            {log.details}
                                        </p>

                                        {/* Field Changes Breakdown (if present) */}
                                        {Array.isArray(log.changes) && log.changes.length > 0 && (
                                            <div className="d-flex align-items-center gap-1.5 flex-wrap mt-2 pt-1.5 border-top border-secondary border-opacity-10">
                                                <span className="extra-tiny text-muted uppercase fw-bold">Modified:</span>
                                                {log.changes.map((change, cIdx) => (
                                                    <span key={cIdx} className="badge bg-body-tertiary text-dark border px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
                                                        <strong className="text-primary">{change.field}:</strong> {String(change.from || 'none')} <ArrowRight size={10} className="mx-0.5 text-muted" /> <strong className="text-success">{String(change.to)}</strong>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
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
