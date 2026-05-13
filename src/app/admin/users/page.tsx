'use client'
import { useState } from 'react'
import type { Role } from '@/domains/admin/auth'
import { useUsers } from './useUsers'
import type { UserDTO } from './useUsers'
import UserTable from './components/UserTable'
import UserFormModal from './components/UserFormModal'
import DeleteModal from './components/DeleteModal'
import PasswordModal from './components/PasswordModal'

export default function UsersPage() {
  const { users, loading, error, createUser, updateUser, removeUser, changePassword } = useUsers()

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<UserDTO | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserDTO | null>(null)
  const [passwordTarget, setPasswordTarget] = useState<UserDTO | null>(null)

  function openCreate() {
    setEditTarget(null)
    setFormOpen(true)
  }

  function openEdit(user: UserDTO) {
    setEditTarget(user)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditTarget(null)
  }

  async function handleSave(data: { username: string; password: string; role: Role }) {
    if (editTarget) {
      await updateUser(editTarget.id, { username: data.username, role: data.role })
    } else {
      await createUser(data)
    }
  }

  return (
    <div className='max-w-2xl mx-auto'>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Usuários</h1>
        <button
          onClick={openCreate}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          + Novo usuário
        </button>
      </div>

      <UserTable
        users={users}
        loading={loading}
        error={error}
        onEdit={openEdit}
        onPassword={setPasswordTarget}
        onDelete={setDeleteTarget}
      />

      {formOpen && (
        <UserFormModal
          user={editTarget}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          user={deleteTarget}
          onConfirm={() => removeUser(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {passwordTarget && (
        <PasswordModal
          user={passwordTarget}
          onSave={(password) => changePassword(passwordTarget.id, password)}
          onClose={() => setPasswordTarget(null)}
        />
      )}
    </div>
  )
}
