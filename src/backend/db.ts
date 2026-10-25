import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import {
  User,
  Branch,
  StudentProfile,
  FacultyProfile,
  ClientProfile,
  AttendanceRecord,
  AcademicAssessment,
  Project,
  RubricCriterion,
  RubricTemplate,
  CriterionEvaluation,
  RubricEvaluation,
  ProjectReview,
  ClientIdea,
  ServiceListing,
  ServiceOrder,
  StudyPlan,
  Message,
  Notice,
  Complaint,
  Purchase,
  AuditLog
} from '../types/index.js';

export type {
  User,
  Branch,
  StudentProfile,
  FacultyProfile,
  ClientProfile,
  AttendanceRecord,
  AcademicAssessment,
  Project,
  RubricCriterion,
  RubricTemplate,
  CriterionEvaluation,
  RubricEvaluation,
  ProjectReview,
  ClientIdea,
  ServiceListing,
  ServiceOrder,
  StudyPlan,
  Message,
  Notice,
  Complaint,
  Purchase,
  AuditLog
};
export type { ModerationStatus, AcademicPerformanceInsight } from '../types/index.js';

export interface DatabaseSchema {
  users: User[];
  branches: Branch[];
  studentProfiles: StudentProfile[];
  facultyProfiles: FacultyProfile[];
  clientProfiles: ClientProfile[];
  attendanceRecords: AttendanceRecord[];
  academicAssessments: AcademicAssessment[];
  projects: Project[];
  rubricTemplates: RubricTemplate[];
  rubricEvaluations: RubricEvaluation[];
  projectReviews: ProjectReview[];
  clientIdeas: ClientIdea[];
  serviceListings: ServiceListing[];
  serviceOrders: ServiceOrder[];
  studyPlans: StudyPlan[];
  messages: Message[];
  notices: Notice[];
  complaints: Complaint[];
  purchases: Purchase[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'portal_database.json');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const VIDEOS_DIR = path.join(UPLOADS_DIR, 'videos');
const DOCS_DIR = path.join(UPLOADS_DIR, 'docs');

export function hashPassword(password: string): string {
  const salt = 'alwar_polytechnic_salt_2026';
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectories();
    this.data = this.load();
    this.seedDefaults();
  }

  private ensureDirectories() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(VIDEOS_DIR)) {
      fs.mkdirSync(VIDEOS_DIR, { recursive: true });
    }
    if (!fs.existsSync(DOCS_DIR)) {
      fs.mkdirSync(DOCS_DIR, { recursive: true });
    }
  }

  private load(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure new arrays exist
        parsed.serviceListings = parsed.serviceListings || [];
        parsed.serviceOrders = parsed.serviceOrders || [];
        parsed.studyPlans = parsed.studyPlans || [];
        parsed.academicAssessments = parsed.academicAssessments || [];
        return parsed;
      } catch (err) {
        console.error('Failed to parse database file, reinitializing', err);
      }
    }
    return this.createEmptySchema();
  }

  private createEmptySchema(): DatabaseSchema {
    return {
      users: [],
      branches: [],
      studentProfiles: [],
      facultyProfiles: [],
      clientProfiles: [],
      attendanceRecords: [],
      academicAssessments: [],
      projects: [],
      rubricTemplates: [],
      rubricEvaluations: [],
      projectReviews: [],
      clientIdeas: [],
      serviceListings: [],
      serviceOrders: [],
      studyPlans: [],
      messages: [],
      notices: [],
      complaints: [],
      purchases: [],
      auditLogs: []
    };
  }

  public save() {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Failed to save database:', err);
    }
  }

  public getRawData(): DatabaseSchema {
    return this.data;
  }

  private seedDefaults() {
    let modified = false;

    // 1. Seed Branches (All departments of Alwar Polytechnic)
    const initialBranches: Branch[] = [
      {
        id: 'branch-cse',
        code: 'CSE',
        name: 'Computer Science & Engineering',
        description: 'Focuses on software engineering, AI, systems, and networked platforms.',
        active: true,
        headOfDepartment: 'Dr. Rajesh Sharma',
        semesterCount: 6
      },
      {
        id: 'branch-me',
        code: 'ME',
        name: 'Mechanical Engineering',
        description: 'Covers thermodynamics, CNC machining, robotics, and industrial fabrication.',
        active: true,
        headOfDepartment: 'Prof. Vikram Singh',
        semesterCount: 6
      },
      {
        id: 'branch-ce',
        code: 'CE',
        name: 'Civil Engineering',
        description: 'Structural mechanics, surveying, green building design, and smart infrastructure.',
        active: true,
        headOfDepartment: 'Er. Ananya Verma',
        semesterCount: 6
      },
      {
        id: 'branch-ee',
        code: 'EE',
        name: 'Electrical Engineering',
        description: 'Power systems, smart grid automation, EV powertrains, and renewable energy.',
        active: true,
        headOfDepartment: 'Dr. Suresh Kumar',
        semesterCount: 6
      },
      {
        id: 'branch-ece',
        code: 'ECE',
        name: 'Electronics & Communication Engineering',
        description: 'Embedded IoT controllers, telecommunications, signal processing, and VLSI.',
        active: true,
        headOfDepartment: 'Prof. Meenakshi Joshi',
        semesterCount: 6
      },
      {
        id: 'branch-ae',
        code: 'AE',
        name: 'Automobile Engineering',
        description: 'Internal combustion, electric vehicles, vehicle dynamics, and chassis design.',
        active: true,
        headOfDepartment: 'Er. Harpreet Sandhu',
        semesterCount: 6
      },
      {
        id: 'branch-che',
        code: 'CHE',
        name: 'Chemical Engineering',
        description: 'Process engineering, industrial polymers, fluid mechanics, and effluent treatment.',
        active: true,
        headOfDepartment: 'Dr. Ritu Saxena',
        semesterCount: 6
      },
      {
        id: 'branch-it',
        code: 'IT',
        name: 'Information Technology',
        description: 'Cloud computing, enterprise databases, cybersecurity, and web architectures.',
        active: true,
        headOfDepartment: 'Er. Gaurav Mehta',
        semesterCount: 6
      }
    ];

    if (this.data.branches.length === 0) {
      this.data.branches = initialBranches;
      modified = true;
    }

    // 2. Seed Default Rubric Templates
    if (this.data.rubricTemplates.length === 0) {
      this.data.rubricTemplates.push({
        id: 'rubric-polytechnic-standard',
        name: 'Alwar Polytechnic Capstone Engineering Rubric',
        branchName: 'Institutional Universal',
        isDefault: true,
        createdBy: 'Academic Council',
        criteria: [
          {
            id: 'c1',
            name: 'Problem Understanding & Scope',
            description: 'Clarity of the real-world engineering problem and alignment with diploma standards.',
            weight: 15,
            maxScore: 10
          },
          {
            id: 'c2',
            name: 'Functionality & Implementation',
            description: 'Degree of operational completeness, working hardware/software deliverables, and execution.',
            weight: 25,
            maxScore: 10
          },
          {
            id: 'c3',
            name: 'Code/Design Quality & Architecture',
            description: 'Adherence to engineering design standards, code modularity, circuit safety, and robustness.',
            weight: 15,
            maxScore: 10
          },
          {
            id: 'c4',
            name: 'Innovation & Technical Creativity',
            description: 'Novelty in problem-solving, optimization, or ingenious resource utilization.',
            weight: 15,
            maxScore: 10
          },
          {
            id: 'c5',
            name: 'Testing, Validation & Safety',
            description: 'Evidence of systematic testing, error handling, performance benchmarks, and stress testing.',
            weight: 15,
            maxScore: 10
          },
          {
            id: 'c6',
            name: 'Documentation, Presentation & Demo',
            description: 'Technical report quality, diagram accuracy, demonstration video, and viva readiness.',
            weight: 15,
            maxScore: 10
          }
        ]
      });
      modified = true;
    }

    // 3. Seed Mandatory Demo Accounts
    const demoUsers: { user: User; profileType: string; profileData: any }[] = [
      {
        user: {
          id: 'user-student-demo',
          email: 'student.demo@alwarpolytechnic.demo',
          passwordHash: hashPassword('Student@123'),
          role: 'student',
          name: 'Aarav Choudhary',
          status: 'active',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          createdAt: '2026-01-15T09:00:00Z',
          lastLoginAt: '2026-10-25T08:30:00Z'
        },
        profileType: 'student',
        profileData: {
          id: 'sp-aarav',
          userId: 'user-student-demo',
          pin: 'AP-2023-CS-042',
          branchId: 'branch-cse',
          branchName: 'Computer Science & Engineering',
          semester: 5,
          batch: '2023-2026 Batch A',
          cgpa: 8.85,
          skills: [
            { name: 'Embedded C++', level: 'Advanced', verified: true },
            { name: 'React & TypeScript', level: 'Expert', verified: true },
            { name: 'Python IoT Systems', level: 'Advanced', verified: true },
            { name: 'PLC Ladder Logic', level: 'Intermediate', verified: false }
          ],
          bio: 'Final-year Computer Science Diploma student at Alwar Polytechnic. Focused on industrial IoT, smart telemetry, and embedded web micro-controllers.',
          githubUrl: 'https://github.com/aarav-alwar',
          linkedinUrl: 'https://linkedin.com/in/aarav-polytechnic',
          portfolioVisibility: 'public',
          freelanceAvailability: 'available',
          interests: ['Industrial Telemetry', 'Edge AI', 'Microcontroller Firmware', 'Clean Energy Tech']
        }
      },
      {
        user: {
          id: 'user-faculty-demo',
          email: 'faculty.demo@alwarpolytechnic.demo',
          passwordHash: hashPassword('Faculty@123'),
          role: 'faculty',
          name: 'Prof. Devendra Rathore',
          status: 'active',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          createdAt: '2025-08-01T10:00:00Z',
          lastLoginAt: '2026-10-25T08:15:00Z'
        },
        profileType: 'faculty',
        profileData: {
          id: 'fp-devendra',
          userId: 'user-faculty-demo',
          employeeId: 'AP-FAC-108',
          branchId: 'branch-cse',
          branchName: 'Computer Science & Engineering',
          designation: 'Senior Lecturer & Project Coordinator',
          qualification: 'M.Tech (Computer Science & Automation), Ph.D (Pursuing)',
          assignedBatches: ['2023-2026 Batch A', '2023-2026 Batch B'],
          approvalStatus: 'approved'
        }
      },
      {
        user: {
          id: 'user-client-demo',
          email: 'client.demo@alwarpolytechnic.demo',
          passwordHash: hashPassword('Client@123'),
          role: 'client',
          name: 'Kavita Singhal',
          status: 'active',
          avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
          createdAt: '2026-02-10T11:00:00Z',
          lastLoginAt: '2026-10-25T07:45:00Z'
        },
        profileType: 'client',
        profileData: {
          id: 'cp-kavita',
          userId: 'user-client-demo',
          organization: 'Apex Industrial Systems & Automation Ltd.',
          contactNumber: '+91 98290 41234',
          industry: 'Industrial Automation & Smart Manufacturing',
          verified: true
        }
      },
      {
        user: {
          id: 'user-admin-demo',
          email: 'admin.demo@alwarpolytechnic.demo',
          passwordHash: hashPassword('Admin@123'),
          role: 'admin',
          name: 'Chief Administrator Office',
          status: 'active',
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
          createdAt: '2025-01-01T00:00:00Z',
          lastLoginAt: '2026-10-25T09:00:00Z'
        },
        profileType: 'admin',
        profileData: null
      }
    ];

    for (const item of demoUsers) {
      const existingUser = this.data.users.find(u => u.email === item.user.email);
      if (!existingUser) {
        this.data.users.push(item.user);
        if (item.profileType === 'student') {
          this.data.studentProfiles.push(item.profileData);
        } else if (item.profileType === 'faculty') {
          this.data.facultyProfiles.push(item.profileData);
        } else if (item.profileType === 'client') {
          this.data.clientProfiles.push(item.profileData);
        }
        modified = true;
      }
    }

    // 4. Seed extra students for rich directory & talent discovery
    const extraStudents: { user: User; profile: StudentProfile }[] = [
      {
        user: {
          id: 'user-student-2',
          email: 'priya.sharma@student.alwarpolytechnic.ac.in',
          passwordHash: hashPassword('Priya@123'),
          role: 'student',
          name: 'Priya Sharma',
          status: 'active',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
          createdAt: '2026-01-16T10:00:00Z'
        },
        profile: {
          id: 'sp-priya',
          userId: 'user-student-2',
          pin: 'AP-2023-CS-043',
          branchId: 'branch-cse',
          branchName: 'Computer Science & Engineering',
          semester: 5,
          batch: '2023-2026 Batch A',
          cgpa: 9.1,
          skills: [
            { name: 'Python Computer Vision', level: 'Expert', verified: true },
            { name: 'TensorFlow Lite', level: 'Advanced', verified: true },
            { name: 'FastAPI Backend', level: 'Intermediate', verified: false }
          ],
          bio: 'Deep learning and edge computing enthusiast. Developing safety monitoring algorithms for industrial fabrication shops.',
          portfolioVisibility: 'public',
          freelanceAvailability: 'available',
          interests: ['Computer Vision', 'YOLO Edge Detection', 'Industrial Safety']
        }
      },
      {
        user: {
          id: 'user-student-3',
          email: 'rohit.meena@student.alwarpolytechnic.ac.in',
          passwordHash: hashPassword('Rohit@123'),
          role: 'student',
          name: 'Rohit Meena',
          status: 'active',
          avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
          createdAt: '2026-01-18T11:00:00Z'
        },
        profile: {
          id: 'sp-rohit',
          userId: 'user-student-3',
          pin: 'AP-2023-CS-044',
          branchId: 'branch-cse',
          branchName: 'Computer Science & Engineering',
          semester: 5,
          batch: '2023-2026 Batch A',
          cgpa: 7.95,
          skills: [
            { name: 'Database Optimization', level: 'Advanced', verified: true },
            { name: 'Docker & Microservices', level: 'Intermediate', verified: false },
            { name: 'Node.js Express', level: 'Advanced', verified: true }
          ],
          bio: 'Full stack developer focused on institutional database scaling and high-throughput telemetry pipelines.',
          portfolioVisibility: 'public',
          freelanceAvailability: 'busy',
          interests: ['Relational Databases', 'High Performance Telemetry']
        }
      },
      {
        user: {
          id: 'user-student-4',
          email: 'neha.gupta@student.alwarpolytechnic.ac.in',
          passwordHash: hashPassword('Neha@123'),
          role: 'student',
          name: 'Neha Gupta',
          status: 'active',
          avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
          createdAt: '2026-01-20T12:00:00Z'
        },
        profile: {
          id: 'sp-neha',
          userId: 'user-student-4',
          pin: 'AP-2023-ME-012',
          branchId: 'branch-me',
          branchName: 'Mechanical Engineering',
          semester: 5,
          batch: '2023-2026 Batch M1',
          cgpa: 8.6,
          skills: [
            { name: 'SolidWorks CAD', level: 'Expert', verified: true },
            { name: 'ANSYS FEA', level: 'Advanced', verified: true },
            { name: 'CNC G-Code Programming', level: 'Advanced', verified: true }
          ],
          bio: 'Mechanical diploma innovator working on solar hybrid thermal regenerators and lightweight automotive suspension linkages.',
          portfolioVisibility: 'public',
          freelanceAvailability: 'available',
          interests: ['CAD Modeling', 'Solar Thermal Cooling', 'CNC Machining']
        }
      }
    ];

    for (const item of extraStudents) {
      if (!this.data.users.find(u => u.email === item.user.email)) {
        this.data.users.push(item.user);
        this.data.studentProfiles.push(item.profile);
        modified = true;
      }
    }

    // 5. Seed Academic Assessments (for Academic Performance Insights)
    if (this.data.academicAssessments.length === 0) {
      this.data.academicAssessments.push(
        {
          id: 'asm-aarav-cs501',
          studentId: 'user-student-demo',
          studentPin: 'AP-2023-CS-042',
          subjectCode: 'CS-501',
          subjectName: 'Microcontrollers & Embedded Systems',
          semester: 5,
          internalScore: 28,
          midTermScore: 27,
          practicalScore: 38,
          totalScore: 93,
          recordedByFacultyId: 'user-faculty-demo',
          remarks: 'Exceptional firmware optimization and timing accuracy.',
          assessmentDate: '2026-10-10'
        },
        {
          id: 'asm-aarav-cs502',
          studentId: 'user-student-demo',
          studentPin: 'AP-2023-CS-042',
          subjectCode: 'CS-502',
          subjectName: 'Industrial IoT & Automation Protocols',
          semester: 5,
          internalScore: 26,
          midTermScore: 25,
          practicalScore: 36,
          totalScore: 87,
          recordedByFacultyId: 'user-faculty-demo',
          remarks: 'Good grasp of MQTT brokers and TLS security.',
          assessmentDate: '2026-10-12'
        },
        {
          id: 'asm-aarav-cs503',
          studentId: 'user-student-demo',
          studentPin: 'AP-2023-CS-042',
          subjectCode: 'CS-503',
          subjectName: 'Relational Database Management Systems',
          semester: 5,
          internalScore: 19,
          midTermScore: 18,
          practicalScore: 26,
          totalScore: 63,
          recordedByFacultyId: 'user-faculty-demo',
          remarks: 'Needs revision on database indexing and query normalization.',
          assessmentDate: '2026-10-14'
        }
      );
      modified = true;
    }

    // 6. Seed Learn and Earn Micro-Freelancing Services
    if (this.data.serviceListings.length === 0) {
      this.data.serviceListings.push(
        {
          id: 'srv-esp32-telemetry',
          studentId: 'user-student-demo',
          studentName: 'Aarav Choudhary',
          studentPin: 'AP-2023-CS-042',
          branchId: 'branch-cse',
          branchName: 'Computer Science & Engineering',
          title: 'Custom ESP32 / STM32 Industrial Telemetry Firmware & MQTT Gateway',
          description: 'I will write modular, robust C++ firmware for ESP32 and STM32 microcontrollers with real-time sensor polling (I2C/SPI), MQTT over TLS, and watchdog fail-safes for factory telemetry.',
          skills: ['Embedded C++', 'ESP32', 'MQTT', 'FreeRTOS', 'Industrial Sensors'],
          price: 4500,
          deliveryDays: 5,
          portfolioSamples: [
            { title: 'CNC Spindle Vibration Telemetry Demo', url: '/uploads/videos/demo_telemetry_walkthrough.mp4' }
          ],
          rating: 4.9,
          reviewCount: 7,
          status: 'active',
          createdAt: '2026-09-20T10:00:00Z'
        },
        {
          id: 'srv-cv-ppe-inspection',
          studentId: 'user-student-2',
          studentName: 'Priya Sharma',
          studentPin: 'AP-2023-CS-043',
          branchId: 'branch-cse',
          branchName: 'Computer Science & Engineering',
          title: 'Edge AI Computer Vision Model Quantization & Workshop Camera Setup',
          description: 'I will train and quantize YOLOv8 or MobileNet models to INT8 running at 30+ FPS on Raspberry Pi or Jetson for factory safety compliance, defect sorting, or worker helmet inspection.',
          skills: ['Python', 'OpenCV', 'TensorFlow Lite', 'YOLOv8', 'Edge AI'],
          price: 6000,
          deliveryDays: 7,
          portfolioSamples: [
            { title: 'PPE Helmet & Vest Inspection Video', url: '/uploads/videos/ppe_compliance_demo.mp4' }
          ],
          rating: 5.0,
          reviewCount: 4,
          status: 'active',
          createdAt: '2026-09-28T14:00:00Z'
        },
        {
          id: 'srv-cad-3d-modeling',
          studentId: 'user-student-4',
          studentName: 'Neha Gupta',
          studentPin: 'AP-2023-ME-012',
          branchId: 'branch-me',
          branchName: 'Mechanical Engineering',
          title: 'SolidWorks 3D CAD Modeling, Assembly Schematics & CNC G-Code Export',
          description: 'Complete mechanical CAD drafting, kinematic assembly validation, thermal stress simulation, and DXF/STEP files for rapid sheet-metal and CNC manufacturing.',
          skills: ['SolidWorks', 'ANSYS', 'CNC G-Code', 'Kinematics', '3D CAD'],
          price: 3500,
          deliveryDays: 4,
          portfolioSamples: [
            { title: 'Solar Dual-Axis Linkage Mechanism', url: '/uploads/videos/solar_chiller_demo.mp4' }
          ],
          rating: 4.8,
          reviewCount: 6,
          status: 'active',
          createdAt: '2026-10-01T11:00:00Z'
        }
      );
      modified = true;
    }

    // 7. Seed Service Orders
    if (this.data.serviceOrders.length === 0) {
      this.data.serviceOrders.push(
        {
          id: 'ord-srv-101',
          orderNumber: 'ORD-LE-2026-881',
          serviceId: 'srv-esp32-telemetry',
          serviceTitle: 'Custom ESP32 / STM32 Industrial Telemetry Firmware',
          studentId: 'user-student-demo',
          studentName: 'Aarav Choudhary',
          studentPin: 'AP-2023-CS-042',
          clientId: 'user-client-demo',
          clientName: 'Kavita Singhal',
          clientOrganization: 'Apex Industrial Systems & Automation Ltd.',
          amount: 4500,
          scopeDetails: 'Develop firmware to sample 4 PT100 temperature probes via MAX31865 over SPI and publish JSON alerts to AWS IoT Core broker every 500ms.',
          deadline: '2026-11-02',
          status: 'in_progress',
          deliverableNotes: 'Draft hardware HAL and SPI driver completed. Final MQTT publish loop under integration testing.',
          deliverableFiles: ['esp32_max31865_hal_v1.ino'],
          paymentStatus: 'verified_demo',
          createdAt: '2026-10-20T10:00:00Z',
          updatedAt: '2026-10-24T16:00:00Z'
        }
      );
      modified = true;
    }

    // 8. Seed Study Plan for Aarav
    if (this.data.studyPlans.length === 0) {
      this.data.studyPlans.push({
        id: 'plan-aarav-sem5',
        studentId: 'user-student-demo',
        branchName: 'Computer Science & Engineering',
        semester: 5,
        examTargetDate: '2026-11-25',
        weakTopics: ['Database B-Tree Indexing', 'SQL Query Optimization', 'Relational Normalization'],
        totalWeeklyHours: 14,
        generatedByAi: true,
        savedAt: '2026-10-24T11:00:00Z',
        weeklySchedule: [
          {
            day: 'Monday',
            focusSubject: 'Relational Database Management Systems (CS-503)',
            hours: 2,
            tasks: ['Read 3NF and BCNF normalization rules', 'Solve 4 previous exam problems on functional dependencies']
          },
          {
            day: 'Tuesday',
            focusSubject: 'Microcontrollers & Embedded Systems (CS-501)',
            hours: 2,
            tasks: ['Review Timer 1 CTC mode register configurations', 'Practice interrupt service routine coding']
          },
          {
            day: 'Wednesday',
            focusSubject: 'Relational Database Management Systems (CS-503)',
            hours: 2,
            tasks: ['Analyze query execution plans with EXPLAIN', 'Implement composite B-Tree indexes on test SQLite database']
          },
          {
            day: 'Thursday',
            focusSubject: 'Industrial IoT & Automation Protocols (CS-502)',
            hours: 2,
            tasks: ['Compare MQTT QoS 0, 1, 2 bandwidth footprints', 'Review TLS certificate handshake sequence']
          },
          {
            day: 'Friday',
            focusSubject: 'Capstone Project Viva Defense Practice',
            hours: 2,
            tasks: ['Practice 5-minute technical pitch for telemetry gateway', 'Recheck wiring diagrams and test results']
          },
          {
            day: 'Saturday',
            focusSubject: 'Weak Topic Intensive: Query Optimization',
            hours: 3,
            tasks: ['Complete mock test paper on database indexing', 'Self-grade using polytechnic model answer keys']
          },
          {
            day: 'Sunday',
            focusSubject: 'Weekly Review & Buffer',
            hours: 1,
            tasks: ['Summarize 1-page formula cheatsheet for upcoming internal tests']
          }
        ]
      });
      modified = true;
    }

    // 9. Seed Projects with real videos
    if (this.data.projects.length === 0) {
      this.data.projects.push(
        {
          id: 'proj-iot-factory-telemetry',
          title: 'Industrial IoT Telemetry & Vibration Monitoring Gateway',
          shortDescription: 'Real-time multi-sensor telemetry gateway for CNC vibration, temperature anomalies, and predictive bearing failure alerts.',
          problemStatement: 'Heavy manufacturing plants in the Alwar Matsya Industrial Area face unplanned downtime due to sudden bearing seize in high-speed CNC spindle shafts.',
          proposedSolution: 'Developed an edge micro-gateway powered by ESP32 + STM32 communicating via MQTT over TLS to an on-premise dashboard with vibration FFT spectral analysis.',
          techStack: ['ESP32 C++', 'FastAPI', 'React', 'MQTT', 'TimeScaleDB', 'Tailwind CSS'],
          skills: ['Edge Computing', 'DSP & FFT', 'Industrial Protocols', 'Full Stack'],
          branchId: 'branch-cse',
          branchName: 'Computer Science & Engineering',
          studentId: 'user-student-demo',
          studentName: 'Aarav Choudhary',
          studentPin: 'AP-2023-CS-042',
          teamMembers: [
            { name: 'Aarav Choudhary', pin: 'AP-2023-CS-042', role: 'Team Lead & Firmware' },
            { name: 'Rohit Meena', pin: 'AP-2023-CS-044', role: 'Backend & Database' }
          ],
          visibility: 'public',
          status: 'approved',
          price: 15000,
          licenseType: 'Commercial',
          videoUrl: '/uploads/videos/demo_telemetry_walkthrough.mp4',
          videoFileName: 'demo_telemetry_walkthrough.mp4',
          videoSize: 167936,
          documentUrls: [
            { name: 'Capstone_Project_Report_Alwar_Polytechnic.pdf', url: '/uploads/docs/report.pdf', size: 284000 }
          ],
          createdAt: '2026-09-10T14:00:00Z',
          updatedAt: '2026-10-15T11:30:00Z'
        },
        {
          id: 'proj-ai-safety-ppe',
          title: 'AI Edge Vision PPE Helmet & Vest Compliance Detector',
          shortDescription: 'Computer vision camera station mounted at factory entry gates to verify helmet, high-vis jacket, and safety goggles with 98.4% accuracy.',
          problemStatement: 'Manual safety compliance inspection at factory floor checkpoints is labor-intensive and error-prone, resulting in safety breaches.',
          proposedSolution: 'Trained YOLOv8-nano on 4,000 industrial workshop images quantized to INT8 running on Raspberry Pi 5 with Coral TPU producing sub-50ms inference.',
          techStack: ['Python', 'YOLOv8', 'OpenCV', 'TensorFlow Lite', 'React'],
          skills: ['Computer Vision', 'Deep Learning', 'Embedded Linux'],
          branchId: 'branch-cse',
          branchName: 'Computer Science & Engineering',
          studentId: 'user-student-2',
          studentName: 'Priya Sharma',
          studentPin: 'AP-2023-CS-043',
          teamMembers: [
            { name: 'Priya Sharma', pin: 'AP-2023-CS-043', role: 'Lead Vision Engineer' }
          ],
          visibility: 'public',
          status: 'under_review',
          price: 18500,
          licenseType: 'Academic',
          videoUrl: '/uploads/videos/ppe_compliance_demo.mp4',
          videoFileName: 'ppe_compliance_demo.mp4',
          videoSize: 133120,
          documentUrls: [],
          createdAt: '2026-10-02T16:00:00Z',
          updatedAt: '2026-10-22T09:15:00Z'
        },
        {
          id: 'proj-solar-thermal-chiller',
          title: 'Dual-Axis Solar Parabolic Concentrator with Thermo-Electric Chiller',
          shortDescription: 'Mechanical parabolic dish with sun-tracking mechanism coupled to Peltier cooling stages for off-grid vaccine storage in rural health sub-centers.',
          problemStatement: 'Frequent rural power outages in remote parts of Rajasthan compromise cold-chain vaccine storage temperatures.',
          proposedSolution: 'Custom-designed dual-axis mechanical tracker utilizing low-cost stepper linkages with a micro-evaporator chamber maintaining 2°C to 8°C continuously.',
          techStack: ['SolidWorks', 'Arduino Mega', 'Peltier Cells', 'Solar PV', 'Thermodynamics'],
          skills: ['CAD Design', 'HVAC & Refrigeration', 'Microcontroller Interfacing'],
          branchId: 'branch-me',
          branchName: 'Mechanical Engineering',
          studentId: 'user-student-4',
          studentName: 'Neha Gupta',
          studentPin: 'AP-2023-ME-012',
          teamMembers: [
            { name: 'Neha Gupta', pin: 'AP-2023-ME-012', role: 'Mechanical Fabrication & Thermal Analysis' }
          ],
          visibility: 'public',
          status: 'approved',
          price: 22000,
          licenseType: 'Commercial',
          videoUrl: '/uploads/videos/solar_chiller_demo.mp4',
          videoFileName: 'solar_chiller_demo.mp4',
          videoSize: 134144,
          documentUrls: [],
          createdAt: '2026-09-18T10:00:00Z',
          updatedAt: '2026-10-14T17:00:00Z'
        }
      );
      modified = true;
    }

    // 10. Seed Rubric Evaluation for Aarav's Project
    if (this.data.rubricEvaluations.length === 0) {
      this.data.rubricEvaluations.push({
        id: 'eval-telemetry-01',
        projectId: 'proj-iot-factory-telemetry',
        projectTitle: 'Industrial IoT Telemetry & Vibration Monitoring Gateway',
        studentId: 'user-student-demo',
        rubricTemplateId: 'rubric-polytechnic-standard',
        evaluatorFacultyId: 'user-faculty-demo',
        evaluatorName: 'Prof. Devendra Rathore',
        criterionScores: [
          {
            criterionId: 'c1',
            criterionName: 'Problem Understanding & Scope',
            weight: 15,
            score: 9.5,
            comment: 'Exceptional grounding in local Matsya industrial machining challenges.'
          },
          {
            criterionId: 'c2',
            criterionName: 'Functionality & Implementation',
            weight: 25,
            score: 9.0,
            comment: 'Fully functional edge gateway with real sensor feeds and responsive UI.'
          },
          {
            criterionId: 'c3',
            criterionName: 'Code/Design Quality & Architecture',
            weight: 15,
            score: 8.5,
            comment: 'Well-modularized firmware and clean REST API structure.'
          },
          {
            criterionId: 'c4',
            criterionName: 'Innovation & Technical Creativity',
            weight: 15,
            score: 9.0,
            comment: 'Creative FFT vibration windowing implemented directly on the microcontroller.'
          },
          {
            criterionId: 'c5',
            criterionName: 'Testing, Validation & Safety',
            weight: 15,
            score: 8.5,
            comment: 'Tested on actual lathe and CNC testbeds under 48-hour continuous load.'
          },
          {
            criterionId: 'c6',
            criterionName: 'Documentation, Presentation & Demo',
            weight: 15,
            score: 9.2,
            comment: 'Comprehensive project report, clear wiring diagrams, and high-clarity video walkthrough.'
          }
        ],
        totalScore: 89.55,
        overallFeedback: 'Outstanding work. One of the highest-rated capstone projects from the Department of Computer Science & Engineering this academic year. Ready for commercial pilot testing.',
        recommendation: 'approve',
        publishedToStudent: true,
        evaluatedAt: '2026-10-15T11:00:00Z'
      });
      modified = true;
    }

    // 11. Seed Attendance Records for Batch A
    if (this.data.attendanceRecords.length === 0) {
      const dates = ['2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24'];
      const studentsInBatch = [
        { id: 'user-student-demo', pin: 'AP-2023-CS-042', name: 'Aarav Choudhary' },
        { id: 'user-student-2', pin: 'AP-2023-CS-043', name: 'Priya Sharma' },
        { id: 'user-student-3', pin: 'AP-2023-CS-044', name: 'Rohit Meena' }
      ];

      dates.forEach(d => {
        studentsInBatch.forEach((s, idx) => {
          const isAbsent = (d === '2026-10-22' && idx === 2);
          const isLate = (d === '2026-10-24' && idx === 1);
          this.data.attendanceRecords.push({
            id: `att-${d}-${s.pin}`,
            branchId: 'branch-cse',
            branchName: 'Computer Science & Engineering',
            semester: 5,
            batch: '2023-2026 Batch A',
            date: d,
            studentId: s.id,
            studentPin: s.pin,
            studentName: s.name,
            status: isAbsent ? 'absent' : isLate ? 'late' : 'present',
            recordedByFacultyId: 'user-faculty-demo',
            remarks: isLate ? 'Late arrival - transport delay' : undefined
          });
        });
      });
      modified = true;
    }

    // 12. Seed Notices
    if (this.data.notices.length === 0) {
      this.data.notices.push(
        {
          id: 'notice-polytechnic-01',
          title: 'Annual Institutional Project Expo & Industry Showcase 2026',
          content: 'The Board of Governors and Academic Council announce the Annual Project Expo scheduled for November 12, 2026. All final-semester students with approved projects must submit demonstration video links and presentation posters by November 5.',
          priority: 'urgent',
          targetRoles: ['all'],
          createdBy: 'user-admin-demo',
          authorName: 'Academic Directorate',
          authorRole: 'Administrator',
          publishedAt: '2026-10-20T09:00:00Z',
          updatedAt: '2026-10-20T09:00:00Z'
        },
        {
          id: 'notice-polytechnic-02',
          title: 'Rubric Evaluation Submission Guidelines for Faculty Evaluators',
          content: 'All faculty project coordinators are requested to complete mid-term rubric reviews via the portal by October 30. Please ensure all 6 criteria scores are saved with constructive comments before publishing results to students.',
          priority: 'high',
          targetRoles: ['faculty'],
          createdBy: 'user-admin-demo',
          authorName: 'Dean of Academics',
          authorRole: 'Administrator',
          publishedAt: '2026-10-22T11:00:00Z',
          updatedAt: '2026-10-22T11:00:00Z'
        }
      );
      modified = true;
    }

    // 13. Seed Complaints
    if (this.data.complaints.length === 0) {
      this.data.complaints.push(
        {
          id: 'comp-01',
          ticketNumber: 'GRV-2026-001',
          userId: 'user-student-demo',
          userName: 'Aarav Choudhary',
          userRole: 'student',
          userEmail: 'student.demo@alwarpolytechnic.demo',
          category: 'facility',
          subject: 'IoT Hardware Lab Oscilloscope Calibration & High-Speed Logic Analyzer Access',
          description: 'The 4-channel digital oscilloscope in Lab 3 has channel 2 offset drifting by 450mV. We need it recalibrated for precise UART/CAN bus baud rate rise-time verification.',
          priority: 'medium',
          status: 'resolved',
          resolutionNote: 'Lab technician Er. Sunil Sharma inspected and recalibrated the Tektronix DSO on Oct 24. Channel 2 voltage reference verified with standard 1kHz square wave.',
          resolvedBy: 'Chief Administrator Office',
          resolvedAt: '2026-10-24T16:00:00Z',
          createdAt: '2026-10-21T10:00:00Z',
          updatedAt: '2026-10-24T16:00:00Z'
        }
      );
      modified = true;
    }

    // 14. Seed Messages with Moderation fields
    if (this.data.messages.length === 0) {
      this.data.messages.push(
        {
          id: 'msg-01',
          senderId: 'user-client-demo',
          senderName: 'Kavita Singhal (Apex Industrial Systems)',
          senderRole: 'client',
          receiverId: 'user-student-demo',
          receiverName: 'Aarav Choudhary',
          projectId: 'proj-iot-factory-telemetry',
          projectTitle: 'Industrial IoT Telemetry & Vibration Monitoring Gateway',
          content: 'Hello Aarav, we reviewed your telemetry gateway demo video and project report. We are impressed with the FFT vibration analysis and would like to test the deliverable package on our CNC machines next Monday.',
          read: true,
          moderationStatus: 'no_issue',
          createdAt: '2026-10-22T14:30:00Z'
        },
        {
          id: 'msg-02',
          senderId: 'user-student-demo',
          senderName: 'Aarav Choudhary',
          senderRole: 'student',
          receiverId: 'user-client-demo',
          receiverName: 'Kavita Singhal (Apex Industrial Systems)',
          projectId: 'proj-iot-factory-telemetry',
          projectTitle: 'Industrial IoT Telemetry & Vibration Monitoring Gateway',
          content: 'Thank you Ms. Singhal! The complete deliverable package including the flashed firmware binaries and PCB schematics is available under your Purchases tab. I am available for any remote deployment walkthrough.',
          read: true,
          moderationStatus: 'no_issue',
          createdAt: '2026-10-22T15:00:00Z'
        }
      );
      modified = true;
    }

    // 15. Ensure fully valid, real H.264/AAC videos exist for seamless playback across browsers
    this.ensureSampleVideosWithFFmpeg();

    if (modified) {
      this.save();
    }
  }

  private ensureSampleVideosWithFFmpeg() {
    const sampleFiles = [
      { name: 'demo_telemetry_walkthrough.mp4', duration: 10, freq: 440 },
      { name: 'ppe_compliance_demo.mp4', duration: 8, freq: 520 },
      { name: 'solar_chiller_demo.mp4', duration: 8, freq: 330 }
    ];

    sampleFiles.forEach(sample => {
      const filePath = path.join(VIDEOS_DIR, sample.name);
      // Check if file doesn't exist or is corrupt/small (< 50KB)
      let needsRegen = !fs.existsSync(filePath);
      if (!needsRegen) {
        const stat = fs.statSync(filePath);
        if (stat.size < 50000) {
          needsRegen = true;
        }
      }

      if (needsRegen) {
        try {
          execSync(
            `ffmpeg -y -f lavfi -i testsrc=duration=${sample.duration}:size=640x360:rate=30 -f lavfi -i sine=frequency=${sample.freq}:duration=${sample.duration} -c:v libx264 -pix_fmt yuv420p -c:a aac "${filePath}"`,
            { stdio: 'ignore' }
          );
        } catch (e) {
          console.warn(`Could not run ffmpeg for ${sample.name}, keeping existing:`, e);
        }
      }
    });
  }
}

export const db = new Database();
