import React, { useState, useEffect } from 'react';
import { ClientIdea, User, StudentProfile } from '../../types/index.js';
import { api } from '../../services/api.js';
import { Briefcase, Building2, CheckCircle, Clock, Send, Sparkles } from 'lucide-react';

interface MyApplicationsProps {
  user: User;
  profile: StudentProfile | null;
}

export const MyApplications: React.FC<MyApplicationsProps> = ({ user, profile }) => {
  const [ideas, setIdeas] = useState<ClientIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [proposalMsg, setProposalMsg] = useState('');
  const [activeApplyingId, setActiveApplyingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadIdeas() {
      try {
        const res = await api.getClientIdeas();
        if (res.ideas) {
          setIdeas(res.ideas);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadIdeas();
  }, []);

  const handleApply = async (idea: ClientIdea) => {
    if (!proposalMsg.trim()) return;

    try {
      // Send a project proposal message to the client
      await api.sendMessage({
        senderId: user.id,
        senderName: `${user.name} (${profile?.pin || 'Student'})`,
        senderRole: 'student',
        receiverId: idea.clientId,
        receiverName: idea.clientName,
        content: `Application for Industry Idea "${idea.title}": ${proposalMsg.trim()}`
      });

      setAppliedIds([...appliedIds, idea.id]);
      setActiveApplyingId(null);
      setProposalMsg('');
      alert('Application proposal sent successfully to client!');
    } catch (err: any) {
      alert(err.message || 'Failed to submit application.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-[#00D4F5]" />
          Industry Project Requests & Sponsorships
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Explore real-world challenges submitted by enterprise partners in the Client Idea Studio. Submit team proposals to be matched for sponsored capstones.
        </p>
      </div>

      {ideas.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
          <p className="text-sm font-semibold text-slate-300">No industry project requests available right now.</p>
          <p className="text-xs text-slate-500 mt-1">Check back soon as industrial partners submit new challenges.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ideas.map((idea) => {
            const hasApplied = appliedIds.includes(idea.id);
            return (
              <div
                key={idea.id}
                className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <span className="text-[11px] font-semibold text-purple-400 bg-purple-950/70 px-2 py-0.5 rounded border border-purple-800/40">
                      {idea.organization}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">{idea.title}</h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-emerald-400 block">
                      Budget: {idea.estimatedBudget || '₹30,000 - ₹50,000'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Target: {idea.targetBranch || 'Open Engineering'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{idea.description}</p>

                {/* AI Structured Match Suggestions */}
                {idea.aiAnalysis && (
                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      Suggested Technical Capabilities
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {idea.aiAnalysis.suggestedTechStack?.map((t, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-900 text-cyan-300 px-2 py-0.5 rounded border border-cyan-900/40">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Application Section */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Posted on {new Date(idea.createdAt).toLocaleDateString()}
                  </span>

                  {hasApplied ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-xs font-semibold rounded-lg">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Application Submitted
                    </span>
                  ) : activeApplyingId === idea.id ? (
                    <div className="w-full max-w-md space-y-2">
                      <textarea
                        rows={2}
                        value={proposalMsg}
                        onChange={(e) => setProposalMsg(e.target.value)}
                        placeholder="State your team's approach, relevant coursework, and estimated timeline..."
                        className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setActiveApplyingId(null)}
                          className="px-3 py-1 bg-slate-800 text-slate-300 rounded text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleApply(idea)}
                          className="px-3 py-1 bg-[#00D4F5] text-[#0B192C] font-bold rounded text-xs flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          Send Proposal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveApplyingId(idea.id)}
                      className="px-4 py-2 bg-cyan-950 hover:bg-[#00D4F5] text-cyan-300 hover:text-[#0B192C] border border-cyan-800/60 font-bold text-xs rounded-lg transition-all cursor-pointer"
                    >
                      Apply with Team Proposal
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
