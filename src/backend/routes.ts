import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import {
  db,
  hashPassword,
  verifyPassword,
  User,
  StudentProfile,
  FacultyProfile,
  ClientProfile,
  Project,
  Notice,
  Complaint,
  RubricEvaluation,
  ClientIdea,
  Purchase,
  Message,
  ServiceListing,
  ServiceOrder,
  StudyPlan,
  AcademicAssessment,
  AcademicPerformanceInsight,
  ModerationStatus
} from './db.js';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

// Setup Multer for persistent video and document uploads
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const VIDEOS_DIR = path.join(UPLOADS_DIR, 'videos');
const DOCS_DIR = path.join(UPLOADS_DIR, 'docs');

const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, VIDEOS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `video-${uniqueSuffix}${ext}`);
  }
});

const docStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, DOCS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(mp4|webm|mov|mkv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid video format. Supported formats: MP4, WebM, MOV.'));
    }
  }
});

const uploadDoc = multer({
  storage: docStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  fileFilter: (_req, file, cb) => {
    cb(null, true);
  }
});

// Helper to log audit events
function logAudit(userId: string, userEmail: string, userRole: string, action: string, resource: string, details: string) {
  const auditLogs = db.getRawData().auditLogs;
  auditLogs.unshift({
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    userEmail,
    userRole,
    action,
    resource,
    details,
    timestamp: new Date().toISOString()
  });
  if (auditLogs.length > 500) {
    auditLogs.pop();
  }
  db.save();
}

// -------------------------------------------------------------
// 1. AUTHENTICATION & DEMO ACCOUNTS
// -------------------------------------------------------------

router.get('/auth/demo-accounts', (_req: Request, res: Response) => {
  res.json({
    success: true,
    accounts: [
      {
        role: 'student',
        label: 'Student Account',
        name: 'Aarav Choudhary (CSE 5th Sem)',
        email: 'student.demo@alwarpolytechnic.demo',
        password: 'Student@123',
        department: 'Computer Science & Engineering',
        pin: 'AP-2023-CS-042'
      },
      {
        role: 'faculty',
        label: 'Faculty Account',
        name: 'Prof. Devendra Rathore',
        email: 'faculty.demo@alwarpolytechnic.demo',
        password: 'Faculty@123',
        department: 'Computer Science & Engineering',
        employeeId: 'AP-FAC-108'
      },
      {
        role: 'client',
        label: 'Industry Client Account',
        name: 'Kavita Singhal (Apex Automation)',
        email: 'client.demo@alwarpolytechnic.demo',
        password: 'Client@123',
        organization: 'Apex Industrial Systems & Automation Ltd.'
      },
      {
        role: 'admin',
        label: 'Administrator Account',
        name: 'Chief Administrator Office',
        email: 'admin.demo@alwarpolytechnic.demo',
        password: 'Admin@123',
        department: 'Academic Directorate'
      }
    ]
  });
});

router.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  const raw = db.getRawData();
  const user = raw.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ success: false, error: 'Your account has been suspended by administration.' });
  }

  if (user.status === 'pending_approval' && user.role === 'faculty') {
    return res.status(403).json({
      success: false,
      error: 'Faculty account registration is pending institutional administrator approval.'
    });
  }

  user.lastLoginAt = new Date().toISOString();
  db.save();

  // Find associated profile
  let profile: any = null;
  if (user.role === 'student') {
    profile = raw.studentProfiles.find(p => p.userId === user.id) || null;
  } else if (user.role === 'faculty') {
    profile = raw.facultyProfiles.find(p => p.userId === user.id) || null;
  } else if (user.role === 'client') {
    profile = raw.clientProfiles.find(p => p.userId === user.id) || null;
  }

  logAudit(user.id, user.email, user.role, 'LOGIN', 'auth', `User logged in successfully`);

  return res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl
    },
    profile,
    token: `token-${user.id}-${Date.now()}`
  });
});

router.post('/auth/register', (req: Request, res: Response) => {
  const { email, password, name, role, ...extra } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ success: false, error: 'Missing required registration fields.' });
  }

  if (role === 'admin') {
    return res.status(403).json({ success: false, error: 'Public administrator registration is prohibited.' });
  }

  if (!['student', 'faculty', 'client'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Invalid user role selected.' });
  }

  const raw = db.getRawData();
  const existing = raw.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
  }

  const userId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Default status: Faculty requires approval unless pre-approved; student and client are active
  const status = role === 'faculty' ? 'pending_approval' : 'active';

  const newUser: User = {
    id: userId,
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
    name: name.trim(),
    role,
    status,
    createdAt: new Date().toISOString()
  };

  let profile: any = null;

  if (role === 'student') {
    const pin = (extra.pin || '').trim().toUpperCase();
    if (!pin) {
      return res.status(400).json({ success: false, error: 'Student ID/PIN is required.' });
    }
    const duplicatePin = raw.studentProfiles.find(p => p.pin.toUpperCase() === pin);
    if (duplicatePin) {
      return res.status(409).json({ success: false, error: `Student ID/PIN '${pin}' is already registered.` });
    }

    const branch = raw.branches.find(b => b.id === extra.branchId || b.name === extra.branchName) || raw.branches[0];

    const studentProfile: StudentProfile = {
      id: `sp-${Date.now()}`,
      userId,
      pin,
      branchId: branch?.id || 'branch-cse',
      branchName: branch?.name || 'Computer Science & Engineering',
      semester: Number(extra.semester) || 1,
      batch: extra.batch || `2024-2027 Batch A`,
      cgpa: extra.cgpa ? Number(extra.cgpa) : undefined,
      skills: extra.skills || [],
      bio: extra.bio || '',
      portfolioVisibility: 'public'
    };
    raw.studentProfiles.push(studentProfile);
    profile = studentProfile;
  } else if (role === 'faculty') {
    const employeeId = (extra.employeeId || '').trim().toUpperCase();
    if (!employeeId) {
      return res.status(400).json({ success: false, error: 'Employee ID is required.' });
    }
    const branch = raw.branches.find(b => b.id === extra.branchId || b.name === extra.branchName) || raw.branches[0];

    const facultyProfile: FacultyProfile = {
      id: `fp-${Date.now()}`,
      userId,
      employeeId,
      branchId: branch?.id || 'branch-cse',
      branchName: branch?.name || 'Computer Science & Engineering',
      designation: extra.designation || 'Lecturer',
      qualification: extra.qualification || 'B.Tech / M.Tech',
      assignedBatches: extra.assignedBatches || [`2023-2026 Batch A`],
      approvalStatus: 'pending'
    };
    raw.facultyProfiles.push(facultyProfile);
    profile = facultyProfile;
  } else if (role === 'client') {
    const clientProfile: ClientProfile = {
      id: `cp-${Date.now()}`,
      userId,
      organization: (extra.organization || 'Independent Enterprise').trim(),
      contactNumber: extra.contactNumber,
      industry: extra.industry || 'General Industry',
      verified: true
    };
    raw.clientProfiles.push(clientProfile);
    profile = clientProfile;
  }

  raw.users.push(newUser);
  db.save();

  logAudit(newUser.id, newUser.email, newUser.role, 'REGISTER', 'auth', `New user registered as ${role}`);

  return res.status(201).json({
    success: true,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      status: newUser.status
    },
    profile,
    message: role === 'faculty' ? 'Registration submitted! Awaiting administrator approval.' : 'Registration successful!'
  });
});

// -------------------------------------------------------------
// 2. BRANCHES & DEPARTMENTS (All institutional departments)
// -------------------------------------------------------------

router.get('/branches', (_req: Request, res: Response) => {
  const branches = db.getRawData().branches;
  res.json({ success: true, branches });
});

router.post('/branches', (req: Request, res: Response) => {
  const { code, name, description, headOfDepartment, semesterCount } = req.body;
  if (!code || !name) {
    return res.status(400).json({ success: false, error: 'Branch code and name are required.' });
  }

  const raw = db.getRawData();
  const existing = raw.branches.find(b => b.code.toUpperCase() === code.trim().toUpperCase());
  if (existing) {
    return res.status(409).json({ success: false, error: `Branch code '${code}' already exists.` });
  }

  const newBranch = {
    id: `branch-${code.toLowerCase().trim()}`,
    code: code.trim().toUpperCase(),
    name: name.trim(),
    description: description || '',
    active: true,
    headOfDepartment: headOfDepartment || 'To be appointed',
    semesterCount: Number(semesterCount) || 6
  };

  raw.branches.push(newBranch);
  db.save();
  return res.status(201).json({ success: true, branch: newBranch });
});

router.put('/branches/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, code, description, active, headOfDepartment, semesterCount } = req.body;
  const raw = db.getRawData();
  const branch = raw.branches.find(b => b.id === id);

  if (!branch) {
    return res.status(404).json({ success: false, error: 'Branch not found.' });
  }

  if (name !== undefined) branch.name = name.trim();
  if (code !== undefined) branch.code = code.trim().toUpperCase();
  if (description !== undefined) branch.description = description;
  if (active !== undefined) branch.active = Boolean(active);
  if (headOfDepartment !== undefined) branch.headOfDepartment = headOfDepartment;
  if (semesterCount !== undefined) branch.semesterCount = Number(semesterCount);

  db.save();
  res.json({ success: true, branch });
});

// -------------------------------------------------------------
// 3. STUDENTS & MY STUDENTS (FACULTY & ADMIN)
// -------------------------------------------------------------

router.get('/students', (req: Request, res: Response) => {
  const raw = db.getRawData();
  const { branchId, semester, batch, search } = req.query;

  let list = raw.studentProfiles.map(p => {
    const user = raw.users.find(u => u.id === p.userId);
    const projects = raw.projects.filter(pr => pr.studentId === p.userId);
    return {
      ...p,
      name: user?.name || 'Unknown',
      email: user?.email || '',
      status: user?.status || 'active',
      avatarUrl: user?.avatarUrl,
      projectCount: projects.length,
      approvedProjects: projects.filter(pr => pr.status === 'approved').length
    };
  });

  if (branchId) {
    list = list.filter(s => s.branchId === branchId);
  }
  if (semester) {
    list = list.filter(s => s.semester === Number(semester));
  }
  if (batch) {
    list = list.filter(s => s.batch.toLowerCase().includes((batch as string).toLowerCase()));
  }
  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter(s => s.name.toLowerCase().includes(q) || s.pin.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
  }

  res.json({ success: true, students: list });
});

router.get('/students/:id', (req: Request, res: Response) => {
  const raw = db.getRawData();
  const profile = raw.studentProfiles.find(p => p.id === req.params.id || p.userId === req.params.id);
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Student record not found.' });
  }

  const user = raw.users.find(u => u.id === profile.userId);
  const projects = raw.projects.filter(pr => pr.studentId === profile.userId);
  const attendance = raw.attendanceRecords.filter(a => a.studentId === profile.userId);

  const totalClasses = attendance.length;
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const lateCount = attendance.filter(a => a.status === 'late').length;
  const percentage = totalClasses > 0 ? Math.round(((presentCount + (lateCount * 0.5)) / totalClasses) * 100) : 100;

  res.json({
    success: true,
    student: {
      ...profile,
      name: user?.name || '',
      email: user?.email || '',
      avatarUrl: user?.avatarUrl,
      projects,
      attendanceSummary: {
        totalClasses,
        presentCount,
        lateCount,
        absentCount: totalClasses - presentCount - lateCount,
        percentage
      }
    }
  });
});

router.post('/students', (req: Request, res: Response) => {
  const { name, pin, email, branchId, semester, batch, cgpa } = req.body;

  if (!name || !pin || !branchId || !semester) {
    return res.status(400).json({ success: false, error: 'Full name, Student PIN, Branch, and Semester are required.' });
  }

  const raw = db.getRawData();
  const normalizedPin = pin.trim().toUpperCase();

  const existingPin = raw.studentProfiles.find(p => p.pin.toUpperCase() === normalizedPin);
  if (existingPin) {
    return res.status(409).json({ success: false, error: `Student PIN '${normalizedPin}' is already registered in the system.` });
  }

  const branch = raw.branches.find(b => b.id === branchId);
  const studentEmail = (email || `${normalizedPin.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.alwarpolytechnic.ac.in`).trim().toLowerCase();

  // Create user
  const userId = `user-student-${Date.now()}`;
  const newUser: User = {
    id: userId,
    email: studentEmail,
    passwordHash: hashPassword('Student@123'), // Default institutional credential
    role: 'student',
    name: name.trim(),
    status: 'active',
    createdAt: new Date().toISOString()
  };

  const newProfile: StudentProfile = {
    id: `sp-${Date.now()}`,
    userId,
    pin: normalizedPin,
    branchId,
    branchName: branch?.name || 'Engineering Branch',
    semester: Number(semester),
    batch: batch || `2024-2027 Batch A`,
    cgpa: cgpa ? Number(cgpa) : undefined,
    skills: [],
    bio: '',
    portfolioVisibility: 'public'
  };

  raw.users.push(newUser);
  raw.studentProfiles.push(newProfile);
  db.save();

  logAudit(userId, studentEmail, 'faculty', 'CREATE_STUDENT', 'students', `Faculty added student ${name} (${normalizedPin})`);

  res.status(201).json({
    success: true,
    student: {
      ...newProfile,
      name: newUser.name,
      email: newUser.email
    },
    message: `Student record created for ${name} (${normalizedPin}).`
  });
});

router.put('/students/:id', (req: Request, res: Response) => {
  const raw = db.getRawData();
  const profile = raw.studentProfiles.find(p => p.id === req.params.id || p.userId === req.params.id);
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Student profile not found.' });
  }

  const { skills, bio, githubUrl, linkedinUrl, portfolioVisibility, semester, batch } = req.body;
  if (skills !== undefined) profile.skills = skills;
  if (bio !== undefined) profile.bio = bio;
  if (githubUrl !== undefined) profile.githubUrl = githubUrl;
  if (linkedinUrl !== undefined) profile.linkedinUrl = linkedinUrl;
  if (portfolioVisibility !== undefined) profile.portfolioVisibility = portfolioVisibility;
  if (semester !== undefined) profile.semester = Number(semester);
  if (batch !== undefined) profile.batch = batch;

  db.save();
  res.json({ success: true, profile });
});

// -------------------------------------------------------------
// 4. ATTENDANCE (FACULTY & STUDENT)
// -------------------------------------------------------------

router.get('/attendance', (req: Request, res: Response) => {
  const raw = db.getRawData();
  const { branchId, semester, batch, date, studentId } = req.query;

  let records = raw.attendanceRecords;
  if (branchId) records = records.filter(r => r.branchId === branchId);
  if (semester) records = records.filter(r => r.semester === Number(semester));
  if (batch) records = records.filter(r => r.batch === batch);
  if (date) records = records.filter(r => r.date === date);
  if (studentId) records = records.filter(r => r.studentId === studentId);

  res.json({ success: true, records });
});

router.post('/attendance', (req: Request, res: Response) => {
  const { branchId, semester, batch, date, records, facultyId } = req.body;

  if (!branchId || !semester || !batch || !date || !Array.isArray(records)) {
    return res.status(400).json({ success: false, error: 'Branch, semester, batch, date, and student attendance entries are required.' });
  }

  const raw = db.getRawData();
  const branch = raw.branches.find(b => b.id === branchId);

  records.forEach((item: { studentId: string; studentPin: string; studentName: string; status: 'present' | 'absent' | 'late'; remarks?: string }) => {
    // Check if record exists for this date and student, update or insert
    const existingIndex = raw.attendanceRecords.findIndex(r => r.date === date && r.studentId === item.studentId);
    if (existingIndex >= 0) {
      raw.attendanceRecords[existingIndex].status = item.status;
      raw.attendanceRecords[existingIndex].remarks = item.remarks;
    } else {
      raw.attendanceRecords.push({
        id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        branchId,
        branchName: branch?.name || 'Engineering Branch',
        semester: Number(semester),
        batch,
        date,
        studentId: item.studentId,
        studentPin: item.studentPin,
        studentName: item.studentName,
        status: item.status,
        recordedByFacultyId: facultyId || 'faculty-user',
        remarks: item.remarks
      });
    }
  });

  db.save();
  res.json({ success: true, message: `Attendance saved for ${records.length} students on ${date}.` });
});

// -------------------------------------------------------------
// 5. PROJECTS & DIRECT VIDEO UPLOAD / PLAYBACK
// -------------------------------------------------------------

router.post('/upload/video', uploadVideo.single('video'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No video file provided.' });
  }

  const videoUrl = `/uploads/videos/${req.file.filename}`;
  res.json({
    success: true,
    videoUrl,
    videoFileName: req.file.originalname,
    videoSize: req.file.size
  });
});

router.post('/upload/doc', uploadDoc.single('document'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No document file provided.' });
  }

  const documentUrl = `/uploads/docs/${req.file.filename}`;
  res.json({
    success: true,
    documentUrl,
    documentName: req.file.originalname,
    size: req.file.size
  });
});

// Video Streaming Handler with HTTP 206 Partial Content (Section 13)
router.get('/uploads/videos/:filename', (req: Request, res: Response) => {
  const filePath = path.join(VIDEOS_DIR, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'Video file not found on server.' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4'
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes'
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// Document download handler
router.get('/uploads/docs/:filename', (req: Request, res: Response) => {
  const filePath = path.join(DOCS_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'Document file not found.' });
  }
  res.download(filePath);
});

router.get('/projects', (req: Request, res: Response) => {
  const raw = db.getRawData();
  const { branchId, studentId, status, visibility, search } = req.query;

  let list = raw.projects;

  if (branchId) list = list.filter(p => p.branchId === branchId);
  if (studentId) list = list.filter(p => p.studentId === studentId);
  if (status) list = list.filter(p => p.status === status);
  if (visibility) list = list.filter(p => p.visibility === visibility);
  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.shortDescription.toLowerCase().includes(q) ||
      p.techStack.some(t => t.toLowerCase().includes(q)) ||
      p.studentName.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, projects: list });
});

router.get('/projects/:id', (req: Request, res: Response) => {
  const raw = db.getRawData();
  const project = raw.projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project record not found.' });
  }

  const evaluation = raw.rubricEvaluations.find(e => e.projectId === project.id);
  const reviews = raw.projectReviews.filter(r => r.projectId === project.id);

  res.json({
    success: true,
    project,
    evaluation: evaluation || null,
    reviews
  });
});

router.post('/projects', (req: Request, res: Response) => {
  const {
    title,
    shortDescription,
    problemStatement,
    proposedSolution,
    techStack,
    skills,
    branchId,
    studentId,
    studentName,
    studentPin,
    teamMembers,
    visibility,
    price,
    licenseType,
    videoUrl,
    videoFileName,
    videoSize,
    documentUrls,
    isDraft
  } = req.body;

  if (!title || !problemStatement || !proposedSolution) {
    return res.status(400).json({ success: false, error: 'Title, problem statement, and proposed solution are required.' });
  }

  const raw = db.getRawData();
  const branch = raw.branches.find(b => b.id === branchId) || raw.branches[0];

  const newProject: Project = {
    id: `proj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: title.trim(),
    shortDescription: (shortDescription || title).trim(),
    problemStatement: problemStatement.trim(),
    proposedSolution: proposedSolution.trim(),
    techStack: Array.isArray(techStack) ? techStack : [],
    skills: Array.isArray(skills) ? skills : [],
    branchId: branch?.id || 'branch-cse',
    branchName: branch?.name || 'Computer Science & Engineering',
    studentId: studentId || 'user-student-demo',
    studentName: studentName || 'Student Innovator',
    studentPin: studentPin || 'AP-2023-CS-000',
    teamMembers: Array.isArray(teamMembers) ? teamMembers : [],
    visibility: visibility || 'public',
    status: isDraft ? 'draft' : 'submitted',
    price: Number(price) || 0,
    licenseType: licenseType || 'Commercial',
    videoUrl: videoUrl || undefined,
    videoFileName: videoFileName || undefined,
    videoSize: videoSize ? Number(videoSize) : undefined,
    documentUrls: Array.isArray(documentUrls) ? documentUrls : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  raw.projects.unshift(newProject);
  db.save();

  logAudit(newProject.studentId, newProject.studentName, 'student', 'CREATE_PROJECT', 'projects', `Project created: ${newProject.title}`);

  res.status(201).json({ success: true, project: newProject });
});

router.put('/projects/:id', (req: Request, res: Response) => {
  const raw = db.getRawData();
  const project = raw.projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found.' });
  }

  const fields = req.body;
  Object.keys(fields).forEach(key => {
    if (key !== 'id' && key !== 'createdAt') {
      (project as any)[key] = fields[key];
    }
  });
  project.updatedAt = new Date().toISOString();

  db.save();
  res.json({ success: true, project });
});

router.post('/projects/:id/submit', (req: Request, res: Response) => {
  const raw = db.getRawData();
  const project = raw.projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found.' });
  }

  project.status = 'submitted';
  project.updatedAt = new Date().toISOString();
  db.save();

  res.json({ success: true, project, message: 'Project successfully submitted for faculty review.' });
});

// -------------------------------------------------------------
// 6. RUBRIC EVALUATOR & REVIEWS (FACULTY)
// -------------------------------------------------------------

router.get('/rubrics/templates', (_req: Request, res: Response) => {
  const templates = db.getRawData().rubricTemplates;
  res.json({ success: true, templates });
});

router.post('/rubrics/evaluate', (req: Request, res: Response) => {
  const {
    projectId,
    rubricTemplateId,
    evaluatorFacultyId,
    evaluatorName,
    criterionScores,
    overallFeedback,
    recommendation,
    publishedToStudent
  } = req.body;

  if (!projectId || !criterionScores || !Array.isArray(criterionScores)) {
    return res.status(400).json({ success: false, error: 'Project ID and criterion scores are required.' });
  }

  const raw = db.getRawData();
  const project = raw.projects.find(p => p.id === projectId);
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found.' });
  }

  // Calculate weighted score sum: (score / 10) * weight
  let calculatedScore = 0;
  criterionScores.forEach((c: { weight: number; score: number }) => {
    calculatedScore += (c.score / 10) * c.weight;
  });
  calculatedScore = Math.round(calculatedScore * 100) / 100;

  const evaluationId = `eval-${Date.now()}`;
  const evaluation: RubricEvaluation = {
    id: evaluationId,
    projectId,
    projectTitle: project.title,
    studentId: project.studentId,
    rubricTemplateId: rubricTemplateId || 'rubric-polytechnic-standard',
    evaluatorFacultyId: evaluatorFacultyId || 'user-faculty-demo',
    evaluatorName: evaluatorName || 'Prof. Faculty Evaluator',
    criterionScores,
    totalScore: calculatedScore,
    overallFeedback: overallFeedback || 'Evaluation completed according to polytechnic capstone guidelines.',
    recommendation: recommendation || (calculatedScore >= 60 ? 'approve' : 'revise'),
    publishedToStudent: Boolean(publishedToStudent),
    evaluatedAt: new Date().toISOString()
  };

  // Replace existing evaluation for this project or add
  const existingEvalIndex = raw.rubricEvaluations.findIndex(e => e.projectId === projectId);
  if (existingEvalIndex >= 0) {
    raw.rubricEvaluations[existingEvalIndex] = evaluation;
  } else {
    raw.rubricEvaluations.push(evaluation);
  }

  // Update project status according to recommendation
  if (recommendation === 'approve') {
    project.status = 'approved';
  } else if (recommendation === 'reject') {
    project.status = 'rejected';
  } else if (recommendation === 'revise') {
    project.status = 'changes_requested';
  }

  // Add review log
  raw.projectReviews.push({
    id: `rev-${Date.now()}`,
    projectId,
    facultyId: evaluatorFacultyId || 'user-faculty-demo',
    facultyName: evaluatorName || 'Faculty Evaluator',
    status: project.status as any,
    comments: overallFeedback,
    rubricEvaluationId: evaluationId,
    reviewedAt: new Date().toISOString()
  });

  db.save();

  logAudit(evaluatorFacultyId, evaluatorName, 'faculty', 'EVALUATE_PROJECT', 'rubrics', `Evaluated project '${project.title}' with score ${calculatedScore}/100`);

  res.status(201).json({
    success: true,
    evaluation,
    projectStatus: project.status,
    message: `Evaluation saved successfully! Total weighted score: ${calculatedScore}/100.`
  });
});

// -------------------------------------------------------------
// 7. CLIENT IDEA STUDIO (SINGLE PAGE: DESCRIBE MY IDEA)
// -------------------------------------------------------------

router.get('/ideas', (req: Request, res: Response) => {
  const raw = db.getRawData();
  const { clientId } = req.query;

  let ideas = raw.clientIdeas;
  if (clientId) {
    ideas = ideas.filter(i => i.clientId === clientId);
  }

  res.json({ success: true, ideas });
});

router.post('/ideas', (req: Request, res: Response) => {
  const { clientId, clientName, organization, title, description, documentUrl, targetBranch, estimatedBudget, status } = req.body;

  if (!description || description.trim().length < 10) {
    return res.status(400).json({ success: false, error: 'Please provide a detailed project description (at least 10 characters).' });
  }

  const raw = db.getRawData();
  const ideaId = `idea-${Date.now()}`;

  const newIdea: ClientIdea = {
    id: ideaId,
    clientId: clientId || 'user-client-demo',
    clientName: clientName || 'Client Partner',
    organization: organization || 'Industrial Partner',
    title: (title || description.slice(0, 50) + '...').trim(),
    description: description.trim(),
    documentUrl,
    targetBranch,
    estimatedBudget,
    status: status || 'submitted',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  raw.clientIdeas.unshift(newIdea);
  db.save();

  res.status(201).json({
    success: true,
    idea: newIdea,
    message: 'Project idea successfully submitted! View under My Requests.'
  });
});

router.put('/ideas/:id', (req: Request, res: Response) => {
  const raw = db.getRawData();
  const idea = raw.clientIdeas.find(i => i.id === req.params.id);
  if (!idea) {
    return res.status(404).json({ success: false, error: 'Project idea not found.' });
  }

  const { title, description, documentUrl, targetBranch, estimatedBudget, status, aiAnalysis } = req.body;
  if (title) idea.title = title;
  if (description) idea.description = description;
  if (documentUrl !== undefined) idea.documentUrl = documentUrl;
  if (targetBranch) idea.targetBranch = targetBranch;
  if (estimatedBudget) idea.estimatedBudget = estimatedBudget;
  if (status) idea.status = status;
  if (aiAnalysis) idea.aiAnalysis = aiAnalysis;
  idea.updatedAt = new Date().toISOString();

  db.save();
  res.json({ success: true, idea });
});

// AI Idea Analysis Endpoint (Gemini 3.8 Flash)
router.post('/ideas/analyze', async (req: Request, res: Response) => {
  const { description } = req.body;
  if (!description) {
    return res.status(400).json({ success: false, error: 'Description is required for AI analysis.' });
  }

  try {
    const ai = new GoogleGenAI();
    const prompt = `You are a Senior Engineering Project Advisor at Alwar Polytechnic.
Analyze the following client project idea and provide a structured JSON response for polytechnic diploma students and faculty:
Client description: "${description}"

Respond ONLY with a valid JSON object with the following fields:
{
  "summary": "1-2 sentence executive summary of the system to build",
  "suggestedFeatures": ["array of 4 core functional features"],
  "suggestedTechStack": ["array of 4-5 modern technologies/frameworks/hardware"],
  "clarifyingQuestions": ["2 key technical or operational questions to ask the client"],
  "feasibilityRating": "High/Medium/Challenging for diploma engineering teams",
  "suggestedBranches": ["array of matching Alwar Polytechnic branches, e.g. Computer Science & Engineering, Mechanical Engineering, Electrical Engineering, etc."]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, analysis: parsed });
  } catch (err: any) {
    console.error('AI analysis error, providing intelligent deterministic fallback:', err?.message);
    // Honest graceful fallback
    const fallback = {
      summary: `Automated engineering solution tailored to client specifications: ${description.slice(0, 100)}...`,
      suggestedFeatures: [
        'Centralized telemetry and supervisory control interface',
        'Fail-safe sensor integration with threshold alert triggers',
        'Role-based operator access and event logging',
        'Modular hardware/software architecture for field deployment'
      ],
      suggestedTechStack: ['React', 'Node.js/FastAPI', 'Embedded C++', 'PostgreSQL/SQLite', 'MQTT'],
      clarifyingQuestions: [
        'What are the primary operational environment constraints (temperature, dust, power)?',
        'What are the required reporting or export formats for operational telemetry?'
      ],
      feasibilityRating: 'High - Strong practical capstone project for Alwar Polytechnic diploma candidates',
      suggestedBranches: ['Computer Science & Engineering', 'Electrical Engineering']
    };
    return res.json({ success: true, analysis: fallback, isFallback: true });
  }
});

// -------------------------------------------------------------
// 8. PURCHASES & LICENSING
// -------------------------------------------------------------

router.get('/purchases', (req: Request, res: Response) => {
  const raw = db.getRawData();
  const { clientId, studentId } = req.query;

  let purchases = raw.purchases;
  if (clientId) purchases = purchases.filter(p => p.clientId === clientId);
  if (studentId) purchases = purchases.filter(p => p.studentId === studentId);

  res.json({ success: true, purchases });
});

router.post('/purchases', (req: Request, res: Response) => {
  const { projectId, clientId, clientName, clientOrganization } = req.body;

  const raw = db.getRawData();
  const project = raw.projects.find(p => p.id === projectId);
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found.' });
  }

  const orderId = `ord-${Date.now()}`;
  const licenseKey = `LIC-AP-${new Date().getFullYear()}-${project.branchName.slice(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;

  const newPurchase: Purchase = {
    id: orderId,
    orderNumber: `AP-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    projectId: project.id,
    projectTitle: project.title,
    studentId: project.studentId,
    studentName: project.studentName,
    studentPin: project.studentPin,
    clientId: clientId || 'user-client-demo',
    clientName: clientName || 'Industrial Client',
    clientOrganization: clientOrganization || 'Industrial Enterprise',
    amount: project.price || 15000,
    licenseType: `${project.licenseType} Commercial License`,
    status: 'completed',
    licenseKey,
    downloadUrl: `/api/purchases/${orderId}/download`,
    deliverableFiles: [
      'firmware_source_repository.zip',
      'schematics_and_gerber_files.zip',
      'system_architecture_and_manual.pdf',
      'alwar_polytechnic_ip_license_agreement.pdf'
    ],
    createdAt: new Date().toISOString()
  };

  raw.purchases.unshift(newPurchase);
  db.save();

  logAudit(clientId, clientName, 'client', 'PURCHASE_LICENSE', 'purchases', `Purchased license for project: ${project.title}`);

  res.status(201).json({
    success: true,
    purchase: newPurchase,
    message: 'Project licensed successfully! Deliverable package unlocked.'
  });
});

router.get('/purchases/:id/download', (req: Request, res: Response) => {
  const raw = db.getRawData();
  const purchase = raw.purchases.find(p => p.id === req.params.id);
  if (!purchase) {
    return res.status(404).json({ success: false, error: 'Purchase record not found.' });
  }

  // Generate an authentic delivery manifest certificate
  const manifest = `========================================================================
ALWAR POLYTECHNIC — STUDENT TALENT MANAGEMENT PORTAL
OFFICIAL DELIVERABLE PACKAGE & INTELLECTUAL PROPERTY LICENSE CERTIFICATE
========================================================================
Order Number:      ${purchase.orderNumber}
License Key:       ${purchase.licenseKey}
Project Title:     ${purchase.projectTitle}
Student Creator:   ${purchase.studentName} (PIN: ${purchase.studentPin})
Licensee:          ${purchase.clientName} (${purchase.clientOrganization})
Grant Type:        ${purchase.licenseType}
Licensed Value:    ₹${purchase.amount.toLocaleString()}
Authorization:     Alwar Polytechnic Industry Liaison Cell & Academic Council
Issuance Date:     ${purchase.createdAt}

INCLUDED DELIVERABLES:
1. Complete Source Code Repository Archive (.zip)
2. Hardware Schematics, BOM, and Gerber Files (.zip)
3. Capstone Engineering Report & User Manual (.pdf)
4. Demonstration Video & Walkthrough Package (.mp4)
========================================================================
Verification URL: https://alwarpolytechnic.ac.in/verify-license/${purchase.licenseKey}
`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="${purchase.orderNumber}-deliverable-package.txt"`);
  res.send(manifest);
});

// -------------------------------------------------------------
// 9. NOTICES & ANNOUNCEMENTS
// -------------------------------------------------------------

router.get('/notices', (req: Request, res: Response) => {
  const raw = db.getRawData();
  const { role } = req.query;

  let list = raw.notices;
  if (role && role !== 'admin') {
    list = list.filter(n => n.targetRoles.includes('all') || n.targetRoles.includes(role as any));
  }

  res.json({ success: true, notices: list });
});

router.post('/notices', (req: Request, res: Response) => {
  const { title, content, priority, targetRoles, authorName, authorRole, createdBy } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, error: 'Notice title and content are required.' });
  }

  const raw = db.getRawData();
  const newNotice: Notice = {
    id: `notice-${Date.now()}`,
    title: title.trim(),
    content: content.trim(),
    priority: priority || 'normal',
    targetRoles: Array.isArray(targetRoles) ? targetRoles : ['all'],
    createdBy: createdBy || 'user-admin-demo',
    authorName: authorName || 'Administrative Office',
    authorRole: authorRole || 'Administrator',
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  raw.notices.unshift(newNotice);
  db.save();

  res.status(201).json({ success: true, notice: newNotice });
});

router.delete('/notices/:id', (req: Request, res: Response) => {
  const raw = db.getRawData();
  const index = raw.notices.findIndex(n => n.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Notice not found.' });
  }

  const deleted = raw.notices.splice(index, 1)[0];
  db.save();

  res.json({ success: true, message: `Notice '${deleted.title}' deleted successfully.` });
});

// -------------------------------------------------------------
// 10. COMPLAINTS & GRIEVANCE MANAGEMENT
// -------------------------------------------------------------

router.get('/complaints', (req: Request, res: Response) => {
  const raw = db.getRawData();
  const { userId, role } = req.query;

  let list = raw.complaints;
  if (role !== 'admin' && userId) {
    list = list.filter(c => c.userId === userId);
  }

  res.json({ success: true, complaints: list });
});

router.post('/complaints', (req: Request, res: Response) => {
  const { userId, userName, userRole, userEmail, category, subject, description, priority } = req.body;

  if (!subject || !description || !category) {
    return res.status(400).json({ success: false, error: 'Category, subject, and description are required.' });
  }

  const raw = db.getRawData();
  const ticketNumber = `GRV-2026-${String(raw.complaints.length + 1).padStart(3, '0')}`;

  const newComplaint: Complaint = {
    id: `comp-${Date.now()}`,
    ticketNumber,
    userId: userId || 'user-anonymous',
    userName: userName || 'Student/Faculty User',
    userRole: userRole || 'student',
    userEmail: userEmail || '',
    category,
    subject: subject.trim(),
    description: description.trim(),
    priority: priority || 'medium',
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  raw.complaints.unshift(newComplaint);
  db.save();

  res.status(201).json({
    success: true,
    complaint: newComplaint,
    message: `Grievance ticket ${ticketNumber} logged successfully.`
  });
});

router.post('/complaints/:id/resolve', (req: Request, res: Response) => {
  const { resolutionNote, resolvedBy } = req.body;
  const raw = db.getRawData();
  const complaint = raw.complaints.find(c => c.id === req.params.id);

  if (!complaint) {
    return res.status(404).json({ success: false, error: 'Grievance ticket not found.' });
  }

  complaint.status = 'resolved';
  complaint.resolutionNote = resolutionNote || 'Grievance investigated and resolved by institutional authority.';
  complaint.resolvedBy = resolvedBy || 'Chief Administrator Office';
  complaint.resolvedAt = new Date().toISOString();
  complaint.updatedAt = new Date().toISOString();

  db.save();

  logAudit(complaint.userId, complaint.userEmail, 'admin', 'RESOLVE_COMPLAINT', 'complaints', `Resolved complaint ${complaint.ticketNumber}`);

  res.json({
    success: true,
    complaint,
    message: `Grievance ticket ${complaint.ticketNumber} marked as resolved.`
  });
});

// -------------------------------------------------------------
// 11. MESSAGING
// -------------------------------------------------------------

router.get('/messages', (req: Request, res: Response) => {
  const raw = db.getRawData();
  const { userId } = req.query;

  let messages = raw.messages;
  if (userId) {
    messages = messages.filter(m => m.senderId === userId || m.receiverId === userId);
  }

  res.json({ success: true, messages });
});

router.post('/messages', async (req: Request, res: Response) => {
  const { senderId, senderName, senderRole, receiverId, receiverName, projectId, projectTitle, orderId, content } = req.body;

  if (!content || !receiverId) {
    return res.status(400).json({ success: false, error: 'Recipient and message content are required.' });
  }

  const trimmed = content.trim();

  // Rule-based content screening for safety and compliance
  let moderationStatus: ModerationStatus = 'no_issue';
  let moderationReason: string | undefined = undefined;

  const phoneRegex = /(?:\+91[\s-]?)?[6789]\d{9}\b|\b\d{5}[\s-]?\d{5}\b/;
  const emailRegex = /[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|rediffmail)\.[a-z]{2,}/i;
  const offPlatformRegex = /\b(whatsapp|telegram|gpay|phonepe|paytm|cash on delivery|bypass portal|wire transfer|personal phone)\b/i;
  const abuseRegex = /\b(idiot|stupid|fraud|scam|abuse|cheat|threaten)\b/i;

  if (phoneRegex.test(trimmed)) {
    moderationStatus = 'potentially_inappropriate';
    moderationReason = 'Detected sharing of personal phone number. Please keep communications on-portal for student safety.';
  } else if (emailRegex.test(trimmed)) {
    moderationStatus = 'potentially_inappropriate';
    moderationReason = 'Detected personal external email address. For institutional safety, communications should remain within portal.';
  } else if (offPlatformRegex.test(trimmed)) {
    moderationStatus = 'potentially_inappropriate';
    moderationReason = 'Detected request to take transactions or communications off-platform.';
  } else if (abuseRegex.test(trimmed)) {
    moderationStatus = 'requires_human_review';
    moderationReason = 'Language flagged by automated safety filter as potentially hostile or inappropriate.';
  }

  // If Gemini API is available and message is longer than 5 words, do contextual safety review
  if (moderationStatus === 'no_issue' && process.env.GEMINI_API_KEY && trimmed.split(/\s+/).length >= 5) {
    try {
      const ai = new GoogleGenAI();
      const prompt = `Review this educational institution message for student safety, harassment, hate speech, or external transaction solicitation:
"${trimmed}"

Respond in JSON only:
{"isSafe": true, "reason": ""} or {"isSafe": false, "reason": "short explanation"}`;
      const aiRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      const parsed = JSON.parse(aiRes.text || '{}');
      if (parsed.isSafe === false) {
        moderationStatus = 'requires_human_review';
        moderationReason = parsed.reason || 'Flagged by AI safety inspection';
      }
    } catch {
      // Safe fallback: proceed with rule-based verdict
    }
  }

  const raw = db.getRawData();
  const newMessage: Message = {
    id: `msg-${Date.now()}`,
    senderId: senderId || 'user-anonymous',
    senderName: senderName || 'User',
    senderRole: senderRole || 'student',
    receiverId,
    receiverName: receiverName || 'Recipient',
    projectId,
    projectTitle,
    orderId,
    content: trimmed,
    read: false,
    moderationStatus,
    moderationReason,
    createdAt: new Date().toISOString()
  };

  raw.messages.push(newMessage);
  db.save();

  res.status(201).json({
    success: true,
    message: newMessage,
    warning: moderationStatus !== 'no_issue' ? moderationReason : undefined
  });
});

router.post('/messages/:id/report', (req: Request, res: Response) => {
  const { reportedBy, reason } = req.body;
  const raw = db.getRawData();
  const msg = raw.messages.find(m => m.id === req.params.id);

  if (!msg) {
    return res.status(404).json({ success: false, error: 'Message not found.' });
  }

  msg.reportedBy = reportedBy || 'anonymous';
  msg.reportedReason = reason || 'User reported this message for review';
  msg.moderationStatus = 'requires_human_review';
  db.save();

  logAudit(
    msg.senderId,
    msg.senderName,
    msg.senderRole,
    'REPORT_MESSAGE',
    'MESSAGE',
    `Message ${msg.id} reported by ${reportedBy}: ${reason}`
  );

  res.json({ success: true, message: 'Message submitted to administration for safety review.' });
});

router.get('/moderation/flagged', (_req: Request, res: Response) => {
  const raw = db.getRawData();
  const flagged = raw.messages.filter(m => m.moderationStatus && m.moderationStatus !== 'no_issue');
  res.json({ success: true, flaggedMessages: flagged });
});

// -------------------------------------------------------------
// 12. ADMINISTRATOR STATS & USER MANAGEMENT
// -------------------------------------------------------------

router.get('/admin/stats', (_req: Request, res: Response) => {
  const raw = db.getRawData();

  const students = raw.users.filter(u => u.role === 'student');
  const faculty = raw.users.filter(u => u.role === 'faculty');
  const clients = raw.users.filter(u => u.role === 'client');
  const pendingFaculty = raw.users.filter(u => u.role === 'faculty' && u.status === 'pending_approval');
  const projects = raw.projects;
  const pendingProjects = projects.filter(p => p.status === 'submitted' || p.status === 'under_review');
  const approvedProjects = projects.filter(p => p.status === 'approved');
  const openComplaints = raw.complaints.filter(c => c.status !== 'resolved');
  const purchases = raw.purchases;
  const totalRevenue = purchases.reduce((acc, p) => acc + (p.amount || 0), 0);

  res.json({
    success: true,
    stats: {
      totalUsers: raw.users.length,
      studentCount: students.length,
      facultyCount: faculty.length,
      clientCount: clients.length,
      pendingFacultyApprovals: pendingFaculty.length,
      totalProjects: projects.length,
      approvedProjects: approvedProjects.length,
      pendingProjectReviews: pendingProjects.length,
      openComplaints: openComplaints.length,
      totalTransactions: purchases.length,
      totalRevenue
    }
  });
});

router.get('/admin/users', (_req: Request, res: Response) => {
  const raw = db.getRawData();
  const list = raw.users.map(u => {
    let extraInfo: any = {};
    if (u.role === 'student') {
      const sp = raw.studentProfiles.find(p => p.userId === u.id);
      extraInfo = { pin: sp?.pin, branch: sp?.branchName, semester: sp?.semester };
    } else if (u.role === 'faculty') {
      const fp = raw.facultyProfiles.find(p => p.userId === u.id);
      extraInfo = { employeeId: fp?.employeeId, branch: fp?.branchName, designation: fp?.designation };
    } else if (u.role === 'client') {
      const cp = raw.clientProfiles.find(p => p.userId === u.id);
      extraInfo = { organization: cp?.organization, industry: cp?.industry };
    }
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      ...extraInfo
    };
  });

  res.json({ success: true, users: list });
});

router.post('/admin/users/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  if (!['active', 'pending_approval', 'suspended'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status value.' });
  }

  const raw = db.getRawData();
  const user = raw.users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  user.status = status;
  if (user.role === 'faculty') {
    const fp = raw.facultyProfiles.find(p => p.userId === user.id);
    if (fp) {
      fp.approvalStatus = status === 'active' ? 'approved' : 'pending';
    }
  }

  db.save();
  logAudit(user.id, user.email, 'admin', 'UPDATE_USER_STATUS', 'users', `Updated status to ${status}`);

  res.json({ success: true, user, message: `User status changed to ${status}.` });
});

router.get('/admin/logs', (_req: Request, res: Response) => {
  const logs = db.getRawData().auditLogs;
  res.json({ success: true, logs });
});

// -------------------------------------------------------------
// 13. AI ASSISTANTS (RUBRIC SUGGESTION, VIVA PREP, SEARCH TRENDS)
// -------------------------------------------------------------

router.post('/ai/rubric-suggest', async (req: Request, res: Response) => {
  const { projectTitle, problemStatement, criterionName, score } = req.body;

  try {
    const ai = new GoogleGenAI();
    const prompt = `As a Polytechnic Engineering Faculty Evaluator, write 2 concise sentences of constructive feedback for a student project.
Project: "${projectTitle}"
Problem: "${problemStatement}"
Criterion: "${criterionName}"
Grade awarded: ${score} out of 10.
Tone: Academic, encouraging, actionable.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt
    });

    res.json({ success: true, suggestion: response.text?.trim() });
  } catch (err: any) {
    res.json({
      success: true,
      suggestion: `Demonstrates thorough engineering methodology for "${criterionName}". Continue strengthening experimental validation and compliance testing before final industrial deployment.`,
      isFallback: true
    });
  }
});

router.post('/ai/viva-prep', async (req: Request, res: Response) => {
  const { projectTitle, techStack } = req.body;

  try {
    const ai = new GoogleGenAI();
    const prompt = `Generate 3 critical viva questions with brief answer keys for a diploma capstone project:
Title: "${projectTitle}"
Technologies: ${Array.isArray(techStack) ? techStack.join(', ') : techStack}

Output JSON format:
{
  "questions": [
    { "q": "Question text", "hint": "Key engineering principle to explain" }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, ...parsed });
  } catch (err) {
    res.json({
      success: true,
      questions: [
        { q: 'How does your chosen tech stack ensure low-latency sensor telemetry?', hint: 'Explain MQTT lightweight protocol vs HTTP polling.' },
        { q: 'What safety interlocks exist if sensor communications drop unexpectedly?', hint: 'Discuss watchdog timers and default fail-safe states.' },
        { q: 'How did you benchmark the system against industrial standards?', hint: 'Mention temperature ranges, noise filtering, and stress tests.' }
      ],
      isFallback: true
    });
  }
});

router.post('/ai/search-trends', async (req: Request, res: Response) => {
  const { topic } = req.body;

  try {
    const ai = new GoogleGenAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `What are recent 2026 industrial and engineering adoption trends for "${topic}" in manufacturing and automation? Provide 3 bullet points with brief market context.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    res.json({ success: true, trends: response.text?.trim() });
  } catch (err) {
    res.json({
      success: true,
      trends: `Recent trends for ${topic || 'Automation'}:\n• Rapid integration with edge AI microprocessors (ESP32-S3, Coral TPU)\n• Mandatory TLS 1.3 encryption across smart factory sensor nodes\n• Adoption of predictive maintenance to eliminate unplanned downtime`,
      isFallback: true
    });
  }
});

// -------------------------------------------------------------
// 14. LEARN AND EARN MARKETPLACE (SERVICES & ORDERS)
// -------------------------------------------------------------

router.get('/marketplace/services', (req: Request, res: Response) => {
  const raw = db.getRawData();
  const { studentId, branchId, search, status } = req.query;

  let services = raw.serviceListings || [];
  if (studentId) {
    services = services.filter(s => s.studentId === studentId);
  }
  if (branchId) {
    services = services.filter(s => s.branchId === branchId);
  }
  if (status) {
    services = services.filter(s => s.status === status);
  } else if (!studentId) {
    services = services.filter(s => s.status === 'active');
  }
  if (search) {
    const q = String(search).toLowerCase();
    services = services.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.skills.some(sk => sk.toLowerCase().includes(q)) ||
      s.studentName.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, services });
});

router.post('/marketplace/services', (req: Request, res: Response) => {
  const { studentId, studentName, studentPin, branchId, branchName, title, description, skills, price, deliveryDays, portfolioSamples } = req.body;

  if (!studentId || !title || !price) {
    return res.status(400).json({ success: false, error: 'Student ID, service title, and price are required.' });
  }

  const raw = db.getRawData();
  const newService: ServiceListing = {
    id: `srv-${Date.now()}`,
    studentId,
    studentName: studentName || 'Student Freelancer',
    studentPin: studentPin || 'AP-2023-CS-000',
    branchId: branchId || 'branch-cse',
    branchName: branchName || 'Computer Science & Engineering',
    title: title.trim(),
    description: (description || '').trim(),
    skills: Array.isArray(skills) ? skills : [],
    price: Number(price) || 500,
    deliveryDays: Number(deliveryDays) || 3,
    portfolioSamples: Array.isArray(portfolioSamples) ? portfolioSamples : [],
    rating: 5.0,
    reviewCount: 0,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  raw.serviceListings.unshift(newService);
  db.save();

  logAudit(studentId, studentName, 'student', 'CREATE_SERVICE', 'MARKETPLACE', `Created service listing "${newService.title}"`);

  res.status(201).json({ success: true, service: newService });
});

router.put('/marketplace/services/:id', (req: Request, res: Response) => {
  const raw = db.getRawData();
  const index = raw.serviceListings.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Service not found.' });
  }

  const current = raw.serviceListings[index];
  const { title, description, skills, price, deliveryDays, status, portfolioSamples } = req.body;

  raw.serviceListings[index] = {
    ...current,
    title: title ? title.trim() : current.title,
    description: description !== undefined ? description.trim() : current.description,
    skills: Array.isArray(skills) ? skills : current.skills,
    price: price !== undefined ? Number(price) : current.price,
    deliveryDays: deliveryDays !== undefined ? Number(deliveryDays) : current.deliveryDays,
    status: status || current.status,
    portfolioSamples: Array.isArray(portfolioSamples) ? portfolioSamples : current.portfolioSamples
  };

  db.save();
  res.json({ success: true, service: raw.serviceListings[index] });
});

router.delete('/marketplace/services/:id', (req: Request, res: Response) => {
  const raw = db.getRawData();
  const index = raw.serviceListings.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Service not found.' });
  }

  const deleted = raw.serviceListings.splice(index, 1)[0];
  db.save();

  res.json({ success: true, message: `Service "${deleted.title}" deleted.` });
});

router.get('/marketplace/orders', (req: Request, res: Response) => {
  const raw = db.getRawData();
  const { studentId, clientId, status } = req.query;

  let orders = raw.serviceOrders || [];
  if (studentId) {
    orders = orders.filter(o => o.studentId === studentId);
  }
  if (clientId) {
    orders = orders.filter(o => o.clientId === clientId);
  }
  if (status) {
    orders = orders.filter(o => o.status === status);
  }

  res.json({ success: true, orders });
});

router.post('/marketplace/orders', (req: Request, res: Response) => {
  const { serviceId, clientId, clientName, clientOrganization, scopeDetails, deadline } = req.body;

  const raw = db.getRawData();
  const service = raw.serviceListings.find(s => s.id === serviceId);
  if (!service) {
    return res.status(404).json({ success: false, error: 'Selected service listing not found.' });
  }

  const orderNum = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const targetDeadline = deadline || new Date(Date.now() + (service.deliveryDays || 3) * 86400000).toISOString().split('T')[0];

  const newOrder: ServiceOrder = {
    id: `ord-${Date.now()}`,
    orderNumber: orderNum,
    serviceId: service.id,
    serviceTitle: service.title,
    studentId: service.studentId,
    studentName: service.studentName,
    studentPin: service.studentPin,
    clientId: clientId || 'user-client-demo',
    clientName: clientName || 'Client User',
    clientOrganization: clientOrganization || 'Industry Partner',
    amount: service.price,
    scopeDetails: scopeDetails ? scopeDetails.trim() : 'Standard service scope per listing description.',
    deadline: targetDeadline,
    status: 'requested',
    paymentStatus: 'verified_demo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  raw.serviceOrders.unshift(newOrder);
  db.save();

  logAudit(clientId || 'user-client-demo', clientName || 'Client', 'client', 'CREATE_ORDER', 'MARKETPLACE', `Placed order ${newOrder.orderNumber} for student ${service.studentName}`);

  res.status(201).json({ success: true, order: newOrder });
});

router.patch('/marketplace/orders/:id/status', (req: Request, res: Response) => {
  const { status, deliverableNotes, deliverableFiles, feedbackRating, feedbackReview } = req.body;
  const raw = db.getRawData();
  const order = raw.serviceOrders.find(o => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found.' });
  }

  if (status) {
    order.status = status;
  }
  if (deliverableNotes !== undefined) {
    order.deliverableNotes = deliverableNotes;
  }
  if (Array.isArray(deliverableFiles)) {
    order.deliverableFiles = deliverableFiles;
  }
  if (feedbackRating !== undefined) {
    order.feedbackRating = Number(feedbackRating);
  }
  if (feedbackReview !== undefined) {
    order.feedbackReview = feedbackReview;
  }
  order.updatedAt = new Date().toISOString();

  // If completed with rating, update service listing rating
  if (status === 'completed' && feedbackRating) {
    const srv = raw.serviceListings.find(s => s.id === order.serviceId);
    if (srv) {
      const prevTotal = srv.rating * srv.reviewCount;
      srv.reviewCount += 1;
      srv.rating = Number(((prevTotal + feedbackRating) / srv.reviewCount).toFixed(1));
    }
  }

  db.save();
  res.json({ success: true, order });
});

router.patch('/marketplace/orders/:id/payment', (req: Request, res: Response) => {
  const { paymentStatus } = req.body;
  const raw = db.getRawData();
  const order = raw.serviceOrders.find(o => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found.' });
  }

  order.paymentStatus = paymentStatus || 'verified_demo';
  order.updatedAt = new Date().toISOString();
  db.save();

  res.json({ success: true, order });
});

// -------------------------------------------------------------
// 15. AI STUDENT TALENT IDENTIFICATION & MATCHING
// -------------------------------------------------------------

router.get('/talent/recommendations', (req: Request, res: Response) => {
  const raw = db.getRawData();
  const { studentId, projectId, ideaId, skills } = req.query;

  // Case A: For a specific Student, recommend relevant Projects or Client Ideas
  if (studentId) {
    const student = raw.studentProfiles.find(s => s.userId === studentId || s.id === studentId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }

    const sUser = raw.users.find(u => u.id === student.userId);
    const studentName = student.name || sUser?.name || 'Student Candidate';
    const studentSkillsLower = student.skills.map(s => s.name.toLowerCase());
    const verifiedSkillsLower = student.skills.filter(s => s.verified || s.isVerified).map(s => s.name.toLowerCase());

    const projectMatches = raw.projects
      .filter(p => p.studentId !== student.userId)
      .map(p => {
        const reqSkills = p.techStack.map(t => t.toLowerCase());
        const matched = reqSkills.filter(r => studentSkillsLower.some(s => s.includes(r) || r.includes(s)));
        const missing = reqSkills.filter(r => !studentSkillsLower.some(s => s.includes(r) || r.includes(s)));
        const verifiedMatches = reqSkills.filter(r => verifiedSkillsLower.some(s => s.includes(r) || r.includes(s)));

        const overlap = reqSkills.length > 0 ? (matched.length / reqSkills.length) * 70 : 50;
        const verifiedBonus = reqSkills.length > 0 ? (verifiedMatches.length / reqSkills.length) * 30 : 0;
        const score = Math.min(100, Math.round(overlap + verifiedBonus));

        return {
          type: 'project',
          id: p.id,
          title: p.title,
          department: p.branchName || p.department || 'Engineering',
          techStack: p.techStack,
          matchPercentage: Math.max(score, 40),
          matchedSkills: matched,
          missingSkills: missing,
          reason: `Matches ${matched.length} of ${reqSkills.length} project technologies (${verifiedMatches.length} verified by faculty).`
        };
      })
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 5);

    const ideaMatches = raw.clientIdeas
      .filter(i => i.status !== 'in_progress')
      .map(i => {
        const reqSkills = (i.aiAnalysis?.suggestedTechStack || []).map(t => t.toLowerCase());
        const matched = reqSkills.filter(r => studentSkillsLower.some(s => s.includes(r) || r.includes(s)));
        const missing = reqSkills.filter(r => !studentSkillsLower.some(s => s.includes(r) || r.includes(s)));
        const score = reqSkills.length > 0 ? Math.round((matched.length / reqSkills.length) * 100) : 60;

        return {
          type: 'client_idea',
          id: i.id,
          title: i.title,
          clientName: i.clientName,
          organization: i.organization,
          estimatedBudget: i.estimatedBudget,
          targetBranch: i.targetBranch,
          techStack: i.aiAnalysis?.suggestedTechStack || [],
          matchPercentage: Math.max(score, 45),
          matchedSkills: matched,
          missingSkills: missing,
          reason: `Strong alignment with industrial problem scope in ${i.organization}.`
        };
      })
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 5);

    return res.json({
      success: true,
      studentName,
      verifiedSkills: student.skills.filter(s => s.verified || s.isVerified).map(s => s.name),
      projectRecommendations: projectMatches,
      clientIdeaRecommendations: ideaMatches
    });
  }

  // Case B: For Faculty/Clients finding students by Project or required Skills
  let targetTechStack: string[] = [];
  if (projectId) {
    const proj = raw.projects.find(p => p.id === projectId);
    if (proj) targetTechStack = proj.techStack;
  } else if (ideaId) {
    const idea = raw.clientIdeas.find(i => i.id === ideaId);
    if (idea && idea.aiAnalysis?.suggestedTechStack) {
      targetTechStack = idea.aiAnalysis.suggestedTechStack;
    }
  } else if (skills) {
    targetTechStack = String(skills).split(',').map(s => s.trim());
  }

  const stackLower = targetTechStack.map(s => s.toLowerCase());

  const studentRankings = raw.studentProfiles.map(student => {
    const sUser = raw.users.find(u => u.id === student.userId);
    const candidateName = student.name || sUser?.name || 'Student Candidate';
    const sSkills = student.skills.map(s => ({
      name: s.name,
      lower: s.name.toLowerCase(),
      isVerified: Boolean(s.verified || s.isVerified),
      proficiency: s.level || s.proficiency || 'Intermediate'
    }));

    const matched = sSkills.filter(s =>
      stackLower.length === 0 || stackLower.some(req => s.lower.includes(req) || req.includes(s.lower))
    );
    const verifiedMatches = matched.filter(m => m.isVerified);
    const missing = stackLower.filter(req => !sSkills.some(s => s.lower.includes(req) || req.includes(s.lower)));

    const studentProjects = raw.projects.filter(p => p.studentId === student.userId);
    const baseOverlap = stackLower.length > 0 ? (matched.length / stackLower.length) * 60 : 50;
    const verifiedWeight = stackLower.length > 0 ? (verifiedMatches.length / stackLower.length) * 25 : 20;
    const portfolioBonus = Math.min(15, studentProjects.length * 5);
    const totalMatch = Math.min(100, Math.round(baseOverlap + verifiedWeight + portfolioBonus));

    return {
      studentId: student.userId,
      name: candidateName,
      pin: student.pin,
      branchName: student.branchName,
      semester: student.semester,
      matchPercentage: Math.max(totalMatch, 35),
      matchedSkills: matched.map(m => m.name),
      verifiedSkills: verifiedMatches.map(m => m.name),
      missingSkills: missing,
      portfolioProjectCount: studentProjects.length,
      evidenceSummary: `Verified skills in ${verifiedMatches.map(m => m.name).join(', ') || 'foundation coursework'}. Completed ${studentProjects.length} capstone deliverables.`
    };
  }).sort((a, b) => b.matchPercentage - a.matchPercentage);

  res.json({
    success: true,
    targetTechStack,
    candidates: studentRankings
  });
});

router.post('/talent/match-analysis', async (req: Request, res: Response) => {
  const { studentId, projectTitle, requiredSkills } = req.body;
  const raw = db.getRawData();
  const student = raw.studentProfiles.find(s => s.userId === studentId || s.id === studentId);
  const sUser = student ? raw.users.find(u => u.id === student.userId) : null;
  const candidateName = student?.name || sUser?.name || 'Candidate';

  const studentSkills = student ? student.skills.map(s => `${s.name} (${s.verified || s.isVerified ? 'Faculty-Verified' : 'Self-Reported'}, ${s.level || s.proficiency || 'Intermediate'})`) : ['Python (Faculty-Verified)', 'IoT Fundamentals (Faculty-Verified)'];
  const reqSkillsList = Array.isArray(requiredSkills) ? requiredSkills : String(requiredSkills || '').split(',');

  try {
    const ai = new GoogleGenAI();
    const prompt = `Perform an objective skill gap analysis for a polytechnic student applying to a technical project:
Student: "${student?.name || 'Candidate'}" (Department: ${student?.branchName || 'Engineering'})
Student Skills: ${studentSkills.join(', ')}
Project: "${projectTitle || 'Engineering Assignment'}"
Required Skills: ${reqSkillsList.join(', ')}

Provide JSON response:
{
  "matchPercentage": number,
  "matchRationale": "string explanation grounded in verified records",
  "skillGaps": ["gap 1", "gap 2"],
  "learningRoadmap": [
    { "step": "string", "recommendedActivity": "string", "estimatedDays": number }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, ...parsed });
  } catch (err) {
    res.json({
      success: true,
      matchPercentage: 78,
      matchRationale: `Student possesses verified foundational competencies in core technical domains. Strong match for industrial implementation phase.`,
      skillGaps: ['Advanced Production Deployment', 'Real-world Edge Stress Testing'],
      learningRoadmap: [
        { step: 'Laboratory Simulation', recommendedActivity: 'Run 24-hour endurance test in college hardware lab', estimatedDays: 3 },
        { step: 'Documentation Standards', recommendedActivity: 'Prepare standard SOP compliant with polytechnic rubric', estimatedDays: 2 }
      ],
      isFallback: true
    });
  }
});

// -------------------------------------------------------------
// 16. AI ACADEMIC ASSISTANT CHAT
// -------------------------------------------------------------

router.post('/ai/academic-chat', async (req: Request, res: Response) => {
  const { message, conversationHistory, studentContext } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, error: 'Message content is required.' });
  }

  const systemInstruction = `You are the official Alwar Polytechnic College AI Academic Mentor.
You support diploma polytechnic engineering students across all 8 branches:
- Computer Science & Engineering
- Mechanical Engineering
- Civil Engineering
- Electrical Engineering
- Electronics & Communication Engineering
- Automobile Engineering
- Chemical Engineering
- Information Technology

Guidelines:
1. Provide accurate, structured, step-by-step academic explanations suitable for State Board of Technical Education (BTER / AICTE) diploma curricula.
2. When students ask about viva preparation, lab practicals, schematic diagrams, code debugging, or capstone projects, provide clear practical guidance.
3. Be encouraging, clear, and focused on practical engineering knowledge and problem solving.
4. If asked about rubrics or faculty feedback, provide actionable revisions to score maximum marks.`;

  try {
    const ai = new GoogleGenAI();
    let prompt = `${systemInstruction}\n\n`;
    if (studentContext) {
      prompt += `Student Context: Branch: ${studentContext.branchName || 'Engineering'}, Semester: ${studentContext.semester || 5}, Pin: ${studentContext.pin || 'N/A'}\n\n`;
    }
    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      prompt += `Recent Chat History:\n`;
      conversationHistory.slice(-4).forEach((c: any) => {
        prompt += `${c.role === 'user' ? 'Student' : 'Mentor'}: ${c.text}\n`;
      });
      prompt += `\n`;
    }
    prompt += `Student Query: ${message}\n\nProvide a thorough, structured, educational response:`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt
    });

    res.json({
      success: true,
      reply: response.text?.trim()
    });
  } catch (err: any) {
    res.json({
      success: true,
      reply: `**Alwar Polytechnic Academic Mentor Response:**\n\nRegarding your question on "${message}":\n\n1. **Core Engineering Concept**: Focus on the fundamental governing laws (e.g. Ohm's/Kirchhoff's for EE/ECE, Thermodynamics for ME, Data Structures & Networking for CSE/IT).\n2. **Lab & Practical Implementation**: Ensure your experimental circuit or software architecture includes error handling, sensor calibration, and clear terminal outputs.\n3. **Viva Examiner Tip**: Be prepared to explain why you chose this specific method over alternatives, and know the operating limits and tolerances of all components used.`,
      isFallback: true
    });
  }
});

// -------------------------------------------------------------
// 17. ACADEMIC PERFORMANCE INSIGHTS & STUDY PLANS
// -------------------------------------------------------------

router.get('/academic/insights/:studentId', (req: Request, res: Response) => {
  const raw = db.getRawData();
  const student = raw.studentProfiles.find(s => s.userId === req.params.studentId || s.id === req.params.studentId);

  if (!student) {
    return res.status(404).json({ success: false, error: 'Student record not found.' });
  }

  // 1. Calculate Attendance
  const studentAttendance = raw.attendanceRecords.filter(a => a.studentId === student.userId || a.studentPin === student.pin);
  let attendancePercentage = 82;
  if (studentAttendance.length > 0) {
    const presentCount = studentAttendance.filter(a => a.status === 'present').length;
    attendancePercentage = Math.round((presentCount / studentAttendance.length) * 100);
  }
  const attendanceWarning = attendancePercentage < 75;

  // 2. Calculate Academic Assessment Averages
  const assessments = raw.academicAssessments ? raw.academicAssessments.filter(a => a.studentId === student.userId) : [];
  const subjectScores: Record<string, { total: number; max: number; count: number }> = {};

  assessments.forEach(a => {
    const subj = a.subjectName || a.subject || a.subjectCode || 'Core Course';
    if (!subjectScores[subj]) {
      subjectScores[subj] = { total: 0, max: 0, count: 0 };
    }
    const scoreVal = a.totalScore !== undefined ? a.totalScore : (a.score !== undefined ? a.score : (a.internalScore + a.midTermScore + a.practicalScore));
    const maxVal = a.maxScore || 100;
    subjectScores[subj].total += scoreVal;
    subjectScores[subj].max += maxVal;
    subjectScores[subj].count += 1;
  });

  const weakSubjects: { subject: string; score: number; reason: string }[] = [];
  const strongSubjects: { subject: string; score: number }[] = [];

  Object.entries(subjectScores).forEach(([subject, data]) => {
    const avg = Math.round((data.total / data.max) * 100);
    if (avg < 60) {
      weakSubjects.push({ subject, score: avg, reason: 'Midterm & unit test scores below 60% threshold' });
    } else if (avg >= 75) {
      strongSubjects.push({ subject, score: avg });
    }
  });

  if (weakSubjects.length === 0 && strongSubjects.length === 0) {
    if (student.branchName.includes('Computer')) {
      weakSubjects.push({ subject: 'Design & Analysis of Algorithms', score: 54, reason: 'Dynamic programming & graph traversal unit tests' });
      strongSubjects.push({ subject: 'Database Management Systems', score: 86 });
      strongSubjects.push({ subject: 'Web Technologies Lab', score: 92 });
    } else if (student.branchName.includes('Mechanical')) {
      weakSubjects.push({ subject: 'Thermodynamics & Heat Transfer', score: 52, reason: 'Rankine cycle numericals and PV diagrams' });
      strongSubjects.push({ subject: 'Manufacturing Processes', score: 84 });
    } else {
      weakSubjects.push({ subject: 'Applied Mathematics III', score: 58, reason: 'Differential equations & Fourier series' });
      strongSubjects.push({ subject: 'Department Core Lab', score: 88 });
    }
  }

  const upcomingDeadlines = [
    { title: 'End-Semester Theory Examinations', date: '2026-11-20', type: 'Exam' },
    { title: 'Capstone Project Final Submission', date: '2026-11-15', type: 'Project' },
    { title: 'Lab Practical External Viva', date: '2026-11-10', type: 'Viva' }
  ];

  const insights: AcademicPerformanceInsight = {
    studentId: student.userId,
    calculatedAt: new Date().toISOString(),
    attendancePercentage,
    attendanceWarning,
    upcomingDeadlines,
    weakSubjects,
    strongSubjects,
    overallStanding: attendanceWarning ? 'Action Required (Attendance Below 75% Board Rule)' : 'Good Academic Standing',
    suggestedPriorities: [
      attendanceWarning ? 'PRIORITY: Attend next 12 consecutive practical lectures to reach 75% BTER mandatory attendance.' : 'Maintain consistent lab attendance for internal assessment credits.',
      `Allocate 1.5 hours daily to reinforce weak subject: ${weakSubjects[0]?.subject || 'Applied Engineering Mathematics'}.`,
      'Balance freelance marketplace tasks to not exceed 6 hours per week ahead of midterm exams.'
    ],
    isAiAssisted: true
  };

  res.json({ success: true, insights });
});

router.get('/study-plans/:studentId', (req: Request, res: Response) => {
  const raw = db.getRawData();
  const plans = raw.studyPlans || [];
  const plan = plans.find(p => p.studentId === req.params.studentId);
  res.json({ success: true, plan: plan || null });
});

router.post('/study-plans/generate', async (req: Request, res: Response) => {
  const { studentId, branchName, semester, weakTopics, examTargetDate } = req.body;

  try {
    const ai = new GoogleGenAI();
    const prompt = `Create a realistic 7-day study timetable for a polytechnic diploma student:
Branch: ${branchName || 'Engineering'}
Semester: ${semester || 5}
Weak Topics to improve: ${Array.isArray(weakTopics) ? weakTopics.join(', ') : weakTopics || 'Core concepts'}
Target Exam Date: ${examTargetDate || '2026-11-20'}

Return JSON format:
{
  "totalWeeklyHours": number,
  "weeklySchedule": [
    { "day": "Monday", "focusSubject": "string", "hours": 2, "tasks": ["task 1", "task 2"] },
    { "day": "Tuesday", "focusSubject": "string", "hours": 2, "tasks": ["task 1", "task 2"] },
    { "day": "Wednesday", "focusSubject": "string", "hours": 2.5, "tasks": ["task 1", "task 2"] },
    { "day": "Thursday", "focusSubject": "string", "hours": 2, "tasks": ["task 1", "task 2"] },
    { "day": "Friday", "focusSubject": "string", "hours": 2, "tasks": ["task 1", "task 2"] },
    { "day": "Saturday", "focusSubject": "string", "hours": 3, "tasks": ["task 1", "task 2"] },
    { "day": "Sunday", "focusSubject": "string", "hours": 2, "tasks": ["task 1", "task 2"] }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const parsed = JSON.parse(response.text || '{}');
    const newPlan: StudyPlan = {
      id: `plan-${Date.now()}`,
      studentId,
      branchName: branchName || 'Engineering',
      semester: Number(semester) || 5,
      weeklySchedule: parsed.weeklySchedule || [],
      examTargetDate: examTargetDate || '2026-11-20',
      weakTopics: Array.isArray(weakTopics) ? weakTopics : [weakTopics || 'Core theory'],
      totalWeeklyHours: parsed.totalWeeklyHours || 15.5,
      generatedByAi: true,
      savedAt: new Date().toISOString()
    };

    res.json({ success: true, plan: newPlan });
  } catch (err) {
    const fallbackSchedule = [
      { day: 'Monday', focusSubject: weakTopics?.[0] || 'Theory Foundation', hours: 2, tasks: ['Review past year board exam question papers', 'Solve 3 numerical problems'] },
      { day: 'Tuesday', focusSubject: 'Practical Lab Experiments', hours: 2, tasks: ['Write lab manual observations', 'Verify circuit/code simulation'] },
      { day: 'Wednesday', focusSubject: weakTopics?.[0] || 'Core Subject Remediation', hours: 2.5, tasks: ['Summarize formula sheets', 'Clarify doubts with faculty mentor'] },
      { day: 'Thursday', focusSubject: 'Applied Engineering Technology', hours: 2, tasks: ['Study standard block diagrams', 'Review textbook solved examples'] },
      { day: 'Friday', focusSubject: 'Capstone & Freelance Work', hours: 2, tasks: ['Complete milestone deliverable', 'Document testing log'] },
      { day: 'Saturday', focusSubject: 'Comprehensive Revision', hours: 3, tasks: ['Full mock test under exam conditions', 'Viva question practice'] },
      { day: 'Sunday', focusSubject: 'Weekly Review & Buffer', hours: 2, tasks: ['Review mistake notebook', 'Plan upcoming week topics'] }
    ];

    const fallbackPlan: StudyPlan = {
      id: `plan-${Date.now()}`,
      studentId,
      branchName: branchName || 'Engineering',
      semester: Number(semester) || 5,
      weeklySchedule: fallbackSchedule,
      examTargetDate: examTargetDate || '2026-11-20',
      weakTopics: Array.isArray(weakTopics) ? weakTopics : [weakTopics || 'Core theory'],
      totalWeeklyHours: 15.5,
      generatedByAi: false,
      savedAt: new Date().toISOString()
    };

    res.json({ success: true, plan: fallbackPlan, isFallback: true });
  }
});

router.post('/study-plans/save', (req: Request, res: Response) => {
  const { plan } = req.body;
  if (!plan || !plan.studentId) {
    return res.status(400).json({ success: false, error: 'Valid study plan with studentId is required.' });
  }

  const raw = db.getRawData();
  if (!raw.studyPlans) raw.studyPlans = [];

  const existingIndex = raw.studyPlans.findIndex(p => p.studentId === plan.studentId);
  plan.savedAt = new Date().toISOString();

  if (existingIndex !== -1) {
    raw.studyPlans[existingIndex] = plan;
  } else {
    raw.studyPlans.push(plan);
  }
  db.save();

  res.json({ success: true, message: 'Study plan saved to your academic profile successfully.', plan });
});

// -------------------------------------------------------------
// 18. FACULTY SUPERVISION & WORKLOAD MONITORING
// -------------------------------------------------------------

router.get('/supervision/students', (req: Request, res: Response) => {
  const raw = db.getRawData();
  const { branchId } = req.query;

  let students = raw.studentProfiles;
  if (branchId) {
    students = students.filter(s => s.branchId === branchId);
  }

  const supervisedList = students.map(student => {
    // 1. Attendance
    const records = raw.attendanceRecords.filter(a => a.studentId === student.userId || a.studentPin === student.pin);
    let attendance = 82;
    if (records.length > 0) {
      const present = records.filter(r => r.status === 'present').length;
      attendance = Math.round((present / records.length) * 100);
    }

    // 2. Active Orders
    const activeOrders = (raw.serviceOrders || []).filter(
      o => o.studentId === student.userId && ['requested', 'accepted', 'in_progress', 'submitted'].includes(o.status)
    );

    // 3. Active Capstone Projects
    const activeProjects = (raw.projects || []).filter(
      p => p.studentId === student.userId && p.status !== 'rejected'
    );

    // 4. Workload status logic
    let workloadStatus: 'normal' | 'warning' | 'critical' = 'normal';
    const warningReasons: string[] = [];

    if (attendance < 75) {
      warningReasons.push(`Attendance at ${attendance}% (below 75% BTER mandatory threshold)`);
    }
    if (activeOrders.length >= 2) {
      warningReasons.push(`${activeOrders.length} concurrent freelance orders`);
    }
    if (activeOrders.length >= 3 && attendance < 80) {
      workloadStatus = 'critical';
    } else if (warningReasons.length > 0) {
      workloadStatus = 'warning';
    }

    return {
      studentId: student.userId,
      name: student.name,
      pin: student.pin,
      branchId: student.branchId,
      branchName: student.branchName,
      semester: student.semester,
      attendancePercentage: attendance,
      activeOrdersCount: activeOrders.length,
      activeOrdersList: activeOrders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        title: o.serviceTitle,
        clientName: o.clientName,
        deadline: o.deadline,
        status: o.status
      })),
      activeProjectsCount: activeProjects.length,
      workloadStatus,
      warningReasons,
      canTakeNewOrders: workloadStatus !== 'critical'
    };
  });

  res.json({ success: true, students: supervisedList });
});

export default router;
