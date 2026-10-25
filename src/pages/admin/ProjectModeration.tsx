import React, { useState, useEffect } from 'react';
import { Project, Branch } from '../../types/index.js';
import { api } from '../../services/api.js';
import { CheckSquare, Search, Filter, CheckCircle, XCircle, AlertCircle, Video, Loader2, ExternalLink } from 'lucide-react';

interface ProjectModerationProps {
  onOpenProjectDetails: (project: Project) => void;
}

export const ProjectModeration: React.FC<ProjectModerationProps> = ({ onOpenProjectDetails }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, [statusFilter, branchFilter]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const [projRes, branchRes] = await Promise.all([
        api.getProjects({
          status: statusFilter || undefined,
          branchId: branchFilter || undefined
        }),
        api.getBranches()
      ]);
      if (projRes.projects) setProjects(projRes.projects);
      if (branchRes.branches) setBranches(branchRes.branches);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (projectId: string, newStatus: 'approved' | 'rejected') => {
    try {
      await api.updateProject(projectId, { status: newStatus });
      setProjects(projects.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
    } catch (err: any) {
      alert(err.message || 'Failed to update project status.');
    }
  };

  const filtered = projects.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.studentName.toLowerCase().includes(q) ||
      p.studentPin.toLowerCase().includes(q) ||
      p.techStack.some(t => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#00D4F5]" />
            Institutional Project Moderation
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Supervise all capstone submissions, check ethical guidelines, and publish projects to the public talent discovery showcase.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search title, student, PIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Departments</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-36 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-[#00D4F5] animate-spin mb-2" />
          <p className="text-xs">Loading projects for moderation...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
          <p className="text-sm font-semibold text-slate-300">No projects found matching current filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1 truncate">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    p.status === 'approved'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : p.status === 'submitted' || p.status === 'under_review'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}>
                    {p.status}
                  </span>
                  <span className="text-xs font-semibold text-cyan-400">{p.branchName}</span>
                  <span className="text-xs text-slate-400">
                    By {p.studentName} ({p.studentPin})
                  </span>
                  {p.videoUrl && (
                    <span className="text-[11px] text-cyan-300 font-mono bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60 inline-flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      Video Stream Ready
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white truncate">{p.title}</h3>
                <p className="text-xs text-slate-400 truncate">{p.shortDescription || p.problemStatement}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onOpenProjectDetails(p)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Inspect
                </button>

                {p.status !== 'approved' && (
                  <button
                    onClick={() => handleUpdateStatus(p.id, 'approved')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Authorize
                  </button>
                )}

                {p.status !== 'rejected' && (
                  <button
                    onClick={() => handleUpdateStatus(p.id, 'rejected')}
                    className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
