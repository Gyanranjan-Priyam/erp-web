"use client"

import React, { useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Upload, X, Pencil, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface BulkSubject {
  name: string
  code: string
  category: string
  year: string
  semester: string
  isEditing?: boolean
}

const AddSubjectPage = () => {
  const params = useParams()
  const router = useRouter()
  const departmentCode = params.departmentId as string

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "",
    year: "",
    semester: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
  const [bulkSubjects, setBulkSubjects] = useState<BulkSubject[]>([])
  const [bulkUploading, setBulkUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error("Subject name is required")
      return
    }

    if (!formData.code.trim()) {
      toast.error("Subject code is required")
      return
    }

    if (!formData.category.trim()) {
      toast.error("Category is required")
      return
    }

    if (!formData.year) {
      toast.error("Year is required")
      return
    }

    if (!formData.semester) {
      toast.error("Semester is required")
      return
    }

    try {
      setSubmitting(true)
      
      // First, get department ID by code
      const deptResponse = await fetch(`/api/departments/by-code/${departmentCode}`)
      if (!deptResponse.ok) {
        throw new Error("Department not found")
      }
      const department = await deptResponse.json()

      // Create subject
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          category: formData.category.trim(),
          semester: parseInt(formData.semester),
          departmentId: department.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create subject")
      }

      toast.success("Subject created successfully")
      router.push(`/admin/departments/${departmentCode}`)
    } catch (error: any) {
      console.error("Error creating subject:", error)
      toast.error(error.message || "Failed to create subject")
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      // Clear the input even if no file selected
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    
    if (fileExtension === 'csv') {
      parseCSV(file)
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      parseExcel(file)
    } else {
      toast.error("Please upload a CSV or Excel file")
    }

    // Clear the input to allow re-selecting the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const parseCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        toast.error("CSV file is empty or invalid")
        return
      }

      // Skip header row
      const dataLines = lines.slice(1)
      const subjects: BulkSubject[] = []

      dataLines.forEach((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        
        if (values.length >= 5) {
          subjects.push({
            name: values[0] || '',
            code: values[1]?.toUpperCase() || '',
            category: values[2]?.toLowerCase() || '',
            year: values[3] || '',
            semester: values[4] || '',
          })
        }
      })

      if (subjects.length === 0) {
        toast.error("No valid data found in CSV")
        return
      }

      setBulkSubjects(subjects)
      setIsBulkDialogOpen(true)
      toast.success(`${subjects.length} subjects loaded from CSV`)
    }

    reader.onerror = () => {
      toast.error("Failed to read CSV file")
    }

    reader.readAsText(file)
  }

  const parseExcel = async (file: File) => {
    try {
      const XLSX = await import('xlsx')
      const reader = new FileReader()

      reader.onload = (e) => {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

        if (jsonData.length < 2) {
          toast.error("Excel file is empty or invalid")
          return
        }

        // Skip header row
        const dataRows = jsonData.slice(1)
        const subjects: BulkSubject[] = []

        dataRows.forEach((row) => {
          if (row.length >= 5 && row[0]) {
            subjects.push({
              name: String(row[0] || '').trim(),
              code: String(row[1] || '').trim().toUpperCase(),
              category: String(row[2] || '').trim().toLowerCase(),
              year: String(row[3] || '').trim(),
              semester: String(row[4] || '').trim(),
            })
          }
        })

        if (subjects.length === 0) {
          toast.error("No valid data found in Excel file")
          return
        }

        setBulkSubjects(subjects)
        setIsBulkDialogOpen(true)
        toast.success(`${subjects.length} subjects loaded from Excel`)
      }

      reader.onerror = () => {
        toast.error("Failed to read Excel file")
      }

      reader.readAsArrayBuffer(file)
    } catch (error) {
      toast.error("Failed to parse Excel file. Make sure xlsx package is installed.")
    }
  }

  const handleBulkUpload = async () => {
    // Validate all subjects
    const allowedCategories = ["core", "elective", "practical", "project", "lab"]
    const invalidSubjects = bulkSubjects.filter(
      s => !s.name || !s.code || !s.category || !s.year || !s.semester
    )
    const invalidCategories = bulkSubjects.filter(
      s => s.category && !allowedCategories.includes(s.category.toLowerCase())
    )

    if (invalidSubjects.length > 0) {
      toast.error(`${invalidSubjects.length} subject(s) have missing required fields`)
      return
    }

    if (invalidCategories.length > 0) {
      toast.error(`${invalidCategories.length} subject(s) have invalid category values. Allowed: core, elective, practical, project, lab`)
      return
    }

    try {
      setBulkUploading(true)

      // Get department ID
      const deptResponse = await fetch(`/api/departments/by-code/${departmentCode}`)
      if (!deptResponse.ok) {
        throw new Error("Department not found")
      }
      const department = await deptResponse.json()

      // Upload all subjects
      const promises = bulkSubjects.map(subject =>
        fetch("/api/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: subject.name.trim(),
            code: subject.code.trim().toUpperCase(),
            category: subject.category.trim(),
            semester: parseInt(subject.semester),
            departmentId: department.id,
          }),
        }).then(res => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`)
          }
          return res
        })
      )

      const results = await Promise.allSettled(promises)
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      if (failed > 0) {
        toast.warning(`${successful} subjects uploaded, ${failed} failed`)
      } else {
        toast.success(`All ${successful} subjects uploaded successfully`)
      }

      setIsBulkDialogOpen(false)
      setBulkSubjects([])
      router.push(`/admin/departments/${departmentCode}`)
    } catch (error: any) {
      console.error("Error uploading subjects:", error)
      toast.error(error.message || "Failed to upload subjects")
    } finally {
      setBulkUploading(false)
    }
  }

  const updateBulkSubject = (index: number, field: keyof BulkSubject, value: string) => {
    const updated = [...bulkSubjects]
    updated[index] = { ...updated[index], [field]: value }
    setBulkSubjects(updated)
  }

  const removeBulkSubject = (index: number) => {
    setBulkSubjects(bulkSubjects.filter((_, i) => i !== index))
  }

  const toggleEdit = (index: number) => {
    const updated = [...bulkSubjects]
    updated[index] = { ...updated[index], isEditing: !updated[index].isEditing }
    setBulkSubjects(updated)
  }

  const downloadTemplate = () => {
    const csvContent = "Subject Name,Subject Code,Category,Year,Semester\nData Structures,CS201,core,2,3\nAlgorithms,CS202,core,2,4"
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subjects_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto py-4 px-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/admin/departments/${departmentCode}`)}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            Add New Subject
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Create a new subject for this department
          </p>
        </div>
        <Button 
          variant="outline"
          className="hidden sm:flex"
          onClick={() => {
            fileInputRef.current?.click()
          }}
        >
          <Upload className="mr-2 h-4 w-4" />
          Bulk Upload
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Subject Information</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Fill in the details for the new subject
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">
                  Subject Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Data Structures and Algorithms"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm">
                  Subject Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  placeholder="e.g., CS201"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  className="text-sm"
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger id="category" className="text-sm">
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

              <div className="space-y-2">
                <Label htmlFor="year" className="text-sm">
                  Year <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.year}
                  onValueChange={(value) => {
                    setFormData({ ...formData, year: value, semester: "" })
                  }}
                >
                  <SelectTrigger id="year" className="text-sm">
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

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="semester" className="text-sm">
                  Semester <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.semester}
                  onValueChange={(value) =>
                    setFormData({ ...formData, semester: value })
                  }
                  disabled={!formData.year}
                >
                  <SelectTrigger id="semester" className="text-sm">
                    <SelectValue placeholder={formData.year ? "Select semester" : "Please select year first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.year && (
                      <>
                        <SelectItem value={((parseInt(formData.year) - 1) * 2 + 1).toString()}>
                          Semester {(parseInt(formData.year) - 1) * 2 + 1}
                        </SelectItem>
                        <SelectItem value={((parseInt(formData.year) - 1) * 2 + 2).toString()}>
                          Semester {(parseInt(formData.year) - 1) * 2 + 2}
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mobile Bulk Upload Button */}
            <Button 
              type="button"
              variant="outline"
              className="w-full sm:hidden"
              onClick={() => {
                fileInputRef.current?.click()
              }}
            >
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/admin/departments/${departmentCode}`)}
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                {submitting ? "Creating..." : "Create Subject"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Bulk Upload Format Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Bulk Upload Format Reference</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Use this format for your CSV or Excel file. You can also{" "}
            <button
              onClick={downloadTemplate}
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              download a template
            </button>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Subject Name</TableHead>
                  <TableHead className="font-semibold">Subject Code</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Year</TableHead>
                  <TableHead className="font-semibold">Semester</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-xs sm:text-sm">Data Structures and Algorithms</TableCell>
                  <TableCell className="text-xs sm:text-sm font-mono">CS201</TableCell>
                  <TableCell className="text-xs sm:text-sm">core</TableCell>
                  <TableCell className="text-xs sm:text-sm">2</TableCell>
                  <TableCell className="text-xs sm:text-sm">3</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs sm:text-sm">Database Management Systems</TableCell>
                  <TableCell className="text-xs sm:text-sm font-mono">CS202</TableCell>
                  <TableCell className="text-xs sm:text-sm">core</TableCell>
                  <TableCell className="text-xs sm:text-sm">2</TableCell>
                  <TableCell className="text-xs sm:text-sm">4</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs sm:text-sm">Machine Learning</TableCell>
                  <TableCell className="text-xs sm:text-sm font-mono">CS301</TableCell>
                  <TableCell className="text-xs sm:text-sm">elective</TableCell>
                  <TableCell className="text-xs sm:text-sm">3</TableCell>
                  <TableCell className="text-xs sm:text-sm">5</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs sm:text-sm">Web Development Lab</TableCell>
                  <TableCell className="text-xs sm:text-sm font-mono">CS302L</TableCell>
                  <TableCell className="text-xs sm:text-sm">lab</TableCell>
                  <TableCell className="text-xs sm:text-sm">3</TableCell>
                  <TableCell className="text-xs sm:text-sm">6</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 space-y-2 text-xs sm:text-sm text-muted-foreground">
            <p className="font-medium">Important Notes:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>First row must contain column headers (as shown above)</li>
              <li>Category options: core, elective, practical, project, lab</li>
              <li>Year must be between 1-4</li>
              <li>Semester must be between 1-8</li>
              <li>All fields are required</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Upload Dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Bulk Upload Subjects</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Review and edit the subjects before uploading. {bulkSubjects.length} subject(s) loaded.
              <Button 
                variant="link" 
                size="sm" 
                onClick={downloadTemplate}
                className="ml-2 h-auto p-0"
              >
                Download Template
              </Button>
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Subject Name</TableHead>
                  <TableHead className="min-w-[100px]">Code</TableHead>
                  <TableHead className="min-w-[120px]">Category</TableHead>
                  <TableHead className="min-w-[80px]">Year</TableHead>
                  <TableHead className="min-w-[100px]">Semester</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bulkSubjects.map((subject, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {subject.isEditing ? (
                        <Input
                          value={subject.name}
                          onChange={(e) => updateBulkSubject(index, 'name', e.target.value)}
                          className="h-8 text-sm"
                        />
                      ) : (
                        <span className="text-sm">{subject.name}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {subject.isEditing ? (
                        <Input
                          value={subject.code}
                          onChange={(e) => updateBulkSubject(index, 'code', e.target.value.toUpperCase())}
                          className="h-8 text-sm"
                        />
                      ) : (
                        <span className="text-sm font-mono">{subject.code}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {subject.isEditing ? (
                        <Select
                          value={subject.category}
                          onValueChange={(value) => updateBulkSubject(index, 'category', value)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="core">Core</SelectItem>
                            <SelectItem value="elective">Elective</SelectItem>
                            <SelectItem value="practical">Practical</SelectItem>
                            <SelectItem value="project">Project</SelectItem>
                            <SelectItem value="lab">Lab</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm capitalize">{subject.category}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {subject.isEditing ? (
                        <Select
                          value={subject.year}
                          onValueChange={(value) => updateBulkSubject(index, 'year', value)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4].map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm">{subject.year}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {subject.isEditing ? (
                        <Input
                          type="number"
                          value={subject.semester}
                          onChange={(e) => updateBulkSubject(index, 'semester', e.target.value)}
                          className="h-8 text-sm"
                          min="1"
                          max="8"
                        />
                      ) : (
                        <span className="text-sm">{subject.semester}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleEdit(index)}
                        >
                          {subject.isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeBulkSubject(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkDialogOpen(false)
                setBulkSubjects([])
              }}
              disabled={bulkUploading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkUpload}
              disabled={bulkUploading || bulkSubjects.length === 0}
              className="w-full sm:w-auto"
            >
              {bulkUploading ? "Uploading..." : `Upload ${bulkSubjects.length} Subject(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AddSubjectPage
