import { auth } from "./auth"
import "./auth-types"
import { headers } from "next/headers"

export type UserRole = "ADMIN" | "STUDENT" | "TEACHER"

type UserWithRole = {
  id: string
  email: string
  name: string
  role: UserRole
  [key: string]: any
}

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  
  return session
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

export async function requireAuth() {
  const session = await getSession()
  
  if (!session) {
    throw new Error("Unauthorized")
  }
  
  return session
}

export async function requireRole(role: UserRole | UserRole[]) {
  const session = await requireAuth()
  const userRole = (session.user as unknown as UserWithRole).role
  
  const allowedRoles = Array.isArray(role) ? role : [role]
  
  if (!allowedRoles.includes(userRole)) {
    throw new Error(`Forbidden: Required role ${allowedRoles.join(" or ")}`)
  }
  
  return session
}

export async function isAdmin() {
  const user = await getCurrentUser()
  return (user as unknown as UserWithRole | null)?.role === "ADMIN"
}

export async function isTeacher() {
  const user = await getCurrentUser()
  return (user as unknown as UserWithRole | null)?.role === "TEACHER"
}

export async function isStudent() {
  const user = await getCurrentUser()
  return (user as unknown as UserWithRole | null)?.role === "STUDENT"
}
