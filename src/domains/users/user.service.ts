import { hmacSign, hmacVerify } from '@/core/signing'
import type { Role } from '@/domains/admin/auth'
import type { UserRepository } from './user.repository'

export class UserServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserServiceError'
  }
}

export function createUserService(repository: UserRepository) {
  return {
    listUsers: () => repository.findAll(),

    findByUsername: (username: string) => repository.findByUsername(username),

    verifyPassword: (password: string, hash: string) => hmacVerify(password, hash),

    async verifyCredentials(username: string, password: string): Promise<{ role: Role } | null> {
      const user = await repository.findByUsername(username)
      if (!user) return null
      const valid = await hmacVerify(password, user.password)
      return valid ? { role: user.role } : null
    },

    async createUser(data: { username: string; password: string; role: Role }): Promise<void> {
      const existing = await repository.findByUsername(data.username)
      if (existing) throw new UserServiceError('Username already taken')
      const password = await hmacSign(data.password)
      await repository.create({ ...data, password })
    },

    async updateUser(id: string, data: { username: string; role: Role }): Promise<void> {
      const existing = await repository.findByUsername(data.username)
      if (existing && existing.id !== id) throw new UserServiceError('Username already taken')
      await repository.update(id, data)
    },

    async deleteUser(id: string): Promise<void> {
      const user = await repository.findById(id)
      if (!user || user.deletedAt) throw new UserServiceError('User not found')
      if (user.role === 'admin') {
        const count = await repository.countActiveAdmins()
        if (count <= 1) throw new UserServiceError('Cannot delete the last admin')
      }
      await repository.softDelete(id)
    },

    async changePassword(id: string, password: string): Promise<void> {
      const hashed = await hmacSign(password)
      await repository.updatePassword(id, hashed)
    },
  }
}

export type UserService = ReturnType<typeof createUserService>
