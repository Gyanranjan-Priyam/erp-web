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
import { Checkbox } from "@/components/ui/checkbox"
import { Faculty, FacultyFormData, Department, Subject } from "../types"
import { toast } from "sonner"

interface FacultyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  faculty?: Faculty | null
  departments: Department[]
  subjects: Subject[]
  onSuccess: () => void
}

export function FacultyDialog({
  open,
  onOpenChange,
  faculty,
  departments,
  subjects,
  onSuccess,
}: FacultyDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [formData, setFormData] = React.useState<FacultyFormData>({
    facultyId: "",
    name: "",
    email: "",
    phone: "",
    departmentId: "",
    subjectIds: [],
  })

  // Filter subjects by selected department
  const filteredSubjects = React.useMemo(() => {
    if (!formData.departmentId) return []
    return subjects.filter((s) => s.departmentId === formData.departmentId)
  }, [formData.departmentId, subjects])

  // Initialize form when faculty changes
  React.useEffect(() => {
    if (faculty) {
      setFormData({
        facultyId: faculty.facultyId,
        name: faculty.name,
        email: faculty.user.email,
        phone: faculty.phone || "",
        departmentId: faculty.departmentId,
        subjectIds: faculty.subjects.map((s) => s.subject.id),
      })
    } else {
      setFormData({
        facultyId: "",
        name: "",
        email: "",
        phone: "",
        departmentId: "",
        subjectIds: [],
      })
    }
  }, [faculty, open])

  // Clear subject selection when department changes
  React.useEffect(() => {
    if (!faculty) {
      setFormData((prev) => ({ ...prev, subjectIds: [] }))
    }
  }, [formData.departmentId, faculty])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = faculty
        ? `/api/faculties/${faculty.id}`
        : "/api/faculties"
      const method = faculty ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save faculty")
      }

      toast.success(
        faculty
          ? "Faculty updated successfully"
          : "Faculty created successfully"
      )
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save faculty"
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSubjectToggle = (subjectId: string) => {
    setFormData((prev) => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(subjectId)
        ? prev.subjectIds.filter((id) => id !== subjectId)
        : [...prev.subjectIds, subjectId],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {faculty ? "Edit Faculty" : "Add New Faculty"}
          </DialogTitle>
          <DialogDescription>
            {faculty
              ? "Update faculty information and subject assignments."
              : "Create a new faculty member and assign subjects."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="facultyId">Faculty ID *</Label>
              <Input
                id="facultyId"
                value={formData.facultyId}
                onChange={(e) =>
                  setFormData({ ...formData, facultyId: e.target.value })
                }
                placeholder="FID-2024-001"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Dr. John Doe"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="john.doe@university.edu"
                required
                disabled={!!faculty}
              />
              {faculty && (
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+1 234 567 8900"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="department">Department *</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) =>
                  setFormData({ ...formData, departmentId: value })
                }
                required
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

            {formData.departmentId && filteredSubjects.length > 0 && (
              <div className="grid gap-2">
                <Label>Subjects Assigned</Label>
                <div className="border rounded-md p-3 max-h-50 overflow-y-auto">
                  <div className="space-y-2">
                    {filteredSubjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={subject.id}
                          checked={formData.subjectIds.includes(subject.id)}
                          onCheckedChange={() =>
                            handleSubjectToggle(subject.id)
                          }
                        />
                        <label
                          htmlFor={subject.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {subject.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.subjectIds.length} subject(s) selected
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : faculty ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
