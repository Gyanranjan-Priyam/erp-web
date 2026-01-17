"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  ScheduleSlot,
  ScheduleFormData,
  Department,
  Subject,
  Teacher,
  Room,
  DayOfWeek,
  SessionType,
  TimeSlot,
  DAYS_OF_WEEK,
  SESSION_TYPES,
  ConflictInfo,
} from "../types"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule?: ScheduleSlot | null
  departments: Department[]
  subjects: Subject[]
  teachers: Teacher[]
  rooms: Room[]
  timeSlots: TimeSlot[]
  onSuccess: () => void
  onAddOptimistic?: (schedule: ScheduleSlot) => void
  onUpdateOptimistic?: (schedule: ScheduleSlot) => void
  onDeleteOptimistic?: (scheduleId: string) => void
  defaultValues?: {
    academicYear: string
    semester: number
    departmentId: string
    classSection: string
    day?: DayOfWeek
    timeSlotId?: string
  }
}

export function ScheduleDialog({
  open,
  onOpenChange,
  schedule,
  departments,
  subjects,
  teachers,
  rooms,
  timeSlots,
  onSuccess,
  onAddOptimistic,
  onUpdateOptimistic,
  onDeleteOptimistic,
  defaultValues,
}: ScheduleDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [conflicts, setConflicts] = React.useState<ConflictInfo[]>([])
  const [useCustomTime, setUseCustomTime] = React.useState(true)
  const [formData, setFormData] = React.useState<ScheduleFormData>({
    academicYear: defaultValues?.academicYear || "",
    semester: defaultValues?.semester || 1,
    departmentId: defaultValues?.departmentId || "",
    classSection: defaultValues?.classSection || "",
    day: defaultValues?.day || "MONDAY",
    timeSlotId: defaultValues?.timeSlotId || "",
    startTime: "",
    endTime: "",
    subjectId: "",
    teacherId: "",
    roomId: "",
    sessionType: "LECTURE",
    duration: 1,
    isMandatory: true,
    repeatWeekly: true,
    status: "DRAFT",
  })

  // Filter subjects by selected department and semester
  const filteredSubjects = React.useMemo(() => {
    if (!formData.departmentId || !formData.semester) return []
    return subjects.filter(
      (s) => s.departmentId === formData.departmentId && s.semester === formData.semester
    )
  }, [formData.departmentId, formData.semester, subjects])

  // Filter teachers by selected department
  const filteredTeachers = React.useMemo(() => {
    if (!formData.departmentId) return teachers
    return teachers.filter((t) => t.departmentId === formData.departmentId)
  }, [formData.departmentId, teachers])

  // Initialize form when schedule changes
  React.useEffect(() => {
    if (schedule) {
      setFormData({
        academicYear: schedule.academicYear,
        semester: schedule.semester,
        departmentId: schedule.departmentId,
        classSection: schedule.classSection,
        day: schedule.day,
        timeSlotId: schedule.timeSlotId,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        subjectId: schedule.subjectId,
        teacherId: schedule.teacherId,
        roomId: schedule.roomId,
        sessionType: schedule.sessionType,
        duration: schedule.duration,
        isMandatory: schedule.isMandatory,
        repeatWeekly: schedule.repeatWeekly,
        effectiveFrom: schedule.effectiveFrom,
        effectiveTill: schedule.effectiveTill,
        status: schedule.status,
      })
    } else if (defaultValues) {
      setFormData((prev) => ({
        ...prev,
        academicYear: defaultValues.academicYear,
        semester: defaultValues.semester,
        departmentId: defaultValues.departmentId,
        classSection: defaultValues.classSection,
        day: defaultValues.day || prev.day,
        timeSlotId: defaultValues.timeSlotId || prev.timeSlotId,
      }))
    }
  }, [schedule, defaultValues, open])

  // Update start/end time when time slot changes (only if not using custom time)
  React.useEffect(() => {
    if (formData.timeSlotId && !useCustomTime) {
      const slot = timeSlots.find((s) => s.id === formData.timeSlotId)
      if (slot && !slot.isBreak) {
        setFormData((prev) => ({
          ...prev,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }))
      }
    }
  }, [formData.timeSlotId, timeSlots, useCustomTime])

  // When switching to custom time mode, set timeSlotId to null
  React.useEffect(() => {
    if (useCustomTime) {
      setFormData(prev => ({ ...prev, timeSlotId: '' }))
    }
  }, [useCustomTime])

  const checkConflicts = async () => {
    try {
      const response = await fetch("/api/schedule/check-conflicts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          scheduleId: schedule?.id,
        }),
      })

      if (!response.ok) {
        setConflicts([])
        return null
      }
      
      const data = await response.json()
      setConflicts(data.conflicts || [])
      return data.conflicts || []
    } catch (error) {
      console.error("Error checking conflicts:", error)
      setConflicts([])
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setConflicts([])

    try {
      // Check for conflicts first
      const detectedConflicts = await checkConflicts()
      
      if (detectedConflicts === null) {
        toast.error("Failed to check for conflicts. Please try again.")
        setLoading(false)
        return
      }
      
      if (detectedConflicts.length > 0) {
        setLoading(false)
        toast.error("Cannot save schedule with conflicts. Please resolve them first.")
        return
      }

      const url = schedule ? `/api/schedule/${schedule.id}` : "/api/schedule"
      const method = schedule ? "PUT" : "POST"

      // Optimistic update - show changes immediately
      const optimisticData = {
        ...formData,
        id: schedule?.id || `temp-${Date.now()}`,
        subjectName: subjects.find(s => s.id === formData.subjectId)?.name || "",
        subjectCode: subjects.find(s => s.id === formData.subjectId)?.code || "",
        teacherName: teachers.find(t => t.id === formData.teacherId)?.name || "",
        roomName: formData.roomId,
        departmentName: departments.find(d => d.id === formData.departmentId)?.name || "",
      } as ScheduleSlot

      if (schedule && onUpdateOptimistic) {
        onUpdateOptimistic(optimisticData)
      } else if (!schedule && onAddOptimistic) {
        onAddOptimistic(optimisticData)
      }

      // Close dialog immediately
      onOpenChange(false)
      toast.success(
        schedule ? "Schedule updated successfully" : "Schedule created successfully"
      )

      // Background API call
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save schedule")
      }

      // Silent refresh to sync actual data
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save schedule")
      // Refresh on error to restore correct state
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!schedule) return

    if (!confirm("Are you sure you want to delete this class? This action cannot be undone.")) {
      return
    }

    const loadingToast = toast.loading("Deleting class...")
    setLoading(true)

    // Optimistic update - remove immediately
    if (onDeleteOptimistic) {
      onDeleteOptimistic(schedule.id)
    }

    try {
      const response = await fetch(`/api/schedule/${schedule.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete schedule")
      }

      toast.dismiss(loadingToast)
      toast.success("Class deleted successfully")
      onOpenChange(false)
      // Silent refresh to sync
      onSuccess()
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error(error instanceof Error ? error.message : "Failed to delete class")
      // Refresh on error to restore state
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {schedule ? "Edit Class Slot" : "Add New Class Slot"}
          </DialogTitle>
          <DialogDescription>
            {schedule
              ? "Update class schedule details and assignments."
              : "Create a new class slot in the timetable."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {conflicts.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-semibold">Conflicts detected:</p>
                    {conflicts.map((conflict, idx) => (
                      <p key={idx} className="text-sm">
                        • {conflict.message}
                      </p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="day">Day *</Label>
                <Select
                  value={formData.day}
                  onValueChange={(value) =>
                    setFormData({ ...formData, day: value as DayOfWeek })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day.charAt(0) + day.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useCustomTime"
                  checked={useCustomTime}
                  onCheckedChange={(checked) => setUseCustomTime(checked as boolean)}
                />
                <Label htmlFor="useCustomTime" className="cursor-pointer text-sm">
                  Set custom time (override time slot)
                </Label>
              </div>

              {!useCustomTime ? (
                <div className="grid gap-2">
                  <Label htmlFor="timeSlot">Time Slot *</Label>
                  <Select
                    value={formData.timeSlotId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, timeSlotId: value })
                    }
                    required={!useCustomTime}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.filter((slot) => !slot.isBreak).map((slot) => (
                        <SelectItem key={slot.id} value={slot.id}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                      required={useCustomTime}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                      required={useCustomTime}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select
                value={formData.subjectId}
                onValueChange={(value) =>
                  setFormData({ ...formData, subjectId: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.code ? `${subject.code} - ${subject.name}` : subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="teacher">Teacher *</Label>
              <Select
                value={formData.teacherId}
                onValueChange={(value) =>
                  setFormData({ ...formData, teacherId: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTeachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.facultyId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="room">Room Number *</Label>
                <Input
                  id="room"
                  value={formData.roomId}
                  onChange={(e) =>
                    setFormData({ ...formData, roomId: e.target.value })
                  }
                  placeholder="e.g., 101, A-204, Lab-3"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sessionType">Session Type *</Label>
                <Select
                  value={formData.sessionType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sessionType: value as SessionType })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (slots)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="3"
                  value={formData.duration}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10)
                    setFormData({ ...formData, duration: isNaN(value) ? 1 : value })
                  }}
                />
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="mandatory"
                  checked={formData.isMandatory}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isMandatory: checked as boolean })
                  }
                />
                <Label htmlFor="mandatory" className="cursor-pointer">
                  Mandatory Class
                </Label>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="repeatWeekly"
                checked={formData.repeatWeekly}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, repeatWeekly: checked as boolean })
                }
              />
              <Label htmlFor="repeatWeekly" className="cursor-pointer">
                Repeat Weekly
              </Label>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 flex-1">
              {schedule && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  const result = await checkConflicts()
                  if (result === null) {
                    toast.error("Failed to check conflicts. Please try again.")
                  }
                }}
                disabled={loading}
              >
                Check Conflicts
              </Button>
              <Button type="submit" disabled={loading || conflicts.length > 0}>
                {loading ? "Saving..." : schedule ? "Update" : "Create"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
