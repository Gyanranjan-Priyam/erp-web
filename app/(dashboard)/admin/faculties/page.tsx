"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Filter, Eye, Pencil, Trash2, Users, UserCheck, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { FacultyDialog } from "./_components/faculty-dialog"
import { DeleteFacultyDialog } from "./_components/delete-faculty-dialog"
import { Faculty, Department, Subject } from "./types"
import { toast } from "sonner"

export default function Faculties() {
  const router = useRouter()
  const [faculties, setFaculties] = React.useState<Faculty[]>([])
  const [departments, setDepartments] = React.useState<Department[]>([])
  const [subjects, setSubjects] = React.useState<Subject[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedDepartment, setSelectedDepartment] = React.useState<string>("all")
  
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedFaculty, setSelectedFaculty] = React.useState<Faculty | null>(null)

  // Fetch all data
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      const [facultiesRes, departmentsRes, subjectsRes] = await Promise.all([
        fetch("/api/faculties"),
        fetch("/api/departments"),
        fetch("/api/subjects"),
      ])

      if (!facultiesRes.ok || !departmentsRes.ok || !subjectsRes.ok) {
        throw new Error("Failed to fetch data")
      }

      const [facultiesData, departmentsData, subjectsData] = await Promise.all([
        facultiesRes.json(),
        departmentsRes.json(),
        subjectsRes.json(),
      ])

      setFaculties(facultiesData)
      setDepartments(departmentsData)
      setSubjects(subjectsData)
    } catch (error) {
      toast.error("Failed to load data")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter faculties
  const filteredFaculties = React.useMemo(() => {
    return faculties.filter((faculty) => {
      const matchesSearch =
        faculty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faculty.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faculty.id.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesDepartment =
        selectedDepartment === "all" || faculty.departmentId === selectedDepartment

      return matchesSearch && matchesDepartment
    })
  }, [faculties, searchQuery, selectedDepartment])

  // Calculate stats
  const stats = React.useMemo(() => {
    const totalFaculty = faculties.length
    const activeNow = faculties.filter((f) => f.user.isActive).length
    const uniqueDepartments = new Set(faculties.map((f) => f.departmentId)).size

    return {
      totalFaculty,
      activeNow,
      uniqueDepartments,
    }
  }, [faculties])

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Handle add new
  const handleAddNew = () => {
    setSelectedFaculty(null)
    setDialogOpen(true)
  }

  // Handle edit
  const handleEdit = (faculty: Faculty) => {
    setSelectedFaculty(faculty)
    setDialogOpen(true)
  }

  // Handle delete
  const handleDelete = (faculty: Faculty) => {
    setSelectedFaculty(faculty)
    setDeleteDialogOpen(true)
  }

  // Handle quick view - navigate to detail page
  const handleQuickView = (faculty: Faculty) => {
    router.push(`/admin/faculties/${faculty.facultyId}`)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Faculty Management</h1>
            <p className="text-muted-foreground">
              Overview and administrative controls for all faculty departments.
            </p>
          </div>
          <Button onClick={handleAddNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Faculty
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TOTAL FACULTY</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFaculty}</div>
            <p className="text-xs text-green-600 mt-1">
              +4 this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ACTIVE NOW</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeNow}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently in class
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DEPARTMENTS</CardTitle>
            <Building2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueDepartments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {departments.length} faculties
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by Faculty ID, Name, or Subject..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-50">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>FACULTY</TableHead>
                  <TableHead>FACULTY ID</TableHead>
                  <TableHead>DEPARTMENT</TableHead>
                  <TableHead>SUBJECTS ASSIGNED</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead className="text-right">ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-24 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>FACULTY</TableHead>
                  <TableHead>FACULTY ID</TableHead>
                  <TableHead>DEPARTMENT</TableHead>
                  <TableHead>SUBJECTS ASSIGNED</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead className="text-right">ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaculties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-32">
                      <p className="text-muted-foreground">
                        {searchQuery || selectedDepartment !== "all"
                          ? "No faculties found matching your filters"
                          : "No faculties yet. Click 'Add New Faculty' to get started."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFaculties.map((faculty) => (
                    <TableRow key={faculty.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {getInitials(faculty.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{faculty.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {faculty.user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {faculty.facultyId}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{faculty.department.name}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {faculty.subjects.length === 0 ? (
                            <span className="text-sm text-muted-foreground">
                              No subjects
                            </span>
                          ) : (
                            <>
                              {faculty.subjects.slice(0, 2).map((sub) => (
                                <Badge
                                  key={sub.id}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {sub.subject.name}
                                </Badge>
                              ))}
                              {faculty.subjects.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{faculty.subjects.length - 2} More
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={faculty.user.isActive ? "default" : "secondary"}
                          className={
                            faculty.user.isActive
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : ""
                          }
                        >
                          {faculty.user.isActive ? "Active" : "On Leave"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-blue-600">
                              Quick View
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleQuickView(faculty)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(faculty)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(faculty)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination Info */}
      {filteredFaculties.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing 1 to {filteredFaculties.length} of {filteredFaculties.length}{" "}
            entries
          </p>
        </div>
      )}

      {/* Dialogs */}
      <FacultyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        faculty={selectedFaculty}
        departments={departments}
        subjects={subjects}
        onSuccess={fetchData}
      />

      <DeleteFacultyDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        faculty={selectedFaculty}
        onSuccess={fetchData}
      />
    </div>
  )
}