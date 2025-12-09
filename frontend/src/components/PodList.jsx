import React, { useMemo, useState } from 'react';
import { Activity, Box, AlertCircle, Clock, Search } from 'lucide-react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

const PodList = ({ pods, onSelectPod, selectedPod }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const statusOptions = ['All', 'Running', 'Pending', 'Failed', 'Succeeded'];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Running': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'Pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'Failed': return 'text-red-400 bg-red-400/10 border-red-400/20';
            case 'Succeeded': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
        }
    };

    const filteredPods = useMemo(() => {
        return pods
            .filter((pod) =>
                pod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (pod.node || '').toLowerCase().includes(searchTerm.toLowerCase())
            )
            .filter((pod) => statusFilter === 'All' || pod.status === statusFilter);
    }, [pods, searchTerm, statusFilter]);

    const statusCounts = useMemo(() => {
        return pods.reduce((acc, pod) => {
            acc[pod.status] = (acc[pod.status] || 0) + 1;
            return acc;
        }, {});
    }, [pods]);

    const formatUptime = (startTime) => {
        if (!startTime) return '—';
        const started = new Date(startTime);
        const diffMs = Date.now() - started.getTime();
        const minutes = Math.floor(diffMs / 60000);
        if (minutes < 1) return '<1m';
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}d`;
    };

    return (
        <div className="glass-panel flex h-full flex-col rounded-2xl">
            <div className="border-b border-theme bg-surface-soft p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-color)]">
                            <Box size={18} className="text-neon-cyan" />
                            Pods
                        </div>
                        <p className="text-xs text-muted">Tap a workload to inspect live metrics</p>
                    </div>
                    <div className="flex flex-1 items-center gap-2">
                        <div className="relative flex-1">
                            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input
                                className="input-control pl-10"
                                placeholder="Search by name or node"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                aria-label="Search pods"
                            />
                        </div>
                        <div className="flex gap-1 rounded-full border border-theme bg-surface-soft p-1 text-xs">
                            {statusOptions.map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setStatusFilter(status)}
                                    className={clsx(
                                        'rounded-full px-3 py-1 transition-all duration-200',
                                        statusFilter === status ? 'bg-white text-black shadow-md' : 'text-muted hover:text-[var(--text-color)]'
                                    )}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-b border-theme px-4 py-2 text-xs text-muted">
                <span className="uppercase tracking-widest">Status</span>
                <div className="mt-2 flex flex-wrap gap-3">
                    {Object.entries(statusCounts).map(([status, count]) => (
                        <div key={status} className="flex items-center gap-2 text-[11px]">
                            <span className={clsx('h-2 w-2 rounded-full',
                                status === 'Running' ? 'bg-green-400' :
                                    status === 'Pending' ? 'bg-yellow-400' :
                                        status === 'Failed' ? 'bg-red-400' : 'bg-gray-400'
                            )} />
                            {status}
                            <span className="text-[var(--text-color)]">{count}</span>
                        </div>
                    ))}
                    {Object.keys(statusCounts).length === 0 && (
                        <span className="text-[11px] text-muted">No pods yet</span>
                    )}
                </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-3">
                <AnimatePresence initial={false}>
                    {filteredPods.map((pod) => (
                        <motion.div
                            key={pod.name}
                            layout
                            onClick={() => onSelectPod(pod)}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                            className={clsx(
                                'cursor-pointer rounded-xl border border-theme bg-surface-muted p-4 transition-all duration-200',
                                selectedPod?.name === pod.name
                                    ? 'ring-2 ring-neon-blue/40 shadow-[0_20px_45px_rgba(77,77,255,0.25)] scale-[1.01]'
                                    : 'hover:scale-[1.01] hover:border-neon-blue/30'
                            )}
                        >
                        <div className="mb-3 flex items-start justify-between gap-2">
                            <div>
                                <span className="block text-sm font-semibold text-[var(--text-color)]" title={pod.name}>{pod.name}</span>
                                <p className="text-xs text-muted">{pod.namespace}</p>
                            </div>
                            <span className={clsx('rounded-full border px-3 py-0.5 text-xs font-medium', getStatusColor(pod.status))}>
                                {pod.status}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                            <div className="flex items-center gap-1">
                                <Activity size={12} />
                                <span>{pod.node || 'Pending scheduling'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <AlertCircle size={12} />
                                <span>{pod.ip || 'No IP assigned'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock size={12} />
                                <span>Uptime {formatUptime(pod.startTime)}</span>
                            </div>
                        </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredPods.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-theme p-8 text-center text-sm text-muted">
                        {pods.length === 0 ? 'No pods found in this namespace' : 'No pods match your filters yet'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PodList;
