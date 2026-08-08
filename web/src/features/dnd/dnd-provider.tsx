import { type ReactNode, useState } from 'react'

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { useI18nContext } from '@i18n'
import { SHORTCUTS } from '@infrastructure/shortcuts'
import { useQueryClient } from '@tanstack/react-query'

import { Badge, Button, Group, Paper, Text } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'

import { type Job, type JobView, usePaste, useUndoMove } from '@domain'

import { EntryIcon } from '@features'

import { collisionDetection } from './collision'
import { ConfirmMoveDialog, type PendingMove } from './confirm-move-dialog'
import classes from './dnd-provider.module.css'
import { DragPayloadContext } from './drag-context'
import { basename, canAcceptItem, folderLabel } from './helpers'
import type { DragPayload, DropPayload } from './types'
import { useDndConfirmPreference } from './use-dnd-preference'
import { waitForJob } from './wait-for-job'

export function EntryDndProvider({ children }: { children: ReactNode }) {
  const { LL } = useI18nContext()
  const qc = useQueryClient()
  const [drag, setDrag] = useState<DragPayload | null>(null)
  const [pending, setPending] = useState<PendingMove | null>(null)
  const [lastMove, setLastMove] = useState<Job[] | null>(null)
  const [confirmMoves, setConfirmMoves] = useDndConfirmPreference()
  const pasteMut = usePaste()
  const undoMove = useUndoMove()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const runUndo = (jobs: Job[]) => {
    for (const job of jobs) undoMove(job)
    setLastMove((current) => (current === jobs ? null : current))
  }

  useHotkeys([
    [
      SHORTCUTS.undo.hotkey,
      (e) => {
        if (!lastMove) return
        e.preventDefault()
        runUndo(lastMove)
      },
      { preventDefault: false },
    ],
  ])

  const commit = async (payload: DragPayload, target: DropPayload) => {
    const jobs: JobView[] = []
    for (const item of payload.items) {
      jobs.push(
        await pasteMut.mutateAsync({
          op: 'move',
          src_root: item.root,
          src_path: item.path,
          dst_root: target.root,
          dst_dir: target.dir,
        }),
      )
    }

    const statuses = await Promise.all(jobs.map((j) => waitForJob(qc, j.id)))
    const succeeded = jobs.filter((_, i) => statuses[i] === 'done')
    const failed = jobs.length - succeeded.length

    if (succeeded.length > 0) {
      setLastMove(succeeded)
      const to = folderLabel(target.root, target.dir)
      const message =
        succeeded.length === 1
          ? LL.files.dnd.movedOne({ name: basename(succeeded[0].src_path), to })
          : LL.files.dnd.movedMany({ count: succeeded.length, to })

      notifications.show({
        color: 'indigo',
        autoClose: 8000,
        message: (
          <Group gap="sm" wrap="nowrap" justify="space-between">
            <Text size="sm">{message}</Text>
            <Button
              size="xs"
              variant="subtle"
              onClick={() => runUndo(succeeded)}
            >
              {LL.files.dnd.undo()}
            </Button>
          </Group>
        ),
      })
    }

    if (failed > 0) {
      notifications.show({
        color: 'red',
        message: LL.files.dnd.moveFailed({ count: failed }),
      })
    }
  }

  const onDragStart = (event: DragStartEvent) => {
    setDrag((event.active.data.current as DragPayload | undefined) ?? null)
  }

  const onDragEnd = (event: DragEndEvent) => {
    setDrag(null)
    const { over } = event
    if (!over || !drag) return

    const target = over.data.current as DropPayload | undefined
    if (!target) return

    const items = drag.items.filter((item) => canAcceptItem(item, target))
    if (items.length === 0) return

    if (confirmMoves) setPending({ items, target })
    else void commit({ items }, target)
  }

  const first = drag?.items[0]
  const extra = (drag?.items.length ?? 0) - 1

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDrag(null)}
    >
      <DragPayloadContext.Provider value={drag}>
        {children}
      </DragPayloadContext.Provider>
      <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
        {first && (
          <Paper className={classes.overlay} withBorder radius="md" p="xs">
            <Group gap="xs" wrap="nowrap">
              <EntryIcon name={first.name} isDir={first.isDir} size={18} />
              <Text size="sm" fw={500} truncate>
                {first.name}
              </Text>
              {extra > 0 && (
                <Badge size="sm" variant="filled" color="indigo" radius="xl">
                  +{extra}
                </Badge>
              )}
            </Group>
          </Paper>
        )}
      </DragOverlay>

      <ConfirmMoveDialog
        pending={pending}
        moving={pasteMut.isPending}
        confirmMoves={confirmMoves}
        onConfirmMovesChange={setConfirmMoves}
        onConfirm={() => {
          if (!pending) return
          const { items, target } = pending
          setPending(null)
          void commit({ items }, target)
        }}
        onClose={() => setPending(null)}
      />
    </DndContext>
  )
}
