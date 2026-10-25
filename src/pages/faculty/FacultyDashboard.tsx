import React, { useState, useEffect } from 'react';
import { User, FacultyProfile, Project, Notice, AttendanceRecord } from '../../types/index.js';
import { api } from '../../services/api.js';
import { Users, CheckSquare, CalendarCheck, AlertTriangle, ArrowRight, BookOpen, Clock, ShieldCheck, Sparkles } from 'lucide-react';

interface FacultyDashboardProps {
  user: User;
  profile: FacultyProfile | null;
  onNavigate: (tabId: string) => void;
  onOpenProjectDetails: (project: Project) => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  user,
  profile,
  onNavigate,
  onOpenProjectDetails
}) => {
  const [students, setStudents] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [studRes, projRes, notRes, attRes] = await Promise.all([
          api.getStudents({ branchId: profile?.branchId }),
          api.getProjects({ branchId: profile?.branchId }),
          api.getNotices('faculty'),
          api.getAttendance({ branchId: profile?.branchId })
        ]);

        if (studRes.students) setStudents(studRes.students);
        if (projRes.projects) setProjects(projRes.projects);
        if (notRes.notices) setNotices(notRes.notices);
        if (attRes.records) setAttendance(attRes.records);
      } catch (err) {
        console.error('Error loading faculty dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [profile?.branchId]);

  const pendingReviews = projects.filter(p => p.status === 'submitted' || p.status === 'under_review');
  const approvedProjects = projects.filter(p => p.status === 'approved');

  // Low attendance warning count
  const studentsWithLowAtt = students.filter(s => {
    const studentRecords = attendance.filter(a => a.studentId === s.userId);
    if (studentRecords.length === 0) return false;
    const present = studentRecords.filter(a => a.status === 'present').length;
    return (present / studentRecords.length) < 0.75;
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 bg-gradient-to-r from-[#0B192C] via-slate-900 to-[#071324] border border-cyan-500/20 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Alwar Polytechnic • Academic Faculty Coordinator
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white">
            Welcome, {user.name}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Employee ID: <span className="text-cyan-300 font-mono font-bold">{profile?.employeeId || 'AP-FAC-108'}</span> • {profile?.branchName || 'Computer Science & Engineering'} • {profile?.designation || 'Lecturer'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('project-reviews')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <CheckSquare className="w-4 h-4" />
            Review Submissions ({pendingReviews.length})
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Assigned Students</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-white">{students.length}</span>
            <span className="text-[11px] text-cyan-400">Enrolled</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">
            Across {profile?.assignedBatches?.length || 1} batch(es)
          </span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Pending Project Reviews</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-amber-400">{pendingReviews.length}</span>
            <span className="text-[11px] text-slate-400">awaiting</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">Rubric grading needed</span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Approved Capstones</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-400">{approvedProjects.length}</span>
            <span className="text-[11px] text-slate-400">completed</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">Passed rubric assessment</span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Attendance Alert (&lt;75%)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold ${studentsWithLowAtt.length > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
              {studentsWithLowAtt.length}
            </span>
            <span className="text-[11px] text-slate-400">students</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">Below academic cutoff</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pending Reviews Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-cyan-400" />
              Pending Project Reviews Queue
            </h3>
            <button
              onClick={() => onNavigate('project-reviews')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
            >
              Open Rubric Evaluator
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingReviews.length === 0 ? (
            <div className="p-8 bg-slate-900/40 border border-slate-800 border-dashed rounded-2xl text-center">
              <p className="text-sm font-semibold text-slate-300">No projects currently awaiting review.</p>
              <p className="text-xs text-slate-500 mt-1">All submitted capstones in your department are graded.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReviews.map((proj) => (
                <div
                  key={proj.id}
                  className="p-4 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl transition-all flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 truncate">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950 text-amber-300 border border-amber-800">
                        {proj.status}
                      </span>
                      <span className="text-xs text-slate-400">
                        PIN: {proj.studentPin} • {proj.studentName}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white truncate">{proj.title}</h4>
                    <p className="text-xs text-slate-400 truncate">{proj.problemStatement}</p>
                  </div>

                  <button
                    onClick={() => onOpenProjectDetails(proj)}
                    className="px-3.5 py-1.5 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] font-bold text-xs rounded-lg transition-all shrink-0 cursor-pointer"
                  >
                    Grade Rubric
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Quick Attendance and Notices */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Faculty Workflows
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => onNavigate('my-students')}
                className="w-full p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left flex items-center justify-between text-xs font-medium text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>My Students & Add Student</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                onClick={() => onNavigate('attendance')}
                className="w-full p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left flex items-center justify-between text-xs font-medium text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarCheck className="w-4 h-4 text-emerald-400" />
                  <span>Mark Batch Attendance</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Institutional Circulars */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Faculty Notices
            </h3>
            {notices.length === 0 ? (
              <p className="text-xs text-slate-500">No circulars posted.</p>
            ) : (
              <div className="space-y-2">
                {notices.slice(0, 2).map((n) => (
                  <div key={n.id} className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs space-y-1">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase">{n.priority}</span>
                    <p className="font-semibold text-slate-200 line-clamp-1">{n.title}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{n.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
