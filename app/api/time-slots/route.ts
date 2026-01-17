import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

// GET all time slots
export async function GET() {
  try {
    const timeSlots = await prisma.timeSlotConfig.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    })

    return NextResponse.json(timeSlots)
  } catch (error) {
    console.error("Error fetching time slots:", error)
    return NextResponse.json(
      { error: "Failed to fetch time slots" },
      { status: 500 }
    )
  }
}

// POST create new time slot
export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN")

    const body = await request.json()
    const { slotId, startTime, endTime, label, isBreak, order } = body

    if (!slotId || !startTime || !endTime || !label || order === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if slotId already exists
    const existing = await prisma.timeSlotConfig.findUnique({
      where: { slotId },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Time slot ID already exists" },
        { status: 409 }
      )
    }

    const timeSlot = await prisma.timeSlotConfig.create({
      data: {
        slotId,
        startTime,
        endTime,
        label,
        isBreak: isBreak || false,
        order,
        isActive: true,
      },
    })

    return NextResponse.json(timeSlot, { status: 201 })
  } catch (error) {
    console.error("Error creating time slot:", error)
    return NextResponse.json(
      { error: "Failed to create time slot" },
      { status: 500 }
    )
  }
}
