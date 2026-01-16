export interface Faculty {
  id: string
  userId: string
  facultyId: string
  name: string
  phone: string | null
  departmentId: string
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
