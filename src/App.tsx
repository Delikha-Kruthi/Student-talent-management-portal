import React, { useState, useEffect } from 'react';
import { User, StudentProfile, FacultyProfile, ClientProfile, Project, Notice } from './types/index.js';
import { api } from './services/api.js';

// Layout & Common
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { AuthPage } from './pages/AuthPage.js';
import { NoticesPage } from './pages/common/NoticesPage.js';
import { ComplaintsPage } from './pages/common/ComplaintsPage.js';
import { MessagesPage } from './pages/common/MessagesPage.js';
import { ProfileSettingsPage } from './pages/common/ProfileSettingsPage.js';
import { ProjectDetailsModal } from './pages/common/ProjectDetailsModal.js';
import { RubricEvaluatorModal } from './components/RubricEvaluatorModal.js';

// Student
import { StudentDashboard } from './pages/student/StudentDashboard.js';
import { MyPortfolio } from './pages/student/MyPortfolio.js';
import { FindProjects } from './pages/student/FindProjects.js';
import { MyApplications } from './pages/student/MyApplications.js';
import { LearnAndEarn } from './pages/student/LearnAndEarn.js';
import { AcademicAssistant } from './pages/student/AcademicAssistant.js';

// Faculty
import { FacultyDashboard } from './pages/faculty/FacultyDashboard.js';
import { MyStudents } from './pages/faculty/MyStudents.js';
import { AttendanceManager } from './pages/faculty/AttendanceManager.js';
import { ProjectReviews } from './pages/faculty/ProjectReviews.js';
import { FacultySupervision } from './pages/faculty/FacultySupervision.js';

// Client
import { ClientDashboard } from './pages/client/ClientDashboard.js';
import { IdeaStudio } from './pages/client/IdeaStudio.js';
import { DiscoverProjects } from './pages/client/DiscoverProjects.js';
import { DiscoverServices } from './pages/client/DiscoverServices.js';
import { MyRequests } from './pages/client/MyRequests.js';
import { Purchases } from './pages/client/Purchases.js';

// Admin
import { AdminDashboard } from './pages/admin/AdminDashboard.js';
import { UserManagement } from './pages/admin/UserManagement.js';
import { ProjectModeration } from './pages/admin/ProjectModeration.js';
import { TransactionsPage } from './pages/admin/TransactionsPage.js';
import { SecurityLogs } from './pages/admin/SecurityLogs.js';
import { SettingsPage } from './pages/admin/SettingsPage.js';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(api.getCurrentUser());
  const [currentProfile, setCurrentProfile] = useState<any>(api.getCurrentProfile());

  // Navigation tab & history stack for backward arrow (Section 20)
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [navHistory, setNavHistory] = useState<string[]>(['dashboard']);

  // Modals & Details
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState<Project | null>(null);
  const [evaluatingProject, setEvaluatingProject] = useState<Project | null>(null);
  const [unreadNoticesCount, setUnreadNoticesCount] = useState(0);

  useEffect(() => {
    if (currentUser) {
      api.getNotices(currentUser.role).then(res => {
        if (res.notices) setUnreadNoticesCount(res.notices.length);
      }).catch(err => console.error(err));
    }
  }, [currentUser]);

  const handleAuthSuccess = (user: User, profile: any) => {
    setCurrentUser(user);
    setCurrentProfile(profile);
    setActiveTab('dashboard');
    setNavHistory(['dashboard']);
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setCurrentProfile(null);
    setActiveTab('dashboard');
    setNavHistory(['dashboard']);
  };

  const handleTabChange = (newTab: string) => {
    if (newTab !== activeTab) {
      setNavHistory(prev => [...prev, newTab]);
      setActiveTab(newTab);
    }
  };

  const handleBack = () => {
    if (navHistory.length > 1) {
      const newHistory = [...navHistory];
      newHistory.pop(); // Remove current
      const previous = newHistory[newHistory.length - 1];
      setNavHistory(newHistory);
      setActiveTab(previous);
    } else {
      setActiveTab('dashboard');
    }
  };

  // If unauthenticated, render the authentication entry interface directly (Section 4)
  if (!currentUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  const role = currentUser.role;
  const isInnerPage = activeTab !== 'dashboard';

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return `${role.toUpperCase()} PORTAL DASHBOARD`;
      case 'portfolio':
        return 'MY CAPSTONE PORTFOLIO';
      case 'learn-and-earn':
        return 'LEARN & EARN MICRO-FREELANCING';
      case 'academic-assistant':
        return 'AI ACADEMIC & SYLLABUS MENTOR';
      case 'find-projects':
      case 'discover-projects':
        return 'APPROVED PROJECT MARKETPLACE';
      case 'discover-services':
        return 'POLYTECHNIC TALENT & SERVICE CATALOG';
      case 'applications':
        return 'MY PROJECT APPLICATIONS';
      case 'messages':
        return 'PROJECT COMMUNICATIONS';
      case 'notices':
        return 'INSTITUTIONAL NOTICES & CIRCULARS';
      case 'complaints':
        return 'GRIEVANCE REDRESSAL';
      case 'profile':
        return 'PROFILE & SETTINGS';
      case 'my-students':
        return 'MY STUDENTS DIRECTORY';
      case 'attendance':
        return 'ATTENDANCE MANAGEMENT';
      case 'project-reviews':
        return 'PROJECT REVIEWS & RUBRIC EVALUATION';
      case 'supervision':
        return 'FACULTY WORKLOAD SUPERVISION';
      case 'idea-studio':
        return 'CLIENT IDEA STUDIO';
      case 'my-requests':
        return 'MY SUBMITTED PROJECT IDEAS';
      case 'purchases':
        return 'PURCHASED LICENSES & DELIVERABLES';
      case 'user-management':
        return 'INSTITUTIONAL USER GOVERNANCE';
      case 'project-moderation':
        return 'PROJECT MODERATION';
      case 'transactions':
        return 'TRANSACTIONS & LICENSING LEDGER';
      case 'security-logs':
        return 'SECURITY AUDIT LOGS';
      case 'settings':
        return 'INSTITUTIONAL BRANCH MANAGEMENT';
      default:
        return 'ALWAR POLYTECHNIC';
    }
  };

  const renderContent = () => {
    // 1. Student routes
    if (role === 'student') {
      switch (activeTab) {
        case 'dashboard':
          return (
            <StudentDashboard
              user={currentUser}
              profile={currentProfile as StudentProfile}
              onNavigate={handleTabChange}
              onOpenProjectDetails={setSelectedProjectForDetails}
            />
          );
        case 'portfolio':
          return (
            <MyPortfolio
              user={currentUser}
              profile={currentProfile as StudentProfile}
              onOpenProjectDetails={setSelectedProjectForDetails}
              onProfileUpdated={(updated) => setCurrentProfile(updated)}
            />
          );
        case 'learn-and-earn':
          return <LearnAndEarn user={currentUser} profile={currentProfile as StudentProfile} />;
        case 'academic-assistant':
          return <AcademicAssistant user={currentUser} profile={currentProfile as StudentProfile} />;
        case 'find-projects':
          return <FindProjects onOpenProjectDetails={setSelectedProjectForDetails} />;
        case 'applications':
          return <MyApplications user={currentUser} profile={currentProfile as StudentProfile} />;
        case 'messages':
          return <MessagesPage user={currentUser} />;
        case 'notices':
          return <NoticesPage user={currentUser} />;
        case 'complaints':
          return <ComplaintsPage user={currentUser} />;
        case 'profile':
          return <ProfileSettingsPage user={currentUser} profile={currentProfile} onLogout={handleLogout} />;
        default:
          return (
            <StudentDashboard
              user={currentUser}
              profile={currentProfile as StudentProfile}
              onNavigate={handleTabChange}
              onOpenProjectDetails={setSelectedProjectForDetails}
            />
          );
      }
    }

    // 2. Faculty routes
    if (role === 'faculty') {
      switch (activeTab) {
        case 'dashboard':
          return (
            <FacultyDashboard
              user={currentUser}
              profile={currentProfile as FacultyProfile}
              onNavigate={handleTabChange}
              onOpenProjectDetails={setSelectedProjectForDetails}
            />
          );
        case 'my-students':
          return <MyStudents user={currentUser} profile={currentProfile as FacultyProfile} />;
        case 'attendance':
          return <AttendanceManager user={currentUser} profile={currentProfile as FacultyProfile} />;
        case 'project-reviews':
          return (
            <ProjectReviews
              user={currentUser}
              profile={currentProfile as FacultyProfile}
              onOpenProjectDetails={setSelectedProjectForDetails}
            />
          );
        case 'supervision':
          return <FacultySupervision user={currentUser} profile={currentProfile as FacultyProfile} />;
        case 'notices':
          return <NoticesPage user={currentUser} />;
        case 'profile':
          return <ProfileSettingsPage user={currentUser} profile={currentProfile} onLogout={handleLogout} />;
        default:
          return (
            <FacultyDashboard
              user={currentUser}
              profile={currentProfile as FacultyProfile}
              onNavigate={handleTabChange}
              onOpenProjectDetails={setSelectedProjectForDetails}
            />
          );
      }
    }

    // 3. Client routes
    if (role === 'client') {
      switch (activeTab) {
        case 'dashboard':
          return (
            <ClientDashboard
              user={currentUser}
              profile={currentProfile as ClientProfile}
              onNavigate={handleTabChange}
              onOpenProjectDetails={setSelectedProjectForDetails}
            />
          );
        case 'discover-services':
          return (
            <DiscoverServices
              user={currentUser}
              profile={currentProfile as ClientProfile}
              onNavigateToPurchases={() => handleTabChange('purchases')}
              onOpenMessage={() => handleTabChange('messages')}
            />
          );
        case 'idea-studio':
          return (
            <IdeaStudio
              user={currentUser}
              profile={currentProfile as ClientProfile}
              onNavigateToRequests={() => handleTabChange('my-requests')}
            />
          );
        case 'discover-projects':
          return (
            <DiscoverProjects
              user={currentUser}
              profile={currentProfile as ClientProfile}
              onOpenProjectDetails={setSelectedProjectForDetails}
              onProjectPurchased={() => handleTabChange('purchases')}
            />
          );
        case 'my-requests':
          return (
            <MyRequests
              user={currentUser}
              profile={currentProfile as ClientProfile}
              onNavigateToStudio={() => handleTabChange('idea-studio')}
            />
          );
        case 'purchases':
          return <Purchases user={currentUser} profile={currentProfile as ClientProfile} />;
        case 'messages':
          return <MessagesPage user={currentUser} />;
        case 'profile':
          return <ProfileSettingsPage user={currentUser} profile={currentProfile} onLogout={handleLogout} />;
        default:
          return (
            <ClientDashboard
              user={currentUser}
              profile={currentProfile as ClientProfile}
              onNavigate={handleTabChange}
              onOpenProjectDetails={setSelectedProjectForDetails}
            />
          );
      }
    }

    // 4. Admin routes
    if (role === 'admin') {
      switch (activeTab) {
        case 'dashboard':
          return <AdminDashboard user={currentUser} onNavigate={handleTabChange} />;
        case 'user-management':
          return <UserManagement />;
        case 'project-moderation':
          return <ProjectModeration onOpenProjectDetails={setSelectedProjectForDetails} />;
        case 'notices':
          return <NoticesPage user={currentUser} />;
        case 'complaints':
          return <ComplaintsPage user={currentUser} />;
        case 'transactions':
          return <TransactionsPage />;
        case 'security-logs':
          return <SecurityLogs />;
        case 'settings':
          return <SettingsPage />;
        default:
          return <AdminDashboard user={currentUser} onNavigate={handleTabChange} />;
      }
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-[#070F1E] text-slate-100 flex flex-col selection:bg-[#00D4F5] selection:text-[#0B192C]">
      {/* Top Header with Working Backward Arrow (Section 20) */}
      <Header
        user={currentUser}
        title={getPageTitle()}
        subtitle="Alwar Polytechnic • Student Talent Management Portal"
        showBackArrow={isInnerPage}
        onBack={handleBack}
        onLogout={handleLogout}
        unreadNoticesCount={unreadNoticesCount}
        onOpenNotices={() => handleTabChange('notices')}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Role-Specific Sidebar */}
        <Sidebar
          role={role}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Global Project Details Modal */}
      {selectedProjectForDetails && (
        <ProjectDetailsModal
          project={selectedProjectForDetails}
          currentUser={currentUser}
          onClose={() => setSelectedProjectForDetails(null)}
          onOpenRubricEvaluator={(proj) => {
            setSelectedProjectForDetails(null);
            setEvaluatingProject(proj);
          }}
          onPurchase={(proj) => {
            setSelectedProjectForDetails(null);
            handleTabChange('discover-projects');
          }}
        />
      )}

      {/* Global Rubric Evaluator Modal */}
      {evaluatingProject && (
        <RubricEvaluatorModal
          project={evaluatingProject}
          onClose={() => setEvaluatingProject(null)}
          onSaveSuccess={() => {
            setEvaluatingProject(null);
            handleTabChange('project-reviews');
          }}
        />
      )}
    </div>
  );
}

export default App;
