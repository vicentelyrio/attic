import { StrictMode } from 'react'

import { createRoot } from 'react-dom/client'

import { shikiAdapter } from '@infrastructure'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'

import { CodeHighlightAdapterProvider } from '@mantine/code-highlight'
import { MantineProvider } from '@mantine/core'

import { HttpError } from '@domain'
import { theme } from '@theme'

import '@mantine/core/styles.css'
// ‼️ code-highlight and spotlight styles must come after core styles
import '@mantine/code-highlight/styles.css'
import '@mantine/spotlight/styles.css'
import { routeTree } from './routeTree.gen'

const router = createRouter({ routeTree })

// When any query 401s (e.g. the session expired mid-use), bounce to the login
// page — unless we're already on a public auth page.
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof HttpError && error.status === 401) {
        const { pathname } = window.location
        if (pathname !== '/login' && pathname !== '/signup') {
          router.navigate({ to: '/login' })
        }
      }
    },
  }),
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// biome-ignore lint/style/noNonNullAssertion: #root is guaranteed by index.html
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider defaultColorScheme="dark" theme={theme}>
        <CodeHighlightAdapterProvider adapter={shikiAdapter}>
          <RouterProvider router={router} />
        </CodeHighlightAdapterProvider>
      </MantineProvider>
    </QueryClientProvider>
  </StrictMode>,
)
