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
    const { searchParams } = new URL(request.url)
    
    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const includeSubjects = searchParams.get("includeSubjects") !== "false"
    const yearFilter = searchParams.get("year")
    
    const skip = (page - 1) * limit

    const department = await prisma.department.findUnique({
      where: {
        code: code.toUpperCase(),
      },
      include: {
        subjects: includeSubjects ? {
          where: yearFilter && yearFilter !== "all" ? {
            semester: {
              in: [
                (parseInt(yearFilter) - 1) * 2 + 1,
                (parseInt(yearFilter) - 1) * 2 + 2
              ]
            }
          } : undefined,
          orderBy: {
            semester: "asc",
          },
          skip,
          take: limit,
        } : false,
        _count: {
          select: {
            students: true,
            teachers: true,
            subjects: yearFilter && yearFilter !== "all" ? {
              where: {
                semester: {
                  in: [
                    (parseInt(yearFilter) - 1) * 2 + 1,
                    (parseInt(yearFilter) - 1) * 2 + 2
                  ]
                }
              }
            } : true,
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

    // Calculate total pages
    const totalSubjects = department._count.subjects
    const totalPages = Math.ceil(totalSubjects / limit)

    return NextResponse.json({
      ...department,
      pagination: {
        page,
        limit,
        totalSubjects,
        totalPages,
        hasMore: page < totalPages,
      },
    })
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
