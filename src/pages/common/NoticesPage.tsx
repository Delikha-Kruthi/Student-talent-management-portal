import React, { useState, useEffect } from 'react';
import { Notice, User } from '../../types/index.js';
import { api } from '../../services/api.js';
import { Bell, Plus, Trash2, AlertTriangle, CheckCircle, ShieldCheck, X, Loader2 } from 'lucide-react';

interface NoticesPageProps {
  user: User;
}

export const NoticesPage: React.FC<NoticesPageProps> = ({ user }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Notice Modal (Admin / Faculty)
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'urgent' | 'high' | 'normal'>('normal');
  const [targetRole, setTargetRole] = useState<'all' | 'student' | 'faculty' | 'client'>('all');
  const [saving, setSaving] = useState(false);

  // Deletion confirmation state
  const [deletingNotice, setDeletingNotice] = useState<Notice | null>(null);

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    setLoading(true);
    try {
      const res = await api.getNotices(user.role);
      if (res.notices) setNotices(res.notices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      const res = await api.createNotice({
        title: title.trim(),
        content: content.trim(),
        priority,
        targetRoles: [targetRole],
        authorName: user.name,
        authorRole: user.role === 'admin' ? 'Administrator' : 'Faculty',
        createdBy: user.id
      });

      if (res.success) {
        setTitle('');
        setContent('');
        setIsAddOpen(false);
        loadNotices();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to publish notice.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingNotice) return;
    try {
      const res = await api.deleteNotice(deletingNotice.id);
      if (res.success) {
        setNotices(notices.filter(n => n.id !== deletingNotice.id));
        setDeletingNotice(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete notice.');
    }
  };

  const canCreateNotice = user.role === 'admin' || user.role === 'faculty';
  const canDeleteNotice = user.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#00D4F5]" />
            Official Institutional Circulars & Notices
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Section 17: Academic Council circulars, project expo schedules, and department notices.
          </p>
        </div>

        {canCreateNotice && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Publish Circular
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-[#00D4F5] animate-spin mb-2" />
          <p className="text-xs">Loading notices...</p>
        </div>
      ) : notices.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
          <p className="text-sm font-semibold text-slate-300">No active circulars at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((n) => (
            <div
              key={n.id}
              className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      n.priority === 'urgent'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : n.priority === 'high'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    }`}>
                      {n.priority}
                    </span>
                    <span className="text-xs text-slate-400">
                      Target: {n.targetRoles.join(', ')}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{n.title}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block font-medium">
                      By {n.authorName} ({n.authorRole})
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {new Date(n.publishedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {canDeleteNotice && (
                    <button
                      onClick={() => setDeletingNotice(n)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Delete Notice (Admin Only)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{n.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Notice Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Publish Institutional Circular</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Schedule for Capstone Demonstration Videos"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Audience</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as any)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="student">Students Only</option>
                    <option value="faculty">Faculty Only</option>
                    <option value="client">Clients Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notice Details *</label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter official circular content, deadlines, and instructions..."
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] font-bold rounded-lg text-xs flex items-center gap-2 cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Section 17 requirement) */}
      {deletingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-800/80 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Confirm Notice Deletion</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete the circular &quot;<strong className="text-white">{deletingNotice.title}</strong>&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingNotice(null)}
                className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs"
              >
                Delete Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
