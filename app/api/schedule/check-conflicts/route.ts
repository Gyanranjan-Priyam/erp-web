import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

// Check for scheduling conflicts
export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN")

    const body = await request.json()
    const {
      scheduleId,
      academicYear,
      semester,
      departmentId,
      classSection,
      day,
      timeSlotId,
      startTime,
      endTime,
      teacherId,
      roomId,
    } = body

    const conflicts: any[] = []

    // Helper function to check if two time ranges overlap
    const doTimesOverlap = (start1: string, end1: string, start2: string, end2: string) => {
      return start1 < end2 && start2 < end1
    }

    // Get all schedules for the same day, academic year, and semester
    const existingSchedules = await prisma.schedule.findMany({
      where: {
        id: scheduleId ? { not: scheduleId } : undefined,
        academicYear,
        semester,
        day,
      },
      include: {
        subject: { select: { name: true } },
        teacher: { select: { name: true } },
      },
    })

    // Check each existing schedule for conflicts
    for (const existing of existingSchedules) {
      // Check if times overlap
      const timesOverlap = doTimesOverlap(
        startTime,
        endTime,
        existing.startTime,
        existing.endTime
      )

      if (!timesOverlap) continue

      // Teacher conflict - only compare if both IDs are defined
      if (teacherId && existing.teacherId && existing.teacherId === teacherId) {
        conflicts.push({
          type: "TEACHER",
          message: `Teacher already assigned to ${existing.classSection} at this time`,
          conflictingSlot: existing,
        })
      }

      // Room conflict - only compare if both IDs are defined
      if (roomId && existing.roomId && existing.roomId === roomId) {
        conflicts.push({
          type: "ROOM",
          message: `Room already booked for ${existing.subject?.name || 'a class'} by ${existing.teacher?.name || 'Unknown Teacher'}`,
          conflictingSlot: existing,
        })
      }

      // Class conflict
      if (existing.departmentId === departmentId && existing.classSection === classSection) {
        conflicts.push({
          type: "CLASS",
          message: `Class already has ${existing.subject?.name || 'a class'} with ${existing.teacher?.name || 'Unknown Teacher'} at this time`,
          conflictingSlot: existing,
        })
      }
    }

    return NextResponse.json({ conflicts })
  } catch (error) {
    console.error("Error checking conflicts:", error)
    return NextResponse.json(
      { error: "Failed to check conflicts" },
      { status: 500 }
    )
  }
}
