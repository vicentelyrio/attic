import { createFileRoute } from '@tanstack/react-router'
import { Breadcrumbs } from '@components'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div>
      <Breadcrumbs />
      <h3>Welcome Home!</h3>
    </div>
  )
}
