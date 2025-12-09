import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden px-4 py-10">
            <div className="pointer-events-none absolute inset-0 aurora opacity-80" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-0 grid-overlay" aria-hidden="true" />
            <div className="relative z-10 mx-auto max-w-5xl">
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="glass-panel rounded-3xl border border-white/10 p-8 text-white">
                        <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Observability</p>
                        <h1 className="mt-2 text-3xl font-semibold">Log back into the control room</h1>
                        <p className="mt-3 text-sm text-gray-400">One credential unlocks dashboards, tailing logs, and fleet-wide collaboration.</p>
                        <div className="mt-6 space-y-4 text-sm text-gray-300">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="font-semibold">Real-time telemetry</p>
                                <p className="text-xs text-gray-400">Refresh-free pod stats, deployments, and logs.</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="font-semibold">Collaborative chat</p>
                                <p className="text-xs text-gray-400">Keep SREs and developers aligned.</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel rounded-3xl border border-white/10 p-8 shadow-neon-blue">
                        <h2 className="text-2xl font-semibold text-center text-white">Sign in to KubePulse</h2>

                        {error && (
                            <div className="mt-6 rounded-2xl border border-red-500/50 bg-red-500/10 p-3 text-center text-sm text-red-200">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-400">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-control"
                                    placeholder="admin@kubepulse.local"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-400">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-control"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEmail('admin@kubepulse.local');
                                        setPassword('kubepulse');
                                    }}
                                    className="text-neon-cyan hover:text-white"
                                >
                                    Fill demo credentials
                                </button>
                                <span>Need access? Ask an admin.</span>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary w-full"
                            >
                                Sign In
                            </button>
                        </form>

                        <div className="mt-6 text-center text-sm text-gray-400">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-neon-cyan hover:text-neon-blue transition-colors">
                                Sign Up
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
