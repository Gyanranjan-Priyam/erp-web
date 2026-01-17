import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

// PUT update time slot
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN")
    const { id } = await params
    const body = await request.json()

    const { startTime, endTime, label, isBreak, order, isActive } = body

    const timeSlot = await prisma.timeSlotConfig.update({
      where: { id },
      data: {
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(label !== undefined && { label }),
        ...(isBreak !== undefined && { isBreak }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(timeSlot)
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Time slot not found" },
        { status: 404 }
      )
    }
    console.error("Error updating time slot:", error)
    return NextResponse.json(
      { error: "Failed to update time slot" },
      { status: 500 }
    )
  }
}

// DELETE time slot
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN")
    const { id } = await params

    // Soft delete by setting isActive to false
    await prisma.timeSlotConfig.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: "Time slot deleted successfully" })
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Time slot not found" },
        { status: 404 }
      )
    }
    console.error("Error deleting time slot:", error)
    return NextResponse.json(
      { error: "Failed to delete time slot" },
      { status: 500 }
    )
  }
}
