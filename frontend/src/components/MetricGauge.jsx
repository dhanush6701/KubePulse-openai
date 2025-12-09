import React from 'react';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

const MetricGauge = ({
    title,
    unit,
    value = 0,
    percent = 0,
    subtitle,
    trendLabel,
    history = [],
    color = '#4d4dff'
}) => {
    const clampedPercent = Math.max(0, percent || 0);
    const gaugeMax = Math.max(100, Math.ceil(clampedPercent / 10) * 10);
    const trimmedHistory = history.slice(-20);
    const peak = trimmedHistory.reduce((max, point) => Math.max(max, point.value), 0) || 1;
    const formatPrimaryValue = (val) => {
        if (val >= 100) return Math.round(val).toString();
        if (val >= 10) return val.toFixed(1);
        return val.toFixed(2);
    };
    const displayValue = Number.isFinite(value) ? value : 0;

    return (
        <div className="rounded-2xl border border-theme bg-surface-muted p-4 flex flex-col gap-4 h-full">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-widest text-muted">{title}</p>
                    <div className="flex items-baseline gap-1 text-[var(--text-color)]">
                        <span className="text-3xl font-semibold">{formatPrimaryValue(displayValue)}</span>
                        <span className="text-xs text-muted">{unit}</span>
                    </div>
                    {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
                </div>
                <div className="relative h-32 w-32">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="70%"
                            outerRadius="100%"
                            barSize={12}
                            data={[{ name: title, value: Math.min(clampedPercent, gaugeMax) }]}
                            startAngle={215}
                            endAngle={-35}
                        >
                            <PolarAngleAxis type="number" domain={[0, gaugeMax]} tick={false} />
                            <RadialBar
                                dataKey="value"
                                cornerRadius={14}
                                fill={color}
                                background
                                clockWise
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-sm font-semibold text-[var(--text-color)]">{Math.round(clampedPercent)}%</div>
                    </div>
                </div>
            </div>

            <div className="flex-1">
                <div className="flex h-16 items-end gap-1">
                    {trimmedHistory.length === 0 ? (
                        <div className="flex-1 text-center text-xs text-muted">Waiting for data...</div>
                    ) : (
                        trimmedHistory.map((point, idx) => (
                            <span
                                key={`${title}-${idx}`}
                                className="flex-1 rounded-full bg-gradient-to-t from-transparent via-transparent to-transparent"
                                style={{
                                    height: `${Math.max((point.value / peak) * 100, 6)}%`,
                                    backgroundImage: `linear-gradient(180deg, ${color} 0%, ${color}40 60%, rgba(255,255,255,0.15) 100%)`,
                                    boxShadow: `0 6px 12px ${color}25`
                                }}
                                aria-label={`${point.time}: ${point.value}${unit}`}
                            />
                        ))
                    )}
                </div>
                {trendLabel && (
                    <p className="mt-2 text-[11px] uppercase tracking-widest text-muted">{trendLabel}</p>
                )}
            </div>
        </div>
    );
};

export default MetricGauge;
