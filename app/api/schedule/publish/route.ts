import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

// Publish schedule
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("ADMIN")
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  } catch (authError) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { academicYear, semester, departmentId, classSection } = body

    if (!academicYear || !semester || !departmentId || !classSection) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Update all matching schedules to PUBLISHED status
    const result = await prisma.schedule.updateMany({
      where: {
        academicYear,
        semester,
        departmentId,
        classSection,
        status: "DRAFT",
      },
      data: {
        status: "PUBLISHED",
      },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: "No draft schedules found to publish" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: "Schedule published successfully",
      count: result.count,
    })
  } catch (error) {
    console.error("Error publishing schedule:", error)
    return NextResponse.json(
      { error: "Failed to publish schedule" },
      { status: 500 }
    )
  }
}
