import { useState } from 'react'

import { HttpError, type User, useAdminUsers, useMe } from '@domain'

export function useAccounts() {
  const { users, approve, disable, remove, resetPassword } = useAdminUsers()
  const { data: me } = useMe()

  const [resetTarget, setResetTarget] = useState<User | null>(null)
  const [removeTarget, setRemoveTarget] = useState<User | null>(null)

  const list = users.data ?? []
  const pending = list.filter((u) => u.status === 'pending')
  const members = list.filter((u) => u.status !== 'pending')

  const actionError = [approve.error, disable.error, remove.error].find(Boolean)
  const errorText =
    actionError instanceof HttpError ? actionError.message : null

  const submitReset = async (password: string) => {
    if (!resetTarget) return
    await resetPassword.mutateAsync({ id: resetTarget.id, password })
    setResetTarget(null)
  }

  const confirmRemove = async () => {
    if (!removeTarget) return
    await remove.mutateAsync(removeTarget.id).catch(() => {})
    setRemoveTarget(null)
  }

  return {
    me,
    approve,
    disable,
    pending,
    members,
    errorText,
    resetTarget,
    removeTarget,
    openReset: setResetTarget,
    openRemove: setRemoveTarget,
    closeReset: () => setResetTarget(null),
    closeRemove: () => setRemoveTarget(null),
    submitReset,
    confirmRemove,
    removePending: remove.isPending,
  }
}

export type AccountsState = ReturnType<typeof useAccounts>
