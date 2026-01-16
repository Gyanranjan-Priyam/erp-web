import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

// GET single department
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "TEACHER"])

    const { id } = await params

    const department = await prisma.department.findUnique({
      where: {
        id: id,
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
  } catch (error) {
    console.error("Error fetching department:", error)
    return NextResponse.json(
      { error: "Failed to fetch department" },
      { status: 500 }
    )
  }
}

// PATCH - Update department
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN"])

    const { id } = await params
    const body = await request.json()
    const { name, code } = body

    const trimmedName = name?.trim()
    const trimmedCode = code?.trim()

    if (!trimmedName || typeof trimmedName !== "string") {
      return NextResponse.json(
        { error: "Department name is required" },
        { status: 400 }
      )
    }

    if (!trimmedCode || typeof trimmedCode !== "string") {
      return NextResponse.json(
        { error: "Department code is required" },
        { status: 400 }
      )
    }

    const department = await prisma.department.update({
      where: {
        id: id,
      },
      data: {
        name: trimmedName,
        code: trimmedCode.toUpperCase(),
      },
    })

    return NextResponse.json(department)
  } catch (error: any) {
    console.error("Error updating department:", error)

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      )
    }

    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] === "code" ? "code" : "name"
      return NextResponse.json(
        { error: `Department with this ${field} already exists` },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update department" },
      { status: 500 }
    )
  }
}

// DELETE - Delete department
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN"])

    const { id } = await params

    // Check if department has related data
    const department = await prisma.department.findUnique({
      where: {
        id: id,
      },
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            subjects: true,
            admissions: true,
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

    const hasRelatedData =
      department._count.students > 0 ||
      department._count.teachers > 0 ||
      department._count.subjects > 0 ||
      department._count.admissions > 0

    if (hasRelatedData) {
      return NextResponse.json(
        {
          error:
            "Cannot delete department with associated students, teachers, subjects, or admissions",
          details: department._count,
        },
        { status: 409 }
      )
    }

    await prisma.department.delete({
      where: {
        id: id,
      },
    })

    return NextResponse.json({ success: true, message: "Department deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting department:", error)

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Failed to delete department" },
      { status: 500 }
    )
  }
}
