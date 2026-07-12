import { Button, Kbd } from '@mantine/core'

import { PlusIcon } from '@phosphor-icons/react'

export function UploadTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <Button
      fullWidth
      size="md"
      leftSection={<PlusIcon weight="bold" />}
      rightSection={
        <Kbd
          styles={{
            root: {
              border: 'none',
              boxShadow: 'none',
              color: 'var(--mantine-color-white)',
              backgroundColor:
                'color-mix(in srgb, var(--mantine-color-white) 20%, transparent)',
            },
          }}
        >
          ⌘U
        </Kbd>
      }
      onClick={onOpen}
    >
      Upload
    </Button>
  )
}
