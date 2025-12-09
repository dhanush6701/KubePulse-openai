import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
import PageTransition from './components/PageTransition';
import { useTheme } from './context/ThemeContext';
import clsx from 'clsx';

const ProtectedLayout = ({ children }) => {
    const { user, loading } = useAuth();
    const { theme } = useTheme();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-neon-blue animate-pulse">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    const backgroundStyle = theme === 'light'
        ? {
            backgroundImage: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 40%, #e2e8f0 100%)'
        }
        : {
            backgroundImage: 'radial-gradient(circle at top, rgba(77,77,255,0.12), transparent 55%), radial-gradient(circle at bottom, rgba(255,0,255,0.08), transparent 65%)'
        };

    return (
        <div
            className={clsx(
                'relative min-h-screen overflow-x-hidden overflow-y-auto transition-colors duration-500',
                'bg-bg text-[var(--text-color)]'
            )}
            style={backgroundStyle}
        >
            <div
                className={clsx(
                    'pointer-events-none absolute inset-0 aurora',
                    theme === 'light' ? 'opacity-40 mix-blend-multiply' : 'opacity-70'
                )}
                aria-hidden="true"
            />
            <div className="pointer-events-none absolute inset-0 grid-overlay" aria-hidden="true" />

            <div className="relative z-10 flex min-h-screen flex-col items-center text-[var(--text-color)]">
                <Navbar />
                <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-4 pb-12 pt-6 sm:px-8 lg:px-10">
                    <PageTransition>
                        {children}
                    </PageTransition>
                </main>
                <footer className="mx-auto w-full max-w-[1600px] px-4 pb-8 text-center text-xs text-muted sm:px-8 lg:px-10">
                    Live Kubernetes observability · v1.0 · Crafted by KubePulse
                </footer>
            </div>
        </div>
    );
};

const App = () => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/login" element={
                    <PageTransition>
                        <Login />
                    </PageTransition>
                } />

                <Route path="/signup" element={
                    <PageTransition>
                        <Signup />
                    </PageTransition>
                } />

                <Route path="/" element={
                    <ProtectedLayout>
                        <Dashboard />
                    </ProtectedLayout>
                } />

                <Route path="/logs" element={
                    <ProtectedLayout>
                        <Logs />
                    </ProtectedLayout>
                } />

                <Route path="/chat" element={
                    <ProtectedLayout>
                        <Chat />
                    </ProtectedLayout>
                } />

                <Route path="/admin" element={
                    <ProtectedLayout>
                        <Admin />
                    </ProtectedLayout>
                } />

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </AnimatePresence>
    );
};

export default App;
