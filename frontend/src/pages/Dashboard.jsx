import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Box, Layers, Server, Activity, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import ResourceCard from '../components/ResourceCard';
import PodList from '../components/PodList';
import DeploymentList from '../components/DeploymentList';
import PodDetails from '../components/PodDetails';
import AssistantPanel from '../components/AssistantPanel';

const Dashboard = () => {
    const [namespace, setNamespace] = useState('kubepulse'); // Default to our ns
    const [selectedPod, setSelectedPod] = useState(null);
    const queryClient = useQueryClient();

    // Queries
    const { data: namespaces = [] } = useQuery({
        queryKey: ['namespaces'],
        queryFn: async () => {
            const { data } = await api.get('/k8s/namespaces');
            return data;
        }
    });

    const allowedNamespaces = useMemo(() => (
        namespaces.filter(ns => ['kubepulse', 'default', 'kube-system'].includes(ns))
    ), [namespaces]);

    const namespaceOptions = allowedNamespaces.length ? allowedNamespaces : namespaces;

    useEffect(() => {
        if (namespaceOptions.length && !namespaceOptions.includes(namespace)) {
            setNamespace(namespaceOptions[0]);
            setSelectedPod(null);
        }
    }, [namespaceOptions, namespace]);

    const { data: pods = [] } = useQuery({
        queryKey: ['pods', namespace],
        queryFn: async () => {
            const { data } = await api.get(`/k8s/pods?ns=${namespace}`);
            return data;
        },
        refetchInterval: 2000
    });

    const { data: deployments = [] } = useQuery({
        queryKey: ['deployments', namespace],
        queryFn: async () => {
            const { data } = await api.get(`/k8s/deployments?ns=${namespace}`);
            return data;
        },
        refetchInterval: 2000
    });

    // Stats
    const totalPods = pods.length;
    const runningPods = pods.filter(p => p.status === 'Running').length;
    const totalDeps = deployments.length;
    const readyDeps = deployments.filter(d => d.readyReplicas === d.replicas).length;

    const podHealth = totalPods ? Math.round((runningPods / totalPods) * 100) : 0;
    const deploymentHealth = totalDeps ? Math.round((readyDeps / totalDeps) * 100) : 0;
    const flaggedPods = pods.filter(p => p.status !== 'Running');
    const statusCounts = useMemo(() => (
        pods.reduce((acc, pod) => {
            acc[pod.status] = (acc[pod.status] || 0) + 1;
            return acc;
        }, {})
    ), [pods]);

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['pods', namespace] });
        queryClient.invalidateQueries({ queryKey: ['deployments', namespace] });
        queryClient.invalidateQueries({ queryKey: ['namespaces'] });
    };

    return (
        <>
        <div className="space-y-6">
            <section className="glass-panel rounded-2xl border border-white/10 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Live Observability</p>
                        <h1 className="mt-1 text-3xl font-semibold text-white">Cluster Control Room</h1>
                        <p className="mt-2 text-sm text-slate-400">Monitor deployments, inspect pods, and stream logs from a single pane.</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <label className="text-xs uppercase tracking-wide text-gray-400">Namespace</label>
                        <select
                            value={namespace}
                            onChange={(e) => {
                                setNamespace(e.target.value);
                                setSelectedPod(null);
                            }}
                            className="input-control w-48"
                        >
                            {namespaceOptions.map(ns => (
                                <option key={ns} value={ns}>{ns}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={handleRefresh}
                            className="btn-primary whitespace-nowrap text-xs font-semibold"
                        >
                            <RefreshCw size={14} />
                            Refresh data
                        </button>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 text-sm text-muted sm:grid-cols-3">
                    <div className="rounded-2xl border border-theme bg-surface-muted p-4">
                        <span className="text-xs uppercase tracking-widest">Pod health</span>
                        <p className="mt-2 text-2xl font-semibold text-[var(--text-color)]">{podHealth}%</p>
                        <p className="text-xs text-muted">{runningPods} / {totalPods || 1} running</p>
                    </div>
                    <div className="rounded-2xl border border-theme bg-surface-muted p-4">
                        <span className="text-xs uppercase tracking-widest">Deployment readiness</span>
                        <p className="mt-2 text-2xl font-semibold text-[var(--text-color)]">{deploymentHealth}%</p>
                        <p className="text-xs text-muted">{readyDeps} / {totalDeps || 1} ready</p>
                    </div>
                    <div className="rounded-2xl border border-theme bg-surface-muted p-4">
                        <span className="text-xs uppercase tracking-widest">Namespaces tracked</span>
                        <p className="mt-2 text-2xl font-semibold text-[var(--text-color)]">{namespaces.length}</p>
                        <p className="text-xs text-muted">Including {namespace}</p>
                    </div>
                </div>
            </section>

            {/* Resource Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <ResourceCard
                    title="Total Pods"
                    value={totalPods}
                    icon={Box}
                    color="cyan"
                    subtitle="Across selected namespace"
                    trendLabel="Last sync"
                    trendValue={`${runningPods} healthy`}
                    delay={0}
                />
                <ResourceCard
                    title="Deployments"
                    value={totalDeps}
                    icon={Layers}
                    color="purple"
                    subtitle="Workloads detected"
                    trendLabel="Ready"
                    trendValue={`${readyDeps} OK`}
                    delay={0.05}
                />
                <ResourceCard
                    title="Running Pods"
                    value={runningPods}
                    icon={Activity}
                    color="green"
                    subtitle="Real-time status"
                    trendLabel="Health"
                    trendValue={`${podHealth}%`}
                    trendPositive={podHealth >= 90}
                    progress={podHealth}
                    delay={0.1}
                />
                <ResourceCard
                    title="Healthy Deps"
                    value={readyDeps}
                    icon={Server}
                    color="pink"
                    subtitle="Ready for traffic"
                    trendLabel="Coverage"
                    trendValue={`${deploymentHealth}%`}
                    trendPositive={deploymentHealth >= 90}
                    progress={deploymentHealth}
                    delay={0.15}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                {/* Left Column: Lists */}
                <div className="flex flex-col gap-6">
                    <div className="h-[360px]">
                        <PodList
                            pods={pods}
                            selectedPod={selectedPod}
                            onSelectPod={setSelectedPod}
                        />
                    </div>
                    <div className="min-h-[480px]">
                        <PodDetails
                            pod={selectedPod}
                            onClose={() => setSelectedPod(null)}
                        />
                    </div>
                    <div className="h-[360px]">
                        <DeploymentList
                            deployments={deployments}
                            namespace={namespace}
                        />
                    </div>
                </div>

                {/* Right Column: Insights */}
                <div className="flex flex-col gap-6">
                    <div className="glass-panel flex-1 rounded-2xl border border-white/10 p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <ShieldCheck size={16} className="text-emerald-400" />
                            Operational insights
                        </div>
                        <p className="text-xs text-gray-400">We surface workloads needing attention.</p>
                        <div className="mt-4 space-y-3">
                            {flaggedPods.length === 0 && (
                                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                                    All pods are healthy in {namespace}.
                                </div>
                            )}

                            {flaggedPods.map((pod) => (
                                <div key={pod.name} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                    <div className="flex items-center justify-between text-sm font-semibold text-white">
                                        <span className="truncate pr-2" title={pod.name}>{pod.name}</span>
                                        <span className="text-xs text-gray-400">{pod.status}</span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-red-300">
                                        <AlertTriangle size={12} />
                                        Investigate recent state
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-3 text-xs text-gray-400">
                            <p className="uppercase tracking-widest">Status breakdown</p>
                            <div className="mt-3 space-y-2">
                                {Object.entries(statusCounts).map(([status, count]) => (
                                    <div key={status}>
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span>{status}</span>
                                            <span className="text-white">{count}</span>
                                        </div>
                                        <div className="mt-1 h-1 rounded-full bg-white/10">
                                            <div
                                                className={clsx('h-full rounded-full',
                                                    status === 'Running' ? 'bg-emerald-400' :
                                                        status === 'Pending' ? 'bg-yellow-300' : 'bg-red-400'
                                                )}
                                                style={{ width: `${(count / (totalPods || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <AssistantPanel selectedPod={selectedPod} namespace={namespace} />
    </>
    );
};

export default Dashboard;
