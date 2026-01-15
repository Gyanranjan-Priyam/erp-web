"use client"

import { useSession as useBetterSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function useAuth() {
  const { data: session, isPending } = useBetterSession()
  
  return {
    user: session?.user,
    session,
    isLoading: isPending,
    isAuthenticated: !!session
  }
}

export function useRequireAuth(redirectTo: string = "/login") {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])
  
  return { isAuthenticated, isLoading }
}

export function useRequireRole(allowedRoles: string | string[], redirectTo: string = "/") {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!isLoading && user) {
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
      if (!roles.includes(user.role as string)) {
        router.push(redirectTo)
      }
    }
  }, [user, isLoading, router, allowedRoles, redirectTo])
  
  return { user, isLoading }
}
