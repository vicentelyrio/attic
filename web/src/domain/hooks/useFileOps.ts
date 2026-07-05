import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  createFile,
  createFolder,
  type Entry,
  paste,
  trashEntries,
} from '@domain'

export function useFileOps(root: string, path: string) {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: ['list', root, path] })

  const rel = (name: string) => (path ? `${path}/${name}` : name)

  const mkdir = useMutation({
    mutationFn: (name: string) => createFolder({ root, dir: path, name }),
    onSuccess: refresh,
  })

  const touch = useMutation({
    mutationFn: (name: string) => createFile({ root, dir: path, name }),
    onSuccess: refresh,
  })

  const duplicate = useMutation({
    mutationFn: async (entries: Entry[]) => {
      for (const entry of entries) {
        await paste({
          op: 'copy',
          src_root: root,
          src_path: rel(entry.name),
          dst_root: root,
          dst_dir: path,
        })
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })

  const remove = useMutation({
    mutationFn: (entries: Entry[]) =>
      trashEntries(
        root,
        entries.map((e) => rel(e.name)),
      ),
    onSuccess: refresh,
  })

  return { mkdir, touch, duplicate, remove }
}
