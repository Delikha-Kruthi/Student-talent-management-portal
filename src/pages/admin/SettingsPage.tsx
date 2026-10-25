import React, { useState, useEffect } from 'react';
import { Branch } from '../../types/index.js';
import { api } from '../../services/api.js';
import { Sliders, Building2, Plus, Edit2, CheckCircle, XCircle, AlertCircle, Save, X, Loader2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // New Branch Modal
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [headOfDepartment, setHeadOfDepartment] = useState('');
  const [semesterCount, setSemesterCount] = useState('6');

  // Edit Branch
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const res = await api.getBranches();
      if (res.branches) setBranches(res.branches);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!code.trim() || !name.trim()) {
      setErrorMsg('Branch code and name are required.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.createBranch({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim(),
        headOfDepartment: headOfDepartment.trim() || 'To be appointed',
        semesterCount: Number(semesterCount) || 6
      });

      if (res.success) {
        setSuccessMsg(`Department '${res.branch.name}' successfully added!`);
        setCode('');
        setName('');
        setDescription('');
        setHeadOfDepartment('');
        loadBranches();
        setTimeout(() => {
          setIsAddBranchOpen(false);
          setSuccessMsg(null);
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create branch.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBranch = async () => {
    if (!editingBranch) return;
    setSaving(true);
    try {
      const res = await api.updateBranch(editingBranch.id, editingBranch);
      if (res.success) {
        setEditingBranch(null);
        loadBranches();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update branch.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (branch: Branch) => {
    try {
      await api.updateBranch(branch.id, { active: !branch.active });
      loadBranches();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle branch state.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#00D4F5]" />
            Department & Branch Management (All Institutional Disciplines)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Section 19: The portal serves all configured institutional departments. Add, edit, activate, or reassign department heads.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setSuccessMsg(null);
            setIsAddBranchOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Engineering Branch
        </button>
      </div>

      {/* Branches Grid */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-[#00D4F5] animate-spin mb-2" />
          <p className="text-xs">Loading department configuration...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {branches.map((b) => (
            <div
              key={b.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                b.active
                  ? 'bg-slate-900 border-slate-800 hover:border-cyan-500/40'
                  : 'bg-slate-950/60 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800/60">
                    {b.code}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    b.active
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}>
                    {b.active ? 'Active Discipline' : 'Deactivated'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{b.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{b.description}</p>
                <div className="text-[11px] text-slate-300 pt-1">
                  Head of Dept: <strong className="text-cyan-300">{b.headOfDepartment}</strong> • {b.semesterCount} Semesters
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => handleToggleActive(b)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    b.active
                      ? 'text-slate-400 hover:text-rose-400 border-slate-800 hover:border-rose-800'
                      : 'text-emerald-400 border-emerald-800/60 hover:bg-emerald-950'
                  }`}
                >
                  {b.active ? 'Deactivate' : 'Activate'}
                </button>

                <button
                  type="button"
                  onClick={() => setEditingBranch(b)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Branch
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Branch Modal */}
      {isAddBranchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add Institutional Department</h3>
              <button onClick={() => setIsAddBranchOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateBranch} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Branch Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. ME, CE, ECE"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white uppercase focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Semesters</label>
                  <input
                    type="number"
                    value={semesterCount}
                    onChange={(e) => setSemesterCount(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mechanical Engineering"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Head of Department (HOD)</label>
                <input
                  type="text"
                  value={headOfDepartment}
                  onChange={(e) => setHeadOfDepartment(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Curricular Scope & Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Focus areas, labs, and diploma specialization..."
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddBranchOpen(false)}
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
                  Save Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Branch Modal */}
      {editingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Edit Branch: {editingBranch.name}</h3>
              <button onClick={() => setEditingBranch(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Department Name</label>
                <input
                  type="text"
                  value={editingBranch.name}
                  onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Head of Department (HOD)</label>
                <input
                  type="text"
                  value={editingBranch.headOfDepartment}
                  onChange={(e) => setEditingBranch({ ...editingBranch, headOfDepartment: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingBranch.description}
                  onChange={(e) => setEditingBranch({ ...editingBranch, description: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingBranch(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateBranch}
                disabled={saving}
                className="px-5 py-2 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] font-bold rounded-lg text-xs flex items-center gap-2 cursor-pointer"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
