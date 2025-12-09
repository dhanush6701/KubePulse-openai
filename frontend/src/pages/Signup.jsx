import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/signup', { username, email, password });
            // Auto login after signup
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed');
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden px-4 py-10">
            <div className="pointer-events-none absolute inset-0 aurora opacity-80" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-0 grid-overlay" aria-hidden="true" />
            <div className="relative z-10 mx-auto max-w-5xl">
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="glass-panel rounded-3xl border border-white/10 p-8">
                        <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Welcome</p>
                        <h1 className="mt-2 text-3xl font-semibold text-white">Create your KubePulse profile</h1>
                        <p className="mt-3 text-sm text-gray-400">Provisioned access grants dashboards, live pod telemetry, log streaming, and admin tooling.</p>
                        <ul className="mt-6 space-y-3 text-sm text-gray-300">
                            <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <span className="font-semibold">Role-based security</span>
                                <p className="text-xs text-gray-400">Admins unlock scaling + restart powers.</p>
                            </li>
                            <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <span className="font-semibold">Unified workspace</span>
                                <p className="text-xs text-gray-400">Collaborate with ops and dev in context.</p>
                            </li>
                        </ul>
                    </div>

                    <div className="glass-panel rounded-3xl border border-white/10 p-8 shadow-neon-blue">
                        <h2 className="text-2xl font-semibold text-center text-white">Sign up</h2>

                        {error && (
                            <div className="mt-6 rounded-2xl border border-red-500/50 bg-red-500/10 p-3 text-center text-sm text-red-200">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-400">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="input-control"
                                    placeholder="johndoe"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-400">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-control"
                                    placeholder="john@example.com"
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
                                    placeholder="At least 8 characters"
                                    required
                                />
                                <p className="mt-1 text-xs text-gray-500">Use a unique passphrase—KubePulse runs inside your cluster.</p>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary w-full"
                            >
                                Create account
                            </button>
                        </form>

                        <div className="mt-6 text-center text-sm text-gray-400">
                            Already have an account?{' '}
                            <Link to="/login" className="text-neon-cyan hover:text-neon-blue transition-colors">
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
