import React, { useState, useEffect } from 'react';
import { AuditLog } from '../../types/index.js';
import { api } from '../../services/api.js';
import { ScrollText, Search, ShieldCheck, Loader2 } from 'lucide-react';

export const SecurityLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminLogs();
      if (res.logs) setLogs(res.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.userEmail.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      l.resource.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-[#00D4F5]" />
            Security & Authentication Audit Logs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Section 26: Real-time institutional event logging for logins, student registrations, evaluations, and licenses.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search action, user, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 text-[#00D4F5] animate-spin mb-2" />
            <p className="text-xs">Loading audit ledger...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-300">No logs found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Actor / User</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Resource</th>
                  <th className="py-3 px-4 font-semibold">Audit Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300 font-mono text-[11px]">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="text-white font-semibold">{log.userEmail}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{log.userRole}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-cyan-400">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-purple-300">
                      {log.resource}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
