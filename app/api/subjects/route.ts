import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

// GET all subjects or filter by department
export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "TEACHER"])

    const searchParams = request.nextUrl.searchParams
    const departmentId = searchParams.get("departmentId")

    const subjects = await prisma.subject.findMany({
      where: departmentId
        ? {
            departmentId,
          }
        : undefined,
      include: {
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(subjects)
  } catch (error) {
    console.error("Error fetching subjects:", error)
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    )
  }
}
