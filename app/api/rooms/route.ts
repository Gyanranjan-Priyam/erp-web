import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

// GET all rooms
export async function GET(request: NextRequest) {
  try {
    await requireRole("ADMIN")

    const rooms = await prisma.room.findMany({
      orderBy: [
        { type: "asc" },
        { name: "asc" },
      ],
    })

    return NextResponse.json(rooms)
  } catch (error) {
    // Check if it's an auth error and preserve the status
    if (error && typeof error === 'object' && 'status' in error && (error.status === 401 || error.status === 403)) {
      throw error // Rethrow auth errors
    }
    console.error("Error fetching rooms:", error)
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    )
  }
}

// POST create new room
export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN")
    const body = await request.json()
    const { name, type, capacity } = body

    // Validate required fields - allow capacity to be 0
    if (!name || !type || capacity === undefined || capacity === null) {
      return NextResponse.json(
        { error: "Name, type, and capacity are required" },
        { status: 400 }
      )
    }

    // Validate capacity is a positive integer
    const parsedCapacity = parseInt(String(capacity), 10)
    if (!Number.isFinite(parsedCapacity) || !Number.isInteger(parsedCapacity) || parsedCapacity < 0) {
      return NextResponse.json(
        { error: `Invalid capacity value: ${capacity}. Must be a non-negative integer.` },
        { status: 400 }
      )
    }

    // Check if room name already exists
    const existingRoom = await prisma.room.findUnique({
      where: { name },
    })

    if (existingRoom) {
      return NextResponse.json(
        { error: "A room with this name already exists" },
        { status: 409 }
      )
    }

    // Create the room
    const room = await prisma.room.create({
      data: {
        name,
        type,
        capacity: parsedCapacity,
      },
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    // Check if it's an auth error and preserve the status
    if (error && typeof error === 'object' && 'status' in error && (error.status === 401 || error.status === 403)) {
      throw error // Rethrow auth errors
    }
    console.error("Error creating room:", error)
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    )
  }
}
