import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

// GET department by code
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    await requireRole(["ADMIN", "TEACHER"])

    const { code } = await params

    const department = await prisma.department.findUnique({
      where: {
        code: code.toUpperCase(),
      },
      include: {
        subjects: {
          orderBy: {
            semester: "asc",
          },
        },
        _count: {
          select: {
            students: true,
            teachers: true,
            subjects: true,
          },
        },
      },
    })

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(department)
  } catch (error: any) {
    console.error("Error fetching department:", error)
    
    // Handle auth errors
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json(
        { error: error.message || "Unauthorized" },
        { status: error.status }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to fetch department" },
      { status: 500 }
    )
  }
}
