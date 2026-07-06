import { createFileRoute, redirect } from '@tanstack/react-router'

import { fetchMe, isAdmin } from '@domain'

import { AccountsPage } from '@features'

export const Route = createFileRoute('/_app/admin')({
  beforeLoad: async () => {
    const me = await fetchMe().catch(() => null)
    if (!me) throw redirect({ to: '/login' })
    if (!isAdmin(me)) throw redirect({ to: '/' })
  },
  component: AccountsPage,
})
