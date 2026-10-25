import React, { useState, useEffect } from 'react';
import { User, ClientProfile, ClientIdea, Purchase, Project } from '../../types/index.js';
import { api } from '../../services/api.js';
import { Lightbulb, ShoppingBag, Compass, ArrowRight, FileText, CheckCircle2, Building, Sparkles } from 'lucide-react';

interface ClientDashboardProps {
  user: User;
  profile: ClientProfile | null;
  onNavigate: (tabId: string) => void;
  onOpenProjectDetails: (project: Project) => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  user,
  profile,
  onNavigate,
  onOpenProjectDetails
}) => {
  const [ideas, setIdeas] = useState<ClientIdea[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [ideaRes, purRes, projRes] = await Promise.all([
          api.getClientIdeas(user.id),
          api.getPurchases(user.id),
          api.getProjects({ status: 'approved' })
        ]);

        if (ideaRes.ideas) setIdeas(ideaRes.ideas);
        if (purRes.purchases) setPurchases(purRes.purchases);
        if (projRes.projects) setFeaturedProjects(projRes.projects.slice(0, 3));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user.id]);

  const activeIdeas = ideas.filter(i => i.status !== 'draft');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 bg-gradient-to-r from-[#0B192C] via-slate-900 to-[#071324] border border-cyan-500/20 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-800/60 text-purple-300 text-xs font-semibold mb-2">
            <Building className="w-3.5 h-3.5" />
            {profile?.organization || 'Industrial Client Partner'}
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white">
            Welcome, {user.name}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Alwar Polytechnic Industry Collaboration & Capstone Licensing Hub
          </p>
        </div>

        <button
          onClick={() => onNavigate('idea-studio')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
        >
          <Lightbulb className="w-4 h-4" />
          Describe an Idea
        </button>
      </div>

      {/* KPI Cards (Section 9: Simple, Real Records) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Active Project Requests</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-white">{activeIdeas.length}</span>
            <span className="text-xs text-slate-500">submitted</span>
          </div>
          <span className="text-[11px] text-cyan-400 block mt-2">Under student matching</span>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Acquired Project Licenses</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-emerald-400">{purchases.length}</span>
            <span className="text-xs text-slate-500">licensed</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">Authorized deliverables unlocked</span>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Idea Drafts in Progress</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-amber-400">
              {ideas.filter(i => i.status === 'draft').length}
            </span>
            <span className="text-xs text-slate-500">drafts</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">Saved in Idea Studio</span>
        </div>
      </div>

      {/* Recent Requests & Featured Capstone Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Ideas */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              My Recent Project Requests
            </h3>
            <button
              onClick={() => onNavigate('my-requests')}
              className="text-xs font-semibold text-cyan-400 hover:underline inline-flex items-center gap-1"
            >
              View All ({ideas.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {ideas.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
              <p className="text-xs text-slate-400">You haven&apos;t submitted any project requirements yet.</p>
              <button
                onClick={() => onNavigate('idea-studio')}
                className="px-3.5 py-1.5 bg-[#00D4F5] text-[#0B192C] font-bold text-xs rounded-lg cursor-pointer"
              >
                Describe an Idea
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {ideas.slice(0, 3).map((idea) => (
                <div key={idea.id} className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                      {idea.status}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(idea.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-1">{idea.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{idea.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Featured Approved Projects */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              Approved Inventions for Licensing
            </h3>
            <button
              onClick={() => onNavigate('discover-projects')}
              className="text-xs font-semibold text-cyan-400 hover:underline inline-flex items-center gap-1"
            >
              Explore Catalog
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {featuredProjects.length === 0 ? (
            <p className="text-xs text-slate-500">No approved projects listed currently.</p>
          ) : (
            <div className="space-y-3">
              {featuredProjects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onOpenProjectDetails(p)}
                  className="p-3.5 bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors"
                >
                  <div className="truncate space-y-0.5">
                    <span className="text-[10px] font-semibold text-cyan-400">{p.branchName}</span>
                    <h4 className="text-xs font-bold text-white truncate">{p.title}</h4>
                    <span className="text-[10px] text-slate-400">By {p.studentName} ({p.studentPin})</span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-emerald-400 block">
                      ₹{p.price ? p.price.toLocaleString() : 'Open'}
                    </span>
                    <span className="text-[10px] text-cyan-300 font-semibold">Inspect</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
