import { useState } from 'react'

import { useDebouncedValue } from '@mantine/hooks'

export function useSearchQuery() {
  const [query, setQuery] = useState('')
  const [debounced] = useDebouncedValue(query, 180)

  const isCommand = query.trimStart().startsWith('/')
  const term = isCommand ? query.trimStart().slice(1).trim().toLowerCase() : ''

  return { query, setQuery, debounced, isCommand, term }
}
