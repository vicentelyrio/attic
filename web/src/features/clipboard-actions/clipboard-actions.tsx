import { Button, Group } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { ClipboardIcon, CopyIcon, ScissorsIcon } from '@phosphor-icons/react'
import { type ClipboardRef, useClipboard, usePaste } from '@domain'

export type ClipboardActionsProps = {
  root: string
  path: string
  /** Names of the currently selected entries in this directory. */
  selected: string[]
}

/** Copy/Cut/Paste controls for the header, plus the matching keyboard
 *  shortcuts. Copy/Cut stash refs on the (persisted) clipboard; Paste queues a
 *  server job per ref targeting the current directory. */
export function ClipboardActions({
  root,
  path,
  selected,
}: ClipboardActionsProps) {
  const { clipboard, copy, cut, clear } = useClipboard()
  const pasteJob = usePaste()

  const refs = (): ClipboardRef[] =>
    selected.map((name) => ({ root, path: path ? `${path}/${name}` : name }))

  const doCopy = () => {
    if (selected.length) copy(refs())
  }
  const doCut = () => {
    if (selected.length) cut(refs())
  }
  const doPaste = async () => {
    if (!clipboard || clipboard.items.length === 0) return
    const op = clipboard.op === 'cut' ? 'move' : 'copy'
    for (const item of clipboard.items) {
      await pasteJob.mutateAsync({
        op,
        src_root: item.root,
        src_path: item.path,
        dst_root: root,
        dst_dir: path,
      })
    }
    // A cut is consumed by pasting; a copy stays for repeat pastes.
    if (clipboard.op === 'cut') clear()
  }

  useHotkeys([
    ['mod+C', doCopy],
    ['mod+X', doCut],
    ['mod+V', doPaste],
  ])

  const hasSelection = selected.length > 0
  const hasClipboard = !!clipboard && clipboard.items.length > 0

  return (
    <Group gap="xs">
      <Button
        size="xs"
        variant="default"
        leftSection={<CopyIcon />}
        disabled={!hasSelection}
        onClick={doCopy}
      >
        Copy
      </Button>
      <Button
        size="xs"
        variant="default"
        leftSection={<ScissorsIcon />}
        disabled={!hasSelection}
        onClick={doCut}
      >
        Cut
      </Button>
      <Button
        size="xs"
        variant="default"
        leftSection={<ClipboardIcon />}
        disabled={!hasClipboard}
        loading={pasteJob.isPending}
        onClick={doPaste}
      >
        Paste
      </Button>
    </Group>
  )
}
