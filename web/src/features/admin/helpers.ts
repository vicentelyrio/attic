import type { AccountStatus, Role } from '@domain'

export const statusColor: Record<AccountStatus, string> = {
  pending: 'orange',
  active: 'green',
  disabled: 'dark',
}

export const roleColor: Record<Role, string> = {
  owner: 'indigo',
  admin: 'violet',
  user: 'gray',
}
