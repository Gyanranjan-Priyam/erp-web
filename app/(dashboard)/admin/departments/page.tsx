"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, AlertCircle, MoreHorizontal, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Department {
  id: string
  name: string
  code: string
  createdAt: string
  _count?: {
    students: number
    teachers: number
    subjects: number
  }
}

const Departments = () => {
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [formData, setFormData] = useState({ name: "", code: "" })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/departments")
      if (!response.ok) throw new Error("Failed to fetch departments")
      const data = await response.json()
      setDepartments(data)
    } catch (error) {
      console.error("Error fetching departments:", error)
      toast.error("Failed to load departments")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Department name is required")
      return
    }

    if (!formData.code.trim()) {
      toast.error("Department code is required")
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create department")
      }

      toast.success("Department created successfully")
      setIsCreateDialogOpen(false)
      setFormData({ name: "", code: "" })
      fetchDepartments()
    } catch (error: any) {
      console.error("Error creating department:", error)
      toast.error(error.message || "Failed to create department")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedDepartment || !formData.name.trim()) {
      toast.error("Department name is required")
      return
    }

    if (!formData.code.trim()) {
      toast.error("Department code is required")
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/departments/${selectedDepartment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update department")
      }

      toast.success("Department updated successfully")
      setIsEditDialogOpen(false)
      setSelectedDepartment(null)
      setFormData({ name: "", code: "" })
      fetchDepartments()
    } catch (error: any) {
      console.error("Error updating department:", error)
      toast.error(error.message || "Failed to update department")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedDepartment) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/departments/${selectedDepartment.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete department")
      }

      toast.success("Department deleted successfully")
      setIsDeleteDialogOpen(false)
      setSelectedDepartment(null)
      fetchDepartments()
    } catch (error: any) {
      console.error("Error deleting department:", error)
      toast.error(error.message || "Failed to delete department")
    } finally {
      setSubmitting(false)
    }
  }

  const openEditDialog = (department: Department) => {
    setSelectedDepartment(department)
    setFormData({ name: department.name, code: department.code })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (department: Department) => {
    setSelectedDepartment(department)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="container mx-auto py-4 px-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage all departments in the institution
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Skeleton className="h-4 w-32" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                  <TableHead className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : departments.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No departments found</h3>
              <p className="text-muted-foreground mt-2">
                Get started by creating a new department.
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">All Departments</CardTitle>
            <CardDescription className="text-sm">
              Total: {departments.length} department{departments.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Department Name</TableHead>
                    <TableHead className="min-w-[80px]">Code</TableHead>
                    <TableHead className="hidden sm:table-cell">Students</TableHead>
                    <TableHead className="hidden sm:table-cell">Teachers</TableHead>
                    <TableHead className="hidden md:table-cell">Subjects</TableHead>
                    <TableHead className="hidden lg:table-cell">Created At</TableHead>
                    <TableHead className="text-right min-w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((department) => (
                    <TableRow key={department.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{department.name}</span>
                          <span className="text-xs text-muted-foreground sm:hidden">
                            {department._count?.students || 0} students • {department._count?.teachers || 0} teachers
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {department.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">
                          {department._count?.students || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">
                          {department._count?.teachers || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">
                          {department._count?.subjects || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {new Date(department.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/departments/${department.code}`)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openEditDialog(department)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(department)}
                              className="text-destructive focus:text-destructive"
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
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Create New Department</DialogTitle>
            <DialogDescription className="text-sm">
              Add a new department to the institution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">Department Name</Label>
              <Input
                id="name"
                placeholder="e.g., Computer Science"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm">Department Code</Label>
              <Input
                id="code"
                placeholder="e.g., CSE"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !submitting) {
                    handleCreate()
                  }
                }}
                maxLength={10}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                setFormData({ name: "", code: "" })
              }}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting} className="w-full sm:w-auto">
              {submitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Department</DialogTitle>
            <DialogDescription className="text-sm">
              Update the department information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm">Department Name</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Computer Science"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-code" className="text-sm">Department Code</Label>
              <Input
                id="edit-code"
                placeholder="e.g., CSE"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !submitting) {
                    handleEdit()
                  }
                }}
                maxLength={10}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedDepartment(null)
                setFormData({ name: "", code: "" })
              }}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={submitting} className="w-full sm:w-auto">
              {submitting ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-[425px] max-w-[95vw]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This will permanently delete the department{" "}
              <strong>{selectedDepartment?.name}</strong>.
              {selectedDepartment?._count && (
                <>
                  <Alert className="mt-4" variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs sm:text-sm">
                      This department has{" "}
                      <strong>{selectedDepartment._count.students} students</strong>,{" "}
                      <strong>{selectedDepartment._count.teachers} teachers</strong>, and{" "}
                      <strong>{selectedDepartment._count.subjects} subjects</strong>.
                      You cannot delete it until these are removed.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={submitting} className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting || Boolean(selectedDepartment?._count?.students || selectedDepartment?._count?.teachers || selectedDepartment?._count?.subjects)}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Departments