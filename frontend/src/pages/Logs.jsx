import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import useWebSocket from '../hooks/useWebSocket';
import api from '../api/axios';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Radio, Server, Trash2 } from 'lucide-react';

const Logs = () => {
    const terminalRef = useRef(null);
    const xtermRef = useRef(null);
    const fitAddonRef = useRef(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [namespace, setNamespace] = useState(searchParams.get('ns') || 'kubepulse');
    const [pod, setPod] = useState(searchParams.get('pod') || '');
    const [isStreaming, setIsStreaming] = useState(false);

    const socket = useWebSocket('/logs');

    // Fetch pods for selector
    const { data: pods = [] } = useQuery({
        queryKey: ['pods', namespace],
        queryFn: async () => {
            const { data } = await api.get(`/k8s/pods?ns=${namespace}`);
            return data;
        },
        refetchInterval: 10000 // Refresh every 10 seconds
    });

    useEffect(() => {
        if (!terminalRef.current) return;

        const term = new Terminal({
            theme: {
                background: '#0f172a',
                foreground: '#f8fafc',
                cursor: '#00f2ff',
                selectionBackground: '#4d4dff',
            },
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            fontSize: 14,
            cursorBlink: true,
        });

        const fitAddon = new FitAddon();
        fitAddonRef.current = fitAddon;
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        // Safely fit terminal
        requestAnimationFrame(() => {
            try {
                fitAddonRef.current?.fit();
            } catch (e) {
                console.warn('Initial fit error:', e);
            }
        });

        xtermRef.current = term;

        const fitTerminal = () => {
            if (
                terminalRef.current &&
                xtermRef.current &&
                fitAddonRef.current &&
                terminalRef.current.clientWidth > 0
            ) {
                try {
                    fitAddonRef.current.fit();
                } catch (e) {
                    console.warn('Fit error:', e);
                }
            }
        };

        const resizeObserver = new ResizeObserver(() => {
            // Debounce slightly or just call fit
            requestAnimationFrame(fitTerminal);
        });

        resizeObserver.observe(terminalRef.current);

        // Initial fit
        setTimeout(fitTerminal, 100);

        return () => {
            resizeObserver.disconnect();
            fitAddonRef.current = null;
            xtermRef.current = null;
            term.dispose();
        };
    }, []);

    useEffect(() => {
        if (!socket || !pod) return;

        const room = `pod:${namespace}:${pod}`;

        // Join room
        socket.emit('join_log_room', room);

        // Start stream from backend
        api.get(`/k8s/streamLogs?ns=${namespace}&pod=${pod}&container=`).catch(console.error);

        const handleLog = (line) => {
            if (xtermRef.current) {
                xtermRef.current.writeln(line);
            }
        };

        socket.on('log_line', handleLog);
        setIsStreaming(true);

        return () => {
            socket.emit('leave_log_room', room);
            socket.off('log_line', handleLog);
            setIsStreaming(false);
            if (xtermRef.current) xtermRef.current.clear();
        };
    }, [socket, namespace, pod]);

    const handleClear = () => {
        if (xtermRef.current) {
            try {
                xtermRef.current.clear();
            } catch (err) {
                console.warn('Unable to clear terminal', err);
            }
        }
    };

    return (
        <div className="space-y-4">
            <section className="glass-panel rounded-2xl border border-white/10 p-5">
                <div className="flex flex-wrap items-center gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-gray-400">Log stream</p>
                        <h2 className="text-lg font-semibold text-white">Inspect pod output</h2>
                        <p className="text-xs text-gray-500">Follow container stdout to capture regressions quickly.</p>
                    </div>
                    <div className="flex flex-1 flex-wrap items-center gap-3">
                        <div className="flex flex-col">
                            <label className="text-[11px] uppercase tracking-wide text-gray-500">Namespace</label>
                            <select
                                value={namespace}
                                onChange={(e) => {
                                    setNamespace(e.target.value);
                                    setPod('');
                                    setSearchParams({ ns: e.target.value });
                                }}
                                className="input-control w-48"
                            >
                                <option value="kubepulse">kubepulse</option>
                                <option value="default">default</option>
                                <option value="kube-system">kube-system</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[11px] uppercase tracking-wide text-gray-500">Pod</label>
                            <select
                                value={pod}
                                onChange={(e) => {
                                    setPod(e.target.value);
                                    setSearchParams({ ns: namespace, pod: e.target.value });
                                }}
                                className="input-control min-w-[220px]"
                            >
                                <option value="">Select Pod...</option>
                                {pods.map(p => (
                                    <option key={p.name} value={p.name}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="ml-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
                            <div className={`h-2 w-2 rounded-full ${isStreaming ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                            {isStreaming ? 'Streaming' : 'Idle'}
                        </div>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-gray-300 transition hover:bg-white/10"
                        >
                            <Trash2 size={14} />
                            Clear
                        </button>
                    </div>
                </div>
            </section>

            <div className="glass-panel h-[calc(100vh-220px)] rounded-2xl border border-white/10 p-4 shadow-neon-blue">
                <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
                    <Server size={14} />
                    {namespace} · {pod || 'Select a pod to begin'}
                    <span className="ml-auto inline-flex items-center gap-1 text-xs">
                        <Radio size={12} className={isStreaming ? 'text-green-400' : 'text-gray-500'} />
                        {isStreaming ? 'Live feed' : 'Waiting'}
                    </span>
                </div>
                <div ref={terminalRef} className="h-full w-full" />
            </div>
        </div>
    );
};

export default Logs;
