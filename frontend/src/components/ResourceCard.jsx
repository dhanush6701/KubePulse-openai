import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const ResourceCard = ({
    title,
    value,
    icon: Icon,
    color = 'blue',
    subtitle,
    trendLabel,
    trendValue,
    trendPositive = true,
    progress,
    delay = 0
}) => {
    const gradients = {
        blue: 'from-neon-blue via-blue-500 to-blue-700',
        purple: 'from-neon-purple via-purple-500 to-indigo-700',
        pink: 'from-neon-pink via-pink-500 to-rose-600',
        cyan: 'from-neon-cyan via-cyan-500 to-sky-500',
        green: 'from-emerald-400 via-emerald-500 to-teal-600',
    };

    const accent = {
        blue: 'text-neon-blue',
        purple: 'text-neon-purple',
        pink: 'text-neon-pink',
        cyan: 'text-neon-cyan',
        green: 'text-emerald-300',
    };
    return (
        <motion.div
            className="glass-panel group relative overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:border-white/20"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.4, delay }}
        >
            <div className={clsx(
                'absolute -right-6 -top-10 h-28 w-28 rounded-full opacity-30 blur-2xl bg-gradient-to-br',
                gradients[color]
            )} aria-hidden="true" />

            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted">{title}</p>
                    <h3 className="mt-2 text-3xl font-semibold text-[var(--text-color)]">
                        {value}
                    </h3>
                    {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
                </div>
                <div className={clsx('rounded-2xl border border-theme bg-surface-soft p-3', accent[color])}>
                    <Icon size={24} />
                </div>
            </div>

            {typeof progress === 'number' && (
                <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-muted">
                        <span>Capacity</span>
                        <span>{Math.min(progress, 100).toFixed(0)}%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                        <div
                            className={clsx('h-full rounded-full bg-gradient-to-r', gradients[color])}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                </div>
            )}

            {(trendLabel || trendValue) && (
                <div className="mt-4 flex items-center justify-between text-xs">
                    {trendLabel && <span className="text-muted">{trendLabel}</span>}
                    {trendValue && (
                        <span className={clsx('font-semibold', trendPositive ? 'text-emerald-400' : 'text-red-400')}>
                            {trendValue}
                        </span>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default ResourceCard;
