import { fetchRoots } from '@domain'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  loader: async () => {
    const roots = await fetchRoots()
    throw redirect({
      to: '/$root/$',
      params: { root: roots[0].name, _splat: '' },
    })
  },
})
