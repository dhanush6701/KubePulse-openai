import React, { useState, useEffect, useRef, useMemo } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';
import { Send, Smile, Paperclip, Hash, Users } from 'lucide-react';
import clsx from 'clsx';

const Chat = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const socket = useWebSocket('/chat');
    const messagesEndRef = useRef(null);

    const participants = useMemo(() => {
        const map = new Map();
        if (user) {
            map.set(user.username, { username: user.username });
        }
        messages.forEach((msg) => {
            if (!map.has(msg.username)) {
                map.set(msg.username, { username: msg.username });
            }
        });
        return Array.from(map.values());
    }, [messages, user]);

    useEffect(() => {
        if (!socket) return;

        socket.emit('join_room', 'general');

        socket.on('history', (msgs) => {
            setMessages(msgs);
        });

        socket.on('message', (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        return () => {
            socket.off('message');
            socket.off('history');
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const msg = {
            id: Date.now(),
            userId: user._id,
            username: user.username,
            text: input,
            timestamp: new Date().toISOString(),
            room: 'general'
        };

        // Optimistic update? Or wait for server?
        // For simplicity, we emit and server should broadcast back (including to sender)
        // But usually we want immediate feedback.
        // Let's assume server broadcasts to everyone including sender.
        // Actually, let's just append locally too if we want instant feel, but deduping is needed.
        // We'll rely on server broadcast for now.

        // Wait, I need to implement the backend listener for 'message' in websocketBroker.js!
        // I only implemented connection logic there. I need to add the event handler.
        // I will update websocketBroker.js in the next step.

        socket.emit('send_message', msg);
        setInput('');
    };

    return (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="glass-panel hidden flex-col rounded-2xl border border-white/10 p-5 lg:flex">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Hash size={18} className="text-neon-blue" />
                    general
                </div>
                <p className="mt-1 text-xs text-gray-400">
                    Share deployment updates, wins, and alerts with the core team.
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500">
                    <Users size={14} />
                    Active participants
                </div>
                <div className="mt-3 space-y-2">
                    {participants.map((member) => (
                        <div key={member.username} className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-neon-purple to-neon-blue text-center text-xs font-semibold leading-8">
                                {member.username.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="truncate">{member.username}</span>
                        </div>
                    ))}
                </div>
            </aside>

            <div className="glass-panel flex h-[calc(100vh-140px)] flex-col rounded-2xl border border-white/10 overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-5 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Team Chat · #general</h2>
                        <p className="text-xs text-gray-400">{messages.length} events logged today</p>
                    </div>
                    <span className="pill-control text-[11px]">Live</span>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                    {messages.map((msg) => {
                        const isMe = msg.username === user.username;
                        return (
                            <div key={msg.id} className={clsx('flex flex-col gap-1', isMe ? 'items-end' : 'items-start')}>
                                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                    <span className="font-semibold text-gray-300">{msg.username}</span>
                                    <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div className={clsx(
                                    'max-w-[70%] rounded-3xl px-4 py-2 text-sm shadow-lg',
                                    isMe
                                        ? 'rounded-tr-sm border border-neon-blue/40 bg-gradient-to-r from-neon-blue/30 to-neon-purple/30 text-white'
                                        : 'rounded-tl-sm border border-white/10 bg-white/5 text-gray-200'
                                )}>
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={sendMessage} className="border-t border-white/10 bg-white/5 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <button type="button" className="rounded-xl p-2 text-gray-400 transition hover:bg-white/10 hover:text-white">
                            <Paperclip size={18} />
                        </button>
                        <div className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Share an update..."
                                className="w-full bg-transparent py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none"
                            />
                        </div>
                        <button type="button" className="rounded-xl p-2 text-gray-400 transition hover:bg-white/10 hover:text-white">
                            <Smile size={18} />
                        </button>
                        <button
                            type="submit"
                            className="btn-primary px-4 py-2"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    {input && (
                        <p className="mt-2 text-xs text-gray-500">Shift + Enter to add a newline</p>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Chat;
