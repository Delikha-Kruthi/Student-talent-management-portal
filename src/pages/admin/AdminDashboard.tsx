import React, { useState, useEffect } from 'react';
import { User } from '../../types/index.js';
import { api } from '../../services/api.js';
import { ShieldCheck, Users, CheckSquare, AlertCircle, DollarSign, Building2, ArrowRight, Loader2 } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  onNavigate: (tabId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.getAdminStats();
        if (res.stats) setStats(res.stats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-[#0B192C] via-slate-900 to-[#071324] border border-cyan-500/20 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800/60 text-amber-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Alwar Polytechnic Directorate
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white">
            Chief Administrator Command Console
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Institutional governance, user approvals, department branch management, and security audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {stats?.pendingFacultyApprovals > 0 && (
            <button
              onClick={() => onNavigate('user-management')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-950 border border-amber-800 text-amber-300 text-xs font-bold rounded-xl animate-pulse cursor-pointer"
            >
              <span>{stats.pendingFacultyApprovals} Faculty Approval Needed</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-[#00D4F5] animate-spin mb-2" />
          <p className="text-xs">Loading institutional metrics...</p>
        </div>
      ) : (
        <>
          {/* Institutional Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              onClick={() => onNavigate('user-management')}
              className="p-5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
                <span>Total Users</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-3xl font-black text-white mt-2">{stats.totalUsers}</div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                <span>{stats.studentCount} Students</span> • <span>{stats.facultyCount} Faculty</span>
              </div>
            </div>

            <div
              onClick={() => onNavigate('project-moderation')}
              className="p-5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
                <span>Capstone Projects</span>
                <CheckSquare className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-emerald-400 mt-2">{stats.approvedProjects}</div>
              <div className="text-[11px] text-slate-400 mt-1">
                {stats.pendingProjectReviews} pending evaluation
              </div>
            </div>

            <div
              onClick={() => onNavigate('complaints')}
              className="p-5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
                <span>Active Grievances</span>
                <AlertCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-3xl font-black text-rose-400 mt-2">{stats.openComplaints}</div>
              <div className="text-[11px] text-slate-400 mt-1">
                Open tickets awaiting resolution
              </div>
            </div>

            <div
              onClick={() => onNavigate('transactions')}
              className="p-5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
                <span>Institutional Licensing</span>
                <DollarSign className="w-4 h-4 text-[#00D4F5]" />
              </div>
              <div className="text-3xl font-black text-white mt-2">
                ₹{stats.totalRevenue ? stats.totalRevenue.toLocaleString() : '0'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {stats.totalTransactions} commercial orders
              </div>
            </div>
          </div>

          {/* Institutional Fast-Action Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                User & Faculty Governance
              </h3>
              <p className="text-xs text-slate-400">
                Review faculty credentials, manage student accounts, and approve pending registrations.
              </p>
              <button
                onClick={() => onNavigate('user-management')}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Manage Users & Approvals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-400" />
                Departmental Branches
              </h3>
              <p className="text-xs text-slate-400">
                Configure institutional departments (Computer, Mechanical, Civil, Electrical, Automobile, etc.).
              </p>
              <button
                onClick={() => onNavigate('settings')}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Manage 8 Branches</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                Grievance Resolution
              </h3>
              <p className="text-xs text-slate-400">
                Investigate student and faculty grievances and mark resolved with an official note.
              </p>
              <button
                onClick={() => onNavigate('complaints')}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Resolve Grievances</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
