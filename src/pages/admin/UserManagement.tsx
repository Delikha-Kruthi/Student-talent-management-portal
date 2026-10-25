import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Users, Search, Filter, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, UserCheck, UserX, Loader2 } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminUsers();
      if (res.users) setUsers(res.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: 'active' | 'pending_approval' | 'suspended') => {
    setActionLoadingId(userId);
    try {
      const res = await api.updateUserStatus(userId, newStatus);
      if (res.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update user status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = users.filter(u => {
    const matchesRole = !roleFilter || u.role === roleFilter;
    const matchesStatus = !statusFilter || u.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = !search ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.pin && u.pin.toLowerCase().includes(q)) ||
      (u.employeeId && u.employeeId.toLowerCase().includes(q));

    return matchesRole && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00D4F5]" />
            Institutional User & Role Governance
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Authorize faculty member registrations, monitor student credentials, and manage account statuses.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search user, email, PIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-36 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty</option>
            <option value="client">Clients</option>
            <option value="admin">Administrators</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-36 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 text-[#00D4F5] animate-spin mb-2" />
            <p className="text-xs">Loading user registry...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-300">No users match query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">User Details</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Department / Identifier</th>
                  <th className="py-3 px-4 font-semibold">Registration Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filtered.map((u) => {
                  const isActionLoading = actionLoadingId === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{u.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : u.role === 'faculty'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : u.role === 'student'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            : 'bg-purple-950 text-purple-300 border border-purple-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.role === 'student' && (
                          <div>
                            <span className="font-mono text-cyan-400 font-bold block">{u.pin}</span>
                            <span className="text-[10px] text-slate-400">{u.branch}</span>
                          </div>
                        )}
                        {u.role === 'faculty' && (
                          <div>
                            <span className="font-mono text-emerald-400 font-bold block">{u.employeeId}</span>
                            <span className="text-[10px] text-slate-400">{u.branch}</span>
                          </div>
                        )}
                        {u.role === 'client' && (
                          <div>
                            <span className="text-slate-200 font-medium block">{u.organization}</span>
                            <span className="text-[10px] text-slate-400">{u.industry}</span>
                          </div>
                        )}
                        {u.role === 'admin' && (
                          <span className="text-[10px] text-slate-400">Institutional Governance</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          u.status === 'active'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                            : u.status === 'pending_approval'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800 animate-pulse'
                            : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                        }`}>
                          {u.status === 'pending_approval' ? 'Pending Approval' : u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.role !== 'admin' && (
                          <div className="flex items-center justify-end gap-1.5">
                            {u.status === 'pending_approval' && (
                              <button
                                onClick={() => handleUpdateStatus(u.id, 'active')}
                                disabled={isActionLoading}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs transition-colors cursor-pointer"
                              >
                                Approve Faculty
                              </button>
                            )}

                            {u.status === 'active' ? (
                              <button
                                onClick={() => handleUpdateStatus(u.id, 'suspended')}
                                disabled={isActionLoading}
                                className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded font-medium text-xs transition-colors cursor-pointer"
                              >
                                Suspend
                              </button>
                            ) : u.status === 'suspended' ? (
                              <button
                                onClick={() => handleUpdateStatus(u.id, 'active')}
                                disabled={isActionLoading}
                                className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded font-medium text-xs transition-colors cursor-pointer"
                              >
                                Reactivate
                              </button>
                            ) : null}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
