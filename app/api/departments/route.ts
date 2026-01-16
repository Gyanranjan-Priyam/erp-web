import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

// GET all departments
export async function GET() {
  try {
    await requireRole(["ADMIN", "TEACHER"])

    const departments = await prisma.department.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            subjects: true,
          },
        },
      },
    })

    return NextResponse.json(departments)
  } catch (error) {
    console.error("Error fetching departments:", error)
    return NextResponse.json(
      { error: "Failed to fetch departments" },
      { status: 500 }
    )
  }
}

// POST - Create new department
export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN"])

    const body = await request.json()
    const { name, code } = body

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Department name is required" },
        { status: 400 }
      )
    }

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Department code is required" },
        { status: 400 }
      )
    }

    const department = await prisma.department.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
      },
    })

    return NextResponse.json(department, { status: 201 })
  } catch (error: any) {
    console.error("Error creating department:", error)
    
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] === "code" ? "code" : "name"
      return NextResponse.json(
        { error: `Department with this ${field} already exists` },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create department" },
      { status: 500 }
    )
  }
}
