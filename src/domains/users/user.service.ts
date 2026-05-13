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
    async createUser(data: { username: string; password: string; role: Role }): Promise<void> {
      const existing = await repository.findByUsername(data.username)
      if (existing) throw new UserServiceError('Username already taken')
      const password = await hmacSign(data.password)
      await repository.create({ ...data, password })
    },

    findByUsername: (username: string) =>
      repository.findByUsername(username),

    verifyPassword: (password: string, hash: string) =>
      hmacVerify(password, hash),

    async verifyCredentials(username: string, password: string): Promise<{ role: Role } | null> {
      const user = await repository.findByUsername(username)
      if (!user) return null
      const valid = await hmacVerify(password, user.password)
      return valid ? { role: user.role } : null
    },
  }
}

export type UserService = ReturnType<typeof createUserService>
