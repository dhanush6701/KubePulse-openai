import React, { useState, useEffect, useMemo } from 'react';
import { X, Trash2, Terminal, Server, Activity, Clock, Layers, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import MetricGauge from './MetricGauge';

const parseCpuToMillicores = (value = '') => {
    if (!value) return 0;
    if (value.endsWith('m')) return parseFloat(value.replace('m', ''));
    if (value.endsWith('n')) return parseFloat(value.replace('n', '')) / 1_000_000;
    return parseFloat(value) * 1000;
};

const parseMemoryToMiB = (value = '') => {
    if (!value) return 0;
    const numeric = parseFloat(value);
    if (Number.isNaN(numeric)) return 0;
    if (value.endsWith('Ki')) return numeric / 1024;
    if (value.endsWith('Mi')) return numeric;
    if (value.endsWith('Gi')) return numeric * 1024;
    if (value.endsWith('Ti')) return numeric * 1024 * 1024;
    // bytes fallback
    return numeric / (1024 * 1024);
};

const getContainerResourceTotals = (containers = []) => {
    return containers.reduce((acc, container) => {
        const resources = container.resources || {};
        if (resources.limits?.cpu) {
            acc.cpuLimit += parseCpuToMillicores(resources.limits.cpu);
        }
        if (resources.requests?.cpu) {
            acc.cpuRequest += parseCpuToMillicores(resources.requests.cpu);
        }
        if (resources.limits?.memory) {
            acc.memoryLimit += parseMemoryToMiB(resources.limits.memory);
        }
        if (resources.requests?.memory) {
            acc.memoryRequest += parseMemoryToMiB(resources.requests.memory);
        }
        return acc;
    }, { cpuLimit: 0, cpuRequest: 0, memoryLimit: 0, memoryRequest: 0 });
};

const PodDetails = ({ pod, onClose }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Local state for metrics history
    const [cpuHistory, setCpuHistory] = useState([]);
    const [memHistory, setMemHistory] = useState([]);

    const resourceTotals = useMemo(() => getContainerResourceTotals(pod?.containers || []), [pod]);

    const cpuStats = useMemo(() => {
        const peak = cpuHistory.reduce((max, point) => Math.max(max, point.value), 0);
        const latest = cpuHistory.length ? cpuHistory[cpuHistory.length - 1].value : 0;
        return { peak, latest };
    }, [cpuHistory]);

    const memoryStats = useMemo(() => {
        const peak = memHistory.reduce((max, point) => Math.max(max, point.value), 0);
        const latest = memHistory.length ? memHistory[memHistory.length - 1].value : 0;
        return { peak, latest };
    }, [memHistory]);

    const cpuReference = resourceTotals.cpuLimit || resourceTotals.cpuRequest || cpuStats.peak || 1;
    const memoryReference = resourceTotals.memoryLimit || resourceTotals.memoryRequest || memoryStats.peak || 1;

    const cpuPercent = Math.min(Math.round((cpuStats.latest / cpuReference) * 100), 150);
    const memoryPercent = Math.min(Math.round((memoryStats.latest / memoryReference) * 100), 150);

    const cpuSubtitle = resourceTotals.cpuLimit
        ? `${Math.round(cpuStats.latest)}m of ${Math.round(resourceTotals.cpuLimit)}m limit`
        : resourceTotals.cpuRequest
            ? `${Math.round(cpuStats.latest)}m (request ${Math.round(resourceTotals.cpuRequest)}m)`
            : 'No CPU limits configured';

    const memorySubtitle = resourceTotals.memoryLimit
        ? `${Math.round(memoryStats.latest)}MiB of ${Math.round(resourceTotals.memoryLimit)}MiB limit`
        : resourceTotals.memoryRequest
            ? `${Math.round(memoryStats.latest)}MiB (request ${Math.round(resourceTotals.memoryRequest)}MiB)`
            : 'No memory limits configured';

    const cpuTrendLabel = resourceTotals.cpuLimit
        ? `Peak ${Math.round(cpuStats.peak)}m · limit ${Math.round(resourceTotals.cpuLimit)}m`
        : `Peak observed ${Math.round(cpuStats.peak)}m`;

    const memoryTrendLabel = resourceTotals.memoryLimit
        ? `Peak ${Math.round(memoryStats.peak)}MiB · limit ${Math.round(resourceTotals.memoryLimit)}MiB`
        : `Peak observed ${Math.round(memoryStats.peak)}MiB`;

    const restartMutation = useMutation({
        mutationFn: async () => {
            await api.post(`/k8s/pods/${pod.name}/restart`, { ns: pod.namespace });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['pods', pod.namespace]);
            onClose();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            await api.delete(`/k8s/pods/${pod.name}`, { data: { ns: pod.namespace } });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['pods', pod.namespace]);
            onClose();
        }
    });

    // Fetch metrics specifically for this pod to update charts
    const { data: metrics } = useQuery({
        queryKey: ['metrics', pod?.namespace, pod?.name],
        queryFn: async () => {
            if (!pod) return null;
            try {
                const { data } = await api.get(`/k8s/metrics?ns=${pod.namespace}`);
                return data.find(m => m.name === pod.name) || null;
            } catch (err) {
                return null;
            }
        },
        enabled: !!pod,
        refetchInterval: 2000
    });
    // Update history when metrics change
    useEffect(() => {
        if (metrics && metrics.containers) {
            const now = new Date().toLocaleTimeString();

            // Aggregate usage across containers
            let totalCpu = 0; // in nanocores or millicores
            let totalMem = 0; // in Ki

            metrics.containers.forEach(c => {
                // Parse CPU
                if (c.usage.cpu.endsWith('n')) {
                    totalCpu += parseInt(c.usage.cpu) / 1000000; // to millicores
                } else if (c.usage.cpu.endsWith('m')) {
                    totalCpu += parseInt(c.usage.cpu);
                }

                // Parse Memory
                if (c.usage.memory.endsWith('Ki')) {
                    totalMem += parseInt(c.usage.memory) / 1024; // to MiB
                } else if (c.usage.memory.endsWith('Mi')) {
                    totalMem += parseInt(c.usage.memory);
                }
            });

            setCpuHistory(prev => {
                const newHistory = [...prev, { time: now, value: Math.round(totalCpu) }];
                return newHistory.slice(-20); // Keep last 20 points
            });

            setMemHistory(prev => {
                const newHistory = [...prev, { time: now, value: Math.round(totalMem) }];
                return newHistory.slice(-20); // Keep last 20 points
            });
        }
    }, [metrics]);

    // Reset history when pod changes
    useEffect(() => {
        setCpuHistory([]);
        setMemHistory([]);
    }, [pod?.name]);

    const meta = useMemo(() => {
        if (!pod) return [];
        return [
            { label: 'Status', value: pod.status, icon: Activity },
            { label: 'Node', value: pod.node || 'Pending', icon: Server },
            { label: 'IP', value: pod.ip || 'Not assigned', icon: Terminal },
            { label: 'Namespace', value: pod.namespace, icon: Layers }
        ];
    }, [pod]);

    const uptime = useMemo(() => {
        if (!pod?.startTime) return '--';
        const start = new Date(pod.startTime);
        const diffMs = Date.now() - start.getTime();
        const hours = Math.floor(diffMs / 3600000);
        if (hours < 1) {
            const mins = Math.floor(diffMs / 60000);
            return `${mins}m`;
        }
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}d`;
    }, [pod?.startTime]);

    if (!pod) return (
        <div className="glass-panel flex h-full min-h-[420px] items-center justify-center rounded-2xl text-gray-500">
            Select a pod to view details
        </div>
    );

    return (
        <div className="glass-panel flex h-full min-h-[480px] flex-col rounded-2xl">
            <div className="flex items-center justify-between border-b border-theme bg-surface-soft p-4">
                <div>
                    <p className="text-xs uppercase tracking-widest text-muted">Selected Pod</p>
                    <h3 className="truncate text-lg font-semibold text-[var(--text-color)]" title={pod.name}>{pod.name}</h3>
                </div>
                <button onClick={onClose} className="rounded-full p-2 text-muted transition hover:text-[var(--text-color)]" aria-label="Close details">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {meta.map(({ label, value, icon: Icon }) => (
                        <div key={label} className="rounded-2xl border border-theme bg-surface-muted p-4">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted">
                                <Icon size={14} className="text-neon-cyan" />
                                {label}
                            </div>
                            <p className="mt-2 text-sm font-medium text-[var(--text-color)]">{value}</p>
                        </div>
                    ))}
                    <div className="rounded-2xl border border-theme bg-surface-muted p-4">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted">
                            <Clock size={14} className="text-neon-pink" />
                            Uptime
                        </div>
                        <p className="mt-2 text-sm font-medium text-[var(--text-color)]">{uptime}</p>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <MetricGauge
                        title="CPU Usage"
                        unit="m"
                        value={cpuStats.latest}
                        percent={cpuPercent}
                        subtitle={cpuSubtitle}
                        trendLabel={cpuTrendLabel}
                        history={cpuHistory}
                        color="#00f2ff"
                    />

                    <MetricGauge
                        title="Memory Usage"
                        unit="MiB"
                        value={memoryStats.latest}
                        percent={memoryPercent}
                        subtitle={memorySubtitle}
                        trendLabel={memoryTrendLabel}
                        history={memHistory}
                        color="#ff00ff"
                    />
                </div>

                <div>
                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Containers</h4>
                    <div className="space-y-2">
                        {pod.containers.map(c => (
                            <div key={c.name} className="flex items-center justify-between rounded-2xl border border-theme bg-surface-soft p-3">
                                <div>
                                    <div className="text-sm font-semibold text-[var(--text-color)]">{c.name}</div>
                                    <div className="max-w-[220px] truncate text-xs text-muted">{c.image}</div>
                                </div>
                                <span className={clsx('rounded-full px-3 py-0.5 text-[11px] font-medium', c.ready ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300')}>
                                    {c.ready ? 'Ready' : 'Not Ready'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-theme pt-4">
                    <button
                        onClick={() => navigate(`/logs?ns=${pod.namespace}&pod=${pod.name}`)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-neon-blue/40 bg-neon-blue/10 py-2 text-sm font-semibold text-neon-cyan transition hover:bg-neon-blue/20"
                    >
                        <Terminal size={16} />
                        Logs
                    </button>

                    {user?.role === 'admin' && (
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                                onClick={() => {
                                    if (window.confirm(`Delete pod ${pod.name}? This cannot be undone.`)) {
                                        deleteMutation.mutate();
                                    }
                                }}
                                disabled={deleteMutation.isPending}
                                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-60"
                            >
                                <Trash2 size={16} />
                                Delete Pod
                            </button>

                            <button
                                onClick={() => {
                                    if (window.confirm(`Restart pod ${pod.name}?`)) {
                                        restartMutation.mutate();
                                    }
                                }}
                                disabled={restartMutation.isPending}
                                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-amber-400/50 bg-amber-500/15 py-2 text-sm font-semibold text-amber-200 shadow-[0_12px_30px_rgba(251,191,36,0.25)] transition hover:bg-amber-500/25 disabled:opacity-60"
                            >
                                <RefreshCw size={16} />
                                Restart Pod
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PodDetails;
