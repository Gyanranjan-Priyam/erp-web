import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

// GET faculty by facultyId
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ facultyId: string }> }
) {
  try {
    await requireRole("ADMIN")
    const { facultyId } = await params

    const faculty = await prisma.teacher.findUnique({
      where: { facultyId },
      include: {
        user: {
          select: {
            email: true,
            isActive: true,
            createdAt: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        subjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                semester: true,
              },
            },
          },
        },
      },
    })

    if (!faculty) {
      return NextResponse.json(
        { error: "Faculty not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(faculty)
  } catch (error) {
    console.error("Error fetching faculty:", error)
    return NextResponse.json(
      { error: "Failed to fetch faculty" },
      { status: 500 }
    )
  }
}
