import { createFileRoute, redirect } from '@tanstack/react-router'
import { fetchRoots } from '@domain'

export const Route = createFileRoute('/')({
  loader: async () => {
    const roots = await fetchRoots()
    throw redirect({ to: '/$root/$', params: { root: roots[0].name, _splat: '' } })
  },
})
