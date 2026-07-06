export type Role = 'owner' | 'admin' | 'user'

export type AccountStatus = 'pending' | 'active' | 'disabled'

export interface User {
  id: string
  username: string
  role: Role
  status: AccountStatus
  created_at: number
  updated_at: number
}

export const isAdmin = (user: User | undefined): boolean =>
  user?.role === 'owner' || user?.role === 'admin'
