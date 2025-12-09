import React, { useState } from 'react';
import { MessageCircle, Send, Bot, X } from 'lucide-react';
import api from '../api/axios';

/**
 * Floating assistant bubble for the dashboard.
 * Props:
 *  - selectedPod: pod object or null
 *  - namespace: current namespace string
 */
const AssistantPanel = ({ selectedPod, namespace }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        {
            id: 'welcome',
            role: 'assistant',
            text: 'Hi! I am your KubePulse assistant. Select a pod and ask things like "Why is this pod CrashLoopBackOff?" or "What should I check to debug this deployment?"'
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const context = selectedPod ? {
        selectedPod: {
            name: selectedPod.name,
            namespace: selectedPod.namespace,
            status: selectedPod.status,
            node: selectedPod.node,
            ip: selectedPod.ip,
            restartCount: selectedPod.restartCount,
            containers: selectedPod.containers?.map(c => ({
                name: c.name,
                image: c.image,
                ready: c.ready
            })) || []
        },
        namespace
    } : {
        namespace
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        setError(null);

        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: input.trim()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const { data } = await api.post('/assistant/chat', {
                message: userMessage.text,
                context
            });

            const replyText = data.reply || 'I could not generate a response.';
            const assistantMessage = {
                id: Date.now().toString() + '-assistant',
                role: 'assistant',
                text: replyText
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (err) {
            console.error('Assistant error', err);
            setError(err.response?.data?.message || 'Failed to talk to assistant.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating toggle button */}
            {!isOpen && (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/40 hover:scale-105 hover:shadow-xl transition-transform"
                >
                    <MessageCircle size={18} />
                    <span>Ask KubePulse</span>
                </button>
            )}

            {/* Floating chat panel */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-40 flex h-[420px] w-[360px] flex-col rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl shadow-black/60">
                    <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                            <Bot size={18} className="text-neon-cyan" />
                            <span>Assistant</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400">
                            {selectedPod ? (
                                <span>Focused on <span className="font-semibold text-white truncate max-w-[120px] inline-block" title={selectedPod.name}>{selectedPod.name}</span></span>
                            ) : (
                                <span>Select a pod to give more context</span>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="rounded-full bg-white/5 p-1 text-gray-300 hover:bg-white/10"
                                aria-label="Close assistant"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                className={msg.role === 'assistant'
                                    ? 'flex items-start gap-2'
                                    : 'flex items-start gap-2 justify-end'}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-xs font-bold text-white">
                                        <MessageCircle size={14} />
                                    </div>
                                )}
                                <div
                                    className={msg.role === 'assistant'
                                        ? 'max-w-[85%] rounded-2xl bg-white/5 px-3 py-2 text-[13px] leading-relaxed text-gray-100'
                                        : 'max-w-[85%] rounded-2xl bg-neon-blue/80 px-3 py-2 text-[13px] leading-relaxed text-white'}
                                >
                                    {msg.text}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="mt-1 h-7 w-7 rounded-full bg-white/10 text-xs font-semibold text-white flex items-center justify-center">
                                        Me
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <p className="text-xs text-gray-400">Assistant is thinking…</p>
                        )}

                        {error && (
                            <p className="text-xs text-red-400">{error}</p>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="border-t border-white/10 bg-black/60 px-3 py-3">
                        <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={selectedPod
                                    ? 'Ask about this pod…'
                                    : 'Ask about your cluster…'}
                                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neon-blue text-white disabled:opacity-60"
                                aria-label="Send message"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                        <p className="mt-1 text-[10px] text-gray-500">
                            Your question and minimal pod metadata are sent to OpenAI. Do not paste secrets.
                        </p>
                    </form>
                </div>
            )}
        </>
    );
};

export default AssistantPanel;
