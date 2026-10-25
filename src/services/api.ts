import {
  User,
  StudentProfile,
  FacultyProfile,
  ClientProfile,
  Branch,
  Project,
  RubricEvaluation,
  RubricTemplate,
  AttendanceRecord,
  ClientIdea,
  Notice,
  Complaint,
  Purchase,
  Message,
  AuditLog,
  ServiceListing,
  ServiceOrder,
  StudyPlan,
  AcademicPerformanceInsight,
  AcademicAssessment
} from '../types/index.js';

const AUTH_USER_KEY = 'alwar_portal_user';
const AUTH_PROFILE_KEY = 'alwar_portal_profile';
const AUTH_TOKEN_KEY = 'alwar_portal_token';

class ApiService {
  private token: string | null = null;
  private currentUser: User | null = null;
  private currentProfile: any = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedUser = localStorage.getItem(AUTH_USER_KEY);
      const storedProfile = localStorage.getItem(AUTH_PROFILE_KEY);
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      if (storedUser) this.currentUser = JSON.parse(storedUser);
      if (storedProfile) this.currentProfile = JSON.parse(storedProfile);
      if (storedToken) this.token = storedToken;
    } catch (e) {
      console.error('Error loading stored auth:', e);
    }
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public getCurrentProfile(): StudentProfile | FacultyProfile | ClientProfile | null {
    return this.currentProfile;
  }

  public setAuth(user: User | null, profile: any = null, token: string | null = null) {
    this.currentUser = user;
    this.currentProfile = profile;
    this.token = token;

    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      if (profile) localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(profile));
      if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_PROFILE_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(endpoint, {
      ...options,
      headers
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.error(`Expected JSON but received ${contentType} from ${endpoint}:`, text.slice(0, 100));
      throw new Error(`API communication error: Expected JSON response from ${endpoint}, but server returned ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: Failed to process request`);
    }

    return data;
  }

  // Auth APIs
  async getDemoAccounts() {
    return this.request<{ success: boolean; accounts: any[] }>('/api/auth/demo-accounts');
  }

  async login(credentials: { email: string; password: string }) {
    const res = await this.request<{ success: boolean; user: User; profile: any; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    this.setAuth(res.user, res.profile, res.token);
    return res;
  }

  async register(data: any) {
    const res = await this.request<{ success: boolean; user: User; profile: any; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res.user.status === 'active') {
      this.setAuth(res.user, res.profile, `token-${res.user.id}`);
    }
    return res;
  }

  logout() {
    this.setAuth(null, null, null);
  }

  // Branches
  async getBranches() {
    return this.request<{ success: boolean; branches: Branch[] }>('/api/branches');
  }

  async createBranch(data: Partial<Branch>) {
    return this.request<{ success: boolean; branch: Branch }>('/api/branches', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateBranch(id: string, data: Partial<Branch>) {
    return this.request<{ success: boolean; branch: Branch }>(`/api/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Students & Faculty Management
  async getStudents(filters?: { branchId?: string; semester?: number; batch?: string; search?: string }) {
    const params = new URLSearchParams();
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.semester) params.append('semester', String(filters.semester));
    if (filters?.batch) params.append('batch', filters.batch);
    if (filters?.search) params.append('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ success: boolean; students: any[] }>(`/api/students${query}`);
  }

  async getStudentDetails(id: string) {
    return this.request<{ success: boolean; student: any }>(`/api/students/${id}`);
  }

  async addStudent(data: { name: string; pin: string; email?: string; branchId: string; semester: number; batch: string; cgpa?: number }) {
    return this.request<{ success: boolean; student: any; message: string }>('/api/students', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateStudentProfile(id: string, data: Partial<StudentProfile>) {
    const res = await this.request<{ success: boolean; profile: StudentProfile }>(`/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (this.currentProfile && this.currentProfile.id === id) {
      this.currentProfile = res.profile;
      localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(res.profile));
    }
    return res;
  }

  // Attendance
  async getAttendance(filters?: { branchId?: string; semester?: number; batch?: string; date?: string; studentId?: string }) {
    const params = new URLSearchParams();
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.semester) params.append('semester', String(filters.semester));
    if (filters?.batch) params.append('batch', filters.batch);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.studentId) params.append('studentId', filters.studentId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ success: boolean; records: AttendanceRecord[] }>(`/api/attendance${query}`);
  }

  async saveAttendance(data: { branchId: string; semester: number; batch: string; date: string; records: any[]; facultyId?: string }) {
    return this.request<{ success: boolean; message: string }>('/api/attendance', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Projects & Direct Video Upload
  async getProjects(filters?: { branchId?: string; studentId?: string; status?: string; visibility?: string; search?: string }) {
    const params = new URLSearchParams();
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.visibility) params.append('visibility', filters.visibility);
    if (filters?.search) params.append('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ success: boolean; projects: Project[] }>(`/api/projects${query}`);
  }

  async getProjectDetails(id: string) {
    return this.request<{ success: boolean; project: Project; evaluation?: RubricEvaluation; reviews: any[] }>(`/api/projects/${id}`);
  }

  async createProject(data: any) {
    return this.request<{ success: boolean; project: Project }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateProject(id: string, data: Partial<Project>) {
    return this.request<{ success: boolean; project: Project }>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async submitProjectForReview(id: string) {
    return this.request<{ success: boolean; project: Project; message: string }>(`/api/projects/${id}/submit`, {
      method: 'POST'
    });
  }

  // Direct Video Upload with simulated progress updates
  async uploadVideoFile(file: File, onProgress?: (pct: number) => void): Promise<{ videoUrl: string; videoFileName: string; videoSize: number }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('video', file);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (err) {
            reject(new Error('Invalid response from video upload server.'));
          }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            reject(new Error(errData.error || 'Video upload failed.'));
          } catch {
            reject(new Error(`Upload failed with HTTP status ${xhr.status}.`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during video upload. Please check connection.'));
      });

      xhr.open('POST', '/api/upload/video');
      xhr.send(formData);
    });
  }

  // Rubrics
  async getRubricTemplates() {
    return this.request<{ success: boolean; templates: RubricTemplate[] }>('/api/rubrics/templates');
  }

  async submitRubricEvaluation(data: {
    projectId: string;
    rubricTemplateId: string;
    evaluatorFacultyId: string;
    evaluatorName: string;
    criterionScores: { criterionId: string; criterionName: string; weight: number; score: number; comment: string }[];
    overallFeedback: string;
    recommendation: 'approve' | 'revise' | 'reject';
    publishedToStudent: boolean;
  }) {
    return this.request<{ success: boolean; evaluation: RubricEvaluation; projectStatus: string; message: string }>('/api/rubrics/evaluate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Client Idea Studio
  async getClientIdeas(clientId?: string) {
    const query = clientId ? `?clientId=${clientId}` : '';
    return this.request<{ success: boolean; ideas: ClientIdea[] }>(`/api/ideas${query}`);
  }

  async submitClientIdea(data: any) {
    return this.request<{ success: boolean; idea: ClientIdea; message: string }>('/api/ideas', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateClientIdea(id: string, data: any) {
    return this.request<{ success: boolean; idea: ClientIdea }>(`/api/ideas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async analyzeIdeaWithAI(description: string) {
    return this.request<{ success: boolean; analysis: any; isFallback?: boolean }>('/api/ideas/analyze', {
      method: 'POST',
      body: JSON.stringify({ description })
    });
  }

  // Purchases
  async getPurchases(clientId?: string, studentId?: string) {
    const params = new URLSearchParams();
    if (clientId) params.append('clientId', clientId);
    if (studentId) params.append('studentId', studentId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ success: boolean; purchases: Purchase[] }>(`/api/purchases${query}`);
  }

  async createPurchase(data: { projectId: string; clientId: string; clientName: string; clientOrganization: string }) {
    return this.request<{ success: boolean; purchase: Purchase; message: string }>('/api/purchases', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Notices
  async getNotices(role?: string) {
    const query = role ? `?role=${role}` : '';
    return this.request<{ success: boolean; notices: Notice[] }>(`/api/notices${query}`);
  }

  async createNotice(data: Partial<Notice>) {
    return this.request<{ success: boolean; notice: Notice }>('/api/notices', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deleteNotice(id: string) {
    return this.request<{ success: boolean; message: string }>(`/api/notices/${id}`, {
      method: 'DELETE'
    });
  }

  // Complaints
  async getComplaints(userId?: string, role?: string) {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (role) params.append('role', role);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ success: boolean; complaints: Complaint[] }>(`/api/complaints${query}`);
  }

  async submitComplaint(data: Partial<Complaint>) {
    return this.request<{ success: boolean; complaint: Complaint; message: string }>('/api/complaints', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async resolveComplaint(id: string, resolutionNote: string, resolvedBy: string) {
    return this.request<{ success: boolean; complaint: Complaint; message: string }>(`/api/complaints/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolutionNote, resolvedBy })
    });
  }

  // Messages
  async getMessages(userId?: string) {
    const query = userId ? `?userId=${userId}` : '';
    return this.request<{ success: boolean; messages: Message[] }>(`/api/messages${query}`);
  }

  async sendMessage(data: Partial<Message>) {
    return this.request<{ success: boolean; message: Message }>('/api/messages', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Admin
  async getAdminStats() {
    return this.request<{ success: boolean; stats: any }>('/api/admin/stats');
  }

  async getAdminUsers() {
    return this.request<{ success: boolean; users: any[] }>('/api/admin/users');
  }

  async updateUserStatus(id: string, status: 'active' | 'pending_approval' | 'suspended') {
    return this.request<{ success: boolean; user: any; message: string }>(`/api/admin/users/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  }

  async getAdminLogs() {
    return this.request<{ success: boolean; logs: AuditLog[] }>('/api/admin/logs');
  }

  // AI Assistants
  async suggestRubricFeedback(data: { projectTitle: string; problemStatement: string; criterionName: string; score: number }) {
    return this.request<{ success: boolean; suggestion: string }>('/api/ai/rubric-suggest', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getVivaQuestions(projectTitle: string, techStack: string[]) {
    return this.request<{ success: boolean; questions: { q: string; hint: string }[] }>('/api/ai/viva-prep', {
      method: 'POST',
      body: JSON.stringify({ projectTitle, techStack })
    });
  }

  async searchTechTrends(topic: string) {
    return this.request<{ success: boolean; trends: string }>('/api/ai/search-trends', {
      method: 'POST',
      body: JSON.stringify({ topic })
    });
  }

  // Marketplace (Learn and Earn)
  async getMarketplaceServices(filters?: { studentId?: string; branchId?: string; search?: string; status?: string }) {
    const params = new URLSearchParams();
    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ success: boolean; services: ServiceListing[] }>(`/api/marketplace/services${query}`);
  }

  async createMarketplaceService(data: Partial<ServiceListing>) {
    return this.request<{ success: boolean; service: ServiceListing }>('/api/marketplace/services', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateMarketplaceService(id: string, data: Partial<ServiceListing>) {
    return this.request<{ success: boolean; service: ServiceListing }>(`/api/marketplace/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteMarketplaceService(id: string) {
    return this.request<{ success: boolean; message: string }>(`/api/marketplace/services/${id}`, {
      method: 'DELETE'
    });
  }

  async getMarketplaceOrders(filters?: { studentId?: string; clientId?: string; status?: string }) {
    const params = new URLSearchParams();
    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.status) params.append('status', filters.status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ success: boolean; orders: ServiceOrder[] }>(`/api/marketplace/orders${query}`);
  }

  async createMarketplaceOrder(data: { serviceId: string; clientId: string; clientName: string; clientOrganization?: string; scopeDetails: string; deadline?: string }) {
    return this.request<{ success: boolean; order: ServiceOrder }>('/api/marketplace/orders', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateOrderStatus(id: string, data: { status?: string; deliverableNotes?: string; deliverableFiles?: string[]; feedbackRating?: number; feedbackReview?: string }) {
    return this.request<{ success: boolean; order: ServiceOrder }>(`/api/marketplace/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async updateOrderPayment(id: string, paymentStatus: 'verified_demo' | 'completed' | 'pending') {
    return this.request<{ success: boolean; order: ServiceOrder }>(`/api/marketplace/orders/${id}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentStatus })
    });
  }

  // AI Talent Identification & Recommendations
  async getTalentRecommendations(params: { studentId?: string; projectId?: string; ideaId?: string; skills?: string }) {
    const searchParams = new URLSearchParams();
    if (params.studentId) searchParams.append('studentId', params.studentId);
    if (params.projectId) searchParams.append('projectId', params.projectId);
    if (params.ideaId) searchParams.append('ideaId', params.ideaId);
    if (params.skills) searchParams.append('skills', params.skills);
    return this.request<{
      success: boolean;
      studentName?: string;
      verifiedSkills?: string[];
      projectRecommendations?: any[];
      clientIdeaRecommendations?: any[];
      candidates?: any[];
    }>(`/api/talent/recommendations?${searchParams.toString()}`);
  }

  async getMatchAnalysis(data: { studentId: string; projectTitle: string; requiredSkills: string[] }) {
    return this.request<{
      success: boolean;
      matchPercentage: number;
      matchRationale: string;
      skillGaps: string[];
      learningRoadmap: { step: string; recommendedActivity: string; estimatedDays: number }[];
      isFallback?: boolean;
    }>('/api/talent/match-analysis', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // AI Academic Assistant Chat
  async sendAcademicChat(data: { message: string; conversationHistory?: { role: string; text: string }[]; studentContext?: any }) {
    return this.request<{ success: boolean; reply: string; isFallback?: boolean }>('/api/ai/academic-chat', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Academic Performance & Study Plans
  async getAcademicInsights(studentId: string) {
    return this.request<{ success: boolean; insights: AcademicPerformanceInsight }>(`/api/academic/insights/${studentId}`);
  }

  async getStudyPlan(studentId: string) {
    return this.request<{ success: boolean; plan: StudyPlan | null }>(`/api/study-plans/${studentId}`);
  }

  async generateStudyPlan(data: { studentId: string; branchName: string; semester: number; weakTopics: string[]; examTargetDate: string }) {
    return this.request<{ success: boolean; plan: StudyPlan; isFallback?: boolean }>('/api/study-plans/generate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async saveStudyPlan(plan: StudyPlan) {
    return this.request<{ success: boolean; message: string; plan: StudyPlan }>('/api/study-plans/save', {
      method: 'POST',
      body: JSON.stringify({ plan })
    });
  }

  // Faculty Supervision
  async getSupervisionStudents(branchId?: string) {
    const query = branchId ? `?branchId=${branchId}` : '';
    return this.request<{ success: boolean; students: any[] }>(`/api/supervision/students${query}`);
  }

  // Message Reporting & Moderation
  async reportMessage(id: string, reason: string, reportedBy?: string) {
    return this.request<{ success: boolean; message: string }>(`/api/messages/${id}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason, reportedBy })
    });
  }

  async getFlaggedMessages() {
    return this.request<{ success: boolean; flaggedMessages: Message[] }>('/api/moderation/flagged');
  }
}

export const api = new ApiService();
