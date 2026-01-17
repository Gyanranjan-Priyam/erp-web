import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

// Bulk delete schedules
export async function DELETE(request: NextRequest) {try {
    const session = await requireRole("ADMIN")
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  } catch (authError) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: any
  try {
    body = await request.json()
  } catch (parseError) {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    )
  }

  try {
    const { academicYear, semester, departmentId, classSection } = body

    if (!academicYear || !semester || !departmentId || !classSection) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const result = await prisma.schedule.deleteMany({
      where: {
        academicYear,
        semester,
        departmentId,
        classSection,
      },
    })

    return NextResponse.json({
      message: "Schedules deleted successfully",
      count: result.count,
    })
  } catch (error) {
    console.error("Error deleting schedules:", error)
    return NextResponse.json(
      { error: "Failed to delete schedules" },
      { status: 500 }
    )
  }
}
