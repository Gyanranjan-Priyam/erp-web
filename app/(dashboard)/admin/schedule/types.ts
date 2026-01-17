export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY"

export type SessionType = "LECTURE" | "LAB" | "TUTORIAL"

export type ScheduleStatus = "DRAFT" | "PUBLISHED"

export type TimetableType = "REGULAR" | "EXAM" | "SPECIAL"

export type ViewMode = "GRID" | "TEACHER" | "CLASSROOM"

export interface TimeSlot {
  id: string
  startTime: string // "09:00"
  endTime: string // "10:00"
  label: string // "09:00 - 10:00"
  isBreak?: boolean
}

export interface Room {
  id: string
  name: string
  type: string // LAB, CLASSROOM, etc.
  capacity: number
}

export interface ScheduleSlot {
  id: string
  academicYear: string
  semester: number
  departmentId: string
  departmentName?: string
  classSection: string
  day: DayOfWeek
  timeSlotId: string
  startTime: string
  endTime: string
  subjectId: string
  subjectName?: string
  subjectCode?: string
  teacherId: string
  teacherName?: string
  roomId: string
  roomName?: string
  sessionType: SessionType
  duration: number // in slots
  isMandatory: boolean
  notes?: string
  repeatWeekly: boolean
  effectiveFrom?: string
  effectiveTill?: string
  status: ScheduleStatus
  createdAt: string
  updatedAt: string
}

export interface ScheduleFormData {
  academicYear: string
  semester: number
  departmentId: string
  classSection: string
  day: DayOfWeek
  timeSlotId: string
  startTime: string
  endTime: string
  subjectId: string
  teacherId: string
  roomId: string
  sessionType: SessionType
  duration: number
  isMandatory: boolean
  repeatWeekly: boolean
  effectiveFrom?: string
  effectiveTill?: string
  status: ScheduleStatus
}

export interface ConflictInfo {
  type: "TEACHER" | "ROOM" | "CLASS"
  message: string
  conflictingSlot?: ScheduleSlot
}

export interface Department {
  id: string
  name: string
  code?: string
}

export interface Subject {
  id: string
  name: string
  code?: string
  departmentId: string
  semester: number
}

export interface Teacher {
  id: string
  name: string
  facultyId: string
  departmentId: string
}

export interface ScheduleFilter {
  academicYear: string
  semester: number | null
  departmentId: string
  classSection: string
  timetableType: TimetableType
}

// Time slots configuration - now fetched from database
export const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { id: "1", startTime: "09:00", endTime: "10:00", label: "09:00 - 10:00" },
  { id: "2", startTime: "10:00", endTime: "11:00", label: "10:00 - 11:00" },
  { id: "3", startTime: "11:00", endTime: "12:00", label: "11:00 - 12:00" },
  { id: "break", startTime: "12:00", endTime: "12:30", label: "Break", isBreak: true },
  { id: "4", startTime: "12:30", endTime: "13:30", label: "12:30 - 13:30" },
  { id: "5", startTime: "13:30", endTime: "14:30", label: "13:30 - 14:30" },
  { id: "6", startTime: "14:30", endTime: "15:30", label: "14:30 - 15:30" },
]

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
]

export const SESSION_TYPES: { value: SessionType; label: string; color: string }[] = [
  { value: "LECTURE", label: "Lecture", color: "bg-blue-100 text-black border-blue-200" },
  { value: "LAB", label: "Lab", color: "bg-green-100 text-black border-green-200" },
  { value: "TUTORIAL", label: "Tutorial", color: "bg-orange-100 text-black border-orange-200" },
]

export const ACADEMIC_YEARS = [
  "2023-2024",
  "2024-2025",
  "2025-2026",
  "2026-2027",
]

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]
