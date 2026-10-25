import React, { useState, useEffect } from 'react';
import { User, FacultyProfile, Project, RubricEvaluation } from '../../types/index.js';
import { api } from '../../services/api.js';
import { RubricEvaluatorModal } from '../../components/RubricEvaluatorModal.js';
import { VideoPlayer } from '../../components/VideoPlayer.js';
import { CheckSquare, Search, Filter, Video, Award, CheckCircle, XCircle, AlertCircle, Clock, ExternalLink, Loader2 } from 'lucide-react';

interface ProjectReviewsProps {
  user: User;
  profile: FacultyProfile | null;
  onOpenProjectDetails: (project: Project) => void;
}

export const ProjectReviews: React.FC<ProjectReviewsProps> = ({
  user,
  profile,
  onOpenProjectDetails
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Active project for Rubric Evaluation
  const [evaluatingProject, setEvaluatingProject] = useState<Project | null>(null);
  const [existingEvaluation, setExistingEvaluation] = useState<RubricEvaluation | null>(null);
  const [fetchingEval, setFetchingEval] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [statusFilter]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await api.getProjects({
        branchId: profile?.branchId,
        status: statusFilter || undefined
      });
      if (res.projects) setProjects(res.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEvaluator = async (project: Project) => {
    setFetchingEval(true);
    setEvaluatingProject(project);

    try {
      const detailRes = await api.getProjectDetails(project.id);
      if (detailRes.evaluation) {
        setExistingEvaluation(detailRes.evaluation);
      } else {
        setExistingEvaluation(null);
      }
    } catch {
      setExistingEvaluation(null);
    } finally {
      setFetchingEval(false);
    }
  };

  const handleEvaluationSaved = (evaluation: RubricEvaluation) => {
    setEvaluatingProject(null);
    loadProjects();
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
      {/* Header */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#00D4F5]" />
            Capstone Project Reviews & Rubric Evaluator
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Grade submissions using the standardized Alwar Polytechnic weighted capstone rubric.
          </p>
        </div>

        {/* Filter controls */}
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Review Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="changes_requested">Changes Requested</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-[#00D4F5] animate-spin mb-2" />
          <p className="text-xs">Loading department submissions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
          <p className="text-sm font-semibold text-slate-300">No project submissions match current filter.</p>
          <p className="text-xs text-slate-500 mt-1">Check back when diploma students submit their capstone deliverables.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((proj) => (
            <div
              key={proj.id}
              className="p-6 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-2xl shadow-xl transition-all space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider ${
                      proj.status === 'approved'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : proj.status === 'under_review' || proj.status === 'submitted'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : proj.status === 'changes_requested'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {proj.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Student: <strong className="text-slate-200">{proj.studentName}</strong> ({proj.studentPin})
                    </span>
                    <span className="text-xs text-slate-500">• {proj.branchName}</span>
                  </div>

                  <h3 className="text-base font-bold text-white">{proj.title}</h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onOpenProjectDetails(proj)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    View Deliverables
                  </button>

                  <button
                    onClick={() => handleOpenEvaluator(proj)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    {proj.status === 'approved' ? 'Update Rubric Score' : 'Evaluate with Rubric'}
                  </button>
                </div>
              </div>

              {/* Description & Tech Stack */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="md:col-span-2 space-y-2">
                  <p className="text-slate-300 leading-relaxed">
                    <strong className="text-slate-400">Problem: </strong>{proj.problemStatement}
                  </p>
                  <p className="text-slate-300 leading-relaxed">
                    <strong className="text-slate-400">Proposed Solution: </strong>{proj.proposedSolution}
                  </p>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Technical Specifications
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {proj.techStack.map((tech, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded text-[10px] border border-slate-800">
                        {tech}
                      </span>
                    ))}
                  </div>
                  {proj.videoUrl && (
                    <div className="pt-1 flex items-center gap-1.5 text-cyan-400 text-xs font-mono">
                      <Video className="w-3.5 h-3.5" />
                      <span>{proj.videoFileName || 'Demo Video Uploaded'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rubric Evaluator Modal */}
      {evaluatingProject && (
        <RubricEvaluatorModal
          project={evaluatingProject}
          existingEvaluation={existingEvaluation}
          onClose={() => setEvaluatingProject(null)}
          onSaveSuccess={handleEvaluationSaved}
        />
      )}
    </div>
  );
};
