import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Terminal, MessageSquare, Shield, LogOut, User, Sun, Moon, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import clsx from 'clsx';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const location = useLocation();
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Logs', path: '/logs', icon: Terminal },
        { name: 'Chat', path: '/chat', icon: MessageSquare },
    ];

    if (user?.role === 'admin') {
        navItems.push({ name: 'Admin', path: '/admin', icon: Shield });
    }

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <nav className="glass-panel sticky top-4 z-50 mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 rounded-2xl border border-white/10 px-5 py-3">
            <div className="flex items-center gap-6 overflow-x-auto">
                <Link to="/" className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-pink bg-clip-text text-transparent">
                    KubePulse
                </Link>

                <div className="hidden items-center gap-2 text-xs font-medium text-gray-400 md:flex">
                    <span className="pill-control border-white/10 bg-white/5 text-[10px] font-semibold tracking-wider uppercase">Cluster</span>
                    <span className="text-white">{user?.role === 'admin' ? 'Production · Admin' : 'Observer'}</span>
                    <div className={clsx('flex items-center gap-1 text-[11px]', isOnline ? 'text-green-400' : 'text-red-400')}>
                        <span className={clsx('h-2 w-2 rounded-full', isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400')} />
                        {isOnline ? 'Live' : 'Offline'}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition-all duration-200",
                                    isActive
                                        ? "bg-white/10 text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <Icon size={18} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-4">
                <button
                    onClick={() => {
                        const themes = ['light', 'dark', 'cyberpunk'];
                        const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];
                        setTheme(nextTheme);
                    }}
                    className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-neon-cyan"
                    title={`Current theme: ${theme}`}
                >
                    {theme === 'light' && <Sun size={20} />}
                    {theme === 'dark' && <Moon size={20} />}
                    {theme === 'cyberpunk' && <Zap size={20} />}
                </button>

                <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neon-purple to-neon-blue flex items-center justify-center">
                        <User size={16} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-text">{user?.username}</span>
                        <span className="text-xs text-neon-pink uppercase tracking-wider">{user?.role}</span>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-red-400/10 hover:text-red-400"
                    title="Logout"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
