import React from 'react';
import { Layers, Plus, Minus, ShieldCheck, Timer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';

const DeploymentList = ({ deployments, namespace }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const scaleMutation = useMutation({
        mutationFn: async ({ deployment, replicas }) => {
            await api.post('/k8s/scale', { deployment, ns: namespace, replicas });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['deployments', namespace]);
            queryClient.invalidateQueries(['pods', namespace]);
        }
    });

    const handleScale = (dep, change) => {
        const newReplicas = Math.max(0, dep.replicas + change);
        scaleMutation.mutate({ deployment: dep.name, replicas: newReplicas });
    };

    const formatAge = (timestamp) => {
        if (!timestamp) return '—';
        const start = new Date(timestamp);
        const diffMs = Date.now() - start.getTime();
        const days = Math.floor(diffMs / 86400000);
        if (days > 0) return `${days}d`; 
        const hours = Math.floor(diffMs / 3600000);
        if (hours > 0) return `${hours}h`;
        const minutes = Math.floor(diffMs / 60000);
        return `${minutes}m`;
    };

    return (
        <div className="glass-panel flex h-full flex-col rounded-2xl">
            <div className="border-b border-theme bg-surface-soft p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-color)]">
                            <Layers size={18} className="text-neon-pink" />
                            Deployments
                        </div>
                        <p className="text-xs text-muted">Scale workloads without leaving the dashboard</p>
                    </div>
                    <span className="rounded-full border border-theme bg-surface-muted px-3 py-1 text-xs text-muted">
                        {namespace}
                    </span>
                </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-3">
                <AnimatePresence initial={false}>
                    {deployments.map((dep) => {
                    const readiness = dep.replicas === 0 ? 0 : (dep.readyReplicas / dep.replicas) * 100;
                    const healthy = readiness >= 90;
                    return (
                            <motion.div
                                key={dep.name}
                                layout
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25 }}
                                className="rounded-2xl border border-theme bg-surface-muted p-4"
                            >
                            <div className="mb-4 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-[var(--text-color)]" title={dep.name}>{dep.name}</p>
                                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted">
                                        <span className="inline-flex items-center gap-1"><Timer size={12} />Age {formatAge(dep.creationTimestamp)}</span>
                                        <span className="inline-flex items-center gap-1">
                                            <ShieldCheck size={12} className={healthy ? 'text-emerald-400' : 'text-yellow-300'} />
                                            {healthy ? 'Healthy' : 'Degraded'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right text-xs">
                                        <span className="text-green-500">{dep.readyReplicas} Ready</span>
                                        <span className="text-muted"> / </span>
                                        <span className="text-muted">{dep.replicas} Desired</span>
                                </div>
                            </div>

                                <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-soft">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-neon-blue"
                                    style={{ width: `${Math.min(readiness, 100)}%` }}
                                />
                            </div>

                            {['admin', 'operator'].includes(user?.role) && (
                                    <div className="flex items-center justify-between text-xs text-muted">
                                    <div className="flex items-center gap-2">
                                        <span>{user?.role === 'operator' ? 'Scale (limited)' : 'Scale'}</span>
                                            <div className="inline-flex items-center gap-2 rounded-full border border-theme bg-surface-soft px-2 py-1">
                                            <button
                                                type="button"
                                                onClick={() => handleScale(dep, -1)}
                                                disabled={scaleMutation.isPending}
                                                    className="rounded-full p-1 text-muted transition-colors hover:text-[var(--text-color)] disabled:opacity-40"
                                            >
                                                <Minus size={14} />
                                            </button>
                                                <span className="w-8 text-center font-mono text-[var(--text-color)]">{dep.replicas}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleScale(dep, 1)}
                                                disabled={scaleMutation.isPending}
                                                    className="rounded-full p-1 text-muted transition-colors hover:text-[var(--text-color)] disabled:opacity-40"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                        <span className="text-[11px] uppercase tracking-wide text-muted">Ready ratio {Math.min(readiness, 100).toFixed(0)}%</span>
                                </div>
                            )}
                            </motion.div>
                    );
                    })}
                </AnimatePresence>

                {deployments.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-theme p-8 text-center text-sm text-muted">
                        No deployments found
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeploymentList;
