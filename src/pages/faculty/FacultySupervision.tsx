import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Briefcase,
  CalendarCheck,
  Send,
  Eye,
  Filter,
  AlertCircle
} from 'lucide-react';
import { User, FacultyProfile } from '../../types/index.js';
import { api } from '../../services/api.js';

interface FacultySupervisionProps {
  user: User;
  profile: FacultyProfile;
}

export const FacultySupervision: React.FC<FacultySupervisionProps> = ({ user, profile }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'warning' | 'critical' | 'normal'>('all');
  const [selectedStudentOrders, setSelectedStudentOrders] = useState<any | null>(null);
  const [counselingModal, setCounselingModal] = useState<any | null>(null);
  const [counselingMessage, setCounselingMessage] = useState('');
  const [sendingCounseling, setSendingCounseling] = useState(false);

  const loadSupervisionData = async () => {
    try {
      setLoading(true);
      const res = await api.getSupervisionStudents(profile?.branchId);
      if (res.success) {
        setStudents(res.students);
      }
    } catch (err) {
      console.error('Failed to load supervision data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupervisionData();
  }, [profile?.branchId]);

  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.pin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.branchName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true : s.workloadStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const criticalCount = students.filter(s => s.workloadStatus === 'critical').length;
  const warningCount = students.filter(s => s.workloadStatus === 'warning').length;
  const normalCount = students.filter(s => s.workloadStatus === 'normal').length;

  const handleSendCounseling = async () => {
    if (!counselingModal || !counselingMessage.trim()) return;
    try {
      setSendingCounseling(true);
      await api.sendMessage({
        senderId: user.id,
        senderName: profile?.name || user.name,
        senderRole: 'faculty',
        receiverId: counselingModal.studentId,
        receiverName: counselingModal.name,
        content: `[Academic Supervision Note]: ${counselingMessage.trim()}`
      });
      alert(`Counseling note sent to ${counselingModal.name} via portal message.`);
      setCounselingModal(null);
      setCounselingMessage('');
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSendingCounseling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              Faculty Workload Supervision & Academic Protection
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Student Workload & Commitment Oversight
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Monitor concurrent freelance assignments vs. academic coursework and laboratory attendance. Prevent burnout and ensure students fulfill BTER mandatory 75% attendance criteria.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 font-medium">
              Department: <strong className="text-cyan-400">{profile?.branchName || 'Computer Science & Engineering'}</strong>
            </span>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
            <p className="text-xs text-slate-400 font-medium">Total Supervised Students</p>
            <p className="text-xl font-black text-white mt-1">{students.length}</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
            <p className="text-xs text-slate-400 font-medium">Critical Risk Conflicts</p>
            <p className="text-xl font-black text-red-400 mt-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              {criticalCount}
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
            <p className="text-xs text-slate-400 font-medium">Workload Warnings</p>
            <p className="text-xl font-black text-amber-400 mt-1">{warningCount}</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
            <p className="text-xs text-slate-400 font-medium">Balanced / Healthy</p>
            <p className="text-xl font-black text-emerald-400 mt-1 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              {normalCount}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/40 border border-slate-800 p-4 rounded-2xl">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search students by name, PIN, or department..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="all">All Workload States ({students.length})</option>
            <option value="critical">Critical Conflicts ({criticalCount})</option>
            <option value="warning">Workload Warnings ({warningCount})</option>
            <option value="normal">Healthy Status ({normalCount})</option>
          </select>
        </div>
      </div>

      {/* Student Workload Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading student workload data...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-400">
          No students match the current filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStudents.map(student => {
            const isCritical = student.workloadStatus === 'critical';
            const isWarning = student.workloadStatus === 'warning';
            const isHealthy = student.workloadStatus === 'normal';

            return (
              <div
                key={student.studentId}
                className={`bg-slate-900/70 border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                  isCritical
                    ? 'border-red-800/80 shadow-lg shadow-red-950/20'
                    : isWarning
                    ? 'border-amber-800/60 shadow-lg shadow-amber-950/20'
                    : 'border-slate-800'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">{student.pin}</span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isCritical
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {student.workloadStatus}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{student.name}</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    {student.branchName} • Sem {student.semester}
                  </p>

                  {/* Metrics */}
                  <div className="space-y-2.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 mb-4 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <CalendarCheck className="w-3.5 h-3.5" />
                        Attendance Rate:
                      </span>
                      <span
                        className={`font-black ${
                          student.attendancePercentage < 75 ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {student.attendancePercentage}%
                        {student.attendancePercentage < 75 && ' (< 75% Rule)'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" />
                        Active Freelance Orders:
                      </span>
                      <span className="font-bold text-white">{student.activeOrdersCount} Gigs</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Active Capstone Projects:
                      </span>
                      <span className="font-bold text-white">{student.activeProjectsCount} Project</span>
                    </div>
                  </div>

                  {/* Warning Alerts */}
                  {student.warningReasons?.length > 0 && (
                    <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-2.5 mb-4 text-[11px] text-red-300 space-y-1">
                      <span className="font-bold block">Advisory Warnings:</span>
                      {student.warningReasons.map((warn: string, widx: number) => (
                        <p key={widx} className="flex items-center gap-1">
                          • {warn}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedStudentOrders(student)}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Review Orders ({student.activeOrdersCount})
                  </button>

                  <button
                    onClick={() => {
                      setCounselingModal(student);
                      setCounselingMessage(
                        `Regarding your current academic load: Your attendance is currently at ${student.attendancePercentage}%. Please ensure your ${student.activeOrdersCount} ongoing freelance assignments do not compromise your lab attendance or upcoming end-semester examinations.`
                      );
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3 h-3 text-cyan-400" />
                    Counsel
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Orders Detail Modal */}
      {selectedStudentOrders && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B192C] border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1">
              Active Freelance Orders: {selectedStudentOrders.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              PIN: {selectedStudentOrders.pin} • Department: {selectedStudentOrders.branchName}
            </p>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedStudentOrders.activeOrdersList?.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No active freelance orders currently recorded.</p>
              ) : (
                selectedStudentOrders.activeOrdersList?.map((o: any) => (
                  <div key={o.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-white">{o.title}</span>
                      <span className="text-cyan-400 font-mono">{o.orderNumber}</span>
                    </div>
                    <p className="text-slate-400">Client: {o.clientName}</p>
                    <div className="flex justify-between text-[11px] pt-1 text-slate-500">
                      <span>Status: <strong className="text-amber-400 capitalize">{o.status}</strong></span>
                      <span>Target Delivery: <strong className="text-white">{o.deadline}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-5 border-t border-slate-800 mt-4">
              <button
                onClick={() => setSelectedStudentOrders(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Counseling Message Modal */}
      {counselingModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B192C] border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1">
              Send Academic Guidance Note
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Recipient: <strong className="text-white">{counselingModal.name}</strong> ({counselingModal.pin})
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Guidance Message *</label>
                <textarea
                  rows={4}
                  value={counselingMessage}
                  onChange={e => setCounselingMessage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setCounselingModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={sendingCounseling || !counselingMessage.trim()}
                  onClick={handleSendCounseling}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-[#0B192C] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sendingCounseling ? 'Sending...' : 'Send Guidance Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
