import React from 'react';
import { ArrowLeft, Bell, LogOut, ShieldCheck, GraduationCap, Building2, UserCircle } from 'lucide-react';
import { User } from '../types/index.js';

interface HeaderProps {
  user: User;
  title: string;
  subtitle?: string;
  showBackArrow?: boolean;
  onBack?: () => void;
  onLogout: () => void;
  unreadNoticesCount?: number;
  onOpenNotices?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  title,
  subtitle,
  showBackArrow = false,
  onBack,
  onLogout,
  unreadNoticesCount = 0,
  onOpenNotices
}) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'student':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
            <GraduationCap className="w-3.5 h-3.5" />
            Diploma Scholar
          </span>
        );
      case 'faculty':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
            <Building2 className="w-3.5 h-3.5" />
            Faculty Reviewer
          </span>
        );
      case 'client':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/60">
            <Building2 className="w-3.5 h-3.5" />
            Industry Partner
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            Administrator
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0B192C]/95 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 py-3.5 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Working Backward Arrow (←) on inner pages */}
        {showBackArrow && onBack && (
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-[#00D4F5] hover:bg-slate-800 transition-all cursor-pointer group"
            title="Go back to previous page"
            aria-label="Back to parent page"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        <div>
          <h1 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            {title}
          </h1>
          {subtitle && <p className="text-xs text-slate-400 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {getRoleBadge(user.role)}

        {/* Notice Bell */}
        <button
          onClick={onOpenNotices}
          className="relative p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
          title="Institutional Notices & Circulars"
        >
          <Bell className="w-4 h-4" />
          {unreadNoticesCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-[#0B192C] font-black text-[10px] rounded-full flex items-center justify-center">
              {unreadNoticesCount}
            </span>
          )}
        </button>

        {/* User Pill */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-300 text-xs font-bold overflow-hidden">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <UserCircle className="w-5 h-5 text-cyan-400" />
            )}
          </div>
          <div className="text-left text-xs leading-tight">
            <span className="font-semibold text-slate-200 block truncate max-w-[130px]">{user.name}</span>
            <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">{user.email}</span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-800 hover:bg-rose-950/30 transition-all cursor-pointer"
          title="Sign out of portal session"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
