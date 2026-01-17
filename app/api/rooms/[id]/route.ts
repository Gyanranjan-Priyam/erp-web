import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

// GET single room
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN")
    const { id } = await params

    const room = await prisma.room.findUnique({
      where: { id },
    })

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(room)
  } catch (error) {
    console.error("Error fetching room:", error)
    return NextResponse.json(
      { error: "Failed to fetch room" },
      { status: 500 }
    )
  }
}

// PUT update room
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN")
    const { id } = await params
    const body = await request.json()
    const { name, type, capacity } = body

    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id },
    })

    if (!existingRoom) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      )
    }

    // Check if name is being changed and if it already exists
    if (name && name !== existingRoom.name) {
      const roomWithName = await prisma.room.findUnique({
        where: { name },
      })
      if (roomWithName) {
        return NextResponse.json(
          { error: "A room with this name already exists" },
          { status: 409 }
        )
      }
    }

    // Update the room
    // Validate and parse capacity
    let validatedCapacity = existingRoom.capacity
    if (capacity !== undefined && capacity !== null) {
      const parsedCapacity = parseInt(String(capacity), 10)
      if (!Number.isFinite(parsedCapacity) || !Number.isInteger(parsedCapacity) || parsedCapacity < 0) {
        return NextResponse.json(
          { error: `Invalid capacity value: ${capacity}. Must be a non-negative integer.` },
          { status: 400 }
        )
      }
      validatedCapacity = parsedCapacity
    }

    const room = await prisma.room.update({
      where: { id },
      data: {
        name: name || existingRoom.name,
        type: type || existingRoom.type,
        capacity: validatedCapacity,
      },
    })

    return NextResponse.json(room)
  } catch (error) {
    console.error("Error updating room:", error)
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 }
    )
  }
}

// DELETE room
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN")
    const { id } = await params

    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id },
    })

    if (!existingRoom) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      )
    }

    // Check if room is being used in any schedules
    const schedulesUsingRoom = await prisma.schedule.count({
      where: { roomId: existingRoom.id },
    })

    if (schedulesUsingRoom > 0) {
      return NextResponse.json(
        { error: `Cannot delete room. It is being used in ${schedulesUsingRoom} schedule(s)` },
        { status: 409 }
      )
    }

    // Delete the room
    await prisma.room.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Room deleted successfully" })
  } catch (error) {
    console.error("Error deleting room:", error)
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    )
  }
}
