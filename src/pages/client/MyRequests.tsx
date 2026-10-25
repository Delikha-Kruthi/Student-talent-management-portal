import React, { useState, useEffect } from 'react';
import { ClientIdea, User, ClientProfile } from '../../types/index.js';
import { api } from '../../services/api.js';
import { FileText, Plus, Clock, CheckCircle2, Sparkles, Building, Loader2, ExternalLink } from 'lucide-react';

interface MyRequestsProps {
  user: User;
  profile: ClientProfile | null;
  onNavigateToStudio: () => void;
}

export const MyRequests: React.FC<MyRequestsProps> = ({ user, profile, onNavigateToStudio }) => {
  const [ideas, setIdeas] = useState<ClientIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState<ClientIdea | null>(null);

  useEffect(() => {
    loadRequests();
  }, [user.id]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.getClientIdeas(user.id);
      if (res.ideas) setIdeas(res.ideas);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#00D4F5]" />
            My Project Ideas & Problem Statements
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track status, student applications, and AI architectural breakdowns for your submitted requests.
          </p>
        </div>

        <button
          onClick={onNavigateToStudio}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Describe New Idea
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-[#00D4F5] animate-spin mb-2" />
          <p className="text-xs">Loading submitted requests...</p>
        </div>
      ) : ideas.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
          <p className="text-sm font-semibold text-slate-300">You haven&apos;t submitted any project requests yet.</p>
          <p className="text-xs text-slate-500">Submit an engineering idea in Idea Studio to connect with student teams.</p>
          <button
            onClick={onNavigateToStudio}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-lg"
          >
            Open Idea Studio
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="p-6 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-2xl shadow-xl space-y-3 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      idea.status === 'submitted'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        : idea.status === 'in_progress'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {idea.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      Target: {idea.targetBranch || 'Any Department'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{idea.title}</h3>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400 block">
                    {idea.estimatedBudget || '₹40,000 - ₹60,000'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Submitted: {new Date(idea.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{idea.description}</p>

              {/* AI Analysis Preview if available */}
              {idea.aiAnalysis && (
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                  <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Advisory Scope
                  </span>
                  <p className="text-slate-300 text-[11px]">{idea.aiAnalysis.summary}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
