import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

// GET single faculty
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN")
    const { id } = await params

    const faculty = await prisma.teacher.findUnique({
      where: { id },
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
                code: true,
                category: true,
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

// PUT update faculty
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN")
    const { id } = await params
    const body = await request.json()
    const { facultyId, name, phone, departmentId, subjectIds, designations } = body

    // Check if faculty exists
    const existingFaculty = await prisma.teacher.findUnique({
      where: { id },
    })

    if (!existingFaculty) {
      return NextResponse.json(
        { error: "Faculty not found" },
        { status: 404 }
      )
    }

    // Check if facultyId is being changed and if it already exists
    if (facultyId && facultyId !== existingFaculty.facultyId) {
      const existingFacultyId = await prisma.teacher.findUnique({
        where: { facultyId }
      })
      if (existingFacultyId) {
        return NextResponse.json(
          { error: "Faculty ID already exists" },
          { status: 409 }
        )
      }
    }

    // Update in transaction
    const faculty = await prisma.$transaction(async (tx) => {
      // Update teacher
      const updatedTeacher = await tx.teacher.update({
        where: { id },
        data: {
          facultyId: facultyId || existingFaculty.facultyId,
          name,
          phone: phone || null,
          departmentId,
          designations: designations !== undefined ? designations : existingFaculty.designations,
        },
      })

      // Update user name
      await tx.user.update({
        where: { id: existingFaculty.userId },
        data: { name },
      })

      // Update subjects - delete all and recreate
      if (subjectIds !== undefined) {
        await tx.teacherSubject.deleteMany({
          where: { teacherId: id },
        })

        if (subjectIds.length > 0) {
          await tx.teacherSubject.createMany({
            data: subjectIds.map((subjectId: string) => ({
              teacherId: id,
              subjectId,
            })),
          })
        }
      }

      return updatedTeacher
    })

    // Fetch complete updated faculty
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

    return NextResponse.json(completeFaculty)
  } catch (error) {
    console.error("Error updating faculty:", error)
    return NextResponse.json(
      { error: "Failed to update faculty" },
      { status: 500 }
    )
  }
}

// DELETE faculty
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN")
    const { id } = await params

    // Check if faculty exists
    const existingFaculty = await prisma.teacher.findUnique({
      where: { id },
    })

    if (!existingFaculty) {
      return NextResponse.json(
        { error: "Faculty not found" },
        { status: 404 }
      )
    }

    // Delete in transaction
    await prisma.$transaction(async (tx) => {
      // Delete teacher subjects
      await tx.teacherSubject.deleteMany({
        where: { teacherId: id },
      })

      // Delete teacher
      await tx.teacher.delete({
        where: { id },
      })

      // Delete user account
      await tx.user.delete({
        where: { id: existingFaculty.userId },
      })
    })

    return NextResponse.json({ message: "Faculty deleted successfully" })
  } catch (error) {
    console.error("Error deleting faculty:", error)
    return NextResponse.json(
      { error: "Failed to delete faculty" },
      { status: 500 }
    )
  }
}
