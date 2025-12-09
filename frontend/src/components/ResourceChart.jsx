import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ResourceChart = ({ data, dataKey, color, unit, height = 180 }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center rounded-lg bg-black/20 text-xs text-gray-500" style={{ height }}>
                Waiting for data...
            </div>
        );
    }

    return (
        <div className={`w-full rounded-lg bg-black/20 p-2`} style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.5} />
                    <XAxis
                        dataKey="time"
                        hide
                    />
                    <YAxis
                        hide
                        domain={[0, 'auto']}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            borderColor: color,
                            color: '#f8fafc',
                            borderRadius: '8px',
                            boxShadow: `0 0 10px ${color}40`
                        }}
                        itemStyle={{ color: color }}
                        formatter={(value) => [`${value}${unit}`, dataKey === 'value' ? 'Usage' : dataKey]}
                        labelStyle={{ display: 'none' }}
                        cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '5 5' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#color${dataKey})`}
                        isAnimationActive={true}
                        animationDuration={1000}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ResourceChart;
