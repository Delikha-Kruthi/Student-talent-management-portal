import React, { useState, useEffect, useRef } from 'react';
import { User, ClientProfile, Branch } from '../../types/index.js';
import { api } from '../../services/api.js';
import {
  Lightbulb,
  Mic,
  MicOff,
  Upload,
  Save,
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  ArrowRight,
  HelpCircle
} from 'lucide-react';

interface IdeaStudioProps {
  user: User;
  profile: ClientProfile | null;
  onNavigateToRequests: () => void;
}

export const IdeaStudio: React.FC<IdeaStudioProps> = ({
  user,
  profile,
  onNavigateToRequests
}) => {
  const [description, setDescription] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [targetBranch, setTargetBranch] = useState('Computer Science & Engineering');
  const [estimatedBudget, setEstimatedBudget] = useState('₹40,000 - ₹60,000');
  const [branches, setBranches] = useState<Branch[]>([]);

  // Document upload
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docName, setDocName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Speech to text
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // AI Analysis (Structured in-page breakdown without extra tabs)
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [isFallbackAnalysis, setIsFallbackAnalysis] = useState(false);

  // Status & persistence
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);

  // Load local draft on mount if available
  useEffect(() => {
    const draft = localStorage.getItem(`alwar_idea_draft_${user.id}`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setDescription(parsed.description || '');
        setProjectTitle(parsed.title || '');
        setTargetBranch(parsed.targetBranch || 'Computer Science & Engineering');
        setEstimatedBudget(parsed.estimatedBudget || '₹40,000 - ₹60,000');
        if (parsed.aiAnalysis) setAiAnalysis(parsed.aiAnalysis);
        if (parsed.savedDraftId) setSavedDraftId(parsed.savedDraftId);
      } catch (e) {
        console.error('Failed to parse saved draft:', e);
      }
    }

    api.getBranches().then(res => {
      if (res.branches) setBranches(res.branches);
    });
  }, [user.id]);

  // Persist draft to localStorage on edit
  useEffect(() => {
    if (description || projectTitle) {
      localStorage.setItem(
        `alwar_idea_draft_${user.id}`,
        JSON.stringify({
          title: projectTitle,
          description,
          targetBranch,
          estimatedBudget,
          aiAnalysis,
          savedDraftId
        })
      );
    }
  }, [description, projectTitle, targetBranch, estimatedBudget, aiAnalysis, savedDraftId, user.id]);

  // Speech Recognition (Browser Native)
  const toggleRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech-to-text is not supported in this browser. Please type your description.');
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setDescription((prev) => (prev ? prev + ' ' + transcript : transcript));
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch (e) {
      console.error(e);
      setIsRecording(false);
    }
  };

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocFile(file);
      setDocName(file.name);
    }
  };

  const handleAnalyzeWithAI = async () => {
    setErrorMessage(null);
    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage('Please write at least 10 characters describing your idea first.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await api.analyzeIdeaWithAI(description);
      if (res.analysis) {
        setAiAnalysis(res.analysis);
        setIsFallbackAnalysis(Boolean(res.isFallback));
        if (!projectTitle.trim() && res.analysis.summary) {
          setProjectTitle(res.analysis.summary.slice(0, 60));
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'AI analysis unavailable.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveDraft = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!description.trim()) {
      setErrorMessage('Please enter an idea description to save a draft.');
      return;
    }

    setIsDraftSaving(true);
    try {
      if (savedDraftId) {
        await api.updateClientIdea(savedDraftId, {
          title: projectTitle || 'Draft Idea',
          description,
          targetBranch,
          estimatedBudget,
          status: 'draft',
          aiAnalysis
        });
      } else {
        const res = await api.submitClientIdea({
          clientId: user.id,
          clientName: user.name,
          organization: profile?.organization || 'Industrial Client',
          title: projectTitle || 'Draft Idea',
          description,
          targetBranch,
          estimatedBudget,
          status: 'draft'
        });
        if (res.idea) setSavedDraftId(res.idea.id);
      }
      setSuccessMessage('Draft saved successfully to the database! You can resume anytime.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save draft.');
    } finally {
      setIsDraftSaving(false);
    }
  };

  const handleSubmitIdea = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage('Please provide a detailed description (at least 10 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      let docUrl = undefined;
      // If doc uploaded, post it
      if (docFile) {
        // Upload simulation/route
        docUrl = `/uploads/docs/${docFile.name}`;
      }

      const res = await api.submitClientIdea({
        clientId: user.id,
        clientName: user.name,
        organization: profile?.organization || 'Industrial Client',
        title: projectTitle.trim() || description.slice(0, 60) + '...',
        description: description.trim(),
        targetBranch,
        estimatedBudget,
        documentUrl: docUrl,
        documentName: docName || undefined,
        status: 'submitted'
      });

      if (res.success) {
        setSuccessMessage('Project idea successfully submitted to Alwar Polytechnic academic faculty & student innovators!');
        // Clear draft from storage
        localStorage.removeItem(`alwar_idea_draft_${user.id}`);
        setSavedDraftId(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit idea.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title & Instructions Header */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-cyan-950 text-[#00D4F5]">
            <Lightbulb className="w-6 h-6" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-white">
              Describe Your Project Idea
            </h2>
            <p className="text-xs text-slate-400">
              Single-page studio: Explain your engineering requirements, industrial problem statement, or custom prototype specification.
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={onNavigateToRequests}
            className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg inline-flex items-center gap-1 transition-colors shrink-0"
          >
            <span>View in My Requests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Form Card */}
      <div className="p-6 md:p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1.5">
            Project Concept Title (Optional)
          </label>
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            placeholder="e.g. Automated Guided Vehicle LiDAR Navigation for Warehouse Pallets"
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4F5]"
          />
        </div>

        {/* Large Text Area with Voice Input Button */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
              Project Idea & Technical Problem Description *
            </label>

            {/* Optional Microphone Button */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isRecording
                  ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
              title={isRecording ? 'Click to stop speech-to-text' : 'Dictate idea using microphone'}
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{isRecording ? 'Listening...' : 'Voice Dictation'}</span>
            </button>
          </div>

          <textarea
            rows={7}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide as much detail as possible: What does the system need to do? What environment does it operate in? What sensors, motors, or interfaces are required? What is your expected deliverable?"
            className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00D4F5] leading-relaxed"
          />
        </div>

        {/* Supporting File / Sketch Upload & Scope Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Preferred Department
            </label>
            <select
              value={targetBranch}
              onChange={(e) => setTargetBranch(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="Any Department">Any Polytechnic Department</option>
              {branches.map((b) => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Estimated Sponsorship Budget
            </label>
            <input
              type="text"
              value={estimatedBudget}
              onChange={(e) => setEstimatedBudget(e.target.value)}
              placeholder="e.g. ₹40,000 - ₹60,000"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Supporting Spec / Schematic (Optional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleDocSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 text-left flex items-center justify-between cursor-pointer truncate"
            >
              <span className="truncate">{docName || 'Upload Spec / PDF'}</span>
              <Upload className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-1" />
            </button>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isDraftSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              {isDraftSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Draft
            </button>

            <button
              type="button"
              onClick={handleAnalyzeWithAI}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              title="Get suggested features, tech stack, and scope with Gemini"
            >
              {isAnalyzing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-[#00D4F5]" />
              )}
              Analyze Idea with AI
            </button>
          </div>

          <button
            type="button"
            onClick={handleSubmitIdea}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit Idea to Alwar Polytechnic
          </button>
        </div>

        {/* IN-PAGE AI ANALYSIS RESULTS (Section 10: Single Page, no separate tabs!) */}
        {aiAnalysis && (
          <div className="mt-6 p-5 bg-slate-950/90 border border-cyan-500/30 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00D4F5]" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Alwar Polytechnic AI Engineering Advisor Breakdown
                </h4>
              </div>
              {isFallbackAnalysis && (
                <span className="text-[10px] text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                  Standard Rules Engine
                </span>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Summary</span>
                <p className="text-slate-200">{aiAnalysis.summary}</p>
              </div>

              {aiAnalysis.suggestedFeatures && (
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Recommended Functional Features</span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                    {aiAnalysis.suggestedFeatures.map((f: string, i: number) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiAnalysis.suggestedTechStack && (
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Recommended Tech Stack</span>
                  <div className="flex flex-wrap gap-1.5">
                    {aiAnalysis.suggestedTechStack.map((t: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-900 text-cyan-300 rounded text-[10px] border border-cyan-900/60">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {aiAnalysis.clarifyingQuestions && (
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Clarifying Questions to Consider</span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                    {aiAnalysis.clarifyingQuestions.map((q: string, i: number) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
