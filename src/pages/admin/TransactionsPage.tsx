import React, { useState, useEffect } from 'react';
import { Purchase } from '../../types/index.js';
import { api } from '../../services/api.js';
import { DollarSign, Search, ShieldCheck, Download, Loader2 } from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.getPurchases();
      if (res.purchases) setPurchases(res.purchases);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = purchases.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.orderNumber.toLowerCase().includes(q) ||
      p.projectTitle.toLowerCase().includes(q) ||
      p.clientName.toLowerCase().includes(q) ||
      p.clientOrganization.toLowerCase().includes(q) ||
      p.licenseKey.toLowerCase().includes(q)
    );
  });

  const totalRev = purchases.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#00D4F5]" />
            Commercial Licensing Transactions Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Section 18: Track institutional licensing payments, orders, and generated intellectual property keys.
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 block font-medium">Cumulative Royalties & Value</span>
          <span className="text-2xl font-black text-emerald-400">₹{totalRev.toLocaleString()} INR</span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search order, project, license key..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <span className="text-xs text-slate-400">{filtered.length} total transaction(s)</span>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 text-[#00D4F5] animate-spin mb-2" />
            <p className="text-xs">Loading transaction ledger...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-300">No transactions recorded.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Order #</th>
                  <th className="py-3 px-4 font-semibold">Project Title</th>
                  <th className="py-3 px-4 font-semibold">Student Inventor</th>
                  <th className="py-3 px-4 font-semibold">Client Licensee</th>
                  <th className="py-3 px-4 font-semibold">License Key</th>
                  <th className="py-3 px-4 font-semibold">Value</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filtered.map((pur) => (
                  <tr key={pur.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      {pur.orderNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {pur.projectTitle}
                    </td>
                    <td className="py-3 px-4">
                      <div>{pur.studentName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{pur.studentPin}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{pur.clientName}</div>
                      <div className="text-[10px] text-slate-400">{pur.clientOrganization}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-300 text-[11px]">
                      {pur.licenseKey}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-400">
                      ₹{pur.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {pur.status}
                      </span>
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
