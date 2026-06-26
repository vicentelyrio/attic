import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'

import '@mantine/core/styles.css'
import './styles.css'

const queryClient = new QueryClient()

// biome-ignore lint/style/noNonNullAssertion: #root is guaranteed by index.html
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider defaultColorScheme="dark">
        <App />
      </MantineProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
