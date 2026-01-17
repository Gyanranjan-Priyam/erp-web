export interface Faculty {
  id: string
  userId: string
  facultyId: string
  name: string
  phone: string | null
  departmentId: string
  designations: string[]
  createdAt: string
  user: {
    email: string
    isActive: boolean
    createdAt?: string
  }
  department: {
    id: string
    name: string
  }
  subjects: {
    id: string
    subject: {
      id: string
      name: string
      code?: string
      category?: string
      semester?: number
    }
  }[]
}

export interface FacultyFormData {
  facultyId: string
  name: string
  email: string
  phone?: string
  departmentId: string
  subjectIds: string[]
  designations: string[]
}

export interface Department {
  id: string
  name: string
}

export interface Subject {
  id: string
  name: string
  departmentId: string
}

export const DESIGNATIONS = [
  "Asst. Professor",
  "Professor",
  "Associate Professor",
  "Lab Assistant",
  "Prof. In Charge"
] as const

export type Designation = typeof DESIGNATIONS[number]
