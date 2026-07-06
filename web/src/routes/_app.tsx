import { createFileRoute, redirect } from '@tanstack/react-router'

import { fetchMe } from '@domain'

import { AppTemplate } from '@templates/app-template'

export const Route = createFileRoute('/_app')({
  beforeLoad: async () => {
    const me = await fetchMe().catch(() => null)
    if (!me) throw redirect({ to: '/login' })
  },
  component: AppTemplate,
})
