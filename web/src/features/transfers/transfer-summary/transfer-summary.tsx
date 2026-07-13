import { Box, Loader, Text, ThemeIcon } from '@mantine/core'

import { CheckIcon } from '@phosphor-icons/react'

type TransferSummaryProps = {
  busy: boolean
  title: string
  subtitle: string
  titleSize?: string
}

export function TransferSummary({
  busy,
  title,
  subtitle,
  titleSize = 'sm',
}: TransferSummaryProps) {
  return (
    <>
      {busy ? (
        <Loader color="indigo" size={18} type="oval" />
      ) : (
        <ThemeIcon color="green" radius="xl" size={18} variant="light">
          <CheckIcon size={11} weight="bold" />
        </ThemeIcon>
      )}
      <Box flex={1} miw={0}>
        <Text size={titleSize} fw={600} truncate>
          {title}
        </Text>
        <Text size="xs" c="dimmed" ff="monospace" truncate>
          {subtitle}
        </Text>
      </Box>
    </>
  )
}
