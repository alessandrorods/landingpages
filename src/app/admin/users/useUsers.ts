'use client'
import { useState, useEffect } from 'react'
import type { Role } from '@/domains/admin/auth'

export interface UserDTO {
  id: string
  username: string
  role: Role
  createdAt: string
  deletedAt: string | null
}

export function useUsers() {
  const [users, setUsers] = useState<UserDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao carregar'); return }
      setUsers(data.users)
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function createUser(data: { username: string; password: string; role: Role }) {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Erro ao criar usuário')
    await load()
  }

  async function updateUser(id: string, data: { username: string; role: Role }) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Erro ao atualizar usuário')
    await load()
  }

  async function removeUser(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Erro ao remover usuário')
    await load()
  }

  async function changePassword(id: string, password: string) {
    const res = await fetch(`/api/admin/users/${id}/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Erro ao alterar senha')
  }

  return { users, loading, error, createUser, updateUser, removeUser, changePassword }
}
