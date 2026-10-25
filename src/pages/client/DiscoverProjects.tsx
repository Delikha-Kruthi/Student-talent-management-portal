import React, { useState, useEffect } from 'react';
import { Project, Branch, User, ClientProfile } from '../../types/index.js';
import { api } from '../../services/api.js';
import { VideoPlayer } from '../../components/VideoPlayer.js';
import { Compass, Search, Filter, Video, CheckCircle, ExternalLink, ShieldCheck, ShoppingCart, Loader2 } from 'lucide-react';

interface DiscoverProjectsProps {
  user: User;
  profile: ClientProfile | null;
  onOpenProjectDetails: (project: Project) => void;
  onProjectPurchased: () => void;
}

export const DiscoverProjects: React.FC<DiscoverProjectsProps> = ({
  user,
  profile,
  onOpenProjectDetails,
  onProjectPurchased
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Purchase Modal
  const [purchasingProject, setPurchasingProject] = useState<Project | null>(null);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, [selectedBranch]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const [projRes, branchRes] = await Promise.all([
        api.getProjects({
          status: 'approved',
          branchId: selectedBranch || undefined
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

  const handleConfirmPurchase = async () => {
    if (!purchasingProject) return;

    setProcessingOrder(true);
    try {
      const res = await api.createPurchase({
        projectId: purchasingProject.id,
        clientId: user.id,
        clientName: user.name,
        clientOrganization: profile?.organization || 'Industrial Client'
      });

      if (res.success) {
        setPurchaseSuccess(`Project licensed successfully! Order Number: ${res.purchase.orderNumber}. Deliverables unlocked under Purchases tab.`);
        setTimeout(() => {
          setPurchasingProject(null);
          setPurchaseSuccess(null);
          onProjectPurchased();
        }, 2000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to complete project license order.');
    } finally {
      setProcessingOrder(false);
    }
  };

  const filtered = projects.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.shortDescription.toLowerCase().includes(q) ||
      p.techStack.some(t => t.toLowerCase().includes(q)) ||
      p.studentName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#00D4F5]" />
            Discover Approved Student Inventions
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse verified capstone deliverables ready for enterprise licensing, adoption, or pilot deployment.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search by tech or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Departments</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-[#00D4F5] animate-spin mb-2" />
          <p className="text-xs">Loading approved project catalog...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
          <p className="text-sm font-semibold text-slate-300">No approved projects found.</p>
          <p className="text-xs text-slate-500 mt-1">Try selecting another department or clearing the search filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((proj) => (
            <div
              key={proj.id}
              className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between transition-all group"
            >
              <div>
                {/* Demonstration Video Player */}
                {proj.videoUrl ? (
                  <div className="h-44 bg-slate-950 relative border-b border-slate-800">
                    <VideoPlayer src={proj.videoUrl} title={proj.title} />
                  </div>
                ) : (
                  <div className="h-32 bg-slate-950 flex items-center justify-center text-slate-600 border-b border-slate-800">
                    <span className="text-xs">No video demo</span>
                  </div>
                )}

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-950/70 px-2.5 py-0.5 rounded border border-cyan-800/40">
                      {proj.branchName}
                    </span>
                    <span className="text-xs font-black text-emerald-400">
                      ₹{proj.price ? proj.price.toLocaleString() : 'Open'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-[#00D4F5] transition-colors line-clamp-1">
                    {proj.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {proj.shortDescription || proj.problemStatement}
                  </p>

                  <div className="text-[11px] text-slate-400 pt-1">
                    Creator: <span className="text-slate-200 font-medium">{proj.studentName}</span>
                  </div>

                  {/* Tech stack */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {proj.techStack.slice(0, 4).map((tech, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800 font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenProjectDetails(proj)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  View Details
                </button>

                <button
                  onClick={() => setPurchasingProject(proj)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  License Deliverables
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Purchase Modal */}
      {purchasingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Acquire Intellectual Property License</h3>
              <p className="text-xs text-slate-400 mt-1">Alwar Polytechnic Capstone Deliverables Agreement</p>
            </div>

            {purchaseSuccess ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>{purchaseSuccess}</span>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl space-y-1.5 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Project</span>
                  <p className="text-sm font-bold text-white">{purchasingProject.title}</p>
                  <p className="text-[11px] text-slate-400">Created by {purchasingProject.studentName} ({purchasingProject.studentPin})</p>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Licensing Fee</span>
                  <span className="text-white font-bold">₹{purchasingProject.price.toLocaleString()} INR</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">License Terms</span>
                  <span className="text-cyan-300 font-semibold">{purchasingProject.licenseType} Non-Exclusive</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Client Organization</span>
                  <span className="text-slate-200">{profile?.organization || 'Industrial Client Partner'}</span>
                </div>

                <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                  Upon confirmation, a genuine institutional license certificate with unique key <code className="text-cyan-300">LIC-AP-2026-...</code> and source package download manifest will be issued to your account.
                </p>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setPurchasingProject(null)}
                    disabled={processingOrder}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPurchase}
                    disabled={processingOrder}
                    className="px-5 py-2 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] font-bold rounded-lg text-xs flex items-center gap-2 cursor-pointer"
                  >
                    {processingOrder && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Confirm & Unlock Deliverables
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
