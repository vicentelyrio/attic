import { useI18nContext } from '@i18n'
import { size } from '@infrastructure'

import { ActionIcon, Button, Group, Modal, Stack, Text } from '@mantine/core'

import { MinusIcon } from '@phosphor-icons/react'

import type { UploadsState } from '../helpers'
import { UploadDropzone } from '../upload-dropzone'
import { UploadQueue } from '../upload-queue'
import classes from './upload-modal.module.css'

export function UploadModal({ state }: { state: UploadsState }) {
  const { LL } = useI18nContext()
  const {
    view,
    close,
    minimize,
    location,
    items,
    bytesTotal,
    eta,
    busy,
    doneCount,
    speed,
    cancel,
    cancelAll,
    done,
    inputRef,
    folderRef,
    onInputChange,
    openPicker,
    openFolderPicker,
    dragging,
    onDrop,
    onDragOver,
    onDragLeave,
  } = state

  return (
    <Modal.Root opened={view === 'modal'} onClose={close} size="lg" centered>
      <Modal.Overlay />
      <Modal.Content>
        <Modal.Header>
          <Modal.Title className={classes.title}>
            {LL.uploads.to()}{' '}
            <span className={classes.location}>{location}</span>
          </Modal.Title>
          <Group gap={4} wrap="nowrap">
            <ActionIcon
              variant="subtle"
              color="gray"
              className={classes.iconBtn}
              onClick={minimize}
              aria-label={LL.uploads.minimize()}
            >
              <MinusIcon />
            </ActionIcon>
            <Modal.CloseButton />
          </Group>
        </Modal.Header>

        <Modal.Body>
          <Stack gap="md">
            <UploadDropzone
              dragging={dragging}
              onOpen={openPicker}
              onOpenFolder={openFolderPicker}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
            />

            <input
              ref={inputRef}
              type="file"
              multiple
              hidden
              onChange={onInputChange}
            />

            <input
              ref={folderRef}
              type="file"
              multiple
              hidden
              webkitdirectory=""
              onChange={onInputChange}
            />

            {items.length > 0 && (
              <UploadQueue
                items={items}
                doneCount={doneCount}
                speed={speed}
                onCancel={cancel}
              />
            )}

            <Group justify="space-between" wrap="nowrap">
              <Text size="xs" c="dimmed">
                {items.length > 0 && (
                  <>
                    {LL.common.total()}{' '}
                    <Text span ff="monospace" c="dark.2">
                      {size(bytesTotal)}
                    </Text>
                    {eta && ` · ${eta}`}
                  </>
                )}
              </Text>
              <Group gap="xs" wrap="nowrap">
                {busy && (
                  <Button variant="default" size="xs" onClick={cancelAll}>
                    {LL.common.cancelAll()}
                  </Button>
                )}
                <Button size="xs" onClick={done}>
                  {LL.common.done()}
                </Button>
              </Group>
            </Group>
          </Stack>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  )
}
