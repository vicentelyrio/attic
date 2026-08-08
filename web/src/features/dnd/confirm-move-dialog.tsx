import { useI18nContext } from '@i18n'

import { Button, Checkbox, Group, Modal, Stack, Text } from '@mantine/core'

import { folderLabel, parentDir } from './helpers'
import type { DragItem, DropPayload } from './types'

export type PendingMove = {
  items: DragItem[]
  target: DropPayload
}

export type ConfirmMoveDialogProps = {
  pending: PendingMove | null
  moving?: boolean
  confirmMoves: boolean
  onConfirmMovesChange: (value: boolean) => void
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmMoveDialog({
  pending,
  moving,
  confirmMoves,
  onConfirmMovesChange,
  onConfirm,
  onClose,
}: ConfirmMoveDialogProps) {
  const { LL } = useI18nContext()
  const count = pending?.items.length ?? 0
  const first = pending?.items[0]

  const from = first ? folderLabel(first.root, parentDir(first.path)) : ''
  const to = pending ? folderLabel(pending.target.root, pending.target.dir) : ''

  return (
    <Modal
      opened={!!pending}
      onClose={onClose}
      title={LL.files.dnd.confirmTitle()}
      size="sm"
      centered
    >
      <Stack gap="lg">
        <Text size="sm">
          {count === 1 && first
            ? LL.files.dnd.moveOne({ name: first.name, from, to })
            : LL.files.dnd.moveMany({ count, from, to })}
        </Text>
        <Checkbox
          size="sm"
          label={LL.files.dnd.dontAskAgain()}
          checked={!confirmMoves}
          onChange={(e) => onConfirmMovesChange(!e.currentTarget.checked)}
        />
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose}>
            {LL.common.cancel()}
          </Button>
          <Button loading={moving} onClick={onConfirm}>
            {LL.files.dnd.move()}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
