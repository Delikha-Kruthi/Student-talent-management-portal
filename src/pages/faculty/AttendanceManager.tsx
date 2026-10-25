import React, { useState, useEffect } from 'react';
import { User, FacultyProfile, Branch, AttendanceRecord } from '../../types/index.js';
import { api } from '../../services/api.js';
import { CalendarCheck, Save, CheckCircle, XCircle, Clock, AlertTriangle, Filter, Search, Loader2 } from 'lucide-react';

interface AttendanceManagerProps {
  user: User;
  profile: FacultyProfile | null;
}

export const AttendanceManager: React.FC<AttendanceManagerProps> = ({ user, profile }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState(profile?.branchId || 'branch-cse');
  const [selectedSemester, setSelectedSemester] = useState('5');
  const [selectedBatch, setSelectedBatch] = useState('2023-2026 Batch A');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [students, setStudents] = useState<any[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Status mapping for today's session: { [studentId]: 'present' | 'absent' | 'late' }
  const [sessionStatuses, setSessionStatuses] = useState<{ [studentId: string]: 'present' | 'absent' | 'late' }>({});
  const [remarks, setRemarks] = useState<{ [studentId: string]: string }>({});

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    loadStudentsAndAttendance();
  }, [selectedBranch, selectedSemester, selectedBatch, selectedDate]);

  const loadBranches = async () => {
    try {
      const res = await api.getBranches();
      if (res.branches) setBranches(res.branches);
    } catch (err) {
      console.error(err);
    }
  };

  const loadStudentsAndAttendance = async () => {
    setLoading(true);
    setSuccessMsg(null);
    try {
      const [studRes, attRes] = await Promise.all([
        api.getStudents({
          branchId: selectedBranch,
          semester: Number(selectedSemester),
          batch: selectedBatch
        }),
        api.getAttendance({
          branchId: selectedBranch,
          semester: Number(selectedSemester),
          batch: selectedBatch
        })
      ]);

      const studentList = studRes.students || [];
      const attendanceList = attRes.records || [];

      setStudents(studentList);
      setRecords(attendanceList);

      // Populate current session statuses from date records if already entered
      const currentMap: { [studentId: string]: 'present' | 'absent' | 'late' } = {};
      const remarksMap: { [studentId: string]: string } = {};

      studentList.forEach(s => {
        const found = attendanceList.find(a => a.date === selectedDate && a.studentId === s.userId);
        if (found) {
          currentMap[s.userId] = found.status;
          if (found.remarks) remarksMap[s.userId] = found.remarks;
        } else {
          // Default to present for quick roll call
          currentMap[s.userId] = 'present';
        }
      });

      setSessionStatuses(currentMap);
      setRemarks(remarksMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setSessionStatuses(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setSuccessMsg(null);

    const payloadRecords = students.map(s => ({
      studentId: s.userId,
      studentPin: s.pin,
      studentName: s.name,
      status: sessionStatuses[s.userId] || 'present',
      remarks: remarks[s.userId] || undefined
    }));

    try {
      const res = await api.saveAttendance({
        branchId: selectedBranch,
        semester: Number(selectedSemester),
        batch: selectedBatch,
        date: selectedDate,
        records: payloadRecords,
        facultyId: user.id
      });

      if (res.success) {
        setSuccessMsg(`Attendance saved for ${payloadRecords.length} students on ${selectedDate}!`);
        // Refresh records to recalculate percentages
        const attRes = await api.getAttendance({
          branchId: selectedBranch,
          semester: Number(selectedSemester),
          batch: selectedBatch
        });
        if (attRes.records) setRecords(attRes.records);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#00D4F5]" />
            Department Attendance & Lecture Tracking
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Record daily biometric/roll-call lecture attendance. Students below 75% are flagged for academic caution.
          </p>
        </div>

        <button
          onClick={handleSaveAttendance}
          disabled={saving || loading || students.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Attendance Sheet
        </button>
      </div>

      {/* Control / Selection Filters */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Department
          </label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Semester
          </label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            {[1, 2, 3, 4, 5, 6].map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Class / Batch
          </label>
          <input
            type="text"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Roster Sheet */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 text-[#00D4F5] animate-spin mb-2" />
            <p className="text-xs">Loading batch attendance roster...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <p className="text-sm font-semibold text-slate-300">No students found in this batch.</p>
            <p className="text-xs text-slate-500">Verify branch or batch name, or add students from the &apos;My Students&apos; tab.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">PIN</th>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Cumulative Attendance</th>
                  <th className="py-3 px-4 font-semibold text-center">Status for {selectedDate}</th>
                  <th className="py-3 px-4 font-semibold">Remarks (Optional)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {students.map((st) => {
                  const studentHist = records.filter(r => r.studentId === st.userId);
                  const totalLectures = studentHist.length;
                  const presentLectures = studentHist.filter(r => r.status === 'present').length;
                  const lateLectures = studentHist.filter(r => r.status === 'late').length;
                  const pct = totalLectures > 0
                    ? Math.round(((presentLectures + (lateLectures * 0.5)) / totalLectures) * 100)
                    : 100;

                  const isLow = pct < 75;
                  const currentStatus = sessionStatuses[st.userId] || 'present';

                  return (
                    <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                        {st.pin}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {st.name}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isLow ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {pct}%
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ({presentLectures}/{totalLectures})
                          </span>
                          {isLow && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              &lt;75%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(st.userId, 'present')}
                            className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                              currentStatus === 'present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(st.userId, 'late')}
                            className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                              currentStatus === 'late'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Late
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(st.userId, 'absent')}
                            className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                              currentStatus === 'absent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="e.g. Lab duty / Medical note"
                          value={remarks[st.userId] || ''}
                          onChange={(e) => setRemarks({ ...remarks, [st.userId]: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
