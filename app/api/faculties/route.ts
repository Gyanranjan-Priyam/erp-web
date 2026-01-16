import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

// GET all faculties
export async function GET() {
  try {
    await requireRole("ADMIN")

    const faculties = await prisma.teacher.findMany({
      include: {
        user: {
          select: {
            email: true,
            isActive: true,
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
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(faculties)
  } catch (error) {
    console.error("Error fetching faculties:", error)
    return NextResponse.json(
      { error: "Failed to fetch faculties" },
      { status: 500 }
    )
  }
}

// POST create new faculty
export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN")

    const body = await request.json()
    const { facultyId, name, email, phone, departmentId, subjectIds } = body

    // Validate required fields
    if (!facultyId || !name || !email || !departmentId) {
      return NextResponse.json(
        { error: "Faculty ID, name, email, and department are required" },
        { status: 400 }
      )
    }

    // Check if email or facultyId already exists
    const [existingUser, existingFacultyId] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.teacher.findUnique({ where: { facultyId } })
    ])

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      )
    }

    if (existingFacultyId) {
      return NextResponse.json(
        { error: "Faculty ID already exists" },
        { status: 409 }
      )
    }

    // Create user and teacher in a transaction
    const faculty = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          name,
          role: "TEACHER",
          emailVerified: false,
          isActive: true,
        },
      })

      // Create teacher profile
      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          facultyId,
          name,
          phone: phone || null,
          departmentId,
        },
        include: {
          user: {
            select: {
              email: true,
              isActive: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      // Assign subjects if provided
      if (subjectIds && subjectIds.length > 0) {
        await tx.teacherSubject.createMany({
          data: subjectIds.map((subjectId: string) => ({
            teacherId: teacher.id,
            subjectId,
          })),
        })
      }

      return teacher
    })

    // Fetch complete faculty with subjects
    const completeFaculty = await prisma.teacher.findUnique({
      where: { id: faculty.id },
      include: {
        user: {
          select: {
            email: true,
            isActive: true,
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
              },
            },
          },
        },
      },
    })

    return NextResponse.json(completeFaculty, { status: 201 })
  } catch (error) {
    console.error("Error creating faculty:", error)
    return NextResponse.json(
      { error: "Failed to create faculty" },
      { status: 500 }
    )
  }
}
