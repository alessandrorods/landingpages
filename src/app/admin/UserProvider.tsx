'use client'

import { createContext, useContext } from 'react'
import type { Role } from '@/domains/admin/auth'
import type { Permission } from '@/domains/admin/permissions'
import { can } from '@/domains/admin/permissions'

interface User {
  role: Role
  can: (permission: Permission) => boolean
}

const UserContext = createContext<User | null>(null)

export function UserProvider({ role, children }: { role: Role; children: React.ReactNode }) {
  const user: User = {
    role,
    can: (permission) => can(role, permission),
  }

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

export function useUser(): User {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within <UserProvider>')
  return ctx
}
