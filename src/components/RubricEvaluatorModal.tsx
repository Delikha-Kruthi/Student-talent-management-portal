import React, { useState, useEffect } from 'react';
import { Project, RubricTemplate, RubricEvaluation } from '../types/index.js';
import { api } from '../services/api.js';
import { Award, CheckCircle, XCircle, AlertCircle, Sparkles, Loader2, Save, X } from 'lucide-react';

interface RubricEvaluatorModalProps {
  project: Project;
  existingEvaluation?: RubricEvaluation | null;
  onClose: () => void;
  onSaveSuccess: (evalRecord: RubricEvaluation) => void;
}

export const RubricEvaluatorModal: React.FC<RubricEvaluatorModalProps> = ({
  project,
  existingEvaluation,
  onClose,
  onSaveSuccess
}) => {
  const [template, setTemplate] = useState<RubricTemplate | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);

  // Scores array: { criterionId, criterionName, weight, score, comment }
  const [criterionScores, setCriterionScores] = useState<
    { criterionId: string; criterionName: string; weight: number; score: number; comment: string }[]
  >([]);

  const [overallFeedback, setOverallFeedback] = useState(existingEvaluation?.overallFeedback || '');
  const [recommendation, setRecommendation] = useState<'approve' | 'revise' | 'reject'>(
    existingEvaluation?.recommendation || 'approve'
  );
  const [publishedToStudent, setPublishedToStudent] = useState(
    existingEvaluation?.publishedToStudent ?? true
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [aiLoadingIdx, setAiLoadingIdx] = useState<number | null>(null);

  useEffect(() => {
    async function loadTemplate() {
      try {
        const res = await api.getRubricTemplates();
        if (res.templates && res.templates.length > 0) {
          const t = res.templates[0];
          setTemplate(t);

          if (existingEvaluation && existingEvaluation.criterionScores) {
            setCriterionScores(existingEvaluation.criterionScores);
          } else {
            // Initialize with default scores of 8.0
            const initial = t.criteria.map((c) => ({
              criterionId: c.id,
              criterionName: c.name,
              weight: c.weight,
              score: 8.0,
              comment: ''
            }));
            setCriterionScores(initial);
          }
        }
      } catch (err: any) {
        setErrorMessage('Failed to load institutional rubric template.');
      } finally {
        setLoadingTemplate(false);
      }
    }
    loadTemplate();
  }, [existingEvaluation]);

  const handleScoreChange = (index: number, val: number) => {
    const updated = [...criterionScores];
    updated[index].score = Math.min(10, Math.max(0, val));
    setCriterionScores(updated);
  };

  const handleCommentChange = (index: number, val: string) => {
    const updated = [...criterionScores];
    updated[index].comment = val;
    setCriterionScores(updated);
  };

  // Calculate weighted sum: Sum((score / 10) * weight)
  const totalWeightedScore = criterionScores.reduce((acc, curr) => {
    return acc + (curr.score / 10) * curr.weight;
  }, 0);

  const roundedTotal = Math.round(totalWeightedScore * 100) / 100;

  const handleGenerateAiFeedback = async (index: number) => {
    const item = criterionScores[index];
    setAiLoadingIdx(index);
    try {
      const res = await api.suggestRubricFeedback({
        projectTitle: project.title,
        problemStatement: project.problemStatement,
        criterionName: item.criterionName,
        score: item.score
      });
      if (res.suggestion) {
        handleCommentChange(index, res.suggestion);
      }
    } catch {
      handleCommentChange(
        index,
        `Demonstrates sound technical understanding for ${item.criterionName}. Continue validating operational parameters under varying loads.`
      );
    } finally {
      setAiLoadingIdx(null);
    }
  };

  const handleSave = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const user = api.getCurrentUser();
      const res = await api.submitRubricEvaluation({
        projectId: project.id,
        rubricTemplateId: template?.id || 'rubric-polytechnic-standard',
        evaluatorFacultyId: user?.id || 'user-faculty-demo',
        evaluatorName: user?.name || 'Prof. Devendra Rathore',
        criterionScores,
        overallFeedback: overallFeedback.trim() || 'Comprehensive evaluation completed according to diploma capstone standards.',
        recommendation,
        publishedToStudent
      });

      onSaveSuccess(res.evaluation);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save evaluation.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/10 text-[#00D4F5]">
                <Award className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-bold text-white">Alwar Polytechnic Rubric Evaluation</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Project: <span className="text-cyan-300 font-medium">{project.title}</span> • Student: <span className="text-slate-300">{project.studentName} ({project.studentPin})</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loadingTemplate ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 text-[#00D4F5] animate-spin mb-2" />
              <p className="text-xs">Loading institutional capstone criteria...</p>
            </div>
          ) : (
            <>
              {/* Score Summary Banner */}
              <div className="p-4 bg-gradient-to-r from-slate-950 to-[#0B192C] border border-cyan-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                    Calculated Weighted Grade
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-extrabold text-white tracking-tight">{roundedTotal}</span>
                    <span className="text-sm font-medium text-slate-400">/ 100</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ml-2 ${
                      roundedTotal >= 75
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : roundedTotal >= 60
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {roundedTotal >= 75 ? 'Distinction' : roundedTotal >= 60 ? 'First Class' : 'Needs Revision'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Formula</span>
                  <code className="text-[11px] text-cyan-300 font-mono">Σ (Score / 10) × Weight%</code>
                </div>
              </div>

              {/* Criteria List */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                  Assessment Criteria Breakdown (100% Total)
                </h4>

                {criterionScores.map((item, idx) => {
                  const criterionDef = template?.criteria.find((c) => c.id === item.criterionId);
                  const contribution = Math.round(((item.score / 10) * item.weight) * 100) / 100;

                  return (
                    <div
                      key={item.criterionId || idx}
                      className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                              Weight: {item.weight}%
                            </span>
                            <h5 className="text-sm font-semibold text-slate-200">{item.criterionName}</h5>
                          </div>
                          {criterionDef && (
                            <p className="text-xs text-slate-400 mt-1">{criterionDef.description}</p>
                          )}
                        </div>

                        {/* Score and Contribution */}
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={10}
                              step={0.5}
                              value={item.score}
                              onChange={(e) => handleScoreChange(idx, parseFloat(e.target.value) || 0)}
                              className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-sm font-bold text-white focus:outline-none focus:border-[#00D4F5]"
                            />
                            <span className="text-xs text-slate-400 font-medium">/ 10</span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-1">
                            +{contribution} pts
                          </span>
                        </div>
                      </div>

                      {/* Score Slider */}
                      <input
                        type="range"
                        min={0}
                        max={10}
                        step={0.1}
                        value={item.score}
                        onChange={(e) => handleScoreChange(idx, parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#00D4F5]"
                      />

                      {/* Comment and AI Suggestion */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Faculty feedback note for this criterion..."
                          value={item.comment}
                          onChange={(e) => handleCommentChange(idx, e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleGenerateAiFeedback(idx)}
                          disabled={aiLoadingIdx === idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/40 rounded-lg text-xs font-medium transition-colors shrink-0"
                          title="Generate constructive suggestions with Gemini"
                        >
                          {aiLoadingIdx === idx ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          AI Suggest
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Overall Feedback & Recommendation */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1.5">
                    Overall Evaluation Comments
                  </label>
                  <textarea
                    rows={3}
                    value={overallFeedback}
                    onChange={(e) => setOverallFeedback(e.target.value)}
                    placeholder="Enter comprehensive viva performance remarks, engineering strengths, and recommended improvements..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00D4F5]"
                  />
                </div>

                {/* Recommendation Radio Pills */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">
                    Review Decision
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setRecommendation('approve')}
                      className={`p-3 rounded-xl border text-center transition-all flex items-center justify-center gap-2 ${
                        recommendation === 'approve'
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold">Approve Project</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRecommendation('revise')}
                      className={`p-3 rounded-xl border text-center transition-all flex items-center justify-center gap-2 ${
                        recommendation === 'revise'
                          ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-semibold">Request Changes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRecommendation('reject')}
                      className={`p-3 rounded-xl border text-center transition-all flex items-center justify-center gap-2 ${
                        recommendation === 'reject'
                          ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-semibold">Reject Submission</span>
                    </button>
                  </div>
                </div>

                {/* Publish to Student Checkbox */}
                <div className="flex items-center gap-2.5 p-3 bg-slate-950/50 border border-slate-800 rounded-xl">
                  <input
                    type="checkbox"
                    id="publishCheck"
                    checked={publishedToStudent}
                    onChange={(e) => setPublishedToStudent(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 accent-[#00D4F5] bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  <label htmlFor="publishCheck" className="text-xs text-slate-300 cursor-pointer">
                    Publish evaluation results and feedback directly to student portfolio & dashboard
                  </label>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || loadingTemplate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] text-xs font-bold rounded-lg shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save & Persist Evaluation
          </button>
        </div>
      </div>
    </div>
  );
};
