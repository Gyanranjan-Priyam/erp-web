"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Users, BookOpen, GraduationCap, Plus, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"

interface Subject {
  id: string
  name: string
  semester: number
  code: string
  category?: string
}

interface Department {
  id: string
  name: string
  code: string
  createdAt: string
  subjects: Subject[]
  _count: {
    students: number
    teachers: number
    subjects: number
  }
  pagination?: {
    page: number
    limit: number
    totalSubjects: number
    totalPages: number
    hasMore: boolean
  }
}

const DepartmentDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const departmentCode = params.departmentId as string

  const [department, setDepartment] = useState<Department | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [editSubject, setEditSubject] = useState<Subject | null>(null)
  const [deleteSubject, setDeleteSubject] = useState<Subject | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: "",
    code: "",
    category: "",
    year: "",
    semester: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [paginationLoading, setPaginationLoading] = useState(false)
  const [subjectsCache, setSubjectsCache] = useState<Map<string, { subjects: Subject[], pagination: any, count: number, timestamp: number }>>(new Map())

  const fetchDepartment = React.useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        year: selectedYear,
      })
      const response = await fetch(`/api/departments/by-code/${departmentCode}?${params}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch department")
      }
      
      const data = await response.json()
      setDepartment(data)
    } catch (error) {
      console.error("Error fetching department:", error)
      toast.error("Failed to load department details")
      router.push("/admin/departments")
    } finally {
      setLoading(false)
    }
  }, [departmentCode, currentPage, itemsPerPage, selectedYear, router])

  const fetchSubjects = React.useCallback(async () => {
    // Create cache key based on page and filter
    const cacheKey = `${currentPage}-${selectedYear}`
    
    // Check if we have cached data for this page
    const cached = subjectsCache.get(cacheKey)
    if (cached) {
      // Use cached data instantly without showing loading state
      setDepartment(prev => prev ? {
        ...prev,
        subjects: cached.subjects,
        pagination: cached.pagination,
        _count: {
          ...prev._count,
          subjects: cached.count
        }
      } : null)
      return
    }

    // Only show loading if we need to fetch new data
    setPaginationLoading(true)
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        year: selectedYear,
      })
      const response = await fetch(`/api/departments/by-code/${departmentCode}?${params}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch subjects")
      }
      
      const data = await response.json()
      
      // Store in cache
      setSubjectsCache(prev => {
        const newCache = new Map(prev)
        newCache.set(cacheKey, {
          subjects: data.subjects,
          pagination: data.pagination,
          count: data._count.subjects,
          timestamp: Date.now()
        })
        return newCache
      })
      
      // Only update subjects and pagination data, not the whole department
      setDepartment(prev => prev ? {
        ...prev,
        subjects: data.subjects,
        pagination: data.pagination,
        _count: {
          ...prev._count,
          subjects: data._count.subjects
        }
      } : null)
    } catch (error) {
      console.error("Error fetching subjects:", error)
      toast.error("Failed to load subjects")
    } finally {
      setPaginationLoading(false)
    }
  }, [departmentCode, currentPage, itemsPerPage, selectedYear, subjectsCache])

  useEffect(() => {
    if (departmentCode) {
      fetchDepartment()
    }
  }, [departmentCode, fetchDepartment])

  useEffect(() => {
    if (departmentCode && department) {
      fetchSubjects()
    }
  }, [currentPage, selectedYear, departmentCode, department, fetchSubjects])

  // Calculate year from semester (assuming 2 semesters per year)
  const getSemesterYear = (semester: number) => {
    return Math.ceil(semester / 2)
  }

  // Use subjects directly from server (already filtered)
  const filteredSubjects = department?.subjects || []

  // Get unique years (always show 1-4 for consistency)
  const availableYears = [1, 2, 3, 4]

  const handleYearChange = (year: string) => {
    setSelectedYear(year)
    setCurrentPage(1) // Reset to first page when filter changes
    setSubjectsCache(new Map()) // Clear cache when filter changes
  }

  const handleEditClick = (subject: Subject) => {
    setEditSubject(subject)
    const year = getSemesterYear(subject.semester)
    setEditFormData({
      name: subject.name,
      code: subject.code || "",
      category: subject.category || "",
      year: year.toString(),
      semester: subject.semester.toString(),
    })
  }

  const handleEditSubmit = async () => {
    if (!editSubject) return

    if (!editFormData.name.trim() || !editFormData.semester) {
      toast.error("Name and semester are required")
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/subjects/${editSubject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editFormData.name.trim(),
          code: editFormData.code.trim().toUpperCase(),
          category: editFormData.category.trim(),
          semester: parseInt(editFormData.semester),
        }),
      })

      if (!response.ok) {
        let errorMessage = "Failed to update subject"
        try {
          const data = await response.json()
          errorMessage = data.error || errorMessage
        } catch {
          // If JSON parsing fails, try to get text or use status text
          try {
            const text = await response.text()
            errorMessage = text || response.statusText || errorMessage
          } catch {
            errorMessage = `${response.status}: ${response.statusText || errorMessage}`
          }
        }
        throw new Error(errorMessage)
      }

      const updatedSubject = await response.json()

      // Clear cache to refetch updated data
      setSubjectsCache(new Map())
      
      // Refetch to get updated data
      await fetchDepartment()

      toast.success("Subject updated successfully")
      setEditSubject(null)
    } catch (error: any) {
      console.error("Error updating subject:", error)
      toast.error(error.message || "Failed to update subject")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteSubject) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/subjects/${deleteSubject.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        let errorMessage = "Failed to delete subject"
        try {
          const data = await response.json()
          errorMessage = data.error || errorMessage
        } catch {
          // If JSON parsing fails, try to get text or use status text
          try {
            const text = await response.text()
            errorMessage = text || response.statusText || errorMessage
          } catch {
            errorMessage = `${response.status}: ${response.statusText || errorMessage}`
          }
        }
        throw new Error(errorMessage)
      }

      // Clear cache to refetch updated data
      setSubjectsCache(new Map())
      
      // Refetch to get updated data
      await fetchDepartment()

      toast.success("Subject deleted successfully")
      setDeleteSubject(null)
    } catch (error: any) {
      console.error("Error deleting subject:", error)
      toast.error(error.message || "Failed to delete subject")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-4 px-4 sm:py-6 space-y-4 sm:space-y-6">
        <Skeleton className="h-8 sm:h-10 w-48 sm:w-64" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64 sm:h-96" />
      </div>
    )
  }

  if (!department) {
    return (
      <div className="container mx-auto py-4 px-4 sm:py-6">
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-sm sm:text-base text-muted-foreground">
              Department not found
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4 px-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/departments")}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate">
            {department.name}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Created on {new Date(department.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total Students
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {department._count.students}
            </div>
            <p className="text-xs text-muted-foreground">
              Enrolled in this department
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total Teachers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {department._count.teachers}
            </div>
            <p className="text-xs text-muted-foreground">
              Teaching in this department
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total Subjects
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {department._count.subjects}
            </div>
            <p className="text-xs text-muted-foreground">
              Offered by this department
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subjects List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">Subjects</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                All subjects offered by {department.name}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger className="w-full sm:w-45">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      Year {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={() => router.push(`/admin/departments/${departmentCode}/subject`)}
                className="w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Subject
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {filteredSubjects.length === 0 && !paginationLoading ? (
            <div className="text-center py-10 text-sm sm:text-base text-muted-foreground">
              {selectedYear === "all" 
                ? "No subjects found for this department"
                : `No subjects found for Year ${selectedYear}`
              }
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-20">Sl No</TableHead>
                    <TableHead className="min-w-50">Subject Name</TableHead>
                    <TableHead className="min-w-30">Subject Code</TableHead>
                    <TableHead className="min-w-25">Category</TableHead>
                    <TableHead className="min-w-30">Semester</TableHead>
                    <TableHead className="min-w-20">Year</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginationLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          <span className="text-sm text-muted-foreground">Loading subjects...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredSubjects.map((subject, index) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium text-sm sm:text-base">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="font-medium text-sm sm:text-base">
                        {subject.name}
                      </TableCell>
                      <TableCell className="font-medium text-sm sm:text-base font-mono">
                        {subject.code || "-"}
                      </TableCell>
                      <TableCell>
                        {subject.category ? (
                          <Badge variant="outline" className="text-xs capitalize">
                            {subject.category}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          Semester {subject.semester}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          Year {getSemesterYear(subject.semester)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(subject)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteSubject(subject)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination Info and Controls */}
          {department?.pagination && department.pagination.totalPages > 1 && (
            <div className="mt-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-muted-foreground">
                <div>
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, department.pagination.totalSubjects)} of {department.pagination.totalSubjects} subjects
                </div>
                <div>
                  Page {currentPage} of {department.pagination.totalPages}
                </div>
              </div>
              
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => !paginationLoading && setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={currentPage === 1 || paginationLoading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: department.pagination.totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first page, last page, current page, and pages around current
                      return (
                        page === 1 ||
                        page === department.pagination?.totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                    })
                    .map((page, idx, arr) => {
                      // Add ellipsis if there's a gap
                      const showEllipsisBefore = idx > 0 && arr[idx - 1] !== page - 1
                      
                      return (
                        <React.Fragment key={page}>
                          {showEllipsisBefore && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => !paginationLoading && setCurrentPage(page)}
                              isActive={currentPage === page}
                              className={paginationLoading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        </React.Fragment>
                      )
                    })
                  }
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => !paginationLoading && setCurrentPage(prev => Math.min(department.pagination?.totalPages || 1, prev + 1))}
                      className={currentPage === department.pagination?.totalPages || paginationLoading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Subject Dialog */}
      <Dialog open={!!editSubject} onOpenChange={(open) => !open && setEditSubject(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>
              Update the subject information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Subject Name *</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-code">Subject Code</Label>
                <Input
                  id="edit-code"
                  value={editFormData.code}
                  onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editFormData.category}
                  onValueChange={(value) => setEditFormData({ ...editFormData, category: value })}
                >
                  <SelectTrigger id="edit-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="core">Core</SelectItem>
                    <SelectItem value="elective">Elective</SelectItem>
                    <SelectItem value="practical">Practical</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-year">Year *</Label>
                <Select
                  value={editFormData.year}
                  onValueChange={(value) => {
                    setEditFormData({ ...editFormData, year: value, semester: "" })
                  }}
                >
                  <SelectTrigger id="edit-year">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        Year {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-semester">Semester *</Label>
                <Select
                  value={editFormData.semester}
                  onValueChange={(value) => setEditFormData({ ...editFormData, semester: value })}
                  disabled={!editFormData.year}
                >
                  <SelectTrigger id="edit-semester">
                    <SelectValue placeholder={editFormData.year ? "Select semester" : "Select year first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {editFormData.year && (
                      <>
                        <SelectItem value={((parseInt(editFormData.year) - 1) * 2 + 1).toString()}>
                          Semester {(parseInt(editFormData.year) - 1) * 2 + 1}
                        </SelectItem>
                        <SelectItem value={((parseInt(editFormData.year) - 1) * 2 + 2).toString()}>
                          Semester {(parseInt(editFormData.year) - 1) * 2 + 2}
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSubject(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={submitting}>
              {submitting ? "Updating..." : "Update Subject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Subject Confirmation */}
      <AlertDialog open={!!deleteSubject} onOpenChange={(open) => !open && setDeleteSubject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteSubject?.name}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default DepartmentDetailPage
