import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  approveUser,
  deleteUser,
  disableUser,
  listUsers,
  resetUserPassword,
} from '@domain'

export function useAdminUsers() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'users'] })

  const users = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => listUsers(),
  })

  const approve = useMutation({
    mutationFn: (id: string) => approveUser(id),
    onSuccess: invalidate,
  })

  const disable = useMutation({
    mutationFn: (id: string) => disableUser(id),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: invalidate,
  })

  const resetPassword = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      resetUserPassword(id, password),
  })

  return { users, approve, disable, remove, resetPassword }
}
