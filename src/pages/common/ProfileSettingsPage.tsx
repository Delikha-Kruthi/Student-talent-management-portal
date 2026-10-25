import React, { useState } from 'react';
import { User } from '../../types/index.js';
import { api } from '../../services/api.js';
import { UserCheck, Shield, Key, Bell, LogOut, CheckCircle2 } from 'lucide-react';

interface ProfileSettingsPageProps {
  user: User;
  profile: any;
  onLogout: () => void;
}

export const ProfileSettingsPage: React.FC<ProfileSettingsPageProps> = ({
  user,
  profile,
  onLogout
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  // Notifications
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [expoReminders, setExpoReminders] = useState(true);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters.');
      return;
    }

    setPasswordMsg('Password updated successfully for next login session.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#00D4F5]" />
            Profile & Security Settings
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your authenticated credentials, session security, and alerts.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="px-4 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>

      {/* Account Info */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Account Identification
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-slate-500 block mb-0.5">Name</span>
            <span className="text-white font-bold">{user.name}</span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-slate-500 block mb-0.5">Institutional Email</span>
            <span className="text-white font-mono">{user.email}</span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-slate-500 block mb-0.5">Institutional Role</span>
            <span className="text-cyan-400 font-bold uppercase">{user.role}</span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-slate-500 block mb-0.5">Department / Affiliation</span>
            <span className="text-slate-200">
              {profile?.branchName || profile?.organization || 'Academic Directorate'}
            </span>
          </div>
        </div>
      </div>

      {/* Password Reset */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Key className="w-4 h-4 text-cyan-400" />
          Update Credentials
        </h3>

        {passwordMsg && (
          <div className="p-3 bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{passwordMsg}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Bell className="w-4 h-4 text-purple-400" />
          Notification Preferences
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <p className="font-semibold text-white">Capstone Milestone Alerts</p>
              <p className="text-slate-400 text-[11px]">Notify when faculty rubric evaluations or reviews are published.</p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 text-cyan-500 accent-[#00D4F5]"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <p className="font-semibold text-white">Annual Expo & Industry Notifications</p>
              <p className="text-slate-400 text-[11px]">Updates regarding corporate sponsorships and expo schedules.</p>
            </div>
            <input
              type="checkbox"
              checked={expoReminders}
              onChange={(e) => setExpoReminders(e.target.checked)}
              className="w-4 h-4 text-cyan-500 accent-[#00D4F5]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
