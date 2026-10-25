import React, { useState, useEffect } from 'react';
import { Project, RubricEvaluation, User } from '../../types/index.js';
import { api } from '../../services/api.js';
import { VideoPlayer } from '../../components/VideoPlayer.js';
import { X, Award, CheckCircle, Video, FileText, ShoppingCart, UserCheck, Calendar, Sparkles, ExternalLink, Loader2 } from 'lucide-react';

interface ProjectDetailsModalProps {
  project: Project;
  currentUser: User;
  onClose: () => void;
  onOpenRubricEvaluator?: (project: Project) => void;
  onPurchase?: (project: Project) => void;
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  project,
  currentUser,
  onClose,
  onOpenRubricEvaluator,
  onPurchase
}) => {
  const [evaluation, setEvaluation] = useState<RubricEvaluation | null>(null);
  const [loadingEval, setLoadingEval] = useState(true);

  // Optional AI Viva Preparation
  const [vivaQuestions, setVivaQuestions] = useState<{ q: string; hint: string }[]>([]);
  const [loadingViva, setLoadingViva] = useState(false);
  const [showViva, setShowViva] = useState(false);

  useEffect(() => {
    async function loadDetails() {
      try {
        const res = await api.getProjectDetails(project.id);
        if (res.evaluation) {
          setEvaluation(res.evaluation);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingEval(false);
      }
    }
    loadDetails();
  }, [project.id]);

  const handleGenerateViva = async () => {
    setShowViva(true);
    setLoadingViva(true);
    try {
      const res = await api.getVivaQuestions(project.title, project.techStack);
      if (res.questions) setVivaQuestions(res.questions);
    } catch {
      setVivaQuestions([
        { q: 'Explain your sensor communication protocol.', hint: 'Discuss baud rates and noise margins.' },
        { q: 'How did you validate safety under fault conditions?', hint: 'Watchdog timers and interrupt routines.' }
      ]);
    } finally {
      setLoadingViva(false);
    }
  };

  const isAuthor = currentUser.id === project.studentId;
  const isFaculty = currentUser.role === 'faculty';
  const isClient = currentUser.role === 'client';
  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/80">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                project.status === 'approved'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {project.status.replace('_', ' ')}
              </span>
              <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                {project.branchName}
              </span>
              <span className="text-xs text-slate-400">
                Student PIN: <strong className="text-slate-200">{project.studentPin}</strong> • {project.studentName}
              </span>
            </div>
            <h2 className="text-xl font-black text-white">{project.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* VIDEO PLAYER SECTION (Section 13: streaming with 206 Partial Content) */}
          {project.videoUrl ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Video className="w-4 h-4 text-[#00D4F5]" />
                  Demonstration Video Stream (Direct Upload)
                </span>
                <span className="text-[11px] font-mono text-cyan-400">
                  {project.videoFileName || 'demo.mp4'}
                </span>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
                <VideoPlayer src={project.videoUrl} title={project.title} />
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-xs text-slate-500">
              No direct demonstration video file uploaded for this project.
            </div>
          )}

          {/* Core Problem & Proposed Solution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Problem Statement
              </h4>
              <p className="text-slate-300">{project.problemStatement}</p>
            </div>

            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Proposed Solution & Engineering Architecture
              </h4>
              <p className="text-slate-300">{project.proposedSolution}</p>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
              Technology Stack & Hardware Interfacing
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {project.techStack.map((tech, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-slate-900 text-cyan-300 rounded-lg text-xs font-semibold border border-cyan-900/60"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* RUBRIC EVALUATION RESULTS (Section 14) */}
          {evaluation && (evaluation.publishedToStudent || isFaculty || isAdmin) && (
            <div className="p-5 bg-gradient-to-r from-slate-950 to-cyan-950/20 border border-cyan-500/30 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#00D4F5]" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Official Alwar Polytechnic Rubric Evaluation Score
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Evaluated by {evaluation.evaluatorName} on {new Date(evaluation.evaluatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-[#00D4F5]">{evaluation.totalScore}</span>
                  <span className="text-xs text-slate-400">/ 100</span>
                </div>
              </div>

              {/* 6 Criteria Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {evaluation.criterionScores.map((c, i) => (
                  <div key={i} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{c.criterionName}</span>
                      <span className="font-bold text-cyan-300">{c.score} / 10 ({c.weight}%)</span>
                    </div>
                    {c.comment && (
                      <p className="text-[11px] text-slate-400 italic">“{c.comment}”</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Overall Faculty Feedback */}
              {evaluation.overallFeedback && (
                <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs space-y-1">
                  <span className="font-semibold text-slate-300">Overall Faculty Comments:</span>
                  <p className="text-slate-300 leading-relaxed">{evaluation.overallFeedback}</p>
                </div>
              )}
            </div>
          )}

          {/* Optional AI Viva Prep Generator */}
          {(isAuthor || isFaculty) && (
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#00D4F5]" />
                    Viva Defense & Presentation Practice
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Generate critical questions likely to be asked by polytechnic external examiners.
                  </p>
                </div>
                <button
                  onClick={handleGenerateViva}
                  disabled={loadingViva}
                  className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {loadingViva ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Prepare Viva'}
                </button>
              </div>

              {showViva && vivaQuestions.length > 0 && (
                <div className="space-y-2 pt-2">
                  {vivaQuestions.map((vq, idx) => (
                    <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-1">
                      <p className="font-semibold text-white">Q{idx + 1}: {vq.q}</p>
                      <p className="text-[11px] text-cyan-400">Key concept: {vq.hint}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-xs">
            <span className="text-slate-400">Commercial Licensing: </span>
            <strong className="text-emerald-400 font-bold">
              ₹{project.price ? project.price.toLocaleString() : 'Open Access'}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            {isFaculty && onOpenRubricEvaluator && (
              <button
                onClick={() => {
                  onClose();
                  onOpenRubricEvaluator(project);
                }}
                className="px-4 py-2 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] font-bold text-xs rounded-xl cursor-pointer"
              >
                Grade with Rubric
              </button>
            )}

            {isClient && onPurchase && (
              <button
                onClick={() => {
                  onClose();
                  onPurchase(project);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                License Deliverable Package
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
