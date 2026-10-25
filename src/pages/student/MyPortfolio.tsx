import React, { useState, useEffect } from 'react';
import { User, StudentProfile, Project, SkillItem, Branch } from '../../types/index.js';
import { api } from '../../services/api.js';
import { DirectVideoUpload } from '../../components/DirectVideoUpload.js';
import { VideoPlayer } from '../../components/VideoPlayer.js';
import { Plus, Edit3, Trash2, CheckCircle2, Clock, Globe, Lock, Shield, Video, FileText, ExternalLink, Sparkles, X, Save, AlertCircle } from 'lucide-react';

interface MyPortfolioProps {
  user: User;
  profile: StudentProfile | null;
  onOpenProjectDetails: (project: Project) => void;
  onProfileUpdated: (updatedProfile: StudentProfile) => void;
}

export const MyPortfolio: React.FC<MyPortfolioProps> = ({
  user,
  profile,
  onOpenProjectDetails,
  onProfileUpdated
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile Editor Modal
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [bio, setBio] = useState(profile?.bio || '');
  const [skills, setSkills] = useState<SkillItem[]>(profile?.skills || []);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'>('Intermediate');
  const [githubUrl, setGithubUrl] = useState(profile?.githubUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedinUrl || '');
  const [portfolioVisibility, setPortfolioVisibility] = useState<'public' | 'institutional' | 'private'>(
    profile?.portfolioVisibility || 'public'
  );

  // Project Modal (Add / Edit)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [proposedSolution, setProposedSolution] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [price, setPrice] = useState('15000');
  const [licenseType, setLicenseType] = useState<'MIT' | 'Academic' | 'Commercial' | 'Proprietary'>('Commercial');
  const [projectVisibility, setProjectVisibility] = useState<'public' | 'institutional' | 'private'>('public');

  // Video State
  const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
  const [videoFileName, setVideoFileName] = useState<string | undefined>(undefined);
  const [videoSize, setVideoSize] = useState<number | undefined>(undefined);

  const [savingProject, setSavingProject] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
    api.getBranches().then(res => {
      if (res.branches) setBranches(res.branches);
    });
  }, [user.id]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await api.getProjects({ studentId: user.id });
      if (res.projects) setProjects(res.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const exists = skills.some(s => s.name.toLowerCase() === newSkillName.trim().toLowerCase());
    if (exists) return;
    setSkills([...skills, { name: newSkillName.trim(), level: newSkillLevel }]);
    setNewSkillName('');
  };

  const handleRemoveSkill = (name: string) => {
    setSkills(skills.filter(s => s.name !== name));
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    try {
      const res = await api.updateStudentProfile(profile.id, {
        bio,
        skills,
        githubUrl,
        linkedinUrl,
        portfolioVisibility
      });
      if (res.profile) {
        onProfileUpdated(res.profile);
        setIsEditingProfile(false);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    }
  };

  const handleOpenAddProject = () => {
    setProjectTitle('');
    setShortDescription('');
    setProblemStatement('');
    setProposedSolution('');
    setTechStackInput('');
    setPrice('15000');
    setLicenseType('Commercial');
    setProjectVisibility('public');
    setVideoUrl(undefined);
    setVideoFileName(undefined);
    setVideoSize(undefined);
    setFormError(null);
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async (isDraft = false) => {
    setFormError(null);

    if (!projectTitle.trim() || !problemStatement.trim() || !proposedSolution.trim()) {
      setFormError('Please enter Project Title, Problem Statement, and Proposed Solution.');
      return;
    }

    setSavingProject(true);

    const techStack = techStackInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    try {
      const res = await api.createProject({
        title: projectTitle,
        shortDescription: shortDescription || projectTitle,
        problemStatement,
        proposedSolution,
        techStack: techStack.length > 0 ? techStack : ['React', 'Embedded C', 'IoT'],
        skills: techStack,
        branchId: profile?.branchId || 'branch-cse',
        branchName: profile?.branchName || 'Computer Science & Engineering',
        studentId: user.id,
        studentName: user.name,
        studentPin: profile?.pin || 'AP-2024-CS-000',
        teamMembers: [{ name: user.name, pin: profile?.pin || '', role: 'Lead Developer' }],
        visibility: projectVisibility,
        price: Number(price) || 0,
        licenseType,
        videoUrl,
        videoFileName,
        videoSize,
        isDraft
      });

      if (res.success) {
        setIsProjectModalOpen(false);
        loadProjects();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to save project.');
    } finally {
      setSavingProject(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Header & Student Bio Card */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800/60">
              PIN: {profile?.pin}
            </span>
            <span className="text-xs text-slate-300 font-semibold bg-slate-800 px-2.5 py-1 rounded-lg">
              {profile?.branchName}
            </span>
            <span className="text-xs text-slate-400 bg-slate-800/60 px-2 py-1 rounded-lg">
              Semester {profile?.semester} • {profile?.batch}
            </span>
          </div>

          <h2 className="text-2xl font-black text-white">{user.name}</h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            {profile?.bio || 'Add your student bio and technical interests to showcase to faculty evaluators and corporate sponsors.'}
          </p>

          {/* Skills Badges */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {profile?.skills && profile.skills.length > 0 ? (
              profile.skills.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-950 text-cyan-300 border border-cyan-900/40"
                >
                  {s.name} <span className="text-[10px] text-slate-500">• {s.level}</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">No skills listed yet. Click Edit Profile below.</span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            onClick={() => setIsEditingProfile(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-cyan-400" />
            Edit Profile
          </button>

          <button
            onClick={handleOpenAddProject}
            className="px-4 py-2.5 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Capstone Project
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              My Portfolio Projects ({projects.length})
            </h3>
            <p className="text-xs text-slate-400">
              Each project supports direct video demonstrations, technical specifications, and faculty rubric reviews.
            </p>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="p-12 bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-[#00D4F5]">
              <Video className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">Your Project Showcase is Empty</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Upload your engineering capstone project with working code, schematics, and an MP4 demonstration video to be evaluated by faculty.
              </p>
            </div>
            <button
              onClick={handleOpenAddProject}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00D4F5] text-[#0B192C] font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Project Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-2xl overflow-hidden shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Video Thumbnail or Player */}
                  {proj.videoUrl ? (
                    <div className="h-48 bg-slate-950 relative border-b border-slate-800">
                      <VideoPlayer src={proj.videoUrl} title={proj.title} />
                    </div>
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center border-b border-slate-800 text-slate-600">
                      <div className="flex items-center gap-2 text-xs">
                        <Video className="w-5 h-5 text-slate-600" />
                        <span>No Demonstration Video Uploaded</span>
                      </div>
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider ${
                        proj.status === 'approved'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : proj.status === 'under_review' || proj.status === 'submitted'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {proj.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-bold text-cyan-400">
                        ₹{proj.price ? proj.price.toLocaleString() : 'Open Access'}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white line-clamp-1">{proj.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{proj.problemStatement}</p>

                    {/* Tech Stack */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {proj.techStack.map((tech, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-950 text-slate-300 rounded text-[10px] border border-slate-800 font-medium">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {proj.licenseType} License
                  </span>
                  <button
                    onClick={() => onOpenProjectDetails(proj)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    View Details & Rubric Score
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Edit Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Edit Student Profile</h3>
              <button onClick={() => setIsEditingProfile(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Student Bio & Innovation Goals</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Describe your engineering focus, past achievements, or technical interests..."
                />
              </div>

              {/* Skills Editor */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-medium">Skills & Proficiency</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    placeholder="e.g. Embedded C++, SolidWorks, Python"
                    className="flex-1 p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                  <select
                    value={newSkillLevel}
                    onChange={(e) => setNewSkillLevel(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2 text-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3 py-2 bg-cyan-950 text-cyan-300 border border-cyan-800/60 rounded-lg font-bold"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-md text-slate-200"
                    >
                      {s.name} ({s.level})
                      <button onClick={() => handleRemoveSkill(s.name)} className="text-slate-500 hover:text-rose-400">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">GitHub Profile URL</label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">LinkedIn Profile URL</label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Portfolio Visibility</label>
                <select
                  value={portfolioVisibility}
                  onChange={(e) => setPortfolioVisibility(e.target.value as any)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  <option value="public">Public (Visible to Clients & Expo)</option>
                  <option value="institutional">Institutional Only (Alwar Polytechnic)</option>
                  <option value="private">Private (Faculty Review Only)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-[#00D4F5] text-[#0B192C] font-bold rounded-lg text-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Project Modal (with Direct Video Upload) */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Submit New Capstone Engineering Project</h3>
                <p className="text-xs text-slate-400">
                  Alwar Polytechnic • Department of {profile?.branchName || 'Engineering'}
                </p>
              </div>
              <button onClick={() => setIsProjectModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. Dual-Axis Solar Tracker with Micro-Peltier Chiller"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Brief Description</label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="One-sentence elevator pitch for industry clients and faculty..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Problem Statement *</label>
                  <textarea
                    rows={3}
                    required
                    value={problemStatement}
                    onChange={(e) => setProblemStatement(e.target.value)}
                    placeholder="Describe the technical or industrial challenge this project addresses..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Proposed Solution & Engineering Architecture *</label>
                  <textarea
                    rows={3}
                    required
                    value={proposedSolution}
                    onChange={(e) => setProposedSolution(e.target.value)}
                    placeholder="Explain the working hardware/software implementation and methodology..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* DIRECT VIDEO UPLOAD SECTION (Mandatory Section 12 Requirement) */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#00D4F5]" />
                    Direct Demonstration Video Upload (Local File)
                  </label>
                  <span className="text-[11px] text-slate-400">Do not paste a YouTube link; upload directly</span>
                </div>

                <DirectVideoUpload
                  initialVideoUrl={videoUrl}
                  initialFileName={videoFileName}
                  initialFileSize={videoSize}
                  onVideoUploaded={(data) => {
                    setVideoUrl(data.videoUrl);
                    setVideoFileName(data.videoFileName);
                    setVideoSize(data.videoSize);
                  }}
                  onVideoRemoved={() => {
                    setVideoUrl(undefined);
                    setVideoFileName(undefined);
                    setVideoSize(undefined);
                  }}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Technology Stack & Tools (comma separated)
                </label>
                <input
                  type="text"
                  value={techStackInput}
                  onChange={(e) => setTechStackInput(e.target.value)}
                  placeholder="e.g. Arduino Mega, SolidWorks, React, MQTT, FastAPI, C++"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">License Type</label>
                  <select
                    value={licenseType}
                    onChange={(e) => setLicenseType(e.target.value as any)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  >
                    <option value="Commercial">Commercial</option>
                    <option value="Academic">Academic</option>
                    <option value="MIT">MIT Open</option>
                    <option value="Proprietary">Proprietary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="15000"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Visibility</label>
                  <select
                    value={projectVisibility}
                    onChange={(e) => setProjectVisibility(e.target.value as any)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  >
                    <option value="public">Public</option>
                    <option value="institutional">Institutional Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleSaveProject(true)}
                disabled={savingProject}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Save as Draft
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 bg-transparent text-slate-400 hover:text-white rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveProject(false)}
                  disabled={savingProject}
                  className="px-5 py-2.5 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  {savingProject ? 'Saving & Submitting...' : 'Submit for Faculty Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
