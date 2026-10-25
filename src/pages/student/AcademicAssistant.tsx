import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Calendar,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  Award,
  Clock,
  Save,
  RefreshCw,
  HelpCircle,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Brain,
  MessageSquare
} from 'lucide-react';
import { User, StudentProfile, StudyPlan, AcademicPerformanceInsight, DayStudySchedule } from '../../types/index.js';
import { api } from '../../services/api.js';

interface AcademicAssistantProps {
  user: User;
  profile: StudentProfile;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AcademicAssistant: React.FC<AcademicAssistantProps> = ({ user, profile }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'performance' | 'study_plan'>('chat');

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      text: `Hello ${profile?.name || user.name}! I am your official Alwar Polytechnic College AI Academic Mentor.\n\nI can assist you with:\n• Diploma engineering theory & numerical problem solving\n• Lab practical setup & circuit/code debugging\n• Capstone viva preparation & technical defense\n• Improving project evaluation scores based on faculty rubrics\n\nHow can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Performance Insights State
  const [insights, setInsights] = useState<AcademicPerformanceInsight | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Study Plan State
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [examTargetDate, setExamTargetDate] = useState('2026-11-20');
  const [weakTopicsInput, setWeakTopicsInput] = useState('');
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  // Load Performance Insights and Saved Study Plan
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingInsights(true);
        const [insightsRes, planRes] = await Promise.all([
          api.getAcademicInsights(user.id),
          api.getStudyPlan(user.id)
        ]);
        if (insightsRes.success) {
          setInsights(insightsRes.insights);
          if (insightsRes.insights.weakSubjects?.length > 0) {
            setWeakTopicsInput(insightsRes.insights.weakSubjects.map(s => s.subject).join(', '));
          }
        }
        if (planRes.success && planRes.plan) {
          setStudyPlan(planRes.plan);
          if (planRes.plan.examTargetDate) setExamTargetDate(planRes.plan.examTargetDate);
        }
      } catch (err) {
        console.error('Failed to load academic data:', err);
      } finally {
        setLoadingInsights(false);
      }
    };

    fetchData();
  }, [user.id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || sending) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setSending(true);

    try {
      const history = messages.slice(-4).map(m => ({ role: m.role, text: m.text }));
      const res = await api.sendAcademicChat({
        message: textToSend.trim(),
        conversationHistory: history,
        studentContext: {
          branchName: profile?.branchName || 'Engineering',
          semester: profile?.semester || 5,
          pin: profile?.pin || 'AP-2023-CS-042'
        }
      });

      if (res.success && res.reply) {
        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          text: res.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: 'I encountered an error connecting to the AI mentor. Please try your question again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleGenerateStudyPlan = async () => {
    try {
      setGeneratingPlan(true);
      setSaveSuccessMessage('');
      const weakTopics = weakTopicsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const res = await api.generateStudyPlan({
        studentId: user.id,
        branchName: profile?.branchName || 'Computer Science & Engineering',
        semester: profile?.semester || 5,
        weakTopics: weakTopics.length > 0 ? weakTopics : ['Design & Analysis of Algorithms', 'Theory of Computation'],
        examTargetDate
      });

      if (res.success && res.plan) {
        setStudyPlan(res.plan);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate study timetable');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleSaveStudyPlan = async () => {
    if (!studyPlan) return;
    try {
      setSavingPlan(true);
      const res = await api.saveStudyPlan(studyPlan);
      if (res.success) {
        setSaveSuccessMessage('Study plan saved to your academic profile successfully!');
        setTimeout(() => setSaveSuccessMessage(''), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save study plan');
    } finally {
      setSavingPlan(false);
    }
  };

  const quickPrompts = [
    'Help me prepare for my external capstone viva defense',
    'How do I structure my project report according to BTER guidelines?',
    'Explain the differences between MQTT and HTTP protocols',
    'Generate 3 practice questions for our upcoming midterm exam'
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
              <Brain className="w-3.5 h-3.5" />
              AI Academic & Engineering Mentor
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Academic Support & Study Optimization
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Personalized diploma coursework guidance, attendance tracking, Board of Technical Education (BTER) exam readiness, and AI-generated study timetables.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 font-medium">
              Branch: <strong className="text-white">{profile?.branchName || 'Engineering'}</strong>
            </span>
            <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 font-medium">
              Semester: <strong className="text-cyan-400">{profile?.semester || 5}th</strong>
            </span>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex gap-2 mt-6 pt-5 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-cyan-500 text-[#0B192C] shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            AI Academic Mentor
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'performance'
                ? 'bg-cyan-500 text-[#0B192C] shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Academic Performance & Attendance
            {insights?.attendanceWarning && (
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('study_plan')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'study_plan'
                ? 'bg-cyan-500 text-[#0B192C] shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            7-Day Study Timetable
          </button>
        </div>
      </div>

      {/* VIEW 1: AI ACADEMIC MENTOR CHAT */}
      {activeTab === 'chat' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col h-[650px] overflow-hidden shadow-xl">
          {/* Quick prompt suggestions */}
          <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-slate-500 font-semibold shrink-0">Quick Queries:</span>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                className="px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 hover:text-cyan-400 text-slate-300 transition-colors whitespace-nowrap cursor-pointer shrink-0"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chat message stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      isUser
                        ? 'bg-cyan-500 text-[#0B192C]'
                        : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    }`}
                  >
                    {isUser ? 'You' : <Sparkles className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-cyan-500/20 border border-cyan-500/30 text-white rounded-tr-none'
                        : 'bg-slate-800/80 border border-slate-700/80 text-slate-200 rounded-tl-none shadow-md'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
                    <span className="block text-[10px] text-slate-500 text-right mt-1.5">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}
            {sending && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-2xl rounded-tl-none text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  Generating educational guidance from syllabus...
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input box */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask your academic mentor about syllabus concepts, viva preparation, or lab code..."
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={sending || !inputMessage.trim()}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-[#0B192C] font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Ask Mentor
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 2: PERFORMANCE INSIGHTS & ATTENDANCE WARNING */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {loadingInsights ? (
            <div className="text-center py-12 text-slate-400">Loading academic analytics...</div>
          ) : !insights ? (
            <div className="text-center py-12 text-slate-400">Unable to retrieve student metrics.</div>
          ) : (
            <>
              {/* Critical Attendance Banner */}
              {insights.attendanceWarning ? (
                <div className="bg-red-950/40 border border-red-800/60 rounded-2xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-red-200">
                      BTER Mandatory Attendance Warning: {insights.attendancePercentage}% Recorded
                    </h3>
                    <p className="text-xs text-red-300/80 mt-1 leading-relaxed">
                      Board of Technical Education regulations require a minimum of <strong>75% attendance</strong> to be eligible for the end-semester examinations. Your current attendance is below the threshold. Prioritize lecture and lab attendance immediately.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-200">
                    <strong>Healthy Attendance Record:</strong> Current attendance is at <strong>{insights.attendancePercentage}%</strong> (exceeds the 75% BTER mandatory exam eligibility threshold).
                  </p>
                </div>
              )}

              {/* Stats overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Overall Standing</p>
                  <p className="text-lg font-black text-white mt-1">{insights.overallStanding}</p>
                  <p className="text-[11px] text-slate-500 mt-2">Calculated from internal tests and attendance</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Weak Subject Focus Areas</p>
                  <p className="text-lg font-black text-amber-400 mt-1">{insights.weakSubjects?.length || 0} Identified</p>
                  <p className="text-[11px] text-slate-500 mt-2">Subjects requiring targeted revision</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Strong Competency Areas</p>
                  <p className="text-lg font-black text-emerald-400 mt-1">{insights.strongSubjects?.length || 0} Core Subjects</p>
                  <p className="text-[11px] text-slate-500 mt-2">Scoring &gt; 75% average</p>
                </div>
              </div>

              {/* Weak Subjects Remediation Cards */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-amber-400" />
                  Subject Weaknesses & Faculty Improvement Advice
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.weakSubjects?.map((weak, idx) => (
                    <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-white text-sm">{weak.subject}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300">
                          {weak.score}% Avg
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">
                        <strong className="text-slate-300">Diagnosis:</strong> {weak.reason}
                      </p>
                      <button
                        onClick={() => {
                          setActiveTab('chat');
                          handleSendMessage(`I need an explanation and practice problems for my weak subject: ${weak.subject}`);
                        }}
                        className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                      >
                        Ask AI Mentor for practice problems <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Deadlines */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  Upcoming Academic & Project Deadlines
                </h3>
                <div className="space-y-2.5">
                  {insights.upcomingDeadlines?.map((d, idx) => (
                    <div key={idx} className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-white text-sm">{d.title}</span>
                        <span className="text-xs text-slate-400 block mt-0.5">Type: {d.type}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-cyan-400">{d.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* VIEW 3: 7-DAY PERSONALIZED STUDY TIMETABLE */}
      {activeTab === 'study_plan' && (
        <div className="space-y-6">
          {/* Controls Box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              Generate Your 7-Day Study Timetable
            </h3>
            <p className="text-xs text-slate-400 mb-5 max-w-2xl">
              Our AI balances your diploma curriculum revision, laboratory practical manuals, and freelance project tasks so you maintain high grades while earning.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Examination Date</label>
                <input
                  type="date"
                  value={examTargetDate}
                  onChange={e => setExamTargetDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Focus Topics / Weak Subjects</label>
                <input
                  type="text"
                  placeholder="e.g. Thermodynamics, Algorithms, Microcontroller viva"
                  value={weakTopicsInput}
                  onChange={e => setWeakTopicsInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleGenerateStudyPlan}
                disabled={generatingPlan}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-[#0B192C] font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                {generatingPlan ? 'Generating Schedule with Gemini...' : 'Generate 7-Day Timetable'}
              </button>

              {studyPlan && (
                <button
                  onClick={handleSaveStudyPlan}
                  disabled={savingPlan}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center gap-2 cursor-pointer border border-slate-700"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  {savingPlan ? 'Saving...' : 'Save to My Profile'}
                </button>
              )}

              {saveSuccessMessage && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {saveSuccessMessage}
                </span>
              )}
            </div>
          </div>

          {/* Timetable Display */}
          {studyPlan && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-800">
                <div>
                  <h4 className="font-black text-white text-lg">Active 7-Day Timetable</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Total: <strong className="text-cyan-400">{studyPlan.totalWeeklyHours} Hours/Week</strong> • Target Exam: {studyPlan.examTargetDate}
                  </p>
                </div>
                {studyPlan.generatedByAi && (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI-Optimized
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {studyPlan.weeklySchedule.map((dayPlan, i) => (
                  <div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-black text-white text-sm">{dayPlan.day}</span>
                        <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md">
                          {dayPlan.hours} hrs
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-indigo-300 mb-2">{dayPlan.focusSubject}</p>

                      <ul className="space-y-1.5 text-xs text-slate-400">
                        {dayPlan.tasks.map((task, tidx) => (
                          <li key={tidx} className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
