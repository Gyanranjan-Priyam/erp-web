import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

// GET schedules with filters
export async function GET(request: NextRequest) {
  try {
    await requireRole("ADMIN")

    const searchParams = request.nextUrl.searchParams
    const academicYear = searchParams.get("academicYear")
    const semester = searchParams.get("semester")
    const departmentId = searchParams.get("departmentId")
    const classSection = searchParams.get("classSection")
    const timetableType = searchParams.get("timetableType")

    if (!academicYear || !semester || !departmentId || !classSection) {
      return NextResponse.json(
        { error: "Missing required filters" },
        { status: 400 }
      )
    }

    const parsedSemester = parseInt(semester, 10)
    if (isNaN(parsedSemester)) {
      return NextResponse.json(
        { error: "Invalid semester value" },
        { status: 400 }
      )
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        academicYear,
        semester: parsedSemester,
        departmentId,
        classSection,
        ...(timetableType && { timetableType: timetableType as any }),
      },
      include: {
        subject: {
          select: {
            name: true,
            code: true,
          },
        },
        teacher: {
          select: {
            name: true,
            facultyId: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ day: "asc" }, { startTime: "asc" }],
    })

    // Transform data to include names
    const formattedSchedules = schedules.map((schedule: any) => ({
      ...schedule,
      subjectName: schedule.subject.name,
      subjectCode: schedule.subject.code,
      teacherName: schedule.teacher.name,
      roomName: schedule.roomId, // roomId is now the room number/name itself
      departmentName: schedule.department.name,
    }))

    return NextResponse.json(formattedSchedules)
  } catch (error) {
    console.error("Error fetching schedules:", error)
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    )
  }
}

// POST create new schedule
export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN")

    const body = await request.json()
    const {
      academicYear,
      semester,
      departmentId,
      classSection,
      day,
      timeSlotId,
      startTime,
      endTime,
      subjectId,
      teacherId,
      roomId,
      sessionType,
      duration,
      isMandatory,
      notes,
      repeatWeekly,
      effectiveFrom,
      effectiveTill,
      status,
    } = body

    // Validate required fields
    if (
      !academicYear ||
      !semester ||
      !departmentId ||
      !classSection ||
      !day ||
      !startTime ||
      !endTime ||
      !subjectId ||
      !teacherId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (isNaN(semester)) {
      return NextResponse.json(
        { error: "Invalid semester value" },
        { status: 400 }
      )
    }

    const schedule = await prisma.schedule.create({
      data: {
        academicYear,
        semester: parseInt(semester.toString()),
        departmentId,
        classSection,
        day,
        timeSlotId: timeSlotId && timeSlotId.trim() !== '' ? timeSlotId : null,
        startTime,
        endTime,
        subjectId,
        teacherId,
        roomId: roomId && roomId.trim() !== '' ? roomId : "TBA",
        sessionType: sessionType || "LECTURE",
        duration: duration || 1,
        isMandatory: isMandatory !== undefined ? isMandatory : true,
        repeatWeekly: repeatWeekly !== undefined ? repeatWeekly : true,
        effectiveFrom: effectiveFrom || null,
        effectiveTill: effectiveTill || null,
        status: status || "DRAFT",
        timetableType: "REGULAR",
      },
      include: {
        subject: { select: { name: true, code: true } },
        teacher: { select: { name: true, facultyId: true } },
        department: { select: { name: true } },
      },
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    console.error("Error creating schedule:", error)
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    )
  }
}
