import { size } from '@infrastructure'

import { ActionIcon, Button, Group, Modal, Stack, Text } from '@mantine/core'

import { MinusIcon } from '@phosphor-icons/react'

import type { UploadsState } from '../helpers'
import { UploadDropzone } from '../upload-dropzone'
import { UploadQueue } from '../upload-queue'
import classes from './upload-modal.module.css'

export function UploadModal({ state }: { state: UploadsState }) {
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
    onInputChange,
    openPicker,
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
            Upload to <span className={classes.location}>{location}</span>
          </Modal.Title>
          <Group gap={4} wrap="nowrap">
            <ActionIcon
              variant="subtle"
              color="gray"
              className={classes.iconBtn}
              onClick={minimize}
              aria-label="Minimize"
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
                    Total{' '}
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
                    Cancel all
                  </Button>
                )}
                <Button size="xs" onClick={done}>
                  Done
                </Button>
              </Group>
            </Group>
          </Stack>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  )
}
