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

// POST - Create new subject
export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN"])

    const body = await request.json()
    const { name, code, category, semester, departmentId } = body

    const trimmedName = typeof name === "string" ? name.trim() : ""

    if (!trimmedName) {
      return NextResponse.json(
        { error: "Subject name is required" },
        { status: 400 }
      )
    }

    if (!semester || typeof semester !== "number") {
      return NextResponse.json(
        { error: "Semester is required" },
        { status: 400 }
      )
    }

    if (!departmentId || typeof departmentId !== "string") {
      return NextResponse.json(
        { error: "Department ID is required" },
        { status: 400 }
      )
    }

    const trimmedCode = typeof code === "string" ? code.trim() : undefined
    const trimmedCategory = typeof category === "string" ? category.trim() : undefined

    const subject = await prisma.subject.create({
      data: {
        name: trimmedName,
        code: trimmedCode,
        category: trimmedCategory,
        semester,
        departmentId,
      },
    })

    return NextResponse.json(subject, { status: 201 })
  } catch (error: any) {
    console.error("Error creating subject:", error)

    return NextResponse.json(
      { error: "Failed to create subject" },
      { status: 500 }
    )
  }
}
