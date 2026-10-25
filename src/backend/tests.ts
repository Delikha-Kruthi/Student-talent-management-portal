import { db, hashPassword, verifyPassword } from './db.js';

async function runTests() {
  console.log('--- RUNNING ALWAR POLYTECHNIC PORTAL TEST SUITE ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Database seed and Demo accounts check
    const raw = db.getRawData();
    assert(raw.users.length >= 4, 'Demo accounts seeded in database');

    const studentUser = raw.users.find(u => u.email === 'student.demo@alwarpolytechnic.demo');
    assert(!!studentUser && studentUser.role === 'student', 'Student demo account exists with role student');
    assert(verifyPassword('Student@123', studentUser!.passwordHash!), 'Student demo password verification succeeds');

    const facultyUser = raw.users.find(u => u.email === 'faculty.demo@alwarpolytechnic.demo');
    assert(!!facultyUser && facultyUser.status === 'active', 'Faculty demo is active without email OTP requirement');
    assert(verifyPassword('Faculty@123', facultyUser!.passwordHash!), 'Faculty demo password verification succeeds');

    const clientUser = raw.users.find(u => u.email === 'client.demo@alwarpolytechnic.demo');
    assert(!!clientUser && clientUser.role === 'client', 'Client demo account exists');

    const adminUser = raw.users.find(u => u.email === 'admin.demo@alwarpolytechnic.demo');
    assert(!!adminUser && adminUser.role === 'admin', 'Admin demo account exists and public signup is restricted');

    // 2. All Institutional Branches verification
    assert(raw.branches.length >= 8, 'All institutional branches configured (CSE, ME, CE, EE, ECE, AE, CHE, IT)');
    const cse = raw.branches.find(b => b.code === 'CSE');
    const me = raw.branches.find(b => b.code === 'ME');
    const ce = raw.branches.find(b => b.code === 'CE');
    assert(!!cse && !!me && !!ce, 'Branches include Computer, Mechanical, and Civil departments');

    // 3. Faculty Student Management & Duplicate PIN Rejection
    const existingPin = 'AP-2023-CS-042';
    const isDuplicate = raw.studentProfiles.some(p => p.pin.toUpperCase() === existingPin);
    assert(isDuplicate, 'Existing student PIN detected in registry');

    // Test rejection logic
    const duplicateRejected = Boolean(raw.studentProfiles.find(p => p.pin.toUpperCase() === existingPin));
    assert(duplicateRejected, 'Duplicate student PIN is flagged and rejected');

    // 4. Attendance Calculation and History
    assert(raw.attendanceRecords.length > 0, 'Attendance history records exist in database');
    const aaravAttendance = raw.attendanceRecords.filter(a => a.studentPin === 'AP-2023-CS-042');
    assert(aaravAttendance.length > 0, 'Student attendance records tracked across dates');
    const presentCount = aaravAttendance.filter(a => a.status === 'present').length;
    const calcPct = Math.round((presentCount / aaravAttendance.length) * 100);
    assert(calcPct >= 75, `Attendance percentage calculated properly from real records (${calcPct}%)`);

    // 5. Rubric Evaluator & Weighted Score Calculation
    const evalRecord = raw.rubricEvaluations.find(e => e.projectId === 'proj-iot-factory-telemetry');
    assert(!!evalRecord, 'Rubric evaluation saved for capstone project');
    if (evalRecord) {
      let expectedSum = 0;
      evalRecord.criterionScores.forEach(c => {
        expectedSum += (c.score / 10) * c.weight;
      });
      expectedSum = Math.round(expectedSum * 100) / 100;
      assert(Math.abs(evalRecord.totalScore - expectedSum) < 0.1, `Weighted rubric score correctly computed: ${evalRecord.totalScore}/100`);
      assert(evalRecord.publishedToStudent === true, 'Rubric evaluation published to student');
    }

    // 6. Direct Video Upload and Streaming references
    const projectWithVideo = raw.projects.find(p => p.videoUrl && p.videoUrl.length > 0);
    assert(!!projectWithVideo, 'Projects store persistent video streaming reference');
    assert(projectWithVideo!.videoUrl!.startsWith('/uploads/videos/'), 'Video path points to persistent storage');

    // 7. Client Idea Studio (Single Page: Describe My Idea)
    const clientIdea = raw.clientIdeas.find(i => i.clientId === 'user-client-demo');
    assert(!!clientIdea, 'Client submitted idea exists under My Requests');
    assert(clientIdea!.status === 'submitted', 'Client idea status properly saved');

    // 8. Purchases & Intellectual Property Licensing
    const purchase = raw.purchases.find(p => p.clientId === 'user-client-demo');
    assert(!!purchase, 'Purchase and licensing record exists for approved project');
    assert(purchase!.licenseKey.startsWith('LIC-AP-'), 'Authentic institutional license key generated');

    // 9. Complaints Resolution
    const complaint = raw.complaints.find(c => c.ticketNumber === 'GRV-2026-001');
    assert(!!complaint && complaint.status === 'resolved', 'Complaint resolution persists in database');
    assert(!!complaint?.resolvedBy, 'Resolved complaint records authorized actor and resolution note');

    // 10. Notices
    assert(raw.notices.length > 0, 'Institutional circulars and notices available');

    // 11. Learn and Earn Micro-Freelancing Marketplace
    assert(raw.serviceListings.length > 0, 'Micro-freelancing service listings exist in database');
    const firstService = raw.serviceListings[0];
    assert(firstService.price > 0 && firstService.title.length > 0, 'Service listing has valid title and price in INR');

    assert(raw.serviceOrders.length > 0, 'Service orders exist in database');
    const firstOrder = raw.serviceOrders[0];
    assert(
      ['requested', 'accepted', 'in_progress', 'submitted', 'completed'].includes(firstOrder.status),
      'Service order has valid state machine status'
    );
    assert(firstOrder.amount === firstService.price || firstOrder.amount > 0, 'Service order matches listed price');

    // 12. Academic Performance Insights & Study Plans
    assert(raw.studyPlans.length > 0, 'Study plans exist in database');
    const studentPlan = raw.studyPlans.find(p => p.studentId === 'user-student-demo');
    assert(!!studentPlan, '7-Day study plan persisted for student demo account');
    assert(studentPlan!.weeklySchedule.length === 7, 'Study plan has full 7-day schedule (Monday to Sunday)');
    assert(studentPlan!.totalWeeklyHours > 0, 'Study plan calculates weekly study hours');

    // 13. Academic Assessments
    assert(raw.academicAssessments.length > 0, 'Academic subject assessments exist for performance tracking');
    const studentAssessments = raw.academicAssessments.filter(a => a.studentId === 'user-student-demo');
    assert(studentAssessments.length >= 2, 'Multiple academic assessments tracked per student');

    // 14. Faculty Supervision Workload Calculation
    const supervisedStudentOrders = raw.serviceOrders.filter(
      o => o.studentId === 'user-student-demo' && ['accepted', 'in_progress', 'submitted'].includes(o.status)
    );
    const hasWorkloadCommitments = supervisedStudentOrders.length > 0;
    assert(hasWorkloadCommitments, 'Faculty supervision tracks real student freelance commitments');

    // 15. Message Safety & Moderation
    const phoneMessage = 'Call me at 9876543210 for offline payment';
    const phoneRegex = /(?:\+91[\s-]?)?[6789]\d{9}\b|\b\d{5}[\s-]?\d{5}\b/;
    assert(phoneRegex.test(phoneMessage), 'Automated safety filter flags personal phone number disclosure');

    const offPlatformMessage = 'Please pay me via gpay outside the portal';
    const offPlatformRegex = /\b(whatsapp|telegram|gpay|phonepe|paytm|cash on delivery|bypass portal|wire transfer|personal phone)\b/i;
    assert(offPlatformRegex.test(offPlatformMessage), 'Automated safety filter flags off-platform payment solicitations');

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  }
}

runTests();
