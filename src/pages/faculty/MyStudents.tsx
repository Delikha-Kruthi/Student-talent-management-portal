import React, { useState, useEffect } from 'react';
import { User, FacultyProfile, Branch } from '../../types/index.js';
import { api } from '../../services/api.js';
import { Users, UserPlus, Search, Filter, AlertCircle, CheckCircle2, IdCard, Mail, GraduationCap, X, Loader2 } from 'lucide-react';

interface MyStudentsProps {
  user: User;
  profile: FacultyProfile | null;
}

export const MyStudents: React.FC<MyStudentsProps> = ({ user, profile }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(profile?.branchId || '');
  const [selectedSemester, setSelectedSemester] = useState('');

  // Add Student Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [newBranchId, setNewBranchId] = useState(profile?.branchId || 'branch-cse');
  const [semester, setSemester] = useState('5');
  const [batch, setBatch] = useState('2023-2026 Batch A');
  const [cgpa, setCgpa] = useState('');

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Student Details Drawer
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedBranch, selectedSemester, search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studRes, branchRes] = await Promise.all([
        api.getStudents({
          branchId: selectedBranch || undefined,
          semester: selectedSemester ? Number(selectedSemester) : undefined,
          search: search || undefined
        }),
        api.getBranches()
      ]);

      if (studRes.students) setStudents(studRes.students);
      if (branchRes.branches) {
        setBranches(branchRes.branches);
        if (!selectedBranch && branchRes.branches.length > 0) {
          setSelectedBranch(profile?.branchId || branchRes.branches[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!name.trim() || !pin.trim()) {
      setFormError('Student full name and Student PIN/ID are required.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.addStudent({
        name: name.trim(),
        pin: pin.trim().toUpperCase(),
        email: email.trim() || undefined,
        branchId: newBranchId,
        semester: Number(semester),
        batch: batch.trim(),
        cgpa: cgpa ? Number(cgpa) : undefined
      });

      if (res.success) {
        setFormSuccess(`Student ${name} (${pin.toUpperCase()}) successfully registered!`);
        setName('');
        setPin('');
        setEmail('');
        setCgpa('');
        // Refresh list
        loadData();
        setTimeout(() => {
          setIsAddModalOpen(false);
          setFormSuccess(null);
        }, 1200);
      }
    } catch (err: any) {
      // Duplicate PIN or validation error
      setFormError(err.message || 'Failed to add student record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Student Button */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00D4F5]" />
            Department Students Registry
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage enrolled diploma scholars, capstone progression, and academic attendance.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setFormSuccess(null);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Add Student Record
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by student name, PIN, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="w-full sm:w-56 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          className="w-full sm:w-36 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Semesters</option>
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>
      </div>

      {/* Students Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 text-[#00D4F5] animate-spin mb-2" />
            <p className="text-xs">Loading institutional student records...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <p className="text-sm font-semibold text-slate-300">No students found matching current filters.</p>
            <p className="text-xs text-slate-500">Click &apos;Add Student Record&apos; to register a new diploma candidate.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 font-semibold">Student PIN / ID</th>
                  <th className="py-3.5 px-4 font-semibold">Student Name</th>
                  <th className="py-3.5 px-4 font-semibold">Department & Semester</th>
                  <th className="py-3.5 px-4 font-semibold">Batch</th>
                  <th className="py-3.5 px-4 font-semibold">Projects</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      {st.pin}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      <div>{st.name}</div>
                      <div className="text-[10px] text-slate-500">{st.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{st.branchName}</div>
                      <div className="text-[10px] text-slate-400">Semester {st.semester}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-medium">
                      {st.batch}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-200">
                        {st.projectCount} <span className="text-[10px] text-emerald-400">({st.approvedProjects} approved)</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                        Enrolled
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedStudent(st)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded font-medium text-xs transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal (with Duplicate PIN rejection check) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-950 text-[#00D4F5]">
                  <UserPlus className="w-5 h-5" />
                </span>
                <h3 className="text-base font-bold text-white">Add New Student Record</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Student Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Student PIN / ID * (Unique)
                  </label>
                  <input
                    type="text"
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="AP-2024-CS-055"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white uppercase focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Duplicate PINs are rejected</span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Semester *</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Department / Branch *</label>
                <select
                  value={newBranchId}
                  onChange={(e) => setNewBranchId(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Class / Batch</label>
                  <input
                    type="text"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    placeholder="2024-2027 Batch A"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="leave blank for auto-generation"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
                  Save Student to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Details Drawer */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{selectedStudent.name}</h3>
                <span className="text-xs font-mono text-cyan-400 font-bold">{selectedStudent.pin}</span>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Department</span>
                <span className="text-slate-200 font-medium">{selectedStudent.branchName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Semester & Batch</span>
                <span className="text-slate-200 font-medium">Sem {selectedStudent.semester} • {selectedStudent.batch}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Email</span>
                <span className="text-slate-200 font-mono">{selectedStudent.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Total Projects</span>
                <span className="text-slate-200 font-semibold">{selectedStudent.projectCount} ({selectedStudent.approvedProjects} approved)</span>
              </div>
              {selectedStudent.skills && selectedStudent.skills.length > 0 && (
                <div className="pt-2">
                  <span className="text-slate-400 block mb-1">Declared Skills:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedStudent.skills.map((sk: any, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-950 text-cyan-300 rounded text-[10px] border border-slate-800">
                        {sk.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
