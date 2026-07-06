import { createFileRoute, redirect } from '@tanstack/react-router'

import { fetchMe } from '@domain'

import { LoginForm } from '@features'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const me = await fetchMe().catch(() => null)
    if (me) throw redirect({ to: '/' })
  },
  component: LoginForm,
})
