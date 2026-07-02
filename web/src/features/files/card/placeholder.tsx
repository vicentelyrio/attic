import { fileKind } from '@infrastructure'

import { Center, Text, ThemeIcon } from '@mantine/core'

import { PlayIcon } from '@phosphor-icons/react'

import type { Entry } from '@domain'

import classes from './card.module.css'

export function FilePlaceholder({ entry }: { entry: Entry }) {
  const { category, color } = fileKind(entry.name)

  return (
    <Center
      className={classes.preview}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 9%, var(--mantine-color-dark-7))`,
      }}
    >
      {category === 'video' ? (
        <ThemeIcon variant="default" radius="xl" size={44}>
          <PlayIcon weight="fill" size={18} />
        </ThemeIcon>
      ) : (
        <Text className={classes.category} c={color}>
          {category}
        </Text>
      )}
    </Center>
  )
}
