import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

// GET single schedule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN")
    const { id } = await params

    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        subject: { select: { name: true, code: true } },
        teacher: { select: { name: true, facultyId: true } },
        department: { select: { name: true } },
      },
    })

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 })
    }

    return NextResponse.json(schedule)
  } catch (error) {
    console.error("Error fetching schedule:", error)
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    )
  }
}

// PUT update schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN")
    const { id } = await params
    const body = await request.json()

    const {
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
      repeatWeekly,
      effectiveFrom,
      effectiveTill,
      status,
    } = body

    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        ...(day !== undefined && { day }),
        ...(timeSlotId !== undefined && { timeSlotId }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(subjectId !== undefined && { subjectId }),
        ...(teacherId !== undefined && { teacherId }),
        ...(roomId !== undefined && { roomId }),
        ...(sessionType !== undefined && { sessionType }),
        ...(duration !== undefined && { duration }),
        ...(isMandatory !== undefined && { isMandatory }),
        ...(repeatWeekly !== undefined && { repeatWeekly }),
        ...(effectiveFrom !== undefined && { effectiveFrom }),
        ...(effectiveTill !== undefined && { effectiveTill }),
        ...(status !== undefined && { status }),
      },
      include: {
        subject: { select: { name: true, code: true } },
        teacher: { select: { name: true, facultyId: true } },
        department: { select: { name: true } },
      },
    })

    return NextResponse.json(schedule)
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      )
    }
    console.error("Error updating schedule:", error)
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    )
  }
}

// DELETE schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN")
    const { id } = await params

    await prisma.schedule.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Schedule deleted successfully" })
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      )
    }
    console.error("Error deleting schedule:", error)
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    )
  }
}
