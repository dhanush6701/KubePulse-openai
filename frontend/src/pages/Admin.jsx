import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import api from '../api/axios';
import { Trash2, Shield, User, RefreshCw, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Admin = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const roleOptions = [
        { value: 'viewer', label: 'Viewer' },
        { value: 'operator', label: 'Operator · Scale pods only' },
        { value: 'admin', label: 'Admin' }
    ];

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data } = await api.get('/admin/users');
            return data;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            await api.delete(`/admin/users/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
        }
    });

    const roleMutation = useMutation({
        mutationFn: async ({ id, role }) => {
            await api.patch(`/admin/users/${id}/role`, { role });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
        }
    });

    if (user?.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[var(--text-color)] flex items-center gap-2">
                <Shield className="text-neon-purple" />
                Admin Console
            </h1>

            <div className="glass-panel rounded-xl border border-dashed border-theme bg-surface-muted/60 p-4 text-sm text-muted flex flex-wrap gap-3 items-center">
                <Activity size={16} className="text-neon-blue" />
                Grant an "operator" role when a teammate should only scale deployments. Operators automatically inherit access to the scale controls in the dashboard but cannot restart pods or manage users.
            </div>

            {roleMutation.isError && (
                <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-200">
                    {roleMutation.error?.response?.data?.message || 'Failed to update role. Please try again.'}
                </div>
            )}

            <div className="glass-panel rounded-xl overflow-hidden">
                <div className="p-4 border-b border-theme bg-surface-soft">
                    <h3 className="font-bold text-[var(--text-color)]">User Management</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-muted text-sm border-b border-theme">
                                <th className="p-4">User</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Last Login</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme/60">
                            {users.map((user) => (
                                <tr key={user._id} className="hover:bg-surface-soft transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-white">
                                                <User size={14} />
                                            </div>
                                            <div>
                                                <div className="font-medium text-[var(--text-color)]">{user.username}</div>
                                                <div className="text-xs text-muted">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={user.role}
                                                onChange={(e) => roleMutation.mutate({ id: user._id, role: e.target.value })}
                                                disabled={roleMutation.isPending && roleMutation.variables?.id === user._id}
                                                className="border border-theme bg-surface-muted rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/60"
                                            >
                                                {roleOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {roleMutation.isPending && roleMutation.variables?.id === user._id && (
                                                <RefreshCw size={16} className="animate-spin text-neon-purple" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-muted">
                                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '—'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Are you sure?')) {
                                                    deleteMutation.mutate(user._id);
                                                }
                                            }}
                                            className="p-2 text-muted hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Admin;
