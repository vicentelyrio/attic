import { StrictMode } from 'react'

import { createRoot } from 'react-dom/client'

import { shikiAdapter } from '@infrastructure'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'

import { CodeHighlightAdapterProvider } from '@mantine/code-highlight'
import { MantineProvider } from '@mantine/core'

import { theme } from '@theme'

import '@mantine/core/styles.css'
// ‼️ code-highlight styles must come after core styles
import '@mantine/code-highlight/styles.css'
import { routeTree } from './routeTree.gen'

const router = createRouter({ routeTree })
const queryClient = new QueryClient()

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
