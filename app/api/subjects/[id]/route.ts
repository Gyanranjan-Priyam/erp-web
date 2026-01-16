import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

// GET single subject
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "TEACHER"])

    const { id } = await params

    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        department: true,
      },
    })

    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(subject)
  } catch (error) {
    console.error("Error fetching subject:", error)
    return NextResponse.json(
      { error: "Failed to fetch subject" },
      { status: 500 }
    )
  }
}

// PATCH update subject
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN"])

    const { id } = await params
    const body = await request.json()
    const { name, code, category, semester } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Subject name is required" },
        { status: 400 }
      )
    }

    if (semester && (semester < 1 || semester > 8)) {
      return NextResponse.json(
        { error: "Semester must be between 1 and 8" },
        { status: 400 }
      )
    }

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        name: name.trim(),
        code: code?.trim().toUpperCase(),
        category: category?.trim(),
        semester: semester ? parseInt(semester) : undefined,
      },
    })

    return NextResponse.json(subject)
  } catch (error: any) {
    console.error("Error updating subject:", error)
    
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update subject" },
      { status: 500 }
    )
  }
}

// DELETE subject
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN"])

    const { id } = await params

    await prisma.subject.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Subject deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting subject:", error)
    
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      )
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Cannot delete subject with associated records (teachers, marks, attendance)" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to delete subject" },
      { status: 500 }
    )
  }
}
