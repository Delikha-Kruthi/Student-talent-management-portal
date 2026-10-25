import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail, User, ShieldCheck, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Loader2, Sparkles, Building, IdCard, GraduationCap } from 'lucide-react';
import { api } from '../services/api.js';
import { Branch, UserRole } from '../types/index.js';

interface AuthPageProps {
  onAuthSuccess: (user: any, profile: any) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoDrawer, setShowDemoDrawer] = useState(true);

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Role specific inputs
  const [pin, setPin] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [organization, setOrganization] = useState('');
  const [branchId, setBranchId] = useState('branch-cse');
  const [semester, setSemester] = useState('5');
  const [batch, setBatch] = useState('2024-2027 Batch A');
  const [qualification, setQualification] = useState('M.Tech (Engineering)');

  // Branches from backend
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Demo accounts
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [branchRes, demoRes] = await Promise.all([
          api.getBranches(),
          api.getDemoAccounts()
        ]);
        if (branchRes.branches) {
          setBranches(branchRes.branches);
          if (branchRes.branches.length > 0) {
            setBranchId(branchRes.branches[0].id);
          }
        }
        if (demoRes.accounts) {
          setDemoAccounts(demoRes.accounts);
        }
      } catch (err) {
        console.error('Failed to load initial branches or demo accounts:', err);
      }
    }
    loadInitial();
  }, []);

  const handleUseDemoAccount = (acc: any) => {
    setIsLogin(true);
    setEmail(acc.email);
    setPassword(acc.password);
    setErrorMessage(null);
    setSuccessMessage(`Credentials populated for ${acc.label}. Click 'Sign In' below to proceed.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        const res = await api.login({ email, password });
        if (res.success) {
          onAuthSuccess(res.user, res.profile);
        }
      } else {
        // Registering
        const selectedBranch = branches.find(b => b.id === branchId);
        const payload: any = {
          email,
          password,
          name,
          role: selectedRole,
          branchId,
          branchName: selectedBranch?.name || 'Computer Science & Engineering'
        };

        if (selectedRole === 'student') {
          payload.pin = pin;
          payload.semester = Number(semester);
          payload.batch = batch;
        } else if (selectedRole === 'faculty') {
          payload.employeeId = employeeId;
          payload.qualification = qualification;
        } else if (selectedRole === 'client') {
          payload.organization = organization;
        }

        const res = await api.register(payload);
        if (res.success) {
          if (res.user.status === 'pending_approval') {
            setSuccessMessage('Faculty account registered! Institutional administrator approval is pending. You can log in once approved.');
            setIsLogin(true);
          } else {
            onAuthSuccess(res.user, res.profile);
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070F1E] text-slate-100 flex flex-col justify-between selection:bg-[#00D4F5] selection:text-[#0B192C]">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-[#0B192C]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00D4F5] to-blue-600 flex items-center justify-center text-[#0B192C] font-black text-xl shadow-lg shadow-cyan-500/20">
              AP
            </div>
            <div>
              <h1 className="text-base font-black tracking-wide text-white leading-tight">
                ALWAR POLYTECHNIC
              </h1>
              <p className="text-xs text-cyan-400 font-medium tracking-tight">
                Student Talent Management Portal
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Govt. Technical Education Board Accredited</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
        {/* Left Column: Institutional Value & Overview */}
        <div className="flex-1 max-w-lg text-left hidden lg:block space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-800/50 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#00D4F5]" />
            All Institutional Branches & Departments
          </div>

          <h2 className="text-3xl font-extrabold text-white tracking-tight leading-snug">
            Empowering Polytechnic Diploma Innovators & Industry Partners
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            The official unified platform for student capstone portfolios, direct project demonstration video uploads, faculty rubric-based reviews, and industrial licensing.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
              <span className="text-xs font-bold text-cyan-400 block mb-1">Direct Video Uploads</span>
              <p className="text-xs text-slate-400">Persistent streaming with byte-range 206 playback for student demos.</p>
            </div>
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
              <span className="text-xs font-bold text-emerald-400 block mb-1">Rubric Evaluator</span>
              <p className="text-xs text-slate-400">Standardized 6-criterion weighted scoring with AI assistance.</p>
            </div>
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
              <span className="text-xs font-bold text-purple-400 block mb-1">Client Idea Studio</span>
              <p className="text-xs text-slate-400">Describe engineering problem statements for sponsored capstones.</p>
            </div>
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
              <span className="text-xs font-bold text-amber-400 block mb-1">All Engineering Branches</span>
              <p className="text-xs text-slate-400">Computer, Mechanical, Civil, Electrical, Automobile, and Chemical.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 backdrop-blur-xl">
          {/* Login / Signup Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setErrorMessage(null); setSuccessMessage(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isLogin
                  ? 'bg-[#00D4F5] text-[#0B192C] shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setErrorMessage(null); setSuccessMessage(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                !isLogin
                  ? 'bg-[#00D4F5] text-[#0B192C] shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register New Account
            </button>
          </div>

          {/* Form Header */}
          <div className="mb-5">
            <h3 className="text-lg font-bold text-white">
              {isLogin ? 'Sign In to Your Account' : 'Institutional Registration'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isLogin
                ? 'Enter your institutional email and credentials'
                : 'Select your role and complete your departmental profile'}
            </p>
          </div>

          {/* Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-cyan-950/50 border border-cyan-800 text-cyan-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Registration Role Selector */}
          {!isLogin && (
            <div className="mb-4 space-y-1.5">
              <label className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                Select Your Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('student')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    selectedRole === 'student'
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Student</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('faculty')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    selectedRole === 'faculty'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>Faculty</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('client')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    selectedRole === 'client'
                      ? 'bg-purple-950/80 border-purple-500 text-purple-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>Client</span>
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav Choudhary"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4F5]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@alwarpolytechnic.ac.in"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4F5]"
                />
              </div>
            </div>

            {/* Role-specific fields for Registration */}
            {!isLogin && selectedRole === 'student' && (
              <div className="space-y-3 pt-1 border-t border-slate-800/80">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Student PIN/ID</label>
                    <div className="relative">
                      <IdCard className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="AP-2024-CS-099"
                        className="w-full pl-8 pr-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4F5]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Semester</label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#00D4F5]"
                    >
                      {[1, 2, 3, 4, 5, 6].map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Branch / Department</label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#00D4F5]"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Class / Batch</label>
                  <input
                    type="text"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    placeholder="2024-2027 Batch A"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4F5]"
                  />
                </div>
              </div>
            )}

            {!isLogin && selectedRole === 'faculty' && (
              <div className="space-y-3 pt-1 border-t border-slate-800/80">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Employee ID</label>
                    <input
                      type="text"
                      required
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="AP-FAC-204"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4F5]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Branch</label>
                    <select
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#00D4F5]"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Qualification</label>
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="e.g. M.Tech, Ph.D"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4F5]"
                  />
                </div>
                <p className="text-[11px] text-amber-300/80 bg-amber-950/40 p-2 rounded-lg border border-amber-800/40">
                  Note: Faculty registration is submitted for Administrative Council verification.
                </p>
              </div>
            )}

            {!isLogin && selectedRole === 'client' && (
              <div className="space-y-3 pt-1 border-t border-slate-800/80">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Organization / Enterprise</label>
                  <input
                    type="text"
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Rajasthan Industrial Automation Ltd."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4F5]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4F5]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{isLogin ? 'Sign In to Portal' : 'Submit Registration'}</span>
              )}
            </button>
          </form>

          {/* Expandable Demo Accounts Drawer (Section 4) */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowDemoDrawer(!showDemoDrawer)}
              className="w-full flex items-center justify-between text-xs font-semibold text-cyan-400 hover:text-cyan-300 py-1 transition-colors cursor-pointer"
            >
              <span>Explore Demo Accounts</span>
              {showDemoDrawer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDemoDrawer && (
              <div className="mt-3 space-y-2">
                <p className="text-[11px] text-slate-400">
                  Click any account below to populate credentials in the login form:
                </p>

                <div className="grid grid-cols-1 gap-2">
                  {demoAccounts.map((acc) => (
                    <div
                      key={acc.role}
                      className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="truncate mr-2">
                        <span className="font-semibold text-slate-200 block truncate">{acc.label}</span>
                        <span className="text-[10px] text-slate-400 block truncate font-mono">{acc.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUseDemoAccount(acc)}
                        className="px-2.5 py-1 bg-cyan-950 text-cyan-300 hover:bg-[#00D4F5] hover:text-[#0B192C] border border-cyan-800/60 font-semibold text-[11px] rounded-lg transition-all shrink-0 cursor-pointer"
                      >
                        Use Demo Account
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B192C]/90 py-4 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Alwar Polytechnic. Student Talent Management Portal. All rights reserved.</p>
      </footer>
    </div>
  );
};
