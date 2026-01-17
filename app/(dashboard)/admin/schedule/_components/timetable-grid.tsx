"use client"

import * as React from "react"
import { Plus, Eye, Copy, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  ScheduleSlot,
  DayOfWeek,
  TimeSlot,
  DAYS_OF_WEEK,
  SESSION_TYPES,
  ViewMode,
} from "../types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface TimetableGridProps {
  schedules: ScheduleSlot[]
  timeSlots: TimeSlot[]
  onAddSlot: (day: DayOfWeek, timeSlotId: string) => void
  onEditSlot: (schedule: ScheduleSlot) => void
  onScheduleUpdated: () => void
  onDeleteOptimistic?: (scheduleId: string) => void
  viewMode: ViewMode
  readOnly?: boolean
}

export function TimetableGrid({
  schedules,
  timeSlots,
  onAddSlot,
  onEditSlot,
  onScheduleUpdated,
  onDeleteOptimistic,
  viewMode,
  readOnly = false,
}: TimetableGridProps) {
  const [draggedSchedule, setDraggedSchedule] = React.useState<ScheduleSlot | null>(null)
  const [dropTarget, setDropTarget] = React.useState<{ day: DayOfWeek; timeSlot: TimeSlot } | null>(null)
  
  // Get all unique time points (start times) from schedules
  const allTimeSlots = React.useMemo(() => {
    const timePoints = new Set<string>()
    
    // Collect all unique start and end times
    schedules.forEach((schedule) => {
      timePoints.add(schedule.startTime)
      timePoints.add(schedule.endTime)
    })
    
    // Convert to sorted array
    const sortedTimes = Array.from(timePoints).sort()
    
    // Create time slots from consecutive time points
    const slots: TimeSlot[] = []
    for (let i = 0; i < sortedTimes.length - 1; i++) {
      const startTime = sortedTimes[i]
      const endTime = sortedTimes[i + 1]
      slots.push({
        id: `slot-${startTime}-${endTime}`,
        startTime,
        endTime,
        label: `${startTime} - ${endTime}`,
        isBreak: false,
      })
    }
    
    return slots
  }, [schedules])

  // Check if a schedule starts at this time slot
  const getScheduleStartingAtSlot = (day: DayOfWeek, timeSlot: TimeSlot) => {
    return schedules.find((s) => 
      s.day === day && s.startTime === timeSlot.startTime
    )
  }

  // Check if a time slot is occupied by a spanning schedule from above
  const isSlotOccupiedBySpan = (day: DayOfWeek, timeSlot: TimeSlot) => {
    // First check if any schedule starts exactly at this slot
    const hasScheduleStartingHere = schedules.some((s) => 
      s.day === day && s.startTime === timeSlot.startTime
    )
    
    // If a schedule starts here, the slot is not occupied by a span
    if (hasScheduleStartingHere) return false
    
    // Otherwise, check if this slot is within a schedule's time range from above
    return schedules.some((s) => {
      if (s.day !== day) return false
      // Check if this slot is within the schedule's time range but not the start
      return s.startTime < timeSlot.startTime && s.endTime > timeSlot.startTime
    })
  }

  // Calculate how many rows a schedule should span
  const calculateRowSpan = (schedule: ScheduleSlot) => {
    let span = 0
    for (const slot of allTimeSlots) {
      if (slot.startTime >= schedule.startTime && slot.endTime <= schedule.endTime) {
        span++
      }
    }
    return span || 1
  }

  // Get schedule for a specific day and time slot (legacy - kept for compatibility)
  const getScheduleForSlot = (day: DayOfWeek, timeSlot: TimeSlot) => {
    return schedules.find((s) => {
      // Match by day
      if (s.day !== day) return false
      
      // Match by time - either by timeSlotId or by exact time match
      if (s.timeSlotId && s.timeSlotId === timeSlot.id) {
        return true
      }
      
      // For custom times or when timeSlotId doesn't match, check exact time match
      return s.startTime === timeSlot.startTime && s.endTime === timeSlot.endTime
    })
  }

  // Get session type color
  const getSessionColor = (type: string) => {
    const sessionType = SESSION_TYPES.find((st) => st.value === type)
    return sessionType?.color || "bg-gray-100 text-gray-700"
  }

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, schedule: ScheduleSlot) => {
    setDraggedSchedule(schedule)
    e.dataTransfer.effectAllowed = "copy"
    e.dataTransfer.setData("text/plain", schedule.id)
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, day: DayOfWeek, timeSlot: TimeSlot) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
    setDropTarget({ day, timeSlot })
  }

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDropTarget(null)
  }

  // Handle drop
  const handleDrop = async (e: React.DragEvent, day: DayOfWeek, timeSlot: TimeSlot) => {
    e.preventDefault()
    setDropTarget(null)

    if (!draggedSchedule || readOnly) return

    // Check if dropping on the same slot
    if (
      draggedSchedule.day === day &&
      draggedSchedule.startTime === timeSlot.startTime &&
      draggedSchedule.endTime === timeSlot.endTime
    ) {
      setDraggedSchedule(null)
      return
    }

    // Check if target slot already has a schedule
    const existingSchedule = getScheduleForSlot(day, timeSlot)
    if (existingSchedule) {
      toast.error("This time slot already has a class scheduled")
      setDraggedSchedule(null)
      return
    }

    try {
      // Create a copy of the schedule for the new day/time
      // Note: roomId is not copied to avoid conflicts - user needs to assign a room
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicYear: draggedSchedule.academicYear,
          semester: draggedSchedule.semester,
          departmentId: draggedSchedule.departmentId,
          classSection: draggedSchedule.classSection,
          day: day,
          timeSlotId: timeSlot.id.startsWith("slot-") || timeSlot.id.startsWith("custom-") ? null : timeSlot.id,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          subjectId: draggedSchedule.subjectId,
          teacherId: draggedSchedule.teacherId,
          roomId: null, // Don't copy room to avoid conflicts
          sessionType: draggedSchedule.sessionType,
          duration: draggedSchedule.duration,
          isMandatory: draggedSchedule.isMandatory,
          repeatWeekly: draggedSchedule.repeatWeekly,
          status: draggedSchedule.status,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to copy schedule")
      }

      toast.success("Class copied successfully")
      if (typeof onScheduleUpdated === 'function') {
        onScheduleUpdated()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to copy class")
      console.error("Error copying schedule:", error)
    } finally {
      setDraggedSchedule(null)
    }
  }

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedSchedule(null)
    setDropTarget(null)
  }

  // Handle delete schedule
  const handleDeleteSchedule = async (e: React.MouseEvent, scheduleId: string) => {
    e.stopPropagation() // Prevent triggering the edit click

    if (!confirm("Are you sure you want to delete this class?")) {
      return
    }

    // Optimistic update - remove immediately from UI
    if (onDeleteOptimistic) {
      onDeleteOptimistic(scheduleId)
    }

    try {
      const response = await fetch(`/api/schedule/${scheduleId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete schedule")
      }

      toast.success("Class deleted successfully")
      // Silent background refresh
      if (typeof onScheduleUpdated === 'function') {
        onScheduleUpdated()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete class")
      console.error("Error deleting schedule:", error)
      // Refresh to restore state on error
      if (typeof onScheduleUpdated === 'function') {
        onScheduleUpdated()
      }
    }
  }

  // Render cell content
  const renderSlotCell = (day: DayOfWeek, timeSlot: TimeSlot) => {
    if (timeSlot.isBreak) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-50 text-gray-500 text-sm font-medium">
          Break
        </div>
      )
    }

    // Check if this slot is occupied by a schedule spanning from above
    if (isSlotOccupiedBySpan(day, timeSlot)) {
      return null // Don't render anything, the spanning schedule covers this
    }

    // Check if a schedule starts at this time slot
    const schedule = getScheduleStartingAtSlot(day, timeSlot)

    const isDropTarget = dropTarget?.day === day && 
                        dropTarget?.timeSlot.startTime === timeSlot.startTime &&
                        dropTarget?.timeSlot.endTime === timeSlot.endTime

    if (!schedule) {
      return (
        <div 
          className={cn(
            "flex flex-col items-center justify-center h-full group min-h-25 relative",
            isDropTarget && "bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-500 border-dashed"
          )}
          onDragOver={(e) => handleDragOver(e, day, timeSlot)}
          onDragLeave={(e) => handleDragLeave(e)}
          onDrop={(e) => handleDrop(e, day, timeSlot)}
        >
          {!readOnly && !isDropTarget && (
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onAddSlot(day, timeSlot.id)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Class
            </Button>
          )}
          {isDropTarget && draggedSchedule && (
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              Drop to copy here
            </div>
          )}
        </div>
      )
    }

    const isDragging = draggedSchedule?.id === schedule.id
    const rowSpan = calculateRowSpan(schedule)

    return (
      <div
        draggable={!readOnly}
        onDragStart={(e) => handleDragStart(e, schedule)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOver(e, day, timeSlot)}
        onDragLeave={(e) => handleDragLeave(e)}
        onDrop={(e) => handleDrop(e, day, timeSlot)}
        className={cn(
          "p-2 h-full text-left rounded border w-full cursor-pointer group",
          getSessionColor(schedule.sessionType),
          "space-y-1 hover:shadow-md transition-all",
          !readOnly && "cursor-grab active:cursor-grabbing",
          isDragging && "opacity-50 scale-95",
          isDropTarget && "ring-2 ring-blue-500"
        )}
        onClick={() => !readOnly && onEditSlot(schedule)}
        onKeyDown={(e) => {
          if (!readOnly && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            onEditSlot(schedule)
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Edit ${schedule.subjectCode || schedule.subjectName} class with ${schedule.teacherName} in ${schedule.roomName}`}
      >
        <div className="flex items-start justify-between gap-1">
          <p className="font-semibold text-sm line-clamp-1">
            {schedule.subjectCode || schedule.subjectName}
          </p>
          <div className="flex gap-1 items-center">
            <Badge
              variant="outline"
              className="text-xs px-1 py-0 h-5"
            >
              {schedule.sessionType.charAt(0)}
            </Badge>
            {!readOnly && (
              <>
                <Copy className="h-3 w-3 text-muted-foreground" />
                <button
                  onClick={(e) => handleDeleteSchedule(e, schedule.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
                  aria-label="Delete class"
                  type="button"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        </div>
        <p className="text-xs line-clamp-1">{schedule.teacherName}</p>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {schedule.roomName}
        </p>
        {rowSpan > 1 && (
          <p className="text-xs text-muted-foreground mt-2">
            {schedule.startTime} - {schedule.endTime}
          </p>
        )}
      </div>
    )
  }

  if (viewMode === "GRID") {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border p-3 text-left font-semibold min-w-[120px] sticky left-0 bg-muted z-10">
                    Time
                  </th>
                  {DAYS_OF_WEEK.map((day) => (
                    <th
                      key={day}
                      className="border p-3 text-center font-semibold min-w-[200px]"
                    >
                      {day.charAt(0) + day.slice(1).toLowerCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allTimeSlots.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border p-8 text-center text-muted-foreground">
                      No schedules created yet. Add a new slot to get started.
                    </td>
                  </tr>
                ) : (
                  allTimeSlots.map((timeSlot) => (
                    <tr key={timeSlot.id}>
                      <td className="border p-3 font-medium text-sm bg-muted/30 sticky left-0 z-10">
                        {timeSlot.label}
                      </td>
                      {DAYS_OF_WEEK.map((day) => {
                        // Skip rendering cell if occupied by a spanning schedule from above
                        if (isSlotOccupiedBySpan(day, timeSlot)) {
                          return null
                        }

                        const schedule = getScheduleStartingAtSlot(day, timeSlot)
                        const rowSpan = schedule ? calculateRowSpan(schedule) : 1

                        return (
                          <td
                            key={`${day}-${timeSlot.id}`}
                            className="border p-1 min-h-25 align-top"
                            rowSpan={rowSpan}
                          >
                            {renderSlotCell(day, timeSlot)}
                          </td>
                        )
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (viewMode === "TEACHER") {
    // Group schedules by teacher
    const schedulesByTeacher = schedules.reduce((acc, schedule) => {
      if (!acc[schedule.teacherId]) {
        acc[schedule.teacherId] = []
      }
      acc[schedule.teacherId].push(schedule)
      return acc
    }, {} as Record<string, ScheduleSlot[]>)

    return (
      <div className="space-y-6">
        {Object.entries(schedulesByTeacher).map(([teacherId, teacherSchedules]) => {
          const teacherName = teacherSchedules[0]?.teacherName || "Unknown"
          return (
            <Card key={teacherId}>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-4">{teacherName}</h3>
                <div className="grid gap-2">
                  {teacherSchedules
                    .sort((a, b) => {
                      const dayOrder = DAYS_OF_WEEK.indexOf(a.day) - DAYS_OF_WEEK.indexOf(b.day)
                      if (dayOrder !== 0) return dayOrder
                      return a.startTime.localeCompare(b.startTime)
                    })
                    .map((schedule) => (
                      <button
                        key={schedule.id}
                        type="button"
                        className={cn(
                          "p-3 rounded border text-left w-full hover:shadow-md transition-shadow",
                          getSessionColor(schedule.sessionType),
                          readOnly && "cursor-default"
                        )}
                        onClick={() => !readOnly && onEditSlot(schedule)}
                        onKeyDown={(e) => {
                          if (!readOnly && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault()
                            onEditSlot(schedule)
                          }
                        }}
                        disabled={readOnly}
                        aria-label={`Edit ${schedule.subjectCode || schedule.subjectName} on ${schedule.day}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                {schedule.subjectCode || schedule.subjectName}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {schedule.sessionType}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {schedule.day.charAt(0) + schedule.day.slice(1).toLowerCase()} •{" "}
                              {schedule.startTime} - {schedule.endTime} • {schedule.roomName}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  if (viewMode === "CLASSROOM") {
    // Group schedules by room
    const schedulesByRoom = schedules.reduce((acc, schedule) => {
      if (!acc[schedule.roomId]) {
        acc[schedule.roomId] = []
      }
      acc[schedule.roomId].push(schedule)
      return acc
    }, {} as Record<string, ScheduleSlot[]>)

    return (
      <div className="space-y-6">
        {Object.entries(schedulesByRoom).map(([roomId, roomSchedules]) => {
          const roomName = roomSchedules[0]?.roomName || "Unknown"
          return (
            <Card key={roomId}>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-4">{roomName}</h3>
                <div className="grid gap-2">
                  {roomSchedules
                    .sort((a, b) => {
                      const dayOrder = DAYS_OF_WEEK.indexOf(a.day) - DAYS_OF_WEEK.indexOf(b.day)
                      if (dayOrder !== 0) return dayOrder
                      return a.startTime.localeCompare(b.startTime)
                    })
                    .map((schedule) => (
                      <button
                        key={schedule.id}
                        type="button"
                        className={cn(
                          "p-3 rounded border text-left w-full hover:shadow-md transition-shadow",
                          getSessionColor(schedule.sessionType),
                          readOnly && "cursor-default"
                        )}
                        onClick={() => !readOnly && onEditSlot(schedule)}
                        onKeyDown={(e) => {
                          if (!readOnly && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault()
                            onEditSlot(schedule)
                          }
                        }}
                        disabled={readOnly}
                        aria-label={`Edit ${schedule.subjectCode || schedule.subjectName} on ${schedule.day}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                {schedule.subjectCode || schedule.subjectName}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {schedule.sessionType}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {schedule.day.charAt(0) + schedule.day.slice(1).toLowerCase()} •{" "}
                              {schedule.startTime} - {schedule.endTime} • {schedule.teacherName}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return null
}
