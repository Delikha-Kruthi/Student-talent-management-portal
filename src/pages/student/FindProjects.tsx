import React, { useState, useEffect } from 'react';
import { Project, Branch } from '../../types/index.js';
import { api } from '../../services/api.js';
import { VideoPlayer } from '../../components/VideoPlayer.js';
import { Search, Filter, Video, Eye, ExternalLink, Sparkles, Building2 } from 'lucide-react';

interface FindProjectsProps {
  onOpenProjectDetails: (project: Project) => void;
}

export const FindProjects: React.FC<FindProjectsProps> = ({ onOpenProjectDetails }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [projRes, branchRes] = await Promise.all([
          api.getProjects({ status: 'approved' }),
          api.getBranches()
        ]);
        if (projRes.projects) setProjects(projRes.projects);
        if (branchRes.branches) setBranches(branchRes.branches);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchesBranch = !selectedBranch || p.branchId === selectedBranch;
    const matchesQuery =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.techStack.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBranch && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00D4F5]" />
            Discover Approved Student Inventions
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse peer capstone projects approved by Alwar Polytechnic academic evaluators across all departments.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search technologies, skills, or titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Departments ({branches.length})</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
          <p className="text-sm font-semibold text-slate-300">No approved projects match your query.</p>
          <p className="text-xs text-slate-500 mt-1">Try clearing the branch filter or adjusting search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between transition-all group"
            >
              <div>
                {/* Video Preview */}
                {p.videoUrl ? (
                  <div className="h-44 bg-slate-950 relative border-b border-slate-800">
                    <VideoPlayer src={p.videoUrl} title={p.title} />
                  </div>
                ) : (
                  <div className="h-32 bg-slate-950 flex items-center justify-center text-slate-600 border-b border-slate-800">
                    <span className="text-xs">No video stream</span>
                  </div>
                )}

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-950/70 px-2.5 py-0.5 rounded border border-cyan-800/40">
                      {p.branchName}
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      ₹{p.price ? p.price.toLocaleString() : 'Open'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-[#00D4F5] transition-colors line-clamp-1">
                    {p.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {p.shortDescription || p.problemStatement}
                  </p>

                  <div className="text-[11px] text-slate-400 pt-1">
                    Creator: <span className="text-slate-200 font-medium">{p.studentName}</span>
                  </div>

                  {/* Tech stack */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {p.techStack.slice(0, 3).map((t, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => onOpenProjectDetails(p)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  View Details
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
