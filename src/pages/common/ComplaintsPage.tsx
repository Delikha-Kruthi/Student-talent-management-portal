import React, { useState, useEffect } from 'react';
import { Complaint, User } from '../../types/index.js';
import { api } from '../../services/api.js';
import { AlertCircle, Plus, CheckCircle, Clock, ShieldCheck, X, Loader2 } from 'lucide-react';

interface ComplaintsPageProps {
  user: User;
}

export const ComplaintsPage: React.FC<ComplaintsPageProps> = ({ user }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // New Complaint Modal
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [category, setCategory] = useState<'academic' | 'facility' | 'evaluation' | 'harassment' | 'technical' | 'other'>('academic');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [submitting, setSubmitting] = useState(false);

  // Resolve Modal (Admin)
  const [resolvingComplaint, setResolvingComplaint] = useState<Complaint | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.getComplaints(user.id, user.role);
      if (res.complaints) setComplaints(res.complaints);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.submitComplaint({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        userEmail: user.email,
        category,
        subject: subject.trim(),
        description: description.trim(),
        priority
      });

      if (res.success) {
        setSubject('');
        setDescription('');
        setIsNewOpen(false);
        loadComplaints();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit grievance.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmResolve = async () => {
    if (!resolvingComplaint) return;
    setResolveError(null);
    setResolving(true);

    try {
      const res = await api.resolveComplaint(
        resolvingComplaint.id,
        resolutionNote.trim(),
        user.name
      );

      if (res.success) {
        setResolvingComplaint(null);
        setResolutionNote('');
        loadComplaints();
      }
    } catch (err: any) {
      setResolveError(err.message || 'Failed to resolve grievance.');
    } finally {
      setResolving(false);
    }
  };

  const canResolve = user.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#00D4F5]" />
            Grievance Redressal & Support Tickets
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Section 17: Log institutional queries, facility repair requests, or academic evaluation inquiries.
          </p>
        </div>

        <button
          onClick={() => setIsNewOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Log Grievance Ticket
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-[#00D4F5] animate-spin mb-2" />
          <p className="text-xs">Loading grievance records...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
          <p className="text-sm font-semibold text-slate-300">No grievances logged.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => (
            <div
              key={c.id}
              className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      {c.ticketNumber}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      c.status === 'resolved'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {c.status.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400 capitalize bg-slate-950 px-2 py-0.5 rounded">
                      Category: {c.category}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{c.subject}</h3>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-300 block font-medium">
                    Logged by {c.userName} ({c.userRole})
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{c.description}</p>

              {/* Resolution Box if resolved */}
              {c.status === 'resolved' && (
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl space-y-1 text-xs">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Official Resolution Note
                  </span>
                  <p className="text-emerald-200 text-[11px] leading-relaxed">{c.resolutionNote}</p>
                  <span className="text-[10px] text-emerald-400/80 block pt-1">
                    Resolved by {c.resolvedBy} on {c.resolvedAt ? new Date(c.resolvedAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              )}

              {/* Action: Mark Resolved (Admin) */}
              {canResolve && c.status !== 'resolved' && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setResolvingComplaint(c);
                      setResolutionNote('');
                      setResolveError(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Mark Resolved
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Log Grievance Modal */}
      {isNewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Log Grievance / Support Ticket</h3>
              <button onClick={() => setIsNewOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateComplaint} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="academic">Academic & Curriculum</option>
                    <option value="facility">Laboratory & Facility</option>
                    <option value="evaluation">Rubric & Grade Inquiry</option>
                    <option value="technical">Technical Portal Issue</option>
                    <option value="other">General Grievance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Oscilloscope Channel 2 calibration in IoT Lab"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Detailed Description *</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide precise details to help administrative and technical authorities resolve your grievance..."
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] font-bold rounded-lg text-xs flex items-center gap-2 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Grievance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Resolved Modal (Section 17 requirement) */}
      {resolvingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Resolve Grievance: {resolvingComplaint.ticketNumber}</h3>
              <button onClick={() => setResolvingComplaint(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {resolveError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl">
                {resolveError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Subject: <strong className="text-white">{resolvingComplaint.subject}</strong>
              </p>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Resolution Note (Will be visible to user)
                </label>
                <textarea
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Explain actions taken by administrative or technical staff..."
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setResolvingComplaint(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolve}
                disabled={resolving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-2 cursor-pointer"
              >
                {resolving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
