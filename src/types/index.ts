export type UserRole = 'student' | 'faculty' | 'client' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: 'active' | 'pending_approval' | 'suspended';
  avatarUrl?: string;
  passwordHash?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
  headOfDepartment: string;
  semesterCount: number;
}

export interface SkillItem {
  name: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  verified?: boolean;
  isVerified?: boolean;
  proficiency?: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  name?: string;
  pin: string;
  branchId: string;
  branchName: string;
  semester: number;
  batch: string;
  cgpa?: number;
  skills: SkillItem[];
  bio: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioVisibility: 'public' | 'institutional' | 'private';
  interests?: string[];
  certifications?: string[];
  freelanceAvailability?: 'available' | 'busy' | 'not_taking_orders';
  portfolioProjects?: any[];
}

export interface FacultyProfile {
  id: string;
  userId: string;
  name?: string;
  employeeId: string;
  branchId: string;
  branchName: string;
  designation: string;
  qualification: string;
  assignedBatches: string[];
  approvalStatus: 'approved' | 'pending';
}

export interface ClientProfile {
  id: string;
  userId: string;
  name?: string;
  organization: string;
  contactNumber?: string;
  industry: string;
  verified: boolean;
}

export interface AttendanceRecord {
  id: string;
  branchId: string;
  branchName: string;
  semester: number;
  batch: string;
  date: string;
  studentId: string;
  studentPin: string;
  studentName: string;
  status: 'present' | 'absent' | 'late';
  recordedByFacultyId: string;
  remarks?: string;
}

export interface AcademicAssessment {
  id: string;
  studentId: string;
  studentPin: string;
  subjectCode: string;
  subjectName: string;
  subject?: string;
  semester: number;
  internalScore: number; // max 30
  midTermScore: number;  // max 30
  practicalScore: number;// max 40
  totalScore: number;    // max 100
  score?: number;
  maxScore?: number;
  recordedByFacultyId: string;
  remarks?: string;
  assessmentDate: string;
}

export interface Project {
  id: string;
  title: string;
  shortDescription: string;
  problemStatement: string;
  proposedSolution: string;
  techStack: string[];
  skills: string[];
  branchId: string;
  branchName: string;
  department?: string;
  studentId: string;
  studentName: string;
  studentPin: string;
  teamMembers: { name: string; pin: string; role: string }[];
  visibility: 'public' | 'institutional' | 'private';
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'changes_requested';
  price: number;
  licenseType: 'MIT' | 'Academic' | 'Commercial' | 'Proprietary';
  videoUrl?: string;
  videoFileName?: string;
  videoSize?: number;
  documentUrls: { name: string; url: string; size?: number }[];
  createdAt: string;
  updatedAt: string;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  maxScore: number;
}

export interface RubricTemplate {
  id: string;
  name: string;
  branchId?: string;
  branchName?: string;
  criteria: RubricCriterion[];
  isDefault: boolean;
  createdBy: string;
}

export interface CriterionEvaluation {
  criterionId: string;
  criterionName: string;
  weight: number;
  score: number;
  comment: string;
}

export interface RubricEvaluation {
  id: string;
  projectId: string;
  projectTitle: string;
  studentId: string;
  rubricTemplateId: string;
  evaluatorFacultyId: string;
  evaluatorName: string;
  criterionScores: CriterionEvaluation[];
  totalScore: number;
  overallFeedback: string;
  recommendation: 'approve' | 'revise' | 'reject';
  publishedToStudent: boolean;
  evaluatedAt: string;
}

export interface ProjectReview {
  id: string;
  projectId: string;
  facultyId?: string;
  facultyName?: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewerRole?: 'faculty' | 'client' | 'admin';
  rating?: number;
  status?: string;
  comments: string;
  rubricEvaluationId?: string;
  reviewedAt?: string;
  createdAt?: string;
}

export interface ClientIdea {
  id: string;
  clientId: string;
  clientName: string;
  organization: string;
  title: string;
  description: string;
  documentUrl?: string;
  documentName?: string;
  targetBranch?: string;
  estimatedBudget?: string;
  aiAnalysis?: {
    summary: string;
    suggestedFeatures: string[];
    suggestedTechStack: string[];
    clarifyingQuestions: string[];
    feasibilityRating: string;
    suggestedBranches: string[];
  };
  status: 'draft' | 'submitted' | 'matched' | 'in_progress';
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------------
// Learn and Earn Micro-Freelancing Marketplace Models
// -------------------------------------------------------------------

export interface ServiceListing {
  id: string;
  studentId: string;
  studentName: string;
  studentPin: string;
  branchId: string;
  branchName: string;
  title: string;
  description: string;
  skills: string[];
  price: number;
  deliveryDays: number;
  portfolioSamples: { title: string; url?: string; description?: string }[];
  rating: number;
  reviewCount: number;
  status: 'active' | 'paused';
  createdAt: string;
}

export type ServiceOrderStatus =
  | 'requested'
  | 'accepted'
  | 'in_progress'
  | 'submitted'
  | 'revision_requested'
  | 'completed'
  | 'cancelled';

export interface ServiceOrder {
  id: string;
  orderNumber: string;
  serviceId: string;
  serviceTitle: string;
  studentId: string;
  studentName: string;
  studentPin: string;
  clientId: string;
  clientName: string;
  clientOrganization: string;
  amount: number;
  scopeDetails: string;
  deadline: string;
  status: ServiceOrderStatus;
  deliverableNotes?: string;
  deliverableFiles?: string[];
  feedbackRating?: number;
  feedbackReview?: string;
  paymentStatus: 'pending' | 'verified_demo' | 'completed';
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------------
// AI Study Plan & Performance Insights Models
// -------------------------------------------------------------------

export interface DayStudySchedule {
  day: string;
  focusSubject: string;
  hours: number;
  tasks: string[];
}

export interface StudyPlan {
  id: string;
  studentId: string;
  branchName: string;
  semester: number;
  weeklySchedule: DayStudySchedule[];
  examTargetDate: string;
  weakTopics: string[];
  totalWeeklyHours: number;
  generatedByAi: boolean;
  savedAt: string;
}

export interface AcademicPerformanceInsight {
  studentId: string;
  calculatedAt: string;
  attendancePercentage: number;
  attendanceWarning: boolean;
  upcomingDeadlines: { title: string; date: string; type: string }[];
  weakSubjects: { subject: string; score: number; reason: string }[];
  strongSubjects: { subject: string; score: number }[];
  overallStanding: string;
  suggestedPriorities: string[];
  isAiAssisted: boolean;
}

// -------------------------------------------------------------------
// Messaging with Inappropriate-Message Moderation
// -------------------------------------------------------------------

export type ModerationStatus = 'no_issue' | 'potentially_inappropriate' | 'requires_human_review';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId: string;
  receiverName: string;
  projectId?: string;
  projectTitle?: string;
  orderId?: string;
  content: string;
  read: boolean;
  moderationStatus?: ModerationStatus;
  moderationReason?: string;
  reportedBy?: string;
  reportedReason?: string;
  createdAt: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  priority: 'urgent' | 'high' | 'normal';
  targetRoles: ('all' | 'student' | 'faculty' | 'client')[];
  branchId?: string;
  branchName?: string;
  createdBy: string;
  authorName: string;
  authorRole: string;
  publishedAt: string;
  updatedAt: string;
}

export interface Complaint {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userRole: string;
  userEmail: string;
  category: 'academic' | 'facility' | 'evaluation' | 'harassment' | 'technical' | 'other';
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved';
  resolutionNote?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Purchase {
  id: string;
  orderNumber: string;
  projectId: string;
  projectTitle: string;
  studentId: string;
  studentName: string;
  studentPin: string;
  clientId: string;
  clientName: string;
  clientOrganization: string;
  amount: number;
  licenseType: string;
  status: 'completed' | 'licensed' | 'pending';
  licenseKey: string;
  downloadUrl: string;
  deliverableFiles: string[];
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  details: string;
  timestamp: string;
}
