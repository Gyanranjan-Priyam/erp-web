"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  BookOpen,
  Edit,
  Trash2,
  UserCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Faculty } from "../types"
import { toast } from "sonner"
import { FacultyDialog } from "../_components/faculty-dialog"
import { DeleteFacultyDialog } from "../_components/delete-faculty-dialog"

interface FacultyDetailPageProps {
  params: Promise<{ facultyId: string }>
}

export default function FacultyDetailPage({ params }: FacultyDetailPageProps) {
  const router = useRouter()
  const [faculty, setFaculty] = React.useState<Faculty | null>(null)
  const [departments, setDepartments] = React.useState([])
  const [subjects, setSubjects] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [facultyId, setFacultyId] = React.useState<string>("")

  React.useEffect(() => {
    params.then((p) => setFacultyId(p.facultyId))
  }, [params])

  const fetchData = React.useCallback(async () => {
    if (!facultyId) return

    try {
      setLoading(true)
      const [facultyRes, departmentsRes, subjectsRes] = await Promise.all([
        fetch(`/api/faculties/by-faculty-id/${facultyId}`),
        fetch("/api/departments"),
        fetch("/api/subjects"),
      ])

      if (!facultyRes.ok) {
        if (facultyRes.status === 404) {
          toast.error("Faculty not found")
          router.push("/admin/faculties")
          return
        }
        throw new Error("Failed to fetch faculty")
      }

      const [facultyData, departmentsData, subjectsData] = await Promise.all([
        facultyRes.json(),
        departmentsRes.json(),
        subjectsRes.json(),
      ])

      setFaculty(facultyData)
      setDepartments(departmentsData)
      setSubjects(subjectsData)
    } catch (error) {
      toast.error("Failed to load faculty details")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [facultyId, router])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleEditSuccess = () => {
    fetchData()
  }

  const handleDeleteSuccess = () => {
    router.push("/admin/faculties")
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column - Profile Skeleton */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <Skeleton className="h-32 w-32 rounded-full" />
                </div>
                <Skeleton className="h-7 w-48 mx-auto mb-2" />
                <Skeleton className="h-5 w-32 mx-auto mb-3" />
                <div className="flex justify-center">
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-5 w-5 mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details Skeleton */}
          <div className="md:col-span-2 space-y-6">
            {/* Subjects Card Skeleton */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-6 w-48" />
                </div>
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="pt-4">
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Account Info Card Skeleton */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-6 w-48" />
                </div>
                <Skeleton className="h-4 w-56 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stats Skeleton */}
            <div className="grid gap-4 sm:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <Skeleton className="h-10 w-16 mx-auto" />
                      <Skeleton className="h-4 w-32 mx-auto" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!faculty) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-lg font-medium">Faculty not found</div>
          <Button onClick={() => router.push("/admin/faculties")} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/faculties")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Faculty Details</h1>
            <p className="text-muted-foreground">
              Complete information about {faculty.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Profile */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <Avatar className="h-32 w-32">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-3xl">
                    {getInitials(faculty.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-2xl">{faculty.name}</CardTitle>
              <CardDescription className="text-base">
                {faculty.facultyId}
              </CardDescription>
              <div className="flex justify-center mt-3">
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
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground break-all">
                      {faculty.user.email}
                    </p>
                  </div>
                </div>

                {faculty.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">
                        {faculty.phone}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Department</p>
                    <p className="text-sm text-muted-foreground">
                      {faculty.department.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Joined</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(faculty.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Subjects */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <CardTitle>Subjects Assigned</CardTitle>
              </div>
              <CardDescription>
                {faculty.subjects.length} subject(s) currently assigned
              </CardDescription>
            </CardHeader>
            <CardContent>
              {faculty.subjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No subjects assigned yet</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {faculty.subjects.map((sub) => (
                    <Card key={sub.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{sub.subject.name}</h4>
                            {sub.subject.semester && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Semester {sub.subject.semester}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                <CardTitle>Account Information</CardTitle>
              </div>
              <CardDescription>System and account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">User ID</p>
                  <p className="text-sm text-muted-foreground font-mono mt-1">
                    {faculty.userId.slice(0, 8)}...
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Faculty ID</p>
                  <p className="text-sm text-muted-foreground font-mono mt-1">
                    {faculty.facultyId}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Account Status</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {faculty.user.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Account Created</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(faculty.user.createdAt || faculty.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {faculty.subjects.length}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Subjects Teaching
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {faculty.user.isActive ? "Yes" : "No"}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Currently Active
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">1</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Department
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <FacultyDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        faculty={faculty}
        departments={departments}
        subjects={subjects}
        onSuccess={handleEditSuccess}
      />

      <DeleteFacultyDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        faculty={faculty}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  )
}
