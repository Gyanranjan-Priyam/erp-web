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
import { Badge } from "@/components/ui/badge"
import { Faculty, FacultyFormData, Department, Subject, DESIGNATIONS } from "../types"
import { toast } from "sonner"
import { X, ChevronDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

interface FacultyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  faculty?: Faculty | null
  departments: Department[]
  subjects: Subject[]
  onSuccess: () => void
  onOptimisticAdd?: (faculty: Partial<Faculty>) => void
  onOptimisticUpdate?: (tempId: string, realFaculty: Faculty) => void
  onOptimisticRemove?: (tempId: string) => void
}

export function FacultyDialog({
  open,
  onOpenChange,
  faculty,
  departments,
  subjects,
  onSuccess,
  onOptimisticAdd,
  onOptimisticUpdate,
  onOptimisticRemove,
}: FacultyDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [designationError, setDesignationError] = React.useState(false)
  const [designationOpen, setDesignationOpen] = React.useState(false)
  const [subjectOpen, setSubjectOpen] = React.useState(false)
  const [formData, setFormData] = React.useState<FacultyFormData>({
    facultyId: "",
    name: "",
    email: "",
    phone: "",
    departmentId: "",
    subjectIds: [],
    designations: [],
  })

  // Filter subjects by selected department
  const filteredSubjects = React.useMemo(() => {
    if (!formData.departmentId) return []
    return subjects.filter((s) => s.departmentId === formData.departmentId)
  }, [formData.departmentId, subjects])

  // Initialize form when faculty changes
  React.useEffect(() => {
    setDesignationError(false)
    if (faculty) {
      setFormData({
        facultyId: faculty.facultyId,
        name: faculty.name,
        email: faculty.user.email,
        phone: faculty.phone || "",
        departmentId: faculty.departmentId,
        subjectIds: faculty.subjects.map((s) => s.subject.id),
        designations: faculty.designations || [],
      })
    } else {
      setFormData({
        facultyId: "",
        name: "",
        email: "",
        phone: "",
        departmentId: "",
        subjectIds: [],
        designations: [],
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
    
    // Validate designation selection
    if (formData.designations.length === 0) {
      setDesignationError(true)
      toast.error("Please select at least one designation")
      return
    }
    
    setDesignationError(false)

    // For new faculty, implement optimistic update
    if (!faculty && onOptimisticAdd && onOptimisticUpdate && onOptimisticRemove) {
      // Create optimistic faculty object
      const selectedDept = departments.find(d => d.id === formData.departmentId)
      const selectedSubjects = subjects.filter(s => formData.subjectIds.includes(s.id))
      
      const tempId = 'temp-' + Date.now()
      const optimisticFaculty: Partial<Faculty> = {
        id: tempId,
        facultyId: formData.facultyId,
        name: formData.name,
        phone: formData.phone || null,
        departmentId: formData.departmentId,
        designations: formData.designations,
        user: {
          email: formData.email,
          isActive: true,
        },
        department: selectedDept ? {
          id: selectedDept.id,
          name: selectedDept.name,
        } : { id: '', name: '' },
        subjects: selectedSubjects.map(s => ({
          id: 'temp-ts-' + s.id,
          subject: {
            id: s.id,
            name: s.name,
          },
        })),
      }
      
      // Add to list optimistically
      onOptimisticAdd(optimisticFaculty)
      
      // Close dialog immediately
      onOpenChange(false)
      
      // Post to backend silently
      try {
        const response = await fetch("/api/faculties", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to save faculty")
        }

        // Success: Update the optimistic entry with real data from server
        onOptimisticUpdate(tempId, data)
        toast.success("Faculty added successfully")
      } catch (error) {
        // Failure: Silently remove the optimistic entry
        onOptimisticRemove(tempId)
        toast.error(
          error instanceof Error ? error.message : "Failed to add faculty"
        )
      }
      return
    }

    // For editing, use normal flow with loading state
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

  const handleDesignationToggle = (designation: string) => {
    setDesignationError(false)
    setFormData((prev) => ({
      ...prev,
      designations: prev.designations.includes(designation)
        ? prev.designations.filter((d) => d !== designation)
        : [...prev.designations, designation],
    }))
  }

  const removeDesignation = (designation: string) => {
    setFormData((prev) => ({
      ...prev,
      designations: prev.designations.filter((d) => d !== designation),
    }))
  }

  const removeSubject = (subjectId: string) => {
    setFormData((prev) => ({
      ...prev,
      subjectIds: prev.subjectIds.filter((id) => id !== subjectId),
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

            <div className="grid gap-2">
              <Label>Designation(s) *</Label>
              <Popover open={designationOpen} onOpenChange={setDesignationOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={designationOpen}
                    className={`w-full justify-between ${designationError ? 'border-red-500' : ''}`}
                  >
                    <span className="text-muted-foreground">
                      {formData.designations.length > 0
                        ? `${formData.designations.length} selected`
                        : "Select designations"}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-100 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search departments..." />
                    <CommandList className="max-h-75 overflow-y-auto">
                      <CommandEmpty>No designation found.</CommandEmpty>
                      <CommandGroup>
                        {DESIGNATIONS.map((designation) => (
                          <CommandItem
                            key={designation}
                            onSelect={() => {
                              handleDesignationToggle(designation)
                            }}
                          >
                            <Checkbox
                              checked={formData.designations.includes(designation)}
                              className="mr-2"
                            />
                            {designation}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              
              {formData.designations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.designations.map((designation) => (
                    <Badge key={designation} variant="secondary" className="pl-2 pr-1">
                      {designation}
                      <button
                        type="button"
                        onClick={() => removeDesignation(designation)}
                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              {designationError && (
                <p className="text-xs text-red-500">
                  Please select at least one designation
                </p>
              )}
            </div>

            {formData.departmentId && filteredSubjects.length > 0 && (
              <div className="grid gap-2">
                <Label>Subjects Assigned</Label>
                <Popover open={subjectOpen} onOpenChange={setSubjectOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={subjectOpen}
                      className="w-full justify-between"
                    >
                      <span className="text-muted-foreground">
                        {formData.subjectIds.length > 0
                          ? `${formData.subjectIds.length} selected`
                          : "Select subjects"}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-100 p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search subjects..." />
                      <CommandList className="max-h-75 overflow-y-auto">
                        <CommandEmpty>No subject found.</CommandEmpty>
                        <CommandGroup>
                          {filteredSubjects.map((subject) => (
                            <CommandItem
                              key={subject.id}
                              onSelect={() => {
                                handleSubjectToggle(subject.id)
                              }}
                            >
                              <Checkbox
                                checked={formData.subjectIds.includes(subject.id)}
                                className="mr-2"
                              />
                              {subject.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                
                {formData.subjectIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.subjectIds.map((subjectId) => {
                      const subject = filteredSubjects.find(s => s.id === subjectId)
                      return subject ? (
                        <Badge key={subjectId} variant="secondary" className="pl-2 pr-1">
                          {subject.name}
                          <button
                            type="button"
                            onClick={() => removeSubject(subjectId)}
                            className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}
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
            <Button type="submit" disabled={loading || formData.designations.length === 0}>
              {loading ? "Saving..." : faculty ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
