import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Search,
  FileText,
  MessageSquare,
  Bell,
  AlertCircle,
  User,
  Users,
  CalendarCheck,
  CheckSquare,
  Lightbulb,
  ShoppingBag,
  ShieldAlert,
  Sliders,
  DollarSign,
  ScrollText,
  Compass,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { UserRole } from '../types/index.js';

interface SidebarProps {
  role: UserRole;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ role, activeTab, onTabChange }) => {
  const getNavItems = () => {
    switch (role) {
      case 'student':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'portfolio', label: 'My Portfolio', icon: Briefcase },
          { id: 'learn-and-earn', label: 'Learn & Earn', icon: DollarSign },
          { id: 'academic-assistant', label: 'AI Academic Mentor', icon: Sparkles },
          { id: 'find-projects', label: 'Find Projects', icon: Search },
          { id: 'applications', label: 'My Applications', icon: FileText },
          { id: 'messages', label: 'Messages', icon: MessageSquare },
          { id: 'notices', label: 'Notices', icon: Bell },
          { id: 'complaints', label: 'Complaints', icon: AlertCircle },
          { id: 'profile', label: 'Profile & Settings', icon: User }
        ];

      case 'faculty':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'my-students', label: 'My Students', icon: Users },
          { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
          { id: 'project-reviews', label: 'Project Reviews', icon: CheckSquare },
          { id: 'supervision', label: 'Student Supervision', icon: ShieldCheck },
          { id: 'notices', label: 'Notices', icon: Bell },
          { id: 'profile', label: 'Profile', icon: User }
        ];

      case 'client':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'discover-services', label: 'Discover Services', icon: ShoppingBag },
          { id: 'idea-studio', label: 'Idea Studio', icon: Lightbulb },
          { id: 'my-requests', label: 'My Requests', icon: FileText },
          { id: 'purchases', label: 'Purchases', icon: DollarSign },
          { id: 'messages', label: 'Messages', icon: MessageSquare },
          { id: 'profile', label: 'Profile & Settings', icon: User }
        ];

      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'user-management', label: 'User Management', icon: Users },
          { id: 'project-moderation', label: 'Project Moderation', icon: CheckSquare },
          { id: 'notices', label: 'Notices', icon: Bell },
          { id: 'complaints', label: 'Complaints', icon: AlertCircle },
          { id: 'transactions', label: 'Transactions', icon: DollarSign },
          { id: 'security-logs', label: 'Security Logs', icon: ScrollText },
          { id: 'settings', label: 'Settings', icon: Sliders }
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-[#0B192C] border-r border-slate-800 flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D4F5] to-blue-700 flex items-center justify-center text-[#0B192C] font-black text-lg shadow-md shadow-cyan-500/20">
          AP
        </div>
        <div className="overflow-hidden">
          <h2 className="text-sm font-extrabold text-white tracking-wide leading-none">
            ALWAR POLYTECHNIC
          </h2>
          <p className="text-[10px] text-cyan-400 font-medium tracking-tight mt-1 truncate">
            Student Talent Portal
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Main Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-[#00D4F5] border border-[#00D4F5]/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#00D4F5]' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00D4F5] shadow-xs shadow-cyan-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Institutional Footer Badge */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400">
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
          <span>Alwar Polytechnic Portal</span>
        </div>
        <span className="text-[10px] text-slate-500 block mt-0.5">Govt. Recognized Diploma Institution</span>
      </div>
    </aside>
  );
};
