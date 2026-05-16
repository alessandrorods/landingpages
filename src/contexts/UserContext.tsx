'use client'

import { createContext, useContext } from 'react'
import type { Role } from '@/domains/admin/auth'
import type { Permission } from '@/domains/admin/permissions'
import { can } from '@/domains/admin/permissions'

interface User {
  role: Role
  displayName: string
  can: (permission: Permission) => boolean
}

const UserContext = createContext<User | null>(null)

export function UserProvider({
  role,
  displayName,
  children,
}: {
  role: Role
  displayName: string
  children: React.ReactNode
}) {
  const user: User = { role, displayName, can: (permission) => can(role, permission) }
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

export function useUser(): User | null {
  return useContext(UserContext)
}
