import React, { useState, useEffect } from 'react';
import { User, StudentProfile, Project, Notice, Complaint, Message, AttendanceRecord } from '../../types/index.js';
import { api } from '../../services/api.js';
import { Briefcase, CheckCircle2, Clock, AlertTriangle, ArrowRight, Video, Sparkles, BookOpen, MessageSquare, Plus } from 'lucide-react';

interface StudentDashboardProps {
  user: User;
  profile: StudentProfile | null;
  onNavigate: (tabId: string) => void;
  onOpenProjectDetails: (project: Project) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  profile,
  onNavigate,
  onOpenProjectDetails
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [projRes, notRes, compRes, msgRes, attRes] = await Promise.all([
          api.getProjects({ studentId: user.id }),
          api.getNotices('student'),
          api.getComplaints(user.id, 'student'),
          api.getMessages(user.id),
          api.getAttendance({ studentId: user.id })
        ]);

        if (projRes.projects) setProjects(projRes.projects);
        if (notRes.notices) setNotices(notRes.notices);
        if (compRes.complaints) setComplaints(compRes.complaints);
        if (msgRes.messages) setMessages(msgRes.messages);
        if (attRes.records) setAttendance(attRes.records);
      } catch (err) {
        console.error('Error loading student dashboard records:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user.id]);

  // Calculate actual portfolio completion %
  let profileScore = 20; // registered user
  if (profile?.bio && profile.bio.length > 10) profileScore += 20;
  if (profile?.skills && profile.skills.length > 0) profileScore += 20;
  if (projects.length > 0) profileScore += 20;
  if (projects.some(p => p.videoUrl)) profileScore += 20;

  // Actual attendance %
  const totalClasses = attendance.length;
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const lateCount = attendance.filter(a => a.status === 'late').length;
  const attendancePct = totalClasses > 0
    ? Math.round(((presentCount + (lateCount * 0.5)) / totalClasses) * 100)
    : 100;

  const approvedProjects = projects.filter(p => p.status === 'approved');
  const pendingProjects = projects.filter(p => p.status === 'submitted' || p.status === 'under_review');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 bg-gradient-to-r from-[#0B192C] via-slate-900 to-[#071324] border border-cyan-500/20 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#00D4F5]" />
            Alwar Polytechnic • {profile?.branchName || 'Engineering Branch'}
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white">
            Welcome back, {user.name}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Student PIN: <span className="text-cyan-300 font-mono font-bold">{profile?.pin || 'AP-2024'}</span> • Semester {profile?.semester || 5} • {profile?.batch || '2023-2026 Batch A'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('portfolio')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Capstone Project
          </button>
        </div>
      </div>

      {/* KPI Cards (True Database Metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Portfolio Completion</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-white">{profileScore}%</span>
            <span className="text-[11px] text-cyan-400">
              {profileScore === 100 ? 'Complete' : 'In Progress'}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-[#00D4F5] h-1.5 rounded-full" style={{ width: `${profileScore}%` }} />
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Approved Projects</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-400">{approvedProjects.length}</span>
            <span className="text-[11px] text-slate-400">of {projects.length} total</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">Faculty verified</span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Under Review</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-amber-400">{pendingProjects.length}</span>
            <span className="text-[11px] text-slate-400">pending</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">Awaiting rubric score</span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Class Attendance</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold ${attendancePct >= 75 ? 'text-white' : 'text-rose-400'}`}>
              {attendancePct}%
            </span>
            {attendancePct < 75 && (
              <span className="text-[10px] text-rose-400 font-semibold">Low</span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">
            {totalClasses > 0 ? `${presentCount}/${totalClasses} lectures recorded` : 'No attendance recorded'}
          </span>
        </div>
      </div>

      {/* Main Grid: Projects & Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Projects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              My Projects & Demonstration Streams
            </h3>
            <button
              onClick={() => onNavigate('portfolio')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
            >
              View All ({projects.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="p-8 bg-slate-900/40 border border-slate-800 border-dashed rounded-2xl text-center space-y-3">
              <BookOpen className="w-10 h-10 mx-auto text-slate-600" />
              <h4 className="text-sm font-semibold text-slate-300">No Projects Submitted Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Start your Alwar Polytechnic capstone portfolio by submitting your engineering project and demonstration video.
              </p>
              <button
                onClick={() => onNavigate('portfolio')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Create First Project
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => onOpenProjectDetails(proj)}
                  className="p-4 bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          proj.status === 'approved'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                            : proj.status === 'under_review' || proj.status === 'submitted'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {proj.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {proj.branchName}
                        </span>
                        {proj.videoUrl && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40 font-mono">
                            <Video className="w-3 h-3" />
                            Video Attached
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-[#00D4F5] transition-colors">
                        {proj.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {proj.shortDescription || proj.problemStatement}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-white block">
                        ₹{proj.price ? proj.price.toLocaleString() : 'Open'}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1">
                        {proj.licenseType}
                      </span>
                    </div>
                  </div>

                  {/* Tech stack badges */}
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-800/60">
                    {proj.techStack.slice(0, 4).map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-slate-950 text-slate-300 rounded text-[10px] font-medium border border-slate-800"
                      >
                        {tech}
                      </span>
                    ))}
                    {proj.techStack.length > 4 && (
                      <span className="text-[10px] text-slate-500 self-center">
                        +{proj.techStack.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Notices & Grievance Tracking */}
        <div className="space-y-6">
          {/* Recent Circulars */}
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Institutional Circulars
              </h3>
              <button
                onClick={() => onNavigate('notices')}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                All Notices
              </button>
            </div>

            {notices.length === 0 ? (
              <p className="text-xs text-slate-500">No active circulars at this time.</p>
            ) : (
              <div className="space-y-3">
                {notices.slice(0, 3).map((n) => (
                  <div key={n.id} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        n.priority === 'urgent'
                          ? 'bg-rose-950 text-rose-300'
                          : 'bg-cyan-950 text-cyan-300'
                      }`}>
                        {n.priority}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(n.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h5 className="text-xs font-semibold text-slate-200 line-clamp-1">{n.title}</h5>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{n.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grievances */}
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                My Grievances & Queries
              </h3>
              <button
                onClick={() => onNavigate('complaints')}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                Log Ticket
              </button>
            </div>

            {complaints.length === 0 ? (
              <p className="text-xs text-slate-500">No open grievances logged.</p>
            ) : (
              <div className="space-y-2">
                {complaints.slice(0, 2).map((c) => (
                  <div key={c.id} className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-cyan-400">{c.ticketNumber}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        c.status === 'resolved'
                          ? 'bg-emerald-950 text-emerald-300'
                          : 'bg-amber-950 text-amber-300'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="font-medium text-slate-200 truncate">{c.subject}</p>
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
