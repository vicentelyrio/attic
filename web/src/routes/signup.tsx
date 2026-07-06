import { createFileRoute, redirect } from '@tanstack/react-router'

import { fetchMe } from '@domain'

import { SignupForm } from '@features'

export const Route = createFileRoute('/signup')({
  beforeLoad: async () => {
    const me = await fetchMe().catch(() => null)
    if (me) throw redirect({ to: '/' })
  },
  component: SignupForm,
})
