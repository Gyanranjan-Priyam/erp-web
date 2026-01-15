// Type extensions for Better Auth
export type UserRole = "ADMIN" | "STUDENT" | "TEACHER"

export type UserWithRole = {
  id: string
  email: string
  name: string
  role: UserRole
  [key: string]: any
}

export {}
