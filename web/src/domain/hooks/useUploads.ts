import { useRef, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import {
  createFolderPath,
  type Picked,
  type Upload,
  UploadStatusMap,
  uploadFile,
} from '@domain'

const CONCURRENCY = 2

let seq = 0
const nextId = () => `up_${Date.now()}_${seq++}`

const ACTIVE: Upload['status'][] = [
  UploadStatusMap.waiting,
  UploadStatusMap.uploading,
]

const baseName = (path: string) => path.slice(path.lastIndexOf('/') + 1)
const parentOf = (path: string) =>
  path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : ''
const joinRel = (rel: string, name: string) => (rel ? `${rel}/${name}` : name)

export function useUploads(root: string, path: string) {
  const qc = useQueryClient()
  const [items, setItems] = useState<Upload[]>([])
  const ref = useRef<Upload[]>([])
  const controllers = useRef(new Map<string, AbortController>())

  function commit() {
    setItems([...ref.current])
  }

  function patch(id: string, next: Partial<Upload>) {
    ref.current = ref.current.map((it) =>
      it.id === id ? { ...it, ...next } : it,
    )
    commit()
  }

  function run(item: Upload) {
    const ctrl = new AbortController()
    controllers.current.set(item.id, ctrl)

    const started = item.file
      ? uploadFile(
          { root, dir: path, rel: item.rel, name: item.name, file: item.file },
          {
            signal: ctrl.signal,
            onProgress: (loaded) => patch(item.id, { loaded }),
          },
        )
      : createFolderPath(
          { root, dir: path, rel: joinRel(item.rel, item.name) },
          ctrl.signal,
        )

    started
      .then(() => {
        patch(item.id, { status: UploadStatusMap.done, loaded: item.size })
        qc.invalidateQueries({ queryKey: ['list', root] })
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) {
          patch(item.id, { status: UploadStatusMap.canceled })
        } else {
          const fallback = item.file
            ? 'upload failed'
            : 'could not create folder'
          const message = err instanceof Error ? err.message : fallback
          patch(item.id, { status: UploadStatusMap.error, error: message })
        }
      })
      .finally(() => {
        controllers.current.delete(item.id)
        pump()
      })
  }

  function pump() {
    let active = ref.current.filter(
      (it) => it.status === UploadStatusMap.uploading,
    ).length
    const starts: Upload[] = []
    ref.current = ref.current.map((it) => {
      if (it.status === UploadStatusMap.waiting && active < CONCURRENCY) {
        active++
        starts.push(it)
        return { ...it, status: UploadStatusMap.uploading }
      }
      return it
    })
    if (starts.length === 0) return
    commit()
    for (const it of starts) run(it)
  }

  function add({ files, dirs }: Picked) {
    const queued: Upload[] = [
      ...files.map(({ file, rel }) => ({
        id: nextId(),
        file,
        isDir: false,
        name: file.name,
        rel,
        size: file.size,
        loaded: 0,
        status: UploadStatusMap.waiting,
      })),
      ...dirs.map((full) => ({
        id: nextId(),
        isDir: true,
        name: baseName(full),
        rel: parentOf(full),
        size: 0,
        loaded: 0,
        status: UploadStatusMap.waiting,
      })),
    ]
    ref.current = [...ref.current, ...queued]
    commit()
    pump()
  }

  function cancel(id: string) {
    const ctrl = controllers.current.get(id)
    if (ctrl) {
      ctrl.abort()
      return
    }
    patch(id, { status: UploadStatusMap.canceled })
  }

  function cancelAll() {
    for (const it of ref.current) {
      if (ACTIVE.includes(it.status)) cancel(it.id)
    }
  }

  function clear() {
    cancelAll()
    ref.current = []
    commit()
  }

  return {
    items,
    add,
    cancel,
    cancelAll,
    clear,
  }
}
