const school = {
  name: "Greenfield International School",
  academicYear: "2026-27",
  attendanceUpdatedAt: "Today, 08:42 AM"
};

const identities = {
  student: {
    id: "stu-rahul",
    name: "Rahul Sharma",
    initials: "RS",
    className: "Class 9-A",
    attendance: 91.2,
    recentAttendance: [
      { date: "18 Aug", status: "Present" },
      { date: "17 Aug", status: "Present" },
      { date: "16 Aug", status: "Absent" },
      { date: "15 Aug", status: "Present" }
    ]
  },
  parent: {
    id: "par-priya",
    name: "Priya Sharma",
    initials: "PS",
    relationship: "Rahul's parent",
    childId: "stu-rahul"
  },
  teacher: {
    id: "tch-meera",
    name: "Meera Iyer",
    initials: "MI",
    department: "Mathematics",
    assignedClass: "Class 9-A"
  },
  principal: {
    id: "prn-arvind",
    name: "Dr. Arvind Rao",
    initials: "AR",
    designation: "Principal"
  }
};

const attendanceSummary = {
  schoolAttendance: 93.6,
  studentsPresent: 842,
  studentsTotal: 899,
  classesBelowThreshold: 2,
  lowestClass: "Class 8-C",
  trend: "+1.4% vs. last week"
};

function getStudentForSession(session) {
  if (session.role === "student") return identities.student;
  if (session.role === "parent") return identities.student;
  return null;
}

function markAttendance({ studentName, status, date }) {
  const normalizedName = (studentName || "").trim().toLowerCase();
  if (normalizedName !== "rahul" && normalizedName !== "rahul sharma") {
    return { ok: false, error: "STUDENT_NOT_IN_ASSIGNED_CLASS" };
  }
  const normalizedStatus = status === "present" ? "Present" : "Absent";
  identities.student.recentAttendance.unshift({ date, status: normalizedStatus });
  identities.student.recentAttendance = identities.student.recentAttendance.slice(0, 5);
  return { ok: true, student: identities.student, status: normalizedStatus, date };
}

module.exports = {
  school,
  identities,
  attendanceSummary,
  getStudentForSession,
  markAttendance
};
