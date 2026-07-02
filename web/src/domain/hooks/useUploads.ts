import { useRef, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { type Upload, uploadFile } from '@domain'

/** How many files stream to the backend at once; the rest wait in the queue. */
const CONCURRENCY = 2

let seq = 0
const nextId = () => `up_${Date.now()}_${seq++}`

const ACTIVE: Upload['status'][] = ['waiting', 'uploading']

/** Client-side upload queue for a single destination directory. Holds the File
 *  objects, drives a bounded number of concurrent uploads, tracks per-file
 *  progress, and refreshes the directory listing as each file lands. */
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

    uploadFile(
      { root, dir: path, name: item.name, file: item.file },
      {
        signal: ctrl.signal,
        onProgress: (loaded) => patch(item.id, { loaded }),
      },
    )
      .then(() => {
        patch(item.id, { status: 'done', loaded: item.size })
        qc.invalidateQueries({ queryKey: ['list', root, path] })
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) {
          patch(item.id, { status: 'canceled' })
        } else {
          const message = err instanceof Error ? err.message : 'upload failed'
          patch(item.id, { status: 'error', error: message })
        }
      })
      .finally(() => {
        controllers.current.delete(item.id)
        pump()
      })
  }

  function pump() {
    let active = ref.current.filter((it) => it.status === 'uploading').length
    const starts: Upload[] = []
    ref.current = ref.current.map((it) => {
      if (it.status === 'waiting' && active < CONCURRENCY) {
        active++
        starts.push(it)
        return { ...it, status: 'uploading' }
      }
      return it
    })
    if (starts.length === 0) return
    commit()
    for (const it of starts) run(it)
  }

  function add(files: File[]) {
    const queued: Upload[] = files.map((file) => ({
      id: nextId(),
      file,
      name: file.name,
      size: file.size,
      loaded: 0,
      status: 'waiting',
    }))
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
    patch(id, { status: 'canceled' })
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

  return { items, add, cancel, cancelAll, clear }
}
