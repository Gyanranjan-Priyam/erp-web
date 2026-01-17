"use client"

import * as React from "react"
import {
  Plus,
  Download,
  Copy,
  FileUp,
  Calendar,
  Grid3x3,
  User,
  DoorOpen,
  RefreshCw,
  Trash2,
  Clock,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  ScheduleSlot,
  Department,
  Subject,
  Teacher,
  Room,
  TimeSlot,
  ScheduleFilter,
  ViewMode,
  DayOfWeek,
  ACADEMIC_YEARS,
  SEMESTERS,
  DEFAULT_TIME_SLOTS,
} from "./types"
import { TimetableGrid } from "./_components/timetable-grid"
import { ScheduleDialog } from "./_components/schedule-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function SchedulePage() {
  const [schedules, setSchedules] = React.useState<ScheduleSlot[]>([])
  const [departments, setDepartments] = React.useState<Department[]>([])
  const [subjects, setSubjects] = React.useState<Subject[]>([])
  const [teachers, setTeachers] = React.useState<Teacher[]>([])
  const [rooms, setRooms] = React.useState<Room[]>([])
  const [timeSlots, setTimeSlots] = React.useState<TimeSlot[]>(DEFAULT_TIME_SLOTS)
  const [loading, setLoading] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<ViewMode>("GRID")
  
  const [filter, setFilter] = React.useState<ScheduleFilter>({
    academicYear: "2025-2026",
    semester: null,
    departmentId: "",
    classSection: "",
    timetableType: "REGULAR",
  })

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedSchedule, setSelectedSchedule] = React.useState<ScheduleSlot | null>(null)
  const [dialogDefaults, setDialogDefaults] = React.useState<any>(null)
  
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [publishDialogOpen, setPublishDialogOpen] = React.useState(false)
  const [isPublishing, setIsPublishing] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Optimistic update handlers
  const addScheduleOptimistic = React.useCallback((newSchedule: ScheduleSlot) => {
    setSchedules(prev => [...prev, newSchedule])
  }, [])

  const updateScheduleOptimistic = React.useCallback((updatedSchedule: ScheduleSlot) => {
    setSchedules(prev => prev.map(s => s.id === updatedSchedule.id ? updatedSchedule : s))
  }, [])

  const deleteScheduleOptimistic = React.useCallback((scheduleId: string) => {
    setSchedules(prev => prev.filter(s => s.id !== scheduleId))
  }, [])

  // Silent background refresh without loading state
  const silentRefresh = React.useCallback(async () => {
    if (!filter.departmentId || !filter.semester || !filter.classSection) {
      return
    }

    try {
      const params = new URLSearchParams({
        academicYear: filter.academicYear,
        semester: filter.semester.toString(),
        departmentId: filter.departmentId,
        classSection: filter.classSection,
        timetableType: filter.timetableType,
      })

      const response = await fetch(`/api/schedule?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setSchedules(data)
      }
    } catch (error) {
      console.error("Silent refresh failed:", error)
    }
  }, [filter])

  // Fetch initial data
  const fetchInitialData = React.useCallback(async () => {
    try {
      const [departmentsRes, subjectsRes, teachersRes, roomsRes, timeSlotsRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/subjects"),
        fetch("/api/faculties"),
        fetch("/api/rooms"),
        fetch("/api/time-slots"),
      ])

      if (!departmentsRes.ok || !subjectsRes.ok || !teachersRes.ok) {
        throw new Error("Failed to fetch data")
      }

      const [deptData, subjData, teachData, roomsData, timeSlotsData] = await Promise.all([
        departmentsRes.json(),
        subjectsRes.json(),
        teachersRes.json(),
        roomsRes.ok ? roomsRes.json() : [],
        timeSlotsRes.ok ? timeSlotsRes.json() : DEFAULT_TIME_SLOTS,
      ])

      setDepartments(deptData)
      setSubjects(subjData)
      setTimeSlots(timeSlotsData.length > 0 ? timeSlotsData : DEFAULT_TIME_SLOTS)
      setRooms(roomsData)
      setTeachers(
        teachData.map((t: any) => ({
          id: t.id,
          name: t.name,
          facultyId: t.facultyId,
          departmentId: t.departmentId,
        }))
      )
    } catch (error) {
      toast.error("Failed to load initial data")
      console.error(error)
    }
  }, [])

  // Fetch schedules based on filter
  const fetchSchedules = React.useCallback(async () => {
    if (!filter.departmentId || !filter.semester || !filter.classSection) {
      setSchedules([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams({
        academicYear: filter.academicYear,
        semester: filter.semester.toString(),
        departmentId: filter.departmentId,
        classSection: filter.classSection,
        timetableType: filter.timetableType,
      })

      const response = await fetch(`/api/schedule?${params}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch schedules")
      }

      const data = await response.json()
      setSchedules(data)
    } catch (error) {
      toast.error("Failed to load schedules")
      console.error(error)
      setSchedules([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  React.useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  const handleLoadSchedule = () => {
    fetchSchedules()
  }

  const handleResetFilters = () => {
    setFilter({
      academicYear: "2025-2026",
      semester: null,
      departmentId: "",
      classSection: "",
      timetableType: "REGULAR",
    })
    setSchedules([])
  }

  const handleAddSlot = (day?: DayOfWeek, timeSlotId?: string) => {
    if (!filter.semester) {
      toast.error("Please select a semester first")
      return
    }
    setSelectedSchedule(null)
    
    // Don't pass timeSlotId if it's a dynamically generated slot ID
    const isCustomSlot = timeSlotId?.startsWith('slot-')
    
    setDialogDefaults({
      academicYear: filter.academicYear,
      semester: filter.semester,
      departmentId: filter.departmentId,
      classSection: filter.classSection,
      day,
      timeSlotId: isCustomSlot ? undefined : timeSlotId, // Don't pass custom slot IDs
    })
    setDialogOpen(true)
  }

  const handleEditSlot = (schedule: ScheduleSlot) => {
    setSelectedSchedule(schedule)
    setDialogDefaults(null)
    setDialogOpen(true)
  }

  const handlePublishSchedule = async () => {
    if (isPublishing) return
    
    try {
      setIsPublishing(true)
      const response = await fetch("/api/schedule/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicYear: filter.academicYear,
          semester: filter.semester,
          departmentId: filter.departmentId,
          classSection: filter.classSection,
        }),
      })

      if (!response.ok) throw new Error("Failed to publish")

      toast.success("Schedule published successfully")
      fetchSchedules()
    } catch (error) {
      toast.error("Failed to publish schedule")
    } finally {
      setIsPublishing(false)
      setPublishDialogOpen(false)
    }
  }

  const handleDeleteAll = async () => {
    if (isDeleting) return
    
    try {
      setIsDeleting(true)
      const response = await fetch("/api/schedule/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicYear: filter.academicYear,
          semester: filter.semester,
          departmentId: filter.departmentId,
          classSection: filter.classSection,
        }),
      })

      if (!response.ok) throw new Error("Failed to delete")

      toast.success("All schedules deleted successfully")
      fetchSchedules()
    } catch (error) {
      toast.error("Failed to delete schedules")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const isFilterComplete = filter.departmentId && filter.semester && filter.classSection
  const hasSchedules = schedules.length > 0
  const isPublished = schedules.some((s) => s.status === "PUBLISHED")

  // Get class sections for selected department
  const classSections = ["A", "B", "C", "D"]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Class Schedule</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage weekly timetables for all classes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Copy From Existing
          </Button>
          {isPublished ? (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Published
            </Badge>
          ) : (
            <Button
              size="sm"
              onClick={() => setPublishDialogOpen(true)}
              disabled={!hasSchedules}
            >
              <FileUp className="h-4 w-4 mr-2" />
              Publish Schedule
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Export as PDF</DropdownMenuItem>
              <DropdownMenuItem>Export as Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filter Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Selection</CardTitle>
          <CardDescription>Select context to load or create schedules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select
                value={filter.academicYear}
                onValueChange={(value) => setFilter({ ...filter, academicYear: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMIC_YEARS.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Semester</Label>
              <Select
                value={filter.semester?.toString() || ""}
                onValueChange={(value) =>
                  setFilter({ ...filter, semester: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {SEMESTERS.map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>
                      Semester {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={filter.departmentId}
                onValueChange={(value) => setFilter({ ...filter, departmentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Class / Section</Label>
              <Select
                value={filter.classSection}
                onValueChange={(value) => setFilter({ ...filter, classSection: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {classSections.map((section) => (
                    <SelectItem key={section} value={section}>
                      Section {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Timetable Type</Label>
              <Select
                value={filter.timetableType}
                onValueChange={(value: any) =>
                  setFilter({ ...filter, timetableType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REGULAR">Regular</SelectItem>
                  <SelectItem value="EXAM">Exam</SelectItem>
                  <SelectItem value="SPECIAL">Special / Extra Class</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button onClick={handleLoadSchedule} disabled={!isFilterComplete}>
              <Calendar className="h-4 w-4 mr-2" />
              Load Schedule
            </Button>
            <Button variant="outline" onClick={handleResetFilters}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
            {hasSchedules && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleAddSlot()}
                  className="ml-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Slot
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Mode Toggle */}
      {hasSchedules && (
        <div className="flex items-center gap-2">
          <Label>View Mode:</Label>
          <div className="flex gap-1">
            <Button
              variant={viewMode === "GRID" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("GRID")}
            >
              <Grid3x3 className="h-4 w-4 mr-2" />
              Grid View
            </Button>
            <Button
              variant={viewMode === "TEACHER" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("TEACHER")}
            >
              <User className="h-4 w-4 mr-2" />
              Teacher View
            </Button>
            <Button
              variant={viewMode === "CLASSROOM" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("CLASSROOM")}
            >
              <DoorOpen className="h-4 w-4 mr-2" />
              Classroom View
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : !isFilterComplete ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select Filters to Continue</h3>
            <p className="text-muted-foreground">
              Please select Academic Year, Semester, Department, and Class Section to load or
              create schedules.
            </p>
          </CardContent>
        </Card>
      ) : !hasSchedules ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Schedule Found</h3>
            <p className="text-muted-foreground mb-4">
              No timetable exists for the selected filters. Create a new schedule to get started.
            </p>
            <Button onClick={() => handleAddSlot()}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Schedule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TimetableGrid
          schedules={schedules}
          timeSlots={timeSlots}
          onAddSlot={handleAddSlot}
          onEditSlot={handleEditSlot}
          onScheduleUpdated={silentRefresh}
          onDeleteOptimistic={deleteScheduleOptimistic}
          viewMode={viewMode}
        />
      )}

      {/* Schedule Dialog */}
      <ScheduleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        schedule={selectedSchedule}
        departments={departments}
        subjects={subjects}
        teachers={teachers}
        rooms={rooms}
        timeSlots={timeSlots}
        onSuccess={silentRefresh}
        defaultValues={dialogDefaults}
        onAddOptimistic={addScheduleOptimistic}
        onUpdateOptimistic={updateScheduleOptimistic}
        onDeleteOptimistic={deleteScheduleOptimistic}
      />

      {/* Publish Confirmation */}
      <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make the schedule visible to all students and teachers. Make sure all
              conflicts are resolved before publishing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPublishing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublishSchedule} disabled={isPublishing}>
              {isPublishing ? "Publishing..." : "Publish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Schedules?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all schedules for the selected filters. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive" disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
